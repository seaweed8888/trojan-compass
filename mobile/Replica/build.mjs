import { build } from "esbuild";
import { webPlugin, tailwind, sourceDigest } from "../build-support.mjs";
import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const output = new URL("../TrojanCompass/Resources/Replica/", import.meta.url);
const read = (path) =>
  readFileSync(new URL("../../" + path, import.meta.url), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
mkdirSync(new URL("campus/", output), { recursive: true });
mkdirSync(new URL("interior/", output), { recursive: true });
cpSync(
  repo + "/demos/usc-map/assets",
  fileURLToPath(new URL("campus/assets", output)),
  { recursive: true },
);
cpSync(
  repo + "/demos/usc-map/demo.css",
  fileURLToPath(new URL("campus/demo.css", output)),
);
cpSync(repo + "/web/public/images", fileURLToPath(new URL("images", output)), {
  recursive: true,
});
cpSync(
  fileURLToPath(new URL("fonts/", import.meta.url)),
  fileURLToPath(new URL("fonts/", output)),
  { recursive: true },
);

// Preserve the saved campus DOM, branding, CSS, tiles, credits, and behavior.
const campus = read("demos/usc-map/index.html").replace(
  '<script src="demo.js?v=campus-modes-1" type="module"></script>',
  '<script src="campus.js"></script>',
);
writeFileSync(new URL("campus/index.html", output), campus);
const locations = read("demos/usc-map/locations.json");
await build({
  absWorkingDir: repo,
  entryPoints: ["demos/usc-map/demo.js"],
  bundle: true,
  format: "iife",
  target: "safari17",
  minify: true,
  outfile: fileURLToPath(new URL("campus/campus.js", output)),
  plugins: [
    {
      name: "offline-directory",
      setup(b) {
        b.onLoad({ filter: /ios\.js$/ }, ({ path }) => ({
          loader: "js",
          contents: readFileSync(path, "utf8")
            .replace(
              "const response = await fetch('./locations.json')",
              `const response = {ok:true,json:async()=>(${locations})}`,
            )
            .replace(
              "input.value = window.location.href",
              "input.value = 'trojancompass://map?campus=1'",
            ),
        }));
      },
    },
  ],
});

await build({
  absWorkingDir: repo,
  entryPoints: ["mobile/Replica/interior.tsx"],
  bundle: true,
  format: "iife",
  target: "safari17",
  jsx: "automatic",
  minify: true,
  tsconfig: "web/tsconfig.json",
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: fileURLToPath(new URL("interior/interior.js", output)),
  plugins: [webPlugin()],
});
tailwind(
  "mobile/Replica/replica.css",
  "mobile/TrojanCompass/Resources/Replica/interior/interior.css",
);
writeFileSync(
  new URL("interior/index.html", output),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#990000"><title>Trojan Compass · USC Campus Maps</title><link rel="stylesheet" href="../fonts/fonts.css"><link rel="stylesheet" href="interior.css"></head><body><a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-3">Skip to content</a><div id="root"></div><script src="interior.js"></script></body></html>`,
);
writeFileSync(
  new URL("source.json", output),
  JSON.stringify(
    {
      sourceSHA256: sourceDigest(),
      campusHTMLSHA256: createHash("sha256")
        .update(read("demos/usc-map/index.html"))
        .digest("hex"),
      description:
        "Current API-backed web features hosted by Swift; native URLSession supplies transport for /api requests.",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Bundled original campus and interior UI, logo, fonts, tiles, model, and dances.",
);
