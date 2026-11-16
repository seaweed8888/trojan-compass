import { ajv } from "../../lib/contracts.js";
const ref = (name: string) => ({ $ref: `compass#/components/schemas/${name}` });
const object = (
  properties: Record<string, unknown>,
  optional: string[] = [],
) => ({
  type: "object",
  properties,
  required: Object.keys(properties).filter((key) => !optional.includes(key)),
  additionalProperties: false,
});
const array = (items: unknown, maxItems = 50000) => ({
  type: "array",
  items,
  maxItems,
});
const string = ref("Id");
const strings = array(string, 1000);
const nullableId = { anyOf: [string, { type: "null" }] };
const access = object({
  accessLevel: { enum: ["public", "usc_only", "restricted", "unknown"] },
  stepFree: { enum: ["verified_yes", "verified_no", "unknown"] },
  evidenceIds: strings,
});
const ring = array(
  object({ x: { type: "number" }, z: { type: "number" } }),
  2048,
);
const polygon = object({ outer: ring, holes: array(ring, 100) });
const side = {
  oneOf: [
    object({ kind: { const: "region" }, regionId: string }),
    object({ kind: { const: "outside" } }),
  ],
};
export const validateSourceShape = ajv.compile(
  object({
    buildingId: ref("Id"),
    dataVersion: ref("DataVersion"),
    nodes: array(ref("GraphNode")),
    edges: array(ref("GraphEdge")),
    geometry: {
      anyOf: [
        { type: "null" },
        object({
          floors: array(
            object(
              {
                openAreaApproaches: { type: "boolean" },
                floorId: string,
                elevationMeters: { type: "number" },
                bounds: ref("Bounds3"),
                walkableRegions: array(
                  object({
                    id: string,
                    kind: { enum: ["corridor", "room", "landing", "entrance"] },
                    polygon,
                    access,
                  }),
                  2000,
                ),
                blockedRegions: array(object({ id: string, polygon }), 2000),
              },
              ["openAreaApproaches"],
            ),
            100,
          ),
        }),
      ],
    },
    edgeDetails: array(
      object({
        edgeId: string,
        points: { ...array(ref("Vector3"), 2000), minItems: 2 },
        regionIds: strings,
        doorId: nullableId,
        connectorId: nullableId,
        access,
        metricsEstimated: { type: "boolean" },
      }),
    ),
    doors: array(
      object({
        id: string,
        floorId: string,
        sideA: side,
        sideB: side,
        direction: { enum: ["both", "a_to_b", "b_to_a"] },
        edgeIds: strings,
        access,
      }),
    ),
    connectors: array(
      object({
        id: string,
        kind: { enum: ["stairs", "elevator", "ramp"] },
        floorIds: strings,
        edgeIds: strings,
        access,
      }),
    ),
    placeAccessBindings: array(
      object({
        placeId: string,
        accessPointId: string,
        floorId: string,
        regionId: nullableId,
        nodeId: string,
        doorId: nullableId,
        approachEdgeIds: strings,
        access,
      }),
    ),
    referenceEntrances: array(
      object({ placeId: string, accessPointId: string }),
      100,
    ),
    evidence: array(
      object({
        id: string,
        stepFree: { enum: ["verified_yes", "verified_no", "unknown"] },
        sourceUrls: array({ type: "string", format: "uri" }, 100),
        verifiedAt: { type: ["string", "null"], format: "date-time" },
        note: { type: "string", maxLength: 4000 },
      }),
    ),
    provenance: ref("Provenance"),
  }),
);
