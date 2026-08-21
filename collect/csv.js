import { appendFile, writeFile, access } from 'node:fs/promises';

export const CSV_HEADER = 'ts,networks,ports,peak_gbps,current_gbps,capacity_gbps';

export function toCsvRow(ts, t) {
  return [ts, t.networks, t.ports, t.peak_gbps, t.current_gbps, t.capacity_gbps].join(',');
}

export async function appendTrafficRow(path, ts, t) {
  let exists = true;
  try {
    await access(path);
  } catch {
    exists = false;
  }
  if (!exists) {
    await writeFile(path, `${CSV_HEADER}\n`, 'utf8');
  }
  await appendFile(path, `${toCsvRow(ts, t)}\n`, 'utf8');
}
