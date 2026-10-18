Apple SHARP single-image reconstruction research study. The official model is used without retraining or architectural changes. Model use is limited to non-commercial research by [LICENSE_MODEL](LICENSE_MODEL); the code license is preserved in [LICENSE](LICENSE). Original scene sources are separate.

Run `sh reconstructions/sharp-study/bootstrap.sh` with `uv`, then acquire the shared GPU queue for inference:

```sh
node reconstructions/sharp-study/run-queued.mjs "$HOME/.cache/sharp-study/venv/bin/python" reconstructions/sharp-study/infer.py --image "/Users/mima1234/temple-cinema-live-sync/references/hd/0-照片-1.jpg" --output /Users/mima1234/temple-cinema-live-sync/output/sharp-study/01 --id 01 --device mps
```

`TEMPLE_ROOT` overrides the checkout containing `tools/gpu-render-slot.mjs`. `--upstream`, `--checkpoint`, `--device cpu` are available explicitly. The only deviation from the official preparation/export path is that the affine Gaussian unprojection runs wholly on CPU, where its official float64 covariance SVD is supported. The prediction remains MPS float32, at the official 1536×1536 input size.

Outputs: binary Gaussian `01.ply`, and `viewer.json` with exact intrinsic matrix, identity OpenCV source pose, input/checkpoint/output SHA-256 hashes, source revision, encoding and depth statistics. PLY includes the original opacity, covariance principal scales/orientation and SH0 color. It is not a flat photograph plane. Single-image depth and hidden surfaces remain inferred; the focal length follows SHARP's EXIF/default estimate and is not a measured calibration. Lighting and reflections are encoded in static Gaussian colors, so this is not a relightable PBR scene. A nearby-view render must be assessed separately from the source camera.

Upstream: https://github.com/apple-aiml-research/ml-sharp at `aed6527499ef91cba3b54c18d49a870f25947190`. Checkpoint: https://ml-site.cdn-apple.com/models/sharp/sharp_2572gikvuh.pt (cached outside Git). No model weights or large PLY are committed.

Apple Machine Learning Research Model is licensed under the Apple Machine Learning Research Model License Agreement.
