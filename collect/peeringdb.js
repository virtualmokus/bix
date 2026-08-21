import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ValidationError } from './validate.js';
import { recordSuccess, recordError } from './meta.js';
import { fetchJson } from './fetch.js';

export const SOURCE_URL = 'https://www.peeringdb.com/api/netixlan?ix_id=55';
const MIN_RECORDS = 50;

// Szándékosan NEM tartjuk meg a `speed` mezőt: ütközés esetén a bix.hu
// az elsődleges forrás, a PeeringDB önbevallásos (lásd spec 3.3).
function pick(record) {
  return {
    asn: record.asn,
    ipaddr6: record.ipaddr6 ?? null,
    is_rs_peer: Boolean(record.is_rs_peer),
    created: record.created ?? null,
  };
}

export async function collectPeeringdb({
  fetch = fetchJson,
  now = () => new Date(),
  dataDir = 'data',
} = {}) {
  const ts = now().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const metaPath = join(dataDir, 'meta.json');

  try {
    const payload = await fetch(SOURCE_URL);
    const raw = Array.isArray(payload?.data) ? payload.data : [];
    if (raw.length < MIN_RECORDS) {
      throw new ValidationError(
        `Gyanúsan kevés PeeringDB rekord: ${raw.length} (legalább ${MIN_RECORDS} várt)`
      );
    }
    const records = raw.map(pick);
    await writeFile(
      join(dataDir, 'peeringdb.json'),
      `${JSON.stringify({ fetched_at: ts, records }, null, 2)}\n`,
      'utf8'
    );
    await recordSuccess(metaPath, 'peeringdb', ts);
    return { ts, records };
  } catch (err) {
    await recordError(metaPath, 'peeringdb', ts, err.message);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { records } = await collectPeeringdb();
    console.log(`OK — ${records.length} PeeringDB rekord`);
  } catch (err) {
    console.error(`HIBA: ${err.message}`);
    process.exit(1);
  }
}
