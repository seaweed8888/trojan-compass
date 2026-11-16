import type {
  Building,
  Place,
  Vector3,
  FloorGeometry,
} from "@trojan-compass/shared/api";
import type {
  NavigationSource,
  PolygonXZ,
  TraversalAccess,
  NavigationFloor,
} from "../../ports/navigation-source.js";
import type { PublishedNavigation } from "./publication-format.js";
import {
  distance,
  inPolygon,
  segmentWalkable,
} from "../../modules/routing/geometry.js";
import { dataError } from "../../lib/errors.js";

const access = (
  level: TraversalAccess["accessLevel"] = "public",
  stepFree: TraversalAccess["stepFree"] = "unknown",
): TraversalAccess => ({
  accessLevel: level,
  stepFree,
  evidenceIds: [],
});
const rect = (x0: number, z0: number, x1: number, z1: number): PolygonXZ => ({
  outer: [
    { x: x0, z: z0 },
    { x: x1, z: z0 },
    { x: x1, z: z1 },
    { x: x0, z: z1 },
    { x: x0, z: z0 },
  ],
  holes: [],
});
const same = (a: Vector3, b: Vector3) => distance(a, b) < 0.01;

/** Converts explicit corridor widths, walls, room bounds, door edges and connector cores.
 * No surveyed/accessibility evidence is invented, and obstructed source edges are excluded.
 * The immutable source records remain unchanged; this is derived routing data only.
 */
export function publicationNavigation(
  raw: PublishedNavigation,
  building: Building,
  places: Place[],
  geometry: FloorGeometry[],
): NavigationSource {
  const floors = new Map<string, NavigationFloor>();
  for (const f of building.floors)
    floors.set(f.id, {
      floorId: f.id,
      elevationMeters: f.elevationMeters,
      bounds: f.bounds,
      walkableRegions: [],
      blockedRegions: [],
      openAreaApproaches: true,
    });
  const clip = (floorId: string, polygon: PolygonXZ): PolygonXZ => {
    const b = floors.get(floorId)?.bounds;
    if (!b) throw dataError("source references an unknown floor");
    // Sutherland-Hodgman clipping preserves corridor width at the published bounds.
    let points = polygon.outer.slice(0, -1);
    for (const [axis, value, minimum] of [
      ["x", b.min.x, true],
      ["x", b.max.x, false],
      ["z", b.min.z, true],
      ["z", b.max.z, false],
    ] as const) {
      const result: typeof points = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i]!,
          c = points[(i + 1) % points.length]!;
        const insideA = minimum ? a[axis] >= value : a[axis] <= value;
        const insideB = minimum ? c[axis] >= value : c[axis] <= value;
        if (insideA) result.push(a);
        if (insideA !== insideB) {
          const t = (value - a[axis]) / (c[axis] - a[axis]);
          result.push({ x: a.x + (c.x - a.x) * t, z: a.z + (c.z - a.z) * t });
        }
      }
      points = result;
    }
    points = points.filter(
      (p, i) =>
        i === 0 ||
        Math.hypot(p.x - points[i - 1]!.x, p.z - points[i - 1]!.z) > 1e-8,
    );
    if (
      points.length > 1 &&
      Math.hypot(
        points[0]!.x - points.at(-1)!.x,
        points[0]!.z - points.at(-1)!.z,
      ) < 1e-8
    )
      points.pop();
    return {
      outer: points.length >= 3 ? [...points, points[0]!] : [],
      holes: [],
    };
  };
  for (const [i, b] of raw.barriers.entries()) {
    const p = clip(b.floorId, rect(b.min.x, b.min.z, b.max.x, b.max.z));
    if (p.outer.length)
      floors
        .get(b.floorId)!
        .blockedRegions.push({ id: `wall:${i}`, polygon: p });
  }
  // Preserve the complete published slab union, subtracting enclosed rooms. This
  // supports a picked open-area origin without widening the source corridor bands.
  type R = [number, number, number, number];
  for (const floor of floors.values()) {
    const f = geometry.find((g) => g.floorId === floor.floorId);
    if (!f) throw dataError("published floor geometry is missing");
    let rectangles: R[] = f.objects.flatMap((o) =>
      o.kind === "box" && o.role === "slab" && Math.abs(o.yawRadians) < 1e-8
        ? [
            [
              Math.max(floor.bounds.min.x, o.center.x - o.size.x / 2),
              Math.max(floor.bounds.min.z, o.center.z - o.size.z / 2),
              Math.min(floor.bounds.max.x, o.center.x + o.size.x / 2),
              Math.min(floor.bounds.max.z, o.center.z + o.size.z / 2),
            ] as R,
          ]
        : [],
    );
    const obstacles: R[] = places
      .filter(
        (p) =>
          p.floorId === floor.floorId &&
          p.bounds &&
          p.description !== "Open area",
      )
      .map((p) => [
        p.bounds!.min.x,
        p.bounds!.min.z,
        p.bounds!.max.x,
        p.bounds!.max.z,
      ]);
    for (const o of f.objects)
      if (o.kind === "box" && o.role === "room_highlight" && !o.placeId)
        obstacles.push([
          o.center.x - o.size.x / 2,
          o.center.z - o.size.z / 2,
          o.center.x + o.size.x / 2,
          o.center.z + o.size.z / 2,
        ]);
    for (const o of obstacles)
      rectangles = rectangles.flatMap((r) => {
        const x0 = Math.max(r[0], o[0]),
          z0 = Math.max(r[1], o[1]),
          x1 = Math.min(r[2], o[2]),
          z1 = Math.min(r[3], o[3]);
        if (x0 >= x1 || z0 >= z1) return [r];
        return [
          [r[0], r[1], x0, r[3]],
          [x1, r[1], r[2], r[3]],
          [x0, r[1], x1, z0],
          [x0, z1, x1, r[3]],
        ].filter((r) => r[2]! - r[0]! > 1e-8 && r[3]! - r[1]! > 1e-8) as R[];
      });
    const unique = [
      ...new Map(rectangles.map((r) => [JSON.stringify(r), r])).values(),
    ];
    floor.walkableRegions.push(
      ...unique.map((r, i) => ({
        id: `corridor:${floor.floorId}:${i}`,
        kind: "corridor" as const,
        polygon: rect(...r),
        access: access(),
      })),
    );
  }
  const rooms = new Map<string, string>();
  for (const p of places)
    if (p.bounds) {
      const polygon = clip(
        p.floorId,
        rect(p.bounds.min.x, p.bounds.min.z, p.bounds.max.x, p.bounds.max.z),
      );
      if (polygon.outer.length) {
        const id = `place:${p.id}`;
        rooms.set(p.id, id);
        floors
          .get(p.floorId)!
          .walkableRegions.push({
            id,
            kind: p.description === "Open area" ? "corridor" : "room",
            polygon,
            access: access(p.access.level, p.access.stepFreeAccess),
          });
      }
    }
  const originalNodes = new Map(raw.nodes.map((n) => [n.id, n]));
  if (originalNodes.size !== raw.nodes.length)
    throw dataError("duplicate source node");
  const usableNodes = raw.nodes.filter((n) => {
    const f = floors.get(n.floorId);
    if (!f) throw dataError("unknown node floor");
    const usable =
      f.walkableRegions.some((r) => inPolygon(n.position, r.polygon)) &&
      !f.blockedRegions.some((r) => inPolygon(n.position, r.polygon));
    if (!usable && n.kind !== "corridor")
      throw dataError(`non-corridor node ${n.id} is obstructed`);
    return usable;
  });
  const nodes = new Map(usableNodes.map((n) => [n.id, n]));
  const result: NavigationSource = {
    buildingId: raw.buildingId,
    dataVersion: raw.dataVersion,
    nodes: usableNodes,
    edges: [],
    geometry: { floors: [...floors.values()] },
    edgeDetails: [],
    doors: [],
    connectors: [],
    placeAccessBindings: [],
    referenceEntrances: [],
    evidence: [],
    provenance: raw.provenance,
  };
  const allRegions = new Map(
    [...floors.values()].flatMap((f) =>
      f.walkableRegions.map((r) => [r.id, r] as const),
    ),
  );
  const roomByNode = new Map(
    places.flatMap((p) => p.accessPoints.map((ap) => [ap.nodeId, p] as const)),
  );
  for (const e of raw.edges) {
    if (!originalNodes.has(e.fromNodeId) || !originalNodes.has(e.toNodeId))
      throw dataError("source edge references a missing node");
    const a = nodes.get(e.fromNodeId),
      b = nodes.get(e.toNodeId);
    if (!a || !b) continue;
    if (a.floorId !== b.floorId)
      throw dataError(
        "source vertical edges must be declared by connector cores",
      );
    const floor = floors.get(a.floorId)!;
    if (
      !raw.walkable.some(
        (w) =>
          w.floorId === a.floorId &&
          ((same(w.from, a.position) && same(w.to, b.position)) ||
            (same(w.to, a.position) && same(w.from, b.position))),
      )
    )
      throw dataError("source edge has no explicit walkable segment");
    const corridors = floor.walkableRegions.filter(
      (r) => r.kind === "corridor",
    );
    const p = roomByNode.get(a.id) ?? roomByNode.get(b.id),
      roomId = p ? rooms.get(p.id) : undefined;
    const ids = [
      ...(e.kind === "door" && roomId ? [roomId] : []),
      ...corridors.map((r) => r.id),
    ];
    if (
      !segmentWalkable(
        a.position,
        b.position,
        ids.map((id) => allRegions.get(id)!.polygon),
        floor.blockedRegions.map((r) => r.polygon),
      )
    )
      continue;
    const corridorA = corridors.find((r) =>
      inPolygon(a.position, r.polygon),
    )?.id;
    const corridorB = corridors.find((r) =>
      inPolygon(b.position, r.polygon),
    )?.id;
    const doorId = e.kind === "door" ? `door:${e.id}` : null;
    if (doorId)
      result.doors.push({
        id: doorId,
        floorId: a.floorId,
        edgeIds: [e.id],
        direction: e.bidirectional ? "both" : "a_to_b",
        sideA: {
          kind: "region",
          regionId:
            roomByNode.has(a.id) && roomId ? roomId : (corridorA ?? roomId!),
        },
        sideB: {
          kind: "region",
          regionId:
            roomByNode.has(b.id) && roomId ? roomId : (corridorB ?? roomId!),
        },
        access: access(e.accessLevel, e.stepFree),
      });
    result.edges.push(e);
    result.edgeDetails.push({
      edgeId: e.id,
      points: [a.position, b.position],
      regionIds: ids,
      doorId,
      connectorId: null,
      access: access(e.accessLevel, e.stepFree),
      metricsEstimated: true,
    });
  }
  // Reconnect disconnected corridor components only where the full published
  // floor geometry proves an unobstructed public walk. Never connect through a
  // room, invent a door, move a landing, or bypass an existing directed edge.
  const parent = new Map(usableNodes.map((n) => [n.id, n.id]));
  const root = (id: string): string => {
    let p = parent.get(id)!;
    while (p !== parent.get(p)) {
      p = parent.get(p)!;
    }
    let next = id;
    while (parent.get(next) !== p) {
      const old = parent.get(next)!;
      parent.set(next, p);
      next = old;
    }
    return p;
  };
  const join = (a: string, b: string) => parent.set(root(a), root(b));
  for (const e of result.edges) join(e.fromNodeId, e.toNodeId);
  for (const f of floors.values()) {
    const corridors = f.walkableRegions.filter(
      (r) => r.kind === "corridor" && r.access.accessLevel === "public",
    );
    const polygons = corridors.map((r) => r.polygon),
      walls = f.blockedRegions.map((r) => r.polygon);
    const candidates = usableNodes.filter(
      (n) =>
        n.floorId === f.floorId &&
        ["corridor", "door"].includes(n.kind) &&
        polygons.some((p) => inPolygon(n.position, p)),
    );
    if (new Set(candidates.map((n) => root(n.id))).size < 2) continue;
    const pairs = candidates
      .flatMap((a, i) =>
        candidates
          .slice(i + 1)
          .filter((b) => root(a.id) !== root(b.id))
          .map((b) => ({ a, b, length: distance(a.position, b.position) })),
      )
      .sort(
        (a, b) =>
          a.length - b.length ||
          a.a.id.localeCompare(b.a.id) ||
          a.b.id.localeCompare(b.b.id),
      );
    let count = 0;
    for (const { a, b, length } of pairs) {
      if (
        root(a.id) === root(b.id) ||
        !segmentWalkable(a.position, b.position, polygons, walls)
      )
        continue;
      const id = `derived:${f.floorId}:${count++}`;
      if (result.edges.some((e) => e.id === id))
        throw dataError("derived edge ID collision");
      result.edges.push({
        id,
        fromNodeId: a.id,
        toNodeId: b.id,
        lengthMeters: length,
        kind: "walkway",
        bidirectional: true,
        stepFree: "unknown",
        accessLevel: "public",
      });
      result.edgeDetails.push({
        edgeId: id,
        points: [a.position, b.position],
        regionIds: corridors.map((r) => r.id),
        doorId: null,
        connectorId: null,
        access: access(),
        metricsEstimated: true,
      });
      join(a.id, b.id);
    }
  }
  for (const c of raw.connectors) {
    const ordered = c.nodeIds
      .map((id) => {
        const n = nodes.get(id);
        if (!n) throw dataError("unknown connector landing");
        return n;
      })
      .sort(
        (a, b) =>
          floors.get(a.floorId)!.elevationMeters -
          floors.get(b.floorId)!.elevationMeters,
      );
    const edgeIds: string[] = [];
    for (let i = 1; i < ordered.length; i++) {
      const a = ordered[i - 1]!,
        b = ordered[i]!,
        id = `${c.id}:${a.floorId}:${b.floorId}`;
      if (a.floorId === b.floorId) throw dataError("connector repeats a floor");
      const sorted = building.floors
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder);
      if (
        c.kind === "stairs" &&
        sorted.findIndex((f) => f.id === b.floorId) -
          sorted.findIndex((f) => f.id === a.floorId) !==
          1
      )
        continue;
      edgeIds.push(id);
      result.edges.push({
        id,
        fromNodeId: a.id,
        toNodeId: b.id,
        lengthMeters: distance(a.position, b.position),
        kind: c.kind,
        bidirectional: true,
        stepFree: c.kind === "stairs" ? "verified_no" : "unknown",
        accessLevel: "public",
      });
      result.edgeDetails.push({
        edgeId: id,
        points: [a.position, b.position],
        regionIds: [],
        doorId: null,
        connectorId: c.id,
        access: access(),
        metricsEstimated: true,
      });
    }
    if (edgeIds.length)
      result.connectors.push({
        id: c.id,
        kind: c.kind,
        floorIds: ordered.map((n) => n.floorId),
        edgeIds,
        access: access(),
      });
  }
  for (const p of places)
    for (const ap of p.accessPoints) {
      const n = nodes.get(ap.nodeId);
      if (!n) throw dataError("arrival references missing node");
      const floor = floors.get(p.floorId)!;
      const regionId =
        rooms.get(p.id) ??
        floor.walkableRegions.find((r) => inPolygon(n.position, r.polygon))?.id;
      if (!regionId) throw dataError(`no walkable arrival for ${p.id}`);
      const door = result.doors.find((d) =>
        d.edgeIds.some((id) => {
          const e = result.edges.find((e) => e.id === id)!;
          return e.fromNodeId === n.id || e.toNodeId === n.id;
        }),
      );
      result.placeAccessBindings.push({
        placeId: p.id,
        accessPointId: ap.id,
        floorId: p.floorId,
        nodeId: ap.nodeId,
        regionId,
        doorId: door?.id ?? null,
        approachEdgeIds: door?.edgeIds ?? [],
        access: access(p.access.level, p.access.stepFreeAccess),
      });
      if (p.kind === "entrance" && p.access.entryAllowed === true)
        result.referenceEntrances.push({ placeId: p.id, accessPointId: ap.id });
    }
  return result;
}
