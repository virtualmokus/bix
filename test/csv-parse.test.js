import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTrafficCsv } from '../assets/csv-parse.js';

const HEADER = 'ts,networks,ports,peak_gbps,current_gbps,capacity_gbps';

test('üres fájlra üres tömböt ad', () => {
  assert.deepEqual(parseTrafficCsv(''), []);
});

test('csak fejlécre üres tömböt ad', () => {
  assert.deepEqual(parseTrafficCsv(`${HEADER}\n`), []);
});

test('egy sort objektummá alakít, számokkal', () => {
  const rows = parseTrafficCsv(`${HEADER}\n2026-08-21T09:31:30Z,141,188,1116.82,718.5,8358\n`);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    ts: '2026-08-21T09:31:30Z',
    networks: 141,
    ports: 188,
    peak_gbps: 1116.82,
    current_gbps: 718.5,
    capacity_gbps: 8358,
  });
});

test('CRLF sorvégeket is kezel', () => {
  const rows = parseTrafficCsv(`${HEADER}\r\n2026-08-21T09:31:30Z,141,188,1116.82,718.5,8358\r\n`);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].current_gbps, 718.5);
});

test('a hibás oszlopszámú sort kihagyja, nem dob', () => {
  const rows = parseTrafficCsv(
    `${HEADER}\nrossz,sor\n2026-08-21T09:31:30Z,141,188,1116.82,718.5,8358\n`
  );
  assert.equal(rows.length, 1);
});

test('időrendben adja vissza a sorokat', () => {
  const rows = parseTrafficCsv(
    `${HEADER}\n` +
      '2026-08-21T10:00:00Z,141,188,1116.82,700,8358\n' +
      '2026-08-21T09:00:00Z,141,188,1116.82,650,8358\n'
  );
  assert.deepEqual(
    rows.map((r) => r.current_gbps),
    [650, 700]
  );
});
