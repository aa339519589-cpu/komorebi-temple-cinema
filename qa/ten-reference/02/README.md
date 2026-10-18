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

Initial CPU build: 44,082 architecture instances, 76,196 garden instances, 369 buckets, approximately 5.85 million triangles, zero non-finite vertex components.

GPU rendering and direct side-by-side visual acceptance are separate and remain pending. No visual acceptance is asserted by these CPU checks.
