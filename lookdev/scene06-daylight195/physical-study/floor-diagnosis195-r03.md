The immutable195R03 floor does not have a flipped top-normal or invalid base-reflectance problem. All814 top vertices are exactly upward, all386 top triangles wind upward, and no floor bump/normal texture is exported. The source factor nearRGB3 multiplies a dark sRGB albedo; actual mean baseRGB is .0840/.03435/.01760 and the maximum across all193 boards is .201/.138/.081. The .929 roughness factor multiplies mean green .24755, giving effective mean roughness .230. Clamping the color factor itself to one would wrongly alter the intended dark-map normalization.

The camera remains at[0,.58,8.4], FOV64, pitched up9.653degrees. Its bottom ray points22.347degrees downward. Mirroring actual eye-bridge vertex40685 puts it at image y1436, below the1254frame. No material can bring that face reflection inside this fixed physical image. Native floor projection phase200 is a separate primary-owned source correction.

| Actual exported landmark | Ideal mirror pixel | Exposed wood path before other geometry |
|---|---|---|
| Eye bridge |635,1436|Outside frame|
| Foreground table gilt |627,1017|Blocked by actual prayer mat|
| Lower altar gilt |627,1082|In frame, no prayer-mat obstruction|
| Upper altar gilt |627,1161|In frame, no prayer-mat obstruction|
| Left lantern gilt |226,1030|In frame, no prayer-mat obstruction|
| Right lantern gilt |1022,1030|In frame, no prayer-mat obstruction|

These are ideal plane-mirror projections of actual exported vertices selected near stated inferred landmarks. Other real objects can add occlusion; the full rough BSDF can blur the reflected form. The mathematical Fresnel values in the JSON are a dielectric estimate, not a claim that the actual shader or lighting must produce a particular pixel brightness.

The single R04 hypothesis changes only the floor coat from roughness .095/weight .72 to .035/weight1.0, representing a smooth continuous lacquer. The [official Blender Principled manual](https://docs.blender.org/manual/sr/latest/render/shader_nodes/shader/principled.html) describes coat as a lacquer layer and recommends zero or one weight for physical coverage. Base albedo, roughness map, IOR, source normals, camera, geometry, solar/sky/volume inputs and all other materials remain held. No physically unjustified albedo reduction or displaced image is added. Actual R04 must establish whether the visible altar/lantern response improves; it cannot establish face reflection or photographic fidelity.

Complete byte-checked numerical results and CPU-only inspection source are floor-diagnosis195-r03.json and inspect-floor195-r03.mjs. PNG source textures were software-decoded for material statistics only; no source image is projected or loaded into a replacement scene.
