// Preserved prototype source; canonical runtime data is exported to server/data/snapshots/.
import { INTERIORS } from './interiors/index.js'

export type BuildingCode = 'DML' | 'LVL' | 'THH' | 'VKC' | 'TCC' | 'SGM' | 'SAL' | 'KAP' | 'SCA' | 'LAW'

export interface Building {
  code: BuildingCode
  name: string
  blurb: string
  /** Center on the campus ground plane (x, z). */
  position: [number, number]
  /** Footprint polygon in local coordinates (x, z). */
  footprint: [number, number][]
  /** Floors above ground (used for the campus massing). */
  floors: number
  /** Explicit level list when the building has a basement (0 = basement). */
  levels?: number[]
  tower?: boolean
  tags: string[]
  subtitle?: string
  features?: { icon: 'access' | 'elevator' | 'restroom' | 'steps'; label: string }[]
  source?: { label: string; url: string }
  featured?: boolean
}

const rect = (w: number, d: number): [number, number][] => [
  [-w / 2, -d / 2],
  [w / 2, -d / 2],
  [w / 2, d / 2],
  [-w / 2, d / 2],
]

export const BUILDINGS: Building[] = [
  {
    code: 'SCA',
    name: 'School of Cinematic Arts',
    blurb: 'Cinema classrooms, theaters and production spaces. Source coverage is partial.',
    // Schematic overview decoration; never used by canonical indoor navigation.
    position: [-29, -25],
    footprint: INTERIORS.SCA!.footprint,
    floors: 3,
    tags: ['Cinema', 'Classrooms'],
  },
  {
    code: 'DML',
    name: 'Doheny Memorial Library',
    blurb: 'Main library with quiet reading rooms and research help desks.',
    position: [0, -14],
    footprint: rect(12, 7),
    floors: 3,
    tower: true,
    tags: ['Library', 'Study space'],
  },
  {
    code: 'LVL',
    name: 'Leavey Library',
    blurb: '24-hour study commons, group rooms and tech support.',
    position: [16, -14],
    footprint: rect(8, 8),
    floors: 3,
    tags: ['24/7', 'Group study'],
  },
  {
    code: 'THH',
    name: 'Taper Hall of Humanities',
    blurb: 'Where most first-year writing and GE seminars meet.',
    position: [-17, 0],
    footprint: [
      [-6, -5.5],
      [6, -5.5],
      [6, -1],
      [-1.5, -1],
      [-1.5, 5.5],
      [-6, 5.5],
    ],
    floors: 4,
    tags: ['Classrooms', 'Writing program'],
  },
  {
    code: 'VKC',
    name: 'Von KleinSmid Center',
    blurb: 'International relations, large lecture halls and the VKC library.',
    position: [-1, 1],
    footprint: [
      [-6, -4],
      [6, -4],
      [6, 4],
      [2.5, 4],
      [2.5, 0],
      [-2.5, 0],
      [-2.5, 4],
      [-6, 4],
    ],
    floors: 4,
    tower: true,
    tags: ['Lecture halls', 'Library'],
  },
  {
    code: 'TCC',
    name: 'Ronald Tutor Campus Center',
    blurb: 'Student life hub: dining, club offices and event ballrooms.',
    position: [17, 3],
    footprint: rect(12, 8),
    floors: 4,
    tags: ['Dining', 'Clubs', 'Events'],
  },
  {
    code: 'SGM',
    name: 'Seeley G. Mudd Building',
    blurb: 'Science labs and large STEM lecture rooms.',
    position: [-17, -14],
    footprint: rect(8, 8),
    floors: 5,
    tags: ['Labs', 'STEM'],
  },
  {
    code: 'SAL',
    name: 'Salvatori Computer Science Center',
    blurb: 'Computer labs and CS discussion sections.',
    position: [0, 16],
    footprint: rect(8, 6),
    floors: 3,
    tags: ['Computer labs'],
  },
  {
    code: 'KAP',
    name: 'Kaprielian Hall',
    blurb: 'Engineering classrooms and research groups.',
    position: [17, 17],
    footprint: rect(10, 7),
    floors: 3,
    tags: ['Engineering'],
  },
  {
    code: 'LAW',
    name: 'Musick Law Building',
    subtitle: 'USC Gould School of Law',
    blurb: 'Classrooms, a courtroom and student services on floor 1. The law library fills floors 2 and 3.',
    position: [-17, 16],
    footprint: [
      [-6.1, -2.8],
      [6.1, -2.8],
      [6.1, 0],
      [5.1, 0],
      [5.1, 2.4],
      [0.6, 2.4],
      [0.6, 2.8],
      [-6.1, 2.8],
    ],
    floors: 4,
    levels: [0, 1, 2, 3, 4],
    tags: ['Law school', 'Law library', 'Courtroom'],
    features: [
      { icon: 'access', label: 'Step-free east ramp entrance' },
      { icon: 'elevator', label: '2 elevators, basement to floor 4' },
      { icon: 'restroom', label: 'Restrooms on every floor' },
    ],
    source: {
      label: 'Gould building map (PDF)',
      url: 'https://gould.usc.edu/resources/downloads/about/visit/building-map.pdf',
    },
    featured: true,
  },
]

// Reconstruction metadata supersedes the original generic floor counts.
for (const building of BUILDINGS) {
  const reconstruction = INTERIORS[building.code]
  if (!reconstruction) continue
  building.name = reconstruction.name
  building.levels = reconstruction.floors.map(f => f.level)
  building.floors = Math.max(...building.levels)
  building.footprint = reconstruction.footprint
  if (building.code === 'VKC') building.blurb = 'Medicine Crow Center (legacy code VKC): classrooms, offices and a lower-level library around an open courtyard.'
  if (building.code === 'TCC') building.blurb = 'Student commons, meeting rooms and offices. Adjacent Sample Hall (SKS) is a separate building.'
}

/** Keep VKC URLs/room IDs stable while accepting the current USC code DMC. */
export function resolveBuildingCode(value: string): BuildingCode | undefined {
  const code = value.trim().toUpperCase()
  if (code === 'DMC') return 'VKC'
  return BUILDINGS.find(building => building.code === code)?.code
}

export const BUILDING_BY_CODE = Object.fromEntries(BUILDINGS.map((b) => [b.code, b])) as Record<
  BuildingCode,
  Building
>

export const FLOOR_HEIGHT_CAMPUS = 1.15

/** Walkways drawn on the campus ground: [x, z, width, depth, label]. */
export const WALKWAYS: { x: number; z: number; w: number; d: number; label: string; vertical: boolean }[] = [
  { x: 8, z: 0, w: 3, d: 56, label: 'Trousdale Pkwy', vertical: true },
  { x: 0, z: 10, w: 64, d: 2.4, label: 'Childs Way', vertical: false },
  { x: -9.5, z: -6, w: 1.6, d: 30, label: '', vertical: true },
  { x: 0, z: -7.5, w: 34, d: 1.6, label: '', vertical: false },
]

export type EventKind = 'class' | 'club' | 'general'

export interface CampusEvent {
  id: string
  title: string
  kind: EventKind
  host: string
  time: string
  building: BuildingCode
  /** Cell id of the room, e.g. "LAW-107". */
  room: string
}

export const EVENTS: CampusEvent[] = [
  { id: 'e1', title: 'LAW 200: Law and Society', kind: 'class', host: 'Your schedule', time: '10:00 - 11:50 AM', building: 'LAW', room: 'LAW-3' },
  { id: 'e2', title: 'MATH 125: Calculus I', kind: 'class', host: 'Your schedule', time: '12:00 - 1:50 PM', building: 'SGM', room: 'SGM-101' },
  { id: 'e3', title: 'Transfer Student Welcome Reception', kind: 'club', host: 'Transfer Student Association', time: '4:00 - 5:30 PM', building: 'LAW', room: 'LAW-433' },
  { id: 'e4', title: 'Moot Court Showcase', kind: 'club', host: 'Moot Court Honors Program', time: '6:00 - 7:30 PM', building: 'LAW', room: 'LAW-107' },
  { id: 'e5', title: 'Law Library Research Workshop', kind: 'general', host: 'USC Law Library', time: '2:00 - 3:00 PM', building: 'LAW', room: 'LAW-213' },
  { id: 'e6', title: 'Pre-Law Advising Drop-in', kind: 'general', host: 'Gould Student Affairs', time: '9:00 AM - 4:00 PM', building: 'LAW', room: 'LAW-104' },
  { id: 'e7', title: 'CSCI 103 Discussion', kind: 'class', host: 'Your schedule', time: '3:00 - 3:50 PM', building: 'SAL', room: 'SAL-106' },
  { id: 'e8', title: 'Student Bar Association Mixer', kind: 'club', host: 'Student Bar Association', time: '7:00 - 9:00 PM', building: 'LAW', room: 'LAW-B9' },
  { id: 'e9', title: 'Career Services Info Session', kind: 'general', host: 'Gould Career Services', time: '5:00 - 6:00 PM', building: 'LAW', room: 'LAW-110' },
  { id: 'e10', title: 'Robotics Club Open Lab', kind: 'club', host: 'USC Robotics', time: '6:00 - 8:00 PM', building: 'KAP', room: 'KAP-106' },
]

export const EVENT_COLORS: Record<EventKind, string> = {
  class: '#990000',
  club: '#E8B400',
  general: '#3E6BA8',
}

export const EVENT_LABELS: Record<EventKind, string> = {
  class: 'My class',
  club: 'Club event',
  general: 'Campus event',
}
