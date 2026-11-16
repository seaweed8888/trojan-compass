// Presentation adapter only. All records and prepared geometry arrive from the API.
import type {
  Building,
  FloorResponse,
  Place,
  GeometryObject,
} from "@trojan-compass/shared";
import type { BuildingCode } from "./campus-display";
export type CellKind = "room" | "stairs" | "elevator" | "restroom" | "block";
export interface Cell {
  id: string;
  building: BuildingCode;
  floor: number;
  kind: CellKind;
  number: string;
  name: string;
  label?: string;
  title?: string;
  restroom?: "men" | "women" | "both";
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  door: [number, number];
  open?: boolean;
  core?: string;
  node: string;
  stepFree?: boolean;
  provenanceNote?: string;
}
export interface Entrance {
  id: string;
  x: number;
  z: number;
  label: string;
  stepFree: boolean;
  hasSteps?: boolean;
  ramp?: boolean;
  entrance: boolean;
}
export interface FloorLayout {
  building: BuildingCode;
  floor: number;
  cells: Cell[];
  slabs: [number, number, number, number][];
  walkNodes: { id: string; x: number; z: number }[];
  walkEdges: [string, string][];
  entrances: Entrance[];
  objects: GeometryObject[];
}
const buildings = new Map<string, Building>();
const floors = new Map<string, FloorResponse>();
let installedVersion: string | undefined;
export const floorY = (floor: number, code?: string) =>
  code
    ? (floors.get(`${code}:${floor}`)?.floor.elevationMeters ??
      (floor - 1) * 3.4)
    : (floor - 1) * 3.4;
export const floorName = (floor: number, code?: string) => {
  const label = code ? floors.get(`${code}:${floor}`)?.floor.label : undefined;
  return label && !/^(B|\d+)$/.test(label)
    ? label
    : floor === 0
      ? "Basement"
      : `Floor ${floor}`;
};
export const floorShort = (floor: number) =>
  floor === 0 ? "B" : String(floor);
export const cellCenter = (c: Cell): [number, number] => [
  (c.x0 + c.x1) / 2,
  (c.z0 + c.z1) / 2,
];
export const cellTitle = (c: Cell) =>
  c.title ??
  (c.kind === "room"
    ? `${c.building} ${c.number || c.name}`
    : `${c.building} ${c.name}, ${floorName(c.floor).toLowerCase()}`);
export function validateBuilding(
  building: Building,
  responses: FloorResponse[],
) {
  const allKeys = responses.flatMap(
    (f) => f.geometry?.objects.map((o) => o.objectKey) ?? [],
  );
  if (new Set(allKeys).size !== allKeys.length)
    throw new Error("Scene object keys must be unique.");
  for (const f of responses) {
    const keys = new Set(f.geometry?.objects.map((o) => o.objectKey) ?? []);
    if (
      f.dataVersion !== responses[0]?.dataVersion ||
      f.floor.buildingId !== building.id
    )
      throw new Error("Scene snapshot mismatch.");
    for (const p of f.places)
      if (
        p.floorId !== f.floor.id ||
        p.buildingId !== building.id ||
        (p.sceneObjectKey && !keys.has(p.sceneObjectKey))
      )
        throw new Error(`Missing scene object for ${p.displayLabel}.`);
  }
}
export function installBuilding(
  building: Building,
  responses: FloorResponse[],
) {
  validateBuilding(building, responses);
  if (installedVersion !== responses[0]?.dataVersion) {
    buildings.clear();
    floors.clear();
    installedVersion = responses[0]?.dataVersion;
  }
  buildings.set(building.id, building);
  for (const f of responses) floors.set(`${building.id}:${f.floor.id}`, f);
}
export function getLevels(code: BuildingCode) {
  return buildings.get(code)?.floors.map((f) => Number(f.id)) ?? [1];
}
export function getPlaces(code?: string): Place[] {
  return [...floors.values()]
    .filter((f) => !code || f.floor.buildingId === code)
    .flatMap((f) => f.places);
}
export function getLayout(code: BuildingCode, floor: number): FloorLayout {
  const data = floors.get(`${code}:${floor}`);
  const objects = data?.geometry?.objects ?? [];
  const cells: Cell[] = (data?.places ?? [])
    .filter((p) => p.bounds)
    .map((p) => ({
      id: p.id,
      building: code,
      floor,
      kind:
        p.kind === "stairs" || p.kind === "elevator" || p.kind === "restroom"
          ? p.kind
          : "room",
      number: p.roomNumber ?? "",
      name: p.name,
      label: p.displayLabel.replace(`${code} `, ""),
      title: p.displayLabel,
      restroom:
        p.description === "men restroom"
          ? "men"
          : p.description === "women restroom"
            ? "women"
            : "both",
      stepFree: p.access.stepFreeAccess === "verified_yes",
      provenanceNote: p.provenance.note,
      x0: p.bounds!.min.x,
      x1: p.bounds!.max.x,
      z0: p.bounds!.min.z,
      z1: p.bounds!.max.z,
      door: [p.position.x, p.position.z],
      node: p.accessPoints[0]?.nodeId ?? p.id,
      open: p.description === "Open area",
    }));
  for (const o of objects)
    if (o.role === "room_highlight" && !o.placeId && o.kind === "box")
      cells.push({
        id: o.objectKey,
        building: code,
        floor,
        kind: "block",
        name: "Unavailable area",
        number: "",
        x0: o.center.x - o.size.x / 2,
        x1: o.center.x + o.size.x / 2,
        z0: o.center.z - o.size.z / 2,
        z1: o.center.z + o.size.z / 2,
        door: [o.center.x, o.center.z],
        node: o.objectKey,
      });
  return {
    building: code,
    floor,
    cells,
    slabs: objects
      .filter((o) => o.role === "slab" && o.kind === "box")
      .map((o) => {
        if (o.kind !== "box") throw new Error("Unexpected slab");
        return [
          o.center.x - o.size.x / 2,
          o.center.z - o.size.z / 2,
          o.center.x + o.size.x / 2,
          o.center.z + o.size.z / 2,
        ];
      }),
    walkNodes: [],
    walkEdges: [],
    entrances: (data?.places ?? [])
      .filter((p) => p.kind === "entrance" || p.kind === "emergency_exit")
      .map((p) => ({
        id: p.id,
        x: p.position.x,
        z: p.position.z,
        label: p.name,
        stepFree: p.access.stepFreeAccess === "verified_yes",
        hasSteps: p.access.stepFreeAccess === "verified_no",
        ramp: p.access.isRamp === true,
        entrance: p.access.entryAllowed === true,
      })),
    objects,
  };
}
export function planBounds(code: BuildingCode) {
  const b = buildings.get(code)?.bounds;
  return b
    ? { x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z }
    : { x0: -20, x1: 20, z0: -10, z1: 10 };
}
export function findCell(id: string) {
  for (const f of floors.values()) {
    const c = getLayout(
      f.floor.buildingId as BuildingCode,
      Number(f.floor.id),
    ).cells.find((c) => c.id === id);
    if (c) return c;
  }
  return undefined;
}
