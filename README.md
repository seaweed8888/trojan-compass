# Trojan Compass

A hackathon project to help USC first years and transfer students find unfamiliar
classrooms, club meetings, campus events, and exams through a 3D building map.
Planned features include toilets, stairs, elevators, accessible paths, highlighted
doors/entrances, emergency exit markers, and an AI navigation assistant.

## Stack

- **Web:** Next.js App Router, React, TypeScript.
- **3D:** Three.js, React Three Fiber, and Drei installed for the future viewer.
- **API:** Node.js, Express, TypeScript.
- **Workspace:** npm workspaces with shared TypeScript contracts.

Next.js provides the React build tooling, so this workspace does not need Vite.

## Get started

Use Node.js 22.9 or later and npm. From the repository root:

```sh
npm install
npm run dev
```

- Frontend: <http://localhost:3000>
- API health: <http://127.0.0.1:4000/api/health>
- Health through the frontend proxy: <http://localhost:3000/api/health>

Defaults work without environment files. To customize, copy
`apps/web/.env.example` to `apps/web/.env.local` and
`apps/api/.env.example` to `apps/api/.env`. Restart the affected process after
changing environment variables. Keep the web API address aligned with the API port.

```sh
npm run dev:web       # frontend only
npm run dev:api       # backend only
npm run typecheck     # all workspace TypeScript checks
npm run build         # check shared types and build both apps
```

After building, start each service in its own terminal:

```sh
npm run start --workspace=@trojan-compass/api
npm run start --workspace=@trojan-compass/web
```

## Structure

```text
trojan-compass/
├── apps/
│   ├── web/
│   │   ├── public/
│   │   │   ├── models/                 # building GLB/GLTF assets
│   │   │   └── images/
│   │   └── src/
│   │       ├── app/                    # home, /map, /events
│   │       ├── components/ui/          # shared UI
│   │       ├── features/
│   │       │   ├── map/                # 3D viewer, floors, highlights
│   │       │   ├── search/             # rooms and amenities
│   │       │   ├── routing/            # route controls and accessibility
│   │       │   ├── events/             # event discovery
│   │       │   └── chat/               # AI navigation interface
│   │       └── lib/                    # API helpers
│   └── api/src/
│       ├── config/                    # environment settings
│       ├── modules/
│       │   ├── buildings/             # metadata, room and amenity lookup
│       │   ├── routing/               # graph paths and accessibility
│       │   ├── events/                # events and classroom destinations
│       │   └── chat/                  # natural language/image intent
│       ├── lib/                       # AI adapter and data loader
│       ├── middleware/
│       ├── app.ts                     # Express app and health endpoint
│       └── server.ts                  # process entry point
├── packages/shared/src/types/         # building, place, route, event, chat
├── data/
│   ├── buildings/                     # floor metadata and routing graphs
│   └── events/                        # demo event records
└── docs/                              # architecture and endpoint plan
```

## Scaffold status

The app shell and `/api/health` run. The map, search, route, event, and chat screens
are explicitly labeled placeholders. Feature files contain TODOs and minimal
skeletons; no real building, route, event feed, or AI integration is supplied.

Start with one real building and one floor. See [architecture](docs/architecture.md),
[API plan](docs/api.md), and [building data conventions](data/buildings/README.md).
