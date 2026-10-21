Scene04 R05: editable physical vertex-state study, unaccepted

The selected Cycles candidate is cycles-vertex-r05. Scene04 runtime remains frozen at source hash a54f64c748ae854462e55429449a78611f7c8feb45f95f02f94dbd3636e61668 (scene source commit d184848). No photograph RGB, depth surface, scene plate, painted shadow or added wetness-coverage texture is rendered.

The official export-vertex-state package contains the original POINT FLOAT r4Wetness and r4Dampness fields. Each has 24,632,274 points across five paving meshes. R04 fresh-imports all geometry and custom fields, with exact read-back hashes, original UV hashes/corner mapping, and secondary UV/color fields preserved. instanceColor remains in the separate INSTANCER path. Missing wet fields have a zero/dry fallback.

R05 reuses the packed R04 model only after checking the actual paving positions, UVs and both named fields against those hashes. Material response then separates damp substrate from pooled water in the stored geometric hollow mask. Water coating uses IOR 1.333. Neither the field values nor their spatial coverage is edited. From R04 to R05, all 28,729,038 exported triangles, full affines, linked instances, camera and incident lighting remain unchanged. The inherited physical calibration keeps the runtime sun direction with 1.65x its initial energy and a physical sky gain of 0.10. Original R03 and literal source-curve R04 candidates are retained.

The packed model opens in Blender 5.2.1 LTS with textures included. Actual Cycles full frame is 1254 x 1254. Paving and roof details are fresh source-camera subfrustum path traces at virtual 4096 resolution, rather than enlarged crops. Reports record exact native image dimensions and hashes.

Reproduction: first run render-vertex-state04.py through tools/run-blender-queued.mjs using the verified export-vertex-state package and the documented R04 environment settings. Then run render-vertex-coating04.py through the same queue against the packed R04 project. Per-candidate scripts and render/attribute receipts are retained. The R05 manifest identifies the selected model and outputs.

Physical sky, multiple-bounce shadows, real reflections, source PBR/metric mineral maps and leaf transmission are used. AgX and physical BSDFs are not pixel-equivalent to WebGL ACES/custom GLSL. Plant/carving/shrine geometry and photographic local light/glints still differ materially from the photograph; visualAccepted remains false. Root publishes the selected model with prerelease D; no release was changed by this lane.
