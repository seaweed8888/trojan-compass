import { joinRoutesThroughStop } from "../routing/route-stop.js";
import type {
  LocationRef,
  Place,
  Route,
  RouteRequest,
} from "@trojan-compass/shared/api";
import type { RequestScope, RoutingPort } from "../../ports/service-ports.js";
import { AppError } from "../../lib/errors.js";
import { checkScope } from "../../lib/scope.js";
import {
  attemptRoute,
  placeRef,
  StopoverService,
} from "./stopover.service.js";

export type RestroomRecommendation = {
  restroom: Place;
  exit: Place | null;
  first: Route;
  onward: Route | null;
  extraSeconds: number | null;
};
export const eligibleRestroom = (place: Place, stepFree: boolean) =>
  place.kind === "restroom" &&
  !["restricted", "usc_only"].includes(place.access.level) &&
  (!stepFree || place.access.stepFreeAccess !== "verified_no");
export const eligibleExit = (place: Place) =>
  place.kind === "entrance" &&
  place.access.exitAllowed === true &&
  !["restricted", "usc_only"].includes(place.access.level);

export class RestroomService {
  constructor(private readonly routing: RoutingPort) {}
  async recommend(
    scope: RequestScope,
    input: {
      origin: LocationRef;
      restrooms: Place[];
      exits: Place[];
      onWayOut: boolean;
      preferences: Pick<RouteRequest, "mode" | "stepFree" | "accessProfile">;
      clientRequestId: string;
    },
  ): Promise<RestroomRecommendation | null> {
    const restrooms = input.restrooms.filter((p) =>
      eligibleRestroom(p, input.preferences.stepFree),
    );
    const exits = input.exits.filter(eligibleExit);
    if (input.onWayOut) {
      const found = await new StopoverService(this.routing).recommend(scope, {
        ...input,
        stops: restrooms,
        destinations: exits,
      });
      return found
        ? {
            restroom: found.stop,
            exit: found.destination,
            first: found.first,
            onward: found.onward,
            extraSeconds: found.extraSeconds,
          }
        : null;
    }
    checkScope(scope);
    if (restrooms.length > 64)
      throw new AppError(
        "INVALID_REQUEST",
        400,
        "Narrow this request to a smaller building.",
      );
    let best: RestroomRecommendation | null = null;
    for (const restroom of [...restrooms].sort((a, b) =>
      a.id.localeCompare(b.id),
    )) {
      const first = await attemptRoute(this.routing, scope, {
        clientRequestId: input.clientRequestId,
        dataVersion: scope.dataVersion,
        origin: input.origin,
        destination: placeRef(restroom),
        ...input.preferences,
      });
      if (
        first &&
        (!best || first.durationSeconds < best.first.durationSeconds)
      )
        best = {
          restroom,
          exit: null,
          first,
          onward: null,
          extraSeconds: null,
        };
    }
    checkScope(scope);
    return best;
  }
}
export function routeViaRestroom(
  recommendation: RestroomRecommendation,
): Route {
  return recommendation.onward
    ? joinRoutesThroughStop(
        recommendation.first,
        recommendation.onward,
        recommendation.restroom.displayLabel,
        recommendation.exit!.displayLabel,
      )
    : recommendation.first;
}
