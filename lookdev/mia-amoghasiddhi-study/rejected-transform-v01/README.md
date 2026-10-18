# Rejected transform study

These are actual rendered frames, but the imported object's parent transform
was not removed correctly by an in-place mutation of Blender's matrix wrapper.
The visible frame is an incorrectly magnified surface, not a usable sculpture
view. The original report did not validate the final world-space bounds.
They are retained as rejected evidence and must never be presented as an
accepted sculpture or a reference reconstruction. The successor script assigns
an explicit identity matrix, removes the source parent, transforms the mesh
and asserts the actual normalized world-space height before rendering.
