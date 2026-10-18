# Reference 07: elevated veranda garden

Independent reconstruction of `references/hd/6-照片-7.jpg` using authored Three.js geometry, procedural materials, deterministic vegetation, and a planar reflection of the actual 3D scene. No external models, textures, HDR maps, photographic cards, or image generation are used.

Serve the repository and open `reconstructions/scene-07/index.html?render&defer&w=768&h=768`. `defer` performs construction without drawing or requesting animation frames. Call `window.temple.renderReference(7)` for the fixed reference camera; `renderShot(0..7)` performs the veranda-level pullback. `renderView(position,target,time,fov)`, `info()`, and `dispose()` are also exposed.

The composition includes a raised foreground ceramic roof and red railing with brass finials; an overhead eave and suspended bronze bell; a detailed five-storey pagoda; a broad double-eave hall with lattice windows, lit central sanctuary, and entrance steps; connecting galleries; a curved stone bridge; reflective, irregular pond margins and islands; stone lanterns; articulated pine trees, cherry blossoms, ground plants, lilies, rocks, and distant connected mountain ridges.

CPU verification: `node qa/ten-reference/07/cpu-check.mjs` constructs the complete geometry without a browser or GPU and checks finite transforms/positions and API calls. Revision 5 has approximately 189,500 instances and 19.49 million triangles, with shared geometry for ceramic shells, relief medallions, needle sprays and folded-leaf vegetation.

Actual GPU iterations 1, 2 and 4 have been inspected and rejected. Revision 5 changes the architectural yaw and stair connection, recesses the hall windows into a real colonnade, covers terrace faces with geological masonry and surface-clipped moss, adds fern and shrub colonies, widens and raises the curved bridge, replaces forest envelopes with independent folded leaves, reconstructs the veranda corner, and adds thick ceramic shells with smooth radial normals and cast end medallions. It does not raise exposure. The latest source awaits the root agent's serialized GPU comparison; no visual acceptance is claimed.
