// Preserved prototype logic; not the canonical HTTP contract. See docs/migration.md.
import { BUILDING_BY_CODE, type BuildingCode } from '../../../infrastructure/datasets/prototype/campus.js'
import {
  accessibleEntrancePlace,
  cellCenter,
  cellTitle,
  entrancePlace,
  floorName,
  floorY,
  getLayout,
  getLevels,
  isStepFreeEntrance,
  metersPerUnit,
  type Place,
} from '../../../infrastructure/datasets/prototype/floorplan.js'

export type RouteMode = 'fastest' | 'stairs' | 'elevator'

export const MODE_LABELS: Record<RouteMode, string> = {
  fastest: 'Fastest',
  stairs: 'Stairs',
  elevator: 'Elevator · demo route',
}

type NodeKind = 'corridor' | 'door' | 'room' | 'stairs' | 'elevator' | 'restroom' | 'entrance'

interface GNode {
  id: string
  x: number
  z: number
  floor: number
  kind: NodeKind
  label?: string
  title?: string
  stepFree?: boolean
  inferred?: boolean
}
interface GEdge {
  to: string
  w: number
  type: 'walk' | 'stairs' | 'elevator'
}
interface Graph {
  nodes: Map<string, GNode>
  adj: Map<string, GEdge[]>
}

const graphs = new Map<BuildingCode, Graph>()

function buildGraph(code: BuildingCode): Graph {
  const nodes = new Map<string, GNode>()
  const adj = new Map<string, GEdge[]>()
  const add = (n: GNode) => {
    nodes.set(n.id, n)
    adj.set(n.id, [])
  }
  const link = (a: string, b: string, type: GEdge['type'] = 'walk', w?: number) => {
    const na = nodes.get(a)!
    const nb = nodes.get(b)!
    const d = w ?? Math.hypot(na.x - nb.x, na.z - nb.z)
    adj.get(a)!.push({ to: b, w: d, type })
    adj.get(b)!.push({ to: a, w: d, type })
  }
  const cores = new Map<string, { floor: number; node: string; kind: 'stairs' | 'elevator' }[]>()
  for (const f of getLevels(code)) {
    const L = getLayout(code, f)
    for (const n of L.walkNodes) add({ ...n, floor: f, kind: 'corridor' })
    for (const [a, b] of L.walkEdges) link(a, b)
    const walk = L.walkNodes
    const nearest = (x: number, z: number) => {
      let best = walk[0]
      if (!best) throw new Error(`No walk nodes configured for ${code}`)
      let bd = Infinity
      for (const n of walk) {
        const d = Math.hypot(n.x - x, n.z - z)
        if (d < bd) {
          bd = d
          best = n
        }
      }
      return best.id
    }
    for (const c of L.cells) {
      if (c.kind === 'block') continue
      const [x, z] = cellCenter(c)
      add({ id: c.node, x, z, floor: f, kind: c.kind, label: c.name, title: cellTitle(c), inferred: c.evidence?.positionStatus === 'inferred' })
      const door = `${c.node}:door`
      add({ id: door, x: c.door[0], z: c.door[1], floor: f, kind: 'door' })
      // Elevator access includes a wait penalty so short trips prefer stairs in "fastest".
      link(c.node, door, 'walk', Math.hypot(x - c.door[0], z - c.door[1]) + (c.kind === 'elevator' ? 3 : 0))
      link(door, nearest(c.door[0], c.door[1]))
      if (c.core && (c.kind === 'stairs' || c.kind === 'elevator')) {
        const list = cores.get(c.core) ?? []
        list.push({ floor: f, node: c.node, kind: c.kind })
        cores.set(c.core, list)
      }
    }
    for (const e of L.entrances) {
      add({ id: e.id, x: e.x, z: e.z, floor: f, kind: 'entrance', label: e.label, stepFree: e.stepFree, inferred: e.evidence?.positionStatus === 'inferred' })
      link(e.id, nearest(e.x, e.z))
    }
  }
  const levels = getLevels(code)
  for (const list of cores.values()) {
    list.sort((a, b) => a.floor - b.floor)
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1]!
      const b = list[i]!
      if (levels.indexOf(b.floor) - levels.indexOf(a.floor) !== 1) continue
      link(a.node, b.node, a.kind, a.kind === 'stairs' ? 7 : 2)
    }
  }
  return { nodes, adj }
}

function graphFor(code: BuildingCode) {
  let g = graphs.get(code)
  if (!g) {
    g = buildGraph(code)
    graphs.set(code, g)
  }
  return g
}

function shortestPath(code: BuildingCode, from: string, to: string, mode: RouteMode): GNode[] {
  const g = graphFor(code)
  if (!g.nodes.has(from) || !g.nodes.has(to)) return []
  const dist = new Map<string, number>([[from, 0]])
  const prev = new Map<string, string>()
  const open = new Set<string>([from])
  const done = new Set<string>()
  while (open.size) {
    let cur = ''
    let best = Infinity
    for (const id of open) {
      const d = dist.get(id)!
      if (d < best) {
        best = d
        cur = id
      }
    }
    open.delete(cur)
    if (cur === to) break
    done.add(cur)
    for (const e of g.adj.get(cur) ?? []) {
      if (done.has(e.to)) continue
      if (mode === 'stairs' && e.type === 'elevator') continue
      if (mode === 'elevator' && e.type === 'stairs') continue
      const nd = best + e.w
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd)
        prev.set(e.to, cur)
        open.add(e.to)
      }
    }
  }
  const path: GNode[] = []
  let c: string | undefined = to
  while (c) {
    path.unshift(g.nodes.get(c)!)
    if (c === from) break
    c = prev.get(c)
  }
  return path[0]?.id === from ? path : []
}

export type StepIcon = 'start' | 'walk' | 'stairs' | 'elevator' | 'arrive' | 'outdoor' | 'exit'

export interface Step {
  icon: StepIcon
  text: string
  building?: BuildingCode
  floor?: number
}

export interface IndoorLeg {
  kind: 'indoor'
  building: BuildingCode
  points: { x: number; y: number; z: number; floor: number }[]
  floors: number[]
}
export interface OutdoorLeg {
  kind: 'outdoor'
  from: BuildingCode
  to: BuildingCode
  points: [number, number][]
}
export type Leg = IndoorLeg | OutdoorLeg

export interface Route {
  from: Place
  to: Place
  mode: RouteMode
  legs: Leg[]
  steps: Step[]
  meters: number
  seconds: number
  usesElevator: boolean
  usesStairs: boolean
  /** True when the route enters or exits through a door with steps. */
  entranceSteps: boolean
  /** Any reconstructed indoor leg, or the unverified outdoor connector. */
  inferred: boolean
  accessibilityStatus: 'inferred' | 'existing-demo'
}

const CAMPUS_METERS_PER_UNIT = 6
const floorPhrase = (f: number, code: BuildingCode) => f === 0 ? 'the basement' : floorName(f, code).toLowerCase()

function describeIndoor(code: BuildingCode, path: GNode[], steps: Step[]) {
  const g = graphFor(code)
  const mpu = metersPerUnit(code)
  let meters = 0
  let seconds = 0
  let usesElevator = false
  let usesStairs = false
  let lastDir: [number, number] | null = null
  const first = path[0]!
  const last = path[path.length - 1]!

  if (first.kind === 'entrance') {
    steps.push({
      icon: 'start',
      text: `Enter ${code} through the ${first.label}${first.inferred ? ' (position and accessibility inferred)' : first.stepFree ? ' (step-free)' : ' (has steps)'}.`,
      building: code,
      floor: first.floor,
    })
  } else if (first.kind === 'room') {
    steps.push({ icon: 'start', text: `Leave ${first.title} and step into the corridor.`, building: code, floor: first.floor })
  } else {
    steps.push({ icon: 'start', text: `Start at the ${first.label?.toLowerCase()} on ${floorPhrase(first.floor, code)}.`, building: code, floor: first.floor })
  }

  // Restroom and elevator doors on a floor, used as "passing the ..." landmarks.
  const doorsOf = (kind: 'restroom' | 'elevator', floor: number) =>
    [...g.nodes.values()].filter((n) => n.kind === kind && n.floor === floor).map((n) => g.nodes.get(`${n.id}:door`)!)

  let i = 0
  while (i < path.length - 1) {
    const a = path[i]!
    const b = path[i + 1]!
    if (a.floor !== b.floor) {
      let j = i + 1
      while (j < path.length - 1 && path[j + 1]!.floor !== path[j]!.floor) j++
      const end = path[j]!
      const n = Math.abs(end.floor - a.floor)
      const dir = end.floor > a.floor ? 'up' : 'down'
      if (a.kind === 'elevator') {
        usesElevator = true
        seconds += 35 + n * 6
        steps.push({ icon: 'elevator', text: `Take the ${a.inferred ? 'inferred ' : ''}${a.label?.toLowerCase()} ${dir} to ${floorPhrase(end.floor, code)}.`, building: code, floor: end.floor })
      } else {
        usesStairs = true
        seconds += n * 18
        steps.push({ icon: 'stairs', text: `Take the ${a.inferred ? 'inferred ' : ''}${a.label?.toLowerCase()} ${dir} ${n} ${n > 1 ? 'flights' : 'flight'} to ${floorPhrase(end.floor, code)}.`, building: code, floor: end.floor })
      }
      lastDir = null
      i = j
      continue
    }
    let j = i
    let dist = 0
    while (j < path.length - 1 && path[j + 1]!.floor === path[j]!.floor) {
      dist += Math.hypot(path[j + 1]!.x - path[j]!.x, path[j + 1]!.z - path[j]!.z)
      j++
    }
    const run = path.slice(i, j + 1)
    const corridor = run.filter((n) => n.kind === 'corridor')
    const m = Math.round(dist * mpu)
    meters += m
    seconds += m / 1.3
    if (corridor.length >= 2) {
      const c1 = corridor[corridor.length - 1]!
      const c0 = corridor[corridor.length - 2]!
      lastDir = [c1.x - c0.x, c1.z - c0.z]
      const target = run[run.length - 1]!
      const toward =
        target.kind === 'stairs'
          ? ` to the ${target.label?.toLowerCase()}`
          : target.kind === 'elevator'
            ? ` to the ${target.label?.toLowerCase()}`
            : target.kind === 'entrance'
              ? ` to the ${target.label}`
              : ''
      const near = (kind: 'restroom' | 'elevator') =>
        target.kind !== kind &&
        doorsOf(kind, a.floor).some((d) => corridor.slice(1, -1).some((c) => Math.hypot(c.x - d.x, c.z - d.z) < 2.2))
      const passing = near('restroom') ? ', passing the restrooms' : near('elevator') ? ', passing the elevators' : ''
      steps.push({
        icon: 'walk',
        text: `Follow the corridor for about ${Math.max(m, 4)} m${toward}${passing}.`,
        building: code,
        floor: a.floor,
      })
    }
    i = j
  }

  if (last.kind === 'entrance') {
    steps.push({ icon: 'exit', text: `Exit ${code} through the ${last.label}${last.inferred ? ' (position and exit suitability inferred)' : last.stepFree ? '' : ' (has steps)'}.`, building: code, floor: last.floor })
  } else {
    let where = 'straight ahead'
    const lastCorr = [...path].reverse().find((n) => n.kind === 'corridor')
    if (lastDir && lastCorr) {
      const r: [number, number] = [last.x - lastCorr.x, last.z - lastCorr.z]
      const len = Math.hypot(...lastDir) * Math.hypot(...r) || 1
      const cross = (lastDir[0] * r[1] - lastDir[1] * r[0]) / len
      if (cross > 0.35) where = 'on your right'
      else if (cross < -0.35) where = 'on your left'
    }
    const name =
      last.kind === 'room'
        ? `${last.title}${last.title?.endsWith(last.label ?? '') ? '' : ` (${last.label})`} is`
        : last.kind === 'restroom'
          ? 'The restrooms are'
          : `The ${last.label?.toLowerCase()} ${last.label?.endsWith('s') ? 'are' : 'is'}`
    steps.push({ icon: 'arrive', text: `${name} ${where}.`, building: code, floor: last.floor })
  }
  return { meters, seconds, usesElevator, usesStairs }
}

function toLeg(code: BuildingCode, path: GNode[]): IndoorLeg {
  return {
    kind: 'indoor',
    building: code,
    points: path.map((n) => ({ x: n.x, z: n.z, y: floorY(n.floor), floor: n.floor })),
    floors: [...new Set(path.map((n) => n.floor))],
  }
}

export function computeRoute(from: Place, to: Place, mode: RouteMode): Route | null {
  const steps: Step[] = []
  const legs: Leg[] = []
  let meters = 0
  let seconds = 0
  let usesElevator = false
  let usesStairs = false
  let entranceSteps = false
  const indoor = (code: BuildingCode, a: string, b: string) => {
    if (a === b) return true
    const path = shortestPath(code, a, b, mode)
    if (!path.length) return false
    const r = describeIndoor(code, path, steps)
    meters += r.meters
    seconds += r.seconds
    usesElevator ||= r.usesElevator
    usesStairs ||= r.usesStairs
    for (const n of [path[0], path[path.length - 1]]) if (n?.kind === 'entrance' && !n.stepFree) entranceSteps = true
    legs.push(toLeg(code, path))
    return true
  }
  const doorFor = (code: BuildingCode) => (mode === 'elevator' ? accessibleEntrancePlace(code) : entrancePlace(code)).node

  if (from.building === to.building && from.node === to.node) {
    const path = shortestPath(from.building, from.node, to.node, mode)
    if (!path.length) return null
    steps.push({ icon: 'arrive', text: `You are already at ${to.label}.`, building: to.building, floor: to.floor })
    legs.push(toLeg(to.building, path))
  } else if (from.building === to.building) {
    if (!indoor(from.building, from.node, to.node)) return null
  } else {
    const entA = from.kind === 'entrance' ? from.node : doorFor(from.building)
    const entB = to.kind === 'entrance' ? to.node : doorFor(to.building)
    if (!indoor(from.building, from.node, entA)) return null
    if (from.node === entA && !isStepFreeEntrance(entA)) entranceSteps = true
    const A = BUILDING_BY_CODE[from.building]
    const B = BUILDING_BY_CODE[to.building]
    const pts: [number, number][] = [A.position, [A.position[0], 10], [B.position[0], 10], B.position]
    let len = 0
    for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k]![0] - pts[k - 1]![0], pts[k]![1] - pts[k - 1]![1])
    const m = Math.round(len * CAMPUS_METERS_PER_UNIT)
    meters += m
    seconds += m / 1.3
    legs.push({ kind: 'outdoor', from: from.building, to: to.building, points: pts })
    steps.push({
      icon: 'outdoor',
      text: `Walk about ${m} m (${Math.max(1, Math.round(m / 80))} min) via Childs Way to ${B.name} (${B.code}). Outdoor path and accessibility are inferred.`,
    })
    if (!indoor(to.building, entB, to.node)) return null
    if (to.node === entB && !isStepFreeEntrance(entB)) entranceSteps = true
  }
  const inferred = legs.some(leg => leg.kind === 'outdoor' || getLayout(leg.building, leg.floors[0] ?? 1).evidence?.positionStatus === 'inferred')
  return { from, to, mode, legs, steps, meters, seconds: Math.round(seconds), usesElevator, usesStairs, entranceSteps, inferred, accessibilityStatus: inferred ? 'inferred' : 'existing-demo' }
}

export function formatDuration(seconds: number) {
  return `${Math.max(1, Math.round(seconds / 60))} min`
}

export function isStepFreePlace(place: Place): boolean {
  const entrance = accessibleEntrancePlace(place.building)
  if (!isStepFreeEntrance(entrance.node)) return false
  const route = computeRoute(entrance, place, 'elevator')
  return !!route && !route.inferred && !route.usesStairs && !route.entranceSteps
}

export { floorName }
