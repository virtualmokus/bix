export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Minden vonaldiagram tengelyekkel rajzolódik: bal oldalt Y-értékek,
// alul X-címkék. Tengely nélküli görbe csak dekoráció — itt tilos.
const PAD = { left: 52, right: 14, top: 8, bottom: 22 };

function niceMax(value) {
  if (value <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(value));
  const norm = value / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

function yAxis(maxY, plotW, plotH, format) {
  const ticks = [0, 0.5, 1].map((f) => f * maxY);
  return ticks
    .map((v) => {
      const y = PAD.top + plotH - (v / maxY) * plotH;
      return (
        `<line x1="${PAD.left}" y1="${y.toFixed(1)}" x2="${PAD.left + plotW}" y2="${y.toFixed(1)}" ` +
        `stroke="var(--border)" stroke-width="1"/>` +
        `<text x="${PAD.left - 8}" y="${(y + 3).toFixed(1)}" font-size="10" ` +
        `fill="var(--text-muted)" text-anchor="end" font-family="var(--font-mono)">${escapeHtml(format(v))}</text>`
      );
    })
    .join('');
}

/**
 * Területdiagram tengelyekkel.
 * points: [{x, y}] nyers értékek · yFormat: érték → tengelyfelirat
 * xLabels: [{ x, label }] — a points x-tartományában lévő pontokhoz.
 */
export function areaChart({
  points,
  width,
  height,
  accent = 'var(--blue-fg)',
  yFormat = (v) => String(Math.round(v)),
  xLabels = [],
}) {
  const open = `<svg viewBox="0 0 ${width} ${height}" class="chart" role="img">`;
  if (points.length === 0) return `${open}</svg>`;

  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const xs = points.map((p) => p.x);
  const minX = Math.min(...xs);
  const spanX = Math.max(...xs) - minX || 1;
  const maxY = niceMax(Math.max(...points.map((p) => p.y)));

  const sx = (x) => PAD.left + ((x - minX) / spanX) * plotW;
  const sy = (y) => PAD.top + plotH - (y / maxY) * plotH;

  const scaled = points.map((p) => ({ x: sx(p.x), y: sy(p.y) }));
  const line = scaled
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const base = PAD.top + plotH;
  const last = scaled[scaled.length - 1];

  const xAxis = xLabels
    .map(({ x, label }) => {
      const anchor = x <= minX ? 'start' : x >= minX + spanX ? 'end' : 'middle';
      return (
        `<text x="${sx(x).toFixed(1)}" y="${height - 6}" font-size="10" ` +
        `fill="var(--text-muted)" text-anchor="${anchor}">${escapeHtml(label)}</text>`
      );
    })
    .join('');

  return (
    open +
    yAxis(maxY, plotW, plotH, yFormat) +
    `<path d="${line} L${last.x.toFixed(1)},${base} L${PAD.left},${base} Z" fill="${accent}" fill-opacity="0.08"/>` +
    `<path d="${line}" fill="none" stroke="${accent}" stroke-width="2" ` +
    `stroke-linejoin="round" stroke-linecap="round"/>` +
    `<circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="3" fill="${accent}"/>` +
    xAxis +
    `</svg>`
  );
}

/**
 * Vízszintes sáv kiírt értékkel. A `display` kötelezően megjelenik a sáv
 * mellett — érték nélküli sáv csak arányt mutat, azt itt nem engedjük.
 */
export function barRow({ label, value, max, accent = 'var(--blue-fg)', display, strong = false }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const text = display === undefined ? String(value) : display;
  return (
    `<div class="bar-row${strong ? ' bar-row--strong' : ''}">` +
    `<span class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span>` +
    `<span class="bar-track">` +
    `<span class="bar-fill" style="--fill:${ratio.toFixed(3)};background:${accent}"></span>` +
    `</span>` +
    `<span class="bar-value mono">${escapeHtml(text)}</span>` +
    `</div>`
  );
}

/** Kumulatív görbe tengelyekkel: X az évek, Y a going összeg. */
export function cumulativeChart({ buckets, width, height, yFormat = (v) => String(Math.round(v)) }) {
  const open = `<svg viewBox="0 0 ${width} ${height}" class="chart" role="img">`;
  if (buckets.length === 0) return `${open}</svg>`;

  let running = 0;
  const points = buckets.map((bucket, i) => {
    running += bucket.value;
    return { x: i, y: running };
  });

  const xLabels = buckets
    .map((bucket, i) => ({ i, label: bucket.label }))
    .filter(({ i }) => i === 0 || i === buckets.length - 1 || i % 4 === 0)
    .map(({ i, label }) => ({ x: i, label }));

  return areaChart({ points, width, height, yFormat, xLabels });
}
