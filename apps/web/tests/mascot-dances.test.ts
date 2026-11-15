import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { AnimationClip, AnimationMixer, Quaternion, SkinnedMesh, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

test('all three dances bind to the guide without changing limb lengths or breaking the skin', async () => {
  const bytes = readFileSync(new URL('../public/models/tommy-trojan.glb', import.meta.url))
  const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  const data = readFileSync(new URL('../public/models/trojan-dances.json', import.meta.url), 'utf8')
  assert.ok(data.length < 350_000)
  const clips = JSON.parse(data).map((clip: Parameters<typeof AnimationClip.parse>[0]) => AnimationClip.parse(clip)) as AnimationClip[]
  assert.equal(clips.length, 3)
  const meshes: SkinnedMesh[] = []
  scene.traverse(object => { if ((object as SkinnedMesh).isSkinnedMesh) meshes.push(object as SkinnedMesh) })
  const mixer = new AnimationMixer(scene)
  for (const clip of clips) {
    assert.ok(clip.duration > 1 && clip.duration < 11)
    for (const track of clip.tracks) {
      assert.ok(track.name === 'Root.position' || track.name.endsWith('.quaternion'))
      assert.ok(scene.getObjectByName(track.name.split('.')[0]!))
      assert.ok(Array.from(track.values).every(Number.isFinite))
      if (track.name.endsWith('.quaternion')) for (let i = 0; i < track.values.length; i += 4) {
        assert.ok(Math.abs(Math.hypot(...track.values.slice(i, i + 4)) - 1) < .00003)
        if (track.name === 'Head.quaternion') {
          const neckAngle = 2 * Math.acos(Math.min(1, Math.abs(track.values[i + 3]!)))
          assert.ok(neckAngle < Math.PI * .56, 'Head must follow the torso through spins, without a reversed neck')
        }
      }
    }
    mixer.clipAction(clip).play()
    for (let time = 0; time < clip.duration; time += 1 / 15) {
      mixer.setTime(time); scene.updateMatrixWorld(true)
      if (clip.name === 'Old School') {
        const torso = scene.getObjectByName('Spine')!
        const up = new Vector3(0, 1, 0).applyQuaternion(torso.getWorldQuaternion(new Quaternion()))
        assert.ok(up.y > .4, 'Old School is an upright running dance, not a sideways floor spin')
      }
      for (const mesh of meshes) {
        mesh.skeleton.update()
        const positions = mesh.geometry.attributes.position
        assert.ok(positions)
        for (let i = 0; i < positions.count; i++) {
          const point = mesh.applyBoneTransform(i, new Vector3().fromBufferAttribute(positions, i)).applyMatrix4(mesh.matrixWorld)
          assert.ok(point.toArray().every(Number.isFinite))
          assert.ok(point.length() < 4, 'Skinned vertex escaped the guide bounds')
          assert.ok(point.y > -.035, `${clip.name} at ${time}: y=${point.y}`)
        }
      }
    }
    mixer.stopAllAction()
    for (const mesh of meshes) for (const bone of mesh.skeleton.bones) {
      assert.ok(Math.abs(bone.quaternion.w) > .999, 'Stopping the dance restores the rest pose')
      assert.deepEqual(bone.scale.toArray(), [1, 1, 1])
    }
  }
})

