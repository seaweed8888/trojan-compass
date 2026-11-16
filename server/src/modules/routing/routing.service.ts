import type { Route, RouteRequest } from "@trojan-compass/shared/api";
import type {
  DatasetPort,
  RequestScope,
  RoutingPort,
} from "../../ports/service-ports.js";
import { AppError, disabled, invalid } from "../../lib/errors.js";
import { validateBody } from "../../lib/contracts.js";
import { checkScope } from "../../lib/scope.js";
import { GraphStore } from "./graph-store.js";
import { prepareEndpoints } from "./endpoints.js";
import { findPath } from "./pathfinding.js";
import { serializeRoute } from "./serialize-route.js";
import { routeThroughStop } from "./route-stop.js";

export class RoutingService implements RoutingPort {
  constructor(
    private readonly datasets: DatasetPort,
    private readonly graphs: GraphStore,
  ) {}
  async calculateRoute(
    scope: RequestScope,
    request: RouteRequest,
  ): Promise<Route> {
    validateBody("RouteRequest", request);
    checkScope(scope);
    if (request.dataVersion !== scope.dataVersion)
      throw new AppError(
        "DATA_VERSION_MISMATCH",
        409,
        "Route and request data versions differ.",
      );
    if (request.stepFree && request.mode === "stairs")
      throw invalid("Step-free routes cannot require stairs.", "mode");
    const { via, ...direct } = request;
    if (via) return routeThroughStop(this, scope, direct, via);
    await this.datasets.assertSnapshot(scope);
    for (const endpoint of [request.origin, request.destination]) {
      if (endpoint.kind === "place")
        await this.datasets.getPlace(
          scope,
          endpoint.buildingId,
          endpoint.placeId,
        );
      else
        await this.datasets.getFloor(
          scope,
          endpoint.buildingId,
          endpoint.floorId,
        );
    }
    if (request.origin.buildingId !== request.destination.buildingId)
      throw new AppError(
        "OUTDOOR_NETWORK_UNAVAILABLE",
        422,
        "A validated outdoor network is not published. Choose places within one building.",
      );
    const building = await this.datasets.getBuilding(
      scope,
      request.origin.buildingId,
    );
    if (!building.capabilities.navigation)
      throw disabled(
        "Navigation is not published for this building. You can still explore and highlight places.",
      );
    const graph = await this.graphs.get(scope, building.id);
    const overlay = await prepareEndpoints(
      graph,
      request.origin,
      request.destination,
      scope,
    );
    const path = await findPath(overlay, request.mode, request.stepFree, scope);
    if (!path) {
      if (
        request.stepFree &&
        (await findPath(overlay, request.mode, true, scope, true))
      )
        throw new AppError(
          "UNVERIFIED_ACCESSIBILITY",
          422,
          "A potential path has unverified accessibility. No verified step-free route was found.",
        );
      throw new AppError(
        "NO_ROUTE",
        422,
        "No public route satisfies these preferences.",
      );
    }
    return serializeRoute(graph, overlay, path, request);
  }
}
