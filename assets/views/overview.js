import strings from '../strings.en.js';
import icons from '../icons.js';
import { formatDecimal, formatInt, formatPercent, formatBandwidth, formatRelative } from '../format.js';
import { concurrent4kStreams, gigabytesPerSecond, utilizationPercent } from '../humanize.js';
import { areaChart, barRow, cumulativeChart, escapeHtml } from '../chart.js';
import {
  distribution, topBy, sumBy, memberBandwidth,
  keyFigures, redundancy, headroom, adoption, cohorts, totalCapacityMbps,
} from '../stats.js';

const MIN_POINTS_FOR_CHART = 4;
const s = strings.overview;

// Kategóriánként állandó szín — így a típus a táblán, a bontásban és a
// térképen is ugyanazt a színt viseli.
export const TYPE_COLORS = {
  'Content': '#1F6C9F',
  'NSP': '#7C5CBF',
  'Cable/DSL/ISP': '#346538',
  'Enterprise': '#B26A00',
  'Educational/Research': '#9F2F2D',
  'Non-Profit': '#0F766E',
  'Network Services': '#A21CAF',
  'Route Server': '#787774',
};

const SCOPE_COLORS = {
  'Global': '#1F6C9F',
  'Europe': '#346538',
  'Regional': '#B26A00',
  'Not Disclosed': '#787774',
};

// A kulcsszám kinyitható, ha van hozzá magyarázat. A <details> natívan
// kezeli a nyitást — nem kell JS, és billentyűzetről is működik.
function figure(value, label, hint, accent, explain) {
  const style = accent ? ` style="--figure-accent:${accent}"` : '';
  const body =
    `<div class="figure-value mono">${value}</div>` +
    `<div class="figure-label">${escapeHtml(label)}</div>` +
    (hint ? `<div class="figure-hint">${escapeHtml(hint)}</div>` : '');

  if (!explain) return `<div class="figure"${style}>${body}</div>`;

  return (
    `<details class="figure figure--expandable"${style}>` +
    `<summary>${body}<span class="figure-more" aria-hidden="true">?</span></summary>` +
    `<p class="figure-explain">${escapeHtml(explain)}</p>` +
    `</details>`
  );
}

/** Összecsukható magyarázó blokk egy diagram alá. */
function explainer(text) {
  if (!text) return '';
  return (
    `<details class="explainer"><summary>${escapeHtml(strings.showMore)}</summary>` +
    `<p>${escapeHtml(text)}</p></details>`
  );
}

function humanCard(index, icon, value, text, tone) {
  return (
    `<div class="card human-card reveal tone-${tone}" style="--index:${index}">` +
    `<span class="human-icon">${icon}</span>` +
    `<div class="human-value mono">${value}</div>` +
    `<p class="human-text">${escapeHtml(text)}</p>` +
    `</div>`
  );
}

function distBars(entries, { formatLabel = (k) => k, unit = '', colors = null } = {}) {
  if (entries.length === 0) return `<p class="hint">${escapeHtml(strings.noData)}</p>`;
  const max = Math.max(...entries.map(([, count]) => count));
  return entries
    .map(([key, count]) =>
      barRow({
        label: formatLabel(key),
        value: count,
        max,
        accent: colors?.[key] ?? 'var(--blue-fg)',
        display: unit ? `${formatInt(count)} ${unit}` : formatInt(count),
      })
    )
    .join('');
}

function factCard(index, tone, title, body) {
  return (
    `<div class="card fact reveal tone-${tone}" style="--index:${index}">` +
    `<h3 class="fact-title">${title}</h3>` +
    `<p class="fact-body">${body}</p>` +
    `</div>`
  );
}

function trafficXLabels(rows) {
  if (rows.length < 2) return [];
  const picks = [0, Math.floor(rows.length / 2), rows.length - 1];
  return [...new Set(picks)].map((i) => ({
    x: i,
    label: new Date(rows[i].ts).toLocaleString('en-GB', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
  }));
}

function heroSection(latest, rows) {
  const chartOrNotice =
    rows.length >= MIN_POINTS_FOR_CHART
      ? areaChart({
          points: rows.map((row, i) => ({ x: i, y: row.current_gbps })),
          width: 720,
          height: 170,
          yFormat: (v) => `${formatInt(v)} ${s.chartY}`,
          xLabels: trafficXLabels(rows),
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
      strong: true,
    }) +
    barRow({
      label: s.peak, value: latest.peak_gbps, max: latest.capacity_gbps, accent: '#7C5CBF',
      display: `${formatDecimal(latest.peak_gbps)} Gb/s · ${formatPercent(peakUtil)}`,
      strong: true,
    }) +
    barRow({
      label: s.capacity, value: latest.capacity_gbps, max: latest.capacity_gbps, accent: 'var(--border)',
      display: `${formatInt(latest.capacity_gbps)} Gb/s · 100%`,
      strong: true,
    }) +
    `<p class="note note--warning">${icons.info}<strong>${escapeHtml(s.didYouKnow)}</strong> ` +
    escapeHtml(s.capacityNote) + `</p>` +
    `</div>` +
    `</section>`
  );
}

function worldSection(global) {
  if (!global?.exchanges?.length) return '';
  const exchanges = global.exchanges;
  const others = exchanges.filter((e) => e.id !== global.home_ix_id);
  const bix = exchanges.find((e) => e.id === global.home_ix_id);

  const byNetCount = [...exchanges].sort((a, b) => (b.net_count ?? 0) - (a.net_count ?? 0));
  const rank = byNetCount.findIndex((e) => e.id === global.home_ix_id) + 1;

  const topWorld = byNetCount.slice(0, 7);
  const compare = bix && !topWorld.includes(bix) ? [...topWorld, bix] : topWorld;
  const maxNet = compare[0]?.net_count ?? 1;

  const topShared = others.slice(0, 10);
  const maxShared = topShared[0]?.shared ?? 1;

  return (
    `<section class="section reveal">` +
    `<p class="eyebrow">${escapeHtml(s.worldEyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.worldTitle)}</h2>` +
    `<p class="hint">${escapeHtml(s.worldHint)}</p>` +
    (rank
      ? `<p class="note note--info">${escapeHtml(
          s.worldRank.replace('{rank}', formatInt(rank)).replace('{total}', formatInt(exchanges.length))
        )}</p>`
      : '') +
    `<div class="split-grid">` +
    `<div><p class="label">${escapeHtml(s.topExchanges)}</p>` +
    compare
      .map((e) =>
        barRow({
          label: `${e.name} (${e.city ?? '?'})`,
          value: e.net_count ?? 0,
          max: maxNet,
          accent: e.id === global.home_ix_id ? '#B26A00' : 'var(--blue-fg)',
          display: formatInt(e.net_count ?? 0),
          strong: e.id === global.home_ix_id,
        })
      )
      .join('') + explainer(s.topExchangesExplain) + `</div>` +
    `<div><p class="label">${escapeHtml(s.sharedTitle)}</p>` +
    `<p class="hint">${escapeHtml(s.sharedHint)}</p>` +
    topShared
      .map((e) =>
        barRow({
          label: `${e.name} (${e.city ?? '?'})`,
          value: e.shared,
          max: maxShared,
          accent: '#346538',
          display: formatInt(e.shared),
        })
      )
      .join('') + `</div>` +
    `</div></section>`
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

  const vix = data.global?.exchanges?.find((e) => e.name === 'VIX');
  const decix = data.global?.exchanges?.find((e) => e.name === 'DE-CIX Frankfurt');

  const buckets = cohorts(members);

  return (
    (latest ? heroSection(latest, rows) : '') +

    // ---- Kulcsszámok ----
    `<section class="section reveal">` +
    `<p class="eyebrow">${escapeHtml(s.keyFigures)}</p>` +
    `<p class="hint">${escapeHtml(s.keyFiguresHint)}</p>` +
    `<div class="figure-grid">` +
    figure(formatInt(f.networksReported ?? 0), s.fig.networks, s.fig.networksHint, '#1F6C9F', s.fig.networksExplain) +
    figure(formatInt(f.portsReported ?? 0), s.fig.ports, s.fig.portsHint, '#1F6C9F', s.fig.portsExplain) +
    figure(formatInt(f.portsPublic), s.fig.portsPublic,
      f.coveragePercent ? s.fig.portsPublicHint.replace('{p}', formatPercent(f.coveragePercent, 0)) : '',
      '#B26A00', s.fig.portsPublicExplain) +
    figure(formatInt(f.members), s.fig.members, s.fig.membersHint, '#346538', s.fig.membersExplain) +
    figure(formatInt(f.nodes), s.fig.nodes, s.fig.nodesHint, '#7C5CBF', s.fig.nodesExplain) +
    figure(f.largestPortMbps ? formatBandwidth(f.largestPortMbps) : '—', s.fig.largestPort,
      s.fig.largestPortHint, '#7C5CBF', s.fig.largestPortExplain) +
    figure(formatInt(adopt.routeServer), s.fig.routeServer, s.fig.routeServerHint,
      '#0F766E', strings.glossary.routeServer) +
    figure(formatInt(adopt.ipv6), s.fig.ipv6, s.fig.ipv6Hint, '#0F766E', s.fig.ipv6Explain) +
    `</div></section>` +

    // ---- Emberi lépték ----
    (latest
      ? `<section class="section">` +
        `<p class="eyebrow">${escapeHtml(s.humanScale)}</p>` +
        `<div class="human-grid">` +
        humanCard(0, icons.stream, formatInt(concurrent4kStreams(latest.current_gbps)), s.human.streams, 'blue') +
        humanCard(1, icons.storage, `${formatInt(Math.round(gigabytesPerSecond(latest.current_gbps)))} GB`, s.human.bytes, 'green') +
        humanCard(2, icons.network, formatInt(totalPrefixes), s.human.prefixes, 'purple') +
        `</div></section>`
      : '') +

    // ---- Kik ülnek a BIX-en ----
    `<section class="section reveal">` +
    `<p class="eyebrow">${escapeHtml(s.whoEyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.whoTitle)}</h2>` +
    `<p class="hint">${escapeHtml(s.whoHint.replace('{n}', formatInt(profiled.length)).replace('{t}', formatInt(members.length)))}</p>` +
    `<div class="split-grid">` +
    `<div><p class="label">${escapeHtml(s.byType)}</p>` +
    distBars(distribution(profiled, (m) => m.network.type), { colors: TYPE_COLORS }) +
    explainer(s.byTypeExplain) + `</div>` +
    `<div><p class="label">${escapeHtml(s.byScope)}</p>` +
    distBars(distribution(profiled, (m) => m.network.scope), { colors: SCOPE_COLORS }) +
    explainer(s.byScopeExplain) + `</div>` +
    `</div>` +
    `<div class="split-grid">` +
    `<div><p class="label">${escapeHtml(s.byTraffic)}</p>` +
    distBars(distribution(profiled, (m) => m.network.traffic)) +
    explainer(s.byTrafficExplain) + `</div>` +
    `<div><p class="label">${escapeHtml(s.byRatio)}</p>` +
    distBars(distribution(profiled, (m) => m.network.ratio)) +
    explainer(s.byRatioExplain) + `</div>` +
    `</div></section>` +

    // ---- Hogyan kapcsolódnak ----
    `<section class="section reveal">` +
    `<p class="eyebrow">${escapeHtml(s.howEyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.howTitle)}</h2>` +
    `<div class="split-grid">` +
    `<div><p class="label">${escapeHtml(s.byNode)}</p>` +
    distBars(distribution(ports, (p) => p.node), { unit: 'ports' }) +
    `<p class="note note--warning">${escapeHtml(s.viennaNote)}</p></div>` +
    `<div><p class="label">${escapeHtml(s.byBandwidth)}</p>` +
    distBars(
      distribution(ports, (p) => p.bandwidth_mbps).sort((a, b) => b[0] - a[0]),
      { formatLabel: formatBandwidth, unit: 'ports' }
    ) + `</div>` +
    `</div>` +
    `<div class="split-grid">` +
    `<div><p class="label">${escapeHtml(s.byPolicy)}</p>` +
    distBars(distribution(members, (m) => m.policy), { unit: 'members' }) + `</div>` +
    `<div><p class="label">${escapeHtml(s.biggestMembers)}</p>` +
    byBandwidth
      .map((m) =>
        barRow({
          label: m.name, value: memberBandwidth(m),
          max: memberBandwidth(byBandwidth[0]),
          display: formatBandwidth(memberBandwidth(m)),
          accent: TYPE_COLORS[m.network?.type] ?? 'var(--blue-fg)',
        })
      )
      .join('') + explainer(s.biggestMembersExplain) + `</div>` +
    `</div></section>` +

    // ---- BIX és a világ ----
    worldSection(data.global) +

    // ---- Érdekességek ----
    `<section class="section">` +
    `<p class="eyebrow">${escapeHtml(s.factsEyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.factsTitle)}</h2>` +
    `<div class="fact-grid">` +
    (byIx.length
      ? factCard(0, 'blue', escapeHtml(s.facts.reachTitle),
          s.facts.reachBody
            .replace('{name}', `<strong>${escapeHtml(byIx[0].name)}</strong>`)
            .replace('{n}', `<strong>${formatInt(byIx[0].network.ix_count)}</strong>`))
      : '') +
    (vix && decix
      ? factCard(1, 'orange', escapeHtml(s.facts.viennaTitle),
          s.facts.viennaBody
            .replace('{n}', `<strong>${formatInt(vix.shared)}</strong>`)
            .replace('{de}', `<strong>${formatInt(decix.shared)}</strong>`))
      : '') +
    factCard(2, 'green', escapeHtml(s.facts.redundancyTitle),
      s.facts.redundancyBody
        .replace('{multi}', `<strong>${formatInt(red.multiPortMembers)}</strong>`)
        .replace('{backup}', `<strong>${formatInt(red.backupPorts)}</strong>`)) +
    (head.length
      ? factCard(3, 'purple', escapeHtml(s.facts.headroomTitle),
          s.facts.headroomBody.replace('{n}', `<strong>${formatInt(head.length)}</strong>`))
      : '') +
    factCard(4, 'teal', escapeHtml(s.facts.ipv6Title),
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
          display: `${formatInt(m.network.ix_count)} IXPs`,
          accent: TYPE_COLORS[m.network?.type] ?? 'var(--blue-fg)',
        })
      )
      .join('') + `</div>` +
    `<div><p class="label">${escapeHtml(s.topPrefixes)}</p>` +
    byPrefix
      .map((m) =>
        barRow({
          label: m.name, value: m.network.prefixes4, max: byPrefix[0].network.prefixes4,
          display: formatInt(m.network.prefixes4),
          accent: TYPE_COLORS[m.network?.type] ?? 'var(--blue-fg)',
        })
      )
      .join('') + `</div>` +
    `</div></section>` +

    // ---- Növekedés ----
    (buckets.length
      ? `<section class="section reveal">` +
        `<p class="eyebrow">${escapeHtml(s.growthEyebrow)}</p>` +
        `<h2 class="section-title">${escapeHtml(s.growthTitle)}</h2>` +
        `<p class="lede">${escapeHtml(
          s.growthLede
            .replace('{gbps}', formatInt(Math.round(totalCapacityMbps(members) / 1000)))
            .replace('{n}', formatInt(members.length))
        )}</p>` +
        `<div class="split-grid">` +
        `<div><p class="label">${escapeHtml(s.growthCapacityTitle)}</p>` +
        cumulativeChart({
          buckets: buckets.map((b) => ({ label: b.label, value: b.mbps / 1000 })),
          width: 470, height: 220, accent: '#B26A00',
          yUnit: s.growthCapacityUnit,
          yFormat: (v) => formatInt(Math.round(v)),
        }) +
        `<p class="chart-note">${escapeHtml(s.growthCapacityNote)}</p></div>` +
        `<div><p class="label">${escapeHtml(s.growthCountTitle)}</p>` +
        cumulativeChart({
          buckets: buckets.map((b) => ({ label: b.label, value: b.count })),
          width: 470, height: 220,
          yUnit: s.growthCountUnit,
          yFormat: (v) => formatInt(Math.round(v)),
        }) +
        `<p class="chart-note">${escapeHtml(s.growthCountNote)}</p></div>` +
        `</div>` +
        `<p class="note note--warning">${icons.warning}<strong>${escapeHtml(s.growthWarnTitle)}</strong> ` +
        escapeHtml(s.growthCaption) + `</p>` +
        `</section>`
      : '')
  );
}
