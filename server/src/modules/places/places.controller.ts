import type { Services } from "../../bootstrap/services.js";
import { getEndpoint, id, searchInput } from "../../lib/http.js";
import { PlacesService } from "./places.service.js";
export function placesController(services: Services) {
  const reads = new PlacesService(services.datasets);
  return {
    list: getEndpoint(
      services,
      "/buildings/{buildingId}/places",
      "PlaceListResponse",
      async ({ scope, request, query }) => {
        const r = await services.search.searchPlaces(
          scope,
          searchInput(query, id(request, "buildingId")),
        );
        return {
          items: r.results.map((p) => p.place),
          nextCursor: r.nextCursor,
        };
      },
    ),
    detail: getEndpoint(
      services,
      "/buildings/{buildingId}/places/{placeId}",
      "PlaceResponse",
      async ({ scope, request }) => ({
        place: await reads.get(
          scope,
          id(request, "buildingId"),
          id(request, "placeId"),
        ),
      }),
    ),
  };
}
