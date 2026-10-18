"""Build a closed anatomical scaffold from ORIGINAL-reference landmarks.

This is an inferred modeling scaffold, not a recovered metric scan. The
generated clay image is not used as visible color or as the mesh's XY source.
"""
import bpy,bmesh,json,math,hashlib
import numpy as np
from pathlib import Path
from collections import Counter,defaultdict
from mathutils import Vector
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'lookdev/buddha-face-study'
data=json.loads((OUT/'reference-head-crop-landmarks.json').read_text())
topology=OUT/'vendor/canonical_face_model.obj'
faces=[]
for line in topology.read_text().splitlines():
    if line.startswith('f '):faces.append(tuple(int(v.split('/')[0])-1 for v in line.split()[1:]))
if max(max(f) for f in faces)>=468:raise RuntimeError('Unexpected canonical landmark ordering')
points=data['points'][:468];aspect=data['sourceSize'][1]/data['sourceSize'][0]
xmin=min(p[0] for p in points);xmax=max(p[0] for p in points)
cx=(xmin+xmax)/2;cy=(points[10][1]+points[152][1])/2
scale=.66/(xmax-xmin)
# Convert directly into Blender: X horizontal, -Y front, Z vertical. The
# original image supplies XY; its predicted depth is explicitly non-metric.
verts=[((p[0]-cx)*scale,-(.25-p[2]*scale*.65),(cy-p[1])*scale*aspect) for p in points]
landmark_plane=np.asarray([[p[0],p[2]] for p in verts],dtype=np.float64)
# Retain the original image's XY, while softening a human tracker depth prior
# that gave the first gold study very deep, severe eye sockets. This rounded
# cranial envelope is an explicit sculpting hypothesis, not measured depth.
verts=[(x,-(.30*(-y)+.70*(.02+.27*math.sqrt(max(.02,1-(x/.36)**2-(z/.51)**2)))),z) for x,y,z in verts]
edge_counts=Counter(tuple(sorted((f[k],f[(k+1)%len(f)]))) for f in faces for k in range(len(f)))
edges=[e for e,count in edge_counts.items() if count==1];adj=defaultdict(list)
for a,b in edges:adj[a].append(b);adj[b].append(a)
if any(len(v)!=2 for v in adj.values()):raise RuntimeError('Unexpected open canonical contour')
remaining=set(edges);loops=[]
while remaining:
    first=next(iter(remaining));start,current=first;loop=[start];remaining.remove(first)
    previous=start
    while current!=start:
        loop.append(current)
        choices=[p for p in adj[current] if tuple(sorted((current,p))) in remaining]
        if len(choices)!=1:raise RuntimeError('Canonical contour does not close')
        next_vertex=choices[0];remaining.remove(tuple(sorted((current,next_vertex))))
        previous,current=current,next_vertex
    loops.append(loop)
def area(loop):
    return abs(sum(verts[a][0]*verts[b][2]-verts[b][0]*verts[a][2] for a,b in zip(loop,loop[1:]+loop[:1])))/2
outer=max(loops,key=area);materials=[0]*len(faces)
# The eyes and inner mouth receive real recessed closing patches. They remain
# small anatomical cavities rather than floating black line geometry.
for loop in loops:
    if loop is outer:continue
    centre=sum((Vector(verts[i]) for i in loop),Vector())/len(loop);centre.y+=.006
    centre_id=len(verts);verts.append(tuple(centre))
    for a,b in zip(loop,loop[1:]+loop[:1]):faces.append((a,b,centre_id));materials.append(1)
# Close the remaining skull with an inferred rounded occiput. These unseen
# surfaces are hypotheses, not information present in the source photograph.
last=outer;n=len(outer)
for j in range(1,13):
    t=j/13;radius=math.cos(t*math.pi/2);depth=math.sin(t*math.pi/2);ring=[]
    for index in outer:
        p=Vector(verts[index]);q=(p.x*radius,p.y*(1-depth)+.24*depth,.025+(p.z-.025)*radius)
        ring.append(len(verts));verts.append(q)
    for k in range(n):faces.append((last[k],last[(k+1)%n],ring[(k+1)%n],ring[k]));materials.append(0)
    last=ring
pole=len(verts);verts.append((0,.24,.025))
for a,b in zip(last,last[1:]+last[:1]):faces.append((a,b,pole));materials.append(0)
bpy.ops.wm.read_factory_settings(use_empty=True)
mesh=bpy.data.meshes.new('reference-landmark-closed-face');mesh.from_pydata(verts,[],faces);mesh.update()
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
head=bpy.data.objects.new('Original-reference-face-scaffold',mesh);bpy.context.scene.collection.objects.link(head)
def color(code):
    a=[int(code[k:k+2],16)/255 for k in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in a)+(1,)
def material(name,code,metal,rough):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=color(code);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    return m
gold=material('physically lit sculptural gilt','cba750',.94,.34)
recess=material('recessed bronze in eye and lip apertures','3d2d16',.80,.46)
mesh.materials.append(gold);mesh.materials.append(recess)
for i,p in enumerate(mesh.polygons):p.material_index=materials[i];p.use_smooth=True
bpy.context.view_layer.objects.active=head;head.select_set(True)
subdivision=head.modifiers.new('Smooth anatomical surface','SUBSURF');subdivision.subdivision_type='CATMULL_CLARK';subdivision.levels=2
bpy.ops.object.modifier_apply(modifier=subdivision.name)
coordinates=np.asarray([v.co[:] for v in head.data.vertices],dtype=np.float64)
plane=coordinates[:,[0,2]]
def distances(curve):
    result=np.full(len(coordinates),np.inf)
    for a,b in zip(curve[:-1],curve[1:]):
        vector=b-a;length2=float(vector@vector)
        if length2<1e-16:continue
        t=np.clip(((plane-a)@vector)/length2,0,1)
        result=np.minimum(result,np.linalg.norm(plane-a-t[:,None]*vector,axis=1))
    return result
def path(indices):return landmark_plane[indices]
def gaussian(d,width):return np.exp(-(d/width)**2)
offset=np.zeros(len(coordinates));crease=np.full(len(coordinates),np.inf)
for brow in [[70,63,105,66,107],[300,293,334,296,336]]:
    line=path(brow);d=distances(line);offset+=.012*gaussian(d,.015)
    below=line.copy();below[:,1]-=.014;offset-=.0045*gaussian(distances(below),.007)
for upper,lower in [([33,246,161,160,159,158,157,173,133],[33,7,163,144,145,153,154,155,133]),([263,466,388,387,386,385,384,398,362],[263,249,390,373,374,380,381,382,362])]:
    up=path(upper);lo=path(lower);middle=(up+lo)/2
    centre=middle.mean(axis=0);delta=plane-centre
    offset+=.013*np.exp(-(delta[:,0]/.090)**2-((delta[:,1]-.012)/.046)**2)
    d=distances(middle);offset-=.010*gaussian(d,.0045);offset+=.004*gaussian(distances(up),.009)
    crease=np.minimum(crease,d)
upper=path([61,40,37,0,267,270,291]);lower=path([61,146,91,181,84,17,314,405,321,375,291])
offset+=.007*gaussian(distances(upper),.012)+.010*gaussian(distances(lower),.014)
lip_line=path([61,78,13,308,291]);offset-=.004*gaussian(distances(lip_line),.0035)
# A short, broad bridge and rounded wings maintain the source's Buddha nose
# instead of a long, pointed generic face-tracker nose.
tip=landmark_plane[1];bridge=landmark_plane[168]
nose_line=np.asarray([tip,tip*.55+bridge*.45,bridge]);d=distances(nose_line)
offset+=.022*gaussian(d,.045)
front=np.clip((.06-coordinates[:,1])/.16,0,1);front=front*front*(3-2*front)
coordinates[:,1]-=offset*front
head.data.vertices.foreach_set('co',coordinates.astype(np.float32).ravel())
for polygon in head.data.polygons:
    ids=list(polygon.vertices)
    if front[ids].mean()>.9 and crease[ids].mean()<.0029:polygon.material_index=1
head.data.update()
bm=bmesh.new();bm.from_mesh(head.data)
invalid=sum(not e.is_manifold for e in bm.edges)
if invalid:raise RuntimeError('Head scaffold has nonmanifold edges '+str(invalid))
bm.free()
# Export only the actual closed head, in ordinary glTF Y-up coordinates.
bpy.ops.export_scene.gltf(filepath=str(OUT/'closed-face-scaffold.glb'),export_format='GLB',use_selection=True,export_yup=True,export_normals=True)
report={'status':'closed-head-study-built','input':'Original reference crop landmarks, not generated-guide XY',
 'referenceLandmarkSha256':hashlib.sha256((OUT/'reference-head-crop-landmarks.json').read_bytes()).hexdigest(),
 'canonicalTopologySha256':hashlib.sha256(topology.read_bytes()).hexdigest(),
 'faceWidthModelUnits':.66,'inferredDepthScale':.65,'metricDepthRecovered':False,'nonManifoldEdges':invalid,
 'depthMethod':'30 percent learned prior, 70 percent explicitly hypothetical rounded cranial envelope; continuous sculpted brow, eyelid and lip fields',
 'builderSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
 'vertices':len(head.data.vertices),'triangles':sum(len(p.vertices)-2 for p in head.data.polygons),
 'originalBoundaryLoops':len(loops),'visualAccepted':False,'selectedForScene':False,
 'limits':['Learned depth prior, hypothetical rear skull and arbitrary model units.','Ears, hair, ushnisha and forehead fittings are outside this skin scaffold.','No generated or reference photograph is used as rendered head albedo.']}
scene=bpy.context.scene
floor_mat=material('matte inspection floor','24231f',0,.86)
bpy.ops.mesh.primitive_plane_add(size=100,location=(0,0,-.54));bpy.context.object.data.materials.append(floor_mat)
world=bpy.data.worlds.new('sculpture inspection field');world.use_nodes=True;scene.world=world
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.35,.40,.50,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.22
def area_light(name,location,energy,size,rgb):
    l=bpy.data.lights.new(name,'AREA');l.energy=energy;l.shape='DISK';l.size=size;l.color=rgb
    o=bpy.data.objects.new(name,l);scene.collection.objects.link(o);o.location=location
    o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
area_light('broad warm left key',(-1.5,-2,2),90,1.8,(1,.87,.69))
area_light('soft right fill',(1.5,-1.5,.4),35,1.5,(.72,.83,1))
area_light('thin rear rim',(0,1,1),65,1.0,(1,.75,.45))
c=bpy.data.cameras.new('below-face study camera');camera=bpy.data.objects.new('below-face study camera',c);scene.collection.objects.link(camera);scene.camera=camera;c.lens=64
scene.render.engine='CYCLES';scene.cycles.samples=96;scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.device='GPU'
preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
for d in preferences.devices:d.use=d.type=='METAL'
if not any(d.use for d in preferences.devices):raise RuntimeError('Metal GPU unavailable')
scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.resolution_x=960;scene.render.resolution_y=960;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.exposure=.15
for name,angle in [('front',0),('three-quarter',math.radians(28))]:
    camera.location=(2.15*math.sin(angle),-2.15*math.cos(angle),-.20)
    camera.rotation_euler=(Vector((0,0,-.01))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/('actual-head-scaffold-'+name+'.png'))
    bpy.ops.render.render(write_still=True)
    if name=='front':bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'editable-closed-face-scaffold.blend'),compress=True)
report['status']='actual-closed-face-study-rendered'
(OUT/'scaffold-report.json').write_text(json.dumps(report,indent=2))
print('FACE_SCAFFOLD_REVIEW',json.dumps(report),flush=True)
