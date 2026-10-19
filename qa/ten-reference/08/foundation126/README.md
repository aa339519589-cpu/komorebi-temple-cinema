# Scene08 foundation126 — physical correction, visually unaccepted

This branch follows exact CPU diagnosis commit
`3ccd1fa1e1bd16e7b0ab10f1efc6439a39879153` and its unmerged v3 layout. It is
not a solved site layout or a photographic match. The one permitted full/native
render is complete and geometry work stopped. Do not describe this candidate
as merged or accepted; all ten scenes remain unaccepted.

## Supported geometry replacing the two identified broad blocks

The low bridge abutment was a 1.05 × 2.10 × 1.70 m solid box at
`[1.9,1.75,-3.7]`. It crossed 1.60624 m² of actual water plane and its .70 m
bottom was 1.10 m above the actual bed at -.40 m. It is now replaced by:

- A closed .24 m thick stone landing cap retaining its original 1.05 × 1.70 m
  plan and top Y2.80. The first bridge board underside is Y2.795264, providing
  4.736 mm of actual bearing overlap; stair stringer seats remain in the cap.
- Two battered, individually closed coursed stone piers at transverse ±.55 m,
  with equal heads at cap underside Y2.56. Footing levels are sampled from the
  actual terrain/real rocks and are different on the two sides.
- Real terrain-following footing undersides, eight perimeter samples plus a
  separate centre sample each, embedded at least .08 m. This fills the old
  unsupported gap rather than leaving a floating floor.
- A physical centre bay at least .60 m wide, with 1.56 m clear height above the
  Y1.00 water surface. It is not an image mask or a foliage concealment.

The independent wing lower box, 4.7 × 1.8 × 8.8 m, formerly crossed .752825 m²
of the water plane. It is replaced by six separate sampled stone footings at
the six unchanged upper-pier plan coordinates. All caps retain the original
Y1.50 pillar-foot datum, and all original beam spans, Y3.86 pier heads and Y4.50
finished floor remain. Only the identified middle-right upper pier is recoursed
inside its original .40 × .44 × 2.36 m contact envelope; it is not removed.

The high bridge-end solid body is unchanged. A shallow terrain-following sole
is added below its existing Y.95 bottom to fill the measured centre-ground gap.
One corner sits deep in an existing rock: the maximum recorded embedding there
is .689 m. The other new feet embed .08 m, with one wing-foot corner .155 m.
This rock intersection is disclosed; it is not an exhaustive terrain Boolean
or geotechnical analysis.

The original middle-gallery supports, hall layout, bridge width/landings,
camera, lights, selected real scan, cast plaque and materials are unchanged.
No photograph RGB, projection, reference depth or replacement frame is used.

## Actual physical checks and sections

`physical-audit.json` comes from a full CPU build of the actual scene, with
texture pixels omitted only for ray geometry. It verifies:

- 47 new geometries are finite, closed by indexed edges and positive volume.
- All nine footings have actual sampled embedding; cap/pier contact gaps are
  zero, and the six wing caps keep their prior bearing height.
- Nine local bridge-section rays pass through genuinely empty centre space.
- The 42 other diagnosed structural instance matrices are exactly unchanged.
- RNG remains 2186526841, and the selected scan transform remains exact.
- CPU instance and triangle counts match the actual rendered scene.

`physical-sections.png` / `.svg` show the actual bearing/ground datums and the
six wing-foot plans against the removed broad base. Minor face weathering is
omitted from those construction diagrams. `draw-sections.py` builds them from
the actual CPU audit data.

```sh
node --max-old-space-size=4096 qa/ten-reference/08/foundation126/cpu-audit.mjs
```

`prebuild-ground-probes.json` retains the ground/rock samples used before the
replacement. `layout122/probe-foundation126.mjs` reconstructs v3 source directly
from the diagnosis commit in memory, so it remains reproducible after the
runtime changes; it never edits the checked-out scene.

## Actual review, including the failure to match the photo

Exactly one new shared-wrapper job produced an actual 1254-square full frame
and a genuine native subfrustum render of original `[560,750,400,400]` pixels:

```sh
REFERENCE=8 SIZE=1254 ITERATION=foundation126 PORT=4726 DETAIL_CROP=560,750,400,1254 node tools/render-one-reconstruction.mjs
```

No extra render, browser bypass, suite or tuning loop followed. The report's
source file hashes identify the exact candidate; `sourceCommit` is the prior
diagnosis commit because rendering preceded this commit. Shader/WebGL/pixel
checks pass, which does not establish photographic fidelity.

The actual view confirms independent stone supports and water/rock space, but
the original camera still sees the two bridge piers obliquely across their bay.
Rays at `(750,930)`, `(730,970)` and `(825,995)` still hit the new piers. The
geometric aperture is real yet does **not** reproduce the photo's rill opening.
Unchanged middle-gallery piers, the stone-lantern pedestal and other structures
remain visible behind it; materials/coursing still look overly regular.
`inspectionRays` in the audit records these exact post-change hit names.

`photo-v3-foundation126-native-crop.png` compares original pixels of the supplied
photo, actual v3 and the new actual full frame. `detail-native.png` is the
separate actual 3D subfrustum, not an enlarged screenshot. V3 and the diagnosis
remain preserved. This is an unaccepted structural candidate for review.
