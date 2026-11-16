import { createHash } from "node:crypto";
import type { Request, RequestHandler, Response } from "express";
import type { RequestScope } from "../ports/service-ports.js";
import type { Services } from "../bootstrap/services.js";
import { assertContract, validateBody, validateQuery } from "./contracts.js";
import { checkScope, withinScope } from "./scope.js";

export type Query = Record<string, string | number | boolean>;
export type HandlerContext = {
  scope: RequestScope;
  query: Query;
  request: Request;
  services: Services;
};
function guarded(
  run: (request: Request, response: Response) => Promise<void>,
): RequestHandler {
  return (request, response, next) => {
    void run(request, response).catch((error) => {
      if (!response.headersSent && !response.destroyed) next(error);
    });
  };
}
export function id(request: Request, name: string): string {
  return validateBody<string>("Id", request.params[name]);
}
export function reply(response: Response, schema: string, value: unknown) {
  checkScope(response.locals.scope);
  assertContract(schema, value);
  if (response.headersSent || response.destroyed) return;
  if (response.req.method === "GET") {
    const { requestId: _requestId, ...stable } = value as Record<
      string,
      unknown
    >;
    const etag = `W/"${createHash("sha256").update(JSON.stringify(stable)).digest("base64url")}"`;
    response.setHeader("ETag", etag);
    response.setHeader("Cache-Control", "private, no-cache");
    if (
      response.req.headers["if-none-match"]
        ?.split(",")
        .some(
          (value) =>
            value.trim() === "*" ||
            value.trim().replace(/^W\//, "") === etag.replace(/^W\//, ""),
        )
    ) {
      response.status(304).end();
      return;
    }
  } else response.setHeader("Cache-Control", "no-store");
  response.json(value);
}
export function getEndpoint(
  services: Services,
  path: string,
  schema: string,
  run: (context: HandlerContext) => Promise<Record<string, unknown>>,
): RequestHandler {
  return guarded(async (request, response) => {
    const query = validateQuery(path, request.query);
    const scope: RequestScope = {
      ...response.locals.scope,
      dataVersion: (query.dataVersion as string) ?? services.currentVersion(),
    };
    response.locals.scope = scope;
    await withinScope(scope, services.datasets.assertSnapshot(scope));
    const result = await withinScope(
      scope,
      run({ scope, query, request, services }),
    );
    reply(response, schema, {
      requestId: scope.requestId,
      dataVersion: scope.dataVersion,
      ...result,
    });
  });
}
export function postEndpoint<T extends { dataVersion: string }>(
  services: Services,
  requestSchema: string,
  responseSchema: string,
  run: (scope: RequestScope, body: T) => Promise<unknown>,
): RequestHandler {
  return guarded(async (request, response) => {
    validateQuery("/__no_query__", request.query);
    const body = validateBody<T>(requestSchema, request.body);
    const scope: RequestScope = {
      ...response.locals.scope,
      dataVersion: body.dataVersion,
    };
    response.locals.scope = scope;
    await withinScope(scope, services.datasets.assertSnapshot(scope));
    const value = await withinScope(scope, run(scope, body));
    reply(response, responseSchema, value);
  });
}
export function searchInput(query: Query, buildingId?: string) {
  return {
    query: (query.q as string) ?? "",
    buildingId: buildingId ?? (query.buildingId as string | undefined),
    floorId: query.floorId as string | undefined,
    kind: query.kind as
      import("@trojan-compass/shared/api").PlaceKind | undefined,
    stepFree: query.stepFree as boolean | undefined,
    limit: (query.limit as number) ?? 20,
    cursor: query.cursor as string | undefined,
  };
}
