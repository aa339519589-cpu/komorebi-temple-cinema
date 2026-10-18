# Reference 08 — independent veranda reconstruction

Source inspected at full resolution: `references/hd/7-照片-8.jpg`.

The first candidate is an independent scene, not a camera variation of baseline.

Photo-specific elements built: close red columns with raised gold plaques; near suspended lattice lantern and underside rafters; close red railing; tall left grand hall with a long roof and dense under-eave brackets; multiple differently sized overlapping galleries; central rear five-storey pagoda and finial; arched red bridge; stone lanterns, irregular moss-clipped rocks, narrow water channel, branched pine and maple, dense individually folded garden foliage.

All rendered surfaces are authored geometry and procedural DataTextures. No photo planes, photo textures, external models, HDRs, or generated images.

Entry: `/reconstructions/scene-08/index.html?render&defer&w=768&h=768`.
Global API: `window.temple` exposes ready, renderer, scene, camera, renderReference(8), renderView, renderShot(0..7), info, dispose. Deferred loading performs no rendering or RAF.

CPU syntax checks passed. GPU frame and left/right comparison are pending root's serial GPU review. The reconstructed unseen joints and dimensions remain estimates.

## Iteration 01 image review

The actual 768px PNG was viewed. It remains substantially below the source: the close railing had a distracting central cap and little perspective, the near roof was open rafters against sky, the left grand hall was heavily shadowed, the pagoda read as stacked window boxes, and the garden had sparse flat pointed leaves with low bridge elevation. This candidate was not accepted.

The second candidate changes geometry and layout: closed boarded veranda ceiling with beams and supporting brackets; a raised bridge and rising stone/shrub banks; an oblique near railing with its sole prominent cap to the left; a taller and higher-volume grand left roof; the forward small gallery moved deeper so the main hall can read; rotated pagoda with smaller window openings, exposed white wall infill, and wider supporting brackets; true curved elliptic leaf geometry and denser branch-tip foliage. It also reduces regular wood striping, adds warm diffuse light under deep eaves, uses PCF shadows, and adds a deterministic procedural cloud sky. CPU construction and finite-value checks pass; GPU comparison remains pending.
