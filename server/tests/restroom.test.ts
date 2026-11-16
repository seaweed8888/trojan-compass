import test from "node:test";
import assert from "node:assert/strict";
import type {
  LocationRef,
  Place,
  Route,
  RouteRequest,
} from "@trojan-compass/shared/api";
import {
  RestroomService,
  routeViaRestroom,
} from "../src/modules/chat/restroom.service.js";
import { ChatService } from "../src/modules/chat/chat.service.js";
import { prototypeStore } from "../src/infrastructure/datasets/prototype-adapter.js";
import { createServices } from "../src/bootstrap/services.js";
import { PreviewRoutingService } from "../src/modules/routing/preview/preview-routing.service.js";
import { AppError } from "../src/lib/errors.js";
import { assertContract } from "../src/lib/contracts.js";
import {
  chatRequest,
  fixture,
  intent,
  makeServices,
  routeRequest,
  scope,
} from "./support/fixture.js";

const loc = (id: string): LocationRef => ({
  kind: "place",
  buildingId: "LAW",
  placeId: id,
});
const prefs = {
  mode: "fastest",
  stepFree: false,
  accessProfile: "public",
} as const;
test("washroom ranking uses complete routes, not the nearest first leg or different-exit detour baselines", async () => {
  const data = fixture(),
    services = makeServices(data);
  const base = await services.routing.calculateRoute(scope(), routeRequest());
  const template = data.places.find((p) => p.id === "LAW-101")!;
  const p = (id: string, kind: Place["kind"]): Place => ({
    ...structuredClone(template),
    id,
    kind,
    access: { ...template.access, level: "public", exitAllowed: true },
  });
  const restrooms = [p("a", "restroom"), p("b", "restroom")],
    exits = [p("e1", "entrance"), p("e2", "entrance")];
  const costs: Record<string, number> = {
    "o:a": 10,
    "o:b": 20,
    "o:e1": 30,
    "o:e2": 100,
    "a:e1": 60,
    "a:e2": 100,
    "b:e1": 20,
    "b:e2": 81,
  };
  const calls: RouteRequest[] = [];
  const service = new RestroomService({
    calculateRoute: async (_scope, request) => {
      calls.push(request);
      assert.equal(request.origin.kind, "place");
      assert.equal(request.destination.kind, "place");
      if (
        request.origin.kind !== "place" ||
        request.destination.kind !== "place"
      )
        throw new Error("bad endpoint");
      const cost =
        costs[request.origin.placeId + ":" + request.destination.placeId];
      if (cost === undefined) throw new AppError("NO_ROUTE", 422, "blocked");
      return { ...structuredClone(base), durationSeconds: cost };
    },
  });
  const input = {
    origin: loc("o"),
    restrooms,
    exits,
    onWayOut: false,
    preferences: prefs,
    clientRequestId: "restroom-test",
  };
  assert.equal((await service.recommend(scope(), input))?.restroom.id, "a");
  const recommended = await service.recommend(scope(), {
    ...input,
    onWayOut: true,
  });
  assert.equal(recommended?.restroom.id, "b");
  assert.equal(recommended?.exit?.id, "e1");
  assert.equal(recommended?.extraSeconds, 10);
  assert.ok(
    calls.every((r) => r.mode === "fastest" && r.accessProfile === "public"),
  );
  restrooms[1]!.access.level = "restricted";
  assert.equal(
    (await service.recommend(scope(), { ...input, onWayOut: true }))?.restroom
      .id,
    "a",
  );
  for (const exit of exits) exit.access.exitAllowed = false;
  assert.equal(
    await service.recommend(scope(), { ...input, onWayOut: true }),
    null,
  );
});

test("route failures are skipped, but cancellation and dependency failures propagate", async () => {
  const place = {
    ...fixture().places[0]!,
    kind: "restroom",
    access: { ...fixture().places[0]!.access, level: "public" },
  } as Place;
  const input = {
    origin: loc("o"),
    restrooms: [place],
    exits: [],
    onWayOut: false,
    preferences: prefs,
    clientRequestId: "restroom-test",
  };
  const noRoute = new RestroomService({
    calculateRoute: async () => {
      throw new AppError("NO_ROUTE", 422, "blocked");
    },
  });
  assert.equal(await noRoute.recommend(scope(), input), null);
  const failing = new RestroomService({
    calculateRoute: async () => {
      throw new AppError("DEPENDENCY_UNAVAILABLE", 503, "failed");
    },
  });
  await assert.rejects(failing.recommend(scope(), input), {
    code: "DEPENDENCY_UNAVAILABLE",
  });
  const controller = new AbortController();
  controller.abort(new Error("cancelled"));
  await assert.rejects(
    noRoute.recommend({ ...scope(), signal: controller.signal }, input),
    /cancelled/,
  );
});

const previewScope = () => ({
  ...scope(),
  dataVersion: "prototype-v1",
  deadline: performance.now() + 30000,
});
const preview = (
  kind: "find_restroom" | "route_restroom",
  overrides: Partial<ReturnType<typeof intent>> = {},
) => {
  const datasets = prototypeStore();
  const adapter = {
    interpret: async () =>
      intent({
        kind,
        query: "restroom",
        restroomGoal: "nearest",
        ...overrides,
      }),
  };
  const services = createServices(
    datasets,
    () => datasets.currentVersion,
    "restroom-tests-32-byte-secret-value",
    adapter,
  );
  return {
    services,
    chat: new ChatService(
      { ...services, routing: new PreviewRoutingService() },
      adapter,
    ),
  };
};
test("restroom intents resolve synonyms through mapped restroom kinds", async () => {
  for (const query of ["restroom", "washroom", "bathroom", "toilet", "WC"]) {
    const { chat } = preview("find_restroom", { query });
    const result = await chat.respond(
      previewScope(),
      chatRequest({
        dataVersion: "prototype-v1",
        message: `Find a ${query}`,
        context: {
          buildingId: "LAW",
          floorId: "2",
          selectedPlace: null,
          origin: null,
        },
      }),
    );
    assert.equal(result.status, "needs_clarification");
    assert.ok(result.clarification!.candidates.length > 0);
    for (const candidate of result.clarification!.candidates) {
      assert.equal(candidate.kind, "place");
      if (candidate.kind === "place")
        assert.equal(
          (
            await prototypeStore().getPlace(
              previewScope(),
              "LAW",
              candidate.location.placeId,
            )
          ).kind,
          "restroom",
        );
    }
  }
});
test("without an origin, general washroom questions use the displayed floor and cannot invent nearest", async () => {
  const { chat } = preview("find_restroom");
  const r = await chat.respond(
    previewScope(),
    chatRequest({
      dataVersion: "prototype-v1",
      context: {
        buildingId: "LAW",
        floorId: "2",
        selectedPlace: { kind: "place", buildingId: "LAW", placeId: "LAW-201" },
        origin: null,
      },
    }),
  );
  assert.equal(r.status, "needs_clarification");
  assert.deepEqual(r.actions, []);
  assert.ok(r.clarification!.candidates.length > 0);
  for (const c of r.clarification!.candidates)
    if (c.kind === "place")
      assert.ok(c.location.placeId.startsWith("LAW-2-restroom"));
  const out = preview("find_restroom", { restroomGoal: "on_way_out" });
  assert.equal(
    (
      await out.chat.respond(
        previewScope(),
        chatRequest({
          dataVersion: "prototype-v1",
          context: {
            buildingId: "LAW",
            floorId: "2",
            selectedPlace: null,
            origin: null,
          },
        }),
      )
    ).clarification?.reason,
    "missing_origin",
  );
});
test("way-out routing includes the restroom stop and ordinary exit in one validated route", async () => {
  const { chat } = preview("route_restroom", {
    restroomGoal: "on_way_out",
    originQuery: "LAW 201",
    requestedMode: "elevator",
  });
  const r = await chat.respond(
    previewScope(),
    chatRequest({
      dataVersion: "prototype-v1",
      message:
        "Route me via a washroom on the way out from LAW 201 using elevators",
      context: {
        buildingId: "LAW",
        floorId: "2",
        selectedPlace: null,
        origin: null,
      },
    }),
  );
  assert.equal(r.status, "resolved");
  assert.match(r.message, /most convenient/);
  assert.doesNotMatch(
    r.message,
    /seconds extra|minutes? extra|\d+ min|\d+ seconds/,
  );
  assertContract("ChatResponse", r);
  const action = r.actions[0];
  assert.equal(action?.type, "show_route");
  if (action?.type !== "show_route") throw new Error("No route");
  assert.ok(action.route.steps.some((s) => s.text.startsWith("Stop at ")));
  assert.equal(action.route.origin.placeId, "LAW-201");
  const destination = await prototypeStore().getPlace(
    previewScope(),
    "LAW",
    action.route.destination.placeId!,
  );
  assert.equal(destination.kind, "entrance");
  assert.equal(destination.access.exitAllowed, true);
  assert.equal(action.route.usesStairs, false);
  assert.equal(
    new Set(action.route.legs.map((l) => l.id)).size,
    action.route.legs.length,
  );
  assert.equal(
    new Set(action.route.steps.map((s) => s.id)).size,
    action.route.steps.length,
  );
  action.route.steps.forEach((s, i) => {
    assert.equal(s.index, i);
    assert.ok(action.route.legs.some((l) => l.id === s.legId));
  });
});
test("nearest recommendations highlight a real restroom without treating selection as current location", async () => {
  const { chat } = preview("find_restroom");
  const r = await chat.respond(
    previewScope(),
    chatRequest({
      dataVersion: "prototype-v1",
      context: {
        buildingId: "LAW",
        floorId: "4",
        selectedPlace: { kind: "place", buildingId: "LAW", placeId: "LAW-431" },
        origin: loc("LAW-101"),
      },
    }),
  );
  assert.equal(r.status, "resolved");
  assert.match(r.message, /most convenient mapped washroom/);
  const action = r.actions[0];
  assert.equal(action?.type, "focus_place");
  if (action?.type === "focus_place")
    assert.equal(
      (await prototypeStore().getPlace(previewScope(), "LAW", action.placeId))
        .kind,
      "restroom",
    );
});

test("explicit west exits search entrance records only and preserve a selected restroom stop", async () => {
  const { chat } = preview("route_restroom", {
    restroomGoal: "on_way_out",
    originQuery: "LAW 201",
    query: "LAW-2-restroom-2",
    exitQuery: "west exit",
    requestedMode: "stairs",
  });
  const r = await chat.respond(
    previewScope(),
    chatRequest({
      dataVersion: "prototype-v1",
      message: "Use the second washroom then the west exit from LAW 201",
      context: {
        buildingId: "LAW",
        floorId: "2",
        selectedPlace: null,
        origin: null,
      },
    }),
  );
  assert.equal(r.status, "resolved");
  assert.match(r.message, /LAW-2-restroom-2/);
  const action = r.actions[0];
  assert.equal(action?.type, "show_route");
  if (action?.type === "show_route")
    assert.equal(action.route.destination.placeId, "LAW-ENT-WEST");
});
