# Scene08 depth128 — CPU diagnosis, no runtime revision

This follows the explicitly rejected terrain127 commit
`d361dde83ed65eac9c6f845aeef39ff36ddd9288`. It is a new whole-layout depth study,
not another bank or pier variation. **No runtime file and no GPU frame changed.**
The actual scene still has terrain127's six known floor/foundation collisions.
This study evaluates a possible replacement layout in CPU memory only.

## Result: complete assemblies can clear, but the photo features remain hidden

A bounded search found these complete-gallery transforms. All geometry,
materials, slabs, walls, columns, ornaments and roofs move together with one
uniform scale; source vertices are not separately pushed toward image anchors.
The camera and all five fitted architectural components remain fixed.

| Whole gallery | New origin XYZ | Yaw | Uniform scale | Finished floor | Required soil court | Room clearance |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| West | (−2.366277,.980581,−35) | −.48 | 1.60 | 6.580581 | 6.380581 | 3.152 m |
| East | (15.733501,2.583605,−31) | −.32 | 1.45 | 6.208605 | 6.008605 | 2.7115 m |
| Rear | (3,4.930581,−49) | 0 | 1.10 | 6.580581 | 6.380581 | 2.167 m |

The west/east projected tile/ridge residuals are 18.72 / 7.70 px. The manual
photo features have estimated 15–25 px uncertainty. The rear assembly has no
independently visible roof samples in the current actual view, so its depth
is weakly constrained. These positions are a physical candidate, not a unique
recovered site or an accepted photographic layout. The west scale reaches the
search limit and needs particular care when interpreting its fit.

The **full transformed-geometry separation certificate passes**, but the
**visibility check fails**. All seven measured roof rays still first hit
near pine pads, the fitted wing's red end/joinery, or the right gallery.
Moving the legacy roofs behind these occluders cannot by itself reproduce
visible photo contours. This candidate is not ready for another GPU job or
runtime integration. `physicalSiteAccepted` and `visualAccepted` remain false.

## What was actually tested

`capture-envelopes.mjs` loads the full actual scene, with original procedural
geometry and real glTF buffer geometry. It constructs a conservative oriented
box for each complete architectural component from every generated mesh and
instance box. Empty room space is deliberately included, making separation a
strong sufficient condition, not a loose centre-point guess.

`certify-transforms.mjs` changes all **18,325 real gallery parts and 2,035,260
vertices** in CPU scene memory using the proposed complete-group matrices. It
checks actual Float32 transformed vertices against the source-derived boxes;
none escape the certified boxes (maximum numerical overshoot <3.1e−7 m).
Separating-axis certificates cover the three moved galleries against the five
fixed components and each other: 18 pairs in total.

- West / pagoda: minimum certified gap .251513 m.
- East / pagoda: .625590 m.
- West / east: 2.795469 m.
- West / rear: 2.901410 m.
- East / rear: 6.723012 m.
- Other moved / fitted component gaps exceed 11 m.

These certificates contain all actual gallery surfaces and volumes; they are
more than the previous six floor samples. The six previous points are also
transformed and retested against every actual architectural stone box. All
six former containments clear. This does **not** prove that unrelated fixed
hall/wing junctions, all planting, terrain or all-site access are clear.

The CPU study keeps the exact rejected127 runtime source identity:
`d7cdb6206c2be19d414793dc225f748eda88596806310ff0807863737117718c`.
Source tracing is injected in memory only. Texture pixels are omitted in the
CPU loader; vertices and transforms are unchanged. There is no image RGB
lookup, reference depth map, image plane or reference projection in the scene.

## Photo measurements and uncertainty

The initial full-corner interpretation was rejected. The west left edge is
hidden by the main hall, and the east roof continues behind the right portal;
those occlusion boundaries must not be treated as complete-roof corners.
The visible west ridge end was ambiguous, and initial measurements mixed tile
bends with lower timber fascia. The retained feature set explicitly uses
visible tile bends and a ridge feature, with soft correspondences for the
partly cropped east eave. Crop inequalities require the hidden west corner to
remain left of X540 and the east roof's actual far corner to continue beyond
X1130. `depth-search.json` records every retained source point, target,
weight, residual, transform and inequality result.

The finite search evaluates scales 1.00–1.60, yaw −1.60…1.60, depths
Z−52…−14 and floor levels Y1.2…8.5, requiring at least .25 m conservative
separation and 1.8 m room clearance. It is not allowed to keep a good
reprojection that intersects another building. Earlier correspondence outputs
remain as `rejected-full-corner-search.json`, `ridge-negative-end-search.json`
and `ridge-positive-end-search.json`; they are analytical alternatives, not
actual rendered candidates or accepted fits.

The current scene's coarse original-camera grid sees five west, 26 east and
zero rear gallery hits. `assembly-inventory.json` and `component-envelopes.json`
retain the actual bounds/counts and source roles. `depth-diagnosis.png` shows
the complete component envelopes and the measured photo features beside the
current actual frame. Its rectangles are an engineering diagram, not a scene
render or a substituted photographic result.

## Why there is no new GPU job

Exact original-camera rays after transforming the actual gallery geometry:

| Photo target | Actual nearest occluder |
| --- | --- |
| West (650,562) | Near pine pad |
| West (794,608) | Near pine pad |
| West (607,537) | Fitted wing red geometry |
| East (845,596) | Near pine pad |
| East (980,613) | Near pine pad |
| East (1114,615) | Fixed right-gallery red geometry |
| East (1000,558) | Near pine pad |

The full source groups and actual world hit points are in
`transform-certificate.json`. This evidence rejects the idea that a
collision-free rear relocation alone solves the photograph. The next layout
step must address the actual occlusion ordering and the corresponding whole
wing/pine/gallery arrangement, without exposing a photograph through masks.

The proposed gallery floor levels also need real supported upper courts at
Y6.0–6.4, while the pagoda bench stays at or below Y3.65. A closed terraced
soil/rock volume, contact samples, plant rooting and physical connections must
be rebuilt before those gallery transforms can become a coherent runtime
scene. The existing main bridge/stair endpoints target the unchanged middle
and right galleries and should retain their measured contacts. New upper
court routes require supported slabs/stairs and real door bays; the previous
intersecting boxes must not be reinterpreted as functioning passages.
`terrainRequirements` in the certificate records this work explicitly.

Reproduce the CPU diagnosis without rendering:

```sh
node --max-old-space-size=4096 qa/ten-reference/08/depth128/inspect-depth.mjs
node --max-old-space-size=4096 qa/ten-reference/08/depth128/capture-envelopes.mjs
node qa/ten-reference/08/depth128/search-depth.mjs
node --max-old-space-size=4096 qa/ten-reference/08/depth128/certify-transforms.mjs
```

No new runtime geometry was committed, no extra actual still/motion job ran,
and neither this study nor any of the ten scenes is accepted as complete.
