import strings from '../strings.en.js';
import { formatInt } from '../format.js';
import { escapeHtml } from '../chart.js';

const s = strings.map;

// A vonal színe az átfedés erejét kódolja. A küszöbök az eloszláshoz
// igazodnak: 41 a legerősebb (DE-CIX), a hosszú farok 1-2 közös tag.
const LINE_BUCKETS = [
  { min: 20, color: '#B26A00', weight: 2.4, label: '20+' },
  { min: 10, color: '#7C5CBF', weight: 1.8, label: '10–19' },
  { min: 5, color: '#1F6C9F', weight: 1.3, label: '5–9' },
  { min: 2, color: '#7FB6E0', weight: 0.9, label: '2–4' },
];

export function lineStyle(shared) {
  for (const bucket of LINE_BUCKETS) {
    if (shared >= bucket.min) return bucket;
  }
  return { min: 0, color: '#C9D6E4', weight: 0.6, label: '1' };
}

export function markerRadius(shared) {
  return Math.max(3, Math.min(14, 2 + Math.sqrt(shared) * 1.8));
}

export function render(data) {
  const exchanges = data.global?.exchanges ?? [];
  const withGeo = exchanges.filter((e) => e.lat != null);
  const cities = new Set(withGeo.map((e) => `${e.city}|${e.country}`));

  const legendLines = LINE_BUCKETS.map(
    (b) => `<span class="map-legend-item"><i style="background:${b.color}"></i>${b.label}</span>`
  ).join('');

  return (
    `<section class="section">` +
    `<p class="eyebrow">${escapeHtml(s.eyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.title)}</h2>` +
    `<p class="hint">${escapeHtml(
      s.intro.replace('{n}', formatInt(withGeo.length)).replace('{c}', formatInt(cities.size))
    )}</p>` +
    `<div class="map-controls">` +
    `<label for="map-min">${escapeHtml(s.minShared)}</label>` +
    `<select id="map-min" class="filter">` +
    [1, 2, 3, 5, 10, 20]
      .map((v) => `<option value="${v}"${v === 3 ? ' selected' : ''}>${v}</option>`)
      .join('') +
    `</select>` +
    `<span class="hint" style="margin:0">${escapeHtml(s.sharedSuffix)}</span>` +
    `<span class="map-legend">${escapeHtml(s.dotLegend)} · ${escapeHtml(s.lineLegend)}: ${legendLines}</span>` +
    `</div>` +
    `<div id="map" class="map-canvas"></div>` +
    `<p class="hint">${escapeHtml(s.attribution)}</p>` +
    `</section>`
  );
}

export function mount(root, data) {
  const container = root.querySelector('#map');
  if (!container) return;

  if (typeof window === 'undefined' || !window.L) {
    container.outerHTML = `<p class="note note--warning">${escapeHtml(s.fallback)}</p>`;
    return;
  }

  const L = window.L;
  const exchanges = (data.global?.exchanges ?? []).filter((e) => e.lat != null);
  const home = exchanges.find((e) => e.id === data.global.home_ix_id);

  const map = L.map(container, { worldCopyJump: true }).setView([47.5, 19.05], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 12,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  const layer = L.layerGroup().addTo(map);

  function draw(minShared) {
    layer.clearLayers();

    for (const e of exchanges) {
      if (e.id === data.global.home_ix_id) continue;
      if (e.shared < minShared) continue;

      if (home) {
        const style = lineStyle(e.shared);
        L.polyline(
          [[home.lat, home.lng], [e.lat, e.lng]],
          { color: style.color, weight: style.weight, opacity: 0.55 }
        ).addTo(layer);
      }

      L.circleMarker([e.lat, e.lng], {
        radius: markerRadius(e.shared),
        color: lineStyle(e.shared).color,
        fillColor: lineStyle(e.shared).color,
        fillOpacity: 0.65,
        weight: 1,
      })
        .bindPopup(
          `<strong>${escapeHtml(e.name)}</strong><br>` +
          `${escapeHtml(e.city ?? '')}, ${escapeHtml(e.country ?? '')}<br>` +
          `${formatInt(e.shared)} ${escapeHtml(s.popup.shared)}<br>` +
          `${formatInt(e.net_count ?? 0)} ${escapeHtml(s.popup.total)}`
        )
        .addTo(layer);
    }

    if (home) {
      L.circleMarker([home.lat, home.lng], {
        radius: 9,
        color: '#9F2F2D',
        fillColor: '#9F2F2D',
        fillOpacity: 0.9,
        weight: 2,
      })
        .bindPopup(`<strong>BIX — Budapest</strong>`)
        .addTo(layer);
    }
  }

  const select = root.querySelector('#map-min');
  draw(Number(select.value));
  select.addEventListener('input', () => draw(Number(select.value)));
}
