# CC0 Tang cloth donor169

The reviewed handoff is **r03**. These are actual extracted 3D scan surfaces for a sculpture foundation, with source-preserved unequal robe folds and broad crossed-leg mass. They are not a completed statue or a photographic match. The native scene owner inspected the r03 clay front/three-quarter/close views and confirmed the leg mass, crossed-ankle structure and unequal gravity folds improve on the rejected analytic pillow/rib forms.

The source is Daniel Pett's **Seated figure of Buddha**, a **Chinese Tang dynasty marble sculpture**, described by its creator as Freer-Sackler object F1917.243. It is a different artifact from the Japanese gilt Buddha in reference06. The source head, damaged wrists and fractured lower plinth are excluded. Remaining knee erosion and the ragged low robe edge are visible in the actual geometry and remain unfinished.

## Use the surfaces

| Component | Source-only GLB | Original whole triangles | Boundary fragments | Native SC07 |
|---|---|---:|---:|---|
| Crossed knees / hips | `r03/crossed-knees-hips-surface-only.glb` | 46,884 | 2,914 | `r03/crossed-knees-hips-source-surface.sc07.bin` |
| Torso cloak core | `r03/torso-cloak-core-surface-only.glb` | 31,300 | 1,953 | `r03/torso-cloak-core-source-surface.sc07.bin` |

The source-only GLBs total about 2.3 MB; both native buffers total about 2.7 MB. `r03/native-manifest.json` uses the project's SC07 layout: 20-byte header, float32 positions/normals/neutral zero UVs, uint32 triangle indices. `load-donors.js` is an optional Three.js loader that returns both meshes, the actual anchors and the mount loops without centering or deforming them.

The matching `r03/crossed-knees-hips.glb` and `r03/torso-cloak-core.glb` add **separate removable `hidden_mount_cap_*` mesh nodes**. Their darker planar surfaces are newly made mounting closures, not original cloth. Each closure is individually named by its cut plane. Use the source-only geometry when bridging into the statue; remove the relevant cap before adding a neck, arm, waist or lotus mount. Preserve the source front cloth while fitting those bridges. The torso and lower piece intentionally overlap by 0.030 source-normalized units at the waist; remove the duplicated hidden overlap when joining rather than using a global remesh/smooth pass.

`r03/*-editable-mesh.npz` contains indexed position/normal/triangle arrays plus separate cap arrays for CPU authoring. `r03/*-source-trace.npz` maps every retained triangle to its original source mesh/face and every output vertex to its original vertex or barycentric point. Removed detached crop fragments have their own face trace. New boundary vertices remain on the original source triangle planes.

Trace mesh IDs are indices 0–3 in the **original source GLB mesh array**. A source triangle ID is its index within that primitive's original index triples; a source vertex ID is its original POSITION accessor index. They are not Blender-import vertex IDs. Loop vertex indices directly address the source-only GLB, NPZ and SC07 surface arrays, whose order is identical. Source UVs/textures were omitted; the native buffers carry neutral zero UVs for the new physical material.

## Coordinates and mounts

Both components share **+Y up, +Z front, +X viewer right**. Their common origin is an actual rear seat-cut scan-surface point, with original face/barycentric trace:

```
source-normalized rear seat surface = [0.0199711604, 0.555, -0.5319935117]
component point = source-normalized point - this origin
source mesh 2, source triangle 22163
barycentric = [0.2397072961, 0.6306990495, 0.1295936544]
```

This origin is a surface mount point, not the torso center or bbox center. `r03/surface-anchors.json` gives exact retained front/back seat, waist, neck and knee surface points. Every one was verified against its original triangle and a retained component. The torso's real rearward setback and lateral asymmetry are intentionally retained.

| Component | Min [x,y,z] | Max [x,y,z] |
|---|---|---|
| Knees/hips | [-.695629,0,-.020231] | [.597784,.255,1.120062] |
| Torso cloak | [-.348408,.225,-.118404] | [.352638,.935,.464238] |

`r03/*-mount-loops.json` gives actual indexed perimeter points, ordered coordinates, plane names, bounds and perimeters. It also explicitly identifies new straight mounting connector edges where two crop planes intersect. The main seat loop has 1,218 vertices; the torso waist loop 343; the neck loop 187; the arm loops 348/435. Arithmetic loop centers are marked as non-surface centers and must not be substituted for the actual traced anchors.

The source's physical dimensions are undocumented. The original inspection normalized its full height to 2.0 viewing units; these outputs retain that inferred viewing-metre normalization. The raw source-to-normalized matrices are in `r03/manifest.json`. No physical metre claim is made. An optional **uniform scale 2.4064171123** puts the neck cut at the existing owner165 model height 2.25 above the seat and gives a knee span 3.11249. It does not align the neck in X/Z or flatten the source's anatomy; fit the head and sleeves to the actual rings.

All cut planes are documented in the manifest in the source-normalized frame. The lower donor keeps Y 0.555–0.810 and clips only the rear upper-right sleeve remnant with X+Y−0.5Z≤1.2. The torso keeps Y 0.780–1.490 inside two slanted arm mounting cuts. Only detached scan/crop fragments were removed. Original scan vertices/normals/whole triangles were preserved; there is no nonrigid restoration, displacement, smoothing, texture-to-mesh conversion or remeshing.

## Real clay evidence and evaluation

Inspect `r03/clay-views/assembly-front-clay.png`, `assembly-three-quarter-clay.png`, `knees-front-close-clay.png`, `knees-three-quarter-close-clay.png`, `torso-front-close-clay.png`, `torso-three-quarter-close-clay.png`, and `assembly-side-mount-check.png`. All are actual Cycles geometry views produced with the official FIFO. No photograph, source texture, normal map, image plane or AI replacement frame is present.

The broad knee forms and long unequal U-folds are useful structural donors. The right rear sleeve stump and detached wrist shard from the first crop were removed; explicit removable caps replaced the open mounting apertures. **Front-knee erosion, a ragged low hem, and visible planar mounting surfaces remain.** The neutral support in the clay views is only a mount context. These parts need local bridges and a finish decision under the scene's gold material before scene acceptance. Existing damage should be addressed locally and declared if changed, rather than smoothing all original folds. Clay output does not establish WebGL equivalence or reference-photo acceptance.

`r03/handoff-validation.json` verifies that the current GLBs are byte-identical to the rendered GLBs, SC07 arrays match the GLB source meshes exactly, every source trace and anchor reconstructs correctly, and the loop coordinates match the native buffers. Position/normal differences are below 1.2e-7 at float32 export precision. These identity checks do not establish photographic quality.

## Rebuild and provenance

From the repository root, using a Python with numpy:

```sh
lookdev/scene05-monumental-tower-v3/.venv/bin/python lookdev/statue-cc0-drapery169/build-components.py --revision r03
DRAPERY_REV=r03 node tools/run-blender-queued.mjs lookdev/statue-cc0-drapery169/render-components.py
lookdev/scene05-monumental-tower-v3/.venv/bin/python lookdev/statue-cc0-drapery169/validate-handoff.py
```

The builder is pure CPU Python and does not call Blender. All physical output uses the official shared FIFO. No `.blend` duplicates or original scan copies were made here. r01 is preserved with its actual renders and recorded crop failures; r02 is the intermediate cleaned crop, superseded before rendering. r00 is the actual source coordinate-band inspection.

Original unchanged source: `../buddha-fullscan-source-v1/sources/pett-tang-seated-buddha-cc0/source-objaverse.glb`.

SHA256: `5834c2c7fc67c92b3bb258dc0aa5393bd79fd529358bfd33360bfeebae3335e7` (11,193,208 bytes, 299,526 source triangles).

[Original creator model](https://sketchfab.com/3d-models/seated-figure-of-buddha-a4d22eb6d3c44848bd49b89fb4c28759), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The locally acquired primary creator metadata, license notice and provenance are in the source directory. This donor uses no Sainsbury/CC-BY-NC geometry and no NMS point-cloud reconstruction.
