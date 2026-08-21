import { pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ValidationError } from './validate.js';
import { recordSuccess, recordError } from './meta.js';
import { fetchJson } from './fetch.js';

export const API_BASE = 'https://www.peeringdb.com/api/net?asn__in=';
const MIN_NETWORKS = 30;

// Kizárólag szervezeti szintű mezők. A PeeringDB ad kapcsolattartói adatot is
// (poc_set), azt szándékosan nem kérjük le és nem tároljuk.
export function pickNetwork(record) {
  return {
    asn: record.asn,
    name: record.name ?? null,
    aka: record.aka || null,
    website: record.website || null,
    type: record.info_type || null,
    scope: record.info_scope || null,
    traffic: record.info_traffic || null,
    ratio: record.info_ratio || null,
    prefixes4: record.info_prefixes4 ?? null,
    prefixes6: record.info_prefixes6 ?? null,
    ix_count: record.ix_count ?? null,
    fac_count: record.fac_count ?? null,
    policy: record.policy_general || null,
  };
}

export async function collectNetworks({
  fetch = fetchJson,
  now = () => new Date(),
  dataDir = 'data',
} = {}) {
  const ts = now().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const metaPath = join(dataDir, 'meta.json');

  try {
    const { members } = JSON.parse(await readFile(join(dataDir, 'members.json'), 'utf8'));
    const asns = members.map((m) => m.asn);
    if (asns.length === 0) {
      throw new ValidationError('A members.json üres — előbb a merge-nek kell lefutnia.');
    }

    const payload = await fetch(API_BASE + asns.join(','));
    const raw = Array.isArray(payload?.data) ? payload.data : [];
    if (raw.length < MIN_NETWORKS) {
      throw new ValidationError(
        `Gyanúsan kevés hálózati rekord: ${raw.length} (legalább ${MIN_NETWORKS} várt)`
      );
    }

    const networks = raw.map(pickNetwork).sort((a, b) => a.asn - b.asn);
    await writeFile(
      join(dataDir, 'networks.json'),
      `${JSON.stringify({ fetched_at: ts, networks }, null, 2)}\n`,
      'utf8'
    );
    await recordSuccess(metaPath, 'networks', ts);
    return { ts, networks };
  } catch (err) {
    await recordError(metaPath, 'networks', ts, err.message);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { networks } = await collectNetworks();
    console.log(`OK — ${networks.length} hálózati profil`);
  } catch (err) {
    console.error(`HIBA: ${err.message}`);
    process.exit(1);
  }
}
