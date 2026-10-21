# Scene03 R20 physical daylight study

Real Blender/Cycles rendering of the frozen source SHA2562115956f5eb49510e45b190eb6f52ebbe0c761100f3e93f00d96863e61482d59. Scene03 garden modeling continues separately; this study does not represent those newer changes. Photographic fidelity remains unaccepted.

The importer retains23,865,776 effective source triangles and the exact exported camera. The separate closed water body occupies the native reflector60×56m footprint atY−.055 over the preservedY−.30 pond bed, with physicalIOR1.333 and absorption. Multiple-scattering atmospheric sky follows the actual exported sun direction. Physical leaf transmission, path-traced water and AgX are declared renderer adaptations, not native pixel equivalence.

`cycles/scene03-source104-physical-daylight-r02.png` is1254 square/64 samples. The first classic-Hosek sky fallback was too dark and is retained under `cycles/rejected-classic-sky`; Blender5.2’s actual multiple-scattering enum is now selected explicitly. Geometry/proportion/material gaps remain plainly visible.

```sh
REFERENCE=3 SCENE_EXPORT=lookdev/scene03-solmax-cycles-20261021/export node tools/export-reconstructed-scene.mjs
CYCLES_SIZE=1254 CYCLES_SAMPLES=64 node tools/run-blender-queued.mjs lookdev/scene03-solmax-cycles-20261021/render-physical-daylight.py
```
