# Scene 08 connected corridor layout 122 — unaccepted candidate

This bounded pass changes whole portal, rail, hall/wing, pagoda and bridge/stair
assemblies. It does **not** solve the complete scene layout or establish
photographic fidelity. All ten scenes remain unaccepted. The final actual
frame still exposes excessive gray masonry across the reference's garden and
water opening; review that defect before selecting any of this branch.

The source is `reconstructions/scene-08/src/corridor-layout.js` plus the
corresponding assembly calls and supported floor construction in `src/scene.js`.
The fixed camera, postprocessing, lighting, PBR materials, selected cast plaque
asset and selected neutral112b rock scan/placement are retained. No reference
image, projection, billboard or reference RGB enters the runtime geometry.

## Whole-assembly changes

The entry frame has a 4.34 m centre-to-centre opening, yaw -.10 rad and real
column/beam/rafter/boarding seats. Its selected cast inner plaque remains one
unchanged five-part asset and moves with the left post. The low outer veranda
floor is .94 m, the raised entry floor is 1.40 m, joined by three 153 mm treads.
The new near guard follows a measured horizontal 3D plan line and has supported
turned balusters, a single substantial capped post and a coherent side return.

The primary hall's column interval is shorter, its eave is lower, and its
unsupported curved brown bonnet is removed. The receding wing's floor is
4.50 m while its roof datum is retained. Whole room and gallery floor heights,
foundations and supported platforms change together. The wing's former solid
raised plinth is replaced by six stone piers, load-bearing timber beams and a
closed stone/timber floor. Nominal hall floors now equal finished walking
surfaces rather than lying 120 mm below their timber boards.

The pagoda room height changes 2.67 → 1.90 m and tier pitch 3.05 → 2.75 m. The
top crown and spire tip retain world heights 21.976 and 26.068 m. A grounded
plinth supports the compact stack; no tower is left floating at a fitted anchor.

The bridge starts at `[1.90,2.95,-3.7]` and lands at the right gallery's actual
front threshold `[7.50189,4.2,-7.36591]`. The stone stair shares the low landing
and meets the middle-gallery floor at `[1.30,4.5,-7.1]`. Thick treads and two
inclined solid stone stringers replace full-height solid step boxes. Rail posts
sit 15 mm inside their supporting deck/tread edges. The middle platform also
has actual piers and bearing beams rather than a tall full-width infill wall.

These dimensions, terrace heights and depths are a single-view metric
hypothesis. The photo's partly occluded side-return upper-rail contour is not
matched by inventing an unsupported independent rail height. Existing hidden
roof/wall interiors are not exhaustively collision-tested.

## Measurements and structural checks

`measure-layout.mjs` records 15 hand-measured portal edges, hall columns/eaves,
receding wing edge, near handrail/post, pagoda crown/floors, bridge landings and
stair landing points under the unchanged camera. Approximate annotation
uncertainty is 10–25 px. Source-projected RMS changes 80.47 → 13.58 px. These
are sparse source contour measurements; they do **not** measure the whole-image
match, vegetation, material quality or the unresolved masonry occlusion.

The connection report verifies the 5 mm column/beam seat, zero beam/rafter and
rafter/boarding gaps, zero front-rail/entry-column collisions under expanded
box checks, shared bridge/stair low landing, gallery threshold heights/plan
registration, stair upper landing inside the platform, pier/beam/slab bearings,
and approximately 7.75 mm tread/stringer bearing overlap. It checks unchanged
lighting/material source chunks. It is not a universal zero-intersection proof.

```sh
node qa/ten-reference/08/layout122/measure-layout.mjs
```

Actual receipts also preserve final RNG state `2186526841`, the exact baseline
rock position and unchanged cast plaque/rock assets. The rock source geometry,
UVs and PBR data are not stretched or repainted by this change.

## Actual evidence and failed candidates

Exactly three 1254-square full wrapper jobs ran through the shared mutex:
`iteration-layout122-v1`, `v2` and `v3`. No browser bypass, suite, native crop or
independent-view render was used. The third job exhausted this bounded pass's
render allowance and geometry work stopped.

```sh
REFERENCE=8 SIZE=1254 ITERATION=layout122-v3 PORT=4722 node tools/render-one-reconstruction.mjs
```

All three actual reports have linked shaders, zero WebGL/context errors and
opaque nonempty frames. Those checks do not accept visual quality. All
`visualAccepted` flags remain false. Rendering preceded the commit, so reports
carry the base commit ID; per-file source hashes identify exact rendered code.

V1 is rejected for the large solid stair/plinth wall across the channel. V2
opens the stair and middle platform, but leaves the raised wing's solid plinth.
V3 opens that wing platform and fixes supported floor finishes, yet broad
inherited gallery/landing masonry still obstructs the photo's rocky garden
opening. V1 and V2 changed-source snapshots are byte-verified against their
actual reports and retained under `rejected-v1-source/` and `rejected-v2-source/`.

`photo-before-after-overview.png` labels half-size overview panels. The
architecture and unresolved-water comparisons are original-pixel crops. Their
script only crops/resizes/labels existing images and never modifies scene
pixels. Full actual frames remain in the iteration directories.

Other unresolved differences include roof/profile shape, the near side return,
portal vertical perspective under the fixed camera, vegetation scale/coverage,
stone-lantern form, materials, lighting and the complete site/terrain layout.
This is a reviewable major-layout candidate, not a finished match.
