import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render as renderMap, filterExchanges, relatedExchanges } from '../assets/views/map.js';
import { render as renderLegal } from '../assets/views/legal.js';
import strings from '../assets/strings.en.js';

const exchanges = [
  { id: 55, name: 'BIX', city: 'Budapest', country: 'HU', region: 'Europe', net_count: 103, lat: 47.5, lng: 19.0, shared: 3, asns: [1, 2, 3] },
  { id: 31, name: 'DE-CIX Frankfurt', city: 'Frankfurt', country: 'DE', region: 'Europe', net_count: 1018, lat: 50.1, lng: 8.6, shared: 2, asns: [1, 2] },
  { id: 26, name: 'AMS-IX', city: 'Amsterdam', country: 'NL', region: 'Europe', net_count: 861, lat: 52.3, lng: 4.9, shared: 1, asns: [2] },
  { id: 171, name: 'IX.br', city: 'São Paulo', country: 'BR', region: 'South America', net_count: 1855, lat: -23.5, lng: -46.6, shared: 1, asns: [9] },
];

const members = [
  { asn: 1, name: 'Alfa', ports: [] },
  { asn: 2, name: 'Béta', ports: [] },
  { asn: 3, name: 'Gamma', ports: [] },
  { asn: 9, name: 'Delta', ports: [] },
];

const data = { global: { home_ix_id: 55, exchanges }, members, traffic: [], ports: [], meta: {} };

test('a minimum-átfedés szűrő vág', () => {
  assert.deepEqual(filterExchanges(exchanges, { minShared: 2 }).map((e) => e.id), [55, 31]);
});

test('a régiószűrő vág', () => {
  assert.deepEqual(filterExchanges(exchanges, { region: 'South America' }).map((e) => e.id), [171]);
});

test('a tagszűrő csak azokat hagyja, ahol az ASN jelen van', () => {
  assert.deepEqual(filterExchanges(exchanges, { asn: '9' }).map((e) => e.id), [171]);
  assert.deepEqual(filterExchanges(exchanges, { asn: 1 }).map((e) => e.id), [55, 31]);
});

test('a szűrők kombinálódnak', () => {
  assert.deepEqual(
    filterExchanges(exchanges, { minShared: 1, region: 'Europe', asn: '2' }).map((e) => e.id),
    [55, 31, 26]
  );
});

test('a kapcsolódók a közös ASN-ek szerint rangsorolnak', () => {
  const related = relatedExchanges(exchanges[0], exchanges);
  assert.deepEqual(related.map((r) => [r.exchange.name, r.overlap]), [
    ['DE-CIX Frankfurt', 2],
    ['AMS-IX', 1],
  ]);
});

test('a kapcsolódók közül kimarad az önmaga és a nulla átfedésű', () => {
  const related = relatedExchanges(exchanges[0], exchanges);
  assert.ok(!related.some((r) => r.exchange.id === 55), 'önmaga nem lehet kapcsolódó');
  assert.ok(!related.some((r) => r.exchange.name === 'IX.br'), 'nulla átfedés nem kerülhet be');
});

test('ASN-lista nélküli csomópontra üres a kapcsolat', () => {
  assert.deepEqual(relatedExchanges({ id: 1, asns: [] }, exchanges), []);
});

test('a térkép vezérlői mind kirenderelnek', () => {
  const html = renderMap(data);
  for (const id of ['map-min', 'map-region', 'map-member', 'map-reset', 'map-full', 'map-panel']) {
    assert.ok(html.includes(id), `hiányzik: ${id}`);
  }
});

test('a tagválasztóba csak külföldön is jelen lévő tag kerül', () => {
  const html = renderMap(data);
  assert.ok(html.includes('Alfa'), 'Alfa Frankfurtban is ott van');
  assert.ok(!html.includes('Gamma'), 'Gamma csak a BIX-en van, nem kerülhet a szűrőbe');
});

test('a jogi oldal minden szakaszt kirenderel', () => {
  const html = renderLegal();
  assert.equal((html.match(/legal-section/g) ?? []).length, strings.legal.sections.length);
});

test('a jogi oldal kimondja a felelősség kizárását és a függetlenséget', () => {
  const html = renderLegal().toLowerCase();
  assert.ok(html.includes('no liability'), 'hiányzik a felelősségkizárás');
  assert.ok(html.includes('not operated by'), 'hiányzik a függetlenségi nyilatkozat');
  assert.ok(html.includes('without any warranty'), 'hiányzik a garanciakizárás');
  assert.ok(html.includes('without review by a lawyer'), 'hiányzik a jogi tanács kizárása');
});

test('a jogi oldal nem ígér jogi tanácsot, és nevesíti a forrásokat', () => {
  const html = renderLegal();
  assert.ok(html.includes('bix.hu'));
  assert.ok(html.includes('PeeringDB'));
  assert.ok(html.includes('OpenStreetMap'));
});

// A ©/™/® jelek Extended_Pictographic-ok, de nem emojik — a forrásmegjelöléshez
// kellenek. Az Emoji_Presentation csak azokat fogja, amik alapértelmezésben
// emojiként jelennek meg: pontosan azt tiltja a design rendszer.
test('nincs emoji egyik nézetben sem', () => {
  assert.ok(!/\p{Emoji_Presentation}/u.test(renderMap(data)));
  assert.ok(!/\p{Emoji_Presentation}/u.test(renderLegal()));
});
