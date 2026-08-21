const COLUMNS = ['ts', 'networks', 'ports', 'peak_gbps', 'current_gbps', 'capacity_gbps'];

export function parseTrafficCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length <= 1) return [];

  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(',');
    if (cells.length !== COLUMNS.length) continue; // sérült sor, kihagyjuk

    const row = { ts: cells[0] };
    let valid = true;
    for (let i = 1; i < COLUMNS.length; i++) {
      const value = Number(cells[i]);
      if (!Number.isFinite(value)) {
        valid = false;
        break;
      }
      row[COLUMNS[i]] = value;
    }
    if (valid) rows.push(row);
  }

  return rows.sort((a, b) => a.ts.localeCompare(b.ts));
}
