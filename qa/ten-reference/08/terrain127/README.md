# Scene08 terrain127 — rejected whole-site candidate

This unmerged branch starts at foundation126 commit
`75d7a096d2268cc1803001052315b8442f0c097e`. Both permitted actual jobs are
complete. Geometry work has stopped. **Do not merge this candidate or call the
site coherent or photographically complete.** All ten references remain
unaccepted. The final CPU audit deliberately exits with failure because it
finds six floor/foundation intersections, described below.

## Physical ground hypothesis

`src/terraced-banks.js` constructs a closed 40 × 21.2 m soil/rock volume between
world Z−24 and Z−2.8, with its underside at Y−1.6. The final solid has 103,712
triangles and positive signed volume 3952.2167 m³. The broad rear benches
approach Y3.3–3.7 near Z−9; the west/east banks descend toward the bridge and
foreground. These levels are inferences from one photograph, not a surveyed
site or a unique recovered depth solution.

The retained foreground terrain triangles and props at authored Z≥−2.8 are
not regraded. The selected real rock keeps its original mesh, UV/PBR arrays,
rigid transform and terrain placement. Main camera/postprocessing, portal,
near rail, fitted main hall/wing, tower, bridge/stair coordinates, lights and
material palettes are unchanged. Actual source comparisons cover the relevant
architecture blocks and protected files; the original RNG state remains
2186526841. Whole rear assemblies move only to ground them and resolve their
inherited roots inside building plans.

The first candidate retained a level Y1 water reach behind the bridge. It left
long exposed bridge piers and a smooth cut bank in the actual view. Its source,
CPU audit, full frame and actual native subfrustum remain preserved. V2 instead
has a genuine descending rock-bed rill, with water shelves at Y2.30, 2.20,
2.10, 1.62 and 1.28 joining the retained foreground Y1 reach at Z−2.8. The new
rear water is real sloping 3D mesh using the existing physical water material;
the unchanged foreground uses its original planar reflector/shader mapping.
This rear hydraulic profile is another explicit inference. It is not a
photograph projection, a replacement image or a claim that the photograph
proves a waterfall at those metric levels.

Earth and stone provide bearing volumes. Existing rock/moss materials are
used; the separate moss cover follows genuinely shallow bank slopes. The
identified bridge cap and both flanking piers remain supported. Foundation126
feet now covered by fill retain positive embedded bodies; bridge footing tops
are bounded below their pier heads so rising soil cannot invert a support.
No known support is merely removed or concealed by newly scattered foliage.

## Necessary building and planting coupling

Three retained low galleries needed dry courts and higher floors; keeping
old floors under the new soil would bury their walls. Their plans, roof
profiles and world eave datums remain fixed. Finished floors rise and the
actual wall/column heights shorten by the same amount:

| Gallery | Soil court | Finished floor | Eave | Clearance under lowest continuous beam |
| --- | ---: | ---: | ---: | ---: |
| West, origin (−3.25,.1,−10) | 3.40 | 3.60 | 6.50 | 1.97 m |
| East, origin (6.8,0,−13) | 2.30 | 2.50 | 5.30 | 1.87 m |
| Rear, origin (1.7,0,−18) | 1.30 | 1.50 | 4.40 | 1.97 m |

The third call was discovered during integration and reported to the parent.
These are structural changes needed by the ground model, not independent
screen-coordinate height fits.

79 authored rear boulders move as complete rock/moss pairs to sampled soil.
52 rear tree/shrub/lantern root records include their new soil contact.
Trees retain connected trunks/branches and shorten trunk height as the roots
rise, preserving approximate authored crown tops without scaling leaf meshes.
Shrubs and small ground cover keep their generated shapes. There are 288
whole-assembly relocations, including small ferns/flower groups, where an
original root lay inside a floor plan, underwater, or beside a bank rising
through its crown. A deterministic nearest clear soil search moves each
assembly; it never resamples the random layout. This does change rear X/Z
positions where necessary. No foreground assembly is relocated.

## Checks and the unresolved structural failure

Run the actual CPU geometry audit with:

```sh
node --max-old-space-size=4096 qa/ten-reference/08/terrain127/cpu-audit.mjs
```

Texture pixels are placeholders in this CPU-only harness; real glTF buffers,
procedural vertices and Float32 instance matrices are loaded. The script
instruments source calls in memory, without editing runtime files. It checks:

- All 33 new ground/foundation solids are finite, closed by indexed edges and
  positive volume; all nine foundation feet remain embedded and every pier
  retains positive height and its cap contact.
- Root heights agree with actual bank mesh rays to within 2e−5 m. Root
  penetration is .025 m. No recorded root lies within a building floor plan.
  The 39 shrub crowns clear surrounding sampled soil by at least .15976 m.
  These are local checks, not an exhaustive crown/wall/roof collision proof.
- All three legacy floors are .20 m above their court soil and their eaves
  stay exact. Protected architecture/material/light source remains exact.
- Actual V2 counts are 443,620 instances and 15,715,142 triangles, exactly
  matching the CPU scene. Final source hashes and all three rejected V1 source
  snapshots match their respective actual GPU receipts.
- Original-camera rays at (750,930), (730,970), (750,1005), (800,1010) now first
  hit the actual rear water mesh. Other rays still hit real supports or rocks;
  a genuine section opening alone is not treated as a visible photographic fit.

**The complete audit fails `legacyFloorsClearOfOtherBuildingFoundations`.**
Preserving the old overlapping building plans while raising their floors does
not create a coherent shared building. Six sampled points .005 m above the
new floors lie inside another assembly's actual solid stone box:

| Raised gallery floor sample, world XYZ | Actual intersecting structure |
| --- | --- |
| (−6.1744,3.605,−6.3340) | Fitted main hall solid plinth |
| (−2.8279,3.605,−6.7715) | Fitted main hall solid plinth |
| (.0965,3.605,−10.4375) | Middle-gallery stone pier |
| (6.8,2.505,−13) | Right-gallery broad stone base |
| (6.8,2.505,−9.832) | Right-gallery broad stone base |
| (6.2,1.505,−15.448) | East legacy gallery solid base |

`physical-audit.json` includes exact source stacks, groups, instance IDs and
point containment evidence. Positive volumes and contact checks do not
cancel these known intersections. Further work would need to integrate the
shared building/foundation boundaries and access levels coherently, with
supported shared floors/walls; another isolated bank or pier adjustment is
not sufficient. This pass does not hide that remaining defect to satisfy its
initial scope.

## Actual evidence and visual rejection

Exactly two full 1254px jobs used the shared render wrapper/mutex:

```sh
REFERENCE=8 SIZE=1254 ITERATION=terrain127-v1 PORT=4737 DETAIL_CROP=560,750,400,1254 node tools/render-one-reconstruction.mjs
REFERENCE=8 SIZE=1254 ITERATION=terrain127-v2 PORT=4738 node tools/render-one-reconstruction.mjs
```

V1 includes a separate native 3D subfrustum. V2 has a full actual frame; its
comparison crop uses original pixels from that full frame. No extra browser,
suite or render loop was used. Reports retain the exact render source hashes;
`sourceCommit` is 75d7 because rendering preceded this QA/source commit.

The final view remains visibly wrong: water shelves read broad and flat
green, the bridge flank/foot still dominates the narrow opening, the central
pine/lantern group proportions differ from the photo, and the garden's rock
and foliage contours remain misplaced. The regular stone courses and much of
the inherited foliage still look procedural. Both candidate statuses remain
`visualAccepted:false` despite valid shaders and nonempty actual pixels.

- `photo-before-after-overview.png`: photo / foundation126 / V2 overview.
- `photo-before-v1-native.png`, `photo-before-v2-native.png`: original-pixel
  500×360 comparisons at the water/bank/bridge area.
- `grade-sections.png` / `.svg`: actual mesh cross-sections, old grade, water
  shelves and support feet; `draw-sections.py` reproduces the diagram.
- `physical-audit-v1.json`, `grade-sections-v1.png`, `rejected-v1-source/`:
  preserved failed first candidate. The historical V1 audit predates the final
  cross-building containment check and is not full-site acceptance.
- `source-provenance.json`: exact identities, candidate limits and rejection.
