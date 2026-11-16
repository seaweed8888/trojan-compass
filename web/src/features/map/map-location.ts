import {
  cellCenter,
  cellTitle,
  floorName,
  type FloorLayout,
} from "./data/viewer-data";
import type { MapLocation } from "./types";

/** Snap the carried mascot to entrances and rooms; keep open floor points where dropped. */
export function mapLocationAt(
  layout: FloorLayout,
  x: number,
  z: number,
): MapLocation | null {
  const base = { building: layout.building, floor: layout.floor };
  const entrance = layout.entrances.find(
    (entry) => Math.hypot(entry.x - x, entry.z - z) < 1.2,
  );
  if (entrance)
    return {
      ...base,
      placeId: entrance.id,
      label: `${layout.building} ${entrance.label}`,
      x: entrance.x,
      z: entrance.z,
    };
  const cell = layout.cells.find(
    (item) => x >= item.x0 && x <= item.x1 && z >= item.z0 && z <= item.z1,
  );
  if (cell?.kind === "block") return null;
  if (cell) {
    const [cx, cz] = cellCenter(cell);
    return { ...base, placeId: cell.id, label: cellTitle(cell), x: cx, z: cz };
  }
  if (
    !layout.slabs.some(
      ([x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1,
    )
  )
    return null;
  return {
    ...base,
    label: `${layout.building} ${floorName(layout.floor)} · open area`,
    x,
    z,
  };
}
