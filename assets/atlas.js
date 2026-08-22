/**
 * Nézőpont-számítás az atlaszból.
 *
 * A gyűjtő nyers gráfot ad: melyik csomóponton mely hálózatok vannak jelen.
 * Az „ehhez képest" viszonyokat — közös tagok, rangsor, évjáratok — itt
 * számoljuk ki, futásidőben. Ezért lehet bármelyik csomópont a kiindulópont
 * anélkül, hogy újra kellene gyűjteni bármit.
 */

/** A kiválasztott csomópontra vonatkozó nézet, a régi `global` alakjában. */
export function buildHomeView(atlas, homeId) {
  if (!atlas?.exchanges?.length) return null;

  const id = Number(homeId ?? atlas.home_ix_id);
  const exists = atlas.exchanges.some((e) => e.id === id);
  const home = exists ? id : Number(atlas.home_ix_id);

  const homeMembers = new Set(atlas.members?.[home] ?? []);

  const exchanges = atlas.exchanges.map((exchange) => {
    const theirs = atlas.members?.[exchange.id] ?? [];
    // A saját csomópontnál a „közös" a teljes tagság — így a hazai pont
    // mindig a legerősebb, és a rangsorban is értelmes helyet kap.
    const asns =
      exchange.id === home ? [...homeMembers] : theirs.filter((asn) => homeMembers.has(asn));
    return { ...exchange, shared: asns.length, asns };
  });

  return { home_ix_id: home, exchanges };
}

/** Hányadik a csomópont tagszám szerint az összes közül? */
export function rankByMembers(exchanges, ixId) {
  const sorted = [...exchanges].sort((a, b) => (b.net_count ?? 0) - (a.net_count ?? 0));
  const index = sorted.findIndex((e) => e.id === Number(ixId));
  return index === -1 ? null : index + 1;
}

/**
 * Évjáratok egy csomóponthoz: hány hálózat rekordja jelent meg évenként.
 * A közbenső üres éveket kitöltjük, hogy a görbe ne ugorjon.
 */
export function cohortsFor(atlas, ixId) {
  const raw = atlas?.cohorts?.[ixId];
  if (!raw) return [];

  const years = Object.keys(raw).map(Number).sort((a, b) => a - b);
  if (years.length === 0) return [];

  const out = [];
  for (let y = years[0]; y <= years[years.length - 1]; y++) {
    out.push({ label: String(y), count: raw[y] ?? 0, mbps: 0 });
  }
  return out;
}

/** Hálózatnév-feloldó. Előbb a helyi tagadat, aztán az atlasz névtára. */
export function makeNameLookup(members, atlasNetworks) {
  const local = new Map((members ?? []).map((m) => [m.asn, m.name]));
  const global = atlasNetworks?.networks ?? {};

  return (asn) => local.get(asn) ?? global[asn]?.[0] ?? `AS${asn}`;
}

/** Hálózattípus az atlasz névtárából (a helyi profil ennél részletesebb). */
export function makeTypeLookup(members, atlasNetworks) {
  const local = new Map((members ?? []).map((m) => [m.asn, m.network?.type ?? null]));
  const global = atlasNetworks?.networks ?? {};

  return (asn) => local.get(asn) ?? global[asn]?.[1] ?? null;
}

/**
 * A hazai csomóponton kívül van-e port- és forgalmi adatunk? Csak a BIX-hez
 * van, mert az az egyetlen, aminek a nyers számait be tudjuk olvasni. Minden
 * más nézőpontnál ezt ki kell mondani, nem elhallgatni.
 */
export function hasLocalData(homeId, defaultHomeId) {
  return Number(homeId) === Number(defaultHomeId);
}
