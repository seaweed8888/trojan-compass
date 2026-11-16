import { randomUUID } from "node:crypto";
import type {
  Building,
  ChatTextRequest,
  GraphEdge,
  Place,
  Provenance,
  RouteRequest,
  Vector3,
} from "@trojan-compass/shared/api";
import type {
  NavigationSource,
  TraversalAccess,
} from "../../src/ports/navigation-source.js";
import {
  SnapshotStore,
  type DatasetSnapshot,
} from "../../src/infrastructure/datasets/snapshot-store.js";
import { createServices } from "../../src/bootstrap/services.js";
import type {
  IntentAdapter,
  NavigationIntent,
} from "../../src/integrations/ai/intent.js";

export const version = "test-v1";
export const scope = () => ({
  requestId: randomUUID(),
  dataVersion: version,
  deadline: performance.now() + 10000,
});
export const provenance: Provenance = {
  dataKind: "demo",
  verificationStatus: "unverified",
  sourceUrls: [],
  verifiedAt: null,
  note: "Synthetic automated-test data. Not USC directions.",
};
const access = (): TraversalAccess => ({
  accessLevel: "public",
  stepFree: "verified_yes",
  evidenceIds: ["test-proof"],
});
const polygon = (x0: number, z0: number, x1: number, z1: number) => ({
  outer: [
    { x: x0, z: z0 },
    { x: x1, z: z0 },
    { x: x1, z: z1 },
    { x: x0, z: z1 },
    { x: x0, z: z0 },
  ],
  holes: [],
});

export function fixture(): DatasetSnapshot {
  const bounds = {
    min: { x: -1, y: -0.2, z: -1 },
    max: { x: 21, y: 10, z: 5 },
  };
  const floors = ["1", "2", "3"].map((id, index) => ({
    id,
    buildingId: "LAW",
    label: `Floor ${id}`,
    sortOrder: index,
    elevationMeters: index * 3.4,
    sceneObjectKey: `LAW:floor:${id}`,
    bounds: {
      min: { ...bounds.min, y: index * 3.4 - 0.2 },
      max: { ...bounds.max, y: index * 3.4 + 3 },
    },
    provenance,
  }));
  const building: Building = {
    id: "LAW",
    code: "LAW",
    name: "Law Building",
    aliases: ["Gould", "Musick Law Building"],
    location: null,
    coverage: "demo",
    capabilities: {
      interiorScene: false,
      navigation: true,
      verifiedStepFreeRouting: true,
      chatText: true,
      chatImages: false,
      events: false,
    },
    provenance,
    description: "Synthetic routing fixture",
    officialMapUrl: null,
    viewerUrl: "https://example.invalid/map",
    coordinateSystem: {
      id: "LAW-test-v1",
      units: "meters",
      upAxis: "Y",
      handedness: "right",
      accuracy: "illustrative",
    },
    bounds,
    floors,
    sources: [],
  };
  const navigation: NavigationSource = {
    buildingId: "LAW",
    dataVersion: version,
    nodes: [],
    edges: [],
    geometry: { floors: [] },
    edgeDetails: [],
    doors: [],
    connectors: [],
    placeAccessBindings: [],
    referenceEntrances: [],
    evidence: [
      {
        id: "test-proof",
        stepFree: "verified_yes",
        sourceUrls: ["https://example.invalid/test-only"],
        verifiedAt: "2026-01-01T00:00:00Z",
        note: "Fabricated evidence for unit tests only.",
      },
    ],
    provenance,
  };
  const places: Place[] = [];
  const node = (
    id: string,
    floorId: string,
    position: Vector3,
    kind = "corridor",
  ) =>
    navigation.nodes.push({ id, buildingId: "LAW", floorId, position, kind });
  const edge = (
    id: string,
    from: string,
    to: string,
    kind: GraphEdge["kind"] = "walkway",
    connectorId: string | null = null,
    doorId: string | null = null,
  ) => {
    const a = navigation.nodes.find((n) => n.id === from)!,
      b = navigation.nodes.find((n) => n.id === to)!;
    navigation.edges.push({
      id,
      fromNodeId: from,
      toNodeId: to,
      kind,
      lengthMeters: Math.hypot(
        a.position.x - b.position.x,
        a.position.y - b.position.y,
        a.position.z - b.position.z,
      ),
      bidirectional: true,
      stepFree: kind === "stairs" ? "verified_no" : "verified_yes",
      accessLevel: "public",
    });
    navigation.edgeDetails.push({
      edgeId: id,
      points: [a.position, b.position],
      regionIds:
        a.floorId === b.floorId
          ? [`${a.floorId}:corridor`, ...(doorId ? [`${a.floorId}:room`] : [])]
          : [],
      connectorId,
      doorId,
      access: access(),
      metricsEstimated: true,
    });
  };
  const place = (
    id: string,
    floorId: string,
    nodes: string[],
    kind: Place["kind"] = "classroom",
  ) => {
    const points = nodes.map((n, i) => ({
      id: `${id}:access:${i}`,
      nodeId: n,
      label: `Door ${i + 1}`,
      position: navigation.nodes.find((x) => x.id === n)!.position,
      stepFreeAccess: "verified_yes" as const,
    }));
    const p: Place = {
      id,
      buildingId: "LAW",
      floorId,
      name: kind === "entrance" ? "Main entrance" : "Classroom",
      displayLabel: id.replace("-", " "),
      roomNumber: kind === "classroom" ? id.split("-")[1]! : null,
      kind,
      description: "",
      aliases: [],
      position: points[0]!.position,
      sceneObjectKey: id,
      bounds: null,
      accessPoints: points,
      access: {
        level: "public",
        stepFreeAccess: "verified_yes",
        isRamp: false,
        entryAllowed: true,
        exitAllowed: true,
        note: "Synthetic test claim",
      },
      provenance,
    };
    places.push(p);
    for (const ap of points)
      navigation.placeAccessBindings.push({
        placeId: id,
        accessPointId: ap.id,
        floorId,
        regionId: `${floorId}:${ap.nodeId.startsWith("R") ? "room" : "corridor"}`,
        nodeId: ap.nodeId,
        doorId: null,
        approachEdgeIds: [],
        access: access(),
      });
  };
  for (const f of floors) {
    const y = f.elevationMeters,
      id = f.id;
    navigation.geometry!.floors.push({
      floorId: id,
      elevationMeters: y,
      bounds: f.bounds,
      walkableRegions: [
        {
          id: `${id}:corridor`,
          kind: "corridor",
          polygon: polygon(-1, -1, 21, 1),
          access: access(),
        },
        {
          id: `${id}:room`,
          kind: "room",
          polygon: polygon(4, 1, 6, 5),
          access: access(),
        },
      ],
      blockedRegions: [],
    });
    for (const [name, x, z] of [
      ["A", 0, 0],
      ["B", 5, 0],
      ["C", 10, 0],
      ["D", 20, 0],
      ["R", 5, 2],
    ] as const)
      node(`${name}${id}`, id, { x, y, z }, name === "R" ? "room" : "corridor");
    edge(`AB${id}`, `A${id}`, `B${id}`);
    edge(`BC${id}`, `B${id}`, `C${id}`);
    edge(`CD${id}`, `C${id}`, `D${id}`);
    const doorId = `door-${id}`;
    edge(`BR${id}`, `B${id}`, `R${id}`, "door", null, doorId);
    navigation.doors.push({
      id: doorId,
      floorId: id,
      sideA: { kind: "region", regionId: `${id}:corridor` },
      sideB: { kind: "region", regionId: `${id}:room` },
      direction: "both",
      edgeIds: [`BR${id}`],
      access: access(),
    });
    place(`LAW-${id}01`, id, [`A${id}`]);
    place(`LAW-${id}02`, id, [`C${id}`]);
    place(`LAW-${id}03`, id, [`R${id}`]);
  }
  place("LAW-ENTRANCE", "1", ["A1"], "entrance");
  place("LAW-MULTI", "1", ["D1", "A1"]);
  for (const [id, kind, prefix] of [
    ["lift", "elevator", "D"],
    ["stair", "stairs", "B"],
  ] as const) {
    const edgeIds = [`${id}-12`, `${id}-23`];
    edge(edgeIds[0]!, `${prefix}1`, `${prefix}2`, kind, id);
    edge(edgeIds[1]!, `${prefix}2`, `${prefix}3`, kind, id);
    navigation.connectors.push({
      id,
      kind,
      floorIds: ["1", "2", "3"],
      edgeIds,
      access: access(),
    });
  }
  navigation.referenceEntrances.push({
    placeId: "LAW-ENTRANCE",
    accessPointId: "LAW-ENTRANCE:access:0",
  });
  const other = structuredClone(building);
  other.id = other.code = "VKC";
  other.name = "Medicine Crow Center";
  other.aliases = ["DMC", "Von KleinSmid Center"];
  other.floors = [];
  other.capabilities = {
    ...other.capabilities,
    navigation: false,
    verifiedStepFreeRouting: false,
  };
  return {
    dataVersion: version,
    buildings: [building, other],
    places,
    scenes: [],
    floorGeometry: [],
    navigation: [navigation],
  };
}
export const intent = (
  patch: Partial<NavigationIntent> = {},
): NavigationIntent => ({
  kind: "find_building",
  query: "LAW",
  buildingHint: null,
  originQuery: null,
  requestedMode: null,
  requestedStepFree: null,
  reference: "none",
  question: null,
  restroomGoal: null,
  exitQuery: null,
  destinationQuery: null,
  stopKind: null,
  ...patch,
});
export const makeServices = (
  snapshot = fixture(),
  adapter: IntentAdapter = { interpret: async () => intent() },
) => {
  const datasets = new SnapshotStore([snapshot], snapshot.dataVersion);
  return createServices(
    datasets,
    () => snapshot.dataVersion,
    "test-only-cursor-secret-at-least-thirty-two-bytes",
    adapter,
  );
};
export const routeRequest = (
  patch: Partial<RouteRequest> = {},
): RouteRequest => ({
  clientRequestId: randomUUID(),
  dataVersion: version,
  origin: { kind: "place", buildingId: "LAW", placeId: "LAW-101" },
  destination: { kind: "place", buildingId: "LAW", placeId: "LAW-301" },
  mode: "fastest",
  stepFree: false,
  accessProfile: "public",
  ...patch,
});
export const chatRequest = (
  patch: Partial<ChatTextRequest> = {},
): ChatTextRequest => ({
  clientRequestId: randomUUID(),
  dataVersion: version,
  message: "Show LAW",
  history: [],
  context: {
    buildingId: null,
    floorId: null,
    origin: null,
    selectedPlace: null,
  },
  preferences: { mode: "fastest", stepFree: false, accessProfile: "public" },
  ...patch,
});
