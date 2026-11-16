// Floors1–3 retain the inferred demo. Floor4 rebuilt by scripts/trace-partial.py from the supplied Room450 PDF.
import type { Reconstruction } from './types.js'

export const TCC_RECONSTRUCTION: Reconstruction = {
  "code": "TCC",
  "name": "Ronald Tutor Campus Center",
  "aliases": [
    "Tutor Campus Center"
  ],
  "floorCountStatus": "confirmed",
  "floorCountNotes": "Directory and meeting-room list support floors 1\u20134; basement entries belong to SKS.",
  "shapeSource": "apps/campus-demo/locations.json: TCC paths; apps/campus-demo/locations.json; fourth-floor partial suite: https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf",
  "shapeNotes": "apps/campus-demo/locations.json | Narrow north/south bar and wider end volumes follow supplied TCC polygon, not the old rectangle. The fourth-floor Forum suite is a partial traced component; its placement in the campus envelope remains inferred.",
  "orientationDegrees": -27.6,
  "footprint": [
    [
      -3.13,
      1.528
    ],
    [
      -2.597,
      1.806
    ],
    [
      1.484,
      -6.0
    ],
    [
      4.322,
      -4.516
    ],
    [
      3.289,
      -2.539
    ],
    [
      2.655,
      -2.87
    ],
    [
      -1.982,
      6.0
    ],
    [
      -4.187,
      4.847
    ],
    [
      -3.79,
      4.087
    ],
    [
      -4.322,
      3.809
    ]
  ],
  "floors": [
    {
      "level": 1,
      "name": "Floor 1",
      "slabs": [
        [
          0,
          774.0,
          1284.0,
          1035.0
        ],
        [
          1050,
          816.0,
          1284.0,
          1110
        ],
        [
          90,
          711.0,
          360,
          1035.0
        ]
      ],
      "rooms": [
        [
          "101",
          "Dining / student commons",
          "r",
          [
            1014.99,
            786.0,
            1170,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "102",
          "Dining / student commons",
          "r",
          [
            860.01,
            786.0,
            1014.99,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "103",
          "Dining / student commons",
          "r",
          [
            705.0,
            786.0,
            860.01,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "104",
          "Dining / student commons",
          "r",
          [
            375.0,
            786.0,
            480,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "105",
          "Dining / student commons",
          "r",
          [
            225.0,
            726.0,
            345.0,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "106",
          "Dining / student commons",
          "r",
          [
            105.0,
            726.0,
            225.0,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "107",
          "Dining / student commons",
          "r",
          [
            1065.0,
            960,
            1269.0,
            1095.0
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "108",
          "Dining / student commons",
          "r",
          [
            695.01,
            960,
            1035.0,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "109",
          "Dining / student commons",
          "r",
          [
            354.99,
            960,
            695.01,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "110",
          "Dining / student commons",
          "r",
          [
            15.0,
            960,
            354.99,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "",
          "North stairs",
          "s:A",
          [
            1185.0,
            786.0,
            1269.0,
            900
          ],
          "S",
          undefined,
          "North stairs"
        ],
        [
          "",
          "South stairs",
          "s:B",
          [
            15.0,
            786.0,
            90,
            900
          ],
          "S",
          undefined,
          "South stairs"
        ],
        [
          "",
          "Central elevator",
          "e:E",
          [
            600,
            786.0,
            690,
            900
          ],
          "S",
          undefined,
          "Central elevator"
        ],
        [
          "",
          "Restrooms",
          "w",
          [
            495.0,
            786.0,
            585.0,
            900
          ],
          "S",
          undefined,
          "Restrooms"
        ]
      ],
      "walks": [
        [
          [
            1284.0,
            930
          ],
          [
            0,
            930
          ]
        ],
        [
          [
            1092.48,
            930.0
          ],
          [
            1092.495,
            900
          ]
        ],
        [
          [
            937.5,
            930.0
          ],
          [
            937.5,
            900
          ]
        ],
        [
          [
            782.52,
            930.0
          ],
          [
            782.505,
            900
          ]
        ],
        [
          [
            427.5,
            930.0
          ],
          [
            427.5,
            900
          ]
        ],
        [
          [
            285.0,
            930.0
          ],
          [
            285.0,
            900
          ]
        ],
        [
          [
            165.0,
            930.0
          ],
          [
            165.0,
            900
          ]
        ],
        [
          [
            1167.0,
            930.0
          ],
          [
            1167.0,
            960
          ]
        ],
        [
          [
            865.02,
            930.0
          ],
          [
            865.005,
            960
          ]
        ],
        [
          [
            525.0,
            930.0
          ],
          [
            525.0,
            960
          ]
        ],
        [
          [
            185.01,
            930.0
          ],
          [
            184.995,
            960
          ]
        ],
        [
          [
            1227.0,
            930.0
          ],
          [
            1227.0,
            900
          ]
        ],
        [
          [
            52.5,
            930.0
          ],
          [
            52.5,
            900
          ]
        ],
        [
          [
            645.0,
            930.0
          ],
          [
            645.0,
            900
          ]
        ],
        [
          [
            540.0,
            930.0
          ],
          [
            540.0,
            900
          ]
        ]
      ],
      "entrances": [
        {
          "id": "entrance",
          "at": [
            1284.0,
            930
          ],
          "label": "main entrance",
          "stepFree": true,
          "entrance": true
        },
        {
          "id": "exit",
          "at": [
            0,
            930
          ],
          "label": "secondary exit",
          "stepFree": true,
          "entrance": false
        }
      ],
      "records": [
        {
          "id": "TCC-101",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-102",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-103",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-104",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-105",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-106",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-107",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-108",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-109",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-110",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-1-SA",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Core alignment and floor service inferred. Accessibility and evacuation suitability unverified.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "TCC-1-SB",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Core alignment and floor service inferred. Accessibility and evacuation suitability unverified.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "TCC-1-EL",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Core alignment and floor service inferred. Accessibility and evacuation suitability unverified.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "TCC-1-RR",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Core alignment and floor service inferred. Accessibility and evacuation suitability unverified.",
            "accessibilityStatus": "inferred"
          },
          "restroom": "both"
        }
      ],
      "evidence": {
        "numberStatus": "not applicable",
        "positionStatus": "inferred",
        "identityStatus": "inferred",
        "sources": [
          "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
          "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
        ],
        "notes": "Position, boundary and door inferred. Whole floor geometry inferred. SKS B3/B4/B5/B41/B42, SKS 100/107/202/305/410 excluded. No TCC basement asserted. Room-number prefix sets floor; all boundaries inferred. Forum receives a larger inferred event-room volume. Unverified reconstruction retained only as an optional demo; drawing geometry has not been inspected or traced."
      },
      "entranceEvidence": {
        "entrance": {
          "numberStatus": "not applicable",
          "positionStatus": "inferred",
          "identityStatus": "inferred",
          "sources": [
            "apps/campus-demo/locations.json"
          ],
          "notes": "Position, boundary and door inferred. Door location and step-free property inferred; not a verified accessible entrance or emergency exit.",
          "accessibilityStatus": "inferred"
        },
        "exit": {
          "numberStatus": "not applicable",
          "positionStatus": "inferred",
          "identityStatus": "inferred",
          "sources": [
            "apps/campus-demo/locations.json"
          ],
          "notes": "Position, boundary and door inferred. Door location and step-free property inferred; not a verified accessible entrance or emergency exit.",
          "accessibilityStatus": "inferred"
        }
      },
      "voids": []
    },
    {
      "level": 2,
      "name": "Floor 2",
      "slabs": [
        [
          0,
          774.0,
          1284.0,
          1035.0
        ],
        [
          1050,
          816.0,
          1284.0,
          1110
        ],
        [
          90,
          711.0,
          360,
          1035.0
        ]
      ],
      "rooms": [
        [
          "221",
          "Meeting room",
          "r",
          [
            1053.75,
            786.0,
            1170,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "224",
          "First Generation Plus Success Center",
          "r",
          [
            937.5,
            786.0,
            1053.75,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "227",
          "Rosen Family Screening Room",
          "r",
          [
            821.25,
            786.0,
            937.5,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "232",
          "Meeting room",
          "r",
          [
            705.0,
            786.0,
            821.25,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "201",
          "Office / meeting room",
          "r",
          [
            375.0,
            786.0,
            480,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "202",
          "Office / meeting room",
          "r",
          [
            264.99,
            726.0,
            345.0,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "203",
          "Office / meeting room",
          "r",
          [
            185.01,
            726.0,
            264.99,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "204",
          "Office / meeting room",
          "r",
          [
            105.0,
            726.0,
            185.01,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "205",
          "Office / meeting room",
          "r",
          [
            1167.0,
            960,
            1269.0,
            1095.0
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "206",
          "Office / meeting room",
          "r",
          [
            1065.0,
            960,
            1167.0,
            1095.0
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "207",
          "Office / meeting room",
          "r",
          [
            780.0,
            960,
            1035.0,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "208",
          "Office / meeting room",
          "r",
          [
            525.0,
            960,
            780.0,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "209",
          "Office / meeting room",
          "r",
          [
            270.0,
            960,
            525.0,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "210",
          "Office / meeting room",
          "r",
          [
            15.0,
            960,
            270.0,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "",
          "North stairs",
          "s:A",
          [
            1185.0,
            786.0,
            1269.0,
            900
          ],
          "S",
          undefined,
          "North stairs"
        ],
        [
          "",
          "South stairs",
          "s:B",
          [
            15.0,
            786.0,
            90,
            900
          ],
          "S",
          undefined,
          "South stairs"
        ],
        [
          "",
          "Central elevator",
          "e:E",
          [
            600,
            786.0,
            690,
            900
          ],
          "S",
          undefined,
          "Central elevator"
        ],
        [
          "",
          "Restrooms",
          "w",
          [
            495.0,
            786.0,
            585.0,
            900
          ],
          "S",
          undefined,
          "Restrooms"
        ]
      ],
      "walks": [
        [
          [
            1284.0,
            930
          ],
          [
            0,
            930
          ]
        ],
        [
          [
            1111.86,
            930.0
          ],
          [
            1111.875,
            900
          ]
        ],
        [
          [
            995.64,
            930.0
          ],
          [
            995.625,
            900
          ]
        ],
        [
          [
            879.36,
            930.0
          ],
          [
            879.375,
            900
          ]
        ],
        [
          [
            763.14,
            930.0
          ],
          [
            763.125,
            900
          ]
        ],
        [
          [
            427.5,
            930.0
          ],
          [
            427.5,
            900
          ]
        ],
        [
          [
            305.01,
            930.0
          ],
          [
            304.995,
            900
          ]
        ],
        [
          [
            225.0,
            930.0
          ],
          [
            225.0,
            900
          ]
        ],
        [
          [
            145.02,
            930.0
          ],
          [
            145.005,
            900
          ]
        ],
        [
          [
            1218.0,
            930.0
          ],
          [
            1218.0,
            960
          ]
        ],
        [
          [
            1116.0,
            930.0
          ],
          [
            1116.0,
            960
          ]
        ],
        [
          [
            907.5,
            930.0
          ],
          [
            907.5,
            960
          ]
        ],
        [
          [
            652.5,
            930.0
          ],
          [
            652.5,
            960
          ]
        ],
        [
          [
            397.5,
            930.0
          ],
          [
            397.5,
            960
          ]
        ],
        [
          [
            142.5,
            930.0
          ],
          [
            142.5,
            960
          ]
        ],
        [
          [
            1227.0,
            930.0
          ],
          [
            1227.0,
            900
          ]
        ],
        [
          [
            52.5,
            930.0
          ],
          [
            52.5,
            900
          ]
        ],
        [
          [
            645.0,
            930.0
          ],
          [
            645.0,
            900
          ]
        ],
        [
          [
            540.0,
            930.0
          ],
          [
            540.0,
            900
          ]
        ]
      ],
      "entrances": [],
      "records": [
        {
          "id": "TCC-221",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory."
          }
        },
        {
          "id": "TCC-224",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory."
          }
        },
        {
          "id": "TCC-227",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory."
          }
        },
        {
          "id": "TCC-232",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory."
          }
        },
        {
          "id": "TCC-201",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-202",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-203",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-204",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-205",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-206",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-207",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-208",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-209",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-210",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-2-SA",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Core alignment and floor service inferred. Accessibility and evacuation suitability unverified.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "TCC-2-SB",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Core alignment and floor service inferred. Accessibility and evacuation suitability unverified.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "TCC-2-EL",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Core alignment and floor service inferred. Accessibility and evacuation suitability unverified.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "TCC-2-RR",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Core alignment and floor service inferred. Accessibility and evacuation suitability unverified.",
            "accessibilityStatus": "inferred"
          },
          "restroom": "both"
        }
      ],
      "evidence": {
        "numberStatus": "not applicable",
        "positionStatus": "inferred",
        "identityStatus": "inferred",
        "sources": [
          "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
          "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
        ],
        "notes": "Position, boundary and door inferred. Whole floor geometry inferred. SKS B3/B4/B5/B41/B42, SKS 100/107/202/305/410 excluded. No TCC basement asserted. Room-number prefix sets floor; all boundaries inferred. Forum receives a larger inferred event-room volume. Unverified reconstruction retained only as an optional demo; drawing geometry has not been inspected or traced."
      },
      "entranceEvidence": {},
      "voids": []
    },
    {
      "level": 3,
      "name": "Floor 3",
      "slabs": [
        [
          0,
          774.0,
          1284.0,
          1035.0
        ],
        [
          1050,
          816.0,
          1284.0,
          1110
        ],
        [
          90,
          711.0,
          360,
          1035.0
        ]
      ],
      "rooms": [
        [
          "315",
          "Lactation Room",
          "r",
          [
            1092.51,
            786.0,
            1170,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "320A",
          "MAAA Cruz Family Board Room",
          "r",
          [
            1014.99,
            786.0,
            1092.51,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "320B",
          "Meeting room",
          "r",
          [
            937.5,
            786.0,
            1014.99,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "320C",
          "Hui Conference Room",
          "r",
          [
            860.01,
            786.0,
            937.5,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "322",
          "Asian Pacific Alumni Association",
          "r",
          [
            782.49,
            786.0,
            860.01,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "323",
          "Black Alumni Association",
          "r",
          [
            705.0,
            786.0,
            782.49,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "324",
          "Latino Alumni Association",
          "r",
          [
            375.0,
            786.0,
            480,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "330",
          "Fraternity & Sorority Leadership Development / Veterans Resource Center",
          "r",
          [
            285.0,
            726.0,
            345.0,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "350",
          "Franklin Suite 350",
          "r",
          [
            225.0,
            726.0,
            285.0,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "351",
          "Franklin Suite 351",
          "r",
          [
            165.0,
            726.0,
            225.0,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "352",
          "Franklin Suite 352",
          "r",
          [
            105.0,
            726.0,
            165.0,
            900
          ],
          "S",
          undefined,
          undefined
        ],
        [
          "301",
          "Office / meeting room",
          "r",
          [
            1200.99,
            960,
            1269.0,
            1095.0
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "302",
          "Office / meeting room",
          "r",
          [
            1133.01,
            960,
            1200.99,
            1095.0
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "303",
          "Office / meeting room",
          "r",
          [
            1065.0,
            960,
            1133.01,
            1095.0
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "304",
          "Office / meeting room",
          "r",
          [
            889.29,
            960,
            1035.0,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "305",
          "Office / meeting room",
          "r",
          [
            743.58,
            960,
            889.29,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "306",
          "Office / meeting room",
          "r",
          [
            597.87,
            960,
            743.58,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "307",
          "Office / meeting room",
          "r",
          [
            452.13,
            960,
            597.87,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "308",
          "Office / meeting room",
          "r",
          [
            306.42,
            960,
            452.13,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "309",
          "Office / meeting room",
          "r",
          [
            160.71,
            960,
            306.42,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "310",
          "Office / meeting room",
          "r",
          [
            15.0,
            960,
            160.71,
            1020
          ],
          "N",
          undefined,
          undefined
        ],
        [
          "",
          "North stairs",
          "s:A",
          [
            1185.0,
            786.0,
            1269.0,
            900
          ],
          "S",
          undefined,
          "North stairs"
        ],
        [
          "",
          "South stairs",
          "s:B",
          [
            15.0,
            786.0,
            90,
            900
          ],
          "S",
          undefined,
          "South stairs"
        ],
        [
          "",
          "Central elevator",
          "e:E",
          [
            600,
            786.0,
            690,
            900
          ],
          "S",
          undefined,
          "Central elevator"
        ],
        [
          "",
          "Restrooms",
          "w",
          [
            495.0,
            786.0,
            585.0,
            900
          ],
          "S",
          undefined,
          "Restrooms"
        ]
      ],
      "walks": [
        [
          [
            1284.0,
            930
          ],
          [
            0,
            930
          ]
        ],
        [
          [
            1131.27,
            930.0
          ],
          [
            1131.255,
            900
          ]
        ],
        [
          [
            1053.75,
            930.0
          ],
          [
            1053.75,
            900
          ]
        ],
        [
          [
            976.23,
            930.0
          ],
          [
            976.245,
            900
          ]
        ],
        [
          [
            898.77,
            930.0
          ],
          [
            898.755,
            900
          ]
        ],
        [
          [
            821.25,
            930.0
          ],
          [
            821.25,
            900
          ]
        ],
        [
          [
            743.73,
            930.0
          ],
          [
            743.745,
            900
          ]
        ],
        [
          [
            427.5,
            930.0
          ],
          [
            427.5,
            900
          ]
        ],
        [
          [
            315.0,
            930.0
          ],
          [
            315.0,
            900
          ]
        ],
        [
          [
            255.0,
            930.0
          ],
          [
            255.0,
            900
          ]
        ],
        [
          [
            195.0,
            930.0
          ],
          [
            195.0,
            900
          ]
        ],
        [
          [
            135.0,
            930.0
          ],
          [
            135.0,
            900
          ]
        ],
        [
          [
            1234.98,
            930.0
          ],
          [
            1234.995,
            960
          ]
        ],
        [
          [
            1167.0,
            930.0
          ],
          [
            1167.0,
            960
          ]
        ],
        [
          [
            1098.99,
            930.0
          ],
          [
            1099.005,
            960
          ]
        ],
        [
          [
            962.13,
            930.0
          ],
          [
            962.145,
            960
          ]
        ],
        [
          [
            816.42,
            930.0
          ],
          [
            816.435,
            960
          ]
        ],
        [
          [
            670.71,
            930.0
          ],
          [
            670.725,
            960
          ]
        ],
        [
          [
            525.0,
            930.0
          ],
          [
            525.0,
            960
          ]
        ],
        [
          [
            379.29,
            930.0
          ],
          [
            379.275,
            960
          ]
        ],
        [
          [
            233.58,
            930.0
          ],
          [
            233.565,
            960
          ]
        ],
        [
          [
            87.87,
            930.0
          ],
          [
            87.855,
            960
          ]
        ],
        [
          [
            1227.0,
            930.0
          ],
          [
            1227.0,
            900
          ]
        ],
        [
          [
            52.5,
            930.0
          ],
          [
            52.5,
            900
          ]
        ],
        [
          [
            645.0,
            930.0
          ],
          [
            645.0,
            900
          ]
        ],
        [
          [
            540.0,
            930.0
          ],
          [
            540.0,
            900
          ]
        ]
      ],
      "entrances": [],
      "records": [
        {
          "id": "TCC-315",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory."
          }
        },
        {
          "id": "TCC-320A",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory."
          }
        },
        {
          "id": "TCC-320B",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory."
          }
        },
        {
          "id": "TCC-320C",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory."
          }
        },
        {
          "id": "TCC-322",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory."
          }
        },
        {
          "id": "TCC-323",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory."
          }
        },
        {
          "id": "TCC-324",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory."
          }
        },
        {
          "id": "TCC-330",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory. Directory lists two occupants for 330; one room retained, tenancy unresolved."
          }
        },
        {
          "id": "TCC-350",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory. Franklin suite subdivisions inferred."
          }
        },
        {
          "id": "TCC-351",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory. Franklin suite subdivisions inferred."
          }
        },
        {
          "id": "TCC-352",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Room number/name confirmed by directory. Franklin suite subdivisions inferred."
          }
        },
        {
          "id": "TCC-301",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-302",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-303",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-304",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-305",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-306",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-307",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-308",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-309",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-310",
          "evidence": {
            "numberStatus": "inferred",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "Original apps/web/src/data/floorplan.ts template (unverified demo IDs only)"
            ],
            "notes": "Position, boundary and door inferred. Retained legacy demo number; number and use inferred."
          }
        },
        {
          "id": "TCC-3-SA",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Core alignment and floor service inferred. Accessibility and evacuation suitability unverified.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "TCC-3-SB",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Core alignment and floor service inferred. Accessibility and evacuation suitability unverified.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "TCC-3-EL",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Core alignment and floor service inferred. Accessibility and evacuation suitability unverified.",
            "accessibilityStatus": "inferred"
          }
        },
        {
          "id": "TCC-3-RR",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
            ],
            "notes": "Position, boundary and door inferred. Core alignment and floor service inferred. Accessibility and evacuation suitability unverified.",
            "accessibilityStatus": "inferred"
          },
          "restroom": "both"
        }
      ],
      "evidence": {
        "numberStatus": "not applicable",
        "positionStatus": "inferred",
        "identityStatus": "inferred",
        "sources": [
          "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
          "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/"
        ],
        "notes": "Position, boundary and door inferred. Whole floor geometry inferred. SKS B3/B4/B5/B41/B42, SKS 100/107/202/305/410 excluded. No TCC basement asserted. Room-number prefix sets floor; all boundaries inferred. Forum receives a larger inferred event-room volume. Unverified reconstruction retained only as an optional demo; drawing geometry has not been inspected or traced."
      },
      "entranceEvidence": {},
      "voids": []
    },
    {
      "level": 4,
      "name": "Floor 4 \u2014 Forum suite only",
      "planScope": "partial",
      "slabs": [
        [
          495.25,
          620.5,
          736.25,
          795.0
        ],
        [
          488.75,
          795.0,
          736.25,
          822.0
        ],
        [
          487.75,
          822.0,
          706.25,
          864.0
        ]
      ],
      "rooms": [
        [
          "450",
          "The Forum \u2014 main floor",
          "o",
          [
            536.75,
            693.0,
            695.25,
            795.0
          ],
          "S"
        ],
        [
          "",
          "Forum upper platform",
          "o",
          [
            495.25,
            620.5,
            736.25,
            648.0
          ],
          "S"
        ],
        [
          "",
          "Forum platform center",
          "o",
          [
            512.25,
            648.0,
            720.25,
            653.0
          ],
          "S"
        ],
        [
          "",
          "Forum cross aisle",
          "o",
          [
            495.25,
            653.0,
            736.25,
            693.0
          ],
          "S"
        ],
        [
          "",
          "Forum west platform",
          "o",
          [
            495.25,
            693.0,
            536.75,
            764.5
          ],
          "S"
        ],
        [
          "",
          "Forum east platform",
          "o",
          [
            695.25,
            693.0,
            736.25,
            764.5
          ],
          "S"
        ],
        [
          "",
          "Forum southwest landing",
          "o",
          [
            495.25,
            769.0,
            536.75,
            795.0
          ],
          "S"
        ],
        [
          "",
          "Forum southeast landing",
          "o",
          [
            695.25,
            769.0,
            736.25,
            795.0
          ],
          "S"
        ],
        [
          "",
          "Forum northwest local steps",
          "s:FORUM-NW",
          [
            495.25,
            648.0,
            512.25,
            653.0
          ],
          "S"
        ],
        [
          "",
          "Forum northeast local steps",
          "s:FORUM-NE",
          [
            720.25,
            648.0,
            736.25,
            653.0
          ],
          "S"
        ],
        [
          "",
          "Forum southwest local steps",
          "s:FORUM-SW",
          [
            495.25,
            764.5,
            536.75,
            769.0
          ],
          "S"
        ],
        [
          "",
          "Forum southeast local steps",
          "s:FORUM-SE",
          [
            695.25,
            764.5,
            736.25,
            769.0
          ],
          "S"
        ],
        [
          "450A",
          "Forum storage",
          "r",
          [
            707.75,
            798.5,
            736.25,
            819.0
          ],
          "S"
        ],
        [
          "450B",
          "Forum storage",
          "r",
          [
            518.25,
            798.0,
            669.75,
            822.0
          ],
          "S"
        ],
        [
          "489",
          "Electrical \u2014 nonpublic",
          "b",
          [
            519.25,
            824.0,
            576.25,
            862.0
          ],
          "S"
        ],
        [
          "489A",
          "Telecom \u2014 nonpublic",
          "b",
          [
            577.25,
            824.0,
            623.25,
            862.0
          ],
          "S"
        ],
        [
          "P1",
          "Elevator P1 \u2014 connection inferred",
          "e:E",
          [
            626.25,
            824.0,
            663.75,
            862.0
          ],
          "S"
        ],
        [
          "441",
          "Hall \u2014 visible portion only",
          "o",
          [
            669.75,
            822.0,
            706.25,
            864.0
          ],
          "S"
        ],
        [
          "",
          "Forum west entry landing",
          "o",
          [
            488.75,
            795.0,
            517.75,
            822.0
          ],
          "S"
        ],
        [
          "",
          "Forum east entry landing",
          "o",
          [
            670.25,
            795.0,
            707.75,
            822.0
          ],
          "S"
        ],
        [
          "",
          "Service passage \u2014 visible portion",
          "o",
          [
            487.75,
            824.0,
            517.75,
            864.0
          ],
          "S"
        ]
      ],
      "records": [
        {
          "id": "TCC-450",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf",
              "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/room450/"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Room identity comes from visible title TCC MEETING ROOM 450, not the filename150. Number450 applies to the union of Forum regions. USC publishes40\u00d753ft and2120sqft for the complete room; not assigned to this smaller subregion. Virtual portal at open subdivision is inferred."
          },
          "door": [
            684.75,
            795.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-FORUM-NORTH",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Open subdivision; no enclosing wall inferred at its inner edge."
          },
          "door": [
            616.25,
            648.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-FORUM-NORTH-LINK",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Open subdivision between local step runs; exact accessible passage is unverified."
          },
          "door": [
            616.25,
            653.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-FORUM-CROSS",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Open subdivision; route centerlines within the room are inferred."
          },
          "door": [
            616.25,
            693.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-FORUM-WEST",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Open subdivision; platform elevation omitted."
          },
          "door": [
            536.75,
            729.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-FORUM-EAST",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Open subdivision; platform elevation omitted."
          },
          "door": [
            695.25,
            729.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-FORUM-SW",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Open subdivision below drawn UP run."
          },
          "door": [
            515.75,
            795.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-FORUM-SE",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Open subdivision below drawn UP run."
          },
          "door": [
            715.75,
            795.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-FORUM-STEP-NW",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. UP symbol and step run drawn. Local room level change only; not a stair connection to another floor. Rise count and heights unavailable.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            512.25,
            650.5
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-FORUM-STEP-NE",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. UP symbol and step run drawn. Local room level change only; not a stair connection to another floor. Rise count and heights unavailable.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            720.25,
            650.5
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-FORUM-STEP-SW",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. UP symbol and step run drawn. Local room level change only; not a stair connection to another floor. Rise count and heights unavailable.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            536.75,
            766.75
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-FORUM-STEP-SE",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. UP symbol and step run drawn. Local room level change only; not a stair connection to another floor. Rise count and heights unavailable.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            695.25,
            766.75
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-450A",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. 450A and STORAGE are printed. Double door drawn on page-north edge. Door swing geometry simplified."
          },
          "door": [
            722.25,
            798.5
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-450B",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. 450B and STORAGE are printed. Door drawn on page-west edge. Door swing geometry simplified."
          },
          "door": [
            518.25,
            810.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-489",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. 489 and ELEC. are printed. Restricted support room, excluded from public routing.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            519.25,
            833.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-489A",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. 489A and TELECOM are printed. Door connects through Electrical489; no fictitious public corridor is inserted between the rooms.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            577.25,
            833.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-EL",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. ELEV.P1 is printed. Preserves old stable elevator ID. Assignment to lower-floor coreE is inferred solely to retain demo connectivity; service range, public access and accessibility unverified.",
            "accessibilityStatus": "inferred"
          },
          "door": [
            663.75,
            843.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-441",
          "evidence": {
            "numberStatus": "confirmed",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. 441 and HALL are printed. Drawing crops the rest of the hall; page-east and page-south clipping boundaries are inferred, not walls."
          },
          "door": [
            685.25,
            822.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-FORUM-ENTRY-W",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Open portion of drawn Forum entry. Door from page-west service passage is shown at the lower edge; exit classification not asserted."
          },
          "door": [
            502.25,
            822.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-FORUM-ENTRY-E",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Drawn doorway connects to Hall441. Entry landing is an open subdivision of450; not an additional numbered room."
          },
          "door": [
            685.25,
            822.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        },
        {
          "id": "TCC-4-SERVICE-PASSAGE",
          "evidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "inferred",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Unnumbered passage visible outside electrical room. Page-south endpoint is clipped and not a building entrance or verified exit."
          },
          "door": [
            502.25,
            824.0
          ],
          "doorEvidence": {
            "numberStatus": "not applicable",
            "positionStatus": "inferred",
            "identityStatus": "confirmed",
            "sources": [
              "TCCRM150_1.pdf, page 1, revision 03/30/18",
              "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
            ],
            "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. Opening or open-region portal read relative to source drawing; normalized midpoint and navigation linkage inferred."
          }
        }
      ],
      "walks": [
        [
          [
            502.25,
            847.5
          ],
          [
            502.25,
            833.0
          ],
          [
            502.25,
            824.0
          ],
          [
            502.25,
            822.0
          ],
          [
            502.25,
            810.0
          ],
          [
            502.25,
            795.0
          ],
          [
            515.75,
            795.0
          ],
          [
            536.75,
            795.0
          ],
          [
            616.25,
            795.0
          ],
          [
            684.75,
            795.0
          ],
          [
            695.25,
            795.0
          ],
          [
            715.75,
            795.0
          ],
          [
            722.25,
            795.0
          ],
          [
            722.25,
            798.5
          ]
        ],
        [
          [
            663.75,
            843.0
          ],
          [
            685.25,
            843.0
          ],
          [
            685.25,
            822.0
          ],
          [
            684.75,
            822.0
          ],
          [
            684.75,
            795.0
          ]
        ],
        [
          [
            502.25,
            810.0
          ],
          [
            518.25,
            810.0
          ]
        ],
        [
          [
            616.25,
            795.0
          ],
          [
            616.25,
            693.0
          ],
          [
            616.25,
            653.0
          ],
          [
            616.25,
            650.5
          ],
          [
            616.25,
            648.0
          ]
        ],
        [
          [
            616.25,
            729.0
          ],
          [
            536.75,
            729.0
          ]
        ],
        [
          [
            616.25,
            729.0
          ],
          [
            695.25,
            729.0
          ]
        ],
        [
          [
            536.75,
            795.0
          ],
          [
            536.75,
            766.75
          ]
        ],
        [
          [
            695.25,
            795.0
          ],
          [
            695.25,
            766.75
          ]
        ],
        [
          [
            616.25,
            650.5
          ],
          [
            512.25,
            650.5
          ]
        ],
        [
          [
            616.25,
            650.5
          ],
          [
            720.25,
            650.5
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
          "TCCRM150_1.pdf, page 1, revision 03/30/18",
          "https://fpm.usc.edu/wp-content/uploads/2021/10/TCCRM150_1.pdf"
        ],
        "notes": "Relative boundaries traced from the supplied 2018 drawing. Position inferred in the building: suite registration to lower floors, absolute scale, wall thickness and rectangular simplification are inferred. Directional labels refer to the drawing page, not verified geographic bearings. This is only the Forum suite, not the complete fourth floor. The complete fourth-floor perimeter, offices421/425, rooms432\u2013434, restrooms and floor-to-floor stairs are outside the drawing and are not modeled here. Local Forum steps do not connect floors. Corridor paths and elevator continuation are inferred."
      }
    }
  ],
  "geometryStatus": "partial",
  "geometryNotes": "Only the fourth-floor Forum450 suite has been traced from the supplied PDF. Floors1\u20133 remain inferred. The suite uses source-relative proportions; registration, scale and routes remain inferred. Full fourth-floor rooms outside the source are retained in the unplaced evidence inventory."
}
