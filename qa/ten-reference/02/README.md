# Reference 02 reconstruction evidence

Independent entry: `reconstructions/scene-02/index.html?render&defer&w=768&h=768`.

Original inspected before modelling: `references/hd/1-照片-2.jpg`.

This is a new scene for the oblique veranda composition: tall main hall on the right, five-storey pagoda on the left, a curved bridge over a lotus pond, and a foreground covered wooden veranda. Architecture, tiled roofs, brackets, balustrade reliefs, lantern frames, branching vegetation, flowers, water plants and terrain are generated as real geometry. Surface maps are generated with deterministic DataTextures. The sky is a procedural shader. Pond and polished floor use separate planar reflection captures with mutual exclusion during reflection rendering.

Camera: `[16.2, 2.72, 25]` looking at `[-1, 4.7, -7]`, 52 degree vertical field of view. Foreground floor elevation is 1.35, so the eye is 1.37 above the deck. `renderShot(0…7)` eases from a closer low veranda position to this reference camera. Lighting and vegetation remain fixed during the shot.

CPU checks:

```sh
node --check reconstructions/scene-02/main.js
node --check reconstructions/scene-02/architecture.js
node --check reconstructions/scene-02/garden.js
node --experimental-loader ./qa/ten-reference/02/loader.mjs ./qa/ten-reference/02/cpu-check.mjs
```

Initial CPU build: 44,060 architecture instances, 74,392 garden instances, 369 buckets, approximately 5.67 million triangles, zero non-finite vertex components.

GPU rendering and direct side-by-side visual acceptance are separate and remain pending. No visual acceptance is asserted by these CPU checks.


## Second candidate after the actual first GPU image

The first render was visually inspected. It showed a large grid-filled gable, opaque heavy foreground railing, disconnected-looking leaf blades and simple luminous stone lantern boxes. Its report also correctly recorded source drift during capture, so it is not stable validation evidence.

Second candidate changes:

- Replaced the full-height facade triangle with a broad curved tiled roof, oriented ridge, small inset gable, fine foliage carvings and dense multi-tier eave brackets.
- Replaced large foreground gold caps with narrow lathed finials, round lacquered rails and genuinely open small-scale gilt tracery. Moved the railing slightly away from the eye and aligned the physical deck and reflection bounds.
- Rebuilt foliage around irregular solid crown masses, short connected twigs and much smaller paired leaves. Reduced foreground bank and lotus coverage to reveal the pond.
- Rebuilt stone lanterns with tapered carved shafts, compact luminous fireboxes and four curved roof surfaces.
- Corrected hall point-light world positions, used PCF shadows, separated warm direct sunset light from cool sky fill, and added close column relief collars and rough metal microstructure.
- Added blue upper atmosphere, directional cloud shading and a discrete visible solar disc. No image assets are used.

CPU build for the second candidate: 55,338 architecture instances, 71,645 garden instances, 526 buckets, approximately 6.29 million triangles, zero non-finite vertex components. Shot positions stay over the actual deck (x=14.42…20.3), with eye height 1.13…1.37 above the deck. GPU/visual validation of this candidate remains pending.
