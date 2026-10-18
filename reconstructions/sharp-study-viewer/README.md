# 照片重建 3D 高斯场

Independent Three/Spark viewer for photo-derived **3D Gaussian fields**. The current dataset is the independently inferred Depth Anything V2 Small depth-field in `output/depth-field/`; the older SHARP results remain research-method comparisons. The directory name is historical. It draws finite anisotropic3D Gaussians at actual varying XYZ depths, not an input-photograph background or a CAD reconstruction. Single-image depth and scale are estimated, not surveyed. Unobserved surfaces can leave holes; inspect actual camera translations before accepting motion.

The viewer uses the existing Three.js r186 and locally pinned Spark 2.3.1 (MIT). Spark's standard PLY loader consumes per-Gaussian position, `exp(scale_0..2)` and quaternion `(rot_0..3 = w,x,y,z)` for covariance, sigmoid opacity, DC color and degree1–3 SH coefficients when present. It retains float32 positions through Spark's extended splat encoding, with LoD disabled. The PLY must contain actual 3DGS attributes; an ordinary colored point cloud is rejected. Source/dependency licenses and original upstream bundles are retained in `vendor/spark/`.

## Scene data

Keep model binaries in `output/depth-field/01/` or a release asset, outside Git. Models over100MB must never be committed. Place `viewer.json` beside the PLY:

```json
{
  "id": "01",
  "coordinateSystem": "opencv-camera",
  "model": {"url": "./scene.ply", "sha256": "record the actual model hash"},
  "image": {"width": 1254, "height": 1254},
  "intrinsics": {"fx": 900, "fy": 900, "cx": 627, "cy": 627, "width": 1254, "height": 1254},
  "sourceCamera": {"cameraToWorld": [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]},
  "depth": {"positiveZQuantiles": {"median": 12, "p05": 1.5}}
}
```

The numbers above demonstrate the schema, not a calibration claim. Use the intrinsics and dimensions from the actual SHARP run. `cameraToWorld` input is a row-major OpenCV camera-to-world matrix. Source OpenCV world axes are right/down/forward. A single proper180° rotation about X maps both the entire field and camera axes into Three's right/up/back convention; no point positions are flattened. The exact sign matrix avoids a residual rotation at the source identity. The pixel projection is constructed directly from `fx,fy,cx,cy`, with the source sensor contained if the output aspect differs. Named research inspection poses retain K. The film API explicitly animates the real pinhole focal lengths with its physical dolly; no saved frame is scaled or overlaid. All output pose matrices use Three's column-major storage.

Launch the independent page with the existing project server, or use the local model-directory alias:

```sh
STUDY_ROOT=/absolute/project/output/depth-field META_PREFIX=/output/depth-field/ PORT=4521 node reconstructions/sharp-study-viewer/server.mjs
```

Open `http://127.0.0.1:4521/reconstructions/sharp-study-viewer/index.html?scene=01`. `?meta=/any/prefix/01/viewer.json` selects an alternative descriptor; `?dataset=sharp-study` explicitly selects the historical research dataset. `STUDY_ROOT` mounts any physical asset directory at `META_PREFIX` without changing model files. The old `SHARP_STUDY_ROOT` variable is retained as an explicit research compatibility alias. The page labels the representation as 照片重建3D高斯场 and states that depth/scale are inferred. Source photography is never requested by the renderer.

## Deterministic camera API

Wait for `window.temple.readyPromise`. Every render method is asynchronous: it awaits Spark's actual camera-dependent Gaussian generation and depth sort before drawing. Fixed poses are independent of wall time or playback state.

- `renderReference()` returns the calibrated input pose.
- `renderPreset('source'|'left'|'right'|'near'|'far')` translates the physical camera. Left/right use ±2.5% of median source-camera scene depth, near +4%, far −6%. K remains fixed.
- `renderPose({translation:[x,y,z], rotation:[pitch,yaw,roll], focalScale:1})` provides full six-degree camera freedom relative to the input OpenCV pose. Distances use the original PLY's units; angles are radians. `cameraToWorld:[16 row-major numbers]` accepts an absolute OpenCV pose instead. Focal scale is an actual camera projection change.
- `renderShot(seconds)`, `setTime(seconds)`, `renderFrame({time})` sample the same deterministic seven-second pullback. Start is forward by `min(medianDepth*.035,p05Depth*.13)`, with zero lateral/vertical travel and zero rotation. Smooth interpolation ends at the exact source identity and K at7s; the camera never moves behind the input position. Start fx/fy are1.22×source K, returning to1× at the end. `shot-settings.js` holds per-scene art parameters; focal start may be1.18..1.28 and physical travel may be reduced. All Gaussian projection and sorting are recomputed at every pose.
- `renderTrajectory(time,keyframes)` explicitly samples a separate arbitrary six-degree research path. It is never used implicitly by the film API. Keyframe translations are fractions of median scene depth.
- `renderView(position,target,roll)` accepts conventional Three world coordinates for explicit inspection.
- `resize(width,height)` changes output resolution, without changing the calibrated sensor.
- `info()` records the source model, Gaussian count, SH degree, coordinate conversion, K, pose and renderer details.

## Three actual frames

This job uses the same `acquireGpuRenderSlot` mutex and trusted browser runtime as all reconstruction/Cycles jobs. It performs actual rendering only, not a test suite or movie export. It records model/metadata hashes, local renderer dependency hashes and exact camera poses. Source, left and right have equal projection matrices and different camera positions. PNGs contain only the Gaussian framebuffer, without UI or a reference-image background.

```sh
SCENE=01 STUDY_ROOT=/absolute/project/output/depth-field META_PREFIX=/output/depth-field/ SIZE=1254 SHOT_TIMES=0,7 ITERATION=preview01 node reconstructions/sharp-study-viewer/render-preview.mjs
```

Optional: `POSES=source,left,right` for an explicit research inspection instead of shot times, `PREVIEW_OUTPUT=/absolute/review/path`, `METADATA=viewer.json`. Keep failed candidate images and reports. Successful WebGL rendering is not visual acceptance.

For the actual ten-shot camera review, run30 still frames, not a movie:

```sh
STUDY_ROOT=/absolute/project/output/depth-field META_PREFIX=/output/depth-field/ SIZE=1254 ITERATION=shotplan01 node reconstructions/sharp-study-viewer/render-all-shot-previews.mjs
```

Each scene separately acquires the shared GPU mutex and renders `renderShot(0)`, `renderShot(3.5)`, `renderShot(7)`. `make-shot-contact.py` arranges the actual frames and preserves the original per-scene reports and metadata in a review folder. Raw native PNGs stay alongside the model in the selected dataset's `{id}/viewer-shotplan01/`.

Current reconstruction: [Depth Anything V2 source](https://github.com/DepthAnything/Depth-Anything-V2#license), [Small model card](https://huggingface.co/depth-anything/Depth-Anything-V2-Small), [full Apache2.0 license](licenses/depth-anything-v2/LICENSE.txt). This dataset uses only the Small checkpoint and independent pixel backprojection; no SHARP depth, PLY, weights or camera metadata are reused. The exact pipeline/checkpoint hash and declared depth mapping belong to each descriptor. Original photograph rights remain with the user.

Renderer primary upstream: [Spark source](https://github.com/sparkjsdev/spark), [loading original Gaussian PLY](https://sparkjs.dev/docs/loading-splats/), [manual awaited sorting](https://sparkjs.dev/docs/spark-renderer/).

Historical research only: [Apple SHARP](https://github.com/apple-aiml-research/ml-sharp). Its model and Model Derivatives are licensed for Research Purposes as defined in its [full unmodified model agreement](licenses/sharp/LICENSE_MODEL.txt). Its outputs clause provides outputs AS IS; this viewer does not invent a separate output license. Its [code license](licenses/sharp/LICENSE.txt) and [acknowledgements](licenses/sharp/ACKNOWLEDGEMENTS.txt) are retained verbatim. Apple Machine Learning Research Model is licensed under the Apple Machine Learning Research Model License Agreement. SHARP comparisons are not the delivery reconstruction engine.
