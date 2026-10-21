The physical scene in this folder derives from frozen Scene09 R10, commit `a10b118a2b09e65e9bfad6b64c6016299c59bf41`, source SHA-256 `b2d659097d51b2a49b720f3ff83a6bdf84e6c265dd2a89225e5c8ba074637715`. Nothing in `reconstructions/scene-09`, its runtime assets, or another scene is changed by these scripts. The photograph is a comparison input only.

The parent exported the actual existing geometry with `tools/export-reconstructed-scene.mjs`; `export/export-report.json` must say `exported-existing-geometry` before the first render. The export contains 4,506 mesh records, 4,462 geometry buffers, 84 materials, 22 textures, 501,594 total source instances and 51,311,767 indexed triangles. Portable source buffers and large editable models stay local release assets rather than Git blobs.

Run every Blender operation from the repository root through the official launcher. It shares the native reconstruction GPU mutex. Blender 5.2.1 LTS and Metal were used for this review.

```sh
CYCLES_SIZE=1254 CYCLES_SAMPLES=48 CYCLES_DENOISE=1 CYCLES_DEVICE=METAL CYCLES_OUTPUT=lookdev/scene09-solmax-cycles-20261021/cycles-r01 CYCLES_RENDER_NAME=scene09-r10-physical-r01.png CYCLES_BLEND_NAME=scene09-r10-physical-r01.blend node tools/run-blender-queued.mjs lookdev/scene09-solmax-cycles-20261021/render-current-source.py

CYCLES_SIZE=1254 CYCLES_SAMPLES=64 CYCLES_OUTPUT=lookdev/scene09-solmax-cycles-20261021/cycles-r02 CYCLES_RENDER_NAME=scene09-r10-physical-r02.png CYCLES_BLEND_NAME=scene09-r10-physical-r02.blend node tools/run-blender-queued.mjs lookdev/scene09-solmax-cycles-20261021/cycles-r02/render-script.py

CYCLES_SIZE=1254 CYCLES_SAMPLES=64 CYCLES_FIXTURE_GAIN=4 CYCLES_SPOT_GAIN=1.5 CYCLES_PAPER_RGB_GAIN=1,1.5,1.2 CYCLES_EXPOSURE=.20 CYCLES_SKY_CAMERA_GAIN=.827 CYCLES_STONE_COAT_ROUGHNESS=.085 CYCLES_OUTPUT=lookdev/scene09-solmax-cycles-20261021/cycles-r03 CYCLES_RENDER_NAME=scene09-r10-physical-r03.png CYCLES_BLEND_NAME=scene09-r10-physical-r03.blend node tools/run-blender-queued.mjs lookdev/scene09-solmax-cycles-20261021/render-physical-iteration.py

node tools/run-blender-queued.mjs lookdev/scene09-solmax-cycles-20261021/render-final-physical.py
node tools/run-blender-queued.mjs lookdev/scene09-solmax-cycles-20261021/render-room-balance-r05.py
```

Each stage retains its own full PNG, report and local `.blend`. `render-script.py` snapshots in R01–R04 match the script SHA-256 actually recorded for that render. The R02 snapshot predates the explicit RGB/sun/spot calibration controls added for R03. The optional `render-physical-details.py` produces independently sampled R03 native details.

R01 transfers source PBR maps, UV transforms, source vertex colors only where enabled, and source instance RGB. Orthogonal transforms remain linked through Geometry Nodes; 36,607 genuinely sheared transforms bake their full affine positions and inverse-transpose normals. Direct and baked materials use Geometry-domain instance RGB; linked instances use Instancer-domain RGB. Grayscale emission maps multiply the source amber emissive RGB. They do not replace its color.

R01–R04 retain 51,311,731 indexed source triangles and incorrectly omit three singular transforms. The preserved reports expose the difference. A subsequent buffer-area check established that these are rank2 flattened boxes with some finite-area triangles. R05's `restore-singular-source.py` retains all 36 original indices, exact transformed vertices, source UVs/materials/instance RGB, and recalculates only the undefined singular normals. R05 must report `geometryTriangleCountPreserved:true` for all 51,311,767 source indexed triangles.

The original source camera, fixture anchors, source cones, moon direction and warm fill direction remain fixed. Point lights begin at the numerical source intensity times `4π`; this is a radiant calibration proxy, because source spectral efficacy is unknown. R03 uses point gain4, spot gain1.5, unchanged moon/warm-fill intensity, AgX exposure+0.20 stops and camera-sky gain0.827. All local lights cast physical shadows and use inverse-square transport. Native finite cutoffs, often unshadowed local pools and captured environment probes have no exact Cycles equivalent.

Washi panes use thin diffuse transmission so internal modeled lamps can illuminate the real courtyard. Surface emission preserves source emissive RGB times the source material-space tissue map, followed by an explicit `[1,1.5,1.2]` radiance calibration. R05 reduces broad room-pane emission to0.45 and pagoda-pane emission to0.70 of R04, leaving the small lanterns unchanged. This is an authored physical fit to the photograph, not recovered photometry or WebGL pixel equivalence.

The source night cloud equations generate a linear float sky-only texture. It contains no architecture, garden or photographic pixels. The source HemisphereLight becomes a shadowed directional world-radiance approximation. The excluded native pond Reflector becomes a52×55m physical water surface at source `[0,-0.02,8]`, IOR1.333, with millimetre world-space wave normals and small uncolored chop. All pond highlights are path-traced fixture/geometry/sky reflections.

Every original closed riven granite slab, cut edge, foundation and plinth remains unchanged. The wet coating follows the actual facet normals plus the CC0 granite normal map and authored0.9mm/0.35mm riven/mineral microrelief. Film IOR is1.333; roughness is `0.015 + 0.07 × original scan roughness`. No floating floor mirror is added. The original dark diffuse scan tint receives gain1.4 in R04/R05.

R04/R05 save a full1254×1254 reference-camera frame at128 samples, a scene-linear half-float RGB EXR, and a packed editable model with the full reference camera saved. Floor and architecture details use fresh Cycles samples on a2508×2508 full sensor with render borders. They are not enlarged crops of the1254 image. Exact file sizes and SHA-256 values are recorded beside the images. Blender can unload decoded image buffers after packing/rendering; `hasData:false` for a packed image describes a lazy pixel cache, not a missing packed asset.

The Cycles image improves physical transport, reflections and surface readability. The frozen source's geometry/layout is still visibly different from the photograph. The reference's facade openings, roof proportions, fine carpentry variation, bridge/bank placement and lush planting are not established matches by this lighting work. Every candidate remains `visualAccepted:false`.

The comparison board/manifest are a CPU-only assembly of the unaltered1254 photograph and1254 Cycles frame. This machine's system `python3` lacks Pillow; use the already installed primary runtime for that optional step:

```sh
/Users/mima1234/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 lookdev/scene09-solmax-cycles-20261021/build-review.py
```
