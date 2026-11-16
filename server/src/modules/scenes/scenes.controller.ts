import type { Services } from "../../bootstrap/services.js";
import { getEndpoint, id } from "../../lib/http.js";
import { ScenesService } from "./scenes.service.js";
export function scenesController(services: Services) {
  const reads = new ScenesService(services.datasets);
  return getEndpoint(
    services,
    "/buildings/{buildingId}/scene",
    "SceneResponse",
    async ({ scope, query, request }) => ({
      scene: await reads.get(
        scope,
        id(request, "buildingId"),
        query.representation as string | undefined,
      ),
    }),
  );
}
