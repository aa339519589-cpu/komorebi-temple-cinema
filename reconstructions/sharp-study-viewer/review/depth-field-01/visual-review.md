# Independent Depth Anything V2 Small field · first actual camera study

These candidates use the independently predicted relative depth field and original pixel colors in model41aba826c64da7ce0389bde9db054f4cf14c65b92dcb1ae5cd630e4ecaec760c. They do not reuse SHARP depth, splats, model weights or camera data. The source projection is the independently assumed54° camera, not a measured calibration; distances below use declared relative scene units, not surveyed metres. Every frame is an actual Three/Spark3D Gaussian render. The input photograph appears only in the explicitly labeled comparison tile.

`depth01`: the source pose preserves detail/color well. At forward0.442388u with focal1.22, near lantern/canopy/foreground-finial occlusion boundaries have conspicuous black gaps. This near candidate is visually rejected. Both native PNGs and the exact report remain in `output/depth-field/01/viewer-depth01/`.

`depth02`: physical travel is reduced to0.033179u, approximately0.975% of the actual field's5th-percentile depth. Focal still starts1.22 and ends at exact source K/identity. The large black disocclusion gaps largely disappear in the actual near frame. The sky still has a visible regular dot/moiré pattern from the pixel-aligned Gaussian sampling coverage. This is an unresolved render-quality problem, separate from hidden-surface geometry; the candidate is not visually accepted. Native PNGs remain in `output/depth-field/01/viewer-depth02/`.

The next bounded candidate will judge a modest sampling-footprint change using the same independently estimated depth/color; it will not manufacture hidden background surfaces or reuse SHARP predictions. No film or remaining-nine-scene render has been started for this new engine.
