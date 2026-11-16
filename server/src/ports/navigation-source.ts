import type {
  Bounds3,
  GraphEdge,
  GraphNode,
  Provenance,
  Vector3,
} from "@trojan-compass/shared/api";

export type StepFreeEvidence = "verified_yes" | "verified_no" | "unknown";
export type TraversalAccess = {
  accessLevel: "public" | "usc_only" | "restricted" | "unknown";
  stepFree: StepFreeEvidence;
  evidenceIds: string[];
};
export type PointXZ = { x: number; z: number };
/** Closed rings, including a repeated first/last point. */
export type PolygonXZ = { outer: PointXZ[]; holes: PointXZ[][] };
export type WalkableRegion = {
  id: string;
  kind: "corridor" | "room" | "landing" | "entrance";
  polygon: PolygonXZ;
  access: TraversalAccess;
};
export type NavigationFloor = {
  /** Full open-floor polygons permit walked approaches beyond the 2 m snap band. */
  openAreaApproaches?: boolean;
  floorId: string;
  elevationMeters: number;
  bounds: Bounds3;
  walkableRegions: WalkableRegion[];
  blockedRegions: { id: string; polygon: PolygonXZ }[];
};
export type EdgeDetail = {
  edgeId: string;
  points: Vector3[];
  regionIds: string[];
  doorId: string | null;
  connectorId: string | null;
  access: TraversalAccess;
  metricsEstimated: boolean;
};
export type DoorSide =
  { kind: "region"; regionId: string } | { kind: "outside" };
export type NavigationDoor = {
  id: string;
  floorId: string;
  sideA: DoorSide;
  sideB: DoorSide;
  direction: "both" | "a_to_b" | "b_to_a";
  edgeIds: string[];
  access: TraversalAccess;
};
export type NavigationConnector = {
  id: string;
  kind: "stairs" | "elevator" | "ramp";
  floorIds: string[];
  edgeIds: string[];
  access: TraversalAccess;
};
export type AccessBinding = {
  placeId: string;
  accessPointId: string;
  floorId: string;
  regionId: string | null;
  nodeId: string;
  doorId: string | null;
  approachEdgeIds: string[];
  access: TraversalAccess;
};

/** Teammate-owned source data. Null geometry explicitly disables arbitrary map picks. */
export interface NavigationSource {
  buildingId: string;
  dataVersion: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  geometry: { floors: NavigationFloor[] } | null;
  edgeDetails: EdgeDetail[];
  doors: NavigationDoor[];
  connectors: NavigationConnector[];
  placeAccessBindings: AccessBinding[];
  referenceEntrances: { placeId: string; accessPointId: string }[];
  evidence: {
    id: string;
    stepFree: StepFreeEvidence;
    sourceUrls: string[];
    verifiedAt: string | null;
    note: string;
  }[];
  provenance: Provenance;
}
