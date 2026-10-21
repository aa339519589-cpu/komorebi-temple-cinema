# Sunset pond stone and woodland repair

Visual acceptance remains false. Hall/bridge/garden layout and material detail still differ substantially from the reference.

The old low-resolution faceted stones are replaced with six actual CC0 Poly Haven Rock Moss Set 01 scans, with original surface materials and true eroded geometry. Each rotated/scaled scan is placed from its actual vertex minimum, with a small soil embed. The earlier opaque moss caps are removed; scan moss remains attached. The random-draw sequence is preserved so this substitution does not silently move unrelated garden objects. Assets and creator/license are declared in asset-dependencies.json and the loader.

The distant-tree merged geometry formerly recomputed normals after converting to non-indexed triangles, flattening every canopy face. The current merge preserves the smooth transformed source normals; crown volume gains small geometric lobe variation. Near woodland now has its own opaque material, so a closed tree crown no longer receives the foreground thin-leaf transmission term.

These fixes improve actual geometry and shading, but the crowns remain too blocky, the terrace/stair banks remain too formal and the architecture still lacks source-level carving and natural material response. This native still and true detail are preserved with source identities in report.json.
