"""Relight the ORIGINAL 11M-triangle saved Blender geometry. No image synthesis."""
import bpy,os,json,hashlib,time,math
from pathlib import Path
from mathutils import Vector
root=Path(os.environ.get('CYCLES_VARIANT_OUT','output/cycles-physical-variants')).resolve()
mode=os.environ.get('CYCLES_VARIANT','warm-key')
if mode not in ('warm-key','window-beams'): raise ValueError('Unsupported explicit lighting configuration')
root.mkdir(parents=True,exist_ok=True)
scene=bpy.context.scene
original=bpy.data.filepath
if not original or not Path(original).is_file():raise RuntimeError('Open an exact existing source .blend; do not generate new architecture')
stats={'mode':mode,'sourceBlend':Path(original).name,'sourceBlendSha256':hashlib.sha256(Path(original).read_bytes()).hexdigest(),
       'geometryChanged':False,'originalOverwritten':False,'started':time.time(),'baseMeshes':len(bpy.data.meshes),
       'baseTriangles':sum(len(mesh.polygons) for mesh in bpy.data.meshes),'addedLights':[],
       'updatedMaterials':[],'scope':'Existing imported scene geometry + actual Cycles light transport, no raster retouching'}
if stats['baseTriangles'] < 10_000_000:raise RuntimeError('Expected complete original sanctuary geometry; abort on truncated scene')
scene.render.engine='CYCLES'
scene.cycles.device='CPU'
scene.cycles.samples=int(os.environ.get('CYCLES_VARIANT_SAMPLES','24'))
if scene.cycles.samples<8 or scene.cycles.samples>512:raise ValueError('Invalid Cycles sample limit')
scene.cycles.use_denoising=False
for layer in scene.view_layers:
 if hasattr(layer,'cycles'):layer.cycles.use_denoising=False
scene.cycles.max_bounces=8
scene.cycles.diffuse_bounces=4
scene.cycles.glossy_bounces=6
scene.cycles.transmission_bounces=6
scene.cycles.volume_bounces=1
scene.cycles.sample_clamp_indirect=8
size=int(os.environ.get('CYCLES_VARIANT_SIZE','640'))
if size<320 or size>1600 or size%2:raise ValueError('Invalid render size')
scene.render.resolution_x=scene.render.resolution_y=size
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGB'
scene.render.image_settings.color_depth='8'
scene.render.threads_mode='FIXED'
scene.render.threads=4
scene.render.film_transparent=False
scene.view_settings.view_transform='AgX'
scene.view_settings.exposure=.9 if mode=='warm-key' else .75
scene.view_settings.gamma=1
world=scene.world
if not world or not world.use_nodes:raise RuntimeError('World background from source package is missing')
background=next((n for n in world.node_tree.nodes if n.type=='BACKGROUND'),None)
if not background:raise RuntimeError('Missing source world illumination')
background.inputs['Strength'].default_value=.45 if mode=='warm-key' else .37
background.inputs['Color'].default_value=(.52,.55,.60,1)
stats['world']=list(background.inputs['Color'].default_value)+[background.inputs['Strength'].default_value]
def move_area(name,position,target,energy,size_x,size_y,color):
 data=bpy.data.lights.get(name)
 if data is None:
  data=bpy.data.lights.new(name,'AREA');obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj)
 else:
  obj=next((x for x in bpy.data.objects if x.data==data),None)
  if obj is None:obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj)
 if data.type!='AREA':raise RuntimeError('Existing light name collision')
 data.shape='RECTANGLE';data.size=size_x;data.size_y=size_y;data.energy=energy;data.color=color
 obj.location=position;obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
 stats['addedLights'].append({'name':name,'position':position,'target':target,'energy':energy,'size':[size_x,size_y]})
 return obj
# The first emitter is deliberately positioned outside the LEFT window band.
# Light arrives as geometry-traced rays, with no image overlays or fake sunbeams.
move_area('source-reference6-left-window-large',(-9.4,10.4,-6.2),(-1.54,7.1,-11.4),
          1420 if mode=='warm-key' else 1750,6.0,3.0,(1,.82,.56))
move_area('source-reference6-soft-gilt-shape',(2.7,9.7,-7.5),(-1.54,7.5,-12.2),
          340 if mode=='warm-key' else 220,4.3,3.2,(1,.88,.73))
# Strengthen the existing physically located window bounce, if exported.
for obj in scene.objects:
 if obj.type=='LIGHT' and 'production-left-window-bounce' in obj.name:
  obj.data.energy=760 if mode=='warm-key' else 1050
  stats['addedLights'].append({'name':obj.name,'existingSource':True,'energy':obj.data.energy})
changed=0
for mat in bpy.data.materials:
 if not mat.use_nodes:continue
 low=mat.name.lower()
 if not any(term in low for term in ['floor-panel','polished','lacquer','broad-joined-cedar']):
  continue
 bs=next((node for node in mat.node_tree.nodes if node.type=='BSDF_PRINCIPLED'),None)
 if not bs:continue
 rough=bs.inputs.get('Roughness')
 coat=bs.inputs.get('Coat Weight') or bs.inputs.get('Clearcoat')
 coat_rough=bs.inputs.get('Coat Roughness') or bs.inputs.get('Clearcoat Roughness')
 if rough and not rough.is_linked:rough.default_value=.11 if mode=='warm-key' else .085
 if coat:coat.default_value=.79
 if coat_rough:coat_rough.default_value=.065
 stats['updatedMaterials'].append(mat.name);changed+=1
if changed==0:raise RuntimeError('Cannot locate actual source wood-floor/lacquer physical materials')
if mode=='window-beams':
 # Homogeneous physical scatter, inside the original room. This is a medium,
 # not an added wall, fixture, photograph or alpha overlay.
 bpy.ops.mesh.primitive_cube_add(size=2,location=(-1.54,9.2,-10.8))
 obj=bpy.context.object;obj.name='reference6-participating-air-volume-QA'
 obj.scale=(9.5,5.3,9.4);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mat=bpy.data.materials.new('reference6-clean-air-physical-scatter');mat.use_nodes=True
 n=mat.node_tree.nodes;n.clear();links=mat.node_tree.links
 out=n.new('ShaderNodeOutputMaterial');volume=n.new('ShaderNodeVolumePrincipled')
 volume.inputs['Color'].default_value=(1,.96,.85,1)
 volume.inputs['Density'].default_value=.006
 volume.inputs['Anisotropy'].default_value=.45
 links.new(volume.outputs['Volume'],out.inputs['Volume']);obj.data.materials.append(mat)
 stats['physicalMedium']={'name':obj.name,'density':.006,'anisotropy':.45,'boundsApprox':list(obj.dimensions)}
stats['status']='rendering';stats['changedMaterialCount']=changed
filename=f'sanctuary-cycles-{mode}.png'
scene.render.filepath=str(root/filename)
(root/f'report-{mode}.json').write_text(json.dumps(stats,indent=2))
bpy.ops.render.render(write_still=True)
png=Path(scene.render.filepath)
if not png.exists() or png.stat().st_size<30000:raise RuntimeError('Path traced PNG was not produced')
# Background and physical floor must be re-rendered; existing geometry remains intact.
stats['status']='path-traced-review'
stats['png']=filename
stats['pngBytes']=png.stat().st_size
stats['pngSha256']=hashlib.sha256(png.read_bytes()).hexdigest()
stats['postMeshes']=len(bpy.data.meshes)
stats['postTriangles']=sum(len(mesh.polygons) for mesh in bpy.data.meshes)
if mode=='warm-key' and stats['postTriangles']!=stats['baseTriangles']:raise RuntimeError('An architectural mesh changed')
if mode=='window-beams' and stats['postTriangles']-stats['baseTriangles']!=12:raise RuntimeError('Expected only 12 nonarchitectural volume triangles')
stats['finished']=time.time()
(root/f'report-{mode}.json').write_text(json.dumps(stats,indent=2))
print('PHYSICAL_RELIGHT_COMPLETE',json.dumps({k:stats[k] for k in ['mode','status','baseTriangles','postTriangles','pngSha256','pngBytes','changedMaterialCount']},indent=2),flush=True)
