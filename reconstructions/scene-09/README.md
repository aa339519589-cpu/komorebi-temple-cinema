# Reference 09 night temple reconstruction

Dedicated blue-hour garden reconstruction after viewing `references/hd/8-照片-9.jpg` at full resolution. Geometry is authored specifically for the five-storey pagoda at left, monumental two-storey main hall at right, central red arched bridge, dense stone-lantern garden and a dark pond below an occupied veranda. All geometry, material grain, sky clouds and environment illumination are procedural; no image projection, downloaded assets, HDR or AI media.

Serve the repository and open `reconstructions/scene-09/index.html?render&defer&w=768&h=768`. Import maps resolve the shared Three.js vendor build without changing it. With `defer`, there is no automatic draw and no RAF. `window.temple.renderReference(9)` synchronously draws the fixed camera to the default framebuffer. `renderView(position,target,time,fov)` and `renderShot(localTime)` permit inspection and the 0–7 second reveal. `info()` includes actual draw calls, triangles, GL error and captured shader errors. `dispose()` releases resources.

The water renders the actual scene through Three.js Reflector with a deterministic small wave deformation of its projective sampling. Emissive lanterns have opaque joinery, lattice frames and complete hanging supports. Thirteen local lights are unshadowed; the moon alone casts a 2048 shadow, limiting texture samplers and preventing animated shadow jitter. Wet pavers and gold fittings sample a procedurally generated environment map initialized on first explicit render.

CPU checks: `node --check reconstructions/scene-09/src/main.js` and `node qa/ten-reference/09/cpu-check.mjs`. CPU construction checks every instance matrix for finite values. These do not substitute for the pending serialized GPU render, shader diagnostics or left/right visual review.

## Second reconstruction pass

The first GPU image did not meet the reference. The second pass replaces the lit facade box with an open recessed portal, turning door leaves, a rear gold altar, a detailed seated sculpture reused from the repository's restoration-buddha module, heavy red columns, curved multi-stage bearing arms and carved floral lintels. The pagoda has smaller windows with alternating ivory wall and timber frame, increased roof overhang and dense multi-stage brackets. Hanging lamps are now six-sided brass cages with actual curved wire rosettes, hanging chain links and narrow fittings.

The garden now uses procedural botanical leaf silhouettes and complete pruned pine branch structures with needle cards. It has smaller fern-like shoots, variable granite forms, moss dressing and permanent tiny path-light sources. Water uses multi-frequency spatial waves and nine reflection taps. Clouds use six frequency bands. Wet stone slabs have beveled irregular outlines, fine bump texture and clearcoat. The raised veranda edge is diagonal rather than a straight horizontal cutoff.

Reference camera height is 2.70m over the 1.45m stone board level; the shot camera remains 0.75–1.25m above that level. Shadows use PCF. Second-pass GPU and visual review remain pending; no acceptance is claimed.

## Fourth reconstruction pass

Actual third-pass crops are preserved under `qa/ten-reference/09/iteration-03/details/`, with separate original and render images. They show the remaining gaps clearly: the garden lacks mass and layered crowns; the upper hall reads as a flat lit box; the primary garden lanterns were projected outside the intended photo positions; the wet veranda has little visible real reflection.

This pass builds an actual recessed upper gallery with side and rear walls, a deck and ceiling, adds continuous carved valances and intermediate curved bracket sets, and replaces the simple altar with the repository's detailed furnishing reconstruction. Its throne, relief mandorlas, vessels and offering table occupy the portal depth; the figure is scaled to that setting. A fixed warm spot shadow now provides real local occlusion in the hall in addition to the moon shadow.

Garden lanterns are placed from the photo's measured screen locations. Chipped rock forms and face-following moss support connected earth islands, overlapping shrubs, ferns and crossed pine-needle geometry. The low camera no longer sees horizontal needle cards only edge-on. The scene has a separate actual planar reflection at wet-veranda height, excluded from the pond's reflection to avoid recursive captures. Fine pool waves include bounded vertical scatter of bright reflected sources. A small static contact-AO and bloom pass supplies contact shading and restrained bright-source spread. Alpha foliage, sky and reflection planes are excluded from AO depth overrides. No temporal random noise or RAF is used.

Both shadow maps are fixed, with PCF filtering. The CPU check now validates independent furnishing/pine geometry and world transforms in addition to the construction buckets. GPU sampler/program diagnostics and visual acceptance remain separate and pending for this revision.


## Enclosed night architecture candidate, 2026-10-18

`iteration-parallel40` preserves the first actual 1254px full frame of a bounded night-architecture pass. It adds cream plaster cores behind all pagoda windows, enclosed plaster bays and side walls behind the main hall colonnade, lit flank windows, additional curved cornice brackets, wood soffits and long rafters beneath the ceramic shells, deeper pagoda roof profiles, blue exterior fill and low garden lights. Visual inspection shows substantial mass and illumination gains over integrated-02, but pagoda window bays are overlit, the main shrine still reads as a black opening, and wet paving/bridge abutments remain crude. This candidate is retained before correction. No synthetic or broad test suites were run; evaluation is actual rendering and original-reference comparison.


`iteration-parallel41` preserves the corrective actual frame with lower pagoda room wash, separate amber window-paper response, a larger physical figure/altar moved forward into the portal sightline, a local shrine light, smaller wet paving slabs, stronger actual planar wet reflections, and geological bridge-end dressing. The shrine becomes visible, but the oblique camera still puts it against the portal's right edge and a broad pale platform face remains exposed. Both issues are retained honestly for the final bounded correction.


`iteration-parallel42` is the final bounded review candidate. The actual 1254px frame was inspected against the unchanged original and integrated-02 baseline. The hall and pagoda now have full cream-plaster room bodies with recessed amber windows, dense curved bracket cornices, and timber soffits/long rafters below cool blue ceramic roofs. The physical seated figure, altar and gilt relief are brought into the oblique portal sightline and illuminated locally. The former pale platform face is covered by real boulder masonry, and the two large foreground lamps use square metal frames and flower rosettes rather than the earlier hexagonal cage shape. The low garden has more local amber illumination, and the smaller wet paving slabs retain actual planar reflections.

The final frame shows materially better night architecture mass, a visible central shrine, and stronger warm/cool separation. It still falls well short of the photograph: the geometry and facade remain too regular, roof undersides and joinery are simplified, vegetation lacks the photograph's layered density, some paper/stone highlights are too strong, and wet paving/reflections remain coarse. This is a bounded improvement candidate for primary review, not a photographic match. Candidates40/41 and their source history remain preserved. No synthetic, unit, runtime or broad test suites were run; only actual serialized GPU rendering and full-frame visual inspection were used.
