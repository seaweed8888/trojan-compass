// Preserved prototype logic; not the canonical HTTP contract. See docs/migration.md.
import { BUILDINGS, BUILDING_BY_CODE } from '../../../infrastructure/datasets/prototype/campus.js'
import { accessibleEntrancePlace, getBuildingPlaces } from '../../../infrastructure/datasets/prototype/floorplan.js'
import { isStepFreePlace } from '../../routing/prototype/routing.js'

const LOCATION_CODES = [
  ...BUILDINGS.map((building) => ({ value: building.code, detail: building.name, buildingName: building.name, place: accessibleEntrancePlace(building.code) })),
  ...BUILDINGS.flatMap(building => getBuildingPlaces(building.code)).filter(place => place.kind === 'room').map((place) => ({
    value: place.id.replace('-', ' '), detail: place.sub, buildingName: BUILDING_BY_CODE[place.building].name, place,
  })),
]
let stepFreeCodes: typeof LOCATION_CODES | undefined

const OUTSIDE_LOCATION = { value: 'Outside the building', detail: 'Start outside at a building entrance', buildingName: '' }

export function searchLocationCodes(query: string, limit = 8, includeOutside = false, accessibleOnly = false) {
  const compact = (value: string) => value.toLowerCase().replace(/[\s-]+/g, '')
  const q = compact(query)
  if (!q) return (includeOutside ? [OUTSIDE_LOCATION] : []).slice(0, limit)
  const codes = accessibleOnly ? (stepFreeCodes ??= LOCATION_CODES.filter(option => isStepFreePlace(option.place))) : LOCATION_CODES
  const options = includeOutside ? [OUTSIDE_LOCATION, ...codes] : codes
  return options.filter((option) =>
    compact(option.value).includes(q) || compact(`${option.buildingName} ${option.value} ${option.detail}`).includes(q),
  ).sort((a, b) => Number(compact(b.value).startsWith(q)) - Number(compact(a.value).startsWith(q))).slice(0, limit)
}
