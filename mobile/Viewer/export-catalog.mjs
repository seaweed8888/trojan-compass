import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
const read = (path) =>
  JSON.parse(readFileSync(new URL("../../" + path, import.meta.url), "utf8"));
const { dataVersion } = read("server/data/snapshots/current.json");
const snapshot = "server/data/snapshots/" + dataVersion;
const resources = new URL("../TrojanCompass/Resources/", import.meta.url);
const scenes = read(snapshot + "/manifest.json").buildingIds.map((id) => {
  const directory = snapshot + "/buildings/" + id;
  const building = read(directory + "/building.json"),
    places = read(directory + "/places.json");
  return {
    building,
    floors: read(directory + "/floors.json").map((floor) => ({
      dataVersion,
      floor,
      places: places.filter((p) => p.floorId === floor.id),
      geometry: read(directory + "/geometry/" + floor.id + ".json"),
    })),
  };
});
const interiors = scenes.map(({ building, floors }) => ({
  id: building.id,
  name: building.name,
  detail: building.description || "",
  floors: floors.map((f) => f.floor.id),
  places: floors.flatMap((f) =>
    f.places.map((p) => ({
      id: p.id,
      buildingId: p.buildingId,
      floorId: p.floorId,
      label: p.displayLabel,
      detail: p.description || "",
      kind: p.kind === "classroom" ? "room" : p.kind,
      ...p.position,
      isRamp: p.access.isRamp === true,
      stepFreeAccess: p.access.stepFreeAccess,
    })),
  ),
}));
const locations = read("demos/usc-map/locations.json")
  .filter((l) => ["Buildings", "Parking"].includes(l.category))
  .map((l) => {
    const code = /Medicine Crow/i.test(l.name) ? "VKC" : l.code;
    return {
      id: String(l.id),
      code: code || "",
      name: l.name,
      category: l.category,
      latitude: l.lat,
      longitude: l.lng,
      paths: l.paths || [],
      interiorId: interiors.find((b) => b.id === code)?.id,
      aliases: code === "VKC" ? ["Medicine Crow", "Von KleinSmid", "DMC"] : [],
    };
  });
// Offline preview only: copied from the canonical snapshot, never used to calculate routes.
writeFileSync(
  new URL("preview-catalog.json", resources),
  JSON.stringify({ interiors, locations }) + "\n",
);
writeFileSync(
  new URL("preview-scenes.json", resources),
  JSON.stringify({ dataVersion, scenes }) + "\n",
);
mkdirSync(new URL("Fixtures", resources), { recursive: true });
cpSync(
  new URL("../../shared/fixtures/examples", import.meta.url),
  new URL("Fixtures", resources),
  { recursive: true },
);
console.log("Exported canonical snapshot preview and shared API fixtures.");
