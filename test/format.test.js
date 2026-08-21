import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDecimal,
  formatInt,
  formatPercent,
  formatBandwidth,
  formatRelative,
} from '../assets/format.js';

test('decimals use a point (en-GB)', () => {
  assert.equal(formatDecimal(679.68), '679.68');
  assert.equal(formatDecimal(718.5), '718.50');
});

test('integers get comma grouping from four digits', () => {
  assert.equal(formatInt(137), '137');
  assert.equal(formatInt(8358), '8,358');
  assert.equal(formatInt(1047309), '1,047,309');
});

test('percent has one decimal by default', () => {
  assert.equal(formatPercent(8.5949), '8.6%');
});

test('bandwidth is humanised', () => {
  assert.equal(formatBandwidth(1000), '1G');
  assert.equal(formatBandwidth(100000), '100G');
  assert.equal(formatBandwidth(300000), '300G');
  assert.equal(formatBandwidth(100), '100M');
});

test('relative time is English with correct plurals', () => {
  const now = new Date('2026-08-21T12:00:00Z');
  assert.equal(formatRelative('2026-08-21T11:59:30Z', now), 'just now');
  assert.equal(formatRelative('2026-08-21T11:48:00Z', now), '12 min ago');
  assert.equal(formatRelative('2026-08-21T11:00:00Z', now), '1 hour ago');
  assert.equal(formatRelative('2026-08-21T09:00:00Z', now), '3 hours ago');
  assert.equal(formatRelative('2026-08-20T12:00:00Z', now), '1 day ago');
  assert.equal(formatRelative('2026-08-19T12:00:00Z', now), '2 days ago');
});

test('null input yields empty string, not a throw', () => {
  assert.equal(formatRelative(null, new Date()), '');
});
