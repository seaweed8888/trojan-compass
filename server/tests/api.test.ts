import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createApp } from "../src/app.js";
import { validate } from "../src/infrastructure/contract.js";
import { SnapshotRepository } from "../src/infrastructure/datasets/published-repository.js";
import { publishedServices } from "./support/published-fixture.js";
import { intent } from "./support/fixture.js";
import { obstructed } from "../src/modules/routing/publication-geometry.js";
import { DisabledIntentAdapter } from "../src/integrations/ai/provider-adapter.js";
import { randomUUID } from "node:crypto";

// Deterministic intent fixtures exercise our real chat/search/routing composition;
// provider schema, timeout, and malformed-output checks live in chat.test.ts.
const services = await publishedServices({
  interpret: async (_scope, request) => {
    const message = request.message ?? "";
    const fixtures: Record<string, ReturnType<typeof intent>> = {
      "Show me LAW 101": intent({ kind: "find_place", query: "LAW 101" }),
      "Show floor 2 of LAW": intent({
        kind: "show_floor",
        query: "2",
        buildingHint: "LAW",
      }),
      "Route to LAW 107": intent({ kind: "route", query: "LAW 107" }),
      "LAW 101": intent({
        kind: "route",
        query: "LAW 107",
        originQuery: "LAW 101",
      }),
      "Route from LAW 101 to LAW 107": intent({
        kind: "route",
        query: "LAW 107",
        originQuery: "LAW 101",
      }),
      "Route from LAW 101 to THH 201": intent({
        kind: "route",
        query: "THH 201",
        originQuery: "LAW 101",
      }),
    };
    if (!fixtures[message]) throw new Error("Missing intent fixture");
    return fixtures[message]!;
  },
});
const server = createApp(services, {
  rateLimitPerMinute: 10000,
  chatRateLimitPerMinute: 1000,
}).listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
after(() => {
  server.closeAllConnections();
  return new Promise<void>((resolve) => server.close(() => resolve()));
});
async function get(path: string, status = 200) {
  const response = await fetch(base + path);
  const body: any = await response.json();
  assert.equal(response.status, status, JSON.stringify(body));
  return body;
}
async function post(path: string, body: unknown, status = 200) {
  const response = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result: any = await response.json();
  assert.equal(response.status, status, JSON.stringify(result));
  return result;
}
const version = (await get("/buildings")).dataVersion;
const location = (id: string) => ({
  kind: "place",
  buildingId: id.slice(0, 3),
  placeId: id,
});
const route = (overrides: object = {}) => ({
  clientRequestId: randomUUID(),
  dataVersion: version,
  origin: location("LAW-101"),
  destination: location("LAW-107"),
  mode: "fastest",
  stepFree: false,
  accessProfile: "public",
  ...overrides,
});
const chat = (message: string, overrides: object = {}) => ({
  clientRequestId: randomUUID(),
  dataVersion: version,
  message,
  history: [],
  context: {
    buildingId: "LAW",
    floorId: "1",
    origin: null,
    selectedPlace: null,
  },
  preferences: { mode: "fastest", stepFree: false, accessProfile: "public" },
  ...overrides,
});

test("all dataset reads and normalized searches conform to the unchanged contract", async () => {
  for (const [path, schema] of [
    ["/health", "Health"],
    ["/buildings", "BuildingListResponse"],
    ["/buildings/LAW", "BuildingResponse"],
    ["/buildings/LAW/scene", "SceneResponse"],
    ["/buildings/LAW/floors", "FloorListResponse"],
    ["/buildings/LAW/floors/1", "FloorResponse"],
    ["/buildings/LAW/places", "PlaceListResponse"],
    ["/buildings/LAW/places/LAW-101", "PlaceResponse"],
    ["/places?q=law%20101", "PlaceSearchResponse"],
  ])
    validate(schema!, await get(path!));
  for (const query of ["law101", "LAW-101", "Law 101"])
    assert.equal(
      (await get("/places?q=" + encodeURIComponent(query))).items[0].place.id,
      "LAW-101",
    );
  assert.equal((await get("/buildings?q=Medicine%20Crow")).items[0].id, "VKC");
  assert.equal((await get("/places?q=no-such-room")).items.length, 0);
});
test("every snapshot floor has coherent object mappings, places, and canonical elevations", async () => {
  const repo = new SnapshotRepository();
  const scope = { requestId: "test", dataVersion: version };
  for (const building of await repo.listBuildings(scope)) {
    const b = await repo.getBuilding(scope, building.id);
    const places = await repo.listPlaces(scope, b.id);
    const nav = await repo.getNavigationSource(scope, b.id);
    const nodes = new Set(nav.nodes.map((n) => n.id));
    for (const floor of b.floors) {
      const geometry = await repo.getFloorGeometry(scope, b.id, floor.id);
      const keys = new Set(geometry!.objects.map((o) => o.objectKey));
      for (const p of places.filter((p) => p.floorId === floor.id)) {
        assert.equal(p.position.y, floor.elevationMeters);
        if (p.sceneObjectKey) assert.ok(keys.has(p.sceneObjectKey));
        for (const a of p.accessPoints) assert.ok(nodes.has(a.nodeId));
      }
    }
  }
});
test("manual same-floor and cross-floor routes contain connected geometry and valid instruction anchors", async () => {
  for (const destination of ["LAW-107", "LAW-213"]) {
    const body = await post(
      "/routes",
      route({ destination: location(destination) }),
    );
    validate<any>("RouteResponse", body);
    assert.ok(body.route.distanceMeters > 0);
    for (const step of body.route.steps) {
      const leg = body.route.legs.find((l: any) => l.id === step.legId);
      assert.ok(leg?.points[step.pointIndex]);
    }
    for (let i = 1; i < body.route.legs.length; i++)
      assert.deepEqual(
        body.route.legs[i - 1].points.at(-1),
        body.route.legs[i].points[0],
      );
    if (destination === "LAW-213")
      assert.ok(body.route.legs.some((l: any) => l.kind === "vertical"));
  }
});
test("same-place route has zero metrics and an arrival instruction", async () => {
  const { route: r } = await post(
    "/routes",
    route({ destination: location("LAW-101") }),
  );
  assert.equal(r.distanceMeters, 0);
  assert.equal(r.durationSeconds, 0);
  assert.equal(r.steps[0].kind, "arrive");
});
test("invalid positions and unavailable networks never become fabricated routes", async () => {
  assert.equal(
    (
      await post(
        "/routes",
        route({
          origin: {
            kind: "position",
            buildingId: "LAW",
            floorId: "1",
            position: { x: 9999, y: 0, z: 9999 },
          },
        }),
        422,
      )
    ).error.code,
    "INVALID_POSITION",
  );
  assert.equal(
    (await post("/routes", route({ destination: location("THH-201") }), 422))
      .error.code,
    "OUTDOOR_NETWORK_UNAVAILABLE",
  );
  assert.equal(
    (await post("/routes", route({ stepFree: true, mode: "elevator" }), 422))
      .error.code,
    "UNVERIFIED_ACCESSIBILITY",
  );
  await post("/routes", route({ stepFree: true, mode: "stairs" }), 400);
});
test("room-picked positions use known arrivals and retain the requested origin", async () => {
  const { place } = await get("/buildings/LAW/places/LAW-101");
  const origin = {
    kind: "position",
    buildingId: "LAW",
    floorId: "1",
    position: place.position,
  };
  const { route: r } = await post("/routes", route({ origin }));
  assert.deepEqual(r.origin.requested, origin);
  assert.equal(r.origin.placeId, null);
  assert.deepEqual(
    r.origin.position,
    origin.position,
    "a room pick walks from the actual point to its door",
  );
});
test("LAW open-space origins outside corridor snap bands keep the selected position and draw the approach", async () => {
  for (const [x, z] of [
    [-30, 17],
    [-26, -13],
    [0, 0],
    [8, 18],
  ]) {
    const origin = {
      kind: "position",
      buildingId: "LAW",
      floorId: "1",
      position: { x, y: 0, z },
    };
    // Repeated requests must not leave derived approach nodes in the graph cache.
    for (let attempt = 0; attempt < 2; attempt++) {
      const { route: r } = await post("/routes", route({ origin }));
      assert.equal(r.origin.placeId, null);
      assert.deepEqual(r.origin.requested, origin);
      assert.deepEqual(r.origin.position, origin.position);
      assert.equal(r.origin.snapDistanceMeters, 0);
      assert.deepEqual(r.legs[0].points[0], origin.position);
      assert.ok(r.distanceMeters > 0);
      const source = await new SnapshotRepository().getNavigationSource(
        { requestId: "test", dataVersion: version },
        "LAW",
      );
      for (const leg of r.legs.filter((l: any) => l.kind === "indoor"))
        for (let i = 1; i < leg.points.length; i++)
          assert.equal(
            obstructed(
              leg.points[i - 1],
              leg.points[i],
              leg.floorId,
              source.barriers,
            ),
            false,
          );
    }
  }
});
test("two picked positions on one corridor segment route directly without mutating the graph cache", async () => {
  const repo = new SnapshotRepository();
  const scope = { requestId: "picked-fixture", dataVersion: version };
  const source = await repo.getNavigationSource(scope, "LAW");
  const places = await repo.listPlaces(scope, "LAW");
  const nodes = new Map(source.nodes.map((n) => [n.id, n]));
  const edge = source.edges.find((e) => {
    const a = nodes.get(e.fromNodeId)!,
      b = nodes.get(e.toNodeId)!;
    return (
      a.kind === "corridor" &&
      b.kind === "corridor" &&
      a.floorId === "1" &&
      b.floorId === "1" &&
      e.lengthMeters > 0.5 &&
      !obstructed(a.position, b.position, "1", source.barriers) &&
      !places.some(
        (p) =>
          p.floorId === "1" &&
          p.bounds &&
          [a.position, b.position].some(
            (v) =>
              v.x >= p.bounds!.min.x &&
              v.x <= p.bounds!.max.x &&
              v.z >= p.bounds!.min.z &&
              v.z <= p.bounds!.max.z,
          ),
      )
    );
  });
  assert.ok(edge, "snapshot contains a usable corridor segment");
  const a = nodes.get(edge.fromNodeId)!.position,
    b = nodes.get(edge.toNodeId)!.position;
  const position = (t: number) => ({
    kind: "position",
    buildingId: "LAW",
    floorId: "1",
    position: { x: a.x + (b.x - a.x) * t, y: a.y, z: a.z + (b.z - a.z) * t },
  });
  const request = route({ origin: position(0.2), destination: position(0.8) });
  for (let i = 0; i < 2; i++) {
    const response = await post("/routes", request);
    assert.ok(
      Math.abs(response.route.distanceMeters - edge.lengthMeters * 0.6) < 0.001,
    );
    assert.equal(response.route.origin.placeId, null);
  }
});
test("chat focuses records, clarifies missing origins, and reuses manual routing", async () => {
  const focus = await post("/chat", chat("Show me LAW 101"));
  assert.deepEqual(focus.actions, [
    {
      type: "focus_place",
      buildingId: "LAW",
      floorId: "1",
      placeId: "LAW-101",
    },
  ]);
  const floor = await post("/chat", chat("Show floor 2 of LAW"));
  assert.equal(floor.actions[0].type, "focus_floor");
  const clarify = await post("/chat", chat("Route to LAW 107"));
  assert.equal(clarify.status, "needs_clarification");
  assert.equal(clarify.clarification.reason, "missing_origin");
  assert.deepEqual(clarify.actions, []);
  const continuation = await post(
    "/chat",
    chat("LAW 101", {
      history: [
        { role: "user", content: "Route to LAW 107" },
        { role: "assistant", content: clarify.message },
      ],
    }),
  );
  assert.equal(continuation.status, "resolved");
  const manual = await post("/routes", route());
  const answer = await post("/chat", chat("Route from LAW 101 to LAW 107"));
  assert.equal(answer.status, "resolved");
  assert.deepEqual(answer.actions[0].route.legs, manual.route.legs);
  const noRoute = await post("/chat", chat("Route from LAW 101 to THH 201"));
  assert.equal(noRoute.status, "no_route");
  assert.deepEqual(noRoute.actions, []);
});
test("request validation rejects bad primitives, closed request fields, history roles and malformed JSON", async () => {
  for (const path of [
    "/places?stepFree=yes",
    "/places?limit=101",
    "/places?limit=0",
    "/places?floorId=1",
    "/buildings?limit=1&limit=2",
  ])
    validate("APIError", await get(path, 400));
  await post("/routes", { ...route(), surprise: true }, 400);
  await post(
    "/chat",
    chat("x", { history: [{ role: "system", content: "bad" }] }),
    400,
  );
  await post("/chat", chat("", {}), 400);
  const bad = await fetch(base + "/routes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  assert.equal(bad.status, 400);
  validate("APIError", await bad.json());
});
test("snapshots, representation negotiation, pagination and cache validation are explicit", async () => {
  assert.equal(
    (await get("/buildings/LAW?dataVersion=gone", 410)).error.code,
    "DATA_VERSION_UNAVAILABLE",
  );
  await get("/buildings/LAW/scene?representation=usdz", 406);
  await get("/buildings/UNKNOWN", 404);
  const first = await get("/buildings/LAW/places?limit=1");
  const second = await get(
    "/buildings/LAW/places?limit=1&cursor=" + first.nextCursor,
  );
  assert.notEqual(first.items[0].id, second.items[0].id);
  await get(
    "/buildings/LAW/places?limit=1&floorId=2&cursor=" + first.nextCursor,
    400,
  );
  const cached = await fetch(base + "/buildings/LAW");
  const etag = cached.headers.get("etag")!;
  const unchanged = await fetch(base + "/buildings/LAW", {
    headers: { "if-none-match": etag },
  });
  assert.equal(unchanged.status, 304);
  assert.equal(await unchanged.text(), "");
});
test("a disabled provider returns an explicit dependency error", async () => {
  await assert.rejects(new DisabledIntentAdapter().interpret(), {
    code: "FEATURE_DISABLED",
  });
});

test("the pinned LAW publication routes every supported destination/mode and rejects its documented gaps", async () => {
  const scope = { requestId: "coverage", dataVersion: version };
  const places = await services.datasets.listPlaces(scope, "LAW");
  const unsupported = new Set([
    "LAW-216:stairs",
    "LAW-216:elevator",
    "LAW-1-stairsNW:elevator",
    "LAW-4-stairsNW:elevator",
    "LAW-4-stairsNE:elevator",
  ]);
  let successful = 0;
  for (const place of places.filter(
    (p) => p.access.level === "public" && p.access.entryAllowed,
  )) {
    for (const mode of ["stairs", "elevator"] as const) {
      const request = route({
        mode,
        destination: location(place.id),
      }) as import("@trojan-compass/shared/api").RouteRequest;
      const key = `${place.id}:${mode}`;
      if (unsupported.has(key)) {
        await assert.rejects(
          services.routing.calculateRoute(scope, request),
          { code: "NO_ROUTE" },
          key,
        );
        unsupported.delete(key);
      } else {
        const result = await services.routing.calculateRoute(scope, request);
        assert.equal(result.destination.placeId, place.id);
        if (mode === "elevator") assert.equal(result.usesStairs, false);
        successful++;
      }
    }
  }
  assert.equal(successful, 213);
  assert.equal(unsupported.size, 0);
});
