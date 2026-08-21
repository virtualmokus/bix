export class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParseError';
  }
}

// A bix.hu főoldalon pontosan öt ilyen pár van, ebben a sorrendben.
// Az "aktuáls" elgépelés a forrásoldalé — ha egyszer javítják, az
// "aktuális" változatot is elfogadjuk.
const LABELS = [
  { key: 'networks', accept: ['hálózat'] },
  { key: 'ports', accept: ['port'] },
  { key: 'peak_gbps', accept: ['(gb/s) csúcs'] },
  { key: 'current_gbps', accept: ['(gb/s) aktuáls', '(gb/s) aktuális'] },
  { key: 'capacity_gbps', accept: ['(gb/s) kapacitás'] },
];

const PAIR_RE =
  /<div class="value">\s*([0-9]+(?:\.[0-9]+)?)\s*<\/div>\s*<div class="name">\s*([^<]+?)\s*<\/div>/g;

export function parseTraffic(html) {
  const pairs = [...html.matchAll(PAIR_RE)].map((m) => ({
    value: Number(m[1]),
    label: m[2].toLowerCase().replace(/\s+/g, ' ').trim(),
  }));

  if (pairs.length !== LABELS.length) {
    throw new ParseError(
      `${LABELS.length} érték/címke párt vártam, ${pairs.length} volt: ` +
        pairs.map((p) => p.label).join(' | ')
    );
  }

  const out = {};
  for (let i = 0; i < LABELS.length; i++) {
    const { key, accept } = LABELS[i];
    const pair = pairs[i];
    if (!accept.includes(pair.label)) {
      throw new ParseError(
        `A(z) ${i + 1}. mező címkéje "${pair.label}", vártam: ${accept.join(' vagy ')}`
      );
    }
    out[key] = pair.value;
  }
  return out;
}
