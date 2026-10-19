# Scene 07 whole foreground-gallery roof layout, revision 119

This is a bounded correction of the entire low foreground roof's orientation,
visible slope, hip shoulder, dimensions and placement. It is not a photographic
acceptance of scene 07 or of the ten-scene reconstruction. The main task's
parallel bridge, railing and lantern changes are not present in these isolated
render evidence frames.

## Measured construction

The reference's right hip runs approximately `(58,754)` to `(421,937)`. Three
large near-eave terminal centres lie near `(56,1137)`, `(232,1056)` and
`(376,1003)` at original 1254-square resolution. The far hip and eave form two
different edge families. The old pose projected the right hip almost vertically
from `(345,902)` to below `y1585`, making the face too deep and narrow.

`fit-roof.mjs` fits a true three-dimensional roof surface under the unchanged
camera `[10.7,12.8,36] → [0,7,-2]`, FOV 47. Only hand-picked point coordinates
from the photograph enter the fit. No reference RGB, image texture, inferred
depth image or projection enters the scene. Five annotated features have a
9.80 px RMS residual; manual annotation uncertainty is roughly 10–20 px.
This residual measures those five features, not global visual fidelity.

Selected physical hypothesis:

| Quantity | Before | Revision 119 |
|---|---:|---:|
| Position | `[2.3,6.4,24.5]` | `[1.904158,8.938616,30.756336]` |
| Yaw, radians | `-.22` | `1.078179` |
| Ridge width | 5.76 m | 8.0 m |
| Eave width | 12.0 m | 9.6 m |
| Visible face run | 4.5 m | 3.521553 m |
| Rise | 2.0 m | 1.114107 m |
| Corner curl | .28 m | .388020 m |
| Courses | 15 | 8 |
| Tile lanes | 26 | 21 |

The visible modelled pitch face is 9.6 m wide with a 3.521553 m run. The runtime
audit's `footprint` of 9.6 × 7.043106 m is the implied mirrored full-hip envelope;
the hidden reverse pitch is not added by this module. The source retains closed
tile shells, closed bedding, hips, ridge, rafters and fascia. The unsupported
gold ridge horns are omitted from this roof. Near-eave terminal faces occur on
alternate lanes, matching the broad terminal spacing used for the fit.

Metric size/depth and absolute height are nonunique single-photo hypotheses.
Tile pitch .48 m and the 9.6 m eave width fix the scale family. The fitted ridge
half-span reaches its declared 4 m bound. Materials and global lighting are
retained, so they should not be described as recovered physical measurements.

## Source isolation and checks

Runtime geometry changes are confined to `src/foreground-gallery-roof.js`.
`src/main.js` only imports `FOREGROUND_ROOF_LAYOUT` and replaces the single old
roof `group(...)` placement. Existing roof provenance and its dependency scope
are updated. Camera, lighting, buildings, garden, bridge and rail source are
otherwise byte-identical to base commit
`4ed9eb2d80ccab050e02efb6d9207769ef934047`. The original global RNG burn remains.

`geometry-and-isolation-audit.json` verifies finite geometry, positive volume
and closed indexed edges for the four critical bedding/tile assemblies. It also
restores the two authorized main-file lines and checks exact equality to the
base main file, then checks the actual surface sampler against the fit.

```sh
node qa/ten-reference/07/foregroof119/fit-roof.mjs
node qa/ten-reference/07/foregroof119/audit-roof.mjs
```

Exactly one actual 1254-square full-frame render was used:

```sh
REFERENCE=7 SIZE=1254 ITERATION=foregroof119-v1 PORT=4719 node tools/render-one-reconstruction.mjs
```

The wrapper acquired the shared GPU mutex. The actual report records linked
shaders, zero WebGL/context errors, opaque/nonempty pixels and precise source
hashes. `visualAccepted` remains false. Rendering preceded the final commit,
so the report's `sourceCommit` is the base; its file hashes identify the exact
rendered source. No native-detail or alternate browser render was run.

The actual full frame shows a broad left foreground roof from about `(0,745)`
to its corner around `(425,946)`, with near-eave terminals around `(55,1135)`,
`(226,1061)` and `(366,988)`. This corrects the major narrow/deep wedge. The
before/after image uses original pixels from the photo, actual mesh75b and
actual revision 119; the comparison script only crops and labels those images.

Remaining limits: the five-feature fit is sparse; roof absolute depth and the
occluded extent are inferred. Ceramic still reads too regular/PVC-like, terminal
design is inherited, and the larger scene still has material, vegetation,
building, water and layout mismatches. No photographic completion is claimed.
