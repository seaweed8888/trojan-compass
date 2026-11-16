import assert from "node:assert/strict";
import { test } from "node:test";
import { PerspectiveCamera, Vector3 } from "three";
import * as THREE from "three";
import CameraControls from "camera-controls";
import { BUILDINGS } from "../src/features/map/data/campus-display";
import "./viewer-fixtures";
import {
  roomLabelsVisible,
  zoomModelWithShortcut,
} from "../src/features/map/camera";
import {
  cellCenter,
  floorY,
  getLayout,
  getLevels,
  planBounds,
} from "../src/features/map/data/viewer-data";
import { buildingFrame, roomFacingAngle } from "../src/features/map/camera";

test("close framing keeps every floor in view on desktop and mobile, from either side", () => {
  for (const building of BUILDINGS)
    for (const aspect of [0.55, 1.25, 2])
      for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        const frame = buildingFrame(building.code, aspect, 32, angle, 1.18);
        const camera = new PerspectiveCamera(32, aspect, 0.5, 600);
        camera.position.copy(frame.position);
        camera.lookAt(frame.target);
        camera.updateMatrixWorld();
        let maxX = 0,
          maxY = 0;
        for (const level of getLevels(building.code))
          for (const [x0, z0, x1, z1] of getLayout(building.code, level)
            .slabs) {
            for (const x of [x0, x1])
              for (const z of [z0, z1])
                for (const y of [floorY(level) - 0.3, floorY(level) + 1.5]) {
                  const p = new Vector3(x, y, z).project(camera);
                  assert.ok(
                    Math.abs(p.x) <= 0.901 && Math.abs(p.y) <= 0.781,
                    `${building.code}: clipped corner`,
                  );
                  maxX = Math.max(maxX, Math.abs(p.x));
                  maxY = Math.max(maxY, Math.abs(p.y));
                }
          }
        assert.ok(
          maxX > 0.7 || maxY > 0.6,
          "building fills the available view",
        );
      }
});

test("far-side rooms turn toward the viewer; near-side rooms preserve their angle", () => {
  for (const building of BUILDINGS) {
    const b = planBounds(building.code);
    for (const floor of getLevels(building.code))
      for (const room of getLayout(building.code, floor).cells.filter(
        (c) => c.kind === "room",
      )) {
        const [x, z] = cellCenter(room);
        const dx = (x - (b.x0 + b.x1) / 2) / (b.x1 - b.x0);
        const dz = (z - (b.z0 + b.z1) / 2) / (b.z1 - b.z0);
        if (Math.hypot(dx, dz) < 0.1) continue;
        const near = Math.atan2(dx, dz);
        assert.equal(roomFacingAngle(building.code, room.id, near), near);
        const far = near + Math.PI + Math.PI * 4;
        const result = roomFacingAngle(building.code, room.id, far);
        assert.ok(dx * Math.sin(result) + dz * Math.cos(result) > 0);
        assert.ok(
          Math.abs(result - far) <= Math.PI + 1e-8,
          "uses shortest turn",
        );
      }
  }
  assert.equal(roomFacingAngle("LAW", "LAW-invalid", 1.2), 1.2);
  assert.equal(roomFacingAngle("THH", "LAW-101", 1.2), 1.2);
});

test("single-floor framing stays centered and fits narrow, resized, and wide viewports", () => {
  for (const building of BUILDINGS)
    for (const floor of getLevels(building.code)) {
      for (const aspect of [0.35, 0.55, 0.8, 1.5, 2])
        for (const angle of [0, Math.PI / 2, Math.PI]) {
          const frame = buildingFrame(
            building.code,
            aspect,
            32,
            angle,
            Math.atan2(33, 32),
            floor,
          );
          assert.ok(Math.abs(frame.target.y - (floorY(floor) + 0.6)) < 1e-8);
          const camera = new PerspectiveCamera(32, aspect, 0.5, 600);
          camera.position.copy(frame.position);
          camera.lookAt(frame.target);
          camera.updateMatrixWorld();
          for (const [x0, z0, x1, z1] of getLayout(building.code, floor)
            .slabs) {
            for (const x of [x0, x1])
              for (const z of [z0, z1])
                for (const y of [floorY(floor) - 0.3, floorY(floor) + 1.5]) {
                  const point = new Vector3(x, y, z).project(camera);
                  assert.ok(
                    Math.abs(point.x) <= 0.901 && Math.abs(point.y) <= 0.781,
                    `${building.code} floor ${floor}: clipped after resize`,
                  );
                }
          }
        }
    }
});

test("room labels hide at the dynamic zoom limit and restore without flickering", () => {
  for (const max of [160, 300, 500]) {
    assert.equal(roomLabelsVisible(max * 0.994, max, true), true);
    assert.equal(roomLabelsVisible(max * 0.995, max, true), false);
    assert.equal(roomLabelsVisible(max, max, false), false);
    assert.equal(roomLabelsVisible(max * 0.992, max, false), false);
    assert.equal(roomLabelsVisible(max * 0.989, max, false), true);
    assert.equal(roomLabelsVisible(max / 2, max, false), true);
  }
});

test("browser zoom shortcuts move only the camera, respect limits, and leave native iOS alone", (t) => {
  // CameraControls creates an element rectangle even when no DOM element is attached.
  const rectangle = Object.getOwnPropertyDescriptor(globalThis, "DOMRect");
  Object.defineProperty(globalThis, "DOMRect", {
    configurable: true,
    value: class {
      x = 0;
      y = 0;
      width = 0;
      height = 0;
    },
  });
  t.after(() => {
    if (rectangle) Object.defineProperty(globalThis, "DOMRect", rectangle);
    else Reflect.deleteProperty(globalThis, "DOMRect");
  });
  CameraControls.install({ THREE });
  const camera = new PerspectiveCamera(32, 1.5, 0.5, 600);
  camera.position.set(0, 0, 80);
  const controls = new CameraControls(camera);
  controls.minDistance = 12;
  controls.maxDistance = 160;
  const press = (
    key: string,
    options: Partial<KeyboardEvent> = {},
    protocol = "https:",
  ) => {
    const event = Object.assign(new Event("keydown", { cancelable: true }), {
      key,
      code: "",
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      isComposing: false,
      ...options,
    }) as KeyboardEvent;
    zoomModelWithShortcut(event, controls, protocol);
    controls.update(10);
    return event;
  };
  for (const key of ["+", "="]) {
    controls.distance = 80;
    assert.equal(press(key).defaultPrevented, true);
    assert.ok(controls.distance < 80);
  }
  assert.equal(
    press("-", { ctrlKey: false, metaKey: true }).defaultPrevented,
    true,
  );
  assert.ok(controls.distance > 68);
  controls.distance = 80;
  for (const protocol of ["compass-web:", "file:"]) {
    assert.equal(press("+", {}, protocol).defaultPrevented, false);
    assert.equal(controls.distance, 80);
  }
  for (const [key, options] of [
    ["0", {}],
    ["+", { ctrlKey: false }],
    ["+", { altKey: true }],
    ["+", { isComposing: true }],
  ] as const)
    assert.equal(press(key, options).defaultPrevented, false);
  assert.equal(controls.distance, 80);
  for (let i = 0; i < 100; i++) press("+", { code: "NumpadAdd" });
  assert.equal(controls.distance, 12);
  for (let i = 0; i < 100; i++) press("-", { code: "NumpadSubtract" });
  assert.equal(controls.distance, 160);
  assert.equal(camera.fov, 32);
  assert.equal(camera.aspect, 1.5);
  controls.dispose();
});
