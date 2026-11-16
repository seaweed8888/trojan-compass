# Repository migration

The directory migration is already committed. Existing startup fixes, renderer assets and package names are preserved.

| Original                                          | Final                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| apps/web/                                         | web/                                                                                 |
| apps/api/                                         | server/                                                                              |
| packages/shared/                                  | shared/typescript/                                                                   |
| apps/campus-demo/                                 | demos/usc-map/                                                                       |
| Web building/floorplan source data                | server/src/infrastructure/datasets/prototype/, extracted into server/data/snapshots/ |
| Web search/pathfinding algorithms                 | server/src/modules/search/prototype/, server/src/modules/routing/prototype/          |
| Renderer, camera, map picking and guide animation | web/src/features/map/                                                                |
| API client scaffold                               | Implemented web/src/lib/api-client.ts                                                |
| AI adapter scaffold                               | Implemented server/src/integrations/ai/provider-adapter.ts                           |
| Shared API agreement                              | shared/contracts/openapi.yaml                                                        |

The web no longer imports generated prototype datasets, local search ranking or local pathfinding. Compatibility copies, their sync script and the manifest have been removed after the API-backed scene/search/route/chat flow was exercised. Prototype modules remain server-side for reproducibility and regression tests. Tests distinguish old illustrative behavior from the canonical API's stricter access rules.

The viewer now adapts API floor geometry and places into presentation state. Existing scene components, controls, labels, guide assets and saved room links remain. Saved routes are recalculated by the backend; unsupported outdoor routes return an explicit error instead of recreating the old schematic connector.

The only remaining local overview geometry is schematic campus decoration, which is never used for indoor meters or backend path calculation. The separate saved USC map demo remains optional.

The building-model migration includes the old repository's nested `data/interiors/` directory. Its eight reconstructed buildings now live in `server/src/infrastructure/datasets/prototype/interiors/`, alongside the traced `law.ts` and shared `floorplan.ts` loader. `usc-interiors-2026-11-14` is the active runtime snapshot; the initial snapshot is retained. Campus footprints and floor counts are exported into `web/src/features/map/data/campus-models.json`, and the viewer keeps using API geometry. Authoring scripts and evidence moved to `scripts/` and `docs/interiors/`. See the [interior data guide](interiors/README.md). The `trojan-compass-old/` copy is reference material and is not a runtime dependency.

No files were generated solely to fill a proposed tree. Empty feature controllers and redundant dataset-service scaffolds were removed; dataset reads live in the repository and feature HTTP modules provide their actual boundaries.

Root workspaces, npm package identities, relative TypeScript paths and the Next.js API rewrite use the final layout. Deployment must include snapshots and OpenAPI alongside compiled server files. Mobile stays outside npm.
