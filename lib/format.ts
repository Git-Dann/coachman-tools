/** Number formatting. British English, tabular figures everywhere digits line up. */

const nf = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

export function fmt(n: number): string {
  return nf.format(n);
}

/** Millions get abbreviated once they pass a million, as in the reference. */
export function fmtRows(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}m` : fmt(n);
}

/** Two-digit step numbers: 01, 02 ... 16. */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
