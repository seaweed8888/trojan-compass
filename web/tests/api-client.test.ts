import test from "node:test";
import assert from "node:assert/strict";
import { createApiClient } from "../src/lib/api-client";

test("API client propagates structured errors and detects mismatched versions", async () => {
  const failing = createApiClient("/api", (async () =>
    Response.json(
      {
        error: {
          code: "NO_ROUTE",
          message: "No public route.",
          requestId: "r1",
        },
      },
      { status: 422 },
    )) as typeof fetch);
  await assert.rejects(failing.places({ q: "LAW" }), {
    code: "NO_ROUTE",
    requestId: "r1",
  });
  const stale = createApiClient("/api", (async () =>
    Response.json({
      requestId: "r2",
      dataVersion: "old",
      items: [],
      nextCursor: null,
    })) as typeof fetch);
  await assert.rejects(stale.places({ q: "LAW", dataVersion: "new" }), {
    code: "DATA_VERSION_MISMATCH",
  });
});
test("API client encodes filters and cancels in-flight requests", async () => {
  let url = "";
  const api = createApiClient("/api", (async (input, options) => {
    url = String(input);
    assert.equal(options?.cache, "no-store");
    return Response.json({
      requestId: "r",
      dataVersion: "v1",
      items: [],
      nextCursor: null,
    });
  }) as typeof fetch);
  await api.places({ q: "LAW 101", stepFree: false, floorId: undefined });
  assert.equal(url, "/api/places?q=LAW+101&stepFree=false");
  const abort = new AbortController();
  const waiting = createApiClient(
    "/api",
    ((_input, options) =>
      new Promise((_resolve, reject) =>
        options!.signal!.addEventListener(
          "abort",
          () => reject(options!.signal!.reason),
          { once: true },
        ),
      )) as typeof fetch,
  );
  const pending = waiting.buildings({}, abort.signal);
  abort.abort(new Error("cancelled"));
  await assert.rejects(pending, /cancelled/);
});
