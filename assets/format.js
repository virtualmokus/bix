const LOCALE = 'hu-HU';

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

export function formatRelative(isoString, now) {
  if (!isoString) return '';

  const minutes = Math.floor((now.getTime() - new Date(isoString).getTime()) / 60000);
  if (minutes < 1) return 'épp most';
  if (minutes < 60) return `${minutes} perce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} órája`;

  return `${Math.floor(hours / 24)} napja`;
}
