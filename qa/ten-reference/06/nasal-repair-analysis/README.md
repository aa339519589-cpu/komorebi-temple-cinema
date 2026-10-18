# Local nose diagnosis, not a render

The BVH sections read the actual explicit `learned-face-v02` Blender mesh. At X approximately ±.06, Y approximately 2.72, the frontal ray has no nose surface; adjacent rays cross only a 4–7 mm curled shell. The native 86 openings are therefore genuine geometry defects, not simply a gilt highlight. A globally closed manifold can still contain these local ring routes.

`inspect-nasal-surface.py` runs through the shared Blender queue and writes `nasal-sections-v02.json`. It does not load an image or produce a synthetic film frame. `audit-export.mjs` reads the actual GLB, verifies one untextured mesh with unchanged global bounds, and compares all 12 other scene06 source files byte for byte against `8082e52`.

The first export audit hit Node's default subprocess output limit (`spawnSync git ENOBUFS`) while reading the existing 1 MB+ `restoration-altar.js`; raising only that read buffer to 16 MB resolved it. No Blender, model-weight, GPU or disk capacity error occurred. This was not a native-render failure.
