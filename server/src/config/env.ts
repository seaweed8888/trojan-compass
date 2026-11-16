import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
export function readConfig(input: NodeJS.ProcessEnv = process.env) {
  const production = input.NODE_ENV === "production";
  const integer = (
    name: string,
    fallback: number,
    min: number,
    max: number,
  ) => {
    const raw = input[name];
    const n = raw === undefined ? fallback : Number(raw);
    if (
      (raw !== undefined && !/^\d+$/.test(raw)) ||
      !Number.isInteger(n) ||
      n < min ||
      n > max
    )
      throw new Error(`${name} must be an integer between ${min} and ${max}.`);
    return n;
  };
  const flag = (name: string, fallback = false) => {
    if (input[name] === undefined) return fallback;
    if (input[name] !== "true" && input[name] !== "false")
      throw new Error(`${name} must be true or false.`);
    return input[name] === "true";
  };
  const datasetMode = input.DATASET_MODE ?? "files";
  if (
    !["files", "prototype"].includes(datasetMode) ||
    (production && datasetMode === "prototype")
  )
    throw new Error(
      "Production requires DATASET_MODE=files and a reviewed publication.",
    );
  if (production && datasetMode === "files" && !input.DATASET_ROOT)
    throw new Error("DATASET_ROOT is required for file datasets.");
  const aiProvider = input.AI_PROVIDER ?? "disabled";
  if (!["disabled", "openai"].includes(aiProvider))
    throw new Error("AI_PROVIDER must be disabled or openai.");
  if (aiProvider === "openai" && (!input.OPENAI_API_KEY || !input.OPENAI_MODEL))
    throw new Error("OpenAI chat requires OPENAI_API_KEY and OPENAI_MODEL.");
  const cursorSecret =
    input.CURSOR_SECRET ??
    (production ? "" : randomBytes(32).toString("base64url"));
  if (Buffer.byteLength(cursorSecret) < 32)
    throw new Error(
      "CURSOR_SECRET must be at least 32 bytes and stable across replicas.",
    );
  const origins = (
    input.CORS_ORIGINS ??
    (production ? "" : "http://localhost:3000,http://127.0.0.1:3000")
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const origin of origins) {
    const url = new URL(origin);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.origin !== origin ||
      (production && url.protocol !== "https:")
    )
      throw new Error(
        "CORS_ORIGINS must contain exact web origins; production requires HTTPS.",
      );
  }
  return {
    production,
    port: integer("PORT", 4000, 1, 65535),
    host: input.HOST ?? "127.0.0.1",
    datasetMode,
    datasetRoot:
      input.DATASET_ROOT ??
      fileURLToPath(new URL("../../data/snapshots/", import.meta.url)),
    aiProvider,
    apiKey: input.OPENAI_API_KEY,
    model: input.OPENAI_MODEL,
    cursorSecret,
    origins,
    trustProxy: (input.TRUST_PROXY_CIDRS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    exposeGraph: flag("EXPOSE_GRAPH"),
    requestTimeoutMs: integer("REQUEST_TIMEOUT_MS", 10000, 100, 30000),
    chatTimeoutMs: integer("CHAT_TIMEOUT_MS", 45000, 100, 60000),
    aiConcurrency: integer("AI_MAX_CONCURRENCY", 8, 1, 100),
    rateLimitPerMinute: integer("RATE_LIMIT_PER_MINUTE", 240, 1, 100000),
    chatRateLimitPerMinute: integer("CHAT_RATE_LIMIT_PER_MINUTE", 20, 1, 10000),
    shutdownMs: integer("SHUTDOWN_TIMEOUT_MS", 10000, 100, 30000),
  };
}
