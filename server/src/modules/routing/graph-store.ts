import type {
  Bounds3,
  Floor,
  GraphEdge,
  GraphNode,
  Place,
  RouteMode,
  Vector3,
} from "@trojan-compass/shared/api";
import type { DatasetPort, RequestScope } from "../../ports/service-ports.js";
import type {
  AccessBinding,
  EdgeDetail,
  NavigationSource,
  StepFreeEvidence,
  TraversalAccess,
  WalkableRegion,
} from "../../ports/navigation-source.js";
import { AsyncCache, deepFreeze } from "../../lib/cache.js";
import { dataError } from "../../lib/errors.js";
import { checkpoint, checkScope, withinScope } from "../../lib/scope.js";
import { validateSourceShape } from "./source-schema.js";
import {
  distance,
  inPolygon,
  polylineLength,
  segmentWalkable,
  validatePolygon,
} from "./geometry.js";

export type Policy = { public: boolean; stepFree: StepFreeEvidence };
export type Arc = {
  id: string;
  edgeId: string;
  from: string;
  to: string;
  kind: GraphEdge["kind"];
  points: Vector3[];
  distance: number;
  connectorId: string | null;
  policy: Policy;
  metricsEstimated: boolean;
};
export type RuntimeGraph = {
  source: NavigationSource;
  nodes: ReadonlyMap<string, GraphNode>;
  edges: ReadonlyMap<string, GraphEdge>;
  details: ReadonlyMap<string, EdgeDetail>;
  adjacency: ReadonlyMap<string, readonly Arc[]>;
  regions: ReadonlyMap<string, { floorId: string; region: WalkableRegion }>;
  places: ReadonlyMap<string, Place>;
  bindings: ReadonlyMap<string, readonly AccessBinding[]>;
  policy: (access: TraversalAccess) => Policy;
};
export function combinePolicy(...policies: Policy[]): Policy {
  return {
    public: policies.every((p) => p.public),
    stepFree: policies.some((p) => p.stepFree === "verified_no")
      ? "verified_no"
      : policies.every((p) => p.stepFree === "verified_yes")
        ? "verified_yes"
        : "unknown",
  };
}
export function allowed(
  policy: Policy,
  mode: RouteMode,
  stepFree: boolean,
  kind: GraphEdge["kind"],
  allowUnknown = false,
) {
  return (
    policy.public &&
    !(mode === "stairs" && kind === "elevator") &&
    !(mode === "elevator" && kind === "stairs") &&
    (!stepFree ||
      (kind !== "stairs" &&
        (policy.stepFree === "verified_yes" ||
          (allowUnknown && policy.stepFree === "unknown"))))
  );
}
const index = <T>(
  items: readonly T[],
  id: (t: T) => string,
  name: string,
): Map<string, T> => {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = id(item);
    if (map.has(key)) throw dataError(`duplicate ${name} ${key}`);
    map.set(key, item);
  }
  return map;
};

export async function buildGraph(
  source: NavigationSource,
  places: Place[],
  floorRecords: readonly Floor[],
  scope: RequestScope,
): Promise<RuntimeGraph> {
  if (!validateSourceShape(source))
    throw dataError(
      `navigation schema: ${JSON.stringify(validateSourceShape.errors?.slice(0, 3))}`,
    );
  if (source.dataVersion !== scope.dataVersion)
    throw dataError("navigation version mismatch");
  const floorMetadata = new Map(floorRecords.map((f) => [f.id, f]));
  const floorIds = new Set(floorMetadata.keys());
  const insideBounds = (p: Vector3, b: Bounds3) =>
    (["x", "y", "z"] as const).every(
      (axis) => p[axis] >= b.min[axis] - 0.01 && p[axis] <= b.max[axis] + 0.01,
    );
  const nodes = index(source.nodes, (n) => n.id, "node");
  const edges = index(source.edges, (e) => e.id, "edge");
  const details = index(source.edgeDetails, (e) => e.edgeId, "edge detail");
  const doors = index(source.doors, (d) => d.id, "door");
  const connectors = index(source.connectors, (c) => c.id, "connector");
  const evidence = index(source.evidence, (e) => e.id, "evidence");
  const placeMap = index(places, (p) => p.id, "place");
  const regions = new Map<
    string,
    { floorId: string; region: WalkableRegion }
  >();
  const floors = index(
    source.geometry?.floors ?? [],
    (f) => f.floorId,
    "navigation floor",
  );
  const pointCount =
    source.edgeDetails.reduce((sum, e) => sum + e.points.length, 0) +
    (source.geometry?.floors ?? []).reduce(
      (sum, f) =>
        sum +
        [...f.walkableRegions, ...f.blockedRegions].reduce(
          (n, r) =>
            n +
            r.polygon.outer.length +
            r.polygon.holes.reduce((h, ring) => h + ring.length, 0),
          0,
        ),
      0,
    );
  if (pointCount > 100000)
    throw dataError("navigation exceeds the 100,000-point preparation budget");
  const policy = (access: TraversalAccess): Policy => {
    for (const id of access.evidenceIds)
      if (!evidence.has(id)) throw dataError(`missing evidence ${id}`);
    const records = access.evidenceIds.map((id) => evidence.get(id)!);
    const proof: StepFreeEvidence = records.some(
      (e) => e.stepFree === "verified_no",
    )
      ? "verified_no"
      : records.length > 0 &&
          records.every(
            (e) =>
              e.stepFree === "verified_yes" &&
              e.verifiedAt &&
              e.sourceUrls.length,
          )
        ? "verified_yes"
        : "unknown";
    return combinePolicy(
      { public: access.accessLevel === "public", stepFree: access.stepFree },
      { public: true, stepFree: proof },
    );
  };
  for (const f of floors.values()) {
    if (!floorIds.has(f.floorId))
      throw dataError("navigation floor is unknown");
    const metadata = floorMetadata.get(f.floorId)!;
    if (
      Math.abs(f.elevationMeters - metadata.elevationMeters) > 0.01 ||
      !insideBounds(f.bounds.min, metadata.bounds) ||
      !insideBounds(f.bounds.max, metadata.bounds)
    )
      throw dataError(
        "navigation floor geometry disagrees with published metadata",
      );
    for (const region of [...f.walkableRegions, ...f.blockedRegions])
      for (const ring of [region.polygon.outer, ...region.polygon.holes])
        for (const p of ring)
          if (!insideBounds({ ...p, y: f.elevationMeters }, f.bounds))
            throw dataError("polygon exceeds floor bounds");
    for (const region of f.walkableRegions) {
      if (regions.has(region.id))
        throw dataError("region IDs must be unique within a building");
      await checkpoint(scope, 0);
      validatePolygon(region.polygon, () => checkScope(scope));
      policy(region.access);
      regions.set(region.id, { floorId: f.floorId, region });
    }
    for (const region of f.blockedRegions) {
      await checkpoint(scope, 0);
      validatePolygon(region.polygon, () => checkScope(scope));
    }
  }
  for (const n of nodes.values()) {
    if (n.buildingId !== source.buildingId || !floorIds.has(n.floorId))
      throw dataError("node building/floor mismatch");
    const metadata = floorMetadata.get(n.floorId)!;
    if (
      Math.abs(n.position.y - metadata.elevationMeters) > 0.25 ||
      !insideBounds(n.position, metadata.bounds)
    )
      throw dataError("node position disagrees with published floor");
    const f = floors.get(n.floorId);
    if (
      f &&
      (Math.abs(n.position.y - f.elevationMeters) > 0.25 ||
        !f.walkableRegions.some((r) => inPolygon(n.position, r.polygon)) ||
        f.blockedRegions.some((r) => inPolygon(n.position, r.polygon)))
    )
      throw dataError("node outside walkable geometry");
  }
  for (const d of doors.values()) {
    policy(d.access);
    if (!floorIds.has(d.floorId) || !d.edgeIds.length)
      throw dataError("invalid door");
    for (const side of [d.sideA, d.sideB])
      if (
        side.kind === "region" &&
        regions.get(side.regionId)?.floorId !== d.floorId
      )
        throw dataError("door region/floor mismatch");
    for (const id of d.edgeIds)
      if (details.get(id)?.doorId !== d.id)
        throw dataError("door edge reference mismatch");
  }
  for (const c of connectors.values()) {
    policy(c.access);
    if (
      c.floorIds.length < 2 ||
      new Set(c.floorIds).size !== c.floorIds.length ||
      c.floorIds.some((f) => !floorIds.has(f)) ||
      !c.edgeIds.length
    )
      throw dataError("invalid connector");
    for (const id of c.edgeIds)
      if (
        details.get(id)?.connectorId !== c.id ||
        edges.get(id)?.kind !== c.kind
      )
        throw dataError("connector edge reference mismatch");
  }
  if (details.size !== edges.size)
    throw dataError("every edge needs exactly one detail");
  const adjacency = new Map<string, Arc[]>(source.nodes.map((n) => [n.id, []]));
  let count = 0;
  for (const e of edges.values()) {
    await checkpoint(scope, count++);
    const a = nodes.get(e.fromNodeId),
      b = nodes.get(e.toNodeId),
      d = details.get(e.id);
    if (!a || !b || !d || a.id === b.id)
      throw dataError("invalid edge endpoints/detail");
    if (
      distance(d.points[0]!, a.position) > 0.01 ||
      distance(d.points.at(-1)!, b.position) > 0.01
    )
      throw dataError("edge geometry endpoint mismatch");
    if (
      Math.abs(polylineLength(d.points) - e.lengthMeters) >
      Math.max(0.01, e.lengthMeters * 0.01)
    )
      throw dataError(
        "edge distance must be physical polyline length, without time penalties",
      );
    const involved = d.regionIds.map((id) => {
      const r = regions.get(id);
      if (!r) throw dataError("unknown edge region");
      return r;
    });
    if (
      involved.some((r) => r.region.kind === "room") &&
      involved.some((r) => r.region.kind !== "room") &&
      (!d.doorId || e.kind !== "door")
    )
      throw dataError(
        "room/corridor transitions require an explicit door edge",
      );
    let effective = combinePolicy(
      {
        public: e.accessLevel === "public",
        stepFree: e.kind === "stairs" ? "verified_no" : e.stepFree,
      },
      policy(d.access),
      ...involved.map((r) => policy(r.region.access)),
    );
    if (a.floorId !== b.floorId) {
      const c = d.connectorId ? connectors.get(d.connectorId) : undefined;
      if (
        !c ||
        !c.edgeIds.includes(e.id) ||
        c.kind !== e.kind ||
        !c.floorIds.includes(a.floorId) ||
        !c.floorIds.includes(b.floorId)
      )
        throw dataError("cross-floor edge requires a matching connector");
      effective = combinePolicy(effective, policy(c.access));
    } else if (d.connectorId) {
      const c = connectors.get(d.connectorId);
      if (!c || !c.edgeIds.includes(e.id) || c.kind !== e.kind)
        throw dataError("invalid connector reference");
      effective = combinePolicy(effective, policy(c.access));
    }
    if (e.kind === "door" && !d.doorId)
      throw dataError("door edge requires a door record");
    if (d.doorId) {
      const door = doors.get(d.doorId);
      if (
        !door ||
        !door.edgeIds.includes(e.id) ||
        door.floorId !== a.floorId ||
        a.floorId !== b.floorId ||
        (door.direction !== "both" && e.bidirectional)
      )
        throw dataError("invalid door direction/floor");
      const first = door.direction === "b_to_a" ? door.sideB : door.sideA,
        last = door.direction === "b_to_a" ? door.sideA : door.sideB;
      if (
        (first.kind === "region" &&
          !inPolygon(
            a.position,
            regions.get(first.regionId)!.region.polygon,
          )) ||
        (last.kind === "region" &&
          !inPolygon(b.position, regions.get(last.regionId)!.region.polygon))
      )
        throw dataError("door endpoints contradict its direction");
      effective = combinePolicy(effective, policy(door.access));
    }
    const floor = floors.get(a.floorId);
    if (source.geometry && a.floorId === b.floorId) {
      if (
        !floor ||
        !involved.length ||
        involved.some((r) => r.floorId !== a.floorId)
      )
        throw dataError("edge needs floor-local walkable regions");
      for (let i = 1; i < d.points.length; i++)
        if (
          Math.abs(d.points[i]!.y - floor.elevationMeters) > 0.25 ||
          !segmentWalkable(
            d.points[i - 1]!,
            d.points[i]!,
            involved.map((r) => r.region.polygon),
            floor.blockedRegions.map((r) => r.polygon),
          )
        )
          throw dataError("edge crosses a wall or leaves walkable geometry");
    }
    const arc: Arc = {
      id: `${e.id}:forward`,
      edgeId: e.id,
      from: a.id,
      to: b.id,
      kind: e.kind,
      points: d.points,
      distance: e.lengthMeters,
      connectorId: d.connectorId,
      policy: effective,
      metricsEstimated: d.metricsEstimated,
    };
    adjacency.get(a.id)!.push(arc);
    if (e.bidirectional)
      adjacency.get(b.id)!.push({
        ...arc,
        id: `${e.id}:reverse`,
        from: b.id,
        to: a.id,
        points: [...d.points].reverse(),
      });
  }
  const bindings = new Map<string, AccessBinding[]>();
  const bindingIds = new Set<string>();
  for (const binding of source.placeAccessBindings) {
    const p = placeMap.get(binding.placeId),
      ap = p?.accessPoints.find((a) => a.id === binding.accessPointId),
      node = nodes.get(binding.nodeId);
    const id = JSON.stringify([binding.placeId, binding.accessPointId]);
    if (bindingIds.has(id)) throw dataError("duplicate access binding");
    bindingIds.add(id);
    if (
      !p ||
      !ap ||
      !node ||
      p.floorId !== binding.floorId ||
      node.floorId !== binding.floorId ||
      ap.nodeId !== node.id ||
      distance(ap.position, node.position) > 0.01
    )
      throw dataError("place access binding mismatch");
    if (
      source.geometry &&
      (!binding.regionId ||
        regions.get(binding.regionId)?.floorId !== binding.floorId ||
        !inPolygon(
          node.position,
          regions.get(binding.regionId)!.region.polygon,
        ))
    )
      throw dataError("access binding region mismatch");
    if (
      binding.doorId &&
      doors.get(binding.doorId)?.floorId !== binding.floorId
    )
      throw dataError("access binding door mismatch");
    if (binding.approachEdgeIds.some((id) => !edges.has(id)))
      throw dataError("unknown approach edge");
    if (binding.approachEdgeIds.length) {
      const connected = new Set([binding.nodeId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const id of binding.approachEdgeIds) {
          const edge = edges.get(id)!;
          if (connected.has(edge.fromNodeId) && !connected.has(edge.toNodeId)) {
            connected.add(edge.toNodeId);
            changed = true;
          }
          if (connected.has(edge.toNodeId) && !connected.has(edge.fromNodeId)) {
            connected.add(edge.fromNodeId);
            changed = true;
          }
        }
      }
      if (
        binding.approachEdgeIds.some(
          (id) => !connected.has(edges.get(id)!.fromNodeId),
        )
      )
        throw dataError(
          "approach edges must form a connected subgraph at the access point",
        );
    }
    policy(binding.access);
    bindings.set(p.id, [...(bindings.get(p.id) ?? []), binding]);
  }
  for (const p of places)
    for (const ap of p.accessPoints)
      if (!bindingIds.has(JSON.stringify([p.id, ap.id])))
        throw dataError("access point missing navigation binding");
  for (const reference of source.referenceEntrances) {
    const p = placeMap.get(reference.placeId);
    if (
      !p ||
      p.kind !== "entrance" ||
      p.access.entryAllowed !== true ||
      !bindingIds.has(JSON.stringify([p.id, reference.accessPointId]))
    )
      throw dataError("invalid reference entrance");
  }
  for (const arcs of adjacency.values())
    arcs.sort((a, b) => a.id.localeCompare(b.id));
  deepFreeze(source);
  for (const arcs of adjacency.values()) deepFreeze(arcs);
  return {
    source,
    nodes,
    edges,
    details,
    adjacency,
    regions,
    places: placeMap,
    bindings,
    policy,
  };
}

export function bindingPolicy(
  graph: RuntimeGraph,
  place: Place,
  binding: AccessBinding,
): Policy {
  const ap = place.accessPoints.find((a) => a.id === binding.accessPointId)!;
  const policies = [
    graph.policy(binding.access),
    {
      public: place.access.level === "public",
      stepFree: place.access.stepFreeAccess,
    },
    { public: true, stepFree: ap.stepFreeAccess },
  ];
  if (binding.regionId)
    policies.push(
      graph.policy(graph.regions.get(binding.regionId)!.region.access),
    );
  if (binding.doorId)
    policies.push(
      graph.policy(
        graph.source.doors.find((d) => d.id === binding.doorId)!.access,
      ),
    );
  for (const id of binding.approachEdgeIds) {
    const edge = graph.edges.get(id)!;
    policies.push(
      graph.adjacency.get(edge.fromNodeId)!.find((a) => a.edgeId === id)!
        .policy,
    );
  }
  return combinePolicy(...policies);
}

export class GraphStore {
  private readonly cache = new AsyncCache<RuntimeGraph>(16);
  constructor(private readonly datasets: DatasetPort) {}
  async get(scope: RequestScope, buildingId: string): Promise<RuntimeGraph> {
    checkScope(scope);
    const work = this.cache.get(
      JSON.stringify([scope.dataVersion, buildingId]),
      async () => {
        const preparation: RequestScope = {
          requestId: "graph-preparation",
          dataVersion: scope.dataVersion,
          deadline: performance.now() + 10000,
        };
        const [source, building, places] = await Promise.all([
          this.datasets.getNavigationSource(preparation, buildingId),
          this.datasets.getBuilding(preparation, buildingId),
          this.datasets.listPlaces(preparation, buildingId),
        ]);
        return buildGraph(
          structuredClone(source),
          places,
          building.floors,
          preparation,
        );
      },
    );
    return withinScope(scope, work);
  }
}
