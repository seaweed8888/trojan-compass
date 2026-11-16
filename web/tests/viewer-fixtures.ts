import { readFileSync } from "node:fs";
import { installBuilding } from "../src/features/map/data/viewer-data";
const { dataVersion: version } = JSON.parse(
  readFileSync(
    new URL("../../server/data/snapshots/current.json", import.meta.url),
    "utf8",
  ),
);
const snapshot = new URL(
  `../../server/data/snapshots/${version}/`,
  import.meta.url,
);
const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, snapshot), "utf8"));
export const fixtureBuildings = read("manifest.json").buildingIds.map(
  (id: string) => {
    const building = read(`buildings/${id}/building.json`);
    installBuilding(
      building,
      building.floors.map((f: any) => ({
        requestId: "test",
        dataVersion: version,
        floor: f,
        geometry: read(`buildings/${id}/geometry/${f.id}.json`),
        places: read(`buildings/${id}/places.json`).filter(
          (p: any) => p.floorId === f.id,
        ),
      })),
    );
    return building;
  },
);
