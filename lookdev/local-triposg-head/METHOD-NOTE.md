# Explicit mesh study — not accepted for the film

This study starts from a clearly labeled AI-generated grey sculpture guide in
`lookdev/trellis2-head-study`. It is not a rendered film frame. The local original
MIT TripoSG model builds an explicit untextured 3D mesh from that guide. Actual
Blender front/profile/three-quarter renders are retained. No guide or reference
bitmap is loaded by the scene renderer.

The original public model/source and its local MPS adaptations are pinned in
`tools/vendor/triposg-original-mps/SOURCE.json`; the MIT license is included there.
The 8 GB original model weights remain an external, publicly downloadable tool
dependency. The saved latent, original decoded GLB, FP32 re-extraction and editable
prepared facial meshes are retained here and in scene06/assets.

The public TRELLIS.2 attempt failed at anonymous ZeroGPU quota and produced no mesh.
Local TripoSG v01 completed after removing an unrelated upstream callback bug.
FP32 decoding reduced some extraction banding, but did not remove shape defects.

Native scene passes learned85,85b,86 are real Three.js renders. v01's nostril folds,
cheek noise and inflated lips remain visibly inaccurate. v02 locally relaxes those
surfaces and removes small floating closed components, preserving the forehead
urna and the native statue's neck, crown, body, seats and lighting. The face has a
private .42 roughness surface. The nose wings still need sculpting. None of these
passes has photographic acceptance or has replaced the live scene06 source.
