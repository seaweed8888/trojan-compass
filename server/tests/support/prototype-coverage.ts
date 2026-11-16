import type { BuildingCode } from "../../src/infrastructure/datasets/prototype/campus.js";
import type { RouteMode } from "../../src/modules/routing/prototype/routing.js";

/** Known gaps in authored connector service. Never invent a connector to satisfy a test. */
export function missingPrototypeService(
  code: BuildingCode,
  floor: number,
  mode: RouteMode,
) {
  return (
    (code === "TCC" && floor === 4 && mode === "stairs") ||
    (code === "KAP" && floor === -1 && mode === "elevator")
  );
}
