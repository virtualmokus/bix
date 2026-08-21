import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../assets/views/now.js';

const oneRow = [
  {
    ts: '2026-08-21T09:31:30Z',
    networks: 141,
    ports: 188,
    peak_gbps: 1116.82,
    current_gbps: 718.5,
    capacity_gbps: 8358,
  },
];

const manyRows = Array.from({ length: 40 }, (_, i) => ({
  ts: `2026-08-21T${String(i % 24).padStart(2, '0')}:00:00Z`,
  networks: 141,
  ports: 188,
  peak_gbps: 1116.82,
  current_gbps: 600 + i,
  capacity_gbps: 8358,
}));

const meta = { traffic: { last_success: '2026-08-21T09:31:30Z', last_error: null } };

test('a legutolsó mérést mutatja nagyban', () => {
  const html = render({ traffic: oneRow, meta, members: [], ports: [] });
  assert.ok(html.includes('718,50'));
});

// FIGYELEM: `<path`-ra nem szabad asszertálni — az ikonok SVG-jei is
// tartalmaznak path elemet. A grafikont a `class="chart"` azonosítja.
test('egyetlen mérésnél nem rajzol grafikont, hanem kiírja hogy most indult', () => {
  const html = render({ traffic: oneRow, meta, members: [], ports: [] });
  assert.ok(html.includes('Az idősor most indult'));
  assert.ok(!html.includes('class="chart"'));
});

test('elég adatnál grafikont rajzol', () => {
  const html = render({ traffic: manyRows, meta, members: [], ports: [] });
  assert.ok(html.includes('class="chart"'));
  assert.ok(!html.includes('Az idősor most indult'));
});

test('üres adatnál sem dob, és nem mutat számot', () => {
  const html = render({ traffic: [], meta: {}, members: [], ports: [] });
  assert.ok(typeof html === 'string');
  assert.ok(html.length > 0);
});

test('nincs benne emoji', () => {
  const html = render({ traffic: manyRows, meta, members: [], ports: [] });
  assert.ok(!/\p{Extended_Pictographic}/u.test(html), 'emoji került a kimenetbe');
});

test('a kihasználtság három sávját mutatja', () => {
  const html = render({ traffic: oneRow, meta, members: [], ports: [] });
  assert.ok(html.includes('valaha mért csúcs'));
  assert.ok(html.includes('beépített kapacitás'));
});
