import { Router } from "express";
import type { Services } from "../../bootstrap/services.js";
import { scenesController } from "./scenes.controller.js";
export function scenesRoutes(services: Services) {
  const router = Router();
  router.get("/buildings/:buildingId/scene", scenesController(services));
  return router;
}
