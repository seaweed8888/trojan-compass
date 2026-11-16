import type { LawFloorSpec } from '../law.js'

export interface Evidence {
  numberStatus: 'confirmed' | 'inferred' | 'not applicable'
  positionStatus: 'confirmed' | 'inferred'
  /** Existence/name evidence is separate from geometry and room numbering. */
  identityStatus: 'confirmed' | 'inferred'
  sources: string[]
  notes: string
  accessibilityStatus?: 'inferred'
}

/** Uses LAW's page-coordinate tuples, slab union and corridor polylines. */
export interface ReconstructedFloorSpec extends LawFloorSpec {
  name: string
  /** Coverage of the supplied drawing, independent of coordinate precision. */
  planScope?: 'full' | 'partial' | 'inferred'
  evidence: Evidence
  /** Parallel to rooms. Explicit IDs preserve the old demo links. */
  records: { id: string; evidence: Evidence; door?: [number, number]; doorEvidence?: Evidence; capacity?: number; restroom?: 'men' | 'women' | 'both' }[]
  entranceEvidence: Record<string, Evidence>
  /** Non-walkable exterior spaces in scene coordinates. */
  voids: { id: string; name: string; rect: [number, number, number, number]; evidence: Evidence }[]
}

export interface Reconstruction {
  code: string
  name: string
  aliases: string[]
  /** Drawing-derived does not mean current, surveyed or navigation-verified. */
  geometryStatus?: 'traced' | 'partial' | 'inferred'
  geometryNotes?: string
  floorCountStatus: 'confirmed' | 'inferred'
  floorCountNotes: string
  shapeSource: string
  shapeNotes: string
  /** Local +x bearing counterclockwise from geographic east. Scene +z is south. */
  orientationDegrees: number
  /** Stylized campus massing from the same floor-1 silhouette, rotated to map axes. */
  footprint: [number, number][]
  floors: ReconstructedFloorSpec[]
}
