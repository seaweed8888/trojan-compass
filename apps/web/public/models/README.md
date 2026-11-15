# Building models

Put building `.glb` or `.gltf` assets here, grouped by building ID. Public paths
start with `/models/`. Use licensed or team-created assets and record their source.
No real building models are included in this scaffold.

Keep mesh names, floor IDs, and coordinates aligned with `data/buildings/`.
Do not import React Three Fiber into a Server Component. The eventual viewer
should be a client component; keep browser-only model loading inside it.
