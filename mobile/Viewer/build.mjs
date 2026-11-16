import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { repo, webPlugin, tailwind, sourceDigest } from "../build-support.mjs";
const out = new URL("../TrojanCompass/Resources/Viewer/", import.meta.url);
mkdirSync(out, { recursive: true });
execFileSync(process.execPath, ["mobile/Viewer/export-catalog.mjs"], {
  cwd: repo,
  stdio: "inherit",
});
await build({
  absWorkingDir: repo,
  entryPoints: ["mobile/Viewer/viewer.tsx"],
  bundle: true,
  tsconfig: "web/tsconfig.json",
  outfile: fileURLToPath(new URL("viewer.js", out)),
  minify: true,
  target: "safari17",
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [webPlugin()],
});
tailwind(
  "mobile/Viewer/viewer.css",
  "mobile/TrojanCompass/Resources/Viewer/viewer.css",
);
writeFileSync(
  new URL("index.html", out),
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Trojan Compass Interior</title><link rel="stylesheet" href="viewer.css"></head><body><div id="root"></div><script src="viewer.js"></script></body></html>',
);
writeFileSync(
  new URL("source.json", out),
  JSON.stringify({ sourceSHA256: sourceDigest() }) + "\n",
);
