# Trojan Compass for iOS

The SwiftUI application in `TrojanCompass.xcodeproj` hosts the bundled campus
map and the current API-backed web interior in WKWebView. Search, routing and
chat use the same Express backend and contract as the web application.
The optional native integration shell remains available with the
`--native-integration` launch argument.

## Run

1. From the repository root, run `npm ci` and `npm run dev:api`.
2. Open `mobile/TrojanCompass.xcodeproj` in Xcode and select an iPhone simulator.
3. Run the Debug configuration. Its `COMPASS_API_BASE_URL` build setting defaults
   to `http://127.0.0.1:4000/api`.

For a physical device, set that build setting to a backend reachable from the
device. Debug permits local HTTP development. Release requires an HTTPS URL
ending in `/api`; configure it before archiving. Release has no deployed backend
URL configured in the repository. Signing remains a local Xcode setting.
For the Swift Package macOS preview, supply `COMPASS_API_BASE_URL` in the
launch environment. A URL saved by the native shell can also be reused.

The campus directory, vector map, branding, fonts, models and dances load from
the app bundle. The default interior needs the backend for building data,
search, route calculation and chat. It reports connection failures rather than
falling back to canned chat or invented routes.

The private `compass-web://bundle/` scheme serves local assets. A main-frame
message bridge forwards only `GET`/`POST /api/*` requests through URLSession
to the configured backend, preserving response status, JSON errors, dataset
versions and cancellation. No second backend runs in the app.
Legacy localhost links and `trojancompass://map?building=LAW&floor=1` open the
bundled interior. External official links open the system browser.

## Source and ownership

- `web/src/features/`: shared interior UI, camera, picking, highlighting and
  drawing API-provided routes. Phones use Search, Chat, Directions, Floors and
  Layers in a bottom toolbar with compact sheets.
- `demos/usc-map/`: campus UI and attributed geographic assets; see
  [map sources](../demos/usc-map/MAP-SOURCES.md).
- `mobile/Replica/`: packaging and native HTTP bridge adapter.
- `mobile/Viewer/`: viewer used by the optional native shell.
- `TrojanCompass/Core/`, `Views/`: Swift screens, state, transport and decoders.
- `shared/contracts/openapi.yaml`: authoritative HTTP contract.
- `shared/fixtures/`: authoritative examples. Bundled copies are checked
  against these files; mobile has no separate OpenAPI agreement.

The native shell starts in a clearly labeled offline preview, exported from
the server snapshot in canonical meters. Preview records cannot be used for
live routing/chat. Connect its Settings screen to the backend for those flows.
Geometry and access remain illustrative/unverified, and navigation is optional
where usable data is unavailable.

## Rebuild and verify

From the repository root:

```sh
npm run build:mobile-viewer
npm run build:mobile-replica
npm run check:mobile
```

These regenerate checked-in resources from the current top-level directories,
including the server snapshot preview and shared fixtures. Xcode can use the
checked-in assets without npm. Rebuild them after source changes.

On macOS, also run `bash scripts/check-mobile.sh`, `swift test --package-path mobile`,
and the shared Xcode scheme with an iOS simulator. CI performs those compilation
and fixture checks. Device gestures, safe areas, VoiceOver and real backend
networking still need an interactive iPhone acceptance pass.
