# Scene 04 physical maple shadow repair

Status: `rendered-review`; visual acceptance remains open.

The cached reference frame and a moving low-camera dolly frame now show actual maple leaf and branch dapple across the traced paving. The shadow pattern stays in place as the camera moves. The sun vector, intensity, sky fill, camera, measured slab joints, and temple layout remain unchanged. The repair keeps the supported west maple as solid geometry, gives its leaves explicit double-sided depth casting and disables instance frustum culling, tightens the directional shadow bias/radius for the worn surface, and reduces the paving's unshadowed local-probe fill from 1.9 to 0.95 so real direct-light shadows retain contrast. No shadow cards, decals, or image-space projections were added; temporary diagnostic geometry was removed before these final frames.

The physical shadow pass was profiled on the native Metal render. Before the material change, cached and uncached frames both lacked visible path dapple, which ruled out a stale static shadow cache. A temporary off-camera box appeared in the depth pass, and a temporary standard-material receiver showed the real shadow. The last comparison therefore uses the tuned paving material and no diagnostics. Both final frames are valid with no renderer errors.

The floor now has much stronger actual dapple, but its shadow pattern is still broader and less leaf-detailed than the photo, and the lit paving remains darker and less golden. Stone relief and slab silhouettes also remain simpler than the reference. The candidate is a concrete shadow repair, not a match or acceptance.

Evidence: `reference-left-render-right.png` compares the original photo with the native reference camera frame; `dolly-t6-reference-left-render-right.png` shows the same physical shadow through the low-camera dolly; `floor-crop-left-reference-right-native.png` isolates the path. `report.json` and `comparison.json` retain source and render identities.
