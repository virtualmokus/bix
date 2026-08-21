import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parsePorts } from './parse-ports.js';
import { ValidationError } from './validate.js';
import { recordSuccess, recordError } from './meta.js';
import { fetchText } from './fetch.js';

export const SOURCE_URL = 'https://www.bix.hu/statisztika';
const MIN_PORTS = 50;

export async function collectPorts({
  fetch = fetchText,
  now = () => new Date(),
  dataDir = 'data',
} = {}) {
  const ts = now().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const metaPath = join(dataDir, 'meta.json');

  try {
    const ports = parsePorts(await fetch(SOURCE_URL));
    if (ports.length < MIN_PORTS) {
      throw new ValidationError(
        `Gyanúsan kevés port: ${ports.length} (legalább ${MIN_PORTS} várt) — féloldalas letöltés?`
      );
    }
    await writeFile(
      join(dataDir, 'ports.json'),
      `${JSON.stringify({ fetched_at: ts, ports }, null, 2)}\n`,
      'utf8'
    );
    await recordSuccess(metaPath, 'ports', ts);
    return { ts, ports };
  } catch (err) {
    await recordError(metaPath, 'ports', ts, err.message);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { ports } = await collectPorts();
    console.log(`OK — ${ports.length} port`);
  } catch (err) {
    console.error(`HIBA: ${err.message}`);
    process.exit(1);
  }
}
