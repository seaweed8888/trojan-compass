# Team ownership

The top-level directory migration is complete. Use these paths when updating parallel branches; do not repeat the rename.

| Owner               | Area                                                       | Location                                              |
| ------------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| Teammate            | Canonical datasets, provenance and snapshot repository     | server/data/, server/src/infrastructure/datasets/     |
| Teammate            | Building/floor/place reads and scene delivery              | modules/buildings/, modules/places/, modules/scenes/  |
| Teammate            | Geometry, calibration, source topology and object bindings | Versioned snapshot geometry/ and navigation/          |
| Teammate            | Web renderer, picking, camera and highlights               | web/src/features/map/                                 |
| Eddie               | Search, normalization, ranking and ambiguity resolution    | server/src/modules/search/                            |
| Eddie               | Graph construction, validation, routing and instructions   | server/src/modules/routing/                           |
| Eddie               | Chat and AI provider integration                           | server/src/modules/chat/, server/src/integrations/ai/ |
| Eddie               | Server composition, validation and errors                  | server/src/app.ts, bootstrap/, middleware/            |
| Mobile developer    | Swift project, device integration and viewer choices       | mobile/                                               |
| Affected developers | Wire contract, fixtures and internal interfaces            | shared/, server/src/ports/                            |

The current implementation uses DatasetPort, SearchPort, RoutingPort and ChatPort. DatasetPort now includes floor geometry; NavigationSource explicitly includes walkable source segments, barriers and vertical connector cores. HTTP fields remain unchanged.

Building listing delegates matching to Eddie over teammate records. Building-scoped place text queries use the same search service as global autocomplete. Dataset reads do not depend on search or routing.

Source navigation files belong to the data/rendering teammate. Eddie derives graph adjacency and caches it by building and dataVersion. No generated routing graph is written into canonical source directories.

The initial extraction and embedded mobile client are integration implementations that owners can improve behind these seams. Coordinate shared contract, calibration, snapshot and root lockfile changes. Keep PRs focused on one usable boundary, with the other affected owner reviewing shared semantics.
