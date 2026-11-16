// Source trace: scripts/trace-dml.py. See docs/interiors/tracing-v3/dml/README.md.
import type { Reconstruction } from './types.js'

export const DML_RECONSTRUCTION: Reconstruction = {
  "code": "DML",
  "name": "Doheny Memorial Library",
  "aliases": [
    "Doheny",
    "East Asian Library",
    "Music Library",
    "Cinematic Arts Library"
  ],
  "geometryStatus": "traced",
  "geometryNotes": "Four public-floor diagrams traced from supplied vector PDF, with source-based named areas. Diagram simplifications, doors, core registration and route centerlines remain inferred; no survey or accessibility verification.",
  "floorCountStatus": "confirmed",
  "floorCountNotes": "Brochure explicitly labels Basement, Ground, First and Second. Internal indices 0/1/2/3 preserve these names. The nine bookstack levels are unresolved and are not fabricated.",
  "shapeSource": "Doheny Memorial Library self-guided tour brochure.pdf pp. 2–5; https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf",
  "shapeNotes": "Exterior slab unions trace the supplied floor outlines, including unequal wings, upper east recess and west recess. Absolute scale is inferred: no dimension scale is printed. Drawing orientation is east at top, west/main entrance at bottom. Minor ledges rounded to 0.01 PDF point.",
  "orientationDegrees": 152.5,
  "footprint": [
    [
      -2.652,
      -5.613
    ],
    [
      -3.305,
      -4.358
    ],
    [
      -1.85,
      -3.601
    ],
    [
      -3.891,
      0.32
    ],
    [
      -5.347,
      -0.437
    ],
    [
      -6.0,
      0.818
    ],
    [
      3.21,
      5.613
    ],
    [
      4.218,
      3.677
    ],
    [
      4.106,
      3.619
    ],
    [
      5.468,
      1.003
    ],
    [
      5.58,
      1.061
    ],
    [
      5.927,
      0.394
    ],
    [
      5.369,
      0.103
    ],
    [
      6.0,
      -1.109
    ]
  ],
  "floors": [
    {
      "level": 0,
      "name": "Basement",
      "planScope": "partial",
      "slabs": [
        [
          300.9767,
          169.5,
          409.7646,
          186.8128
        ],
        [
          844.3296,
          169.5,
          1161.0,
          186.8128
        ],
        [
          300.9767,
          186.8128,
          1161.0,
          263.568
        ],
        [
          99.0,
          263.568,
          1161.0,
          841.6277
        ],
        [
          64.3756,
          841.6277,
          1161.0,
          895.6002
        ],
        [
          64.3756,
          895.6002,
          1195.2189,
          942.024
        ],
        [
          99.0,
          942.024,
          1195.2189,
          991.0695
        ],
        [
          99.0,
          991.0695,
          1161.0,
          1130.3409
        ],
        [
          61.7607,
          1130.3409,
          1161.0,
          1184.5848
        ],
        [
          99.0,
          1184.5848,
          1161.0,
          1335.7897
        ],
        [
          36.6489,
          1335.7897,
          1161.0,
          1443.2381
        ],
        [
          99.0,
          1443.2381,
          1161.0,
          1449.0242
        ],
        [
          99.0,
          1449.0242,
          305.7557,
          1690.5
        ],
        [
          518.8225,
          1449.0242,
          740.5911,
          1463.9412
        ],
        [
          953.7034,
          1449.0242,
          1161.0,
          1690.5
        ],
        [
          542.4917,
          1463.9412,
          717.0575,
          1489.5714
        ]
      ],
      "rooms": [
        [
          "",
          "Holocaust and Genocide collection",
          "o",
          [
            890.4055,
            1284.3939,
            1161.0,
            1449.0242
          ],
          "N",
          undefined,
          "Holocaust and Genocide collection"
        ],
        [
          "",
          "Men’s restroom",
          "w",
          [
            773.1869,
            1083.2389,
            876.8804,
            1164.6053
          ],
          "S",
          undefined,
          "Men’s restroom"
        ],
        [
          "",
          "Women’s restroom",
          "w",
          [
            1052.7079,
            1099.0601,
            1161.0,
            1171.3854
          ],
          "S",
          undefined,
          "Women’s restroom"
        ],
        [
          "",
          "Unresolved nonpublic east/stack block",
          "b",
          [
            99.0,
            267.3201,
            836.3048,
            841.4017
          ],
          "S",
          undefined,
          "Unresolved nonpublic east/stack block"
        ],
        [
          "",
          "Unresolved nonpublic south/east wing",
          "b",
          [
            845.3214,
            169.5,
            1161.0,
            986.052
          ],
          "W",
          undefined,
          "Unresolved nonpublic south/east wing"
        ],
        [
          "",
          "Unresolved central stack block",
          "b",
          [
            417.0231,
            850.4423,
            660.4767,
            1157.8247
          ],
          "S",
          undefined,
          "Unresolved central stack block"
        ],
        [
          "",
          "Unresolved west stack block",
          "b",
          [
            520.7161,
            1203.0276,
            741.6279,
            1449.0242
          ],
          "N",
          undefined,
          "Unresolved west stack block"
        ],
        [
          "",
          "Unresolved north/west wing",
          "b",
          [
            99.0,
            1460.6863,
            305.7557,
            1690.5
          ],
          "N",
          undefined,
          "Unresolved north/west wing"
        ],
        [
          "",
          "Unresolved south/west wing",
          "b",
          [
            953.7034,
            1460.6863,
            1161.0,
            1690.5
          ],
          "N",
          undefined,
          "Unresolved south/west wing"
        ],
        [
          "",
          "West elevator",
          "e:WEST",
          [
            198.0,
            1281.0,
            252.0,
            1339.5
          ],
          "E",
          undefined,
          "West elevator"
        ],
        [
          "",
          "South stair",
          "s:SOUTH",
          [
            751.5,
            1227.0,
            837.0,
            1299.0
          ],
          "S",
          undefined,
          "South stair"
        ]
      ],
      "records": [
        {
          "id": "DML-0-HOLOCAUST",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Tour stop 1 identifies this white reading/collection area; rectangle simplifies the stepped west edge. Tour numeral 1 is not a room number. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            935.4897,
            1284.3939
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-0-RR-M",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "M symbol and rectangular room shown. Boundary read from PDF diagram; historical use is not a claim of current tenancy.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            822.7795,
            1164.6053
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          },
          "restroom": "men"
        },
        {
          "id": "DML-0-RR-W",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "W symbol and rectangular room shown. Boundary read from PDF diagram; historical use is not a claim of current tenancy.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            1084.2669,
            1171.3854
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          },
          "restroom": "women"
        },
        {
          "id": "DML-0-STACKS-E",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Gray source area, not individually surveyed rooms. Internal partitions omitted; no invented room numbers. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            462.1068,
            841.4017
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-0-BLOCK-S",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Gray source block; extent simplified to leave the shown circulation and facilities. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            845.3214,
            895.6457
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-0-BLOCK-C",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Gray block simplified; stack subdivisions and nine stack-level elevations unresolved. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            529.7332,
            1157.8247
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-0-BLOCK-W",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Gray block west of the basement public corridor. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            619.9011,
            1203.0276
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-0-BLOCK-NW",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Gray source wing; unlabelled service subdivisions omitted. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            214.1447,
            1460.6863
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-0-BLOCK-SW",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Gray source wing; unlabelled service subdivisions omitted. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            1025.6575,
            1460.6863
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-0-WEST-ELEV",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            252.0,
            1308.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-0-SOUTH-STAIR",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            792.0,
            1299.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        }
      ],
      "walks": [
        [
          [
            935.4897,
            1284.3939
          ],
          [
            854.3214,
            1284.3939
          ],
          [
            854.3214,
            1194.0276
          ],
          [
            845.3214,
            1194.0276
          ],
          [
            845.3214,
            1164.6053
          ],
          [
            822.7795,
            1164.6053
          ]
        ],
        [
          [
            845.3214,
            1171.3854
          ],
          [
            1084.2669,
            1171.3854
          ]
        ],
        [
          [
            845.3214,
            1194.0276
          ],
          [
            845.3214,
            1203.0276
          ],
          [
            520.7161,
            1203.0276
          ],
          [
            520.7161,
            1308.0
          ],
          [
            252.0,
            1308.0
          ]
        ],
        [
          [
            854.3214,
            1284.3939
          ],
          [
            854.3214,
            1299.0
          ],
          [
            792.0,
            1299.0
          ]
        ]
      ],
      "entrances": [],
      "entranceEvidence": {},
      "voids": [],
      "evidence": {
        "numberStatus": "not applicable",
        "positionStatus": "inferred",
        "identityStatus": "confirmed",
        "sources": [
          "Doheny Memorial Library self-guided tour brochure.pdf p. 2",
          "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=2"
        ],
        "notes": "Public floor diagram traced from supplied brochure; named spaces and exterior shape are source-grounded. Gray areas remain undetailed nonpublic blocks. Exact doors, route centerlines, absolute scale, service across floors and core registration are inferred. Nine stack levels are not resolved."
      }
    },
    {
      "level": 1,
      "name": "Ground floor",
      "planScope": "partial",
      "slabs": [
        [
          299.1033,
          169.5,
          409.342,
          187.9491
        ],
        [
          841.3024,
          169.5,
          1161.0,
          187.9491
        ],
        [
          299.1033,
          187.9491,
          1161.0,
          261.6559
        ],
        [
          99.0,
          261.6559,
          1161.0,
          1450.164
        ],
        [
          99.0,
          1450.164,
          306.1647,
          1690.5
        ],
        [
          953.7003,
          1450.164,
          1161.0,
          1690.5
        ]
      ],
      "rooms": [
        [
          "",
          "Younes and Soraya Nazarian Pavilion",
          "o",
          [
            299.1033,
            187.9491,
            841.3024,
            506.2319
          ],
          "N",
          undefined,
          "Younes and Soraya Nazarian Pavilion"
        ],
        [
          "",
          "LiteraTea Teahouse",
          "r",
          [
            99.0,
            261.6559,
            299.1033,
            386.6957
          ],
          "E",
          undefined,
          "LiteraTea Teahouse"
        ],
        [
          "G24",
          "Music Library",
          "o",
          [
            99.0,
            582.9159,
            318.8034,
            1085.871
          ],
          "E",
          undefined,
          undefined
        ],
        [
          "",
          "Cinematic Arts Library",
          "o",
          [
            1029.4421,
            594.1929,
            1161.0,
            1097.148
          ],
          "W",
          undefined,
          "Cinematic Arts Library"
        ],
        [
          "",
          "Cinematic Arts Library — west study area",
          "o",
          [
            851.7821,
            727.2615,
            1029.4421,
            986.6334
          ],
          "E",
          undefined,
          "Cinematic Arts Library — west study area"
        ],
        [
          "",
          "Cinematic Arts Library — east collection area",
          "o",
          [
            869.7731,
            222.051,
            1161.0,
            573.8943
          ],
          "W",
          undefined,
          "Cinematic Arts Library — east collection area"
        ],
        [
          "",
          "Ground-floor Rotunda",
          "o",
          [
            451.4859,
            1101.6588,
            725.8464,
            1200.8969
          ],
          "S",
          undefined,
          "Ground-floor Rotunda"
        ],
        [
          "",
          "Women’s restroom",
          "w",
          [
            105.1618,
            456.613,
            195.1159,
            531.0412
          ],
          "E",
          undefined,
          "Women’s restroom"
        ],
        [
          "",
          "Men’s restroom",
          "w",
          [
            224.3511,
            397.9727,
            296.3147,
            488.1886
          ],
          "E",
          undefined,
          "Men’s restroom"
        ],
        [
          "",
          "Unresolved central stack block",
          "b",
          [
            404.2597,
            916.7156,
            849.5334,
            1088.1264
          ],
          "E",
          undefined,
          "Unresolved central stack block"
        ],
        [
          "",
          "Unresolved central stack block — north portion",
          "b",
          [
            404.2597,
            790.4132,
            602.159,
            916.7156
          ],
          "W",
          undefined,
          "Unresolved central stack block — north portion"
        ],
        [
          "",
          "Unresolved central stack block — south portion",
          "b",
          [
            658.3806,
            767.8591,
            849.5334,
            916.7156
          ],
          "E",
          undefined,
          "Unresolved central stack block — south portion"
        ],
        [
          "",
          "West elevator",
          "e:WEST",
          [
            198.0,
            1281.0,
            252.0,
            1339.5
          ],
          "E",
          undefined,
          "West elevator"
        ],
        [
          "",
          "South stair",
          "s:SOUTH",
          [
            751.5,
            1227.0,
            837.0,
            1299.0
          ],
          "S",
          undefined,
          "South stair"
        ],
        [
          "",
          "North stair",
          "s:NORTH",
          [
            211.5,
            1105.5,
            288.0,
            1213.5
          ],
          "E",
          undefined,
          "North stair"
        ],
        [
          "",
          "Inner west elevator",
          "e:INNER",
          [
            396.0,
            1204.5,
            450.0,
            1267.5
          ],
          "E",
          undefined,
          "Inner west elevator"
        ],
        [
          "",
          "Stack-side elevator",
          "e:STACK-E",
          [
            594.0,
            633.0,
            634.5,
            723.0
          ],
          "W",
          undefined,
          "Stack-side elevator"
        ],
        [
          "",
          "Stack-side stair",
          "s:STACK-S",
          [
            607.5,
            813.0,
            652.5,
            912.0
          ],
          "E",
          undefined,
          "Stack-side stair"
        ]
      ],
      "records": [
        {
          "id": "DML-1-NAZARIAN",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Tour stop 2. Ground-level pavilion in the east recess; upper floors retain the recess. East entry threshold is adjacent. Boundary read from PDF diagram; historical use is not a claim of current tenancy."
          },
          "door": [
            357.0336,
            187.9491
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-LITERATEA",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Tour stop 3 in north/east corner. Service counters are not separately reconstructed. Boundary read from PDF diagram; historical use is not a claim of current tenancy."
          },
          "door": [
            299.1033,
            343.8426
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-G24",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3",
              "docs/interiors/research-v2/libraries/confirmed-room-corrections.json"
            ],
            "notes": "Tour stop 4 fixes the north-wing collection. G24 comes from the confirmed USC room catalogue; this rectangle simplifies the irregular library extent. G28 Herklotz is inside this library but not separately positioned. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            318.8034,
            817.478
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-CINEMATIC",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Tour stop 6 identifies the south wing. This drawn long east block is one portion of the collection. Confirmed G1/G4 cannot be assigned separate boundaries from this diagram. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            1029.4421,
            1043.0184
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-CINEMATIC-W",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Tour stop 6 spans the irregular south-wing collection. Display subdivisions preserve its plan shape, not undocumented G1/G4 room partitions. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            1029.4421,
            930.248
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-CINEMATIC-E",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Unlabelled extension within the same south-wing collection; name attachment inferred from adjacency to stop 6. Stair recess omitted from room box. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            869.7731,
            546.8291
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-ROTUNDA",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Tour stop 5 confirms this central west hall. Display rectangle is an inferred label region inside the larger open rotunda, not an invented wall. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            572.9238,
            1200.8969
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-RR-W",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "W symbol in north/east facilities cluster. Boundary read from PDF diagram; historical use is not a claim of current tenancy.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            195.1159,
            497.2102
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          },
          "restroom": "women"
        },
        {
          "id": "DML-1-RR-M",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "M symbol in north/east facilities cluster. Boundary read from PDF diagram; historical use is not a claim of current tenancy.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            296.3147,
            456.613
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          },
          "restroom": "men"
        },
        {
          "id": "DML-1-STACKS",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Gray stack block contains a stepped central stair recess; that recess is reserved outside this simplified block. No room numbers or stack floors invented. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            849.5334,
            997.9104
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-STACKS-N",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Gray source block retained beside the central stair recess; does not create a new room identity. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            404.2597,
            835.5212
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-STACKS-S",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Gray source block retained beside the central stair recess; does not create a new room identity. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            849.5334,
            835.5212
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-WEST-ELEV",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            252.0,
            1308.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-SOUTH-STAIR",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            792.0,
            1299.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-NORTH-STAIR",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            288.0,
            1159.5
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-INNER-ELEV",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            450.0,
            1240.5
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-STACK-ELEV",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            594.0,
            678.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-1-STACK-STAIR",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            652.5,
            867.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        }
      ],
      "walks": [
        [
          [
            357.0336,
            169.5
          ],
          [
            357.0336,
            187.9491
          ]
        ],
        [
          [
            357.0336,
            187.9491
          ],
          [
            299.1033,
            187.9491
          ],
          [
            299.1033,
            343.8426
          ]
        ],
        [
          [
            299.1033,
            343.8426
          ],
          [
            299.1033,
            515.2319
          ],
          [
            306.1647,
            515.2319
          ],
          [
            306.1647,
            573.8943
          ],
          [
            318.8034,
            573.8943
          ],
          [
            318.8034,
            817.478
          ]
        ],
        [
          [
            318.8034,
            817.478
          ],
          [
            395.2597,
            817.478
          ],
          [
            395.2597,
            916.7156
          ],
          [
            849.5334,
            916.7156
          ],
          [
            849.5334,
            1043.0184
          ],
          [
            1029.4421,
            1043.0184
          ]
        ],
        [
          [
            1029.4421,
            1043.0184
          ],
          [
            1029.4421,
            930.248
          ]
        ],
        [
          [
            849.5334,
            916.7156
          ],
          [
            849.5334,
            582.9159
          ],
          [
            860.7731,
            582.9159
          ],
          [
            860.7731,
            546.8291
          ],
          [
            869.7731,
            546.8291
          ]
        ],
        [
          [
            849.5334,
            1043.0184
          ],
          [
            849.5334,
            1088.1264
          ],
          [
            725.8464,
            1088.1264
          ],
          [
            725.8464,
            1200.8969
          ],
          [
            572.9238,
            1200.8969
          ]
        ],
        [
          [
            299.1033,
            497.2102
          ],
          [
            195.1159,
            497.2102
          ]
        ],
        [
          [
            299.1033,
            456.613
          ],
          [
            296.3147,
            456.613
          ]
        ],
        [
          [
            572.9238,
            1200.8969
          ],
          [
            460.4859,
            1200.8969
          ],
          [
            460.4859,
            1308.0
          ],
          [
            252.0,
            1308.0
          ]
        ],
        [
          [
            725.8464,
            1200.8969
          ],
          [
            751.5,
            1200.8969
          ],
          [
            751.5,
            1299.0
          ],
          [
            792.0,
            1299.0
          ]
        ],
        [
          [
            288.0,
            1308.0
          ],
          [
            288.0,
            1159.5
          ]
        ],
        [
          [
            460.4859,
            1240.5
          ],
          [
            450.0,
            1240.5
          ]
        ],
        [
          [
            602.159,
            916.7156
          ],
          [
            602.159,
            723.0
          ],
          [
            594.0,
            723.0
          ],
          [
            594.0,
            678.0
          ]
        ],
        [
          [
            652.5,
            916.7156
          ],
          [
            652.5,
            867.0
          ]
        ]
      ],
      "entrances": [
        {
          "id": "entrance",
          "at": [
            357.0336,
            169.5
          ],
          "label": "East entrance",
          "stepFree": false,
          "entrance": true
        }
      ],
      "entranceEvidence": {
        "entrance": {
          "numberStatus": "not applicable",
          "positionStatus": "confirmed",
          "identityStatus": "confirmed",
          "sources": [
            "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
            "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
          ],
          "notes": "Entrance identity and edge follow labelled source drawing. Exact threshold/door leaf and accessibility are inferred; not a verified accessible entrance or emergency exit.",
          "accessibilityStatus": "inferred"
        }
      },
      "voids": [],
      "evidence": {
        "numberStatus": "not applicable",
        "positionStatus": "inferred",
        "identityStatus": "confirmed",
        "sources": [
          "Doheny Memorial Library self-guided tour brochure.pdf p. 3",
          "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=3"
        ],
        "notes": "Public floor diagram traced from supplied brochure; named spaces and exterior shape are source-grounded. Gray areas remain undetailed nonpublic blocks. Exact doors, route centerlines, absolute scale, service across floors and core registration are inferred. Nine stack levels are not resolved."
      }
    },
    {
      "level": 2,
      "name": "First floor",
      "planScope": "partial",
      "slabs": [
        [
          841.8798,
          169.5,
          1161.0,
          513.692
        ],
        [
          99.0,
          261.6393,
          300.7233,
          513.692
        ],
        [
          99.0,
          513.692,
          1161.0,
          1449.129
        ],
        [
          99.0,
          1449.129,
          737.4213,
          1450.1293
        ],
        [
          954.0288,
          1449.129,
          1161.0,
          1690.5
        ],
        [
          99.0,
          1450.1293,
          307.7807,
          1690.5
        ],
        [
          524.3427,
          1450.1293,
          737.4213,
          1465.6296
        ]
      ],
      "rooms": [
        [
          "",
          "East Asian Library",
          "o",
          [
            99.0,
            593.058,
            300.7233,
            1083.9819
          ],
          "E",
          undefined,
          "East Asian Library"
        ],
        [
          "108A",
          "Hall of Honor / Top Drawer Society",
          "o",
          [
            320.1764,
            956.7053,
            530.5406,
            1129.4378
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "",
          "Circulation Desk and Bookstacks Entrance",
          "o",
          [
            535.0648,
            915.7948,
            704.7131,
            1029.4347
          ],
          "S",
          undefined,
          "Circulation Desk and Bookstacks Entrance"
        ],
        [
          "",
          "Entrance Pavilion",
          "o",
          [
            541.8504,
            1088.5273,
            722.8089,
            1183.985
          ],
          "S",
          undefined,
          "Entrance Pavilion"
        ],
        [
          "119",
          "Los Angeles Times Reference Room",
          "o",
          [
            841.8798,
            169.5,
            1161.0,
            972.615
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "",
          "Los Angeles Times Reference Room — west extension",
          "o",
          [
            942.2212,
            987.1608,
            1043.5581,
            1291.7154
          ],
          "W",
          undefined,
          "Los Angeles Times Reference Room — west extension"
        ],
        [
          "",
          "Treasure Room",
          "r",
          [
            1044.0104,
            987.1608,
            1161.0,
            1291.7154
          ],
          "W",
          undefined,
          "Treasure Room"
        ],
        [
          "",
          "Faculty Hall",
          "r",
          [
            954.0288,
            1293.0789,
            1161.0,
            1690.5
          ],
          "N",
          undefined,
          "Faculty Hall"
        ],
        [
          "",
          "Unresolved north/west service rooms",
          "b",
          [
            99.0,
            1361.2629,
            307.7807,
            1690.5
          ],
          "N",
          undefined,
          "Unresolved north/west service rooms"
        ],
        [
          "",
          "Unresolved west support block",
          "b",
          [
            360.8924,
            1297.6248,
            510.183,
            1447.6292
          ],
          "N",
          undefined,
          "Unresolved west support block"
        ],
        [
          "",
          "Unresolved stack-support block",
          "b",
          [
            406.1317,
            770.336,
            591.6141,
            911.2494
          ],
          "N",
          undefined,
          "Unresolved stack-support block"
        ],
        [
          "",
          "Unresolved circulation support block",
          "b",
          [
            727.3332,
            915.7948,
            841.7894,
            1083.9819
          ],
          "W",
          undefined,
          "Unresolved circulation support block"
        ],
        [
          "",
          "Unresolved circulation support block — south extension",
          "b",
          [
            841.7894,
            988.5243,
            939.9591,
            1083.9819
          ],
          "S",
          undefined,
          "Unresolved circulation support block — south extension"
        ],
        [
          "",
          "West elevator",
          "e:WEST",
          [
            198.0,
            1281.0,
            252.0,
            1339.5
          ],
          "E",
          undefined,
          "West elevator"
        ],
        [
          "",
          "South stair",
          "s:SOUTH",
          [
            751.5,
            1227.0,
            837.0,
            1299.0
          ],
          "S",
          undefined,
          "South stair"
        ],
        [
          "",
          "North stair",
          "s:NORTH",
          [
            211.5,
            1105.5,
            288.0,
            1213.5
          ],
          "E",
          undefined,
          "North stair"
        ],
        [
          "",
          "Inner west elevator",
          "e:INNER",
          [
            396.0,
            1204.5,
            450.0,
            1267.5
          ],
          "E",
          undefined,
          "Inner west elevator"
        ],
        [
          "",
          "Stack-side elevator",
          "e:STACK-E",
          [
            594.0,
            633.0,
            634.5,
            723.0
          ],
          "W",
          undefined,
          "Stack-side elevator"
        ],
        [
          "",
          "Stack-side stair",
          "s:STACK-S",
          [
            607.5,
            813.0,
            652.5,
            912.0
          ],
          "E",
          undefined,
          "Stack-side stair"
        ]
      ],
      "records": [
        {
          "id": "DML-2-EAST-ASIAN",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Tour stop 8 identifies the north wing; upper north-wing service subdivisions are not assigned invented identities. Boundary read from PDF diagram; historical use is not a claim of current tenancy."
          },
          "door": [
            300.7233,
            961.2512
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-108A",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4",
              "docs/interiors/research-v2/libraries/confirmed-room-corrections.json"
            ],
            "notes": "Tour stop 7 is left of circulation and leads into East Asian Library. 108A from confirmed catalogue; exact hall edges simplified around pictured service counters. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            464.9432,
            1129.4378
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-CIRCULATION",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Tour stop 3 marks the desk footprint. Display rectangle represents the service area, not a closed bookstack room. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            623.2819,
            1029.4347
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-PAVILION",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Tour stop 2; display label region inside the larger open entrance hall. Main stairs west and circulation desk east are retained. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            609.71,
            1183.985
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-119",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4",
              "docs/interiors/research-v2/libraries/confirmed-room-corrections.json"
            ],
            "notes": "Tour stop 6. Large south/east reading wing; room number 119 from confirmed catalogue. Lower west extension modeled separately to preserve the Treasure Room recess. Boundary read from PDF diagram; historical use is not a claim of current tenancy."
          },
          "door": [
            917.3394,
            972.615
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-LATIMES-EXT",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Inferred boundary within the irregular extension of the same reference room. No extra room number; narrow circulation clearance kept beside the source doorway. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            942.2212,
            1120.3464
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-TREASURE",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Tour stop 4; source wall rectangle adjoining entrance pavilion and Faculty Hall. Boundary read from PDF diagram; historical use is not a claim of current tenancy."
          },
          "door": [
            1044.0104,
            1111.2555
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-FACULTY",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Tour stop 5; long south/west room shown beyond Treasure Room. Boundary read from PDF diagram; historical use is not a claim of current tenancy."
          },
          "door": [
            1012.3425,
            1293.0789
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-BLOCK-NW",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Gray service subdivisions aggregated without invented room identities. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            261.3649,
            1361.2629
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-BLOCK-W",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Gray source area beside main entrance stairs. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            442.3234,
            1297.6248
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-BLOCK-C",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Gray source area east of circulation desk; internal stack levels unresolved. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            505.6587,
            770.336
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-BLOCK-DESK-N",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Gray counter/support region adjoining the circulation desk, kept outside routes. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            727.3332,
            1029.4347
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-BLOCK-DESK-S",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Gray L-shaped extension beside the reference-room entrance, kept outside routes. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            894.7197,
            1083.9819
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-WEST-ELEV",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            252.0,
            1308.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-SOUTH-STAIR",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            792.0,
            1299.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-NORTH-STAIR",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            288.0,
            1159.5
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-INNER-ELEV",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            450.0,
            1240.5
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-STACK-ELEV",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            594.0,
            678.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-2-STACK-STAIR",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            652.5,
            867.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        }
      ],
      "walks": [
        [
          [
            631.4252,
            1465.6296
          ],
          [
            631.4252,
            1459.1293
          ],
          [
            623.2819,
            1459.1293
          ],
          [
            623.2819,
            1306.6248
          ],
          [
            609.71,
            1306.6248
          ],
          [
            609.71,
            1302.0789
          ],
          [
            603.0,
            1302.0789
          ],
          [
            603.0,
            1299.0
          ],
          [
            594.0,
            1299.0
          ],
          [
            594.0,
            1293.0789
          ],
          [
            585.0,
            1293.0789
          ],
          [
            585.0,
            1290.0
          ],
          [
            533.3427,
            1290.0
          ],
          [
            533.3427,
            1129.4378
          ],
          [
            464.9432,
            1129.4378
          ],
          [
            320.1764,
            1129.4378
          ],
          [
            320.1764,
            1120.4378
          ],
          [
            300.7233,
            1120.4378
          ],
          [
            300.7233,
            961.2512
          ]
        ],
        [
          [
            533.3427,
            1129.4378
          ],
          [
            533.3427,
            1120.4378
          ],
          [
            541.8504,
            1120.4378
          ],
          [
            541.8504,
            1029.4347
          ],
          [
            623.2819,
            1029.4347
          ]
        ],
        [
          [
            533.3427,
            1183.985
          ],
          [
            609.71,
            1183.985
          ]
        ],
        [
          [
            623.2819,
            1029.4347
          ],
          [
            623.2819,
            1083.9819
          ],
          [
            841.7894,
            1083.9819
          ],
          [
            841.7894,
            972.615
          ],
          [
            917.3394,
            972.615
          ]
        ],
        [
          [
            841.7894,
            1083.9819
          ],
          [
            841.7894,
            1120.3464
          ],
          [
            942.2212,
            1120.3464
          ]
        ],
        [
          [
            917.3394,
            972.615
          ],
          [
            930.9591,
            972.615
          ],
          [
            930.9591,
            978.1608
          ],
          [
            1034.5581,
            978.1608
          ],
          [
            1034.5581,
            987.1608
          ],
          [
            1043.5581,
            987.1608
          ],
          [
            1043.5581,
            1111.2555
          ],
          [
            1044.0104,
            1111.2555
          ]
        ],
        [
          [
            1043.5581,
            1111.2555
          ],
          [
            1043.5581,
            1291.7154
          ],
          [
            1035.0104,
            1291.7154
          ],
          [
            1035.0104,
            1293.0789
          ],
          [
            1012.3425,
            1293.0789
          ]
        ],
        [
          [
            300.7233,
            1120.4378
          ],
          [
            300.7233,
            1281.0
          ],
          [
            252.0,
            1281.0
          ],
          [
            252.0,
            1308.0
          ]
        ],
        [
          [
            623.2819,
            1306.6248
          ],
          [
            623.2819,
            1302.0789
          ],
          [
            713.7131,
            1302.0789
          ],
          [
            713.7131,
            1299.0
          ],
          [
            792.0,
            1299.0
          ]
        ],
        [
          [
            300.7233,
            1159.5
          ],
          [
            288.0,
            1159.5
          ]
        ],
        [
          [
            533.3427,
            1240.5
          ],
          [
            450.0,
            1240.5
          ]
        ],
        [
          [
            541.8504,
            1029.4347
          ],
          [
            535.0648,
            1029.4347
          ],
          [
            535.0648,
            915.7948
          ],
          [
            539.5406,
            915.7948
          ],
          [
            539.5406,
            912.0
          ],
          [
            594.0,
            912.0
          ],
          [
            594.0,
            678.0
          ]
        ],
        [
          [
            594.0,
            912.0
          ],
          [
            652.5,
            912.0
          ],
          [
            652.5,
            867.0
          ]
        ]
      ],
      "entrances": [
        {
          "id": "north-main",
          "at": [
            631.4252,
            1465.6296
          ],
          "label": "Main entrance stairs",
          "stepFree": false,
          "entrance": true
        }
      ],
      "entranceEvidence": {
        "north-main": {
          "numberStatus": "not applicable",
          "positionStatus": "confirmed",
          "identityStatus": "confirmed",
          "sources": [
            "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
            "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
          ],
          "notes": "Entrance identity and edge follow labelled source drawing. Exact threshold/door leaf and accessibility are inferred; not a verified accessible entrance or emergency exit.",
          "accessibilityStatus": "inferred"
        }
      },
      "voids": [
        {
          "id": "DML-2-EAST-RECESS",
          "name": "East exterior recess above ground pavilion",
          "rect": [
            -22.278689999999997,
            -7.062660000000002,
            -13.876933333333334,
            10.97589
          ],
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
            ],
            "notes": "Open recess traced from the floor exterior boundary; no slab/corridor fills this area."
          }
        }
      ],
      "evidence": {
        "numberStatus": "not applicable",
        "positionStatus": "inferred",
        "identityStatus": "confirmed",
        "sources": [
          "Doheny Memorial Library self-guided tour brochure.pdf p. 4",
          "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=4"
        ],
        "notes": "Public floor diagram traced from supplied brochure; named spaces and exterior shape are source-grounded. Gray areas remain undetailed nonpublic blocks. Exact doors, route centerlines, absolute scale, service across floors and core registration are inferred. Nine stack levels are not resolved."
      }
    },
    {
      "level": 3,
      "name": "Second floor",
      "planScope": "partial",
      "slabs": [
        [
          844.3157,
          169.5,
          1161.0,
          507.6714
        ],
        [
          99.0,
          269.8252,
          290.7405,
          507.6714
        ],
        [
          99.0,
          507.6714,
          1161.0,
          1402.423
        ],
        [
          99.0,
          1402.423,
          305.73,
          1690.5
        ],
        [
          953.681,
          1402.423,
          1161.0,
          1690.5
        ]
      ],
      "rooms": [
        [
          "241",
          "USC Sidney Harman Academy for Polymathic Study",
          "r",
          [
            99.0,
            269.8252,
            290.7405,
            576.0687
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "240",
          "Friends of the USC Libraries Lecture Hall",
          "r",
          [
            99.0,
            578.7939,
            290.7405,
            1078.3758
          ],
          "E",
          undefined,
          undefined
        ],
        [
          "233",
          "Intellectual Commons",
          "r",
          [
            99.0,
            1348.6044,
            305.73,
            1690.5
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "",
          "Feuchtwanger Memorial Library / Special Collections gateway",
          "r",
          [
            962.6022,
            1001.1675,
            1161.0,
            1305.4584
          ],
          "S",
          undefined,
          "Feuchtwanger Memorial Library / Special Collections gateway"
        ],
        [
          "",
          "Horton Rare Book Reading Room",
          "r",
          [
            953.681,
            1548.4372,
            1161.0,
            1690.5
          ],
          "N",
          undefined,
          "Horton Rare Book Reading Room"
        ],
        [
          "",
          "Women’s restroom",
          "w",
          [
            355.7713,
            1105.6255,
            414.6431,
            1201.0004
          ],
          "W",
          undefined,
          "Women’s restroom"
        ],
        [
          "",
          "Men’s restroom",
          "w",
          [
            894.6734,
            1205.5422,
            962.6022,
            1291.8338
          ],
          "S",
          undefined,
          "Men’s restroom"
        ],
        [
          "",
          "Unresolved east stack block",
          "b",
          [
            396.5283,
            524.2939,
            843.9534,
            996.6261
          ],
          "W",
          undefined,
          "Unresolved east stack block"
        ],
        [
          "",
          "Unresolved south/east stack wing",
          "b",
          [
            844.3157,
            169.5,
            1161.0,
            996.6261
          ],
          "S",
          undefined,
          "Unresolved south/east stack wing"
        ],
        [
          "",
          "Unresolved central stack block",
          "b",
          [
            525.5933,
            1001.1675,
            736.173,
            1303.1877
          ],
          "S",
          undefined,
          "Unresolved central stack block"
        ],
        [
          "",
          "West elevator",
          "e:WEST",
          [
            198.0,
            1281.0,
            252.0,
            1339.5
          ],
          "E",
          undefined,
          "West elevator"
        ],
        [
          "",
          "South stair",
          "s:SOUTH",
          [
            751.5,
            1227.0,
            837.0,
            1299.0
          ],
          "S",
          undefined,
          "South stair"
        ],
        [
          "",
          "North stair",
          "s:NORTH",
          [
            211.5,
            1105.5,
            288.0,
            1213.5
          ],
          "E",
          undefined,
          "North stair"
        ],
        [
          "",
          "Inner west elevator",
          "e:INNER",
          [
            396.0,
            1204.5,
            450.0,
            1267.5
          ],
          "E",
          undefined,
          "Inner west elevator"
        ]
      ],
      "records": [
        {
          "id": "DML-241",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5",
              "docs/interiors/research-v2/libraries/confirmed-room-corrections.json"
            ],
            "notes": "Tour stop 1; north/east wing. Number 241 confirmed separately; source outline has a small service recess on west side, not split into an invented room. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            238.0279,
            576.0687
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-240",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5",
              "docs/interiors/research-v2/libraries/confirmed-room-corrections.json"
            ],
            "notes": "Tour stop 2; long north-wing lecture space. Catalogue confirms 240. Boundary read from PDF diagram; historical use is not a claim of current tenancy."
          },
          "door": [
            290.7405,
            814.9597
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-233",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5",
              "docs/interiors/research-v2/libraries/confirmed-room-corrections.json"
            ],
            "notes": "Tour stop 3; north/west wing. Catalogue confirms 233. Boundary read from PDF diagram; historical use is not a claim of current tenancy."
          },
          "door": [
            238.0279,
            1348.6044
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-3-FEUCHTWANGER",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Tour stop 4. Western service notch simplified.  This historic named room is not arbitrarily relabelled 209; the catalogue identifies 209 as Special Collections reading/reference without resolving its boundary here. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            989.7741,
            1305.4584
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-3-HORTON",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Tour stop 5. Main reading area shown south/west; small vestibule/service partitions immediately east are omitted. No unsupported room number assigned. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            1026.0027,
            1548.4372
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-3-RR-W",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "W symbol and outlined room beside north circulation. Boundary read from PDF diagram; historical use is not a claim of current tenancy.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            355.7713,
            1151.0422
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          },
          "restroom": "women"
        },
        {
          "id": "DML-3-RR-M",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "M symbol and outlined room beside south stair. Boundary read from PDF diagram; historical use is not a claim of current tenancy.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            921.8453,
            1291.8338
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          },
          "restroom": "men"
        },
        {
          "id": "DML-3-STACKS-E",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Gray stack region aggregated. The brochure does not resolve stack room identities or nine stack-floor heights. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            396.5283,
            792.2518
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-3-STACKS-S",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Gray source wing kept nonpublic and undetailed. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            930.9024,
            996.6261
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-3-STACKS-C",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Gray central area; unlabeled small rooms aggregated without fabricated room numbers. Exact boundary/registration is inferred from the source diagram."
          },
          "door": [
            627.4868,
            1303.1877
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-3-WEST-ELEV",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            252.0,
            1308.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-3-SOUTH-STAIR",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            792.0,
            1299.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-3-NORTH-STAIR",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            288.0,
            1159.5
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "DML-3-INNER-ELEV",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Core symbol/shaft is present in the brochure. Rectangular shaft extent and inter-floor alignment are inferred; floor service and accessibility remain unverified. Exact boundary/registration is inferred from the source diagram.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            450.0,
            1240.5
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Door opening/leaf and corridor connection inferred within the source circulation pattern; no access or evacuation verification.",
            "accessibilityStatus": "inferred"
          }
        }
      ],
      "walks": [
        [
          [
            238.0279,
            576.0687
          ],
          [
            290.7405,
            576.0687
          ],
          [
            290.7405,
            814.9597
          ]
        ],
        [
          [
            290.7405,
            814.9597
          ],
          [
            290.7405,
            1096.5
          ],
          [
            288.0,
            1096.5
          ],
          [
            288.0,
            1159.5
          ],
          [
            288.0,
            1213.5
          ],
          [
            252.0,
            1213.5
          ],
          [
            252.0,
            1308.0
          ],
          [
            252.0,
            1339.5
          ],
          [
            238.0279,
            1339.5
          ],
          [
            238.0279,
            1348.6044
          ]
        ],
        [
          [
            252.0,
            1305.4584
          ],
          [
            989.7741,
            1305.4584
          ]
        ],
        [
          [
            989.7741,
            1305.4584
          ],
          [
            1026.0027,
            1305.4584
          ],
          [
            1026.0027,
            1548.4372
          ]
        ],
        [
          [
            288.0,
            1151.0422
          ],
          [
            355.7713,
            1151.0422
          ]
        ],
        [
          [
            921.8453,
            1305.4584
          ],
          [
            921.8453,
            1291.8338
          ]
        ],
        [
          [
            792.0,
            1305.4584
          ],
          [
            792.0,
            1299.0
          ]
        ],
        [
          [
            450.0,
            1305.4584
          ],
          [
            450.0,
            1240.5
          ]
        ]
      ],
      "entrances": [],
      "entranceEvidence": {},
      "voids": [
        {
          "id": "DML-3-EAST-RECESS",
          "name": "East exterior recess above ground pavilion",
          "rect": [
            -22.005826666666668,
            -7.143856666666666,
            -14.07762,
            11.30865
          ],
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "confirmed",
            "identityStatus": "confirmed",
            "sources": [
              "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
              "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
            ],
            "notes": "Open recess traced from the floor exterior boundary; no slab/corridor fills this area."
          }
        }
      ],
      "evidence": {
        "numberStatus": "not applicable",
        "positionStatus": "inferred",
        "identityStatus": "confirmed",
        "sources": [
          "Doheny Memorial Library self-guided tour brochure.pdf p. 5",
          "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf#page=5"
        ],
        "notes": "Public floor diagram traced from supplied brochure; named spaces and exterior shape are source-grounded. Gray areas remain undetailed nonpublic blocks. Exact doors, route centerlines, absolute scale, service across floors and core registration are inferred. Nine stack levels are not resolved."
      }
    }
  ]
}
