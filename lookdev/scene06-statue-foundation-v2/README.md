# Scene06 central statue foundation — R11 frozen, visually unaccepted

The current package is `r11-joined-cloth-sculpture/`. Its actual front and
three-quarter views were reviewed for **provisional native integration** by
`scene06_monumental_altar_v3`, which owns the live altar, attendants, room and
native camera comparison. This lane edits only this lookdev directory. R11 is
not a finished reference match; all current receipts retain `visualAccepted:false`.

R11 removes the separate knee sheaths responsible for R09's cracked edge and
R10's detached rear cards. Fan folds and hem returns directly change the
existing closed leg/core vertices. It retains the source-preserving head/body
bridge, lower and wider paired raised hands, compact collar, buried sleeve
roots, continuous bent crossed legs, curved insteps and pointed lotus work.
The actual scan face surface is unchanged after joining. The editable source
and two actual 1254 × 1254 Cycles views are preserved.

Visible differences remain: knee relief reads as rippled foil rather than
broad carved cloth, torso folds repeat too regularly, crossed feet remain
idealized, and the optional lotus has blocky, regular petal sections. The
licensed source head is a different sculpture from the target. Studio gold
highlights amplify these regular forms. See `review-findings.json`, including
its correction of two stale R09/R10 descriptions in the frozen build report.

## Current integration contract

- `handoff.json` selects the current package; `handoff-assets.json` records SHA256 identities.
- `r11-joined-cloth-sculpture/integration-manifest.json` links geometry, provenance, materials and review.
- `r11-joined-cloth-sculpture/sc07/manifest.json` has body-only batches, optional lotus batches and a separate face/ears/neck core.
- `japanese-buddha-body.glb`, `japanese-buddha-with-lotus.glb` and `actual-face-ears-neck-core.glb` are in the current package.
- `editable-coherent-statue.blend` retains editable geometry, the original cropped head cage, and the actual review studio.
- `front.png` and `three-quarter.png` are actual rendered views; no replacement frame is used.

Exports use **+Y up, +Z front**, with **seat anchor `[0,0,0]`** and
**above-seat height `3.26000023`**. Body bounds are approximately
`[-1.55859,-0.10312,-0.48827]` to `[1.55859,3.26000,0.76740]`.
The apron deliberately hangs below the seat. The optional lotus extends to
Y `-0.70000`. Exact bounds are in the integration manifest.

Body SC07 material tags are `cloth`, `face`, `hand`, `hair`, `gold`. Body
`gold` maps to **burnished_detail**, while optional lotus `gold` maps to
**gold**; use the scope-specific `material-contract.json`. The separate R11
face core has no hair/crown and has a shorter authored throat down to
`neckAnchorY=2.25`. It must not silently replace the R08 core already fitted
to attendants (`neckAnchorY=2.07`). Native material response still requires
the actual full-scene comparison; Cycles pixels are not WebGL equivalence.

Independent CPU validation checks all three GLBs and every SC07 batch:
finite positions/normals, valid triangle indices, exact byte/hash identities,
and **zero image maps**. The welded skin has one connected component,
936,239 vertices, 1,872,502 triangles, zero boundary edges and zero
nonmanifold edges. These are geometry/export checks, not visual acceptance.

Reproduce the current source from the repository root:

```sh
/usr/bin/python3 lookdev/scene06-statue-foundation-v2/fetch-japanese-head.py
node tools/run-blender-queued.mjs lookdev/scene06-statue-foundation-v2/build-statue-r11-joined-cloth.py
/usr/bin/python3 lookdev/scene06-statue-foundation-v2/verify_r11_outputs.py
/usr/bin/python3 lookdev/scene06-statue-foundation-v2/finalize_r11_handoff.py
```

The frozen builder and geometry-helper hashes are recorded in `report.json`
and checked by the CPU handoff script. The R11 render job is complete. No
further isolated GPU job is planned unless the scene owner's actual native
comparison reveals a blocking geometry fault. All Blender/native jobs use
the repository's official shared FIFO/mutex.

## Source and attribution

**[Buddha Head by beachmouse](https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab),
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), via Sketchfab and
the public Objaverse dataset; modified for temple-cinema statue foundation R11.**
Keep this credit and `provenance.json` with redistributed derived geometry.
The unchanged original GLB is retained at
`sources/ccby-beachmouse-japanese-head/source-objaverse.glb` (SHA256
`f5d0a1ea3f6bd79e4bfce4904b089ba48e693acb3bfa6e3851cc15f08fe52302`).
The creator records a Japanese tea garden in California; maker, date, period
and manufacturing origin are undocumented. This head is not the Cleveland
Heian statue or the target statue. New body, clothing, hands, hair curls,
neck bridge, ornament and lotus geometry are authored additions. Source scan
textures are removed; no photograph is projected or used as displacement.

Cleveland Museum of Art 1973.85.a CC0 multi-view photographs were used only
as sculptural form references. Its original 3D download required
authentication and was not acquired. The seven unchanged reference images,
URLs and SHA256 hashes remain in `sources/image-provenance.json`.

## Preserved failed revisions

R01–R06 and their old handoff remain in place, with the previous README and
handoff snapshots at `handoff-history/r06/`. R08 introduced the actual welded
head/neck/body bridge but retained cylindrical knees. R09 added weighted
bent leg paths but failed at a serrated knee patch edge. R10 added the lower
hands and compact collar but failed with detached rear cloth cards. Their
actual views and `review-findings.json` are retained. R11 removes both
specific failures and remains visually unaccepted.

The following notes document R01–R06 only and are superseded by the current
R11 contract above. The legacy `load-foundation.js` adapter is not the current
SC07 integration path.

## Historical R01–R06 notes

The first three revisions are newly authored editable geometry. Revision 04
adds an actual licensed head scan from a statue in a Japanese tea garden,
rigidly cropped and retargeted to the new body. None of these is the Cleveland
museum's scan.

The source target crop appears to show two raised hands with thumb–index
contact, with crossed feet below. The previous live cast's horizontal lap hand
is therefore a major pose mismatch. This interpretation still requires review.

The form reference is the Cleveland Museum of Art's **1973.85.a Seated Buddha
(sculpture)**, Japan, Heian period, 1100s, gilt wood. The official collection
record and the museum's Sketchfab publisher both identify CC0:

- https://www.clevelandart.org/art/1973.85.a
- https://api.sketchfab.com/v3/models/c9e0d5000ca345ea9dacf35f25db57b2
- https://sketchfab.com/3d-models/197385a-seated-buddha-sculpture-c9e0d5000ca345ea9dacf35f25db57b2
- https://creativecommons.org/publicdomain/zero/1.0/

The official 3D source download endpoint returned HTTP 401. No logged-in or
private payload was extracted. Seven official public multi-view JPGs are
preserved unchanged in `sources/`, with their source URLs and SHA256 hashes.
They are form references only. No image enters geometry, albedo, displacement,
normal maps, light projection, or a replacement frame. The target crop and
multi-view contact sheet are labeled comparison derivatives, not source bytes.

A second source was successfully obtained: **Buddha Head by beachmouse**, a
scan of a statue in a Japanese tea garden in California. The creator's public
metadata and the GLB's embedded author/license/source independently identify
**CC BY 4.0**. The unchanged 2,327,248-byte public Objaverse GLB is preserved in
`sources/ccby-beachmouse-japanese-head/`, with primary metadata, SHA256,
attribution, and the delivery URLs. Its original source textures are removed
from every derived mesh and render. A separate `japanese-scan-head-study/`
contains actual untextured scan geometry under new gold lighting, including
front, three-quarter and rear views, before the retarget.
The creator documents the garden location, not the sculptor, date, historical
period or place of manufacture. Do not identify this head as the Heian museum
sculpture or assert a historic Japanese origin from the available metadata.

**Attribution for revision 04:** [Buddha Head by beachmouse](https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab),
licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), via Sketchfab
and the public Objaverse dataset. Modified for this temple-cinema foundation:
rigid normalization, bust crop, coincident UV seam weld, two editable
Catmull-Clark subdivision levels, uniform physical regilding and geometric
hair material assignment. The cropped source cage remains unreshaped. The
new body, robe, two raised hands, jewelry and lotus are separate authored work.

`build-statue.py` makes the new closed facial loft, eyelid and mouth anatomy,
ear pinnae, neck creases, tangent spiral hair curls, continuous carved robe,
two independently modeled raised hands, crossed feet, floral pectoral and
forty-four thick lotus petals. Hand unions retain real thumb–index openings.
The torso, shoulders, sleeves, and crossed legs are fused as one sculptural
volume in revision 02; the face keeps its finer authored topology.

Reproduce from repository root:

```sh
/usr/bin/python3 lookdev/scene06-statue-foundation-v2/fetch-museum-references.py
/usr/bin/python3 lookdev/scene06-statue-foundation-v2/fetch-japanese-head.py
node tools/run-blender-queued.mjs lookdev/scene06-statue-foundation-v2/build-statue.py
node tools/run-blender-queued.mjs lookdev/scene06-statue-foundation-v2/inspect-japanese-scan-head.py
node tools/run-blender-queued.mjs lookdev/scene06-statue-foundation-v2/retarget-japanese-scan-head.py
node tools/run-blender-queued.mjs lookdev/scene06-statue-foundation-v2/retarget-japanese-face-hybrid.py
node tools/run-blender-queued.mjs lookdev/scene06-statue-foundation-v2/retarget-japanese-face-final-study.py
/usr/bin/python3 lookdev/scene06-statue-foundation-v2/check-export.py
```

Every Blender invocation uses the repository's official shared render mutex.
The saved `.blend` contains the editable objects and a clearly named studio
floor/lights/camera. The `.glb` exports only the statue meshes. Gold front,
three-quarter, detail, and clay views are actual 1254 × 1254 Cycles renders.
Cycles material previews do not establish native WebGL equivalence.

`load-foundation.js` is an optional Three.js loading adapter with named
head/hair/body/hand/lotus component lists and retained CC BY attribution.
It passes `node --check`; it has not been exercised in the live native scene.
The adapter does not choose a camera, lighting setup or final scene placement.

Revision 01 is retained as a failed prototype: its shoulder caps, neck/jaw
bands, regular robe ridges, and misplaced decorative petals are visibly wrong.
Revision 02 repairs these structural issues. All outputs remain drafts; no
render or geometry check is photographic acceptance, and the surrounding
mandorla, room, and attendants are outside this isolated foundation package.
Revision 03 corrects the inward-facing thumb loops, lowers the hair dome,
rounds the shoulder union, and closes the lotus's carved core. Revision 04
replaces the entire analytic face, pinnae and hair with the actual licensed
Japanese scan. The remaining body/drapery regularity is visible in the clay
render and requires further sculptural work before a final match is possible.
Revision 05 is the selective hybrid: the actual scan face and ears are rigidly
placed higher to expose the three neck rings, its coarse scalp is cropped,
and the denser authored spiral hair is restored. The source cage is retained
with editable subdivision rather than facial reshaping. It is rejected: its
neck crop truncates the lower jaw/lobes and reads as a flat line. Rendering was
stopped after three decisive views, retaining the source and cancellation
receipt. Revision 06 preserves more of the real neck/jaw/lobes and triangulates
the hidden crop caps before subdivision. No revision is photographically accepted.
Revision 06's four rendered views still expose a cropped neck/garment flange.
The full replacement is not selected for live integration. The actual source
head cage and the independent paired-hand/body/lotus modeling remain reusable
inputs. See `handoff.json` for precise remaining differences and asset identities.
