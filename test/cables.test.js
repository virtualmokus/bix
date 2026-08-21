import { test } from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm, countryOf, linkCablesToLandings, linkExchanges } from '../collect/cables.js';
import { sharedCableExchanges } from '../assets/views/map.js';

test('a haversine ismert távolságot ad', () => {
  // Budapest – Bécs légvonalban nagyjából 215 km.
  const km = haversineKm([19.04, 47.5], [16.37, 48.21]);
  assert.ok(km > 205 && km < 225, `${km} km`);
  assert.equal(haversineKm([0, 0], [0, 0]), 0);
});

test('az országot a landing név utolsó tagjából olvassa ki', () => {
  assert.equal(countryOf('Sangata, Indonesia'), 'Indonesia');
  assert.equal(countryOf('Los Angeles, CA, United States'), 'United States');
  assert.equal(countryOf('Singapore'), null);
});

const landings = [
  { id: 'a', name: 'Alpha, Cyprus', country: 'Cyprus', coords: [33.0, 34.7] },
  { id: 'b', name: 'Beta, Syria', country: 'Syria', coords: [35.9, 34.9] },
  { id: 'far', name: 'Gamma, Chile', country: 'Chile', coords: [-70.6, -33.4] },
];

const cableFeatures = [
  {
    properties: { id: 'c1', name: 'Cable One', color: '#123456' },
    geometry: { coordinates: [[[33.0, 34.7], [34.5, 34.8], [35.9, 34.9]]] },
  },
  {
    properties: { id: 'c2', name: 'Cable Two', color: null },
    geometry: { coordinates: [[[33.001, 34.701], [34.0, 34.75]]] },
  },
];

test('a kábelt a végpontjai alapján társítja partraszállásokhoz', () => {
  const { cables } = linkCablesToLandings(cableFeatures, landings);
  const c1 = cables.find((c) => c.id === 'c1');
  assert.deepEqual(c1.landings, ['a', 'b']);
  assert.deepEqual(c1.countries, ['Cyprus', 'Syria']);
});

test('a nyílt tengeri szakaszvég nem lesz partraszállás', () => {
  const { cables } = linkCablesToLandings(cableFeatures, landings);
  const c2 = cables.find((c) => c.id === 'c2');
  // Az egyik vége Alphánál van, a másik a nyílt vízen — csak egy társítás.
  assert.deepEqual(c2.landings, ['a']);
});

test('a partraszállás megkapja a rajta futó kábeleket', () => {
  const { landings: out } = linkCablesToLandings(cableFeatures, landings);
  assert.deepEqual(out.find((l) => l.id === 'a').cables, ['c1', 'c2']);
  assert.deepEqual(out.find((l) => l.id === 'far').cables, []);
});

test('a koordináták tizedesjegyei csökkennek', () => {
  const { cables } = linkCablesToLandings(
    [{ properties: { id: 'x', name: 'X' }, geometry: { coordinates: [[[1.23456789, 2.3456789]]] } }],
    landings
  );
  assert.deepEqual(cables[0].geometry[0][0], [1.235, 2.346]);
});

test('a csomópontnál a legközelebbi partraszállás akkor is látszik, ha messze van', () => {
  const { landings: withCables } = linkCablesToLandings(cableFeatures, landings);
  // Budapest: minden partraszállástól távol.
  const out = linkExchanges([{ id: 55, lat: 47.5, lng: 19.04 }], withCables);
  assert.ok(out[55].nearest_km > 1000, `${out[55].nearest_km} km`);
  assert.deepEqual(out[55].landings, []);
  assert.deepEqual(out[55].cables, []);
});

test('a közeli csomópont megkapja a partraszállás kábeleit', () => {
  const { landings: withCables } = linkCablesToLandings(cableFeatures, landings);
  const out = linkExchanges([{ id: 7, lat: 34.7, lng: 33.0 }], withCables);
  assert.equal(out[7].nearest_km, 0);
  assert.deepEqual(out[7].cables, ['c1', 'c2']);
});

test('koordináta nélküli csomópont kimarad', () => {
  const out = linkExchanges([{ id: 9, lat: null, lng: null }], landings.map((l) => ({ ...l, cables: [] })));
  assert.deepEqual(out, {});
});

// ---- közös fizikai kábel a térképen ----

const exchanges = [
  { id: 1, name: 'AMS-IX', city: 'Amsterdam' },
  { id: 2, name: 'NL-ix', city: 'Amsterdam' },
  { id: 3, name: 'LINX', city: 'London' },
  { id: 4, name: 'BIX', city: 'Budapest' },
];

const cableIndex = {
  1: { cables: ['x', 'y', 'z'] },
  2: { cables: ['x', 'y', 'z'] },
  3: { cables: ['y'] },
  4: { cables: [] },
};

test('az azonos városban lévő csomópont nem foglalja a helyet', () => {
  const out = sharedCableExchanges(1, cableIndex, exchanges);
  assert.deepEqual(out.map((r) => r.exchange.name), ['LINX']);
});

test('a közös kábelek számát adja vissza', () => {
  assert.deepEqual(sharedCableExchanges(1, cableIndex, exchanges)[0].cables, ['y']);
});

test('kábel nélküli csomópontra üres', () => {
  assert.deepEqual(sharedCableExchanges(4, cableIndex, exchanges), []);
});

test('városonként csak egy találat kerül a listába', () => {
  const many = [
    ...exchanges,
    { id: 5, name: 'LONAP', city: 'London' },
  ];
  const idx = { ...cableIndex, 5: { cables: ['y', 'z'] } };
  const out = sharedCableExchanges(1, idx, many);
  assert.equal(out.filter((r) => r.exchange.city === 'London').length, 1);
  // A több közös kábellel rendelkező nyer.
  assert.equal(out[0].exchange.name, 'LONAP');
});
