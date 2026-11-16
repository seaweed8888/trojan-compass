import { Router } from "express";
import type { Services } from "../../bootstrap/services.js";
import { chatController } from "./chat.controller.js";
export function chatRoutes(services: Services) {
  const router = Router();
  router.post("/chat", chatController(services));
  return router;
}
