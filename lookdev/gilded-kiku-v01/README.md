# Image-assisted sculptural guide, not a film frame

The user explicitly authorized image generation and Blender on 2026-10-18.
The built-in `image_gen` tool generated `generated-sculptural-guide.png` using
the architectural reference `references/hd/5-照片-6.jpg`. The prepared brief is
retained in `prompt.txt`, and the exact built-in tool prompt in `tool-prompt.txt`;
the tool returned its image on 2026-10-18.

The output contains tonal shading and is **not measured or calibrated depth**.
It is used as a non-metric sculptural guide for an experimental closed relief
mesh, with restrained displacement and spatial filtering. Its gray pixels
are never used as a visible gold albedo or as a substitute for a 3D scene.

`tools/build-temple-joinery-kit.py` creates the actual editable relief at three
mesh resolutions, constructs separate bearing blocks and half-lapped timber
arms, verifies closed mesh edges, exports a portable GLB, saves the native
Blender project and renders an actual physical-lighting asset inspection.
`assets/temple-joinery-v01/build-report.json` records input and output hashes.
This kit is work in progress. It does not establish scene or film acceptance.
