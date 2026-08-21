import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { parseTraffic } from './parse-traffic.js';
import { validateTraffic } from './validate.js';
import { appendTrafficRow } from './csv.js';
import { recordSuccess, recordError } from './meta.js';
import { fetchText } from './fetch.js';

export const SOURCE_URL = 'https://www.bix.hu/';

export async function collectTraffic({
  fetch = fetchText,
  now = () => new Date(),
  dataDir = 'data',
} = {}) {
  const ts = now().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const metaPath = join(dataDir, 'meta.json');

  try {
    const html = await fetch(SOURCE_URL);
    const traffic = validateTraffic(parseTraffic(html));
    await appendTrafficRow(join(dataDir, 'traffic.csv'), ts, traffic);
    await recordSuccess(metaPath, 'traffic', ts);
    return { ts, traffic };
  } catch (err) {
    await recordError(metaPath, 'traffic', ts, err.message);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { ts, traffic } = await collectTraffic();
    console.log(`OK ${ts} — ${traffic.current_gbps} Gb/s, ${traffic.ports} port`);
  } catch (err) {
    console.error(`HIBA: ${err.message}`);
    process.exit(1);
  }
}
