# Scene04 pagoda proportions: observed points and one native candidate

Base `f4cb1598d1755f1de68e80d9027efb73915c313e`. Photograph `references/hd/3-照片-4.jpg` remains comparison-only, with its original copyright. No reference pixels, coordinate grid or derived comparison crop is loaded by the scene. The measurements concern this view, not a historical or metric site survey.

Both inputs are native 1254×1254. Coordinates have top-left origin, x right/y down. `reference-grid.png` and `baseline-grid.png` expose a 25px coordinate grid over the original crop [20,50,340,420] at 2× nearest-pixel display scale. This display enlargement is a measurement aid; the actual detail below is a separate native 3D render. `actual-observations.json` and `landmarks.csv` retain every selected and occluded point, including visibility and uncertainty. Pink crosses on the `*-projected-inspection`/`actual77a-grid` images are model predictions; they are not claimed observations. `*-observed-grid` crosses are the separate manual observations.

| Visible landmark | Reference | Baseline actual | Actual77a | Actual77a delta |
| --- | --- | --- | --- | --- |
| Finial tip | 190,75 | 233,129 | 188,75 | −2,0 |
| Highest front-right eave end | 234,210 | 297,250 | 235,211 | +1,+1 |
| 4th front-left eave end | 50,279 | 65,303 | 54,278 | +4,−1 |
| 4th front-right eave end | 234,272 | 298,310 | 238,273 | +4,+1 |
| 3rd front-left eave end | 50,339 | 56,351 | 49,343 | −1,+4 |
| Highest rear-right eave end | 284,266 | Hidden by main hall | 292,270 | +8,+4 |
| Highest ridge seat, left | 170,190 | Hidden by eave/maple | 170,190 | 0,0 |
| Highest ridge seat, right | 202,191 | Hidden by eave/maple | 204,190 | +2,−1 |

The tip is estimated within about 2px; clay/ridge-seat end fragments within about 4–5px. The old highest left corner is only a partly visible fragment near79,250, with about8px uncertainty; in77a the unchanged maple hides the physical corner and no after-coordinate is invented. The3rd right corner is partly overlapped by the main hall. Lower two tiers and intermediate ridge ends are screened by the galleries, planting or next storey and do not receive fabricated point values. Tubular clay ends have real open mouths: a projected centreline and a manually selected visible lip can differ by a few pixels.

The evidence establishes the old axis error (+43,+54px). The4th visible front eave span was about233px versus184px in the photograph, approximately27% too wide; in77a it is about184px, with each manually selected endpoint uncertain by about5px. Its midpoint is still about4px right of the reference. No acceptance claim follows from these estimates.

## Actual generator correction

The fixed camera is [0,1.35,23.34] toward [0,2.3,0], FOV64.1754241. Camera, main hall, sky/light/exposure/material sources and the complete garden plan/seeds remain unchanged. Depth and vertical anchor remain fixed. `fit-tower.mjs` fits the actual pinhole projections of editable dimensions and a rigid tower yaw, rather than warping geometry in image coordinates. It retains the observations and model predictions separately.

The tower moves from x−14.21 to−15.90026m, keeping y2 and z−12.0044m. The original uniform assembly scale1.16 is retained. Plan widths use factor.82338; plan depth/width is.83448. These are rebuilt rectangular roof decks, timber floor lengths, frame axes and foundations, not a nonuniform scale of existing beam/ceramic sections. Eaves begin at local4.50712m and repeat every1.87809m, versus4.3m/every1.6m before. The top roof rises1.90346m, with a shorter ridge half-width ratio.10269, fitted to the short visible original ridge seat. Lower roof rises/ridge ratios retain.66/.275. Mast top becomes local17.91537m. Finial metal/empty-ring construction is otherwise retained.

Existing tile radius.065m, tile-end radius.074m, rafter section.105×.16m, fascia.13×.23m, column radius.105m and bracket scale.39 are retained before the original uniform assembly scale. No decorative detail module was added. `scope-receipt.json` confirms185 other tracked scene files are byte-identical, and reversing just the tower block/default-parameter hook reproduces the base architecture source exactly. Camera/garden/light config lines are exactly unchanged.

## Closed supporting footing

The moved tower, original foundation caps and a necessary independent lower pedestal share one rigid placement and the original uniform scale. The new pedestal is a closed12-triangle BoxGeometry between the original foundation bottom at worldY1.652m and the existing continuous earth topY−.8m. All four rotated bottom corners are within the existing earth rectangle; there is no floating gap or water-supported base. `foundation-contact.json` records the exact dimensions, positive volume and world corners. This hidden raised masonry support is structural inference, not an observed/surveyed basement. Garden exclusion/ground/seed sources remain fixed.

## Actual evidence and unresolved differences

One permitted native1254 round was rendered via `tools/render-one-reconstruction.mjs` shared GPU mutex and actually viewed: `../iteration-tower77a/reference.png` and `../iteration-tower77a/detail-native.png`. Detail is a true native1254 subfrustum [15,50,355,1254] from the unchanged physical camera, not an enlarged full screenshot. Render source identity is `d21ddb5888255a0929d610436f0ce744f3498b2cdec59063e31719244ee3a204`.

The primary agent requested retention of77a without spending the second round on remaining4–8px differences. The rear-right upper eave remains about8px right/4px down; maple obscures upper-left details. The original empty-ring finial, dark/flat tower body materials and all scene fidelity remain unaccepted. No material fix, suite, movie or push is included.
