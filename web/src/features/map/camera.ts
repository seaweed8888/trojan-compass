import { Vector3 } from "three";
import type { CameraControls } from "@react-three/drei";
import type { BuildingCode } from "./data/campus-display";
import {
  cellCenter,
  findCell,
  floorY,
  getLevels,
  planBounds,
} from "./data/viewer-data";

export function zoomModelWithShortcut(
  event: KeyboardEvent,
  controls: CameraControls,
  protocol: string,
) {
  if (
    !["http:", "https:"].includes(protocol) ||
    !(event.ctrlKey || event.metaKey) ||
    event.altKey ||
    event.isComposing ||
    event.defaultPrevented
  )
    return;
  const direction =
    ["+", "="].includes(event.key) || event.code === "NumpadAdd"
      ? 1
      : event.key === "-" || event.code === "NumpadSubtract"
        ? -1
        : 0;
  if (!direction) return;
  event.preventDefault();
  if (controls.enabled)
    void controls.dolly(direction * controls.distance * 0.15, true);
}

/** Turn only when the selected room is on the far side of the building. */
export function roomFacingAngle(
  code: BuildingCode,
  roomId: string | undefined,
  azimuth: number,
) {
  const room = roomId ? findCell(roomId) : undefined;
  if (!room || room.building !== code || room.kind !== "room") return azimuth;
  const bounds = planBounds(code);
  const [x, z] = cellCenter(room);
  const dx = (x - (bounds.x0 + bounds.x1) / 2) / (bounds.x1 - bounds.x0);
  const dz = (z - (bounds.z0 + bounds.z1) / 2) / (bounds.z1 - bounds.z0);
  if (
    Math.hypot(dx, dz) < 0.1 ||
    dx * Math.sin(azimuth) + dz * Math.cos(azimuth) >= 0
  )
    return azimuth;
  const facing =
    Math.abs(dx) > Math.abs(dz)
      ? (Math.sign(dx) * Math.PI) / 2
      : dz > 0
        ? 0
        : Math.PI;
  return (
    azimuth + Math.atan2(Math.sin(facing - azimuth), Math.cos(facing - azimuth))
  );
}

/** Fit projected floor corners, avoiding the excess space of a bounding sphere. */
export function buildingFrame(
  code: BuildingCode,
  aspect: number,
  fov: number,
  azimuth: number,
  polar: number,
  floor?: number,
) {
  const b = planBounds(code);
  const levels = floor === undefined ? getLevels(code) : [floor];
  const bottom = floorY(levels[0]!, code) - 0.3;
  const top = floorY(levels.at(-1)!, code) + 1.5;
  const target = new Vector3(
    (b.x0 + b.x1) / 2,
    (bottom + top) / 2,
    (b.z0 + b.z1) / 2,
  );
  const direction = new Vector3(
    Math.sin(polar) * Math.sin(azimuth),
    Math.cos(polar),
    Math.sin(polar) * Math.cos(azimuth),
  );
  const right = new Vector3(Math.cos(azimuth), 0, -Math.sin(azimuth));
  const up = new Vector3().crossVectors(direction, right);
  const tanVertical = Math.tan((fov * Math.PI) / 360);
  let distance = 12;
  for (const x of [b.x0, b.x1])
    for (const y of [bottom, top])
      for (const z of [b.z0, b.z1]) {
        const corner = new Vector3(x, y, z).sub(target);
        const depth = corner.dot(direction);
        distance = Math.max(
          distance,
          depth +
            Math.abs(corner.dot(right)) /
              (tanVertical * Math.max(0.1, aspect) * 0.9),
          depth + Math.abs(corner.dot(up)) / (tanVertical * 0.78),
        );
      }
  return {
    target,
    position: target.clone().addScaledVector(direction, distance),
    distance,
  };
}

export function roomLabelsVisible(
  distance: number,
  maxDistance: number,
  visible: boolean,
) {
  return visible
    ? distance < maxDistance * 0.995
    : distance < maxDistance * 0.99;
}
