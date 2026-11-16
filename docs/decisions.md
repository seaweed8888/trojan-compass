# Integration decisions

| Decision            | Initial implementation                                                                                         | Owner to review     |
| ------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------- |
| Runtime layout      | Existing web/, mobile/, server/, shared/ layout                                                                | All                 |
| First snapshot      | usc-demo-2026-11-14, all nine existing demo interiors                                                          | Teammate            |
| Coordinates         | Estimated horizontal scales 2.4 LAW and 2 otherwise; assumed 3.4 m physical floor spacing; Y up                | Teammate with Eddie |
| Navigation source   | Topology nodes/edges, corridor segments with explicit radius, wall boxes and connector cores                   | Teammate with Eddie |
| Position validation | Known room arrivals or unobstructed projection within 2 m of usable topology; correct floor elevation required | Eddie               |
| Accessibility       | Unknown stays unknown; no verified step-free fallback                                                          | Both                |
| Graph cache         | In memory, keyed by building and snapshot; picked nodes are request-local                                      | Eddie               |
| Floor data seam     | DatasetPort.getFloorGeometry supplies prepared geometry separately from metadata                               | Both                |
| Mobile viewer       | SwiftUI embeds the API-backed web viewer; web owns all requests and map state                                  | Mobile developer    |
| AI provider         | Local deterministic commands by default; explicit configured OpenAI-compatible adapter optional                | Eddie               |
| Public addresses    | Environment-configured API and viewer origins; Xcode viewer URL setting                                        | Integration owners  |
| Optional features   | Images, events and graph inspection disabled; no outdoor network                                               | Both                |

A released snapshot is immutable. Create a new dataVersion when geometry, topology, access evidence, calibration or stable object mappings change. The extraction script is for creating/reproducing the initial integration snapshot before release, not rewriting a published dataset in place.

Native rendering can replace WKWebView later while preserving the same contract. There is no native/web bridge in the current implementation because native controls do not issue map commands. If added, it must adopt the guide's versioned envelope and one-owner rule.

Remaining environment tasks are iOS simulator/device verification, selecting a production provider/model, configuring reachable deployment addresses and supplying surveyed geometry/access evidence. They do not require inventing endpoints or changing canonical IDs.
