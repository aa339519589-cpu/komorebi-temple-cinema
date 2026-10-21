"""R09 coherent center statue, with source-preserving neck retopology.

Run with tools/run-blender-queued.mjs. Exactly two still renders. No films.
The jaw/ear/face surface is actual licensed scan geometry under a rigid pose;
new rings bridge its open neck to a new welded body. No planar bust cap remains.
"""
import bpy,bmesh,math,json,hashlib,sys,struct,array,bisect
from pathlib import Path
from mathutils import Vector,Matrix
from math import sin,cos,pi,sqrt

OUT=Path(__file__).resolve().parent
sys.path.insert(0,str(OUT))
import statue_r09_geometry as G
DEST=OUT/'r09-draped-sculpture';DEST.mkdir(exist_ok=True)
SOURCE=OUT/'sources/ccby-beachmouse-japanese-head/source-objaverse.glb'
SEAT=.245
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
model=bpy.data.collections.new('R09_actual_statue_geometry');scene.collection.children.link(model)
G.COLLECTION=model

def rgb(s):
    a=[int(s[k:k+2],16)/255 for k in(0,2,4)]
    return tuple(v/12.92 if v<=.04045 else((v+.055)/1.055)**2.4 for v in a)+(1,)
def mat(name,color,metallic,roughness):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=rgb(color);p.inputs['Metallic'].default_value=metallic;p.inputs['Roughness'].default_value=roughness
    m['reconstructionMaterial']=name;return m
cloth=mat('cloth','c5a04c',.92,.40)
face=mat('face','cfa952',.94,.34)
hand=mat('hand','cba650',.94,.35)
hair=mat('hair','211c15',.23,.49)
gold=mat('gold','d5b15c',.94,.38)
oldgold=mat('oldgold','b18c3e',.93,.41)
burnish=mat('burnished_detail','d8b868',.95,.31)
G.GOLD=cloth

def activate(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]

# Full body is rebuilt from bent limb paths and variable carved surfaces.
G.make_torso();G.make_hems();G.make_arms();G.make_hands();G.make_legs();G.make_apron()
body_parts=[o for o in G.OBJECTS if o.get('component')=='body']
for ob in body_parts:G.recalc(ob)
activate(body_parts);bpy.ops.object.join();body=bpy.context.object;body.name='R09_welded_cloth_anatomy_before_neck_bridge'
rem=body.modifiers.new('Continuous sculptural body hands robe union','REMESH');rem.mode='VOXEL';rem.voxel_size=.0055;rem.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=rem.name)
sm=body.modifiers.new('Restrained weld smoothing','SMOOTH');sm.factor=.22;sm.iterations=2;bpy.ops.object.modifier_apply(modifier=sm.name)
# Voxel union can retain tiny isolated closed dust cubes. Remove only these
# numerical components, leaving every anatomical/cloth component intact.
bm=bmesh.new();bm.from_mesh(body.data);unseen=set(bm.verts);small=[];island_sizes=[]
while unseen:
    seed=unseen.pop();stack=[seed];component=[seed]
    while stack:
        v=stack.pop()
        for e in v.link_edges:
            q=e.other_vert(v)
            if q in unseen:unseen.remove(q);stack.append(q);component.append(q)
    island_sizes.append(len(component))
    if len(component)<64:small.extend(component)
if small:bmesh.ops.delete(bm,geom=small,context='VERTS')
bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(body.data);bm.free();body.data.update()
voxel_cleanup={'componentsBefore':len(island_sizes),'removedDustComponentVertexCounts':[n for n in island_sizes if n<64],'removedVertices':len(small),'thresholdVertices':64}
BODY_CUT=2.315
bm=bmesh.new();bm.from_mesh(body.data)
bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-7,plane_co=Vector((0,0,BODY_CUT)),plane_no=Vector((0,0,1)),clear_inner=False,clear_outer=False)
# Restrict the removal to the actual neck. A global upper half-space would
# also cut a middle fingertip of the paired raised gesture at this height.
neck_above=[v for v in bm.verts if v.co.z>BODY_CUT+1e-7 and abs(v.co.x)<.40 and v.co.y>-.24]
bmesh.ops.delete(bm,geom=neck_above,context='VERTS')
bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(body.data);bm.free();body.data.update()

# The preserved scan has a single actual neck perimeter at normalized z=.50.
# Do not cap it: a cap is what produced the rejected flat flange in R05/R06.
before=set(scene.objects);bpy.ops.import_scene.gltf(filepath=str(SOURCE));added=[o for o in scene.objects if o not in before];sources=[o for o in added if o.type=='MESH']
activate(sources)
if len(sources)>1:bpy.ops.object.join()
scan=bpy.context.object;scan.name='R09_source_head_open_neck_and_scalp'
world=scan.matrix_world.copy();scan.parent=None;scan.matrix_parent_inverse=Matrix.Identity(4);scan.matrix_world=Matrix.Identity(4);scan.data.transform(world)
for o in added:
    if o!=scan and o.name in bpy.data.objects:bpy.data.objects.remove(o,do_unlink=True)
ps=[v.co.copy()for v in scan.data.vertices]
mn=Vector([min(v[k]for v in ps)for k in range(3)]);mx=Vector([max(v[k]for v in ps)for k in range(3)])
normalization=1.8/(mx.z-mn.z);center=(mn+mx)/2
scan.data.transform(Matrix.Scale(normalization,4)@Matrix.Translation((-center.x,-center.y,-mn.z)))
bm=bmesh.new();bm.from_mesh(scan.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
norm_cut=.50
bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-7,plane_co=Vector((0,0,norm_cut)),plane_no=Vector((0,0,1)),clear_inner=True,clear_outer=False)
bm.to_mesh(scan.data);bm.free();scan.data.update()
upper=[v.co.copy()for v in scan.data.vertices if v.co.z>1.02]
cx=(min(p.x for p in upper)+max(p.x for p in upper))/2;cy=(min(p.y for p in upper)+max(p.y for p in upper))/2
retarget=.82;source_apex=3.58;translation=source_apex-1.8*retarget
NECK_CUT=translation+norm_cut*retarget
SCALP_CUT=3.23
for v in scan.data.vertices:
    p=v.co.copy();v.co=(retarget*(p.x-cx),retarget*(p.y-cy)+.035,retarget*p.z+translation)
bm=bmesh.new();bm.from_mesh(scan.data)
bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-7,plane_co=Vector((0,0,SCALP_CUT)),plane_no=Vector((0,0,1)),clear_inner=False,clear_outer=True)
bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(scan.data);bm.free();scan.data.update()
scan.data.materials.clear();scan.data.materials.append(face)
for f in scan.data.polygons:f.material_index=0;f.use_smooth=True

# Preserve the actual cropped input cage separately for review/reproduction.
archive=bpy.data.collections.new('SOURCE_CAGE_preserved_CC_BY_not_exported');scene.collection.children.link(archive)
cage=scan.copy();cage.data=scan.data.copy();cage.name='SOURCE_beachmouse_rigid_cropped_cage_no_facial_warp';archive.objects.link(cage);cage.hide_render=True;cage.hide_viewport=True
cage['source']='https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab';cage['license']='CC-BY-4.0';cage['sourceCageFacialGeometryReshaped']=False
activate([scan]);sub=scan.modifiers.new('Smooth actual source surface, cage retained','SUBSURF');sub.subdivision_type='CATMULL_CLARK';sub.levels=2;sub.render_levels=2;sub.boundary_smooth='PRESERVE_CORNERS'
bpy.ops.object.modifier_apply(modifier=sub.name)

def perimeter_loops(ob,z,tolerance=1e-4):
    bm=bmesh.new();bm.from_mesh(ob.data);bm.verts.ensure_lookup_table();bm.edges.ensure_lookup_table()
    edges=[e for e in bm.edges if e.is_boundary and all(abs(v.co.z-z)<tolerance for v in e.verts)]
    adj={}
    for e in edges:
        a,b=[v.index for v in e.verts];adj.setdefault(a,[]).append(b);adj.setdefault(b,[]).append(a)
    bad={k:len(v)for k,v in adj.items()if len(v)!=2}
    if bad:raise RuntimeError('Open neck/scalp perimeter is not a simple loop: '+str(list(bad.items())[:8]))
    unseen=set(adj);loops=[]
    while unseen:
        start=min(unseen);current=start;prev=None;ids=[]
        while True:
            ids.append(current);unseen.discard(current);a,b=adj[current];nxt=a if a!=prev else b;prev,current=current,nxt
            if current==start:break
            if len(ids)>len(adj)+2:raise RuntimeError('Perimeter traversal did not close')
        coords=[ob.data.vertices[i].co.copy()for i in ids]
        area=sum(a.x*b.y-b.x*a.y for a,b in zip(coords,coords[1:]+coords[:1]))/2
        if area<0:ids.reverse();coords.reverse()
        first=min(range(len(ids)),key=lambda i:(coords[i].y,abs(coords[i].x)))
        ids=ids[first:]+ids[:first];coords=coords[first:]+coords[:first]
        distance=[0.0]
        for a,b in zip(coords,coords[1:]+coords[:1]):distance.append(distance[-1]+(b-a).length)
        params=[v/distance[-1]for v in distance]
        loops.append({'ids':ids,'coords':coords,'params':params,'length':distance[-1],'area':abs(area)})
    bm.free()
    if not loops:raise RuntimeError('No geometric boundary at '+str(z)+' on '+ob.name)
    return sorted(loops,key=lambda q:q['length'],reverse=True)

head_necks=perimeter_loops(scan,NECK_CUT);head_tops=perimeter_loops(scan,SCALP_CUT);body_tops=perimeter_loops(body,BODY_CUT)
(DEST/'boundary-loops.json').write_text(json.dumps({key:[{'vertices':len(q['ids']),'length':q['length'],'area':q['area']}for q in value]for key,value in [('sourceNeck',head_necks),('sourceScalp',head_tops),('bodyNeck',body_tops)]},indent=2))
if len(head_necks)!=1 or len(head_tops)!=1 or len(body_tops)!=1:raise RuntimeError('Unexpected extra source/body boundary loop; preserving input for inspection.')
hn=head_necks[0];ht=head_tops[0];bt=body_tops[0]

def sample(loop,u):
    u=u%1;i=min(len(loop['coords'])-1,max(0,bisect.bisect_right(loop['params'],u)-1));a=loop['coords'][i];b=loop['coords'][(i+1)%len(loop['coords'])];t=(u-loop['params'][i])/max(1e-12,loop['params'][i+1]-loop['params'][i]);return a.lerp(b,t)

vertices=[tuple(v.co)for v in body.data.vertices];faces=[tuple(p.vertices)for p in body.data.polygons];face_mats=[]

def in_hand(p):
    for s in(-1,1):
        wrist=Vector((-.535,-.465,1.775))if s<0 else Vector((.590,-.440,1.705))
        tilt=math.radians(-7 if s<0 else 3);yaw=math.radians(8 if s<0 else -10);q=p-wrist
        x=q.x*cos(yaw)+q.y*sin(yaw);y=-q.x*sin(yaw)+q.y*cos(yaw);z=q.z
        x,z=x*cos(tilt)-z*sin(tilt),x*sin(tilt)+z*cos(tilt)
        if -.012<z<.63 and abs(x)<.205 and abs(y)<.16:return True
    return .72<p.z<.93 and abs(p.x)<.37 and p.y<-.43
for p in body.data.polygons:
    c=sum((body.data.vertices[i].co for i in p.vertices),Vector())/len(p.vertices)
    face_mats.append(2 if in_hand(c)else 0)
head_offset=len(vertices);source_render_positions=[v.co.copy()for v in scan.data.vertices]
vertices.extend(tuple(v.co)for v in scan.data.vertices)
faces.extend(tuple(head_offset+i for i in p.vertices)for p in scan.data.polygons);face_mats.extend([1]*len(scan.data.polygons))

def append_ring(coords):
    ids=list(range(len(vertices),len(vertices)+len(coords)));vertices.extend(tuple(v)for v in coords);return ids
def zipper(upper_ids,upper_params,lower_ids,lower_params,material):
    i=j=0;na=len(upper_ids);nb=len(lower_ids)
    while i<na or j<nb:
        a=upper_ids[i%na];b=lower_ids[j%nb];ta=upper_params[i+1]if i<na else math.inf;tb=lower_params[j+1]if j<nb else math.inf
        if abs(ta-tb)<1e-8:
            faces.append((a,b,lower_ids[(j+1)%nb],upper_ids[(i+1)%na]));i+=1;j+=1
        elif ta<tb:faces.append((a,b,upper_ids[(i+1)%na]));i+=1
        else:faces.append((a,b,lower_ids[(j+1)%nb]));j+=1
        face_mats.append(material)

# The neck is a welded topological bridge. Both source and garment boundary
# vertices are retained, with an unequal-count zipper at each end and regular
# quads through the visible throat. Jaw/lobe vertices are never pushed around.
N=256;M=35;uniform=[k/N for k in range(N+1)];neck_rows=[]
for j in range(1,M+1):
    t=j/(M+1);blend=G.smooth(t);z=G.mix(NECK_CUT,BODY_CUT,t);ring=[]
    ca=sum((p for p in hn['coords']),Vector())/len(hn['coords']);cb=sum((p for p in bt['coords']),Vector())/len(bt['coords']);cc=ca.lerp(cb,blend)
    for k in range(N):
        a=sample(hn,k/N);b=sample(bt,k/N);p=a.lerp(b,blend);p.z=z
        radial=Vector((p.x-cc.x,p.y-cc.y,0));radial.normalize()
        crease=sum(.0062*G.gauss(z-r,.0060)for r in(2.360,2.414,2.469))
        p-=radial*crease*(.48+.52*max(0,-radial.y))
        ring.append(p)
    neck_rows.append(append_ring(ring))
zipper([head_offset+i for i in hn['ids']],hn['params'],neck_rows[0],uniform,1)
for a,b in zip(neck_rows,neck_rows[1:]):zipper(a,uniform,b,uniform,1)
zipper(neck_rows[-1],uniform,bt['ids'],bt['params'],1)

# Hair cap shares the exact open scalp perimeter of the scan, instead of
# hovering as a generic ellipsoid or leaving a gold fringe below a mismatched cap.
hair_center=sum((p for p in ht['coords']),Vector())/len(ht['coords']);hair_center.z=SCALP_CUT
HAIR_TOP=3.505
def cap_position(u,t):
    p=sample(ht,u);r=G.profile([(0,1),(.10,.985),(.40,.835),(.72,.55),(.88,.32),(.97,.11),(1,0)],t)
    return Vector((hair_center.x+(p.x-hair_center.x)*r,hair_center.y+(p.y-hair_center.y)*r,G.mix(SCALP_CUT,HAIR_TOP,t)))
cap_rows=[]
for j in range(1,42):cap_rows.append(append_ring([cap_position(k/N,j/42)for k in range(N)]))
# For an upward cap, reverse the bridge order before the global normal pass.
zipper(cap_rows[0],uniform,[head_offset+i for i in ht['ids']],ht['params'],3)
for lower,upper in zip(cap_rows,cap_rows[1:]):zipper(upper,uniform,lower,uniform,3)
tip=len(vertices);vertices.append((hair_center.x,hair_center.y,HAIR_TOP))
for k in range(N):faces.append((cap_rows[-1][k],cap_rows[-1][(k+1)%N],tip));face_mats.append(3)

skin_mesh=bpy.data.meshes.new('R09_welded_head_neck_robe_arms_hands_legs_skin');skin_mesh.from_pydata(vertices,[],faces);skin_mesh.update()
skin=bpy.data.objects.new('R09_coherent_scanned_face_bridged_neck_body_skin',skin_mesh);model.objects.link(skin)
for m in(cloth,face,hand,hair):skin_mesh.materials.append(m)
for p,mi in zip(skin_mesh.polygons,face_mats):p.material_index=mi;p.use_smooth=True
bm=bmesh.new();bm.from_mesh(skin_mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(skin_mesh);bm.free();skin_mesh.update()
max_source_delta=max((skin_mesh.vertices[head_offset+i].co-source_render_positions[i]).length for i in range(len(source_render_positions)))
if max_source_delta>1e-7:raise RuntimeError('Actual scan face/jaw/lobes changed during retopology')
for ob in(body,scan):bpy.data.objects.remove(ob,do_unlink=True)
skin['component']='body';skin['attribution']='Buddha Head by beachmouse, CC BY 4.0, via Sketchfab and Objaverse; rigidly cropped/placed and subdivided. New body, neck bridge and fine hair geometry authored for this reconstruction.'
skin['source']='https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab';skin['license']='https://creativecommons.org/licenses/by/4.0/';skin['visualAccepted']=False

# Tangent spirals are embedded in the new actual-boundary cap. Their size is
# independent of camera resolution; they remain three-dimensional in oblique view.
cv=[];cf=[];curl_count=0
for row,t in enumerate((.045,.15,.26,.38,.50,.62,.74,.85,.94)):
    radius=G.profile([(0,1),(.40,.835),(.72,.55),(.88,.32),(.97,.11),(1,0)],t)
    count=max(7,round(ht['length']*radius/.047))
    for k in range(count):
        u=(k+.5*(row%2))/count;p=cap_position(u,t)
        along=(cap_position(u+.001,t)-cap_position(u-.001,t)).normalized();up=(cap_position(u,min(.999,t+.002))-cap_position(u,max(.001,t-.002))).normalized();normal=along.cross(up).normalized();side=normal.cross(along).normalized()
        base=len(cv);steps=34;sides=6;r=.0195 if row<7 else .016
        for j in range(steps):
            q=j/(steps-1);a=2*pi*1.42*q;rr=r*(1-.82*q)
            c=p+along*(rr*cos(a))+side*(rr*sin(a))+normal*(.0025+.004*q)
            tang=(-along*sin(a)+side*cos(a)).normalized();bi=tang.cross(normal).normalized()
            for z in range(sides):
                ang=2*pi*z/sides;cv.append(tuple(c+.0047*(normal*cos(ang)+bi*sin(ang))))
        for j in range(steps-1):
            for z in range(sides):
                a=base+j*sides+z;b=base+j*sides+(z+1)%sides;cf.append((a,b,b+sides,a+sides))
        curl_count+=1
curls=G.mesh('R09_embedded_fine_spiral_curls_'+str(curl_count),cv,cf,hair,'hair')
G.make_ornaments(burnish);G.make_lotus([gold,oldgold,cloth])
render_objects=[o for o in model.objects if o.type=='MESH']
for ob in render_objects:
    if ob!=skin:G.recalc(ob)

# Parent receives the agreed seat anchor and conventional glTF coordinates:
# Blender (X,Y,Z) becomes Three (X,Z,-Y), so +Y-up and +Z-front.
for ob in render_objects:ob.location.z-=SEAT
body_objects=[o for o in render_objects if o.get('component')!='lotus']
lotus_objects=[o for o in render_objects if o.get('component')=='lotus']
def bounds(objects):
    bpy.context.view_layer.update()
    ps=[o.matrix_world@Vector(c)for o in objects for c in o.bound_box]
    a=[min(p[k]for p in ps)for k in range(3)];b=[max(p[k]for p in ps)for k in range(3)]
    return {'blenderZUp':[a,b],'threeYUp':[[a[0],a[2],-b[1]],[b[0],b[2],-a[1]]]}

def glb(name,objects):
    activate(objects);bpy.ops.export_scene.gltf(filepath=str(DEST/name),use_selection=True,export_format='GLB',export_apply=True,export_extras=True)
glb('japanese-buddha-body.glb',body_objects);glb('japanese-buddha-with-lotus.glb',render_objects)

# SC07 batches, grouped by material, use the exact evaluated mesh and world
# transform of the exported asset. UVs are neutral object coordinates, not photos.
sc07=DEST/'sc07';sc07.mkdir(exist_ok=True)
def export_sc07(objects,stem):
    batches={};deps=bpy.context.evaluated_depsgraph_get();R=Matrix(((1,0,0),(0,0,1),(0,-1,0)))
    for ob in objects:
        eo=ob.evaluated_get(deps);me=eo.to_mesh();me.calc_loop_triangles();world=ob.matrix_world;normals=world.to_3x3().inverted().transposed()
        for material_index in sorted({p.material_index for p in me.polygons}):
            material=me.materials[material_index];tag=material.get('reconstructionMaterial',material.name)
            if tag=='burnished_detail':tag='gold'
            batch=batches.setdefault(tag,{'positions':array.array('f'),'normals':array.array('f'),'uv':array.array('f'),'indices':array.array('I'),'map':{}})
            for tri in me.loop_triangles:
                if tri.material_index!=material_index:continue
                for vi in tri.vertices:
                    key=(ob.name,int(vi))
                    if key not in batch['map']:
                        index=len(batch['positions'])//3;batch['map'][key]=index
                        p=R@(world@me.vertices[vi].co);n=(R@(normals@me.vertices[vi].normal)).normalized()
                        batch['positions'].extend(p);batch['normals'].extend(n);batch['uv'].extend((.5+math.atan2(p.z,p.x)/(2*pi),(p.y+.7)/4.2))
                    batch['indices'].append(batch['map'][key])
        eo.to_mesh_clear()
    parts=[]
    for tag,b in batches.items():
        n=len(b['positions'])//3;ni=len(b['indices']);data=struct.pack('<4sIIII',b'SC07',n,ni,0,0)+b['positions'].tobytes()+b['normals'].tobytes()+b['uv'].tobytes()+b['indices'].tobytes();sha=hashlib.sha256(data).hexdigest();name=f'{stem}-{tag}-{sha[:16]}.bin';(sc07/name).write_bytes(data)
        parts.append({'material':tag,'file':name,'vertices':n,'triangles':ni//3,'bytes':len(data),'sha256':sha})
    return parts
body_batches=export_sc07(body_objects,'central-body');lotus_batches=export_sc07(lotus_objects,'central-lotus')
# Preserve an identifiable actual face/ear/throat component for side figures.
# Its open lower boundary is the real new neck anchor; hair/crown is excluded.
core_faces=[p for p in skin.data.polygons if p.material_index==1]
core_ids=sorted({int(i)for p in core_faces for i in p.vertices});core_remap={v:i for i,v in enumerate(core_ids)}
core_me=bpy.data.meshes.new('R09_actual_face_ears_neck_core');core_me.from_pydata([tuple(skin.data.vertices[i].co)for i in core_ids],[],[tuple(core_remap[int(i)]for i in p.vertices)for p in core_faces]);core_me.update();core_me.materials.append(face)
for p in core_me.polygons:p.use_smooth=True
core=bpy.data.objects.new('R09_identifiable_actual_face_ears_neck_core',core_me);model.objects.link(core);core.matrix_world=skin.matrix_world.copy();core['attribution']=skin['attribution'];core['component']='face_core'
head_batches=export_sc07([core],'central-head-core');head_bounds=bounds([core]);glb('actual-face-ears-neck-core.glb',[core]);bpy.data.objects.remove(core,do_unlink=True)
skin_bm=bmesh.new();skin_bm.from_mesh(skin.data)
topology={'vertices':len(skin_bm.verts),'triangles':sum(len(f.verts)-2 for f in skin_bm.faces),'boundaryEdges':sum(e.is_boundary for e in skin_bm.edges),'nonManifoldEdges':sum(not e.is_manifold for e in skin_bm.edges)};skin_bm.free()
manifest={'revision':'scene06-foundation-r09','format':'SC07:20-byte header, float32 position/normal/neutral UV, uint32 triangle indices','coordinateSystem':'+Y-up,+Z-front','seatAnchor':[0,0,0],'nominalAboveSeatHeight':3.26,'bodyBounds':bounds(body_objects),'assemblyBounds':bounds(render_objects),'bodyOnly':body_batches,'lotusOnly':lotus_batches,'faceCore':{'parts':head_batches,'bounds':head_bounds,'neckAnchor':[0,BODY_CUT-SEAT,0],'scalpCutY':SCALP_CUT-SEAT,'includesHairOrCrown':False},'variants':{'central':body_batches},'materials':{},'visualAccepted':False,'sourceAttribution':skin['attribution']}
for m in(cloth,face,hand,hair,gold,oldgold,burnish):
    p=m.node_tree.nodes.get('Principled BSDF');manifest['materials'][m['reconstructionMaterial']]={'baseColorLinear':list(p.inputs['Base Color'].default_value),'metalness':p.inputs['Metallic'].default_value,'roughness':p.inputs['Roughness'].default_value}
(sc07/'manifest.json').write_text(json.dumps(manifest,indent=2))

# Studio is independent of asset export. Two actual frames, no extra audits.
floor=mat('STUDIO_matte_floor','25221e',0,.82)
bpy.ops.mesh.primitive_plane_add(size=2000,location=(0,0,-.43-SEAT));floorob=bpy.context.object;floorob.name='STUDIO_only_floor';floorob.data.materials.append(floor)
world=bpy.data.worlds.new('R09 restrained neutral studio');world.use_nodes=True;scene.world=world;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.09,.09,.09,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.20
def area(name,loc,power,size,color):
    light=bpy.data.lights.new(name,'AREA');light.energy=power;light.shape='DISK';light.size=size;light.color=color
    ob=bpy.data.objects.new(name,light);scene.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector((0,0,1.40))-ob.location).to_track_quat('-Z','Y').to_euler()
area('STUDIO broad key',(-3.4,-4.1,5.8),750,4.4,(1,.95,.85));area('STUDIO fill',(3.1,-3.0,3.0),240,3.3,(.87,.93,1));area('STUDIO rim',(1.8,2.8,4.0),600,2.8,(1,.80,.52))
camdata=bpy.data.cameras.new('R09 review camera');cam=bpy.data.objects.new('R09 review camera',camdata);scene.collection.objects.link(cam);scene.camera=cam;camdata.lens=65
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True;scene.cycles.device='GPU';prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
if not any(d.use for d in prefs.devices):raise RuntimeError('Metal GPU unavailable')
scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.resolution_x=1254;scene.render.resolution_y=1254;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.05
cam.location=(0,-9.0,2.35);cam.rotation_euler=(Vector((0,0,1.33))-cam.location).to_track_quat('-Z','Y').to_euler()
scene['visualAccepted']=False;scene['sourceReference']='references/hd/4-照片-5.jpg';scene['revision']='R09 coherent sculpture'
bpy.ops.wm.save_as_mainfile(filepath=str(DEST/'editable-coherent-statue.blend'),compress=True)
views=[]
for name,loc in [('front',(0,-9.0,2.35)),('three-quarter',(4.3,-8.0,2.52))]:
    cam.location=loc;cam.rotation_euler=(Vector((0,0,1.33))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(DEST/(name+'.png'));bpy.ops.render.render(write_still=True);views.append({'name':name,'file':name+'.png','camera':list(loc),'resolution':[1254,1254]})
report={'revision':'R09 draped sculpture','status':'substantive-drapery-two-view-review','visualAccepted':False,'live06Changed':False,'source':{'file':str(SOURCE.relative_to(OUT)),'sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'license':'CC-BY-4.0','author':'beachmouse','source':'https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab','provenanceLimit':'Creator records Japanese tea garden in California; maker/date/manufacturing origin undocumented.'},'sourceFaceCageWarped':False,'renderedSourceVertexMaxDeltaAfterRetopology':max_source_delta,'topology':topology,'voxelCleanup':voxel_cleanup,'neckBridge':{'sourceNormalizedCut':norm_cut,'sourceWorldNeckCut':NECK_CUT,'garmentWorldCut':BODY_CUT,'sourceBoundaryVertices':len(hn['ids']),'garmentBoundaryVertices':len(bt['ids']),'bridgeRings':M,'bridgeVerticesPerRing':N,'sourceNeckCapUsed':False,'jawAndLobes':'Retained actual source surface above the neck cut. No vertex deformation; exact attachment by zipper faces.'},'changes':['R08 source-preserving head/neck bridge retained; no scan face adjustment.','Upper sleeve caps buried within the chest instead of exposed diagonal shoulder planes.','Each crossed leg follows one continuous bent hip/knee/shin path; no separate capped thigh/calf elbow.','Weighted closed knee-robe shells sampled from actual authored limb geometry, with deep irregular carved folds and rolled hems.','Central lower garment support fills the unsupported skirt region without one inflated oval leg disc.','Palm tops and finger roots overlap through soft knuckle webs instead of a straight exposed cap bar.','Longer thinner pointed petal shells with shallow sections, inward higher inner tips and mild twist.'],'seatAnchor':manifest['seatAnchor'],'bodyBounds':manifest['bodyBounds'],'assemblyBounds':manifest['assemblyBounds'],'bodySC07':body_batches,'lotusSC07':lotus_batches,'views':views,'builderSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'geometryHelperSha256':hashlib.sha256((OUT/'statue_r09_geometry.py').read_bytes()).hexdigest(),'limits':['Isolated sculpture review; integration/camera/native temple lighting remain with scene owner.','Actual head is a different sculpture than the supplied reference; no exactness claim.','Facial geometry was preserved, not matched by raster deformation.','Two actual Cycles frames do not establish native WebGL equivalence or photographic acceptance.']}
(DEST/'report.json').write_text(json.dumps(report,indent=2));print('R09_COHERENT_STATUE_READY',json.dumps({k:report[k]for k in['revision','topology','neckBridge','bodyBounds','visualAccepted']}),flush=True)
