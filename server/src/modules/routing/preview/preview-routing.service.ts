import { randomUUID } from "node:crypto";
import { routeThroughStop } from "../route-stop.js";
import type {
  LocationRef,
  ResolvedEndpoint,
  Route,
  RouteLeg,
  RouteRequest,
  Vector3,
} from "@trojan-compass/shared/api";
import type {
  RequestScope,
  RoutingPort,
} from "../../../ports/service-ports.js";
import {
  BUILDING_BY_CODE,
  type BuildingCode,
} from "../../../infrastructure/datasets/prototype/campus.js";
import {
  cellCenter,
  entrancePlaces,
  floorName,
  floorY,
  getLayout,
  getLevels,
  metersPerUnit,
  type Cell,
  type FloorLayout,
} from "../../../infrastructure/datasets/prototype/floorplan.js";
import { AsyncCache } from "../../../lib/cache.js";
import {
  prototypeFloorId,
  prototypeFloorLevel,
} from "../../../infrastructure/datasets/prototype/floor-id.js";
import { AppError, invalid, missing } from "../../../lib/errors.js";
import { checkpoint, checkScope, withinScope } from "../../../lib/scope.js";
import { MinHeap } from "../heap.js";
import {
  cellRect,
  corridorCandidates,
  corridorClear,
  covered,
  doorApproach,
  floorRects,
  inside,
  type Point,
} from "./geometry.js";

type Edge = {
  to: number;
  points: Vector3[];
  distance: number;
  kind: "walk" | "stairs" | "elevator";
  core?: string;
};
type Node = {
  id: string;
  floor: number;
  position: Vector3;
  edges: Edge[];
  cellId?: string;
  corridor: boolean;
  entranceStepFree?: boolean;
};
type Graph = {
  code: BuildingCode;
  nodes: Node[];
  places: Map<string, number>;
  layouts: Map<number, FloorLayout>;
};
const noRoute = () =>
  new AppError(
    "NO_ROUTE",
    422,
    "No route through the illustrated corridors and doors connects these locations. Try another entrance or floor connector.",
  );
const badPosition = () =>
  new AppError(
    "INVALID_POSITION",
    422,
    "Select a room, entrance, or open floor area inside the building.",
  );
const length = (a: Vector3, b: Vector3) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const position = (code: BuildingCode, floor: number, p: Point): Vector3 => ({
  x: p.x * metersPerUnit(code),
  y: floorY(floor),
  z: p.z * metersPerUnit(code),
});
const planar = (code: BuildingCode, p: Vector3): Point => ({
  x: p.x / metersPerUnit(code),
  z: p.z / metersPerUnit(code),
});
function addEdge(
  nodes: Node[],
  a: number,
  b: number,
  points: Vector3[],
  kind: Edge["kind"] = "walk",
  core?: string,
) {
  const distance = points
    .slice(1)
    .reduce((sum, p, i) => sum + length(points[i]!, p), 0);
  nodes[a]!.edges.push({ to: b, points, distance, kind, core });
  nodes[b]!.edges.push({
    to: a,
    points: [...points].reverse(),
    distance,
    kind,
    core,
  });
}
function addNode(
  graph: Graph,
  floor: number,
  p: Point,
  extra: Partial<Node> = {},
): number {
  const index = graph.nodes.length;
  graph.nodes.push({
    id: `preview:${graph.code}:${floor}:n${index}`,
    floor,
    position: position(graph.code, floor, p),
    edges: [],
    corridor: false,
    ...extra,
  });
  return index;
}
function roomConnection(
  graph: Graph,
  floor: number,
  p: Point,
  c: Cell,
  node: number,
) {
  const layout = graph.layouts.get(floor)!,
    approach = doorApproach(c),
    door = { x: c.door[0], z: c.door[1] };
  if (
    !corridorClear(layout, p, door, c.id) ||
    !corridorClear(layout, door, approach, c.id)
  )
    return;
  const corridor = graph.nodes.findIndex(
    (n) =>
      n.floor === floor &&
      n.corridor &&
      length(n.position, position(graph.code, floor, approach)) < 1e-6,
  );
  if (corridor >= 0)
    addEdge(graph.nodes, node, corridor, [
      position(graph.code, floor, p),
      position(graph.code, floor, door),
      position(graph.code, floor, approach),
    ]);
}
async function buildGraph(code: BuildingCode): Promise<Graph> {
  const scope = {
    requestId: "preview-preparation",
    dataVersion: "prototype-v1",
    deadline: performance.now() + 30000,
  };
  const graph: Graph = {
    code,
    nodes: [],
    places: new Map(),
    layouts: new Map(),
  };
  const cores = new Map<
    string,
    { kind: "stairs" | "elevator"; nodes: number[] }
  >();
  for (const floor of getLevels(code)) {
    const layout = getLayout(code, floor);
    graph.layouts.set(floor, layout);
    const indices = corridorCandidates(layout).map((p) =>
      addNode(graph, floor, p, { corridor: true }),
    );
    for (let i = 0; i < indices.length; i++) {
      if (i % 8 === 0) await checkpoint(scope, 0);
      const a = indices[i]!,
        pa = planar(code, graph.nodes[a]!.position);
      for (let j = i + 1; j < indices.length; j++) {
        const b = indices[j]!;
        if (corridorClear(layout, pa, planar(code, graph.nodes[b]!.position)))
          addEdge(graph.nodes, a, b, [
            graph.nodes[a]!.position,
            graph.nodes[b]!.position,
          ]);
      }
    }
    for (const c of layout.cells) {
      if (c.kind === "block") continue;
      const [x, z] = cellCenter(c),
        p = { x, z };
      const node = addNode(graph, floor, p, { cellId: c.id });
      graph.places.set(c.id, node);
      if (c.open) {
        for (const i of indices)
          if (corridorClear(layout, p, planar(code, graph.nodes[i]!.position)))
            addEdge(graph.nodes, node, i, [
              graph.nodes[node]!.position,
              graph.nodes[i]!.position,
            ]);
      } else roomConnection(graph, floor, p, c, node);
      if ((c.kind === "stairs" || c.kind === "elevator") && c.core) {
        const core = cores.get(c.core) ?? { kind: c.kind, nodes: [] };
        core.nodes.push(node);
        cores.set(c.core, core);
      }
    }
    if (floor === 1)
      for (const e of entrancePlaces(code)) {
        const entry = layout.entrances.find((v) => v.id === e.node)!;
        const node = indices.find(
          (i) =>
            length(graph.nodes[i]!.position, position(code, floor, entry)) <
            1e-6,
        );
        if (node !== undefined) {
          graph.places.set(e.id, node);
          graph.nodes[node]!.entranceStepFree = entry.stepFree;
        }
      }
  }
  for (const [id, core] of cores) {
    core.nodes.sort((a, b) => graph.nodes[a]!.floor - graph.nodes[b]!.floor);
    for (let i = 1; i < core.nodes.length; i++) {
      const a = core.nodes[i - 1]!,
        b = core.nodes[i]!;
      if (graph.nodes[b]!.floor - graph.nodes[a]!.floor === 1)
        addEdge(
          graph.nodes,
          a,
          b,
          [graph.nodes[a]!.position, graph.nodes[b]!.position],
          core.kind,
          id,
        );
    }
  }
  return graph;
}

/** Explicit development preview. Never used as a fallback by the verified /routes endpoint. */
export class PreviewRoutingService implements RoutingPort {
  private readonly cache = new AsyncCache<Graph>(12);
  async calculateRoute(
    scope: RequestScope,
    request: RouteRequest,
  ): Promise<Route> {
    checkScope(scope);
    if (
      scope.dataVersion !== "prototype-v1" ||
      request.dataVersion !== scope.dataVersion
    )
      throw invalid("Preview routes require the current prototype map.");
    if (request.stepFree && request.mode === "stairs")
      throw invalid("Choose elevators when accessibility is enabled.");
    const { via, ...direct } = request;
    if (via) return routeThroughStop(this, scope, direct, via);
    if (request.origin.buildingId !== request.destination.buildingId)
      throw new AppError(
        "OUTDOOR_NETWORK_UNAVAILABLE",
        422,
        "Choose two locations in the same building. Outdoor directions are not available.",
      );
    const code = request.origin.buildingId as BuildingCode;
    if (!Object.hasOwn(BUILDING_BY_CODE, code)) throw missing("Building");
    const base = await withinScope(
      scope,
      this.cache.get(code, () => buildGraph(code)),
    );
    // Endpoint attachments are private to the request, including simultaneous map picks.
    const graph: Graph = {
      ...base,
      nodes: base.nodes.map((n) => ({ ...n, edges: [...n.edges] })),
    };
    const resolve = (
      ref: LocationRef,
    ): { index: number; resolved: ResolvedEndpoint } => {
      let index: number | undefined;
      if (ref.kind === "place") {
        index = graph.places.get(ref.placeId);
        if (index === undefined) throw missing("Route location");
      } else {
        const floor = prototypeFloorLevel(ref.floorId),
          layout = graph.layouts.get(floor),
          p = planar(code, ref.position);
        if (
          !layout ||
          !Object.values(ref.position).every(Number.isFinite) ||
          Math.abs(ref.position.y - floorY(floor)) > 0.25 ||
          !covered(p, p, floorRects(layout))
        )
          throw badPosition();
        const cells = layout.cells.filter((c) => inside(p, cellRect(c)));
        if (cells.some((c) => c.kind === "block")) throw badPosition();
        const room = cells.find((c) => !c.open);
        index = addNode(graph, floor, p, { cellId: room?.id });
        if (room) roomConnection(graph, floor, p, room, index);
        else {
          if (!corridorClear(layout, p, p)) throw badPosition();
          for (let i = 0; i < index; i++) {
            const n = graph.nodes[i]!;
            if (
              n.floor === floor &&
              n.corridor &&
              corridorClear(layout, p, planar(code, n.position))
            )
              addEdge(graph.nodes, index, i, [
                graph.nodes[index]!.position,
                n.position,
              ]);
          }
        }
      }
      const n = graph.nodes[index]!;
      if (
        request.stepFree &&
        (n.entranceStepFree === false ||
          graph.layouts.get(n.floor)!.cells.find((c) => c.id === n.cellId)
            ?.kind === "stairs")
      )
        throw new AppError(
          "NO_ROUTE",
          422,
          "This starting point or destination includes stairs. Select a ramp entrance or another location.",
        );
      return {
        index,
        resolved: {
          requested: ref,
          buildingId: code,
          floorId: prototypeFloorId(n.floor),
          placeId: ref.kind === "place" ? ref.placeId : null,
          nodeId: n.id,
          position: n.position,
          snapDistanceMeters: 0,
        },
      };
    };
    const origin = resolve(request.origin),
      destination = resolve(request.destination);
    const a = graph.nodes[origin.index]!,
      b = graph.nodes[destination.index]!;
    if (a.floor === b.floor && origin.index !== destination.index) {
      const layout = graph.layouts.get(a.floor)!;
      if (
        (a.cellId && a.cellId === b.cellId) ||
        corridorClear(
          layout,
          planar(code, a.position),
          planar(code, b.position),
        )
      )
        addEdge(graph.nodes, origin.index, destination.index, [
          a.position,
          b.position,
        ]);
    }
    type State = { node: number; cost: number; lift?: string; key: string };
    const heap = new MinHeap<State>((a, b) => a.cost - b.cost),
      dist = new Map<string, number>(),
      previous = new Map<
        string,
        { key: string; from: number; edge: Edge; seconds: number }
      >();
    const start = `${origin.index}|`;
    dist.set(start, 0);
    heap.push({ node: origin.index, cost: 0, key: start });
    let final: string | undefined,
      iterations = 0;
    while (true) {
      const state = heap.pop();
      if (!state) break;
      await checkpoint(scope, ++iterations);
      if (state.cost !== dist.get(state.key)) continue;
      if (state.node === destination.index) {
        final = state.key;
        break;
      }
      for (const edge of graph.nodes[state.node]!.edges) {
        if (
          edge.kind === "stairs" &&
          (request.stepFree || request.mode === "elevator")
        )
          continue;
        if (edge.kind === "elevator" && request.mode === "stairs") continue;
        if (
          request.stepFree &&
          graph.nodes[edge.to]!.entranceStepFree === false
        )
          continue;
        const lift = edge.kind === "elevator" ? edge.core : undefined,
          key = `${edge.to}|${lift ?? ""}`,
          seconds =
            edge.distance /
              (edge.kind === "stairs"
                ? 0.8
                : edge.kind === "elevator"
                  ? 1.5
                  : 1.3) +
            (lift && state.lift !== lift ? 25 : 0),
          cost = state.cost + seconds;
        if (cost < (dist.get(key) ?? Infinity)) {
          dist.set(key, cost);
          previous.set(key, {
            key: state.key,
            from: state.node,
            edge,
            seconds,
          });
          heap.push({ node: edge.to, cost, lift, key });
        }
      }
    }
    if (final === undefined) throw noRoute();
    const path: { from: number; edge: Edge; seconds: number }[] = [];
    for (let key = final; key !== start;) {
      const p = previous.get(key)!;
      path.push(p);
      key = p.key;
    }
    path.reverse();
    const legs: RouteLeg[] = [];
    for (const { from, edge, seconds } of path) {
      const f = graph.nodes[from]!,
        t = graph.nodes[edge.to]!,
        last = legs.at(-1);
      let leg: RouteLeg;
      if (
        edge.kind === "walk" &&
        last?.kind === "indoor" &&
        last.floorId === prototypeFloorId(f.floor)
      )
        leg = last;
      else if (
        edge.kind !== "walk" &&
        last?.kind === "vertical" &&
        last.connectorId === edge.core
      ) {
        leg = last;
        leg.toFloorId = prototypeFloorId(t.floor);
      } else {
        leg =
          edge.kind === "walk"
            ? {
                kind: "indoor",
                id: `leg-${legs.length}`,
                buildingId: code,
                floorId: prototypeFloorId(f.floor),
                points: [edge.points[0]!],
                distanceMeters: 0,
                durationSeconds: 0,
              }
            : {
                kind: "vertical",
                id: `leg-${legs.length}`,
                buildingId: code,
                fromFloorId: prototypeFloorId(f.floor),
                toFloorId: prototypeFloorId(t.floor),
                connectorKind: edge.kind,
                connectorId: edge.core!,
                points: [edge.points[0]!],
                distanceMeters: 0,
                durationSeconds: 0,
              };
        legs.push(leg);
      }
      leg.points.push(...edge.points.slice(1));
      leg.distanceMeters += edge.distance;
      leg.durationSeconds += seconds;
    }
    if (!legs.length)
      legs.push({
        kind: "indoor",
        id: "leg-0",
        buildingId: code,
        floorId: origin.resolved.floorId,
        points: [origin.resolved.position, destination.resolved.position],
        distanceMeters: 0,
        durationSeconds: 0,
      });
    const steps: Route["steps"] = [];
    const step = (
      kind: Route["steps"][number]["kind"],
      text: string,
      leg: RouteLeg,
      pointIndex = 0,
    ) => {
      steps.push({
        id: `step-${steps.length}`,
        index: steps.length,
        kind,
        text,
        legId: leg.id,
        pointIndex,
        buildingId: code,
        floorId:
          leg.kind === "indoor"
            ? leg.floorId
            : leg.kind === "vertical"
              ? leg.fromFloorId
              : null,
      });
    };
    step("start", "Start at your selected location.", legs[0]!);
    for (const leg of legs)
      if (leg.kind === "indoor" && leg.distanceMeters > 0.01)
        step(
          "walk",
          `Follow the green line on ${floorName(prototypeFloorLevel(leg.floorId), code).toLowerCase()}.`,
          leg,
        );
      else if (leg.kind === "vertical")
        step(
          leg.connectorKind,
          `Take the ${leg.connectorKind} to ${floorName(prototypeFloorLevel(leg.toFloorId), code).toLowerCase()}.`,
          leg,
        );
    step(
      "arrive",
      "Arrive at your destination.",
      legs.at(-1)!,
      legs.at(-1)!.points.length - 1,
    );
    return structuredClone<Route>({
      id: randomUUID(),
      origin: origin.resolved,
      destination: destination.resolved,
      mode: request.mode,
      accessProfile: "public",
      distanceMeters: legs.reduce((s, l) => s + l.distanceMeters, 0),
      durationSeconds: legs.reduce((s, l) => s + l.durationSeconds, 0),
      metricsEstimated: true,
      usesStairs: path.some((p) => p.edge.kind === "stairs"),
      usesElevator: path.some((p) => p.edge.kind === "elevator"),
      stepFreeRequested: request.stepFree,
      verifiedStepFree: false,
      legs,
      steps,
      warnings: [
        {
          code: "ILLUSTRATIVE_ROUTE",
          message:
            "Route preview follows the illustrated floor plan; campus access and measurements are not verified.",
        },
        ...(request.stepFree
          ? [
              {
                code: "UNVERIFIED_ACCESSIBILITY",
                message:
                  "Elevator preview only. Step-free access and elevator availability require verification.",
              },
            ]
          : []),
      ],
      provenance: {
        dataKind: "demo",
        verificationStatus: "unverified",
        sourceUrls: [],
        verifiedAt: null,
        note: "Development preview derived from the displayed model. Not a verified campus navigation publication.",
      },
    });
  }
}
