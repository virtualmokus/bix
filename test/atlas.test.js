import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph, pickExchange } from '../collect/atlas.js';
import { buildHomeView, rankByMembers, cohortsFor, makeNameLookup, hasLocalData } from '../assets/atlas.js';

// ---- gyűjtő ----

test('a gráf csomópontonként egyedi ASN-eket gyűjt', () => {
  const { members } = buildGraph([
    { asn: 1, ix_id: 55, created: '2010-01-01T00:00:00Z' },
    { asn: 2, ix_id: 55, created: '2012-01-01T00:00:00Z' },
    { asn: 1, ix_id: 55, created: '2011-01-01T00:00:00Z' }, // második port
    { asn: 1, ix_id: 31, created: '2015-01-01T00:00:00Z' },
  ]);
  assert.deepEqual(members[55], [1, 2]);
  assert.deepEqual(members[31], [1]);
});

test('az évjárat a legkorábbi rekordot veszi tagonként', () => {
  const { cohorts } = buildGraph([
    { asn: 1, ix_id: 55, created: '2012-01-01T00:00:00Z' },
    { asn: 1, ix_id: 55, created: '2010-01-01T00:00:00Z' },
    { asn: 2, ix_id: 55, created: '2010-06-01T00:00:00Z' },
  ]);
  // Mindkét hálózat 2010-ben jelent meg először ezen a csomóponton.
  assert.deepEqual(cohorts[55], { 2010: 2 });
});

test('dátum nélküli rekord nem kerül az évjáratokba', () => {
  const { cohorts, members } = buildGraph([{ asn: 1, ix_id: 55, created: null }]);
  assert.deepEqual(members[55], [1]);
  assert.equal(cohorts[55], undefined);
});

test('a csomópont-metaadatból nem kerül be kapcsolattartó', () => {
  const picked = pickExchange(
    {
      id: 55, name: 'BIX', city: 'Budapest', country: 'HU', net_count: 103,
      website: 'https://bix.hu/en', tech_email: 'x@example.com', sales_phone: '+36',
    },
    new Map([[55, { lat: 47.517963, lng: 19.055712 }]])
  );
  assert.equal(picked.tech_email, undefined);
  assert.equal(picked.sales_phone, undefined);
  assert.equal(picked.lat, 47.518, 'a koordináta három tizedesre kerekít');
});

// ---- nézőpont ----

const atlas = {
  home_ix_id: 55,
  exchanges: [
    { id: 55, name: 'BIX', city: 'Budapest', net_count: 103, lat: 47.5, lng: 19 },
    { id: 31, name: 'DE-CIX Frankfurt', city: 'Frankfurt', net_count: 1018, lat: 50.1, lng: 8.6 },
    { id: 26, name: 'AMS-IX', city: 'Amsterdam', net_count: 861, lat: 52.3, lng: 4.9 },
  ],
  members: { 55: [1, 2, 3], 31: [2, 3, 9], 26: [9] },
  cohorts: { 55: { 2010: 2, 2013: 1 } },
};

test('alapból a hazai csomópont a nézőpont', () => {
  const view = buildHomeView(atlas, null);
  assert.equal(view.home_ix_id, 55);
  assert.equal(view.exchanges.find((e) => e.id === 31).shared, 2, 'AS2 és AS3 közös');
  assert.equal(view.exchanges.find((e) => e.id === 26).shared, 0);
});

test('bármelyik csomópont lehet a nézőpont', () => {
  const view = buildHomeView(atlas, 31);
  assert.equal(view.home_ix_id, 31);
  // Frankfurt szemszögéből az AMS-IX-szel AS9 a közös.
  assert.equal(view.exchanges.find((e) => e.id === 26).shared, 1);
  assert.equal(view.exchanges.find((e) => e.id === 55).shared, 2);
});

test('a saját csomópont a teljes tagságát kapja', () => {
  const view = buildHomeView(atlas, 31);
  assert.equal(view.exchanges.find((e) => e.id === 31).shared, 3);
});

test('ismeretlen nézőpont az alapértelmezésre esik vissza', () => {
  assert.equal(buildHomeView(atlas, 99999).home_ix_id, 55);
  assert.equal(buildHomeView(atlas, 'nonsense').home_ix_id, 55);
});

test('üres atlaszra null, nem hiba', () => {
  assert.equal(buildHomeView(null, 55), null);
  assert.equal(buildHomeView({ exchanges: [] }, 55), null);
});

test('a rangsor tagszám szerint megy', () => {
  assert.equal(rankByMembers(atlas.exchanges, 31), 1);
  assert.equal(rankByMembers(atlas.exchanges, 55), 3);
  assert.equal(rankByMembers(atlas.exchanges, 99999), null);
});

test('az évjáratok kitöltik a közbenső éveket', () => {
  assert.deepEqual(cohortsFor(atlas, 55), [
    { label: '2010', count: 2, mbps: 0 },
    { label: '2011', count: 0, mbps: 0 },
    { label: '2012', count: 0, mbps: 0 },
    { label: '2013', count: 1, mbps: 0 },
  ]);
  assert.deepEqual(cohortsFor(atlas, 26), []);
});

test('a névfeloldó a helyi adatot részesíti előnyben', () => {
  const lookup = makeNameLookup(
    [{ asn: 1, name: 'Helyi név' }],
    { networks: { 1: ['Atlasz név', 'Content'], 9: ['Delta', 'NSP'] } }
  );
  assert.equal(lookup(1), 'Helyi név');
  assert.equal(lookup(9), 'Delta');
  assert.equal(lookup(404), 'AS404');
});

test('helyi forgalmi adat csak az alapértelmezett nézőponthoz van', () => {
  assert.equal(hasLocalData(55, 55), true);
  assert.equal(hasLocalData(31, 55), false);
  assert.equal(hasLocalData('55', 55), true);
});
