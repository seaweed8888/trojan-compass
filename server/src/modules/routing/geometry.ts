import type { Vector3 } from "@trojan-compass/shared/api";
import type { PointXZ, PolygonXZ } from "../../ports/navigation-source.js";
import { dataError } from "../../lib/errors.js";

export const EPS = 1e-7;
export const distance = (a: Vector3, b: Vector3) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const interpolate = (a: Vector3, b: Vector3, t: number): Vector3 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
});
export const polylineLength = (points: readonly Vector3[]) =>
  points.slice(1).reduce((sum, p, i) => sum + distance(points[i]!, p), 0);
const cross = (a: PointXZ, b: PointXZ, c: PointXZ) =>
  (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
const same = (a: PointXZ, b: PointXZ) =>
  Math.abs(a.x - b.x) < EPS && Math.abs(a.z - b.z) < EPS;
function onSegment(p: PointXZ, a: PointXZ, b: PointXZ) {
  return (
    Math.abs(cross(a, b, p)) < EPS &&
    p.x >= Math.min(a.x, b.x) - EPS &&
    p.x <= Math.max(a.x, b.x) + EPS &&
    p.z >= Math.min(a.z, b.z) - EPS &&
    p.z <= Math.max(a.z, b.z) + EPS
  );
}
export function inRing(
  p: PointXZ,
  ring: readonly PointXZ[],
  boundary = true,
): boolean {
  let inside = false;
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i]!,
      b = ring[i + 1]!;
    if (onSegment(p, a, b)) return boundary;
    if (
      a.z > p.z !== b.z > p.z &&
      p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x
    )
      inside = !inside;
  }
  return inside;
}
export function inPolygon(p: PointXZ, polygon: PolygonXZ, boundary = true) {
  return (
    inRing(p, polygon.outer, boundary) &&
    !polygon.holes.some((h) => inRing(p, h, !boundary))
  );
}
function intersections(
  a: PointXZ,
  b: PointXZ,
  c: PointXZ,
  d: PointXZ,
): number[] {
  const rx = b.x - a.x,
    rz = b.z - a.z,
    sx = d.x - c.x,
    sz = d.z - c.z;
  const denominator = rx * sz - rz * sx;
  if (Math.abs(denominator) < EPS) {
    if (Math.abs(cross(a, b, c)) > EPS) return [];
    const length2 = rx * rx + rz * rz;
    if (length2 < EPS * EPS) return onSegment(a, c, d) ? [0] : [];
    return [c, d]
      .filter((p) => onSegment(p, a, b))
      .map((p) => ((p.x - a.x) * rx + (p.z - a.z) * rz) / length2)
      .concat(onSegment(a, c, d) ? [0] : [], onSegment(b, c, d) ? [1] : []);
  }
  const t = ((c.x - a.x) * sz - (c.z - a.z) * sx) / denominator;
  const u = ((c.x - a.x) * rz - (c.z - a.z) * rx) / denominator;
  return t >= -EPS && t <= 1 + EPS && u >= -EPS && u <= 1 + EPS
    ? [Math.max(0, Math.min(1, t))]
    : [];
}
function ringsIntersect(a: PointXZ[], b: PointXZ[]) {
  return a
    .slice(1)
    .some((p, i) =>
      b.slice(1).some((q, j) => intersections(a[i]!, p, b[j]!, q).length > 0),
    );
}
export function validatePolygon(
  polygon: PolygonXZ,
  check: () => void = () => {},
): void {
  for (const ring of [polygon.outer, ...polygon.holes]) {
    if (ring.length < 4 || ring.length > 2048 || !same(ring[0]!, ring.at(-1)!))
      throw dataError("polygon rings must be closed with 3–2047 vertices");
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      if (i % 32 === 0) check();
      const a = ring[i]!,
        b = ring[i + 1]!;
      if (same(a, b)) throw dataError("polygon has a zero-length edge");
      area += a.x * b.z - b.x * a.z;
      for (let j = i + 2; j < ring.length - 1; j++) {
        if (i === 0 && j === ring.length - 2) continue;
        if (intersections(a, b, ring[j]!, ring[j + 1]!).length)
          throw dataError("self-intersecting polygon");
      }
    }
    if (Math.abs(area) < EPS) throw dataError("zero-area polygon");
  }
  for (const [i, hole] of polygon.holes.entries()) {
    if (
      !inRing(hole[0]!, polygon.outer, false) ||
      ringsIntersect(hole, polygon.outer)
    )
      throw dataError("hole must lie strictly inside polygon");
    for (const other of polygon.holes.slice(i + 1))
      if (
        ringsIntersect(hole, other) ||
        inRing(hole[0]!, other) ||
        inRing(other[0]!, hole)
      )
        throw dataError("polygon holes intersect");
  }
}

/** Test all intervals created by polygon boundaries; sampling alone misses thin walls. */
export function segmentWalkable(
  a: Vector3,
  b: Vector3,
  allowed: PolygonXZ[],
  blocked: PolygonXZ[],
): boolean {
  const valid = (p: Vector3) =>
    allowed.some((r) => inPolygon(p, r)) &&
    !blocked.some((r) => inPolygon(p, r));
  if (!valid(a) || !valid(b)) return false;
  const cuts = [0, 1];
  for (const p of [...allowed, ...blocked])
    for (const ring of [p.outer, ...p.holes]) {
      for (let i = 1; i < ring.length; i++)
        cuts.push(...intersections(a, b, ring[i - 1]!, ring[i]!));
    }
  cuts.sort((x, y) => x - y);
  for (const t of cuts) if (!valid(interpolate(a, b, t))) return false;
  for (let i = 1; i < cuts.length; i++)
    if (!valid(interpolate(a, b, (cuts[i - 1]! + cuts[i]!) / 2))) return false;
  return true;
}

export function projectPolyline(p: Vector3, points: readonly Vector3[]) {
  let offset = 0;
  let best = { point: points[0]!, distance: Infinity, offset: 0 };
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!,
      b = points[i]!,
      length = distance(a, b);
    const t =
      length > EPS
        ? Math.max(
            0,
            Math.min(
              1,
              ((p.x - a.x) * (b.x - a.x) +
                (p.y - a.y) * (b.y - a.y) +
                (p.z - a.z) * (b.z - a.z)) /
                (length * length),
            ),
          )
        : 0;
    const point = interpolate(a, b, t),
      d = distance(point, p);
    if (d < best.distance)
      best = { point, distance: d, offset: offset + t * length };
    offset += length;
  }
  return best;
}

export function slicePolyline(
  points: readonly Vector3[],
  start: number,
  end: number,
): Vector3[] {
  const result: Vector3[] = [];
  let offset = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!,
      b = points[i]!,
      length = distance(a, b),
      next = offset + length;
    if (next >= start - EPS && offset <= end + EPS && length > EPS) {
      const lo = interpolate(
        a,
        b,
        Math.max(0, Math.min(1, (start - offset) / length)),
      );
      const hi = interpolate(
        a,
        b,
        Math.max(0, Math.min(1, (end - offset) / length)),
      );
      if (!result.length || distance(result.at(-1)!, lo) > EPS) result.push(lo);
      if (distance(result.at(-1)!, hi) > EPS) result.push(hi);
    }
    offset = next;
  }
  return result.length === 1 ? [result[0]!, result[0]!] : result;
}
