import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCell, stripTags, compareValues, sortIndices, renderTable } from '../assets/table.js';

test('a nyers szövegcella szövegét a HTML-ből nyeri ki', () => {
  assert.equal(stripTags('<span class="mono">1 234</span>'), '1 234');
  assert.equal(stripTags('<a href="#">M&amp;A</a>'), 'M&A');
});

test('a cella megadott rendezési értéke elsőbbséget élvez a szöveg előtt', () => {
  const c = normalizeCell({ html: '<span class="mono">12,5 Gb/s</span>', sort: 12500 });
  assert.equal(c.sort, 12500);
  assert.equal(c.text, '12,5 Gb/s');
});

// Formázott számot soha nem fejtünk vissza: a csoportosítás nyelvfüggő,
// a visszafejtés találgatás lenne. Ha nincs megadott érték, szövegként rendez.
test('megadott érték nélkül a cella szövegként viselkedik', () => {
  assert.equal(normalizeCell('<span>8 358</span>').sort, null);
});

test('a hiányzó érték mindkét irányban hátra kerül', () => {
  assert.ok(compareValues(null, 5, 'number', 'asc') > 0);
  assert.ok(compareValues(null, 5, 'number', 'desc') > 0);
  assert.ok(compareValues('—', 'a', 'text', 'asc') > 0);
  assert.ok(compareValues('—', 'a', 'text', 'desc') > 0);
});

test('szám és szöveg külön szabály szerint rendez', () => {
  assert.ok(compareValues(2, 10, 'number', 'asc') < 0);
  // A szöveges összehasonlítás természetes sorrendű: a beágyazott számot
  // számként nézi, így a „Node 2" a „Node 10" elé kerül, nem mögé.
  assert.ok(compareValues('Node 2', 'Node 10', 'text', 'asc') < 0);
  assert.ok(compareValues('alma', 'banán', 'text', 'asc') < 0);
});

test('az irány megfordítható', () => {
  assert.ok(compareValues(1, 2, 'number', 'asc') < 0);
  assert.ok(compareValues(1, 2, 'number', 'desc') > 0);
});

test('a sorrend az oszlop indexe szerint áll elő', () => {
  const rows = [['b', { html: '2', sort: 2 }], ['a', { html: '10', sort: 10 }], ['c', '—']];
  assert.deepEqual(sortIndices(rows, 0, 'text', 'asc'), [1, 0, 2]);
  assert.deepEqual(sortIndices(rows, 1, 'number', 'desc'), [1, 0, 2], 'a hiányzó hátul marad');
});

test('üres tábla helyett magyarázó szöveg jelenik meg', () => {
  const html = renderTable({ id: 't', columns: [{ label: 'A' }], rows: [], emptyText: 'nincs adat' });
  assert.ok(html.includes('nincs adat'));
  assert.ok(!html.includes('<table'));
});

test('minden oszlopfej rendezhető gomb', () => {
  const html = renderTable({
    id: 't',
    columns: [{ label: 'Név' }, { label: 'ASN', type: 'number' }],
    rows: [['a', { html: '1', sort: 1 }]],
    emptyText: '',
  });
  assert.equal((html.match(/class="th-sort"/g) ?? []).length, 2);
  assert.ok(html.includes('data-sort="0"'));
  assert.ok(html.includes('data-type="number"'));
  assert.ok(html.includes('data-sortable'));
});

test('a rendezési érték a cellára kerül, nem a megjelenített szövegbe', () => {
  const html = renderTable({
    id: 't', columns: [{ label: 'Sáv', type: 'number' }],
    rows: [[{ html: '<span>12,5 Gb/s</span>', sort: 12500 }]], emptyText: '',
  });
  assert.ok(html.includes('data-value="12500"'));
  assert.ok(html.includes('12,5 Gb/s'));
});

test('a szűrő csak a küszöb feletti táblán jelenik meg', () => {
  const cols = [{ label: 'A' }];
  const few = renderTable({ id: 't', columns: cols, rows: [['a'], ['b']], emptyText: '', filterThreshold: 6, filterPlaceholder: 'szűrés' });
  const many = renderTable({ id: 't', columns: cols, rows: Array.from({ length: 8 }, (_, i) => [`s${i}`]), emptyText: '', filterThreshold: 6, filterPlaceholder: 'szűrés' });
  assert.ok(!few.includes('data-table-filter'));
  assert.ok(many.includes('data-table-filter'));
});

test('a cellák escapelve kerülnek ki, ha nyers szöveget kapnak', () => {
  const html = renderTable({
    id: 't', columns: [{ label: '<script>' }],
    rows: [[{ text: 'a', html: '<b>ok</b>' }]], emptyText: '',
  });
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});
