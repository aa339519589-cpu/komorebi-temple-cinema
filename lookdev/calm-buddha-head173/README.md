# Actual serene face source candidate 173

R01 is a real sculptural surface ready for owner165/root review. It replaces no canonical asset. Photographic fidelity and production integration remain unaccepted.

The selected donor is **“Buddha head” by peel-3d.com**, an approximately 16-inch sculpture captured with a peel 3D scanner. Its creator page and primary API explicitly license the model **CC BY 4.0**, including commercial adaptation. The unchanged public Objaverse GLB independently embeds the same creator, model URL and license. Culture, period and original sculptor are unspecified. This is a cropped adaptation of a crowned decorative head, not a verified Japanese Amida.

- Primary creator page: https://sketchfab.com/3d-models/buddha-head-fb17c123ad9c4c0fb6baf723b3fffd79
- Primary metadata: https://api.sketchfab.com/v3/models/fb17c123ad9c4c0fb6baf723b3fffd79
- License: https://creativecommons.org/licenses/by/4.0/
- Exact original GLB: `sources/fb17c123ad9c4c0fb6baf723b3fffd79/source-original.glb`, SHA256 `41d8c094ada94bcf265b92ac72e4737f60710532dd5719f871cacd144f305d9d`.

## Review artifacts

`evidence/component-r01/front-clay.png`, `three-quarter-clay.png`, and `profile-clay.png` are actual 896px Cycles Metal renders through `tools/run-blender-queued.mjs`. They use a plain neutral clay material, without scan color, photo maps, normal maps, displacement or reference projection. See `review.html` for the three views together. The final queue log and render report identify the exact source GLB, source builder and PNG hashes.

The face has actual downcast eyelid volumes, nasal bridge/nostrils, closed lips, rounded cheek/jaw anatomy and elongated lobes. It also has scan chatter, asymmetric mouth corners and donor side wave hair. It is broader and softer than the reference face. These differences remain visible in the clay evidence and require review; this candidate is not a photographic match.

## Editable component

`component-r01/actual-face-ears-neck-y-up-z-front.glb` and `actual-face-ears-neck-sc07.bin` contain **166,523 vertices / 330,147 triangles**, each about 8.9MB. The GLB and SC07 use **+Y up, +Z front**, with the neck plane at Y=0 and the crown plane at Y=1. Source units have only undergone rigid recentering and uniform scaling. The component includes actual face, ears, jaw, neck and side hair. The headdress above the crown plane and broad lower bust base were clipped away.

`component-r01/actual-source-component-editable.blend` contains the exact imported component and the neutral review studio. `build-component.mjs` is the editable pure CPU extraction recipe. No remesh, facial field, source projection, smoothing, facial displacement, missing-side mirror or authored facial closure was used.

There are exactly two deliberate open mounting loops: the neck has 1,310 points and the crown has 1,589 points. `measured-rings.json` supplies ordered full coordinates for both cuts and an additional measured jaw cross-section. Close these or stitch them to locally authored mounting geometry during integration; the visible face must not be projected onto a separate head shell.

`source-vertex-barycentric-trace.bin` and `source-triangle-trace.bin` trace every output vertex and triangle to the unchanged original source. Format and primitive offsets are in the manifest. Only boundary triangles are linearly split; 325,801 original source triangles remain uncut. Original normals are retained, with normalized linear interpolation only at new cut vertices.

Independent published-float32 validation checks source trace reconstruction, one connected surface, two mount boundaries, zero nonmanifold edges, zero degenerate triangles, zero opposed source-normal faces, and final render hashes. Correct topology is evidence of usability, not visual acceptance.

## Reproduction

From the project root:

```sh
python3 lookdev/calm-buddha-head173/fetch-source.py fb17c123ad9c4c0fb6baf723b3fffd79
node lookdev/calm-buddha-head173/build-component.mjs
node tools/run-blender-queued.mjs lookdev/calm-buddha-head173/render-component-queued.py
python3 lookdev/calm-buddha-head173/verify-component.py
```

`fetch-source.py` pins the two verified public Objaverse paths; the exact source bytes are already preserved in this package. No account, paid acquisition or protected viewer payload was used. Actual Blender work only ran through the official shared FIFO. Any later Blender CPU integration recipe still requires the parent’s exact hash review under the project rules.

## Preserved alternate

The CC BY HoangHiepVu donor `739d2c82ee564863a2dfa579910f8369` was also fetched and rendered in neutral clay. Its frontal face is attractive but the opposite ear, rear skull and top are missing. It is **rejected as the primary head**, rather than silently mirrored or filled. The 3MB original and four actual triage views remain preserved. Other small primary-page previews are screening evidence only, not modeled geometry.
