# Scene 04 warm granite paving pass

Status: `rendered-review`; visual acceptance remains open.

The paired native render and genuine floor subfrustum compare the unchanged camera and measured slab-joint traces to the supplied reference. Paving changes are limited to `reference4-garden.js` and `traced-paving04.js`: the scan albedo is darker and warmer, the surface now has centimeter-scale crowns and basins with smaller erosion facets and pits, the top arrises are rounder and locally chipped, and the traced seams are narrower with intermittent moss colonies inside them. The existing physical wet/dry masks and water-IOR clearcoat remain in use. No lights, camera, temple, stairs, lantern positions, or slab-joint centerlines changed.

The result removes the pale runway appearance and adds broken actual tree shadows, visible stone-tone variation, uneven crowns, and shallow damp hollows. It still falls short of the photo: the native faces remain more uniform and rectilinear, their wet highlights lean cool and lack the reference's warm golden catches, and the moss is sparser than the deepest photo joints. The reference does not uniquely constrain hidden stone shape, so the fitted joint centers were preserved rather than inferred from shadows. This is a substantive paving candidate, not a photographic match or acceptance.

Evidence: `reference-left-render-right.png` is the full original-photo-left/native-render-right board. `floor-crop-left-reference-right-native.png` pairs the same 512×512 reference crop with a true native camera subfrustum. `report.json` records valid Metal frames with no GL, console, or scene-resource errors; geometry/render validity does not imply visual acceptance.
