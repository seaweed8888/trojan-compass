// Run after npm run build. SMOKE_API_PORT must match API_BASE_URL used for the build.
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import next from "next";
import { createApp } from "../server/dist/app.js";
import { loadSnapshots } from "../server/dist/infrastructure/datasets/snapshot-loader.js";
import {
  createServices,
  prepareServices,
} from "../server/dist/bootstrap/services.js";
const datasets = await loadSnapshots(
  fileURLToPath(new URL("../server/data/snapshots/", import.meta.url)),
  { chatEnabled: true },
);
// Fixed intent exercises chat's real resolver/action validation; no model call or credentials.
const services = createServices(
  datasets,
  () => datasets.currentVersion,
  "smoke-only-cursor-secret-at-least-32-bytes",
  {
    interpret: async () => ({
      kind: "find_place",
      query: "LAW 101",
      buildingHint: null,
      originQuery: null,
      requestedMode: null,
      requestedStepFree: null,
      reference: "none",
      question: null,
      restroomGoal: null,
      exitQuery: null,
      destinationQuery: null,
      stopKind: null,
    }),
  },
);
await prepareServices(services, datasets.versions());
const app = createApp(services);
const apiPort = Number(process.env.SMOKE_API_PORT ?? 4000);

let apiServer, webServer, nextApp;
try {
  apiServer = app.listen(apiPort, "127.0.0.1");
  await new Promise((resolve, reject) => {
    apiServer.once("listening", resolve);
    apiServer.once("error", reject);
  });
  nextApp = next({
    dev: false,
    dir: fileURLToPath(new URL("../web", import.meta.url)),
    hostname: "127.0.0.1",
  });
  await nextApp.prepare();
  webServer = createServer(nextApp.getRequestHandler());
  await new Promise((resolve, reject) => {
    webServer.listen(0, "127.0.0.1", resolve);
    webServer.once("error", reject);
  });
  const base = `http://127.0.0.1:${webServer.address().port}`;
  async function get(path) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    return response;
  }
  const html = await (await get("/?building=LAW&floor=1")).text();
  const resources = [
    ...html.matchAll(/(?:src|href)="(\/_next\/[^"?]+(?:\?[^"\s]*)?)"/g),
  ].map((m) => m[1].replaceAll("&amp;", "&"));
  for (const path of new Set(resources)) await get(path);
  await get("/models/tommy-trojan.glb");
  await get("/models/tommy-trojan.png");
  assert.equal((await (await get("/api/health")).json()).status, "ok");
  const building = await (await get("/api/buildings/LAW")).json();
  const version = building.dataVersion;
  const scene = await (
    await get(`/api/buildings/LAW/scene?dataVersion=${version}`)
  ).json();
  assert.equal(scene.scene.representation, "procedural");
  const floor = await (
    await get(`/api/buildings/LAW/floors/1?dataVersion=${version}`)
  ).json();
  const results = await (
    await get(`/api/places?q=LAW%20101&dataVersion=${version}`)
  ).json();
  const place = results.items[0].place;
  assert.equal(place.id, "LAW-101");
  assert.ok(
    floor.geometry.objects.some((o) => o.objectKey === place.sceneObjectKey),
  );
  async function post(path, body) {
    const response = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const value = await response.json();
    assert.equal(response.status, 200, JSON.stringify(value));
    return value;
  }
  const prefs = { mode: "fastest", stepFree: false, accessProfile: "public" };
  const request = {
    clientRequestId: crypto.randomUUID(),
    dataVersion: version,
    origin: { kind: "place", buildingId: "LAW", placeId: "LAW-101" },
    destination: { kind: "place", buildingId: "LAW", placeId: "LAW-107" },
    ...prefs,
  };
  const route = await post("/api/routes", request);
  assert.ok(route.route.distanceMeters > 0);
  const chat = await post("/api/chat", {
    clientRequestId: crypto.randomUUID(),
    dataVersion: version,
    message: "Show LAW 101",
    history: [],
    context: {
      buildingId: "LAW",
      floorId: "1",
      origin: null,
      selectedPlace: null,
    },
    preferences: prefs,
  });
  assert.equal(chat.actions[0].placeId, "LAW-101");
  console.log(
    `Production smoke passed: page, ${new Set(resources).size} Next assets, mascot assets, proxy, scene/search/highlight mapping, route and fixture-driven chat (no live provider).`,
  );
} finally {
  if (webServer) {
    webServer.closeAllConnections();
    await new Promise((resolve) => webServer.close(resolve));
  }
  if (nextApp) await nextApp.close();
  if (apiServer) {
    apiServer.closeAllConnections();
    await new Promise((resolve) => apiServer.close(resolve));
  }
}
