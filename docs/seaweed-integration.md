# Seaweed UI and functionality integration

Source: [`seaweed8888/trojan-compass`](https://github.com/seaweed8888/trojan-compass/tree/c04a38a332bcdd89cc0d8c5d0624c628a1750b07), commit `c04a38a332bcdd89cc0d8c5d0624c628a1750b07`.

Original destination baseline: `astroluxeon/trojan-compass` main at `e9c13103876a7efbdd6549940b64c9c436105283`. The conflict resolution merges current main `4a2b301`, including the completed Swift app integration from PR #1. The source checkout is read-only. This integration follows [architecture.md](architecture.md) and preserves the destination's existing shared API, published building models, and request ownership.

## Feature reconciliation

| Source feature | Destination owner | Result |
| --- | --- | --- |
| USC branding, fonts, application shell, tool sidebar | `web/src/app/`, `web/src/components/layout/`, `web/src/features/map/components/` | Already present; retained without another shell or stylesheet copy. |
| Saved USC campus map, categories, search, building-to-interior links | `demos/usc-map/` | UI and assets already present. Retained the destination's DMC-to-VKC alias. |
| Building/floor rendering, orbit/pan/zoom, picking, highlights, floor and layer controls | `web/src/features/map/` | Retained the API-backed renderer and canonical meter coordinates. |
| Zoom-dependent room labels | `web/src/features/map/camera.ts`, `renderer/MapCanvas.tsx`, `renderer/BuildingScene.tsx` | Reused main?s merged hysteresis and expanded regression coverage across multiple zoom limits. Main?s selected/highlighted label policy is retained. |
| Stair glyphs | `web/src/features/map/renderer/StairsIcon.tsx` | One shared glyph now serves staircase badges, layers and travel preferences; walking retains its own icon. |
| Updated Trojan guide and carry interaction | `web/src/features/map/renderer/TommyTrojan*.tsx`, `web/public/models/` | Ported updated sculpt/rig, skeleton-safe cloning, drag threshold and guide-first hit testing through ghost floors. Preserved canonical scale/elevation. |
| Three guide dances | Same renderer and asset locations | Ported lazy-loaded clips and double-click/D-key activation. Asset failure remains retryable. |
| Guide asset generation | `scripts/build-tommy.py`, `scripts/retarget-dances.mjs`, `scripts/assets/` | Migrated source tooling to `web/public/models/`; retained provenance and external input requirements. |
| Search and autocomplete | `web/src/features/search/`, `server/src/modules/search/` | Existing canonical service replaces the source's local prototype lookup; no duplicate ranking or browser dataset. |
| Directions, origin/destination picking, stairs/elevator preferences, steps | `web/src/features/routing/`, `server/src/modules/routing/` | Existing API-backed planner and route display retained. Source's “coming soon” handler and local schematic pathfinder were not reintroduced. |
| Chat panel and map actions | `web/src/features/chat/`, `server/src/modules/chat/` | Existing real service boundary retained in place of source canned responses. External AI still requires server configuration. |
| Building records, scene geometry and navigation | `server/data/snapshots/`, `server/src/infrastructure/datasets/` | Preserved newer destination publications and authored models; no old prototype dataset copied into the client. |
| Swift client | `mobile/` | Preserved the merged Swift application and its API-backed bundled viewer, mobile controls and native transport. Both embedded viewers are rebuilt from the resolved source. |

The source's `apps/web`, `apps/api`, and `packages/shared` directories are not added to the destination. Existing top-level `web/`, `server/`, `shared/`, `mobile/`, `demos/`, and `scripts/` remain authoritative. Source localhost-only campus redirects are not restored over the destination's deployment-safe navigation. The existing route instructions remain the one active directions interface; the source's floating route summary is not mounted as a duplicate.

## Validation and inherited limitations

The port includes the source's model and dance deformation checks and camera label-visibility regression coverage. All four mascot checks and four camera checks pass. Workspace typechecks and all 50 contract fixtures pass. The retained campus demo now includes the 12 tests merged with PR #1. The full web suite passes 31 of 32 tests; the shared legacy routing assertion described below is its only failure.

The original port?s browser verification exercised LAW 101 to LAW 107 through the existing API, returned eight route steps, drew the route and gold destination, and confirmed the restored stair controls and guide dance activation. The browser reported no errors. The production build and smoke check passed, including the page, Next assets, mascot assets, API proxy, scene/search/highlight mapping, routing, and fixture-driven chat without a live AI provider.

Before changing any backend or dataset files, the destination baseline produced seven backend test failures: two prototype floor-ID contract failures (`canonical-search` and `preview-routing`), four reconstructed-interior checks (building count, DML Holocaust-room door connectivity, LVL connector alignment and snapshot reachability), and one legacy demo routing mode assertion. These failures predate this port; server code and published datasets are unchanged by it.

That same legacy routing-mode assertion also runs in the web test suite and fails against the unchanged prototype data. The backend suite passes 71 of 78 tests. The new presentation/model tests and the canonical API-backed viewer, route and chat tests pass; this port does not present the full inherited suite as green.

The destination also contains authored building changes that are not yet included in its active `usc-interiors-2026-11-14` publication. This port does not regenerate or overwrite immutable publications. Existing constraints on unverified accessibility, missing outdoor routing topology, disabled events/image input, and server-configured AI remain as documented in the [README](../README.md) and [integration review](integration-review.md).

## Conflict resolution against the merged Swift app

Most renderer and asset changes from this port are already on main through PR #1. The resolution keeps those implementations once: main?s mobile-capable overlays, canonical-unit renderer, guide interaction/model, API-backed search/routing/chat, gold paths, and source/bundle verification remain intact. It retains the port?s shared stair glyph in the travel preference controls, stronger zoom-hysteresis regression coverage, portable dance-generation instructions, model provenance corrections and this integration mapping.

The identical camera visibility helper and dance tests are not duplicated. Both checked-in mobile bundles are regenerated to match the shared source. No server, dataset, shared-contract or Swift source changes are needed for this resolution.

Resolution verification: workspace and embedded-viewer TypeScript checks, all 50 contract fixtures, both mobile asset builds, source/bundle checks, three transport tests, production build and LAW smoke passed. The smoke used an isolated API port to leave an existing development server running. Campus tests passed 12/12; web passed 31/32; server passed 70/78 on Windows, including the same seven data/prototype failures and the Windows symlink-permission failure. No new regression failure was introduced. Current native CI results are recorded on PR #3.
