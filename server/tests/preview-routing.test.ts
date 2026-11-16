import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import type { RouteRequest } from "@trojan-compass/shared/api";
import { PreviewRoutingService } from "../src/modules/routing/preview/preview-routing.service.js";
import {
  cellRect,
  corridorClear,
  doorApproach,
  inside,
} from "../src/modules/routing/preview/geometry.js";
import {
  getLayout,
  floorY,
  metersPerUnit,
} from "../src/infrastructure/datasets/prototype/floorplan.js";
import { assertContract } from "../src/lib/contracts.js";
import { createApp } from "../src/app.js";
import { createServices } from "../src/bootstrap/services.js";
import { prototypeStore } from "../src/infrastructure/datasets/prototype-adapter.js";
import { DisabledIntentAdapter } from "../src/integrations/ai/provider-adapter.js";

const service = new PreviewRoutingService();
const scope = () => ({
  requestId: randomUUID(),
  dataVersion: "prototype-v1",
  deadline: performance.now() + 10000,
});
const request = (changes: Partial<RouteRequest> = {}): RouteRequest => ({
  clientRequestId: randomUUID(),
  dataVersion: "prototype-v1",
  origin: { kind: "place", buildingId: "LAW", placeId: "LAW-101" },
  destination: {
    kind: "place",
    buildingId: "LAW",
    placeId: "LAW-4-restroom-2",
  },
  mode: "stairs",
  stepFree: false,
  accessProfile: "public",
  ...changes,
});
const pos = (x: number, z: number, floor = 1) => ({
  kind: "position" as const,
  buildingId: "LAW",
  floorId: String(floor),
  position: { x: x * 2.4, y: floorY(floor), z: z * 2.4 },
});

test("the pictured restroom is reachable with stairs and elevators, without asserting verified accessibility", async () => {
  const stairs = await service.calculateRoute(scope(), request());
  const elevator = await service.calculateRoute(
    scope(),
    request({ mode: "elevator", stepFree: true }),
  );
  for (const route of [stairs, elevator]) {
    assertContract("Route", route);
    assert.equal(route.destination.placeId, "LAW-4-restroom-2");
    assert.equal(route.destination.floorId, "4");
    assert.equal(route.verifiedStepFree, false);
    assert.equal(route.provenance.verificationStatus, "unverified");
    assert.ok(route.warnings.some((w) => w.code === "ILLUSTRATIVE_ROUTE"));
    assert.ok(route.steps.some((s) => s.text.includes("floor 4")));
  }
  assert.equal(stairs.usesStairs, true);
  assert.equal(stairs.usesElevator, false);
  assert.equal(elevator.usesElevator, true);
  assert.equal(elevator.usesStairs, false);
  assert.ok(
    elevator.warnings.some((w) => w.code === "UNVERIFIED_ACCESSIBILITY"),
  );
});
test("returned walking segments stay in model corridors or pass through their own door", async () => {
  const route = await service.calculateRoute(scope(), request());
  for (const leg of route.legs) {
    if (leg.kind !== "indoor") continue;
    const layout = getLayout("LAW", Number(leg.floorId)),
      scale = metersPerUnit("LAW");
    for (let i = 1; i < leg.points.length; i++) {
      const a = {
          x: leg.points[i - 1]!.x / scale,
          z: leg.points[i - 1]!.z / scale,
        },
        b = { x: leg.points[i]!.x / scale, z: leg.points[i]!.z / scale };
      if (corridorClear(layout, a, b)) continue;
      const cell = layout.cells.find(
        (c) =>
          c.kind !== "block" &&
          (inside(a, cellRect(c)) || inside(b, cellRect(c))) &&
          corridorClear(layout, a, b, c.id),
      );
      assert.ok(
        cell,
        `segment ${i} on floor ${leg.floorId} must not cross another room or wall`,
      );
      const onDoor = (p: typeof a) =>
        Math.hypot(p.x - cell!.door[0], p.z - cell!.door[1]) < 1e-6;
      assert.ok(
        onDoor(a) || onDoor(b),
        "room transition must include the explicit door point",
      );
    }
  }
});
test("picked open positions retain their coordinates and concurrent requests do not change a cached graph", async () => {
  const point = getLayout("LAW", 1).walkNodes.find((p) =>
    corridorClear(getLayout("LAW", 1), p, p),
  )!;
  const origin = pos(point.x, point.z);
  const before = await service.calculateRoute(scope(), request());
  const routes = await Promise.all(
    Array.from({ length: 8 }, () =>
      service.calculateRoute(scope(), request({ origin })),
    ),
  );
  for (const r of routes) {
    assert.deepEqual(r.origin.position, origin.position);
    assert.equal(r.origin.snapDistanceMeters, 0);
    assertContract("Route", r);
  }
  const expectedOrigin = structuredClone(before.origin.position);
  before.origin.position.x = 999999;
  assert.equal(before.legs[0]!.kind, "indoor");
  if (before.legs[0]!.kind === "indoor") before.legs[0]!.points[0]!.x = -999999;
  const after = await service.calculateRoute(scope(), request());
  assert.equal(before.distanceMeters, after.distanceMeters);
  assert.deepEqual(after.origin.position, expectedOrigin);
});
test("invalid positions, blocked rooms, outside networks and inaccessible starting entrances are rejected", async () => {
  const blocked = getLayout("LAW", 4).cells.find((c) => c.kind === "block")!;
  for (const origin of [
    pos(100, 100),
    pos((blocked.x0 + blocked.x1) / 2, (blocked.z0 + blocked.z1) / 2, 4),
  ])
    await assert.rejects(service.calculateRoute(scope(), request({ origin })), {
      code: "INVALID_POSITION",
    });
  await assert.rejects(
    service.calculateRoute(scope(), request({ stepFree: true })),
    { code: "INVALID_REQUEST" },
  );
  await assert.rejects(
    service.calculateRoute(
      scope(),
      request({
        origin: { kind: "place", buildingId: "LAW", placeId: "LAW-ENT" },
        mode: "elevator",
        stepFree: true,
      }),
    ),
    { code: "NO_ROUTE" },
  );
  await assert.rejects(
    service.calculateRoute(
      scope(),
      request({
        destination: { kind: "place", buildingId: "THH", placeId: "THH-201" },
      }),
    ),
    { code: "OUTDOOR_NETWORK_UNAVAILABLE" },
  );
  const aborted = new AbortController();
  aborted.abort(new Error("cancelled"));
  await assert.rejects(
    service.calculateRoute({ ...scope(), signal: aborted.signal }, request()),
    /cancelled/,
  );
});
test("door approaches are outside rendered walls and same-place routes have arrival anchors", async () => {
  const c = getLayout("LAW", 1).cells.find((c) => c.id === "LAW-101")!;
  assert.ok(
    corridorClear(getLayout("LAW", 1), doorApproach(c), doorApproach(c)),
  );
  const r = await service.calculateRoute(
    scope(),
    request({
      destination: { kind: "place", buildingId: "LAW", placeId: "LAW-101" },
    }),
  );
  assert.equal(r.distanceMeters, 0);
  assert.equal(r.steps.at(-1)?.kind, "arrive");
  assertContract("Route", r);
});
test("HTTP preview is an explicit opt-in and cannot silently replace canonical routing", async (t) => {
  const data = prototypeStore();
  const services = createServices(
    data,
    () => data.currentVersion,
    "preview-test-secret-at-least-32-bytes",
    new DisabledIntentAdapter(),
  );
  for (const enabled of [false, true]) {
    const server = createApp(
      services,
      enabled ? { previewRouting: service } : {},
    ).listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => {
      server.closeAllConnections();
      server.close();
    });
    const a = server.address();
    assert.ok(a && typeof a === "object");
    const call = (path: string) =>
      fetch(`http://127.0.0.1:${a.port}/api${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request()),
      });
    const r = await call("/preview/routes");
    assert.equal(r.status, enabled ? 200 : 404);
    if (enabled) assertContract("RouteResponse", await r.json());
    assert.equal((await call("/routes")).status, 501);
  }
});
