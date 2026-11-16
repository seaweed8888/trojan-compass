import test from "node:test";
import assert from "node:assert/strict";
import { fixture, makeServices, scope } from "./support/fixture.js";
import { AsyncCache } from "../src/lib/cache.js";
import { prototypeStore } from "../src/infrastructure/datasets/prototype-adapter.js";
import { createServices } from "../src/bootstrap/services.js";
import { DisabledIntentAdapter } from "../src/integrations/ai/provider-adapter.js";
import { withinScope } from "../src/lib/scope.js";

test("search normalizes room identifiers and building aliases, with exact matches first", async () => {
  const { search } = makeServices();
  const result = await search.searchPlaces(scope(), {
    query: "  lAw—101  ",
    limit: 20,
  });
  assert.equal(result.results[0]?.place.id, "LAW-101");
  assert.equal(result.results[0]?.matchType, "exact");
  assert.equal(
    (await search.searchBuildings(scope(), { query: "DMC", limit: 20 }))
      .buildings[0]?.id,
    "VKC",
  );
  assert.equal(
    (await search.searchBuildings(scope(), { query: "gould", limit: 20 }))
      .buildings[0]?.id,
    "LAW",
  );
});
test("directory and search have intentional empty-query behavior and scoped filters", async () => {
  const { search } = makeServices();
  assert.equal(
    (await search.searchPlaces(scope(), { query: "", limit: 20 })).results
      .length,
    0,
  );
  assert.equal(
    (await search.searchBuildings(scope(), { query: "", limit: 20 })).buildings
      .length,
    2,
  );
  const result = await search.searchPlaces(scope(), {
    query: "",
    buildingId: "LAW",
    floorId: "2",
    kind: "classroom",
    limit: 20,
  });
  assert.equal(result.results.length, 3);
  assert.ok(result.results.every((r) => r.place.floorId === "2"));
  await assert.rejects(
    search.searchPlaces(scope(), { query: "", floorId: "2", limit: 20 }),
    { code: "INVALID_REQUEST" },
  );
});
test("cursor pagination has no duplicates and rejects tampering, filter changes, and version changes", async () => {
  const { search } = makeServices();
  const input = { query: "", buildingId: "LAW", limit: 2 };
  const seen = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await search.searchPlaces(scope(), { ...input, cursor });
    for (const row of page.results) {
      assert.equal(seen.has(row.place.id), false);
      seen.add(row.place.id);
    }
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  assert.equal(seen.size, fixture().places.length);
  const first = await search.searchPlaces(scope(), input);
  const next = first.nextCursor!;
  await assert.rejects(
    search.searchPlaces(scope(), {
      ...input,
      cursor: next.slice(0, -3) + "xxx",
    }),
    { code: "INVALID_REQUEST" },
  );
  await assert.rejects(
    search.searchPlaces(scope(), { ...input, cursor: next, kind: "classroom" }),
    { code: "INVALID_REQUEST" },
  );
  await assert.rejects(
    search.searchPlaces(scope(), { ...input, cursor: next, limit: 3 }),
    { code: "INVALID_REQUEST" },
  );
  await assert.rejects(
    search.searchPlaces(
      { ...scope(), dataVersion: "removed" },
      { ...input, cursor: next },
    ),
    { code: "DATA_VERSION_UNAVAILABLE" },
  );
});
test("step-free search proves forward reachability from a reference entrance", async () => {
  const data = fixture();
  const nav = data.navigation[0]!;
  // A one-way corridor points toward the entrance. Destinations beyond it cannot be reached from outside.
  const e = nav.edges.find((e) => e.id === "AB1")!,
    d = nav.edgeDetails.find((d) => d.edgeId === e.id)!;
  [e.fromNodeId, e.toNodeId] = [e.toNodeId, e.fromNodeId];
  e.bidirectional = false;
  d.points.reverse();
  const r = await makeServices(data).search.searchPlaces(scope(), {
    query: "",
    buildingId: "LAW",
    stepFree: true,
    limit: 100,
  });
  assert.ok(r.results.length);
  assert.ok(
    r.results.every(
      (r) => r.stepFreeEvaluation?.status === "verified_reachable",
    ),
  );
  assert.equal(
    r.results.some((r) => r.place.id === "LAW-102"),
    false,
  );
});
test("normal search works with navigation absent and does not promote unverified prototype access", async () => {
  const datasets = prototypeStore();
  const services = createServices(
    datasets,
    () => datasets.currentVersion,
    "a-development-secret-of-at-least-thirty-two-bytes",
    new DisabledIntentAdapter(),
  );
  const s = { ...scope(), dataVersion: datasets.currentVersion };
  assert.equal(
    (await services.search.searchPlaces(s, { query: "LAW 101", limit: 20 }))
      .results[0]?.place.id,
    "LAW-101",
  );
  assert.equal(
    (
      await services.search.searchPlaces(s, {
        query: "LAW 101",
        stepFree: true,
        limit: 20,
      })
    ).results.length,
    0,
  );
});
test("single-flight preparation survives one cancelled caller and failed entries can be retried", async () => {
  const cache = new AsyncCache<number>();
  let calls = 0;
  let release!: (n: number) => void;
  const pending = cache.get("v1", () => {
    calls++;
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  await Promise.resolve();
  const controller = new AbortController();
  const a = withinScope({ ...scope(), signal: controller.signal }, pending);
  const b = cache.get("v1", async () => 99);
  controller.abort(new Error("cancelled"));
  await assert.rejects(a, /cancelled/);
  release(42);
  assert.equal(await b, 42);
  assert.equal(calls, 1);
  await assert.rejects(
    cache.get("failure", async () => {
      throw new Error("retry");
    }),
    /retry/,
  );
  assert.equal(await cache.get("failure", async () => 7), 7);
});
