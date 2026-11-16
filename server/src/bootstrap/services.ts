import type {
  ChatPort,
  DatasetPort,
  RoutingPort,
  SearchPort,
} from "../ports/service-ports.js";
import type { IntentAdapter } from "../integrations/ai/intent.js";
import { GraphStore } from "../modules/routing/graph-store.js";
import { ReachabilityService } from "../modules/routing/reachability.js";
import { RoutingService } from "../modules/routing/routing.service.js";
import { SearchService } from "../modules/search/search.service.js";
import { CursorCodec } from "../modules/search/cursor.js";
import { ChatService } from "../modules/chat/chat.service.js";
import type { DemoCatalog } from "../modules/catalog/demo-catalog.js";
import { warmContracts } from "../lib/contracts.js";

export type Services = {
  datasets: DatasetPort;
  search: SearchPort;
  routing: RoutingPort;
  chat: ChatPort;
  currentVersion: () => string;
  graphs: GraphStore;
};
export function createServices(
  datasets: DatasetPort,
  currentVersion: () => string,
  cursorSecret: string,
  intent: IntentAdapter,
  catalog?: DemoCatalog,
): Services {
  const graphs = new GraphStore(datasets);
  const reachability = new ReachabilityService(datasets, graphs);
  const search = new SearchService(
    datasets,
    new CursorCodec(cursorSecret),
    reachability,
  );
  const routing = new RoutingService(datasets, graphs);
  const chat = new ChatService({ datasets, search, routing }, intent, catalog);
  return { datasets, search, routing, chat, currentVersion, graphs };
}

export async function prepareServices(services: Services, versions: string[]) {
  warmContracts();
  for (const dataVersion of versions) {
    const scope = {
      requestId: "startup",
      dataVersion,
      deadline: performance.now() + 30000,
    };
    await services.datasets.assertSnapshot(scope);
    const buildings = await services.datasets.listBuildings(scope);
    for (const b of buildings)
      if (b.capabilities.navigation) await services.graphs.get(scope, b.id);
    await services.search.searchBuildings(scope, { query: "", limit: 1 });
  }
}
