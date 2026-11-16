import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { sourceDigest } from "../mobile/build-support.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = root + "mobile/TrojanCompass/Resources/Replica/";
const original = readFileSync(
  root + "demos/usc-map/index.html",
  "utf8",
).replaceAll("\r\n", "\n");
const copy = readFileSync(bundle + "campus/index.html", "utf8").replaceAll(
  "\r\n",
  "\n",
);
assert.equal(
  copy,
  original.replace(
    '<script src="demo.js?v=campus-modes-1" type="module"></script>',
    '<script src="campus.js"></script>',
  ),
);
assert.deepEqual(
  readFileSync(bundle + "images/trojan-compass.png"),
  readFileSync(root + "web/public/images/trojan-compass.png"),
);
assert.deepEqual(
  readFileSync(bundle + "campus/assets/trojan-compass.png"),
  readFileSync(root + "web/public/images/trojan-compass.png"),
);
assert.deepEqual(
  readFileSync(root + "mobile/TrojanCompass/Assets.xcassets/AppIcon.appiconset/AppIcon.png"),
  readFileSync(root + "web/public/images/trojan-compass.png"),
);
assert.deepEqual(
  readFileSync(bundle + "campus/demo.css"),
  readFileSync(root + "demos/usc-map/demo.css"),
);
for (const m of copy.matchAll(/(?:src|href)="\.\/([^"#?]+)(?:[^\"]*)"/g)) {
  assert.ok(
    existsSync(bundle + "campus/" + m[1]),
    "Missing campus asset: " + m[1],
  );
}
const css = readFileSync(bundle + "fonts/fonts.css", "utf8");
assert.ok(css.includes("Source Sans 3") && css.includes("Source Serif 4"));
for (const m of css.matchAll(/url\(([^)]+)\)/g))
  assert.ok(existsSync(bundle + m[1].replace(/^\//, "")));
const interior = readFileSync(bundle + "interior/interior.js", "utf8");
for (const text of [
  "Search rooms",
  "Search & tools",
  "Map layers",
  "data:model/gltf-binary;base64,",
])
  assert.ok(interior.includes(text), "Missing original screen/asset: " + text);
assert.ok(
  !interior.includes("fetch('/models/"),
  "Model assets must load offline",
);
assert.ok(
  readFileSync(bundle + "campus/campus.js", "utf8").includes(
    "trojancompass://map?campus=1",
  ),
);
const source = JSON.parse(readFileSync(bundle + "source.json", "utf8"));
assert.equal(
  JSON.parse(
    readFileSync(
      root + "mobile/TrojanCompass/Resources/Viewer/source.json",
      "utf8",
    ),
  ).sourceSHA256,
  sourceDigest(),
  "Rebuild the native viewer after source changes",
);
assert.equal(
  source.campusHTMLSHA256,
  createHash("sha256").update(original).digest("hex"),
);
assert.equal(
  source.sourceSHA256,
  sourceDigest(),
  "Rebuild mobile assets after source changes",
);
assert.ok(
  interior.includes("CompassReplicaTransport"),
  "Interior must use native API transport",
);
assert.ok(
  interior.includes("Get directions"),
  "Current API routing UI must be bundled",
);
assert.ok(
  !interior.includes("routing is coming soon"),
  "Do not resurrect prototype routing",
);
const { dataVersion } = JSON.parse(
  readFileSync(root + "server/data/snapshots/current.json", "utf8"),
);
const preview = JSON.parse(
  readFileSync(
    root + "mobile/TrojanCompass/Resources/preview-scenes.json",
    "utf8",
  ),
);
assert.equal(preview.dataVersion, dataVersion);
const ids = JSON.parse(
  readFileSync(
    root + "server/data/snapshots/" + dataVersion + "/manifest.json",
    "utf8",
  ),
).buildingIds;
assert.deepEqual(
  preview.scenes.map((s) => s.building.id),
  ids,
);
for (const { building, floors } of preview.scenes) {
  const directory =
    root +
    "server/data/snapshots/" +
    dataVersion +
    "/buildings/" +
    building.id +
    "/";
  assert.deepEqual(
    building,
    JSON.parse(readFileSync(directory + "building.json", "utf8")),
  );
  const places = JSON.parse(readFileSync(directory + "places.json", "utf8"));
  for (const floor of floors) {
    assert.equal(floor.dataVersion, dataVersion);
    assert.deepEqual(
      floor.geometry,
      JSON.parse(
        readFileSync(
          directory + "geometry/" + floor.floor.id + ".json",
          "utf8",
        ),
      ),
    );
    assert.deepEqual(
      floor.places,
      places.filter((p) => p.floorId === floor.floor.id),
    );
  }
}
for (const row of JSON.parse(
  readFileSync(root + "shared/fixtures/fixture-index.json", "utf8"),
)) {
  const name = row.file.split("/").at(-1);
  assert.deepEqual(
    readFileSync(root + "mobile/TrojanCompass/Resources/Fixtures/" + name),
    readFileSync(root + "shared/fixtures/" + row.file),
  );
}
console.log(
  "Original campus HTML/CSS/logo, local assets/fonts, interior UI, and source provenance checks passed.",
);
