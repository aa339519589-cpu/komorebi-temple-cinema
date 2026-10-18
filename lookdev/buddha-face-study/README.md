# Buddha face scaffold study — not a selected scene asset

`reference-head-crop.png` is an unretouched 95 × 94 crop from the user's
`references/hd/4-照片-5.jpg`, bounds (584,331)–(679,425). The original photograph
remains the authoritative shape/expression reference.

The built-in image generation tool produced `generated-clay-guide.png` from
that crop on 2026-10-18 using the exact saved `tool-prompt.txt`. It is a
non-metric modeling guide, **not an actual rendered 3D mesh**, and it cannot
recover missing photographic detail or prove an identical face. The generated
interpretation must be checked against the original before modeling choices.

`tools/estimate-buddha-face.py` uses MediaPipe0.10.21 on CPU to compare estimated
facial landmarks in both inputs. Its depth coordinates are a learned prior,
not measured sculpture depth. Diagnostic overlays are separate QA images.
No image from this directory is loaded as a reference-scene plane or texture.

Method documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/python
Model: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
Canonical topology source (for subsequent geometry study):
https://github.com/google-ai-edge/mediapipe/blob/v0.10.21/mediapipe/modules/face_geometry/data/canonical_face_model.obj
