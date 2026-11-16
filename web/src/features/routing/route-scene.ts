import type { Route, Vector3 } from "@trojan-compass/shared/api";
import type { BuildingCode } from "@/features/map/data/campus-display";
import { floorY, getLayout, getLevels } from "@/features/map/data/viewer-data";
import {
  stairGeometry,
  type StairPart,
} from "@/features/map/renderer/stair-geometry";

export type ScenePoint = [number, number, number];

export function routeUsesStair(
  route: Pick<Route, "legs"> | null | undefined,
  buildingId: string,
  floorId: string,
  position: Vector3,
) {
  return (
    route?.legs.some(
      (leg) =>
        leg.kind === "vertical" &&
        leg.connectorKind === "stairs" &&
        leg.buildingId === buildingId &&
        Number(floorId) >=
          Math.min(Number(leg.fromFloorId), Number(leg.toFloorId)) &&
        Number(floorId) <=
          Math.max(Number(leg.fromFloorId), Number(leg.toFloorId)) &&
        leg.points.some(
          (p) =>
            Math.hypot(p.x - position.x, p.y - position.y, p.z - position.z) <
            0.1,
        ),
    ) ?? false
  );
}
export type WalkingSegment = {
  kind: "indoor";
  id: string;
  floors: number[];
  points: ScenePoint[];
};
export type FloorTransition = {
  kind: "vertical";
  id: string;
  floors: number[];
  connectorKind: "stairs" | "elevator" | "ramp";
  fromFloor: number;
  toFloor: number;
  direction: "up" | "down";
  entry: ScenePoint;
  exit: ScenePoint;
  center: ScenePoint;
  size: ScenePoint;
  anchors: ScenePoint[];
  building: BuildingCode;
};

/** Full-height stairs and a route following the same treads. */
export function stairFlight(transition: FloorTransition, floor: number) {
  if (!transition.floors.includes(floor)) return null;
  const parts: StairPart[] = [],
    points: ScenePoint[] = [];
  for (let i = 1; i < transition.anchors.length; i++) {
    const a = transition.anchors[i - 1]!,
      b = transition.anchors[i]!;
    const low = a[1] < b[1] ? a : b;
    const level = transition.floors.find(
      (f) => Math.abs(floorY(f, transition.building) + 0.36 - low[1]) < 0.1,
    );
    const cell =
      level === undefined
        ? undefined
        : getLayout(transition.building, level).cells.find(
            (c) =>
              c.kind === "stairs" &&
              Math.hypot(c.door[0] - low[0], c.door[1] - low[2]) < 0.1,
          );
    const model = stairGeometry(
      [a[0], a[1] - 0.36, a[2]],
      [b[0], b[1] - 0.36, b[2]],
      cell ? cell.x1 - cell.x0 : undefined,
      cell ? cell.z1 - cell.z0 : undefined,
    );
    parts.push(...model.parts);
    points.push(
      ...model.points.map(([x, y, z]): ScenePoint => [x, y + 0.36, z]),
    );
  }
  return { parts, points };
}

/** API geometry and routes share building-local meters. Apply only the overlay lift. */
export function scenePosition(
  code: BuildingCode,
  p: Vector3,
  lift = 0.36,
): [number, number, number] {
  return [p.x, p.y + lift, p.z];
}
export function sceneRoute(route: Pick<Route, "legs">, code: BuildingCode) {
  const segments: (WalkingSegment | FloorTransition)[] = [];
  for (const leg of route.legs) {
    if (
      leg.kind === "outdoor" ||
      leg.buildingId !== code ||
      leg.points.length < 2
    )
      continue;
    const floors =
      leg.kind === "indoor"
        ? [Number(leg.floorId)]
        : getLevels(code).filter(
            (f) =>
              f >= Math.min(Number(leg.fromFloorId), Number(leg.toFloorId)) &&
              f <= Math.max(Number(leg.fromFloorId), Number(leg.toFloorId)),
          );
    const points = leg.points.map((p) => scenePosition(code, p));
    if (leg.kind === "indoor") {
      segments.push({ kind: "indoor", id: leg.id, floors, points });
    } else {
      const entry = points[0]!,
        exit = points.at(-1)!;
      // Keep the landing bounds for the elevator beacon; stairs use tread geometry.
      const minX = Math.min(...points.map((p) => p[0])),
        maxX = Math.max(...points.map((p) => p[0]));
      const minZ = Math.min(...points.map((p) => p[2])),
        maxZ = Math.max(...points.map((p) => p[2]));
      segments.push({
        kind: "vertical",
        building: code,
        anchors: points,
        id: leg.id,
        floors,
        connectorKind: leg.connectorKind,
        fromFloor: Number(leg.fromFloorId),
        toFloor: Number(leg.toFloorId),
        direction: exit[1] > entry[1] ? "up" : "down",
        entry,
        exit,
        center: [
          (minX + maxX) / 2,
          (entry[1] + exit[1]) / 2,
          (minZ + maxZ) / 2,
        ],
        size: [
          Math.max(1.8, maxX - minX + 1.4),
          Math.max(0.1, Math.abs(exit[1] - entry[1])),
          Math.max(1.8, maxZ - minZ + 1.4),
        ],
      });
    }
  }
  return segments;
}

/** Arrow tips follow ordered walking points, including reversed routes and short turns. */
export function routeChevrons(
  points: ScenePoint[],
): ScenePoint[][] {
  const arrows: ScenePoint[][] = [];
  for (let i = 1; i < points.length && arrows.length < 64; i++) {
    const a = points[i - 1]!,
      b = points[i]!,
      dx = b[0] - a[0],
      dz = b[2] - a[2];
    const distance = Math.hypot(dx, dz);
    if (distance < 0.55 || Math.abs(b[1] - a[1]) > 0.05) continue;
    const ux = dx / distance,
      uz = dz / distance,
      count = Math.max(1, Math.floor(distance / 10));
    for (let k = 0; k < count && arrows.length < 64; k++) {
      const along = (distance * (k + 0.5)) / count,
        x = a[0] + ux * along,
        z = a[2] + uz * along;
      const size = Math.min(0.48, distance * 0.25),
        y = a[1] + 0.025;
      arrows.push([
        [x - ux * size - uz * size * 0.8, y, z - uz * size + ux * size * 0.8],
        [x + ux * size * 0.35, y, z + uz * size * 0.35],
        [x - ux * size + uz * size * 0.8, y, z - uz * size - ux * size * 0.8],
      ]);
    }
  }
  return arrows;
}
