> Repository migration applied: see [current ownership](docs/ownership.md), [API status](docs/api.md), and [migration](docs/migration.md). This earlier handoff is background; those documents and the agreed OpenAPI resolve scope/path differences.

# Trojan Compass — website backend handoff

Prepared November 14, 2026 from the repository. Companion:
[Swift mobile app handoff](handoff-mobile.md).

## Objective and scope

Connect the existing website to real building data, place search, route calculation,
Compass chat, and eventually events. Preserve its current map and UI interactions.
This document describes implementation work; it does not claim those services exist.
The Swift mobile app will use a different backend and campus map. Coordinate domain
concepts with that team, but do not assume shared hosting, endpoints, or map coordinates.

## Current state

| Area | Implemented today | Missing backend work |
| --- | --- | --- |
| API | Express app, JSON body limit of 1 MB, `GET /api/health`, fallback 404 | All feature routers/services and centralized error handling |
| Campus directory | Static campus site, `locations.json`, building/parking layers, footprint selection | Authoritative directory refresh and production hosting configuration |
| Interiors | Local geometry, rooms, entrances, amenities, floors | Validated/versioned data delivery and real coverage |
| Search | Client-side building/room autocomplete and lookup | Search/resolution service and frontend integration |
| Directions | Editable endpoints and map picking; submit displays a preview notice | Structured endpoint submission, route service, response integration |
| Routes | Local graph engine renders routes from saved links | Verified indoor/outdoor graph, accessibility enforcement, asynchronous link resolution |
| Compass | Canned replies in a functioning conversation UI | AI adapter, grounded place resolution, request/error handling |
| Events | Sample records; feature scaffold | Valid event data, feed, and a connected events UI |
| Persistence | No database, accounts, or stored conversations | Decide only what the first release needs |

The active UI is in `web/src/components`, not the placeholder components under
`web/src/features`. `/map` and `/events` currently re-export the main page.
The top-level `data/buildings` and `data/events` directories contain instructions,
not populated production datasets.

## Run and deployment context

From the repository root:

```sh
npm install
npm run dev:demo
npm run dev:api
```

Run the last two commands in separate terminals. Campus is on port 3001, interiors
on 3000, and API on 4000. `npm run dev` runs web/API only. The campus development
server uses Python; Node >=22.9 is declared by the workspace.

- API configuration: [env.ts](server/src/config/env.ts), `PORT=4000`,
  `HOST=127.0.0.1`; [example](server/.env.example).
- Web proxy: [next.config.ts](web/next.config.ts) rewrites `/api/*` to
  `${API_BASE_URL}/api/*`; default `http://127.0.0.1:4000`.
- Put server-only settings in the API environment. Never expose provider credentials
  through browser code or `NEXT_PUBLIC_` variables.
- Replace hardcoded localhost navigation between the campus and interior sites for
  deployment. See `Wayfinder.tsx` and `demos/usc-map/map-data.js`.
- Bind the API appropriately for the deployment environment; the default loopback
  host will not expose it across containers. Keep the API behind the intended proxy.
- `npm run build` checks shared types and builds API/web. The shared package exports
  types only; use type imports. Build/start scripts do not provision data or a database.

## Data ownership and migration

Start by extracting and validating the existing demo data without changing IDs.
Versioned repository JSON is sufficient for a first read-only integration; introduce
a database when editable/live data requires it. Mark imported fixtures as demo data.
Do not make the API depend on frontend component imports.

| Source | Contents and constraints |
| --- | --- |
| [campus.ts](web/src/features/map/data/generated/campus.ts) | Nine supported building codes, schematic positions, sample events |
| [floorplan.ts](web/src/features/map/data/generated/floorplan.ts) | Generated layouts, place IDs, entrances, room resolution, graph connections |
| [law.ts](web/src/features/map/data/generated/law.ts) | Traced LAW plan; explicit east ramp entrance |
| [locations.json](demos/usc-map/locations.json) | Campus directory and geographic location data |
| [building data plan](data/buildings/README.md) | Planned building/places/graph JSON organization |
| [event data plan](data/events/README.md) | Planned events dataset |

Supported interiors: DML, LVL, THH, VKC, TCC, SGM, SAL, KAP, LAW. Most layouts are
generated; LAW is traced. Neither routing nor accessibility data is verified campus
guidance. Preserve the Medicine Crow-to-VKC alias used by the campus directory.

Validate stable building/floor/place/node IDs, geometry bounds, graph references,
nonnegative distances, floor membership, and connections between floors. Keep
entrance, exit-only door, step-free entrance, and ramp as distinct attributes.
Do not infer a ramp from `stepFree: true`. Record source, verification status, and
dataset version so unknown or stale accessibility data is distinguishable.

### Coordinate mismatch to resolve before routing integration

The viewer uses local X/Z horizontal geometry and Y vertical, with floor spacing
of 3.4 scene units. Basement is numeric `0`, displayed as `B`. Horizontal distance
estimates use 2.4 metres per scene unit for LAW and 2 for generated buildings.
The schematic 3D campus and geographic campus directory use other frames.

Shared `Position3D` instead describes metres. Choose a canonical coordinate system
and provide explicit transforms/units to the renderer. Do not reinterpret existing
scene units as metres. Geometry, route points, floor elevations, and selected
positions must all carry compatible dataset versions. Outdoor routes need geographic
coordinates and a deliberate transition at each building entrance.

## Proposed API surface

Only the health endpoint below exists. The other endpoints are a proposed contract
based on [docs/api.md](docs/api.md), with additions needed by the current UI. Finalize
schemas with the frontend before implementation and update that API document.

| Method/path | Purpose and response requirements |
| --- | --- |
| `GET /api/health` | Existing `{ "status": "ok", "service": "trojan-compass-api" }` |
| `GET /api/buildings` | Directory, aliases, supported-interior status, data versions |
| `GET /api/buildings/:buildingId` | Metadata, available floors, coordinate transform, geometry/model references |
| `GET /api/buildings/:buildingId/floors/:floorId` | Proposed addition: renderable floor geometry, rooms, entrances, amenities |
| `GET /api/buildings/:buildingId/places?q=&kind=` | Building-scoped place lookup |
| `GET /api/places?q=&stepFree=&limit=` | Proposed addition: cross-building autocomplete and ranked matches |
| `POST /api/routes` | Resolve endpoints and return route geometry, steps, metrics, constraint result |
| `GET /api/events` | Events with valid destinations and timezone-bearing timestamps |
| `POST /api/chat` | Compass reply with optional resolved navigation intent or clarification |

Return stable IDs and display labels separately. Bound query lengths, result counts,
chat history, and request bodies. Validate query/path/body values at the endpoint;
TypeScript interfaces are not runtime validation. Unknown identifiers, no search
matches, and no route are distinct outcomes.

Suggested error shape (new, not implemented):

```json
{ "error": { "code": "NO_ROUTE", "message": "No step-free route is available.", "requestId": "request-id" } }
```

Agree consistent HTTP semantics: malformed input 400, unknown resource 404,
valid-but-unroutable request 422, throttling 429, unavailable dependency 503.
An empty search may return 200 with an empty list. Register an error handler for
invalid JSON and oversized bodies as well as application errors. Do not expose
provider credentials, stack traces, or internal prompts in responses.

### Route request and response gaps

The existing shared request accepts only `originNodeId`, `destinationPlaceId`, and
`stepFree`. It cannot represent all current map selections. Expand the agreed
contract before wiring the form. A proposed request shape is:

```json
{
  "origin": { "kind": "place", "placeId": "LAW-101" },
  "destination": {
    "kind": "position", "buildingId": "LAW", "floorId": "1",
    "position": { "x": 1.2, "y": 0, "z": 3.4 }
  },
  "mode": "elevator",
  "stepFree": true,
  "dataVersion": "agreed-dataset-version"
}
```

Coordinates above illustrate the shape, not a valid destination. Specify their
units/frame before accepting this payload. Both endpoints must support known
places and valid indoor positions. Resolve an outside choice to an explicit
building entrance; ambiguous “outside” requires clarification.

Return normalized endpoints, indoor/outdoor legs, floor/building context, ordered
points, steps, total distance/time, and stair/elevator usage. Match the active
renderer’s needs in [routing.ts](web/src/features/routing/legacy/routing.generated.ts), or add an explicit
adapter. Shared `RouteResult` currently lacks this full geometry and step context.

For point endpoints, snap only to a valid reachable graph segment within an agreed
tolerance; do not route through walls by choosing an arbitrary nearest node. Reject
blocked/outside positions and mismatched building/floor/data versions.

## Feature implementation notes

### Search and place resolution

Normalize case, spaces, and hyphens (`LAW 101`, `LAW-101`), recognize building names
and aliases, and favor prefix matches. Return useful floor/name detail with each
suggestion. Preserve no-match behavior and selected-room highlighting. Search must
not dismiss its panel. Accessibility-filtered suggestions require actual reachable
step-free paths, not just an elevator flag on the building.

### Routing

Reuse the local graph engine’s behavior as a demo reference, not verified routing
data. It supports `fastest`, `stairs`, and `elevator`, indoor legs, and saved-link
routes. The form initially selects Stairs; enabling Accessibility selects Elevators
and disables Stairs. Layer visibility does not alter routing preferences.

Enforce one-way edges, connected floors/cores, entrance restrictions, and requested
step-free constraints throughout the journey. Unknown accessibility is not verified
accessibility. Never silently fall back to stairs for a step-free request. Handle
same-origin/destination as arrival. Return clear disconnected/no-route results.

The existing outdoor leg is a schematic path through a fixed corridor with a
hardcoded step-free description. Replace it with real outdoor topology before
claiming navigation accuracy. Emergency-exit markers alone are not an evacuation
route service.

### Compass

Implement the server-only provider adapter in `server/src/integrations/ai/provider-adapter.ts`.
Keep the assistant name Compass. Resolve intent to known buildings/places/events;
ask a clarification when ambiguous. Validate any model-produced identifiers and
call the routing service for paths. The model must not invent room coordinates,
accessibility status, or route geometry.

Support bounded message history, timeouts, cancellation where supported, and useful
provider failure responses. Add request limits before exposing a billable provider.
Do not persist chats or precise locations by default. No image-upload flow exists;
define file validation, limits, storage, and lifecycle separately if later requested.

### Events

Start with validated fixtures linked to real place IDs; add an authorized event
source later. The current sample events have display-time strings and a `class`
kind, while shared events use timestamp strings and `club/general/exam`. Reconcile
these deliberately; do not invent dates while converting display-only times.
Define timezone, start/end times, canceled events, and invalid-location behavior.
The current website still needs an actual events flow wired to the service.

## Frontend integration points

| File | Required integration |
| --- | --- |
| [Wayfinder.tsx](web/src/features/map/components/Wayfinder.tsx) | Load data; own resolved endpoints/route state; preserve selection/navigation |
| [FloorTools.tsx](web/src/features/map/components/FloorTools.tsx) | Replace Directions notice and canned chat; pass mode/accessibility to the request |
| [LocationAutocomplete.tsx](web/src/features/search/components/LocationAutocomplete.tsx) | Async suggestions with loading/no-match/error states; discard stale responses |
| [map-location.ts](web/src/features/map/map-location.ts) | Resolve typed/picked endpoints consistently with server data |
| [map-link.ts](web/src/features/map/map-link.ts) | Replace synchronous local route creation with validated async link resolution |
| [BuildingScene.tsx](web/src/features/map/renderer/BuildingScene.tsx) | Consume matching geometry/amenity/route data without losing highlights |
| [MapOverlays.tsx](web/src/features/map/components/MapOverlays.tsx) | Preserve floors, route steps, and current layer order |

Today a picked destination is reduced to display text; only the current marker
retains its coordinates. Store structured values for both endpoints before routing.
Keep draft text separate from resolved selections. Cancel/discard outdated requests
when inputs change; a late response must not overwrite a newer selected destination.
Preserve draft input and committed locations on request failure.

Keep current UI details: search stays open; rooms/entrances/open areas are selectable;
Wheelchair ramps sits above blue Elevators; Accessible paths is absent from the menu.
The blobby Trojan guide, camera motion, floor visibility, and nape-drag animation
remain client-side. They need static asset delivery, not animation endpoints or
per-frame network updates. Cache/version assets when replacing them.

## Delivery order and validation

1. Agree IDs, coordinate transforms, endpoint variants, response/error schemas,
   and accessibility semantics. Update shared contracts and API documentation.
2. Implement validated data loading from explicit paths independent of working
   directory. Serve one building plus search; integrate LAW without breaking the UI.
3. Add route computation and structured endpoint submission; connect saved links,
   route rendering, steps, and cross-building transitions.
4. Add Compass using the same trusted search/routing services.
5. Populate remaining interiors and add events when its data/UI are ready.
6. Configure production origins, static data delivery, request limits, observability,
   and data-refresh/version behavior. Add persistence only for agreed needs.

Acceptance checks for implementation:

- [ ] Startup and packaged build locate/validate datasets correctly.
- [ ] Unknown buildings/floors/places return clear errors without substituting data.
- [ ] Room aliases, cross-building suggestions, and empty searches behave correctly.
- [ ] Position endpoints preserve identity and reject invalid geometry/version inputs.
- [ ] Same-place, same-floor, cross-floor, cross-building, and disconnected routes work.
- [ ] Step-free requests exclude stairs and unknown/inaccessible required segments.
- [ ] Ramp data is explicit; entrance and exit restrictions are respected.
- [ ] Response geometry aligns with rendered floors and route-step navigation.
- [ ] Invalid JSON, excessive input, provider timeout, and throttling return consistent errors.
- [ ] Compass resolves known IDs and asks for clarification instead of fabricating places.
- [ ] Events reference valid destinations and carry actual timestamps/timezones.
- [ ] Stale responses and failed requests do not corrupt current frontend selections.
- [ ] Existing search, picking, layers, camera, and guide interaction checks still pass.

Existing checks: `npm test`, `npm run typecheck`, `npm run build`. Existing web tests
cover routing, room search, location picking, links, camera framing, floor selection,
and guide motion/assets. **There is currently no API test script.** Add endpoint and
service tests as those implementations land; a passing web suite does not validate
new backend behavior.

Open decisions: authoritative campus/floor data source, accessibility verification
owner, outdoor routing source, AI provider, deployment platform, retention policy,
and whether editable content requires a database/admin workflow. No account system
or admin UI is required by current website parity.

This handoff is based on source inspection. It does not verify live service access,
real campus route accuracy, deployment readiness, or newly implemented API behavior.
