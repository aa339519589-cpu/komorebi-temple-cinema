"""Independent physical-lighting diagnostic of code-generated Three.js buffers.

The geometry and instance matrices come from a verified native source frame.
Custom GLSL hooks/planar reflection approximations are explicitly not equivalent
across renderers. This diagnostic does not replace native scene acceptance.
"""
import bpy, json, math, os, sys, time
from pathlib import Path
import numpy as np
from mathutils import Matrix, Vector
ROOT=Path(os.environ.get('SCENE_PACKAGE','output/scene04-physical-frozen-export')).resolve()
OUT=Path(os.environ.get('CYCLES_OUTPUT','lookdev/scene04-physical/results/physical01')).resolve();OUT.mkdir(parents=True,exist_ok=True)
MODE=os.environ.get('LIGHTING_MODE','outdoor-day')
scene_data=json.loads((ROOT/'scene.json').read_text())
source_report=json.loads((ROOT/'export-report.json').read_text())
if source_report['sourceHash']!='d1f02ccbe5cd1489e5211d8a831508aa592908cbe24733f3dee8bc74f37ce2a8':raise ValueError('Unexpected frozen scene04 source')
if not source_report.get('servedSource',{}).get('allMatch'):raise ValueError('Unchecked served source')
report={'sourceStatistics':scene_data['statistics'],'lightingMode':MODE,'blender':bpy.app.version_string,'scope':scene_data.get('renderingScope'),'geometryRebuilt':False,'excluded':scene_data['excluded'],'warnings':[],'status':'importing','started':time.time(),'sourceHash':source_report['sourceHash'],'sourceCommit':source_report['sourceCommit']}
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene

def binary(record):
    kind={'Float32Array':'<f4','Uint32Array':'<u4','Uint16Array':'<u2'}[record['type']]
    data=np.fromfile(ROOT/'assets'/record['file'],dtype=kind)
    if len(data)!=record['count']: raise ValueError('Truncated geometry buffer '+record['file'])
    return data

def value(node,names,v):
    for name in names:
        if name in node.inputs: node.inputs[name].default_value=v;return node.inputs[name]
    return None

def triplanar_nodes(rec,n,links,coordinate,texture_nodes):
    """Port the existing Y-up world projection and its normal blend.

    Exported vertices are baked into source-world coordinates. The common
    object rotation converts that same space to Blender, so Object remains
    the original Y-up metric frame. No new grain texture is generated.
    """
    def assign(socket,v):
        if hasattr(v,'node'):links.new(v,socket)
        else:socket.default_value=v
    def scalar(operation,a,b=None):
        node=n.new('ShaderNodeMath');node.operation=operation;assign(node.inputs[0],a)
        if b is not None:assign(node.inputs[1],b)
        return node.outputs[0]
    def vector(operation,a,b=None):
        node=n.new('ShaderNodeVectorMath');node.operation=operation;assign(node.inputs[0],a)
        if b is not None:assign(node.inputs[3] if operation=='SCALE' else node.inputs[1],b)
        return node.outputs[0]
    def split(v):
        node=n.new('ShaderNodeSeparateXYZ');links.new(v,node.inputs[0]);return list(node.outputs)
    def combine(v):
        node=n.new('ShaderNodeCombineXYZ')
        for i,x in enumerate(v):assign(node.inputs[i],x)
        return node.outputs[0]
    frequency=1/float(rec['physicalTextureRepeatMetres']);position=vector('SCALE',coordinate.outputs['Object'],frequency)
    if rec['name'].startswith('metre-scaled-worn-wet-paver-'):
        seed=int(rec['customProgramKey'].rsplit('-',1)[1]);position=vector('ADD',position,tuple((seed*k)%1 for k in [.17,.31,.43]))
    p=split(position);geometry=n.new('ShaderNodeNewGeometry');transform=n.new('ShaderNodeVectorTransform');transform.vector_type='NORMAL';transform.convert_from='WORLD';transform.convert_to='OBJECT';links.new(geometry.outputs['Normal'],transform.inputs[0]);base=split(vector('NORMALIZE',transform.outputs[0]))
    powers=[scalar('POWER',scalar('ABSOLUTE',v),6) for v in base];total=scalar('ADD',scalar('ADD',powers[0],powers[1]),powers[2]);weights=[scalar('DIVIDE',v,total) for v in powers]
    sampled={}
    for channel in ['map','roughnessMap','normalMap']:
        if channel not in texture_nodes:continue
        original=texture_nodes[channel];tex=textures[rec['textures'][channel]];colors=[]
        for axis,(u,v) in enumerate([(p[2],p[1]),(p[0],p[2]),(p[0],p[1])]):
            if not tex.get('flipY',True):v=scalar('SUBTRACT',1,v)
            image=n.new('ShaderNodeTexImage');image.image=original.image;image.extension=original.extension;image.interpolation='Linear';links.new(combine([u,v,0]),image.inputs['Vector']);colors.append(image.outputs['Color'])
        sampled[channel]=colors
        if channel!='normalMap':
            # Float-colour arithmetic preserves already decoded linear albedo.
            weighted=[vector('SCALE',v,w) for v,w in zip(colors,weights)];summed=vector('ADD',vector('ADD',weighted[0],weighted[1]),weighted[2]);node=n.new('ShaderNodeMixRGB');node.blend_type='MULTIPLY';node.inputs[0].default_value=1;node.inputs[2].default_value=(1,1,1,1);links.new(summed,node.inputs[1]);texture_nodes[channel]=node
    normal_socket=None
    if 'normalMap' in sampled:
        strength=rec.get('normalScale') or [1,1];normals=[split(vector('SUBTRACT',vector('SCALE',v,2),(1,1,1))) for v in sampled['normalMap']]
        normals=[[scalar('MULTIPLY',a,strength[0]),scalar('MULTIPLY',b,strength[1]),c] for a,b,c in normals];x,y,z=base;nx,ny,nz=normals
        a=combine([scalar('MULTIPLY',x,scalar('ABSOLUTE',nx[2])),scalar('ADD',y,nx[1]),scalar('ADD',z,nx[0])]);b=combine([scalar('ADD',x,ny[0]),scalar('MULTIPLY',y,scalar('ABSOLUTE',ny[2])),scalar('ADD',z,ny[1])]);c=combine([scalar('ADD',x,nz[0]),scalar('ADD',y,nz[1]),scalar('MULTIPLY',z,scalar('ABSOLUTE',nz[2]))])
        merged=vector('NORMALIZE',vector('ADD',vector('ADD',vector('SCALE',a,weights[0]),vector('SCALE',b,weights[1])),vector('SCALE',c,weights[2])));world=n.new('ShaderNodeVectorTransform');world.vector_type='NORMAL';world.convert_from='OBJECT';world.convert_to='WORLD';links.new(merged,world.inputs[0]);normal_socket=world.outputs[0];texture_nodes.pop('normalMap')
    return normal_socket

instance_colored={mid for o in scene_data['meshes'] if 'instanceColors' in o for mid in o['materials']}
textures={t['id']:t for t in scene_data['textures']}; material_records={m['id']:m for m in scene_data['materials']};materials={}
for rec in scene_data['materials']:
    mat=bpy.data.materials.new(rec['name'] or rec['id']);mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();links=mat.node_tree.links
    bs=n.new('ShaderNodeBsdfPrincipled');out=n.new('ShaderNodeOutputMaterial');links.new(bs.outputs['BSDF'],out.inputs['Surface'])
    color=tuple(rec.get('color') or [.5,.5,.5])+ (1,)
    value(bs,['Base Color'],color);value(bs,['Metallic'],float(rec.get('metalness') or 0));value(bs,['Roughness'],max(.04,float(rec['roughness'] if rec.get('roughness') is not None else .4)))
    value(bs,['IOR'],float(rec.get('ior') or 1.5));value(bs,['Transmission Weight','Transmission'],float(rec.get('transmission') or 0))
    value(bs,['Specular IOR Level'],.5*float(rec.get('specularIntensity') if rec.get('specularIntensity') is not None else 1))
    value(bs,['Coat Weight','Clearcoat'],float(rec.get('clearcoat') or 0));value(bs,['Coat Roughness','Clearcoat Roughness'],float(rec.get('clearcoatRoughness') or .15))
    # Coating is transferred only from explicit source parameters.
    value(bs,['Coat IOR'],float(rec.get('clearcoatIOR') or 1.5))
    emission=tuple(rec.get('emissive') or [0,0,0])+(1,);value(bs,['Emission Color','Emission'],emission);value(bs,['Emission Strength'],float(rec.get('emissiveIntensity') or 0))
    value(bs,['Alpha'],float(rec.get('opacity',1)))
    uv=n.new('ShaderNodeTexCoord'); tex_nodes={}
    for channel,tid in rec['textures'].items():
        tex=textures[tid]
        if 'file' not in tex: report['warnings'].append('No portable image for '+rec['name']+'/'+channel);continue
        image=bpy.data.images.load(str(ROOT/'assets'/tex['file']),check_existing=False)
        image.colorspace_settings.name='sRGB' if channel in ['map','emissiveMap'] and tex.get('colorSpace')=='srgb' else 'Non-Color'
        tn=n.new('ShaderNodeTexImage');tn.image=image
        if tex.get('wrapS')!=tex.get('wrapT'):raise ValueError('Mixed-axis wrapping needs explicit translation')
        tn.extension={1000:'REPEAT',1001:'EXTEND',1002:'MIRROR'}.get(tex.get('wrapS'),'REPEAT');tn.interpolation='Linear';tex_nodes[channel]=tn
        mul=n.new('ShaderNodeVectorMath');mul.operation='MULTIPLY';sx,sy=tex.get('repeat',[1,1]);ox,oy=tex.get('offset',[0,0]);
        if not tex.get('flipY',True): sy=-sy;oy=1-oy
        mul.inputs[1].default_value=(sx,sy,1);links.new(uv.outputs['UV'],mul.inputs[0]);add=n.new('ShaderNodeVectorMath');add.operation='ADD';add.inputs[1].default_value=(ox,oy,0);links.new(mul.outputs[0],add.inputs[0]);links.new(add.outputs[0],tn.inputs['Vector'])
        if tex.get('rotation',0):report['warnings'].append('UV texture rotation unported: '+rec['name']+'/'+channel)
    world_normal=None
    if rec.get('customProgramKey','').startswith('scene04-world-triplanar-granite62-'):
        world_normal=triplanar_nodes(rec,n,links,uv,tex_nodes)
        report['warnings'].append('Original stone GLSL macro-weather modulation unported, metric projection/normal and original maps retained: '+rec['name'])
    base_socket=None
    if 'map' in tex_nodes:
        mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;mul.inputs[2].default_value=color;links.new(tex_nodes['map'].outputs['Color'],mul.inputs[1]);base_socket=mul.outputs[0]
        if rec.get('alphaTest',0)>0:links.new(tex_nodes['map'].outputs['Alpha'],bs.inputs['Alpha'])
    if rec.get('vertexColors') or rec['id'] in instance_colored:
        attr=n.new('ShaderNodeVertexColor');attr.layer_name='sourceColor';mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;links.new(attr.outputs['Color'],mul.inputs[1]);
        if base_socket:links.new(base_socket,mul.inputs[2])
        else:mul.inputs[2].default_value=color
        base_socket=mul.outputs[0]
    if base_socket:links.new(base_socket,bs.inputs['Base Color'])
    if 'bumpMap' in tex_nodes:
        bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.45;bump.inputs['Distance'].default_value=abs(float(rec.get('bumpScale') or .003));links.new(tex_nodes['bumpMap'].outputs['Color'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
    if 'normalMap' in tex_nodes:
        normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=(rec.get('normalScale') or [1])[0];links.new(tex_nodes['normalMap'].outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],bs.inputs['Normal'])
    if world_normal:links.new(world_normal,bs.inputs['Normal'])
    for ch,input_name,component,factor in [('roughnessMap','Roughness','G',rec.get('roughness',.4)),('metalnessMap','Metallic','B',rec.get('metalness',0))]:
        if ch in tex_nodes:
            sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes[ch].outputs['Color'],sep.inputs['Color']);mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=float(factor);links.new(sep.outputs[{'G':'Green','B':'Blue'}[component]],mul.inputs[0]);links.new(mul.outputs[0],bs.inputs[input_name])
    for ch,socket,component,factor in [('clearcoatMap','Coat Weight','Red',rec.get('clearcoat',0)),('clearcoatRoughnessMap','Coat Roughness','Green',rec.get('clearcoatRoughness',0))]:
        if ch in tex_nodes and socket in bs.inputs:
            sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes[ch].outputs['Color'],sep.inputs['Color']);mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=float(factor);links.new(sep.outputs[component],mul.inputs[0]);links.new(mul.outputs[0],bs.inputs[socket])
    if 'clearcoatNormalMap' in tex_nodes and 'Coat Normal' in bs.inputs:
        cn=n.new('ShaderNodeNormalMap');cn.inputs['Strength'].default_value=(rec.get('clearcoatNormalScale') or [1])[0];links.new(tex_nodes['clearcoatNormalMap'].outputs['Color'],cn.inputs['Color']);links.new(cn.outputs['Normal'],bs.inputs['Coat Normal'])
    if 'alphaMap' in tex_nodes:

        sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes['alphaMap'].outputs['Color'],sep.inputs['Color']);links.new(sep.outputs['Green'],bs.inputs['Alpha'])
    if 'emissiveMap' in tex_nodes:
        for name in ['Emission Color','Emission']:
            if name in bs.inputs:links.new(tex_nodes['emissiveMap'].outputs['Color'],bs.inputs[name]);break
    if rec['name']=='reference4-green-clear-pond-surface':
        value(bs,['Base Color'],(.94,.98,.96,1));value(bs,['Alpha'],1);value(bs,['IOR'],1.333);value(bs,['Transmission Weight','Transmission'],1);value(bs,['Roughness'],.085);value(bs,['Coat Weight','Clearcoat'],0)
    # Double-sided garden leaves need transmitted daylight in the path tracer,
    # while opaque stone, ornaments and wood keep their original BSDF.
    thin_leaf=any(k in rec['name'] for k in ['lotus-green','low-green-leaves','maple-olive','pine-individual-needles','thick-layered-pine-crown','cherry-pink','lotus-pink','small-live-maple-leaves'])
    thin_paper=rec['name']=='reference4-warm-paper' and max(rec.get('emissive') or [0,0,0])>0
    if thin_leaf or thin_paper:
        tr=n.new('ShaderNodeBsdfTranslucent')
        if base_socket:links.new(base_socket,tr.inputs['Color'])
        else:tr.inputs['Color'].default_value=color
        mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=.45 if thin_paper else .26;links.new(bs.outputs['BSDF'],mix.inputs[1]);links.new(tr.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface'])
    # Alpha holes surround the complete physical leaf BSDF, including the
    # transmitted lobe; otherwise a translucent rectangle fills every cutout.
    if rec.get('alphaTest',0)>0 and 'map' in tex_nodes:
        for link in list(bs.inputs['Alpha'].links):links.remove(link)
        value(bs,['Alpha'],1);cut=n.new('ShaderNodeMath');cut.operation='GREATER_THAN';cut.inputs[1].default_value=rec['alphaTest'];links.new(tex_nodes['map'].outputs['Alpha'],cut.inputs[0]);transparent=n.new('ShaderNodeBsdfTransparent');masked=n.new('ShaderNodeMixShader');links.new(cut.outputs[0],masked.inputs[0]);links.new(transparent.outputs[0],masked.inputs[1]);links.new(out.inputs['Surface'].links[0].from_socket,masked.inputs[2]);links.new(masked.outputs[0],out.inputs['Surface'])
    materials[rec['id']]=mat

geo={g['id']:g for g in scene_data['geometries']}; loaded={};imported_triangles=0
for at,record in enumerate(scene_data['meshes']):
    g=geo[record['geometry']]
    if g['id'] not in loaded:
        loaded[g['id']]={k:binary(v).reshape(-1,v['itemSize']) for k,v in g['attributes'].items()};loaded[g['id']]['index']=binary(g['index']).reshape(-1,3)
    data=loaded[g['id']];p=data['position'];indices=data['index'];count=record['instances'];vcount=len(p);fcount=len(indices)
    world=np.array(record['matrix'],dtype=np.float64).reshape(4,4).T
    if 'instanceMatrices' in record:
        local=binary(record['instanceMatrices']).reshape(count,4,4).transpose(0,2,1);transforms=np.einsum('ij,njk->nik',world,local)
    else:transforms=world[None,:,:]
    coords=np.empty((count*vcount,3),dtype=np.float32);normals=np.empty_like(coords) if 'normal' in data else None
    for i,transform in enumerate(transforms):
        coords[i*vcount:(i+1)*vcount]=p@transform[:3,:3].T+transform[:3,3]
        if normals is not None:
            ns=data['normal']@np.linalg.pinv(transform[:3,:3],rcond=1e-12);length=np.maximum(np.linalg.norm(ns,axis=1),1e-12);normals[i*vcount:(i+1)*vcount]=ns/length[:,None]
    faces=(indices[None,:,:]+(np.arange(count,dtype=np.uint32)*vcount)[:,None,None]).reshape(-1,3)
    for i,tr in enumerate(transforms):
        if np.linalg.det(tr[:3,:3])<0:faces[i*fcount:(i+1)*fcount]=faces[i*fcount:(i+1)*fcount][:,[0,2,1]]
    mesh=bpy.data.meshes.new(record['name'] or 'source-mesh-'+str(at));mesh.vertices.add(len(coords));mesh.vertices.foreach_set('co',coords.ravel());mesh.loops.add(faces.size);mesh.loops.foreach_set('vertex_index',faces.ravel().astype(np.int32));mesh.polygons.add(len(faces));mesh.polygons.foreach_set('loop_start',np.arange(len(faces),dtype=np.int32)*3);mesh.polygons.foreach_set('loop_total',np.full(len(faces),3,dtype=np.int32));mesh.polygons.foreach_set('use_smooth',np.ones(len(faces),dtype=np.bool_));mesh.update(calc_edges=True)
    if normals is not None:
        try:mesh.normals_split_custom_set_from_vertices(normals)
        except Exception as e:report['warnings'].append('Custom normals: '+str(e))
    if 'uv' in data:
        uv=data['uv'][faces.ravel()%vcount,:2].astype(np.float32);layer=mesh.uv_layers.new(name='sourceUV');layer.data.foreach_set('uv',uv.ravel())
    if 'color' in data or 'instanceColors' in record or any(mid in instance_colored for mid in record['materials']):
        colors=np.ones((len(coords),4),dtype=np.float32)
        if 'color' in data: colors[:,:min(4,data['color'].shape[1])]=np.tile(data['color'],(count,1))[:,:4]
        if 'instanceColors' in record: colors[:,:3]*=np.repeat(binary(record['instanceColors']).reshape(count,3),vcount,axis=0)
        attr=mesh.color_attributes.new(name='sourceColor',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',colors.ravel())
    for mid in record['materials']:mesh.materials.append(materials[mid])
    if len(record['materials'])>1 and g['groups']:
        owners=np.zeros(fcount,dtype=np.int32)
        for group in g['groups']:owners[group['start']//3:(group['start']+group['count'])//3]=group.get('materialIndex',0)
        mesh.polygons.foreach_set('material_index',np.tile(owners,count))
    obj=bpy.data.objects.new(record['name'] or 'source-object-'+str(at),mesh);scene.collection.objects.link(obj);imported_triangles+=len(faces)
    if at%20==0:print('SOURCE_MESH',at,'/',len(scene_data['meshes']),'triangles',imported_triangles,flush=True)

for rec in scene_data['lights']:
    if rec['intensity']<=0 or rec['type']=='HemisphereLight':continue
    typ={'DirectionalLight':'SUN','PointLight':'POINT','SpotLight':'SPOT','RectAreaLight':'AREA'}.get(rec['type'])
    if not typ:continue
    light=bpy.data.lights.new(rec['name'] or typ,typ);light.color=rec['color'];obj=bpy.data.objects.new(rec['name'] or typ,light);scene.collection.objects.link(obj);obj.matrix_world=Matrix(np.array(rec['matrix']).reshape(4,4).T.tolist())
    intensity=rec['intensity']
    if typ=='SUN':light.energy=intensity*float(os.environ.get('CYCLES_SUN_GAIN','1.0'));light.angle=.0093
    elif typ=='AREA':light.shape='RECTANGLE';light.size=rec.get('width',1);light.size_y=rec.get('height',1);light.energy=intensity*light.size*light.size_y*math.pi
    else:light.energy=intensity*4*math.pi;light.shadow_soft_size=.05
    if typ=='SPOT':light.spot_size=2*(rec.get('angle') or .8);light.spot_blend=rec.get('penumbra') or .2
    if typ in ['SUN','SPOT'] and rec.get('target'):
        direction=Vector(rec['target'])-obj.location;obj.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
    if MODE=='upper-window' and rec['name']=='production-left-window-bounce':
        obj.location=(-6.4,10.7,-6);obj.rotation_euler=(Vector((-1.54,8.4,-9.7))-obj.location).to_track_quat('-Z','Y').to_euler();light.size=2.2;light.size_y=3.5;light.energy=460
    if MODE=='upper-window' and rec['name']=='production-front-room-bounce':light.energy*=.3

cam_data=bpy.data.cameras.new('source-reference04-camera');camera=bpy.data.objects.new('source-reference04-camera',cam_data);scene.collection.objects.link(camera);camera.matrix_world=Matrix(np.array(scene_data['cameraMatrix']).reshape(4,4).T.tolist());cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=24;cam_data.lens=12/math.tan(math.radians(scene_data['view']['fov'])/2);cam_data.clip_start=.1;cam_data.clip_end=1200;scene.camera=camera
# Light Euler targets must reach matrix_world before the rigid conversion reads it.
bpy.context.view_layer.update()
if MODE=='outdoor-day':
    # Rigidly convert the entire recovered world, including every light and
    # the camera, into Blender's ordinary Z-up frame. Distances, silhouette
    # and relative camera pose are preserved by this single shared rotation.
    conversion=Matrix.Rotation(math.pi/2,4,'X')
    for obj in list(scene.objects):obj.matrix_world=conversion@obj.matrix_world
    bpy.context.view_layer.update()
    report['worldCoordinateConversion']='All source meshes, lights and camera jointly rotated +90 degrees about X: Y-up to Z-up, no deformation.'
if MODE=='outdoor-day':
    bpy.context.view_layer.update();rays=[]
    for rr in scene_data['lights']:
        if rr['type'] not in ['DirectionalLight','SpotLight'] or not rr.get('target'):continue
        obj=scene.objects.get(rr['name'])
        if obj is None or obj.type!='LIGHT':continue
        m=Matrix(np.array(rr['matrix']).reshape(4,4).T.tolist());origin=conversion@m.translation;target=conversion@Vector(rr['target']);expected=(target-origin).normalized();actual=(obj.matrix_world.to_3x3()@Vector((0,0,-1))).normalized();dot=max(-1,min(1,expected.dot(actual)));angle=math.degrees(math.acos(dot));rays.append({'name':rr['name'],'origin':list(origin),'target':list(target),'actualOrigin':list(obj.matrix_world.translation),'originErrorMetres':(obj.matrix_world.translation-origin).length,'expected':list(expected),'actual':list(actual),'dot':dot,'errorDegrees':angle})
        if angle>.01:raise ValueError('Actual light ray transfer mismatch: '+rr['name']+' '+str(angle))
    report['actualLightRayAudit']=rays
# A measured pure sky supplies the physical environment once. Native local
# reflection probes and their .06 diffuse multiplier are deliberately absent.
# The source SUN remains at its declared strength; no former .28 reduction.
sky_path=Path(os.environ.get('TEMPLE_SKY_EXR','assets/polyhaven/kloppenheim-06-puresky/sky-2k.exr')).resolve()
world=bpy.data.worlds.new('scene04-measured-sky-single-environment');scene.world=world;world.use_nodes=True
wn=world.node_tree.nodes;wl=world.node_tree.links;wn.clear()
environment=wn.new('ShaderNodeTexEnvironment');environment.image=bpy.data.images.load(str(sky_path));environment.image.colorspace_settings.name='Linear Rec.709'
image=environment.image;width,height=image.size;pixels=np.empty(width*height*4,dtype=np.float32);image.pixels.foreach_get(pixels)
rgb=pixels.reshape(height,width,4)[:,:,:3];luminance=rgb@np.asarray([.2126,.7152,.0722],dtype=np.float32)
sun_y,sun_x=np.unravel_index(np.argmax(luminance),luminance.shape)
# Blender's sphere_to_equirectangular: phi=pi-2*pi*u, altitude=pi*(v-.5).
# Loaded Image.pixels is bottom-up, so these are the actual sampled texels.
phi=math.pi-2*math.pi*(sun_x+.5)/width;altitude=math.pi*((sun_y+.5)/height-.5)
measured=Vector((math.cos(phi)*math.cos(altitude),math.sin(phi)*math.cos(altitude),math.sin(altitude)))
sun=next(o for o in scene.objects if o.type=='LIGHT' and o.data.type=='SUN')
target=-(sun.matrix_world.to_3x3()@Vector((0,0,-1))).normalized()
rotation=target.rotation_difference(measured);mapping=wn.new('ShaderNodeMapping');mapping.vector_type='VECTOR';mapping.inputs['Rotation'].default_value=rotation.to_euler('XYZ')
coordinate=wn.new('ShaderNodeTexCoord');outward=wn.new('ShaderNodeVectorMath');outward.operation='SCALE';outward.inputs[3].default_value=-1
wl.new(coordinate.outputs['Normal'],outward.inputs[0]);wl.new(outward.outputs['Vector'],mapping.inputs['Vector']);wl.new(mapping.outputs['Vector'],environment.inputs['Vector'])
background=wn.new('ShaderNodeBackground');background.inputs['Strength'].default_value=float(os.environ.get('CYCLES_WORLD_GAIN','1.0'));output=wn.new('ShaderNodeOutputWorld');wl.new(environment.outputs['Color'],background.inputs['Color']);wl.new(background.outputs[0],output.inputs['Surface'])

# Quantify the incoming sky, rather than judging a guessed world gain from a
# display-referred swatch. The capture is not claimed to be absolutely SI-
# calibrated. SUN=8 and sky gain=1 are the initial declared working units.
ph=math.pi-2*math.pi*(np.arange(width)+.5)/width;al=math.pi*((np.arange(height)+.5)/height-.5)
directions=np.stack(np.broadcast_arrays(np.cos(al)[:,None]*np.cos(ph)[None,:],np.cos(al)[:,None]*np.sin(ph)[None,:],np.sin(al)[:,None]+np.zeros(width)[None,:]),axis=-1)
world_directions=directions@np.asarray(rotation.to_matrix(),dtype=np.float64)
solid=np.cos(al)[:,None]*(2*math.pi/width)*(math.pi/height)
horizontal=solid*np.maximum(0,world_directions[:,:,2]);irradiance=(rgb*horizontal[:,:,None]).sum(axis=(0,1))
cone=(directions@np.asarray(measured))>math.cos(math.radians(1));ring=((directions@np.asarray(measured))<math.cos(math.radians(2)))&((directions@np.asarray(measured))>math.cos(math.radians(4)))
cone_irradiance=(rgb*horizontal[:,:,None]*cone[:,:,None]).sum(axis=(0,1));ring_mean=rgb[ring].mean(axis=0)
# The tiny direct cap is removed from this measured fill to avoid duplicating
# the explicitly retained SUN. Preserve all remaining measured sky radiance.
removed=(np.maximum(rgb-ring_mean,0)*horizontal[:,:,None]*cone[:,:,None]).sum(axis=(0,1))
rgb[cone]=np.minimum(rgb[cone],ring_mean);image.pixels.foreach_set(pixels);image.update();image.pack()
actual_environment=rotation.inverted()@measured
report['measuredSky']={'asset':'kloppenheim_06_puresky','provider':'Poly Haven','license':'CC0-1.0','source':'https://polyhaven.com/a/kloppenheim_06_puresky','file':str(sky_path),'colorSpace':'Linear Rec.709','gain':background.inputs['Strength'].default_value,'sourcePeakRGB':list(map(float,rgb[sun_y,sun_x])),'sourcePeakLuminanceBeforeCap':float(luminance.max()),'sourceMeanLuminance':float(luminance.mean()),'sourcePeakPixel':[int(sun_x),int(sun_y)],'sourcePeakAltitudeDegrees':math.degrees(altitude),'targetDirectionZUp':list(target),'mappedPeakDirectionZUp':list(actual_environment),'alignmentDot':float(actual_environment.dot(target)),'rotationEuler':list(mapping.inputs['Rotation'].default_value),'horizontalIrradianceRGBBeforeCap':irradiance.tolist(),'oneDegreeCapIrradianceRGB':cone_irradiance.tolist(),'removedDirectCapIrradianceRGB':removed.tolist(),'directCapRadiusDegrees':1,'capReplacement':'Maximum bounded by measured 2–4 degree ring, no colour grading','absolutePhotometricCalibration':False,'nativeProbesImported':False,'nativeDiffuseProbeGainImported':False,'formulaSource':'https://github.com/blender/blender/blob/main/intern/cycles/kernel/camera/projection.h'}
camera_expected=conversion@Matrix(np.array(scene_data['cameraMatrix']).reshape(4,4).T.tolist())
report['cameraMatrixError']=max(abs(camera.matrix_world[i][j]-camera_expected[i][j]) for i in range(4) for j in range(4))
if report['cameraMatrixError']>1e-5:raise ValueError('Camera changed during import')
report['materialAudit']=[{'name':r['name'],'colorLinear':r.get('color'),'roughnessScalar':r.get('roughness'),'metalness':r.get('metalness'),'ior':r.get('ior'),'clearcoatIOR':r.get('clearcoatIOR'),'normalScale':r.get('normalScale'),'clearcoatNormalScale':r.get('clearcoatNormalScale'),'textures':{channel:{'file':textures[tid].get('file'),'colorSpace':textures[tid].get('colorSpace'),'blenderColorSpace':('sRGB' if channel in ['map','emissiveMap'] and textures[tid].get('colorSpace')=='srgb' else 'Non-Color'),'repeat':textures[tid].get('repeat'),'offset':textures[tid].get('offset'),'wrapS':textures[tid].get('wrapS'),'wrapT':textures[tid].get('wrapT'),'flipY':textures[tid].get('flipY')} for channel,tid in r['textures'].items()}} for r in scene_data['materials'] if r['name'].startswith('traced-granite-')]
if len(report['materialAudit'])!=31:raise ValueError('Expected all 31 individually mapped stones')
for r in report['materialAudit']:
    if r['colorLinear']!=[1,1,1] or abs(r['clearcoatIOR']-1.333)>1e-6:raise ValueError('Unexpected traced-stone transfer')
    for channel in ['map','normalMap','roughnessMap','clearcoatMap','clearcoatRoughnessMap','clearcoatNormalMap']:
        if channel not in r['textures']:raise ValueError('Lost stone channel '+channel)
        if r['textures'][channel]['wrapS']!=1001 or r['textures'][channel]['wrapT']!=1001:raise ValueError('Lost clamp sampler')
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=int(os.environ.get('CYCLES_SAMPLES','32'))
if os.environ.get('CYCLES_DEVICE')=='METAL':
    preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
    for device in preferences.devices:device.use=device.type=='METAL'
    if not any(device.use for device in preferences.devices):raise RuntimeError('Requested Metal GPU is unavailable')
    scene.cycles.device='GPU'
report['cyclesDevice']=scene.cycles.device
# Ubuntu's distribution Blender can be built without Intel OpenImageDenoise.
# That build fails during render with "Build without OpenImageDenoiser" when
# use_denoising is true. Render actual Cycles samples without denoising by default.
# Any explicitly requested denoising must have a compatible compiled backend.
denoise_requested=os.environ.get('CYCLES_DENOISE','0').strip()=='1'
if denoise_requested and bpy.app.version<(5,0,0) and not getattr(bpy.app.build_options,'openimagedenoise',False):
    raise RuntimeError('Requested OIDN denoising, but Blender was built without OpenImageDenoiser')
scene.cycles.use_denoising=denoise_requested
if denoise_requested:scene.cycles.denoiser='OPENIMAGEDENOISE'
for layer in scene.view_layers:
    if hasattr(layer,'cycles'):
        layer.cycles.use_denoising=denoise_requested
report['denoisingEnabled']=denoise_requested
report['denoisingReason']='Native Cycles non-denoised output retained for unsupported distribution builds' if not denoise_requested else 'Verified built-in OpenImageDenoise'
scene.cycles.seed=904101;scene.cycles.use_animated_seed=False
scene.cycles.max_bounces=8;scene.cycles.diffuse_bounces=4;scene.cycles.glossy_bounces=4;scene.cycles.transmission_bounces=6;scene.cycles.volume_bounces=1;scene.cycles.sample_clamp_indirect=8
scene.render.resolution_x=int(os.environ.get('CYCLES_SIZE','640'));scene.render.resolution_y=scene.render.resolution_x;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.threads_mode='FIXED';scene.render.threads=int(os.environ.get('CYCLES_THREADS','4'))
try:scene.view_settings.view_transform='AgX'
except:scene.view_settings.view_transform='Filmic'
scene.view_settings.exposure=float(os.environ.get('CYCLES_EXPOSURE','0.0'));scene.view_settings.gamma=1
render_name=os.environ.get('CYCLES_RENDER_NAME','scene04-physical01.png')
if Path(render_name).name!=render_name:raise ValueError('CYCLES_RENDER_NAME must be a filename')
scene.render.filepath=str(OUT/render_name);scene.render.film_transparent=False
report['importedTriangles']=imported_triangles;report['geometryTriangleCountPreserved']=imported_triangles==scene_data['statistics']['triangles'];report['status']='rendering';report['materialTransfer']='All31 per-stone PBR channels/UV transforms/clamp/linear white base and water-film IOR1.333 retained. Existing other-stone metric triplanar sampling and its world-normal blend ported to nodes. Older stone macro-weather GLSL modulation omitted and disclosed. Pond IOR1.333/transmission1, leaf scattering.26 and explicit lamp-paper scattering.45 are physical transport hypotheses; all image maps retain their source colour spaces.';report['lightCalibration']={'transfer':'Source positions/colors; area*pi and point*4pi power conversion is a declared working-unit hypothesis, not absolute SI calibration','sunGain':float(os.environ.get('CYCLES_SUN_GAIN','1.0')),'worldGain':float(os.environ.get('CYCLES_WORLD_GAIN','1.0')),'exposure':scene.view_settings.exposure,'nativeWebglPixelEquivalence':False,'probeImported':False,'environmentCount':1,'seed':scene.cycles.seed}
(OUT/'report.json').write_text(json.dumps(report,indent=2));
if os.environ.get('CYCLES_SAVE_BLEND','1')=='1':
    blend_name=os.environ.get('CYCLES_BLEND_NAME','scene04-physical01.blend')
    if Path(blend_name).name!=blend_name:raise ValueError('CYCLES_BLEND_NAME must be a filename')
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/blend_name),compress=True)
bpy.ops.render.render(write_still=True)
report['status']='path-traced-review';report['finished']=time.time();report['resolution']=[scene.render.resolution_x,scene.render.resolution_y];report['samples']=scene.cycles.samples;report['photographicAcceptance']=False;(OUT/'report.json').write_text(json.dumps(report,indent=2));print('CYCLES_REVIEW_COMPLETE',json.dumps(report),flush=True)
