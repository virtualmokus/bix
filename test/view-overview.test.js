import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../assets/views/overview.js';

const traffic = [
  { ts: '2026-08-21T09:00:00Z', networks: 141, ports: 188, peak_gbps: 1116.82, current_gbps: 700, capacity_gbps: 8358 },
  { ts: '2026-08-21T09:15:00Z', networks: 141, ports: 188, peak_gbps: 1116.82, current_gbps: 742.99, capacity_gbps: 8358 },
];

const ports = [
  { asn: 1, member: 'Alfa', node: 'VH', bandwidth_mbps: 100000, note: 'Backup Link' },
  { asn: 1, member: 'Alfa', node: 'VH', bandwidth_mbps: 100000, note: '10Gbps on 100G' },
  { asn: 2, member: 'Béta', node: 'Digital Realty (InterXion VIE1)', bandwidth_mbps: 10000, note: null },
];

const members = [
  { asn: 1, name: 'Alfa', policy: 'Open/Free', first_seen: '2010-07-29T00:00:00Z', is_rs_peer: true,
    ipv6: '2001:db8::1', sources: ['bix', 'peeringdb'], ports: ports.slice(0, 2),
    network: { aka: null, type: 'Content', scope: 'Global', traffic: '1-5Tbps', ratio: 'Mostly Outbound',
      prefixes4: 80000, prefixes6: 30000, ix_count: 357, fac_count: 224, policy: 'Open' } },
  { asn: 2, name: 'Béta', policy: 'Selective', first_seen: '2017-02-10T00:00:00Z', is_rs_peer: false,
    ipv6: null, sources: ['bix'], ports: [ports[2]],
    network: { aka: 'BétaNet', type: 'Cable/DSL/ISP', scope: 'Europe', traffic: '20-50Gbps', ratio: 'Balanced',
      prefixes4: 120, prefixes6: 0, ix_count: 4, fac_count: 2, policy: 'Selective' } },
];

const data = { traffic, ports, members, meta: {} };

test('a kihasználtsági sávok mellett ott a tényleges szám', () => {
  const html = render(data);
  assert.ok(html.includes('742.99 Gb/s'), 'hiányzik az aktuális érték');
  assert.ok(html.includes('1,116.82 Gb/s'), 'hiányzik a valaha mért csúcs értéke');
  assert.ok(html.includes('8,358 Gb/s'), 'hiányzik a kapacitás értéke');
});

test('a kulcsszámok között ott a bejelentett és a publikus portszám is', () => {
  const html = render(data);
  assert.ok(html.includes('188'));
  assert.ok(html.includes('public ports'));
});

test('kiírja a hálózattípus- és hatókör-bontást', () => {
  const html = render(data);
  assert.ok(html.includes('Content'));
  assert.ok(html.includes('Cable/DSL/ISP'));
  assert.ok(html.includes('Global'));
  assert.ok(html.includes('Europe'));
});

test('az érdekességek között szerepel a legtöbb IXP-n jelen lévő tag', () => {
  const html = render(data);
  assert.ok(html.includes('357'));
  assert.ok(html.includes('Alfa'));
});

test('a redundancia és a tartalék tényszerűen jelenik meg', () => {
  const html = render(data);
  assert.ok(html.includes('backup') || html.includes('Backup') || html.includes('kiesés'));
});

test('a növekedési görbe felirata nem nevezi csatlakozásnak a PeeringDB dátumot', () => {
  const html = render(data);
  assert.ok(!/\bcsatlakozott\b/.test(html));
});

test('kiírja a bécsi node figyelmeztetést', () => {
  assert.ok(render(data).includes('Vienna'));
});

test('forgalmi adat nélkül sem dob, és a szerkezeti rész megmarad', () => {
  const html = render({ ...data, traffic: [] });
  assert.ok(typeof html === 'string' && html.length > 0);
  assert.ok(html.includes('Content'));
});

test('hálózati profil nélkül sem dob', () => {
  const bare = members.map((m) => ({ ...m, network: null }));
  const html = render({ ...data, members: bare });
  assert.ok(typeof html === 'string' && html.length > 0);
});

test('nincs benne emoji', () => {
  assert.ok(!/\p{Extended_Pictographic}/u.test(render(data)));
});
