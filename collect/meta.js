import { readFile, writeFile } from 'node:fs/promises';

async function load(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return {};
  }
}

async function save(path, meta) {
  await writeFile(path, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

export async function recordSuccess(path, source, ts) {
  const meta = await load(path);
  meta[source] = { last_success: ts, last_error: null };
  await save(path, meta);
}

export async function recordError(path, source, ts, message) {
  const meta = await load(path);
  const previous = meta[source] ?? { last_success: null };
  meta[source] = {
    last_success: previous.last_success,
    last_error: { at: ts, message },
  };
  await save(path, meta);
}
