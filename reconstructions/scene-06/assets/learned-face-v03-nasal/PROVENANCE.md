# Local explicit nasal geometry, v03

Derivative of `learned-face-v02` in base commit `8082e52`. Original learned-mesh provenance and MIT source/license pins remain in `lookdev/local-triposg-head/METHOD-NOTE.md` and `tools/vendor/triposg-original-mps/`. This is not a CC0 scan or measured recovery of the reference statue.

The local repair script reads only the editable v02 Blend, unions two closed nose-wing envelopes into the actual face, performs weighted compact fairing and subtracts two shallow blind recesses. The Blend preserves the unmodified head and closed editable authoring solids. Runtime GLB has one explicit mesh, no images, textures, vertex colors or materials; it uses the retained .42 roughness central-face material in the scene. Numerical recipe, SHA256s and closed-topology audit are in `build-report.json` / `build-source.py`.

Failed candidate: native nasal87 shows spherical caps and seams. Preserved as evidence; not selected.
