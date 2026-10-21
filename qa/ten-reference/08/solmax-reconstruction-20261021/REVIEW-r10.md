# Scene08 SOL Max r10 — review hold, not visually accepted

Source identity: **26cba87fc7d91a57a2fb66dddec94f117865873b626d6e36afe6a3f617ed94cc**. Both final native reports match the current source and load the declared local assets. All four final 1254px frames have GL error 0, valid linked programs, no page/resource errors and visualAccepted=false. These checks establish a valid native render only.

The held source contains real modeled architecture, instanced foliage, independent PBR materials/light, and a reflective stream. The original low reference camera remains unchanged. It is approximately 682,828 instances and 23,001,537 source triangles; the final film has not been encoded in this lane.

## Primary review evidence

- [Full reference-left/native-right comparison](../iteration-scene08-solmax-supported-courtyard-r10-20261021/comparison-reference-left-render-right.png)
- [True native roof subfrustum](../iteration-scene08-solmax-supported-courtyard-r10-20261021/detail-native.png)
- [Roof detail comparison](../iteration-scene08-solmax-supported-courtyard-r10-20261021/comparison-native-detail-reference-left-render-right.png)
- [True native garden subfrustum](../iteration-scene08-solmax-native-garden-r10-20261021/detail-native.png)
- [Garden detail comparison](../iteration-scene08-solmax-native-garden-r10-20261021/comparison-native-detail-reference-left-render-right.png)

The right image in each detail comparison is a fresh 1254px setViewOffset subfrustum, never an enlarged screenshot. The reference crop is enlarged for comparison. Both final jobs use the same source hash; source/frame receipts are in their report.json files.

## Geometry and material work

The main hall's reversed +0.90 azimuth and tall rectangular facade were replaced with a broad front hip at -0.28, a short right return, a narrower raised body, three spreading bracket/beam stages and a continuous deeply curved tiled soffit. The speculative bell canopy was removed. The lower gallery now has a real hip, bearing posts/piers, a connected three-step landing and planted bank contact. Gate/right-post framing, pitched foreground ceiling, corner newel and bronze finials are modeled. Pagoda storeys were compressed around an unchanged crown/spire height. The bridge crosses toward the right with modeled deck, rails, newels and a correctly spanning landing abutment.

The garden has mounded terrain, a bent narrower stream, upright and flat rocks, dense irregular leaf pads, physical needle crowns, petal flowers, leaf venation and attached canopy limbs. A native garden inspection exposed the old rear hall's doors in the stream cut; r10 raises that hall on a closed coursed stone platform. No door panel now sits at the visible stream termination. Six local CC0 PBR maps and their exact provenance/checksums are declared in the scene assets. Raw lacquer gloss in r05 was retained as failed visual evidence and corrected before the held render.

## Remaining fidelity limits

The full comparison still differs substantially from the reference. Dougong and tile rhythms remain too uniform; carved motif shapes, facade recession and some roof pitches are approximate. Timber color/light still lacks the photograph's warm varied carved surfaces. Granite erosion, moss, leaves and bronze hardware read as authored patterns; near foliage remains simplified and the rear retaining wall is a structural reconstruction assumption. Garden and facade occlusion require more reference matching. Source-valid shaders and these geometry changes do not constitute photographic acceptance.

The earlier r01–r09 images/reports are preserved. Initial and held scene sources are archived here; intermediate passes are image/report evidence, not separate standalone source snapshots. R09's 0/3.5/7 second native shot stills were inspected for 3D camera behavior; r10's added platform/canopy support work is verified by the final stills. The complete final film remains the root integration task.

Only scene08, its declared assets, README and scene08 QA were changed. No commits or shared-file edits were made in this lane.
