# Scene06 local nasal repair, based on 8082e52

Unaccepted local candidate on `work/face06-nasal-repair-20261019`. Only scene06 geometry/loader/documentation and QA06 are changed. Base 86, rejected first attempt 87, and unaccepted second attempt 88 remain available.

`comparison-photo86-87-88.png` is a labeled review layout. The reference is a 95 × 95 photograph crop at `(584,331)` enlarged for comparison only. The other panels are actual native subfrustum frames reduced to fit the layout, all from the original reference camera. The comparison is not supplied to the mesh builder, material or scene renderer.

The visible openings were true absent frontal mesh intersections. The repair closes them with fused solids; a second local vertex sculpt reduces their spherical shape. Final native inspection still shows flattened paired alae and seams. The learned thick lips and remaining face differences were kept fixed. Neither 87 nor 88 is accepted as a photographic match.

Reproduce authoring, in order, through the shared mutex:

```sh
node /Users/mima1234/temple-cinema-live-sync/tools/run-blender-queued.mjs /Users/mima1234/temple-face06-nasal-repair-20261019/reconstructions/scene-06/tools/repair-central-nasal-v03.py
node /Users/mima1234/temple-cinema-live-sync/tools/run-blender-queued.mjs /Users/mima1234/temple-face06-nasal-repair-20261019/reconstructions/scene-06/tools/fair-central-nasal-v04.py
```

The two native rounds used `WORKTREE` set to this tree, `REFERENCE=6`, `SIZE=1254`, `DETAIL_CROP=584,331,95,1254`, and `ITERATION=nasal87` / `nasal88`. Their reports bind exact source/asset identities. No movie or test suite was run. GL/frame validity establishes that these are real renders, not that the anatomy is accurate.

Upstream provenance remains `lookdev/local-triposg-head/METHOD-NOTE.md`: original MIT TripoSG explicit geometry derived from a labeled AI grey sculpture guide. The original photo stays a comparison input. This repair only reads that existing mesh; no image, scene photo texture, learned depth map or replacement still is projected into it.
