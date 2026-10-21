"""Source132 physical light placement under the deep front eaves."""
import bpy, json, time, hashlib, os
from pathlib import Path
from mathutils import Vector

base=Path('lookdev/scene01-solmax-cycles-20261021/cycles').resolve()
source=json.loads((base/'report.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(base/'scene01-source132-physical.blend'))
scene=bpy.context.scene
camera_before=[list(row) for row in scene.camera.matrix_world]
light=bpy.data.lights.new('Low courtyard warm reflected-light proxy','AREA')
light.shape='RECTANGLE';light.size=18;light.size_y=8;light.energy=float(os.environ.get('CYCLES_BOUNCE_WATTS','6000'))
light.color=(1,.87,.69)
obj=bpy.data.objects.new(light.name,light);scene.collection.objects.link(obj)
obj.location=(-5,-12,7)
obj.rotation_euler=(Vector((5,1,9))-obj.location).to_track_quat('-Z','Y').to_euler()
for mat in bpy.data.materials:
    if mat.name=='Scene01 pond water, physical Cycles reflection IOR 1.333':
        for node in mat.node_tree.nodes:
            if node.type=='BSDF_PRINCIPLED':
                node.inputs['Roughness'].default_value=.055
                node.inputs['Coat Roughness'].default_value=.055
look=os.environ.get('CYCLES_LOOK','AgX - Medium High Contrast')
available=[v.identifier for v in scene.view_settings.bl_rna.properties['look'].enum_items]
if look in available:scene.view_settings.look=look
scene.cycles.samples=int(os.environ.get('CYCLES_SAMPLES','96'));scene.cycles.use_denoising=True
scene.render.resolution_x=int(os.environ.get('CYCLES_SIZE','1254'));scene.render.resolution_y=scene.render.resolution_x
name=os.environ.get('CYCLES_PASS_NAME','balanced')
if not name.replace('-','').isalnum():raise ValueError('Invalid pass name')
render=base/f'scene01-source132-low-courtyard-{name}.png';scene.render.filepath=str(render)
if os.environ.get('CYCLES_PACK_MODEL','0')=='1':
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(base/'scene01-source132-packed-physical.blend'),compress=True)
start=time.time();bpy.ops.render.render(write_still=True)
report={'sourceCommit':source['sourceCommit'],'sourceHash':source['sourceHash'],'actualSourceTriangles':source['importedTriangles'],'geometryRebuilt':False,'cameraMatrix':camera_before,'cameraUnchanged':camera_before==[list(row) for row in scene.camera.matrix_world],'physicalAreaSource':{'positionBlenderZUp':list(obj.location),'targetBlenderZUp':[5,1,9],'dimensionsMetres':[18,8],'watts':light.energy,'linearColor':list(light.color),'scope':'Explicit authored broad reflected-light proxy below the eave; not recovered measured scene radiance.'},'waterIOR':1.333,'waterRoughness':.055,'samples':scene.cycles.samples,'resolution':[scene.render.resolution_x,scene.render.resolution_y],'viewTransform':scene.view_settings.view_transform,'look':scene.view_settings.look,'renderSeconds':time.time()-start,'file':render.name,'sha256':hashlib.sha256(render.read_bytes()).hexdigest(),'visualAccepted':False}
(base/f'low-courtyard-{name}-review.json').write_text(json.dumps(report,indent=2)+'\n')
