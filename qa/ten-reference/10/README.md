# Reference 10 — independent rain-courtyard reconstruction

Source inspected at full resolution: `references/hd/9-照片-10.jpg`.

Entry: `reconstructions/scene-10/index.html?render&defer&w=768&h=768`.
`window.temple` exposes `ready`, `scene`, `camera`, `renderer`, `renderReference(10)`, `renderView(position,target,time,fov)`, `renderShot(0..7)`, `info()`, and `dispose()`.

## Source-led composition

- Massive left foreground red column with black shoe, overhead cross rafters, suspended warm lantern.
- Left background five-storey tower with independent tiled tier roofs, small lattice windows, long ringed bronze finial.
- Dominant right double-roof hall with continuous galleries, red load-bearing columns, bracket sets and warm lattice bays.
- Raised red arched bridge across the midground garden; carved stone lantern near center-left.
- Close wet red railing and gold ball finials at right.
- Individually extruded uneven paving, narrow drainage grille, actual geometric reflection film and rain rings.
- Moss-covered fractured rock banks, irregular branching shrubs, cedars, red maples, faint blossom trees and gray forest fog.

## Implementation and checks

All visible forms are code-built 3D. Procedural DataTextures supply neutral grain and submillimetre wet-stone bump. No downloaded models, photo billboards, image-generation assets, or external image textures.

Architectural detail routines and procedural rock/material primitives were copied into this independent directory, then composed with new dimensions, placement and independent wet garden/threshold construction. The shared scene remains untouched.

`node --check reconstructions/scene-10/src/main.js` passes.
`node qa/ten-reference/10/cpu-build-check.mjs` builds the complete scene with a stubbed renderer, approximately 1.3 s and 232,779 source instances/parts. This checks module loading and geometry construction only, and supplies no GPU or visual acceptance.

GPU capture is serialized by the parent agent. Actual rendered image comparison and further material/composition corrections remain required. This is a reconstruction candidate, not an accepted photographic match.

## Iteration 02 response to actual iteration-01 PNG

The first actual GPU frame was inspected at `iteration-01/reference.png`. It showed the hall excessively near, repeated large foreground finials, uniform bright window rectangles, a continuous mirror floor, too-large repeated rain rings, bare straight trees and simplistic lantern assemblies.

The second candidate repositions the tower and hall, lowers the camera pitch, shortens/lowers the bridge, reduces the near rail to one shaped finial, varies window brightness with a recessed open worship bay, fills the soffits with additional actual rafters/purlins/bracket rows, and replaces the hanging and stone lanterns with smaller pierced and carved assemblies. Paving receives smaller irregularly chipped boundaries and world-scale colour/roughness noise; planar reflections are masked to small uneven films and distorted by static microvariation. Rain rings decrease from 100 to 25 and become substantially smaller/fainter. Tapered bent branches, tiered cedars, dense curved leaves, shrubs and fern-like bank plants replace the first sparse crowns. PCF replaces PCFSoft.

Latest CPU checks: 95 meshes, approximately 14.42 million instanced triangles, 611,451 source parts/instances; all positions and instance matrices finite. CPU construction about 1.65 s. These checks do not establish visual quality; iteration-02 actual GPU capture remains required.

## Iteration 03 after inspecting the actual iteration-02 PNG

The second frame remained visibly schematic: bare distant cedar shafts, too much tower floor-to-floor projection, low/left nearest stone lantern and an overly broad paved apron. The third candidate compresses the tower vertically while raising its landscape base, restricts the far end of the paving into an asymmetric path, adds a rocky evergreen water margin and narrower distant stepping route, increases the nearest stone lantern scale/elevation, differentiates lit center tower windows from dim side bays, and supplies irregular shaded 3D foliage cores under the existing leaves. Distant trunks become thinner and overhead maple foliage is brought into the upper-right frame. Warm practical light reach and patchy rain-film reflectance increase locally.

CPU: 116 meshes, approximately 15.80 million instanced triangles, 636,196 parts/instances; finite vertex and transform checks pass. These changes still require a third actual GPU frame and visual comparison.

## Iteration 04 after actual iteration-03 PNG

The nearest red maple canopy cores visibly exposed large polygonal lumps in the upper-right; those cores are removed for red maple and blossom foliage. The raised tower required genuine terrain support, so a smoothly sloping wooded hillside and additional rock/shrub planting now underlie its base. The main hall entrance is moved toward the visible center-right, its lattice and lower panel are removed in the actual open bays, and the recessed Buddha/practical light and carved curved entrance trim are repositioned accordingly. The drain is shifted to the reference's bottom-center to left-midground diagonal.

CPU module syntax, full construction and finite geometry/matrix checks pass; the fourth actual GPU comparison remains required. The scene remains a reconstruction candidate.

## Iteration 05 after actual iteration-04 PNG

The fourth actual image exposed an oversized raised grate resembling ladder rungs. The grate is narrowed to 12.5 cm, set flush with the stone and given thinner denser crossbars. The tower's visible finial was substantially shorter than the source; its mast and ringed portion now extend upward while the roof/column composition remains fixed. Exposed hillside boulders are reduced and more finely branched blossom/maple planting screens the terrain. Only the two near lacquer assemblies receive a physical wet clearcoat, and distant cedar tips receive terminal foliage instead of bare pole ends.

The fourth-frame image/report are retained. Syntax and full CPU checks, including the 0–7 second low camera path, pass. A fifth actual GPU comparison remains necessary; no visual acceptance is asserted.

## Iteration 06: projection-based hall and bridge calibration

The fourth actual image's main hall remained substantially displaced: its lower-left eave projected to about (0.392, 0.408), upper-left eave to (0.427, 0.232), and entry threshold to (0.875, 0.619). Approximate manual photograph observations are (0.473, 0.352), (0.496, 0.264), and (0.870, 0.510). `layout-probes.mjs` records those observations and projects explicit 3D model anchors with the real camera; it is a CPU geometric calibration tool, not automatic image matching or visual acceptance.

The hall is repositioned rightward onto an actual deeper stone platform, rotated further, and modestly compressed vertically. Its new corresponding CPU projections are (0.469, 0.358), (0.496, 0.259), and (0.873, 0.502). Continuous masonry courses and a supported full-depth stair supply the raised platform. The porch opening is shifted within the visible facade. The bridge is rebuilt as a longer gentle asymmetric arch with raised landings, full-depth stone piers, a descending left stair and supported stone approach on the right. Its visible front-rail crest projects to approximately (0.717, 0.466), near the photograph's roughly (0.70, 0.48).

The seventh-second camera path, finite geometry and instance matrices, and JavaScript syntax checks pass. The changed overall layout requires the next actual GPU frame before judging the visual outcome.

## Actual iteration-06 review and iteration 07

The uniform locked renderer produced iteration-06 with no reported errors. Full and cropped side-by-side images use the original on the left and the actual GPU image on the right; `make-comparisons.swift` only crops/resizes those existing images for inspection. The composition is closer, but the wet stone remains much flatter and lower in contrast, masonry is overexposed beneath the bridge, the near stone lantern is too dark, and near bronze/lacquer lack actual surrounding reflections.

Iteration 07 supplies a mip-filtered procedural clearcoat normal map, stronger patchy real planar reflections, physically varied clearcoat wetness, planted moss-rock islands in front of the bridge foundation, lighter carved stone, and a narrower nearest stone-lantern assembly. Near bronze and lacquer capture a single actual scene cubemap at runtime; the planar film is hidden during that capture to avoid recursive reflection work. No photograph or downloaded environment enters any material. The pagoda shifts slightly right with a modest width reduction, and upper-right maple foliage reaches farther across the sky. CPU geometry, syntax and the low seven-second camera path pass. Actual iteration-07 rendering remains required.

## Actual iteration-07 review and iteration 08

Iteration-07 rendered without reported errors and was reviewed at full size, with hall and wet-stone crops. The bridge reflection remained too coherent, and the near finial still exposed bands. A concrete batching defect was identified: the unique-geometry merge path discarded existing smooth normals and recomputed flat triangle normals. Iteration 08 retains source normals, preserving the modeled curvature of lathes, tubes and carved figures. It also replaces the provisional sphere-stack in the doorway with the existing detailed seated Buddha geometry copied into this independent scene, adds framed plaster/diagonal timber spandrels, warms/darkens exposed timber, and gives the rain film stable anisotropic microfacet distortion and rough reflection filtering. Practical light energies increase while the stone base becomes darker, targeting the source's dark wet material and bright small highlights. CPU syntax, finite mesh/instance data and the full low camera path pass; actual iteration-08 review remains required.
