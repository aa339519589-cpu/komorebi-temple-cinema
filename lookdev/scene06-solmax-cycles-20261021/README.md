# Scene06 R9 physical Cycles prototype

This independent prototype imports the actual exported R9 whole room and sculpture, including all portable PBR surface textures, source low camera, object matrices, full affine instances and per-instance color. It never reads the comparison photograph or exported source-frame RGBA as a material, background or frame replacement. Native Scene06 runtime, source and assets remain unchanged.

Frozen native identity: commit `d18484812cf3a4fe14d21f0435d771afb9d5ddc0`, source hash `061e581d9b6fdf04e08a8133ad6f45b28bc9c6531c6a41aefd3b142ca2deefe0`. The root-owned `export/export-report.json` reports `exported-existing-geometry`. The script refuses a different identity. `lookdev-provenance.json` records importer derivation and explicit renderer differences.

## Real geometry and transport

13,491,029 source buffer triangles from nonsingular instance transforms are retained without decimation. Input pole/degenerate faces remain in these buffer counts; the separate attribute audit declares them. Orthogonal local transforms use 18,796 linked instances; the 161 sheared transforms retain full affine geometry with transformed normals and winding correction (607,648 triangles). Two exact-zero-determinant lacquer instances, 24 indexed triangles counted by the raw exporter, were excluded by the held importer. Their transformed triangle areas were not checked; rank-2 transforms may retain valid planes. See `IMPORT-EXCLUSION-NOTE.md`; this limitation remains unresolved in the held study. Source UV rotation, repeat, center, offset and image flip are transferred; identical source bitmap buffers are shared by hash and color space.

Cycles solves 12 total bounces, 6 diffuse, 6 glossy and 2 volume bounces. The room floor reflects the actual room and lights through its physical clearcoat. A real bounded nonemissive scattering/absorption volume supplies haze. No native display planes or custom screen-space reflector is imported.

The source sun direction is retained. Actual imported-geometry ray checks find foreground floor patches with clear rays through modeled left apertures, while the central-face ray meets the ceiling. The older imported Scene06 upper-window fit meets the left attendant and is explicitly not used. Exterior sky is an inferred uniform radiance boundary seen through the modeled apertures. Native interior indirect area/spot/hemisphere proxies are omitted to avoid counting bounced light twice; source practical lamp positions/colors are retained.

## Actual candidates

| Candidate | Physical settings | Actual review |
| --- | --- | --- |
| iteration-00-import-count-rejected | Initial import guard | Rejected before rendering: raw triangle assertion included 24 determinant-excluded triangles; their transformed areas remain unverified. Error log/receipt preserved. |
| iteration-01-source-sun | Full 1254, 64 samples, sky 2.4, sun 22 W/m², air .008/m | Too dim/brown. Actual image, exact source snapshot and editable blend retained. |
| iteration-02-daylight-varnish | Full 1254, 96 samples, sky 6, sun 90 W/m², air .010/m | Too much scattered exterior radiance washes the altar out. Actual image, script and blend retained. |
| iteration-03-thinner-air | Full 1254, 128 samples, sky 6, sun 90 W/m², air .0025/m | Clearer black/gold separation and actual room reflections; unaccepted physical candidate. |

Every rendered candidate directory contains a report with source/script/output hashes, render settings and limits, plus an inspected review. Source snapshots and `run-environment.json` retain exact build identity. Editable full-room `.blend` files are about 266 MB; the importer plus frozen exported buffers reproduce them. Root owns publication and commits.

## Reproduce through the shared GPU queue

From the repository root, for the iteration-03-thinner-air full candidate:

```sh
CYCLES_OUTPUT=lookdev/scene06-solmax-cycles-20261021/reproduced-full \
CYCLES_SIZE=1254 CYCLES_SAMPLES=128 CYCLES_SKY_STRENGTH=6 \
CYCLES_SUN_ENERGY=90 CYCLES_EXPOSURE=.45 CYCLES_HAZE_DENSITY=.0025 \
CYCLES_VARNISH_COAT_ROUGHNESS=.065 \
node tools/run-blender-queued.mjs lookdev/scene06-solmax-cycles-20261021/render-scene06-cycles.py
```

`CYCLES_DETAIL_CROP=x,y,size,fullSize` changes the actual camera lens and shift to the mathematically verified source subfrustum and renders fresh rays at full output resolution; it does not crop or upsample a screenshot. The source camera matrix remains unchanged. `CYCLES_SAVE_BLEND=0` avoids another copy of the whole-room prototype for a detail.

## Cross-renderer calibration and remaining gaps

Cycles Principled BSDF and AgX Medium High Contrast are not native Three ACESFilmic/PMREM or GLSL pixel equivalence. Sun energy and exterior radiance are physical render calibrations, not measured photometry. The calibrated floor clearcoat roughness .065 replaces the native custom sharp reflection footprint; source albedo, roughness map and clearcoat weight .72 remain intact. Source linear gilt colors, metallic values and actual bump/roughness textures are retained.

Exact sculpture likeness, serene expression, cloth anatomy, lotus shape, mandorla/chandelier/altar motif identity and photographic fidelity remain unaccepted. The Fralin-derived anatomical input is a different historical artifact, not a scan of the supplied temple statue. The actual source geometry is inspectable from other views; renderer success or finite mesh diagnostics do not establish a match. All reports keep `visualAccepted: false`.

## Completed detail and portable-model proof

`iteration-04-true-sculpture-detail` is a completed true head/hands subfrustum at 1254 with a 192-sample adaptive cap. `iteration-05-true-room-detail` is a completed room/window/floor subfrustum at 1254 with a 128-sample adaptive cap. Their source snapshots, exact run settings, camera-ray bounds and actual image reviews are preserved. These sample caps are not a claim of fixed samples on every pixel.

`scene06-r9-physical-portable.blend` is the actual whole-room iteration03 prototype with all seven surface image buffers packed. It embeds the exact render/build source, render receipt, anatomical-input license and R9 model provenance. `portable-prototype-report.json` verifies geometry/camera unchanged by packing. The packed file is 287,007,101 bytes.

`export-attribute-audit.json` checks all 6,740 immutable geometry buffers, finite attributes, matching vertex counts, index ranges, normal lengths and face-normal agreement. The three cast cores have unit finite normals and no degenerate/opposed triangles. Legacy small ornament inputs have separately declared source pole faces, nonunit/two zero normals and minor grazing normal disagreements. This is attribute verification, not an anatomy, manifold or likeness claim.
