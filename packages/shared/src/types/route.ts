import type { Position3D } from "./building.js";

export interface RouteNode { id: string; buildingId: string; floorId: string; position: Position3D; }

export interface RouteEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeters: number;
  kind: "walkway" | "stairs" | "elevator" | "ramp";
  bidirectional: boolean;
  /** Missing accessibility data must not be treated as verified step-free access. */
  stepFree?: boolean;
}

export interface RouteRequest { originNodeId: string; destinationPlaceId: string; stepFree: boolean; }

export interface RouteStep { instruction: string; floorId: string; nodeIds: string[]; }

export interface RouteResult {
  destinationPlaceId: string;
  nodeIds: string[];
  edgeIds: string[];
  distanceMeters: number;
  steps: RouteStep[];
}
