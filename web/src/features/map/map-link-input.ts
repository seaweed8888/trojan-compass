import type { BuildingSummary, Route, RouteMode } from "@trojan-compass/shared";
export function parseMapLink(
  query: URLSearchParams,
  buildings: BuildingSummary[],
) {
  const code = query.get("building")?.trim().toLowerCase();
  const building = buildings.find(
    (b) =>
      b.id.toLowerCase() === code ||
      b.aliases.some((alias) => alias.toLowerCase() === code),
  );
  const floor = query.get("floor");
  const mode = query.get("mode");
  const stepFree = query.get("stepFree");
  const via = query.get("via");
  if (stepFree !== null && stepFree !== "true" && stepFree !== "false")
    throw new Error("The map link has an invalid step-free preference.");
  if (via !== null && !via.trim())
    throw new Error("The map link has an empty intermediate stop.");
  return {
    buildingId: building?.id,
    floorId: floor === "B" ? "0" : floor && /^\d+$/.test(floor) ? floor : "1",
    allFloors: floor === "all",
    room: query.get("room"),
    from: query.get("from"),
    to: query.get("to"),
    via,
    stepFree: stepFree === "true",
    mode: (mode === "stairs" || mode === "elevator"
      ? mode
      : "fastest") as RouteMode,
  };
}

export function routeLinkParams(route: Route): URLSearchParams {
  const query = new URLSearchParams();
  if (route.origin.placeId && route.destination.placeId) {
    query.set("from", route.origin.placeId);
    query.set("to", route.destination.placeId);
    query.set("mode", route.mode);
    if (route.stepFreeRequested) query.set("stepFree", "true");
    if (route.via?.placeId) query.set("via", route.via.placeId);
  }
  return query;
}
