# Feature verification — November 15, 2026

## Result

Tested the desktop campus (`:3001`), the mobile campus (`:3101`), and the shared interior UI at desktop and phone sizes. Fixed the UI failures below and reran the affected flows. Final coverage: **156 passing automated tests, 67 passing browser scenarios, and five successful chat API requests**. One automated test remains blocked by Windows permissions. This report covers the working tree tested in this session; it is not native iOS certification.

| Automated check | Result |
| --- | --- |
| Web regression suite | 43 passed |
| API regression suite | 96 passed; 1 blocked by Windows file-symlink permissions |
| Campus regression suite | 14 passed |
| Mobile JavaScript bridge suite | 3 passed |
| OpenAPI artifacts and fixtures | Passed in the full workspace test run |
| Workspace TypeScript checks | Passed |
| Embedded mobile viewer TypeScript | Passed |
| Shared, API, and Next.js production build | Passed |
| Production smoke | Passed: page, 14 Next assets, guide assets, API proxy, scene/search binding, routing, and fixture-driven chat |
| Active snapshot validation | Passed for `usc-interiors-2026-11-14` |
| Both mobile asset builds and bundle provenance checks | Passed |

The smoke test used an isolated API on port 4017 so it could run alongside the development API. Its chat interpreter is a fixture. Separate requests against the running development API exercised the configured chat service.

## Fixes from this pass

- Search suggestions covered the Search rooms button. Suggestions now occupy space in the form, and pressing Search preserves focus until submission so the button does not move between pointer-down and click.
- The existing route-instruction component was never rendered. The Directions panel now displays it, including Previous/Next, floor changes, and Clear route. A newly loaded route resets its active instruction.
- Kept the map-picking buttons aligned with their inputs when suggestions expand, and stabilized the desktop directions submit button during autocomplete dismissal.
- On the desktop-sized mobile campus, the home control covered the 3D toggle. The toggle now sits beside the existing controls.
- Rebuilt the iOS web resources from the current shared UI.

## Browser coverage

Used an isolated headless Microsoft Edge browser controlled with Playwright. Main viewports were 1440 × 900 and 393 × 852, with an additional 320 × 568 phone layout. Phone checks exercise the responsive web UI; they do not exercise SwiftUI or WKWebView.

| Feature or scenario | Desktop | Phone preview |
| --- | --- | --- |
| LAW interior loads without a visible application error | Passed | Passed |
| DMC campus alias opens the VKC interior | Passed | Passed |
| Return to the originating campus | Passed | Passed |
| Campus directory search and no-results state | Passed | Passed |
| Unavailable floor-plan footer and blocked THH entry | Passed | Passed |
| Campus zoom | Passed | Passed |
| Campus reset, building filter, share link, HSC external-map fallback | Passed on both desktop campus layouts | Desktop-only controls |
| Mobile campus 2D/3D toggle | Passed at desktop size after fix | Passed |
| Room search and correct floor selection | Passed; desktop panel stays open | Passed; phone panel dismisses |
| Invalid room search retains the query and reports no match | Passed | Passed |
| Autocomplete keyboard selection | Passed | Passed |
| Basement, floors 1–4, and all-floors mode in LAW | Passed | Passed |
| All eight layer switches toggle and restore | Passed | Passed |
| Same-floor route and Clear route | Passed | Passed |
| DMC room-to-room routing and instructions | Passed | Passed |
| Cross-floor elevator route | Passed | Passed |
| Accessibility selects elevators and disables stairs | Passed | Passed |
| Saved cross-floor route restores after reload | Passed | Passed |
| Instruction Next/Previous updates the active step | Passed | Passed |
| Cancel map picking | Passed | Passed |
| Trojan guide keyboard dance and room placement | Passed | Passed |
| Orbit/zoom changes the rendered view | Passed | Passed with emulated pointer input |
| Chat submission returns a valid response | Passed | Passed |
| Empty chat cannot be submitted | Passed | Passed |
| Network failure preserves search draft and current view | Passed | Passed |
| Network failure preserves chat draft and displays an error | Passed | Passed |
| Invalid step-free deep-link preference reports an error | Passed | Passed |
| Legacy `/events` URL returns to campus | Passed | Passed |
| Search, Chat, Directions, Floors, and Layers fit a 320px screen | Not applicable | Passed |
| Uncaught JavaScript errors in the main campus/interior flows | None observed | None observed |

Hover checks inspected every available map element carrying a building name: 363 in the original desktop map and 266 in the custom campus. They checked the name popup and whether the unavailable-plan footer matched the LAW/DMC availability rule.

Intermittent connection refusals occurred while overlapping browser runs fetched assets from the local Python campus server. The isolated rerun of the desktop 3D toggle passed. This was not a campus-server load or reliability test.

## Chat and backend coverage

The configured chat API returned HTTP 200 with resolved actions for:

- A route from LAW 101 to LAW 107 (`show_route`).
- A nearest-restroom query (`focus_place`).
- A restroom lookup on the way out (`focus_place`; this lookup did not itself request a route).
- A CSCI 356 demo-class lookup (`focus_place`).
- An explicit request to route via a washroom to an exit from LAW 201 using elevators (`show_route`, with the restroom stop and exit).

These are individual successful requests, not a guarantee of arbitrary natural-language interpretation. The regression suites additionally cover clarification, context, stopovers, route preferences, inaccessible destinations, malformed requests, timeouts, cancellation, stale responses, dataset versions, and contract validation. Class/event records used by the demo are synthetic.

## Outstanding and unavailable

- **Native iOS:** Swift compilation, XCTest/Swift Package tests, Debug/Release simulator builds, signing, and real-device interaction were not run. This Windows host has no Xcode or Swift toolchain, no configured remote Mac, and no authenticated GitHub CLI connection for checking native CI. Historical native results do not validate this working tree.
- **One API test remains blocked:** `file publications load independent of cwd and cannot reference outside the dataset root` fails while creating its file symlink with `EPERM`. The test reaches the operating-system permission failure before its symlink-escape assertion. It was not skipped or weakened. WSL is installed but has no Linux Node runtime. Run the unchanged test on Linux/macOS or a Windows environment permitted to create file symlinks.
- **Device acceptance:** real iPhone multitouch, keyboard/safe-area behavior, VoiceOver, WebGL performance, background/foreground transitions, and device-to-API networking remain unverified.
- **Product scope:** other campus buildings have no enabled floor-plan entry; no live event feed is connected; cross-building routes and verified step-free navigation are not available from the bundled illustrative data.
- **Coverage limits:** no sustained load test, penetration test, public deployment, or exhaustive browser/device matrix was performed. Automated checks and the listed flows cannot prove every possible user input or route works.

See [mobile setup](../mobile/README.md) for native build instructions and [map sources](../demos/usc-map/MAP-SOURCES.md) for dataset provenance.
