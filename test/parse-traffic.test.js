import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseTraffic, ParseError } from '../collect/parse-traffic.js';

const minimal = await readFile('test/fixtures/traffic-minimal.html', 'utf8');
const live = await readFile('test/fixtures/bix-home.html', 'utf8');

test('kinyeri mind az öt értéket a kézi fixtúrából', () => {
  assert.deepEqual(parseTraffic(minimal), {
    networks: 141,
    ports: 188,
    peak_gbps: 1116.82,
    current_gbps: 679.68,
    capacity_gbps: 8358,
  });
});

test('elfogadja az "aktuális" helyesírást is', () => {
  const fixed = minimal.replace('aktuáls', 'aktuális');
  assert.equal(parseTraffic(fixed).current_gbps, 679.68);
});

test('hibát dob, ha nincs meg mind az öt pár', () => {
  const truncated = minimal.replace(
    /<div class="stat">\s*<div class="value">8358[\s\S]*?<\/div>\s*<\/div>/,
    ''
  );
  assert.throws(() => parseTraffic(truncated), ParseError);
});

test('hibát dob, ha a címkék sorrendje más', () => {
  const swapped = minimal.replace('>hálózat<', '>ZZZ<').replace('>port<', '>hálózat<');
  assert.throws(() => parseTraffic(swapped), ParseError);
});

test('az élő mentésből is öt valós számot ad', () => {
  const t = parseTraffic(live);
  for (const key of ['networks', 'ports', 'peak_gbps', 'current_gbps', 'capacity_gbps']) {
    assert.ok(Number.isFinite(t[key]), `${key} nem szám: ${t[key]}`);
    assert.ok(t[key] > 0, `${key} nem pozitív: ${t[key]}`);
  }
});
