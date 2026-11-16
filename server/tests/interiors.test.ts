import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { INTERIORS } from "../src/infrastructure/datasets/prototype/interiors/index.js";
import {
  BUILDINGS,
  type BuildingCode,
} from "../src/infrastructure/datasets/prototype/campus.js";
import {
  findRoom,
  findPlace,
  getLayout,
  getLevels,
  getBuildingPlaces,
  entrancePlace,
  floorName,
  type FloorLayout,
} from "../src/infrastructure/datasets/prototype/floorplan.js";
import {
  computeRoute,
  isStepFreePlace,
} from "../src/modules/routing/prototype/routing.js";
import { publishedServices } from "./support/published-fixture.js";
import { missingPrototypeService } from "./support/prototype-coverage.js";

const eps = 0.0001;
const contains = (L: FloorLayout, x: number, z: number) =>
  L.slabs.some(
    ([a, b, c, d]) =>
      x >= a - eps && x <= c + eps && z >= b - eps && z <= d + eps,
  );
const sample = (
  a: number[],
  b: number[],
  fn: (x: number, z: number) => void,
) => {
  const steps = Math.ceil(Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!) / 0.1);
  for (let i = 0; i <= steps; i++)
    fn(
      a[0]! + ((b[0]! - a[0]!) * i) / (steps || 1),
      a[1]! + ((b[1]! - a[1]!) * i) / (steps || 1),
    );
};

test("every authored building is registered and preserves source evidence and unique IDs/numbers", () => {
  assert.deepEqual(
    Object.keys(INTERIORS).sort(),
    BUILDINGS.filter((b) => b.code !== "LAW")
      .map((b) => b.code)
      .sort(),
  );
  const ids = new Set<string>();
  for (const [code, spec] of Object.entries(INTERIORS)) {
    const numbers = new Set<string>();
    assert.deepEqual(
      getLevels(code as BuildingCode),
      spec.floors.map((f) => f.level),
    );
    for (const f of spec.floors) {
      const L = getLayout(code as BuildingCode, f.level);
      assert.deepEqual(L.evidence, f.evidence);
      assert.equal(L.cells.length, f.records.length);
      for (const [index, c] of L.cells.entries()) {
        assert.ok(!ids.has(c.id), c.id);
        ids.add(c.id);
        assert.deepEqual(c.evidence, f.records[index]!.evidence, c.id);
        assert.ok(c.evidence?.sources.length, c.id);
        if (c.number) {
          assert.ok(!numbers.has(c.number), `${code} duplicate ${c.number}`);
          numbers.add(c.number);
        }
        assert.equal(c.evidence?.numberStatus === "not applicable", !c.number);
        if (c.kind !== "room" && c.kind !== "block")
          assert.equal(c.evidence?.accessibilityStatus, "inferred");
      }
    }
  }
  assert.throws(() => getLayout("VKC", 4), RangeError);
});

test("rooms and doors stay on their floor and corridors avoid enclosed rooms and blocks", () => {
  for (const code of Object.keys(INTERIORS))
    for (const floor of getLevels(code as BuildingCode)) {
      const L = getLayout(code as BuildingCode, floor);
      for (const c of L.cells) {
        for (let x = c.x0; x <= c.x1 + eps; x += 0.2)
          for (let z = c.z0; z <= c.z1 + eps; z += 0.2)
            assert.ok(contains(L, x, z), `${c.id} outside slab at ${x},${z}`);
        for (const p of [
          [c.x0, c.z0],
          [c.x1, c.z0],
          [c.x1, c.z1],
          [c.x0, c.z1],
        ])
          assert.ok(contains(L, p[0]!, p[1]!), `${c.id} corner`);
        const [x, z] = c.door;
        // Blocks are non-traversable display geometry, not destinations with doors.
        if (c.kind !== "block") {
          assert.ok(
            x >= c.x0 - eps &&
              x <= c.x1 + eps &&
              z >= c.z0 - eps &&
              z <= c.z1 + eps &&
              Math.min(
                Math.abs(x - c.x0),
                Math.abs(x - c.x1),
                Math.abs(z - c.z0),
                Math.abs(z - c.z1),
              ) < eps,
            `${c.id} door on boundary`,
          );
          assert.ok(
            L.walkNodes.some((n) => Math.hypot(n.x - x, n.z - z) < eps),
            `${c.id} door attached explicitly`,
          );
        }
        for (const other of L.cells)
          if (other.id > c.id)
            assert.ok(
              Math.min(c.x1, other.x1) - Math.max(c.x0, other.x0) <= eps ||
                Math.min(c.z1, other.z1) - Math.max(c.z0, other.z0) <= eps,
              `${c.id} overlaps ${other.id}`,
            );
      }
      const nodes = new Map(L.walkNodes.map((n) => [n.id, n]));
      for (const [a, b] of L.walkEdges) {
        const na = nodes.get(a)!,
          nb = nodes.get(b)!;
        assert.ok(na && nb);
        sample([na.x, na.z], [nb.x, nb.z], (x, z) => {
          assert.ok(
            contains(L, x, z),
            `${code} ${floor} corridor outside slab at ${x},${z}`,
          );
          for (const c of L.cells)
            assert.ok(
              c.open ||
                !(
                  x > c.x0 + eps &&
                  x < c.x1 - eps &&
                  z > c.z0 + eps &&
                  z < c.z1 - eps
                ),
              `${code} ${floor} corridor crosses ${c.id} at ${x},${z}`,
            );
        });
      }
      for (const v of L.voids ?? []) {
        const [x0, z0, x1, z1] = v.rect;
        assert.equal(
          contains(L, (x0 + x1) / 2, (z0 + z1) / 2),
          false,
          `${code} courtyard is not walkable`,
        );
      }
      for (const e of L.entrances) {
        assert.ok(contains(L, e.x, e.z));
        // Entrance points can sit on a modeled approach/pavilion slab. Preserve
        // their authored location and evidence instead of moving them to an outline.
        const authored = INTERIORS[code]!.floors.find(
          (f) => f.level === floor,
        )!.entrances!.find(
          (source) => `${code}:${floor}:${source.id}` === e.id,
        )!;
        assert.deepEqual(
          [e.x, e.z],
          [(authored.at[1] - 930) / 30, -(authored.at[0] - 630) / 30],
        );
        assert.ok(e.evidence?.sources.length, e.id);
      }
    }
});

test("corridors stay connected, explicit core identities preserve offset landings, and missing service stays unavailable", () => {
  for (const code of Object.keys(INTERIORS)) {
    const lastCore = new Map<string, { kind: string; floor: number }>();
    for (const floor of getLevels(code as BuildingCode)) {
      const L = getLayout(code as BuildingCode, floor);
      const seen = new Set([L.walkNodes[0]!.id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const [a, b] of L.walkEdges)
          if (seen.has(a) || seen.has(b)) {
            for (const n of [a, b])
              if (!seen.has(n)) {
                seen.add(n);
                changed = true;
              }
          }
      }
      assert.equal(
        seen.size,
        L.walkNodes.length,
        `${code} ${floor} corridor connectivity`,
      );
      for (const c of L.cells)
        if (c.core) {
          const prev = lastCore.get(c.core);
          if (prev) {
            assert.equal(c.kind, prev.kind, `${code} ${c.core} connector kind`);
            assert.notEqual(
              floor,
              prev.floor,
              `${code} ${c.core} duplicate landing`,
            );
          }
          // Floor-specific traces can have offset landings. Connector identity,
          // not a coincident x/z center, determines authored vertical service.
          lastCore.set(c.core, { kind: c.kind, floor });
        }
    }
    for (const p of getBuildingPlaces(code as BuildingCode))
      for (const mode of ["fastest", "stairs", "elevator"] as const) {
        const route = computeRoute(
          entrancePlace(code as BuildingCode),
          p,
          mode,
        );
        if (missingPrototypeService(code as BuildingCode, p.floor, mode)) {
          assert.equal(route, null, `${p.id} ${mode} is not modeled`);
          continue;
        }
        assert.ok(route, `${p.id} ${mode}`);
        assert.equal(route.inferred, true);
        if (mode === "elevator") assert.equal(route.usesStairs, false);
      }
  }
});

test("LAW geometry stays unchanged while reconstructed aliases and floors are retained", () => {
  const hashes = [
    "cf6342b0d449d9bd115008f5bfb0d086353013344126d32dfbaaf6187ebe2f12",
    "b1e9f7b82a8c404a2400e735ca246ade6ddcfd696d684e1d3ae22f5f318f9c2e",
    "05a6de5c571467d32a52dae246ffe870e5e109438c70aea7bd16801d0af3e45d",
    "ac3e6667c5e0d45448d2a2bfd8277da96c433b8b339de1e1a1a8999a6de11f4f",
    "e00754c758fd9630822aa8b2eaaa4bd176263ef5f8d4533ad43ac7bdfb4903c1",
  ];
  for (const [floor, hash] of hashes.entries())
    assert.equal(
      createHash("sha256")
        .update(JSON.stringify(getLayout("LAW", floor)))
        .digest("hex"),
      hash,
    );
  assert.equal(findRoom("DMC 100")?.id, "VKC-100");
  assert.equal(findRoom("SGM 601")?.floor, 6);
  assert.equal(floorName(2, "DML"), "First floor");
  assert.equal(findPlace("DML-ENT-NORTH-MAIN")?.floor, 2);
  for (const key of Object.keys(INTERIORS))
    assert.equal(isStepFreePlace(entrancePlace(key as BuildingCode)), false);
});

test("active publication preserves its own records, object mappings and route coverage independently of draft sources", async () => {
  const services = await publishedServices();
  const repo = services.datasets;
  const version = services.currentVersion();
  const scope = { requestId: "interior-publication", dataVersion: version };
  // Authoring specifications can change without rewriting a released dataVersion.
  // Verify the publication against its own floors, places and geometry; canonical
  // routing, including supported failures, remains covered by canonical-routing.test.
  const directory = await repo.listBuildings(scope);
  assert.ok(directory.length > 0);
  for (const summary of directory.filter((b) => b.id !== "LAW")) {
    const code = summary.id;
    const building = await repo.getBuilding(scope, code);
    const places = await repo.listPlaces(scope, code);
    assert.equal(building.capabilities.verifiedStepFreeRouting, false);
    const entrance = places.find((p) => p.id === `${code}-ENT`)!;
    assert.ok(entrance, `${code} published entrance`);
    for (const floor of building.floors) {
      const geometry = await repo.getFloorGeometry!(scope, code, floor.id);
      assert.ok(geometry, `${code} ${floor.id} geometry`);
      const ids = new Set(geometry.objects.map((o) => o.objectKey));
      const destinations = places.filter(
        (p) => p.floorId === floor.id && p.sceneObjectKey !== null,
      );
      assert.ok(
        destinations.length,
        `${code} ${floor.id} published destinations`,
      );
      for (const place of destinations) {
        assert.ok(ids.has(place.sceneObjectKey!), place.id);
        assert.equal(place.provenance.verificationStatus, "unverified");
        assert.match(place.provenance.note, /Sources: .+/, place.id);
        if (building.capabilities.navigation) {
          const result = await services.routing.calculateRoute(scope, {
            clientRequestId: crypto.randomUUID(),
            dataVersion: version,
            origin: { kind: "place", buildingId: code, placeId: entrance.id },
            destination: { kind: "place", buildingId: code, placeId: place.id },
            mode: "fastest",
            stepFree: false,
            accessProfile: "public",
          });
          assert.equal(result.destination.placeId, place.id);
        }
      }
      const destination = destinations.find((p) => p.kind === "classroom")!;
      assert.ok(destination, `${code} ${floor.id} classroom`);
      if (building.capabilities.navigation)
        for (const mode of ["stairs", "elevator"] as const) {
          const result = await services.routing.calculateRoute(scope, {
            clientRequestId: crypto.randomUUID(),
            dataVersion: version,
            origin: { kind: "place", buildingId: code, placeId: entrance.id },
            destination: {
              kind: "place",
              buildingId: code,
              placeId: destination.id,
            },
            mode,
            stepFree: false,
            accessProfile: "public",
          });
          if (mode === "elevator") assert.equal(result.usesStairs, false);
        }
    }
  }
});
