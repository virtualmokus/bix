import { intlLocale, locale } from './i18n.js';

const LOCALE = intlLocale;

export function formatDecimal(n, digits = 2) {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatInt(n) {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(n);
}

export function formatPercent(n, digits = 1) {
  return `${formatDecimal(n, digits)}%`;
}

export function formatBandwidth(mbps) {
  return mbps >= 1000 ? `${mbps / 1000}G` : `${mbps}M`;
}

// A magyar ragozás nem tűri a mechanikus „X ago” mintát, ezért nyelvenként
// külön alakok. A `formatRelativeIn` kiemelve, hogy tesztelhető legyen.
const RELATIVE = {
  en: {
    now: 'just now',
    minutes: (n) => `${n} min ago`,
    hours: (n) => (n === 1 ? '1 hour ago' : `${n} hours ago`),
    days: (n) => (n === 1 ? '1 day ago' : `${n} days ago`),
  },
  hu: {
    now: 'épp most',
    minutes: (n) => `${n} perce`,
    hours: (n) => `${n} órája`,
    days: (n) => `${n} napja`,
  },
};

export function formatRelativeIn(isoString, now, code = 'en') {
  if (!isoString) return '';
  const words = RELATIVE[code] ?? RELATIVE.en;

  const minutes = Math.floor((now.getTime() - new Date(isoString).getTime()) / 60000);
  if (minutes < 1) return words.now;
  if (minutes < 60) return words.minutes(minutes);

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return words.hours(hours);

  return words.days(Math.floor(hours / 24));
}

export function formatRelative(isoString, now) {
  return formatRelativeIn(isoString, now, locale);
}
