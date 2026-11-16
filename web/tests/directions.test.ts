import test from "node:test";
import assert from "node:assert/strict";
import type { VerticalLeg } from "@trojan-compass/shared/api";
import "./viewer-fixtures";
import { mapLocationAt } from "../src/features/map/map-location";
import { getLayout, cellCenter } from "../src/features/map/data/viewer-data";
import {
  routeChevrons,
  stairFlight,
  scenePosition,
  sceneRoute,
  routeUsesStair,
  type ScenePoint,
} from "../src/features/routing/route-scene";
import { createApiClient } from "../src/lib/api-client";
import { stairGeometry } from "../src/features/map/renderer/stair-geometry";

test("published coordinates stay in meters without a second horizontal conversion", () => {
  assert.deepEqual(
    scenePosition("LAW", { x: 12, y: 10.2, z: -4.8 }, 0),
    [12, 10.2, -4.8],
  );
});

test("stairs span floor elevations and the descending route retraces the same treads", () => {
  const leg: VerticalLeg = {
    kind: "vertical",
    id: "stairs",
    buildingId: "LAW",
    fromFloorId: "1",
    toFloorId: "3",
    connectorKind: "stairs",
    connectorId: "core",
    distanceMeters: 8,
    durationSeconds: 20,
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 3.4, z: 1 },
      { x: 4, y: 6.8, z: 2 },
    ],
  };
  const up = sceneRoute({ legs: [leg] }, "LAW")[0]!;
  const down = sceneRoute(
    {
      legs: [
        {
          ...leg,
          fromFloorId: "3",
          toFloorId: "1",
          points: [...leg.points].reverse(),
        },
      ],
    },
    "LAW",
  )[0]!;
  if (up.kind !== "vertical" || down.kind !== "vertical")
    assert.fail("Missing stairs");
  assert.equal(stairFlight(up, 4), null);
  const model = stairFlight(up, 2)!;
  assert.ok(routeUsesStair({ legs: [leg] }, "LAW", "2", leg.points[1]!));
  assert.equal(routeUsesStair(null, "LAW", "2", leg.points[1]!), false);
  assert.equal(
    routeUsesStair({ legs: [leg] }, "LAW", "2", { x: 10, y: 3.4, z: 10 }),
    false,
  );
  assert.equal(
    routeUsesStair({ legs: [leg] }, "KAP", "2", leg.points[1]!),
    false,
  );
  assert.equal(
    routeUsesStair({ legs: [leg] }, "LAW", "4", leg.points[1]!),
    false,
  );
  assert.equal(
    routeUsesStair(
      { legs: [{ ...leg, connectorKind: "elevator" }] },
      "LAW",
      "2",
      leg.points[1]!,
    ),
    false,
  );
  const reverse = stairFlight(down, 2)!;
  assert.deepEqual(model.points[0], up.entry);
  assert.deepEqual(model.points.at(-1), up.exit);
  assert.ok(
    model.points.some(
      (p) => p[0] === 2 && Math.abs(p[1] - 3.76) < 1e-9 && p[2] === 1,
    ),
  );
  assert.deepEqual(reverse.points, [...model.points].reverse());
  assert.deepEqual(
    reverse.parts.map((p) => JSON.stringify(p)).sort(),
    model.parts.map((p) => JSON.stringify(p)).sort(),
  );
  assert.ok(model.parts.length > 30);
  for (const part of model.parts) {
    assert.ok(part.size.every((n) => Number.isFinite(n) && n > 0));
    assert.ok(part.position[1] + part.size[1] / 2 <= 6.8 + 1e-9);
  }
  for (let i = 1; i < model.points.length; i++) {
    const a = model.points[i - 1]!,
      b = model.points[i]!;
    assert.ok(b[1] >= a[1] - 1e-9);
    if (b[1] - a[1] > 1e-9) {
      assert.ok(b[1] - a[1] <= 0.18 + 1e-9);
      assert.ok(Math.abs(a[0] - b[0]) < 1e-9);
      assert.ok(Math.abs(a[2] - b[2]) < 1e-9);
    }
  }
});

test("aligned stairs fit the stairwell on either axis and meet both floor surfaces", () => {
  for (const [width, depth] of [
    [3, 5],
    [5, 3],
  ]) {
    const model = stairGeometry([0, -3.4, 0], [0, 0, 0], width, depth);
    for (const [x, y, z] of model.points) {
      assert.ok(Math.abs(x) <= width! / 2 && Math.abs(z) <= depth! / 2);
      assert.ok(y >= -3.4 - 1e-9 && y <= 1e-9);
    }
    assert.ok(
      model.parts.every((part) =>
        part.size.every((n) => Number.isFinite(n) && n > 0),
      ),
    );
    assert.ok(
      model.parts.some(
        (part) => Math.abs(part.position[1] + part.size[1] / 2) < 1e-9,
      ),
    );
  }
  assert.deepEqual(stairGeometry([0, 0, 0], [0, 0, 0]).parts, []);
});

test("route chevrons have an open shape pointing forward", () => {
  const points: ScenePoint[] = [
    [0, 0, 0],
    [4, 0, 0],
  ];
  const chevron = routeChevrons(points)[0]!;
  assert.equal(chevron.length, 3);
  assert.ok(chevron[1]![0] > chevron[0]![0]);
  assert.ok(chevron[1]![0] > chevron[2]![0]);
  assert.notDeepEqual(chevron[0], chevron[2]);
});
test("selecting identically labeled restrooms preserves each unique ID", () => {
  const layout = getLayout("LAW", 4);
  const restrooms = layout.cells.filter((c) => c.kind === "restroom");
  assert.ok(restrooms.length >= 2);
  for (const c of restrooms)
    assert.equal(mapLocationAt(layout, ...cellCenter(c))?.placeId, c.id);
});
test("preview requests explicitly use their own endpoint and do not retry failed published routes", async () => {
  const calls: string[] = [];
  const api = createApiClient("/api", (async (input) => {
    calls.push(String(input));
    return Response.json(
      { error: { code: "FEATURE_DISABLED", message: "Unavailable" } },
      { status: 501 },
    );
  }) as typeof fetch);
  const body = {
    clientRequestId: "r",
    dataVersion: "prototype-v1",
    origin: { kind: "place" as const, buildingId: "LAW", placeId: "LAW-101" },
    destination: {
      kind: "place" as const,
      buildingId: "LAW",
      placeId: "LAW-103",
    },
    mode: "stairs" as const,
    stepFree: false,
    accessProfile: "public" as const,
  };
  await assert.rejects(api.route(body));
  assert.deepEqual(calls, ["/api/routes"]);
  await assert.rejects(api.previewRoute(body));
  assert.deepEqual(calls, ["/api/routes", "/api/preview/routes"]);
});

test("offset stair and elevator landings retain their positions inside an upright up/down marker", () => {
  for (const connectorKind of ["stairs", "elevator"] as const) {
    const leg: VerticalLeg = {
      kind: "vertical",
      id: "floor-change",
      buildingId: "LAW",
      fromFloorId: "1",
      toFloorId: "3",
      connectorKind,
      connectorId: "core-1",
      distanceMeters: 8,
      durationSeconds: 20,
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 4.8, y: 6.8, z: -2.4 },
      ],
    };
    const up = sceneRoute({ legs: [leg] }, "LAW")[0]!;
    const down = sceneRoute(
      {
        legs: [
          {
            ...leg,
            fromFloorId: "3",
            toFloorId: "1",
            points: [...leg.points].reverse(),
          },
        ],
      },
      "LAW",
    )[0]!;
    assert.equal(up.kind, "vertical");
    assert.equal(down.kind, "vertical");
    if (up.kind !== "vertical" || down.kind !== "vertical")
      assert.fail("Missing floor-change marker");
    assert.equal(up.direction, "up");
    assert.equal(down.direction, "down");
    assert.equal(up.toFloor, 3);
    assert.equal(down.toFloor, 1);
    assert.deepEqual(up.entry, scenePosition("LAW", leg.points[0]!));
    assert.deepEqual(up.exit, scenePosition("LAW", leg.points[1]!));
    assert.deepEqual(down.entry, up.exit);
    assert.deepEqual(down.exit, up.entry);
    assert.deepEqual(down.center, up.center);
    assert.deepEqual(down.size, up.size);
    for (const point of [up.entry, up.exit]) {
      for (const axis of [0, 1, 2] as const) {
        assert.ok(
          Math.abs(point[axis] - up.center[axis]) <= up.size[axis] / 2 + 1e-9,
        );
      }
    }
    assert.equal(
      "points" in up,
      false,
      "A floor change must not become a diagonal walking line",
    );
  }
});

test("walking chevrons point toward the destination through turns and when the route reverses", () => {
  const path: ScenePoint[] = [
    [0, 0, 0],
    [2, 0, 0],
    [2, 0, 2],
  ];
  const forward = routeChevrons(path),
    reverse = routeChevrons([...path].reverse());
  const direction = (arrow: ScenePoint[]) => [
    arrow[1]![0] - (arrow[0]![0] + arrow[2]![0]) / 2,
    arrow[1]![2] - (arrow[0]![2] + arrow[2]![2]) / 2,
  ];
  assert.equal(forward.length, 2);
  assert.equal(reverse.length, 2);
  assert.ok(direction(forward[0]!)[0]! > 0);
  assert.ok(direction(forward[1]!)[1]! > 0);
  assert.ok(direction(reverse[0]!)[1]! < 0);
  assert.ok(direction(reverse[1]!)[0]! < 0);
  assert.deepEqual(
    routeChevrons([
      [0, 0, 0],
      [0, 0, 0],
      [2, 3.4, 2],
    ]),
    [],
  );
});
