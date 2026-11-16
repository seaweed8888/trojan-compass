import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('the Trojan guide stays within the map rendering budget and retains his carrying pivots', () => {
  const file = readFileSync(new URL('../public/models/tommy-trojan.glb', import.meta.url))
  assert.equal(file.toString('ascii', 0, 4), 'glTF')
  assert.equal(file.readUInt32LE(4), 2)
  assert.ok(file.length < 200_000, 'The guide must remain below 200 KB')
  const revision = createHash('sha256').update(file).digest('hex').slice(0, 12)
  const viewer = readFileSync(new URL('../src/features/map/renderer/TommyTrojanModel.tsx', import.meta.url), 'utf8')
  assert.ok(viewer.includes(`/models/tommy-trojan.glb?v=${revision}`), 'Update the viewer asset hash after rebuilding Tommy')
  const gltf = JSON.parse(file.toString('utf8', 20, 20 + file.readUInt32LE(12)))
  const primitives = gltf.meshes.flatMap((mesh: { primitives: { indices: number }[] }) => mesh.primitives)
  const triangles = primitives.reduce((sum: number, primitive: { indices: number }) => sum + gltf.accessors[primitive.indices].count / 3, 0)
  assert.ok(triangles < 6_000, `${triangles} triangles exceeds the map budget`)
  assert.equal(gltf.meshes.length, 1, 'The guide must be one skinned model')
  assert.equal(primitives.length, 2, 'Only the matte and bronze finishes need separate draws')
  assert.equal(gltf.skins.length, 1)
  assert.equal(gltf.skins[0].joints.length, 14, 'Dance rig includes hips, spine, elbows, knees, and feet')
  for (const primitive of primitives) {
    assert.ok('JOINTS_0' in primitive.attributes && 'WEIGHTS_0' in primitive.attributes, 'The continuous surface must deform with the skeleton')
  }
  assert.equal(gltf.materials.length, 2, 'Matte figure and bronze helmet share vertex colors without textures')
  assert.ok(!gltf.textures?.length, 'The helmet must not add texture downloads')
  for (const name of ['Head', 'ArmL', 'ArmR', 'LegL', 'LegR']) {
    assert.ok(gltf.nodes.some((node: { name: string }) => node.name === name), `Missing ${name} pivot`)
  }
})
