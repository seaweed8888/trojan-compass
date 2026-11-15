# API plan

Base path: `/api`. Only `GET /health` currently exists.

| Status | Method / path | Purpose |
| --- | --- | --- |
| Implemented | `GET /health` | API process health |
| Planned | `GET /buildings` | List available building models |
| Planned | `GET /buildings/:buildingId` | Metadata, floors, and model URL |
| Planned | `GET /buildings/:buildingId/places?q=&kind=` | Search rooms and amenities |
| Planned | `POST /routes` | Accept `RouteRequest` and return `RouteResult` |
| Planned | `GET /events` | List events with map destinations |
| Planned | `POST /chat` | Resolve navigation intent and ask clarifying questions |

Unimplemented endpoints return 404. Decide request validation and error contracts
when implementing each feature. Define image limits and upload handling before
adding multimodal chat; the current API accepts JSON only.
