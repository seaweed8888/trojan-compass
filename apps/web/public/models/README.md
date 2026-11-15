# Building models

Put building `.glb` or `.gltf` assets here, grouped by building ID. Public paths
start with `/models/`. Use licensed or team-created assets and record their source.
No real building models are included in this scaffold.

Keep mesh names, floor IDs, and coordinates aligned with `data/buildings/`.
Do not import React Three Fiber into a Server Component. The eventual viewer
should be a client component; keep browser-only model loading inside it.

## Trojan map guide

`tommy-trojan.glb` contains the user-supplied Animal Crossing character template,
recolored USC gold (#FFCC00), with ears removed and arms lowered. Its enlarged
round head wears the locally authored bronze Trojan helmet and cardinal crest.
The body, head, arms, and legs form one welded, smoothed skin. A 14-bone rig supports carrying and dances, with hips, spine, elbows, knees,
and feet. The crest follows the helmet from
front to back with a rearward sweep.
The shell uses uniform proportions; the compact crest follows the nose-to-nape
axis with a swept rear edge, based on this [helmet profile reference](https://unsplash.com/photos/a-man-wearing-a-helmet-with-a-long-black-hair-W8Gl1B_b06M).
The existing asset path is retained for the map integration.

The rounded shell, nose guard, shaped cheek plates, and flared nape take inspiration
from [the Met's Corinthian helmet](https://www.metmuseum.org/art/collection/search/250922).
The curved horsehair crest uses [Greek Phalanx reconstructions](https://www.thegreekphalanx.org/helmets)
as visual references. The body comes from `scripts/assets/animal_crossing_character.glb`,
copied from the user's supplied Downloads file. Original creator/license metadata
was not supplied; the helmet geometry is authored locally.

Rebuild with Blender 4.3 and the included source template; no authoring packages are required:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 4.3/blender.exe' --background --factory-startup --python scripts/build-tommy.py -- --render
```

The script checks finite vertices, model height, five animation pivots, fewer than
6,000 triangles, a connected watertight skin, and an asset below 200 KB. Two vertex-colored
materials separate brushed bronze from the matte figure and crest; there are no
texture downloads and only two material draw calls. The optional render
is written next to the GLB.

Coordinates export as Y-up, with feet at zero. The viewer scales the roughly
2.4-unit figure to a 4.1-metre marker for visibility. Set the model URL revision to
the first 12 lowercase characters of the finished GLB's SHA-256 hash in
`TommyTrojanModel.tsx` after replacing the file so existing tabs load the new model.

Carrying uses the local `mascot-motion.ts` clip: seven poses across the head and
four limbs (700 bytes of keyframe buffers). The head droops on a neck hinge while a
bounded two-axis spring swings the body around the nape. No physics engine, server
updates, or additional animation downloads are needed.


Double-click the placed guide (or focus its label and press D) to randomly play
one of three dances. Moving the pointer while pressed starts carrying instead;
a single click starts placement after the double-click window. Dances finish back
in the standing pose and stop when the guide is picked up.

`trojan-dances.json` contains only retargeted motion from the user's
`banana_fortnite.glb`, `fortnite_dj.glb`, and
`fortnite_frozen_nog_ops_with_old_school_emote.glb`. No source meshes or textures
ship. Rebuild after changing the rig with:

```powershell
node scripts/retarget-dances.mjs C:/Users/salty/Downloads
```

The baker restores inverse-bind poses, maps anatomical sides onto the guide's
screen-side bone names, and corrects Old School's Z-up animation axes. Torso
orientation follows joint positions; the helmet follows the chest during spins.
Limb lengths stay fixed, with floor clearance checked between keyframes.
The roughly 279 KB animation file loads once,
on demand. Update its SHA-256 URL revision in `TommyTrojanModel.tsx` after baking.
The source files stay outside the repo; their creator/license metadata was not
provided by the user.

Each double-click independently chooses one of the three clips with equal
probability. Consecutive repeats are allowed; this is not a shuffled playlist.
