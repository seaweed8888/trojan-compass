import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../data/snapshots/", import.meta.url);
const read = (path: string) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const { dataVersion } = read("current.json");
const { buildingIds } = read(`${dataVersion}/manifest.json`);
const previous = "usc-interiors-2026-11-14";

test("every published interior restores wall proportions with grounded, contained geometry", () => {
  let walls = 0;
  for (const id of buildingIds) {
    const base = `${dataVersion}/buildings/${id}/`;
    const scale = read(base + "calibration.json").horizontalMetersPerSceneUnit;
    const height = 0.85 * scale;
    const building = read(base + "building.json");
    const scene = read(base + "scene.json");
    assert.deepEqual(scene.bounds, building.bounds);
    for (const floor of building.floors) {
      const geometry = read(base + `geometry/${floor.id}.json`);
      const old = read(`${previous}/buildings/${id}/geometry/${floor.id}.json`);
      assert.equal(geometry.objects.length, old.objects.length);
      for (let i = 0; i < geometry.objects.length; i++) {
        const object = geometry.objects[i];
        const before = old.objects[i];
        if (object.role !== "wall") {
          assert.deepEqual(object, before);
          continue;
        }
        walls++;
        assert.equal(object.size.y, height, `${object.objectKey}: wall height`);
        assert.ok(Math.abs(object.center.y - height / 2 - floor.elevationMeters) < 1e-8);
        assert.ok(object.center.y + height / 2 <= geometry.bounds.max.y + 1e-8);
        assert.ok(geometry.bounds.max.y <= building.bounds.max.y + 1e-8);
        assert.deepEqual(
          { ...object, center: { ...object.center, y: before.center.y }, size: { ...object.size, y: before.size.y } },
          before,
          "wall footprints, door gaps and object identity must stay unchanged",
        );
      }
    }
  }
  assert.ok(walls > 0);
});

test("wall restoration preserves routes, entrances, floor elevations and horizontal barriers", () => {
  for (const id of buildingIds) {
    const base = `${dataVersion}/buildings/${id}/`;
    const old = `${previous}/buildings/${id}/`;
    for (const file of ["topology.json", "connectors.json", "walkable-areas.json"])
      assert.deepEqual(read(base + "navigation/" + file), read(old + "navigation/" + file));
    const barriers = read(base + "navigation/barriers.json");
    const before = read(old + "navigation/barriers.json");
    assert.equal(barriers.length, before.length);
    barriers.forEach((barrier: any, i: number) => {
      assert.deepEqual({ ...barrier, max: { ...barrier.max, y: before[i].max.y } }, before[i]);
    });
    const places = read(base + "places.json");
    const oldPlaces = read(old + "places.json");
    places.forEach((place: any, i: number) => {
      assert.deepEqual({ ...place, bounds: oldPlaces[i].bounds }, oldPlaces[i]);
    });
  }
});
