import type {
  Cell,
  FloorLayout,
} from "../../../infrastructure/datasets/prototype/floorplan.js";

export type Point = { x: number; z: number };
type Rect = [number, number, number, number];
// The rendered walls are 0.12 scene units thick. Keep the centerline outside them.
export const CLEARANCE = 0.09;
const EPS = 1e-7;
export const inside = (p: Point, r: Rect) =>
  p.x >= r[0] - EPS &&
  p.x <= r[2] + EPS &&
  p.z >= r[1] - EPS &&
  p.z <= r[3] + EPS;
export const cellRect = (c: Cell, padding = 0): Rect => [
  c.x0 - padding,
  c.z0 - padding,
  c.x1 + padding,
  c.z1 + padding,
];

/** Exact interval clipping catches walls between vertices, including very thin ones. */
function interval(a: Point, b: Point, r: Rect): [number, number] | null {
  let lo = 0,
    hi = 1;
  for (const [start, delta, min, max] of [
    [a.x, b.x - a.x, r[0], r[2]],
    [a.z, b.z - a.z, r[1], r[3]],
  ]) {
    if (Math.abs(delta!) < EPS) {
      if (start! < min! - EPS || start! > max! + EPS) return null;
    } else {
      const t1 = (min! - start!) / delta!,
        t2 = (max! - start!) / delta!;
      lo = Math.max(lo, Math.min(t1, t2));
      hi = Math.min(hi, Math.max(t1, t2));
      if (lo > hi + EPS) return null;
    }
  }
  return [lo, hi];
}
export function floorRects(layout: FloorLayout): Rect[] {
  const rects = [...layout.slabs];
  // Only authored entrance points may extend beyond the displayed slab outline.
  for (const e of layout.entrances) {
    const nearest = layout.slabs
      .map((r) => ({
        x: Math.max(r[0], Math.min(r[2], e.x)),
        z: Math.max(r[1], Math.min(r[3], e.z)),
      }))
      .sort(
        (a, b) =>
          Math.hypot(a.x - e.x, a.z - e.z) - Math.hypot(b.x - e.x, b.z - e.z),
      )[0]!;
    rects.push([
      Math.min(e.x, nearest.x) - 0.15,
      Math.min(e.z, nearest.z) - 0.15,
      Math.max(e.x, nearest.x) + 0.15,
      Math.max(e.z, nearest.z) + 0.15,
    ]);
  }
  return rects;
}
export function covered(a: Point, b: Point, rects: Rect[]) {
  const spans = rects
    .map((r) => interval(a, b, r))
    .filter((r): r is [number, number] => r !== null)
    .sort((a, b) => a[0] - b[0]);
  let end = 0;
  for (const [lo, hi] of spans) {
    if (lo > end + EPS) return false;
    end = Math.max(end, hi);
    if (end >= 1 - EPS) return true;
  }
  return false;
}
export function corridorClear(
  layout: FloorLayout,
  a: Point,
  b: Point,
  ignoreCell?: string,
) {
  if (!covered(a, b, floorRects(layout))) return false;
  return !layout.cells.some(
    (c) =>
      !c.open &&
      c.id !== ignoreCell &&
      interval(a, b, cellRect(c, CLEARANCE)) !== null,
  );
}
export function doorApproach(c: Cell): Point {
  const [x, z] = c.door,
    offset = CLEARANCE + 0.035;
  if (Math.abs(x - c.x0) < 0.001) return { x: x - offset, z };
  if (Math.abs(x - c.x1) < 0.001) return { x: x + offset, z };
  if (Math.abs(z - c.z0) < 0.001) return { x, z: z - offset };
  return { x, z: z + offset };
}
export function corridorCandidates(layout: FloorLayout): Point[] {
  const points: Point[] = [...layout.walkNodes];
  for (const c of layout.cells) {
    if (c.open) {
      points.push({ x: (c.x0 + c.x1) / 2, z: (c.z0 + c.z1) / 2 });
      continue;
    }
    const [x0, z0, x1, z1] = cellRect(c, CLEARANCE + 0.035);
    for (const x of [x0, x1]) for (const z of [z0, z1]) points.push({ x, z });
    if (c.kind !== "block") points.push(doorApproach(c));
  }
  // Concave corners of a union of slabs can be necessary turning points.
  for (const [x0, z0, x1, z1] of layout.slabs)
    for (const x of [x0, x1])
      for (const z of [z0, z1])
        for (const dx of [-0.035, 0.035])
          for (const dz of [-0.035, 0.035])
            points.push({ x: x + dx, z: z + dz });
  for (const e of layout.entrances) points.push({ x: e.x, z: e.z });
  return [
    ...new Map(
      points
        .filter((p) => corridorClear(layout, p, p))
        .map((p) => [`${p.x.toFixed(6)}:${p.z.toFixed(6)}`, p]),
    ).values(),
  ];
}
