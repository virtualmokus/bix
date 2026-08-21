import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateMemberships, buildExchanges } from '../collect/global.js';
import { lineStyle, markerRadius } from '../assets/views/map.js';

test('az aggregálás IX-enként egyedi ASN-eket számol', () => {
  const rows = [
    { asn: 1, ix_id: 55 }, { asn: 2, ix_id: 55 },
    { asn: 1, ix_id: 55 }, // duplikált tagság (két port) nem számít kétszer
    { asn: 1, ix_id: 31 },
  ];
  const agg = aggregateMemberships(rows);
  assert.deepEqual(
    agg.sort((a, b) => a.ix_id - b.ix_id),
    [{ ix_id: 31, shared: 1, asns: [1] }, { ix_id: 55, shared: 2, asns: [1, 2] }]
  );
});

test('a buildExchanges kihagyja a metaadat nélküli IX-et, de a koordináta nélkülit megtartja', () => {
  const agg = [{ ix_id: 55, shared: 10 }, { ix_id: 31, shared: 5 }, { ix_id: 999, shared: 1 }];
  const meta = [
    { id: 55, name: 'BIX', city: 'Budapest', country: 'HU', net_count: 103 },
    { id: 31, name: 'DE-CIX Frankfurt', city: 'Frankfurt', country: 'DE', net_count: 1018 },
  ];
  const coords = [{ ix_id: 55, lat: 47.5, lng: 19.05 }];

  const out = buildExchanges(agg, meta, coords);
  assert.equal(out.length, 2);
  assert.equal(out[0].name, 'BIX');
  assert.equal(out[0].lat, 47.5);
  assert.equal(out[1].name, 'DE-CIX Frankfurt');
  assert.equal(out[1].lat, null);
});

test('megosztott tagszám szerint rendez', () => {
  const agg = [{ ix_id: 1, shared: 3 }, { ix_id: 2, shared: 9 }];
  const meta = [
    { id: 1, name: 'A', city: null, country: null, net_count: 10 },
    { id: 2, name: 'B', city: null, country: null, net_count: 10 },
  ];
  assert.deepEqual(buildExchanges(agg, meta, []).map((e) => e.name), ['B', 'A']);
});

test('a vonalstílus az átfedés erejével erősödik', () => {
  assert.equal(lineStyle(41).label, '20+');
  assert.equal(lineStyle(12).label, '10–19');
  assert.equal(lineStyle(6).label, '5–9');
  assert.equal(lineStyle(2).label, '2–4');
  assert.equal(lineStyle(1).label, '1');
  assert.ok(lineStyle(41).weight > lineStyle(1).weight);
});

test('a jelölő sugara korlátos', () => {
  assert.ok(markerRadius(1) >= 3);
  assert.ok(markerRadius(103) <= 15);
  assert.ok(markerRadius(40) > markerRadius(5));
});
