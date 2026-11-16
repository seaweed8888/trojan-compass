// In-process service interfaces shared by manual controls and AI orchestration.
import type {
  Building,
  BuildingSummary,
  Floor,
  Place,
  Scene,
  PlaceSearchResult,
  PlaceKind,
  GraphNode,
  GraphEdge,
  Provenance,
  RouteRequest,
  Route,
  ChatTextRequest,
  ChatResponse,
  FieldError,
  FloorGeometry,
} from "@trojan-compass/shared/api";
export type { NavigationSource } from "./navigation-source.js";
import type { NavigationSource } from "./navigation-source.js";

export interface RequestScope {
  requestId: string;
  dataVersion: string;
  signal?: AbortSignal;
  /** Monotonic deadline; never compare this value with Date.now(). */
  deadline?: number;
}

// Teammate implements these methods over the canonical pinned dataset.
export interface DatasetPort {
  assertSnapshot(scope: RequestScope): Promise<void>;
  listBuildings(scope: RequestScope): Promise<BuildingSummary[]>;
  getBuilding(scope: RequestScope, buildingId: string): Promise<Building>;
  getFloor(
    scope: RequestScope,
    buildingId: string,
    floorId: string,
  ): Promise<Floor>;
  listPlaces(scope: RequestScope, buildingId?: string): Promise<Place[]>;
  getPlace(
    scope: RequestScope,
    buildingId: string,
    placeId: string,
  ): Promise<Place>;
  getScene(scope: RequestScope, buildingId: string): Promise<Scene>;
  getFloorGeometry?(
    scope: RequestScope,
    buildingId: string,
    floorId: string,
  ): Promise<FloorGeometry | null>;
  getNavigationSource(
    scope: RequestScope,
    buildingId: string,
  ): Promise<NavigationSource>;
}

export interface PlaceSearchInput {
  query: string;
  buildingId?: string;
  floorId?: string;
  kind?: PlaceKind;
  stepFree?: boolean;
  limit: number;
  cursor?: string;
}

// Eddie implements normalization and ranking. Raw data services do not import it.
export interface SearchPort {
  searchBuildings(
    scope: RequestScope,
    input: { query: string; limit: number; cursor?: string },
  ): Promise<{ buildings: BuildingSummary[]; nextCursor: string | null }>;
  searchPlaces(
    scope: RequestScope,
    input: PlaceSearchInput,
  ): Promise<{ results: PlaceSearchResult[]; nextCursor: string | null }>;
}

// Both manual directions and chat use this exact service implementation.
export interface RoutingPort {
  calculateRoute(scope: RequestScope, request: RouteRequest): Promise<Route>;
}

// The image capability remains disabled until its separate adapter is implemented.
export interface ChatPort {
  respond(scope: RequestScope, request: ChatTextRequest): Promise<ChatResponse>;
}

export interface ServiceFailure extends Error {
  code: string;
  httpStatus: number;
  fieldErrors?: FieldError[];
  details?: Record<string, unknown>;
}

// DatasetPort and canonical coordinates are the cross-owner dependency.
// SearchPort, RoutingPort and ChatPort remain within Eddie's ownership.
export interface ChatDependencies {
  datasets: DatasetPort;
  search: SearchPort;
  routing: RoutingPort;
}
