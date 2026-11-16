import test from "node:test";
import assert from "node:assert/strict";
import {
  fixture,
  makeServices,
  routeRequest,
  scope,
} from "./support/fixture.js";
import { prepareServices } from "../src/bootstrap/services.js";
import { assertContract } from "../src/lib/contracts.js";
import {
  segmentWalkable,
  validatePolygon,
} from "../src/modules/routing/geometry.js";
const place = (placeId: string) => ({
  kind: "place" as const,
  buildingId: "LAW",
  placeId,
});
const position = (x: number, z = 0, floorId = "1", y = 0) => ({
  kind: "position" as const,
  buildingId: "LAW",
  floorId,
  position: { x, y, z },
});

test("routing selects stairs for speed, elevators for step-free, and charges boarding once", async () => {
  const services = makeServices();
  await prepareServices(services, ["test-v1"]);
  const fast = await services.routing.calculateRoute(scope(), routeRequest());
  const accessible = await services.routing.calculateRoute(
    scope(),
    routeRequest({ stepFree: true }),
  );
  assert.equal(fast.usesStairs, true);
  assert.equal(accessible.usesStairs, false);
  assert.equal(accessible.verifiedStepFree, true);
  assert.equal(accessible.usesElevator, true);
  assert.ok(
    Math.abs(accessible.durationSeconds - (40 / 1.3 + 6.8 / 1.5 + 25)) < 1e-8,
  );
  assert.equal(accessible.legs.filter((l) => l.kind === "vertical").length, 1);
  assert.equal(
    accessible.distanceMeters,
    accessible.legs.reduce((s, l) => s + l.distanceMeters, 0),
  );
  for (const step of accessible.steps)
    assert.ok(
      step.pointIndex <
        accessible.legs.find((l) => l.id === step.legId)!.points.length,
    );
  assertContract("Route", accessible);
});
test("multiple doors are chosen by complete route cost, and a same-place request has valid arrival anchors", async () => {
  const { routing } = makeServices();
  const route = await routing.calculateRoute(
    scope(),
    routeRequest({ origin: place("LAW-MULTI"), destination: place("LAW-101") }),
  );
  assert.equal(route.origin.nodeId, "A1");
  assert.equal(route.distanceMeters, 0);
  const same = await routing.calculateRoute(
    scope(),
    routeRequest({ destination: place("LAW-101") }),
  );
  assert.equal(same.distanceMeters, 0);
  assert.equal(same.steps.at(-1)?.kind, "arrive");
});

test("saved stopovers retain both legs and enforce access preferences on each", async () => {
  const { routing } = makeServices();
  const request = routeRequest({
    destination: place("LAW-101"),
    via: place("LAW-301"),
    mode: "elevator",
    stepFree: true,
  });
  const route = await routing.calculateRoute(scope(), request);
  assertContract("Route", route);
  assert.equal(route.via?.placeId, "LAW-301");
  assert.equal(route.origin.placeId, "LAW-101");
  assert.equal(route.destination.placeId, "LAW-101");
  assert.ok(route.distanceMeters > 0);
  assert.equal(route.stepFreeRequested, true);
  assert.equal(route.verifiedStepFree, true);
  assert.equal(route.usesStairs, false);
  assert.ok(
    route.steps.some((step) => step.text.startsWith("Stop at LAW-301")),
  );
  assert.equal(
    new Set(route.legs.map((leg) => leg.id)).size,
    route.legs.length,
  );
  await assert.rejects(
    routing.calculateRoute(scope(), { ...request, via: place("missing") }),
    { code: "RESOURCE_NOT_FOUND" },
  );
  await assert.rejects(
    routing.calculateRoute(scope(), { ...request, mode: "stairs" }),
    { code: "INVALID_REQUEST" },
  );
  const unverified = fixture();
  unverified.navigation[0]!.connectors.find(
    (c) => c.id === "lift",
  )!.access.stepFree = "unknown";
  await assert.rejects(
    makeServices(unverified).routing.calculateRoute(scope(), request),
    { code: "UNVERIFIED_ACCESSIBILITY" },
  );
  const restricted = fixture();
  restricted.places.find((p) => p.id === "LAW-301")!.access.level =
    "restricted";
  await assert.rejects(
    makeServices(restricted).routing.calculateRoute(scope(), request),
    { code: "NO_ROUTE" },
  );
});
test("request-local edge splitting handles both picks on one edge without mutating shared graphs", async () => {
  const services = makeServices();
  const graph = await services.graphs.get(scope(), "LAW");
  const original = JSON.stringify([...graph.adjacency]);
  const routes = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      services.routing.calculateRoute(
        scope(),
        routeRequest({
          origin: position(1 + i / 100, 0.2),
          destination: position(4, -0.1),
        }),
      ),
    ),
  );
  assert.ok(Math.abs(routes[0]!.distanceMeters - 3) < 1e-8);
  assert.ok(Math.abs(routes[0]!.origin.snapDistanceMeters - 0.2) < 1e-8);
  assert.equal(JSON.stringify([...graph.adjacency]), original);
  const same = await services.routing.calculateRoute(
    scope(),
    routeRequest({ origin: position(3), destination: position(3) }),
  );
  assert.equal(same.distanceMeters, 0);
});
test("directed edges stay directed when picks split them", async () => {
  const data = fixture();
  data.navigation[0]!.edges.find((e) => e.id === "AB1")!.bidirectional = false;
  const { routing } = makeServices(data);
  assert.equal(
    (
      await routing.calculateRoute(
        scope(),
        routeRequest({ origin: position(1), destination: position(4) }),
      )
    ).distanceMeters,
    3,
  );
  await assert.rejects(
    routing.calculateRoute(
      scope(),
      routeRequest({ origin: position(4), destination: position(1) }),
    ),
    { code: "NO_ROUTE" },
  );
});
test("room picks walk through documented door connections and reject out-of-bounds/elevation mistakes", async () => {
  const { routing } = makeServices();
  const route = await routing.calculateRoute(
    scope(),
    routeRequest({ origin: position(5, 4), destination: place("LAW-101") }),
  );
  assert.equal(route.origin.snapDistanceMeters, 0);
  assert.equal(route.distanceMeters, 9);
  for (const origin of [position(50), position(5, 6), position(5, 0, "1", 3)])
    await assert.rejects(
      routing.calculateRoute(scope(), routeRequest({ origin })),
      { code: "INVALID_POSITION" },
    );
});
test("unknown evidence cannot become verified accessibility; false evidence is a definite no-route", async () => {
  const data = fixture();
  data.navigation[0]!.connectors.find((c) => c.id === "lift")!.access.stepFree =
    "unknown";
  await assert.rejects(
    makeServices(data).routing.calculateRoute(
      scope(),
      routeRequest({ stepFree: true }),
    ),
    { code: "UNVERIFIED_ACCESSIBILITY" },
  );
  data.navigation[0]!.connectors.find((c) => c.id === "lift")!.access.stepFree =
    "verified_no";
  await assert.rejects(
    makeServices(data).routing.calculateRoute(
      scope(),
      routeRequest({ stepFree: true }),
    ),
    { code: "NO_ROUTE" },
  );
  await assert.rejects(
    makeServices().routing.calculateRoute(
      scope(),
      routeRequest({ stepFree: true, mode: "stairs" }),
    ),
    { code: "INVALID_REQUEST" },
  );
});
test("restricted access is excluded, missing outdoor networks fail explicitly, and aborts are observed", async () => {
  const data = fixture();
  data.places.find((p) => p.id === "LAW-301")!.access.level = "restricted";
  await assert.rejects(
    makeServices(data).routing.calculateRoute(scope(), routeRequest()),
    { code: "NO_ROUTE" },
  );
  await assert.rejects(
    makeServices().routing.calculateRoute(
      scope(),
      routeRequest({
        destination: {
          kind: "position",
          buildingId: "VKC",
          floorId: "1",
          position: { x: 0, y: 0, z: 0 },
        },
      }),
    ),
    { code: "RESOURCE_NOT_FOUND" },
  );
  const controller = new AbortController();
  controller.abort(new Error("cancelled"));
  await assert.rejects(
    makeServices().routing.calculateRoute(
      { ...scope(), signal: controller.signal },
      routeRequest(),
    ),
    /cancelled/,
  );
});
test("invalid graph publications fail before serving routes", async () => {
  for (const change of [
    (d: ReturnType<typeof fixture>) => {
      d.navigation[0]!.edges[0]!.lengthMeters = -1;
    },
    (d: ReturnType<typeof fixture>) => {
      d.navigation[0]!.nodes.push(d.navigation[0]!.nodes[0]!);
    },
    (d: ReturnType<typeof fixture>) => {
      d.navigation[0]!.edgeDetails[0]!.points[0] = { x: 99, y: 0, z: 0 };
    },
    (d: ReturnType<typeof fixture>) => {
      d.navigation[0]!.edgeDetails.find(
        (e) => e.connectorId === "lift",
      )!.connectorId = null;
    },
  ]) {
    const data = fixture();
    change(data);
    await assert.rejects(
      prepareServices(makeServices(data), ["test-v1"]),
      /Invalid dataset/,
    );
  }
});
test("geometry checks thin walls and polygon holes instead of sampling endpoints", () => {
  const rect = (x0: number, z0: number, x1: number, z1: number) => ({
    outer: [
      { x: x0, z: z0 },
      { x: x1, z: z0 },
      { x: x1, z: z1 },
      { x: x0, z: z1 },
      { x: x0, z: z0 },
    ],
    holes: [],
  });
  assert.equal(
    segmentWalkable(
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 0 },
      [rect(-1, -1, 11, 1)],
      [rect(3.001, -1, 3.002, 1)],
    ),
    false,
  );
  const p = rect(-1, -1, 11, 1);
  const hole = rect(4, -0.5, 6, 0.5).outer;
  assert.equal(
    segmentWalkable(
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 0 },
      [{ ...p, holes: [hole] }],
      [],
    ),
    false,
  );
  assert.throws(
    () =>
      validatePolygon({
        outer: [
          { x: 0, z: 0 },
          { x: 2, z: 2 },
          { x: 0, z: 2 },
          { x: 2, z: 0 },
          { x: 0, z: 0 },
        ],
        holes: [],
      }),
    /self-intersecting/,
  );
});

test("valid endpoints in different buildings report the missing outdoor network explicitly", async () => {
  const data = fixture();
  data.buildings[1]!.floors = [
    { ...structuredClone(data.buildings[0]!.floors[0]!), buildingId: "VKC" },
  ];
  data.places.push({
    ...structuredClone(data.places[0]!),
    id: "VKC-101",
    buildingId: "VKC",
    accessPoints: [],
  });
  await assert.rejects(
    makeServices(data).routing.calculateRoute(
      scope(),
      routeRequest({
        destination: { kind: "place", buildingId: "VKC", placeId: "VKC-101" },
      }),
    ),
    { code: "OUTDOOR_NETWORK_UNAVAILABLE" },
  );
});

test("published floor elevations and connector IDs are validated before routes can be served", async () => {
  const data = fixture();
  data.buildings[0]!.floors[0]!.elevationMeters = 100;
  await assert.rejects(
    prepareServices(makeServices(data), ["test-v1"]),
    /published metadata/,
  );
  const invalidId = fixture();
  invalidId.navigation[0]!.connectors[0]!.id = "invalid id";
  await assert.rejects(
    prepareServices(makeServices(invalidId), ["test-v1"]),
    /navigation schema/,
  );
});
