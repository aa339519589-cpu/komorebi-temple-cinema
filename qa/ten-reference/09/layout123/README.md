# Night scene09 layout123 — observation only

Created from main20c4b17. Runtime source is unchanged and no new actual rendering has been made.

Observed reliable mismatch: ridgeLeft projects795.84,277.01 versus photographed approximately711,309. Existing gabled roof definition shortens the left ridge to0.10*width but extends the right ridge to0.20*width; the main surface appears too short at the ridge. Right facade/hip width also differs. Photo bridge connects to an offset stair that cannot be recovered by transforming the old hall-local straight flight alone.

Do not apply hall-fit-planning.json blindly: some corner correspondences are uncertain/occluded, and the global-fit candidate worsens ridgeRight/porch outlines by40–60px. It is a failed planning fit, not a selected geometry change. Use clearly visible structural anchors and rebuild the complete roof/body/stair relationship together, with shared elevations and a real landing. User specifically rejects small surface tweaks and interpenetrating primitive blocks.

Future actuals must use tools/render-one-reconstruction.mjs. Keep whole-photograph fidelity unaccepted. Current root work continues while other Max workers handle02stone-lantern120,04layout121,08layout122.
