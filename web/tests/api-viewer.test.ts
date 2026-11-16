import assert from "node:assert/strict";
import { test, after, before } from "node:test";
import { createApp } from "../../server/src/app";
import { publishedServices } from "../../server/tests/support/published-fixture";
import { ViewerSession } from "../src/features/map/api-viewer";
import { client } from "../src/lib/api-client";
import { LatestRequest } from "../src/lib/latest-request";
import { sceneRoute } from "../src/features/routing/route-scene";
import { findCell } from "../src/features/map/data/viewer-data";
let server: ReturnType<ReturnType<typeof createApp>["listen"]>;
before(async () => {
  server = createApp(await publishedServices()).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
});
const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, options) =>
  nativeFetch(
    typeof input === "string" && input.startsWith("/api")
      ? `http://127.0.0.1:${(server.address() as { port: number }).port}${input}`
      : input,
    options,
  );
after(() => {
  globalThis.fetch = nativeFetch;
  server.closeAllConnections();
  return new Promise<void>((resolve) => server.close(() => resolve()));
});
test("scene staging, canonical selection and route drawing use the live backend contract", async () => {
  const session = new ViewerSession(await client.buildings());
  const place = await session.resolve("law 101");
  assert.equal(place.id, "LAW-101");
  const prepared = await session.actions([
    {
      type: "focus_place",
      buildingId: place.buildingId,
      floorId: place.floorId,
      placeId: place.id,
    },
  ]);
  assert.equal(
    findCell("LAW-101"),
    undefined,
    "staging must not mutate the current scene",
  );
  prepared.commit();
  assert.equal(findCell("LAW-101")?.floor, 1);
  assert.equal(prepared.selected, "LAW-101");
  const response = await client.route({
    clientRequestId: crypto.randomUUID(),
    dataVersion: session.directory.dataVersion,
    origin: { kind: "place", buildingId: "LAW", placeId: "LAW-101" },
    destination: { kind: "place", buildingId: "LAW", placeId: "LAW-213" },
    mode: "fastest",
    stepFree: false,
    accessProfile: "public",
  });
  const result = await session.actions([
    { type: "show_route", route: response.route },
  ]);
  assert.ok(result.route?.legs[0]?.floors.includes(2));
  assert.equal(result.route?.meters, response.route.distanceMeters);
  assert.deepEqual(
    result.wireRoute?.legs,
    response.route.legs,
    "vertical wire legs must survive viewer staging",
  );
  result.commit();
  const segments = sceneRoute(result.wireRoute!, "LAW");
  assert.ok(segments.some((s) => s.kind === "vertical"));
  for (const segment of segments)
    if (segment.kind === "indoor")
      assert.ok(
        segment.points.every((p) => p[1] === segment.points[0]![1]),
        "walking lines never connect floors diagonally",
      );
  assert.deepEqual(segments[0]!.kind === "indoor" && segments[0]!.points[0], [
    response.route.origin.position.x,
    response.route.origin.position.y + 0.36,
    response.route.origin.position.z,
  ]);
  const before = findCell("LAW-101");
  await assert.rejects(
    session.actions([
      {
        type: "focus_place",
        buildingId: "LAW",
        floorId: "1",
        placeId: "does-not-exist",
      },
    ]),
  );
  assert.deepEqual(
    findCell("LAW-101"),
    before,
    "failed action batch preserves the installed scene",
  );
});

test("late route staging cannot replace a newer search or map selection", async () => {
  const session = new ViewerSession(await client.buildings());
  const gate = new LatestRequest();
  let displayed = "LAW-101";
  let release!: () => void;
  const delay = new Promise<void>((resolve) => {
    release = resolve;
  });
  const old = gate.start();
  const pending = (async () => {
    const staged = await session.actions([
      {
        type: "focus_place",
        buildingId: "LAW",
        floorId: "2",
        placeId: "LAW-213",
      },
    ]);
    await delay;
    if (old.isCurrent()) {
      staged.commit();
      displayed = staged.selected!;
    }
  })();
  const current = gate.start();
  const next = await session.actions([
    {
      type: "focus_place",
      buildingId: "LAW",
      floorId: "1",
      placeId: "LAW-107",
    },
  ]);
  if (current.isCurrent()) {
    next.commit();
    displayed = next.selected!;
  }
  release();
  await pending;
  assert.equal(old.signal.aborted, true);
  assert.equal(displayed, "LAW-107");
  gate.invalidate();
  assert.equal(
    current.isCurrent(),
    false,
    "unmount or manual selection cancels outstanding actions",
  );
});
