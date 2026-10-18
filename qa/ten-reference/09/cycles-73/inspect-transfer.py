"""Read-only inspection of saved source72 material nodes and bridge UVs."""
import bpy,json,hashlib
from pathlib import Path
import numpy as np
from mathutils import Vector
import math
HERE=Path(__file__).resolve().parent
source=json.loads((HERE/'source-bridge-audit.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(HERE.parent/'cycles-72/render/scene09-cycles72.blend'))
report={'scope':'Read-only saved node/UV inspection; no render or material change','materials':[],'rails':[]}
for rec in source['redMaterials']:
    m=bpy.data.materials[rec['id']];nodes=[]
    for n in m.node_tree.nodes:
        r={'name':n.name,'type':n.bl_idname,'inputs':[]}
        if n.bl_idname=='ShaderNodeMixRGB':r['blendType']=n.blend_type;r['clamp']=n.use_clamp
        if n.bl_idname=='ShaderNodeTexImage':r.update({'image':n.image.name,'colorSpace':n.image.colorspace_settings.name,'size':list(n.image.size)})
        for s in n.inputs:
            if s.is_linked:r['inputs'].append({'name':s.name,'from':[(l.from_node.name,l.from_socket.name) for l in s.links]})
            elif hasattr(s,'default_value'):
                d=s.default_value
                try:d=list(d)
                except TypeError:pass
                if isinstance(d,(bool,int,float,str,list)):r['inputs'].append({'name':s.name,'value':d})
        nodes.append(r)
    report['materials'].append({'source':rec,'savedMaterial':m.name,'nodes':nodes,'hasEmissionShader':any(n.bl_idname in ['ShaderNodeEmission','ShaderNodeBlackbody'] for n in m.node_tree.nodes)})
for rec in source['rails']:
    obj=bpy.data.objects[rec['objectName']];g=obj.data;uv=np.empty(len(g.uv_layers.active.data)*2,dtype=np.float32);g.uv_layers.active.data.foreach_get('uv',uv)
    colors=np.empty(len(g.color_attributes['sourceColor'].data)*4,dtype=np.float32);g.color_attributes['sourceColor'].data.foreach_get('color',colors)
    report['rails'].append({'name':obj.name,'materials':[m.name for m in g.materials],'uvLoopCount':len(uv)//2,'uvMin':uv.reshape(-1,2).min(axis=0).tolist(),'uvMax':uv.reshape(-1,2).max(axis=0).tolist(),'savedUVSha256':hashlib.sha256(uv.tobytes()).hexdigest(),'sourceLoopUVMatch':hashlib.sha256(uv.tobytes()).hexdigest()==rec['sourceLoopUVSha256'],'sourceColorRange':[colors.reshape(-1,4).min(axis=0).tolist(),colors.reshape(-1,4).max(axis=0).tolist()],'source':rec})
for n in report['materials'][0]['nodes']:
    if n['type']=='ShaderNodeTexImage':
        im=bpy.data.images[n['image']];pixels=np.empty(im.size[0]*im.size[1]*4,dtype=np.float32);im.pixels.foreach_get(pixels);rgb=pixels.reshape(-1,4)[:,:3];n['pixelStatistics']={'min':rgb.min(axis=0).tolist(),'max':rgb.max(axis=0).tolist(),'mean':rgb.mean(axis=0).tolist(),'p50':np.quantile(rgb,.5,axis=0).tolist()}
scene=bpy.context.scene;deps=bpy.context.evaluated_depsgraph_get();cam=scene.camera;t=math.tan(math.radians(52)/2);hits=[]
for x,y in [(650,710),(700,725),(750,745),(700,742),(750,758),(700,759),(600,706),(500,714),(400,726),(300,756)]:
    ray=cam.matrix_world.to_quaternion()@Vector(((2*(x+.5)/1254-1)*t,(1-2*(y+.5)/1254)*t,-1));ray.normalize();hit,point,normal,face,obj,matrix=scene.ray_cast(deps,cam.location,ray)
    if hit:
        m=obj.data.materials[obj.data.polygons[face].material_index]
        hits.append({'pixel':[x,y],'object':obj.name,'material':m.name,'point':list(point),'normal':list(normal),'materialMatchesSourceRed':m.name in [r['id'] for r in source['redMaterials']]})
report['cameraRayBridgeSamples']=hits
(HERE/'saved-transfer-audit.json').write_text(json.dumps(report,indent=2))
print('SAVED_TRANSFER_AUDIT',json.dumps(report),flush=True)
