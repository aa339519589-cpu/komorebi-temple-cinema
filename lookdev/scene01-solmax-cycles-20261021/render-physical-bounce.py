"""Physical lighting iterations on the held source132 meshes and camera."""
import bpy, json, math, time, hashlib
from pathlib import Path
from mathutils import Vector

base=Path('lookdev/scene01-solmax-cycles-20261021/cycles').resolve()
record=json.loads((base/'report.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(base/'scene01-source132-physical.blend'))
scene=bpy.context.scene
camera_matrix=[list(row) for row in scene.camera.matrix_world]
light=bpy.data.lights.new('Broad warm courtyard bounce source','AREA')
light.shape='RECTANGLE';light.size=16;light.size_y=10
light.color=(1,.78,.56)
obj=bpy.data.objects.new(light.name,light);scene.collection.objects.link(obj)
obj.location=(-8,-8,16)
obj.rotation_euler=(Vector((6,0,11))-obj.location).to_track_quat('-Z','Y').to_euler()
for mat in bpy.data.materials:
    if mat.name=='Scene01 pond water, physical Cycles reflection IOR 1.333':
        for node in mat.node_tree.nodes:
            if node.type=='BSDF_PRINCIPLED':
                node.inputs['Roughness'].default_value=.055
                node.inputs['Coat Roughness'].default_value=.055
scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=768;scene.render.resolution_y=768
results=[]
for watts in [2500,5000]:
    light.energy=watts
    render=base/f'scene01-source132-physical-bounce-{watts}w.png'
    scene.render.filepath=str(render)
    start=time.time();bpy.ops.render.render(write_still=True)
    results.append({'file':render.name,'bounceWatts':watts,'renderSeconds':time.time()-start,'sha256':hashlib.sha256(render.read_bytes()).hexdigest()})
    (base/'physical-bounce-review.json').write_text(json.dumps({'sourceCommit':record['sourceCommit'],'sourceHash':record['sourceHash'],'actualSourceTriangles':record['importedTriangles'],'geometryRebuilt':False,'cameraMatrix':camera_matrix,'cameraUnchanged':camera_matrix==[list(row) for row in scene.camera.matrix_world],'newAreaLight':{'positionBlenderZUp':list(obj.location),'targetBlenderZUp':[6,0,11],'dimensionsMetres':[16,10],'linearColor':list(light.color),'scope':'Explicit authored physical photographic bounce source; not part of the native source light budget.'},'waterAdaptation':{'IOR':1.333,'roughness':.055,'reflection':'Actual scene/path-traced radiance, no painted highlight'},'samples':48,'resolution':[768,768],'renders':results,'visualAccepted':False},indent=2)+'\n')
