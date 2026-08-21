import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STREAM_MBPS,
  concurrent4kStreams,
  gigabytesPerSecond,
  utilizationPercent,
} from '../assets/humanize.js';

test('a stream-konstans dokumentált és 15 Mb/s', () => {
  assert.equal(STREAM_MBPS, 15);
});

test('a 4K streamek számát a konstansból számolja', () => {
  assert.equal(concurrent4kStreams(679.68), Math.round((679.68 * 1000) / STREAM_MBPS));
  assert.equal(concurrent4kStreams(15 / 1000), 1);
});

test('a gigabájt/másodperc nyolcadolás', () => {
  assert.equal(gigabytesPerSecond(8), 1);
  assert.equal(Math.round(gigabytesPerSecond(679.68)), 85);
});

test('a kihasználtság százalék', () => {
  assert.equal(utilizationPercent(679.68, 8358).toFixed(2), '8.13');
});

test('nulla kapacitásnál nem oszt nullával', () => {
  assert.equal(utilizationPercent(100, 0), 0);
});
