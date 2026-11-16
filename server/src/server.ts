import { createServer } from "node:http";
import { monitorEventLoopDelay } from "node:perf_hooks";
import { createApp } from "./app.js";
import { readConfig } from "./config/env.js";
import { loadSnapshots } from "./infrastructure/datasets/snapshot-loader.js";
import { prototypeStore } from "./infrastructure/datasets/prototype-adapter.js";
import {
  createOpenAIAdapter,
  DisabledIntentAdapter,
} from "./integrations/ai/provider-adapter.js";
import { createServices, prepareServices } from "./bootstrap/services.js";
import { PreviewRoutingService } from "./modules/routing/preview/preview-routing.service.js";
import { DemoCatalog } from "./modules/catalog/demo-catalog.js";

const config = readConfig();
const datasets =
  config.datasetMode === "files"
    ? await loadSnapshots(config.datasetRoot!, {
        production: config.production,
        chatEnabled: config.aiProvider !== "disabled",
      })
    : prototypeStore(config.aiProvider !== "disabled");
const intent =
  config.aiProvider === "openai"
    ? createOpenAIAdapter(config.apiKey!, config.model!, config.aiConcurrency)
    : new DisabledIntentAdapter();
const catalog = config.production
  ? undefined
  : await DemoCatalog.forSnapshot(datasets, {
      requestId: "chat-catalog-startup",
      dataVersion: datasets.currentVersion,
    });
const services = createServices(
  datasets,
  () => datasets.currentVersion,
  config.cursorSecret,
  intent,
  catalog,
);
await prepareServices(services, datasets.versions());
const shutdown = new AbortController();
const log = (event: Record<string, unknown>) =>
  process.stdout.write(JSON.stringify(event) + "\n");
const server = createServer(
  createApp(services, {
    ...config,
    shutdownSignal: shutdown.signal,
    log,
    previewRouting:
      !config.production && config.datasetMode === "prototype"
        ? new PreviewRoutingService()
        : undefined,
  }),
);
server.requestTimeout = 65000;
server.headersTimeout = 15000;
server.keepAliveTimeout = 5000;
server.maxRequestsPerSocket = 1000;
const loopDelay = monitorEventLoopDelay({ resolution: 20 });
loopDelay.enable();
const metrics = setInterval(() => {
  log({
    event: "runtime",
    eventLoopP99Ms: Math.round(loopDelay.percentile(99) / 1e6),
    heapBytes: process.memoryUsage().heapUsed,
  });
  loopDelay.reset();
}, 60000);
metrics.unref();
server.listen(config.port, config.host, () =>
  log({
    event: "listening",
    host: config.host,
    port: config.port,
    dataVersion: datasets.currentVersion,
    dataMode: config.datasetMode,
    aiProvider: config.aiProvider,
  }),
);
let stopping = false;
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    log({ event: "shutdown_started", signal });
    const timer = setTimeout(() => {
      shutdown.abort();
      server.closeAllConnections();
    }, config.shutdownMs);
    timer.unref();
    server.close((error) => {
      clearTimeout(timer);
      clearInterval(metrics);
      loopDelay.disable();
      if (error) process.exitCode = 1;
      log({ event: "shutdown_complete" });
    });
    server.closeIdleConnections();
  });
