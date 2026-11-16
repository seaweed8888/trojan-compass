import assert from "node:assert/strict";
import { test } from "node:test";
import {
  obstructed,
  project,
  walkable,
} from "../src/modules/routing/publication-geometry.js";
import type { PublishedNavigation as NavigationSource } from "../src/infrastructure/datasets/publication-format.js";
const a = { x: 0, y: 0, z: 0 },
  b = { x: 4, y: 0, z: 0 };
const barriers = [
  { floorId: "1", min: { x: 1, y: 0, z: -1 }, max: { x: 2, y: 2, z: 1 } },
];
test("route-position checks reject wall crossings and distinguish floors", () => {
  assert.equal(obstructed(a, b, "1", barriers), true);
  assert.equal(obstructed(a, b, "2", barriers), false);
  assert.equal(
    obstructed({ x: 0, y: 0, z: 2 }, { x: 4, y: 0, z: 2 }, "1", barriers),
    false,
  );
  assert.equal(
    obstructed({ x: 1.5, y: 0, z: 0 }, { x: 1.5, y: 0, z: 0 }, "1", barriers),
    true,
  );
});
test("walkable membership uses corridor width and segment bounds, not nearest-node distance alone", () => {
  const source = {
    walkable: [{ floorId: "1", from: a, to: b, radius: 0.75 }],
  } as NavigationSource;
  assert.equal(walkable({ x: 2, y: 0, z: 0.5 }, "1", source), true);
  assert.equal(walkable({ x: 2, y: 0, z: 1 }, "1", source), false);
  assert.equal(walkable({ x: 6, y: 0, z: 0 }, "1", source), false);
  assert.deepEqual(project({ x: 7, y: 0, z: 3 }, a, b), b);
});
