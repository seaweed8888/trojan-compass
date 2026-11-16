import { randomUUID } from "node:crypto";
import type {
  Route,
  RouteLeg,
  RouteRequest,
  RouteStep,
} from "@trojan-compass/shared/api";
import type { RuntimeGraph } from "./graph-store.js";
import type { RouteOverlay } from "./endpoints.js";
import type { Path } from "./pathfinding.js";
import { assertContract } from "../../lib/contracts.js";

export function serializeRoute(
  graph: RuntimeGraph,
  overlay: RouteOverlay,
  path: Path,
  request: RouteRequest,
): Route {
  const legs: RouteLeg[] = [];
  for (const { arc, seconds } of path.arcs) {
    const fromFloorId = overlay.floorForNode.get(arc.from)!,
      toFloorId = overlay.floorForNode.get(arc.to)!;
    const previous = legs.at(-1);
    if (fromFloorId !== toFloorId) {
      if (
        previous?.kind === "vertical" &&
        previous.connectorId === arc.connectorId &&
        previous.toFloorId === fromFloorId
      ) {
        previous.toFloorId = toFloorId;
        previous.points.push(...arc.points.slice(1));
        previous.distanceMeters += arc.distance;
        previous.durationSeconds += seconds;
      } else {
        if (
          !arc.connectorId ||
          (arc.kind !== "stairs" &&
            arc.kind !== "elevator" &&
            arc.kind !== "ramp")
        )
          throw new Error("Invalid vertical path arc");
        legs.push({
          kind: "vertical",
          id: `leg-${legs.length}`,
          buildingId: graph.source.buildingId,
          fromFloorId,
          toFloorId,
          connectorKind: arc.kind,
          connectorId: arc.connectorId,
          points: [...arc.points],
          distanceMeters: arc.distance,
          durationSeconds: seconds,
        });
      }
    } else if (
      previous?.kind === "indoor" &&
      previous.floorId === fromFloorId
    ) {
      previous.points.push(...arc.points.slice(1));
      previous.distanceMeters += arc.distance;
      previous.durationSeconds += seconds;
    } else
      legs.push({
        kind: "indoor",
        id: `leg-${legs.length}`,
        buildingId: graph.source.buildingId,
        floorId: fromFloorId,
        points: [...arc.points],
        distanceMeters: arc.distance,
        durationSeconds: seconds,
      });
  }
  if (!legs.length)
    legs.push({
      kind: "indoor",
      id: "leg-0",
      buildingId: graph.source.buildingId,
      floorId: path.origin.endpoint.floorId,
      points: [path.origin.endpoint.position, path.origin.endpoint.position],
      distanceMeters: 0,
      durationSeconds: 0,
    });
  const steps: RouteStep[] = [];
  const addStep = (
    leg: RouteLeg,
    kind: RouteStep["kind"],
    text: string,
    pointIndex: number,
    floorId: string,
  ) =>
    steps.push({
      id: `step-${steps.length}`,
      index: steps.length,
      kind,
      text,
      legId: leg.id,
      pointIndex,
      buildingId: graph.source.buildingId,
      floorId,
    });
  if (path.arcs.some(({ arc }) => arc.distance > 0))
    addStep(
      legs[0]!,
      "start",
      "Start at the selected public access point.",
      0,
      path.origin.endpoint.floorId,
    );
  for (const leg of legs) {
    if (leg.kind === "vertical")
      addStep(
        leg,
        leg.connectorKind,
        `Take the ${leg.connectorKind} to floor ${leg.toFloorId}.`,
        0,
        leg.fromFloorId,
      );
    if (leg.kind === "indoor" && leg.distanceMeters > 0) {
      addStep(
        leg,
        "walk",
        `Follow the marked path on floor ${leg.floorId}.`,
        0,
        leg.floorId,
      );
      for (let i = 1; i < leg.points.length - 1; i++) {
        const a = leg.points[i - 1]!,
          b = leg.points[i]!,
          c = leg.points[i + 1]!;
        const ux = b.x - a.x,
          uz = b.z - a.z,
          vx = c.x - b.x,
          vz = c.z - b.z;
        const lengths = Math.hypot(ux, uz) * Math.hypot(vx, vz);
        if (lengths < 0.01) continue;
        const angle = Math.acos(
          Math.max(-1, Math.min(1, (ux * vx + uz * vz) / lengths)),
        );
        if (angle > Math.PI / 6 && angle < (Math.PI * 5) / 6) {
          const left = ux * vz - uz * vx < 0;
          addStep(
            leg,
            left ? "turn_left" : "turn_right",
            left ? "Turn left." : "Turn right.",
            i,
            leg.floorId,
          );
        }
      }
    }
  }
  const last = legs.at(-1)!;
  addStep(
    last,
    "arrive",
    "Arrive at the destination access point.",
    last.points.length - 1,
    path.destination.endpoint.floorId,
  );
  const verifiedStepFree =
    path.origin.policy.stepFree === "verified_yes" &&
    path.destination.policy.stepFree === "verified_yes" &&
    path.arcs.every(
      (a) =>
        a.arc.policy.stepFree === "verified_yes" && a.arc.kind !== "stairs",
    );
  const route: Route = {
    id: randomUUID(),
    origin: path.origin.endpoint,
    destination: path.destination.endpoint,
    mode: request.mode,
    accessProfile: "public",
    distanceMeters: legs.reduce((sum, l) => sum + l.distanceMeters, 0),
    durationSeconds: legs.reduce((sum, l) => sum + l.durationSeconds, 0),
    metricsEstimated: true,
    usesStairs: path.arcs.some((a) => a.arc.kind === "stairs"),
    usesElevator: path.arcs.some((a) => a.arc.kind === "elevator"),
    stepFreeRequested: request.stepFree,
    verifiedStepFree,
    legs,
    steps,
    warnings: [
      {
        code: "ESTIMATED_TIMING",
        message: "Travel times are estimates; elevator wait times vary.",
      },
      ...(!verifiedStepFree
        ? [
            {
              code: "ACCESSIBILITY_UNVERIFIED",
              message: "This route is not verified as step-free.",
            },
          ]
        : []),
      ...(graph.source.provenance.dataKind === "demo"
        ? [
            {
              code: "DEMO_DATA",
              message:
                "Illustrative test data; not directions for use on campus.",
            },
          ]
        : []),
    ],
    provenance: graph.source.provenance,
  };
  assertContract("Route", route);
  return route;
}
