# Scene01 physical Cycles material-parity checkpoint

**Status: diagnostic render; photographic acceptance remains false.** The selected image is an independent Blender/Cycles path-traced rendering of the current Scene01 meshes, source materials, source camera, and exported instance transforms. It is not a native Three.js frame and is not pixel-equivalent to the source renderer.

The selected render is [`scene01-cycles-material-parity-moderate-bounce-final-960px.png`](cycles/reproducible-instance-parity/scene01-cycles-material-parity-moderate-bounce-final-960px.png) at 960×960, 64 Cycles samples, Metal GPU, and OpenImageDenoise. The saved `.blend` is a derived local file and is intentionally excluded from the portable checkpoint. [`comparison-final-material-parity-moderate-bounce.png`](cycles/comparison-final-material-parity-moderate-bounce.png) places the reference photo, current native WebGL frame, and selected Cycles render side by side. The same-photo/native/Cycles region comparisons are in `cycles/compare-final-hall-columns.png`, `cycles/compare-final-maple.png`, `cycles/compare-final-roof.png`, `cycles/compare-final-bridge-fascia.png`, and `cycles/compare-final-wood-gold-lantern.png`.

This material-parity pass fixes a transfer bug that made the earlier Cycles candidate excessively dark. The source stores per-instance color on instanced objects. A shader `Attribute` node left at its default `GEOMETRY` domain returned zero for those Geometry Nodes instances. The reproducible importer in [`render-scene01-cycles-linked.py`](render-scene01-cycles-linked.py) now reads linked-instance color with `INSTANCER`, explicitly stores `instanceColor` on the Geometry Nodes points before instancing, and routes direct meshes and baked sheared instances through separate `GEOMETRY`-domain material variants. It removes the `sourceColor` vertex-color multiplier only when the source material declares `vertexColors: false`; direct mesh fallback is white, while baked shear geometry keeps its per-instance RGB. The correction is in the importer source and can be regenerated from the export buffers; it does not depend on edits made only in a saved `.blend`. The older blackened candidate is retained as a rejected receipt and is not the selected output.

The selected look adds one documented physical bounce source after the source-matched import: a 16×10 m rectangular AREA light at Blender Z-up `[-8, -8, 16]`, aimed at `[6, 0, 11]`, 2500 W, linear color `[1.0, 0.78, 0.56]`, with scene shadows enabled. The source sky, analytic sun, original cool fill, camera, and geometry remain unchanged. This is an explicit photographic lighting adjustment, not part of the source light budget. The report records the exact light and confirms `cameraUnchanged: true` and `geometryReimported: false` for this pass.

The visual gap is still substantial. Compared with the photo, the Cycles version remains too dark and brown through the eaves and timber, has less readable fine wood color, and does not reproduce the same bright, dense maple canopy and water response. The existing [`scene01-cycles-final-960px.png`](cycles/scene01-cycles-final-960px.png) is an earlier pre-parity candidate; do not present it as the current selected output. No image of the reference architecture was used as geometry, backdrop, or projection.

## Source and renderer limits

The export and final render were recorded at source commit `31411bdbe1fdb84a80bc560e2073fecce3d2c58e`, with Scene01 source hash `4da704893228818477e32a7044a5f203760f8b7c86188d69f1ec2944279cac2e`. The current checkout is `0bb415553097ffe750a1da530960bdbb2acfacfc`; its Scene01 source hash was recomputed during this review and still matches the export. The checkout commit differs from the historical export commit, so the source identity is the matching hash, not commit equality. The scoped Scene01 source tree is clean.

The importer preserves 37,494,663 effective source triangles without decimation. It retains 382,955 orthogonal instances in linked Geometry Nodes and bakes only the 12,563 sheared transforms into geometry while preserving their full affine transforms. The source camera is unchanged: position `[0, 3.20, 17]` in Y-up coordinates, 59° vertical field of view, and the exact exported camera matrix. The export and final reports contain source-file hashes, source statistics, camera matrices, and render hashes.

The sky asset `assets/generated-golden-sky-v01/sky-equirectangular.png` is an independently generated sky-only radiance proxy; [`provenance.json`](../../assets/generated-golden-sky-v01/provenance.json) documents its origin. It contains no scene photograph. The importer decodes its sRGB values and scales them by 3.0; the source camera-visible sky gain is 0.32 (linear radiance 0.96), and non-camera environment gain is 0.52 (linear radiance 1.56). The source-aligned analytic sun disk is about 1.0° with a 1.2° soft support. The source's linear exposure multiplier 1.03 is represented by 0.043 EV; Blender AgX is not pixel-equivalent to Three.js ACESFilmic. The source custom shader/weathering hooks, leaf transmission, and screen-space planar-water shader are not pixel-portable. Native planar water is represented by a physical 34×31 m Cycles water surface at `[0, 0.13, 5.2]` with IOR 1.333 and path-traced scene reflections.

## Regeneration

Run these commands from the repository root, sequentially. The export and Blender commands use the repository's shared render mutex. They regenerate the exported buffers, the source-matched no-key 480px material-parity base, the selected moderate-bounce look, and the selected 960px render.

```sh
node --input-type=module -e "import {reconstructionSourceIdentity} from './tools/reconstruction-source-identity.mjs'; console.log(JSON.stringify(await reconstructionSourceIdentity(process.cwd(),'01'),null,2))"

REFERENCE=1 SCENE_EXPORT=lookdev/scene01-cycles-current-20261021/export \
  node tools/export-reconstructed-scene.mjs

CYCLES_OUTPUT=lookdev/scene01-cycles-current-20261021/cycles/reproducible-instance-parity \
CYCLES_SIZE=480 CYCLES_SAMPLES=24 CYCLES_DENOISE=1 CYCLES_DEVICE=METAL \
CYCLES_BLEND_NAME=scene01-cycles-instance-parity-fixed-base-480.blend \
CYCLES_RENDER_NAME=scene01-cycles-instance-parity-fixed-base-480.png \
  node tools/run-blender-queued.mjs lookdev/scene01-cycles-current-20261021/render-scene01-cycles-linked.py

CYCLES_OUTPUT=lookdev/scene01-cycles-current-20261021/cycles/reproducible-instance-parity \
CYCLES_SOURCE_BLEND=scene01-cycles-instance-parity-fixed-base-480.blend \
CYCLES_SOURCE_REPORT=report.json \
CYCLES_SIZE=480 CYCLES_SAMPLES=24 \
CYCLES_BLEND_NAME=scene01-cycles-moderate-bounce-pass01.blend \
CYCLES_RENDER_NAME=scene01-cycles-moderate-bounce-pass01.png \
  node tools/run-blender-queued.mjs lookdev/scene01-cycles-current-20261021/render-moderate-bounce.py

CYCLES_OUTPUT=lookdev/scene01-cycles-current-20261021/cycles/reproducible-instance-parity \
CYCLES_SOURCE_BLEND=scene01-cycles-moderate-bounce-pass01.blend \
CYCLES_SOURCE_REPORT=scene01-cycles-moderate-bounce-pass01-report.json \
CYCLES_SIZE=960 CYCLES_SAMPLES=64 \
CYCLES_BLEND_NAME=scene01-cycles-material-parity-moderate-bounce-final-960px.blend \
CYCLES_RENDER_NAME=scene01-cycles-material-parity-moderate-bounce-final-960px.png \
  node tools/run-blender-queued.mjs lookdev/scene01-cycles-current-20261021/render-moderate-bounce-final-960.py
```

The portable regeneration sources are `render-scene01-cycles-linked.py` (source buffer importer and the `INSTANCER`/`GEOMETRY` material parity repair), `render-moderate-bounce.py` (the explicit 480px physical AREA-light pass), and `render-moderate-bounce-final-960.py` (the 960px/64-sample final render). The selected image, its adjacent `scene01-cycles-material-parity-moderate-bounce-final-report.json`, the three-way comparison board, and the 480px base PNG plus `report.json` are compact review receipts. The large exported `export/assets` buffers and generated `.blend` files are reproducible intermediates and should remain untracked.
