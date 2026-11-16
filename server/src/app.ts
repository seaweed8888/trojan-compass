import { randomUUID } from "node:crypto";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import type { Services } from "./bootstrap/services.js";
import type { RoutingPort } from "./ports/service-ports.js";
import { AppError, disabled, invalid, missing, timeout } from "./lib/errors.js";
import { validateQuery } from "./lib/contracts.js";
import { buildingsRoutes } from "./modules/buildings/buildings.routes.js";
import { placesRoutes } from "./modules/places/places.routes.js";
import { scenesRoutes } from "./modules/scenes/scenes.routes.js";
import { searchRoutes } from "./modules/search/search.routes.js";
import { routingRoutes } from "./modules/routing/routing.routes.js";
import { chatRoutes } from "./modules/chat/chat.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

export type HttpOptions = {
  previewRouting?: RoutingPort;
  origins?: string[];
  trustProxy?: string[];
  exposeGraph?: boolean;
  requestTimeoutMs?: number;
  chatTimeoutMs?: number;
  rateLimitPerMinute?: number;
  chatRateLimitPerMinute?: number;
  shutdownSignal?: AbortSignal;
  log?: (event: Record<string, unknown>) => void;
};

/** Dependency-injected app: importing it neither listens nor reads credentials. */
export function createApp(services: Services, options: HttpOptions = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.disable("etag");
  app.set("query parser", "simple");
  app.set(
    "trust proxy",
    options.trustProxy?.length ? options.trustProxy : false,
  );
  app.use((request, response, next) => {
    const supplied = request.header("x-request-id");
    const validId =
      supplied === undefined || /^[\x21-\x7e]{1,128}$/.test(supplied);
    const requestId = validId && supplied ? supplied : randomUUID();
    const controller = new AbortController();
    const start = performance.now();
    const budget =
      request.path === "/api/chat"
        ? (options.chatTimeoutMs ?? 45000)
        : (options.requestTimeoutMs ?? 10000);
    response.locals.scope = {
      requestId,
      dataVersion: "",
      signal: controller.signal,
      deadline: start + budget,
    };
    response.setHeader("X-Request-ID", requestId);
    const abort = () => controller.abort(timeout());
    const timer = setTimeout(() => {
      abort();
      next(timeout());
    }, budget);
    timer.unref();
    const shutdown = () => {
      controller.abort(
        new AppError(
          "DEPENDENCY_UNAVAILABLE",
          503,
          "The server is shutting down.",
        ),
      );
      next(controller.signal.reason);
    };
    options.shutdownSignal?.addEventListener("abort", shutdown, { once: true });
    response.on("close", () => {
      if (!response.writableFinished) abort();
      clearTimeout(timer);
      options.shutdownSignal?.removeEventListener("abort", shutdown);
    });
    response.on("finish", () => {
      clearTimeout(timer);
      options.shutdownSignal?.removeEventListener("abort", shutdown);
      try {
        options.log?.({
          event: "http_request",
          requestId,
          method: request.method,
          route: request.route?.path ?? "unmatched",
          status: response.statusCode,
          durationMs: Math.round(performance.now() - start),
          errorCode: response.locals.errorCode ?? null,
          ...(response.locals.errorDiagnostic
            ? { diagnostic: response.locals.errorDiagnostic }
            : {}),
        });
      } catch {
        /* Logging must not break a response. */
      }
    });
    if (!validId)
      return next(
        invalid(
          "X-Request-ID must be 1–128 printable ASCII characters.",
          "X-Request-ID",
        ),
      );
    if (options.shutdownSignal?.aborted) return shutdown();
    next();
  });
  app.use(helmet());
  app.use((request, response, next) => {
    const origin = request.header("origin");
    if (origin) {
      if (!options.origins?.includes(origin))
        return next(invalid("This browser origin is not allowed."));
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.vary("Origin");
      response.setHeader(
        "Access-Control-Expose-Headers",
        "X-Request-ID, ETag, Retry-After",
      );
    }
    if (request.method === "OPTIONS") {
      const headers = (request.header("access-control-request-headers") ?? "")
        .toLowerCase()
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);
      if (
        headers.some(
          (h) => !["content-type", "x-request-id", "if-none-match"].includes(h),
        )
      )
        return next(invalid("Unsupported preflight header."));
      response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, X-Request-ID, If-None-Match",
      );
      response.status(204).end();
      return;
    }
    next();
  });
  app.get("/api/health", (request, response) => {
    validateQuery("/health", request.query);
    response.setHeader("Cache-Control", "no-store");
    response.json({ status: "ok", service: "trojan-compass-api" });
  });
  const limiter = (limit: number) =>
    rateLimit({
      windowMs: 60000,
      limit,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: (_request, response, next) => {
        response.setHeader("Retry-After", "60");
        next(
          new AppError(
            "RATE_LIMITED",
            429,
            "Too many requests. Try again shortly.",
          ),
        );
      },
    });
  app.use("/api", limiter(options.rateLimitPerMinute ?? 240));
  app.use("/api/chat", limiter(options.chatRateLimitPerMinute ?? 20));
  app.use((request, _response, next) => {
    if (request.method === "POST") {
      if (request.path === "/api/chat" && request.is("multipart/form-data"))
        return next(
          new AppError(
            "IMAGE_INPUT_DISABLED",
            501,
            "Image input is not enabled. Send a text request.",
          ),
        );
      if (
        !request.is("application/json") ||
        (request.header("content-encoding") &&
          request.header("content-encoding") !== "identity")
      )
        return next(
          new AppError(
            "UNSUPPORTED_MEDIA_TYPE",
            415,
            "Use uncompressed application/json.",
          ),
        );
    }
    next();
  });
  app.use(express.json({ limit: "1mb", strict: true, inflate: false }));
  app.use(
    "/api",
    buildingsRoutes(services, options.exposeGraph ?? false),
    placesRoutes(services),
    scenesRoutes(services),
    searchRoutes(services),
    routingRoutes(services, options.previewRouting),
    chatRoutes(services),
  );
  app.get(["/api/events", "/api/events/:eventId"], () => {
    throw disabled("Events are not enabled in this deployment.");
  });
  app.use(() => {
    throw missing("Endpoint");
  });
  app.use(errorHandler);
  return app;
}
