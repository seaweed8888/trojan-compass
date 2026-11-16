import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { prototypeStore } from "../src/infrastructure/datasets/prototype-adapter.js";
import { PreviewRoutingService } from "../src/modules/routing/preview/preview-routing.service.js";
import { assertContract } from "../src/lib/contracts.js";

test("negative authoring levels retain their metadata behind opaque, contract-valid floor IDs", async () => {
  const datasets = prototypeStore();
  const scope = {
    requestId: "subbasement",
    dataVersion: datasets.currentVersion,
  };
  const building = await datasets.getBuilding(scope, "KAP");
  const floor = building.floors.find((f) => f.sortOrder === -1)!;
  assert.equal(floor.id, "B1");
  assert.match(floor.label, /subbasement/i);
  assert.equal(floor.elevationMeters, -6.8);
  const place = await datasets.getPlace(scope, "KAP", "KAP--1-lab");
  assert.equal(place.floorId, floor.id);
  assert.equal(place.position.y, floor.elevationMeters);
  assert.equal(building.capabilities.navigation, false);
  assert.equal(building.capabilities.verifiedStepFreeRouting, false);
  assertContract("Building", building);
  assertContract("Place", place);

  const endpoint = {
    kind: "place" as const,
    buildingId: "KAP",
    placeId: place.id,
  };
  const routing = new PreviewRoutingService();
  const request = {
    clientRequestId: crypto.randomUUID(),
    dataVersion: scope.dataVersion,
    origin: endpoint,
    destination: endpoint,
    mode: "fastest" as const,
    stepFree: false,
    accessProfile: "public" as const,
  };
  const route = await routing.calculateRoute(scope, request);
  assertContract("Route", route);
  assert.equal(route.origin.floorId, "B1");
  assert.equal(route.destination.floorId, "B1");
  assert.equal(route.legs[0]?.kind, "indoor");
  assert.equal(route.legs[0]?.kind === "indoor" && route.legs[0].floorId, "B1");
  assert.equal(route.verifiedStepFree, false);
  const position = {
    kind: "position" as const,
    buildingId: "KAP",
    floorId: floor.id,
    position: place.position,
  };
  const pickedRequest = { ...request, origin: position };
  assertContract("RouteRequest", pickedRequest);
  const picked = await routing.calculateRoute(scope, pickedRequest);
  assertContract("Route", picked);
  assert.equal(picked.origin.floorId, "B1");
  assert.deepEqual(picked.origin.position, position.position);
  await assert.rejects(
    routing.calculateRoute(scope, {
      ...pickedRequest,
      origin: { ...position, floorId: "-1" },
    }),
    (error: { code?: string }) => error.code === "INVALID_POSITION",
  );
});

test("extraction rejects an existing publication before changing released data or the active pointer", async () => {
  const root = new URL("../../", import.meta.url);
  const pointer = new URL("server/data/snapshots/current.json", root);
  const before = await readFile(pointer);
  const { dataVersion } = JSON.parse(before.toString());
  const manifest = new URL(
    `server/data/snapshots/${dataVersion}/manifest.json`,
    root,
  );
  const manifestBefore = await readFile(manifest);
  const script = new URL(
    "../src/infrastructure/datasets/export-snapshot.ts",
    import.meta.url,
  );
  await assert.rejects(
    promisify(execFile)(
      process.execPath,
      ["--import", "tsx", fileURLToPath(script), dataVersion],
      { cwd: root },
    ),
    /Publication already exists/,
  );
  assert.deepEqual(await readFile(pointer), before);
  assert.deepEqual(await readFile(manifest), manifestBefore);
  await assert.rejects(
    promisify(execFile)(
      process.execPath,
      ["--import", "tsx", fileURLToPath(script), "../escape"],
      { cwd: root },
    ),
    /Pass a new dataVersion/,
  );
});
