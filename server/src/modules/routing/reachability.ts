import type { Place, PlaceSearchResult } from "@trojan-compass/shared/api";
import type { DatasetPort, RequestScope } from "../../ports/service-ports.js";
import { AsyncCache } from "../../lib/cache.js";
import { checkpoint, withinScope } from "../../lib/scope.js";
import {
  allowed,
  bindingPolicy,
  GraphStore,
  type RuntimeGraph,
} from "./graph-store.js";

export type Evaluation = NonNullable<PlaceSearchResult["stepFreeEvaluation"]>;
export class ReachabilityService {
  private readonly cache = new AsyncCache<Map<string, Evaluation>>(16);
  constructor(
    private readonly datasets: DatasetPort,
    private readonly graphs: GraphStore,
  ) {}
  async evaluate(
    scope: RequestScope,
    place: Place,
  ): Promise<Evaluation | null> {
    const b = await this.datasets.getBuilding(scope, place.buildingId);
    if (!b.capabilities.navigation) return null;
    const evaluations = await withinScope(
      scope,
      this.cache.get(JSON.stringify([scope.dataVersion, b.id]), async () => {
        const preparation: RequestScope = {
          requestId: "reachability-preparation",
          dataVersion: scope.dataVersion,
          deadline: performance.now() + 10000,
        };
        const graph = await this.graphs.get(preparation, b.id);
        const references = graph.source.referenceEntrances.filter((ref) => {
          const p = graph.places.get(ref.placeId)!;
          const binding = graph.bindings
            .get(p.id)!
            .find((a) => a.accessPointId === ref.accessPointId)!;
          return allowed(
            bindingPolicy(graph, p, binding),
            "elevator",
            true,
            "walkway",
          );
        });
        const verified = await this.walk(graph, references, false, preparation);
        const possible = await this.walk(graph, references, true, preparation);
        const result = new Map<string, Evaluation>();
        for (const p of graph.places.values()) {
          if (!references.length) continue;
          const bindings =
            p.access.entryAllowed === true
              ? (graph.bindings.get(p.id) ?? [])
              : [];
          const sure = bindings.find(
            (b) =>
              verified.has(b.nodeId) &&
              allowed(bindingPolicy(graph, p, b), "elevator", true, "walkway"),
          );
          const maybe = bindings.find(
            (b) =>
              possible.has(b.nodeId) &&
              allowed(
                bindingPolicy(graph, p, b),
                "elevator",
                true,
                "walkway",
                true,
              ),
          );
          result.set(p.id, {
            originPlaceId: sure
              ? verified.get(sure.nodeId)!
              : maybe
                ? possible.get(maybe.nodeId)!
                : references[0]!.placeId,
            status: sure
              ? "verified_reachable"
              : maybe
                ? "unknown"
                : "not_reachable",
          });
        }
        return result;
      }),
    );
    return evaluations.get(place.id) ?? null;
  }
  private async walk(
    graph: RuntimeGraph,
    references: { placeId: string; accessPointId: string }[],
    allowUnknown: boolean,
    scope: RequestScope,
  ) {
    const origins = new Map<string, string>();
    const queue: string[] = [];
    for (const ref of references) {
      const node = graph.bindings
        .get(ref.placeId)!
        .find((b) => b.accessPointId === ref.accessPointId)!.nodeId;
      if (!origins.has(node)) {
        origins.set(node, ref.placeId);
        queue.push(node);
      }
    }
    for (let i = 0; i < queue.length; i++) {
      await checkpoint(scope, i);
      const node = queue[i]!;
      for (const arc of graph.adjacency.get(node) ?? [])
        if (
          !origins.has(arc.to) &&
          allowed(arc.policy, "elevator", true, arc.kind, allowUnknown)
        ) {
          origins.set(arc.to, origins.get(node)!);
          queue.push(arc.to);
        }
    }
    return origins;
  }
}
