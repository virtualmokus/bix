import { compareValues } from '../table.js';
import strings from '../i18n.js';
import { formatBandwidth, formatInt, formatPercent } from '../format.js';
import { escapeHtml } from '../chart.js';
import { memberBandwidth } from '../stats.js';
import { TYPE_COLORS } from './overview.js';

const s = strings.members;

// A főoldal által jelentett teljes portszám; a /statisztika ennél kevesebbet
// listáz, és ezt a különbséget láthatóvá kell tenni.
const TOTAL_PORTS_REPORTED = 188;

export function bandwidthClass(mbps) {
  if (mbps >= 100000) return 'bw-xl';
  if (mbps >= 10000) return 'bw-l';
  if (mbps >= 2000) return 'bw-m';
  return 'bw-s';
}

export function filterMembers(
  members,
  { query = '', node = '', bandwidth = '', policy = '', type = '' } = {}
) {
  const needle = String(query).trim().toLowerCase();

  return members.filter((member) => {
    if (needle) {
      const haystack = `${member.name} ${member.asn} ${member.network?.aka ?? ''}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (node && !member.ports.some((p) => p.node === node)) return false;
    if (bandwidth && !member.ports.some((p) => p.bandwidth_mbps === Number(bandwidth))) return false;
    if (policy && member.policy !== policy) return false;
    if (type && member.network?.type !== type) return false;
    return true;
  });
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

/**
 * Oszloponkénti rendezési kulcs. A szám és a szöveg külön kezelendő: a
 * hiányzó érték mindig a lista végére kerül, függetlenül az iránytól.
 */
export const SORT_KEYS = {
  name: { type: 'text', get: (m) => m.name },
  asn: { type: 'number', get: (m) => m.asn },
  type: { type: 'text', get: (m) => m.network?.type },
  scope: { type: 'text', get: (m) => m.network?.scope },
  node: { type: 'text', get: (m) => uniqueSorted(m.ports.map((p) => p.node)).join(', ') },
  bandwidth: { type: 'number', get: (m) => memberBandwidth(m) },
  policy: { type: 'text', get: (m) => m.policy ?? m.network?.policy },
  prefixes: { type: 'number', get: (m) => m.network?.prefixes4 },
  ix: { type: 'number', get: (m) => m.network?.ix_count },
  v6: { type: 'number', get: (m) => (m.ipv6 ? 1 : 0) },
  rs: { type: 'number', get: (m) => (m.is_rs_peer ? 1 : 0) },
};

export function sortMembers(members, column = 'bandwidth', direction = 'desc') {
  const key = SORT_KEYS[column] ?? SORT_KEYS.bandwidth;

  return [...members].sort((a, b) => {
    const va = key.get(a);
    const vb = key.get(b);

    // Ugyanaz az összehasonlítás, mint az összes többi táblán: egy szabály,
    // egy helyen. A döntetlent az ASN bontja, hogy a sorrend stabil legyen.
    return compareValues(va, vb, key.type, direction) || a.asn - b.asn;
  });
}

/** Rendezhető oszlopfej. A gomb billentyűzetről is elérhető. */
function head(column, label, title = '', extraClass = '') {
  return (
    `<th class="${extraClass}"${title ? ` title="${escapeHtml(title)}"` : ''}>` +
    `<button type="button" class="th-sort" data-sort="${column}">` +
    `${escapeHtml(label)}<span class="th-arrow" aria-hidden="true"></span></button></th>`
  );
}

function select(id, allLabel, options, format = (v) => v) {
  const items = options
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(format(value))}</option>`)
    .join('');
  return `<select id="${id}" class="filter"><option value="">${escapeHtml(allLabel)}</option>${items}</select>`;
}

function matrix(ports) {
  const cells = ports
    .map((port) => {
      const title = `${port.member} — ${port.node} — ${formatBandwidth(port.bandwidth_mbps)}`;
      return `<i class="cell ${bandwidthClass(port.bandwidth_mbps)}" title="${escapeHtml(title)}"></i>`;
    })
    .join('');

  const legend =
    `<div class="matrix-legend"><span>1G</span>` +
    ['bw-s', 'bw-m', 'bw-l', 'bw-xl'].map((c) => `<i class="${c}"></i>`).join('') +
    `<span>300G</span></div>`;

  return `<div class="matrix">${cells}</div>${legend}`;
}

function tick(on) {
  return on ? '<span class="tick" aria-label="yes">●</span>' : '<span class="tick-off">·</span>';
}

export function rows(members) {
  if (members.length === 0) {
    return `<tr><td colspan="11">${escapeHtml(s.noResults)}</td></tr>`;
  }

  return members
    .map((member) => {
      const nodes = uniqueSorted(member.ports.map((p) => p.node));
      const total = memberBandwidth(member);
      const net = member.network;
      const onlyPdb = member.sources.length === 1 && member.sources[0] === 'peeringdb';
      const badge = onlyPdb ? ` <span class="badge">${escapeHtml(s.onlyPeeringdb)}</span>` : '';
      // Néhány aka-mező kilenc korábbi márkanevet sorol; CSS-ben két sorra
      // vágjuk, a teljes szöveg a tooltipben marad meg.
      const aka = net?.aka
        ? `<span class="aka" title="${escapeHtml(net.aka)}">${escapeHtml(net.aka)}</span>`
        : '';

      return (
        `<tr>` +
        `<td class="col-name">${escapeHtml(member.name)}${badge}${aka}</td>` +
        `<td class="num asn">${member.asn}</td>` +
        `<td class="col-type">` +
        (net?.type
          ? `<span class="type-dot" style="background:${TYPE_COLORS[net.type] ?? 'var(--text-muted)'}"></span>` +
            escapeHtml(net.type)
          : '—') +
        `</td>` +
        `<td>${escapeHtml(net?.scope ?? '—')}</td>` +
        `<td class="col-node">${escapeHtml(nodes.join(', ') || '—')}</td>` +
        `<td class="num col-cap">${total ? formatBandwidth(total) : '—'}` +
        (member.ports.length > 1
          ? ` <span class="ports-n" title="${member.ports.length} ports">${member.ports.length}×</span>`
          : '') +
        `</td>` +
        `<td>${escapeHtml(member.policy ?? net?.policy ?? '—')}</td>` +
        `<td class="num">${net?.prefixes4 ? formatInt(net.prefixes4) : '—'}</td>` +
        `<td class="num">${net?.ix_count ? formatInt(net.ix_count) : '—'}</td>` +
        `<td class="c">${tick(Boolean(member.ipv6))}</td>` +
        `<td class="c">${tick(Boolean(member.is_rs_peer))}</td>` +
        `</tr>`
      );
    })
    .join('');
}

export function render(data) {
  const members = sortMembers(data.members ?? []);
  const ports = data.ports ?? [];
  const coverage = (ports.length / TOTAL_PORTS_REPORTED) * 100;

  const warning = s.coverageWarning
    .replace('{shown}', formatInt(ports.length))
    .replace('{total}', formatInt(TOTAL_PORTS_REPORTED))
    .replace('{percent}', formatPercent(coverage, 0).replace('%', ''));

  const c = s.columns;

  return (
    `<section class="section">` +
    `<p class="eyebrow">${escapeHtml(s.eyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.title)}</h2>` +
    `<p class="lede">${escapeHtml(s.lede)}</p>` +
    `<p class="note note--warning">${escapeHtml(warning)}</p>` +
    `<details class="explainer"><summary>${escapeHtml(strings.showMore)}</summary>` +
    `<p><strong>${escapeHtml(c.asn)}.</strong> ${escapeHtml(strings.glossary.asn)}</p>` +
    `<p><strong>${escapeHtml(c.policy)}.</strong> ${escapeHtml(strings.glossary.peering)}</p>` +
    `<p><strong>${escapeHtml(c.prefixes)}.</strong> ${escapeHtml(strings.glossary.prefixes)}</p>` +
    `<p><strong>${escapeHtml(c.rs)}.</strong> ${escapeHtml(strings.glossary.routeServer)}</p>` +
    `</details>` +
    `</section>` +

    `<section class="section reveal">` +
    `<p class="eyebrow">${escapeHtml(s.matrixTitle)}</p>` +
    `<p class="hint">${escapeHtml(s.matrixHint)}</p>` +
    matrix(ports) +
    `</section>` +

    `<section class="section">` +
    `<div class="filters">` +
    `<input id="f-query" class="filter" type="search" placeholder="${escapeHtml(s.searchPlaceholder)}">` +
    select('f-type', s.allTypes, uniqueSorted(members.map((m) => m.network?.type))) +
    select('f-node', s.allNodes, uniqueSorted(ports.map((p) => p.node))) +
    select('f-bandwidth', s.allBandwidths,
      [...new Set(ports.map((p) => p.bandwidth_mbps))].sort((a, b) => b - a), formatBandwidth) +
    select('f-policy', s.allPolicies, uniqueSorted(members.map((m) => m.policy))) +
    `<button type="button" id="f-reset" class="btn btn--ghost">${escapeHtml(s.reset)}</button>` +
    `</div>` +
    `<p class="hint" id="member-count">${escapeHtml(
      s.showing.replace('{n}', formatInt(members.length)).replace('{t}', formatInt(members.length))
    )}</p>` +
    `<div class="table-scroll"><table class="table table--dense"><thead><tr>` +
    head('name', c.name) + head('asn', c.asn) +
    head('type', c.type) + head('scope', c.scope) +
    head('node', c.node) + head('bandwidth', c.bandwidth) +
    head('policy', c.policy) +
    head('prefixes', c.prefixes, s.legend.prefixes) +
    head('ix', c.ix, s.legend.ix) +
    head('v6', c.v6, s.legend.v6, 'c') +
    head('rs', c.rs, s.legend.rs, 'c') +
    `</tr></thead><tbody id="member-rows">${rows(members)}</tbody></table></div>` +
    `<p class="hint">${escapeHtml(s.legend.prefixes)} · ${escapeHtml(s.legend.ix)}</p>` +
    `</section>`
  );
}

export function mount(root, data) {
  const tbody = root.querySelector('#member-rows');
  const counter = root.querySelector('#member-count');
  const all = data.members ?? [];
  const ids = ['f-query', 'f-type', 'f-node', 'f-bandwidth', 'f-policy'];
  const inputs = ids.map((id) => root.querySelector(`#${id}`));

  let column = 'bandwidth';
  let direction = 'desc';

  function markHeaders() {
    for (const btn of root.querySelectorAll('.th-sort')) {
      const active = btn.dataset.sort === column;
      btn.classList.toggle('is-sorted', active);
      btn.dataset.dir = active ? direction : '';
      btn.closest('th').setAttribute(
        'aria-sort',
        active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'
      );
    }
  }

  function apply() {
    const [query, type, node, bandwidth, policy] = inputs.map((el) => el.value);
    const filtered = sortMembers(
      filterMembers(all, { query, type, node, bandwidth, policy }),
      column,
      direction
    );
    tbody.innerHTML = rows(filtered);
    counter.textContent = s.showing
      .replace('{n}', formatInt(filtered.length))
      .replace('{t}', formatInt(all.length));
    markHeaders();
  }

  for (const el of inputs) el.addEventListener('input', apply);

  for (const btn of root.querySelectorAll('.th-sort')) {
    btn.addEventListener('click', () => {
      const next = btn.dataset.sort;
      // Ugyanarra az oszlopra kattintva irányt vált; újra kattintva vissza.
      if (next === column) {
        direction = direction === 'desc' ? 'asc' : 'desc';
      } else {
        column = next;
        // A szöveges oszlopok A-tól, a számok a legnagyobbtól indulnak.
        direction = SORT_KEYS[next]?.type === 'text' ? 'asc' : 'desc';
      }
      apply();
    });
  }

  root.querySelector('#f-reset')?.addEventListener('click', () => {
    for (const el of inputs) el.value = '';
    column = 'bandwidth';
    direction = 'desc';
    apply();
  });

  markHeaders();
}
