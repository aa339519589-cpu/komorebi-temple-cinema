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

## Iteration 02

Actual iteration-01 GPU image was inspected. The foreground bloom hid most architecture, the architecture silhouettes were too low, and the canopy read as a broad smooth wooden arch. The second iteration reduces the main flower to a 0.43-scale bloom farther into the pond, moves it down to the lower foreground, limits all nearby random blooms, shifts the tower inward and raises its architectural proportions, removes the inherited broad arched canopy, and builds a separate tiled gable with 37 short individual rafters and a dense timber lattice. Both roof levels have dark blue slate and complete front roof courses. Stone lantern caps now have curved, thick profiles; stone is darker and granular. The sky uses a code-generated HDR texture with fractal clouds, replacing the opaque sphere clouds. Deprecated PCFSoftShadowMap is replaced with PCFShadowMap. CPU geometry construction remains finite; actual second GPU render is pending.

## Iteration 03

The original photograph and iteration-02 render were inspected both in full and in cropped woodwork/lotus comparisons. The equirectangular sky row order was inverted; it is corrected for environment lighting, and the visible sky is now an explicit world-direction sky dome shader. All overall architectural Y scaling is removed. Hall columns, lower and upper roofs, front gable, intermediate beams and nested bracket assemblies now have independent physical elevations. Broad upper-story wooden boards are removed. The gable is wider and shallower, and the hall alone rotates for diagonal eave perspective. Tower levels have explicit elevations and two bracket-support layers. The bridge span is reduced from 10.8 to 7.6m and moved back; rails, balls and medallions are finer. Lotus petals are remodeled as spoon-curved surfaces with varying petal angles; leaves have finer tessellation, softer radial folds, curled rims and weaker vein bump contrast. Stone chambers have actual framed openings. No GPU acceptance is asserted.
