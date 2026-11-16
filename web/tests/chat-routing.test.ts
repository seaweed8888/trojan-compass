import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type OpenAI from "openai";
import { createApp } from "../../server/src/app";
import { createServices } from "../../server/src/bootstrap/services";
import { DemoCatalog } from "../../server/src/modules/catalog/demo-catalog";
import { OpenAIIntentAdapter } from "../../server/src/integrations/ai/provider-adapter";
import { publishedServices } from "../../server/tests/support/published-fixture";
import { chatRequest, intent } from "../../server/tests/support/fixture";
import { installNativeAPITransport } from "../../mobile/Replica/api-bridge.mjs";
import { client } from "../src/lib/api-client";
import { ViewerSession } from "../src/features/map/api-viewer";
import { sceneRoute } from "../src/features/routing/route-scene";
import {
  routeLinkParams,
  parseMapLink,
} from "../src/features/map/map-link-input";

const nativeFetch = globalThis.fetch;
let server: ReturnType<ReturnType<typeof createApp>["listen"]>;
let base: string;
let version: string;
let nextIntent = intent();
let providerInput: ReturnType<typeof chatRequest> & {
  retrievedRecords: { id: string }[];
};

before(async () => {
  const existing = await publishedServices();
  version = existing.currentVersion();
  const catalog = await DemoCatalog.forSnapshot(existing.datasets, {
    requestId: "test",
    dataVersion: version,
  });
  assert.ok(catalog);
  await catalog.validateLocations(existing.datasets, {
    requestId: "test",
    dataVersion: version,
  });
  // Only model interpretation is stubbed; HTTP, datasets, routing and viewer are real.
  const adapter = new OpenAIIntentAdapter(
    {
      responses: {
        create: async (body: any) => {
          providerInput = JSON.parse(body.input[0].content);
          return {
            status: "completed",
            output: [],
            output_text: JSON.stringify(nextIntent),
          };
        },
      },
    } as unknown as Pick<OpenAI, "responses">,
    "test-model",
  );
  const services = createServices(
    existing.datasets,
    () => version,
    "chat-integration-test-secret-32-bytes",
    adapter,
    catalog,
  );
  server = createApp(services, { chatRateLimitPerMinute: 1000 }).listen(
    0,
    "127.0.0.1",
  );
  await new Promise<void>((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
after(() => {
  globalThis.fetch = nativeFetch;
  server?.closeAllConnections();
  server?.close();
});

for (const transport of ["web", "iOS bridge"]) {
  test(`${transport}: AI actions use current map data, routes and accessibility checks`, async () => {
    const fetchAPI: typeof fetch = (input, options) =>
      nativeFetch(
        typeof input === "string" && input.startsWith("/api")
          ? base + input
          : input,
        options,
      );
    if (transport === "web") globalThis.fetch = fetchAPI;
    else {
      const host: any = {
        location: {
          href: "compass-web://bundle/interior/index.html?building=LAW",
        },
        crypto: globalThis.crypto,
        fetch: fetchAPI,
        webkit: {
          messageHandlers: {
            replica: {
              postMessage(message: any) {
                if (message.type !== "api_request") return;
                void nativeFetch(base + message.path, {
                  method: message.method,
                  headers: { "Content-Type": "application/json" },
                  body: message.body,
                })
                  .then(async (response) =>
                    host.CompassReplicaTransport.receive({
                      id: message.id,
                      status: response.status,
                      body: await response.text(),
                    }),
                  )
                  .catch((error) =>
                    host.CompassReplicaTransport.receive({
                      id: message.id,
                      error: String(error),
                    }),
                  );
              },
            },
          },
        },
      };
      installNativeAPITransport(host);
      globalThis.fetch = host.fetch;
    }
    const viewer = new ViewerSession(await client.buildings());
    const request = chatRequest({
      dataVersion: version,
      context: {
        buildingId: "LAW",
        floorId: "1",
        selectedPlace: null,
        origin: { kind: "place", buildingId: "LAW", placeId: "LAW-101" },
      },
    });
    nextIntent = intent({ kind: "find_place", query: "WRIT 340" });
    const highlight = await client.chat({
      ...request,
      message: "Where is WRIT 340?",
    });
    assert.equal(highlight.status, "resolved");
    assert.match(highlight.message, /\[Demo\].*WRIT 340/);
    assert.equal(providerInput.retrievedRecords[0]?.id, "demo-writ-340");
    const focused = await viewer.actions(highlight.actions);
    focused.commit();
    assert.equal(focused.selected, "LAW-201");
    assert.equal(focused.view.type === "building" && focused.view.floor, 2);

    for (const mode of ["stairs", "elevator"] as const) {
      nextIntent = intent({
        kind: "route",
        query: "AIS USC Navratri",
        requestedMode: mode,
      });
      const response = await client.chat({
        ...request,
        message: `Take me to Navratri using ${mode}`,
      });
      assert.equal(response.status, "resolved");
      const prepared = await viewer.actions(response.actions);
      prepared.commit();
      assert.equal(prepared.wireRoute?.destination.placeId, "LAW-431");
      assert.equal(prepared.wireRoute?.usesStairs, mode === "stairs");
      assert.equal(prepared.wireRoute?.usesElevator, mode === "elevator");
      assert.ok(
        sceneRoute(prepared.wireRoute!, "LAW").some(
          (s) => s.kind === "vertical",
        ),
      );
    }
    nextIntent = intent({
      kind: "route_stopover",
      query: "WRIT 340",
      destinationQuery: "LAW 431",
    });
    const trip = await client.chat({
      ...request,
      message: "Go via WRIT 340 to LAW 431",
    });
    assert.equal(trip.status, "resolved");
    const staged = await viewer.actions(trip.actions);
    assert.equal(staged.wireRoute?.origin.placeId, "LAW-101");
    assert.equal(staged.wireRoute?.destination.placeId, "LAW-431");
    assert.ok(
      staged.wireRoute?.steps.some((s) => s.text.startsWith("Stop at ")),
    );
    const saved = parseMapLink(routeLinkParams(staged.wireRoute!), []);
    assert.equal(saved.via, "LAW-201");
    const reopened = await client.route({
      clientRequestId: request.clientRequestId,
      dataVersion: version,
      origin: { kind: "place", buildingId: "LAW", placeId: saved.from! },
      destination: { kind: "place", buildingId: "LAW", placeId: saved.to! },
      via: { kind: "place", buildingId: "LAW", placeId: saved.via! },
      mode: saved.mode,
      stepFree: saved.stepFree,
      accessProfile: "public",
    });
    assert.equal(reopened.route.via?.placeId, "LAW-201");
    assert.ok(reopened.route.steps.some((s) => s.text.startsWith("Stop at ")));
    assert.equal(
      new Set(staged.wireRoute!.legs.map((l) => l.id)).size,
      staged.wireRoute!.legs.length,
    );

    nextIntent = intent({
      kind: "route_restroom",
      query: "washroom",
      restroomGoal: "on_way_out",
    });
    const restroom = await client.chat({
      ...request,
      message: "Take me via a washroom on the way out",
    });
    assert.equal(restroom.status, "resolved");
    const viaExit = await viewer.actions(restroom.actions);
    assert.ok(
      viaExit.wireRoute?.steps.some((s) => s.text.startsWith("Stop at ")),
    );
    assert.ok(
      viaExit.places.some(
        (p) =>
          p.id === viaExit.wireRoute?.destination.placeId &&
          p.kind === "entrance",
      ),
    );

    nextIntent = intent({
      kind: "route",
      query: "LAW 431",
      requestedStepFree: true,
    });
    const inaccessible = await client.chat({
      ...request,
      message: "Give me a verified step-free route to LAW 431",
    });
    assert.equal(inaccessible.status, "no_route");
    assert.deepEqual(inaccessible.actions, []);

    nextIntent = intent({ kind: "route", query: "LAW 201" });
    const missing = await client.chat({
      ...request,
      context: { ...request.context, origin: null },
    });
    assert.equal(missing.clarification?.reason, "missing_origin");
    assert.deepEqual(missing.actions, []);
    nextIntent = intent({
      kind: "route",
      query: "LAW 201",
      originQuery: "LAW 101",
    });
    const history = [
      { role: "user" as const, content: "I'm near LAW 101" },
      { role: "assistant" as const, content: "Starting from LAW 101." },
    ];
    const followup = await client.chat({
      ...request,
      context: { ...request.context, origin: null },
      history,
    });
    assert.deepEqual(providerInput.history, history);
    assert.equal(followup.status, "resolved");
    assert.equal(
      (await viewer.actions(followup.actions)).wireRoute?.origin.placeId,
      "LAW-101",
    );
    await assert.rejects(
      client.chat({ ...request, dataVersion: "stale-version" }),
    );
  });
}
