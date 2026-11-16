import type { DatasetPort, RequestScope } from "../../ports/service-ports.js";
/** Thin data-read service: replace DatasetPort without changing the HTTP or AI layers. */
export class BuildingsService {
  constructor(private readonly datasets: DatasetPort) {}
  get(scope: RequestScope, buildingId: string) {
    return this.datasets.getBuilding(scope, buildingId);
  }
  async floors(scope: RequestScope, buildingId: string) {
    return [...(await this.get(scope, buildingId)).floors].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
    );
  }
  async floor(scope: RequestScope, buildingId: string, floorId: string) {
    const [floor, places, geometry] = await Promise.all([
      this.datasets.getFloor(scope, buildingId, floorId),
      this.datasets.listPlaces(scope, buildingId),
      this.datasets.getFloorGeometry?.(scope, buildingId, floorId) ?? null,
    ]);
    return {
      floor,
      geometry,
      places: places.filter((p) => p.floorId === floorId),
    };
  }
}
