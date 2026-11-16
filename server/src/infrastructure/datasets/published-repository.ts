import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type {
  Building,
  BuildingSummary,
  Floor,
  FloorGeometry,
  Place,
  Scene,
} from "@trojan-compass/shared";
import type { RequestScope } from "../../ports/service-ports.js";
import type { PublishedNavigation as NavigationSource } from "./publication-format.js";
import { repositoryRoot, validate } from "../contract.js";
import { Failure, missing } from "../../middleware/failure.js";

export class SnapshotRepository {
  private cache = new Map<string, Promise<unknown>>();
  readonly root: URL;
  constructor(root?: string) {
    this.root = root
      ? pathToFileURL(resolve(root) + "/")
      : new URL("server/data/snapshots/", repositoryRoot);
  }
  private async json<T>(path: string): Promise<T> {
    let value = this.cache.get(path);
    if (!value) {
      value = readFile(new URL(path, this.root), "utf8").then(JSON.parse);
      this.cache.set(path, value);
      value.catch(() => this.cache.delete(path));
    }
    return value as Promise<T>;
  }
  async currentVersion() {
    return JSON.parse(
      await readFile(new URL("current.json", this.root), "utf8"),
    ).dataVersion as string;
  }
  async assertSnapshot(scope: RequestScope) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(scope.dataVersion))
      throw new Failure(
        "DATA_VERSION_UNAVAILABLE",
        410,
        "Requested dataset snapshot is unavailable.",
      );
    try {
      const manifest = await this.json<{ dataVersion: string }>(
        `${scope.dataVersion}/manifest.json`,
      );
      if (manifest.dataVersion !== scope.dataVersion)
        throw new Error("Snapshot manifest mismatch");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        throw new Failure(
          "DATA_VERSION_UNAVAILABLE",
          410,
          "Requested dataset snapshot is unavailable.",
        );
      throw error;
    }
    scope.signal?.throwIfAborted();
  }
  private async read<T>(
    scope: RequestScope,
    buildingId: string,
    file: string,
  ): Promise<T> {
    await this.assertSnapshot(scope);
    const manifest = await this.json<{ buildingIds: string[] }>(
      `${scope.dataVersion}/manifest.json`,
    );
    if (!manifest.buildingIds.includes(buildingId))
      missing("Building was not found in this snapshot.");
    return structuredClone(
      await this.json<T>(
        `${scope.dataVersion}/buildings/${buildingId}/${file}`,
      ),
    );
  }
  async listBuildings(scope: RequestScope): Promise<BuildingSummary[]> {
    await this.assertSnapshot(scope);
    const manifest = await this.json<{ buildingIds: string[] }>(
      `${scope.dataVersion}/manifest.json`,
    );
    const buildings = await Promise.all(
      manifest.buildingIds.map((id) => this.getBuilding(scope, id)),
    );
    return buildings.map(
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
    const value = await this.read<Building>(scope, id, "building.json");
    value.viewerUrl = new URL(
      `/?building=${encodeURIComponent(id)}`,
      process.env.VIEWER_BASE_URL ?? "http://localhost:3000",
    ).href;
    validate<Building>("Building", value, true);
    return value;
  }
  async getFloor(scope: RequestScope, id: string, floorId: string) {
    const floor = (await this.read<Floor[]>(scope, id, "floors.json")).find(
      (f) => f.id === floorId,
    );
    if (!floor) missing("Floor was not found in this building.");
    validate<Floor>("Floor", floor, true);
    return floor;
  }
  async getFloorGeometry(scope: RequestScope, id: string, floorId: string) {
    await this.getFloor(scope, id, floorId);
    const geometry = await this.read<FloorGeometry>(
      scope,
      id,
      `geometry/${floorId}.json`,
    );
    validate<FloorGeometry>("FloorGeometry", geometry, true);
    const keys = new Set<string>();
    for (const o of geometry.objects) {
      if (keys.has(o.objectKey)) throw new Error("Duplicate scene object key");
      keys.add(o.objectKey);
    }
    return geometry;
  }
  async listPlaces(scope: RequestScope, id?: string): Promise<Place[]> {
    if (!id) {
      const buildings = await this.listBuildings(scope);
      return (
        await Promise.all(buildings.map((b) => this.listPlaces(scope, b.id)))
      ).flat();
    }
    const places = await this.read<Place[]>(scope, id, "places.json");
    const ids = new Set<string>();
    for (const p of places) {
      validate<Place>("Place", p, true);
      if (ids.has(p.id) || p.buildingId !== id)
        throw new Error("Invalid canonical place identity");
      ids.add(p.id);
    }
    return places;
  }
  async getPlace(scope: RequestScope, id: string, placeId: string) {
    const place = (await this.listPlaces(scope, id)).find(
      (p) => p.id === placeId,
    );
    if (!place) missing("Place was not found in this building.");
    return place;
  }
  async getScene(scope: RequestScope, id: string) {
    const scene = await this.read<Scene>(scope, id, "scene.json");
    scene.viewerUrl = new URL(
      `/?building=${encodeURIComponent(id)}`,
      process.env.VIEWER_BASE_URL ?? "http://localhost:3000",
    ).href;
    for (const f of scene.floors)
      f.geometryUrl = new URL(
        `/api/buildings/${encodeURIComponent(id)}/floors/${encodeURIComponent(f.floorId)}?dataVersion=${encodeURIComponent(scope.dataVersion)}`,
        process.env.PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000",
      ).href;
    validate<Scene>("Scene", scene, true);
    return scene;
  }
  async getNavigationSource(
    scope: RequestScope,
    id: string,
  ): Promise<NavigationSource> {
    const topology = await this.read<
      Pick<NavigationSource, "nodes" | "edges" | "provenance">
    >(scope, id, "navigation/topology.json");
    const [walkable, barriers, connectors] = await Promise.all([
      this.read<NavigationSource["walkable"]>(
        scope,
        id,
        "navigation/walkable-areas.json",
      ),
      this.read<NavigationSource["barriers"]>(
        scope,
        id,
        "navigation/barriers.json",
      ),
      this.read<NavigationSource["connectors"]>(
        scope,
        id,
        "navigation/connectors.json",
      ),
    ]);
    return {
      buildingId: id,
      dataVersion: scope.dataVersion,
      ...topology,
      walkable,
      barriers,
      connectors,
    };
  }
}
