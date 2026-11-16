import { fileURLToPath } from "node:url";
import { loadSnapshots } from "../../src/infrastructure/datasets/snapshot-loader.js";
import {
  createServices,
  prepareServices,
} from "../../src/bootstrap/services.js";
import { DisabledIntentAdapter } from "../../src/integrations/ai/provider-adapter.js";
import type { IntentAdapter } from "../../src/integrations/ai/intent.js";

export async function publishedServices(
  adapter: IntentAdapter = new DisabledIntentAdapter(),
) {
  const datasets = await loadSnapshots(
    fileURLToPath(new URL("../../data/snapshots/", import.meta.url)),
    { chatEnabled: true },
  );
  const services = createServices(
    datasets,
    () => datasets.currentVersion,
    "integration-tests-only-cursor-secret-32-bytes",
    adapter,
  );
  await prepareServices(services, datasets.versions());
  return services;
}
