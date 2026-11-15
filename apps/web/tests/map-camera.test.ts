import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PerspectiveCamera, Vector3 } from 'three'
import { BUILDINGS } from '../src/data/campus'
import { cellCenter, floorY, getLayout, getLevels, planBounds } from '../src/data/floorplan'
import { buildingFrame, roomFacingAngle, roomLabelsVisible } from '../src/lib/map-camera'

test('room labels hide at the dynamic zoom limit and restore without flickering', () => {
  for (const max of [160, 300, 500]) {
    assert.equal(roomLabelsVisible(max * 0.994, max, true), true)
    assert.equal(roomLabelsVisible(max * 0.995, max, true), false)
    assert.equal(roomLabelsVisible(max, max, false), false)
    assert.equal(roomLabelsVisible(max * 0.992, max, false), false)
    assert.equal(roomLabelsVisible(max * 0.989, max, false), true)
    assert.equal(roomLabelsVisible(max / 2, max, false), true)
  }
})

test('close framing keeps every floor in view on desktop and mobile, from either side', () => {
  for (const building of BUILDINGS) for (const aspect of [0.55, 1.25, 2]) for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const frame = buildingFrame(building.code, aspect, 32, angle, 1.18)
    const camera = new PerspectiveCamera(32, aspect, 0.5, 600)
    camera.position.copy(frame.position)
    camera.lookAt(frame.target)
    camera.updateMatrixWorld()
    let maxX = 0, maxY = 0
    for (const level of getLevels(building.code)) for (const [x0, z0, x1, z1] of getLayout(building.code, level).slabs) {
      for (const x of [x0, x1]) for (const z of [z0, z1]) for (const y of [floorY(level) - 0.3, floorY(level) + 1.5]) {
        const p = new Vector3(x, y, z).project(camera)
        assert.ok(Math.abs(p.x) <= 0.901 && Math.abs(p.y) <= 0.781, `${building.code}: clipped corner`)
        maxX = Math.max(maxX, Math.abs(p.x)); maxY = Math.max(maxY, Math.abs(p.y))
      }
    }
    assert.ok(maxX > 0.7 || maxY > 0.6, 'building fills the available view')
  }
})

test('far-side rooms turn toward the viewer; near-side rooms preserve their angle', () => {
  for (const building of BUILDINGS) {
    const b = planBounds(building.code)
    for (const floor of getLevels(building.code)) for (const room of getLayout(building.code, floor).cells.filter(c => c.kind === 'room')) {
      const [x, z] = cellCenter(room)
      const dx = (x - (b.x0 + b.x1) / 2) / (b.x1 - b.x0)
      const dz = (z - (b.z0 + b.z1) / 2) / (b.z1 - b.z0)
      if (Math.hypot(dx, dz) < 0.1) continue
      const near = Math.atan2(dx, dz)
      assert.equal(roomFacingAngle(building.code, room.id, near), near)
      const far = near + Math.PI + Math.PI * 4
      const result = roomFacingAngle(building.code, room.id, far)
      assert.ok(dx * Math.sin(result) + dz * Math.cos(result) > 0)
      assert.ok(Math.abs(result - far) <= Math.PI + 1e-8, 'uses shortest turn')
    }
  }
  assert.equal(roomFacingAngle('LAW', 'LAW-invalid', 1.2), 1.2)
  assert.equal(roomFacingAngle('THH', 'LAW-101', 1.2), 1.2)
})

test('single-floor framing stays centered and fits narrow, resized, and wide viewports', () => {
  for (const building of BUILDINGS) for (const floor of getLevels(building.code)) {
    for (const aspect of [0.35, 0.55, 0.8, 1.5, 2]) for (const angle of [0, Math.PI / 2, Math.PI]) {
      const frame = buildingFrame(building.code, aspect, 32, angle, Math.atan2(33, 32), floor)
      assert.ok(Math.abs(frame.target.y - (floorY(floor) + 0.6)) < 1e-8)
      const camera = new PerspectiveCamera(32, aspect, 0.5, 600)
      camera.position.copy(frame.position)
      camera.lookAt(frame.target)
      camera.updateMatrixWorld()
      for (const [x0, z0, x1, z1] of getLayout(building.code, floor).slabs) {
        for (const x of [x0, x1]) for (const z of [z0, z1]) for (const y of [floorY(floor) - 0.3, floorY(floor) + 1.5]) {
          const point = new Vector3(x, y, z).project(camera)
          assert.ok(Math.abs(point.x) <= 0.901 && Math.abs(point.y) <= 0.781, `${building.code} floor ${floor}: clipped after resize`)
        }
      }
    }
  }
})
