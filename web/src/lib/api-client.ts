import type {
  BuildingListResponse,
  BuildingResponse,
  ChatResponse,
  ChatTextRequest,
  FloorListResponse,
  FloorResponse,
  PlaceListResponse,
  PlaceResponse,
  PlaceSearchResponse,
  RouteRequest,
  RouteResponse,
  SceneResponse,
} from "@trojan-compass/shared/api";

export class CompassApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly requestId?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CompassApiError";
  }
}
export function clientRequestId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 15) | 64;
  bytes[8] = (bytes[8]! & 63) | 128;
  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
type Parameters = Record<string, string | number | boolean | undefined>;
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
/** Browser-safe transport. Authentication/provider credentials never enter this module. */
export function createApiClient(
  baseUrl = "/api",
  transport: typeof fetch = (...args) => fetch(...args),
) {
  const request = async <T>(
    path: string,
    params: Parameters = {},
    body?: RouteRequest | ChatTextRequest,
    signal?: AbortSignal,
  ): Promise<T> => {
    const controller = new AbortController();
    const timer = setTimeout(
      () =>
        controller.abort(
          new CompassApiError(
            "TIMEOUT",
            "The request took too long. Try again.",
          ),
        ),
      path === "/chat" ? 60000 : 15000,
    );
    const abort = () => controller.abort(signal?.reason);
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
    try {
      const result = await transport(
        `${baseUrl}${path}${query.size ? `?${query}` : ""}`,
        {
          method: body ? "POST" : "GET",
          headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            "X-Request-ID": clientRequestId(),
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
          cache: "no-store",
        },
      );
      let value: unknown;
      try {
        value = await result.json();
      } catch {
        throw new CompassApiError(
          "INVALID_RESPONSE",
          "The server returned an unreadable response.",
          result.headers.get("x-request-id") ?? undefined,
          result.status,
        );
      }
      if (!result.ok) {
        const error = object(value) && object(value.error) ? value.error : null;
        throw new CompassApiError(
          typeof error?.code === "string" ? error.code : "SERVER_ERROR",
          typeof error?.message === "string"
            ? error.message
            : "The server could not complete the request.",
          typeof error?.requestId === "string" ? error.requestId : undefined,
          result.status,
        );
      }
      if (
        !object(value) ||
        typeof value.requestId !== "string" ||
        typeof value.dataVersion !== "string"
      )
        throw new CompassApiError(
          "INVALID_RESPONSE",
          "The response is missing its data version.",
        );
      if (body && value.clientRequestId !== body.clientRequestId)
        throw new CompassApiError(
          "STALE_RESPONSE",
          "A response belongs to a different request.",
        );
      if (
        (body?.dataVersion ?? params.dataVersion) &&
        value.dataVersion !== (body?.dataVersion ?? params.dataVersion)
      )
        throw new CompassApiError(
          "DATA_VERSION_MISMATCH",
          "The map data changed. Reopen the building before continuing.",
        );
      if (
        path === "/chat" &&
        (typeof value.message !== "string" ||
          !Array.isArray(value.actions) ||
          ![
            "resolved",
            "needs_clarification",
            "not_found",
            "no_route",
            "unsupported",
          ].includes(String(value.status)))
      )
        throw new CompassApiError(
          "INVALID_RESPONSE",
          "The assistant response is incomplete.",
        );
      return value as T;
    } catch (error) {
      if (controller.signal.aborted) throw controller.signal.reason;
      if (error instanceof CompassApiError) throw error;
      throw new CompassApiError(
        "NETWORK_ERROR",
        "Could not reach Compass. Check your connection and try again.",
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  };
  const b = (id: string) => `/buildings/${encodeURIComponent(id)}`;
  return {
    buildings: (params: Parameters = {}, signal?: AbortSignal) =>
      request<BuildingListResponse>("/buildings", params, undefined, signal),
    building: (id: string, dataVersion?: string, signal?: AbortSignal) =>
      request<BuildingResponse>(b(id), { dataVersion }, undefined, signal),
    scene: (
      id: string,
      dataVersion: string,
      representation = "auto",
      signal?: AbortSignal,
    ) =>
      request<SceneResponse>(
        `${b(id)}/scene`,
        { dataVersion, representation },
        undefined,
        signal,
      ),
    floors: (id: string, dataVersion: string, signal?: AbortSignal) =>
      request<FloorListResponse>(
        `${b(id)}/floors`,
        { dataVersion },
        undefined,
        signal,
      ),
    floor: (
      id: string,
      floorId: string,
      dataVersion: string,
      signal?: AbortSignal,
    ) =>
      request<FloorResponse>(
        `${b(id)}/floors/${encodeURIComponent(floorId)}`,
        { dataVersion },
        undefined,
        signal,
      ),
    places: (params: Parameters, signal?: AbortSignal) =>
      request<PlaceSearchResponse>("/places", params, undefined, signal),
    buildingPlaces: (id: string, params: Parameters, signal?: AbortSignal) =>
      request<PlaceListResponse>(`${b(id)}/places`, params, undefined, signal),
    place: (
      id: string,
      placeId: string,
      dataVersion: string,
      signal?: AbortSignal,
    ) =>
      request<PlaceResponse>(
        `${b(id)}/places/${encodeURIComponent(placeId)}`,
        { dataVersion },
        undefined,
        signal,
      ),
    route: (body: RouteRequest, signal?: AbortSignal) =>
      request<RouteResponse>("/routes", {}, body, signal),
    previewRoute: (body: RouteRequest, signal?: AbortSignal) =>
      request<RouteResponse>("/preview/routes", {}, body, signal),
    chat: (body: ChatTextRequest, signal?: AbortSignal) =>
      request<ChatResponse>("/chat", {}, body, signal),
  };
}
export const compassApi = createApiClient();

// The API-backed viewer uses the same validated, cancellable transport as the tools.
export { CompassApiError as APIRequestError };
export const versionQuery = (version: string) =>
  `dataVersion=${encodeURIComponent(version)}`;
export const client = {
  buildings: (signal?: AbortSignal) =>
    compassApi.buildings({ limit: 100 }, signal),
  building: compassApi.building,
  scene: (id: string, version: string, signal?: AbortSignal) =>
    compassApi.scene(id, version, "auto", signal),
  floor: compassApi.floor,
  search: (query: string, version: string, signal?: AbortSignal) =>
    compassApi.places({ q: query, dataVersion: version, limit: 20 }, signal),
  route: compassApi.route,
  chat: compassApi.chat,
};
