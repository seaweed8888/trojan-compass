// Preserved prototype source; canonical runtime data is exported to server/data/snapshots/.
import { BUILDING_BY_CODE, resolveBuildingCode, type BuildingCode } from './campus.js'
import { LAW_SPEC, type Rect, type Side } from './law.js'
import { INTERIORS } from './interiors/index.js'
import type { Evidence, ReconstructedFloorSpec } from './interiors/types.js'

export const FLOOR_GAP = 3.4

export type CellKind = 'room' | 'stairs' | 'elevator' | 'restroom' | 'block'

export interface Cell {
  id: string
  building: BuildingCode
  floor: number
  kind: CellKind
  restroom?: 'men' | 'women' | 'both'
  /** Room number (consult evidence.numberStatus; may be empty for named spaces). */
  number: string
  name: string
  /** Short text for the 3D map pill when there is no number. */
  label?: string
  capacity?: number
  area?: number
  x0: number
  x1: number
  z0: number
  z1: number
  door: [number, number]
  /** Open areas (reading rooms, dining) render without walls. */
  open?: boolean
  /** Stairs/elevators sharing a core id connect vertically. */
  core?: string
  node: string
  evidence?: Evidence
}

export interface Entrance {
  id: string
  x: number
  z: number
  label: string
  stepFree: boolean
  ramp?: boolean
  /** False for exit-only doors. */
  entrance: boolean
  evidence?: Evidence
}

export interface FloorLayout {
  building: BuildingCode
  floor: number
  cells: Cell[]
  slabs: [number, number, number, number][]
  walkNodes: { id: string; x: number; z: number }[]
  walkEdges: [string, string][]
  entrances: Entrance[]
  evidence?: Evidence
  voids?: ReconstructedFloorSpec['voids']
}

export const floorY = (floor: number) => (floor - 1) * FLOOR_GAP
export const floorName = (floor: number, building?: BuildingCode) =>
  (building && INTERIORS[building]?.floors.find(s => s.level === floor)?.name) || (floor === 0 ? 'Basement' : `Floor ${floor}`)
export const floorShort = (floor: number) => (floor === 0 ? 'B' : String(floor))

export function getLevels(code: BuildingCode): number[] {
  const b = BUILDING_BY_CODE[code]
  if (INTERIORS[code]) return INTERIORS[code]!.floors.map(s => s.level)
  return b.levels ?? Array.from({ length: b.floors }, (_, i) => i + 1)
}

export function metersPerUnit(code: BuildingCode) {
  return code === 'LAW' ? 2.4 : 2
}

/** Stable generic IDs remain valid where no evidence contradicted the old floor count. */
export function roomNumber(floor: number, index: number) {
  return String(floor * 100 + index)
}

// ---------- Shared LAW-format loader ----------

const PX_C = 630
const PY_C = 930
const SCALE = 30
const toScene = (px: number, py: number): [number, number] => [(py - PY_C) / SCALE, -(px - PX_C) / SCALE]
const rectToScene = ([px0, py0, px1, py1]: Rect): [number, number, number, number] => [
  (py0 - PY_C) / SCALE,
  -(px1 - PX_C) / SCALE,
  (py1 - PY_C) / SCALE,
  -(px0 - PX_C) / SCALE,
]

function specLayout(building: BuildingCode, floor: number): FloorLayout {
  const reconstruction = INTERIORS[building]?.floors.find(s => s.level === floor)
  const spec = building === 'LAW' ? LAW_SPEC.find(s => s.level === floor) : reconstruction
  if (!spec) throw new RangeError(`No floor ${floor} configured for ${building}`)
  const cells: Cell[] = []
  const used = new Set<string>()
  for (const [index, [number, name, kindCode, rect, side, area, label]] of spec.rooms.entries()) {
    const record = reconstruction?.records[index]
    if (reconstruction && !record) throw new Error(`Missing evidence record for ${building} floor ${floor} room ${index}`)
    const [x0, z0, x1, z1] = rectToScene(rect)
    const cx = (x0 + x1) / 2
    const cz = (z0 + z1) / 2
    const door: [number, number] = record?.door
      ? toScene(...record.door)
      : side === 'N' ? [x0, cz] : side === 'S' ? [x1, cz] : side === 'W' ? [cx, z1] : [cx, z0]
    const [k, core] = kindCode.split(':')
    const kind: CellKind = k === 's' ? 'stairs' : k === 'e' ? 'elevator' : k === 'w' ? 'restroom' : k === 'b' ? 'block' : 'room'
    const slug =
      number || label?.replace(/\s+/g, '') || `${kind}${core ?? ''}`
    let id = record?.id ?? (kind === 'room' && number ? `LAW-${number}` : `LAW-${floor}-${slug}`)
    if (record && used.has(id)) throw new Error(`Duplicate reconstructed feature ID ${id}`)
    for (let i = 2; used.has(id); i++) id = `LAW-${floor}-${slug}-${i}`
    used.add(id)
    cells.push({
      id,
      building,
      floor,
      kind,
      restroom: record?.restroom ?? (kind === 'restroom' ? 'both' : undefined),
      number: number.replace(/-(IT|LAB)$/, ''),
      name,
      label,
      area,
      capacity: record?.capacity,
      evidence: record?.evidence,
      x0,
      x1,
      z0,
      z1,
      door,
      open: k === 'o',
      core,
      node: `${building}:${floor}:cell:${id}`,
    })
  }
  // Subdivide corridor polylines so nearby doors attach to close nodes.
  const nodes = new Map<string, { id: string; x: number; z: number }>()
  const edges: [string, string][] = []
  const nodeAt = (px: number, py: number) => {
    const key = building === 'LAW' ? `${Math.round(px)},${Math.round(py)}` : `${px.toFixed(3)},${py.toFixed(3)}`
    let n = nodes.get(key)
    if (!n) {
      const [x, z] = toScene(px, py)
      n = { id: `${building}:${floor}:w:${key}`, x, z }
      nodes.set(key, n)
    }
    return n
  }
  // Junctions: any polyline vertex that lies on another segment splits that segment.
  const vertices = spec.walks.flat()
  for (const line of spec.walks) {
    for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1]!
      const [bx, by] = line[i]!
      const len = Math.hypot(bx - ax, by - ay)
      const ts = [0, 1]
      for (const [vx, vy] of vertices) {
        const t = ((vx - ax) * (bx - ax) + (vy - ay) * (by - ay)) / (len * len)
        if (t <= 0 || t >= 1) continue
        const off = Math.hypot(ax + (bx - ax) * t - vx, ay + (by - ay) * t - vy)
        if (off < (building === 'LAW' ? 1.5 : 0.01)) ts.push(t)
      }
      ts.sort((p, q) => p - q)
      let prev = nodeAt(ax, ay)
      for (let k = 1; k < ts.length; k++) {
        const t0 = ts[k - 1]!
        const t1 = ts[k]!
        const steps = Math.max(1, Math.ceil(((t1 - t0) * len) / 36))
        for (let s = 1; s <= steps; s++) {
          const t = t0 + ((t1 - t0) * s) / steps
          const n = nodeAt(ax + (bx - ax) * t, ay + (by - ay) * t)
          if (n !== prev) edges.push([prev.id, n.id])
          prev = n
        }
      }
    }
  }
  const entrances: Entrance[] = (spec.entrances ?? []).map((e) => {
    const [x, z] = toScene(e.at[0], e.at[1])
    return { id: `${building}:${floor}:${e.id}`, x, z, label: e.label, stepFree: e.stepFree, ramp: e.ramp, entrance: e.entrance, evidence: reconstruction?.entranceEvidence[e.id] }
  })
  return { building, floor, cells, slabs: spec.slabs.map(rectToScene), walkNodes: [...nodes.values()], walkEdges: edges, entrances, evidence: reconstruction?.evidence, voids: reconstruction?.voids }
}

// ---------- Public API ----------

const cache = new Map<string, FloorLayout>()

export function getLayout(building: BuildingCode, floor: number): FloorLayout {
  const key = `${building}-${floor}`
  let l = cache.get(key)
  if (!l) {
    l = specLayout(building, floor)
    cache.set(key, l)
  }
  return l
}

export const getFloorCells = (building: BuildingCode, floor: number) => getLayout(building, floor).cells

export const cellCenter = (c: Cell): [number, number] => [(c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2]

export function planBounds(code: BuildingCode) {
  let x0 = Infinity
  let x1 = -Infinity
  let z0 = Infinity
  let z1 = -Infinity
  for (const f of getLevels(code)) {
    for (const [a, b, c, d] of getLayout(code, f).slabs) {
      x0 = Math.min(x0, a)
      z0 = Math.min(z0, b)
      x1 = Math.max(x1, c)
      z1 = Math.max(z1, d)
    }
  }
  return { x0, x1, z0, z1 }
}

export interface Place {
  id: string
  building: BuildingCode
  floor: number
  label: string
  sub: string
  node: string
  kind: CellKind | 'entrance'
  evidence?: Evidence
}

export function cellTitle(c: Cell) {
  if (c.kind === 'room') return c.number ? `${c.building} ${c.number}` : `${c.building} ${c.name}`
  if (c.kind === 'restroom') return `${c.building} restrooms, ${floorName(c.floor, c.building).toLowerCase()}`
  if (c.kind === 'elevator') return `${c.building} ${c.name.toLowerCase()}, ${floorName(c.floor, c.building).toLowerCase()}`
  return `${c.building} ${c.name.toLowerCase()}, ${floorName(c.floor, c.building).toLowerCase()}`
}

export function placeFromCell(c: Cell): Place {
  return {
    id: c.id,
    building: c.building,
    floor: c.floor,
    label: cellTitle(c),
    sub: (c.kind === 'room' ? `${c.number ? `${c.name} · ` : ''}${floorName(c.floor, c.building)}` : BUILDING_BY_CODE[c.building].name) + (c.evidence ? ` · ${c.evidence.numberStatus === 'inferred' ? 'number and position inferred' : 'position inferred'}` : ''),
    evidence: c.evidence,
    node: c.node,
    kind: c.kind,
  }
}

function entranceToPlace(code: BuildingCode, e: Entrance, main: boolean, floor = 1): Place {
  return {
    id: main ? `${code}-ENT` : `${code}-ENT-${e.id.split(':').pop()!.toUpperCase()}`,
    building: code,
    floor,
    label: `${code} ${e.label}`,
    sub: `${e.evidence ? 'Entrance and accessibility inferred' : e.stepFree ? 'Step-free' : 'Has steps'} · ${floorName(floor, code)}`,
    evidence: e.evidence,
    node: e.id,
    kind: 'entrance',
  }
}

export function entrancePlaces(code: BuildingCode): Place[] {
  return getLevels(code).flatMap(f => getLayout(code, f).entrances.filter(e => e.entrance)
    .map(e => entranceToPlace(code, e, e.id === `${code}:1:entrance`, f)))
}

export function entrancePlace(code: BuildingCode): Place {
  return entrancePlaces(code).find((p) => p.id === `${code}-ENT`)!
}

export function accessibleEntrancePlace(code: BuildingCode): Place {
  const ents = getLayout(code, 1).entrances.filter((e) => e.entrance)
  const e = ents.find((x) => x.id === `${code}:1:entrance` && x.stepFree) ?? ents.find((x) => x.stepFree) ?? ents[0]
  if (!e) throw new Error(`No entrance configured for ${code}`)
  return entranceToPlace(code, e, e.id === `${code}:1:entrance`)
}

export function isStepFreeEntrance(nodeId: string) {
  const code = nodeId.slice(0, 3) as BuildingCode
  const e = getLevels(code).flatMap(f => getLayout(code, f).entrances).find((e) => e.id === nodeId)
  return !!e?.stepFree && e.evidence?.accessibilityStatus !== 'inferred'
}

const placeCache = new Map<BuildingCode, Place[]>()

export function getBuildingPlaces(building: BuildingCode): Place[] {
  let out = placeCache.get(building)
  if (out) return out
  out = [...entrancePlaces(building)]
  for (const f of getLevels(building)) {
    for (const c of getFloorCells(building, f)) {
      if (c.kind === 'stairs' || c.kind === 'block') continue
      out.push(placeFromCell(c))
    }
  }
  placeCache.set(building, out)
  return out
}

export function findPlace(id: string): Place | undefined {
  const code = resolveBuildingCode(id.slice(0, 3))
  if (!code) return undefined
  id = code + id.slice(3)
  if (!BUILDING_BY_CODE[code]) return undefined
  return getBuildingPlaces(code).find((p) => p.id.toLowerCase() === id.toLowerCase())
}

export function findRoom(query: string): Place | undefined {
  let compact = query.toUpperCase().replace(/[\s-]+/g, '')
  const code = resolveBuildingCode(compact.slice(0, 3))
  if (!code) return undefined
  compact = code + compact.slice(3)
  if (!BUILDING_BY_CODE[code]) return undefined
  return getBuildingPlaces(code).find((place) => place.kind === 'room' && place.id.toUpperCase().replace(/-/g, '') === compact)
}

export function findCell(id: string): Cell | undefined {
  const code = id.slice(0, 3) as BuildingCode
  if (!BUILDING_BY_CODE[code]) return undefined
  for (const f of getLevels(code)) {
    const c = getFloorCells(code, f).find((x) => x.id === id)
    if (c) return c
  }
  return undefined
}

export function randomRoomPlace(building?: BuildingCode, exclude?: string): Place {
  const codes = building ? [building] : (Object.keys(BUILDING_BY_CODE) as BuildingCode[])
  for (;;) {
    const code = codes[Math.floor(Math.random() * codes.length)]!
    const rooms = getBuildingPlaces(code).filter((p) => p.kind === 'room' && p.id !== exclude)
    const pick = rooms[Math.floor(Math.random() * rooms.length)]
    if (pick) return pick
  }
}

export type { Side }
