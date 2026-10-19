# Scene08: one scanned boulder, unaccepted local candidate

Base `8c1708d3fa36860109e53705e9b6d7c63fadf914`. The r02 film endpoint has exactly the same08 source before editing: `cf84d5cb49a3f6fa7b0933ebda11323d9dac09373bc5d54b45dce579481ab696`. Reference photograph `7-照片-8.jpg` remains comparison-only under its original copyright. The1440px actual endpoint is resampled solely in the labelled QA crop; both new full/detail rounds are genuine native1254 renders.

## Observed target, not an arbitrary random index

Original black-gray wrinkled boulder left of the central shrub is visible approximately[497,805]–[602,918]. Crown and left/lower boundary are screened by leaves/ferns/stone edging; only the right wrinkled face is fairly clear. The buried form/contact is not measured. The right reference rock behind the central shrub is not given a speculative second replacement. `observations-before.json` records the limits.

The actual target is the conspicuous pale pear-shaped rock above the near railing and left of the bridge landing. Exact frozen-camera CPU rays through clear gray pixels(589,900),(559,864),(622,917) hit fixed call `rock(-.55,1.35,-.3,.95,2.7,.9,2)`. Its tall nonuniform geometry and procedural green mask are the problem. `locate-old-rocks.mjs` reconstructs all old rock placements and pre-plant RNG consumption; it does not pretend to solve alpha foliage/rail visibility. Only this one fixed body/cap is replaced.

## Authentic geometry, unchanged original data

The private helper uses existing Poly Haven `rock_moss_set_01`, Kless Gyzen, CC0-1.0, with original retained GLTF/binary/albedo/normal/roughness bytes. Every provider SHA256 is checked in `retained-scan-bytes.json`, and shared assets are declared by08 asset-dependencies. No download, bitmap generation, reference colour sampling, UV edit, procedural resurfacing or added moss hemisphere is included.

Final node `rock_moss_set_01_rock01` supplies11,000 triangles. Its original naturally longZ extent is3.3688m. A rigid pitch1.15/yaw.15 and uniform scale1.10 orient that form upright; it is not stretched into a column. All three instance-axis lengths are1.10 and determinant1.331. Geometry is only cloned, its original position/normal/UV/index arrays are never edited, and original PBR maps/normal strength are retained. The only material factor is fixed neutral RGB(.75,.75,.75), not a reference/lighting colour projection. `original-arrays-and-contact.json` records original accessor hashes and actual transform data.

The object sits near the old position, with anchorXZ[−.75,−.15]. Lower rigidly rotated scan vertices are raycast against the unchanged actual triangle terrain. First-contact placement then embeds the rock by up to.16m:1293 lower samples,118 intersecting terrain. Actual world vertex boundsY−.39154…3.08195m are recorded. No soil, hidden support plane, water move or lifted floating rock is introduced. The inferred position/rotation and unseen roots are not claimed historical recovery.

The removed fixed call uses zero scene random draws. All115 random rocks,14 channel rocks and subsequent vegetation calls retain their exact arguments/order. Pre-plant state is reproduced at50,042 draws/state1,062,665,593. Both actual candidates end with state2,186,526,841. Reversing only loading/terrain-reference/one-call/metadata hooks reproduces the old scene source exactly;31 other tracked scene files and all original asset bytes are unchanged.

## Actual review and limits

108a used natural upright rock04 farther back on the west bank. It contacted terrain, but the actual full/detail showed that original shrubs/old neighbouring stone hide it. It failed visibility and is retained with its exact source snapshot; it is not presented as improvement.

108b uses the original longer rock01 in a rigid upright orientation nearer the original visible position. Both full and the native[430,750,350,1254] subfrustum were actually viewed. The wrinkled scan face is now visible where the pale pear was. The neighbouring old gray/green procedural stone remains unchanged. Evidence is `../iteration-rock108b/reference.png` and `detail-native.png`; source identity `2697b25a18db73c6ccee623c37041586b0139b70f291ec075270a49db7deca20`.

The final surface still reads warm brown under the unchanged light, whereas the reference is darker gray. Its exact silhouette, side fissures and occlusion do not match the photo; this is a different licensed scan chosen as an interpretable replacement, not recovered geometry. Existing adjacent crude rock/green cap, planting and overall architecture remain unaccepted. Two actual full/detail rounds only, shared GPU queue, no third round, software suite, film, ad-hoc browser or push. The local candidate and complete scene remain unaccepted.
