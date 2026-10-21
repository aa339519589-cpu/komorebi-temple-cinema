# Scene09 R17 — grounded close-to-wide shot

Held runtime source: `8822979b57630f702d82493a4181b5f22bbd4ab68a42423146539a9ee56bfb06` (51 inputs). `visualAccepted: false`; this checkpoint repairs film framing and site continuity and does not establish photographic fidelity.

The opening finial now has the actual pagoda, hall and planted bank behind it. The camera stays over the existing occupied granite apron, arcs and rises gently behind the rail end, then settles to the retained reference position `[6, 2.7, 33]`, target `[0, 5.5, -10]`, and 52° field of view at 7 seconds. The shared camera interpolation is unchanged. Its 169-sample geometric preflight has 0.333 m minimum clearance to conservative finial boxes; actual native images remain the framing evidence.

Actual closed soil banks extend the eastern and western site, with 156 seated declared CC0 rocks, 78 rooted shrubs and 30 branch/leaf trees. The western bank joins below the existing pagoda hill. The reflective pond keeps its elevation and world-space ripple/reflection shader; its physical mesh extends to the new outer banks. Architecture, flooring, near railing and physical fixtures remain those of R14. Only `main.js` and `asset-dependencies.json` change among the prior inputs; the new scene-specific camera, site geometry and provenance are the three additions.

## Native evidence

- [Five exact native poses, 0 / 1.75 / 3.5 / 5.25 / 7 s](five-poses-r17.jpg) — 960×960 originals in [the pose directory](../iteration-scene09-solmax-grounded-site-dolly-r17-poses-20261021/).
- [Prior opening left, R17 opening right](opening-r14-left-r17-right.jpg).
- [Completed genuine 7 s movie](../iteration-scene09-solmax-grounded-site-dolly-r17-motion-20261021/motion-review.mp4) and [official capture report](../iteration-scene09-solmax-grounded-site-dolly-r17-motion-20261021/report.json).
- [Nine frames decoded directly from that MP4](movie-nine-frames-r17.jpg), including the intervening finial turn.
- [Held source and evidence manifest](checkpoint-r17.json), [retained text source](retained-r17-source/source-manifest.json), and [camera contact preflight](camera-contact-r16.json).

All five exact native poses and nine decoded movie frames have been inspected. The secondary finials leave through the lower foreground during the turn, the outer bank closes the visible site, and the final view retains the reference camera. The final movie was rendered through the official shared GPU queue at native 960×960, 24 fps, with 168 genuinely rendered frames, without frame interpolation. The encoded H.264 file is exactly 7.000 s; all 168 frames have GL error 0 and no lost context, and the official full-file decode reports 0 errors. Both still and motion reports retain the same held source identity. MP4 SHA-256: `42364dcb3eff1f0812399cb1cbf9b069575a959abacb093f87f16031719d4408`.

R15 is preserved as a failed, superseded candidate: its process was canceled, leaving one native opening frame. R16 corrected the intermediate camera path; its full five-pose capture is preserved, with its exact text inputs in `retained-r16-source`. R17 adds the western ground and planting visible in that capture. The final R17 runtime remains held throughout still and movie capture.

Outer garden geometry is inferred continuity beyond the photograph. No photograph, depth projection, generated scene plate, painted reflection, screen mask or black fade is used. Overall architectural/material/garden correspondence to the photograph remains unaccepted. The immutable physical Cycles R05 study is unchanged.
