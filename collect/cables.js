import { pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ValidationError } from './validate.js';
import { recordSuccess, recordError } from './meta.js';
import { fetchJson } from './fetch.js';

const API = 'https://www.submarinecablemap.com/api/v3';
export const SOURCE = 'TeleGeography Submarine Cable Map';
export const LICENSE = 'CC BY-NC-SA 3.0';
export const LICENSE_URL = 'https://creativecommons.org/licenses/by-nc-sa/3.0/';

const MIN_CABLES = 300;
// A kábel geometriájának végpontja ennyin belül számít partraszállásnak.
// A mérés szerint a valódi partraszállások mediánja 0,02 km; a nyílt tengeri
// szakaszhatárok ennél nagyságrendekkel távolabb esnek, így elkülönülnek.
const LANDING_MATCH_KM = 25;
// Ennyin belül tekintünk egy csomópontot partraszálláshoz közelinek.
const EXCHANGE_NEAR_KM = 150;
const COORD_DECIMALS = 3; // ~110 m — világtérképhez bőven elég

const EARTH_KM = 6371;
const rad = (deg) => (deg * Math.PI) / 180;

export function haversineKm(a, b) {
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/** „Sangata, Indonesia" → „Indonesia". A vessző utáni utolsó tag az ország. */
export function countryOf(landingName) {
  const parts = String(landingName).split(',');
  return parts.length > 1 ? parts[parts.length - 1].trim() : null;
}

function round(n) {
  const f = 10 ** COORD_DECIMALS;
  return Math.round(n * f) / f;
}

function nearest(point, candidates) {
  let best = null;
  for (const c of candidates) {
    const d = haversineKm(point, c.coords);
    if (!best || d < best.km) best = { km: d, item: c };
  }
  return best;
}

/**
 * A kábelekhez a geometria végpontjai alapján rendel partraszállásokat.
 * A hivatalos társítás kábelenként külön API-hívást igényelne (700+ kérés
 * naponta); a geometriai illesztés ugyanazt adja két kérésből.
 */
export function linkCablesToLandings(cableFeatures, landings) {
  const byLanding = new Map(landings.map((l) => [l.id, new Set()]));

  const cables = cableFeatures.map((feature) => {
    const { id, name, color } = feature.properties;
    const segments = feature.geometry.coordinates;
    const touched = new Set();

    for (const segment of segments) {
      if (segment.length === 0) continue;
      for (const endpoint of [segment[0], segment[segment.length - 1]]) {
        const match = nearest(endpoint, landings);
        if (match && match.km <= LANDING_MATCH_KM) {
          touched.add(match.item.id);
          byLanding.get(match.item.id).add(id);
        }
      }
    }

    const countries = [
      ...new Set(
        [...touched]
          .map((lid) => landings.find((l) => l.id === lid)?.country)
          .filter(Boolean)
      ),
    ].sort();

    return {
      id,
      name,
      color: color ?? null,
      landings: [...touched].sort(),
      countries,
      geometry: segments.map((seg) => seg.map(([lng, lat]) => [round(lng), round(lat)])),
    };
  });

  const withCables = landings.map((l) => ({
    ...l,
    cables: [...(byLanding.get(l.id) ?? [])].sort(),
  }));

  return { cables, landings: withCables };
}

/**
 * Csomópontonként a közeli partraszállások és az ott futó kábelek.
 * A `nearest_km` akkor is kitöltődik, ha messze van — ez mondja meg, hogy egy
 * szárazföldi csomópont (mint a BIX) milyen távol esik a tengertől.
 */
export function linkExchanges(exchanges, landings) {
  const out = {};

  for (const exchange of exchanges) {
    if (exchange.lat == null) continue;
    const point = [exchange.lng, exchange.lat];
    const near = [];
    let closest = null;

    for (const landing of landings) {
      const km = haversineKm(point, landing.coords);
      if (!closest || km < closest.km) closest = { km, landing };
      if (km <= EXCHANGE_NEAR_KM) near.push({ id: landing.id, km: Math.round(km) });
    }

    near.sort((a, b) => a.km - b.km);
    const cables = new Set();
    for (const n of near) {
      const landing = landings.find((l) => l.id === n.id);
      for (const c of landing?.cables ?? []) cables.add(c);
    }

    out[exchange.id] = {
      nearest_km: closest ? Math.round(closest.km) : null,
      nearest_landing: closest ? closest.landing.name : null,
      landings: near.slice(0, 12),
      cables: [...cables].sort(),
    };
  }

  return out;
}

/** A kattintáskor megjelenő adatok. Kapcsolattartót nem tárolunk. */
export function pickDetail(record) {
  return {
    length: record.length || null,
    owners: record.owners || null,
    suppliers: record.suppliers || null,
    rfs: record.rfs || null,
    is_planned: Boolean(record.is_planned),
    url: record.url || null,
  };
}

/**
 * Kábelenkénti részletek (tulajdonos, szállító, hossz, üzembe helyezés).
 * Ez kábelenként külön kérés, ezért csak azokat kérjük le, amikről még nincs
 * adatunk — az első futás után naponta jellemzően nulla vagy néhány kérés.
 */
export async function fetchMissingDetails(cables, existing, fetch, { pauseMs = 120, max = 900 } = {}) {
  const details = { ...existing };
  let fetched = 0;

  for (const cable of cables) {
    if (details[cable.id] || fetched >= max) continue;
    try {
      const record = await fetch(`${API}/cable/${encodeURIComponent(cable.id)}.json`);
      details[cable.id] = pickDetail(record ?? {});
    } catch {
      // Egyetlen kábel hiánya nem állítja meg a gyűjtést.
    }
    fetched++;
    await new Promise((r) => setTimeout(r, pauseMs));
  }

  // A már nem létező kábelek adatát nem hurcoljuk tovább.
  const live = new Set(cables.map((c) => c.id));
  for (const id of Object.keys(details)) {
    if (!live.has(id)) delete details[id];
  }

  return { details, fetched };
}

export async function collectCables({
  fetch = fetchJson,
  now = () => new Date(),
  dataDir = 'data',
} = {}) {
  const ts = now().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const metaPath = join(dataDir, 'meta.json');

  try {
    const [cableGeo, landingGeo] = await Promise.all([
      fetch(`${API}/cable/cable-geo.json`),
      fetch(`${API}/landing-point/landing-point-geo.json`),
    ]);

    const cableFeatures = cableGeo?.features ?? [];
    const landingFeatures = landingGeo?.features ?? [];
    if (cableFeatures.length < MIN_CABLES) {
      throw new ValidationError(
        `Gyanúsan kevés tengeralatti kábel: ${cableFeatures.length} (legalább ${MIN_CABLES} várt)`
      );
    }

    const landings = landingFeatures.map((f) => ({
      id: f.properties.id,
      name: f.properties.name,
      country: countryOf(f.properties.name),
      coords: f.geometry.coordinates,
    }));

    const linked = linkCablesToLandings(cableFeatures, landings);

    let exchanges = {};
    try {
      const atlas = JSON.parse(await readFile(join(dataDir, 'atlas.json'), 'utf8'));
      exchanges = linkExchanges(atlas.exchanges ?? [], linked.landings);
    } catch {
      exchanges = {}; // az atlasz még nem gyűlt össze
    }

    // A korábbi részletek újrahasznosítása, hogy ne kérjünk le mindent naponta.
    let previous = {};
    try {
      const old = JSON.parse(await readFile(join(dataDir, 'cables.json'), 'utf8'));
      previous = old.details ?? {};
    } catch {
      previous = {};
    }
    const { details, fetched } = await fetchMissingDetails(linked.cables, previous, fetch);

    const payload = {
      fetched_at: ts,
      source: SOURCE,
      license: LICENSE,
      license_url: LICENSE_URL,
      details,
      cables: linked.cables,
      landings: linked.landings.map((l) => ({
        id: l.id,
        name: l.name,
        country: l.country,
        lat: round(l.coords[1]),
        lng: round(l.coords[0]),
        cables: l.cables,
      })),
      exchanges,
    };

    await writeFile(join(dataDir, 'cables.json'), `${JSON.stringify(payload)}\n`, 'utf8');
    await recordSuccess(metaPath, 'cables', ts);
    return { ts, cables: linked.cables, landings: linked.landings, fetchedDetails: fetched };
  } catch (err) {
    await recordError(metaPath, 'cables', ts, err.message);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { cables, landings, fetchedDetails } = await collectCables();
    const linked = landings.filter((l) => l.cables.length > 0).length;
    console.log(`OK — ${cables.length} kábel, ${linked}/${landings.length} partraszállás társítva, ${fetchedDetails} új részlet`);
  } catch (err) {
    console.error(`HIBA: ${err.message}`);
    process.exit(1);
  }
}
