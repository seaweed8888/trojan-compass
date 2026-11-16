import type {
  BuildingSummary,
  Place,
  PlaceSearchResult,
} from "@trojan-compass/shared/api";
import type {
  DatasetPort,
  PlaceSearchInput,
  RequestScope,
  SearchPort,
} from "../../ports/service-ports.js";
import { AsyncCache } from "../../lib/cache.js";
import { checkpoint, withinScope } from "../../lib/scope.js";
import { invalid } from "../../lib/errors.js";
import { CursorCodec } from "./cursor.js";
import type { ReachabilityService } from "../routing/reachability.js";

export const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
const compact = (value: string) => normalize(value).replaceAll(" ", "");
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
type Entry<T> = {
  value: T;
  primary: string[];
  aliases: string[];
  floor: number;
};
type Match = { score: number; type: PlaceSearchResult["matchType"] };
function match(entry: Entry<unknown>, query: string): Match | null {
  if (!query) return { score: 4, type: "contains" };
  const q = compact(query);
  if (entry.primary.some((s) => compact(s) === q))
    return { score: 0, type: "exact" };
  if (entry.primary.some((s) => compact(s).startsWith(q)))
    return { score: 1, type: "prefix" };
  if (entry.aliases.some((s) => compact(s) === q || compact(s).startsWith(q)))
    return { score: 2, type: "alias" };
  if ([...entry.primary, ...entry.aliases].some((s) => compact(s).includes(q)))
    return { score: 3, type: "contains" };
  return null;
}
export class SearchService implements SearchPort {
  private readonly cache = new AsyncCache<{
    buildings: Entry<BuildingSummary>[];
    places: Entry<Place>[];
  }>(8);
  constructor(
    private readonly datasets: DatasetPort,
    private readonly cursors: CursorCodec,
    private readonly reachability?: ReachabilityService,
  ) {}
  private index(scope: RequestScope) {
    return withinScope(
      scope,
      this.cache.get(scope.dataVersion, async () => {
        const preparation: RequestScope = {
          requestId: "search-preparation",
          dataVersion: scope.dataVersion,
          deadline: performance.now() + 10000,
        };
        const [summaries, places] = await Promise.all([
          this.datasets.listBuildings(preparation),
          this.datasets.listPlaces(preparation),
        ]);
        const floors = new Map<string, number>();
        for (const b of summaries)
          for (const f of (await this.datasets.getBuilding(preparation, b.id))
            .floors)
            floors.set(JSON.stringify([b.id, f.id]), f.sortOrder);
        return {
          buildings: summaries.map((value) => ({
            value,
            primary: [value.id, value.code, value.name],
            aliases: value.aliases,
            floor: 0,
          })),
          places: places.map((value) => ({
            value,
            primary: [
              value.id,
              value.name,
              value.displayLabel,
              ...(value.roomNumber
                ? [value.roomNumber, `${value.buildingId} ${value.roomNumber}`]
                : []),
            ],
            aliases: value.aliases,
            floor: floors.get(
              JSON.stringify([value.buildingId, value.floorId]),
            )!,
          })),
        };
      }),
    );
  }
  private query(query: string) {
    if (typeof query !== "string" || query.length > 200)
      throw invalid("Search text must be at most 200 characters.", "q");
    return normalize(query);
  }
  async searchBuildings(
    scope: RequestScope,
    input: { query: string; limit: number; cursor?: string },
  ) {
    const query = this.query(input.query);
    const index = await this.index(scope);
    const rows = index.buildings
      .map((entry) => ({ entry, match: match(entry, query) }))
      .filter((r) => r.match !== null)
      .sort(
        (a, b) =>
          a.match!.score - b.match!.score ||
          compare(a.entry.value.code, b.entry.value.code) ||
          compare(a.entry.value.id, b.entry.value.id),
      );
    const page = this.cursors.paginate(
      rows,
      (r) => [r.match!.score, r.entry.value.id],
      [scope.dataVersion, "buildings", query, input.limit],
      input.limit,
      input.cursor,
    );
    return {
      buildings: page.items.map((r) => r.entry.value),
      nextCursor: page.nextCursor,
    };
  }
  async searchPlaces(scope: RequestScope, input: PlaceSearchInput) {
    const query = this.query(input.query);
    if (input.floorId && !input.buildingId)
      throw invalid("floorId requires buildingId.", "floorId");
    if (input.buildingId)
      await this.datasets.getBuilding(scope, input.buildingId);
    if (input.floorId)
      await this.datasets.getFloor(scope, input.buildingId!, input.floorId);
    const index = await this.index(scope);
    const rows: {
      entry: Entry<Place>;
      match: Match;
      evaluation: PlaceSearchResult["stepFreeEvaluation"];
    }[] = [];
    if (query || input.buildingId)
      for (const [i, entry] of index.places.entries()) {
        await checkpoint(scope, i);
        const p = entry.value;
        if (
          (input.buildingId && p.buildingId !== input.buildingId) ||
          (input.floorId && p.floorId !== input.floorId) ||
          (input.kind && p.kind !== input.kind)
        )
          continue;
        const matched = match(entry, query);
        if (!matched) continue;
        const evaluation = input.stepFree
          ? ((await this.reachability?.evaluate(scope, p)) ?? null)
          : null;
        if (input.stepFree && evaluation?.status !== "verified_reachable")
          continue;
        rows.push({ entry, match: matched, evaluation });
      }
    rows.sort(
      (a, b) =>
        a.match.score - b.match.score ||
        (!query ? a.entry.floor - b.entry.floor : 0) ||
        compare(a.entry.value.displayLabel, b.entry.value.displayLabel) ||
        compare(a.entry.value.buildingId, b.entry.value.buildingId) ||
        compare(a.entry.value.id, b.entry.value.id),
    );
    const fingerprint = [
      scope.dataVersion,
      "places",
      query,
      input.buildingId ?? null,
      input.floorId ?? null,
      input.kind ?? null,
      input.stepFree ?? false,
      input.limit,
    ];
    const page = this.cursors.paginate(
      rows,
      (r) => [
        r.match.score,
        r.entry.floor,
        r.entry.value.displayLabel,
        r.entry.value.buildingId,
        r.entry.value.id,
      ],
      fingerprint,
      input.limit,
      input.cursor,
    );
    return {
      results: page.items.map(({ entry, match, evaluation }) => ({
        place: entry.value,
        matchLabel: entry.value.displayLabel,
        secondaryLabel: `${entry.value.buildingId} · Floor ${entry.value.floorId}`,
        matchType: match.type,
        stepFreeEvaluation: evaluation,
      })),
      nextCursor: page.nextCursor,
    };
  }
}
