import { pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ValidationError } from './validate.js';
import { recordSuccess, recordError } from './meta.js';
import { fetchJson } from './fetch.js';

const API = 'https://www.peeringdb.com/api';
export const BIX_IX_ID = 55;
const CHUNK = 150;
const MIN_EXCHANGES = 100;

function chunks(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Tagsági rekordokból IX-enkénti összesítés: hány BIX-tag van ott jelen. */
export function aggregateMemberships(rows) {
  const byIx = new Map();
  for (const row of rows) {
    let entry = byIx.get(row.ix_id);
    if (!entry) {
      entry = { ix_id: row.ix_id, asns: new Set() };
      byIx.set(row.ix_id, entry);
    }
    entry.asns.add(row.asn);
  }
  return [...byIx.values()].map((e) => ({ ix_id: e.ix_id, shared: e.asns.size }));
}

/** Összefűzi az aggregátumot a metaadattal és a koordinátával. */
export function buildExchanges(aggregated, ixMeta, coords) {
  const meta = new Map(ixMeta.map((x) => [x.id, x]));
  const geo = new Map(coords.map((c) => [c.ix_id, c]));

  return aggregated
    .map(({ ix_id, shared }) => {
      const m = meta.get(ix_id);
      if (!m) return null;
      const g = geo.get(ix_id);
      return {
        id: ix_id,
        name: m.name,
        city: m.city || null,
        country: m.country || null,
        net_count: m.net_count ?? null,
        lat: g?.lat ?? null,
        lng: g?.lng ?? null,
        shared,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.shared - a.shared || b.net_count - a.net_count);
}

export async function collectGlobal({
  fetch = fetchJson,
  now = () => new Date(),
  dataDir = 'data',
  pauseMs = 300,
} = {}) {
  const ts = now().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const metaPath = join(dataDir, 'meta.json');

  try {
    const { members } = JSON.parse(await readFile(join(dataDir, 'members.json'), 'utf8'));
    const asns = members.map((m) => m.asn);
    if (asns.length === 0) {
      throw new ValidationError('A members.json üres — előbb a merge-nek kell lefutnia.');
    }

    // 1. A BIX-tagok összes IXP-tagsága világszerte.
    const memberships = [];
    for (const part of chunks(asns, CHUNK)) {
      const j = await fetch(`${API}/netixlan?asn__in=${part.join(',')}&fields=asn,ix_id`);
      memberships.push(...(j.data ?? []));
      await wait(pauseMs);
    }
    const aggregated = aggregateMemberships(memberships);
    if (aggregated.length < MIN_EXCHANGES) {
      throw new ValidationError(
        `Gyanúsan kevés IXP: ${aggregated.length} (legalább ${MIN_EXCHANGES} várt)`
      );
    }

    // 2. IX metaadat: név, város, ország, tagszám.
    const ixIds = aggregated.map((e) => e.ix_id);
    const ixMeta = [];
    for (const part of chunks(ixIds, CHUNK)) {
      const j = await fetch(
        `${API}/ix?id__in=${part.join(',')}&fields=id,name,city,country,net_count`
      );
      ixMeta.push(...(j.data ?? []));
      await wait(pauseMs);
    }

    // 3. Koordináta: IX → első létesítmény → szélesség/hosszúság.
    const firstFac = new Map();
    for (const part of chunks(ixIds, CHUNK)) {
      const j = await fetch(`${API}/ixfac?ix_id__in=${part.join(',')}&fields=ix_id,fac_id`);
      for (const row of j.data ?? []) {
        if (!firstFac.has(row.ix_id)) firstFac.set(row.ix_id, row.fac_id);
      }
      await wait(pauseMs);
    }
    const facIds = [...new Set(firstFac.values())];
    const facGeo = new Map();
    for (const part of chunks(facIds, CHUNK)) {
      const j = await fetch(`${API}/fac?id__in=${part.join(',')}&fields=id,latitude,longitude`);
      for (const f of j.data ?? []) facGeo.set(f.id, f);
      await wait(pauseMs);
    }
    const coords = [...firstFac.entries()]
      .map(([ix_id, fac_id]) => {
        const f = facGeo.get(fac_id);
        return f && f.latitude != null
          ? { ix_id, lat: f.latitude, lng: f.longitude }
          : null;
      })
      .filter(Boolean);

    const exchanges = buildExchanges(aggregated, ixMeta, coords);
    await writeFile(
      join(dataDir, 'global.json'),
      `${JSON.stringify({ fetched_at: ts, home_ix_id: BIX_IX_ID, exchanges }, null, 2)}\n`,
      'utf8'
    );
    await recordSuccess(metaPath, 'global', ts);
    return { ts, exchanges };
  } catch (err) {
    await recordError(metaPath, 'global', ts, err.message);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { exchanges } = await collectGlobal();
    const withGeo = exchanges.filter((e) => e.lat != null).length;
    console.log(`OK — ${exchanges.length} IXP, ebből ${withGeo} koordinátával`);
  } catch (err) {
    console.error(`HIBA: ${err.message}`);
    process.exit(1);
  }
}
