import strings from '../strings.en.js';
import { formatBandwidth, formatInt, formatPercent } from '../format.js';
import { escapeHtml } from '../chart.js';
import { memberBandwidth } from '../stats.js';

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

/** Alapértelmezett rendezés: együttes sávszélesség szerint csökkenően. */
export function sortMembers(members) {
  return [...members].sort(
    (a, b) => memberBandwidth(b) - memberBandwidth(a) || a.asn - b.asn
  );
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
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
      const aka = net?.aka ? `<span class="aka">${escapeHtml(net.aka)}</span>` : '';

      return (
        `<tr>` +
        `<td class="col-name">${escapeHtml(member.name)}${badge}${aka}</td>` +
        `<td class="num asn">${member.asn}</td>` +
        `<td>${escapeHtml(net?.type ?? '—')}</td>` +
        `<td>${escapeHtml(net?.scope ?? '—')}</td>` +
        `<td class="col-node">${escapeHtml(nodes.join(', ') || '—')}</td>` +
        `<td class="num">${total ? formatBandwidth(total) : '—'}` +
        (member.ports.length > 1 ? `<span class="ports-n">${member.ports.length}×</span>` : '') +
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
    `<p class="note note--warning">${escapeHtml(warning)}</p>` +
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
    `</div>` +
    `<p class="hint" id="member-count">${escapeHtml(
      s.showing.replace('{n}', formatInt(members.length)).replace('{t}', formatInt(members.length))
    )}</p>` +
    `<div class="table-scroll"><table class="table table--dense"><thead><tr>` +
    `<th>${escapeHtml(c.name)}</th><th>${escapeHtml(c.asn)}</th>` +
    `<th>${escapeHtml(c.type)}</th><th>${escapeHtml(c.scope)}</th>` +
    `<th>${escapeHtml(c.node)}</th><th>${escapeHtml(c.bandwidth)}</th>` +
    `<th>${escapeHtml(c.policy)}</th>` +
    `<th title="${escapeHtml(s.legend.prefixes)}">${escapeHtml(c.prefixes)}</th>` +
    `<th title="${escapeHtml(s.legend.ix)}">${escapeHtml(c.ix)}</th>` +
    `<th class="c" title="${escapeHtml(s.legend.v6)}">${escapeHtml(c.v6)}</th>` +
    `<th class="c" title="${escapeHtml(s.legend.rs)}">${escapeHtml(c.rs)}</th>` +
    `</tr></thead><tbody id="member-rows">${rows(members)}</tbody></table></div>` +
    `<p class="hint">${escapeHtml(s.legend.prefixes)} · ${escapeHtml(s.legend.ix)}</p>` +
    `</section>`
  );
}

export function mount(root, data) {
  const tbody = root.querySelector('#member-rows');
  const counter = root.querySelector('#member-count');
  const all = sortMembers(data.members ?? []);
  const ids = ['f-query', 'f-type', 'f-node', 'f-bandwidth', 'f-policy'];
  const inputs = ids.map((id) => root.querySelector(`#${id}`));

  function apply() {
    const [query, type, node, bandwidth, policy] = inputs.map((el) => el.value);
    const filtered = filterMembers(all, { query, type, node, bandwidth, policy });
    tbody.innerHTML = rows(filtered);
    counter.textContent = s.showing
      .replace('{n}', formatInt(filtered.length))
      .replace('{t}', formatInt(all.length));
  }

  for (const el of inputs) el.addEventListener('input', apply);
}
