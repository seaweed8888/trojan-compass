> Repository migration applied: see [current ownership](docs/ownership.md), [API status](docs/api.md), and [migration](docs/migration.md). This earlier handoff is background; those documents and the agreed OpenAPI resolve scope/path differences.

# Trojan Compass — Swift mobile app handoff

Prepared November 14, 2026 from the current website repository.

## Assignment

Build the mobile version of Trojan Compass in **Swift**. Preserve the website’s
functionality and visual identity, while adapting control placement and navigation
for a native mobile interface. The mobile app will use a **different backend and
campus map**. This is a behavior and integration handoff, not a requirement to port
the web stack or reproduce its desktop layout.

The app helps users find campus buildings and rooms, explore building interiors,
choose locations, get directions, and talk to **Compass**. The current location is
represented by a small, animated Trojan figure.

This document accompanies [the website backend handoff](handoff-backend.md). It includes the
capabilities the mobile backend must provide, without prescribing its framework,
database, endpoint URLs, or campus-map provider. No Swift app or new backend has
been implemented by this handoff.

## What is fixed and what can change

| Preserve | Mobile implementation can change |
| --- | --- |
| Search, Chat, Directions, floor selection, layers, room highlighting, location picking, and guide animation | Tabs, sheets, toolbars, drawers, menus, and their screen positions |
| Building/place identity and the meaning of routing preferences | Backend implementation, wire format, authentication mechanism if needed |
| Campus-to-interior navigation and return to campus | Campus map provider, map appearance, geographic data source |
| USC cardinal/gold styling, blue accessibility markers, clear labels | Native fonts, spacing, touch targets, transitions, adaptive layouts |
| Compass name and conversation behavior | AI provider and transport |
| A compact 3D figure with the current helmet and carrying motion | Native rendering framework and asset format |

Do not translate the React component tree into a native view tree mechanically.
Use Swift app state for navigation and selections, separate from the map renderer
and backend response models. The website’s local ports, CSS measurements, browser
DOM, and Three.js APIs are not mobile contracts.

## Current functionality versus unfinished work

“Same functionality” includes the implemented interactions below. It does not mean
the website already has working online routing, AI, or live campus data. Preserve
an explicit preview state until each replacement service is ready; do not show a
canned reply or generated route as a live result.

| Area | Website today | Mobile parity requirement |
| --- | --- | --- |
| Campus map | Local map replica, searchable directory, building footprints, Buildings/Parking layers, pan/zoom/reset, map-link sharing | Provide these user actions on the replacement campus map |
| Interior coverage | Nine supported buildings; LAW has a traced plan, others use generated layouts | Open supported interiors; give a clear unavailable state for other buildings |
| Interior viewer | Interactive 3D floors, labels, amenities, room selection, All floors view | Equivalent native exploration and selection |
| Search | Local building/room lookup and autocomplete | Same inputs and result behavior, backed by mobile data/services |
| Directions form | Editable endpoints, location picking, accessibility and stairs/elevator choices; submit shows a coming-soon notice | Preserve inputs and picking; connect real routing when available |
| Route display | Local route engine works for saved route links; draws legs and provides previous/next steps | Support route display and step navigation independently of form integration |
| Compass chat | Local conversation with canned responses | Preserve conversation UI; connect real chat when available |
| Events/classes | Sample records and scaffold components; no live feed or dedicated working events page | Retain as planned scope, not a claimed completed feature |
| Backend | Express serves only `GET /api/health`; feature modules are placeholders | Use the new backend; do not depend on unimplemented web endpoints |
| Accounts/GPS/uploads | No account system, actual location-service integration, or image-upload flow | Not prerequisites for parity; require a separate decision before adding |

## User journeys and behavior

### 1. Campus browsing

- Start on the campus map with no information panel or sidebar open by default.
- Allow users to search campus locations by building name or code, browse the
  directory, select a footprint/marker, pan, zoom, and reset the map.
- Offer Buildings and Parking visibility controls. Search results must remain
  usable even when labels overlap or a marker is difficult to touch.
- Open the selected building’s interior when available. Otherwise explain that
  the interior is unavailable; never substitute a different building.
- Provide a return-to-campus action from the interior and a way to share a map
  location/link using the mobile app’s chosen link scheme.
- The web demo’s extra categories, tours, Street View, and location-services
  controls mostly point to official resources or display notices. They are not
  existing integrations that need to be reverse-engineered.

Reference coverage: `DML`, `LVL`, `THH`, `VKC`, `TCC`, `SGM`, `SAL`, `KAP`, `LAW`.
The current directory maps the Medicine Crow name to the legacy interior code
`VKC`. Preserve aliases or provide an explicit migration when identifiers change.

### 2. Interior exploration

- Show the building name/code and active floor. Support individual floors,
  basement where available, and **All floors**.
- Render room boundaries and labels, restrooms, elevators, stairs, entrances,
  ramps, and emergency-exit markers when data exists.
- Allow orbit, pan, and zoom. Initially frame the building prominently with useful
  surrounding space; account for whatever screen area mobile controls occupy.
- Selecting a room highlights its floor area and walls in gold. Selection must
  remain visible even if the general Classrooms label layer is off.
- When a selected room is on the far side, rotate to reveal that side using the
  shorter turn. Do not rotate unnecessarily when the room already faces the user.
- Switching to another individual floor clears a stale selected room. All floors
  shows the floor stack; a search performed while in All floors retains that mode.
- Indicate which floor contains the selected current location. When that floor
  is hidden, show a location indicator that can return the user to it.

### 3. Search

- Accept a building code alone or building plus room, such as `LAW`, `LAW 101`,
  `LAW-101`, or `THH 201`. Normalize case and separator differences.
- Show autocomplete with a primary code/name and useful secondary information.
  The website returns up to eight suggestions and favors code-prefix matches.
- Selecting a suggestion fills the field; submitting search opens the building
  or selects/highlights the room. A failed search shows a useful no-match message.
- **Searching must not dismiss the active search UI.** Keep the user’s query and
  allow another search without reopening controls.
- A successful new search clears the displayed route and cancels pending map
  picking. It should not leave a previous route highlighted behind the new result.

### 4. Directions and endpoint picking

- Present labeled **Current location** and **Destination** fields, autocomplete,
  and a separate map-pick action for each field.
- Users can select rooms, entrances, or general open floor areas. Reject blocked
  geometry and locations outside valid floor geometry.
- For both endpoints retain a structured location, not just the displayed text:
  building, floor, position, optional place/node ID, and readable label.
- The current web implementation retains the current-location coordinates but
  reduces the destination selection to text. Correct that limitation in the mobile
  data flow before connecting routing; an open-area label is not a unique endpoint.
- Resolving a typed current building/room moves the guide to that location and
  reveals its building/floor. Editing it to unresolved text clears the old marker.
- Support “Outside the building” as an origin choice. The web suggestion exists,
  but route submission does not resolve it yet. Mobile must resolve it against a
  specified building entrance or ask which building; do not infer a GPS position.
- Selecting a map location fills the appropriate field and exits picking. Keep
  the directions UI accessible while giving the map enough space for selection.
- Allow floor changes during picking. Starting a pick from All floors switches
  to one active floor so the drop target is unambiguous.
- Invalid drops keep picking active; provide Cancel. Cancel must leave an already
  committed endpoint intact. End the gesture cleanly when the app is interrupted.
- Distinguish guide dragging from map panning. Suppress the release/tap that would
  otherwise select another room immediately after a drop.
- The website clears the current-location marker when Directions closes or the
  user switches tools, while preserving the destination text. Use that as the
  parity baseline; longer-lived endpoints are a separate product decision.
- Do not restore the removed “Where are you headed?” helper text.

### 5. Accessibility and routing preferences

- Keep **Accessibility** as a separate Directions preference, with the explanation
  “Step-free entrances and elevator access.” This is distinct from layer visibility.
- Turning it on selects Elevators and disables Stairs. Filter suggestions to
  places reachable through a step-free entrance and suitable connections.
- Turning it off re-enables Stairs; the website leaves Elevators selected until
  the user changes it. The initial Directions choice is Stairs.
- A stair/elevator preference alone is not proof of accessibility. The new route
  service must enforce the requested accessibility constraints across the whole
  journey, including entrances and outdoor segments.
- Unknown accessibility data must remain unknown. A step-free entrance does not
  necessarily have a wheelchair ramp; only show ramp markers for explicit ramp data.
- Return a clear no-route or accessibility-unavailable result instead of silently
  returning a route with stairs when a step-free journey was requested.

### 6. Route display

- Represent indoor and outdoor legs separately. Indoor points belong to a building
  and floor; outdoor points belong to the new campus map’s geographic frame.
- Show the path, start/end indicators, destination emphasis, and human-readable
  instructions. Previous/next controls must reveal the relevant building/floor.
- Support ending the route and opening a shared route. Equal origin/destination
  should produce an arrival state instead of an error or empty screen.
- The web engine recognizes `fastest`, `stairs`, and `elevator`; the current form
  exposes only the latter two. Preserve compatibility with existing route links
  when defining mobile link handling.
- The website’s outdoor path is a schematic line through a fixed campus corridor,
  with estimated distances. Do not port that line or its step-free claim as real
  outdoor navigation. Use the replacement map/backend’s verified route data.

### 7. Compass chat

- Call the assistant **Compass**. Display user and assistant messages separately,
  preserve multiline text, scroll new replies into view, and reject blank sends.
- Provide an explicit Send action and a multiline composer. With a hardware
  keyboard, Enter sends and Shift+Enter adds a line; respect text composition.
  Native software-keyboard behavior may differ if sending remains clear.
- Preserve conversation while moving between tools during the session. The web
  app does not persist conversations across reloads; account/history sync is not
  part of baseline parity.
- When connected, show sending, response, retry, and failure states. Do not append
  a fake success reply on an API error.
- Compass may resolve room/event questions to actual places and offer navigation.
  Validate returned identifiers before applying a map action. Route geometry and
  accessibility facts must come from trusted data, not invented assistant text.
- Image input is only a future scaffold idea. There is no current upload UI to port.

### 8. Interior map layers

Preserve these labels and relative order, regardless of the mobile menu’s location:

| Order | Layer | Default | Icon/marker treatment |
| --- | --- | --- | --- |
| 1 | Classrooms | On | Room labels; selected room remains visible |
| 2 | Men’s restrooms | On | Blue restroom symbol |
| 3 | Women’s restrooms | On | Blue restroom symbol |
| 4 | Wheelchair ramps | On | Wheelchair symbol, accessibility blue |
| 5 | Elevators | On | Up/down symbol, accessibility blue |
| 6 | Stairs | On | Neutral dark stair/walking symbol |
| 7 | Entrances | On | Green entrance symbol |
| 8 | Emergency exits | Off | Red exit symbol |

**Accessible paths is deliberately absent from the visible menu.** Do not add it
back as part of the port. Ramps, elevators, and entrances toggle independently.
The current explicit ramp record is LAW’s east ramp entrance. Additional markers
need corresponding data, not an assumption that every step-free doorway is a ramp.
Exit markers describe locations; they do not constitute an evacuation-routing feature.

## Trojan guide: appearance, animation, and assets

Use the current **blobby, faceless gold figure**, with no visible neck, thick arms
connected at the shoulders, a bronze Trojan helmet, and a cardinal crest. Do not
use the earlier detailed Tommy Trojan mascot-suit model.

The guide marks the manually chosen current location with “You are here.” It is
exaggerated for visibility, not a huge avatar covering the building. The web model
is approximately 2.4 model units tall and displayed at a nominal 4.1 metres after
the web scene’s scale conversion. Preserve perceived visibility on mobile rather
than copying the number into a different coordinate system.

During a carry, the grip is at the nape/back of the head. The head droops forward,
the body hangs beneath the grip, and limbs sway with lag. Releasing over a valid
location places the guide with a small settling motion. Let users pick up the
placed guide to reposition it. Provide tap-to-place as an alternative to dragging.

| Resource | Purpose |
| --- | --- |
| [tommy-trojan.glb](web/public/models/tommy-trojan.glb) | Current model; legacy filename retained |
| [tommy-trojan.png](web/public/models/tommy-trojan.png) | Appearance preview |
| [build-tommy.py](scripts/build-tommy.py) | Reproducible Blender geometry generation |
| [mascot-motion.ts](web/src/features/map/renderer/mascot-motion.ts) | Authored poses and bounded carry-sway spring |
| [TommyTrojanModel.tsx](web/src/features/map/renderer/TommyTrojanModel.tsx) | Scale, nape anchor, asset loading, clip attachment |
| [TommyTrojan.tsx](web/src/features/map/renderer/TommyTrojan.tsx) | Picking, carrying, dropping, and off-floor marker behavior |

At handoff the GLB is about 162 KB, with 5,080 triangles, six meshes, two materials,
and seven render primitives. It has no texture downloads. Animation lives in the
TypeScript clip, **not inside the GLB**: five pivots named `Head`, `ArmL`, `ArmR`,
`LegL`, and `LegR`, seven poses over 2.4 seconds. Preserve those pivots or remap
them when converting the asset for the selected native renderer.

Port/bake the small local animation rather than adding network-driven movement or
a full ragdoll simulation. Cache the asset and animate on-device. Verify rendering,
materials, pivot transforms, and motion after format conversion; native loading
support for the existing GLB is not assumed. No native-device performance has been
measured. Check frame pacing and memory on the chosen minimum device, including
All floors with the guide moving. Offer reduced-motion and non-drag alternatives.

## Backend and map integration requirements

### Capabilities, not existing endpoint promises

The replacement backend should support the following contracts. Exact paths and
response schemas remain for the mobile/backend team to agree.

| Capability | Request context | Required result |
| --- | --- | --- |
| Campus directory | Query, category, optional visible region | Stable building/place IDs, aliases, coordinates, interior availability |
| Building/interior data | Building ID and data version | Metadata, floors, geometry/model references, labels, entrances, explicit amenities |
| Search | Text, optional building, accessibility requirement | Resolved places and ranked suggestions; distinguish unknown from no match |
| Location resolution | Place ID or building/floor/local point | Canonical endpoint; reject out-of-bounds or blocked positions |
| Routing | Structured origin/destination, travel preference, step-free requirement | Route legs, geometry, steps, distance/time, constraint result, data version |
| Compass | Messages and relevant selected-building/location context | Reply and optional validated navigation intent or clarification |
| Events, when activated | Date range/category/building | Events with timestamps and actual destination IDs |

Model endpoints as a choice between a known place, a selected indoor position,
and an outside/entrance choice. Resolve the last choice explicitly before route
calculation. The same endpoint model should work for both origin and destination.
Do not round-trip location identity by parsing a user-facing label.

For each request, define loading, empty, failure, cancellation, and retry behavior.
Discard stale autocomplete/route responses when the query or endpoints change.
An offline or unavailable service must not erase a selected location or make a
blank interior look like valid data. Cache static assets and versioned interior
data; full offline routing is a separate feature decision.

Keep AI credentials on the backend. Start with anonymous public map reads unless
the new backend requires accounts. Location and chat retention policies must be
explicit before adding persistence; neither needs per-frame guide-position uploads.

### Coordinates and stable identity

There are several incompatible coordinate systems in the website. Do not feed
their raw numbers directly into the new campus map:

- The saved campus map uses geographic coordinates projected to screen/map pixels.
- The interior viewer uses local X/Z horizontal coordinates and Y vertical.
  Floor spacing is 3.4 scene units; `0` represents basement and is displayed as `B`.
- Horizontal distance estimates use 2.4 metres per unit for LAW and 2 for the
  generated buildings. These are demo scales, not surveyed coordinates.
- The viewer’s separate schematic 3D campus has another local coordinate frame.
- Existing shared API types describe model-local coordinates in metres. They are
  not directly interchangeable with the current viewer’s coordinates.

Define building origins, units, rotation/orientation, floor elevations, and the
transform to the replacement campus map. Make route geometry and selectable room
geometry use the same version of that transform. Keep display labels separate
from stable building, floor, place, node, and asset IDs.

### Existing contracts are reference material

[shared/typescript/src/types](shared/typescript/src/types) contains planned Building,
Place, Route, Event, and Chat interfaces. These are not a finished mobile API:

- `RouteRequest` has an origin node, destination place, and step-free Boolean;
  it cannot express all map-picked endpoints or the current travel preferences.
- `RouteResult` lacks the full indoor/outdoor geometry and view context used by
  the current route renderer.
- Shared place kinds differ from viewer kinds (`classroom` versus `room`,
  `toilet` versus `restroom`) and do not yet include a ramp kind.
- Shared building metadata requires a model URL, while current interiors are
  mostly generated geometry, not per-building model assets.
- Sample events use display-time strings and include `class`; shared events use
  timezone-bearing timestamps and a different kind union. Reconcile before import.

Use an explicit mapping layer when the new backend differs. Do not require the
backend to reproduce TypeScript naming mistakes or web-specific state.

## Native UI and state guidance

UI placement is intentionally open. A compact toolbar, tab bar, or sheet can expose
Search, Chat, and Directions. A sheet or separate menu can expose floors/layers.
The web’s left sidebar, draggable width, and bottom-left dropdown are references
for access to functions, not mandatory phone layouts. On larger devices, an
adjustable panel can retain the desktop convenience.

Keep these states independent: campus/building view, active floor/All floors,
selected room, visible layers, active tool, field drafts, resolved endpoints,
which endpoint is being picked, route/active step, and conversation. Presenting a
keyboard or changing a sheet height must not reset the map or close Search.

Use cardinal `#990000`, dark cardinal `#7A0000`, gold `#FFCC00`, accessibility blue
`#1F5BA8`, restroom blue `#2563EB`, entrance green `#15803D`, and exit red `#DC2626`
as the current visual references. Keep light surfaces, clear labels, rounded
controls, and visible selection states. Status must not depend on color alone.

Provide accessible names for map controls and markers, readable scaled text,
VoiceOver access to destinations and route steps, and a list-based alternative
when 3D targets are hard to select. Do not require a precise drag to set a location.
Hardware-keyboard shortcuts can preserve the web interaction where appropriate.

Actual device GPS is not implemented on the website. If added to mobile, request
permission when the user invokes it, retain manual placement when unavailable,
and do not treat GPS as a verified indoor room/floor position.

## Links and navigation compatibility

Support equivalent intents through the chosen mobile deep-link mechanism:

| Web example | Intent |
| --- | --- |
| `/?building=LAW&floor=1` | Open LAW, first floor |
| `/?building=LAW&floor=B` | Open LAW basement |
| `/?building=LAW&floor=all` | Open LAW floor stack |
| `/?building=LAW&room=LAW-101` | Open and highlight room 101 |
| `/?from=LAW-101&to=LAW-103&mode=elevator` | Resolve endpoints and show a route |

The URL is an example of intent, not a required mobile URL format. Validate IDs,
supported floors, and modes; handle missing interiors and stale room links without
crashing. Do not carry the web’s `localhost:3000`/`localhost:3001` redirects into
the mobile app. `/map` and `/events` currently render the same web page; they do
not imply separate fully implemented screens.

## Suggested delivery sequence

1. Build a Swift shell with the replacement campus map, directory, supported
   building selection, and closed-by-default panels.
2. Add one interior, floor controls, selection, camera framing, and the layer menu.
   Use LAW as the richest behavior reference, clearly labeled as demo data.
3. Add search/autocomplete, both endpoint pickers, and the guide with local motion.
4. Agree the coordinate/endpoint contracts with the new backend; integrate real
   search and routing, accessibility constraints, and route-step navigation.
5. Integrate Compass, preserving conversation state and clear service failures.
6. Add remaining supported interiors, link handling, and campus category/share
   parity. Verify real-device performance and accessibility throughout.
7. Implement events or additional campus services only when their data sources and
   product flows are ready; they are not completed web features to copy.

Backend framework, map provider, native 3D renderer, minimum iOS/device support,
offline scope, link domain, and real data ownership remain open choices. None
should be inferred from the demo’s implementation.

## Acceptance checklist

- [ ] Launch shows campus with no tools panel forced open.
- [ ] Directory search, supported/unsupported building selection, Buildings/Parking
  layers, pan/zoom/reset, return to campus, and sharing work on the replacement map.
- [ ] Search resolves building/room variants, highlights the result, and stays open.
- [ ] Single-floor, basement, All floors, and far-side room framing behave correctly.
- [ ] Layer ordering and default states match this document; ramps sit immediately
  above blue Elevators; Accessible paths remains absent.
- [ ] Origin and destination can each be typed or picked as room, entrance, or open
  area, without losing their coordinates or stable identity.
- [ ] Outside resolves to an explicit entrance; it does not create a fictitious GPS fix.
- [ ] Guide placement, nape carry, head droop, limb sway, invalid-drop rejection,
  cancel, re-grab, and off-floor indication work with touch and accessible alternatives.
- [ ] Accessibility changes preferences and suggestions; the routing service never
  silently substitutes a stair route for a step-free request.
- [ ] Same-location, same-floor, cross-floor, cross-building, missing-data, and
  no-route cases have sensible results and synchronized route steps.
- [ ] Compass supports multiline text, blank-send prevention, conversation retention,
  keyboard send behavior, and visible loading/retry/error states when connected.
- [ ] Backend delays, stale responses, network loss, backgrounding, and keyboard/sheet
  changes do not corrupt map state or lose committed endpoints unexpectedly.
- [ ] Assets render correctly after native conversion and are cached; carrying sends
  no per-frame network requests. Performance is checked on the minimum target device.
- [ ] Loading/error states, VoiceOver, larger text, reduced motion, and gesture
  alternatives are checked on-device.
- [ ] Shared links preserve intent and reject invalid identifiers gracefully.

## Source map for the implementer

| Reference | What to inspect |
| --- | --- |
| [Wayfinder.tsx](web/src/features/map/components/Wayfinder.tsx) | State transitions, floor/room selection, current location, links |
| [FloorTools.tsx](web/src/features/map/components/FloorTools.tsx) | Search, Directions, Compass, defaults, picking/cancel behavior |
| [LocationAutocomplete.tsx](web/src/features/search/components/LocationAutocomplete.tsx) | Suggestion selection and keyboard behavior |
| [MapOverlays.tsx](web/src/features/map/components/MapOverlays.tsx) | Layer metadata, floors, route steps |
| [BuildingScene.tsx](web/src/features/map/renderer/BuildingScene.tsx) | Floor geometry, selection, amenities, entrances, ramps |
| [map-camera.ts](web/src/features/map/camera.ts) | Building fit and far-side selection rotation |
| [map-location.ts](web/src/features/map/map-location.ts) | Typed location resolution and valid map drop targets |
| [location-search.ts](web/src/features/search/legacy/location-search.generated.ts) | Normalization, ranking, accessibility filtering |
| [routing.ts](web/src/features/routing/legacy/routing.generated.ts) | Demo graph and route-display structures, not verified navigation data |
| [map-link.ts](web/src/features/map/map-link.ts) | Existing link intents and fallback rules |
| [floorplan.ts](web/src/features/map/data/generated/floorplan.ts), [law.ts](web/src/features/map/data/generated/law.ts), [campus.ts](web/src/features/map/data/generated/campus.ts) | Demo interior data, IDs, coordinates, amenities, sample events |
| [campus demo](demos/usc-map/demo.js), [map-data.js](demos/usc-map/map-data.js), [locations.json](demos/usc-map/locations.json) | Campus actions, supported-building aliases, directory data |
| [web tests](web/tests), [campus tests](demos/usc-map/map-data.test.mjs) | Behavioral cases to translate into native tests |
| [architecture](docs/architecture.md), [API plan](docs/api.md) | Web implementation context and unimplemented services |

To inspect the reference locally, run `npm install` then `npm run dev:demo` from
the repository root. Campus runs on port 3001; interiors on port 3000. Optional
`npm run dev:api` starts the health-only server on port 4000. `npm test` and
`npm run typecheck` exercise existing web/workspace checks, not the Swift app.

This handoff was checked against source files. Native implementation, backend
availability, authoritative campus data, and device performance remain unverified.
