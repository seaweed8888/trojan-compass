import { useAnimations, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useMemo } from 'react'
import { AnimationClip, LoopOnce, LoopRepeat, Mesh } from 'three'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { DANGLE_CLIP } from '../../lib/mascot-motion'

// Exaggerated to twice human scale so the location marker stays visible.
export const TOMMY_MODEL_HEIGHT = 2.35
export const TOMMY_HEIGHT_METERS = 4.1
export const TOMMY_NAPE: [number, number, number] = [0, 1.14, -0.07]
// useGLTF caches by URL; the asset hash makes a rebuilt sculpt load in existing tabs.
const MODEL = '/models/tommy-trojan.glb?v=d1288b1f0d8e'
const CARRY_ANIMATIONS = [DANGLE_CLIP]
let dances: Promise<AnimationClip[]> | undefined
function loadDances() {
  return dances ??= fetch('/models/trojan-dances.json?v=6a75a17c4139').then(async response => {
    if (!response.ok) throw new Error('Could not load guide dances')
    return (await response.json()).map((clip: Parameters<typeof AnimationClip.parse>[0]) => AnimationClip.parse(clip)) as AnimationClip[]
  }).catch(error => { dances = undefined; throw error })
}
export interface GuideDance { index: number; token: number }

function Mascot({ carried, dance, onDanceEnd }: { carried: boolean; dance?: GuideDance; onDanceEnd?: (token: number, failed?: boolean) => void }) {
  const { scene } = useGLTF(MODEL)
  const model = useMemo(() => {
    const clone = cloneSkeleton(scene)
    clone.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true
        // Let the visible guide receive gestures through transparent ghost floors.
        object.userData.locationGuide = true
      }
    })
    return clone
  }, [scene])
  const { actions, mixer } = useAnimations(CARRY_ANIMATIONS, model)
  useEffect(() => {
    const action = actions.NapeDangle
    if (!carried || !action) return
    action.reset().fadeIn(.18).play()
    return () => { action.stop() }
  }, [actions, carried])
  useEffect(() => {
    if (!dance || carried) return
    let cancelled = false
    let action: ReturnType<typeof mixer.clipAction> | undefined
    let fadeTimer: ReturnType<typeof setTimeout> | undefined
    let stopTimer: ReturnType<typeof setTimeout> | undefined
    loadDances().then(clips => {
      if (cancelled) return
      const clip = clips[dance.index]
      if (!clip) throw new Error('Missing guide dance')
      const repeats = dance.index === 0 ? 3 : 1
      action = mixer.clipAction(clip, model)
      action.reset().setLoop(repeats > 1 ? LoopRepeat : LoopOnce, repeats)
      action.clampWhenFinished = true
      action.fadeIn(.2).play()
      fadeTimer = setTimeout(() => {
        action?.fadeOut(.25)
        stopTimer = setTimeout(() => { action?.stop(); onDanceEnd?.(dance.token) }, 270)
      }, clip.duration * repeats * 1000)
    }).catch(() => { if (!cancelled) onDanceEnd?.(dance.token, true) })
    return () => { cancelled = true; clearTimeout(fadeTimer); clearTimeout(stopTimer); action?.stop() }
  }, [dance, carried, mixer, model, onDanceEnd])
  return <primitive object={model} dispose={null} />
}

export function TommyTrojanModel({ carried = false, dance, onDanceEnd }: { carried?: boolean; dance?: GuideDance; onDanceEnd?: (token: number, failed?: boolean) => void }) {
  return <Suspense fallback={null}><Mascot carried={carried} dance={dance} onDanceEnd={onDanceEnd} /></Suspense>
}
