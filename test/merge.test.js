import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeMembers } from '../collect/merge.js';

const ports = [
  {
    member: '3C Telecom', website: 'http://www.3ctelecom.hu', asn: 3244, policy: 'Open/Free',
    node: 'VH', ipv4: '193.188.137.18', bandwidth_mbps: 1000, note: 'Backup Link', graph_id: 'aaa',
  },
  {
    member: '3C Telecom', website: 'http://www.3ctelecom.hu', asn: 3244, policy: 'Open/Free',
    node: 'VH', ipv4: '193.188.137.35', bandwidth_mbps: 1000, note: '1Gbps on 10G', graph_id: 'bbb',
  },
  {
    member: 'Csak BIX Kft.', website: null, asn: 65001, policy: 'Selective',
    node: 'VH', ipv4: '193.188.137.99', bandwidth_mbps: 100000, note: null, graph_id: null,
  },
];

const records = [
  { asn: 3244, ipaddr6: '2001:7f8:35::3:244:1', is_rs_peer: false, created: '2012-05-01T00:00:00Z' },
  { asn: 3244, ipaddr6: null, is_rs_peer: true, created: '2010-07-29T00:00:00Z' },
  { asn: 65002, ipaddr6: '2001:7f8:35::6:5002:1', is_rs_peer: false, created: '2021-03-03T00:00:00Z' },
];

test('egy ASN több portja egyetlen tag alá kerül', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 3244);
  assert.equal(member.ports.length, 2);
  assert.equal(member.name, '3C Telecom');
  assert.deepEqual(
    member.ports.map((p) => p.ipv4),
    ['193.188.137.18', '193.188.137.35']
  );
});

test('a first_seen a legkorábbi created dátum', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 3244);
  assert.equal(member.first_seen, '2010-07-29T00:00:00Z');
});

test('az is_rs_peer igaz, ha bármelyik rekordban igaz', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 3244);
  assert.equal(member.is_rs_peer, true);
});

test('az ipv6 az első nem üres értéket veszi fel', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 3244);
  assert.equal(member.ipv6, '2001:7f8:35::3:244:1');
});

test('mindkét forrásban szereplő tag sources mezője kettős', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 3244);
  assert.deepEqual(member.sources, ['bix', 'peeringdb']);
});

test('csak a BIX-ben szereplő tagnak nincs first_seen-je', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 65001);
  assert.deepEqual(member.sources, ['bix']);
  assert.equal(member.first_seen, null);
  assert.equal(member.ports.length, 1);
});

test('csak a PeeringDB-ben szereplő tag név nélkül, port nélkül kerül be', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 65002);
  assert.deepEqual(member.sources, ['peeringdb']);
  assert.equal(member.name, 'AS65002');
  assert.equal(member.policy, null);
  assert.deepEqual(member.ports, []);
});

test('a tagok ASN szerint növekvő sorrendben állnak', () => {
  const asns = mergeMembers(ports, records).members.map((m) => m.asn);
  assert.deepEqual(asns, [...asns].sort((a, b) => a - b));
});

test('a PeeringDB sebesség-adata nem szivárog be', () => {
  const withSpeed = records.map((r) => ({ ...r, speed: 400000 }));
  for (const member of mergeMembers(ports, withSpeed).members) {
    assert.equal(member.speed, undefined);
    for (const port of member.ports) {
      assert.notEqual(port.bandwidth_mbps, 400000);
    }
  }
});
