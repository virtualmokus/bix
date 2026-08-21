import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDecimal,
  formatInt,
  formatPercent,
  formatBandwidth,
  formatRelative,
} from '../assets/format.js';

// A hu-HU csoportelválasztó U+00A0 (nem törő szóköz), ezért az
// összehasonlítás előtt sima szóközre normalizálunk.
const normalize = (s) => s.replace(/ | /g, ' ');

test('tizedesvesszőt használ', () => {
  assert.equal(formatDecimal(679.68), '679,68');
  assert.equal(formatDecimal(718.5), '718,50');
});

test('az egész számokat a magyar tipográfia szerint tagolja', () => {
  // Magyar helyesírás: a négyjegyű szám tagolatlan, ötjegyűtől kap
  // csoportelválasztót. A 8358 tehát helyesen "8358", nem "8 358".
  assert.equal(formatInt(137), '137');
  assert.equal(formatInt(8358), '8358');
  assert.equal(normalize(formatInt(10000)), '10 000');
  assert.equal(normalize(formatInt(45312)), '45 312');
});

test('a százalékot egy tizedessel adja', () => {
  assert.equal(formatPercent(8.5949), '8,6%');
});

test('a sávszélességet emberi alakra hozza', () => {
  assert.equal(formatBandwidth(1000), '1G');
  assert.equal(formatBandwidth(100000), '100G');
  assert.equal(formatBandwidth(300000), '300G');
  assert.equal(formatBandwidth(100), '100M');
});

test('a relatív idő magyarul, a megfelelő ragozással', () => {
  const now = new Date('2026-08-21T12:00:00Z');
  assert.equal(formatRelative('2026-08-21T11:59:30Z', now), 'épp most');
  assert.equal(formatRelative('2026-08-21T11:48:00Z', now), '12 perce');
  assert.equal(formatRelative('2026-08-21T09:00:00Z', now), '3 órája');
  assert.equal(formatRelative('2026-08-19T12:00:00Z', now), '2 napja');
});

test('a null bemenetre üres stringet ad, nem dob', () => {
  assert.equal(formatRelative(null, new Date()), '');
});
