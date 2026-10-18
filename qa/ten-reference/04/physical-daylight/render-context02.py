"""Second bounded physical daylight frame; unchanged source camera/visible meshes.
Inferred off-camera maple context is real geometry, not a shadow texture.
"""
import bpy,json,math,random,time,os
import numpy as np
from pathlib import Path
from mathutils import Vector,Matrix,Euler
BASE=Path(__file__).resolve().parent
OUT=BASE/'iteration-02';OUT.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(BASE/'iteration-01/editable-scene04-daylight.blend'))
scene=bpy.context.scene;camera=scene.camera
before={o.name:[list(row) for row in o.matrix_world] for o in scene.objects}
for mat in bpy.data.materials:
 if not mat.use_nodes:continue
 bs=next((n for n in mat.node_tree.nodes if n.bl_idname=='ShaderNodeBsdfPrincipled'),None)
 if not bs:continue
 if mat.name=='kiln-fired-ceramic':
  bs.inputs['Roughness'].default_value=.34;bs.inputs['Coat Weight'].default_value=.24;bs.inputs['Coat Roughness'].default_value=.19
 if mat.name.startswith('metre-scaled-worn-wet-paver-'):
  bs.inputs['Coat Roughness'].default_value=.20
  for n in mat.node_tree.nodes:
   if n.bl_idname=='ShaderNodeMapRange' and abs(n.inputs['To Max'].default_value-.22)<1e-6:n.inputs['To Max'].default_value=.38
manifest=json.loads((BASE/'source-export/scene.json').read_text())
record=next(m for m in manifest['meshes'] if 'individual-maple-leaf-instances' in m['name'])
g=next(g for g in manifest['geometries'] if g['id']==record['geometry'])
def buf(r):return np.fromfile(BASE/'source-export/assets'/r['file'],dtype={'Float32Array':'<f4','Uint32Array':'<u4','Uint16Array':'<u2'}[r['type']])
positions=buf(g['attributes']['position']).reshape(-1,3);indices=buf(g['index']).reshape(-1,3);uv=buf(g['attributes']['uv']).reshape(-1,2)
rng=random.Random(441102);C=Matrix.Rotation(math.pi/2,3,'X');vertices=[];faces=[];colours=[];leaf_count=0
source_root=Vector((10.5,-.1,31.0));fork=Vector((8.8,5.8,29.2));leafmat=bpy.data.materials.get('reference4-maple-olive');barkmat=bpy.data.materials.get('reference4-living-grey-brown-bark');context=[]
def world(p):return C@Vector(p)
def branch(a,b,radius,name):
 a,b=world(a),world(b);d=b-a;bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=radius,depth=d.length,location=(a+b)/2);o=bpy.context.object;o.name=name;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.data.materials.append(barkmat);context.append(o)
branch(source_root,fork,.10,'inferred-off-camera-maple-trunk')
for j in range(14):
 a=j*2.399963;end=Vector((6.65+2.05*math.cos(a),7.05+.55*math.sin(a*1.7),27.35+1.7*math.sin(a)))
 branch(fork,end,.018+.010*(j%3),'inferred-off-camera-maple-bough-'+str(j))
 for k in range(48):
  t=rng.uniform(.30,1.12);p=fork.lerp(end,t)+Vector((rng.uniform(-.44,.44),rng.uniform(-.27,.27),rng.uniform(-.40,.40)))
  R=Euler((rng.uniform(-.60,.60),rng.uniform(0,math.tau),rng.uniform(-.48,.48)),'XYZ').to_matrix();size=rng.uniform(.105,.175);start=len(vertices)
  for v in positions:
   vertices.append(tuple(world(p+(R@Vector(v))*size)));q=rng.uniform(.78,1.03);colours.extend((q*.97,q,q*.89,1))
  faces.extend(tuple(start+int(i) for i in f) for f in indices);leaf_count+=1
mesh=bpy.data.meshes.new('actual-maple-leaf-context');mesh.from_pydata(vertices,[],faces);mesh.update();layer=mesh.uv_layers.new(name='sourceUV')
for poly in mesh.polygons:
 poly.use_smooth=True
 for loop in poly.loop_indices:layer.data[loop].uv=uv[mesh.loops[loop].vertex_index%len(positions)]
attr=mesh.color_attributes.new(name='sourceColor',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',colours)
obj=bpy.data.objects.new('inferred-off-camera-maple-leaf-crown',mesh);scene.collection.objects.link(obj);mesh.materials.append(leafmat);context.append(obj)
# The entire added canopy is behind the unchanged physical camera. It affects
# illumination and shadows, but contributes no new in-frame visible object.
bpy.context.view_layer.update();inv=camera.matrix_world.inverted();closest=math.inf
for o in context:
 for p in o.bound_box:
  z=(inv@(o.matrix_world@Vector(p))).z;closest=min(closest,z)
  if z<=.01:raise RuntimeError('Inferred context entered the source camera forward half-space: '+o.name)
for name,matrix in before.items():
 if any(abs(float(bpy.data.objects[name].matrix_world[i][j])-matrix[i][j])>1e-7 for i in range(4) for j in range(4)):raise RuntimeError('Existing source transform changed: '+name)
scene.view_settings.exposure=.5;scene.cycles.samples=128;scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.seed=73061
scene.render.resolution_x=scene.render.resolution_y=1254;scene.render.resolution_percentage=100;scene.render.filepath=str(OUT/'actual-scene04-daylight.png')
report=json.loads((BASE/'iteration-01/report.json').read_text());report.update({'status':'rendering','iteration':2,'started':time.time(),'context':{'inferredNotRecovered':True,'type':'Real off-camera maple crown and branch geometry','leaves':leaf_count,'objects':len(context),'cameraForwardHalfSpaceClearanceMetres':closest,'cameraVisibility':'All added context bounding vertices are behind the physical camera, not hidden by visibility flags.','sourceMeshTransformsUnchanged':True,'sourceVisibleGeometryUnchanged':True,'sourceSunDirectionYUp':[.8,.85,1.1]},'physicalMaterialChanges':{'tileRoughness':.34,'tileCoat':.24,'tileCoatRoughness':.19,'pavingMoistCoatMaximum':.38,'pavingMoistCoatRoughness':.20},'cameraExposureEV':.5,'photographicAcceptance':False})
(OUT/'report.json').write_text(json.dumps(report,indent=2));bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'editable-scene04-daylight.blend'),compress=True)
bpy.ops.render.render(write_still=True);report.update({'status':'path-traced-review','finished':time.time(),'samples':128,'resolution':[1254,1254]});(OUT/'report.json').write_text(json.dumps(report,indent=2));print('SCENE04_CONTEXT_RENDER_COMPLETE',json.dumps(report),flush=True)
