import { joinRoutesThroughStop } from "../routing/route-stop.js";
import type {
  Candidate,
  ChatResponse,
  ChatTextRequest,
  MapAction,
  Place,
} from "@trojan-compass/shared/api";
import type { NavigationIntent } from "../../integrations/ai/intent.js";
import type {
  ChatDependencies,
  RequestScope,
} from "../../ports/service-ports.js";
import { AppError } from "../../lib/errors.js";
import {
  placeRef,
  StopoverService,
} from "./stopover.service.js";

type Reply = (
  status: ChatResponse["status"],
  message: string,
  actions?: MapAction[],
) => ChatResponse;
type Clarify = (
  reason: NonNullable<ChatResponse["clarification"]>["reason"],
  question: string,
  candidates?: Candidate[],
) => ChatResponse;

/** Interpretive choices stop here; all path selection remains in the shared router. */
export async function stopoverAnswer(input: {
  scope: RequestScope;
  request: ChatTextRequest;
  intent: NavigationIntent;
  dependencies: ChatDependencies;
  place: (
    query: string,
    selected?: boolean,
    role?: "origin" | "destination",
  ) => Promise<Place | ChatResponse>;
  reply: Reply;
  clarify: Clarify;
}): Promise<ChatResponse> {
  const { scope, request, intent, dependencies, place, reply, clarify } = input;
  const mode = intent.requestedMode ?? request.preferences.mode;
  const stepFree = intent.requestedStepFree ?? request.preferences.stepFree;
  if (stepFree && mode === "stairs")
    return reply(
      "unsupported",
      "A step-free route cannot require stairs. Choose elevators or turn off step-free routing.",
    );
  if (!intent.destinationQuery)
    return clarify(
      "ambiguous_destination",
      "Where are you heading after the stop?",
    );
  const destination = await place(intent.destinationQuery);
  if ("status" in destination) return destination;
  let origin = request.context.origin;
  if (intent.originQuery) {
    const start = await place(intent.originQuery, false, "origin");
    if ("status" in start) return start;
    origin = placeRef(start);
  }
  if (!origin)
    return clarify(
      "missing_origin",
      "Where are you starting? I need your starting place to find a convenient stop along the way.",
    );
  let stops: Place[];
  if (intent.stopKind) {
    if (origin.buildingId !== destination.buildingId)
      return reply(
        "unsupported",
        "Category-based stops currently require a start and destination in the same building. You can name a specific stop instead.",
      );
    stops = (
      await dependencies.datasets.listPlaces(scope, destination.buildingId)
    ).filter((p) => p.kind === intent.stopKind);
  } else {
    if (!intent.query && intent.reference !== "selected_place")
      return clarify(
        "ambiguous_destination",
        "Which place or kind of place would you like to visit along the way?",
      );
    const stop = await place(
      intent.query ?? "",
      intent.reference === "selected_place",
    );
    if ("status" in stop) return stop;
    stops = [stop];
  }
  // Do not replace an explicitly selected stop when it is inaccessible or disconnected.
  stops = stops.filter(
    (p) =>
      !["restricted", "usc_only"].includes(p.access.level) &&
      p.kind !== "emergency_exit" &&
      (!stepFree || p.access.stepFreeAccess !== "verified_no"),
  );
  if (!stops.length)
    return reply(
      "not_found",
      "No matching stop is available in the map data for your access preferences.",
    );
  try {
    const result = await new StopoverService(dependencies.routing).recommend(
      scope,
      {
        origin,
        stops,
        destinations: [destination],
        preferences: { mode, stepFree, accessProfile: "public" },
        clientRequestId: request.clientRequestId,
      },
    );
    if (!result)
      return reply(
        "no_route",
        "I could not find a complete route through that stop to your destination with these travel preferences.",
      );
    const label = `${result.stop.displayLabel} (${result.stop.id})`;
    const wantsRoute = intent.kind === "route_stopover";
    const message = intent.stopKind
      ? `${label} is the most convenient mapped stop on your way to ${destination.displayLabel}.`
      : `Your trip stops at ${label}, then continues to ${destination.displayLabel}.`;
    return reply(
      "resolved",
      message +
        (wantsRoute
          ? " Follow the route through the stop to your destination."
          : " I highlighted the stop. Ask for directions through it to draw the full trip.") +
        " Opening hours and availability at the stop are not verified.",
      wantsRoute
        ? [
            {
              type: "show_route",
              route: joinRoutesThroughStop(
                result.first,
                result.onward,
                label,
                destination.displayLabel,
              ),
            },
          ]
        : [
            {
              type: "focus_place",
              buildingId: result.stop.buildingId,
              floorId: result.stop.floorId,
              placeId: result.stop.id,
            },
          ],
    );
  } catch (error) {
    if (error instanceof AppError && error.code === "FEATURE_DISABLED")
      return reply("unsupported", error.message);
    if (error instanceof AppError && error.httpStatus === 422)
      return reply("no_route", error.message);
    throw error;
  }
}
