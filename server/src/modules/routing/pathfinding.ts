import type { RouteMode } from "@trojan-compass/shared/api";
import type { RequestScope } from "../../ports/service-ports.js";
import { checkpoint } from "../../lib/scope.js";
import { allowed, type Arc } from "./graph-store.js";
import type { EndpointCandidate, RouteOverlay } from "./endpoints.js";
import { MinHeap } from "./heap.js";

export type Path = {
  origin: EndpointCandidate;
  destination: EndpointCandidate;
  arcs: { arc: Arc; seconds: number }[];
};
export function travelSeconds(arc: Arc, previousConnector: string | null) {
  if (arc.kind === "elevator")
    return (
      arc.distance / 1.5 + (arc.connectorId === previousConnector ? 0 : 25)
    );
  return (
    arc.distance / (arc.kind === "stairs" ? 0.6 : arc.kind === "ramp" ? 1 : 1.3)
  );
}

export async function findPath(
  overlay: RouteOverlay,
  mode: RouteMode,
  stepFree: boolean,
  scope: RequestScope,
  allowUnknown = false,
): Promise<Path | null> {
  type State = {
    key: string;
    node: string;
    connector: string | null;
    cost: number;
    origin: EndpointCandidate;
    previous: State | null;
    via: Arc | null;
    seconds: number;
  };
  const heap = new MinHeap<State>(
    (a, b) => a.cost - b.cost || a.key.localeCompare(b.key),
  );
  const costs = new Map<string, number>();
  for (const origin of overlay.origins) {
    if (!allowed(origin.policy, mode, stepFree, "walkway", allowUnknown))
      continue;
    const key = JSON.stringify([origin.endpoint.nodeId, null]);
    if (costs.has(key)) continue;
    costs.set(key, 0);
    heap.push({
      key,
      node: origin.endpoint.nodeId,
      connector: null,
      cost: 0,
      origin,
      previous: null,
      via: null,
      seconds: 0,
    });
  }
  const destinations = new Map(
    overlay.destinations
      .filter((d) => allowed(d.policy, mode, stepFree, "walkway", allowUnknown))
      .map((d) => [d.endpoint.nodeId, d]),
  );
  let state: State | undefined,
    count = 0;
  while ((state = heap.pop())) {
    await checkpoint(scope, count++);
    if (state.cost !== costs.get(state.key)) continue;
    const destination = destinations.get(state.node);
    if (destination) {
      const arcs: Path["arcs"] = [];
      let cursor: State = state;
      while (cursor.via) {
        arcs.push({ arc: cursor.via, seconds: cursor.seconds });
        cursor = cursor.previous!;
      }
      return { origin: state.origin, destination, arcs: arcs.reverse() };
    }
    for (const arc of overlay.adjacency.get(state.node) ?? []) {
      if (!allowed(arc.policy, mode, stepFree, arc.kind, allowUnknown))
        continue;
      const connector = arc.kind === "elevator" ? arc.connectorId : null;
      const key = JSON.stringify([arc.to, connector]),
        seconds = travelSeconds(arc, state.connector),
        cost = state.cost + seconds;
      if (cost < (costs.get(key) ?? Infinity)) {
        costs.set(key, cost);
        heap.push({
          key,
          node: arc.to,
          connector,
          cost,
          origin: state.origin,
          previous: state,
          via: arc,
          seconds,
        });
      }
    }
  }
  return null;
}
