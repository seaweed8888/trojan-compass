# Trojan Compass architecture

## Goal

Help first years and transfer students reach unfamiliar classrooms, club
meetings, general events, and exams with a 3D indoor map.

## Responsibilities

| Location | Responsibility |
| --- | --- |
| `apps/web/src/app` | Next.js routes and page composition |
| `apps/web/src/features/map` | React Three Fiber viewer, floors, highlights, route overlay |
| `apps/web/src/features/search` | Classroom and amenity lookup |
| `apps/web/src/features/routing` | Start/destination selection, accessibility preferences, directions |
| `apps/web/src/features/events` | Event discovery and links to map destinations |
| `apps/web/src/features/chat` | Navigation conversation and eventual image input |
| `apps/web/src/components/ui` | Shared visual components |
| `apps/web/src/lib` | Browser-side API helpers |
| `apps/api/src/modules` | Feature-specific HTTP routes and application services |
| `apps/api/src/lib` | Data loading and AI provider adapters |
| `packages/shared` | Type-only domain and request/response contracts |
| `data` | Building metadata, route graphs, and demo events |
| `apps/web/public/models` | Public 3D assets |

The frontend calls relative `/api` paths; Next.js rewrites them to the Node
server. Keep routing algorithms, data validation, and AI credentials on the API.
Shared contracts have no runtime exports; use `import type` in either app.
Runtime request validation still needs to be added when endpoints are implemented.

## Feature flow

1. Search or select an event to resolve a building and place ID.
2. Load the building model and metadata and highlight the destination mesh.
3. Select an origin node and request a route with accessibility preferences.
4. Compute a path over verified graph edges; return instructions and node IDs.
5. Draw the path in the same coordinates as the model.
6. Add chat to resolve natural language to those same place and node IDs.
   Image interpretation should request clarification when location is ambiguous.

## Suggested implementation order

1. Model one floor in one building and curate its room/amenity metadata.
2. Implement room selection and mesh highlighting.
3. Add graph routing, then stairs, elevators, and verified step-free paths.
4. Add manually curated events and map destinations.
5. Add an AI provider for intent resolution, then image inputs if time permits.

## Current boundary

Only the Next.js shell, placeholder pages, API health endpoint, workspace scripts,
and initial shared types are implemented. Feature modules marked TODO are empty
scaffolds. No real 3D model, graph, routing algorithm, AI provider, event import,
database, authentication, or image upload pipeline has been implemented.
