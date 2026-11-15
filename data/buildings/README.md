# Building metadata

Create one folder per building ID with `building.json`, `places.json`, and
`graph.json`. These are planned data files; none are supplied yet.

- `building.json`: building and floor metadata (`Building` in shared types).
- `places.json`: array of `Place` records for classrooms, toilets, stairs,
  elevators, entrances, doors, and emergency exits.
- `graph.json`: `{ "nodes": RouteNode[], "edges": RouteEdge[] }`.
- Models belong in `apps/web/public/models/<building-id>/`.

All files must use the same stable IDs and model-local coordinates in meters
(Y up). Associate rooms with meshes for highlighting and graph nodes for routes.
Record ramps, elevators, doors, and verified step-free edges explicitly.
Emergency exit markers alone do not establish an evacuation route.
