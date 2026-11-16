# API implementation status

`shared/contracts/openapi.yaml` controls wire behavior. The specification's server URL includes /api, so operation paths are mounted beneath it once. Its original historical descriptions are not a deployment-status report.

| Method and path                                  | Status                                       | Owner                           |
| ------------------------------------------------ | -------------------------------------------- | ------------------------------- |
| GET /api/health                                  | Implemented                                  | Eddie                           |
| GET /api/buildings                               | Implemented                                  | Eddie matching + teammate data  |
| GET /api/buildings/{buildingId}                  | Implemented                                  | Teammate                        |
| GET /api/buildings/{buildingId}/scene            | Implemented, procedural only                 | Teammate                        |
| GET /api/buildings/{buildingId}/floors           | Implemented                                  | Teammate                        |
| GET /api/buildings/{buildingId}/floors/{floorId} | Implemented, prepared boxes and places       | Teammate                        |
| GET /api/buildings/{buildingId}/places           | Implemented                                  | Teammate reads + Eddie matching |
| GET /api/buildings/{buildingId}/places/{placeId} | Implemented                                  | Teammate                        |
| GET /api/places                                  | Implemented                                  | Eddie                           |
| POST /api/routes                                 | Implemented for eligible indoor paths        | Eddie                           |
| POST /api/chat                                   | Implemented, requires configured AI provider | Eddie                           |
| GET /api/buildings/{buildingId}/graph            | Off by default; explicit server opt-in       | Eddie                           |
| GET /api/events and /api/events/{eventId}        | Disabled, 501                                | Deferred                        |

JSON shape and parameter validation use the OpenAPI schemas at runtime. Dataset response schemas are also validated. Shared errors include requestId, and successful versioned reads pin the requested snapshot. Unpinned requests use the snapshot loaded and validated at startup; unavailable versions return 410. Cursors bind filters, limits and version. Dataset reads support ETag/If-None-Match; POST responses use no-store.

Canonical identity, string floor IDs, dataVersion, right-handed building-local meters and Y up are preserved. Existing scene values were explicitly converted horizontally; their accuracy remains estimated. Route instructions reference returned leg IDs and point indexes.

The supplied snapshot has unknown accessibility evidence. Step-free requests return UNVERIFIED_ACCESSIBILITY; stairs plus stepFree is invalid. Unsupported outdoor requests return OUTDOOR_NETWORK_UNAVAILABLE. Scene model formats return 406. Multipart chat image requests return IMAGE_INPUT_DISABLED, 501. Unknown routes use the same APIError envelope.

Chat uses Eddie's configured intent adapter and the same search/routing services as manual controls. `AI_PROVIDER=disabled` returns `501 FEATURE_DISABLED`. Set `AI_PROVIDER=openai`, `OPENAI_API_KEY` and `OPENAI_MODEL` to enable live interpretation. Provider failures and timeouts return dependency errors. A non-resolved chat response has no map actions. Tests inject deterministic intents and provider responses; they do not establish live model quality.

See [integration review](integration-review.md) for the current LAW coverage gaps and [backend guide](backend-guide.md) for runtime validation, cancellation and service ownership.
