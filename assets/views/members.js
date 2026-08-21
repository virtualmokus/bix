import strings from '../strings.hu.js';
import { formatBandwidth, formatInt, formatPercent } from '../format.js';
import { escapeHtml } from '../chart.js';

const s = strings.members;

// A főoldal által jelentett teljes portszám; a /statisztika ennél kevesebbet
// listáz, és ezt a különbséget láthatóvá kell tenni (spec 3.2).
const TOTAL_PORTS_REPORTED = 188;

export function bandwidthClass(mbps) {
  if (mbps >= 100000) return 'bw-xl';
  if (mbps >= 10000) return 'bw-l';
  if (mbps >= 2000) return 'bw-m';
  return 'bw-s';
}

export function filterMembers(members, { query = '', node = '', bandwidth = '', policy = '' } = {}) {
  const needle = String(query).trim().toLowerCase();

  return members.filter((member) => {
    if (needle) {
      const haystack = `${member.name} ${member.asn}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (node && !member.ports.some((p) => p.node === node)) return false;
    if (bandwidth && !member.ports.some((p) => p.bandwidth_mbps === Number(bandwidth))) return false;
    if (policy && member.policy !== policy) return false;
    return true;
  });
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

function rows(members) {
  if (members.length === 0) {
    return `<tr><td colspan="5">${escapeHtml(s.noResults)}</td></tr>`;
  }

  return members
    .map((member) => {
      const nodes = uniqueSorted(member.ports.map((p) => p.node)).join(', ');
      const bandwidths = member.ports.map((p) => formatBandwidth(p.bandwidth_mbps)).join(', ');
      const onlyPdb = member.sources.length === 1 && member.sources[0] === 'peeringdb';
      const badge = onlyPdb ? ` <span class="badge">${escapeHtml(s.onlyPeeringdb)}</span>` : '';

      return (
        `<tr>` +
        `<td>${escapeHtml(member.name)}${badge}</td>` +
        `<td class="num asn">AS${member.asn}</td>` +
        `<td>${escapeHtml(nodes || '—')}</td>` +
        `<td class="num">${escapeHtml(bandwidths || '—')}</td>` +
        `<td>${escapeHtml(member.policy || '—')}</td>` +
        `</tr>`
      );
    })
    .join('');
}

export function render(data) {
  const members = data.members ?? [];
  const ports = data.ports ?? [];
  const coverage = TOTAL_PORTS_REPORTED > 0 ? (ports.length / TOTAL_PORTS_REPORTED) * 100 : 0;

  const warning = s.coverageWarning
    .replace('{shown}', formatInt(ports.length))
    .replace('{total}', formatInt(TOTAL_PORTS_REPORTED))
    .replace('{percent}', formatPercent(coverage, 0).replace('%', ''));

  return (
    `<section class="section">` +
    `<p class="eyebrow">${escapeHtml(s.eyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.title)}</h2>` +
    `<p class="note note--warning reveal">${escapeHtml(warning)}</p>` +
    `</section>` +
    `<section class="section reveal">` +
    `<p class="eyebrow">${escapeHtml(s.matrixTitle)}</p>` +
    `<p class="hint">${escapeHtml(s.matrixHint)}</p>` +
    matrix(ports) +
    `</section>` +
    `<section class="section">` +
    `<div class="filters">` +
    `<input id="f-query" class="filter" type="search" placeholder="${escapeHtml(s.searchPlaceholder)}">` +
    select('f-node', s.allNodes, uniqueSorted(ports.map((p) => p.node))) +
    select(
      'f-bandwidth',
      s.allBandwidths,
      [...new Set(ports.map((p) => p.bandwidth_mbps))].sort((a, b) => a - b),
      formatBandwidth
    ) +
    select('f-policy', s.allPolicies, uniqueSorted(members.map((m) => m.policy))) +
    `</div>` +
    `<table class="table"><thead><tr>` +
    `<th>${escapeHtml(s.columns.name)}</th>` +
    `<th>${escapeHtml(s.columns.asn)}</th>` +
    `<th>${escapeHtml(s.columns.node)}</th>` +
    `<th>${escapeHtml(s.columns.bandwidth)}</th>` +
    `<th>${escapeHtml(s.columns.policy)}</th>` +
    `</tr></thead><tbody id="member-rows">${rows(members)}</tbody></table>` +
    `</section>`
  );
}

export function mount(root, data) {
  const tbody = root.querySelector('#member-rows');
  const inputs = ['f-query', 'f-node', 'f-bandwidth', 'f-policy'].map((id) =>
    root.querySelector(`#${id}`)
  );

  function apply() {
    const [query, node, bandwidth, policy] = inputs.map((el) => el.value);
    tbody.innerHTML = rows(filterMembers(data.members ?? [], { query, node, bandwidth, policy }));
  }

  for (const el of inputs) el.addEventListener('input', apply);
}
