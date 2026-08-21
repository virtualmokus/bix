import { test } from 'node:test';
import assert from 'node:assert/strict';
import { areaChart, barRow, cumulativeChart } from '../assets/chart.js';

test('az areaChart svg-t ad vissza a megadott mérettel', () => {
  const svg = areaChart({
    points: [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 15 },
    ],
    width: 400,
    height: 100,
  });
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('viewBox="0 0 400 100"'));
  assert.ok(svg.includes('<path'));
});

test('az areaChart egyetlen pontnál sem dob', () => {
  const svg = areaChart({ points: [{ x: 0, y: 42 }], width: 400, height: 100 });
  assert.ok(svg.startsWith('<svg'));
});

test('az areaChart üres adatra üres svg-t ad', () => {
  const svg = areaChart({ points: [], width: 400, height: 100 });
  assert.ok(svg.startsWith('<svg'));
  assert.ok(!svg.includes('<path'));
});

test('a barRow a max-hoz arányosítja a szélességet', () => {
  const svg = barRow({ label: 'most', value: 50, max: 200 });
  assert.ok(svg.includes('25.0%'));
  assert.ok(svg.includes('most'));
});

test('a barRow nulla max esetén nem oszt nullával', () => {
  const svg = barRow({ label: 'x', value: 5, max: 0 });
  assert.ok(svg.includes('0.0%'));
});

test('a barRow escapeli a címkét', () => {
  const svg = barRow({ label: '<script>', value: 1, max: 2 });
  assert.ok(!svg.includes('<script>'));
  assert.ok(svg.includes('&lt;script&gt;'));
});

test('a cumulativeChart összegzi a bucketeket', () => {
  const svg = cumulativeChart({
    buckets: [
      { label: '2010', value: 5 },
      { label: '2011', value: 3 },
    ],
    width: 400,
    height: 100,
  });
  assert.ok(svg.includes('<path'));
  assert.ok(svg.includes('2010'));
  assert.ok(svg.includes('2011'));
});
