import strings from '../i18n.js';
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
 * Melyik csomópontok érhetők el UGYANAZON a fizikai tengeralatti kábelen,
 * mint a kiválasztott? Ez az egyetlen olyan kapcsolat ezen a térképen, ami
 * valódi közös fizikai eszközt jelent — a peering-vonalak logikaiak.
 *
 * `cableIndex`: { ixId: string[] } — csomópontonként a közeli kábelek.
 */
export function sharedCableExchanges(selectedId, cableIndex, exchanges, limit = 8) {
  const own = new Set(cableIndex?.[selectedId]?.cables ?? []);
  if (own.size === 0) return [];

  const selected = exchanges.find((e) => e.id === selectedId);
  const ownCity = selected?.city ?? null;

  const matches = exchanges
    .filter((e) => e.id !== selectedId)
    // Az azonos városban lévő csomópontok értelemszerűen ugyanazokat a
    // kábeleket érik el; ez nem információ. A kérdés az, melyik MÁSIK
    // település ül ugyanazon a fizikai kábelen.
    .filter((e) => !ownCity || e.city !== ownCity)
    .map((e) => {
      const theirs = cableIndex?.[e.id]?.cables ?? [];
      return { exchange: e, cables: theirs.filter((c) => own.has(c)) };
    })
    .filter((r) => r.cables.length > 0)
    .sort((a, b) => b.cables.length - a.cables.length);

  // Városonként csak a legerősebb egyezés kerül a listába.
  const seen = new Set();
  const out = [];
  for (const match of matches) {
    const city = match.exchange.city ?? `#${match.exchange.id}`;
    if (seen.has(city)) continue;
    seen.add(city);
    out.push(match);
    if (out.length === limit) break;
  }
  return out;
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

// BIX — az alapértelmezett nézőpont, és az egyetlen, amihez helyi
// forgalmi és port-adatunk is van.
const DEFAULT_HOME = 55;

export function render(data) {
  const exchanges = data.global?.exchanges ?? [];
  const homeId = data.global?.home_ix_id ?? DEFAULT_HOME;
  const homeExchange = exchanges.find((e) => e.id === homeId);
  const withGeo = exchanges.filter((e) => e.lat != null);
  const cities = new Set(withGeo.map((e) => `${e.city}|${e.country}`));
  const regions = [...new Set(exchanges.map((e) => e.region).filter(Boolean))].sort();

  // Csak azok a tagok kerülnek a listába, akik legalább egy külföldi
  // csomóponton is jelen vannak — a többinél a szűrő üres térképet adna.
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
    (homeExchange && homeId !== DEFAULT_HOME
      ? `<p class="note note--info"><strong>${escapeHtml(s.foreignTitle.replace('{name}', homeExchange.name))}</strong> ` +
        `${escapeHtml(s.foreignBody)} ` +
        `<button type="button" class="link-btn" data-home="${DEFAULT_HOME}">${escapeHtml(s.backHome)}</button></p>`
      : '') +
    `<p class="note note--warning"><strong>${escapeHtml(s.physicalWarnTitle)}</strong> ` +
    `${escapeHtml(s.physicalWarnBody)}</p>` +

    `<div class="map-shell" id="map-shell">` +
    `<div class="map-controls">` +
    `<label class="ctl ctl--home"><span>${escapeHtml(s.homeLabel)}</span>` +
    `<select id="map-home" class="filter">` +
    [...exchanges]
      .filter((e) => e.lat != null)
      .sort((a, b) => (b.net_count ?? 0) - (a.net_count ?? 0))
      .slice(0, 400)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((e) => option(e.id, `${e.name}${e.city ? ' — ' + e.city : ''}`, e.id === homeId))
      .join('') +
    `</select></label>` +
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
    `<label class="ctl ctl--check"><span>${escapeHtml(s.cableLabel)}</span>` +
    `<label class="switch"><input type="checkbox" id="map-cables">` +
    `<span>${escapeHtml(s.cableToggle)}</span></label></label>` +
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

  const map = L.map(container, {
    worldCopyJump: false,
    scrollWheelZoom: true,
    maxBounds: L.latLngBounds([-85, -180], [85, 180]),
    maxBoundsViscosity: 1,
  }).setView([47.5, 19.05], 4);

  // A legkisebb nagyítás az, ahol a világ épp kitölti a keretet — így sem
  // ismétlődés, sem üres sáv nem marad a térkép mellett.
  function fitWorld() {
    const zoom = map.getBoundsZoom(L.latLngBounds([-85, -180], [85, 180]), true);
    map.setMinZoom(zoom);
    if (map.getZoom() < zoom) map.setZoom(zoom);
  }

  // A nézet beillesztésekor a konténernek még nincs végleges mérete (rács,
  // betűtöltés, panel-animáció), ezért a Leaflet rossz pozíciókat számolna.
  // A ResizeObserver minden méretváltozásra újraszámoltatja.
  requestAnimationFrame(() => { map.invalidateSize(); fitWorld(); });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => { map.invalidateSize(); fitWorld(); }).observe(container);
  }
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 12,
    noWrap: true,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  // Egyetlen világ jelenik meg, ismétlődés nélkül. A korábbi megoldás a
  // vektorokat ±360°-on is kirajzolta, hogy a lapozás folytonos legyen —
  // ettől viszont több teljes világ látszott egyszerre. A csempék `noWrap`-je
  // és a `maxBounds` együtt zárja ki az ismétlődést.
  const WORLD_COPIES = [0];

  // Több ezer vonalat az SVG-renderer megfojt; a vászon nagyságrenddel
  // gyorsabb, és a kattintást is kezeli.
  const bulkRenderer = L.canvas({ padding: 0.4 });

  const borderLayer = L.layerGroup().addTo(map);
  const cableLayer = L.layerGroup().addTo(map);
  const lineLayer = L.layerGroup().addTo(map);
  const dotLayer = L.layerGroup().addTo(map);

  const cableData = data.cables ?? null;
  const cableIndex = cableData?.exchanges ?? {};
  const cableById = new Map((cableData?.cables ?? []).map((c) => [c.id, c]));
  const cableDetails = cableData?.details ?? {};
  const cablesToggle = root.querySelector('#map-cables');

  /** Országhatárok sötéttel — kizoomolva az OSM csempéken alig látszanak. */
  function drawBorders() {
    borderLayer.clearLayers();
    const lines = data.borders?.lines ?? [];
    for (const offset of WORLD_COPIES) {
      for (const line of lines) {
        L.polyline(line.map(([lng, lat]) => [lat, lng + offset]), {
          color: '#3A4550',
          weight: 0.9,
          opacity: 0.75,
          interactive: false,
          renderer: bulkRenderer,
        }).addTo(borderLayer);
      }
    }
  }

  function cablePopup(cable) {
    const d = cableDetails[cable.id] ?? {};
    const rows = [
      [s.cablePopup.owners, d.owners],
      [s.cablePopup.suppliers, d.suppliers],
      [s.cablePopup.length, d.length],
      [s.cablePopup.rfs, d.rfs],
      [s.cablePopup.landings, cable.countries?.join(', ')],
    ].filter(([, value]) => value);

    return (
      `<strong class="cable-pop-name">${escapeHtml(cable.name)}</strong>` +
      (d.is_planned ? `<span class="cable-pop-planned">${escapeHtml(s.cablePopup.planned)}</span>` : '') +
      `<dl class="cable-pop">` +
      rows
        .map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`)
        .join('') +
      `</dl>` +
      (d.url
        ? `<a href="${escapeHtml(d.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.cablePopup.site)}</a>`
        : '')
    );
  }

  /** Kábelek rajzolása; `highlight` a kiemelendő kábelek azonosítói. */
  function drawCables(highlight) {
    cableLayer.clearLayers();
    if (!cablesToggle?.checked || !cableData) return;

    for (const cable of cableData.cables) {
      const isHot = highlight?.has(cable.id);
      for (const offset of WORLD_COPIES) {
        for (const segment of cable.geometry) {
          L.polyline(segment.map(([lng, lat]) => [lat, lng + offset]), {
            color: isHot ? '#B26A00' : (cable.color ?? '#8FA6B8'),
            weight: isHot ? 2.6 : 1,
            opacity: isHot ? 0.95 : (highlight ? 0.18 : 0.6),
            bubblingMouseEvents: false,
            renderer: bulkRenderer,
          })
            .bindPopup(() => cablePopup(cable), { maxWidth: 300 })
            .bindTooltip(cable.name, { sticky: true })
            .addTo(cableLayer);
        }
      }
    }
  }
  const markers = new Map();
  let selectedId = null;

  function currentFilters() {
    return {
      minShared: Number(minSel.value),
      region: regionSel.value,
      asn: memberSel.value,
    };
  }

  /** A tengeralatti szakasz a panelben: mit tudunk fizikailag, és mit nem. */
  function cableSection(exchange) {
    const info = cableIndex[exchange.id];
    if (!info) return '';

    const cables = info.cables ?? [];
    const shared = sharedCableExchanges(exchange.id, cableIndex, all, 6);

    // Szárazföldi csomópont: ez önmagában is beszédes tény.
    if (cables.length === 0) {
      return (
        `<p class="panel-label">${escapeHtml(s.panel.cablesTitle)}</p>` +
        `<p class="panel-note">${escapeHtml(
          s.panel.inland
            .replace('{km}', formatInt(info.nearest_km ?? 0))
            .replace('{landing}', info.nearest_landing ?? '—')
        )}</p>`
      );
    }

    const names = cables
      .map((id) => cableById.get(id)?.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    const shown = names.slice(0, 10);

    return (
      `<p class="panel-label">${escapeHtml(s.panel.cablesTitle)}</p>` +
      `<p class="panel-note">${escapeHtml(
        s.panel.cablesHint.replace('{n}', formatInt(cables.length))
      )}</p>` +
      `<div class="chip-row">` +
      shown.map((n) => `<span class="chip chip--cable">${escapeHtml(n)}</span>`).join('') +
      (names.length > shown.length
        ? `<span class="chip chip--muted">+${formatInt(names.length - shown.length)}</span>`
        : '') +
      `</div>` +
      (shared.length
        ? `<p class="panel-label">${escapeHtml(s.panel.sharedCableTitle)}</p>` +
          `<p class="panel-note">${escapeHtml(s.panel.sharedCableHint)}</p>` +
          `<ul class="panel-list">` +
          shared
            .map(
              (r) =>
                `<li><button type="button" class="link-btn" data-goto="${r.exchange.id}">` +
                `${escapeHtml(r.exchange.name)}</button>` +
                `<span class="panel-city">${escapeHtml(r.exchange.city ?? '')}</span>` +
                `<span class="mono panel-overlap">${formatInt(r.cables.length)}</span></li>`
            )
            .join('') +
          `</ul>`
        : '')
    );
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
      `<button type="button" class="btn panel-dossier" data-open-ix="${exchange.id}">${escapeHtml(s.panel.openPage)}</button>` +

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
        : '') +
      cableSection(exchange)
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

    // Kiválasztáskor a csomópontot kiszolgáló kábelek emelkednek ki.
    const hotCables = selected
      ? new Set(cableIndex[selected.id]?.cables ?? [])
      : null;
    drawCables(hotCables && hotCables.size ? hotCables : null);
    drawBorders();

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
        for (const offset of WORLD_COPIES) {
          L.polyline([[home.lat, home.lng + offset], [e.lat, e.lng + offset]], {
            color: style.color, weight: style.weight, opacity: 0.5, interactive: false,
          }).addTo(lineLayer);
        }
      }

      for (const offset of []) { // nincs világ-másolat
        L.circleMarker([e.lat, e.lng + offset], {
          radius: markerRadius(e.shared) * (e.id === selectedId ? 1.5 : 1),
          color: e.id === selectedId ? '#9F2F2D' : style.color,
          fillColor: style.color,
          fillOpacity: dim ? 0.12 : 0.7,
          opacity: dim ? 0.2 : 1,
          weight: e.id === selectedId ? 3 : 1,
        }).on('click', () => select(e)).addTo(dotLayer);
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
        for (const offset of WORLD_COPIES) {
          L.polyline([[selected.lat, selected.lng + offset], [t.lat, t.lng + offset]], {
            color: lineStyle(r.overlap).color,
            weight: lineStyle(r.overlap).weight,
            opacity: 0.75,
            dashArray: '4 4',
            interactive: false,
          }).addTo(lineLayer);
        }
      }
    }

    if (home) {
      for (const offset of WORLD_COPIES) {
        L.circleMarker([home.lat, home.lng + offset], {
          radius: 10, color: '#9F2F2D', fillColor: '#9F2F2D', fillOpacity: 0.9, weight: 2,
        })
          .bindTooltip('BIX — Budapest', { direction: 'top' })
          .on('click', () => select(home))
          .addTo(dotLayer);
      }
    }

    // A rejtett csomópontok számát is kiírjuk. Enélkül úgy tűnne, hogy hiányzik
    // az adat, pedig csak a „min. közös tag” szűrő vág.
    const shown = visible.filter((e) => e.id !== homeId).length;
    const total = all.length - 1;
    const hidden = total - shown;
    counter.textContent =
      s.countLabel.replace('{n}', formatInt(shown)).replace('{t}', formatInt(total)) +
      (hidden > 0 ? ` · ${s.filterNote.replace('{n}', formatInt(hidden))}` : '');
  }

  cablesToggle?.addEventListener('change', draw);

  for (const el of [minSel, regionSel, memberSel]) {
    el.addEventListener('input', () => { selectedId = null; panel.classList.remove('is-open'); layout.classList.remove('panel-open'); draw(); });
  }

  root.querySelector('#map-reset').addEventListener('click', () => {
    if (cablesToggle) cablesToggle.checked = false;
    minSel.value = '3';
    regionSel.value = '';
    memberSel.value = '';
    clearSelection();
    map.setView([47.5, 19.05], 4);
  });

  const fullBtn = root.querySelector('#map-full');

  function setFullscreen(on) {
    shell.classList.toggle('is-fullscreen', on);
    document.body.classList.toggle('has-fullscreen-map', on);
    fullBtn.textContent = on ? s.exitFullscreen : s.fullscreen;
    // A fejléc magassága mobilon tördeléskor változik, ezért mérjük.
    const header = document.querySelector('.site-header');
    if (header) {
      document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
    }
    setTimeout(() => map.invalidateSize(), 320);
  }

  fullBtn.addEventListener('click', () => {
    setFullscreen(!shell.classList.contains('is-fullscreen'));
  });

  // A térkép nézet alapból teljes képernyőn nyílik — ez a fő tartalma.
  // A fejléc nem tűnik el, így a többi fül egy kattintással elérhető.
  setFullscreen(true);

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
