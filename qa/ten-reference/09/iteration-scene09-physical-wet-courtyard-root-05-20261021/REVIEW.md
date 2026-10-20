# Night courtyard physical-light and paving repair

Visual acceptance remains false. This is an in-progress modeled scene, not a reference-image projection.

The previous fixture distance cutoff prevented existing overhead lights from reaching the paving. The current lights retain inverse-square decay without an artificial cutoff; near-veranda sources now cast fixed world-space shadows. The two existing large overhead fixtures use 85 cd before assembly scale. No new visible fixtures were added.

The environment reflection now captures actual modeled courtyard objects and lamps, replacing a synthetic warm-blob environment. Pond and veranda use independent planar captures of the real scene.

Thirty-three closed granite slabs have chipped edges, small continuous worn crowns/hollows, dark wet albedo, a clear water coating, and view-dependent IOR 1.333 Fresnel reflection. The fixed reflection shader no longer adds fabricated orange highlights.

The facade remains too simple, near paving still reads too clean and angular, and vegetation/roof ornament are far from photo detail. A valid native render does not establish reference fidelity.
