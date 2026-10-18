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

## Iteration 02 image review

The actual second GPU image was viewed. The image still falls well short of the source. The forward railing cap is now correctly left of center and the bridge sits higher, but the grand left hall reads as a tall open shed with large blank white panels, the close ceiling clips the tower tip, and the garden remains too low and sparse. Its geometry and lighting require further work.

The third candidate adds complete paneled long side elevations to the halls, with red framing, smaller lattice bays, horizontal ties and more supporting bracket sets. Every roof now has a separate timber underside and full curved radial rafters below its ceramic shell. The foreground ceiling moves upward and loses the central large bracket, while the close lantern becomes smaller and higher. A major pine moves forward to form a visible intermediate crown, several large multilayer shrubs now occupy the central banks, and fern elevation follows the rising rocks. A small generated sky/ground environment texture supports reflective metal and water; it contains no external imagery. Cloud contrast increases and fill light decreases after the second image appeared flat. No visual acceptance is claimed.

## Iteration 03 image review

The third actual PNG was viewed. It now reveals the complete tower finial, timber undersides, red framed side elevations and an intermediate pine. It still does not match the source: the large left roof mainly presents its underside instead of the source's broad upper blue-tile surface, the building elevation is too plain, and the pine has overly planar crown layers.

The fourth candidate therefore changes the left building arrangement again: a wide, deep short grand hall exposes its upper tiled roof, connected to a separate long receding side wing. The pine now has a bent segmented trunk and tapered drooping-then-rising branches with thicker leaf volumes. More distant green trees support the pagoda's backdrop. Leaf orientations vary through a wider range, close timber has actual rounded edges for glancing highlights, and plaster/bark/moss receive restrained generated surface detail. CPU construction and finite data audit pass. The latest geometry is not yet visually accepted.
