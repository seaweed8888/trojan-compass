import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fixture, makeServices, scope } from "./support/fixture.js";
import { SnapshotStore } from "../src/infrastructure/datasets/snapshot-store.js";
import { loadSnapshots } from "../src/infrastructure/datasets/snapshot-loader.js";
import { readConfig } from "../src/config/env.js";
import { prepareServices } from "../src/bootstrap/services.js";

test("snapshots clone inputs, freeze records, and reject dangling references and inverted bounds", async () => {
  const input = fixture();
  const store = new SnapshotStore([input], input.dataVersion);
  input.buildings[0]!.name = "mutated";
  assert.equal((await store.getBuilding(scope(), "LAW")).name, "Law Building");
  const p = await store.getPlace(scope(), "LAW", "LAW-101");
  assert.throws(() => {
    p.position.x = 99;
  });
  const bad = fixture();
  bad.places[0]!.floorId = "missing";
  assert.throws(
    () => new SnapshotStore([bad], bad.dataVersion),
    /unknown floor/,
  );
  const inverted = fixture();
  inverted.buildings[0]!.bounds.min.x = 100;
  assert.throws(
    () => new SnapshotStore([inverted], inverted.dataVersion),
    /inverted/,
  );
});
test("file publications load independent of cwd and cannot reference outside the dataset root", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "compass-datasets-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const publication = join(root, "publication");
  await mkdir(join(publication, "test-v1"), { recursive: true });
  await writeFile(
    join(publication, "current.json"),
    JSON.stringify({
      currentVersion: "test-v1",
      availableVersions: ["test-v1"],
    }),
  );
  await writeFile(
    join(publication, "test-v1", "dataset.json"),
    JSON.stringify(fixture()),
  );
  assert.equal((await loadSnapshots(publication)).currentVersion, "test-v1");
  await writeFile(
    join(publication, "current.json"),
    JSON.stringify({
      currentVersion: "../escape",
      availableVersions: ["../escape"],
    }),
  );
  await assert.rejects(loadSnapshots(publication), /manifest/);
  await writeFile(
    join(root, "outside.json"),
    JSON.stringify({
      currentVersion: "test-v1",
      availableVersions: ["test-v1"],
    }),
  );
  await rm(join(publication, "current.json"));
  await symlink(join(root, "outside.json"), join(publication, "current.json"));
  await assert.rejects(loadSnapshots(publication), /escapes/);
});
test("production requires explicit configuration and reviewed publications; missing navigation remains optional", async () => {
  assert.throws(() => readConfig({ NODE_ENV: "production" }), /DATASET_ROOT/);
  assert.throws(
    () => readConfig({ NODE_ENV: "production", DATASET_ROOT: "/data" }),
    /CURSOR_SECRET/,
  );
  assert.throws(() => readConfig({ AI_PROVIDER: "openai" }), /OPENAI_API_KEY/);
  assert.throws(() => readConfig({ PORT: "4e3" }), /PORT/);
  assert.throws(() => readConfig({ EXPOSE_GRAPH: "1" }), /true or false/);
  const data = fixture();
  assert.throws(
    () => new SnapshotStore([data], data.dataVersion, { production: true }),
    /reviewed/,
  );
  data.navigation = [];
  data.buildings[0]!.capabilities.navigation = false;
  data.buildings[0]!.capabilities.verifiedStepFreeRouting = false;
  const services = makeServices(data);
  await prepareServices(services, [data.dataVersion]);
  assert.ok(
    (
      await services.search.searchPlaces(scope(), {
        query: "LAW 101",
        limit: 20,
      })
    ).results.length,
  );
});
test("graph validators reject missing evidence and implicit doorway crossings", async () => {
  const data = fixture();
  data.navigation[0]!.edgeDetails[0]!.access.evidenceIds = ["missing"];
  await assert.rejects(
    prepareServices(makeServices(data), [data.dataVersion]),
    /missing evidence/,
  );
  const shortcut = fixture();
  shortcut.navigation[0]!.edges.find((e) => e.id === "BR1")!.kind = "walkway";
  await assert.rejects(
    prepareServices(makeServices(shortcut), [shortcut.dataVersion]),
    /explicit door edge/,
  );
});
