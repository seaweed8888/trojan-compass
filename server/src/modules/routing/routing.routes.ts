import { Router } from "express";
import type { RoutingPort } from "../../ports/service-ports.js";
import type { Services } from "../../bootstrap/services.js";
import { routingController } from "./routing.controller.js";
export function routingRoutes(services: Services, preview?: RoutingPort) {
  const router = Router();
  router.post("/routes", routingController(services));
  if (preview)
    router.post("/preview/routes", routingController(services, preview));
  return router;
}
