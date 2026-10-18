# 照片重建 3D 高斯场

Independent research viewer for Apple SHARP reconstruction outputs. It draws anisotropic **3D Gaussian fields**, not the input photograph, a depth-warped plane, or a CAD reconstruction. It does not replace the ten existing modeled scenes or their films. Single-image inference can preserve visible surfaces while producing holes, stretched splats or uncertain geometry outside the observed view; inspect translations before accepting any motion.

The viewer uses the existing Three.js r186 and locally pinned Spark 2.3.1 (MIT). Spark's standard PLY loader consumes per-Gaussian position, `exp(scale_0..2)` and quaternion `(rot_0..3 = w,x,y,z)` for covariance, sigmoid opacity, DC color and degree1–3 SH coefficients when present. It retains float32 positions through Spark's extended splat encoding, with LoD disabled. The PLY must contain actual 3DGS attributes; an ordinary colored point cloud is rejected. Source/dependency licenses and original upstream bundles are retained in `vendor/spark/`.

## Scene data

Keep model binaries in `output/sharp-study/01/` or a release asset, outside Git. Models over100MB must never be committed. Place `viewer.json` beside the PLY:

```json
{
  "id": "01",
  "coordinateSystem": "opencv-camera",
  "model": {"url": "./scene.ply", "sha256": "record the actual model hash"},
  "image": {"width": 1254, "height": 1254},
  "intrinsics": {"fx": 900, "fy": 900, "cx": 627, "cy": 627, "width": 1254, "height": 1254},
  "sourceCamera": {"cameraToWorld": [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}
}
```

The numbers above demonstrate the schema, not a calibration claim. Use the intrinsics and dimensions from the actual SHARP run. `cameraToWorld` input is a row-major OpenCV camera-to-world matrix. Source OpenCV world axes are right/down/forward. A single proper 180° rotation about X maps both the entire field and camera axes into Three's right/up/back convention; no point positions are flattened. The pixel projection is constructed directly from `fx,fy,cx,cy`, with the source sensor contained if the output aspect differs. Camera translation or rotation never changes K. All output pose matrices use Three's column-major storage.

Launch the independent page with the existing project server, or use the local model-directory alias:

```sh
SHARP_STUDY_ROOT=/absolute/project/output/sharp-study PORT=4521 node reconstructions/sharp-study-viewer/server.mjs
```

Open `http://127.0.0.1:4521/reconstructions/sharp-study-viewer/index.html?scene=01`. `?meta=/path/viewer.json` selects an alternative descriptor. The page explicitly labels the representation as 照片重建3D高斯场. Source photography is never requested by the renderer.

## Deterministic camera API

Wait for `window.temple.readyPromise`. Every render method is asynchronous: it awaits Spark's actual camera-dependent Gaussian generation and depth sort before drawing. Fixed poses are independent of wall time or playback state.

- `renderReference()` returns the calibrated input pose.
- `renderPreset('source'|'left'|'right'|'near'|'far')` translates the physical camera. Left/right use ±2.5% of median source-camera scene depth, near +4%, far −6%. K remains fixed.
- `renderPose({translation:[x,y,z], rotation:[pitch,yaw,roll]})` provides full six-degree camera freedom relative to the input OpenCV pose. Distances use the original PLY's units; angles are radians. `cameraToWorld:[16 row-major numbers]` accepts an absolute OpenCV pose instead.
- `renderShot(seconds)`, `setTime(seconds)`, `renderFrame({time})` sample the same seven-second six-degree path using smooth interpolation. A descriptor may supply `trajectory` keyframes with translation fractions of median scene depth.
- `renderView(position,target,roll)` accepts conventional Three world coordinates for explicit inspection.
- `resize(width,height)` changes output resolution, without changing the calibrated sensor.
- `info()` records the source model, Gaussian count, SH degree, coordinate conversion, K, pose and renderer details.

## Three actual frames

This job uses the same `acquireGpuRenderSlot` mutex and trusted browser runtime as all reconstruction/Cycles jobs. It performs actual rendering only, not a test suite or movie export. It records model/metadata hashes, local renderer dependency hashes and exact camera poses. Source, left and right have equal projection matrices and different camera positions. PNGs contain only the Gaussian framebuffer, without UI or a reference-image background.

```sh
SCENE=01 SHARP_STUDY_ROOT=/absolute/project/output/sharp-study SIZE=1254 ITERATION=preview01 node reconstructions/sharp-study-viewer/render-preview.mjs
```

Optional: `POSES=source,near,far`, `SHARP_PREVIEW_OUTPUT=/absolute/review/path`, `METADATA=viewer.json`. Keep failed candidate images and reports. Successful WebGL rendering is not visual acceptance.

Primary upstream: [Spark source](https://github.com/sparkjsdev/spark), [loading original Gaussian PLY](https://sparkjs.dev/docs/loading-splats/), [manual awaited sorting](https://sparkjs.dev/docs/spark-renderer/), [Apple SHARP](https://github.com/apple/ml-sharp). Original reference photographs are user supplied reconstruction inputs; their separate model provenance belongs beside the actual generated PLY.
