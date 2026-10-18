# Reference 03 reconstruction

- Reference inspected at full resolution: `references/hd/2-照片-3.jpg`.
- Independent entry: `reconstructions/scene-03/index.html?render&defer&w=768&h=768`.
- Deterministic API: `window.temple.renderReference(3)`, `renderView(position,target,time,fov)`, `renderShot(0..7)`.
- Reference camera: `[-2.4,0.72,18.2] → [1.6,6.1,-3]`, vertical FOV 58°.
- All plants, leaves, lotus petals, bridge, lanterns, cloud volumes, stone, architectural members and water reflections are generated in code. Texture images are generated from DataTexture or CanvasTexture.
- Geometry source adapted locally from the prior architectural foundation; symmetric galleries removed and right hall / left tower / diagonal bridge / low pond rebuilt for this reference.
- CPU geometry construction check: `node --loader ./qa/ten-reference/03/three-loader.mjs ./qa/ten-reference/03/geometry-check.mjs`.
- CPU result: all position components finite; 23,462 architectural instances, 2,921,796 architectural triangles. This is construction verification, not visual acceptance.
- Real GPU render and left-reference/right-render comparison pending root's serialized rendering queue.
