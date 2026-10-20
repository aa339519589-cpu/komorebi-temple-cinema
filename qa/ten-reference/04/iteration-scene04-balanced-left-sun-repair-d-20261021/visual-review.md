# Scene 04 physical sun and cool fill study

Status: `rendered-review`; this is a lighting integration checkpoint, not visual acceptance.

Four actual native sun/fill candidates were compared to the same HD reference. Candidate A placed the sun behind-left with the original cool fill. It produced forward foliage shadows and floor glints but left the front facade and stairs too dark. Candidate B raised the sun and cool fill; the floor became pale and the facade remained underlit. Candidate C moved the sun to front-left and raised the sky fill; the facade detail returned, but the floor became too evenly bright. Candidate D keeps the front-left direction, reduces sun intensity to 6.4 and sky fill to 0.42. It is the best balance in this set: facade carving is visible, directional shadows remain, and the floor retains more local contrast than C.

The foliage-shadow tree stays at its previously fitted source placement; only the physical sun changes. The final full frame and genuine 480×480 floor subfrustum are shown alongside the original source. The actual-scene paving reflection probe remains enabled at 256 cubemap resolution. The final render is valid on Metal with no GL, console, or scene-resource errors.

Uncertainty remains because the source does not provide a single unambiguous sun direction. Candidate D is front-left rather than behind-left: that choice keeps the facade and stairs readable, while the behind-left variants create stronger floor glints and shadow travel but make the architecture too dark. The native damp-floor reflections remain weaker and less golden than the reference. Visual acceptance remains open. Camera and scene geometry were not edited.
