import { parseTrafficCsv } from './csv-parse.js';

// Forrásonkénti elavultsági küszöb percben.
// A forgalmi gyűjtő 15 percenként fut; 45 perc három kihagyott futás.
const STALE_AFTER_MINUTES = {
  traffic: 45,
  ports: 48 * 60,
  peeringdb: 48 * 60,
  members: 48 * 60,
};

/**
 * A GitHub Pages `max-age=600`-zal szolgálja ki a JSON-okat, így egy
 * visszatérő látogató tíz perces adatot láthatna, miközben az „ÉLŐ" jelvény
 * frissnek mutatja. Ötperces gyűjtőablakra kerekített bélyeggel a böngésző
 * legfeljebb ennyit tart meg, de nem kér le mindent minden kattintásra.
 */
export function cacheBust(now = Date.now(), windowMs = 5 * 60 * 1000) {
  return Math.floor(now / windowMs);
}

export async function loadAll(fetchFn, base = 'data') {
  const v = cacheBust();
  const at = (name) => `${base}/${name}?v=${v}`;
  const [csv, members, ports, meta, global, cables, borders] = await Promise.all([
    fetchFn(at('traffic.csv')).then((r) => r.text()),
    fetchFn(at('members.json')).then((r) => r.json()),
    fetchFn(at('ports.json')).then((r) => r.json()),
    fetchFn(at('meta.json')).then((r) => r.json()),
    // A globális réteg opcionális: nélküle az oldal többi része él marad.
    fetchFn(at('global.json')).then((r) => r.json()).catch(() => null),
    // A tengeralatti kábelréteg is opcionális — hiánya nem dönti el az oldalt.
    fetchFn(at('cables.json')).then((r) => r.json()).catch(() => null),
    // Országhatárok: statikus, ritkán változó geometria.
    fetchFn(at('borders.json')).then((r) => r.json()).catch(() => null),
  ]);

  return {
    traffic: parseTrafficCsv(csv),
    members: members.members ?? [],
    ports: ports.ports ?? [],
    meta,
    global: global ?? null,
    cables: cables ?? null,
    borders: borders ?? null,
  };
}

export function staleness(meta, source, now) {
  const lastSuccess = meta?.[source]?.last_success;
  if (!lastSuccess) return { minutes: null, isStale: true };

  const minutes = Math.floor((now.getTime() - new Date(lastSuccess).getTime()) / 60000);
  const threshold = STALE_AFTER_MINUTES[source] ?? 48 * 60;
  return { minutes, isStale: minutes > threshold };
}
