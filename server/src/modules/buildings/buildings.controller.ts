import type { Services } from "../../bootstrap/services.js";
import { getEndpoint, id, searchInput } from "../../lib/http.js";
import { BuildingsService } from "./buildings.service.js";
export function buildingsController(services: Services) {
  const reads = new BuildingsService(services.datasets);
  return {
    list: getEndpoint(
      services,
      "/buildings",
      "BuildingListResponse",
      async ({ scope, query }) => {
        const r = await services.search.searchBuildings(
          scope,
          searchInput(query),
        );
        return { items: r.buildings, nextCursor: r.nextCursor };
      },
    ),
    detail: getEndpoint(
      services,
      "/buildings/{buildingId}",
      "BuildingResponse",
      async ({ scope, request }) => ({
        building: await reads.get(scope, id(request, "buildingId")),
      }),
    ),
    floors: getEndpoint(
      services,
      "/buildings/{buildingId}/floors",
      "FloorListResponse",
      async ({ scope, request }) => ({
        items: await reads.floors(scope, id(request, "buildingId")),
        nextCursor: null,
      }),
    ),
    floor: getEndpoint(
      services,
      "/buildings/{buildingId}/floors/{floorId}",
      "FloorResponse",
      ({ scope, request }) =>
        reads.floor(scope, id(request, "buildingId"), id(request, "floorId")),
    ),
    graph: getEndpoint(
      services,
      "/buildings/{buildingId}/graph",
      "GraphResponse",
      async ({ scope, request }) => {
        const graph = await services.graphs.get(
          scope,
          id(request, "buildingId"),
        );
        return {
          buildingId: graph.source.buildingId,
          nodes: graph.source.nodes,
          edges: graph.source.edges,
          provenance: graph.source.provenance,
        };
      },
    ),
  };
}
