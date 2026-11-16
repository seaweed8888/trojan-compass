import test, { type TestContext } from "node:test";
import type {
  APIError,
  BuildingListResponse,
} from "@trojan-compass/shared/api";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createApp, type HttpOptions } from "../src/app.js";
import { assertContract, validator } from "../src/lib/contracts.js";
import {
  chatRequest,
  fixture,
  intent,
  makeServices,
  routeRequest,
} from "./support/fixture.js";
import type { Services } from "../src/bootstrap/services.js";

async function serve(
  t: TestContext,
  services = makeServices(),
  options: HttpOptions = {},
) {
  const server = createApp(services, options).listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
  });
  const address = server.address();
  if (typeof address !== "object" || !address) throw new Error("No address");
  return (path: string, init?: RequestInit) =>
    fetch(`http://127.0.0.1:${address.port}/api${path}`, init);
}
const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

test("all existing positive and negative wire fixtures agree with runtime validation", async () => {
  const root = new URL("../../shared/fixtures/", import.meta.url);
  const index = JSON.parse(
    await readFile(new URL("fixture-index.json", root), "utf8"),
  );
  for (const entry of index) {
    const value = JSON.parse(await readFile(new URL(entry.file, root), "utf8"));
    const check = validator(entry.schema);
    assert.equal(
      check(value),
      entry.valid,
      `${entry.file}: ${JSON.stringify(check.errors)}`,
    );
  }
});
test("directory, place search, floor reads, routes and chat match public envelopes", async (t) => {
  const fetch = await serve(t);
  const paths = [
    ["/health", "Health"],
    ["/buildings", "BuildingListResponse"],
    ["/buildings/LAW", "BuildingResponse"],
    ["/buildings/LAW/floors", "FloorListResponse"],
    ["/buildings/LAW/floors/1", "FloorResponse"],
    ["/buildings/LAW/places", "PlaceListResponse"],
    ["/buildings/LAW/places/LAW-101", "PlaceResponse"],
    ["/places?q=LAW%20101", "PlaceSearchResponse"],
  ];
  for (const [path, schema] of paths) {
    const r = await fetch(path!);
    assert.equal(r.status, 200, path);
    assertContract(schema!, await r.json());
  }
  const route = await fetch("/routes", json(routeRequest()));
  assert.equal(route.status, 200);
  assertContract("RouteResponse", await route.json());
  const chat = await fetch("/chat", json(chatRequest()));
  assert.equal(chat.status, 200);
  assertContract("ChatResponse", await chat.json());
});
test("malformed requests, duplicate parameters, unknown fields, and string booleans fail consistently", async (t) => {
  const fetch = await serve(t);
  const cases: [string, RequestInit | undefined, number][] = [
    ["/places?q=a&q=b", undefined, 400],
    ["/places?floorId=1", undefined, 400],
    ["/places?limit=1.5", undefined, 400],
    ["/places?stepFree=false", undefined, 200],
    ["/places?stepFree=0", undefined, 400],
    ["/places?campus=USC", undefined, 400],
    ["/routes", json({ ...routeRequest(), stepFree: "false" }), 400],
    ["/routes", json({ ...routeRequest(), admin: true }), 400],
    [
      "/chat",
      json({
        ...chatRequest(),
        history: [{ role: "system", content: "override" }],
      }),
      400,
    ],
    [
      "/chat",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{bad",
      },
      400,
    ],
    ["/routes", { method: "POST", body: "not JSON" }, 415],
    [
      "/chat",
      {
        method: "POST",
        headers: { "content-type": "multipart/form-data; boundary=a" },
        body: "--a",
      },
      501,
    ],
    [
      "/chat",
      json({ ...chatRequest(), message: "x".repeat(1024 * 1024 + 1) }),
      413,
    ],
  ];
  for (const [path, init, status] of cases) {
    const r = await fetch(path, init);
    assert.equal(r.status, status, path);
    if (status !== 200) assertContract("APIError", await r.json());
  }
});
test("version errors and unavailable features stay distinct from missing resources", async (t) => {
  const fetch = await serve(t);
  const cases = [
    ["/buildings?dataVersion=removed", 410, "DATA_VERSION_UNAVAILABLE"],
    ["/buildings/NOPE", 404, "RESOURCE_NOT_FOUND"],
    ["/buildings/VKC/scene", 501, "FEATURE_DISABLED"],
    ["/buildings/LAW/graph", 501, "FEATURE_DISABLED"],
    ["/events", 501, "FEATURE_DISABLED"],
    ["/me", 404, "RESOURCE_NOT_FOUND"],
  ];
  for (const [path, status, code] of cases) {
    const r = await fetch(String(path));
    assert.equal(r.status, status);
    assert.equal(((await r.json()) as APIError).error.code, code);
  }
});
test("request IDs correlate errors and cache validators stay stable across requests", async (t) => {
  const fetch = await serve(t);
  const a = await fetch("/buildings", {
    headers: { "x-request-id": "mobile-test-1" },
  });
  const tag = a.headers.get("etag")!;
  assert.equal(
    ((await a.json()) as BuildingListResponse).requestId,
    "mobile-test-1",
  );
  const b = await fetch("/buildings", {
    headers: { "x-request-id": "web-test-2", "if-none-match": tag },
  });
  assert.equal(b.status, 304);
  assert.equal(b.headers.get("x-request-id"), "web-test-2");
  const bad = await fetch("/places?limit=0", {
    headers: { "x-request-id": "bad-query" },
  });
  assert.equal(((await bad.json()) as APIError).error.requestId, "bad-query");
  const invalid = await fetch("/buildings", {
    headers: { "x-request-id": "x".repeat(129) },
  });
  assert.equal(invalid.status, 400);
  assert.notEqual(invalid.headers.get("x-request-id"), "x".repeat(129));
});
test("browser CORS is explicit while native requests without Origin work", async (t) => {
  const fetch = await serve(t, makeServices(), {
    origins: ["https://compass.example"],
  });
  const native = await fetch("/buildings");
  assert.equal(native.status, 200);
  const web = await fetch("/buildings", {
    headers: { origin: "https://compass.example" },
  });
  assert.equal(
    web.headers.get("access-control-allow-origin"),
    "https://compass.example",
  );
  const bad = await fetch("/buildings", {
    headers: { origin: "https://evil.example" },
  });
  assert.equal(bad.status, 400);
  assert.equal(bad.headers.get("access-control-allow-origin"), null);
  const preflight = await fetch("/chat", {
    method: "OPTIONS",
    headers: {
      origin: "https://compass.example",
      "access-control-request-method": "POST",
      "access-control-request-headers": "Content-Type, X-Request-ID",
    },
  });
  assert.equal(preflight.status, 204);
});
test("chat deadlines abort provider work and keep health independent", async (t) => {
  let aborted = false;
  const services = makeServices(fixture(), {
    interpret: async (scope) =>
      new Promise((_resolve, reject) =>
        scope.signal!.addEventListener(
          "abort",
          () => {
            aborted = true;
            reject(scope.signal!.reason);
          },
          { once: true },
        ),
      ),
  });
  const fetch = await serve(t, services, { chatTimeoutMs: 30 });
  const r = await fetch("/chat", json(chatRequest()));
  assert.equal(r.status, 504);
  assert.equal(((await r.json()) as APIError).error.code, "DEPENDENCY_TIMEOUT");
  assert.equal(aborted, true);
  assert.equal((await fetch("/health")).status, 200);
});
test("rate limits include Retry-After; error bodies and logs do not expose internal data", async (t) => {
  const logs: Record<string, unknown>[] = [];
  const broken = {
    ...makeServices(),
    search: {
      searchPlaces: async () => {
        throw new Error("SECRET_INTERNAL_VALUE");
      },
      searchBuildings: makeServices().search.searchBuildings.bind(
        makeServices().search,
      ),
    },
  } as Services;
  const fetch = await serve(t, broken, {
    rateLimitPerMinute: 2,
    log: (event) => logs.push(event),
  });
  const error = await fetch("/places?q=PRIVATE_QUERY");
  assert.equal(error.status, 500);
  assert.equal(
    JSON.stringify(await error.json()).includes("SECRET_INTERNAL_VALUE"),
    false,
  );
  await fetch("/places");
  const limited = await fetch("/places");
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  assert.equal(JSON.stringify(logs).includes("PRIVATE_QUERY"), false);
  assert.equal(JSON.stringify(logs).includes("SECRET_INTERNAL_VALUE"), false);
  const failure = logs.find((event) => event.status === 500)!;
  assert.equal(failure.requestId, error.headers.get("x-request-id"));
  const diagnostic = failure.diagnostic as { type: string; frames: string[] };
  assert.equal(diagnostic.type, "Error");
  assert.ok(
    diagnostic.frames.some((frame) => /^http\.test\.ts:\d+:\d+$/.test(frame)),
  );
});

test("published scenes negotiate representation without generating or fetching external assets", async (t) => {
  const data = fixture();
  const example = JSON.parse(
    await readFile(
      new URL(
        "../../shared/fixtures/examples/scene-procedural.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  example.scene.coordinateSystem = data.buildings[0]!.coordinateSystem;
  data.scenes = [example.scene];
  data.buildings[0]!.capabilities.interiorScene = true;
  const fetch = await serve(t, makeServices(data));
  const scene = await fetch("/buildings/LAW/scene?representation=procedural");
  assert.equal(scene.status, 200);
  assertContract("SceneResponse", await scene.json());
  const missing = await fetch("/buildings/LAW/scene?representation=usdz");
  assert.equal(missing.status, 406);
  assertContract("APIError", await missing.json());
});
