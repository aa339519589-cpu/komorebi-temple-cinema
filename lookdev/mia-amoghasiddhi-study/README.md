# Real sculpture anatomy study

The input is **Chinese Amoghasiddhi Buddha, 1403–1424 CE**, a scan published by
the Minneapolis Institute of Art under CC0. The museum's collection record is
https://collections.artsmia.org/art/31240/amoghasiddhi-buddha-china and the original
model is https://sketchfab.com/3d-models/33699be99fd64375bf0371c0e0c12f70.
The public Objaverse dataset mirror supplies the unchanged source GLB; the
verified author, license, URLs and SHA256 are in
`assets/mia-amoghasiddhi-study/provenance.json`.

This is a **different historical sculpture** from the supplied reference.
It is an anatomy and drapery foundation study, not an asserted exact match.
The candidate has not been installed in any of the ten reference scenes.
The regilded study exposes a worn, uneven scan surface and insufficient robe
and facial detail for the reference. It is **not selected for production**;
the actual seated silhouette remains useful as an anatomical comparison.

`tools/build-mia-sculpture-study.py` imports its real triangles, normalizes the
whole sculpture with an asserted world-space height, removes scan-albedo
illumination, applies a new physical gilt material and renders two actual low
camera views in Cycles. It retains all source triangles, apart from welding
coincident UV seam positions at a one-micrometre tolerance. The editable
Blender project and render report are saved beside the actual study images.
The weld removed one collapsed source triangle; the report records the actual
69,567 retained triangles and the remaining single boundary edge.
