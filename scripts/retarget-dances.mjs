// Bake only motion from the supplied GLBs; source meshes/textures never ship.
// Run from the repository root: node scripts/retarget-dances.mjs /path/to/source-dances
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
import { AnimationClip, AnimationMixer, Group, Matrix4, Quaternion, QuaternionKeyframeTrack, Vector3, VectorKeyframeTrack } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const files = ['banana_fortnite.glb', 'fortnite_dj.glb', 'fortnite_frozen_nog_ops_with_old_school_emote.glb']
const names = ['Banana dance', 'DJ dance', 'Old School']
const targetBytes = readFileSync('web/public/models/tommy-trojan.glb')
const target = await new GLTFLoader().parseAsync(targetBytes.buffer.slice(targetBytes.byteOffset, targetBytes.byteOffset + targetBytes.byteLength), '')
const bones = {}; const meshes = []
target.scene.traverse(o => { if (o.isBone) bones[o.name] = o; if (o.isSkinnedMesh) meshes.push(o) })
target.scene.updateMatrixWorld(true)
const rests = Object.fromEntries(Object.entries(bones).map(([name, bone]) => [name, { position: bone.position.clone(), quaternion: bone.quaternion.clone(), world: bone.getWorldPosition(new Vector3()) }]))
assert.equal(Object.keys(bones).length, 14)
const position = o => o.getWorldPosition(new Vector3())
const rotation = o => o.getWorldQuaternion(new Quaternion())
const output = []

function sourceRig(file) {
  const bytes = readFileSync(file)
  const jsonSize = bytes.readUInt32LE(12)
  const g = JSON.parse(bytes.toString('utf8', 20, 20 + jsonSize))
  const binary = bytes.subarray(28 + jsonSize)
  const components = { SCALAR: 1, VEC3: 3, VEC4: 4, MAT4: 16 }
  function values(index) {
    const a = g.accessors[index], v = g.bufferViews[a.bufferView], size = components[a.type]
    assert.equal(a.componentType, 5126)
    assert.ok(!a.sparse)
    const start = (v.byteOffset ?? 0) + (a.byteOffset ?? 0)
    return Float32Array.from({ length: a.count * size }, (_, i) => binary.readFloatLE(start + Math.floor(i / size) * (v.byteStride ?? size * 4) + i % size * 4))
  }
  const nodes = g.nodes.map(n => {
    const o = new Group(); o.name = n.name ?? ''
    if (n.matrix) new Matrix4().fromArray(n.matrix).decompose(o.position, o.quaternion, o.scale)
    else { if (n.translation) o.position.fromArray(n.translation); if (n.rotation) o.quaternion.fromArray(n.rotation); if (n.scale) o.scale.fromArray(n.scale) }
    return o
  })
  const root = new Group()
  g.nodes.forEach((n, i) => (n.children ?? []).forEach(child => nodes[i].add(nodes[child])))
  nodes.filter(o => !o.parent).forEach(o => root.add(o)); root.updateMatrixWorld(true)
  // Node defaults can be an arbitrary animation pose; inverse binds define the real rest pose.
  const bindWorld = new Map()
  g.skins.forEach(skin => {
    const matrices = values(skin.inverseBindMatrices)
    skin.joints.forEach((joint, i) => bindWorld.set(nodes[joint], new Matrix4().fromArray(matrices, i * 16).invert()))
  })
  root.traverse(node => {
    const world = bindWorld.get(node)
    if (world) node.parent.matrixWorld.clone().invert().multiply(world).decompose(node.position, node.quaternion, node.scale)
    node.updateWorldMatrix(false, false)
  })
  const anim = g.animations[0]; assert.ok(anim)
  const tracks = anim.channels.map(c => {
    const sampler = anim.samplers[c.sampler]
    assert.ok(!sampler.interpolation || sampler.interpolation === 'LINEAR')
    const path = { translation: 'position', rotation: 'quaternion', scale: 'scale' }[c.target.path]
    const Track = c.target.path === 'rotation' ? QuaternionKeyframeTrack : VectorKeyframeTrack
    return new Track(`${nodes[c.target.node].uuid}.${path}`, values(sampler.input), values(sampler.output))
  })
  const joint = prefix => { const result = nodes.find(o => o.name.startsWith(prefix)); assert.ok(result, prefix); return result }
  return { root, nodes, joint, clip: new AnimationClip(anim.name, -1, tracks) }
}

for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
  const source = sourceRig(resolve(process.argv[2] ?? '.', files[fileIndex]))
  const s = {
    Hips: source.joint('pelvis_'), Head: source.joint('head_'),
    Spine: source.joint('head_').parent,
  }
  while (!/^spine_/.test(s.Spine.name)) { s.Spine = s.Spine.parent; assert.ok(s.Spine, 'Missing upper spine') }
  // Guide L/R names use screen sides; the source rigs use anatomical left/right.
  for (const [side, suffix] of [['L', 'r_'], ['R', 'l_']]) {
    for (const [name, prefix] of [['Arm', 'upperarm_'], ['Forearm', 'lowerarm_'], ['Hand', 'hand_'], ['Leg', 'thigh_'], ['Shin', 'calf_'], ['Foot', 'foot_']]) s[name + side] = source.joint(prefix + suffix)
  }
  // Old School stores Z-up animation tracks against a Y-up inverse-bind skeleton.
  const axisCorrection = fileIndex === 2 ? new Matrix4().makeRotationX(Math.PI / 2) : new Matrix4()
  const mixer = new AnimationMixer(source.root)
  const right = position(s.LegR).sub(position(s.LegL)).transformDirection(axisCorrection)
  const up = position(s.Head).sub(position(s.Hips)).transformDirection(axisCorrection)
  const forward = new Vector3().crossVectors(right, up).normalize()
  up.crossVectors(forward, right).normalize()
  const align = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, up, forward)).invert()
  const toeDirection = position(source.joint('ball_l_')).sub(position(source.joint('foot_l_'))).transformDirection(axisCorrection).applyQuaternion(align)
  assert.ok(toeDirection.z > 0, 'Source feet must face the same +Z direction as the guide')
  const axisRotation = new Quaternion().setFromRotationMatrix(new Matrix4().extractRotation(axisCorrection))
  const sourceRest = Object.fromEntries(Object.entries(s).map(([name, bone]) => [name, align.clone().multiply(axisRotation).multiply(rotation(bone))]))
  const chains = { ArmL: ['ArmL','ForearmL'], ForearmL: ['ForearmL','HandL'], ArmR: ['ArmR','ForearmR'], ForearmR: ['ForearmR','HandR'], LegL: ['LegL','ShinL'], ShinL: ['ShinL','FootL'], LegR: ['LegR','ShinR'], ShinR: ['ShinR','FootR'] }
  const ends = { ForearmL: new Vector3(-.36,.55,0), ForearmR: new Vector3(.36,.55,0) }
  const restDirection = Object.fromEntries(Object.entries(chains).map(([name, [, end]]) => [name, (rests[end]?.world ?? ends[name]).clone().sub(rests[name].world).normalize()]))
  mixer.clipAction(source.clip).play()
  const frames = Math.ceil(source.clip.duration * 30)
  const times = Array.from({ length: frames + 1 }, (_, i) => i * source.clip.duration / frames)
  const samples = []; let lowestSourceFoot = Infinity
  const sourceLegLength = position(s.LegL).distanceTo(position(s.ShinL)) + position(s.ShinL).distanceTo(position(s.FootL))
  const heightScale = .48 / sourceLegLength
  for (const time of times) {
    mixer.setTime(Math.min(time, source.clip.duration - .00001)); source.root.updateMatrixWorld(true)
    const footHeight = Math.min(position(s.FootL).applyQuaternion(align).y, position(s.FootR).applyQuaternion(align).y)
    lowestSourceFoot = Math.min(lowestSourceFoot, footHeight)
    const pose = {}
    for (const name of ['Hips','Spine','Head','FootL','FootR']) {
      const q = align.clone().multiply(rotation(s[name])).multiply(sourceRest[name].clone().invert()).normalize()
      pose[name] = q
    }
    // Anatomical frames avoid exporter-specific bone axes flipping an upright torso.
    function bodyFrame(left, right, bottom, top) {
      const x = position(right).sub(position(left)).normalize()
      const y = position(top).sub(position(bottom)).normalize()
      const z = new Vector3().crossVectors(x, y).normalize()
      x.crossVectors(y, z).normalize()
      return align.clone().multiply(new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z)))
    }
    pose.Hips = bodyFrame(s.LegL, s.LegR, s.Hips, s.Spine)
    pose.Spine = bodyFrame(s.ArmL, s.ArmR, s.Spine, s.Head)
    // The neckless guide's helmet follows the chest through floor spins.
    pose.Head = pose.Spine.clone()
    for (const [name, [start, end]] of Object.entries(chains)) {
      const direction = position(s[end]).sub(position(s[start])).applyQuaternion(align).normalize()
      pose[name] = new Quaternion().setFromUnitVectors(restDirection[name], direction)
    }
    samples.push({ pose, footHeight })
  }
  const rotations = Object.fromEntries(Object.keys(bones).filter(n => n !== 'Root').map(n => [n, []]))
  const rootPositions = []
  for (const sample of samples) {
    for (const [name, bone] of Object.entries(bones)) { bone.position.copy(rests[name].position); bone.quaternion.copy(rests[name].quaternion) }
    target.scene.updateMatrixWorld(true)
    // Parent-first conversion preserves the target's bind pose and segment lengths.
    for (const name of ['Hips','Spine','Head','ArmL','ForearmL','ArmR','ForearmR','LegL','ShinL','FootL','LegR','ShinR','FootR']) {
      const bone = bones[name]
      bone.quaternion.copy(rotation(bone.parent).invert().multiply(sample.pose[name])).normalize()
      bone.updateWorldMatrix(false, true)
      const values = rotations[name]
      if (values.length && new Quaternion().fromArray(values, values.length - 4).dot(bone.quaternion) < 0) bone.quaternion.set(-bone.quaternion.x,-bone.quaternion.y,-bone.quaternion.z,-bone.quaternion.w)
      values.push(...bone.quaternion.toArray())
    }
    let minY = Infinity
    for (const mesh of meshes) {
      mesh.skeleton.update()
      const positions = mesh.geometry.attributes.position
      for (let i = 0; i < positions.count; i++) {
        const p = mesh.applyBoneTransform(i, new Vector3().fromBufferAttribute(positions, i)).applyMatrix4(mesh.matrixWorld)
        assert.ok(p.toArray().every(Number.isFinite))
        minY = Math.min(minY, p.y)
      }
    }
    const lift = Math.min(.16, Math.max(0, (sample.footHeight - lowestSourceFoot) * heightScale))
    rootPositions.push(0, -minY + lift, 0)
  }
  const tracks = Object.entries(rotations).map(([name, values]) => new QuaternionKeyframeTrack(`${name}.quaternion`, times, values))
  tracks.push(new VectorKeyframeTrack('Root.position', times, rootPositions))
  const clip = new AnimationClip(names[fileIndex], source.clip.duration, tracks)
  // Keep interpolated spins above the floor too, not just the baked keyframes.
  for (const [name, bone] of Object.entries(bones)) { bone.position.copy(rests[name].position); bone.quaternion.copy(rests[name].quaternion) }
  const preview = new AnimationMixer(target.scene)
  const rootTrack = tracks.at(-1)
  preview.clipAction(clip).play()
  for (let pass = 0; pass < 2; pass++) {
    const corrections = times.map(() => 0)
    for (let frame = 0; frame < frames; frame++) for (const fraction of [.25, .5, .75]) {
      preview.setTime(times[frame] + (times[frame + 1] - times[frame]) * fraction)
      target.scene.updateMatrixWorld(true)
      let minimum = Infinity
      for (const mesh of meshes) {
        mesh.skeleton.update()
        const positions = mesh.geometry.attributes.position
        for (let i = 0; i < positions.count; i++) minimum = Math.min(minimum, mesh.applyBoneTransform(i, new Vector3().fromBufferAttribute(positions, i)).applyMatrix4(mesh.matrixWorld).y)
      }
      const correction = Math.max(0, .004 - minimum)
      corrections[frame] = Math.max(corrections[frame], correction)
      corrections[frame + 1] = Math.max(corrections[frame + 1], correction)
    }
    corrections.forEach((correction, frame) => { rootTrack.values[frame * 3 + 1] += correction })
  }
  preview.stopAllAction()
  output.push(AnimationClip.toJSON(clip))
  console.log(`${files[fileIndex]} -> ${clip.name}: ${clip.duration.toFixed(2)}s, ${frames + 1} frames, ${tracks.length} tracks`)
}
const json = JSON.stringify(output, (_, value) => typeof value === 'number' ? Math.round(value * 100000) / 100000 : value)
assert.ok(json.length < 450000, 'Animation download exceeds budget')
writeFileSync('web/public/models/trojan-dances.json', json)
console.log(`Animation-only download: ${json.length} bytes`)
