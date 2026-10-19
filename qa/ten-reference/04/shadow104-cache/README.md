# Scene04 static shadow cache: pixel-identical native candidate

Base `0f9dec9c4d1b6781f9e477e293fb3de9a9966036`. Only `reconstructions/scene-04/src/reference4-main.js` changes at runtime. Models, textures, colours, AO parameters, camera/dolly, lights, shared vendor and renderer tools remain unchanged;187 other tracked scene files and six pinned dependencies are verified in `semantics-and-scope.json`.

The pinned GTAO normal override calls the ordinary renderer while alpha/transparent foliage is hidden, and does not suppress shadow generation. WebGLShadowMap only skips globally when both `autoUpdate` and `needsUpdate` are false. The new AO override temporarily clears both flags and restores both in `finally`, together with the exact original visibility restoration. The normal material does not sample shadows.

World initialization and its PMREM/cube captures remain in their original order. The paving cube temporarily hides its path/water receivers, so no cache is frozen during or immediately after initialization. The first normal beauty draw explicitly refreshes a complete visible-scene shadow map. Only after successful full composition and AO visibility/flag restoration does the renderer freeze automatic updates. New pages/models always build a new world; if an external caller ever changes geometry/light in an existing instance, it must mark the global shadow map dirty before the next complete beauty render. Camera-only movement needs no update in this fixed directional-light setup.

The default render path has no profiling GPU fences. Reserved QA still requests −11040/−11041/−11042 use the existing reference/reference/dolly-t6 poses. Only those requests instrument the exact shadow-render method and issue `gl.finish` fences to record complete frame/shadow work. They do not change positive-time movie sampling or camera setters.

## One actual instance, three native1254 frames

| Frame | Total drawn triangles | Shadow triangles | Shadow draw calls | Shadow passes drawing geometry | GPU-synchronized frame ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| legacy-reference | 136,836,788 | 53,387,310 | 2,676 | 2 | 1478.6 |
| cached-first-reference | 110,154,533 | 26,705,055 | 1,339 | 1 | 24.4 |
| cached-moving-t6 | 83,448,862 | 0 | 0 | 0 | 15.2 |

Counts are actual multipass GPU drawing work, not changes to model triangle counts. The original frame draws one full beauty shadow map and another reduced-visibility AO shadow map. Candidate first beauty draws the complete map once; moving cached view draws zero shadow triangles/calls. The sun shadow map identifier, exact world shadow matrix and camera layer mask remain unchanged in the moving frame.

The first frame includes cold shader/draw compilation; the second/third are warm. These three raw times must not be reported as a pure overall speedup ratio. The deterministic claim is removal of redundant shadow submissions:26,682,255 triangles/1,337 calls removed from AO immediately, and the remaining26,705,055 triangles/1,339 calls removed after static cache establishment.

The first two native PNGs were decoded on CPU and compared over every RGBA channel: changed pixels0/1,572,516, maximum absolute error0, mean error0, RMSE0. Their raw GPU RGBA hashes also match. The final native and moving images were actually viewed. The moving view is a performance/cache-space check, not a new camera-path change or a pixel comparison against a missing legacy moving frame.

Evidence: `../iteration-shadow104-triplet/shot--11040.png` (legacy reference), `shot--11041.png` (candidate identical reference), `shot--11042.png` (cached existing t6 view), and `report.json`. Reproduce the CPU result with `node qa/ten-reference/04/shadow104-cache/compare-native.mjs`; no further render is needed.

Actual shared-GPU command:

```sh
WORKTREE=/Users/mima1234/temple-shadow04-cache104-20261019 REFERENCE=4 SIZE=1254 ITERATION=shadow104-triplet SHOT_TIMES=-11040,-11041,-11042 node /Users/mima1234/temple-cinema-live-sync/tools/render-one-reconstruction.mjs
```

Source identity `0da13d42f99524647acf398cf07f255db6fb5e35340b5610cec5fffdc667a635`. No software test suite, movie, ad-hoc browser, vendor/shared renderer edit or push was performed. Cache validation passes; this does not constitute photographic acceptance of the reconstruction, which remains unaccepted.
