import type { FloorGeometry, Place, Vector3 } from "@trojan-compass/shared";
import { distance, obstructed } from "./publication-geometry.js";

type Rectangle = { min: Vector3; max: Vector3 };

// Clip a segment to a floor rectangle. Merging these intervals checks the whole
// segment against the slab union, including recesses and gaps between slabs.
function interval(
  a: Vector3,
  b: Vector3,
  rect: Rectangle,
): [number, number] | null {
  let low = 0,
    high = 1;
  for (const axis of ["x", "z"] as const) {
    const delta = b[axis] - a[axis];
    if (Math.abs(delta) < 1e-9) {
      if (a[axis] < rect.min[axis] || a[axis] > rect.max[axis]) return null;
    } else {
      const ends = [
        (rect.min[axis] - a[axis]) / delta,
        (rect.max[axis] - a[axis]) / delta,
      ];
      low = Math.max(low, Math.min(...ends));
      high = Math.min(high, Math.max(...ends));
      if (low > high) return null;
    }
  }
  return [low, high];
}

export class OpenFloor {
  private slabs: Rectangle[] = [];
  private obstacles: (Rectangle & { floorId: string })[] = [];
  private corners?: Vector3[];

  constructor(geometry: FloorGeometry, places: Place[]) {
    for (const object of geometry.objects) {
      if (object.kind !== "box" || Math.abs(object.yawRadians) > 1e-9) continue;
      const rect = {
        min: {
          x: object.center.x - object.size.x / 2,
          y: geometry.bounds.min.y,
          z: object.center.z - object.size.z / 2,
        },
        max: {
          x: object.center.x + object.size.x / 2,
          y: geometry.bounds.max.y,
          z: object.center.z + object.size.z / 2,
        },
      };
      if (object.role === "slab") this.slabs.push(rect);
      if (
        object.role === "wall" ||
        (object.role === "room_highlight" && !object.placeId)
      )
        this.obstacles.push({ ...rect, floorId: geometry.floorId });
    }
    // An open-space attachment must not take a shortcut through another room,
    // stairs, elevator or restricted block, even through an open door gap.
    for (const place of places) {
      if (
        place.floorId === geometry.floorId &&
        place.bounds &&
        place.description !== "Open area"
      )
        this.obstacles.push({ ...place.bounds, floorId: geometry.floorId });
    }
    this.floorId = geometry.floorId;
  }

  private floorId: string;

  contains(point: Vector3) {
    return (
      this.slabs.some((rect) => interval(point, point, rect)) &&
      !obstructed(point, point, this.floorId, this.obstacles)
    );
  }

  canTravel(a: Vector3, b: Vector3) {
    if (obstructed(a, b, this.floorId, this.obstacles)) return false;
    const intervals = this.slabs
      .map((rect) => interval(a, b, rect))
      .filter((value): value is [number, number] => value !== null)
      .sort((a, b) => a[0] - b[0]);
    let covered = 0;
    for (const [start, end] of intervals) {
      if (start > covered + 1e-9) return false;
      covered = Math.max(covered, end);
      if (covered >= 1 - 1e-9) return true;
    }
    return false;
  }

  private waypoints(y: number) {
    if (this.corners) return this.corners;
    const points = new Map<string, Vector3>();
    const add = (x: number, z: number) => {
      const point = { x, y, z };
      if (this.contains(point)) points.set(`${x}:${z}`, point);
    };
    // Keep bends just outside obstacle corners. These are derived routing
    // waypoints, never changes to the canonical scene or its source topology.
    const margin = 0.02;
    for (const rect of this.obstacles)
      for (const x of [rect.min.x - margin, rect.max.x + margin])
        for (const z of [rect.min.z - margin, rect.max.z + margin]) add(x, z);
    // Include the concave corners of overlapping slab rectangles as well.
    const xs = this.slabs.flatMap((rect) => [rect.min.x, rect.max.x]);
    const zs = this.slabs.flatMap((rect) => [rect.min.z, rect.max.z]);
    for (const x of xs)
      for (const z of zs)
        for (const dx of [-margin, margin])
          for (const dz of [-margin, margin]) add(x + dx, z + dz);
    return (this.corners = [...points.values()]);
  }

  connect<T extends { position: Vector3 }>(
    start: Vector3,
    candidates: T[],
  ): { target: T; points: Vector3[] } | null {
    if (!this.contains(start)) return null;
    const targets = candidates
      .filter((c) => this.contains(c.position))
      .sort(
        (a, b) => distance(start, a.position) - distance(start, b.position),
      );
    const direct = targets.find((c) => this.canTravel(start, c.position));
    if (direct) return { target: direct, points: [start, direct.position] };
    if (!targets.length) return null;

    const points = [start, ...this.waypoints(start.y)];
    const costs = points.map(() => Infinity);
    costs[0] = 0;
    const previous = new Map<number, number>();
    const open = new Set([0]);
    const done = new Set<number>();
    let best: { target: T; index: number; cost: number } | undefined;
    while (open.size) {
      const current = [...open].reduce((a, b) =>
        costs[a]! < costs[b]! ? a : b,
      );
      open.delete(current);
      if (costs[current]! >= (best?.cost ?? Infinity)) break;
      done.add(current);
      for (const target of targets) {
        const cost =
          costs[current]! + distance(points[current]!, target.position);
        if (
          cost < (best?.cost ?? Infinity) &&
          this.canTravel(points[current]!, target.position)
        )
          best = { target, index: current, cost };
      }
      for (let index = 1; index < points.length; index++) {
        if (done.has(index)) continue;
        const cost =
          costs[current]! + distance(points[current]!, points[index]!);
        if (
          cost < costs[index]! &&
          cost < (best?.cost ?? Infinity) &&
          this.canTravel(points[current]!, points[index]!)
        ) {
          costs[index] = cost;
          previous.set(index, current);
          open.add(index);
        }
      }
    }
    if (!best) return null;
    const path = [best.target.position];
    for (
      let index: number | undefined = best.index;
      index !== undefined;
      index = previous.get(index)
    )
      path.unshift(points[index]!);
    return { target: best.target, points: path };
  }
}
