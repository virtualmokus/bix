import strings from '../strings.hu.js';
import icons from '../icons.js';
import { formatDecimal, formatInt, formatPercent, formatRelative } from '../format.js';
import { concurrent4kStreams, gigabytesPerSecond, utilizationPercent } from '../humanize.js';
import { areaChart, barRow, escapeHtml } from '../chart.js';

const MIN_POINTS_FOR_CHART = 4;
const s = strings.now;

// Az `--index` a léptetett belépéshez kell: a három kártya nem egyszerre
// érkezik, hanem 60ms-onként (lásd style.css, .human-card.is-visible).
function humanCard(index, icon, value, text) {
  return (
    `<div class="card human-card reveal" style="--index:${index}">` +
    `<span class="human-icon">${icon}</span>` +
    `<div class="human-value">${value}</div>` +
    `<p class="human-text">${escapeHtml(text)}</p>` +
    `</div>`
  );
}

export function render(data) {
  const rows = data.traffic ?? [];

  if (rows.length === 0) {
    return (
      `<section class="section"><p class="note note--warning">` +
      escapeHtml(strings.footer.stale.replace('{when}', '—')) +
      `</p></section>`
    );
  }

  const latest = rows[rows.length - 1];
  const util = utilizationPercent(latest.current_gbps, latest.capacity_gbps);

  const chartOrNotice =
    rows.length >= MIN_POINTS_FOR_CHART
      ? areaChart({
          points: rows.map((row, i) => ({ x: i, y: row.current_gbps })),
          width: 720,
          height: 140,
        })
      : `<div class="note note--info reveal">` +
        `<strong>${escapeHtml(s.seriesStarting)}</strong><br>` +
        escapeHtml(
          s.seriesStartingBody
            .replace('{count}', formatInt(rows.length))
            .replace('{since}', formatRelative(rows[0].ts, new Date()))
        ) +
        `</div>`;

  return (
    `<section class="section hero">` +
    `<p class="eyebrow">${escapeHtml(s.eyebrow)}</p>` +
    `<div class="hero-number mono">${formatDecimal(latest.current_gbps)}` +
    `<span class="hero-unit">${escapeHtml(s.unit)}</span></div>` +
    chartOrNotice +
    `</section>` +
    `<section class="section reveal">` +
    `<p class="eyebrow">${escapeHtml(s.utilization)}</p>` +
    barRow({ label: s.current, value: latest.current_gbps, max: latest.capacity_gbps }) +
    barRow({ label: s.peak, value: latest.peak_gbps, max: latest.capacity_gbps }) +
    barRow({
      label: s.capacity,
      value: latest.capacity_gbps,
      max: latest.capacity_gbps,
      accent: 'var(--border)',
    }) +
    `<p class="note note--warning reveal">${icons.info}<strong>${escapeHtml(s.didYouKnow)}</strong> ` +
    `${escapeHtml(s.capacityNote)} (${formatPercent(util)})</p>` +
    `</section>` +
    `<section class="section">` +
    `<p class="eyebrow">${escapeHtml(s.humanScale)}</p>` +
    `<div class="human-grid">` +
    humanCard(
      0,
      icons.stream,
      formatInt(concurrent4kStreams(latest.current_gbps)),
      'egyidejű 4K stream férne bele a jelenlegi forgalomba'
    ) +
    humanCard(
      1,
      icons.storage,
      `${formatInt(Math.round(gigabytesPerSecond(latest.current_gbps)))} GB`,
      'adat halad át minden egyes másodpercben'
    ) +
    humanCard(
      2,
      icons.network,
      formatInt(latest.networks),
      `hálózat kapcsolódik a BIX-hez, ${formatInt(latest.ports)} porton keresztül`
    ) +
    `</div>` +
    `</section>`
  );
}
