# Scene01 structure208 — immediate Astra handoff

Authoring and new render submissions stopped at the explicit model-switch request. No own native job remains active. Do not kill/cancel any global job. Complete machine-readable checkpoint: `HANDOFF208-ASTRA.json`; exact current/baseline file maps and one-file delta: `HANDOFF208-source-identity.json`.

Only runtime change so far is **new, unwired** `reconstructions/scene-01/src/bridge-court208.js`, also copied byte-exact to `handoff-source/`. It has not been syntax checked, imported, rendered or accepted. All original185 runtime modules remain byte-exact, including camera/main/dolly/garden/layout/architecture. `r00-source/` is a compact97KB baseline snapshot of the seven likely editing modules. Do not clone the repo or copy large assets; free disk was1.2GiB.

I personally inspected the original HD01 and185R04 actual full, plus unscaled bridge crops (`reference-bridge.png`, `actual185-bridge.png`). The reference shows layered arch timber, shorter/less bulky crossbeam ends and smaller dark metal caps. Current bridge reads as a thick blank dark fascia with checker-like projecting joist ends and large finials. Source reading exposes a narrow abrupt L approach ending short of the stair forecourt, isolated tall end masonry, and an imported but unused `bridgeSupport124` terrain function.

Two genuine baseline1254 jobs completed through the official FIFO, both source `116237412503ed50dc2832d15c969056fea0f3c43c66f5ea3168ad9873c8beef`, errors empty:

- `qa/ten-reference/01/iteration-scene01-structure208-baseline-low/inspection-view.png`; report beside it. Old PID61389, exec session93591 completed.
- `qa/ten-reference/01/iteration-scene01-structure208-baseline-overhead/inspection-view.png`; report beside it. Old PID61390, exec session99647 completed. This full overhead is genuinely canopy-occluded, so it does not establish contact.

The prototype keeps the physical bridge end seats and old reference camera. It proposes three half-lapped arch stringers, matching closed cross joists/deck boards, thinner continuous rail members, bent post straps and smaller metal caps; a fitted central bent; end landing masonry; a proper three-riser north flight, turning landing and three-riser east flight; a west ten-riser garden approach; and a cut-stone forecourt sharing the actual oblique hall stair foot. It also exports an actual-instance-only plan/side inspection, explicitly omitting plants/roofs/water only for contact review. Full/hero/low must retain the complete scene.

Review and repair before wiring:

1. **Known sign bug:** `bronzeTie208()` rotates its depth-profile with positive Y pi/2, reversing intended Z. Correct its transform or emitted Z reflection.
2. **Known interference:** current end sleeper blocks intrude into proposed full masonry landings. Model real timber receiving pockets or adjust the stone seats; do not conceal an intersection.
3. None of the prototype flags/volumes is validation. It has not generated an improved208 image.
4. Wire `buildBridge208` in place of old `garden.js` bridge body. Remove/skip the old `layout124-raised-stair-landing-flagstones` and `garden132-supported-bridge-to-hall-garden-path` geometry when inserting `buildCourt208`; keep old RNG consumption to avoid unrelated framing-tree changes.
5. Integrate `bank208` into the real terrain/site function **before** existing `bankHeight124` waterfall-channel cutting. Add physical route clearance/pruning for whole shrub/pine/fern groups while still executing their seeded loops. A temporary `B.put` suppression and branch suppression inside a plant scope can omit blocked groups without changing random sequences. Keep large framing-tree seeds unchanged.
6. Wire explicit plan/side inspection through negative shot IDs (suggested-209/-208) in Scene01 `main.js`, following existing `renderStairContact124`. Never change normal camera/dolly paths for an inspection.
7. Render official FIFO full/true hero/low and structural plan/side; inspect and repair actual contacts and visible shape. No photographic acceptance from counts or closed flags.

Useful coordinates: original bridge center `[-3.48,.8154071,-.8749234]`, yaw `.0022982`, scale `[1.13,1,.964018]`, half-span3.36. New prototype deck top adds the existing board half-thickness `.085` to the old arch centerline. Stair foot `[4.5048401,2.1,-4.6432529]`; flight top is original `S.top + hall axisZ*.9`. Prototype forecourt is3.8m wide×1.95m deep, exactly adjoining that foot. Its east path's final edge follows the actual angled left forecourt boundary, rather than stopping0.6m short.

No Scene06/R06b, floor200, other-scene, shared-tool, Git, Blender, export, model delegation or large-copy work was performed in208. Root has exclusive integration/commit ownership. Continue as `gpt-6-astra` with Max effort per the new user instruction.
