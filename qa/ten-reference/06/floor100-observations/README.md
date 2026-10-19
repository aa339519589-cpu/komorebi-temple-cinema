# Scene06 foreground timber panels and their actual-room reflection

Base `41a7b6a1425e34501164df7509edcae54ea16bcd`. Before changing anything, the stored r01 film endpoint was checked against current06 source: identical `a9801499289e22aed8d1892f8cb287c066782bf7f9a39de433ebb425b6ffcc21`. Its1440px endpoint is resampled only for the explicitly labelled QA comparison crop. All new full/detail/inspection outputs are actual native1254 renders.

The original photograph remains under its original copyright. Reference floor crop/grid and `comparison-provenance.json` are comparison evidence only. No reference RGB, gold/window reflected image, AI bitmap or height field becomes a scene input.

## What can actually be observed

The lower floor has a clear diagonal left seam near(127,1253),(235,1165),(335,1070),(409,1005),(457,963), plus a right seam near(1053,1253),(973,1165),(885,1070),(822,1005). Point uncertainty is about3px. Thin transverse fragments are visible nearY1070 and1165. A line nearY1005 coincides with the mat front/glare and is explicitly low confidence. Wood/lacquer grain broadly runs entrance-to-altar. Bright gold/vertical window images are reflections, not wood colour.

`fit-visible-seams.mjs` intersects these rays with the retained physical floorY0 using the frozen camera[0,.58,8.4], target[0,2.4,-2.3], FOV62. The resulting mean longitudinalX values are−.642657 and+.566833m; transverseZ values5.195506(low confidence),5.955862 and6.573938m. These are dimensions conditioned on an existing reconstruction camera, not metric site measurements. The observation arrays, world points and uncertainties are retained separately in `observations-and-ground-fit.json`.

The previous floor already had50mm solid planks. Its fixed.72m pitch /1.74m stagger did not locate these visible joints. It also had a whole transparent Reflector sheet atY.004, using an analytic old-board seam mask. It was not an opaque photographic background, but physical plank gaps did not own the visible reflection receiver.

## Two bounded corrections

The central patchX−1.8…1.8m /Z3.8…10.1m now uses21 closed50mm timber panels with actual.9mm gaps and.4mm bevels. Existing boards are clipped cleanly at the patch start. The visible seam dimensions guide the central divisions; off-frame rows, inner/obscured subsidiary lines and the perimeter transition remain structural inference. Original narrower planks elsewhere are retained. The21 panels total588 triangles, all finite/positive-volume/manifold after1μm position welding; `audit-panels.mjs` inspects their actual generated geometry. Existing substrate top now touches every board undersideY−.05; top floorY0 is preserved.

The original actual-room Reflector capture remains an internal tool with `colorWrite=false`, `depthWrite=false`, rendered before the physical boards. It has no visible surface colour. The room radiance enters only each opaque floor material's clearcoat indirect term through the retained physical material BRDF, with bounded metric varnish normals and roughness filtering. No captured light enters diffuse. There are no shader-painted seam masks: gaps and bevels come from the closed wood solids. The base woodMap and brown pigment remain independent original procedural materials; all gold/subject materials and all lights remain unchanged.

During the reflected room pass, floor capture sampling switches to a black fallback to avoid a read/write texture loop; afterward the actual HDR target is restored. The fallback is owned by the existing material-texture disposal. The private capture wrapper also reverses inputP[8] while Reflector copies its off-axis camera, then restores the main camera. This follows the parent-provided local scene03 water fix, without changing vendor or centered movie projectionP[8]=0.

## Actual review

Two actual full+native-detail rounds were rendered through `tools/render-one-reconstruction.mjs` shared GPU mutex, with true subfrustum[250,900,350,1254]. The100a joints looked excessively black/heavy; its exact changed source/report/full/detail are retained.100b reduces only gap/bevel dimensions and owns the fallback resource. Both full and detail were actually viewed. Off-axis detail shows coherent complete altar/room reflected geometry, not a clamped single-column stripe.

One allowed independent real view at[0,2.2,7.6] toward[0,0,5.9], FOV70, was also rendered/viewed. Its steeper angle reveals wood faces and real joints with less grazing reflection. It does not alter the reference camera or film route. Final evidence: `../iteration-panels100b/reference.png`, `../iteration-panels100b/detail-native.png`, `../iteration-panels100b-top/inspection-view.png`. Final source identity `a24d4085d73aaf73b3a1c3ad83114f6f4d9d6597beb7dce42c1687b7e33dde79`.

`scope-receipt.json` confirms12 protected tracked files remain byte-identical. Reversing only the floor block/import/capture call reproduces the previous complete room builder exactly: triad, altars, every hanging ornament, walls/columns, light field and camera are preserved.

The photograph still has much softer/brighter reflections and different illumination. Strong orange window lattice bands in this candidate come from the retained actual3D light/shadow field; they are not painted into wood or adjusted with a global grade. The768px planar capture remains an approximation. Microfinish, inferred joints and complete scene fidelity remain unaccepted. No third round, suite, film or push is included.
