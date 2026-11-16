import { Router } from "express";
import type { Services } from "../../bootstrap/services.js";
import { placesController } from "./places.controller.js";
export function placesRoutes(services: Services) {
  const router = Router(),
    c = placesController(services);
  router.get("/buildings/:buildingId/places", c.list);
  router.get("/buildings/:buildingId/places/:placeId", c.detail);
  return router;
}
