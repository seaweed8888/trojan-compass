import { Router } from "express";
import type { Services } from "../../bootstrap/services.js";
import { buildingsController } from "./buildings.controller.js";
import { disabled } from "../../lib/errors.js";
export function buildingsRoutes(services: Services, exposeGraph: boolean) {
  const router = Router(),
    c = buildingsController(services);
  router.get("/buildings", c.list);
  router.get("/buildings/:buildingId", c.detail);
  router.get("/buildings/:buildingId/floors", c.floors);
  router.get("/buildings/:buildingId/floors/:floorId", c.floor);
  router.get(
    "/buildings/:buildingId/graph",
    exposeGraph
      ? c.graph
      : () => {
          throw disabled("Raw graph inspection is disabled.");
        },
  );
  return router;
}
