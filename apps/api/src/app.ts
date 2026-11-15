import express from "express";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "trojan-compass-api" });
});

// Mount feature routers here as their implementations become available.
app.use((_request, response) => {
  response.status(404).json({ error: "Endpoint not implemented" });
});
