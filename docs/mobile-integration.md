# Swift branch integration review

PR #1 merges the `swift-app` implementation with main
`e9c13103876a7efbdd6549940b64c9c436105283` using the agreed top-level layout.
The merge retains both histories. It does not deploy a backend or merge the PR.

## Final locations and ownership

```text
web/                         Next.js client, API-backed features and renderer
mobile/
  TrojanCompass.xcodeproj/    Shared iOS scheme and Debug/Release configuration
  Package.swift              macOS preview and Swift tests
  TrojanCompass/
    Core/                    Native state, shared-contract decoders and transport
    Views/                   Swift screens and WKWebView hosts
    Resources/               Generated web bundles, offline preview and fixtures
  Replica/                   Default app web packaging and HTTP bridge adapter
  Viewer/                    Optional native shell's embedded viewer
  Tests/                     Contract, state, transport and navigation checks
server/                      Shared Express backend and canonical datasets
shared/
  contracts/                 Authoritative OpenAPI agreement
  typescript/                Shared TypeScript contract types
  fixtures/                  Authoritative API examples
demos/usc-map/               Attributed campus map, phone gestures and vector UI
scripts/                    Repository and asset verification/build tooling
docs/                       Architecture and team agreements
```

The mobile developer owns Swift screens, device networking and packaging.
The teammate owns canonical datasets, scene geometry and web rendering.
Eddie owns search, routing, chat and server composition. Contract changes still
require agreement from affected developers; this integration changes no endpoint,
identifier, coordinate unit or response shape. See [ownership](ownership.md).

## Reconciled file mapping

| Swift branch location | Integrated location |
| --- | --- |
| `apps/web/src/components/Wayfinder.tsx` | `web/src/features/map/components/Wayfinder.tsx`; mobile presentation merged into current API-backed state |
| `apps/web/src/components/ui/FloorTools.tsx`, `MapOverlays.tsx` | `web/src/features/map/components/`; native-style toolbar and sheets retain live search, directions/instructions and chat |
| `apps/web/src/components/ui/LocationAutocomplete.tsx` | `web/src/features/search/components/LocationAutocomplete.tsx`; server matching retained |
| `apps/web/src/components/ui/FloorIcon.tsx` | `web/src/components/ui/FloorIcon.tsx` |
| `apps/web/src/components/map/*` | `web/src/features/map/renderer/*`; canonical meters and current routing overlays retained |
| `apps/web/src/lib/map-camera.ts` | `web/src/features/map/camera.ts`; zoom-limit label behavior retained |
| `apps/web/public/{models,images}/` | `web/public/{models,images}/`; updated rig, dances, branding and attribution retained |
| `apps/campus-demo/*` | `demos/usc-map/*`; vector map, geographic inputs, mobile gestures and tests retained |
| `mobile/Viewer/export-catalog.ts` reading browser prototypes | `mobile/Viewer/export-catalog.mjs` exporting the server snapshot |
| Duplicate mobile OpenAPI/index files | Removed; `shared/contracts/` and `shared/fixtures/` remain authoritative |
| Main's placeholder `CompassView.swift`, `ContractModels.swift` and old fixture checker | Replaced by the working branch app, `Core/CompassModels.swift` and `Tests/` |

No `apps/` or `packages/` directory is restored. npm package names stay unchanged.
`mobile/` is an Xcode/Swift Package project, outside npm workspaces.

## Configuration and behavior

Workspace and lockfile use `web`, `server`, `shared/typescript` and
`demos/usc-map`. Asset generators, TypeScript imports/configuration and
verification scripts use these locations. The lockfile was regenerated with npm.

The default iOS app bundles current web features. Its private local scheme serves
assets; a cancellable native URLSession bridge transports relative `/api/*`
requests to one configured backend. It preserves JSON, error envelopes and
versions. The old canned chat and unfinished Directions behavior are superseded
by main's API-backed flows. LAW open-space routes and gold paths remain intact.
The optional native shell keeps a labeled offline preview and cannot calculate
routes or generate chat replies from preview records. Its live viewer retains
vertical route legs and uses the shared floor-transition renderer.

Debug defaults to simulator `http://127.0.0.1:4000/api`. Device builds need a
reachable address. Release requires a configured HTTPS backend through
`COMPASS_API_BASE_URL`; no production URL is assumed. See [mobile setup](../mobile/README.md).

The unresolved product decisions are the production backend URL/signing identity
and the mobile developer's eventual choice of native versus embedded rendering.
They do not change the shared contract. No accounts, editing or non-USC scope is
introduced.

## Verification

Verified on Windows for this integration:

- Production web/server/shared build and workspace TypeScript checks passed.
- Embedded viewer TypeScript checks and both mobile asset builds passed.
- All 50 contract fixtures validated; bundled copies match shared examples.
- Mobile asset/provenance checks and three native-transport JavaScript tests passed.
- Campus tests: 12 passed. Web tests: 31 passed, one existing failure.
- Server tests: 70 passed, eight existing/environment failures.
- Production smoke passed: page, 14 Next assets, mascot assets, API proxy,
  scene/search/highlight mapping, routing and fixture-driven chat. The smoke
  interpreter is a fixture; no live AI provider was called.

A clean archive of the same main commit reproduces all nine failing test cases:
one web prototype-routing assertion; seven server cases covering prototype floor
IDs, stale building-count/door/connector expectations and prototype routes; and
one server symlink test blocked by Windows privileges. Server source/tests are
unchanged from main. These failures are recorded rather than masked or repaired
through unrelated edits to the teammate's building data.

The macOS CI job runs Swift tests, the full positive-fixture decoder, native state
checks and Debug/Release iOS Simulator builds. Windows cannot establish Swift or
Xcode compilation. CI results are recorded on the PR; real iPhone gestures,
VoiceOver, safe areas and networking remain an interactive acceptance step.
Historical pre-migration checks in `mobile/VALIDATION.md` do not validate this merge.
