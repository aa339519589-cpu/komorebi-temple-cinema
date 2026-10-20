# Scene 08 shallow porch roof and wall-girt bearing

**Status:** native render completed; visual acceptance remains false.

- Reference: `references/hd/7-照片-8.jpg`
- Preserved rejected steep-roof evidence: `qa/ten-reference/08/iteration-scene08-lower-wing-roof-pass05/`
- Final native 1254×1254 frame: `qa/ten-reference/08/iteration-scene08-porch-ledger-pass02/reference.png`
- Full comparison: `qa/ten-reference/08/iteration-scene08-porch-ledger-pass02/comparison-reference-left-render-right.png`
- Junction crop comparison: `qa/ten-reference/08/iteration-scene08-porch-ledger-pass02/comparison-junction-reference-left-native-right.png`
- Native receipt: `qa/ten-reference/08/iteration-scene08-porch-ledger-pass02/report.json`
- Source identity: `23bfe5ffae5b5b4069be4c8586ba1f13c52f749979760ae608efa27967af7560`
- Backend: Metal; frame valid; `glError: 0`; no render errors.

The rejected steep sheet was replaced by a shallow porch roof with world high/low eaves at 6.85m and 5.4m (about 18° across the 4.6m span). Its inner ledger overlaps an explicit main-hall wall girt below the eave; the roof skin does not intersect the main roof skin. Five outer timber posts reach the low fascia. Stone piers now use `terrainHeight()` at each post location, extending below the actual bank/channel substrate and meeting the raised porch deck. The deck top is about 1.97m, aligned with the main hall floor at about 2.08m. The roof retains a thin tiled surface, closed soffit, narrow rafters, and slight corner lift.

The full frame and crop show a lower eave in the reference window, with smaller lattice openings and a clear timber bay rhythm. The main hall, camera, pagoda, bridge, pond, and gate frame remain fixed. Residual differences include the porch roof’s simpler curvature and the still-large main hall roof/wall mass, so the full scene remains unaccepted.
