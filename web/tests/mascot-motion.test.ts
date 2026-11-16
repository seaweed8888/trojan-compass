import assert from 'node:assert/strict'
import test from 'node:test'
import { AnimationMixer, Group } from 'three'
import { advanceCarrySwing, createCarrySwing, DANGLE_CLIP } from '../src/features/map/renderer/mascot-motion'

test('the compact baked loop moves independent limbs and restores the standing pose', () => {
  const root = new Group()
  for (const name of ['Head', 'ArmL', 'ArmR', 'LegL', 'LegR']) {
    const joint = new Group()
    joint.name = name
    root.add(joint)
  }
  let bytes = 0
  for (const track of DANGLE_CLIP.tracks) {
    bytes += track.times.byteLength + track.values.byteLength
    assert.deepEqual(track.values.slice(0, 4), track.values.slice(-4), 'Loop must close without a pose jump')
  }
  assert.ok(bytes < 1024)
  const mixer = new AnimationMixer(root)
  const action = mixer.clipAction(DANGLE_CLIP).play()
  mixer.update(.35)
  assert.ok(root.getObjectByName('ArmL')!.rotation.x > .2)
  assert.ok(root.getObjectByName('LegL')!.rotation.x < 0)
  assert.ok(root.getObjectByName('LegR')!.rotation.x > 0)
  assert.ok(root.getObjectByName('Head')!.rotation.x > .65, 'Head must droop independently of the body')
  action.stop()
  for (const joint of root.children) assert.ok(joint.quaternion.angleTo(new Group().quaternion) < 1e-6)
})

test('dragging creates bounded lag, then settles consistently across frame rates', () => {
  const simulate = (fps: number) => {
    const swing = createCarrySwing()
    for (let i = 0; i < fps / 2; i++) advanceCarrySwing(swing, 12, 8, 1 / fps)
    assert.ok(swing.z < -.1, 'Body must lag behind a rightward drag')
    assert.ok(swing.x > .05)
    const moving = { x: swing.x, z: swing.z }
    for (let i = 0; i < fps * 4; i++) advanceCarrySwing(swing, 0, 0, 1 / fps)
    assert.ok(Math.abs(swing.x) + Math.abs(swing.z) < .001, 'Released motion must settle')
    return moving
  }
  const slow = simulate(30), fast = simulate(120)
  assert.ok(Math.abs(slow.x - fast.x) < .025)
  assert.ok(Math.abs(slow.z - fast.z) < .025)
  const swing = createCarrySwing()
  for (let i = 0; i < 30; i++) advanceCarrySwing(swing, 1e6, -1e6, 2)
  assert.ok(Number.isFinite(swing.x) && Number.isFinite(swing.z))
  assert.ok(Math.abs(swing.x) <= .6 && Math.abs(swing.z) <= .8)
})
