import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ValidationError } from './validate.js';
import { recordSuccess, recordError } from './meta.js';
import { fetchJson } from './fetch.js';

const API = 'https://www.peeringdb.com/api';
export const HOME_IX_ID = 55; // BIX — az alapértelmezett nézőpont
const CHUNK = 150;
const MIN_EXCHANGES = 800;
const MIN_MEMBERSHIPS = 30000;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function chunks(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

const round = (n) => Math.round(n * 1000) / 1000;

/**
 * Tagsági rekordokból csomópontonkénti ASN-lista és a legkorábbi rekord-dátum.
 * Ez a gráf teszi lehetővé, hogy BÁRMELYIK csomópont legyen a nézőpont: az
 * átfedést a böngésző számolja ki belőle, nem a gyűjtő rögzíti egyetlen
 * kiindulóponthoz.
 */
export function buildGraph(rows) {
  const byIx = new Map();
  const firstSeen = new Map();

  for (const row of rows) {
    if (!byIx.has(row.ix_id)) byIx.set(row.ix_id, new Set());
    byIx.get(row.ix_id).add(row.asn);

    if (row.created) {
      const key = `${row.ix_id}:${row.asn}`;
      const year = Number(row.created.slice(0, 4));
      if (!firstSeen.has(key) || year < firstSeen.get(key)) firstSeen.set(key, year);
    }
  }

  const members = {};
  for (const [ixId, asns] of byIx) members[ixId] = [...asns].sort((a, b) => a - b);

  // Évjáratok csomópontonként: hány hálózat rekordja jelent meg abban az évben.
  const cohorts = {};
  for (const [key, year] of firstSeen) {
    const ixId = key.split(':')[0];
    cohorts[ixId] ??= {};
    cohorts[ixId][year] = (cohorts[ixId][year] ?? 0) + 1;
  }

  return { members, cohorts };
}

/** Csomópont-metaadat a megjelenítéshez. Kapcsolattartói mező nem kerül bele. */
export function pickExchange(record, coords) {
  const geo = coords.get(record.id);
  return {
    id: record.id,
    name: record.name,
    name_long: record.name_long || null,
    city: record.city || null,
    country: record.country || null,
    region: record.region_continent || null,
    net_count: record.net_count ?? null,
    website: record.website || null,
    url_stats: record.url_stats || null,
    lat: geo ? round(geo.lat) : null,
    lng: geo ? round(geo.lng) : null,
  };
}

export async function collectAtlas({
  fetch = fetchJson,
  now = () => new Date(),
  dataDir = 'data',
  pauseMs = 300,
} = {}) {
  const ts = now().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const metaPath = join(dataDir, 'meta.json');

  try {
    // 1. Minden csomópont metaadata — egyetlen kérés.
    const ixResponse = await fetch(
      `${API}/ix?fields=id,name,name_long,city,country,region_continent,` +
        `net_count,website,url_stats`
    );
    const ixRecords = ixResponse?.data ?? [];
    if (ixRecords.length < MIN_EXCHANGES) {
      throw new ValidationError(
        `Gyanúsan kevés csomópont: ${ixRecords.length} (legalább ${MIN_EXCHANGES} várt)`
      );
    }

    // 2. A teljes tagsági gráf — szintén egyetlen kérés.
    const nxResponse = await fetch(`${API}/netixlan?fields=asn,ix_id,created`);
    const memberships = nxResponse?.data ?? [];
    if (memberships.length < MIN_MEMBERSHIPS) {
      throw new ValidationError(
        `Gyanúsan kevés tagsági rekord: ${memberships.length} (legalább ${MIN_MEMBERSHIPS} várt)`
      );
    }
    const graph = buildGraph(memberships);

    // 3. Koordináta: csomópont → első létesítmény → szélesség/hosszúság.
    const ixIds = ixRecords.map((x) => x.id);
    const firstFac = new Map();
    for (const part of chunks(ixIds, CHUNK)) {
      const j = await fetch(`${API}/ixfac?ix_id__in=${part.join(',')}&fields=ix_id,fac_id`);
      for (const row of j.data ?? []) {
        if (!firstFac.has(row.ix_id)) firstFac.set(row.ix_id, row.fac_id);
      }
      await wait(pauseMs);
    }

    const facGeo = new Map();
    for (const part of chunks([...new Set(firstFac.values())], CHUNK)) {
      const j = await fetch(`${API}/fac?id__in=${part.join(',')}&fields=id,latitude,longitude`);
      for (const f of j.data ?? []) facGeo.set(f.id, f);
      await wait(pauseMs);
    }

    const coords = new Map();
    for (const [ixId, facId] of firstFac) {
      const f = facGeo.get(facId);
      if (f && f.latitude != null) coords.set(ixId, { lat: f.latitude, lng: f.longitude });
    }

    const exchanges = ixRecords
      .map((r) => pickExchange(r, coords))
      .sort((a, b) => (b.net_count ?? 0) - (a.net_count ?? 0));

    await writeFile(
      join(dataDir, 'atlas.json'),
      `${JSON.stringify({
        fetched_at: ts,
        home_ix_id: HOME_IX_ID,
        exchanges,
        members: graph.members,
        cohorts: graph.cohorts,
      })}\n`,
      'utf8'
    );

    // 4. Hálózatnevek külön fájlban: csak akkor kell, ha valaki tagsort néz.
    const netResponse = await fetch(`${API}/net?fields=asn,name,info_type`);
    const present = new Set(memberships.map((m) => m.asn));
    const networks = {};
    for (const n of netResponse?.data ?? []) {
      if (present.has(n.asn)) networks[n.asn] = [n.name ?? `AS${n.asn}`, n.info_type || null];
    }
    await writeFile(
      join(dataDir, 'atlas-networks.json'),
      `${JSON.stringify({ fetched_at: ts, networks })}\n`,
      'utf8'
    );

    await recordSuccess(metaPath, 'atlas', ts);
    return { ts, exchanges, memberships: memberships.length, networks: Object.keys(networks).length };
  } catch (err) {
    await recordError(metaPath, 'atlas', ts, err.message);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { exchanges, memberships, networks } = await collectAtlas();
    const withGeo = exchanges.filter((e) => e.lat != null).length;
    console.log(
      `OK — ${exchanges.length} csomópont (${withGeo} koordinátával), ` +
        `${memberships.toLocaleString('en-GB')} tagság, ${networks.toLocaleString('en-GB')} hálózat`
    );
  } catch (err) {
    console.error(`HIBA: ${err.message}`);
    process.exit(1);
  }
}
