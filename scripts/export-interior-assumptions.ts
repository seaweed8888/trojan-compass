/** CSV is generated from the actual loaded specs, not a second hand-maintained room list.
 * Run: npx tsx scripts/export-interior-assumptions.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { INTERIORS } from "../server/src/infrastructure/datasets/prototype/interiors/index.js";
import {
  getLayout,
  getLevels,
  floorName,
} from "../server/src/infrastructure/datasets/prototype/floorplan.js";
import type { BuildingCode } from "../server/src/infrastructure/datasets/prototype/campus.js";
import type { Evidence } from "../server/src/infrastructure/datasets/prototype/interiors/types.js";

const columns = [
  "Building code",
  "Building name",
  "Floor",
  "Room number or feature ID",
  "Room/feature name",
  "Feature type",
  "Number status",
  "Position status",
  "Source file, sheet range, or source URL",
  "Assumption notes",
  "Implemented data file and record ID",
  "Exterior-shape source",
  "Floor-count status",
  "Floors implemented",
  "Identity status",
  "Internal floor index",
];
const rows: string[][] = [];
const layouts = [];
for (const [key, spec] of Object.entries(INTERIORS)) {
  const code = key as BuildingCode;
  const file = `server/src/infrastructure/datasets/prototype/interiors/${key.toLowerCase()}.ts`;
  const floors = getLevels(code)
    .map((f) => `${f}=${floorName(f, code)}`)
    .join("; ");
  const add = (
    floor: number | undefined,
    id: string,
    name: string,
    type: string,
    evidence: Evidence,
    record: string,
    notes = "",
  ) => {
    rows.push([
      key,
      spec.name,
      floor === undefined ? "All" : floorName(floor, code),
      id,
      name,
      type,
      evidence.numberStatus,
      evidence.positionStatus,
      evidence.sources.join(" | "),
      [evidence.notes, notes].filter(Boolean).join(" "),
      `${file}#${record}`,
      type.endsWith("summary") ? spec.shapeSource : "",
      type.endsWith("summary") ? spec.floorCountStatus : "",
      type.endsWith("summary") ? floors : "",
      evidence.identityStatus,
      floor === undefined ? "" : String(floor),
    ]);
  };
  const summary: Evidence = {
    numberStatus: "not applicable",
    positionStatus: "inferred",
    identityStatus: "confirmed",
    sources: [spec.shapeSource, "docs/interiors/inputs/buildings.csv"],
    notes: spec.floorCountNotes + " " + spec.shapeNotes,
  };
  add(
    undefined,
    key,
    spec.name,
    "building-summary",
    summary,
    `${key}_RECONSTRUCTION`,
    "All coordinates inferred. Local +x bearing " +
      spec.orientationDegrees +
      " degrees counterclockwise from east. Campus massing scaled to 12 units for the existing stylized campus scene. No verified accessibility or evacuation claim.",
  );
  const cores = new Map<string, { level: number; id: string }[]>();
  for (const [fi, f] of spec.floors.entries()) {
    const L = getLayout(code, f.level);
    layouts.push(L);
    const prefix = `floors[${fi}]`;
    add(
      f.level,
      `${code}-${f.level}`,
      f.name,
      "floor-summary",
      f.evidence,
      prefix,
      spec.floorCountNotes +
        " Whole floor geometry inferred, including all boundaries, circulation, room positions, doors and floor service. Default slab thickness and elevation spacing are demo assumptions. Unassigned floor area is inferred circulation/lobby space. Metric scale is approximate.",
    );
    for (const [ci, c] of L.cells.entries()) {
      add(
        f.level,
        c.number || c.id,
        c.name,
        c.open ? "open-area" : c.kind,
        c.evidence!,
        `${prefix}.records[${ci}] (${c.id}); rooms[${ci}]`,
        `Model ID ${c.id}. Scene rectangle [${c.x0},${c.z0},${c.x1},${c.z1}]. ${c.capacity ? `Capacity ${c.capacity} from identity source; partition size remains inferred.` : "Capacity not modeled."}`,
      );
      add(
        f.level,
        `${c.id}:door`,
        `${c.name} door`,
        "door",
        {
          ...c.evidence!,
          numberStatus: "not applicable",
          identityStatus: "inferred",
        },
        `${prefix}.rooms[${ci}][4] (${c.node}:door)`,
        `Inferred door [${c.door.join(",")}]; connected to explicit corridor endpoint. Gap width uses the existing shared renderer.`,
      );
      if (c.core) {
        const list = cores.get(c.core) ?? [];
        list.push({ level: f.level, id: c.id });
        cores.set(c.core, list);
      }
    }
    for (const [i, slab] of L.slabs.entries())
      add(
        f.level,
        `${code}-${f.level}-SLAB-${i}`,
        `Floor plate ${i + 1}`,
        "floor-slab",
        f.evidence,
        `${prefix}.slabs[${i}]`,
        `Scene rectangle [${slab.join(",")}]. Orthogonal simplification of footprint; no surveyed dimensions.`,
      );
    for (const [i, line] of f.walks.entries())
      add(
        f.level,
        `${code}-${f.level}-WALK-${i}`,
        `Corridor / door spur ${i + 1}`,
        "corridor",
        f.evidence,
        `${prefix}.walks[${i}]`,
        `Page-coordinate centerline ${JSON.stringify(line)}. Loader subdivisions and junctions are routing nodes, not additional physical rooms. Inferred clear corridor width follows the space left between room walls.`,
      );
    for (const e of L.entrances)
      add(
        f.level,
        e.id,
        e.label,
        e.entrance ? "entrance" : "exit",
        e.evidence!,
        `${prefix}.entrances (${e.id})`,
        `Inferred scene position [${e.x},${e.z}]. stepFree=${e.stepFree} is a demo graph assumption, excluded from verified step-free search.`,
      );
    for (const [i, v] of (L.voids ?? []).entries())
      add(
        f.level,
        v.id,
        v.name,
        "courtyard",
        v.evidence,
        `${prefix}.voids[${i}]`,
        `Scene rectangle [${v.rect.join(",")}]. Excluded from slabs and routes.`,
      );
  }
  for (const [core, entries] of cores)
    for (let i = 1; i < entries.length; i++) {
      const a = entries[i - 1]!,
        b = entries[i]!;
      add(
        b.level,
        `${key}-${core}-${a.level}-${b.level}`,
        `Vertical connection ${core}`,
        "vertical-connection",
        {
          numberStatus: "not applicable",
          positionStatus: "inferred",
          identityStatus: "inferred",
          sources: [spec.shapeSource],
          accessibilityStatus: "inferred",
          notes:
            "Vertical continuity and service across adjacent implemented levels inferred. No accessibility/evacuation certification.",
        },
        `${key}_RECONSTRUCTION.floors rooms kind core ${core}`,
        `${a.id} -> ${b.id}. Shared server/src/modules/routing/prototype/routing.ts builds the connection.`,
      );
    }
}
const out = resolve("docs/interiors");
mkdirSync(out, { recursive: true });
const quote = (v: string) => `"${v.replaceAll('"', '""')}"`;
writeFileSync(
  resolve(out, "interior-assumptions.csv"),
  "\uFEFF" +
    [columns, ...rows].map((r) => r.map(quote).join(",")).join("\r\n") +
    "\r\n",
);
if (process.env.INTERIOR_QA_JSON)
  writeFileSync(process.env.INTERIOR_QA_JSON, JSON.stringify(layouts));
console.log(
  `${rows.length} audit rows; ${layouts.length} floors; ${layouts.reduce((n, l) => n + l.cells.length, 0)} cells`,
);
