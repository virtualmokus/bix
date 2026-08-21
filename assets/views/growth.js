import strings from '../strings.hu.js';
import { formatBandwidth, formatInt } from '../format.js';
import { cumulativeChart, barRow, escapeHtml } from '../chart.js';

const s = strings.growth;

export function bucketByYear(members) {
  const years = members
    .map((m) => m.first_seen)
    .filter(Boolean)
    .map((d) => Number(d.slice(0, 4)));

  if (years.length === 0) return [];

  const min = Math.min(...years);
  const max = Math.max(...years);
  const counts = new Map();
  for (const year of years) counts.set(year, (counts.get(year) ?? 0) + 1);

  const buckets = [];
  for (let year = min; year <= max; year++) {
    buckets.push({ label: String(year), value: counts.get(year) ?? 0 });
  }
  return buckets;
}

function countBy(items, key) {
  const counts = new Map();
  for (const item of items) counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
  return [...counts.entries()];
}

export function render(data) {
  const members = data.members ?? [];
  const ports = data.ports ?? [];

  const buckets = bucketByYear(members);
  const byBandwidth = countBy(ports, 'bandwidth_mbps').sort((a, b) => a[0] - b[0]);
  const byNode = countBy(ports, 'node').sort((a, b) => b[1] - a[1]);
  const maxBandwidth = Math.max(1, ...byBandwidth.map(([, count]) => count));
  const maxNode = Math.max(1, ...byNode.map(([, count]) => count));

  return (
    `<section class="section">` +
    `<p class="eyebrow">${escapeHtml(s.eyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.title)}</h2>` +
    `</section>` +
    `<section class="section reveal">` +
    `<p class="eyebrow">${escapeHtml(s.curveTitle)}</p>` +
    cumulativeChart({ buckets, width: 860, height: 200 }) +
    `<p class="note note--info">${escapeHtml(s.curveCaption)}</p>` +
    `</section>` +
    `<section class="section reveal">` +
    `<p class="eyebrow">${escapeHtml(s.bandwidthTitle)}</p>` +
    byBandwidth
      .map(([mbps, count]) =>
        barRow({
          label: `${formatBandwidth(mbps)} — ${formatInt(count)} port`,
          value: count,
          max: maxBandwidth,
        })
      )
      .join('') +
    `</section>` +
    `<section class="section reveal">` +
    `<p class="eyebrow">${escapeHtml(s.nodeTitle)}</p>` +
    byNode
      .map(([node, count]) =>
        barRow({ label: `${node} — ${formatInt(count)}`, value: count, max: maxNode })
      )
      .join('') +
    `<p class="note note--warning">${escapeHtml(s.viennaNote)}</p>` +
    `</section>`
  );
}
