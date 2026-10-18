# Scene 10 source comparison under max review

The supplied 1254 × 1254 photograph and the actual iteration-11 GPU image were
inspected in full, then in the wet-stone, hall and garden crops.

The first structural hypothesis is that the foreground fails primarily because
the grille was embedded under uncut slab geometry, diffuse mineral marks were
too coarse/bright, actual reflected lanterns were blurred into broad yellow
bands, and the returning near handrail was outside the visible frustum.
The installed max01 candidate clips the actual extruded paving around the slot,
preserves an inset grille and dark gaps, refines/darkens mineral aggregate,
uses sharper physically rendered reflection fragments, and adds smaller paired
rain rings and a diagonal returning handrail. A raised planted rock bank and
right evergreen restore the major occlusion layers below/over the building.
The nearest stone lantern's roof position stays nearly fixed while its plinth
is raised and shaft compressed to the photographed base height.

The previously calibrated roof, doorway and bridge crest positions remain.
The pre-existing random garden layout is preserved across paving topology
changes. All added visible forms remain code-generated 3D; all texture data is
procedural. No external model, image texture, HDRI or image plane is used.

Visual acceptance remains false. Actual max01 GPU comparison is required before
assessing this hypothesis; CPU geometry validity alone does not judge the image.

## Actual max01a review and the second bounded candidate

The max01 shader compile used a reserved GLSL identifier; its failed report is
retained. The corrected max01a produced a valid 900px GPU image, inspected in
full and against the original in garden and wet-stone crops. The grille and
returning rail now appear, but the ground still has broad yellow glossy lobes,
rain rings are too white, the tower's lowest eave remains about 5% of image
height above the source, the near gold fitting is vertically compressed, and
the bright X-shaped facade bands simplify the entrance markedly.

The second candidate replaces diffuse-looking broad specular lobes with a
lower-roughness base and explicitly shaded millimetre stone relief. It reduces
ring opacity, adds fixed-noise GTAO derived from the actual rendered depth,
and refits the near gold bulb/black collar, porch-soffit angle, tower body and
supporting hill against those visible proportions. The tower finial's upper
world position stays nearly fixed while its body extends down. Main hall and
bridge transforms remain unchanged. The doorway receives bounded infill, a
recessed smaller statue, carved timber/bronze transoms and two actual lamps.
Denser domed leaf groups replace the exposed flat oval canopy bodies.

CPU construction, finite geometry/instance data, JavaScript syntax and the
complete 0–7 second low camera path pass. The rendered depth postprocess is
only exercised by the forthcoming actual GPU image. There will be no third
visual tuning cycle in this delegated pass; material and botanical fidelity
remain items for independent review even if the second render is valid.

## Actual max02 result — not visually accepted

The actual 900 × 900 GPU frame and all three original-left/render-right crops
were inspected. `report.json` identifies source commit
`f33193d5b19bbb4013b0f4603a6fd7fca268de4e`. It reports no resource errors,
GL error zero, all 34 programs linked, a retained context and an opaque frame.
The final CPU construction/finite-data/camera-path check also passes. These are
execution checks, not photographic acceptance.

The actual image improves the grille visibility, removes the broad white
X-panels, lowers the bottom pagoda tier and concentrates practical highlights.
It still fails the photographic target substantially:

- The paving is too regular and reads as glazed tiles; reflections remain
  straighter and less broken than the original wet rough stone.
- Rain rings are repeated clean ellipses; the original has finer rings mixed
  with irregular puddle texture and many small, sharp wet highlights.
- Rocks remain smooth and exposed, with thin flat leaf layers over them rather
  than dense, varied wet moss and planted crevices.
- The main roof and wooden facade lack the source's dark, warm, deep hierarchy;
  the depth-derived shading also exposes conspicuous pale/noisy distant foliage.
- The near gold profile was stretched too far into an elongated urn.
- The revised left soffit angle moves too much of the overhead canopy outside
  the image; the large triangular framing mass in the original is missing.

No acceptance percentage is asserted. The source remains a review candidate.
Both valid actual frames are retained at `iteration-max01a/reference.png` and
`iteration-max02/reference.png`; the compile failure remains separately in
`iteration-max01/report.json`. This bounded pass stops here for independent
review instead of continuing an automatic visual tuning loop.
