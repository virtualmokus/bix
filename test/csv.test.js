import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CSV_HEADER, toCsvRow, appendTrafficRow } from '../collect/csv.js';

const t = {
  networks: 141,
  ports: 188,
  peak_gbps: 1116.82,
  current_gbps: 679.68,
  capacity_gbps: 8358,
};

test('a sor a fejléc oszlopsorrendjét követi', () => {
  assert.equal(
    toCsvRow('2026-08-21T21:45:00Z', t),
    '2026-08-21T21:45:00Z,141,188,1116.82,679.68,8358'
  );
});

test('új fájlba fejlécet és egy sort ír', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bix-'));
  const path = join(dir, 'traffic.csv');

  await appendTrafficRow(path, '2026-08-21T21:45:00Z', t);

  const content = await readFile(path, 'utf8');
  assert.equal(
    content,
    `${CSV_HEADER}\n2026-08-21T21:45:00Z,141,188,1116.82,679.68,8358\n`
  );
});

test('meglévő fájlhoz fűz, nem ír új fejlécet', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bix-'));
  const path = join(dir, 'traffic.csv');

  await appendTrafficRow(path, '2026-08-21T21:45:00Z', t);
  await appendTrafficRow(path, '2026-08-21T22:00:00Z', { ...t, current_gbps: 701.2 });

  const lines = (await readFile(path, 'utf8')).trim().split('\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0], CSV_HEADER);
  assert.ok(lines[2].endsWith('701.2,8358'));
});

test('nem ír duplán fejlécet, ha a fájl már létezik', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bix-'));
  const path = join(dir, 'traffic.csv');
  await writeFile(path, `${CSV_HEADER}\n`, 'utf8');

  await appendTrafficRow(path, '2026-08-21T21:45:00Z', t);

  const lines = (await readFile(path, 'utf8')).trim().split('\n');
  assert.equal(lines.length, 2);
});
