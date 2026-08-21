import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, bucketByYear } from '../assets/views/growth.js';

const members = [
  { asn: 1, name: 'A', policy: 'Open/Free', first_seen: '2010-07-29T00:00:00Z', sources: ['peeringdb'], ports: [{ node: 'VH', bandwidth_mbps: 1000 }] },
  { asn: 2, name: 'B', policy: 'Open/Free', first_seen: '2010-11-01T00:00:00Z', sources: ['peeringdb'], ports: [{ node: 'VH', bandwidth_mbps: 10000 }] },
  { asn: 3, name: 'C', policy: 'Selective', first_seen: '2017-02-10T00:00:00Z', sources: ['peeringdb'], ports: [{ node: 'Digital Realty (InterXion VIE1)', bandwidth_mbps: 100000 }] },
  { asn: 4, name: 'D', policy: 'Open/Free', first_seen: null, sources: ['bix'], ports: [{ node: 'VH', bandwidth_mbps: 1000 }] },
];

const data = { members, ports: members.flatMap((m) => m.ports), traffic: [], meta: {} };

test('évek szerint csoportosít, a köztes éveket nullával kitöltve', () => {
  assert.deepEqual(bucketByYear(members), [
    { label: '2010', value: 2 },
    { label: '2011', value: 0 },
    { label: '2012', value: 0 },
    { label: '2013', value: 0 },
    { label: '2014', value: 0 },
    { label: '2015', value: 0 },
    { label: '2016', value: 0 },
    { label: '2017', value: 1 },
  ]);
});

test('a first_seen nélküli tagot kihagyja', () => {
  assert.equal(bucketByYear(members).reduce((sum, b) => sum + b.value, 0), 3);
});

test('üres bemenetre üres tömb', () => {
  assert.deepEqual(bucketByYear([]), []);
});

test('a felirat NEM nevezi csatlakozásnak a PeeringDB dátumot', () => {
  const html = render(data);
  assert.ok(html.includes('PeeringDB-ben megjelent'));
  assert.ok(!/\bcsatlakozott\b/.test(html), 'a created mezőt tilos csatlakozásként feliratozni');
});

test('kiírja a bécsi node figyelmeztetést', () => {
  assert.ok(render(data).includes('Bécsben'));
});

test('nincs benne emoji', () => {
  assert.ok(!/\p{Extended_Pictographic}/u.test(render(data)));
});
