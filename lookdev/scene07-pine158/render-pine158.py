"""Render the actual JS module geometry; launch ONLY through run-blender-queued.mjs.
No photograph, image plane, foliage card, crown shell or scene export is used.
The binary/model pair is produced directly by export-pine158.mjs.
"""
import bpy, math, json, os, hashlib, time
import numpy as np
from pathlib import Path
from mathutils import Matrix, Vector

HERE=Path(__file__).resolve().parent
PROJECT=HERE.parents[1]
OUT=HERE/os.environ.get('PINE_REVISION','r01')
DATA=json.loads((OUT/'model.json').read_text())
RAW=(OUT/DATA['binary']).read_bytes()
started=time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene

def arr(info):
    return np.frombuffer(RAW,dtype='<f4' if info['type']=='Float32' else '<u4',count=info['count'],offset=info['byteOffset'])

def material(name,color,roughness=.85):
    m=bpy.data.materials.new(name);m.use_nodes=True
    nt=m.node_tree;n=nt.nodes;p=n.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=roughness
    vc=n.new('ShaderNodeVertexColor');vc.layer_name='Color'
    mult=n.new('ShaderNodeMixRGB');mult.blend_type='MULTIPLY';mult.inputs[0].default_value=1;mult.inputs[2].default_value=(*color,1)
    nt.links.new(vc.outputs['Color'],mult.inputs[1]);nt.links.new(mult.outputs[0],p.inputs['Base Color'])
    return m,p,mult

def linear(rgb):
    return [v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]

def hex_color(s):
    return linear([int(s[i:i+2],16)/255 for i in (0,2,4)])

needle,npbs,_=material('Opaque short paired needles158',hex_color('829744'),.74)
tip,tpbs,_=material('Unequal younger olive tips158',hex_color('abb653'),.74)
interior,_,_=material('Dark closed ribbed retained-fascicle packets158',hex_color('536f34'),.92)
for p in [npbs,tpbs]:
    p.inputs['Coat Weight'].default_value=.015
    p.inputs['Subsurface Weight'].default_value=.06
    p.inputs['Subsurface Radius'].default_value=(.5,.7,.25)
twig,_,_=material('Small bent living twigs158',hex_color('716044'),.96)
cut,_,_=material('Old transverse pruning scars158',hex_color('8b795b'),.98)
bark,bpbs,bmult=material('CC0 scanned pine bark158',hex_color('d1c2a8'),.97)
nt=bark.node_tree;n=nt.nodes
maps=PROJECT/'reconstructions/scene-07/assets/hero-pines148/pine-bark'
for suffix,space in [('diff','sRGB'),('nor_gl','Non-Color'),('rough','Non-Color')]:
    texture=n.new('ShaderNodeTexImage');texture.image=bpy.data.images.load(str(maps/f'pine_bark_{suffix}_1k.jpg'),check_existing=True);texture.image.colorspace_settings.name=space;texture.extension='REPEAT'
    if suffix=='diff':
        mt=n.new('ShaderNodeMixRGB');mt.blend_type='MULTIPLY';mt.inputs[0].default_value=1;nt.links.new(texture.outputs['Color'],mt.inputs[1]);nt.links.new(bmult.outputs[0],mt.inputs[2]);nt.links.new(mt.outputs[0],bpbs.inputs['Base Color'])
    elif suffix=='nor_gl':
        normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.56;nt.links.new(texture.outputs['Color'],normal.inputs['Color']);nt.links.new(normal.outputs['Normal'],bpbs.inputs['Normal'])
    else:nt.links.new(texture.outputs['Color'],bpbs.inputs['Roughness'])

materials={'needle':needle,'interior':interior,'twig':twig,'bark':bark,'cut':cut}
meshes=[]
for i,record in enumerate(DATA['meshes']):
    positions=arr(record['attributes']['position']).reshape(-1,3)
    indices=arr(record['index']).astype(np.int32) if record['index'] else np.arange(len(positions),dtype=np.int32)
    m=bpy.data.meshes.new(record['name']);m.vertices.add(len(positions));m.vertices.foreach_set('co',positions.ravel());m.loops.add(len(indices));m.loops.foreach_set('vertex_index',indices)
    m.polygons.add(len(indices)//3);m.polygons.foreach_set('loop_start',np.arange(0,len(indices),3,dtype=np.int32));m.polygons.foreach_set('loop_total',np.full(len(indices)//3,3,dtype=np.int32));m.update()
    if 'uv' in record['attributes']:
        uv=arr(record['attributes']['uv']).reshape(-1,2);layer=m.uv_layers.new(name='UVMap');layer.data.foreach_set('uv',uv[indices].ravel())
    if 'color' in record['attributes']:
        color=arr(record['attributes']['color']).reshape(-1,3);rgba=np.ones((len(color),4),dtype=np.float32);rgba[:,:3]=color
        attribute=m.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT');attribute.data.foreach_set('color',rgba.ravel())
    for polygon in m.polygons:polygon.use_smooth=True
    if 'normal' in record['attributes']:
        normals=arr(record['attributes']['normal']).reshape(-1,3);m.normals_split_custom_set_from_vertices(normals.tolist())
    m.materials.append(materials[record['role']]);meshes.append(m)

collections=[]
for tree in DATA['trees']:
    collection=bpy.data.collections.new(tree['id']);scene.collection.children.link(collection);collections.append(collection)
    for key in ['bark','cuts']:
        o=bpy.data.objects.new(tree['id']+'-'+key,meshes[tree[key]]);collection.objects.link(o)
    for i,item in enumerate(tree['instances']):
        matrix=Matrix(np.array(item['matrix']).reshape(4,4).T.tolist())
        for kind in ['interior','needle','twig']:
            if DATA['variants'][item['variant']].get(kind) is None:continue
            o=bpy.data.objects.new(tree['id']+'-'+kind+'-'+str(i),meshes[DATA['variants'][item['variant']][kind]])
            collection.objects.link(o);o.matrix_world=matrix;o.color=(item['tint'],item['tint'],item['tint'],1)
            if kind=='needle' and item['tip']:
                o.material_slots[0].link='OBJECT';o.material_slots[0].material=tip

ground=bpy.data.materials.new('Quiet earth presentation ground');ground.use_nodes=True
gn=ground.node_tree.nodes;gp=gn.get('Principled BSDF');gp.inputs['Base Color'].default_value=(.055,.062,.042,1);gp.inputs['Roughness'].default_value=.95
texture=gn.new('ShaderNodeTexNoise');texture.inputs['Scale'].default_value=31;texture.inputs['Detail'].default_value=3
bump=gn.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.20;bump.inputs['Distance'].default_value=.008;ground.node_tree.links.new(texture.outputs['Fac'],bump.inputs['Height']);ground.node_tree.links.new(bump.outputs['Normal'],gp.inputs['Normal'])
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.075));bpy.context.object.name='Ground datum; roots intersect the surface';bpy.context.object.data.materials.append(ground)

world=bpy.data.worlds.new('Neutral open sunset sky');world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.44,.50,.59,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65;scene.world=world
def area(name,loc,power,size,color,target):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
area('Broad cool camera fill',(-3,-8,11),1700,10,(.72,.80,1.0),(0,0,4))
sun=bpy.data.lights.new('Warm low left backlight','SUN');sun.energy=3.8;sun.angle=.025;sun.color=(1.0,.72,.36)
so=bpy.data.objects.new('Warm low left backlight',sun);scene.collection.objects.link(so);so.rotation_euler=(-Vector((-.58,.81,.16))).to_track_quat('-Z','Y').to_euler()

camera_data=bpy.data.cameras.new('Fixed model inspection');camera=bpy.data.objects.new('Fixed model inspection',camera_data);scene.collection.objects.link(camera);scene.camera=camera;camera_data.type='ORTHO';camera_data.clip_end=300
scene.render.engine='CYCLES';scene.cycles.samples=int(os.environ.get('PINE_SAMPLES','40'));scene.cycles.use_denoising=True
scene.cycles.max_bounces=6;scene.cycles.diffuse_bounces=3;scene.cycles.glossy_bounces=3;scene.cycles.transparent_max_bounces=2
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
    devices=[d for d in prefs.devices if d.type=='METAL']
    for d in prefs.devices:d.use=d.type=='METAL'
    if devices:scene.cycles.device='GPU'
except Exception as e:print('Device setup:',str(e),flush=True)
scene.render.resolution_x=int(os.environ.get('PINE_SIZE','1100'));scene.render.resolution_y=scene.render.resolution_x;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.5
scene.render.film_transparent=False;scene.render.image_settings.color_mode='RGBA'

views=[
    ('right-front',0,(.2,-23,5.9),(.2,0,4.8),11.8),
    ('right-three-quarter',0,(12,-18,9),(.2,0,4.8),11.9),
    ('right-branch-close',0,(4,-10,8.2),(-.3,0,7.0),6.3),
    ('foreground-front',1,(2.6,-18,6.3),(2.6,0,3.15),8.7),
    ('foreground-three-quarter',1,(12,-16,8),(2.6,0,3.15),8.9)
]
requested=os.environ.get('PINE_VIEWS','')
view_config=OUT/'render-views.json'
if view_config.exists():requested=','.join(json.loads(view_config.read_text())['views'])
if requested:views=[v for v in views if v[0] in requested.split(',')]
evidence=[]
for name,index,position,target,ortho in views:
    for j,c in enumerate(collections):c.hide_render=j!=index
    camera.location=position;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera_data.ortho_scale=ortho
    scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
    evidence.append({'name':name,'file':name+'.png','tree':DATA['trees'][index]['id'],'positionBlenderZUp':position,'targetBlenderZUp':target,'orthographicMetres':ortho,'resolution':[scene.render.resolution_x,scene.render.resolution_y],'samples':scene.cycles.samples,'sha256':hashlib.sha256((OUT/(name+'.png')).read_bytes()).hexdigest()})
    print('PINE158_RENDERED',name,flush=True)
report={'revision':DATA['revision'],'sourceSha256':DATA['sourceSha256'],'visualAccepted':False,'renderer':'Blender Cycles, actual exact JS geometry','device':scene.cycles.device,'elapsedSeconds':time.time()-started,'evidence':evidence,'constraints':{'noPhotoGeometry':True,'noCrownHull':True,'noAlphaCards':True,'rootOriginsPreserved':DATA['sameOrigins']},'limits':['Standalone Cycles PBR and studio lighting are independent from the native WebGL lighting/backscatter. Native source07 integration is not performed by this prototype.','Reference photography is comparison-only. No acceptance or exact photo match is claimed.']}
(OUT/'render-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'out':str(OUT),'elapsedSeconds':report['elapsedSeconds'],'evidence':len(evidence)}),flush=True)
