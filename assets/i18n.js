import en from './strings.en.js';
import hu from './strings.hu.js';

export const BUNDLES = { en, hu };
export const LOCALES = [
  { code: 'en', label: 'EN', name: 'English', intl: 'en-GB' },
  { code: 'hu', label: 'HU', name: 'Magyar', intl: 'hu-HU' },
];

const STORAGE_KEY = 'bix-lang';
const DEFAULT = 'en';

/**
 * A nyelv sorrendben: `?lang=` paraméter → korábbi választás → alapértelmezés.
 * Szándékosan nem a böngésző nyelvéből indul: az oldal alapnyelve az angol,
 * a magyar tudatos választás.
 */
export function resolveLocale(search = '', stored = null) {
  const fromUrl = new URLSearchParams(search).get('lang');
  if (fromUrl && BUNDLES[fromUrl]) return fromUrl;
  if (stored && BUNDLES[stored]) return stored;
  return DEFAULT;
}

function readStored() {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null; // privát mód, letiltott tároló — nem baj, marad az alapértelmezés
  }
}

export const locale = resolveLocale(
  typeof location === 'undefined' ? '' : location.search,
  readStored()
);

export const intlLocale = LOCALES.find((l) => l.code === locale)?.intl ?? 'en-GB';

/**
 * Nyelvváltás. A modulok betöltéskor kötik be a szótárat, ezért a váltás
 * újratöltéssel jár — cserébe nincs kétszeres állapot és nincs félig lefordított
 * felület. A horgony megmarad, tehát ugyanazon az oldalon maradsz.
 */
export function setLocale(code) {
  if (!BUNDLES[code]) return;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, code);
  } catch {
    // Ha nincs tároló, az URL-paraméter viszi tovább a választást.
  }
  const url = new URL(location.href);
  url.searchParams.set('lang', code);
  location.href = url.toString();
}

export default BUNDLES[locale];
