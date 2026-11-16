import type { RouteRequest } from "./route.js";

export interface ChatMessage { role: "user" | "assistant"; content: string; }

/** Result of resolving user intent against known places, before route calculation. */
export interface NavigationIntent {
  destinationPlaceId?: string;
  routeRequest?: RouteRequest;
  clarification?: string;
}
