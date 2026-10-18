// Per-scene art direction belongs here; original reconstruction metadata stays
// immutable. travelScale can only reduce the q05/median physical-dolly bound.
// FocalScale1.22 is an actual pinhole projection, not a crop of a saved image.
export const SHOT_SETTINGS = Object.fromEntries(Array.from({length:10},(_,i)=>[
  String(i+1).padStart(2,'0'),{travelScale:1,focalScaleStart:1.22},
]));

// A single depth surface has less support for revealed regions than a learned
// multi-Gaussian reconstruction. Keep the delivery motion genuinely3D while
// confining displacement to about1% of its5th-percentile foreground depth.
export const DEPTH_FIELD_SHOT_SETTINGS = Object.fromEntries(Array.from({length:10},(_,i)=>[
  String(i+1).padStart(2,'0'),{travelScale:.075,focalScaleStart:1.22},
]));
