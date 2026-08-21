import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parsePorts, parseBandwidth, ParseError } from '../collect/parse-ports.js';

const minimal = await readFile('test/fixtures/ports-minimal.html', 'utf8');
const live = await readFile('test/fixtures/bix-statisztika.html', 'utf8');

test('a sávszélességet Mb/s-re váltja', () => {
  assert.equal(parseBandwidth('1G'), 1000);
  assert.equal(parseBandwidth('10G'), 10000);
  assert.equal(parseBandwidth('100G'), 100000);
  assert.equal(parseBandwidth('300G'), 300000);
  assert.equal(parseBandwidth(' 100M '), 100);
});

test('ismeretlen sávszélesség-formátumra hibát dob', () => {
  assert.throws(() => parseBandwidth('gyors'), ParseError);
});

test('a fejlécsort kihagyja', () => {
  assert.equal(parsePorts(minimal).length, 3);
});

test('minden mezőt kinyer az első sorból', () => {
  assert.deepEqual(parsePorts(minimal)[0], {
    member: '3C Telecom',
    website: 'http://www.3ctelecom.hu',
    asn: 3244,
    policy: 'Open/Free',
    node: 'VH',
    ipv4: '193.188.137.18',
    bandwidth_mbps: 1000,
    note: 'Backup Link',
    graph_id: '1c93472e613b32c0eaa37f02f65f10cd',
  });
});

test('a weboldal és a grafikon-link nélküli sort is kezeli', () => {
  const third = parsePorts(minimal)[2];
  assert.equal(third.member, 'Névtelen Kft.');
  assert.equal(third.website, null);
  assert.equal(third.note, null);
  assert.equal(third.graph_id, null);
  assert.equal(third.bandwidth_mbps, 100000);
});

test('ugyanaz az ASN kétszer is szerepelhet', () => {
  const rows = parsePorts(minimal).filter((p) => p.asn === 3244);
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].ipv4, rows[1].ipv4);
});

test('üres bemenetre hibát dob', () => {
  assert.throws(() => parsePorts('<html><body></body></html>'), ParseError);
});

test('az élő mentésből 100-nál több portot ad, minden kötelező mezővel', () => {
  const ports = parsePorts(live);
  assert.ok(ports.length > 100, `csak ${ports.length} port`);
  for (const p of ports) {
    assert.ok(Number.isInteger(p.asn) && p.asn > 0, `rossz ASN: ${p.asn}`);
    assert.ok(p.member.length > 0, 'üres tagnév');
    assert.ok(p.node.length > 0, `üres node: ${p.member}`);
    assert.ok(p.bandwidth_mbps > 0, `rossz sávszélesség: ${p.member}`);
  }
});
