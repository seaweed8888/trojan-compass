import type { DatasetPort, RequestScope } from "../../ports/service-ports.js";
import { AppError, invalid, missing } from "../../lib/errors.js";

/** Our normalized contract, not an assertion about any USC upstream API. */
export type CatalogRecord = {
  id: string;
  kind: "class" | "event";
  title: string;
  aliases: string[];
  description: string;
  courseCode: string | null;
  section: string | null;
  organizer: string | null;
  startsAt: string;
  endsAt: string;
  timeZone: "America/Los_Angeles";
  location: {
    buildingId: string;
    floorId: string;
    placeId: string;
    label: string;
  };
  source: { kind: "synthetic"; official: false; url: null; note: string };
};

const source: CatalogRecord["source"] = {
  kind: "synthetic",
  official: false,
  url: null,
  note: "Demo fixture. Time, room, section and description are invented; not an official USC listing or room reservation.",
};
function record(
  id: string,
  kind: CatalogRecord["kind"],
  title: string,
  aliases: string[],
  room: string,
  floor: string,
  start: string,
  end: string,
  courseCode: string | null,
  organizer: string | null,
): CatalogRecord {
  return {
    id,
    kind,
    title,
    aliases,
    description: `${title} — illustrative Trojan Compass demo occurrence.`,
    courseCode,
    section: kind === "class" ? "DEMO-01" : null,
    organizer,
    startsAt: start,
    endsAt: end,
    timeZone: "America/Los_Angeles",
    location: {
      buildingId: "LAW",
      floorId: floor,
      placeId: `LAW-${room}`,
      label: `LAW ${room}`,
    },
    source: { ...source },
  };
}

// One occurrence per record. A future schedule importer can expand recurring meetings.
export const demoRecords: readonly CatalogRecord[] = [
  record(
    "demo-csci-356",
    "class",
    "CSCI 356",
    ["csci356", "computer science 356"],
    "101",
    "1",
    "2026-11-16T09:30:00-08:00",
    "2026-11-16T10:50:00-08:00",
    "CSCI 356",
    null,
  ),
  record(
    "demo-writ-340",
    "class",
    "WRIT 340",
    ["writ340", "writing 340"],
    "201",
    "2",
    "2026-11-16T11:00:00-08:00",
    "2026-11-16T12:20:00-08:00",
    "WRIT 340",
    null,
  ),
  record(
    "demo-ee-354",
    "class",
    "EE 354",
    ["ee354", "electrical engineering 354"],
    "213",
    "2",
    "2026-11-16T13:00:00-08:00",
    "2026-11-16T14:20:00-08:00",
    "EE 354",
    null,
  ),
  record(
    "demo-buad-298",
    "class",
    "BUAD 298 AI Essentials",
    [
      "buad298",
      "buad 298",
      "AI Essentials",
      "artificial intelligence essentials",
    ],
    "303",
    "3",
    "2026-11-16T14:30:00-08:00",
    "2026-11-16T15:50:00-08:00",
    "BUAD 298",
    null,
  ),
  record(
    "demo-casa-dumplings",
    "event",
    "CASA Dumpling Making",
    ["casa", "dumpling making", "dumplings"],
    "103",
    "1",
    "2026-11-16T17:00:00-08:00",
    "2026-11-16T18:30:00-08:00",
    null,
    "CASA",
  ),
  record(
    "demo-isa-food",
    "event",
    "ISA Global Food Fest",
    ["isa", "global food fest", "food festival"],
    "300",
    "3",
    "2026-11-16T18:00:00-08:00",
    "2026-11-16T20:00:00-08:00",
    null,
    "ISA",
  ),
  record(
    "demo-ais-navratri",
    "event",
    "AIS USC Navratri",
    ["ais", "navratri", "ais navratri"],
    "431",
    "4",
    "2026-11-16T19:00:00-08:00",
    "2026-11-16T21:00:00-08:00",
    null,
    "AIS USC",
  ),
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const stop = new Set(
  "show me where is the a an take to find go get how do i my class event please at from using stairs elevator elevators route directions am in building law".split(
    " ",
  ),
);
export class DemoCatalog {
  readonly catalogVersion = "demo-catalog-v2";
  private readonly records: CatalogRecord[];
  constructor(
    records: readonly CatalogRecord[] = demoRecords,
    readonly dataVersion = "prototype-v1",
  ) {
    this.records = structuredClone([...records]);
    const ids = new Set<string>();
    for (const r of this.records) {
      if (
        ids.has(r.id) ||
        !r.id ||
        r.location.buildingId !== "LAW" ||
        !r.source ||
        r.source.kind !== "synthetic" ||
        r.source.official !== false ||
        !Number.isFinite(Date.parse(r.startsAt)) ||
        !(Date.parse(r.endsAt) > Date.parse(r.startsAt))
      )
        throw new Error("Invalid demo catalog fixture");
      ids.add(r.id);
    }
  }
  assertVersion(version: string) {
    if (version !== this.dataVersion)
      throw new AppError(
        "DATA_VERSION_MISMATCH",
        409,
        "This demo catalog belongs to a different map dataset.",
      );
  }
  static async forSnapshot(datasets: DatasetPort, scope: RequestScope) {
    const buildings = await datasets.listBuildings(scope);
    if (
      !buildings.some(
        (b) =>
          b.id === "LAW" &&
          (b.coverage === "demo" || b.provenance.dataKind === "demo"),
      )
    )
      return undefined;
    const places = await datasets.listPlaces(scope, "LAW");
    const records = demoRecords.filter((r) =>
      places.some(
        (p) => p.id === r.location.placeId && p.floorId === r.location.floorId,
      ),
    );
    return records.length
      ? new DemoCatalog(records, scope.dataVersion)
      : undefined;
  }
  async validateLocations(datasets: DatasetPort, scope: RequestScope) {
    this.assertVersion(scope.dataVersion);
    for (const record of this.records) {
      const p = await datasets.getPlace(
        scope,
        record.location.buildingId,
        record.location.placeId,
      );
      if (p.floorId !== record.location.floorId)
        throw new Error(`Demo catalog floor mismatch: ${record.id}`);
    }
  }
  get(id: string) {
    const found = this.records.find((r) => r.id === id);
    if (!found) throw missing("Catalog record");
    return structuredClone(found);
  }
  search(query: string, kind?: CatalogRecord["kind"]) {
    if (query.length > 4000) throw invalid("Catalog query is too long.", "q");
    const q = normalize(query);
    const tokens = q.split(" ").filter((t) => t && !stop.has(t));
    return this.records
      .filter((r) => !kind || r.kind === kind)
      .map((r) => {
        const names = [
          r.id,
          r.title,
          ...r.aliases,
          r.courseCode ?? "",
          r.organizer ?? "",
        ]
          .map(normalize)
          .filter(Boolean);
        const exact = names.includes(q);
        const phrase = names.some(
          (n) =>
            !["isa", "ais", "casa", "ais usc"].includes(n) &&
            ` ${q} `.includes(` ${n} `),
        );
        const words = new Set(names.join(" ").split(" "));
        const overlap = tokens.filter((t) => words.has(t)).length;
        const nameMatch = tokens.some((t) => /[a-z]/.test(t) && words.has(t));
        // Never match a different course solely because its department matches.
        const numberMismatch =
          /\b\d{3}\b/.test(q) &&
          r.kind === "class" &&
          !q.split(" ").includes((r.courseCode ?? "").split(" ").at(-1)!);
        return {
          r,
          score: !q
            ? 1
            : numberMismatch
              ? 0
              : exact
                ? 100
                : phrase
                  ? 80
                  : nameMatch &&
                      (overlap >= 2 || (tokens.length === 1 && overlap === 1))
                    ? 40 + overlap
                    : 0,
        };
      })
      .filter((x) => x.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.r.startsAt.localeCompare(b.r.startsAt) ||
          a.r.id.localeCompare(b.r.id),
      )
      .map((x) => structuredClone(x.r));
  }
  describe(r: CatalogRecord) {
    const date = new Intl.DateTimeFormat("en-US", {
      timeZone: r.timeZone,
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(r.startsAt));
    const time = new Intl.DateTimeFormat("en-US", {
      timeZone: r.timeZone,
      hour: "numeric",
      minute: "2-digit",
    });
    return `[Demo] ${r.title}: ${date}, ${time.format(new Date(r.startsAt))}–${time.format(new Date(r.endsAt))} Pacific, ${r.location.label}.`;
  }
}
