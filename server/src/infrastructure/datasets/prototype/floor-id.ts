/** Source levels are numeric; public floor identifiers are opaque, path-safe strings. */
export function prototypeFloorId(level: number): string {
  if (!Number.isSafeInteger(level))
    throw new RangeError("Invalid prototype floor level");
  return level < 0 ? `B${Math.abs(level)}` : String(level);
}

/** Decode only identifiers produced by this adapter; reject numeric aliases. */
export function prototypeFloorLevel(id: string): number {
  const level = /^B[1-9]\d*$/.test(id) ? -Number(id.slice(1)) : Number(id);
  return Number.isSafeInteger(level) && prototypeFloorId(level) === id
    ? level
    : NaN;
}
