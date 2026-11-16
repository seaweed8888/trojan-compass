import type {
  BuildingListResponse,
  Building,
  FloorResponse,
  MapAction,
  Place,
  Scene,
  Route as WireRoute,
} from "@trojan-compass/shared";
import { client } from "@/lib/api-client";
import { installBuilding, validateBuilding } from "./data/viewer-data";
import type { View } from "./types";
import type { BuildingCode } from "./data/campus-display";
import { viewerRoute } from "../routing/viewer-route";
import { installDirectory } from "./data/campus-display";

type Prepared = { building: Building; scene: Scene; floors: FloorResponse[] };
export class ViewerSession {
  private cache = new Map<string, Promise<Prepared>>();
  constructor(readonly directory: BuildingListResponse) {}
  async prepare(id: string): Promise<Prepared> {
    let pending = this.cache.get(id);
    if (!pending) {
      pending = (async () => {
        const [b, s] = await Promise.all([
          client.building(id, this.directory.dataVersion),
          client.scene(id, this.directory.dataVersion),
        ]);
        if (
          b.dataVersion !== this.directory.dataVersion ||
          s.dataVersion !== b.dataVersion
        )
          throw new Error("Dataset changed while loading the scene.");
        if (s.scene.representation !== "procedural")
          throw new Error("This viewer currently supports procedural scenes.");
        const floors = await Promise.all(
          b.building.floors.map((f) => client.floor(id, f.id, b.dataVersion)),
        );
        for (const f of floors) {
          if (f.dataVersion !== b.dataVersion || !f.geometry)
            throw new Error("Floor geometry is unavailable.");
          if (
            !/^\d+$/.test(f.floor.id) ||
            f.geometry.objects.some((o) => o.kind !== "box")
          )
            throw new Error(
              "This scene needs a floor or geometry representation that this viewer does not yet support.",
            );
        }
        return { building: b.building, scene: s.scene, floors };
      })();
      this.cache.set(id, pending);
      pending.catch(() => this.cache.delete(id));
    }
    return pending;
  }
  async actions(actions: MapAction[]) {
    if (!actions.length) throw new Error("No map action was supplied.");
    const ids = new Set<string>();
    for (const action of actions) {
      if (action.type === "show_route") {
        for (const leg of action.route.legs) {
          if (leg.kind === "outdoor")
            throw new Error("Outdoor route drawing is unavailable.");
          ids.add(leg.buildingId);
        }
      } else if (
        ["focus_building", "focus_floor", "focus_place"].includes(action.type)
      )
        ids.add(action.buildingId);
      else throw new Error("Unsupported map action.");
    }
    const prepared = await Promise.all([...ids].map((id) => this.prepare(id)));
    const places = prepared.flatMap((p) => p.floors.flatMap((f) => f.places));
    let view: View | undefined;
    let selected: string | undefined;
    let route: ReturnType<typeof viewerRoute> | undefined;
    let wireRoute: WireRoute | undefined;
    for (const action of actions) {
      if (action.type === "show_route") {
        for (const leg of action.route.legs) {
          if (leg.kind !== "indoor" && leg.kind !== "vertical")
            throw new Error("Unsupported route leg.");
          const building = prepared.find(
            (p) => p.building.id === leg.buildingId,
          )?.building;
          const floors =
            leg.kind === "indoor"
              ? [leg.floorId]
              : [leg.fromFloorId, leg.toFloorId];
          if (
            !building ||
            floors.some((id) => !building.floors.some((f) => f.id === id))
          )
            throw new Error("Route references an unavailable floor.");
        }
        wireRoute = action.route;
        route = viewerRoute(action.route, places);
        view = {
          type: "building",
          code: action.route.origin.buildingId as BuildingCode,
          floor: Number(action.route.origin.floorId),
        };
        selected = action.route.destination.placeId ?? undefined;
      } else {
        const data = prepared.find((p) => p.building.id === action.buildingId)!;
        const floorId =
          action.type === "focus_building"
            ? (data.building.floors.find((f) => f.id === "1") ??
                data.building.floors[0])!.id
            : action.floorId;
        if (!data.building.floors.some((f) => f.id === floorId))
          throw new Error("Action references a missing floor.");
        if (action.type === "focus_place") {
          const place = places.find(
            (p) =>
              p.id === action.placeId &&
              p.buildingId === action.buildingId &&
              p.floorId === floorId,
          );
          if (!place) throw new Error("Action references a missing place.");
          if (
            place.sceneObjectKey &&
            !data.floors.some((f) =>
              f.geometry?.objects.some(
                (o) => o.objectKey === place.sceneObjectKey,
              ),
            )
          )
            throw new Error("Highlight mapping is unavailable.");
          selected = place.id;
        }
        view = {
          type: "building",
          code: action.buildingId as BuildingCode,
          floor: Number(floorId),
        };
      }
    }
    // Validate every target before installing or committing any viewer state.
    for (const p of prepared) validateBuilding(p.building, p.floors);
    return {
      view: view!,
      selected,
      route: route ?? null,
      wireRoute: wireRoute ?? null,
      places,
      commit: () => {
        installDirectory(this.directory.items);
        for (const p of prepared) installBuilding(p.building, p.floors);
      },
    };
  }
  async resolve(query: string, signal?: AbortSignal): Promise<Place> {
    const response = await client.search(
      query,
      this.directory.dataVersion,
      signal,
    );
    if (response.dataVersion !== this.directory.dataVersion)
      throw new Error("Search returned another dataset version.");
    const exact = response.items.filter((r) => r.matchType === "exact");
    const matches = exact.length ? exact : response.items;
    if (matches.length !== 1)
      throw new Error(
        matches.length
          ? "Choose a more specific place or room."
          : "No matching place was found.",
      );
    return matches[0]!.place;
  }
}
