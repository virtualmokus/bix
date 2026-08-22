import strings from '../i18n.js';
import { formatInt } from '../format.js';
import { escapeHtml } from '../chart.js';
import { relatedExchanges, sharedCableExchanges } from './map.js';

const s = strings.exchange;

/**
 * Egyetlen csomópont minden ismert adata egy szerkezetben. Ez a függvény a
 * nézet és a letölthető JSON közös forrása — így amit a képernyőn látsz, az
 * pontosan az, amit letöltesz.
 */
export function buildDossier(data, ixId) {
  const exchanges = data.global?.exchanges ?? [];
  const exchange = exchanges.find((e) => e.id === Number(ixId));
  if (!exchange) return null;

  const memberById = new Map((data.members ?? []).map((m) => [m.asn, m]));
  const cableIndex = data.cables?.exchanges ?? {};
  const cableById = new Map((data.cables?.cables ?? []).map((c) => [c.id, c]));
  const landingById = new Map((data.cables?.landings ?? []).map((l) => [l.id, l]));
  const cableInfo = cableIndex[exchange.id] ?? null;

  const members = (exchange.asns ?? [])
    .map((asn) => {
      const m = memberById.get(asn);
      return {
        asn,
        name: m?.name ?? `AS${asn}`,
        type: m?.network?.type ?? null,
        scope: m?.network?.scope ?? null,
        ix_count: m?.network?.ix_count ?? null,
        prefixes4: m?.network?.prefixes4 ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const cables = (cableInfo?.cables ?? [])
    .map((id) => {
      const cable = cableById.get(id);
      const detail = data.cables?.details?.[id] ?? {};
      return cable
        ? {
            id,
            name: cable.name,
            countries: cable.countries ?? [],
            owners: detail.owners ?? null,
            suppliers: detail.suppliers ?? null,
            length: detail.length ?? null,
            rfs: detail.rfs ?? null,
            is_planned: Boolean(detail.is_planned),
            url: detail.url ?? null,
          }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  const landings = (cableInfo?.landings ?? []).map((l) => ({
    id: l.id,
    km: l.km,
    name: landingById.get(l.id)?.name ?? l.id,
    country: landingById.get(l.id)?.country ?? null,
  }));

  return {
    exchange: {
      id: exchange.id,
      name: exchange.name,
      city: exchange.city,
      country: exchange.country,
      region: exchange.region,
      latitude: exchange.lat,
      longitude: exchange.lng,
      name_long: exchange.name_long ?? null,
      aka: exchange.aka ?? null,
      networks_total: exchange.net_count,
      bix_members_present: exchange.shared,
      ipv6_on_fabric: exchange.proto_ipv6 ?? null,
      service_level: exchange.service_level ?? null,
      official_website: exchange.website ?? null,
      official_statistics: exchange.url_stats ?? null,
      status_dashboard: exchange.status_dashboard ?? null,
      peeringdb_url: `https://www.peeringdb.com/ix/${exchange.id}`,
    },
    submarine: {
      nearest_landing: cableInfo?.nearest_landing ?? null,
      nearest_landing_km: cableInfo?.nearest_km ?? null,
      cables_within_150km: cables.length,
      landings_within_150km: landings,
      cables,
    },
    bix_members: members,
    shares_networks_with: relatedExchanges(exchange, exchanges, 25).map((r) => ({
      id: r.exchange.id,
      name: r.exchange.name,
      city: r.exchange.city,
      shared_networks: r.overlap,
    })),
    shares_cable_with: sharedCableExchanges(exchange.id, cableIndex, exchanges, 25).map((r) => ({
      id: r.exchange.id,
      name: r.exchange.name,
      city: r.exchange.city,
      shared_cables: r.cables.length,
    })),
    generated_at: new Date().toISOString(),
    sources: {
      exchange_and_members: 'PeeringDB',
      submarine_cables: 'TeleGeography Submarine Cable Map (CC BY-NC-SA 3.0)',
    },
  };
}

function stat(value, label) {
  return `<div><strong class="mono">${value}</strong><span>${escapeHtml(label)}</span></div>`;
}

function dl(rows) {
  const filled = rows.filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (filled.length === 0) return '';
  return (
    `<dl class="kv">` +
    filled.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${v}</dd>`).join('') +
    `</dl>`
  );
}

function table(headers, rows, emptyText) {
  if (rows.length === 0) return `<p class="hint">${escapeHtml(emptyText)}</p>`;
  return (
    `<div class="table-scroll"><table class="table table--dense"><thead><tr>` +
    headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('') +
    `</tr></thead><tbody>` +
    rows.map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('') +
    `</tbody></table></div>`
  );
}

export function render(data, ixId) {
  const dossier = buildDossier(data, ixId);
  if (!dossier) {
    return (
      `<section class="section"><p class="note note--warning">` +
      `${escapeHtml(s.notFound.replace('{id}', String(ixId)))}</p>` +
      `<p><button type="button" class="btn btn--ghost" data-goto-view="map">${escapeHtml(s.backToMap)}</button></p>` +
      `</section>`
    );
  }

  const x = dossier.exchange;
  const sub = dossier.submarine;
  const place = [x.city, x.country, x.region].filter(Boolean).join(' · ');

  return (
    `<section class="section">` +
    `<p class="eyebrow">${escapeHtml(s.eyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(x.name)}</h2>` +
    `<p class="lede">${escapeHtml(place)}</p>` +
    `<div class="ix-actions">` +
    `<button type="button" class="btn btn--ghost" data-goto-view="map">${escapeHtml(s.backToMap)}</button>` +
    `<button type="button" class="btn" id="ix-download">${escapeHtml(s.download)}</button>` +
    `<button type="button" class="btn btn--ghost" id="ix-copy">${escapeHtml(s.copy)}</button>` +
    (x.official_website
      ? `<a class="btn" href="${escapeHtml(x.official_website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.visitSite)}</a>`
      : '') +
    (x.official_statistics
      ? `<a class="btn btn--ghost" href="${escapeHtml(x.official_statistics)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.visitStats)}</a>`
      : '') +
    `<a class="btn btn--ghost" href="${escapeHtml(x.peeringdb_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.peeringdb)}</a>` +
    `</div>` +
    `<p class="hint">${escapeHtml(s.officialNote)}</p>` +
    `</section>` +

    `<section class="section reveal">` +
    `<div class="panel-stats ix-stats">` +
    stat(formatInt(x.networks_total ?? 0), s.stats.networks) +
    stat(formatInt(x.bix_members_present ?? 0), s.stats.bixMembers) +
    stat(formatInt(dossier.shares_networks_with.length), s.stats.relatedIx) +
    stat(formatInt(sub.cables_within_150km), s.stats.cables) +
    `</div>` +
    dl([
      [s.fields.id, `<span class="mono">${x.id}</span>`],
      [s.fields.city, escapeHtml(x.city ?? '—')],
      [s.fields.country, escapeHtml(x.country ?? '—')],
      [s.fields.region, escapeHtml(x.region ?? '—')],
      [s.fields.coords, x.latitude != null
        ? `<span class="mono">${x.latitude}, ${x.longitude}</span>` : '—'],
      [s.fields.longName, x.name_long ? escapeHtml(x.name_long) : null],
      [s.fields.alsoKnown, x.aka ? escapeHtml(x.aka) : null],
      [s.fields.website, x.official_website
        ? `<a href="${escapeHtml(x.official_website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(x.official_website)}</a>` : null],
      [s.fields.stats, x.official_statistics
        ? `<a href="${escapeHtml(x.official_statistics)}" target="_blank" rel="noopener noreferrer">${escapeHtml(x.official_statistics)}</a>` : null],
      [s.fields.dashboard, x.status_dashboard
        ? `<a href="${escapeHtml(x.status_dashboard)}" target="_blank" rel="noopener noreferrer">${escapeHtml(x.status_dashboard)}</a>` : null],
      [s.fields.ipv6, x.ipv6_on_fabric === null ? null : (x.ipv6_on_fabric ? 'yes' : 'no')],
      [s.fields.serviceLevel, x.service_level ? escapeHtml(x.service_level) : null],
      [s.fields.nearestLanding, sub.nearest_landing
        ? `${escapeHtml(sub.nearest_landing)} <span class="mono">(${formatInt(sub.nearest_landing_km)} km)</span>`
        : '—'],
    ]) +
    `</section>` +

    `<section class="section reveal">` +
    `<p class="label">${escapeHtml(s.sections.members)}</p>` +
    `<p class="hint">${escapeHtml(s.membersHint)}</p>` +
    table(
      [s.cols.member, s.cols.asn, s.cols.type, s.cols.scope, s.cols.ix, s.cols.prefixes],
      dossier.bix_members.map((m) => [
        escapeHtml(m.name),
        `<span class="mono">${m.asn}</span>`,
        escapeHtml(m.type ?? '—'),
        escapeHtml(m.scope ?? '—'),
        m.ix_count != null ? `<span class="mono">${formatInt(m.ix_count)}</span>` : '—',
        m.prefixes4 != null ? `<span class="mono">${formatInt(m.prefixes4)}</span>` : '—',
      ]),
      s.empty.members
    ) +
    `</section>` +

    `<section class="section reveal">` +
    `<p class="label">${escapeHtml(s.sections.cables)}</p>` +
    (sub.cables_within_150km === 0
      ? `<p class="note note--warning">${escapeHtml(
          s.inland
            .replace('{landing}', sub.nearest_landing ?? '—')
            .replace('{km}', formatInt(sub.nearest_landing_km ?? 0))
        )}</p>`
      : table(
          [s.cols.cable, s.cols.owners, s.cols.builder, s.cols.length, s.cols.rfs, s.cols.lands],
          sub.cables.map((c) => [
            c.url
              ? `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.name)}</a>`
              : escapeHtml(c.name),
            escapeHtml(c.owners ?? '—'),
            escapeHtml(c.suppliers ?? '—'),
            escapeHtml(c.length ?? '—'),
            escapeHtml(c.rfs ?? '—') + (c.is_planned ? ` <span class="badge">${escapeHtml(s.planned)}</span>` : ''),
            escapeHtml(c.countries.join(', ') || '—'),
          ]),
          s.empty.cables
        )) +
    `</section>` +

    `<section class="section reveal">` +
    `<div class="split-grid">` +
    `<div><p class="label">${escapeHtml(s.sections.relatedIx)}</p>` +
    `<p class="hint">${escapeHtml(s.relatedHint)}</p>` +
    table(
      [s.cols.exchange, s.cols.city, s.cols.sharedNetworks],
      dossier.shares_networks_with.map((r) => [
        `<button type="button" class="link-btn" data-open-ix="${r.id}">${escapeHtml(r.name)}</button>`,
        escapeHtml(r.city ?? '—'),
        `<span class="mono">${formatInt(r.shared_networks)}</span>`,
      ]),
      s.empty.related
    ) + `</div>` +
    `<div><p class="label">${escapeHtml(s.sections.sharedCable)}</p>` +
    `<p class="hint">${escapeHtml(s.sharedCableHint)}</p>` +
    table(
      [s.cols.exchange, s.cols.city, s.cols.sharedCables],
      dossier.shares_cable_with.map((r) => [
        `<button type="button" class="link-btn" data-open-ix="${r.id}">${escapeHtml(r.name)}</button>`,
        escapeHtml(r.city ?? '—'),
        `<span class="mono">${formatInt(r.shared_cables)}</span>`,
      ]),
      s.empty.sharedCable
    ) + `</div>` +
    `</div></section>` +

    (sub.landings_within_150km.length
      ? `<section class="section reveal">` +
        `<p class="label">${escapeHtml(s.sections.landings)}</p>` +
        table(
          [s.cols.landing, s.cols.country, s.cols.distance],
          sub.landings_within_150km.map((l) => [
            escapeHtml(l.name),
            escapeHtml(l.country ?? '—'),
            `<span class="mono">${formatInt(l.km)} km</span>`,
          ]),
          s.empty.landings
        ) +
        `</section>`
      : '')
  );
}

export function mount(root, data, ixId) {
  const dossier = buildDossier(data, ixId);
  if (!dossier) return;

  const json = JSON.stringify(dossier, null, 2);
  const filename = `bix-exchange-${dossier.exchange.id}-${(dossier.exchange.name ?? 'ix')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}.json`;

  root.querySelector('#ix-download')?.addEventListener('click', () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });

  const copyBtn = root.querySelector('#ix-copy');
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(json);
      copyBtn.textContent = s.copied;
      setTimeout(() => { copyBtn.textContent = s.copy; }, 1600);
    } catch {
      copyBtn.textContent = s.copyFailed;
      setTimeout(() => { copyBtn.textContent = s.copy; }, 1600);
    }
  });
}
