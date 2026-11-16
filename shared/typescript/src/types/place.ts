import type { Position3D } from "./building.js";

export type PlaceKind = "classroom" | "toilet" | "stairs" | "elevator" | "entrance" | "door" | "emergency-exit";

export interface Place {
  id: string;
  buildingId: string;
  floorId: string;
  name: string;
  kind: PlaceKind;
  position: Position3D;
  /** Mesh name in the 3D asset, when available. */
  meshId?: string;
  /** Graph node used as the arrival point. */
  nodeId: string;
  /** Omit if not yet verified. */
  stepFreeAccess?: boolean;
}
