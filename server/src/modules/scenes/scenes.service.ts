import type { DatasetPort, RequestScope } from "../../ports/service-ports.js";
import { AppError } from "../../lib/errors.js";
export class ScenesService {
  constructor(private readonly datasets: DatasetPort) {}
  async get(scope: RequestScope, buildingId: string, representation = "auto") {
    const scene = await this.datasets.getScene(scope, buildingId);
    const format =
      scene.representation === "model" ? scene.asset.format : "procedural";
    if (representation !== "auto" && representation !== format)
      throw new AppError(
        "REPRESENTATION_UNAVAILABLE",
        406,
        "This scene representation is not published. Request auto or the available representation.",
        undefined,
        { available: [format] },
      );
    return scene;
  }
}
