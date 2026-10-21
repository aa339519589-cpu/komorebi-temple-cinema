# Same fixed-192 samples, raw versus OIDN

Both actual 1254 images were written from one Cycles render, with exactly192 samples/pixel, adaptive sampling disabled, identical camera/material/light state and the same AgX exposure transform. The raw Noisy Image and OIDN Combined passes are preserved.

The raw result is visibly noisy. OIDN removes much of that stochastic grain and some fine surface variation, but the smooth cheek planes, narrow/grave mouth, cylindrical throat bearing, repeated torso ridges and broad knee/apron shapes are visible in both. This is a modeling problem requiring actual geometry changes. At this noise level, individual fine raw/OIDN differences cannot all be assigned confidently to loss of physical metal texture. No further comparison runs are requested or queued.

The held import has the determinant-only lacquer exclusion limitation declared in `IMPORT-EXCLUSION-NOTE.md`. `visualAccepted: false`.
