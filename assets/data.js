import { parseTrafficCsv } from './csv-parse.js';

// Forrásonkénti elavultsági küszöb percben.
// A forgalmi gyűjtő 15 percenként fut; 45 perc három kihagyott futás.
const STALE_AFTER_MINUTES = {
  traffic: 45,
  ports: 48 * 60,
  peeringdb: 48 * 60,
  members: 48 * 60,
};

export async function loadAll(fetchFn, base = 'data') {
  const [csv, members, ports, meta, global] = await Promise.all([
    fetchFn(`${base}/traffic.csv`).then((r) => r.text()),
    fetchFn(`${base}/members.json`).then((r) => r.json()),
    fetchFn(`${base}/ports.json`).then((r) => r.json()),
    fetchFn(`${base}/meta.json`).then((r) => r.json()),
    // A globális réteg opcionális: nélküle az oldal többi része él marad.
    fetchFn(`${base}/global.json`).then((r) => r.json()).catch(() => null),
  ]);

  return {
    traffic: parseTrafficCsv(csv),
    members: members.members ?? [],
    ports: ports.ports ?? [],
    meta,
    global: global ?? null,
  };
}

export function staleness(meta, source, now) {
  const lastSuccess = meta?.[source]?.last_success;
  if (!lastSuccess) return { minutes: null, isStale: true };

  const minutes = Math.floor((now.getTime() - new Date(lastSuccess).getTime()) / 60000);
  const threshold = STALE_AFTER_MINUTES[source] ?? 48 * 60;
  return { minutes, isStale: minutes > threshold };
}
