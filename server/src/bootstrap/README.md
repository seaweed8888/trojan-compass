# Server composition

`services.ts` injects DatasetPort and IntentAdapter into SearchService, GraphStore, ReachabilityService, RoutingService, and ChatService. Chat reuses the exact manual search/routing services.

`prepareServices()` validates all retained publications and only prepares navigation for buildings that advertise it. `app.ts` mounts HTTP handlers; importing the app does not start a listener or read credentials. `server.ts` owns environment configuration, provider setup, publication loading, logging, and graceful shutdown.

See `docs/backend-guide.md` at the repository root for the full workflow and integration contract.
