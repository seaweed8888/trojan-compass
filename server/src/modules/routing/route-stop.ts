import { randomUUID } from "node:crypto";
import type {
  PlaceLocation,
  Route,
  RouteRequest,
} from "@trojan-compass/shared/api";
import type { RequestScope, RoutingPort } from "../../ports/service-ports.js";

export async function routeThroughStop(
  routing: RoutingPort,
  scope: RequestScope,
  direct: RouteRequest,
  via: PlaceLocation,
): Promise<Route> {
  const first = await routing.calculateRoute(scope, {
    ...direct,
    destination: via,
  });
  const onward = await routing.calculateRoute(scope, {
    ...direct,
    origin: via,
  });
  return joinRoutesThroughStop(
    first,
    onward,
    via.placeId,
    onward.destination.placeId ?? "your destination",
  );
}

export function joinRoutesThroughStop(
  first: Route,
  onward: Route,
  stopLabel: string,
  destinationLabel: string,
): Route {
  const parts = [first, onward].map((route, i) => ({
    legs: route.legs.map((leg) => ({ ...leg, id: `part-${i}:${leg.id}` })),
    steps: route.steps
      .map((step) => ({
        ...step,
        id: `part-${i}:${step.id}`,
        legId: `part-${i}:${step.legId}`,
        text:
          i === 0 && step.kind === "arrive"
            ? `Stop at ${stopLabel}, then continue to ${destinationLabel}.`
            : step.text,
      }))
      .filter((step) => i === 0 || step.kind !== "start"),
  }));
  return {
    ...first,
    id: randomUUID(),
    destination: onward.destination,
    via: first.destination,
    distanceMeters: first.distanceMeters + onward.distanceMeters,
    durationSeconds: first.durationSeconds + onward.durationSeconds,
    metricsEstimated: first.metricsEstimated || onward.metricsEstimated,
    usesStairs: first.usesStairs || onward.usesStairs,
    usesElevator: first.usesElevator || onward.usesElevator,
    verifiedStepFree: first.verifiedStepFree && onward.verifiedStepFree,
    legs: parts.flatMap((p) => p.legs),
    steps: parts.flatMap((p) => p.steps).map((s, index) => ({ ...s, index })),
    warnings: [
      ...new Map(
        [...first.warnings, ...onward.warnings].map((w) => [w.code, w]),
      ).values(),
    ],
    provenance: {
      ...first.provenance,
      dataKind: [
        first.provenance.dataKind,
        onward.provenance.dataKind,
      ].includes("demo")
        ? "demo"
        : first.provenance.dataKind,
      verificationStatus:
        first.provenance.verificationStatus ===
        onward.provenance.verificationStatus
          ? first.provenance.verificationStatus
          : "unverified",
      sourceUrls: [
        ...new Set([
          ...first.provenance.sourceUrls,
          ...onward.provenance.sourceUrls,
        ]),
      ],
      note:
        first.provenance.note +
        " Includes an intermediate stop; opening hours are not verified.",
    },
  };
}
