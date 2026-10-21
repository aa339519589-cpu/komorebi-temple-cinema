# Real carved wood component157

Actual licensed scan acquisition and extraction, outside all live namespaces and Git. The selected source is **wood carving** by **Diana Liu / Thunk3D scanner**, CC BY4.0. The original2,158,264-triangle GLB is retained; the extracted inner peony/leaf field keeps1,633,989 original triangles. Independent validation compares every retained triangle corner and all position/normal values, with zero mismatches. Source coordinates are not remeshed, decimated, UV-baked or inferred from a scene photograph.

Start with these correctly oriented actual3D views:

- [Original carved face, front clay](review-floral157-r01/source-carved-face-front-clay.png)
- [Original carved face, three-quarter clay](review-floral157-r01/source-carved-face-three-quarter-clay.png)
- [Mounted material proposal, front](review-floral157-r01/floral-frieze-proposal-front.png)
- [Mounted material proposal, three-quarter](review-floral157-r01/floral-frieze-proposal-three-quarter.png)

The earlier PCA label called front was the plain backing. The actual carved side was confirmed from reverse imagery and source normals: raised-face mean normal+Y in inspection Z-up; plain-back mean normal−Y. In the derived glTF Y-up frame the carved face points−Z. Correctly named views above show real convex petals, vines and leaves. They are actual Cycles CPU frames run through the official shared FIFO, not image edits or relief cards. Historical mislabelled/invalid previews remain marked as such.

## Assets

- `sources/ccby-diana-liu-floral-panel/source-objaverse.glb`: original licensed file, unchanged.
- `derived/floral-frieze157-r01/component.gltf` + `component.bin`: exact selected source faces, original normals/material and reversible wrapper placement.
- `derived/floral-frieze157-r01/source-face-trace.bin` + provenance: original vertex/triangle identity mappings.
- `derived/floral-frieze157-r01/attribute-preservation-validation.json`: full zero-mismatch attribute/index check.
- `review-floral157-r01/floral-frieze157-editable-proposal.blend`: editable scanned field plus separately modeled closed timber carrier, edge framing and two side tenons; proposed finish is separate from original source material.
- `review-floral157-r01/report.json`: actual camera matrices, render identities, geometry preservation, material and unit limits.
- [Attribution and changes](ATTRIBUTION.md) and [proposal for selective use](PROPOSAL.md).

## Limits carried with the asset

The source has no UVs, photo albedo or normal map. It supplies dense real geometry normals and a constant material. Those absences are explicit; the cedar/gilt finish is an authored proposal. The source does not claim Japanese temple provenance; use its East Asian floral vocabulary selectively as an ornamental cassette, not as a replacement temple/frame or proof of a reference match.

The native scanner coordinate scale is not verified by the creator. Uniform0.001 conversion is a separate, reversible millimetre interpretation. The proposed scan field is about0.558x0.209x0.0212m; these are proposed metric-frame dimensions, not surveyed historical measurements. The closed carrier is new project geometry. No anisotropic stretching is used.

The separately acquired areong Rinzai-sanmon scan retains its original geometry, UV,1024 image bytes and attribution. Actual views show noisy surfaces and weak close texture detail, so it is retained as a connection reference and rejected for hero replacement. Its creator explicitly calls its scale approximate.

The first inspection had a read/write helper error in temporary imported geometry. Original source GLBs were untouched and hashes rechecked. The bad previews and Metal failure are invalid evidence; the corrected helper reads coordinates and validates finite/range bounds before rendering.

Photographic acceptance remains false. The carrier/finish is a concrete editable proposal; scene fitting, surface ageing and lighting still need review before integration.

## Reproduce without touching canonical scenes

```sh
node tools/run-blender-queued.mjs lookdev/architectural-scan-library157/inspect-sources157-cpu.py
node lookdev/architectural-scan-library157/extract-components157.mjs lookdev/architectural-scan-library157/component-selection157-r01.json
node lookdev/architectural-scan-library157/validate-components157.mjs
node tools/run-blender-queued.mjs lookdev/architectural-scan-library157/render-floral-component157.py
node tools/run-blender-queued.mjs lookdev/architectural-scan-library157/pack-proposal157.py
```

Source metadata/acquisition receipts record primary creator license links and the public pre-existing Objaverse mirror paths. No authentication or access-control bypass was used. Canonical Scene01 remains identical to public342af4d in a read-only diff check.
