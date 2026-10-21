# Scene02 physical reconstruction checkpoint

Status: **reconstruction in progress; visualAccepted false**. This is a coherent physical-model checkpoint, not a photographic match.

Source identity: `ecafd529352a2a95f53af500f4dc545892dca2ae42c31d41c2cb5df50e9accdc`. The exact file identities and unchanged-source capture receipts are in `checkpoint-manifest.json`. All eight final capture jobs have this same source hash. No other scene or shared tool was edited. No commits were made by this lane.

## Actual changes

- Rebuilt the hall bearing system with curved housed timber arms, alternating bearing blocks, distinct column and mid-bay heads, connected purlins and diagonal tails. Slender individually finished shafts carry returning cast clamps. Recessed lime panels, curved infill and carved lintels replace the flat red front band. Folding leaves open into a recessed sanctuary with a raised gilded relief backdrop. The front gable now overlaps its main ridge seat.
- Rebuilt the veranda lamp as warm recessed paper behind solid pierced bronze panels and cast scrolling stems, with shaped cast caps, relief leaves and linked suspension chain. Added real carved beam noses and column-head clamps on the exposed framing.
- Replaced the long sparsely leafed framing rod with a soil-embedded trunk, buttress roots, closed tapered boughs, attached shoots and individually folded leaves. Added rooted pine bough/needle architecture and coherent cherry terminal blossom clusters. Planting mounds meet the corrected basin ground.
- Rebuilt the stair as closed supported risers, individually jointed granite slabs with nosings, stepped solid cheeks and a lower landing. Existing declared scene02-local CC0 granite maps now use actual member dimensions. Fixed the finite-radiance material hook so it preserves those custom UV hooks and distinct shader keys.
- Corrected the pagoda terrain clamp to honor its declared minus0.12metre basin join, lowered the former gray bank substrate, extended the actual bounded pond beneath the bridge, and planted a broken scanned-stone far waterline. Existing actual scene reflections remain in use.

## Native evidence

`reference.png` is the actual native1254 frame. `detail-native.png` is the actual second1254 render of the hall subfrustum `[490,305,490,1254]`, not an enlargement of the saved frame. `reference-left-native-right.png` retains the original1254 reference on the left and actual1254 render on the right, without resizing either half. `baseline-left-checkpoint-right.png` compares actual unchanged-camera native renders.

The adjacent `iteration-scene02-checkpoint-veranda-10-20261021` and `iteration-scene02-checkpoint-canopy-10-20261021` folders hold additional true native1254 subfrusta. Above, root-contact and hall-bearing folders contain independent actual960 inspection views. The pose folder holds exact0,3.5,7-second native1254 camera poses.

The motion folder contains an actual960x960,24fps,168-frame,7.000-second H.264 render with a successful full decode. All native still, detail, inspection, pose and motion captures used only `tools/render-one-reconstruction.mjs` and its shared GPU mutex, with source held unchanged.

## Review and remaining visible gaps

The hall support hierarchy, separated entry depths, jointed stone, pierced lamp and connected branching are materially clearer than the initial checkpoint. Above and oblique views show real footings, stair support, roof overlap and the bank-root connection.

The reference still has much richer and less regular roof tiles, bargeboards, carved bracket masses, aged gold/wood surfaces and garden planting. The facade remains too clean and angular. Pine crowns remain overly formal, and the moving start exposes the long framing-tree trunk; it needs a broader mature crown. Distant woodland, sky radiance, warm windows, pond highlights and floor gloss are visibly different. These are real unresolved fidelity gaps. Successful rendering and geometry counts do not establish a match.

Intermediate candidates and their source snapshots are retained in passes01 through08. Pass09 contact views exposed the ridge-seat and tree-base defects repaired in pass10. The sole rejected crop preflight is recorded in pass08; it never produced a frame.

No new downloaded assets were introduced. The original declared CC0 timber, granite and rock scan provenance remains part of the source identity. New architecture and plants are authored connected three-dimensional geometry; no reference photograph or generated replacement frame is used as a scene surface.
