import { randomUUID } from "node:crypto";
import type {
  LocationRef,
  ResolvedEndpoint,
  Vector3,
} from "@trojan-compass/shared/api";
import type { RequestScope } from "../../ports/service-ports.js";
import { AppError, missing } from "../../lib/errors.js";
import { checkpoint } from "../../lib/scope.js";
import {
  bindingPolicy,
  combinePolicy,
  type Arc,
  type Policy,
  type RuntimeGraph,
} from "./graph-store.js";
import {
  distance,
  EPS,
  inPolygon,
  polylineLength,
  projectPolyline,
  segmentWalkable,
  slicePolyline,
} from "./geometry.js";

export type EndpointCandidate = { endpoint: ResolvedEndpoint; policy: Policy };
export type RouteOverlay = {
  adjacency: ReadonlyMap<string, readonly Arc[]>;
  origins: EndpointCandidate[];
  destinations: EndpointCandidate[];
  floorForNode: ReadonlyMap<string, string>;
};
const invalidPosition = (message: string) =>
  new AppError("INVALID_POSITION", 422, message);

export async function prepareEndpoints(
  graph: RuntimeGraph,
  origin: LocationRef,
  destination: LocationRef,
  scope: RequestScope,
): Promise<RouteOverlay> {
  const adjacency = new Map<string, readonly Arc[]>(graph.adjacency);
  const floorForNode = new Map(
    [...graph.nodes].map(([id, n]) => [id, n.floorId]),
  );
  const breaks = new Map<
    string,
    { id: string; point: Vector3; offset: number }[]
  >();
  const addArc = (arc: Arc) =>
    adjacency.set(arc.from, [...(adjacency.get(arc.from) ?? []), arc]);
  const roomPicks: {
    id: string;
    role: "origin" | "destination";
    point: Vector3;
    floorId: string;
    regionId: string;
    policy: Policy;
  }[] = [];
  const pickId = () => {
    let id: string;
    do {
      id = `pick:${randomUUID()}`;
    } while (floorForNode.has(id));
    return id;
  };
  const prepare = async (
    ref: LocationRef,
    role: "origin" | "destination",
  ): Promise<EndpointCandidate[]> => {
    if (ref.kind === "place") {
      const place = graph.places.get(ref.placeId);
      if (!place) throw missing("Place");
      if (
        role === "origin"
          ? place.access.exitAllowed !== true
          : place.access.entryAllowed !== true
      )
        return [];
      return (graph.bindings.get(place.id) ?? [])
        .map((binding) => ({
          endpoint: {
            requested: ref,
            buildingId: ref.buildingId,
            floorId: place.floorId,
            placeId: place.id,
            nodeId: binding.nodeId,
            position: graph.nodes.get(binding.nodeId)!.position,
            snapDistanceMeters: 0,
          },
          policy: bindingPolicy(graph, place, binding),
        }))
        .filter((candidate) => candidate.policy.public);
    }
    const floor = graph.source.geometry?.floors.find(
      (f) => f.floorId === ref.floorId,
    );
    if (!floor)
      throw invalidPosition(
        "Validated walkable geometry is not available for this floor. Choose a listed place.",
      );
    if (Math.abs(ref.position.y - floor.elevationMeters) > 0.25)
      throw invalidPosition(
        "The picked position does not match the selected floor elevation.",
      );
    const p = { ...ref.position, y: floor.elevationMeters };
    const regions = floor.walkableRegions.filter(
      (r) => graph.policy(r.access).public && inPolygon(p, r.polygon),
    );
    if (
      !regions.length ||
      floor.blockedRegions.some((r) => inPolygon(p, r.polygon))
    )
      throw invalidPosition(
        "The picked position is outside public walkable space.",
      );
    const rooms = regions.filter((r) => r.kind === "room");
    const result = (
      nodeId: string,
      position: Vector3,
      snapDistanceMeters: number,
      policy: Policy,
    ): EndpointCandidate => ({
      policy,
      endpoint: {
        requested: ref,
        buildingId: ref.buildingId,
        floorId: ref.floorId,
        placeId: null,
        nodeId,
        position,
        snapDistanceMeters,
      },
    });
    if (rooms.length) {
      const id = pickId();
      floorForNode.set(id, ref.floorId);
      adjacency.set(id, []);
      let linked = false;
      for (const room of rooms) {
        const roomPolicy = graph.policy(room.access);
        for (const binding of graph.source.placeAccessBindings.filter(
          (b) => b.regionId === room.id,
        )) {
          const place = graph.places.get(binding.placeId)!,
            node = graph.nodes.get(binding.nodeId)!;
          const policy = combinePolicy(
            roomPolicy,
            bindingPolicy(graph, place, binding),
          );
          if (
            !policy.public ||
            (role === "origin"
              ? place.access.exitAllowed !== true
              : place.access.entryAllowed !== true) ||
            !segmentWalkable(
              p,
              node.position,
              [room.polygon],
              floor.blockedRegions.map((r) => r.polygon),
            )
          )
            continue;
          const arc: Arc = {
            id: `${id}:${binding.accessPointId}`,
            edgeId: id,
            from: id,
            to: node.id,
            kind: "walkway",
            points: [p, node.position],
            distance: distance(p, node.position),
            connectorId: null,
            policy,
            metricsEstimated: true,
          };
          if (role === "origin") addArc(arc);
          else
            addArc({
              ...arc,
              from: node.id,
              to: id,
              points: [...arc.points].reverse(),
            });
          linked = true;
        }
        roomPicks.push({
          id,
          role,
          point: p,
          floorId: ref.floorId,
          regionId: room.id,
          policy: roomPolicy,
        });
      }
      if (!linked)
        throw invalidPosition(
          "This room has no validated public door connection. Choose a listed place.",
        );
      return [
        result(
          id,
          p,
          0,
          combinePolicy(...rooms.map((r) => graph.policy(r.access))),
        ),
      ];
    }
    let best:
      | {
          edgeId: string;
          point: Vector3;
          offset: number;
          distance: number;
          policy: Policy;
        }
      | undefined;
    let count = 0;
    for (const edge of graph.edges.values()) {
      await checkpoint(scope, count++);
      if (edge.kind !== "walkway") continue;
      const a = graph.nodes.get(edge.fromNodeId)!,
        b = graph.nodes.get(edge.toNodeId)!;
      if (a.floorId !== ref.floorId || b.floorId !== ref.floorId) continue;
      const detail = graph.details.get(edge.id)!;
      const regionMatches = regions.filter((r) =>
        detail.regionIds.includes(r.id),
      );
      if (!regionMatches.length) continue;
      const policy = combinePolicy(
        graph.adjacency.get(a.id)!.find((x) => x.edgeId === edge.id)!.policy,
        ...regionMatches.map((r) => graph.policy(r.access)),
      );
      if (!policy.public) continue;
      const projection = projectPolyline(p, detail.points);
      if (
        projection.distance > 2 ||
        !segmentWalkable(
          p,
          projection.point,
          regionMatches.map((r) => r.polygon),
          floor.blockedRegions.map((r) => r.polygon),
        )
      )
        continue;
      if (
        !best ||
        projection.distance < best.distance - EPS ||
        (Math.abs(projection.distance - best.distance) < EPS &&
          edge.id < best.edgeId)
      )
        best = { ...projection, edgeId: edge.id, policy };
    }
    if (!best && !floor.openAreaApproaches)
      throw invalidPosition(
        "No wall-safe corridor connection was found within two meters.",
      );
    if (floor.openAreaApproaches && (!best || best.distance > EPS)) {
      // An open-area pick is a walked approach, never a long-distance snap.
      // Only connect through public corridor/landing polygons, retaining walls
      // and room doors as barriers. These arcs exist only for this request.
      const publicRegions = floor.walkableRegions.filter(
        (r) => r.kind !== "room" && graph.policy(r.access).public,
      );
      const allowed = publicRegions.map((r) => r.polygon);
      const blocked = floor.blockedRegions.map((r) => r.polygon);
      const verified = publicRegions
        .filter((r) => graph.policy(r.access).stepFree === "verified_yes")
        .map((r) => r.polygon);
      const possible = publicRegions
        .filter((r) => graph.policy(r.access).stepFree !== "verified_no")
        .map((r) => r.polygon);
      const id = pickId();
      const policies: Policy[] = [];
      for (const node of graph.nodes.values()) {
        await checkpoint(scope, count++);
        if (
          node.floorId !== ref.floorId ||
          node.kind !== "corridor" ||
          !graph.adjacency.get(node.id)?.length
        )
          continue;
        if (!segmentWalkable(p, node.position, allowed, blocked)) continue;
        const policy: Policy = {
          public: true,
          stepFree: segmentWalkable(p, node.position, verified, blocked)
            ? "verified_yes"
            : segmentWalkable(p, node.position, possible, blocked)
              ? "unknown"
              : "verified_no",
        };
        const arc: Arc = {
          id: `${id}:${node.id}`,
          edgeId: id,
          from: id,
          to: node.id,
          kind: "walkway",
          points: [p, node.position],
          distance: distance(p, node.position),
          connectorId: null,
          policy,
          metricsEstimated: true,
        };
        if (role === "origin") addArc(arc);
        else
          addArc({ ...arc, from: node.id, to: id, points: [node.position, p] });
        policies.push(policy);
      }
      if (!policies.length)
        throw invalidPosition(
          "No wall-safe connection to the published corridors was found. Choose another point or a listed place.",
        );
      floorForNode.set(id, ref.floorId);
      // The endpoint inherits its region; each approach retains its own policy.
      return [
        result(
          id,
          p,
          0,
          combinePolicy(
            ...regions
              .filter((r) => r.kind !== "room")
              .map((r) => graph.policy(r.access)),
          ),
        ),
      ];
    }
    const edge = graph.edges.get(best!.edgeId)!;
    const end = polylineLength(graph.details.get(edge.id)!.points);
    const id =
      best!.offset < EPS
        ? edge.fromNodeId
        : end - best!.offset < EPS
          ? edge.toNodeId
          : pickId();
    if (!graph.nodes.has(id)) {
      breaks.set(edge.id, [
        ...(breaks.get(edge.id) ?? []),
        { id, point: best!.point, offset: best!.offset },
      ]);
      floorForNode.set(id, ref.floorId);
      adjacency.set(id, []);
    }
    return [
      result(
        id,
        best!.point,
        distance(ref.position, best!.point),
        best!.policy,
      ),
    ];
  };
  const origins = await prepare(origin, "origin");
  const destinations = await prepare(destination, "destination");
  for (const [edgeId, cuts] of breaks) {
    const edge = graph.edges.get(edgeId)!,
      detail = graph.details.get(edgeId)!;
    const forward = graph.adjacency
      .get(edge.fromNodeId)!
      .find((a) => a.edgeId === edgeId)!;
    for (const id of [edge.fromNodeId, edge.toNodeId])
      adjacency.set(
        id,
        (adjacency.get(id) ?? []).filter((a) => a.edgeId !== edgeId),
      );
    const ordered = [
      { id: edge.fromNodeId, offset: 0 },
      ...cuts.sort((a, b) => a.offset - b.offset || a.id.localeCompare(b.id)),
      { id: edge.toNodeId, offset: polylineLength(detail.points) },
    ];
    for (let i = 1; i < ordered.length; i++) {
      const a = ordered[i - 1]!,
        b = ordered[i]!;
      const points = slicePolyline(detail.points, a.offset, b.offset);
      const arc = {
        ...forward,
        id: `${edgeId}:split:${i}`,
        from: a.id,
        to: b.id,
        points,
        distance: polylineLength(points),
      };
      addArc(arc);
      if (edge.bidirectional || Math.abs(a.offset - b.offset) < EPS)
        addArc({
          ...arc,
          id: `${arc.id}:reverse`,
          from: b.id,
          to: a.id,
          points: [...points].reverse(),
        });
    }
  }
  // Two picks in the same room may connect directly, but only inside its validated polygon.
  for (const a of roomPicks.filter((p) => p.role === "origin"))
    for (const b of roomPicks.filter(
      (p) => p.role === "destination" && p.regionId === a.regionId,
    )) {
      const floor = graph.source.geometry!.floors.find(
        (f) => f.floorId === a.floorId,
      )!;
      const region = graph.regions.get(a.regionId)!.region;
      if (
        segmentWalkable(
          a.point,
          b.point,
          [region.polygon],
          floor.blockedRegions.map((r) => r.polygon),
        )
      )
        addArc({
          id: "@room-direct",
          edgeId: "@room-direct",
          from: a.id,
          to: b.id,
          kind: "walkway",
          points: [a.point, b.point],
          distance: distance(a.point, b.point),
          connectorId: null,
          policy: combinePolicy(a.policy, b.policy),
          metricsEstimated: true,
        });
    }
  return { adjacency, origins, destinations, floorForNode };
}
