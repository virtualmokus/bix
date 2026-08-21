import strings from '../strings.hu.js';
import icons from '../icons.js';
import { formatDecimal, formatInt, formatPercent, formatBandwidth, formatRelative } from '../format.js';
import { concurrent4kStreams, gigabytesPerSecond, utilizationPercent } from '../humanize.js';
import { areaChart, barRow, cumulativeChart, escapeHtml } from '../chart.js';
import {
  distribution, topBy, sumBy, memberBandwidth,
  keyFigures, redundancy, headroom, adoption,
} from '../stats.js';

const MIN_POINTS_FOR_CHART = 4;
const s = strings.overview;

function figure(value, label, hint) {
  return (
    `<div class="figure">` +
    `<div class="figure-value mono">${value}</div>` +
    `<div class="figure-label">${escapeHtml(label)}</div>` +
    (hint ? `<div class="figure-hint">${escapeHtml(hint)}</div>` : '') +
    `</div>`
  );
}

function humanCard(index, icon, value, text) {
  return (
    `<div class="card human-card reveal" style="--index:${index}">` +
    `<span class="human-icon">${icon}</span>` +
    `<div class="human-value mono">${value}</div>` +
    `<p class="human-text">${escapeHtml(text)}</p>` +
    `</div>`
  );
}

function distBars(entries, { formatLabel = (k) => k, unit = 'db' } = {}) {
  if (entries.length === 0) return `<p class="hint">${escapeHtml(s.noData)}</p>`;
  const max = Math.max(...entries.map(([, count]) => count));
  return entries
    .map(([key, count]) =>
      barRow({
        label: formatLabel(key),
        value: count,
        max,
        display: `${formatInt(count)} ${unit}`,
      })
    )
    .join('');
}

function factCard(index, title, body) {
  return (
    `<div class="card fact reveal" style="--index:${index}">` +
    `<h3 class="fact-title">${title}</h3>` +
    `<p class="fact-body">${body}</p>` +
    `</div>`
  );
}

function heroSection(latest, rows) {
  const chartOrNotice =
    rows.length >= MIN_POINTS_FOR_CHART
      ? areaChart({
          points: rows.map((row, i) => ({ x: i, y: row.current_gbps })),
          width: 720,
          height: 120,
        })
      : `<div class="note note--info">` +
        `<strong>${escapeHtml(s.seriesStarting)}</strong> ` +
        escapeHtml(
          s.seriesStartingBody
            .replace('{count}', formatInt(rows.length))
            .replace('{since}', formatRelative(rows[0].ts, new Date()))
        ) +
        `</div>`;

  const util = utilizationPercent(latest.current_gbps, latest.capacity_gbps);
  const peakUtil = utilizationPercent(latest.peak_gbps, latest.capacity_gbps);

  return (
    `<section class="section hero-grid">` +
    `<div>` +
    `<p class="eyebrow">${escapeHtml(s.heroEyebrow)}</p>` +
    `<div class="hero-number mono">${formatDecimal(latest.current_gbps)}` +
    `<span class="hero-unit">Gb/s</span></div>` +
    chartOrNotice +
    `</div>` +
    `<div>` +
    `<p class="eyebrow">${escapeHtml(s.utilization)}</p>` +
    barRow({
      label: s.current, value: latest.current_gbps, max: latest.capacity_gbps,
      display: `${formatDecimal(latest.current_gbps)} Gb/s · ${formatPercent(util)}`,
    }) +
    barRow({
      label: s.peak, value: latest.peak_gbps, max: latest.capacity_gbps, accent: '#7FB6E0',
      display: `${formatDecimal(latest.peak_gbps)} Gb/s · ${formatPercent(peakUtil)}`,
    }) +
    barRow({
      label: s.capacity, value: latest.capacity_gbps, max: latest.capacity_gbps, accent: 'var(--border)',
      display: `${formatInt(latest.capacity_gbps)} Gb/s · 100%`,
    }) +
    `<p class="note note--warning">${icons.info}<strong>${escapeHtml(s.didYouKnow)}</strong> ` +
    escapeHtml(s.capacityNote) + `</p>` +
    `</div>` +
    `</section>`
  );
}

export function render(data) {
  const rows = data.traffic ?? [];
  const members = data.members ?? [];
  const ports = data.ports ?? [];
  const latest = rows.length ? rows[rows.length - 1] : null;

  const f = keyFigures({ members, ports, traffic: latest });
  const red = redundancy(members, ports);
  const head = headroom(ports);
  const adopt = adoption(members);
  const profiled = members.filter((m) => m.network);

  const byIx = topBy(profiled, (m) => m.network.ix_count, 6);
  const byPrefix = topBy(profiled, (m) => m.network.prefixes4, 6);
  const byBandwidth = topBy(members, memberBandwidth, 6);
  const totalPrefixes = sumBy(profiled, (m) => m.network.prefixes4);

  const buckets = (() => {
    const years = members.map((m) => m.first_seen).filter(Boolean).map((d) => Number(d.slice(0, 4)));
    if (years.length === 0) return [];
    const min = Math.min(...years), max = Math.max(...years);
    const counts = new Map();
    for (const y of years) counts.set(y, (counts.get(y) ?? 0) + 1);
    const out = [];
    for (let y = min; y <= max; y++) out.push({ label: String(y), value: counts.get(y) ?? 0 });
    return out;
  })();

  return (
    (latest ? heroSection(latest, rows) : '') +

    // ---- Kulcsszámok ----
    `<section class="section reveal">` +
    `<p class="eyebrow">${escapeHtml(s.keyFigures)}</p>` +
    `<div class="figure-grid">` +
    figure(formatInt(f.networksReported ?? 0), s.fig.networks, s.fig.networksHint) +
    figure(formatInt(f.portsReported ?? 0), s.fig.ports, s.fig.portsHint) +
    figure(formatInt(f.portsPublic), s.fig.portsPublic,
      f.coveragePercent ? s.fig.portsPublicHint.replace('{p}', formatPercent(f.coveragePercent, 0)) : '') +
    figure(formatInt(f.members), s.fig.members, s.fig.membersHint) +
    figure(formatInt(f.nodes), s.fig.nodes, s.fig.nodesHint) +
    figure(f.largestPortMbps ? formatBandwidth(f.largestPortMbps) : '—', s.fig.largestPort, s.fig.largestPortHint) +
    figure(formatInt(adopt.routeServer), s.fig.routeServer, s.fig.routeServerHint) +
    figure(formatInt(adopt.ipv6), s.fig.ipv6, s.fig.ipv6Hint) +
    `</div></section>` +

    // ---- Emberi lépték ----
    (latest
      ? `<section class="section">` +
        `<p class="eyebrow">${escapeHtml(s.humanScale)}</p>` +
        `<div class="human-grid">` +
        humanCard(0, icons.stream, formatInt(concurrent4kStreams(latest.current_gbps)),
          'egyidejű 4K stream férne bele a jelenlegi forgalomba') +
        humanCard(1, icons.storage, `${formatInt(Math.round(gigabytesPerSecond(latest.current_gbps)))} GB`,
          'adat halad át minden egyes másodpercben') +
        humanCard(2, icons.network, formatInt(totalPrefixes),
          'IPv4 prefixet hirdetnek együttesen a tagok (átfedésekkel, önbevallás alapján)') +
        `</div></section>`
      : '') +

    // ---- Kik ülnek a BIX-en ----
    `<section class="section reveal">` +
    `<p class="eyebrow">${escapeHtml(s.whoEyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.whoTitle)}</h2>` +
    `<p class="hint">${escapeHtml(s.whoHint.replace('{n}', formatInt(profiled.length)).replace('{t}', formatInt(members.length)))}</p>` +
    `<div class="split-grid">` +
    `<div><p class="label">${escapeHtml(s.byType)}</p>` +
    distBars(distribution(profiled, (m) => m.network.type)) + `</div>` +
    `<div><p class="label">${escapeHtml(s.byScope)}</p>` +
    distBars(distribution(profiled, (m) => m.network.scope)) + `</div>` +
    `</div>` +
    `<div class="split-grid">` +
    `<div><p class="label">${escapeHtml(s.byTraffic)}</p>` +
    distBars(distribution(profiled, (m) => m.network.traffic)) + `</div>` +
    `<div><p class="label">${escapeHtml(s.byRatio)}</p>` +
    distBars(distribution(profiled, (m) => m.network.ratio)) + `</div>` +
    `</div></section>` +

    // ---- Hogyan kapcsolódnak ----
    `<section class="section reveal">` +
    `<p class="eyebrow">${escapeHtml(s.howEyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.howTitle)}</h2>` +
    `<div class="split-grid">` +
    `<div><p class="label">${escapeHtml(s.byNode)}</p>` +
    distBars(distribution(ports, (p) => p.node), { unit: 'port' }) +
    `<p class="note note--warning">${escapeHtml(s.viennaNote)}</p></div>` +
    `<div><p class="label">${escapeHtml(s.byBandwidth)}</p>` +
    distBars(
      distribution(ports, (p) => p.bandwidth_mbps).sort((a, b) => b[0] - a[0]),
      { formatLabel: formatBandwidth, unit: 'port' }
    ) + `</div>` +
    `</div>` +
    `<div class="split-grid">` +
    `<div><p class="label">${escapeHtml(s.byPolicy)}</p>` +
    distBars(distribution(members, (m) => m.policy), { unit: 'tag' }) + `</div>` +
    `<div><p class="label">${escapeHtml(s.biggestMembers)}</p>` +
    byBandwidth
      .map((m) =>
        barRow({
          label: m.name, value: memberBandwidth(m),
          max: memberBandwidth(byBandwidth[0]),
          display: formatBandwidth(memberBandwidth(m)),
        })
      )
      .join('') + `</div>` +
    `</div></section>` +

    // ---- Érdekességek ----
    `<section class="section">` +
    `<p class="eyebrow">${escapeHtml(s.factsEyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.factsTitle)}</h2>` +
    `<div class="fact-grid">` +
    (byIx.length
      ? factCard(0, escapeHtml(s.facts.reachTitle),
          s.facts.reachBody
            .replace('{name}', `<strong>${escapeHtml(byIx[0].name)}</strong>`)
            .replace('{n}', `<strong>${formatInt(byIx[0].network.ix_count)}</strong>`))
      : '') +
    factCard(1, escapeHtml(s.facts.redundancyTitle),
      s.facts.redundancyBody
        .replace('{multi}', `<strong>${formatInt(red.multiPortMembers)}</strong>`)
        .replace('{backup}', `<strong>${formatInt(red.backupPorts)}</strong>`)) +
    (head.length
      ? factCard(2, escapeHtml(s.facts.headroomTitle),
          s.facts.headroomBody.replace('{n}', `<strong>${formatInt(head.length)}</strong>`))
      : '') +
    factCard(3, escapeHtml(s.facts.ipv6Title),
      s.facts.ipv6Body
        .replace('{n}', `<strong>${formatInt(adopt.announcesIpv6)}</strong>`)
        .replace('{t}', `<strong>${formatInt(adopt.profiled)}</strong>`)) +
    `</div>` +

    `<div class="split-grid" style="margin-top:24px">` +
    `<div><p class="label">${escapeHtml(s.topIx)}</p>` +
    byIx
      .map((m) =>
        barRow({
          label: m.name, value: m.network.ix_count, max: byIx[0].network.ix_count,
          display: `${formatInt(m.network.ix_count)} IXP`,
        })
      )
      .join('') + `</div>` +
    `<div><p class="label">${escapeHtml(s.topPrefixes)}</p>` +
    byPrefix
      .map((m) =>
        barRow({
          label: m.name, value: m.network.prefixes4, max: byPrefix[0].network.prefixes4,
          display: formatInt(m.network.prefixes4),
        })
      )
      .join('') + `</div>` +
    `</div></section>` +

    // ---- Növekedés ----
    (buckets.length
      ? `<section class="section reveal">` +
        `<p class="eyebrow">${escapeHtml(s.growthEyebrow)}</p>` +
        `<h2 class="section-title">${escapeHtml(s.growthTitle)}</h2>` +
        cumulativeChart({ buckets, width: 860, height: 180 }) +
        `<p class="note note--info">${escapeHtml(s.growthCaption)}</p>` +
        `</section>`
      : '')
  );
}
