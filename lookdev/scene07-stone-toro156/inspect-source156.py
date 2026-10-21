"""Actual licensed photogrammetry cleanup/inspection; no reference RGB transfer."""
import bpy,bmesh,math,json,hashlib,time,os,numpy as np
from pathlib import Path
from mathutils import Matrix,Vector
HERE=Path(__file__).resolve().parent;PROJECT=HERE.parents[1];OUT=HERE/'scan-inspection';OUT.mkdir(exist_ok=True);SOURCE=HERE/'sources/ccby-3dlunatic-toro/source-objaverse.glb'
bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene
bpy.ops.import_scene.gltf(filepath=str(SOURCE));objects=[o for o in scene.objects if o.type=='MESH'];source_triangles=sum(len(o.data.polygons) for o in objects)
# GLTF import converts source Y-up into Blender Z-up. Bake only the original
# hierarchy matrices; this scan is already genuinely vertical.
for o in objects:
    m=o.matrix_world.copy();o.parent=None;o.matrix_world=Matrix.Identity(4);o.data.transform(m)
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();stone=bpy.context.object;stone.name='Licensed scan: cleaned torso and curved roof'
source_bounds=[[min(v.co[k] for v in stone.data.vertices) for k in range(3)],[max(v.co[k] for v in stone.data.vertices) for k in range(3)]]
# Remove the incidental captured ground and lower rubble; retain all original
# lantern surface above this real3D plane. A newly authored plinth seats it.
cut=4.63;base_top=.37;scale=(4.05-base_top)/(source_bounds[1][2]-cut)
bm=bmesh.new();bm.from_mesh(stone.data);result=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-6,plane_co=(0,0,cut),plane_no=(0,0,1),clear_inner=True,clear_outer=False)
cut_edges=[e for e in bm.edges if e.is_boundary and all(abs(v.co.z-cut)<1e-4 for v in e.verts)]
if cut_edges:bmesh.ops.holes_fill(bm,edges=cut_edges,sides=0)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-5);bm.to_mesh(stone.data);bm.free()
for v in stone.data.vertices:v.co=Vector(((v.co.x+3.65)*scale,(v.co.y+3.68)*scale,(v.co.z-cut)*scale+base_top))
stone.data.update();
for p in stone.data.polygons:p.use_smooth=True
# A small actual eroded octagonal/square plinth closes the cut; the upper
# geometry is the acquired stone scan, not a procedural stand-in.
def plinth():
    profile=[(0,0),(.65,0),(.72,.035),(.72,.10),(.67,.19),(.56,.22),(.55,.32),(.51,.37),(0,.37)];N=96;verts=[];faces=[]
    for r,z in profile:
        for i in range(N):
            a=i*2*math.pi/N;c,s=math.cos(a),math.sin(a);q=(abs(c)**10+abs(s)**10)**.1;noise=.008*math.sin(i*2.13+z*47)+.006*math.cos(i*.71+z*23)
            verts.append(((r+noise)*c/q,(r+noise)*s/q,z+.004*math.sin(i*.83+z*17)))
    for j in range(len(profile)-1):
        for i in range(N):a=j*N+i;b=j*N+(i+1)%N;faces.append((a,b,b+N,a+N))
    mesh=bpy.data.meshes.new('Authored eroded broad plinth');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Authored broad stone footing',mesh);scene.collection.objects.link(o)
    for p in mesh.polygons:p.use_smooth=True
    return o
foot=plinth()
# Original CC0 granite maps are referenced in place, never copied or recolored.
MAPDIR=PROJECT/'reconstructions/scene-07/assets/island-lantern-granite';mat=bpy.data.materials.new('Metric weathered granite: original CC0 map pixels');mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();l=mat.node_tree.links;bs=n.new('ShaderNodeBsdfPrincipled');out=n.new('ShaderNodeOutputMaterial');l.new(bs.outputs['BSDF'],out.inputs['Surface']);bs.inputs['Roughness'].default_value=.9
coord=n.new('ShaderNodeTexCoord');mapping=n.new('ShaderNodeVectorMath');mapping.operation='SCALE';mapping.inputs['Scale'].default_value=1/.3173828125;l.new(coord.outputs['Object'],mapping.inputs[0]);nodes={}
for channel,name in [('albedo','diff'),('normal','nor_gl'),('roughness','rough')]:
    im=bpy.data.images.load(str(MAPDIR/f'granite-face-{name}.png'),check_existing=True);im.colorspace_settings.name='sRGB' if channel=='albedo' else 'Non-Color';tn=n.new('ShaderNodeTexImage');tn.image=im;tn.projection='BOX';tn.projection_blend=.18;tn.extension='REPEAT';l.new(mapping.outputs['Vector'],tn.inputs['Vector']);nodes[channel]=tn
bw=n.new('ShaderNodeRGBToBW');l.new(nodes['albedo'].outputs['Color'],bw.inputs['Color']);divide=n.new('ShaderNodeMath');divide.operation='DIVIDE';divide.inputs[1].default_value=.153180782734;l.new(bw.outputs[0],divide.inputs[0]);power=n.new('ShaderNodeMath');power.operation='POWER';power.inputs[1].default_value=.55;l.new(divide.outputs[0],power.inputs[0]);clamp=n.new('ShaderNodeClamp');clamp.inputs['Min'].default_value=.68;clamp.inputs['Max'].default_value=1.36;l.new(power.outputs[0],clamp.inputs['Value']);mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;mul.inputs[2].default_value=(.29,.30,.27,1);l.new(clamp.outputs[0],mul.inputs[1]);l.new(mul.outputs[0],bs.inputs['Base Color']);bump=n.new('ShaderNodeBump');bump.inputs['Distance'].default_value=.0025;bump.inputs['Strength'].default_value=.35;l.new(nodes['roughness'].outputs['Color'],bump.inputs['Height']);l.new(bump.outputs['Normal'],bs.inputs['Normal'])
for o in [stone,foot]:o.data.materials.clear();o.data.materials.append(mat)
world=bpy.data.worlds.new('Neutral outdoor studio');world.use_nodes=True;world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.65,.72,.85,1);world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.45;scene.world=world
for name,loc,energy,size,color in [('Warm window key',(-4,-5,7),900,5,(1,.82,.62)),('Cool sky bounce',(3,4,6),650,5,(.65,.78,1))]:
    d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,2))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.02));floor=bpy.context.object;floor.name='Neutral standalone ground';fm=bpy.data.materials.new('Neutral ground');fm.diffuse_color=(.20,.22,.20,1);floor.data.materials.append(fm)
cam_data=bpy.data.cameras.new('Actual perspective inspection');cam=bpy.data.objects.new(cam_data.name,cam_data);scene.collection.objects.link(cam);cam.location=(5,-7,4.2);cam.rotation_euler=(Vector((0,0,2.05))-cam.location).to_track_quat('-Z','Y').to_euler();cam_data.lens=65;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
assert any(d.use for d in prefs.devices);scene.cycles.device='GPU';scene.cycles.max_bounces=8;scene.render.resolution_x=scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'actual-scan-cleanup-three-quarter.png')
report={'status':'rendering-actual-acquired-scan','license':'CC-BY-4.0','originalSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'sourceTriangles':source_triangles,'sourceBoundsBlenderZUp':source_bounds,'cropSourceZ':cut,'normalizingScale':scale,'authoredBaseHeight':base_top,'remainingScanVertices':len(stone.data.vertices),'remainingScanFaces':len(stone.data.polygons),'referencePixelsUsed':False,'visualAccepted':False,'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()};(OUT/'report.json').write_text(json.dumps(report,indent=2));bpy.ops.render.render(write_still=True);report['status']='actual-scan-cleanup-review';report['renderSha256']=hashlib.sha256((OUT/'actual-scan-cleanup-three-quarter.png').read_bytes()).hexdigest();(OUT/'report.json').write_text(json.dumps(report,indent=2));print('SCAN156_REVIEW',json.dumps(report),flush=True)
