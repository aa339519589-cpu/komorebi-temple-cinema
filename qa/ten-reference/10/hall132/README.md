# Scene10 hall132 bounded component review

This pass changes the hall from roof underside to entrance. It retains the established layout125-d camera, bridge/stair opening, landings, hall floor, foundation, garden and rigid stone scans. It does not establish a finished photographic match.

The original and layout125-d actual were inspected as exact native crops before implementation. The reference has dense warm timber and gilt bearing layers; the previous actual had a broad disconnected roof void and beige X-braced transom panels. The new hall contains closed 15.2 cm timber bedding, two capped timber rafter tiers, four bearing rows per roof, registered column/head-beam heights, recessed timber friezes, 748 volumetric ornament leaves, and returned metal fittings. Materials are private hall clones. Scene exposure, fog, light setup and all other object palettes are unchanged.

Exactly two wrapper jobs were used, each at 1254 square with the established front pose and the same independent layout125 side pose. All four frames passed resource, context, GL and shader checks. Those checks only establish a valid actual render.

| Candidate | Exact actual source commit | Source identity SHA-256 | Review |
| --- | --- | --- | --- |
| A | `4db9526f81a115a65a69e182d4a3e19068876616` | `2faf4ce0e0bd3bf49448390740710d23742f364c122c801a85fa55714d09ed40` | Preserved intermediate. Thick girts hid bracket relief, rafter sleeves read as a coarse checker band, and the frieze remained sparse. |
| B | `52e9e01556fd1ac3f9d64882e42582b6f764fcdb` | `5221e4fcee7124c6dc33125aff83ab24655c84e63fad7edf786922d0f06b20b8` | Corrected A's observed hall issues: thinner girts/fascia, narrower 20.5 cm-pitch rafter ends, open receiver fittings, and fuller physical relief. B exposes more bracket structure and retains the open bridge/stair route. |

There is visible improvement in the bounded hall component. The ornament is still too regular, the hall remains cooler/flatter than the reference, and the full roof silhouette and scene fidelity remain unaccepted. No further variants or render jobs are included.

Actual frames are in `../iteration-hall132-a/` and `../iteration-hall132-b/`. `before-vs-final-native.png`, `reference-vs-final-native.png` and `a-vs-b-native.png` are exact 630×530 native crops with labels; no image resampling or retouching is used. See `review.json` for image hashes, source identities and camera poses. The new authored geometry and existing asset provenance are in `reconstructions/scene-10/hall132-provenance.json`.

The CPU audit checks finite construction, column/header registration, 419 preserved hall RNG calls, and byte-identical route/garden/camera and layout125 source. It is not a photographic fidelity test. Run it with `node tools/audit-hall10-132.mjs`; generate the QA crops with `uv run --offline --with pillow python tools/compare-hall10-132.py`.
