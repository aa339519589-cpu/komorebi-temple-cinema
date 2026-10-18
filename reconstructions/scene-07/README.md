# Reference 07: elevated veranda garden

Independent reconstruction of `references/hd/6-照片-7.jpg` using authored Three.js geometry, procedural materials, deterministic vegetation, and a planar reflection of the actual 3D scene. No external models, textures, HDR maps, photographic cards, or image generation are used.

Serve the repository and open `reconstructions/scene-07/index.html?render&defer&w=768&h=768`. `defer` performs construction without drawing or requesting animation frames. Call `window.temple.renderReference(7)` for the fixed reference camera; `renderShot(0..7)` performs the veranda-level pullback. `renderView(position,target,time,fov)`, `info()`, and `dispose()` are also exposed.

The composition includes a raised foreground ceramic roof and red railing with brass finials; an overhead eave and suspended bronze bell; a detailed five-storey pagoda; a broad double-eave hall with lattice windows, lit central sanctuary, and entrance steps; connecting galleries; a curved stone bridge; reflective, irregular pond margins and islands; stone lanterns; articulated pine trees, cherry blossoms, ground plants, lilies, rocks, and distant connected mountain ridges.

CPU verification: `node qa/ten-reference/07/cpu-check.mjs` constructs the complete geometry without a browser or GPU and checks finite transforms/positions and API calls. Approximately 102,638 instances and 2.32 million triangles. Visual matching remains subject to the root agent's serialized GPU comparison against the source photograph.
