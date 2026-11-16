import type {
  GraphNode,
  GraphEdge,
  Provenance,
  Vector3,
} from "@trojan-compass/shared/api";

/** Teammate's on-disk source format. Kept separate from Eddie's derived routing input. */
export interface PublishedNavigation {
  buildingId: string;
  dataVersion: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  provenance: Provenance;
  walkable: { floorId: string; from: Vector3; to: Vector3; radius: number }[];
  barriers: { floorId: string; min: Vector3; max: Vector3 }[];
  connectors: {
    id: string;
    nodeIds: string[];
    kind: "stairs" | "elevator" | "ramp";
  }[];
}
