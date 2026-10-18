# Local real-surface reflection candidate 79

Actual native 1254 reference + ground subfrustum [420,925,160,1254], rendered through the shared mutex and inspected. This first candidate excludes the old y=.066 plane along camera rays that intersect the same twelve complete stone cap/arris meshes. It gives their original Physical material / grain normals the existing actual-scene cube probe, intensity 1, without changing stone geometry, lights, camera or roughness .39.

The auxiliary 1024 x 1280 atlas is generated from actual mesh vertices for optical height/coverage lookup only. It does not replace the complete meshes and contains no reference RGB/depth. The shader steps in height along the current camera ray and bisects the first covered stone hit, with a mipmapped coverage feather. This avoids treating a high-plane XZ hole as the lower stone's screen-space silhouette.

Observed: real grain and pits replace much of the floating flat mirror, but this material state reads too dark/dry compared with the original photograph's continuous grey/white and warm lamp wet reflections. It was retained rather than selected. The initial min-height receipt included negative underside slivers; negative pixels were never encoded, and candidate 80 explicitly excludes below-ground triangles from the optical atlas.

The exact changed sources and actual receipt remain here. No photographic-fidelity acceptance is claimed.
