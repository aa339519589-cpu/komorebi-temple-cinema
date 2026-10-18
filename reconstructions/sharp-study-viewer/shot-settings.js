// Per-scene art direction belongs here; original reconstruction metadata stays
// immutable. travelScale can only reduce the q05/median physical-dolly bound.
// FocalScale1.22 is an actual pinhole projection, not a crop of a saved image.
export const SHOT_SETTINGS = Object.fromEntries(Array.from({length:10},(_,i)=>[
  String(i+1).padStart(2,'0'),{travelScale:1,focalScaleStart:1.22},
]));
