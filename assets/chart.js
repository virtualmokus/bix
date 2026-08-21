export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function scale(points, width, height, pad = 4) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY || 1;

  return points.map((p) => ({
    x: ((p.x - minX) / spanX) * width,
    y: height - pad - (p.y / spanY) * (height - pad * 2),
  }));
}

export function areaChart({ points, width, height, accent = 'var(--blue-fg)' }) {
  const open =
    `<svg viewBox="0 0 ${width} ${height}" class="chart" preserveAspectRatio="none" role="img">`;
  if (points.length === 0) return `${open}</svg>`;

  const scaled = scale(points, width, height);
  const line = scaled
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const last = scaled[scaled.length - 1];

  return (
    open +
    `<path d="${area}" fill="${accent}" fill-opacity="0.08"/>` +
    `<path d="${line}" fill="none" stroke="${accent}" stroke-width="2" ` +
    `stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` +
    `<circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="3" fill="${accent}"/>` +
    `</svg>`
  );
}

// A kitöltés `--fill` arányként megy át (0–1), nem `width`-ként: a szélesség
// animálása elrendezés-újraszámolást vált ki minden képkockán. A CSS ebből
// `transform: scaleX()`-et csinál, ami a GPU-n fut.
/**
 * Egy vízszintes sáv. A `display` a sáv mellé kiírt szám — enélkül a
 * diagram olvashatatlan, mert csak arányt mutat, értéket nem.
 */
export function barRow({ label, value, max, accent = 'var(--blue-fg)', display }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const text = display === undefined ? String(value) : display;
  return (
    `<div class="bar-row">` +
    `<span class="bar-label">${escapeHtml(label)}</span>` +
    `<span class="bar-track">` +
    `<span class="bar-fill" style="--fill:${ratio.toFixed(3)};background:${accent}"></span>` +
    `</span>` +
    `<span class="bar-value mono">${escapeHtml(text)}</span>` +
    `</div>`
  );
}

export function cumulativeChart({ buckets, width, height }) {
  const open = `<svg viewBox="0 0 ${width} ${height}" class="chart" role="img">`;
  if (buckets.length === 0) return `${open}</svg>`;

  let running = 0;
  const points = buckets.map((bucket, i) => {
    running += bucket.value;
    return { x: i, y: running };
  });

  const scaled = scale(points, width, height - 18);
  const line = scaled
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const labels = buckets
    .map((bucket, i) => {
      const isEdge = i === 0 || i === buckets.length - 1;
      if (!isEdge && i % 4 !== 0) return '';
      const anchor = i === 0 ? 'start' : i === buckets.length - 1 ? 'end' : 'middle';
      return (
        `<text x="${scaled[i].x.toFixed(1)}" y="${height - 4}" font-size="10" ` +
        `fill="var(--text-muted)" text-anchor="${anchor}">${escapeHtml(bucket.label)}</text>`
      );
    })
    .join('');

  return (
    open +
    `<path d="${line} L${width},${height - 18} L0,${height - 18} Z" ` +
    `fill="var(--blue-fg)" fill-opacity="0.08"/>` +
    `<path d="${line}" fill="none" stroke="var(--blue-fg)" stroke-width="2" stroke-linejoin="round"/>` +
    labels +
    `</svg>`
  );
}
