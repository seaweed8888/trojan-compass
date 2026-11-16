import test from "node:test";
import assert from "node:assert/strict";
import {
  chatRequest,
  fixture,
  intent,
  makeServices,
  scope,
} from "./support/fixture.js";
import { AppError } from "../src/lib/errors.js";
import { OpenAIIntentAdapter } from "../src/integrations/ai/provider-adapter.js";
import type OpenAI from "openai";

test("AI building, floor, and room actions contain canonical references only", async () => {
  for (const [i, expected] of [
    [intent({ query: "gould" }), "focus_building"],
    [
      intent({ kind: "show_floor", query: "2", buildingHint: "LAW" }),
      "focus_floor",
    ],
    [intent({ kind: "find_place", query: "LAW 101" }), "focus_place"],
  ] as const) {
    const r = await makeServices(fixture(), {
      interpret: async () => i,
    }).chat.respond(scope(), chatRequest());
    assert.equal(r.status, "resolved");
    assert.equal(r.actions[0]?.type, expected);
    assert.equal(r.citations.length, 0);
  }
});
test("ambiguous places produce candidates instead of highlighting the first result", async () => {
  const services = makeServices(fixture(), {
    interpret: async () => intent({ kind: "find_place", query: "classroom" }),
  });
  const r = await services.chat.respond(scope(), chatRequest());
  assert.equal(r.status, "needs_clarification");
  assert.ok(r.clarification!.candidates.length > 1);
  assert.deepEqual(r.actions, []);
});
test("a clarified canonical destination resolves on the next stateless turn", async () => {
  const services = makeServices(fixture(), {
    interpret: async (_scope, request) =>
      intent({ kind: "find_place", query: String(request.message) }),
  });
  const first = await services.chat.respond(
    scope(),
    chatRequest({ message: "classroom" }),
  );
  const choice = first.clarification!.candidates[0]!;
  assert.equal(choice.kind, "place");
  if (choice.kind !== "place") return;
  const second = await services.chat.respond(
    scope(),
    chatRequest({
      message: choice.location.placeId,
      history: [
        { role: "user", content: "classroom" },
        { role: "assistant", content: first.message },
      ],
      context: {
        buildingId: "LAW",
        floorId: null,
        selectedPlace: choice.location,
        origin: null,
      },
    }),
  );
  assert.equal(second.status, "resolved");
  assert.deepEqual(second.actions[0], {
    type: "focus_place",
    buildingId: "LAW",
    floorId: "1",
    placeId: choice.location.placeId,
  });
});
test("selectedPlace is never silently treated as the origin, and explicit new destinations win", async () => {
  const services = makeServices(fixture(), {
    interpret: async () => intent({ kind: "route", query: "LAW 102" }),
  });
  const request = chatRequest({
    context: {
      buildingId: "LAW",
      floorId: "1",
      selectedPlace: { kind: "place", buildingId: "LAW", placeId: "LAW-101" },
      origin: null,
    },
  });
  const missing = await services.chat.respond(scope(), request);
  assert.equal(missing.clarification?.reason, "missing_origin");
  assert.deepEqual(missing.actions, []);
  const completed = await services.chat.respond(scope(), {
    ...request,
    clientRequestId: crypto.randomUUID(),
    context: {
      ...request.context,
      origin: { kind: "place", buildingId: "LAW", placeId: "LAW-101" },
    },
  });
  assert.equal(completed.status, "resolved");
  const action = completed.actions[0]!;
  assert.equal(action.type, "show_route");
  if (action.type === "show_route")
    assert.equal(action.route.destination.placeId, "LAW-102");
});
test("navigation failure is a completed chat turn without actions; provider failure remains an error", async () => {
  const data = fixture();
  data.places.find((p) => p.id === "LAW-301")!.access.level = "restricted";
  const request = chatRequest({
    context: {
      buildingId: "LAW",
      floorId: null,
      selectedPlace: null,
      origin: { kind: "place", buildingId: "LAW", placeId: "LAW-101" },
    },
  });
  const result = await makeServices(data, {
    interpret: async () => intent({ kind: "route", query: "LAW 301" }),
  }).chat.respond(scope(), request);
  assert.equal(result.status, "no_route");
  assert.deepEqual(result.actions, []);
  await assert.rejects(
    makeServices(fixture(), {
      interpret: async () => {
        throw new AppError("DEPENDENCY_TIMEOUT", 504, "timeout");
      },
    }).chat.respond(scope(), request),
    { code: "DEPENDENCY_TIMEOUT" },
  );
});
test("outside remains ambiguous, unsupported intents have no actions, and stale context IDs fail validation", async () => {
  const s = makeServices(fixture(), {
    interpret: async () =>
      intent({ kind: "find_place", query: "outside", buildingHint: "LAW" }),
  });
  assert.equal(
    (await s.chat.respond(scope(), chatRequest())).clarification?.reason,
    "ambiguous_outside",
  );
  const unsupported = await makeServices(fixture(), {
    interpret: async () => intent({ kind: "unsupported", query: null }),
  }).chat.respond(scope(), chatRequest());
  assert.deepEqual(unsupported.actions, []);
  await assert.rejects(
    s.chat.respond(
      scope(),
      chatRequest({
        context: {
          buildingId: "missing",
          floorId: null,
          selectedPlace: null,
          origin: null,
        },
      }),
    ),
    { code: "RESOURCE_NOT_FOUND" },
  );
});
test("invalid or malicious model actions cannot pass the internal intent boundary", async () => {
  const bad = {
    ...intent(),
    actions: [{ type: "focus_place", placeId: "invented" }],
  };
  await assert.rejects(
    makeServices(fixture(), { interpret: async () => bad }).chat.respond(
      scope(),
      chatRequest(),
    ),
    { code: "DEPENDENCY_UNAVAILABLE" },
  );
});
test("OpenAI adapter requests bounded schema output, disables storage/retries, and handles incomplete output", async () => {
  let captured: any;
  const client = {
    responses: {
      create: async (body: unknown, options: unknown) => {
        captured = { body, options };
        return {
          status: "completed",
          output: [],
          output_text: JSON.stringify(intent()),
        };
      },
    },
  } as unknown as Pick<OpenAI, "responses">;
  const adapter = new OpenAIIntentAdapter(client, "configured-model");
  assert.equal(
    (await adapter.interpret(scope(), chatRequest())).kind,
    "find_building",
  );
  assert.equal(captured.body.store, false);
  assert.equal(captured.options.maxRetries, 0);
  assert.ok(Number.isInteger(captured.options.timeout));
  assert.ok(captured.options.timeout > 0);
  assert.equal(captured.body.text.format.strict, true);
  const broken = new OpenAIIntentAdapter(
    {
      responses: { create: async () => ({ status: "incomplete", output: [] }) },
    } as unknown as Pick<OpenAI, "responses">,
    "configured-model",
  );
  await assert.rejects(broken.interpret(scope(), chatRequest()), {
    code: "DEPENDENCY_UNAVAILABLE",
  });
});
test("AI concurrency admission rejects excess calls instead of growing an unbounded queue", async () => {
  let finish!: (value: unknown) => void;
  const client = {
    responses: {
      create: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    },
  } as unknown as Pick<OpenAI, "responses">;
  const adapter = new OpenAIIntentAdapter(client, "configured-model", 1);
  const first = adapter.interpret(scope(), chatRequest());
  await assert.rejects(adapter.interpret(scope(), chatRequest()), {
    code: "RATE_LIMITED",
  });
  finish({
    status: "completed",
    output: [],
    output_text: JSON.stringify(intent()),
  });
  await first;
});

test("cancellation does not release a provider slot before an ignoring transport settles", async () => {
  let finish!: (value: unknown) => void;
  const client = {
    responses: {
      create: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    },
  } as unknown as Pick<OpenAI, "responses">;
  const adapter = new OpenAIIntentAdapter(client, "configured-model", 1);
  const controller = new AbortController();
  const first = adapter.interpret(
    { ...scope(), signal: controller.signal },
    chatRequest(),
  );
  await Promise.resolve();
  controller.abort(new Error("cancelled"));
  await assert.rejects(first, /cancelled/);
  await assert.rejects(adapter.interpret(scope(), chatRequest()), {
    code: "RATE_LIMITED",
  });
  finish({
    status: "completed",
    output: [],
    output_text: JSON.stringify(intent()),
  });
});
