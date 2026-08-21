export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

const RANGES = {
  current_gbps: { min: 0, max: 20000 },
  peak_gbps: { min: 0, max: 20000 },
  capacity_gbps: { min: 0, max: 100000 },
};

export function validateTraffic(t) {
  for (const [key, { min, max }] of Object.entries(RANGES)) {
    const v = t[key];
    if (!Number.isFinite(v) || v <= min || v >= max) {
      throw new ValidationError(`${key} tartományon kívül: ${v} (várt: ${min} < x < ${max})`);
    }
  }

  for (const key of ['networks', 'ports']) {
    const v = t[key];
    if (!Number.isInteger(v) || v <= 0) {
      throw new ValidationError(`${key} nem pozitív egész: ${v}`);
    }
  }

  if (t.current_gbps > t.capacity_gbps) {
    throw new ValidationError(
      `aktuális (${t.current_gbps}) meghaladja a kapacitást (${t.capacity_gbps})`
    );
  }
  if (t.peak_gbps > t.capacity_gbps) {
    throw new ValidationError(
      `csúcs (${t.peak_gbps}) meghaladja a kapacitást (${t.capacity_gbps})`
    );
  }
  if (t.ports < t.networks) {
    throw new ValidationError(`port (${t.ports}) kevesebb, mint hálózat (${t.networks})`);
  }

  return t;
}
