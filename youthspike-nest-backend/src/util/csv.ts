export function parseCSV(text: string, sep = ',') {
  const rows = text
    .split('\n')
    .map((i) => i.split(sep).map((i) => i.trim().replaceAll('"', '')));
  const header = rows[0];

  return rows.slice(1).map((row) => {
    const out: any = {};
    header.forEach((i, j) => (out[i] = row[j]));
    return out;
  });
}
