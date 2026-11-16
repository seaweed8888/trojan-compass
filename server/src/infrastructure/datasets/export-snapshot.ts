// Explicit one-time extraction tool. Published snapshots are read-only runtime input.
import { mkdir, writeFile } from "node:fs/promises";
import type {
  Building,
  Floor,
  FloorGeometry,
  Place,
  BoxObject,
  GraphNode,
  GraphEdge,
  Provenance,
  Scene,
  Vector3,
} from "@trojan-compass/shared";
import { BUILDINGS } from "./prototype/campus.js";
import { INTERIORS } from "./prototype/interiors/index.js";
import type { Evidence } from "./prototype/interiors/types.js";
import {
  getLayout,
  getLevels,
  floorY,
  metersPerUnit,
  cellCenter,
  cellTitle,
  entrancePlaces,
} from "./prototype/floorplan.js";
import { repositoryRoot } from "../contract.js";
import type { PublishedNavigation as NavigationSource } from "./publication-format.js";
import { prototypeFloorId, prototypeFloorLevel } from "./prototype/floor-id.js";

const version = process.argv[2];
if (!version || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(version))
  throw new Error(
    "Pass a new dataVersion: npm run data:extract -- <dataVersion>",
  );
const snapshot = new URL(`server/data/snapshots/${version}/`, repositoryRoot);
// Reserve a fresh version before writing anything. Never overwrite a released
// publication (or silently reuse a failed partial extraction).
try {
  await mkdir(snapshot);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === "EEXIST")
    throw new Error(
      "Publication already exists; choose a new dataVersion. Released snapshots are immutable.",
    );
  throw error;
}
async function save(path: string, value: unknown) {
  const url = new URL(path, snapshot);
  await mkdir(new URL("./", url), { recursive: true });
  await writeFile(url, JSON.stringify(value, null, 2) + "\n");
}
const distance = (a: Vector3, b: Vector3) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
for (const original of BUILDINGS) {
  const code = original.code;
  const reconstruction = INTERIORS[code];
  const scale = metersPerUnit(code);
  // Preserve the prototype's cutaway wall proportions after horizontal calibration.
  const wallHeight = 0.85 * scale;
  // Horizontal calibration is estimated; physical floor elevation is explicitly 3.4 m.
  const point = (x: number, f: number, z: number): Vector3 => ({
    x: x * scale,
    y: floorY(f),
    z: z * scale,
  });
  const provenance: Provenance = {
    dataKind: code === "LAW" ? "source_derived" : "demo",
    verificationStatus: "unverified",
    sourceUrls: original.source
      ? [original.source.url]
      : [
          ...new Set(
            [
              reconstruction?.shapeSource ?? "",
              ...(reconstruction?.floors.flatMap((f) => [
                ...f.evidence.sources,
                ...f.records.flatMap((r) => r.evidence.sources),
              ]) ?? []),
            ].flatMap((s) => s.match(/https?:\/\/[^\s|]+/g) ?? []),
          ),
        ],
    verifiedAt: null,
    note: reconstruction
      ? `Reconstructed demo interior; all positions, boundaries, doors and circulation inferred. Estimated 2 m per horizontal scene unit, assumed 3.4 m floor spacing. Floor count ${reconstruction.floorCountStatus}: ${reconstruction.floorCountNotes} ${reconstruction.shapeNotes} Navigation and access are unverified.`
      : "Traced floor plan; estimated 2.4 m per horizontal scene unit, assumed 3.4 m floor spacing. Navigation connections and access are unverified.",
  };
  const withEvidence = (evidence?: Evidence): Provenance =>
    evidence
      ? {
          ...provenance,
          sourceUrls: [
            ...new Set(
              evidence.sources.flatMap(
                (s) => s.match(/https?:\/\/[^\s|]+/g) ?? [],
              ),
            ),
          ],
          note: `Number ${evidence.numberStatus}; identity ${evidence.identityStatus}; position ${evidence.positionStatus}. ${evidence.notes} Sources: ${evidence.sources.join(" | ")} Navigation and accessibility are unverified.`,
        }
      : provenance;
  const floors: Floor[] = [];
  const places: Place[] = [];
  const geometries: FloorGeometry[] = [];
  const navigation: NavigationSource = {
    buildingId: code,
    dataVersion: version,
    nodes: [],
    edges: [],
    walkable: [],
    barriers: [],
    connectors: [],
    provenance,
  };
  const coreNodes = new Map<
    string,
    { kind: "stairs" | "elevator"; nodes: GraphNode[] }
  >();
  const node = (id: string, f: number, p: Vector3, kind: string) => {
    const n: GraphNode = {
      id: id.replace(/[^A-Za-z0-9._:-]/g, "_"),
      buildingId: code,
      floorId: prototypeFloorId(f),
      position: p,
      kind,
    };
    navigation.nodes.push(n);
    return n;
  };
  const link = (
    a: GraphNode,
    b: GraphNode,
    kind: GraphEdge["kind"] = "walkway",
    walkable = true,
  ) => {
    navigation.edges.push({
      id: `${code}:edge:${navigation.edges.length}`,
      fromNodeId: a.id,
      toNodeId: b.id,
      lengthMeters: distance(a.position, b.position),
      kind,
      bidirectional: true,
      stepFree: kind === "stairs" ? "verified_no" : "unknown",
      accessLevel: "public",
    });
    if (walkable && a.floorId === b.floorId)
      navigation.walkable.push({
        floorId: a.floorId,
        from: a.position,
        to: b.position,
        radius: 0.75,
      });
  };
  for (const f of getLevels(code)) {
    const layout = getLayout(code, f);
    const y = floorY(f);
    const objects: BoxObject[] = [];
    const box = (
      key: string,
      role: BoxObject["role"],
      cx: number,
      cy: number,
      cz: number,
      w: number,
      h: number,
      d: number,
      placeId: string | null = null,
    ) => {
      if (w <= 0 || d <= 0 || h <= 0) return;
      const object: BoxObject = {
        kind: "box",
        objectKey: key,
        placeId,
        role,
        materialKey: role === "wall" ? "wall" : "floor",
        pickable: role === "room_highlight" || role === "slab",
        center: { x: cx * scale, y: y + cy, z: cz * scale },
        size: { x: w * scale, y: h, z: d * scale },
        yawRadians: 0,
      };
      objects.push(object);
      if (role === "wall")
        navigation.barriers.push({
          floorId: prototypeFloorId(f),
          min: {
            x: object.center.x - object.size.x / 2,
            y,
            z: object.center.z - object.size.z / 2,
          },
          max: {
            x: object.center.x + object.size.x / 2,
            y: y + h,
            z: object.center.z + object.size.z / 2,
          },
        });
    };
    layout.slabs.forEach(([x0, z0, x1, z1], i) =>
      box(
        `${code}:${f}:slab:${i}`,
        "slab",
        (x0 + x1) / 2,
        -0.12,
        (z0 + z1) / 2,
        x1 - x0 + 0.3,
        0.24,
        z1 - z0 + 0.3,
      ),
    );
    const xs = layout.slabs.flatMap((s) => [s[0] * scale, s[2] * scale]);
    const zs = layout.slabs.flatMap((s) => [s[1] * scale, s[3] * scale]);
    const floor: Floor = {
      id: prototypeFloorId(f),
      buildingId: code,
      label:
        reconstruction?.floors.find((s) => s.level === f)?.name ??
        (f === 0 ? "B" : String(f)),
      sortOrder: f,
      elevationMeters: y,
      sceneObjectKey: `${code}:floor:${f}`,
      bounds: {
        min: { x: Math.min(...xs), y: y - 0.24, z: Math.min(...zs) },
        max: { x: Math.max(...xs), y: y + Math.max(1.5, wallHeight), z: Math.max(...zs) },
      },
      provenance: withEvidence(layout.evidence),
    };
    floors.push(floor);
    const corridors = new Map(
      layout.walkNodes.map((n) => [
        n.id,
        node(n.id, f, point(n.x, f, n.z), "corridor"),
      ]),
    );
    for (const [a, b] of layout.walkEdges)
      link(corridors.get(a)!, corridors.get(b)!);
    const nearest = (p: Vector3) =>
      [...corridors.values()].sort(
        (a, b) => distance(a.position, p) - distance(b.position, p),
      )[0]!;
    for (const c of layout.cells) {
      const [cx, cz] = cellCenter(c);
      const [dx, dz] = c.door;
      const key = `${c.id}:object`;
      box(
        key,
        "room_highlight",
        cx,
        0.016,
        cz,
        c.x1 - c.x0,
        0.025,
        c.z1 - c.z0,
        c.kind === "block" ? null : c.id,
      );
      if (!c.open) {
        const gap = Math.min(
          c.kind === "elevator" ? 1.6 : 1.1,
          Math.min(c.x1 - c.x0, c.z1 - c.z0) * 0.6,
        );
        const walls: [number, number, number, number, boolean][] = [
          [c.x0, c.z0, c.x1, c.z0, Math.abs(dz - c.z0) < 0.05],
          [c.x0, c.z1, c.x1, c.z1, Math.abs(dz - c.z1) < 0.05],
          [c.x0, c.z0, c.x0, c.z1, Math.abs(dx - c.x0) < 0.05],
          [c.x1, c.z0, c.x1, c.z1, Math.abs(dx - c.x1) < 0.05],
        ];
        walls.forEach(([ax, az, bx, bz, door], i) => {
          const segment = (
            x0: number,
            z0: number,
            x1: number,
            z1: number,
            k: string,
          ) => {
            // Reconstructed corridors can follow a cell boundary. Keep wall
            // thickness inside that cell so exporting boxes does not seal them.
            const inset = 0.001;
            const minX = reconstruction
              ? Math.max(c.x0 + inset, Math.min(x0, x1) - 0.06)
              : Math.min(x0, x1) - 0.06;
            const maxX = reconstruction
              ? Math.min(c.x1 - inset, Math.max(x0, x1) + 0.06)
              : Math.max(x0, x1) + 0.06;
            const minZ = reconstruction
              ? Math.max(c.z0 + inset, Math.min(z0, z1) - 0.06)
              : Math.min(z0, z1) - 0.06;
            const maxZ = reconstruction
              ? Math.min(c.z1 - inset, Math.max(z0, z1) + 0.06)
              : Math.max(z0, z1) + 0.06;
            box(
              `${c.id}:wall:${i}:${k}`,
              "wall",
              reconstruction ? (minX + maxX) / 2 : (x0 + x1) / 2,
              wallHeight / 2,
              reconstruction ? (minZ + maxZ) / 2 : (z0 + z1) / 2,
              reconstruction ? maxX - minX : Math.abs(x1 - x0) + 0.12,
              wallHeight,
              reconstruction ? maxZ - minZ : Math.abs(z1 - z0) + 0.12,
            );
          };
          if (!door) segment(ax, az, bx, bz, "full");
          else if (az === bz) {
            segment(ax, az, dx - gap / 2, bz, "a");
            segment(dx + gap / 2, az, bx, bz, "b");
          } else {
            segment(ax, az, bx, dz - gap / 2, "a");
            segment(ax, dz + gap / 2, bx, bz, "b");
          }
        });
      }
      if (c.kind === "block") continue;
      const center = node(c.node, f, point(cx, f, cz), c.kind);
      const door = node(`${c.node}:door`, f, point(dx, f, dz), "door");
      link(center, door, "door");
      link(door, nearest(door.position), "walkway");
      if (c.core && (c.kind === "stairs" || c.kind === "elevator")) {
        const core = coreNodes.get(c.core) ?? { kind: c.kind, nodes: [] };
        core.nodes.push(center);
        coreNodes.set(c.core, core);
      }
      places.push({
        id: c.id,
        buildingId: code,
        floorId: prototypeFloorId(f),
        name: c.name,
        displayLabel: cellTitle(c),
        roomNumber: c.kind === "room" ? c.number || null : null,
        kind: c.kind === "room" ? "classroom" : c.kind,
        description: c.open
          ? "Open area"
          : c.kind === "restroom"
            ? `${c.restroom ?? "both"} restroom`
            : "",
        aliases: [cellTitle(c), ...(c.number ? [`${code} ${c.number}`] : [])],
        position: center.position,
        sceneObjectKey: key,
        bounds: {
          min: point(c.x0, f, c.z0),
          max: { ...point(c.x1, f, c.z1), y: y + wallHeight },
        },
        accessPoints: [
          {
            id: `${c.id}:access`,
            nodeId: center.id,
            label: "Demo arrival point",
            position: center.position,
            stepFreeAccess: "unknown",
          },
        ],
        access: {
          level: "public",
          stepFreeAccess: "unknown",
          isRamp: false,
          entryAllowed: true,
          exitAllowed: true,
          note: "Illustrative public routing only; access not verified.",
        },
        provenance: withEvidence(c.evidence),
      });
    }
    for (const e of layout.entrances) {
      const n = node(e.id, f, point(e.x, f, e.z), "entrance");
      link(n, nearest(n.position));
      const old = entrancePlaces(code).find((p) => p.node === e.id);
      places.push({
        id:
          old?.id ??
          `${code}-EXIT-${f}-${e.id.split(":").at(-1)?.toUpperCase()}`,
        buildingId: code,
        floorId: prototypeFloorId(f),
        name: e.label,
        displayLabel: `${code} ${e.label}`,
        roomNumber: null,
        kind: e.entrance ? "entrance" : "emergency_exit",
        description: "",
        aliases: [],
        position: n.position,
        sceneObjectKey: null,
        bounds: null,
        accessPoints: [
          {
            id: `${e.id}:access`,
            nodeId: e.id,
            label: e.label,
            position: n.position,
            stepFreeAccess: "unknown",
          },
        ],
        access: {
          level: "public",
          stepFreeAccess: "unknown",
          isRamp: e.ramp ?? null,
          entryAllowed: e.entrance,
          exitAllowed: true,
          note: "Entrance geometry and accessibility are unverified.",
        },
        provenance: withEvidence(e.evidence),
      });
    }
    floor.bounds.min.x = Math.min(
      ...objects.map((o) => o.center.x - o.size.x / 2),
    );
    floor.bounds.max.x = Math.max(
      ...objects.map((o) => o.center.x + o.size.x / 2),
    );
    floor.bounds.min.z = Math.min(
      ...objects.map((o) => o.center.z - o.size.z / 2),
    );
    floor.bounds.max.z = Math.max(
      ...objects.map((o) => o.center.z + o.size.z / 2),
    );
    geometries.push({
      buildingId: code,
      floorId: prototypeFloorId(f),
      coordinateSystem: {
        id: `${code}:meters`,
        units: "meters",
        upAxis: "Y",
        handedness: "right",
        accuracy: "estimated",
      },
      bounds: floor.bounds,
      objects,
      labels: places
        .filter((p) => p.floorId === prototypeFloorId(f))
        .map((p) => ({
          placeId: p.id,
          text: p.displayLabel,
          position: p.position,
          priority: p.kind === "classroom" ? 1 : 0,
        })),
    });
  }
  for (const [id, core] of coreNodes) {
    core.nodes.sort(
      (a, b) => prototypeFloorLevel(a.floorId) - prototypeFloorLevel(b.floorId),
    );
    navigation.connectors.push({
      id: `${code}:${id}`,
      nodeIds: core.nodes.map((n) => n.id),
      kind: core.kind,
    });
  }
  const building: Building = {
    id: code,
    code,
    name: original.name,
    aliases: [
      ...new Set([
        ...(reconstruction?.aliases ?? []),
        ...(code === "VKC"
          ? ["DMC", "Medicine Crow", "Dr. Joseph Medicine Crow Center"]
          : []),
      ]),
    ],
    location: null,
    coverage: "demo",
    capabilities: {
      interiorScene: true,
      navigation: true,
      verifiedStepFreeRouting: false,
      chatText: true,
      chatImages: false,
      events: false,
    },
    provenance,
    description: original.blurb,
    officialMapUrl: original.source?.url ?? null,
    viewerUrl: `/?building=${code}`,
    coordinateSystem: {
      id: `${code}:meters`,
      units: "meters",
      upAxis: "Y",
      handedness: "right",
      accuracy: "estimated",
    },
    bounds: {
      min: {
        x: Math.min(...floors.map((f) => f.bounds.min.x)),
        y: Math.min(...floors.map((f) => f.bounds.min.y)),
        z: Math.min(...floors.map((f) => f.bounds.min.z)),
      },
      max: {
        x: Math.max(...floors.map((f) => f.bounds.max.x)),
        y: Math.max(...floors.map((f) => f.bounds.max.y)),
        z: Math.max(...floors.map((f) => f.bounds.max.z)),
      },
    },
    floors,
    sources: original.source
      ? [
          {
            id: `${code}:source`,
            title: original.source.label,
            url: original.source.url,
            sourceDate: null,
            pageReference: null,
            note: "Existing traced prototype source.",
          },
        ]
      : provenance.sourceUrls.map((url, index) => ({
          id: `${code}:source:${index}`,
          title: `${original.name} reconstruction reference ${index + 1}`,
          url,
          sourceDate: null,
          pageReference: null,
          note: "Identity or exterior reference; interior positions remain inferred. See docs/interiors/.",
        })),
  };
  const scene: Scene = {
    representation: "procedural",
    buildingId: code,
    coordinateSystem: building.coordinateSystem,
    bounds: building.bounds,
    rootObjectKey: `${code}:root`,
    viewerUrl: building.viewerUrl,
    floors: floors.map((f) => ({
      floorId: f.id,
      label: f.label,
      sceneObjectKey: f.sceneObjectKey,
      geometryUrl: `/api/buildings/${code}/floors/${f.id}?dataVersion=${version}`,
    })),
    provenance,
    materials: [
      {
        key: "floor",
        color: "#e9e9ec",
        opacity: 1,
        roughness: 0.9,
        metalness: 0,
      },
      {
        key: "wall",
        color: "#c9c9ce",
        opacity: 1,
        roughness: 0.9,
        metalness: 0,
      },
    ],
  };
  const base = `buildings/${code}/`;
  await save(base + "building.json", building);
  await save(base + "floors.json", floors);
  await save(base + "places.json", places);
  await save(base + "scene.json", scene);
  for (const g of geometries)
    await save(base + `geometry/${g.floorId}.json`, g);
  await save(base + "navigation/topology.json", {
    nodes: navigation.nodes,
    edges: navigation.edges,
    provenance,
  });
  await save(base + "navigation/walkable-areas.json", navigation.walkable);
  await save(base + "navigation/barriers.json", navigation.barriers);
  await save(base + "navigation/connectors.json", navigation.connectors);
  await save(base + "calibration.json", {
    horizontalMetersPerSceneUnit: scale,
    verticalMetersPerSceneUnit: 1,
    floorSpacingMeters: 3.4,
    accuracy: "estimated",
    note: provenance.note,
  });
}
await save("manifest.json", {
  dataVersion: version,
  buildingIds: BUILDINGS.map((b) => b.code),
});
// Overview decoration is generated separately; web never imports the layout loader.
await writeFile(
  new URL("web/src/features/map/data/campus-models.json", repositoryRoot),
  JSON.stringify(
    BUILDINGS.map(
      ({
        code,
        name,
        position,
        footprint,
        floors,
        levels,
        tower,
        featured,
        subtitle,
      }) => ({
        code,
        name,
        position,
        footprint,
        floors,
        levels,
        tower,
        featured,
        subtitle,
      }),
    ),
    null,
    2,
  ) + "\n",
);
await writeFile(
  new URL("server/data/snapshots/current.json", repositoryRoot),
  JSON.stringify({ dataVersion: version }, null, 2) + "\n",
);
console.log(
  `Extracted ${BUILDINGS.length} illustrative buildings into ${version}.`,
);
