import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, filterMembers, bandwidthClass, sortMembers, SORT_KEYS } from '../assets/views/members.js';

const members = [
  {
    asn: 3244, name: '3C Telecom', website: null, policy: 'Open/Free',
    first_seen: '2010-07-29T00:00:00Z', is_rs_peer: true, ipv6: null,
    sources: ['bix', 'peeringdb'],
    ports: [{ node: 'VH', ipv4: '193.188.137.18', bandwidth_mbps: 1000, note: 'Backup Link', graph_id: 'a' }],
  },
  {
    asn: 13335, name: 'Cloudflare', website: null, policy: 'Selective',
    first_seen: '2017-02-10T15:02:18Z', is_rs_peer: false, ipv6: null,
    sources: ['bix', 'peeringdb'],
    ports: [{ node: 'Digital Realty (InterXion VIE1)', ipv4: '193.188.137.27', bandwidth_mbps: 200000, note: null, graph_id: 'b' }],
  },
  {
    asn: 65002, name: 'AS65002', website: null, policy: null,
    first_seen: '2021-03-03T00:00:00Z', is_rs_peer: false, ipv6: null,
    sources: ['peeringdb'], ports: [],
  },
];

const data = {
  members,
  ports: members.flatMap((m) => m.ports.map((p) => ({ ...p, asn: m.asn, member: m.name }))),
  traffic: [],
  meta: {},
};

test('szűretlenül minden tagot visszaad', () => {
  assert.equal(filterMembers(members, {}).length, 3);
});

test('név szerint szűr, kis- és nagybetűtől függetlenül', () => {
  assert.deepEqual(filterMembers(members, { query: 'cloud' }).map((m) => m.asn), [13335]);
});

test('ASN szerint is keres', () => {
  assert.deepEqual(filterMembers(members, { query: '3244' }).map((m) => m.asn), [3244]);
});

test('node szerint szűr', () => {
  assert.deepEqual(filterMembers(members, { node: 'VH' }).map((m) => m.asn), [3244]);
});

test('policy szerint szűr', () => {
  assert.deepEqual(filterMembers(members, { policy: 'Selective' }).map((m) => m.asn), [13335]);
});

test('sávszélesség szerint szűr', () => {
  assert.deepEqual(filterMembers(members, { bandwidth: 200000 }).map((m) => m.asn), [13335]);
});

test('a port nélküli tag kiesik node-szűrésnél', () => {
  assert.ok(!filterMembers(members, { node: 'VH' }).some((m) => m.asn === 65002));
});

test('a sávszélesség-osztály a nagyságrendet követi', () => {
  assert.notEqual(bandwidthClass(1000), bandwidthClass(100000));
  assert.equal(bandwidthClass(1000), bandwidthClass(1000));
});

test('a render kiírja a lefedettségi figyelmeztetést', () => {
  assert.ok(render(data).includes('%'));
});

test('a render escapeli a tagneveket', () => {
  const evil = [{ ...members[0], name: '<img onerror=alert(1)>' }];
  const html = render({ ...data, members: evil });
  assert.ok(!html.includes('<img onerror'));
});

test('a csak-PeeringDB-s tag jelölést kap', () => {
  assert.ok(render(data).includes('PeeringDB only'));
});

// A ©/™/® jelek Extended_Pictographic-ok, de nem emojik — a forrásmegjelöléshez
// kellenek. Az Emoji_Presentation csak azokat fogja, amik alapértelmezésben
// emojiként jelennek meg: pontosan azt tiltja a design rendszer.
test('nincs benne emoji', () => {
  assert.ok(!/\p{Emoji_Presentation}/u.test(render(data)));
});

// ---- rendezés ----

const sortable = [
  { asn: 100, name: 'Zeta', policy: 'Open/Free', sources: ['bix'], ipv6: null, is_rs_peer: false,
    ports: [{ node: 'VH', bandwidth_mbps: 1000 }],
    network: { type: 'Content', scope: 'Global', prefixes4: 50, ix_count: 9, aka: null } },
  { asn: 200, name: 'Alfa', policy: 'Selective', sources: ['bix'], ipv6: '2001:db8::1', is_rs_peer: true,
    ports: [{ node: 'VH', bandwidth_mbps: 100000 }],
    network: { type: 'NSP', scope: 'Europe', prefixes4: 5000, ix_count: 2, aka: null } },
  { asn: 300, name: 'Béta', policy: null, sources: ['peeringdb'], ipv6: null, is_rs_peer: false,
    ports: [], network: null },
];

test('alapból együttes sávszélesség szerint csökkenően rendez', () => {
  assert.deepEqual(sortMembers(sortable).map((m) => m.asn), [200, 100, 300]);
});

test('név szerint növekvő sorrendbe tesz', () => {
  assert.deepEqual(sortMembers(sortable, 'name', 'asc').map((m) => m.name), ['Alfa', 'Béta', 'Zeta']);
});

test('az irány megfordítható', () => {
  assert.deepEqual(sortMembers(sortable, 'name', 'desc').map((m) => m.name), ['Zeta', 'Béta', 'Alfa']);
});

test('a hiányzó érték mindkét irányban hátra kerül', () => {
  // A 300-as tagnak nincs hálózati profilja, tehát nincs prefix-száma.
  assert.equal(sortMembers(sortable, 'prefixes', 'desc').at(-1).asn, 300);
  assert.equal(sortMembers(sortable, 'prefixes', 'asc').at(-1).asn, 300);
});

test('számoszlopot számként rendez, nem szövegként', () => {
  assert.deepEqual(sortMembers(sortable, 'prefixes', 'desc').slice(0, 2).map((m) => m.asn), [200, 100]);
});

test('logikai oszlop szerint is rendez', () => {
  assert.equal(sortMembers(sortable, 'rs', 'desc')[0].asn, 200);
  assert.equal(sortMembers(sortable, 'v6', 'desc')[0].asn, 200);
});

test('ismeretlen oszlopnál a sávszélességre esik vissza', () => {
  assert.deepEqual(
    sortMembers(sortable, 'nincs-ilyen').map((m) => m.asn),
    sortMembers(sortable, 'bandwidth').map((m) => m.asn)
  );
});

test('minden oszlopfej rendezhető gombot kap', () => {
  const html = render(data);
  assert.equal((html.match(/class="th-sort"/g) ?? []).length, Object.keys(SORT_KEYS).length);
});
