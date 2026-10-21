# Scene08 monumental court V2 modeling continuation

The held source is Scene08 courtyard148 R05, hash4823d9265316fcf5cd30aaa72f7ea5609edc0914beb1c768c226e1eb0790b9aa. No commit is made by this lane. Photographic acceptance remains false.

The source begins at rejected R17 hash775b3faa6ce3ee8b5f92ce05ae1a99e090d7a6a2d164794d5c8f8194d57c6328. `baseline-r17-source.tar.gz` preserves its code/config. Modeling scripts progress through real architecture, foliage and physical-material repairs. R04 source before the continuous roof correction is preserved separately. `r05-canonical-source-and-provenance.tar.gz` contains all canonical text source/provenance and modeling/bake scripts; `r05-source-manifest.json` identifies every exact binary asset in the public tree. Original CC0 assets stay immutable and are included through their declared dependencies.

The held native full/detail/report/direct comparisons are in qa/ten-reference/08/iteration-scene08-monumental-continuous-court-v2-r05-20261021/. R01–R04 intermediate/failed review folders remain unchanged.

All actual browser/Blender work goes through the shared FIFO with tools/render-one-reconstruction.mjs, tools/export-reconstructed-scene.mjs and tools/run-blender-queued.mjs. `render-physical148.py` is the exact-affine physical importer used for R04; `render-physical148-r05.py` preserves it and changes the true detail subfrustum to the R05 roof inspection. Original indexed geometry, UV/normals, RGB and affine matrices are retained, shears baked only where necessary. No geometry is rebuilt inside Blender. Cycles uses the same independent measured CC0 sky and native PBR bakes, with physical transport and recorded light calibration; it is explicitly not WebGL pixel equivalence.

R05 physical output is an independent review. Its source hash must equal the held native hash, and every exported buffer hash is checked before import. R04 physical receipt/source/light calibration remains a failed draft. No photo or generated replacement-scene image is used as the reconstruction.
