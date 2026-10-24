# Scene01 R09 physical diagnostic replay

Canonical source: `d2587c2f5426ba656dc4c0d385b6499a452fbf26ff7352b9e712adb82e449dbd`. This diagnostic does not change the browser scene. Photographic acceptance is false.

The original source and original asset files remain in place. R08 failed its reviewed384MiB unique cap after395,264,899 unique payload bytes; all18,314 saved payloads were independently byte/hash checked before deleting only its derived export assets. Its failed native PNG/raw and complete receipts remain retained.

R09 is a separately authorized, one-shot fresh export. Its exact settings and prior-failure budget rationale are in `physical-r09-settings.json`; the fresh-start threshold is2,040,109,466B, the unique cap and export free floor are each805,306,368B. The physical wrapper monitors a268,435,456B emergency floor. No third automatic export or second physical frame is authorized by these scripts.

Replay entry points, all from repository root:

1. `node lookdev/scene01-rebuild219/run-export219-r09.mjs` submits to the official GPU FIFO. Existing attempt/path protection prevents overwriting this attempt.
2. `node lookdev/scene01-rebuild219/verify-export219-r09.mjs` checks every named file against expected byte length and SHA256, all source identities, actual water buffers and complete water transform. The CPU plane constructor is only a byte-comparison oracle; the physical importer uses held exported buffers.
3. `node lookdev/scene01-rebuild219/run-physical219-r09.mjs` submits the single physical script through `tools/run-blender-queued.mjs`. It is pinned to one1254 PNG, max96 adaptive samples/480seconds, Metal GPU, no Blend or animation. An existing attempt/PNG is never overwritten.

Replay in a new explicit attempt directory requires separate authorization and new receipt names. Do not remove these retained receipts or disable the source/storage guards to force an additional run.

The same official physical job first checks the actual installed Blender sky RNA enum, all required fields and assigned values before loading large geometry or textures. The receipt is `physical-r09/sky-api-compatibility-r09.json`; absent required fields stop that job. Selection is only among the previously declared physical Nishita/Multiple Scattering atmosphere enum names. The solar direction comes from the actual exported source DirectionalLight. There is one atmosphere solar disc, no additional fill, sun lamp, lighting card, painted background or photograph. Source fixture emission on modeled surfaces remains, while source leaf added radiance is replaced by an explicitly declared diffuse/translucent adapter.

All positions, normals, indices, UVs, texture images, source material color and instance color remain from the verified export. Orthogonal transforms use linked instances; affine shear/singular transforms are baked with their original triangles rather than dropped or decimated. The only water geometry is the actual visible native Reflector record and full matrix, with a separately declared opaque dielectric surface approximation and the original six wave functions as physical bump. Reflections are real scene and sky paths. Native GLSL sky/wood/stone/bark/leaf/waterfall shader hooks and native post effects are explicitly enumerated as cross-renderer limitations in the physical report.

The export scene manifest, export report, verification receipt, settings, physical script, physical report and actual native/physical PNG identities must survive any derived-cache cleanup. Only the exact R09 `assets` directory may be removed after verified physical completion and a byte-reverified cleanup receipt. Original assets, failure receipts and historical images are never cleanup targets.


# Authorized API/direction repair chronology

The R09 full export succeeded with419,292,771 unique payload bytes,18,426 recorded files and zero source errors. Every byte length/hash and original water buffer/fullmatrix was verified. R08 partial expected payloads also all match the held R09 complete payloads by filename/length/SHA.

R09 physical execution stopped before loading large geometry because actual Blender5.2.1 RNA has aerosol_density and lacks dust_density. Its failure folder/receipt are retained unchanged. Root then explicitly authorized one R09b API repair reusing this export, followed by a separate R10 direction correction after actual R09b inspection. These are explicit bounded authorizations, not automatic retries.

R09b produced a real1254/96 Cycles frame, but its sky azimuth convention was wrong. Its original PNG/report remain intact and its review marks lighting-invalid. The exact official v5.2.1 implementation yields D=(cos(e)*sin(r),cos(e)*cos(r),sin(e)); the correct RNA rotation is atan2(D.x,D.y). R09b had used atan2(D.y,D.x).

R10 changes only that rotation convention and adds the actual-RNA forward direction/source-camera projection guard. It retains all R09b geometry, PBR material settings, energy, physical sky model, camera and fixed96/noBlend recipe. The actual R10 PNG and review are in physical-r10. Its real RNA forward direction/projection residuals are zero, while the actual horizon is RGB8-clipped over a wide region; an isolated solar-disc image centroid cannot be measured. This is a diagnostic with photographicAcceptance=false.

The prepared R09c files are an unexecuted CPU draft of the direction correction; Root named the actually executed corrected attempt R10. No R09c GPU job/export was submitted. The granite node port plan is CPU-only and was not invoked by R10.

Root explicitly requested keeping the complete verified export-physical-r09/assets directory reusable for the next physical iteration. It remains present. No R09/R09b/R10 derived-cache cleanup has been invoked. R08 is the only removed assets cache, under its complete validated cleanup receipt.
