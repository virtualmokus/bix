// Netflix 4K stream nagyságrendje. Exportált, hogy a felirat és a teszt
// ugyanabból a számból dolgozzon — ne lehessen szétcsúszni.
export const STREAM_MBPS = 15;

export function concurrent4kStreams(gbps) {
  return Math.round((gbps * 1000) / STREAM_MBPS);
}

export function gigabytesPerSecond(gbps) {
  return gbps / 8;
}

export function utilizationPercent(current, capacity) {
  if (!capacity) return 0;
  return (current / capacity) * 100;
}
