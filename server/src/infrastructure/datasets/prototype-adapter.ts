import type { Building, Place, Provenance } from "@trojan-compass/shared/api";
import { BUILDINGS } from "./prototype/campus.js";
import {
  cellCenter,
  cellTitle,
  entrancePlaces,
  floorName,
  floorY,
  getLayout,
  getLevels,
  metersPerUnit,
} from "./prototype/floorplan.js";
import { SnapshotStore } from "./snapshot-store.js";
import { prototypeFloorId } from "./prototype/floor-id.js";

/** Development bridge: preserves existing IDs; never promotes guessed topology to canonical routes. */
export function prototypeStore(chatEnabled = false): SnapshotStore {
  const places: Place[] = [];
  const buildings: Building[] = BUILDINGS.map((b) => {
    const scale = metersPerUnit(b.code);
    const provenance: Provenance = {
      dataKind: b.source ? "source_derived" : "demo",
      verificationStatus: "unverified",
      sourceUrls: b.source ? [b.source.url] : [],
      verifiedAt: null,
      note: "Prototype layout; scaled illustration, not surveyed. Navigation and accessibility are not verified.",
    };
    const floors = getLevels(b.code).map((level) => {
      const layout = getLayout(b.code, level);
      const y = floorY(level);
      const bounds = {
        min: {
          x: Math.min(...layout.slabs.map((r) => r[0])) * scale,
          y: y - 0.2,
          z: Math.min(...layout.slabs.map((r) => r[1])) * scale,
        },
        max: {
          x: Math.max(...layout.slabs.map((r) => r[2])) * scale,
          y: y + 3,
          z: Math.max(...layout.slabs.map((r) => r[3])) * scale,
        },
      };
      for (const c of layout.cells) {
        if (c.kind === "block") continue;
        const [x, z] = cellCenter(c);
        places.push({
          id: c.id,
          buildingId: b.code,
          floorId: prototypeFloorId(level),
          name: c.name,
          displayLabel: cellTitle(c),
          roomNumber: c.kind === "room" ? c.number || null : null,
          kind:
            c.kind === "room"
              ? /office/i.test(c.name)
                ? "office"
                : /study|reading|lounge/i.test(c.name)
                  ? "study_area"
                  : "classroom"
              : c.kind,
          description: "Prototype location. Check the published building map.",
          aliases: c.number ? [`${b.code} ${c.number}`] : [],
          position: { x: x * scale, y, z: z * scale },
          sceneObjectKey: c.id,
          bounds: {
            min: { x: c.x0 * scale, y, z: c.z0 * scale },
            max: { x: c.x1 * scale, y: y + 2.5, z: c.z1 * scale },
          },
          accessPoints: [],
          access: {
            level: "unknown",
            stepFreeAccess: "unknown",
            isRamp: null,
            entryAllowed: null,
            exitAllowed: null,
            note: "Access requires verification.",
          },
          provenance,
        });
      }
      for (const p of entrancePlaces(b.code).filter((p) => p.floor === level)) {
        const e = layout.entrances.find((entry) => entry.id === p.node)!;
        places.push({
          id: p.id,
          buildingId: b.code,
          floorId: prototypeFloorId(level),
          name: e.label,
          displayLabel: p.label,
          roomNumber: null,
          kind: "entrance",
          description: "Illustrative entrance position.",
          aliases: [],
          position: { x: e.x * scale, y, z: e.z * scale },
          sceneObjectKey: null,
          bounds: null,
          accessPoints: [],
          access: {
            level: "unknown",
            stepFreeAccess: "unknown",
            isRamp: e.ramp ?? false,
            entryAllowed: true,
            exitAllowed: true,
            note: "Entrance shown on the prototype; physical access requires verification.",
          },
          provenance,
        });
      }
      return {
        id: prototypeFloorId(level),
        buildingId: b.code,
        label: floorName(level, b.code),
        sortOrder: level,
        elevationMeters: y,
        sceneObjectKey: `${b.code}:floor:${level}`,
        bounds,
        provenance,
      };
    });
    return {
      id: b.code,
      code: b.code,
      name: b.name,
      aliases: [
        ...(b.code === "LAW" ? ["law building", "Gould School of Law"] : []),
        ...(b.code === "VKC"
          ? ["DMC", "Dr. Joseph Medicine Crow Center", "Medicine Crow"]
          : []),
      ],
      location: null,
      coverage: "demo",
      capabilities: {
        interiorScene: false,
        navigation: false,
        verifiedStepFreeRouting: false,
        chatText: chatEnabled,
        chatImages: false,
        events: false,
      },
      provenance,
      description: b.blurb,
      officialMapUrl: null,
      viewerUrl: `https://maps.usc.edu/`,
      coordinateSystem: {
        id: `${b.code}-prototype-meters-v1`,
        units: "meters",
        upAxis: "Y",
        handedness: "right",
        accuracy: "illustrative",
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
      sources: b.source
        ? [
            {
              id: `${b.code}-map`,
              title: b.source.label,
              url: b.source.url,
              sourceDate: null,
              pageReference: null,
              note: "Source of the prototype trace; geometry is not a measured survey.",
            },
          ]
        : [],
    };
  });
  return new SnapshotStore(
    [
      {
        dataVersion: "prototype-v1",
        buildings,
        places,
        scenes: [],
        floorGeometry: [],
        navigation: [],
      },
    ],
    "prototype-v1",
  );
}
