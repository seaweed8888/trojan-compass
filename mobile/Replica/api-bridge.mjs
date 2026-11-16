// Preserve the shared web API client, including status codes, errors and aborts.
// Swift supplies HTTP transport for the app-bundle origin; business logic stays on the server.
export function installNativeAPITransport(host = window) {
  const handler = host.webkit?.messageHandlers?.replica;
  if (!handler || host.CompassReplicaTransport) return;
  const original = host.fetch.bind(host);
  const pending = new Map();
  host.CompassReplicaTransport = {
    receive(message) {
      const item = pending.get(message.id);
      if (!item) return;
      pending.delete(message.id);
      item.cleanup();
      if (message.error) item.reject(new TypeError(message.error));
      else
        item.resolve(
          new Response(
            [204, 205, 304].includes(message.status) ? null : message.body,
            {
              status: message.status,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
    },
  };
  host.fetch = async (input, init) => {
    const request =
      input instanceof Request
        ? new Request(input, init)
        : new Request(new URL(String(input), host.location.href), init);
    const url = new URL(request.url);
    const page = new URL(host.location.href);
    if (
      url.protocol !== page.protocol ||
      url.host !== page.host ||
      !url.pathname.startsWith("/api/")
    )
      return original(input, init);
    if (!["GET", "POST"].includes(request.method))
      throw new TypeError("Unsupported API method.");
    if (request.signal.aborted)
      throw new DOMException("Request aborted", "AbortError");
    const id =
      host.crypto.randomUUID?.() ??
      "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (
          Number(c) ^
          (host.crypto.getRandomValues(new Uint8Array(1))[0] &
            (15 >> (Number(c) / 4)))
        ).toString(16),
      );
    const body = request.method === "POST" ? await request.text() : null;
    return new Promise((resolve, reject) => {
      const abort = () => {
        pending.delete(id);
        request.signal.removeEventListener("abort", abort);
        handler.postMessage({ type: "api_cancel", id });
        reject(new DOMException("Request aborted", "AbortError"));
      };
      request.signal.addEventListener("abort", abort, { once: true });
      pending.set(id, {
        resolve,
        reject,
        cleanup: () => request.signal.removeEventListener("abort", abort),
      });
      if (request.signal.aborted) {
        abort();
        return;
      }
      handler.postMessage({
        type: "api_request",
        id,
        path: url.pathname + url.search,
        method: request.method,
        body,
      });
    });
  };
}
