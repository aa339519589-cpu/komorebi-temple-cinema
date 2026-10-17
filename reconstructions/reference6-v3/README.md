# Reference 6 independent reconstruction v3

Actual three-dimensional interior, geometry, materials, directional shadows, room environment capture and planar floor reflection. No original photograph is embedded as geometry or texture.

Open `index.html` in a WebGL2 browser. It renders one fixed frame; no animation loop. Use one version at a time to avoid retaining multiple large GPU scenes. The historical root scene remains unchanged.

The `three` and `three/addons/` import map refers to the repository's existing pinned vendor. Six local source modules are preserved byte-for-byte from this candidate. `runtime.json` binds them to that vendor.

This is a reconstruction candidate, not a claim of photo matching. v1 establishes the independent room; v2 changes the front radiance field, ceiling and old hall scaling; v3 reduces the washed-out front fill, separates low/high room environment capture, and mounts the next complete figures and altar. Indirect area-light proxies and room probes are approximations rather than full global illumination.

The early `templeDiagnostics.snapshot()` and `temple.getRenderDiagnostics()` expose technical render failures. A nonempty image is not success if these diagnostics report a failure.
