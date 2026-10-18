# First actual GPU render: comparison findings

Actual render: `reference.png`, Metal backend, 768 × 768, 38 draw calls, 2,638,272 rendered triangles, all linked programs, no GL error or context loss. These technical checks do not establish appearance quality.

Visual status: rejected for further reconstruction.

The inspected original corner and rendered corner are saved as `original-corner.png` and `render-corner.png` (the former is JPEG payload produced by macOS sips). The original has short dense parallel rafter tails over continuous bearing timbers. The rendered generator incorrectly converged rafter centerlines radially toward the apex, producing large fan cavities. Small bracket plates, flat new paint, bright window backing, a nearly plain metal lantern, and unconnected foreground twigs amplified the toy appearance.

The second source revision replaces radial rafter geometry with fixed transverse centerlines. Jack ends stop at the diagonal hips, flying rafters are shorter, and two broad continuous ring purlins receive the rafter tails. Intermediate notched bracket sets and thicker curved beam ends add load-bearing mass and negative spaces. Chased petal fittings, stronger procedural worn grain/cracks and roughness, dark window recesses, branched foliage, pale finer sky clouds, and lower diffuse fill are included. Camera aim shifts left to bring the prominent column toward the original x-coordinate. The shadow type is the supported PCFShadowMap.

Second GPU inspection remains pending. Further checks should use real pixels, especially timber bearing contacts, the primary corner column position, lantern crown detail, tile ornament size and gold reflection.
