# Scene03 — main hall109R05 geometry checkpoint

Actual source: `c2e9eed2836667f77c52c31434758a31a68b3d61cf9dde53ff447ac5ff657853`.
`visualAccepted: false`. This is a rendered geometry checkpoint, not an accepted photographic match.

The1254px `reference.png` and `detail-native.png` are actual queued WebGL captures from `tools/render-one-reconstruction.mjs`. The hall detail is a genuine subfrustum of the unchanged physical reference camera, `[470,20,740,1254]`. Both were viewed. A second independent job produced the same full-view RGBA hash and a tighter native portal crop at `[650,360,500,1254]`: `../iteration-scene03-mainhall109-r05-scanclose-20261022/detail-native.png`. That crop was also viewed.

Six variable-depth lofted arms with waisted throats, canted cheeks and raised tips replace the constant-depth extrusions. Rounded closed volute noses and swept upper seats replace rectangular ends and seats. The new prototype solids pass the actual indexed edge/orientation/finite audit; that audit establishes geometry validity only.

The gable now has thin closed curled leaf/branch volumes around real apertures, rather than the broad plain triangular frog strut. Closed curved apron leaves sit in front of their swept timber support. Rebuilding the warped meshes' bounding boxes and spheres fixes the stale-prototype bounds that previously culled this carving from the native hall close. The new half-metre lower cornice core and deep side returns close the white sky slots behind the capitals. These differences are visible in the actual R05 close.

Two selective lower-header cassettes use the real Diana Liu / Thunk3D peony scan, CC BY4.0. Its original selected position/normal/index data and the2.67:1 natural aspect are preserved. Each cassette has a uniform1.90 installation scale, a180-degree facing rotation and a separate solid timber carrier embedding the open extraction edges. The declared depth-derived raised-gilt/oiled-wood PBR attributes are new finish hypotheses; they are not recovered original colour. `reconstructions/scene-03/assets/floral-scan109/ATTRIBUTION.md` and the component/installation provenance accompany the exact copied asset and source-face trace. The scan is ornamental vocabulary, not an identified exact artifact from the supplied temple photograph.

R01 source was preserved before any repairs; all41 preserved files match its actual render identity. R02 full/close evidence is retained. R03 failed before frames because the default transformed scanner-axis AABBs inflated the mounting dimensions; the loader now derives the precise world-vertex bounds, confirmed at0.558×0.209×0.0212m under the explicitly unverified unit wrapper. R04's constant-gold finish read as an overly bright rectangle and was repaired in R05.

The actual camera and held layout, stair, bridge, banks, garden, weather and overhang source modules match R01. No Git mutation or film rendering was performed in this finishing lane. Full checkpoint identity, preservation proof and the remaining limits are in `lookdev/scene03-mainhall109-finish/checkpoint-r05.json`.

Substantial photographic differences remain: the illumination and shadow hierarchy are flatter than the reference; bracket repetition, gable interpretation and coarse timber character remain visible; curtains, lamps and portal dressing are simplified. The scene must remain outside photographic acceptance.
