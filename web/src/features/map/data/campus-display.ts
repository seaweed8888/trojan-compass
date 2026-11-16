// Schematic campus overview decoration retained from the demo. These positions
// are never submitted as indoor/geographic coordinates or used for routing.
import type { BuildingSummary } from "@trojan-compass/shared";
import models from "./campus-models.json";
export type BuildingCode =
  "DML" | "LVL" | "THH" | "VKC" | "TCC" | "SGM" | "SAL" | "KAP" | "LAW";
export interface Building {
  code: BuildingCode;
  name: string;
  position: [number, number];
  footprint: [number, number][];
  floors: number;
  levels?: number[];
  tower?: boolean;
  featured?: boolean;
  subtitle?: string;
}
export const BUILDINGS = models as Building[];
export const BUILDING_BY_CODE = Object.fromEntries(
  BUILDINGS.map((b) => [b.code, b]),
) as Record<BuildingCode, Building>;
export function installDirectory(records: BuildingSummary[]) {
  for (const record of records) {
    const display = BUILDINGS.find((b) => b.code === record.id);
    if (display) display.name = record.name;
  }
}
export const FLOOR_HEIGHT_CAMPUS = 1.15;
export const WALKWAYS = [
  { x: 8, z: 0, w: 3, d: 56, label: "Trousdale Pkwy", vertical: true },
  { x: 0, z: 10, w: 64, d: 2.4, label: "Childs Way", vertical: false },
  { x: -9.5, z: -6, w: 1.6, d: 30, label: "", vertical: true },
  { x: 0, z: -7.5, w: 34, d: 1.6, label: "", vertical: false },
];
