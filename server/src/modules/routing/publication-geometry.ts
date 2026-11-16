import type { Vector3 } from "@trojan-compass/shared";
import type { PublishedNavigation as NavigationSource } from "../../infrastructure/datasets/publication-format.js";
export const distance = (a: Vector3, b: Vector3) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export function project(p: Vector3, a: Vector3, b: Vector3) {
  const length = (b.x - a.x) ** 2 + (b.z - a.z) ** 2;
  const t = length
    ? Math.max(
        0,
        Math.min(
          1,
          ((p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z)) / length,
        ),
      )
    : 0;
  return { x: a.x + t * (b.x - a.x), y: a.y, z: a.z + t * (b.z - a.z) };
}
export function obstructed(
  a: Vector3,
  b: Vector3,
  floorId: string,
  barriers: NavigationSource["barriers"],
) {
  return barriers.some((r) => {
    if (r.floorId !== floorId) return false;
    let low = 0,
      high = 1;
    for (const axis of ["x", "z"] as const) {
      const d = b[axis] - a[axis];
      if (Math.abs(d) < 1e-9) {
        if (a[axis] <= r.min[axis] || a[axis] >= r.max[axis]) return false;
      } else {
        let t0 = (r.min[axis] - a[axis]) / d,
          t1 = (r.max[axis] - a[axis]) / d;
        if (t0 > t1) [t0, t1] = [t1, t0];
        low = Math.max(low, t0);
        high = Math.min(high, t1);
        if (low >= high) return false;
      }
    }
    return low < high;
  });
}
export function walkable(
  p: Vector3,
  floorId: string,
  source: NavigationSource,
) {
  return source.walkable.some(
    (w) =>
      w.floorId === floorId &&
      distance(p, project(p, w.from, w.to)) <= w.radius,
  );
}
