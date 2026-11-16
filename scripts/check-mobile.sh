#!/bin/bash
set -euo pipefail
COMPASS_REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPASS_BUILD_DIR="${COMPASS_CHECK_DIR:-$COMPASS_REPO_ROOT/mobile/.build/manual}"
mkdir -p "$COMPASS_BUILD_DIR"
COMPASS_FLAGS=(-swift-version 5 -parse-as-library -module-cache-path "$COMPASS_BUILD_DIR/modules")
# Optional compiler-only overlay for a locally inconsistent Command Line Tools install.
if [[ -n "${COMPASS_SWIFT_OVERLAY:-}" ]]; then
  COMPASS_FLAGS+=(-vfsoverlay "$COMPASS_SWIFT_OVERLAY")
fi
cd "$COMPASS_REPO_ROOT"
swiftc "${COMPASS_FLAGS[@]}" -strict-concurrency=complete \
  mobile/TrojanCompass/Core/CompassModels.swift \
  mobile/TrojanCompass/Core/CompassAPIClient.swift \
  mobile/Tests/VerifyFixtures.swift -o "$COMPASS_BUILD_DIR/fixtures"
swiftc "${COMPASS_FLAGS[@]}" mobile/TrojanCompass/Core/*.swift \
  mobile/Tests/StateChecks.swift -o "$COMPASS_BUILD_DIR/state-checks"
ln -sfn "$COMPASS_REPO_ROOT/mobile/TrojanCompass/Resources" "$COMPASS_BUILD_DIR/Resources"
python3 - "$COMPASS_REPO_ROOT" "$COMPASS_BUILD_DIR" <<'PY'
from pathlib import Path
import json,sys
repo,build=map(Path,sys.argv[1:])
index=json.loads((repo/'shared/fixtures/fixture-index.json').read_text())
for row in index:
    row['file']='Resources/Fixtures/'+Path(row['file']).name
(build/'fixture-index.json').write_text(json.dumps(index))
PY
"$COMPASS_BUILD_DIR/fixtures" "$COMPASS_BUILD_DIR"
"$COMPASS_BUILD_DIR/state-checks"
swiftc "${COMPASS_FLAGS[@]}" -typecheck -whole-module-optimization \
  mobile/TrojanCompass/Core/*.swift mobile/TrojanCompass/Views/*.swift \
  mobile/TrojanCompass/TrojanCompassApp.swift
npx tsc --project mobile/Viewer/tsconfig.json --noEmit
plutil -lint mobile/TrojanCompass/Info.plist mobile/TrojanCompass.xcodeproj/project.pbxproj
