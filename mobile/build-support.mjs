import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repo = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
export function sourceDigest() {
  const files = [
    "package-lock.json",
    "mobile/build-support.mjs",
    "mobile/Replica/build.mjs",
    "mobile/Replica/interior.tsx",
    "mobile/Replica/api-bridge.mjs",
    "mobile/Replica/replica.css",
    "mobile/Viewer/build.mjs",
    "mobile/Viewer/export-catalog.mjs",
    "mobile/Viewer/viewer.tsx",
    "mobile/Viewer/viewer.css",
    "web/public/models/tommy-trojan.glb",
    "web/public/models/trojan-dances.json",
  ];
  function walk(relative) {
    for (const entry of readdirSync(resolve(repo, relative), {
      withFileTypes: true,
    })) {
      const path = relative + "/" + entry.name;
      if (entry.isDirectory()) walk(path);
      else files.push(path);
    }
  }
  walk("web/src");
  for (const name of readdirSync(resolve(repo, "demos/usc-map")))
    if (/\.(js|json|css|html)$/.test(name)) files.push("demos/usc-map/" + name);
  const hash = createHash("sha256");
  for (const path of files.sort()) {
    const data = readFileSync(resolve(repo, path));
    hash
      .update(path)
      .update("\0")
      .update(
        path.endsWith(".glb")
          ? data
          : data.toString("utf8").replaceAll("\r\n", "\n"),
      );
  }
  return hash.digest("hex");
}
export function tailwind(input, output) {
  const pkg = require.resolve("@tailwindcss/cli/package.json");
  const bin = JSON.parse(readFileSync(pkg, "utf8")).bin.tailwindcss;
  execFileSync(
    process.execPath,
    [resolve(dirname(pkg), bin), "-i", input, "-o", output, "--minify"],
    { cwd: repo, stdio: "inherit" },
  );
}
export function webPlugin() {
  const model =
    "data:model/gltf-binary;base64," +
    readFileSync(resolve(repo, "web/public/models/tommy-trojan.glb")).toString(
      "base64",
    );
  const dances = readFileSync(
    resolve(repo, "web/public/models/trojan-dances.json"),
    "utf8",
  );
  return {
    name: "bundled-web",
    setup(b) {
      b.onResolve({ filter: /^next\/(dynamic|navigation|image)$/ }, (args) => ({
        path: args.path,
        namespace: "standalone-next",
      }));
      b.onLoad({ filter: /.*/, namespace: "standalone-next" }, ({ path }) => ({
        loader: "tsx",
        resolveDir: repo,
        contents:
          path === "next/dynamic"
            ? "import React from 'react'; export default (load) => React.lazy(() => load().then(c => ({default:c.default || c})));"
            : path === "next/navigation"
              ? "export const useSearchParams = () => new URLSearchParams(window.location.search);"
              : "import React from 'react'; export default function Image({priority,fill,unoptimized,...props}) {return <img {...props}/>}",
      }));
      b.onLoad({ filter: /TommyTrojanModel\.tsx$/ }, ({ path }) => ({
        loader: "tsx",
        contents: readFileSync(path, "utf8")
          .replace(
            /['"]\/models\/tommy-trojan\.glb\?[^'"]*['"]/,
            JSON.stringify(model),
          )
          .replace(
            /fetch\(['"]\/models\/trojan-dances\.json\?[^'"]*['"]\)/,
            `Promise.resolve({ok:true,json:async()=>(${dances})})`,
          ),
      }));
    },
  };
}
