# Architectural scan library157 — attribution and changes

This independent library is outside all live reconstruction namespaces. Original model files are retained unchanged. No canonical scene or Git integration is part of this lane.

## Selected carved floral source

**wood carving** by **Diana Liu / Thunk3D scanner** (profile identifier Diana123456).

- Creator/model: https://sketchfab.com/3d-models/wood-carving-93766a4c12eb4c278d23294582034e8c
- Creator profile: https://sketchfab.com/Diana123456
- Primary current license metadata: https://api.sketchfab.com/v3/models/93766a4c12eb4c278d23294582034e8c
- License: Creative Commons Attribution4.0 — https://creativecommons.org/licenses/by/4.0/
- Public existing mirror: https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-080/93766a4c12eb4c278d23294582034e8c.glb
- Source SHA256: `b0fba7e24feab9e117f47d4e9b98cf1cfabff47769c06d0455ca79ad8b79650c`

The creator identifies a real wood carving scanned with a Thunk3D FisherW handheld scanner. The primary API calls it CC Attribution, explicitly permits commercial use with credit, and marks it downloadable/unprotected. The GLB's embedded attribution independently names the same creator profile and CC-BY4.0. Acquisition receipts preserve those facts and their source hashes.

Changes: selected only original triangles from the inner peony/leaf field, removing the outer plain frame. No remeshing, decimation, UV generation or texture bake is applied to the source carving. A reversible wrapper adds rigid PCA alignment and a uniform0.001 native-unit conversion. That millimetre interpretation is **unverified**; the creator does not provide surveyed dimensions. Original coordinates/transforms and the exact source vertex/triangle trace remain available. Do not present the proposed metric scale as a measured artifact dimension.

The original GLB has positions, geometry normals and a constant material; it has **no UVs, image albedo or normal map**. Their absence is preserved rather than filled with invented original data. The editable proposal adds a separately named solid timber carrier and a declared procedural aged-cedar/raised-gilt finish. Original source material remains available in the distribution and editable model. Source geometry remains under CC BY4.0; retain this attribution, license link and changes record with exported derivatives. The added carrier and material code are original project work and are not claimed as scanned historical joinery.

This is an East Asian peony/leaf ornament vocabulary suitable for selective floral frieze studies. The source does not claim Japanese temple provenance. It must not be labeled an exact Japanese architectural artifact or dropped in as proof of photographic reconstruction fidelity.

## Acquired Japanese-style timber reference, not selected for hero close

**臨濟護國禪寺 山門** by **areong**.

- Creator/model: https://sketchfab.com/3d-models/e647312c330f442a9662e97b386ea14f
- Creator profile: https://sketchfab.com/areong
- Primary current license metadata: https://api.sketchfab.com/v3/models/e647312c330f442a9662e97b386ea14f
- License: Creative Commons Attribution4.0 — https://creativecommons.org/licenses/by/4.0/
- Public existing mirror: https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-077/e647312c330f442a9662e97b386ea14f.glb
- Source SHA256: `9c02d8fd9f70641af233d1e34094339d2313dab41f4453874136721da4fc71c2`

The creator describes the Rinzai/Myoshinji-branch sanmon at Linji Huguo Chan Temple in Taipei and identifies its source photographs as21March2020. The creator explicitly says it is roughly scaled. The primary API and embedded GLB attribution agree on CC BY4.0. Original geometry, UVs, normals and the original1024x1024 embedded image bytes are retained; original normal-map data is absent. The source uses KHR_materials_unlit and its photo color contains captured illumination. It is not calibrated PBR albedo. Actual source views reveal noisy geometry and limited close albedo detail, so it is retained as a timber connection reference, not offered as an accepted hero replacement.

## Source-facing direction and invalid attempts

The first PCA camera label named front looked at the plain back of the floral panel. Actual reverse-image inspection confirmed the carved side. Original transformed normals independently confirm the raised face points predominantly+Y in inspection Z-up, equivalent to−Z in derived glTF Y-up. Correctly named carved-face images use this direction. See `inspection-r02/floral-face-orientation.json`.

Earlier temporary previews were invalidated because an inspection helper accidentally wrote an uninitialized array into imported in-memory vertex coordinates. Original GLBs were never changed; their acquisition hashes were rechecked. Bad-script text, failure receipts and invalid previews are retained and labeled. They are not geometry or fidelity evidence. Current inspection uses read-only coordinate access and finite/range checks before rendering.
