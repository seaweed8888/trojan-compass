# Versioned building snapshots — teammate-owned

Development loads the bundled publication in `current.json` through `loadSnapshots()`. These are unverified building illustrations, not a reviewed campus navigation dataset. Production startup rejects unreviewed/demo provenance.

The supported authoring layout is:

```text
current.json                         # {"dataVersion":"usc-interiors-2026-11-14"}
<dataVersion>/manifest.json          # version and buildingIds
<dataVersion>/buildings/<id>/
  building.json
  floors.json
  places.json
  scene.json
  geometry/<floorId>.json
  navigation/topology.json
  navigation/walkable-areas.json
  navigation/barriers.json
  navigation/connectors.json
```

`publication-navigation.ts` converts this source into the internal `NavigationSource`: floor polygons, explicit doors, named connectors and place-access bindings. It rejects obstructed access-point/connector nodes, excludes invalid corridor nodes/edges, and may reconnect corridor components only through unobstructed published public floor space. It preserves all building/place IDs, floor elevations and original source files. It never upgrades unknown accessibility to verified. Runtime graphs and request-local picks are derived data, not authoring files.

The loader also accepts `{currentVersion, availableVersions}` with a `dataset.json` for each retained version. Such a bundle contains `dataVersion`, `buildings`, `places`, `scenes`, `floorGeometry`, and `navigation`, as defined by `snapshot-store.ts`. This alternate format supports up to eight retained versions; the current authoring-file pointer serves one version.

Validate with `npm run validate:data --workspace=@trojan-compass/api -- /absolute/path/to/snapshots`. For production admission checks set `NODE_ENV=production`. Publish a new version completely before atomically updating its pointer and restarting replicas; never overwrite a published version. Configure public HTTPS `VIEWER_BASE_URL` and `PUBLIC_API_BASE_URL` for native clients. Local defaults point to the development servers.

See `docs/backend-guide.md` for field-level source requirements and `docs/integration-review.md` for the known gaps in the current LAW publication. The synthetic fixtures in tests and `shared/contracts/` are not verified USC access data.
