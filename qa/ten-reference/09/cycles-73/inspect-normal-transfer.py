"""Read-only comparison of exported and saved bridge shading normals."""
import bpy,json,math
import numpy as np
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent/'cycles-71/source-package'
s=json.loads((ROOT/'scene.json').read_text());geos={g['id']:g for g in s['geometries']}
bpy.ops.wm.open_mainfile(filepath=str(HERE.parent/'cycles-72/render/scene09-cycles72.blend'))
scene=bpy.context.scene;cam=scene.camera;deps=bpy.context.evaluated_depsgraph_get();audit=json.loads((HERE/'saved-transfer-audit.json').read_text());results=[]
def array(rec):return np.fromfile(ROOT/'assets'/rec['file'],dtype='<f4' if rec['type']=='Float32Array' else '<u4')
for sample in audit['cameraRayBridgeSamples']:
    if not sample['materialMatchesSourceRed']:continue
    x,y=sample['pixel'];t=math.tan(math.radians(52)/2);ray=cam.matrix_world.to_quaternion()@Vector(((2*(x+.5)/1254-1)*t,(1-2*(y+.5)/1254)*t,-1));ray.normalize();hit,point,normal,face,obj,matrix=scene.ray_cast(deps,cam.location,ray)
    rec=s['meshes'][int(obj.name.rsplit('-',1)[1])];g=geos[rec['geometry']];ix=array(g['index']).reshape(-1,3);fcount=len(ix);instance=face//fcount;local_face=face%fcount
    tr=np.array(rec['matrix']).reshape(4,4).T
    if 'instanceMatrices' in rec:tr=tr@array(rec['instanceMatrices']).reshape(-1,4,4)[instance].T
    ids=ix[local_face]
    if np.linalg.det(tr[:3,:3])<0:ids=ids[[0,2,1]]
    ns=array(g['attributes']['normal']).reshape(-1,3)[ids]@np.linalg.inv(tr[:3,:3]);ns/=np.maximum(np.linalg.norm(ns,axis=1),1e-12)[:,None];expected=np.stack([ns[:,0],-ns[:,2],ns[:,1]],axis=1)
    convert=obj.matrix_world.to_3x3().inverted().transposed();saved=np.array([(convert@obj.data.corner_normals[i].vector).normalized()[:] for i in obj.data.polygons[face].loop_indices])
    results.append({'pixel':[x,y],'object':obj.name,'sourceExpectedWorldNormals':expected.tolist(),'savedWorldCornerNormals':saved.tolist(),'maxAbsDifference':float(np.max(np.abs(expected-saved))),'geometryRayNormal':list(normal)})
red=bpy.data.materials[audit['materials'][0]['source']['id']];nmap=next(n for n in red.node_tree.nodes if n.bl_idname=='ShaderNodeNormalMap')
report={'scope':'Read-only saved corner normals vs exact exported source normals after the common rigid Y-up to Z-up conversion','samples':results,'normalMapSpace':nmap.space,'normalMapStrength':nmap.inputs['Strength'].default_value,'allDifferencesBelow1e-5':all(x['maxAbsDifference']<1e-5 for x in results),'sourceSunEnergy':[{'name':o.name,'energy':o.data.energy,'color':list(o.data.color)} for o in scene.objects if o.type=='LIGHT' and o.data.type=='SUN']}
(HERE/'normal-transfer-audit.json').write_text(json.dumps(report,indent=2));print('NORMAL_TRANSFER_AUDIT',json.dumps(report),flush=True)
