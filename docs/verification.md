# Integration verification

Verified on Windows on November 14, 2026. This record distinguishes implemented behavior from environment checks that remain outstanding.

| Check | Result |
| --- | --- |
| npm test | Passed: 52 tests, comprising 22 web, 28 backend and 2 saved campus-demo tests |
| Contract artifact and fixture check | Passed: 50 indexed valid/invalid fixtures; JSON and TypeScript artifacts match authoritative YAML |
| npm run typecheck | Passed across all TypeScript workspaces |
| npm run build | Passed for shared types, compiled Express backend and optimized Next.js app |
| npm run smoke | Passed against the production build: LAW page, 14 Next assets, mascot GLB/image, web-to-API proxy, scene/search object binding, manual route and chat |
| Browser interaction | Observed in Chrome: LAW scene, LAW 101 search/highlight, server-calculated LAW 101 to LAW 107 route with instructions, and chat focus action restoring the LAW 101 highlight |
| Dataset integrity | Every floor in all nine extracted buildings has checked place/object and access-point/node references and canonical floor elevations |
| Position validation | Tested room arrivals, invalid positions, wall crossings, floor separation and two picked points on one corridor without graph-cache mutation |
| Routing failures | Tested absent outdoor network, unavailable verified step-free access, invalid preference combinations, zero-distance arrival and connected cross-floor legs |
| Chat | Tested record focus, floor focus, missing-origin clarification and continuation, shared manual/chat route geometry and no-route responses |
| HTTP integration | Tested schema rejection, malformed JSON, string boolean rejection, unavailable snapshots, representation negotiation, bound pagination cursors and bodyless 304 responses |
| Mobile project metadata | Both Info.plist files and the shared Xcode scheme parse as XML |
| git diff --check | Passed |

The preserved prototype tests still describe illustrative legacy algorithm behavior. Their schematic outdoor paths and assumed step-free properties are not exposed as canonical API results. The new API tests verify the stricter behavior separately.

The current dataset is an estimated integration snapshot, not surveyed USC navigation. LAW comes from the existing traced plan; other interiors are generated. Unknown accessibility is not upgraded to verified. Shared API fixtures are synthetic and are not loaded as runtime datasets.

Concurrent reconstruction additions were preserved during final integration. Their generated constants now have explicit Reconstruction annotations, including in the generator, to avoid incompatible inferred dictionary unions. The active pointer is usc-interiors-2026-11-14; the original usc-demo-2026-11-14 baseline remains available. Position tests derive usable corridor fixtures from the active snapshot instead of assuming obsolete template coordinates.

The web renderer currently accepts numeric floor IDs and prepared procedural boxes. Model scenes and other unsupported scene geometry fail explicitly. Native rendering can replace the embedded mobile viewer without changing backend ownership.

The optional OpenAI-compatible provider was tested with injected transport responses and failure cases. No live provider request was made, and no credentials were supplied or stored. Chat defaults to the real deterministic local command interpreter, not a simulated model response.

Swift compilation, fixture-decoder execution, signing and iPhone simulator/device interaction require macOS/Xcode and were not performed here. The supplied project and commands in mobile/README.md make those checks concrete. Physical-device networking, WebGL behavior and pinch/orbit remain device acceptance tasks.

Existing Three.js CommonJS/clock deprecation warnings remain in the test/dev toolchain; they did not fail the checks. No accounts, public editing, outdoor network, live events or image pipeline were added.
