import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { recordSuccess, recordError } from '../collect/meta.js';

async function read(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('sikert rögzít nem létező fájlba', async () => {
  const path = join(await mkdtemp(join(tmpdir(), 'bix-')), 'meta.json');

  await recordSuccess(path, 'traffic', '2026-08-21T21:45:00Z');

  assert.deepEqual(await read(path), {
    traffic: { last_success: '2026-08-21T21:45:00Z', last_error: null },
  });
});

test('a siker törli a korábbi hibát', async () => {
  const path = join(await mkdtemp(join(tmpdir(), 'bix-')), 'meta.json');

  await recordError(path, 'traffic', '2026-08-21T21:30:00Z', 'HTTP 500');
  await recordSuccess(path, 'traffic', '2026-08-21T21:45:00Z');

  assert.equal((await read(path)).traffic.last_error, null);
});

test('a hiba megőrzi a korábbi sikert', async () => {
  const path = join(await mkdtemp(join(tmpdir(), 'bix-')), 'meta.json');

  await recordSuccess(path, 'traffic', '2026-08-21T21:45:00Z');
  await recordError(path, 'traffic', '2026-08-21T22:00:00Z', 'HTTP 500');

  const meta = await read(path);
  assert.equal(meta.traffic.last_success, '2026-08-21T21:45:00Z');
  assert.deepEqual(meta.traffic.last_error, {
    at: '2026-08-21T22:00:00Z',
    message: 'HTTP 500',
  });
});

test('a források nem írják felül egymást', async () => {
  const path = join(await mkdtemp(join(tmpdir(), 'bix-')), 'meta.json');

  await recordSuccess(path, 'traffic', '2026-08-21T21:45:00Z');
  await recordError(path, 'peeringdb', '2026-08-21T03:00:00Z', '429 rate limited');

  const meta = await read(path);
  assert.equal(meta.traffic.last_success, '2026-08-21T21:45:00Z');
  assert.equal(meta.peeringdb.last_error.message, '429 rate limited');
});
