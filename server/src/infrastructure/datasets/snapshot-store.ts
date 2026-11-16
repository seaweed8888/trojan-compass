import type {
  Bounds3,
  Building,
  BuildingSummary,
  FloorGeometry,
  Place,
  Scene,
} from "@trojan-compass/shared/api";
import type {
  DatasetPort,
  NavigationSource,
  RequestScope,
} from "../../ports/service-ports.js";
import { assertContract } from "../../lib/contracts.js";
import { AppError, dataError, disabled, missing } from "../../lib/errors.js";
import { deepFreeze } from "../../lib/cache.js";
import { checkScope } from "../../lib/scope.js";

export interface DatasetSnapshot {
  dataVersion: string;
  buildings: Building[];
  places: Place[];
  scenes: Scene[];
  floorGeometry: FloorGeometry[];
  navigation: NavigationSource[];
}
const key = (...parts: string[]) => JSON.stringify(parts);
const validBounds = (bounds: Bounds3) => {
  if (
    ["x", "y", "z"].some(
      (axis) =>
        bounds.min[axis as keyof Bounds3["min"]] >
        bounds.max[axis as keyof Bounds3["max"]],
    )
  )
    throw dataError("inverted geometry bounds");
};
const webUrl = (value: string) => {
  if (!["https:", "http:"].includes(new URL(value).protocol))
    throw dataError("asset and source URLs must use HTTP or HTTPS");
};
const unique = <T>(items: T[], id: (item: T) => string, label: string) => {
  const result = new Map<string, T>();
  for (const item of items) {
    const k = id(item);
    if (result.has(k)) throw dataError(`duplicate ${label}: ${k}`);
    result.set(k, item);
  }
  return result;
};

/** In-memory immutable adapter; file loading and version publication stay outside services. */
export class SnapshotStore implements DatasetPort {
  private readonly snapshots = new Map<
    string,
    {
      value: DatasetSnapshot;
      buildings: Map<string, Building>;
      places: Map<string, Place>;
      scenes: Map<string, Scene>;
      geometry: Map<string, FloorGeometry>;
      navigation: Map<string, NavigationSource>;
    }
  >();
  constructor(
    snapshots: DatasetSnapshot[],
    readonly currentVersion: string,
    options: { chatEnabled?: boolean; production?: boolean } = {},
  ) {
    for (const input of snapshots) {
      const s = structuredClone(input);
      assertContract("DataVersion", s.dataVersion);
      if (!Array.isArray(s.navigation))
        throw dataError("navigation collection is missing");
      if (this.snapshots.has(s.dataVersion))
        throw dataError("duplicate snapshot version");
      for (const [name, records] of [
        ["Building", s.buildings],
        ["Place", s.places],
        ["Scene", s.scenes],
        ["FloorGeometry", s.floorGeometry],
      ] as const) {
        if (!Array.isArray(records))
          throw dataError(`${name} collection is missing`);
        for (const record of records) assertContract(name, record);
      }
      const buildings = unique(s.buildings, (b) => b.id, "building");
      const places = unique(s.places, (p) => key(p.buildingId, p.id), "place");
      const scenes = unique(s.scenes, (x) => x.buildingId, "scene");
      const geometry = unique(
        s.floorGeometry,
        (g) => key(g.buildingId, g.floorId),
        "floor geometry",
      );
      const navigation = unique(
        s.navigation,
        (n) => n.buildingId,
        "navigation",
      );
      const floor = (buildingId: string, floorId: string) => {
        const result = buildings
          .get(buildingId)
          ?.floors.find((f) => f.id === floorId);
        if (!result) throw dataError(`unknown floor ${buildingId}/${floorId}`);
        return result;
      };
      for (const b of s.buildings) {
        if (options.chatEnabled === false) b.capabilities.chatText = false;
        if (
          options.production &&
          (b.provenance.dataKind === "demo" ||
            b.provenance.verificationStatus === "unverified" ||
            b.coverage === "demo")
        )
          throw dataError(
            "production publications require reviewed, non-demo building records",
          );
        validBounds(b.bounds);
        webUrl(b.viewerUrl);
        if (b.officialMapUrl) webUrl(b.officialMapUrl);
        for (const source of b.sources) webUrl(source.url);
        unique(b.floors, (f) => f.id, "floor");
        for (const f of b.floors) {
          validBounds(f.bounds);
          if (f.buildingId !== b.id) throw dataError("floor building mismatch");
        }
        if (b.capabilities.navigation !== navigation.has(b.id))
          throw dataError(`navigation capability mismatch for ${b.id}`);
        if (b.capabilities.interiorScene !== scenes.has(b.id))
          throw dataError(`scene capability mismatch for ${b.id}`);
        if (b.capabilities.chatImages || b.capabilities.events)
          throw dataError("image/event capabilities are not implemented");
      }
      for (const p of s.places) {
        floor(p.buildingId, p.floorId);
        if (p.bounds) validBounds(p.bounds);
        unique(p.accessPoints, (a) => a.id, "access point");
      }
      for (const scene of s.scenes) {
        validBounds(scene.bounds);
        webUrl(scene.viewerUrl);
        const b = buildings.get(scene.buildingId);
        if (
          !b ||
          JSON.stringify(scene.coordinateSystem) !==
            JSON.stringify(b.coordinateSystem)
        )
          throw dataError("scene coordinate system mismatch");
        for (const f of scene.floors) {
          floor(b.id, f.floorId);
          webUrl(f.geometryUrl);
        }
        if (scene.representation === "model") webUrl(scene.asset.url);
        if (scene.representation === "model")
          for (const binding of scene.nodeBindings) {
            floor(b.id, binding.floorId);
            if (binding.placeId && !places.has(key(b.id, binding.placeId)))
              throw dataError("unknown scene place binding");
          }
      }
      for (const g of s.floorGeometry) {
        validBounds(g.bounds);
        floor(g.buildingId, g.floorId);
        if (
          JSON.stringify(g.coordinateSystem) !==
          JSON.stringify(buildings.get(g.buildingId)!.coordinateSystem)
        )
          throw dataError("floor geometry coordinate system mismatch");
        unique(g.objects, (o) => o.objectKey, "scene object");
        for (const o of g.objects) {
          if (
            o.placeId &&
            (!places.has(key(g.buildingId, o.placeId)) ||
              places.get(key(g.buildingId, o.placeId))!.floorId !== g.floorId)
          )
            throw dataError("unknown geometry place/floor");
          if (
            o.kind === "mesh" &&
            (o.triangles.length % 3 !== 0 ||
              o.triangles.some((i) => i >= o.vertices.length) ||
              (o.normals && o.normals.length !== o.vertices.length))
          )
            throw dataError("invalid mesh indices/normals");
        }
        for (const label of g.labels)
          if (
            places.get(key(g.buildingId, label.placeId))?.floorId !== g.floorId
          )
            throw dataError("unknown label place/floor");
      }
      for (const n of s.navigation) {
        if (!buildings.has(n.buildingId) || n.dataVersion !== s.dataVersion)
          throw dataError("navigation snapshot mismatch");
        if (
          options.production &&
          (n.provenance.dataKind === "demo" ||
            n.provenance.verificationStatus === "unverified")
        )
          throw dataError("production navigation requires reviewed provenance");
      }
      deepFreeze(s);
      this.snapshots.set(s.dataVersion, {
        value: s,
        buildings,
        places,
        scenes,
        geometry,
        navigation,
      });
    }
    if (!this.snapshots.has(currentVersion))
      throw dataError("current snapshot is not available");
  }
  private snapshot(scope: RequestScope) {
    checkScope(scope);
    const s = this.snapshots.get(scope.dataVersion);
    if (!s)
      throw new AppError(
        "DATA_VERSION_UNAVAILABLE",
        410,
        "This data version is unavailable. Reload the building directory.",
      );
    return s;
  }
  async assertSnapshot(scope: RequestScope) {
    this.snapshot(scope);
  }
  async listBuildings(scope: RequestScope): Promise<BuildingSummary[]> {
    return this.snapshot(scope).value.buildings.map(
      ({
        id,
        code,
        name,
        aliases,
        location,
        coverage,
        capabilities,
        provenance,
      }) => ({
        id,
        code,
        name,
        aliases,
        location,
        coverage,
        capabilities,
        provenance,
      }),
    );
  }
  async getBuilding(scope: RequestScope, id: string) {
    const result = this.snapshot(scope).buildings.get(id);
    if (!result) throw missing("Building");
    return result;
  }
  async getFloor(scope: RequestScope, id: string, floorId: string) {
    const result = (await this.getBuilding(scope, id)).floors.find(
      (f) => f.id === floorId,
    );
    if (!result) throw missing("Floor");
    return result;
  }
  async listPlaces(scope: RequestScope, buildingId?: string) {
    if (buildingId) await this.getBuilding(scope, buildingId);
    return this.snapshot(scope).value.places.filter(
      (p) => !buildingId || p.buildingId === buildingId,
    );
  }
  async getPlace(scope: RequestScope, buildingId: string, placeId: string) {
    const result = this.snapshot(scope).places.get(key(buildingId, placeId));
    if (!result) throw missing("Place");
    return result;
  }
  async getScene(scope: RequestScope, buildingId: string) {
    await this.getBuilding(scope, buildingId);
    const result = this.snapshot(scope).scenes.get(buildingId);
    if (!result)
      throw disabled("An interior scene is not published for this building.");
    return result;
  }
  async getFloorGeometry(
    scope: RequestScope,
    buildingId: string,
    floorId: string,
  ) {
    await this.getFloor(scope, buildingId, floorId);
    return this.snapshot(scope).geometry.get(key(buildingId, floorId)) ?? null;
  }
  async getNavigationSource(scope: RequestScope, buildingId: string) {
    await this.getBuilding(scope, buildingId);
    const result = this.snapshot(scope).navigation.get(buildingId);
    if (!result)
      throw disabled("Navigation is not available for this building.");
    return result;
  }
  versions() {
    return [...this.snapshots.keys()];
  }
}
