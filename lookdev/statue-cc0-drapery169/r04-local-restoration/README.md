# Local restoration alternate

**Review `iteration-02/` as the stronger local alternate.** The first conservative pass remains in this folder with its actual comparison images. R03 is unchanged and remains the unmodified source donor consumed by owner165. Neither restoration pass is integrated or accepted as a finished statue.

The matched views show reduced front-knee erosion and smaller torso chatter while retaining the crossed-leg mass, long unequal U-folds, garment edges and all mounting rings. Gold still reveals larger stone undulation, deep residual pits and the untouched damaged shoulder/side regions. This is a bounded local improvement, not a clean-cast or Japanese-reference match. Further changes should be judged in the integrated native gold scene before broadening the repair.

## Actual before/after views

Open `iteration-02/comparison-views/` and compare each `before-r03` / `after-r04` pair:

- `knees-front-clay-*.png` and `knees-front-aged-gold-*.png`
- `knees-three-quarter-clay-*.png` and `knees-three-quarter-aged-gold-*.png`
- `torso-front-clay-*.png` and `torso-front-aged-gold-*.png`
- `torso-three-quarter-clay-*.png` and `torso-three-quarter-aged-gold-*.png`

All frames are actual Cycles geometry renders through the official FIFO. Each pair has exactly the same camera, physical lights, material and resolution. The R03 camera positions match the earlier donor review. The uniform aged-gold material uses metallic 0.92, roughness 0.34 and a physical area-light reflection; there are no source textures, photographs, normal maps or shader displacement. Iteration02 references the unchanged, previously FIFO-rendered R03 baseline frames with symlinks rather than duplicating those renders. PNG hashes and matching camera values are checked by `restoration-validation.json`.

## Alternate assets and mounting

Use `iteration-02/{crossed-knees-hips,torso-cloak-core}-surface-only.glb` or the two `.sc07.bin` files listed in `iteration-02/native-manifest.json`. `iteration-02/*-editable-mesh.npz` gives positions, normals and unchanged triangle arrays. The capped GLBs preserve every original R03 `hidden_mount_cap_*` node exactly, with distinct mounting materials.

The alternate has the **same frame, vertex order, triangle indices, source-face mapping and exact mount loops as R03**. It uses the R03 actual rear-seat surface origin and +Y up/+Z front. All R03 mount points/normals and cap geometry are byte-identical. The original R03 loop JSON, anchors and original source traces remain authoritative; they are referenced by path and SHA256 rather than duplicated or rewritten.

For owner165's clipped/bridged candidate, substitute the alternate source surface before applying the same local waist trim, or propagate changes through original source IDs. Do not apply R03-indexed deltas directly to a later mesh whose vertices were renumbered by clipping. No source head, hand, face, bridge or canonical scene file was changed here.

## Declared geometry restoration

This is a derived/restored **Chinese Tang dynasty CC0 donor by Daniel Pett**, a different artifact from Japanese reference06. Original source SHA256 remains `5834c2c7fc67c92b3bb258dc0aa5393bd79fd529358bfd33360bfeebae3335e7`.

The authoring uses only explicit front-knee erosion and front-torso chatter masks. Existing points are projected a bounded distance toward robust local quadratic surface fits. Spatial support remains local: 55 mm on knee patches, 28 mm on torso patches. A directional normal-variation test protects coherent folds; coherent sharp-edge chains are locked. The additional strong fold lock keeps 604 knee and 385 torso analysis groups exactly fixed. All mount vertices and their 14 mm buffers are fixed, with a 14–34 mm fade into the repair mask. No vertex welding is written to the output, and there is no remesh, global smoothing, new analytic body volume or texture-derived displacement.

| Iteration02 component | Position changes | Geometry-affected faces | Maximum movement | Declared displacement cap |
|---|---:|---:|---:|---|
| Front knee patches | 3,025 / 31,733 vertices | 5,573 / 49,798 | 6.196 mm | 10 mm outward / 3 mm inward |
| Front torso chatter | 3,775 / 20,857 vertices | 6,601 / 33,253 | 2.118 mm | ±3 mm |

These millimetres are in the **declared viewing-metre normalization where the original full scan height is 2.0**. Actual artifact dimensions are undocumented; these are not measured conservation dimensions. At owner165's optional uniform scale 2.406417, the maximum movements become about 14.91 mm / 5.10 mm in that model. The displacement vectors and caps are recorded explicitly so another scale can be assessed.

Positions outside the repair masks are exactly unchanged. Normals are recomputed only on moved-face neighborhoods, including their immediate shared vertices; mount and protected feature normals remain unchanged. All normal changes are recorded separately. The 75 mm neighborhood mean of the vertex displacement stays below 0.536 mm on knees and 0.068 mm on the torso; this supports the macro-form comparison but does not replace inspection of the actual frames. No source face flips remain.

## Exact delta and source trace

`iteration-02/*-restoration-deltas.npz` records:

- `vertexDelta`, `normalDelta`, `changedVertex`, `affectedFace`;
- spatial masks before/after the mount fade, boundary distances and locks;
- coherent crease/fold locks, feature-protection strengths, fit residuals/support counts;
- the original source mesh/face IDs affected by the geometry edits.

`iteration-02/normal-affected-original-faces.npz` additionally records faces affected by normal changes and their original source IDs. The original source triangle/barycentric traces remain untouched in R03. Adding each recorded vertex delta to the corresponding R03 position reconstructs the alternate. Triangle arrays and all cut loops remain identical.

`iteration-02/restoration-validation.json` verifies those deltas, topology, limits, unchanged points outside masks, locked features/mounts/caps, native-buffer equality, actual rendered GLB/PNG identities and all 16 matched views. `r03-immutability.json` verifies every R03 file byte-for-byte. These checks do not establish photographic fidelity or an accepted finish.

## Reproduce

From the repository root, with the existing numpy/scipy CPU interpreter:

```sh
lookdev/scene05-monumental-tower-v3/.venv/bin/python lookdev/statue-cc0-drapery169/restore-local-surface.py --variant iteration-02
RESTORATION_VARIANT=iteration-02 node tools/run-blender-queued.mjs lookdev/statue-cc0-drapery169/render-restoration-comparison.py
lookdev/scene05-monumental-tower-v3/.venv/bin/python lookdev/statue-cc0-drapery169/validate-local-restoration.py --variant iteration-02
```

The restoration author is plain CPU Python. Every actual physical image uses the official FIFO. No duplicate `.blend`, whole-source reconstruction, source head/hand restoration or automatic integration is involved. The exact first-pass authoring source is preserved as `iteration01-exact-builder-source.txt` alongside that pass's outputs and render receipt.
