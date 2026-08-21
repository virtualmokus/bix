import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectTraffic } from '../collect/traffic.js';

const html = await readFile('test/fixtures/traffic-minimal.html', 'utf8');
const now = () => new Date('2026-08-21T21:45:00.123Z');

test('lekér, parseol, validál és sort ír', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  const result = await collectTraffic({ fetch: async () => html, now, dataDir });

  assert.equal(result.ts, '2026-08-21T21:45:00Z');
  assert.equal(result.traffic.current_gbps, 679.68);

  const csv = await readFile(join(dataDir, 'traffic.csv'), 'utf8');
  assert.ok(csv.includes('2026-08-21T21:45:00Z,141,188,1116.82,679.68,8358'));

  const meta = JSON.parse(await readFile(join(dataDir, 'meta.json'), 'utf8'));
  assert.equal(meta.traffic.last_success, '2026-08-21T21:45:00Z');
});

test('parse-hiba esetén NEM ír CSV sort', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  await assert.rejects(
    collectTraffic({ fetch: async () => '<html>semmi</html>', now, dataDir })
  );

  await assert.rejects(readFile(join(dataDir, 'traffic.csv'), 'utf8'));
});

test('parse-hiba esetén rögzíti a hibát a meta.json-ba', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  await assert.rejects(
    collectTraffic({ fetch: async () => '<html>semmi</html>', now, dataDir })
  );

  const meta = JSON.parse(await readFile(join(dataDir, 'meta.json'), 'utf8'));
  assert.equal(meta.traffic.last_success, null);
  assert.ok(meta.traffic.last_error.message.includes('párt vártam'));
});

test('hálózati hiba esetén NEM ír CSV sort', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  await assert.rejects(
    collectTraffic({
      fetch: async () => {
        throw new Error('HTTP 503 — https://www.bix.hu/');
      },
      now,
      dataDir,
    })
  );

  await assert.rejects(readFile(join(dataDir, 'traffic.csv'), 'utf8'));
});

test('tartományon kívüli értéknél NEM ír CSV sort', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));
  const zeroed = html.replace('679.68', '0');

  await assert.rejects(collectTraffic({ fetch: async () => zeroed, now, dataDir }));

  await assert.rejects(readFile(join(dataDir, 'traffic.csv'), 'utf8'));
});
