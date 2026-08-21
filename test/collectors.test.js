import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectPorts } from '../collect/ports.js';
import { collectPeeringdb } from '../collect/peeringdb.js';

const liveHtml = await readFile('test/fixtures/bix-statisztika.html', 'utf8');
const minimalHtml = await readFile('test/fixtures/ports-minimal.html', 'utf8');
const now = () => new Date('2026-08-21T03:00:00.000Z');

const pdbPayload = {
  data: [
    {
      asn: 3244,
      speed: 1000,
      ipaddr4: '193.188.137.18',
      ipaddr6: '2001:7f8:35::3:244:1',
      is_rs_peer: true,
      operational: true,
      created: '2010-07-29T00:00:00Z',
      updated: '2016-03-14T21:50:30Z',
    },
    {
      asn: 13335,
      speed: 200000,
      ipaddr4: '193.188.137.27',
      ipaddr6: '2001:7f8:35::1:3335:1',
      is_rs_peer: false,
      operational: true,
      created: '2017-02-10T15:02:18Z',
      updated: '2026-07-06T09:29:51Z',
    },
  ],
};

// A gyűjtő 50 rekord alatt hibát dob (féloldalas válasz elleni védelem),
// ezért a payloadot feltöltjük érdektelen kitöltő rekordokkal.
while (pdbPayload.data.length < 50) {
  pdbPayload.data.push({
    asn: 64500 + pdbPayload.data.length,
    speed: 10000,
    ipaddr4: null,
    ipaddr6: null,
    is_rs_peer: false,
    operational: true,
    created: '2020-01-01T00:00:00Z',
    updated: '2020-01-01T00:00:00Z',
  });
}

test('a port-gyűjtő kiírja a ports.json-t', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  const result = await collectPorts({ fetch: async () => liveHtml, now, dataDir });

  assert.ok(result.ports.length > 100);

  const file = JSON.parse(await readFile(join(dataDir, 'ports.json'), 'utf8'));
  assert.equal(file.fetched_at, '2026-08-21T03:00:00Z');
  assert.equal(file.ports.length, result.ports.length);
});

test('a port-gyűjtő elutasítja a gyanúsan rövid táblát', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  await assert.rejects(collectPorts({ fetch: async () => minimalHtml, now, dataDir }));

  await assert.rejects(readFile(join(dataDir, 'ports.json'), 'utf8'));
});

test('a PeeringDB gyűjtő csak a megengedett mezőket tartja meg', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  await collectPeeringdb({ fetch: async () => pdbPayload, now, dataDir });

  const file = JSON.parse(await readFile(join(dataDir, 'peeringdb.json'), 'utf8'));
  assert.deepEqual(file.records[0], {
    asn: 3244,
    ipaddr6: '2001:7f8:35::3:244:1',
    is_rs_peer: true,
    created: '2010-07-29T00:00:00Z',
  });
  assert.equal(file.records[0].speed, undefined, 'a speed mező nem kerülhet be');
});

test('a PeeringDB gyűjtő hibát dob üres válaszra', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  await assert.rejects(collectPeeringdb({ fetch: async () => ({ data: [] }), now, dataDir }));
});
