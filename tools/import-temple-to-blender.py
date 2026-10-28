"""Convert a verified Three.js scene export to a Blender scene.
Instanced source geometry is retained by exact affine Geometry Nodes instances.
Native custom shaders/reflection render targets cannot be directly transferred.
"""
import os,sys,json,math,time
from pathlib import Path
import bpy
import numpy as np
from mathutils import Matrix,Vector
ROOT=Path(os.environ['TEMPLE_EXPORT']).resolve(); OUT=Path(os.environ['TEMPLE_BLEND']).resolve()
repo=Path(os.environ['TEMPLE_REPO']).resolve();sys.path.insert(0,str(repo/'tools'))
from temple_geometry_import import SourceBuffers,import_geometry
package=json.loads((ROOT/'scene.json').read_text()); source=json.loads((ROOT/'export-report.json').read_text())
if source.get('status')!='exported-existing-geometry' or source.get('errors'): raise RuntimeError('Incomplete source export')
bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene
scene.name=f"{package['view']['reference']:02d} · 寺院场景"
textures={t['id']:t for t in package['textures']}; mats={};images={}; colored={m for o in package['meshes'] if 'instanceColors' in o for m in o['materials']}
def setval(node,key,val):
 if key in node.inputs: node.inputs[key].default_value=val
for rec in package['materials']:
 mat=bpy.data.materials.new(rec.get('name') or rec['id']);mat.use_nodes=True;tree=mat.node_tree;nodes=tree.nodes;links=tree.links;bs=nodes.get('Principled BSDF')
 col=(*((rec.get('color') or [.5,.5,.5])[:3]),1);setval(bs,'Base Color',col)
 for key,src,default in [('Metallic','metalness',0),('Roughness','roughness',.5),('IOR','ior',1.5),('Transmission Weight','transmission',0),('Coat Weight','clearcoat',0),('Coat Roughness','clearcoatRoughness',.15),('Alpha','opacity',1)]:
  value=rec.get(src);setval(bs,key,float(default if value is None else value))
 setval(bs,'Emission Color',(*(rec.get('emissive') or [0,0,0]),1));setval(bs,'Emission Strength',float(rec.get('emissiveIntensity') or 0))
 maprec=rec.get('textures') or {}; tn={}
 for channel,tid in maprec.items():
  tex=textures[tid]
  if not tex.get('file'): continue
  file=ROOT/'assets'/tex['file']; key=(str(file),channel in ('map','emissiveMap'))
  if key not in images:
   image=bpy.data.images.load(str(file),check_existing=False);image.colorspace_settings.name='sRGB' if key[1] and tex.get('colorSpace')=='srgb' else 'Non-Color';images[key]=image
  node=nodes.new('ShaderNodeTexImage');node.image=images[key];tn[channel]=node
  uv=nodes.new('ShaderNodeAttribute');uv.attribute_name='sourceUV';mapping=nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY_ADD';sx,sy=tex.get('repeat',[1,1]);ox,oy=tex.get('offset',[0,0]);mapping.inputs[1].default_value=(sx,sy,1);mapping.inputs[2].default_value=(ox,oy,0);links.new(uv.outputs['Vector'],mapping.inputs[0]);links.new(mapping.outputs[0],node.inputs['Vector'])
 base=None
 if 'map' in tn:
  mul=nodes.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;mul.inputs[2].default_value=col;links.new(tn['map'].outputs['Color'],mul.inputs[1]);base=mul.outputs['Color']
 if rec.get('vertexColors') or rec['id'] in colored:
  for attrname in (['sourceColor'] if rec.get('vertexColors') else [])+(['instanceColor'] if rec['id'] in colored else []):
   a=nodes.new('ShaderNodeAttribute');a.attribute_name=attrname
   if attrname=='instanceColor':a.attribute_type='INSTANCER'
   mul=nodes.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;links.new(a.outputs['Color'],mul.inputs[1])
   if base:links.new(base,mul.inputs[2])
   else:mul.inputs[2].default_value=col
   base=mul.outputs['Color']
 if base:links.new(base,bs.inputs['Base Color'])
 if 'normalMap' in tn:
  n=nodes.new('ShaderNodeNormalMap');n.uv_map='sourceUV';n.inputs['Strength'].default_value=(rec.get('normalScale') or [1])[0];links.new(tn['normalMap'].outputs['Color'],n.inputs['Color']);links.new(n.outputs['Normal'],bs.inputs['Normal'])
 elif 'bumpMap' in tn:
  n=nodes.new('ShaderNodeBump');n.inputs['Distance'].default_value=abs(float(rec.get('bumpScale') or .003));links.new(tn['bumpMap'].outputs['Color'],n.inputs['Height']);links.new(n.outputs['Normal'],bs.inputs['Normal'])
 for channel,socket,component in [('roughnessMap','Roughness','Green'),('metalnessMap','Metallic','Blue')]:
  if channel in tn:
   n=nodes.new('ShaderNodeSeparateColor');links.new(tn[channel].outputs['Color'],n.inputs[0]);links.new(n.outputs[component],bs.inputs[socket])
 if 'map' in tn and rec.get('alphaTest',0)>0: links.new(tn['map'].outputs['Alpha'],bs.inputs['Alpha'])
 mats[rec['id']]=mat
buffers=SourceBuffers(ROOT,source,64*1024**2); optics=[{'emissionRGB':np.zeros((m['instances'],3),np.float32),'emitBack':np.zeros(m['instances'],np.float32)} for m in package['meshes']]
report={};C=import_geometry(bpy,package,buffers,mats,mats,optics,report); print('GEOMETRY_IMPORTED',package['view']['reference'],flush=True)
C=Matrix(C.tolist())
for rec in package['lights']:
 if (rec.get('intensity') or 0)<=0:continue
 typ={'DirectionalLight':'SUN','PointLight':'POINT','SpotLight':'SPOT','RectAreaLight':'AREA'}.get(rec.get('type'))
 if not typ:continue
 light=bpy.data.lights.new(rec.get('name') or typ,typ);light.color=rec['color'];obj=bpy.data.objects.new(light.name,light);scene.collection.objects.link(obj);m=Matrix(np.array(rec['matrix']).reshape(4,4).T.tolist());obj.matrix_world=C@m
 val=rec['intensity'];light.energy=val*.28 if typ=='SUN' else val*4*math.pi if typ=='POINT' else val*math.pi
 if typ=='AREA':light.shape='RECTANGLE';light.size=rec.get('width') or 1;light.size_y=rec.get('height') or 1
 if typ=='SUN' and rec.get('target'):
  target=C@Vector(rec['target']);direction=target-obj.location
  if direction.length>0:obj.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
cd=bpy.data.cameras.new('原始参考相机');camera=bpy.data.objects.new(cd.name,cd);scene.collection.objects.link(camera);camera.matrix_world=C@Matrix(np.array(package['cameraMatrix']).reshape(4,4).T.tolist());cd.sensor_fit='VERTICAL';cd.sensor_height=24;cd.lens=12/math.tan(math.radians(package['view']['fov'])/2);cd.clip_start=.08;cd.clip_end=500;scene.camera=camera
world=bpy.data.worlds.new('环境光（Blender 近似）');world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.38,.43,.48,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35;scene.world=world
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.render.resolution_x=1080;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
scene['source']='Three.js source scene; geometry and affine instances imported, custom GLSL and reflection effects require Blender adaptation.';scene['sourceHash']=source['sourceHash'];scene['reference']=package['view']['reference'];scene['sourceTriangles']=package['statistics']['triangles'];scene['cameraNote']='Static reference camera; original film animation and time-dependent shaders are not automatically transferred.'
for image in images.values(): image.pack()
OUT.parent.mkdir(parents=True,exist_ok=True);bpy.ops.wm.save_as_mainfile(filepath=str(OUT),compress=True)
print('BLEND_SAVED',str(OUT),json.dumps(report.get('geometry252',{})),flush=True)
