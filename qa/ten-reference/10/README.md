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
