import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { installNativeAPITransport } from "./api-bridge.mjs";

function setup() {
  const messages = [],
    requests = [];
  const host = {
    location: { href: "compass-web://bundle/interior/index.html?building=LAW" },
    crypto: webcrypto,
    fetch: async (...args) => {
      requests.push(args);
      return new Response("asset");
    },
    webkit: {
      messageHandlers: { replica: { postMessage: (m) => messages.push(m) } },
    },
  };
  installNativeAPITransport(host);
  return { host, messages, requests };
}
test("API bridge preserves JSON, error envelopes and ordinary asset fetches", async () => {
  const { host, messages, requests } = setup();
  const result = host.fetch("/api/routes", {
    method: "POST",
    body: JSON.stringify({ from: { buildingId: "LAW" } }),
  });
  await new Promise((resolve) => setImmediate(resolve));
  const request = messages[0];
  assert.equal(request.path, "/api/routes");
  assert.equal(request.method, "POST");
  assert.equal(JSON.parse(request.body).from.buildingId, "LAW");
  const error = {
    error: { code: "NO_ROUTE", message: "No route", requestId: "test" },
  };
  host.CompassReplicaTransport.receive({
    id: request.id,
    status: 422,
    body: JSON.stringify(error),
  });
  const response = await result;
  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), error);
  await host.fetch("/models/test.glb");
  assert.equal(requests.length, 1);
  assert.equal(messages.length, 1);
});
test("API bridge cancels an in-flight route and ignores stale replies", async () => {
  const { host, messages } = setup(),
    controller = new AbortController();
  const result = host.fetch("/api/buildings/LAW?dataVersion=v1", {
    signal: controller.signal,
  });
  const rejected = assert.rejects(result, { name: "AbortError" });
  await new Promise((resolve) => setImmediate(resolve));
  controller.abort();
  await rejected;
  assert.equal(messages[1].type, "api_cancel");
  assert.equal(messages[1].id, messages[0].id);
  host.CompassReplicaTransport.receive({
    id: messages[0].id,
    status: 200,
    body: "{}",
  });
});
test("API bridge supports non-secure bundle origins without randomUUID", async () => {
  const { host, messages } = setup();
  host.crypto = { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) };
  const result = host.fetch("/api/health");
  await new Promise((resolve) => setImmediate(resolve));
  assert.match(messages[0].id, /^[a-f0-9-]{36}$/);
  host.CompassReplicaTransport.receive({
    id: messages[0].id,
    status: 200,
    body: '{"status":"ok"}',
  });
  assert.equal((await (await result).json()).status, "ok");
});
