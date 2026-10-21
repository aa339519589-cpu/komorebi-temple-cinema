"""Correct carved-face views and an editable, separately declared carrier study."""
import bpy,json,time,hashlib,math
import numpy as np
from pathlib import Path
from mathutils import Matrix,Vector
BASE=Path(__file__).resolve().parent;OUT=BASE/'review-floral157-r01';OUT.mkdir(parents=True,exist_ok=True)

def coordinates(obj):
    values=np.empty(len(obj.data.vertices)*3,dtype=np.float32)
    obj.data.vertices.foreach_get('co',values)
    m=np.asarray(obj.matrix_world,dtype=np.float64)
    return values.reshape(-1,3)@m[:3,:3].T+m[:3,3]

def local_hash(obj):
    values=np.empty(len(obj.data.vertices)*3,dtype=np.float32);obj.data.vertices.foreach_get('co',values)
    return hashlib.sha256(values.tobytes()).hexdigest()

def setup():
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=48;scene.cycles.max_bounces=6;scene.cycles.use_denoising=True
    scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.resolution_x=1280;scene.render.resolution_y=720;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8'
    scene.view_settings.view_transform='AgX';scene.view_settings.exposure=-.15
    world=bpy.data.worlds.new('Neutral physical asset study');world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.33,.37,.43,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.26;scene.world=world
    return scene

def lights(scene,width):
    for i,(p,power,size)in enumerate([((-.65,1.0,.75),110,.65),((.9,.75,.12),38,.85),((0,-.7,.8),55,.65)]):
        light=bpy.data.lights.new('Actual area source'+str(i),'AREA');light.shape='DISK';light.size=width*size;light.energy=power*width*width
        obj=bpy.data.objects.new(light.name,light);scene.collection.objects.link(obj);obj.location=Vector(p)*width;obj.rotation_euler=(-obj.location).to_track_quat('-Z','Y').to_euler()

def render(scene,path,width,direction):
    camera_data=bpy.data.cameras.new(path.stem);obj=bpy.data.objects.new(path.stem,camera_data);scene.collection.objects.link(obj);obj.location=Vector(direction).normalized()*width*2.5;obj.rotation_euler=(-obj.location).to_track_quat('-Z','Y').to_euler();camera_data.type='ORTHO';camera_data.ortho_scale=width*1.16;camera_data.clip_start=.001;camera_data.clip_end=100;scene.camera=obj;scene.render.filepath=str(path)
    t=time.time();bpy.ops.render.render(write_still=True);record={'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'seconds':time.time()-t,'cameraWorldMatrix':[list(r)for r in obj.matrix_world],'directionFromAssetZUp':list(direction),'orthographicWidth':camera_data.ortho_scale,'resolution':[1280,720],'renderer':'Cycles CPU','samples':scene.cycles.samples}
    bpy.data.objects.remove(obj,do_unlink=True);return record

def clay():
    mat=bpy.data.materials.new('Geometry inspection only: neutral clay override');mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.29,.32,.36,1);bs.inputs['Roughness'].default_value=.56;bs.inputs['Metallic'].default_value=0;return mat

report={'status':'building','canonicalIntegration':False,'physicalViewsAreActual3D':True,'sourceFacesAreNotPhotoCards':True,'renders':[]}
def save(): (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')

# First prove the original carved side, using the verified +Y outward
# direction. A neutral clay view-layer override changes no source mesh/map.
bpy.ops.wm.read_factory_settings(use_empty=True);scene=setup()
source=BASE/'sources/ccby-diana-liu-floral-panel/source-objaverse.glb';inspection=json.loads((BASE/'inspection-r02/floral-panel-source-inspection.json').read_text())
bpy.ops.import_scene.gltf(filepath=str(source));bpy.context.view_layer.update();objects=[o for o in scene.objects if o.type=='MESH'];pose=Matrix(inspection['previewTransform'])
for obj in objects:
    world=obj.matrix_world.copy();obj.parent=None;obj.matrix_world=pose@world
for obj in list(scene.objects):
    if obj.type=='EMPTY':bpy.data.objects.remove(obj,do_unlink=True)
bpy.context.view_layer.update();points=np.concatenate([coordinates(o)for o in objects]);mn=points.min(0);mx=points.max(0);width=float(mx[0]-mn[0]);assert np.isfinite(points).all() and .5<width<.8
lights(scene,width);scene.view_layers[0].material_override=clay()
report['originalSource']={'file':str(source.relative_to(BASE)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'boundsInInspectionZUp':[mn.tolist(),mx.tolist()],'carvedOutwardInspectionZUp':[0,1,0],'carvedOutwardDerivedGltfYUp':[0,0,-1],'shaderOverride':'Neutral clay view-layer geometry diagnostic; original source material/normal/positions are not edited.','unitStatement':inspection['units']};save()
report['renders'].append(render(scene,OUT/'source-carved-face-front-clay.png',width,(0,1,.045)));save()
report['renders'].append(render(scene,OUT/'source-carved-face-three-quarter-clay.png',width,(.67,1,.26)));save()

# The derived component is a byte-exact subset of original source faces.
# Its original material is retained in the GLTF and as an editable datablock.
bpy.ops.wm.read_factory_settings(use_empty=True);scene=setup();component=BASE/'derived/floral-frieze157-r01';bpy.ops.import_scene.gltf(filepath=str(component/'component.gltf'));bpy.context.view_layer.update();objects=[o for o in scene.objects if o.type=='MESH'];original_hashes={o.name:local_hash(o)for o in objects};points=np.concatenate([coordinates(o)for o in objects]);mn=points.min(0);mx=points.max(0);width=float(mx[0]-mn[0]);height=float(mx[2]-mn[2]);assert np.isfinite(points).all() and .45<width<.65
for obj in objects:
    world=obj.matrix_world.copy();obj.parent=None;obj.matrix_world=world
for obj in list(scene.objects):
    if obj.type=='EMPTY':bpy.data.objects.remove(obj,do_unlink=True)
root=bpy.data.objects.new('157 carved frieze assembly; proposed metric frame',None);scene.collection.objects.link(root)
for obj in objects:obj.parent=root
for material in bpy.data.materials:material.use_fake_user=True

material=bpy.data.materials.new('157 proposed aged cedar with worn raised gilt');material.use_nodes=True;nodes=material.node_tree.nodes;nodes.clear();links=material.node_tree.links
output=nodes.new('ShaderNodeOutputMaterial');wood=nodes.new('ShaderNodeBsdfPrincipled');wood.inputs['Roughness'].default_value=.77;wood.inputs['Coat Weight'].default_value=.035;wood.inputs['Coat Roughness'].default_value=.61;wood.inputs['Specular IOR Level'].default_value=.24
gold=nodes.new('ShaderNodeBsdfPrincipled');gold.inputs['Base Color'].default_value=(.50,.29,.075,1);gold.inputs['Metallic'].default_value=.72;gold.inputs['Roughness'].default_value=.49;gold.inputs['Coat Weight'].default_value=.012
coord=nodes.new('ShaderNodeTexCoord');coord.object=root;scale=nodes.new('ShaderNodeVectorMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=(2.0,140.0,44.0);links.new(coord.outputs['Object'],scale.inputs[0]);grain=nodes.new('ShaderNodeTexNoise');grain.inputs['Scale'].default_value=1;grain.inputs['Detail'].default_value=3;grain.inputs['Roughness'].default_value=.68;links.new(scale.outputs['Vector'],grain.inputs['Vector'])
ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.035,.014,.005,1);ramp.color_ramp.elements[1].color=(.14,.061,.022,1);links.new(grain.outputs['Fac'],ramp.inputs['Fac']);links.new(ramp.outputs['Color'],wood.inputs['Base Color'])
bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.00022;links.new(grain.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],wood.inputs['Normal'])
height_node=nodes.new('ShaderNodeAttribute');height_node.attribute_name='source_relief_height_m';height_node.attribute_type='GEOMETRY';mask=nodes.new('ShaderNodeMapRange');mask.clamp=True;mask.inputs['From Min'].default_value=.0017;mask.inputs['From Max'].default_value=.0048;links.new(height_node.outputs['Fac'],mask.inputs['Value']);mix=nodes.new('ShaderNodeMixShader');links.new(mask.outputs['Result'],mix.inputs[0]);links.new(wood.outputs['BSDF'],mix.inputs[1]);links.new(gold.outputs['BSDF'],mix.inputs[2]);links.new(mix.outputs[0],output.inputs['Surface'])
for obj in objects:
    # New material-only scalar attribute; source positions, normal streams and
    # UVs are not rewritten. The source GLTF remains separately unchanged.
    values=coordinates(obj)[:,1].astype(np.float32);attribute=obj.data.attributes.new(name='source_relief_height_m',type='FLOAT',domain='POINT');attribute.data.foreach_set('value',values)
    for slot in obj.material_slots:slot.link='OBJECT';slot.material=material

carrier_mat=material.copy();carrier_mat.name='157 new cedar carrier, no scan claim'
for node in carrier_mat.node_tree.nodes:
    if node.type=='ATTRIBUTE'and node.attribute_name=='source_relief_height_m':
        node.attribute_name='no_gilding_on_carrier'
def box(name,center,dims):
    x,y,z=[v/2 for v in dims];points=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)];faces=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(points,[],faces);mesh.materials.append(carrier_mat);mesh.update();obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj);obj.location=center;obj.parent=root;bevel=obj.modifiers.new('Actual softened timber corners','BEVEL');bevel.width=.0015;bevel.segments=3;return obj
carrier_width=width+.032;carrier_height=height+.030
box('New closed timber carrier behind original scan',(0,-.039,0),(carrier_width,.060,carrier_height))
for sign in[-1,1]:box('New fitted side tenon '+str(sign),(sign*(carrier_width/2+.019),-.040,0),(.040,.036,.095))
for sign in[-1,1]:box('New perimeter stile '+str(sign),(sign*(width/2+.007),-.003,0),(.014,.016,carrier_height))
for sign in[-1,1]:box('New perimeter rail '+str(sign),(0,-.003,sign*(height/2+.006)),(carrier_width,.014,.012))
bpy.context.view_layer.update()
if any(local_hash(o)!=original_hashes[o.name]for o in objects):raise RuntimeError('Source component vertex positions changed during finish/carrier construction')
root['source_uid']='93766a4c12eb4c278d23294582034e8c';root['license']='CC BY4.0; Diana Liu / Thunk3D scanner';root['source_outward_yup']=[0,0,-1];root['unit_conversion_verified']=False;root['uniform_native_to_proposed_metric_scale']=.001
report['component']={'sourceComponent':'derived/floral-frieze157-r01/component.gltf','sourceComponentSha256':hashlib.sha256((component/'component.gltf').read_bytes()).hexdigest(),'originalCarvingVerticesUnchangedDuringAdaptation':True,'sourceFieldBoundsBlenderZUp':[mn.tolist(),mx.tolist()],'sourceTriangles':sum(len(p.vertices)-2 for o in objects for p in o.data.polygons),'sourceHadUV':any(o.data.uv_layers for o in objects),'newGeometry':'Separate closed timber carrier, edge frames and two fitted tenons, clearly named new geometry.','newFinish':'Proposed physical aged cedar/worn raised gilt, driven by measured relief height as a new material attribute. No source albedo is claimed: original has no UV or image map.','sourceOriginalMaterialRetained':True,'sourceUVRebaked':False,'sourceRemeshed':False,'unitConversionVerified':False,'unitStatement':'Original scanner coordinates/transforms remain in original GLB and exact source trace. Uniform0.001 conversion is an unverified metric proposal; no anisotropic stretching.','carrierDimensionsProposedMetres':[carrier_width,.060,carrier_height]};lights(scene,carrier_width);save()
report['renders'].append(render(scene,OUT/'floral-frieze-proposal-front.png',carrier_width,(0,1,.045)));save()
report['renders'].append(render(scene,OUT/'floral-frieze-proposal-three-quarter.png',carrier_width,(.67,1,.26)));save()
blend=OUT/'floral-frieze157-editable-proposal.blend';bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True)
report['editableModel']={'file':blend.name,'bytes':blend.stat().st_size,'sha256':hashlib.sha256(blend.read_bytes()).hexdigest()};report['status']='correct-carved-face-and-component-proposal-rendered';report['photographicAcceptance']=False;save();print('FLORAL_COMPONENT157_RENDERED',json.dumps({'triangles':report['component']['sourceTriangles'],'sourcePositionHashChecks':len(original_hashes),'renders':[r['file']for r in report['renders']],'blend':report['editableModel']}),flush=True)
