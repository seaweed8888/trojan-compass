import type { RouteRequest } from "@trojan-compass/shared/api";
import type { RoutingPort } from "../../ports/service-ports.js";
import type { Services } from "../../bootstrap/services.js";
import { postEndpoint } from "../../lib/http.js";
export const routingController = (
  services: Services,
  routing: RoutingPort = services.routing,
) =>
  postEndpoint<RouteRequest>(
    services,
    "RouteRequest",
    "RouteResponse",
    async (scope, body) => ({
      requestId: scope.requestId,
      clientRequestId: body.clientRequestId,
      dataVersion: scope.dataVersion,
      route: await routing.calculateRoute(scope, body),
    }),
  );
