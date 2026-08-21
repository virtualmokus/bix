// Származtatott statisztikák. Mind tiszta függvény: adat be, adat ki, se DOM,
// se hálózat — ezért mind tesztelhető.

/** Gyakoriság szerinti eloszlás, csökkenő sorrendben. A null/üres érték kimarad. */
export function distribution(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (key === null || key === undefined || key === '') continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

/** A legnagyobb N elem egy numerikus mező szerint; a hiányzó értékűek kiesnek. */
export function topBy(items, valueFn, n = 5) {
  return items
    .filter((item) => Number.isFinite(valueFn(item)))
    .sort((a, b) => valueFn(b) - valueFn(a))
    .slice(0, n);
}

export function sumBy(items, valueFn) {
  return items.reduce((total, item) => total + (Number(valueFn(item)) || 0), 0);
}

/** Egy tag összes portjának együttes sávszélessége. */
export function memberBandwidth(member) {
  return sumBy(member.ports ?? [], (p) => p.bandwidth_mbps);
}

/**
 * A nyitóoldal kulcsszámai. A `traffic` a legutolsó mérés vagy null.
 * A `reportedPorts` a bix.hu főoldalának portszáma — ez több, mint amennyi
 * a publikus statisztikában szerepel, és a különbséget ki kell írni.
 */
export function keyFigures({ members, ports, traffic }) {
  const nodes = distribution(ports, (p) => p.node);
  const bandwidths = ports.map((p) => p.bandwidth_mbps).filter(Number.isFinite);

  return {
    networksReported: traffic?.networks ?? null,
    portsReported: traffic?.ports ?? null,
    portsPublic: ports.length,
    members: members.length,
    nodes: nodes.length,
    largestPortMbps: bandwidths.length ? Math.max(...bandwidths) : null,
    installedGbps: traffic?.capacity_gbps ?? null,
    peakGbps: traffic?.peak_gbps ?? null,
    // A publikus statisztika a bejelentett portoknak csak egy részét fedi le.
    coveragePercent: traffic?.ports ? (ports.length / traffic.ports) * 100 : null,
  };
}

/** Hány tagnak van több portja, és hány porton szerepel „backup" megjegyzés. */
export function redundancy(members, ports) {
  const multiPort = members.filter((m) => (m.ports?.length ?? 0) > 1);
  const backupPorts = ports.filter((p) => /backup/i.test(p.note ?? ''));
  const multiNode = members.filter(
    (m) => new Set((m.ports ?? []).map((p) => p.node)).size > 1
  );
  return {
    multiPortMembers: multiPort.length,
    multiNodeMembers: multiNode.length,
    backupPorts: backupPorts.length,
  };
}

/**
 * Kinek van tartaléka: a megjegyzés elárulja, ha valaki nagyobb fizikai portot
 * vett, mint amennyi sávszélességet előfizetett — például „1Gbps on 10G”.
 * Visszaadja az előfizetett és a fizikai kapacitást Mb/s-ben.
 */
export function headroom(ports) {
  const RE = /(\d+(?:\.\d+)?)\s*Gbps\s+on\s+(\d+(?:\.\d+)?)\s*G/i;

  return ports
    .map((port) => {
      const match = RE.exec(port.note ?? '');
      if (!match) return null;
      const subscribed = Number(match[1]) * 1000;
      const physical = Number(match[2]) * 1000;
      if (!(physical > subscribed)) return null;
      return { ...port, subscribed_mbps: subscribed, physical_mbps: physical };
    })
    .filter(Boolean);
}

/** Hány tag hirdet IPv6-ot, illetve peerel route-serverrel. */
export function adoption(members) {
  const withNetwork = members.filter((m) => m.network);
  return {
    total: members.length,
    ipv6: members.filter((m) => m.ipv6).length,
    routeServer: members.filter((m) => m.is_rs_peer).length,
    announcesIpv6: withNetwork.filter((m) => (m.network.prefixes6 ?? 0) > 0).length,
    profiled: withNetwork.length,
  };
}
