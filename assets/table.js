import { escapeHtml } from './chart.js';

/**
 * Közös tábla: rendezhető oszlopfej és szabadszavas szűrő, minden nézetben
 * ugyanazzal a szabállyal.
 *
 * A rendezési értéket a hívó adja meg, nem a megjelenített szövegből fejtjük
 * vissza. A számformázás nyelvfüggő — a magyar öt számjegytől csoportosít, az
 * angol háromtól —, így a „8 358" vagy a „12,5 Gb/s" visszaparsolása
 * találgatás lenne. Ahol nincs megadott érték, ott a cella szövege dönt.
 */

const MISSING = '—';

export function stripTags(html) {
  return String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cella lehet HTML-string, vagy `{ html, sort, text }` hármas. */
export function normalizeCell(cell) {
  if (cell === null || cell === undefined) return { html: MISSING, sort: null, text: '' };
  if (typeof cell === 'object') {
    const html = cell.html ?? '';
    return {
      html,
      sort: cell.sort ?? null,
      text: cell.text ?? stripTags(html),
    };
  }
  const html = String(cell);
  return { html, sort: null, text: stripTags(html) };
}

const isMissing = (v) => v === null || v === undefined || v === '' || v === MISSING;

/** A hiányzó érték mindkét irányban hátra kerül — különben a rendezés a
 *  hiányt rangsorolná, nem az adatot. */
export function compareValues(a, b, type = 'text', direction = 'asc') {
  const emptyA = isMissing(a);
  const emptyB = isMissing(b);
  if (emptyA && emptyB) return 0;
  if (emptyA) return 1;
  if (emptyB) return -1;

  const cmp =
    type === 'number'
      ? Number(a) - Number(b)
      : String(a).localeCompare(String(b), 'en', { numeric: true });

  return cmp * (direction === 'asc' ? 1 : -1);
}

function sortableOf(cell) {
  const c = normalizeCell(cell);
  return c.sort !== null && c.sort !== undefined ? c.sort : c.text;
}

/** A rendezett sorindexek. Az eredeti sorrend a döntetlenek között megmarad. */
export function sortIndices(rows, index, type = 'text', direction = 'asc') {
  return rows
    .map((row, i) => ({ i, v: sortableOf(row[index]) }))
    .sort((a, b) => compareValues(a.v, b.v, type, direction) || a.i - b.i)
    .map((x) => x.i);
}

export function renderTable({
  id,
  columns,
  rows,
  emptyText = '',
  filterPlaceholder = '',
  filterThreshold = 6,
  countLabel = '',
}) {
  if (!rows || rows.length === 0) {
    return emptyText ? `<p class="hint">${escapeHtml(emptyText)}</p>` : '';
  }

  const head = columns
    .map((col, i) => {
      const align = col.align ? ` ${col.align}` : '';
      const title = col.title ? ` title="${escapeHtml(col.title)}"` : '';
      return (
        `<th class="th-sortable${align}"${title}>` +
        `<button type="button" class="th-sort" data-sort="${i}" ` +
        `data-type="${escapeHtml(col.type ?? 'text')}">` +
        `${escapeHtml(col.label)}<span class="th-arrow" aria-hidden="true"></span>` +
        `</button></th>`
      );
    })
    .join('');

  const body = rows
    .map((row) => {
      const cells = columns
        .map((col, i) => {
          const cell = normalizeCell(row[i]);
          const align = col.align ? ` class="${col.align}"` : '';
          const value =
            cell.sort !== null && cell.sort !== undefined
              ? ` data-value="${escapeHtml(String(cell.sort))}"`
              : '';
          return `<td${align}${value}>${cell.html}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const tools =
    rows.length >= filterThreshold && filterPlaceholder
      ? `<div class="table-tools">` +
        `<input type="search" class="filter filter--table" data-table-filter="${escapeHtml(id)}" ` +
        `placeholder="${escapeHtml(filterPlaceholder)}" aria-label="${escapeHtml(filterPlaceholder)}">` +
        `<span class="hint table-count" data-table-count="${escapeHtml(id)}" ` +
        `data-count-label="${escapeHtml(countLabel)}"></span>` +
        `</div>`
      : '';

  return (
    tools +
    `<div class="table-scroll">` +
    `<table class="table table--dense" data-sortable id="${escapeHtml(id)}">` +
    `<thead><tr>${head}</tr></thead>` +
    `<tbody>${body}</tbody>` +
    `</table></div>`
  );
}

/**
 * Eseménykezelés. A rendezés és a szűrés a már kirajzolt sorokon dolgozik,
 * ezért a nézeteknek nem kell a sorok adatát a megjelenítés után is tartaniuk.
 */
export function mountTables(root) {
  for (const table of root.querySelectorAll('table[data-sortable]')) {
    const tbody = table.tBodies[0];
    if (!tbody) continue;

    const state = { column: null, direction: 'asc' };
    const filter = root.querySelector(`[data-table-filter="${CSS.escape(table.id)}"]`);
    const count = root.querySelector(`[data-table-count="${CSS.escape(table.id)}"]`);

    const allRows = () => [...tbody.rows];

    function updateCount() {
      if (!count) return;
      const rows = allRows();
      const shown = rows.filter((r) => !r.hidden).length;
      const label = count.dataset.countLabel || '';
      count.textContent = label
        ? label.replace('{n}', String(shown)).replace('{t}', String(rows.length))
        : `${shown} / ${rows.length}`;
    }

    function applyFilter() {
      const q = (filter?.value ?? '').trim().toLowerCase();
      for (const row of allRows()) {
        row.hidden = q ? !row.textContent.toLowerCase().includes(q) : false;
      }
      updateCount();
    }

    function applySort(index, type) {
      if (state.column === index) {
        state.direction = state.direction === 'asc' ? 'desc' : 'asc';
      } else {
        state.column = index;
        // A szöveges oszlop A-tól, a szám a legnagyobbtól indul.
        state.direction = type === 'number' ? 'desc' : 'asc';
      }

      const rows = allRows();
      const cells = rows.map((row) => {
        const td = row.cells[index];
        const raw = td?.dataset.value;
        return raw !== undefined ? [raw] : [td?.textContent?.trim() ?? ''];
      });
      const order = sortIndices(cells, 0, type, state.direction);
      const frag = document.createDocumentFragment();
      for (const i of order) frag.appendChild(rows[i]);
      tbody.appendChild(frag);

      for (const btn of table.querySelectorAll('.th-sort')) {
        const active = Number(btn.dataset.sort) === index;
        btn.classList.toggle('is-sorted', active);
        btn.dataset.dir = active ? state.direction : '';
        btn.closest('th')?.setAttribute(
          'aria-sort',
          active ? (state.direction === 'asc' ? 'ascending' : 'descending') : 'none'
        );
      }
    }

    for (const btn of table.querySelectorAll('.th-sort')) {
      btn.addEventListener('click', () =>
        applySort(Number(btn.dataset.sort), btn.dataset.type ?? 'text')
      );
    }

    filter?.addEventListener('input', applyFilter);
    updateCount();
  }
}
