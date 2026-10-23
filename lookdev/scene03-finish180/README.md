# Scene 03 — gable and daylight 180

This is an actual source/model/material candidate for root review. **Photographic fidelity remains unaccepted.** No completed-film claim is made.

The immutable starting point is actual174R03 source `d8c284e33a701cd38c91818ab4160e52b808326f9989cd83b542fa3abbcf42a2`. Its full/hero/low-three-quarter frames remain in the existing `qa/ten-reference/03/iteration-scene03-mass174-r03-*` directories. `r03-source/` preserves its source scripts and dependency manifest before this work; `r03-before-source-identity.json` pins the complete original source/assets.

## Current candidate

180R05 source hash: `15ff9e0f897a516c83bbdafe15ae8a38200d12f9f2b2c44d0d18763617168e0f`.

- A closed recessed gable diaphragm, actual individual timber planks, one deep cambered tie, a housed broad post and a curved heavy barge replace the exposed diagonal stick truss and pale apron assembly. The existing ceramic weather profile is retained.
- Two selectively fitted actual scanner-captured cloud-scroll shoulders replace the synthetic foliate gable part and seven repeated procedural height-study barge panels. The source is SCANOLOGY_3D's *Wood Carving of Dragon*, CC BY4.0, from the preserved176 package. Original component position, normal and index buffers remain unchanged. Uniform scale magnitude1.10 and one X reflection preserve its relief/aspect. The creator does not identify its culture, era or architectural role; this is a different artifact from the reference.
- Separate planar caps close the five measured source cut loops. The scan's pierced channels stay open. The combined source+caps have356,034 triangles, no zero-area triangles, no geometric boundary/nonmanifold edges and no opposed edge pairs at the published176 geometric tolerance. The timber diaphragm/tie/barge prototypes also audit closed with positive volume. These establish usable geometry, not historical/structural or photographic acceptance.
- Physically bounded gable lacquer pigment uses the retained CC0 cherry wood maps. The sky uses the same independent CC0 Poly Haven capture at4K, matching the existing provider metadata's byte count/MD5; the original2K bytes remain. Background, IBL and captured sun receive one shared0.24rad worldX rotation. This authored pure-sky orientation places its actual cumulus above the low eave; the effective key elevation is38.36 degrees. The renderer has finite LTC court fill and no solved diffuse GI.
- Four inherited lantern rods that stopped in open air are replaced by continuously tapered closed timber outriggers seated through the existing lower girt, folded bronze saddles, real hooks and full rods to the unchanged lamp-body tops. R04 high tips were rejected from the actual native view; R05 tips sit beneath the fascia.
- Actual reference camera, hall placement, bridge, stair and lotus source anchors remain unchanged. Both source hash checks and actual native report property comparisons are retained in `preserved-anchor-*-proof.json`.

The original complete174 roof/bearing/room work is retained. This pass does not change other scenes, shared tools, film assembly, Git state or the original actual scan bytes. No Blender authoring, blend export or ad-hoc graphics process was used.

## Actual review evidence

The full and hero subfrustum are real1254px native WebGL captures through `tools/render-one-reconstruction.mjs` and its official shared FIFO. A subfrustum is rendered from the unchanged reference camera, not enlarged from the saved full image.

- `qa/ten-reference/03/iteration-scene03-finish180-r05-20261023/reference.png`
- `qa/ten-reference/03/iteration-scene03-finish180-r05-20261023/detail-native.png`
- `qa/ten-reference/03/iteration-scene03-finish180-r05-low-3q-20261023/inspection-view.png` — independent model-review pose, not the photographic reference camera.

R01 through R04 source identities/snapshots, actual frames and honest rejection notes remain preserved. R03 full/hero/low-three-quarter are retained as the completed pre-lantern-support stage. R01 removed the stick frame but retained washed-out timber and an overly empty blue sky. R02 repaired the sky/key relationship and removed repeated barge panels but still had pale gable pigment. The R01 official ray probe identifies those bright patches as actual wood geometry. The initial coarse CPU audit tolerance and its corrected result are recorded separately.

## Reproduce the current native reviews

Run sequentially from the repository root; all jobs use the official shared FIFO:

```sh
REFERENCE=3 SIZE=1254 ITERATION=scene03-finish180-new-full DETAIL_CROP=470,80,740,1254 PORT=4583 node tools/render-one-reconstruction.mjs
REFERENCE=3 SIZE=1254 ITERATION=scene03-finish180-new-low3q VIEW_POSITION=19,3.7,8.5 VIEW_TARGET=8,10,-3 VIEW_FOV=64 PORT=4583 node tools/render-one-reconstruction.mjs
node --experimental-loader ./reconstructions/scene-03/tools/local-three-loader107.mjs lookdev/scene03-finish180/audit180.mjs
```

Inspect the actual frames before accepting or altering the candidate. Source and geometry validation do not settle the remaining broad photograph/material/garden/ornamental differences. The current camera and monumental mass remain in-place hypotheses from106/174, not a measured reconstruction of hidden structure.
