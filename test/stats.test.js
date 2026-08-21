import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  distribution, topBy, sumBy, memberBandwidth, keyFigures,
  redundancy, headroom, adoption, cohorts, totalCapacityMbps,
} from '../assets/stats.js';

const ports = [
  { asn: 1, member: 'A', node: 'VH', bandwidth_mbps: 1000, note: 'Backup Link' },
  { asn: 1, member: 'A', node: 'VH', bandwidth_mbps: 1000, note: '1Gbps on 10G' },
  { asn: 2, member: 'B', node: 'Bécs', bandwidth_mbps: 100000, note: null },
  { asn: 3, member: 'C', node: 'VH', bandwidth_mbps: 10000, note: '10Gbps on 100G' },
];

const members = [
  { asn: 1, name: 'A', is_rs_peer: true, ipv6: '2001:db8::1', ports: ports.slice(0, 2),
    network: { type: 'Content', scope: 'Global', ix_count: 300, prefixes4: 500, prefixes6: 100 } },
  { asn: 2, name: 'B', is_rs_peer: false, ipv6: null, ports: [ports[2]],
    network: { type: 'Content', scope: 'Europe', ix_count: 12, prefixes4: 90, prefixes6: 0 } },
  { asn: 3, name: 'C', is_rs_peer: true, ipv6: '2001:db8::3', ports: [ports[3]], network: null },
];

test('az eloszlás csökkenő sorrendben jön, üres kulcs nélkül', () => {
  assert.deepEqual(distribution(ports, (p) => p.node), [['VH', 3], ['Bécs', 1]]);
  assert.deepEqual(distribution(ports, (p) => p.note), [
    ['10Gbps on 100G', 1], ['1Gbps on 10G', 1], ['Backup Link', 1],
  ]);
});

test('a topBy a hiányzó értékűeket kihagyja', () => {
  const top = topBy(members, (m) => m.network?.ix_count, 2);
  assert.deepEqual(top.map((m) => m.asn), [1, 2]);
});

test('a sumBy a nem szám értéket nullának veszi', () => {
  assert.equal(sumBy([{ v: 5 }, { v: null }, { v: '3' }], (x) => x.v), 8);
});

test('a tag sávszélessége a portjai összege', () => {
  assert.equal(memberBandwidth(members[0]), 2000);
  assert.equal(memberBandwidth({ ports: [] }), 0);
});

test('a kulcsszámok a valós és a publikus portszámot is megkülönböztetik', () => {
  const f = keyFigures({
    members, ports,
    traffic: { networks: 141, ports: 188, capacity_gbps: 8358, peak_gbps: 1116.82 },
  });
  assert.equal(f.portsReported, 188);
  assert.equal(f.portsPublic, 4);
  assert.equal(f.members, 3);
  assert.equal(f.nodes, 2);
  assert.equal(f.largestPortMbps, 100000);
  assert.equal(Math.round(f.coveragePercent), 2);
});

test('a kulcsszámok forgalmi adat nélkül sem dobnak', () => {
  const f = keyFigures({ members, ports, traffic: null });
  assert.equal(f.portsReported, null);
  assert.equal(f.coveragePercent, null);
  assert.equal(f.portsPublic, 4);
});

test('a redundancia a több portos és több node-os tagokat számolja', () => {
  const r = redundancy(members, ports);
  assert.equal(r.multiPortMembers, 1);
  assert.equal(r.multiNodeMembers, 0);
  assert.equal(r.backupPorts, 1);
});

test('a tartalék a megjegyzésből olvassa ki az előfizetett és fizikai kapacitást', () => {
  const h = headroom(ports);
  assert.equal(h.length, 2);
  assert.equal(h[0].subscribed_mbps, 1000);
  assert.equal(h[0].physical_mbps, 10000);
  assert.equal(h[1].physical_mbps, 100000);
});

test('a tartalék kihagyja, ahol nincs valódi különbség', () => {
  assert.deepEqual(headroom([{ note: '10Gbps on 10G' }]), []);
  assert.deepEqual(headroom([{ note: 'Backup Link' }]), []);
  assert.deepEqual(headroom([{ note: null }]), []);
});

test('az elterjedtség IPv6-ot és route-server peert számol', () => {
  const a = adoption(members);
  assert.equal(a.total, 3);
  assert.equal(a.ipv6, 2);
  assert.equal(a.routeServer, 2);
  assert.equal(a.announcesIpv6, 1);
  assert.equal(a.profiled, 2);
});

test('a kohorsz évenként számot és kapacitást ad, a közbenső éveket nullázva', () => {
  const ms = [
    { first_seen: '2010-01-01T00:00:00Z', ports: [{ bandwidth_mbps: 1000 }] },
    { first_seen: '2010-06-01T00:00:00Z', ports: [{ bandwidth_mbps: 10000 }] },
    { first_seen: '2013-01-01T00:00:00Z', ports: [{ bandwidth_mbps: 100000 }] },
    { first_seen: null, ports: [{ bandwidth_mbps: 999 }] },
  ];
  assert.deepEqual(cohorts(ms), [
    { label: '2010', count: 2, mbps: 11000 },
    { label: '2011', count: 0, mbps: 0 },
    { label: '2012', count: 0, mbps: 0 },
    { label: '2013', count: 1, mbps: 100000 },
  ]);
});

test('a kohorsz dátum nélküli tagot nem számol be', () => {
  const total = cohorts([
    { first_seen: '2020-01-01T00:00:00Z', ports: [{ bandwidth_mbps: 5000 }] },
    { first_seen: null, ports: [{ bandwidth_mbps: 5000 }] },
  ]).reduce((s, c) => s + c.mbps, 0);
  assert.equal(total, 5000);
});

test('üres bemenetre üres kohorsz', () => {
  assert.deepEqual(cohorts([]), []);
  assert.deepEqual(cohorts([{ first_seen: null, ports: [] }]), []);
});

test('az összkapacitás minden tag minden portját összegzi', () => {
  assert.equal(
    totalCapacityMbps([
      { ports: [{ bandwidth_mbps: 1000 }, { bandwidth_mbps: 1000 }] },
      { ports: [{ bandwidth_mbps: 100000 }] },
      { ports: [] },
    ]),
    102000
  );
});
