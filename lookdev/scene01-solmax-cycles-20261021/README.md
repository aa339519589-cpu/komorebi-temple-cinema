# Scene01 physical lighting and editable model

Actual Blender/Cycles study of held Scene01 R09, source SHA256 `5d8fc84e187380a0fbea5d36ad9e1159f2202f727f3275580bde66f636537c2f`, public source commit80950d2. Photographic fidelity remains unaccepted. Geometry is exported from the real Three.js scene, not reconstructed from a scene image.

Selected current study: `cycles/scene01-source132-low-courtyard-balanced.png`,1254 square,96 samples,Metal/OpenImageDenoise. The original52,563,635 effective exported triangles and source camera remain; water is a physical Cycles surface. The6kW18×8m low courtyard area light is an explicit authored lighting addition. Leaf diffuse transmission replaces the native view-dependent emission term. AgX differs from native ACES; no pixel equivalence is claimed.

The updated importer reproduces source132 sky radiance gain3.5,10% luminance mixing,[.97,1,1.08] channel gains, camera.40/environment.52. It corrects the earlier study’s reversed camera/non-camera world mix. The generated sky contains no architecture or reference photograph. See all asset provenance and THIRD_PARTY.md.

`cycles/scene01-source132-packed-physical.blend` is the standalone editable model, published with manifest on the C production-checkpoint release. All used image files are packed;114 duplicate texture loads were remapped to their identical path/color-space peers, with no geometry decimation. Its202,459,231 bytes have SHA256430cc46a800eb801f5857a8f2729d8404093c49513903ee1b44476bf0648b415. The model contains linked instancing, materials, lights, source camera and embedded source identity. The large model/export buffers are derived release assets rather than Git blobs.

Rebuild sequentially from repository root at the recorded scene source:

```sh
REFERENCE=1 SCENE_EXPORT=lookdev/scene01-solmax-cycles-20261021/export node tools/export-reconstructed-scene.mjs
CYCLES_SIZE=768 CYCLES_SAMPLES=48 CYCLES_DENOISE=1 CYCLES_DEVICE=METAL CYCLES_BLEND_NAME=scene01-source132-physical.blend CYCLES_RENDER_NAME=scene01-source132-physical.png node tools/run-blender-queued.mjs lookdev/scene01-solmax-cycles-20261021/render-current-source.py
CYCLES_PASS_NAME=balanced CYCLES_BOUNCE_WATTS=6000 CYCLES_SIZE=1254 CYCLES_SAMPLES=96 CYCLES_PACK_MODEL=1 node tools/run-blender-queued.mjs lookdev/scene01-solmax-cycles-20261021/render-low-courtyard-bounce.py
node tools/run-blender-queued.mjs lookdev/scene01-solmax-cycles-20261021/pack-editable-model.py
```

The768px source pass, high-mounted2.5/5kW experiments and overbright24kW low-source candidate remain separate receipts; they are not accepted matches. Reference likeness, carpentry refinement, organic planting and material response remain substantially different.
