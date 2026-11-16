import { Router } from "express";
import type { Services } from "../../bootstrap/services.js";
import { searchController } from "./search.controller.js";
export function searchRoutes(services: Services) {
  const router = Router();
  router.get("/places", searchController(services));
  return router;
}
