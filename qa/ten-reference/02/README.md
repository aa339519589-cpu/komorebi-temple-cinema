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


## Third candidate after the stable integrated second GPU image

Inspected the integrated actual PNG and side-by-side comparison, followed by four high-resolution original crops (main eaves/gable, suspended lamp, bridge/pond, close balustrade/floor). The second image is stable render evidence but is not visually accepted.

Third candidate replaces the visible low-poly crown shells entirely with approximately 300,000 small leaves on actual branched shoots; moves the framing branches above the sun opening; smooths deformed rock normals; removes oversized foreground boulders and reduces lotus flower scale. A clear water area is retained at the solar reflection direction.

Architecture changes include a higher connected stone terrace and 24-step approach, open central entry (centre front column and two large front grille panels removed), finer emitting rear lattice, five-tier curved bracket arms, timber gable trusses with smaller cloud relief, compact carved-bronze lower railing inserts, and new six-sided emitting lanterns with closely spaced scroll tracery. Stone lanterns have hexagonal pierced fireboxes, tapering weathered shafts, curved six-sided ridged stone roofs and layered finials.

Red wood now uses a varnish clear coat and finer generated grain. A fixed 128px radiance probe captures the actual constructed scene for the gold and wood reflection environment. Water and polished-floor captures use stronger view-dependent reflections with deterministic fine ripples. The static directional shadow map is generated once and reused for the fixed lighting. No models, texture images, HDR maps, photographs or AI visuals are imported into the scene.

Third CPU build: 48,200 architecture instances, 345,819 garden instances, 906 buckets, approximately 6.53 million triangles; all JS syntax checks pass and vertex scan reports zero non-finite components. Runtime probe and visual validation await the third GPU capture. The entry and camera interface are unchanged.


## Bounded silhouette and golden-hour pass (parallel40, 2026-10-18)

Inspected the original HD reference, integrated-02 actual image, then three new full-frame actual 1254px renders. The failed parallel38 syntax candidate is retained with its error report. No test suite was run for this pass. Every actual capture used the shared GPU queue.

The main hall is narrower and its occupied floor is higher, with a connected taller masonry podium and recomputed stair heights. Pagoda galleries are thinner and closer together, with a shorter spire. The foreground railing is lower and moved slightly toward the veranda, opening the pond. Materials separate dark vermilion timber, aged gold, cool slate and cooler stone. Broad solar haze was narrowed so the upper sky is blue instead of pink; the sunset horizon and luminous clouds remain gold. Framing foliage has more coverage and the pine blocking the entry was moved. The background ridge is now a sloped geometric terrain surface with small ridge trees.

The actual final capture and the original/before/after comparison are in `iteration-parallel40/`. The visual review explicitly remains a draft. Roof planes are still too dark, pillars and bridge are too smooth/orange, vegetation and hillside are far simpler than the reference, and the lotus, stone lantern and close gilded details remain approximate. These are visible limitations, not a photographic match or acceptance claim.


## CC0 scanned lacquer timber (parallel47)

Inspected the actual 1254px parallel47 full frame against the original and parallel40. Poly Haven's CC0 **Lacquered Cherry Wood**, scanned by Jenelle van Heerden and processed by Rico Cilliers, now supplies diffuse, OpenGL normal and roughness maps to the existing lacquered red/cedar/darkwood/floor materials. The maps remain in the already tracked `assets/polyhaven/lacquered-cherry-wood/`; `asset-dependencies.json` includes them and their provenance in the source identity. The prior no-external-texture descriptions apply to earlier revisions, not this scanned-material revision. No photograph or replacement frame is used.

`scanned-timber.js` adapts the scene08 per-instance metric-UV approach. Member extents are attributes on every lacquered wood geometry, and shader UVs use actual instance dimensions. Existing buckets, geometry and motion stay intact. The timber shader chains the existing finite-radiance capture shader. The close rail, column and eaves have visible grain and deeper varied brown-vermilion in the actual image. `iteration-parallel47/comparison.png` shows original, parallel40 and this actual frame. Geometry counts are recorded before/after in its visual review.

A single queued actual full-frame render was used; no test suite was run. Surface color variation improves, while dark roof planes, stylized landscape and simplified details remain. This is a draft without visual acceptance.
