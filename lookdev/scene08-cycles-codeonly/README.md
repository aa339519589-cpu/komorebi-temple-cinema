# Scene 08 Cycles lighting diagnostic

render.py imports the existing scene 08 Three.js vertex/index arrays and exact instance matrices from tools/export-reconstructed-scene.mjs, then renders those meshes with Blender Cycles. It adds no temple geometry. It uses a procedural Nishita sky, a shallow water surface in place of the WebGL Reflector, and procedural material noise. The render is an unaccepted lighting diagnostic; it does not replace the native Three.js film.

The current diagnostic has 14,254,677 imported triangles and 328,479 visible instances. It was rendered with Blender 5.2.1, Metal GPU, 640x640, 12 samples, and denoising. Its output is kept under qa/ten-reference/08/cycles-codeonly-01/ for review and is not a delivery frame.
