import { AnimationClip, Euler, MathUtils, Quaternion, QuaternionKeyframeTrack } from 'three'

// Authored looping poses: five pivots, no simulation or extra animation download.
const TIMES = [0, .35, .75, 1.2, 1.65, 2.05, 2.4]
const POSES: Record<string, [number, number, number][]> = {
  Head: [[.58, 0, -.05], [.72, .03, .04], [.62, -.02, -.03], [.82, .02, .06], [.65, -.03, -.04], [.76, .02, .02], [.58, 0, -.05]],
  ArmL: [[.08, 0, -.12], [.26, .08, -.22], [-.14, -.06, .08], [.17, .04, -.06], [-.22, -.08, .12], [.22, .06, -.19], [.08, 0, -.12]],
  ArmR: [[-.10, 0, .14], [-.22, -.06, -.08], [.20, .09, .23], [-.05, -.03, .05], [.27, .06, .17], [-.18, -.08, -.06], [-.10, 0, .14]],
  LegL: [[.09, 0, -.06], [-.18, .05, -.11], [.25, -.04, .04], [-.10, .03, -.08], [.18, -.05, .02], [-.16, .04, -.10], [.09, 0, -.06]],
  LegR: [[-.12, 0, .06], [.24, -.04, .10], [-.16, .05, -.03], [.18, -.03, .07], [-.20, .04, -.02], [.17, -.05, .09], [-.12, 0, .06]],
}
export const DANGLE_CLIP = new AnimationClip('NapeDangle', 2.4, Object.entries(POSES).map(([name, poses]) =>
  new QuaternionKeyframeTrack(`${name}.quaternion`, TIMES, poses.flatMap(([x, y, z]) => new Quaternion().setFromEuler(new Euler(x, y, z)).toArray())),
))

export function createCarrySwing() {
  return { x: 0, z: 0, dx: 0, dz: 0, vx: 0, vz: 0 }
}

// A bounded two-axis spring adds drag inertia around the fixed neck anchor.
export function advanceCarrySwing(state: ReturnType<typeof createCarrySwing>, velocityX: number, velocityZ: number, delta: number) {
  const dt = Math.min(Math.max(delta, 0), .1)
  if (!dt) return
  const smoothing = 1 - Math.exp(-12 * dt)
  state.vx += (MathUtils.clamp(velocityX, -25, 25) - state.vx) * smoothing
  state.vz += (MathUtils.clamp(velocityZ, -25, 25) - state.vz) * smoothing
  const targetX = MathUtils.clamp(state.vz * .035, -.45, .45)
  const targetZ = MathUtils.clamp(-state.vx * .045, -.65, .65)
  const steps = Math.ceil(dt * 120)
  const step = dt / steps
  for (let i = 0; i < steps; i++) {
    state.dx += ((targetX - state.x) * 42 - state.dx * 7.6) * step
    state.dz += ((targetZ - state.z) * 42 - state.dz * 7.6) * step
    state.x = MathUtils.clamp(state.x + state.dx * step, -.6, .6)
    state.z = MathUtils.clamp(state.z + state.dz * step, -.8, .8)
  }
}
