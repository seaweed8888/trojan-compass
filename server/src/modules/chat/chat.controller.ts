import type { ChatTextRequest } from "@trojan-compass/shared/api";
import type { Services } from "../../bootstrap/services.js";
import { postEndpoint } from "../../lib/http.js";
export const chatController = (services: Services) =>
  postEndpoint<ChatTextRequest>(
    services,
    "ChatTextRequest",
    "ChatResponse",
    (scope, body) => services.chat.respond(scope, body),
  );
