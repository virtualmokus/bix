/**
 * Útvonal-értelmezés. Külön modul, mert az app.js betöltéskor azonnal
 * adatot tölt és DOM-hoz nyúl — így ez a rész tesztelhető marad.
 *
 * `#ix/31` → { name: 'ix', param: '31' }
 * `#members` → { name: 'members', param: null }
 * bármi ismeretlen → az áttekintés
 */
export function parseHash(hash, views) {
  const [name, param] = String(hash).replace(/^#/, '').split('/');
  if (name === 'ix' && param) return { name: 'ix', param };
  return { name: views.includes(name) ? name : 'overview', param: null };
}
