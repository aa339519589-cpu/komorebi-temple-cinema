"""CPU-only genuine CC0 cloth + new closed anatomical head foundation.

No renderer, scene export, viewport, UV bake, image sampling or GPU compute.
Raw measured cloth is not globally remeshed/smoothed. Only authored head and
arms use local CPU voxel unions. All input bytes are verified and declared.
"""
import bpy,bmesh,math,json,hashlib,struct,array,sys,importlib.util
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.geometry import tessellate_polygon
from mathutils.kdtree import KDTree
ROOT=Path(__file__).resolve().parents[4];HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE));import anatomy as A
spec=importlib.util.spec_from_file_location('reviewed_r01_hand_geometry',ROOT/'reconstructions/scene-06/modeling/sculpture165/geometry.py')
G=importlib.util.module_from_spec(spec);spec.loader.exec_module(G)
REV='r04';DEST=ROOT/'lookdev/scene06-sculpture165'/REV;DEST.mkdir(parents=True,exist_ok=True)
DONOR=ROOT/'lookdev/statue-cc0-drapery169/r03'
EXPECTED={
 'crossed-knees-hips-source-surface.sc07.bin':'9a25055d4ff1fce066c6d4341afbfc95e39900b40e084317181363ffc627a4c3',
 'torso-cloak-core-source-surface.sc07.bin':'362ece0f98baf4e7b47a5403b4b485d4cb7b209c46701fc87119eb6f1c8d649e'
}
input_hashes={}
for name in [*EXPECTED,'crossed-knees-hips-mount-loops.json','torso-cloak-core-mount-loops.json','surface-anchors.json','native-manifest.json','manifest.json','handoff-validation.json']:
    sha=hashlib.sha256((DONOR/name).read_bytes()).hexdigest();input_hashes[str((DONOR/name).relative_to(ROOT))]=sha
    if name in EXPECTED and sha!=EXPECTED[name]:raise RuntimeError('Measured donor input changed: '+name)
anchors=json.loads((DONOR/'surface-anchors.json').read_text())['anchors']
kl=json.loads((DONOR/'crossed-knees-hips-mount-loops.json').read_text())['classified']
tl=json.loads((DONOR/'torso-cloak-core-mount-loops.json').read_text())['classified']
bpy.ops.wm.read_factory_settings(use_empty=True)
COL=bpy.data.collections.new('actual_measured_cloth_and_authored_anatomy_R04');bpy.context.scene.collection.children.link(COL)
def rgb(code):
    v=[int(code[i:i+2],16)/255 for i in(0,2,4)];return tuple(x/12.92 if x<=.04045 else((x+.055)/1.055)**2.4 for x in v)+(1,)
def material(name,color,metal,rough):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=rgb(color);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;m['reconstructionMaterial']=name;return m
MATS={'cloth':material('cloth','c5a454',.91,.47),'face':material('face','cfad5c',.94,.40),'hand':material('hand','cbaa58',.94,.39),'hair':material('hair','231e17',.24,.53),'gold':material('gold','d7b66a',.94,.35)}
def mesh(name,verts,faces,tag='cloth'):
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();me.materials.append(MATS[tag]);ob=bpy.data.objects.new(name,me);COL.objects.link(ob)
    for p in me.polygons:p.use_smooth=True
    ob['materialTag']=tag;return ob
def activate(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
def recalc(ob,weld=False):
    bm=bmesh.new();bm.from_mesh(ob.data)
    if weld:bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(ob.data);bm.free();ob.data.update()
def load_sc07(name):
    data=(DONOR/name).read_bytes();magic,n,ni,_,_=struct.unpack_from('<4sIIII',data,0)
    if magic!=b'SC07' or len(data)!=20+32*n+4*ni:raise RuntimeError('Invalid actual donor buffer')
    p=[Vector(x)for x in struct.iter_unpack('<fff',memoryview(data)[20:20+12*n])]
    off=20+32*n;f=list(struct.iter_unpack('<III',memoryview(data)[off:]));return p,f

SOURCE_NORMALS={}
def face_key(points):return tuple(sorted(tuple(round(c,5)for c in p)for p in points))
def record_source_winding(points,faces):
    for f in faces:
        a,b,c=(points[i]for i in f);SOURCE_NORMALS[face_key((a,b,c))]=(b-a).cross(c-a)
def join_weld(name,objects):
    activate(objects);bpy.ops.object.join();ob=bpy.context.object;ob.name=name
    bm=bmesh.new();bm.from_mesh(ob.data);before=len(bm.verts)
    # The original scan is split at UV/material seams. This weld only merges
    # coincident positions within three micrometres in this viewing scale.
    # It does not resample, smooth, remesh or flatten measured garment form.
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=3e-6)
    bm.to_mesh(ob.data);bm.free();ob.data.update();ob['seamWeldRemovedVertices']=before-len(ob.data.vertices);return ob
def actual_boundary_loops(ob):
    bm=bmesh.new();bm.from_mesh(ob.data);boundary=[e for e in bm.edges if e.is_boundary];adj={}
    for e in boundary:
        for v in e.verts:adj.setdefault(v,[]).append(e)
    bad=[v for v,ee in adj.items()if len(ee)!=2]
    if bad:
        bm.free();raise RuntimeError(ob.name+' has branched open boundary: '+str(len(bad)))
    seen=set();loops=[]
    for first in boundary:
        if first in seen:continue
        v=first.verts[0];start=v;edge=first;ps=[]
        while True:
            ps.append(v.co.copy());seen.add(edge);v=edge.other_vert(v)
            if v is start:break
            edge=next(e for e in adj[v]if e not in seen)
        loops.append(ps)
    bm.free();return loops
def orient_from_measured_surface(ob):
    """Resolve connected-component sign using retained original triangles.

    Recalculating each unwelded scan island was the actual R03b failure.
    Here seam welding precedes consistency, and source winding is the sign
    anchor for every connected measured component. No DoubleSide material.
    """
    bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.normal_update();seen=set();components=[]
    for first in bm.faces:
        if first in seen:continue
        stack=[first];seen.add(first);fs=[]
        while stack:
            f=stack.pop();fs.append(f)
            for e in f.edges:
                for other in e.link_faces:
                    if other not in seen:seen.add(other);stack.append(other)
        anchors=[]
        for f in fs:
            ref=SOURCE_NORMALS.get(face_key(v.co for v in f.verts))
            if ref is not None:anchors.append((f,ref))
        score=sum(f.normal.dot(n)for f,n in anchors)
        flipped=False
        if anchors and score<0:
            bmesh.ops.reverse_faces(bm,faces=fs);flipped=True
        elif not anchors:
            volume=sum(f.verts[0].co.dot(f.verts[j].co.cross(f.verts[j+1].co))/6 for f in fs for j in range(1,len(f.verts)-1))
            closed=all(len(e.link_faces)==2 for f in fs for e in f.edges)
            if closed and volume<0:bmesh.ops.reverse_faces(bm,faces=fs);flipped=True
        bm.normal_update()
        disagreements=sum(f.normal.dot(n)<0 for f,n in anchors)
        components.append({'faces':len(fs),'sourceOrientationAnchors':len(anchors),'sourceDisagreements':disagreements,'componentFlippedToSource':flipped})
    stats={'vertices':len(bm.verts),'faces':len(bm.faces),'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonmanifoldEdges':sum(len(e.link_faces)>2 for e in bm.edges),'components':components}
    bm.to_mesh(ob.data);bm.free();ob.data.update();return stats

# A documented affine proportion fit retains the measured X/Z setback;
# only transverse width and upright stature are fitted. The rigid small yaw
# aligns actual paired knee-front anchors with the measured neck ring axis.
S=2.4064171122994655;SX=S*.90;SY=S*1.20;SZ=S
neck_source=[Vector(x)for x in tl['neck_mount'][0]['coordinates']]
nc=sum(neck_source,Vector())/len(neck_source)
kc=(Vector(anchors['left_knee_front_surface']['componentPoint'])+Vector(anchors['right_knee_front_surface']['componentPoint']))*.5
d=nc-kc;YAW=math.atan2(d.x,-d.z)
rot=Matrix.Rotation(YAW,4,'Y');scale=Matrix.Diagonal((SX,SY,SZ,1))
base=scale@rot;neck_axis=base@nc
rear=base@Vector(anchors['seat_rear_surface']['componentPoint']);front=base@Vector(anchors['seat_front_surface']['componentPoint'])
offset=Vector((-neck_axis.x,0,-.5*(rear.z+front.z)))
TRANSFORM=Matrix.Translation(offset)@base
def tx(p):return TRANSFORM@Vector(p)
def loop_points(record):return[tx(p)for p in record['coordinates']]
neck_ring=loop_points(tl['neck_mount'][0]);axis=sum(neck_ring,Vector())/len(neck_ring)
report={'revision':'scene06-sculpture165-'+REV,'status':'cpu-authoring-active','visualAccepted':False,'inputs':input_hashes,'bodyTransform':[list(r)for r in TRANSFORM],'fit':{'uniformBase':S,'transverseGain':.90,'uprightGain':1.20,'depthGain':1,'rigidYawRadians':YAW,'origin':'Actual traced rear/front seat contact pair defines depth mount; neck ring defines the authoring axis. Axis means are not claimed surface anchors.'},'sourceAttribution':'Seated figure of Buddha by Daniel Pett, CC0-1.0; Chinese Tang dynasty marble, different artifact from Japanese reference06. Main head/ears/arms/hands and local bridges newly authored. No unchanged scanned face is claimed.','sourceURL':'https://sketchfab.com/3d-models/seated-figure-of-buddha-a4d22eb6d3c44848bd49b89fb4c28759','sourceLicense':'CC0-1.0 + newly authored anatomy','sourceBodySha256':'5834c2c7fc67c92b3bb258dc0aa5393bd79fd529358bfd33360bfeebae3335e7','sourceLimit':'Different Chinese Tang marble sculpture, source real dimensions undocumented. Viewing-unit normalization and all affine fits declared. Surface erosion remains; no photographic acceptance.'}

def cap(name,points):
    ps=[Vector(x)for x in points];lookup={tuple(round(c,7)for c in p):i for i,p in enumerate(ps)}
    # Blender5.2 returns vertex indices; prior builds returned vectors.
    fs=[tuple(p if isinstance(p,int)else lookup[tuple(round(c,7)for c in p)]for p in tri)for tri in tessellate_polygon([ps])]
    if any(not 0<=i<len(ps)for f in fs for i in f):raise RuntimeError('Invalid cap triangulation index')
    return mesh(name,[tuple(p)for p in ps],fs)
def plane_cut(ob,height,keep_above):
    bm=bmesh.new();bm.from_mesh(ob.data)
    bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-7,plane_co=Vector((0,height,0)),plane_no=Vector((0,1,0)),clear_inner=keep_above,clear_outer=not keep_above)
    bm.to_mesh(ob.data);bm.free();ob.data.update()
    loops=[ps for ps in actual_boundary_loops(ob)if len(ps)>12 and all(abs(p.y-height)<2e-5 for p in ps)]
    if len(loops)!=1:raise RuntimeError('Expected one actual cut perimeter, found '+str(len(loops))+' in '+ob.name)
    return A.order_ring(loops[0])
def bridge(name,lo,hi,rows=10):
    # Keep every original perimeter vertex. Only internal rows are resampled;
    # normalized-arclength zipper strips connect differing ring sizes without
    # T-junctions at the measured surface or voxel-head cut boundary.
    lo=A.order_ring(lo);hi=A.order_ring(hi);pa=A.ring_parameters(lo);pb=A.ring_parameters(hi);N=384;v=[];f=[];rings=[]
    for j in range(rows+1):
        t=j/rows
        points=lo if j==0 else hi if j==rows else[A.sample_ring(lo,pa,i/N).lerp(A.sample_ring(hi,pb,i/N),t)for i in range(N)]
        rings.append((len(v),points,A.ring_parameters(points)));v.extend(tuple(p)for p in points)
    for (oa,a,ap),(ob,b,bp)in zip(rings,rings[1:]):
        i=j=0;na=len(a);nb=len(b)
        while i<na or j<nb:
            au=ap[i+1]if i<na else 2;bu=bp[j+1]if j<nb else 2
            ai=oa+i%na;bj=ob+j%nb
            if abs(au-bu)<1e-10:
                f.append((ai,oa+(i+1)%na,ob+(j+1)%nb,bj));i+=1;j+=1
            elif au<bu:f.append((ai,oa+(i+1)%na,bj));i+=1
            else:f.append((ai,ob+(j+1)%nb,bj));j+=1
    return mesh(name,v,f)

kp,kf=load_sc07('crossed-knees-hips-source-surface.sc07.bin');tp,tf=load_sc07('torso-cloak-core-source-surface.sc07.bin')
kt=[tx(p)for p in kp];tt=[tx(p)for p in tp];record_source_winding(kt,kf);record_source_winding(tt,tf)
knee=mesh('CC0_DanielPett_original_weighted_knees',[tuple(p)for p in kt],kf)
torso=mesh('CC0_DanielPett_original_unequal_robe_torso',[tuple(p)for p in tt],tf)
# Close the actual arm cuts before making the waist cut. This keeps each
# source shoulder boundary attached to its authored cowl, then produces one
# real, topologically ordered torso/cowl waist loop rather than a polar sort.
cowls=[]
for side,key in [(-1,'left_arm_mount'),(1,'right_arm_mount')]:
    vv,ff=A.cowl_geometry(loop_points(tl[key][0]),side);cowls.append(mesh('AUTHORED_source_perimeter_shoulder_cowl_'+str(side),vv,ff))
torso=join_weld('CC0_torso_with_local_source_perimeter_cowls',[torso]+cowls)
# Only the duplicated hidden torso overlap is removed. Original lower donor
# remains intact, including genuine crossed ankle masses and knee folds.
waist_height=.265*SY;upper_waist=plane_cut(torso,waist_height,True)
lower_waist=loop_points(max(kl['waist_mount'],key=lambda x:x['perimeter']))
parts=[knee,torso,bridge('AUTHORED_local_waist_bridge_exact_original_perimeters',lower_waist,upper_waist)]
for key,records in kl.items():
    for i,record in enumerate(records):
        if key=='waist_mount' and record is max(kl['waist_mount'],key=lambda x:x['perimeter']):continue
        parts.append(cap('AUTHORED_hidden_lower_mount_'+key+'_'+str(i),loop_points(record)))
source_expected=kt+[tx(p)for p in tp if p.y>=.265+1e-6]

# Newly authored clean quad-meridian full head, ear cartilage and intrinsic
# eyelid/labial clefts. No donor face is projected, no separate slit floor.
hv,hf,nring,nparam=A.head_geometry(axis,neck_ring);head=mesh('AUTHORED_closed_clean_quad_anatomical_head',hv,hf,'face')
earobs=[]
for side in(-1,1):vv,ff=A.ear_geometry(side,axis);earobs.append(mesh('AUTHORED_closed_cartilage_ear_'+str(side),vv,ff,'face'))
activate([head]+earobs);bpy.ops.object.join();head=bpy.context.object;recalc(head,True)
rem=head.modifiers.new('CPU_union_authored_head_ears_only','REMESH');rem.mode='VOXEL';rem.voxel_size=.0028;rem.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=rem.name)
sm=head.modifiers.new('Very_small_authored_cartilage_weld_relax','SMOOTH');sm.factor=.10;sm.iterations=1;bpy.ops.object.modifier_apply(modifier=sm.name)
head_base=axis.y+.012;head_ring=plane_cut(head,head_base,True)
head.data.materials.clear();head.data.materials.append(MATS['face']);head.data.materials.append(MATS['hair'])
for p in head.data.polygons:
    p.material_index=1 if sum(head.data.vertices[i].co.y for i in p.vertices)/len(p.vertices)>axis.y+.790 else 0;p.use_smooth=True
parts.extend([head,bridge('AUTHORED_exact_boundary_neck_bridge_no_flange',neck_ring,head_ring,3)])

# One actual seam-welded cloth/neck/head shell. Original triangle directions
# anchor outward orientation after connected consistency. Authored hands are
# still separate closed solids and never remesh measured cloth.
mounted_body=join_weld('CC0_cloth_AUTHORED_cowls_neck_head_continuous_shell',parts)
mount_stats=orient_from_measured_surface(mounted_body)
report['mountTopology']=mount_stats
report['boundaryLoopSizesAfterMount']=sorted([len(p)for p in actual_boundary_loops(mounted_body)],reverse=True)
if any(c['sourceDisagreements']for c in mount_stats['components']):raise RuntimeError('Measured source orientation disagrees after joined mount')
if mount_stats['nonmanifoldEdges']:raise RuntimeError('Mounted shell has nonmanifold edges: '+str(mount_stats['nonmanifoldEdges']))
parts=[mounted_body]

# Prior reviewed hands/covered arms are authored volumes only. Their local
# CPU union does not touch, smooth or remesh any measured donor cloth.
G.COLLECTION=COL;G.GOLD=MATS['cloth'];G.OBJECTS.clear();G.make_arms();G.make_hands()
R=Matrix(((1,0,0,0),(0,0,1,0),(0,-1,0,0),(0,0,0,1)))
arm_groups={side:[o for o in G.OBJECTS if (sum(v.co.x for v in o.data.vertices)/len(o.data.vertices))*side>0]for side in(-1,1)}
for side,group in arm_groups.items():
    activate(group);bpy.ops.object.join();ob=bpy.context.object;recalc(ob,True)
    rem=ob.modifiers.new('CPU_union_authored_arm_hand_only','REMESH');rem.mode='VOXEL';rem.voxel_size=.0045;rem.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=rem.name)
    ob.data.transform(Matrix.Translation((0,.200-.245,-.650))@R)
    ob.data.materials.clear();ob.data.materials.append(MATS['cloth']);ob.data.materials.append(MATS['hand'])
    for p in ob.data.polygons:
        c=sum((ob.data.vertices[i].co for i in p.vertices),Vector())/len(p.vertices);p.material_index=1 if c.y>1.15 and c.z>-.42 else 0;p.use_smooth=True
    ob.name='AUTHORED_attached_raised_loop_arm_hand_'+str(side);parts.append(ob)

# Small snail curls are genuinely3D solids rooted in the same authored cap.
cv=[];cf=[];curl_count=0
for row,h in enumerate([.797,.822,.848,.875,.902,.929,.954,.976]):
    radius=A.profile([(q[0],q[1])for q in A.HEAD_ROWS],h);count=max(7,round(2*math.pi*radius/.047))
    for k in range(count):
        u=(k+.5*(row%2))/count;p=A.head_point(u,h,axis,nring,nparam)
        tangent=(A.head_point(u+.001,h,axis,nring,nparam)-A.head_point(u-.001,h,axis,nring,nparam)).normalized();up=(A.head_point(u,h+.001,axis,nring,nparam)-A.head_point(u,h-.001,axis,nring,nparam)).normalized();normal=tangent.cross(up).normalized()
        if normal.dot(p-Vector((axis.x,p.y,axis.z)))<0:normal=-normal
        sideaxis=normal.cross(tangent).normalized();offset=len(cv);N=34;D=6
        for j in range(N):
            t=j/(N-1);a=2*math.pi*1.30*t;r=.0175*(1-.82*t);c=p+tangent*(r*math.cos(a))+sideaxis*(r*math.sin(a))+normal*.0015
            cross=(-tangent*math.sin(a)+sideaxis*math.cos(a)).cross(normal).normalized()
            for z in range(D):ang=2*math.pi*z/D;cv.append(tuple(c+.0038*(normal*math.cos(ang)+cross*math.sin(ang))))
        for j in range(N-1):
            for z in range(D):a=offset+j*D+z;b=offset+j*D+(z+1)%D;cf.append((a,b,b+D,a+D))
        cf.append(tuple(offset+z for z in range(D-1,-1,-1)));cf.append(tuple(offset+(N-1)*D+z for z in range(D)));curl_count+=1
parts.append(mesh('AUTHORED_rooted_spiral_cap_curls_'+str(curl_count),cv,cf,'hair'))

# Geometry-preservation audit is restricted to actual retained source points.
# It is not an appearance/likeness test. No measured cloth modifier ran.
tree=KDTree(len(mounted_body.data.vertices));index=0
for o in[mounted_body]:
    for v in o.data.vertices:tree.insert(v.co,index);index+=1
tree.balance();max_source_delta=max(tree.find(p)[2]for p in source_expected)
if max_source_delta>2e-5:raise RuntimeError('Unexpected deformation of retained measured cloth: '+str(max_source_delta))
# Do not independently recalculate the joined measured shell. Its connected
# orientation is already verified against the actual retained source faces.
for o in parts:
    if o is not mounted_body:recalc(o)
sc07=DEST/'sc07';sc07.mkdir(exist_ok=True);batches={}
for o in parts:
    me=o.data;me.calc_loop_triangles()
    for mi in sorted({p.material_index for p in me.polygons}):
        tag=me.materials[mi]['reconstructionMaterial'];batch=batches.setdefault(tag,{'p':array.array('f'),'n':array.array('f'),'uv':array.array('f'),'i':array.array('I'),'lookup':{}})
        for tri in me.loop_triangles:
            if tri.material_index!=mi:continue
            for vi in tri.vertices:
                key=(o.name,int(vi))
                if key not in batch['lookup']:
                    idx=len(batch['p'])//3;batch['lookup'][key]=idx;p=me.vertices[vi].co;n=me.vertices[vi].normal;batch['p'].extend(p);batch['n'].extend(n);batch['uv'].extend((.5+math.atan2(p.z-axis.z,p.x-axis.x)/(2*math.pi),(p.y+.1)/4.2))
                batch['i'].append(batch['lookup'][key])
published=[]
for tag,b in batches.items():
    n=len(b['p'])//3;ni=len(b['i']);data=struct.pack('<4sIIII',b'SC07',n,ni,0,0)+b['p'].tobytes()+b['n'].tobytes()+b['uv'].tobytes()+b['i'].tobytes();sha=hashlib.sha256(data).hexdigest();name=f'central-body-{tag}-{sha[:16]}.bin';(sc07/name).write_bytes(data);published.append({'file':name,'material':tag,'vertices':n,'triangles':ni//3,'bytes':len(data),'sha256':sha})
allps=[v.co for o in parts for v in o.data.vertices];bounds=[[min(p[k]for p in allps)for k in range(3)],[max(p[k]for p in allps)for k in range(3)]]
manifest={'revision':report['revision'],'format':'SC07:20-byte header, float32 position/normal/neutral UV, uint32 triangle indices','coordinateSystem':'+Y-up/+Z-front','seatAnchor':[0,0,0],'nominalAboveSeatHeight':axis.y+1.01,'bodyBounds':{'threeYUp':bounds},'bodyOnly':published,'variants':{'central':published},'materials':{},'visualAccepted':False,'sourceAttribution':report['sourceAttribution'],'sourceURL':report['sourceURL'],'sourceLicense':report['sourceLicense'],'sourceLimit':report['sourceLimit'],'sourceRetarget':{'method':'MeasuredCC0 cloth under declared affine fit; coincident seams welded within3e-6 viewing metres before connected orientation anchored to retained source triangles. Exact original boundary vertices retained in local waist/neck zipper bridges; source shoulder cowls are joined before actual torso waist trim. Newly authored continuous3D skull/ears with smooth nasal tissue and intrinsic eyelid/labial clefts. No donor-face projection, separate incision floor or DoubleSide mask.','retainedMeasuredPointMaxDelta':max_source_delta,'measuredClothGlobalSmoothing':False,'mountTopology':mount_stats,'erosionRestoration':'None in this topology/anatomy repair; visible damage remains for local native gold inspection.'},'modelHeadAxis':list(axis),'recommendedCentralMandorlaZ':-1.15,'recommendedCentralHaloCenterModelY':axis.y+.55,'recommendedMainLotusDepthAspect':.82}
for tag,m in MATS.items():
    p=m.node_tree.nodes.get('Principled BSDF');manifest['materials'][tag]={'baseColorLinear':list(p.inputs['Base Color'].default_value),'metalness':p.inputs['Metallic'].default_value,'roughness':p.inputs['Roughness'].default_value}
(sc07/'manifest.json').write_text(json.dumps(manifest,indent=2))
report.update({'status':'actual-3D-integrated-topology-anatomy-repair-awaiting-native-review','retainedMeasuredPointMaxDelta':max_source_delta,'sourceWindingAnchorTriangles':len(SOURCE_NORMALS),'headMethod':'New continuous anatomical volume with smoothly tapered nasal side planes, arched shallow closed lids, compact labial cleft, wider upper pinna/concha and narrow lobules. Only authored head/ears locally CPU remeshed. No source scan face projected.','waistMethod':'Cowls first share the actual original shoulder boundaries; the combined upper cloth is cut to componentY>=.265 along its actual topological cut loop. Waist/neck bridges preserve exact boundary vertices with arclength zipper topology. Named source mount caps and coincident seam welding connect the measured surfaces.','bodyBounds':manifest['bodyBounds'],'headAxis':list(axis),'nominalAboveSeatHeight':axis.y+1.01,'curlCount':curl_count,'reproducer':str(Path(__file__).relative_to(ROOT)),'builderSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'geometrySha256':hashlib.sha256((HERE/'anatomy.py').read_bytes()).hexdigest(),'helperFiles':{'anatomy.py':hashlib.sha256((HERE/'anatomy.py').read_bytes()).hexdigest(),'priorReviewedHandGeometry':hashlib.sha256((ROOT/'reconstructions/scene-06/modeling/sculpture165/geometry.py').read_bytes()).hexdigest()},'limits':['Different Tang artifact, actual damage/ragged hem retained.','Source winding agreement and seam topology do not establish serene likeness.','Mount/hand/neck/seat fit and source weathering require actual native full/hero/face/three-quarter review.','Source input verification and point preservation do not establish photographic acceptance.']})
(DEST/'build-report.json').write_text(json.dumps(report,indent=2));(DEST/'build.py').write_text(Path(__file__).read_text());(DEST/'anatomy.py').write_text((HERE/'anatomy.py').read_text());print('INTEGRATED_R03_READY',json.dumps(report),flush=True)
