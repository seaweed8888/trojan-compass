import type {
  LocationRef,
  Place,
  Route,
  RouteRequest,
} from "@trojan-compass/shared/api";
import type { RequestScope, RoutingPort } from "../../ports/service-ports.js";
import { AppError } from "../../lib/errors.js";
import { checkScope } from "../../lib/scope.js";

export type StopoverRecommendation = {
  stop: Place;
  destination: Place;
  first: Route;
  onward: Route;
  extraSeconds: number;
};
export type TravelPreferences = Pick<
  RouteRequest,
  "mode" | "stepFree" | "accessProfile"
>;
export const placeRef = (place: Place): LocationRef => ({
  kind: "place",
  buildingId: place.buildingId,
  placeId: place.id,
});
export async function attemptRoute(
  routing: RoutingPort,
  scope: RequestScope,
  request: RouteRequest,
) {
  checkScope(scope);
  try {
    return await routing.calculateRoute(scope, request);
  } catch (error) {
    if (
      error instanceof AppError &&
      ["NO_ROUTE", "UNVERIFIED_ACCESSIBILITY"].includes(error.code)
    )
      return null;
    throw error;
  }
}

/** Compare complete A -> stop -> B routes with one fixed direct-trip baseline. */
export class StopoverService {
  constructor(private readonly routing: RoutingPort) {}
  async recommend(
    scope: RequestScope,
    input: {
      origin: LocationRef;
      stops: Place[];
      destinations: Place[];
      preferences: TravelPreferences;
      clientRequestId: string;
    },
  ): Promise<StopoverRecommendation | null> {
    checkScope(scope);
    if (input.stops.length > 64 || input.destinations.length > 8)
      throw new AppError(
        "INVALID_REQUEST",
        400,
        "Narrow the stop or destination to a smaller set of places.",
      );
    const calculate = (origin: LocationRef, destination: LocationRef) =>
      attemptRoute(this.routing, scope, {
        clientRequestId: input.clientRequestId,
        dataVersion: scope.dataVersion,
        origin,
        destination,
        ...input.preferences,
      });
    let baseline = Infinity;
    for (const destination of input.destinations) {
      const direct = await calculate(input.origin, placeRef(destination));
      if (direct) baseline = Math.min(baseline, direct.durationSeconds);
    }
    if (!Number.isFinite(baseline)) return null;
    let best: StopoverRecommendation | null = null,
      bestCost = Infinity;
    for (const stop of [...input.stops].sort((a, b) =>
      a.id.localeCompare(b.id),
    )) {
      const first = await calculate(input.origin, placeRef(stop));
      if (!first) continue;
      for (const destination of [...input.destinations].sort((a, b) =>
        a.id.localeCompare(b.id),
      )) {
        const onward = await calculate(placeRef(stop), placeRef(destination));
        if (!onward) continue;
        const cost = first.durationSeconds + onward.durationSeconds;
        if (cost < bestCost) {
          bestCost = cost;
          best = {
            stop,
            destination,
            first,
            onward,
            extraSeconds: Math.max(0, cost - baseline),
          };
        }
      }
    }
    checkScope(scope);
    return best;
  }
}
