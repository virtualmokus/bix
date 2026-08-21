import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, buildDossier } from '../assets/views/exchange.js';
import { parseHash } from '../assets/app-routing.js';

const exchanges = [
  { id: 26, name: 'AMS-IX', city: 'Amsterdam', country: 'NL', region: 'Europe', net_count: 861, lat: 52.3, lng: 4.9, shared: 2, asns: [1, 2] },
  { id: 31, name: 'DE-CIX Frankfurt', city: 'Frankfurt', country: 'DE', region: 'Europe', net_count: 1018, lat: 50.1, lng: 8.6, shared: 2, asns: [1, 2] },
  { id: 55, name: 'BIX', city: 'Budapest', country: 'HU', region: 'Europe', net_count: 103, lat: 47.5, lng: 19.0, shared: 2, asns: [1, 2] },
];

const members = [
  { asn: 1, name: 'Alfa', network: { type: 'Content', scope: 'Global', ix_count: 300, prefixes4: 900 } },
  { asn: 2, name: 'Béta', network: null },
];

const cables = {
  details: { c1: { owners: 'Meta, Telxius', suppliers: 'SubCom', length: '6,605 km', rfs: '2018 May', is_planned: false, url: 'https://example.org' } },
  cables: [{ id: 'c1', name: 'MAREA', countries: ['Spain', 'United States'] }],
  landings: [{ id: 'l1', name: 'Beverwijk, Netherlands', country: 'Netherlands' }],
  exchanges: {
    26: { nearest_km: 25, nearest_landing: 'Beverwijk, Netherlands', landings: [{ id: 'l1', km: 25 }], cables: ['c1'] },
    31: { nearest_km: 272, nearest_landing: 'Meersburg, Germany', landings: [], cables: [] },
    55: { nearest_km: 483, nearest_landing: 'Umag, Croatia', landings: [], cables: [] },
  },
};

const data = { global: { home_ix_id: 55, exchanges }, members, cables, traffic: [], ports: [], meta: {} };

test('a dosszié minden fő szakaszt tartalmaz', () => {
  const d = buildDossier(data, 26);
  assert.equal(d.exchange.name, 'AMS-IX');
  assert.equal(d.exchange.networks_total, 861);
  assert.equal(d.exchange.bix_members_present, 2);
  assert.equal(d.bix_members.length, 2);
  assert.equal(d.submarine.cables_within_150km, 1);
});

test('a tagokhoz odateszi a PeeringDB profilt, ha van', () => {
  const d = buildDossier(data, 26);
  const alfa = d.bix_members.find((m) => m.asn === 1);
  assert.equal(alfa.type, 'Content');
  assert.equal(alfa.ix_count, 300);
  // A profil nélküli tag sem vész el.
  assert.equal(d.bix_members.find((m) => m.asn === 2).type, null);
});

test('a kábelhez a tulajdonos is bekerül', () => {
  const cable = buildDossier(data, 26).submarine.cables[0];
  assert.equal(cable.name, 'MAREA');
  assert.equal(cable.owners, 'Meta, Telxius');
  assert.equal(cable.length, '6,605 km');
});

test('szárazföldi csomópontnál üres a kábellista, de a távolság megvan', () => {
  const d = buildDossier(data, 55);
  assert.deepEqual(d.submarine.cables, []);
  assert.equal(d.submarine.nearest_landing, 'Umag, Croatia');
  assert.equal(d.submarine.nearest_landing_km, 483);
});

test('ismeretlen azonosítóra null a dosszié', () => {
  assert.equal(buildDossier(data, 99999), null);
});

test('a nézet hibaüzenetet ad ismeretlen azonosítóra, nem dob', () => {
  const html = render(data, 99999);
  assert.ok(html.includes('99999'));
  assert.ok(html.includes('data-goto-view="map"'));
});

test('a nézet kiírja a letöltés és másolás gombokat', () => {
  const html = render(data, 26);
  assert.ok(html.includes('ix-download'));
  assert.ok(html.includes('ix-copy'));
  assert.ok(html.includes('peeringdb.com/ix/26'));
});

test('a kapcsolódó csomópontok adatlapja megnyitható', () => {
  const html = render(data, 26);
  assert.ok(html.includes('data-open-ix="31"') || html.includes('data-open-ix="55"'));
});

test('a dosszié megnevezi a forrásokat és a licencet', () => {
  const d = buildDossier(data, 26);
  assert.ok(d.sources.submarine_cables.includes('CC BY-NC-SA'));
  assert.equal(d.sources.exchange_and_members, 'PeeringDB');
});

test('a nézet escapel', () => {
  const evil = exchanges.map((e) => (e.id === 26 ? { ...e, name: '<img onerror=x>' } : e));
  const html = render({ ...data, global: { ...data.global, exchanges: evil } }, 26);
  assert.ok(!html.includes('<img onerror'));
});

// ---- útvonal ----

const VIEWS = ['overview', 'members', 'map', 'legal'];

test('az ix útvonal azonosítót is visz', () => {
  assert.deepEqual(parseHash('#ix/31', VIEWS), { name: 'ix', param: '31' });
});

test('az egyszerű nézetnevek változatlanok', () => {
  assert.deepEqual(parseHash('#members', VIEWS), { name: 'members', param: null });
  assert.deepEqual(parseHash('map', VIEWS), { name: 'map', param: null });
});

test('ismeretlen vagy üres útvonalra az áttekintés jön', () => {
  assert.deepEqual(parseHash('#nincs-ilyen', VIEWS), { name: 'overview', param: null });
  assert.deepEqual(parseHash('', VIEWS), { name: 'overview', param: null });
});

test('azonosító nélküli ix útvonal nem nyit adatlapot', () => {
  assert.deepEqual(parseHash('#ix', VIEWS), { name: 'overview', param: null });
});
