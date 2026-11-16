import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { SnapshotStore, type DatasetSnapshot } from "./snapshot-store.js";
import { dataError } from "../../lib/errors.js";
import type {
  Building,
  Place,
  Scene,
  FloorGeometry,
} from "@trojan-compass/shared/api";
import type { PublishedNavigation } from "./publication-format.js";
import { publicationNavigation } from "./publication-navigation.js";

/** Load a complete publication at startup. No request-controlled filenames or partial hot reloads. */
export async function loadSnapshots(
  directory: string,
  options: { chatEnabled?: boolean; production?: boolean } = {},
): Promise<SnapshotStore> {
  const root = await realpath(directory);
  const read = async (path: string, maxBytes: number) => {
    const actual = await realpath(resolve(root, path));
    if (!actual.startsWith(root + sep))
      throw dataError("snapshot file escapes dataset root");
    if ((await stat(actual)).size > maxBytes)
      throw dataError("snapshot file exceeds size limit");
    return JSON.parse(await readFile(actual, "utf8"));
  };
  const manifest = await read("current.json", 16_384);
  if (manifest && typeof manifest.dataVersion === "string") {
    const version = manifest.dataVersion;
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(version))
      throw dataError("invalid publication version");
    const index = await read(`${version}/manifest.json`, 16384);
    if (
      index.dataVersion !== version ||
      !Array.isArray(index.buildingIds) ||
      !index.buildingIds.length ||
      new Set(index.buildingIds).size !== index.buildingIds.length ||
      index.buildingIds.some(
        (id: unknown) =>
          typeof id !== "string" ||
          !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(id),
      )
    )
      throw dataError("invalid building manifest");
    const snapshot: DatasetSnapshot = {
      dataVersion: version,
      buildings: [],
      places: [],
      scenes: [],
      floorGeometry: [],
      navigation: [],
    };
    for (const id of index.buildingIds as string[]) {
      const base = `${version}/buildings/${id}/`;
      const building = (await read(
        base + "building.json",
        1024 * 1024,
      )) as Building;
      const places = (await read(
        base + "places.json",
        8 * 1024 * 1024,
      )) as Place[];
      const scene = (await read(base + "scene.json", 1024 * 1024)) as Scene;
      const floorRecords = await read(base + "floors.json", 1024 * 1024);
      if (
        building.id !== id ||
        JSON.stringify(floorRecords) !== JSON.stringify(building.floors)
      )
        throw dataError("published floor records disagree");
      const viewerBase = process.env.VIEWER_BASE_URL ?? "http://localhost:3000";
      const apiBase =
        process.env.PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";
      building.viewerUrl = new URL(building.viewerUrl, viewerBase).href;
      scene.viewerUrl = new URL(scene.viewerUrl, viewerBase).href;
      for (const f of scene.floors)
        f.geometryUrl = new URL(f.geometryUrl, apiBase).href;
      snapshot.buildings.push(building);
      snapshot.places.push(...places);
      snapshot.scenes.push(scene);
      for (const f of building.floors) {
        if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(f.id))
          throw dataError("unsafe floor id");
        snapshot.floorGeometry.push(
          (await read(
            base + `geometry/${f.id}.json`,
            8 * 1024 * 1024,
          )) as FloorGeometry,
        );
      }
      const topology = await read(
        base + "navigation/topology.json",
        8 * 1024 * 1024,
      );
      const source: PublishedNavigation = {
        ...topology,
        buildingId: id,
        dataVersion: version,
        walkable: await read(
          base + "navigation/walkable-areas.json",
          8 * 1024 * 1024,
        ),
        barriers: await read(
          base + "navigation/barriers.json",
          8 * 1024 * 1024,
        ),
        connectors: await read(
          base + "navigation/connectors.json",
          1024 * 1024,
        ),
      };
      snapshot.navigation.push(
        publicationNavigation(
          source,
          building,
          places,
          snapshot.floorGeometry.filter((g) => g.buildingId === id),
        ),
      );
    }
    return new SnapshotStore([snapshot], version, options);
  }
  if (
    !manifest ||
    typeof manifest.currentVersion !== "string" ||
    !Array.isArray(manifest.availableVersions) ||
    manifest.availableVersions.length < 1 ||
    manifest.availableVersions.length > 8 ||
    manifest.availableVersions.some(
      (v: unknown) =>
        typeof v !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(v),
    )
  ) {
    throw dataError("invalid current.json publication manifest");
  }
  const snapshots: DatasetSnapshot[] = [];
  for (const version of manifest.availableVersions) {
    const snapshot = await read(`${version}/dataset.json`, 32 * 1024 * 1024);
    if (snapshot.dataVersion !== version)
      throw dataError("snapshot filename/version mismatch");
    snapshots.push(snapshot);
  }
  return new SnapshotStore(snapshots, manifest.currentVersion, options);
}
