"""One genuine floor subfrustum of the unchanged actual physical01 blend."""
import bpy,json,math,struct,hashlib
import numpy as np
from pathlib import Path
from mathutils import Matrix,Vector

BASE=Path('lookdev/scene04-physical/results/physical01').resolve()
PACKAGE=Path('output/scene04-physical-frozen-export').resolve()
bpy.ops.wm.open_mainfile(filepath=str(BASE/'scene04-physical01.blend'))
s=bpy.context.scene
before_camera=[float(v) for row in s.camera.matrix_world for v in row]
triangles=sum(len(o.data.polygons) for o in s.objects if o.type=='MESH')
source=json.loads((PACKAGE/'scene.json').read_text())
assert triangles==source['statistics']['triangles']==23669477

sun=next(o for o in s.objects if o.type=='LIGHT' and o.data.type=='SUN')
record=next(r for r in source['lights'] if r['type']=='DirectionalLight')
conversion=Matrix.Rotation(math.pi/2,4,'X')
matrix=Matrix(np.array(record['matrix']).reshape(4,4).T.tolist())
origin=conversion@matrix.translation;target=conversion@Vector(record['target'])
expected=np.array(target-origin,dtype=np.float64);expected/=np.linalg.norm(expected)
actual=np.array(sun.matrix_world.to_3x3()@Vector((0,0,-1)),dtype=np.float64);actual/=np.linalg.norm(actual)
dot=float(np.clip(expected@actual,-1,1));angle=math.degrees(math.acos(dot));assert angle<.01

def input_record(socket):
    return {'default':list(socket.default_value) if hasattr(socket.default_value,'__len__') else socket.default_value,'links':[{'node':l.from_node.bl_idname,'socket':l.from_socket.name} for l in socket.links]}

materials=[]
for material in bpy.data.materials:
    if not material.name.startswith('traced-granite-'):continue
    bs=next(n for n in material.node_tree.nodes if n.bl_idname=='ShaderNodeBsdfPrincipled')
    assert abs(bs.inputs['Coat IOR'].default_value-1.333)<1e-6
    coat=bs.inputs['Coat Weight'].links[0].from_node;rough=bs.inputs['Coat Roughness'].links[0].from_node
    assert coat.inputs[0].links[0].from_socket.name=='Red'
    assert rough.inputs[0].links[0].from_socket.name=='Green'
    images=[n for n in material.node_tree.nodes if n.bl_idname=='ShaderNodeTexImage']
    assert all(n.extension=='EXTEND' for n in images)
    assert all(n.image.colorspace_settings.name=='Non-Color' for n in images if n.image.name!=images[0].image.name)
    materials.append({'name':material.name,'coatIOR':bs.inputs['Coat IOR'].default_value,'baseColor':input_record(bs.inputs['Base Color']),'roughness':input_record(bs.inputs['Roughness']),'coatWeight':input_record(bs.inputs['Coat Weight']),'coatRoughness':input_record(bs.inputs['Coat Roughness']),'normal':input_record(bs.inputs['Normal']),'coatNormal':input_record(bs.inputs['Coat Normal']),'images':[{'name':n.image.name,'packed':bool(n.image.packed_file),'colorSpace':n.image.colorspace_settings.name,'extension':n.extension} for n in images]})
assert len(materials)==31

preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
for device in preferences.devices:device.use=device.type=='METAL'
if not any(device.use for device in preferences.devices):raise RuntimeError('Metal unavailable')
s.cycles.device='GPU'
crop=[80,850,400,1254];virtual=round(1254*1254/crop[2]);s.render.resolution_x=s.render.resolution_y=virtual;s.render.resolution_percentage=100
s.render.use_border=True;s.render.use_crop_to_border=True
s.render.border_min_x=crop[0]/1254;s.render.border_max_x=(crop[0]+crop[2])/1254
s.render.border_min_y=1-(crop[1]+crop[2])/1254;s.render.border_max_y=1-crop[1]/1254
frame=BASE/'scene04-physical01-floor-native.png';s.render.filepath=str(frame)
bpy.ops.render.render(write_still=True)
assert before_camera==[float(v) for row in s.camera.matrix_world for v in row]
assert triangles==sum(len(o.data.polygons) for o in s.objects if o.type=='MESH')
size=struct.unpack('>II',frame.read_bytes()[16:24])
report={'status':'actual-native-floor-detail-and-node-audit','sourceHash':'d1f02ccbe5cd1489e5211d8a831508aa592908cbe24733f3dee8bc74f37ce2a8','parentBlend':str(BASE/'scene04-physical01.blend'),'nativeDetail':{'originalCrop':crop,'virtualFullSize':virtual,'actualImageSize':list(size),'sameCameraMatrix':True,'upscaledScreenshot':False},'geometryTrianglesPreserved':triangles,'materialChanges':False,'lightChanges':False,'sun':{'origin':list(origin),'target':list(target),'actualOrigin':list(sun.matrix_world.translation),'expected':expected.tolist(),'actual':actual.tolist(),'dot':dot,'errorDegrees':angle,'strength':sun.data.energy,'angularDiameterRadians':sun.data.angle,'unitStatus':'Declared working units, not measured scene irradiance'},'worldStrength':s.world.node_tree.nodes.get('Background').inputs['Strength'].default_value if s.world.node_tree.nodes.get('Background') else None,'exposure':s.view_settings.exposure,'samples':s.cycles.samples,'seed':s.cycles.seed,'actualMaterials':materials,'photographicAcceptance':False}
(BASE/'floor-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print('FLOOR_DETAIL_COMPLETE',json.dumps({'size':size,'sunDot':dot,'sunErrorDegrees':angle,'triangles':triangles,'materials':len(materials)}),flush=True)
