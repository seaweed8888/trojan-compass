import { loadSnapshots } from "./infrastructure/datasets/snapshot-loader.js";
import { createServices, prepareServices } from "./bootstrap/services.js";
import { DisabledIntentAdapter } from "./integrations/ai/provider-adapter.js";
const directory = process.argv[2] ?? process.env.DATASET_ROOT;
if (!directory)
  throw new Error("Pass an absolute snapshot directory or set DATASET_ROOT.");
const store = await loadSnapshots(directory, {
  production: process.env.NODE_ENV === "production",
  chatEnabled: false,
});
const services = createServices(
  store,
  () => store.currentVersion,
  "validation-only-cursor-secret-never-served",
  new DisabledIntentAdapter(),
);
await prepareServices(services, store.versions());
process.stdout.write(
  JSON.stringify({
    valid: true,
    currentVersion: store.currentVersion,
    availableVersions: store.versions(),
  }) + "\n",
);
