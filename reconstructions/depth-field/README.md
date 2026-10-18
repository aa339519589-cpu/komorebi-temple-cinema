Depth Anything V2 **Small** supplies relative inverse depth; this independent builder places original-image colors into a nonplanar 3D Gaussian surface. The Small checkpoint and upstream code are Apache-2.0. The exact upstream [LICENSE](LICENSE), model card and source README are preserved under `provenance/`. No Base/Large/Giant or SHARP model data is used.

Setup: `sh reconstructions/depth-field/bootstrap.sh` (requires `uv`). It pins the upstream revision, dependency versions and Small checkpoint SHA-256. A compatible existing Torch/MPS environment may instead run `infer.py` directly; the first actual run reused installed Torch packages only.

```sh
node reconstructions/depth-field/run-queued.mjs "$HOME/.cache/depth-field/venv/bin/python" reconstructions/depth-field/infer.py --image "/Users/mima1234/temple-cinema-live-sync/references/hd/0-照片-1.jpg" --output /Users/mima1234/temple-cinema-live-sync/output/depth-field/01 --id 01
```

The official Small model runs at requested 1254px input, rounded by its standard transform to 1260×1260, then returns depth at the original 1254×1254 resolution. Every original color pixel becomes one anisotropic Gaussian. The camera independently assumes horizontal 54° FOV. Relative inverse-depth percentiles 1–99 map to the declared **unmeasured** range 3–40 scene units using an inverse-depth interpolation. This is an artistic scale convention, not metric depth calibration.

The standard PLY contains XYZ, original sRGB SH0 color, opacity logit, logarithmic principal standard deviations and wxyz orientation. Tangential sigma defaults to 0.80 source pixels for sampling coverage; depth thickness is 8% of tangent sigma and strictly nonzero. The initial 0.62 candidate is preserved separately. Camera-plane axes prevent stretched splats across depth boundaries. There are no connected triangles. `resample.py` can change the footprint from a saved DA2 PLY without rerunning inference or changing positions/colors. `batch.mjs` defaults to output/depth-field-v02 (override with DEPTH_FIELD_OUTPUT).

Outputs include the actual Gaussian PLY, raw predicted relative inverse depth, mapped depth, depth preview and `viewer.json` with complete camera/mapping/asset hashes. All large output and checkpoint data stay outside Git. Source-camera identity is OpenCV x right/y down/z forward. Hidden surfaces remain unknown; colors encode the original lighting/reflections. This is a viewable depth surface, not closed CAD or a relightable PBR reconstruction.

Sources: https://github.com/DepthAnything/Depth-Anything-V2 at `a561b849ebae10a6f5ef49e26c83cbbcd36c71bf`; https://huggingface.co/depth-anything/Depth-Anything-V2-Small. Small checkpoint SHA-256: `715fade13be8f229f8a70cc02066f656f2423a59effd0579197bbf57860e1378`.
