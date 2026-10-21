# Scene07 physical155 R02 — source camera-background port

Frozen reconstruction source:f3638c92c8f80d8cee8e40f346d179b4ce24e0211a44b1619ec8c2076ac03281. One actual96sample1254x1254 PNG was rendered by reopening the existing physical155 blend; no new export, duplicate geometry/assets, blend save or backup blend was created. Baseline155 images and receipts remain unchanged.

Only the World camera-ray branch changes. The original already-declared sky145 sky-only PNG is decoded as sRGB and sampled in world longitude/latitude, using the exact source146 cap center(-1.848521751106241rad),70degree width,-5..30degree latitude range,8percent edge smoothstep and1.1linear gain. Outside the cap the original aligned Qwantani field has source display gain0.08. The native angular halo and aligned analytic solar disk equations are included. There is no camera-facing plane, architecture image or target-photograph backdrop.

The previous measured HDR branch remains untouched for all non-camera rays, including actual GI and physical reflections. Geometry, PBR, UV/normal/color attributes, affine matrices, actual Sun/practical lights, camera/DOF, volume, exposure and AgX settings are reused unchanged. Object/material/light/camera state signatures agree before/after, and the reused blend file hash is unchanged.

Actual review shows blue/gold cloud structure and the aligned disk replacing the baseline's near-white background. The unchanged physical AgX/atmosphere still gives a more muted palette than native ACES; this port is not native pixel equivalence or photographic acceptance. Original source architectural/garden approximation remains visible.

The existing physical155 true hall detail is reused: its source540,430,240,1254 subfrustum contains occupied building/forest geometry, so no duplicate sky-only close render is required. The new report links that actual96sample detail and records the measured baseline/R02 full-image crop differences as diagnostics, not acceptance scores.

Adding the camera branch redistributes some sampling/noise; existing geometry pixels are not claimed bit-identical. This does not change the preserved physical non-camera radiance function or source model/light parameters. The linked hall detail remains explicitly the original155 physical capture.
