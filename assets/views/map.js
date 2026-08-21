import strings from '../strings.en.js';
import { formatInt } from '../format.js';
import { escapeHtml } from '../chart.js';

const s = strings.map;

// A vonal színe az átfedés erejét kódolja. A küszöbök a tényleges
// eloszláshoz igazodnak: 41 a legerősebb, a hosszú farok 1-2 közös tag.
const LINE_BUCKETS = [
  { min: 20, color: '#B26A00', weight: 2.6, label: '20+' },
  { min: 10, color: '#7C5CBF', weight: 2.0, label: '10–19' },
  { min: 5, color: '#1F6C9F', weight: 1.4, label: '5–9' },
  { min: 2, color: '#3D9970', weight: 1.0, label: '2–4' },
];

export function lineStyle(shared) {
  for (const bucket of LINE_BUCKETS) {
    if (shared >= bucket.min) return bucket;
  }
  return { min: 0, color: '#9FB3C8', weight: 0.7, label: '1' };
}

export function markerRadius(shared) {
  return Math.max(3.5, Math.min(15, 2.5 + Math.sqrt(shared) * 1.9));
}

/** Szűrés a vezérlők állapota szerint. Tiszta függvény. */
export function filterExchanges(exchanges, { minShared = 1, region = '', asn = '' } = {}) {
  const wanted = asn ? Number(asn) : null;
  return exchanges.filter((e) => {
    if (e.shared < minShared) return false;
    if (region && e.region !== region) return false;
    if (wanted && !e.asns.includes(wanted)) return false;
    return true;
  });
}

/**
 * Melyik csomópontok osztoznak ugyanazokon a hálózatokon a kiválasztottal?
 * Az átfedés a közös ASN-ek száma — ez köti össze például Frankfurtot
 * Béccsel, függetlenül attól, hogy mindkettő a BIX-hez is kapcsolódik.
 */
export function relatedExchanges(selected, all, limit = 8) {
  const own = new Set(selected.asns ?? []);
  if (own.size === 0) return [];

  return all
    .filter((e) => e.id !== selected.id)
    .map((e) => ({ exchange: e, overlap: (e.asns ?? []).filter((a) => own.has(a)).length }))
    .filter((r) => r.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || (b.exchange.net_count ?? 0) - (a.exchange.net_count ?? 0))
    .slice(0, limit);
}

function option(value, label, selected) {
  return `<option value="${escapeHtml(value)}"${selected ? ' selected' : ''}>${escapeHtml(label)}</option>`;
}

export function render(data) {
  const exchanges = data.global?.exchanges ?? [];
  const withGeo = exchanges.filter((e) => e.lat != null);
  const cities = new Set(withGeo.map((e) => `${e.city}|${e.country}`));
  const regions = [...new Set(exchanges.map((e) => e.region).filter(Boolean))].sort();

  // Csak azok a tagok kerülnek a listába, akik legalább egy külföldi
  // csomóponton is jelen vannak — a többinél a szűrő üres térképet adna.
  const homeId = data.global?.home_ix_id;
  const abroad = new Set();
  for (const e of exchanges) {
    if (e.id === homeId) continue;
    for (const a of e.asns ?? []) abroad.add(a);
  }
  const memberOptions = (data.members ?? [])
    .filter((m) => abroad.has(m.asn))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => option(m.asn, `${m.name} (AS${m.asn})`, false))
    .join('');

  const legendLines = LINE_BUCKETS.map(
    (b) => `<span class="map-legend-item"><i style="background:${b.color}"></i>${b.label}</span>`
  ).join('');

  return (
    `<section class="section">` +
    `<p class="eyebrow">${escapeHtml(s.eyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.title)}</h2>` +
    `<p class="lede">${escapeHtml(
      s.intro.replace('{n}', formatInt(withGeo.length)).replace('{c}', formatInt(cities.size))
    )}</p>` +
    `<details class="explainer"><summary>${escapeHtml(s.explainTitle)}</summary>` +
    `<p>${escapeHtml(s.explainBody)}</p></details>` +

    `<div class="map-shell" id="map-shell">` +
    `<div class="map-controls">` +
    `<label class="ctl"><span>${escapeHtml(s.minShared)}</span>` +
    `<select id="map-min" class="filter">` +
    [1, 2, 3, 5, 10, 20].map((v) => option(v, String(v), v === 3)).join('') +
    `</select></label>` +
    `<label class="ctl"><span>${escapeHtml(s.regionLabel)}</span>` +
    `<select id="map-region" class="filter">` +
    option('', s.allRegions, true) + regions.map((r) => option(r, r, false)).join('') +
    `</select></label>` +
    `<label class="ctl"><span>${escapeHtml(s.memberLabel)}</span>` +
    `<select id="map-member" class="filter">` +
    option('', s.allMembers, true) + memberOptions +
    `</select></label>` +
    `<button type="button" id="map-reset" class="btn btn--ghost">${escapeHtml(s.reset)}</button>` +
    `<button type="button" id="map-full" class="btn">${escapeHtml(s.fullscreen)}</button>` +
    `</div>` +

    `<div class="map-layout">` +
    `<div id="map" class="map-canvas"></div>` +
    `<aside class="map-panel" id="map-panel">` +
    `<div class="map-panel-empty">${escapeHtml(s.panelEmpty)}</div>` +
    `</aside>` +
    `</div>` +

    `<div class="map-footbar">` +
    `<span class="map-count" id="map-count"></span>` +
    `<span class="map-legend">${escapeHtml(s.dotLegend)} · ${escapeHtml(s.lineLegend)}: ${legendLines}</span>` +
    `</div>` +
    `</div>` +
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
  const all = (data.global?.exchanges ?? []).filter((e) => e.lat != null);
  const homeId = data.global?.home_ix_id;
  const home = all.find((e) => e.id === homeId);
  const memberName = new Map((data.members ?? []).map((m) => [m.asn, m.name]));

  const shell = root.querySelector('#map-shell');
  const panel = root.querySelector('#map-panel');
  const layout = root.querySelector('.map-layout');
  const counter = root.querySelector('#map-count');
  const minSel = root.querySelector('#map-min');
  const regionSel = root.querySelector('#map-region');
  const memberSel = root.querySelector('#map-member');

  const map = L.map(container, { worldCopyJump: true, scrollWheelZoom: true }).setView([47.5, 19.05], 4);

  // A nézet beillesztésekor a konténernek még nincs végleges mérete (rács,
  // betűtöltés, panel-animáció), ezért a Leaflet rossz pozíciókat számolna.
  // A ResizeObserver minden méretváltozásra újraszámoltatja.
  requestAnimationFrame(() => map.invalidateSize());
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => map.invalidateSize()).observe(container);
  }
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 12,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  const lineLayer = L.layerGroup().addTo(map);
  const dotLayer = L.layerGroup().addTo(map);
  const markers = new Map();
  let selectedId = null;

  function currentFilters() {
    return {
      minShared: Number(minSel.value),
      region: regionSel.value,
      asn: memberSel.value,
    };
  }

  function panelContent(exchange) {
    const related = relatedExchanges(exchange, all, 8);
    const names = (exchange.asns ?? [])
      .map((a) => memberName.get(a) ?? `AS${a}`)
      .sort((a, b) => a.localeCompare(b));

    const shown = names.slice(0, 14);
    const rest = names.length - shown.length;

    return (
      `<button type="button" class="map-panel-close" id="panel-close" aria-label="${escapeHtml(s.close)}">×</button>` +
      `<h3 class="panel-title">${escapeHtml(exchange.name)}</h3>` +
      `<p class="panel-sub">${escapeHtml([exchange.city, exchange.country, exchange.region].filter(Boolean).join(' · '))}</p>` +

      `<div class="panel-stats">` +
      `<div><strong class="mono">${formatInt(exchange.shared)}</strong><span>${escapeHtml(s.panel.shared)}</span></div>` +
      `<div><strong class="mono">${formatInt(exchange.net_count ?? 0)}</strong><span>${escapeHtml(s.panel.total)}</span></div>` +
      `<div><strong class="mono">${formatInt(related.length)}</strong><span>${escapeHtml(s.panel.linked)}</span></div>` +
      `</div>` +

      `<p class="panel-label">${escapeHtml(s.panel.membersHere)}</p>` +
      `<div class="chip-row">` +
      shown.map((n) => `<span class="chip">${escapeHtml(n)}</span>`).join('') +
      (rest > 0 ? `<span class="chip chip--muted">+${formatInt(rest)}</span>` : '') +
      `</div>` +

      (related.length
        ? `<p class="panel-label">${escapeHtml(s.panel.relatedTitle)}</p>` +
          `<p class="panel-note">${escapeHtml(s.panel.relatedHint)}</p>` +
          `<ul class="panel-list">` +
          related
            .map(
              (r) =>
                `<li><button type="button" class="link-btn" data-goto="${r.exchange.id}">` +
                `${escapeHtml(r.exchange.name)}</button>` +
                `<span class="panel-city">${escapeHtml(r.exchange.city ?? '')}</span>` +
                `<span class="mono panel-overlap">${formatInt(r.overlap)}</span></li>`
            )
            .join('') +
          `</ul>`
        : '')
    );
  }

  function showPanel(exchange) {
    selectedId = exchange.id;
    panel.innerHTML = panelContent(exchange);
    panel.classList.add('is-open');
    layout.classList.add('panel-open');

    panel.querySelector('#panel-close').addEventListener('click', clearSelection);
    for (const btn of panel.querySelectorAll('[data-goto]')) {
      btn.addEventListener('click', () => {
        const target = all.find((e) => e.id === Number(btn.dataset.goto));
        if (target) select(target, { pan: true });
      });
    }
  }

  function clearSelection() {
    selectedId = null;
    panel.classList.remove('is-open');
    layout.classList.remove('panel-open');
    panel.innerHTML = `<div class="map-panel-empty">${escapeHtml(s.panelEmpty)}</div>`;
    draw();
  }

  function select(exchange, { pan = false } = {}) {
    showPanel(exchange);
    draw();
    if (pan) map.panTo([exchange.lat, exchange.lng]);
  }

  function draw() {
    lineLayer.clearLayers();
    dotLayer.clearLayers();
    markers.clear();

    const visible = filterExchanges(all, currentFilters());
    const selected = selectedId ? all.find((e) => e.id === selectedId) : null;

    // Kiemeléskor a kiválasztottal közös hálózatot futtató csomópontok
    // maradnak élénkek, a többi elhalványul.
    const relatedIds = selected
      ? new Set(relatedExchanges(selected, visible, 200).map((r) => r.exchange.id))
      : null;

    for (const e of visible) {
      if (e.id === homeId) continue;

      const style = lineStyle(e.shared);
      const isRelated = !relatedIds || relatedIds.has(e.id) || e.id === selectedId;
      const dim = relatedIds && !isRelated;

      if (home && !selected) {
        L.polyline([[home.lat, home.lng], [e.lat, e.lng]], {
          color: style.color, weight: style.weight, opacity: 0.5,
        }).addTo(lineLayer);
      }

      const marker = L.circleMarker([e.lat, e.lng], {
        radius: markerRadius(e.shared) * (e.id === selectedId ? 1.5 : 1),
        color: e.id === selectedId ? '#9F2F2D' : style.color,
        fillColor: style.color,
        fillOpacity: dim ? 0.12 : 0.7,
        opacity: dim ? 0.2 : 1,
        weight: e.id === selectedId ? 3 : 1,
      })
        .bindTooltip(`${e.name} · ${formatInt(e.shared)}`, { direction: 'top' })
        .on('click', () => select(e))
        .addTo(dotLayer);

      markers.set(e.id, marker);
    }

    // A kiválasztottól húzzuk a vonalakat a vele kapcsolatban állókhoz.
    if (selected) {
      for (const r of relatedExchanges(selected, visible, 25)) {
        const t = r.exchange;
        L.polyline([[selected.lat, selected.lng], [t.lat, t.lng]], {
          color: lineStyle(r.overlap).color,
          weight: lineStyle(r.overlap).weight,
          opacity: 0.75,
          dashArray: '4 4',
        }).addTo(lineLayer);
      }
    }

    if (home) {
      L.circleMarker([home.lat, home.lng], {
        radius: 10, color: '#9F2F2D', fillColor: '#9F2F2D', fillOpacity: 0.9, weight: 2,
      })
        .bindTooltip('BIX — Budapest', { direction: 'top' })
        .on('click', () => select(home))
        .addTo(dotLayer);
    }

    counter.textContent = s.countLabel
      .replace('{n}', formatInt(visible.filter((e) => e.id !== homeId).length))
      .replace('{t}', formatInt(all.length - 1));
  }

  for (const el of [minSel, regionSel, memberSel]) {
    el.addEventListener('input', () => { selectedId = null; panel.classList.remove('is-open'); layout.classList.remove('panel-open'); draw(); });
  }

  root.querySelector('#map-reset').addEventListener('click', () => {
    minSel.value = '3';
    regionSel.value = '';
    memberSel.value = '';
    clearSelection();
    map.setView([47.5, 19.05], 4);
  });

  const fullBtn = root.querySelector('#map-full');
  fullBtn.addEventListener('click', () => {
    shell.classList.toggle('is-fullscreen');
    fullBtn.textContent = shell.classList.contains('is-fullscreen') ? s.exitFullscreen : s.fullscreen;
    document.body.classList.toggle('has-fullscreen-map', shell.classList.contains('is-fullscreen'));
    setTimeout(() => map.invalidateSize(), 320);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (shell.classList.contains('is-fullscreen')) {
      fullBtn.click();
    } else if (selectedId) {
      clearSelection();
    }
  });

  draw();
}
