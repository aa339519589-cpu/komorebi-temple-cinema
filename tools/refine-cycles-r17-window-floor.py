"""R17: floor-directed window sunlight with preserved statue exposure, two Cycles reviews on the exact preserved sanctuary mesh.
Never writes source blend, never inserts facade geometry, never uses AI-generated pixels.
"""
import bpy, json, os, time, hashlib, math
from pathlib import Path
from mathutils import Vector

mode=os.environ.get('KOMOREBI_R17_MODE','window-floor')
if mode not in ('window-floor','window-floor-haze'):
    raise ValueError('Unknown requested reference-six lighting variant')
out=Path(os.environ.get('KOMOREBI_R17_OUT','output/cycles-r17')).resolve()
out.mkdir(parents=True,exist_ok=True)
original=Path(bpy.data.filepath).resolve()
if not original.is_file() or original.suffix!='.blend':
    raise RuntimeError('Must open the archived original full-geometry Blender source')
source_bytes=original.read_bytes()
sha=lambda b: hashlib.sha256(b).hexdigest()
original_geometry={mesh.as_pointer():(len(mesh.vertices),len(mesh.polygons),len(mesh.loops)) for mesh in bpy.data.meshes}
original_materials={mat.as_pointer():mat.name for mat in bpy.data.materials}
base_faces=sum(v[1] for v in original_geometry.values())
if base_faces<10_000_000:raise RuntimeError('Truncated source: refusing to render a proxy')
report={
    'mode':mode,'sourceBlend':original.name,'sourceBlendSha256':sha(source_bytes),
    'sourceMeshCount':len(original_geometry),'sourceTriangles':base_faces,
    'originalOverwritten':False,'referencePixelsUsed':False,
    'geometryPolicy':'Keep all preserved source meshes and transforms unchanged',
    'started':time.time(),'status':'preparing','lighting':{},'editedMaterials':[],
    'photoSimilarityAccepted':False,
    'designHypothesis':'Reorient left-window emitter toward near floor and reduce floor microsurface roughness; preserve altar fill, camera and source topology; ROI comparison required'
}
def save():
    (out/('report-'+mode+'.json')).write_text(json.dumps(report,indent=2,ensure_ascii=False))
save()
scene=bpy.context.scene
if scene.camera is None:raise RuntimeError('Missing source camera')
camera_matrix=scene.camera.matrix_world.copy()
camera_lens=scene.camera.data.lens
scene.render.engine='CYCLES'
scene.cycles.device='CPU'
samples=int(os.environ.get('KOMOREBI_R17_SAMPLES','64'))
size=int(os.environ.get('KOMOREBI_R17_SIZE','720'))
if not 8<=samples<=256 or not 320<=size<=1280 or size%2:
    raise ValueError('Bounded render sampling and size required')
scene.cycles.samples=samples
scene.cycles.use_denoising=False
for layer in scene.view_layers:
    if hasattr(layer,'cycles'):layer.cycles.use_denoising=False
scene.cycles.max_bounces=8
scene.cycles.diffuse_bounces=4
scene.cycles.glossy_bounces=6
scene.cycles.transmission_bounces=4
scene.cycles.volume_bounces=2 if mode=='window-floor-haze' else 0
scene.cycles.sample_clamp_indirect=9
scene.render.threads_mode='FIXED'
scene.render.threads=4
scene.render.resolution_x=size
scene.render.resolution_y=size
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGB'
scene.render.image_settings.color_depth='8'
scene.render.film_transparent=False
scene.view_settings.view_transform='AgX'
scene.view_settings.exposure=.85
scene.view_settings.gamma=1
report['render']={'size':size,'samples':samples,'view':'Original camera, unchanged','viewTransform':'AgX','exposure':.85}
if scene.world is None or not scene.world.use_nodes:
    raise RuntimeError('Source world shader is unavailable')
background=next((n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND'),None)
if background is None:raise RuntimeError('Source world node has no Background')
background.inputs['Strength'].default_value=.28
background.inputs['Color'].default_value=(.44,.49,.56,1)

def area(name,origin,target,power,sx,sy,colour):
    if name in bpy.data.objects or name in bpy.data.lights:
        raise RuntimeError('Refuse to replace existing physical light '+name)
    light=bpy.data.lights.new(name,'AREA')
    obj=bpy.data.objects.new(name,light);scene.collection.objects.link(obj)
    light.shape='RECTANGLE';light.size=sx;light.size_y=sy
    light.energy=power;light.color=colour
    obj.location=origin
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    report['lighting'][name]={'from':origin,'target':target,'power':power,'dimensions':[sx,sy],'color':colour}

# Lighting is motivated by the actual side-window positions; all area lights
# produce scene-space cast shadows, falloff and reflected transport.
area('r17-natural-left-window',(-9.4,10.4,-6.2),(-1.54,1.8,-5.3),
     2200,6.0,3.0,(1,.84,.63))
area('r17-bounced-altar-gold',(2.7,9.6,-7.8),(-1.54,7.3,-13.2),
     260,4.4,3.0,(1,.86,.73))
area('r17-subtle-rear-lacquer',(-1.6,11.8,-18),(-1.54,6.4,-11.5),
     84,4.0,2.4,(1,.75,.53))

for obj in scene.objects:
    if obj.type=='LIGHT' and 'production-left-window-bounce' in obj.name:
        obj.data.energy=420
        report['lighting']['adjusted-existing-window-bounce']={'name':obj.name,'power':420}

for material in bpy.data.materials:
    if not material.use_nodes:continue
    name=material.name.lower()
    floor=('floor-panel' in name or 'broad-joined-cedar' in name)
    lacquer=('polished' in name or 'lacquer' in name)
    if not floor and not lacquer:continue
    pbr=next((node for node in material.node_tree.nodes if node.type=='BSDF_PRINCIPLED'),None)
    if pbr is None:continue
    rough=pbr.inputs.get('Roughness')
    if rough and not rough.is_linked:rough.default_value=.080 if floor else .19
    coat=pbr.inputs.get('Coat Weight') or pbr.inputs.get('Clearcoat')
    if coat and not coat.is_linked:coat.default_value=.79 if floor else .34
    coat_rough=pbr.inputs.get('Coat Roughness') or pbr.inputs.get('Clearcoat Roughness')
    if coat_rough and not coat_rough.is_linked:coat_rough.default_value=.055 if floor else .15
    # Darker lacquer beneath actual bright glints. Do not paint a fake reflection.
    base=pbr.inputs.get('Base Color')
    if floor and base and not base.is_linked:
        orig=list(base.default_value)
        base.default_value=(orig[0]*.70,orig[1]*.63,orig[2]*.60,orig[3])
    report['editedMaterials'].append(material.name)
if not report['editedMaterials']:raise RuntimeError('No genuine floor/lacquer source materials')
extra_mesh=None
if mode=='window-floor-haze':
    bpy.ops.mesh.primitive_cube_add(size=2,location=(-1.54,9.2,-10.8))
    extra_mesh=bpy.context.object.data
    volume=bpy.context.object
    volume.name='r17-participating-air-only'
    volume.scale=(9.5,5.3,9.4)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    material=bpy.data.materials.new('r17-physical-window-haze')
    material.use_nodes=True
    nodes=material.node_tree.nodes;nodes.clear()
    output=nodes.new('ShaderNodeOutputMaterial')
    medium=nodes.new('ShaderNodeVolumePrincipled')
    medium.inputs['Color'].default_value=(1,.97,.87,1)
    medium.inputs['Density'].default_value=.0015
    medium.inputs['Anisotropy'].default_value=.45
    material.node_tree.links.new(medium.outputs['Volume'],output.inputs['Volume'])
    volume.data.materials.append(material)
    report['physicalMedium']={'density':.0015,'anisotropy':.45,'polygons':len(extra_mesh.polygons)}

def verify_source_topology():
    for mesh in bpy.data.meshes:
        if mesh.as_pointer() in original_geometry:
            current=(len(mesh.vertices),len(mesh.polygons),len(mesh.loops))
            if current!=original_geometry[mesh.as_pointer()]:
                raise RuntimeError('Original source topology changed '+mesh.name)
    original_count=sum(1 for mesh in bpy.data.meshes if mesh.as_pointer() in original_geometry)
    if original_count!=len(original_geometry):raise RuntimeError('Source geometry was removed')
    added=[m for m in bpy.data.meshes if m.as_pointer() not in original_geometry]
    expected=1 if extra_mesh is not None else 0
    if len(added)!=expected:raise RuntimeError('Unexpected new geometry '+str(len(added)))
    additional_triangles=sum(sum(len(p.vertices)-2 for p in m.polygons) for m in added)
    if additional_triangles!=(12 if expected else 0):
        raise RuntimeError('Additional geometry is not the authorized 12-triangle air container')
    if scene.camera.matrix_world!=camera_matrix or scene.camera.data.lens!=camera_lens:
        raise RuntimeError('Original source camera was altered')
    return additional_triangles

report['addedNonarchitecturalTriangles']=verify_source_topology()
report['status']='rendering'
png=out/('sanctuary-r17-'+mode+'.png')
if png.exists():raise FileExistsError('Refuse to overwrite an earlier R17 render '+str(png))
scene.render.filepath=str(png);save()
bpy.ops.render.render(write_still=True)
if not png.is_file() or png.stat().st_size<30000:
    raise RuntimeError('Cycles failed to write the actual rendered PNG')
report['addedNonarchitecturalTriangles']=verify_source_topology()
report.update({'status':'path-traced-review','png':png.name,'pngBytes':png.stat().st_size,
               'pngSha256':sha(png.read_bytes()),'originalCameraPreserved':True,
               'originalMeshCountPreserved':True,'finished':time.time()})
save()
print('R17_NATIVE_CYCLES_COMPLETE',json.dumps({
    'status':report['status'],'mode':mode,'sourceTriangles':base_faces,
    'additionalNonarchitecturalTriangles':report['addedNonarchitecturalTriangles'],
    'pngSha256':report['pngSha256'],'render':report['render']},indent=2),flush=True)
