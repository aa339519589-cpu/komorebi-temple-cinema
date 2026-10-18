"""One declared lighting correction of the frozen scene04 actual mesh export."""
import bpy,json,os,time
from pathlib import Path
from mathutils import Matrix
BASE=Path('output/scene04-traced81-physical').resolve();OUT=Path('output/scene04-traced81-daybalance').resolve();OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(BASE/'scene04-traced81.blend'))
s=bpy.context.scene;camera_before=[v for row in s.camera.matrix_world for v in row]
triangles=sum(len(o.data.polygons) for o in s.objects if o.type=='MESH')
old=s.world.node_tree.nodes['Background'].inputs['Strength'].default_value
s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.03
s.render.resolution_x=s.render.resolution_y=1254;s.render.use_border=False;s.render.filepath=str(OUT/'scene04-daybalance.png');bpy.ops.render.render(write_still=True)
# A real high-resolution subfrustum, preserving the source lens and pose.
# Only the selected border is ray-traced at a 3494px virtual full-frame size.
s.render.resolution_x=s.render.resolution_y=3494;s.render.use_border=True;s.render.use_crop_to_border=True
s.render.border_min_x=150/1254;s.render.border_max_x=600/1254;s.render.border_min_y=1-1250/1254;s.render.border_max_y=1-800/1254
s.render.filepath=str(OUT/'scene04-daybalance-floor-native.png');bpy.ops.render.render(write_still=True)
assert camera_before==[v for row in s.camera.matrix_world for v in row]
assert triangles==sum(len(o.data.polygons) for o in s.objects if o.type=='MESH')
(OUT/'report.json').write_text(json.dumps({'parentBlend':str(BASE/'scene04-traced81.blend'),'parentSourceReport':str(BASE/'report.json'),'changedOnly':{'physicalWorldStrength':[old,.03]},'sameSourceGeometryTriangles':triangles,'cameraMatrixPreserved':True,'newGeometry':False,'materialChanges':False,'sunChanges':False,'samples':s.cycles.samples,'size':[1254,1254],'nativeDetail':{'virtualFullSize':3494,'sourceCrop':[150,800,450,1254]},'photographicAcceptance':False},indent=2)+'\n')
print('SCENE04_LIGHT_BALANCE_RENDERED',flush=True)
