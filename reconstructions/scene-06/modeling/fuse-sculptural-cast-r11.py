"""Fuse intersecting sculptural construction sections into actual cast meshes.

Run only through tools/run-blender-queued.mjs. This is offline mesh generation,
not a frame generator. Runtime images remain the actual Three.js scene.
"""
import bpy, bmesh, json, math, struct, hashlib, os, time
from pathlib import Path
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(os.getcwd())
RAW=ROOT/'qa/ten-reference/06/sculptural-cast-r11-build/raw'
OUT=ROOT/'reconstructions/scene-06/assets/sculptural-cast-r11'
OUT.mkdir(parents=True,exist_ok=True)
source=json.loads((RAW/'manifest.json').read_text())
started=time.time()
head_sculpt_log=[]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def raw_object(part,variant):
    data=(RAW/part['file']).read_bytes()
    magic,n,ni=struct.unpack_from('<4sII',data)
    assert magic==b'R7RW'
    vertices=np.frombuffer(data,dtype='<f4',count=n*3,offset=12).reshape(-1,3)
    triangles=np.frombuffer(data,dtype='<u4',count=ni,offset=12+n*12).reshape(-1,3)
    mesh=bpy.data.meshes.new(variant+'-'+part['material'])
    mesh.vertices.add(n);mesh.vertices.foreach_set('co',vertices.ravel())
    mesh.loops.add(ni);mesh.loops.foreach_set('vertex_index',triangles.ravel())
    mesh.polygons.add(ni//3)
    mesh.polygons.foreach_set('loop_start',np.arange(0,ni,3,dtype=np.int32))
    mesh.polygons.foreach_set('loop_total',np.full(ni//3,3,dtype=np.int32))
    mesh.update();obj=bpy.data.objects.new(mesh.name,mesh);bpy.context.collection.objects.link(obj)
    return obj

def activate(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]

def trim_at_y(obj,height,keep_below):
    bm=bmesh.new();bm.from_mesh(obj.data)
    # Weld the duplicated parametric meridians first. Without this, a clipped
    # loft rim is an open chain and cannot form a reliable solid volume.
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
    cut=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.000001,plane_co=(0,height,0),plane_no=(0,1,0),clear_outer=keep_below,clear_inner=not keep_below)
    edges=[e for e in cut['geom_cut'] if isinstance(e,bmesh.types.BMEdge) and e.is_boundary]
    if edges:bmesh.ops.holes_fill(bm,edges=edges,sides=0)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.normal_update();bm.to_mesh(obj.data);bm.free();obj.data.update()

def closed_cartilage_ears():
    # Full-thickness pinnae with actual cartilage topography and rounded lobes.
    # The concha, helix and antihelix are deformations of one closed ear skin,
    # not parallel rods or detached decorative curves. Their medial roots are
    # inside the curved head bearing and become one cast in the voxel union.
    rows=np.array([
      [-.390,0,0,.331,.015],[-.365,.028,.027,.339,.018],
      [-.290,.040,.037,.349,.015],[-.170,.048,.046,.360,.008],
      [-.030,.050,.049,.365,0],[.110,.048,.045,.355,-.005],
      [.230,.034,.035,.340,-.008],[.300,0,0,.321,-.005]
    ])
    def profile(y):
        k=int(np.clip(np.searchsorted(rows[:,0],y)-1,0,len(rows)-2));a,b=rows[k],rows[k+1];t=(y-a[0])/(b[0]-a[0]);p=rows[max(0,k-1)];q=rows[min(len(rows)-1,k+2)];h=b[0]-a[0]
        return np.array([(2*t**3-3*t*t+1)*a[j]+(t**3-2*t*t+t)*h*(b[j]-p[j])/(b[0]-p[0])+(-2*t**3+3*t*t)*b[j]+(t**3-t*t)*h*(q[j]-a[j])/(q[0]-a[0]) for j in range(1,5)])
    def gauss(q,w):return math.exp(-(q/w)**2)
    objects=[];nu=56;nv=132
    for side in [-1,1]:
        vertices=[];faces=[]
        for j in range(nv+1):
            t=j/nv;dy=-.390+.690*t;rx,rz,cx,cz=profile(dy)
            for k in range(nu+1):
                a=k/nu*2*math.pi;local=math.sin(a)*rx;front=max(0,math.cos(a))
                if j in [0,nv]:local=0;depth=0
                else:
                    bowl=-.033*gauss(local+.004,.025)*gauss(dy-.005,.165)
                    helix=.010*gauss(local-rx*.66,.012)*gauss(dy-.04,.245)
                    fork_center=.006+.018*math.tanh((dy+.025)*8)
                    antihelix=.0075*gauss(local-fork_center,.009)*gauss(dy-.055,.16)
                    tragus=.008*gauss(local+.028,.013)*gauss(dy+.10,.045)
                    depth=math.cos(a)*rz+(bowl+helix+antihelix+tragus)*front**2
                # Turn the whole pinna inward and place its actual concha in
                # front of the lateral cheek. In rejected -03 only the outer
                # edge escaped the skull and read as an elongated rod.
                theta=-side*.30;hinge_x=side*.337;local_x=side*(cx-.337+local)
                xx=hinge_x+local_x*math.cos(theta)+depth*math.sin(theta)
                zz=.115+cz-local_x*math.sin(theta)+depth*math.cos(theta)
                vertices.append((xx,2.91+dy*.88,zz))
                if j<nv and k<nu:
                    a0=j*(nu+1)+k;b0=a0+nu+1
                    faces.extend([(a0,a0+1,b0),(a0+1,b0+1,b0)])
        mesh=bpy.data.meshes.new('R11-closed-organic-pinna-'+str(side));mesh.from_pydata(vertices,[],faces);mesh.update();obj=bpy.data.objects.new(mesh.name,mesh);bpy.context.collection.objects.link(obj)
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();objects.append(obj)
    return objects

def scanned_head(variant='central'):
    # Genuine structured-light anatomical mesh, resculpted in full 3D. R11
    # replaces the different artifact's lower-face identity rather than merely
    # compressing its measured fish-like lips onto another smooth mask.
    path=ROOT/'reconstructions/scene-06/assets/cc0-fralin-buddha-head/BuddhaHead_surfmerg_remesh.ply'
    bpy.ops.wm.ply_import(filepath=str(path));head=bpy.context.object;head.name='R11-soft-tissue-anatomy-'+variant
    def ease(q):
        q=max(0.0,min(1.0,float(q)));return q*q*(3-2*q)
    def G(x,y,cx,cy,sx,sy):return math.exp(-((x-cx)/sx)**2-((y-cy)/sy)**2)
    for v in head.data.vertices:v.co=(v.co.x*.0057,v.co.y*.0086+2.99,v.co.z*.0038+.09)
    head.data.update();n=len(head.data.vertices)
    original=np.empty((n,3),dtype=np.float64);head.data.vertices.foreach_get('co',original.ravel())
    group=head.vertex_groups.new(name='Broad anatomical base for actual tissue reconstruction')
    for v in head.data.vertices:
        x,y,z=v.co;ear=0.0
        w=ease((z-.045)/.11)*(1-ear)
        if w>.001:group.add([v.index],w,'REPLACE')
    activate([head]);modifier=head.modifiers.new('Separate measured nasal orbital and conchal anatomy','SMOOTH');modifier.factor=.48;modifier.iterations=120;modifier.vertex_group=group.name;bpy.ops.object.modifier_apply(modifier=modifier.name)
    base=np.empty((n,3),dtype=np.float64);old_normals=np.empty((n,3),dtype=np.float64)
    head.data.vertices.foreach_get('co',base.ravel());head.data.vertices.foreach_get('normal',old_normals.ravel())
    measured_relief=np.einsum('ij,ij->i',original-base,old_normals)
    # C2 curvature through distinct throat, submental, chin, buccal, malar and
    # forehead sections. A continuous second derivative prevents the straight
    # chin/cheek glare bands of the previous piecewise lifted jaw shelf.
    rows=np.array([
      [2.32,.126,.132,-.018],[2.42,.139,.150,-.015],
      [2.48,.155,.182,-.024],[2.54,.191,.255,-.035],
      [2.60,.242,.312,-.030],[2.68,.292,.345,-.022],
      [2.77,.328,.355,-.020],[2.89,.349,.358,-.023],
      [3.02,.346,.353,-.027],[3.16,.324,.354,-.029],
      [3.28,.280,.322,-.030],[3.32,.253,.294,-.030]
    ],dtype=np.float64)
    knots=rows[:,0];h=np.diff(knots);A=np.zeros((len(rows),len(rows)));rhs=np.zeros((len(rows),3));A[0,0]=A[-1,-1]=1
    for k in range(1,len(rows)-1):
        A[k,k-1]=h[k-1];A[k,k]=2*(h[k-1]+h[k]);A[k,k+1]=h[k]
        rhs[k]=6*((rows[k+1,1:]-rows[k,1:])/h[k]-(rows[k,1:]-rows[k-1,1:])/h[k-1])
    second=np.linalg.solve(A,rhs)
    def profile(y):
        j=int(np.clip(np.searchsorted(knots,y)-1,0,len(rows)-2));dt=h[j]
        a=(knots[j+1]-y)/dt;b=(y-knots[j])/dt
        return a*rows[j,1:]+b*rows[j+1,1:]+((a*a*a-a)*second[j]+(b*b*b-b)*second[j+1])*dt*dt/6
    sculpted=base.copy()
    for i,(x,y,z) in enumerate(base):
        ear=0.0
        front=ease((z-.015)/.13)*(1-ear)
        shape_gate=(1-ear)*(1 if y<2.90 else .84+.16*ease((z-.015)/.13))
        if shape_gate<=0:continue
        rx,rz,cz=profile(max(knots[0],min(knots[-1],y)));angle=math.atan2(x/.34,(z-.020)/.34)
        tx=rx*math.sin(angle);tz=cz+rz*math.cos(angle)
        nose=G(x,y,0,2.88,.073,.165);eye=G(abs(x),y,.155,3.045,.112,.087)
        # Strong lower-face replacement; the actual scan relief is restored
        # only where its anatomy serves the photograph's much softer planes.
        lower=math.exp(-((y-2.64)/.24)**4)
        strength=min(.998,.94+.058*lower)*(1-.61*nose)*(1-.40*eye)*shape_gate
        xx=x+(tx-x)*strength;zz=z+(tz-z)*strength
        radial=np.array([xx/(rx*rx),0,(zz-cz)/(rz*rz)],dtype=np.float64);radial/=max(np.linalg.norm(radial),1e-12)
        clay=(.018*G(abs(xx),y,.205,2.84,.155,.185)+.010*G(abs(xx),y,.170,2.71,.15,.15)+.004*G(xx,y,0,2.61,.15,.11)+.008*G(xx,y,0,3.165,.245,.14))*front
        xx+=radial[0]*clay;zz+=radial[2]*clay
        # No separate raised diagonal mandibular ridge: jaw curvature comes
        # from the full volumetric section, not a linear corner lift.
        sculpted[i]=(xx,y,zz)
    head.data.vertices.foreach_set('co',sculpted.ravel());head.data.update()
    new_normals=np.empty((n,3),dtype=np.float64);head.data.vertices.foreach_get('normal',new_normals.ravel())
    mouth_y=2.690;mouth_half=.100
    removed_labial=0
    for i,v in enumerate(head.data.vertices):
        x,y,z=base[i];xx,yy,zz=sculpted[i]
        ear=0.0
        if ear>.98:
            x,y,z=original[i]
            y+=.045*(1-ease((y-2.67)/.23));v.co=(x,y,z);continue
        front=ease((z-.045)/.11)*(1-ear)
        eye=G(abs(x),y,.155,3.045,.12,.105);nose=G(x,y,0,2.88,.075,.17)
        erase=math.exp(-((x/.205)**4+((y-2.704)/.126)**4))*front
        detail_scale=(.09+.77*nose+.86*eye)*front+.36*(1-front)
        detail_scale*=1-ease((abs(x)-.285)/.065)
        detail_scale*=1-.985*erase
        if erase>.5:removed_labial+=1
        position=np.array([xx,yy,zz])+new_normals[i]*float(measured_relief[i])*detail_scale
        x,y,z=map(float,position)
        # Gently descending almond corner line. Reshape the actual orbital
        # patch in Y; compress only the inherited severe upper fold, retaining
        # its true eyelid cross-section rather than laying a new tube over it.
        q=(abs(x)-.155)/.118
        eye_gate=(1-ease((abs(q)-.80)/.35))*(1-ease((abs(y-3.045)-.055)/.065))*front
        source_line=3.045+.020*q
        target_line=3.038-.004*q+.012*max(0,1-q*q)
        y+=eye_gate*((target_line-source_line)-.15*(y-source_line))
        # A shallow shared cleft, narrower in depth than one export voxel.
        # Upper-lip overhang supplies the physical shadow; no deep slot.
        t=x/mouth_half;cleft=mouth_y+.004*min(1,t*t)
        z-=.0013*math.exp(-((x/(mouth_half*.96))**6))*math.exp(-((y-cleft)/.0055)**2)*front
        v.co=(x,y,z)
    head.data.update();bpy.context.view_layer.update()
    # Sample the actual independently editable skin mesh in local +Z. This is
    # geometry-to-geometry construction; no reference pixels or camera enter.
    tree=BVHTree.FromObject(head,bpy.context.evaluated_depsgraph_get())
    def skin_z(x,y):
        hit=tree.ray_cast(Vector((x,y,.90)),Vector((0,0,-1)),1.2)[0]
        if hit is None:raise RuntimeError('Lip footprint missed genuine 3D skin')
        return float(hit.z)
    lips=[];nu=80;nv=18
    for upper in [True,False]:
        points=[];faces=[];stride=(nu+1)*(nv+1)
        for back in [False,True]:
            for j in range(nv+1):
                v=j/nv
                for k in range(nu+1):
                    t=k/nu*2-1;x=mouth_half*t;taper=max(0,1-t*t)**.72
                    cleft=mouth_y+.004*t*t
                    bow=.020+.003*(math.exp(-((t-.31)/.26)**2)+math.exp(-((t+.31)/.26)**2))-.002*math.exp(-(t/.19)**2)
                    height=(bow if upper else .026)*taper
                    y=cleft+(1 if upper else -1)*height*v
                    # Shallow vermilion rolls with tapered corners. There is
                    # no thick torus, open aperture or duplicated fish mouth.
                    bulge=(.0090 if upper else .0105)*math.sin(math.pi*v)**1.05*taper
                    overhang=(.0020 if upper else .0003)*(1-v)**2*taper
                    z=skin_z(x,y)+(-.018 if back else bulge+overhang)
                    points.append((x,y,z))
        for side in range(2):
            for j in range(nv):
                for k in range(nu):
                    a=side*stride+j*(nu+1)+k;b=a+nu+1
                    faces.extend([(a,a+1,b),(a+1,b+1,b)] if side==0 else [(a,b,a+1),(a+1,b,b+1)])
        boundary=list(range(nu+1))+[j*(nu+1)+nu for j in range(1,nv+1)]+[nv*(nu+1)+k for k in range(nu-1,-1,-1)]+[j*(nu+1) for j in range(nv-1,0,-1)]
        for k,a in enumerate(boundary):
            b=boundary[(k+1)%len(boundary)];faces.extend([(a,b+stride,b),(a,a+stride,b+stride)])
        mesh=bpy.data.meshes.new('R11-closed-'+('upper' if upper else 'lower')+'-lip');mesh.from_pydata(points,[],faces);mesh.update()
        obj=bpy.data.objects.new(mesh.name,mesh);bpy.context.collection.objects.link(obj)
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();lips.append(obj)
    activate([head]+lips);bpy.ops.object.join()
    ears=closed_cartilage_ears()
    activate([head]+ears);bpy.ops.object.join()
    trim_at_y(head,3.32,True);trim_at_y(head,2.40,False)
    front=max(v.co.z for v in head.data.vertices if abs(v.co.x)<.025 and 3.195<v.co.y<3.225)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=(0,3.21,front+.002));urna=bpy.context.object;urna.name='R11-small-raised-urna';urna.scale=(.012,.014,.008);activate([urna]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    activate([head,urna]);bpy.ops.object.join()
    for v in head.data.vertices:v.co.y-=.18
    if variant!='central':
        for v in head.data.vertices:
            x,y,z=v.co;x*=.79;y=2.72+(y-2.48)*.78;z*=.88
            theta=.025 if variant=='left' else -.020
            x,z=x*math.cos(theta)+z*math.sin(theta),-x*math.sin(theta)+z*math.cos(theta)
            v.co=(x,y,z)
    head_sculpt_log.append({'variant':variant,'method':'C2 full cheek/chin/submental/throat sections; replace lower-face scan planes and puckered lips with newly modeled closed shallow upper/lower labial solids on actual skin. Genuine nasal/orbital mesh anatomy retained; newly authored closed cartilage ears; broad orbital corner warp. No RGB, raster face, normal-map mask or view-facing construction.','profileRowsYRxRzCz':rows.tolist(),'measuredAnatomicalInputVertices':n,'removedInheritedLabialRegionVertices':removed_labial,'closedLipSolids':2,'mouthHalfWidthModelUnits':mouth_half,'mouthCleftYModelUnits':mouth_y,'orbitalSourceLineY':3.045,'orbitalSourceOuterRise':.020,'orbitalTargetLineY':3.038,'orbitalTargetOuterRise':-.004,'orbitalHeightScale':.85,'lipCleftDepthModelUnits':.0013,'earConstruction':'Two closed full-thickness cartilage surfaces with lobule, concha, helix and branching antihelix, fused into a continuous remapped head circumference' ,'earForwardPlacementModelUnits':.115,'earLobeHeightScale':.88,'earInwardTurnRadians':.30,'headPlacementY':-.18,'temporaryBaseSmoothIterations':120,'temporaryBaseIsNotFinalSurface':True})
    return head

def mesh_stats(mesh,clean_object=None):
    # Union-find checks the physical components of the modeled surface. A
    # component count is topology evidence, never photographic acceptance.
    n=len(mesh.vertices);parent=np.arange(n,dtype=np.int32);size=np.ones(n,dtype=np.int32)
    def find(a):
        while parent[a]!=a:
            parent[a]=parent[parent[a]];a=parent[a]
        return a
    edges=np.empty(len(mesh.edges)*2,dtype=np.int32);mesh.edges.foreach_get('vertices',edges)
    for a,b in edges.reshape(-1,2):
        a=find(a);b=find(b)
        if a!=b:
            if size[a]<size[b]:a,b=b,a
            parent[b]=a;size[a]+=size[b]
    counts=sorted((int(size[i]) for i in range(n) if parent[i]==i),reverse=True)
    # Two 8-vertex voxel specks appeared beneath the distal toes in the first
    # bake. They are discretization debris, not anatomy; remove only components
    # smaller than 64 vertices, never a substantial disconnected body part.
    small={i for i in range(n) if parent[i]==i and size[i]<64}
    if clean_object is not None and small and len(counts)>1:
        selected=[i for i in range(n) if find(i) in small]
        activate([clean_object]);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT');bpy.ops.object.mode_set(mode='OBJECT')
        for i in selected:mesh.vertices[i].select=True
        bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.delete(type='VERT');bpy.ops.object.mode_set(mode='OBJECT')
        mesh.update();mesh.calc_loop_triangles();stats=mesh_stats(mesh);stats['removedVoxelSpeckVertices']=len(selected);return stats
    return {'vertices':n,'triangles':len(mesh.loop_triangles),'connectedComponents':len(counts),'largestComponents':counts[:16],'largestComponentFraction':counts[0]/n if n else 0}

def cupped_wrist_bridge(variant):
    # The rotated cup has its heel in front of the old bare wrist. A genuine
    # curved carpal bearing joins those actual volumes; there is no extra palm.
    side=1 if variant=='left' else -1
    c=bpy.data.curves.new('R11-anatomical-curved-carpal-bearing','CURVE');c.dimensions='3D';c.resolution_u=24;c.bevel_depth=.048;c.bevel_resolution=4;c.use_fill_caps=True
    spline=c.splines.new('BEZIER');points=[(side*.74,1.36,.40),(side*.77,1.395,.54),(side*.77,1.405,.65)];spline.bezier_points.add(len(points)-1)
    for p,co in zip(spline.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    o=bpy.data.objects.new(c.name,c);bpy.context.collection.objects.link(o);activate([o]);bpy.ops.object.convert(target='MESH');return bpy.context.object

def save_mesh(obj,variant,material,inspect_topology=False):
    mesh=obj.data
    for p in mesh.polygons:p.use_smooth=True
    mesh.update();mesh.calc_loop_triangles()
    topology=mesh_stats(mesh,obj) if inspect_topology else None
    p=np.empty(len(mesh.vertices)*3,dtype='<f4');mesh.vertices.foreach_get('co',p)
    n=np.empty(len(mesh.vertices)*3,dtype='<f4');mesh.vertices.foreach_get('normal',n)
    indices=np.empty(len(mesh.loop_triangles)*3,dtype='<u4');mesh.loop_triangles.foreach_get('vertices',indices)
    points=p.reshape(-1,3)
    # Neutral cylindrical object UVs serve only the procedural gold micrograin.
    uv=np.empty((len(mesh.vertices),2),dtype='<f4')
    uv[:,0]=np.arctan2(points[:,0],points[:,2])/(2*math.pi);uv[:,1]=points[:,1]*.31
    data=struct.pack('<4sIIII',b'SC07',len(mesh.vertices),len(indices),0,0)+p.tobytes()+n.tobytes()+uv.tobytes()+indices.tobytes()
    digest=hashlib.sha256(data).hexdigest();name=f'{variant}-{material}-{digest[:16]}.bin'
    # Immutable content-named surfaces keep the previous live manifest valid
    # throughout regeneration. Publish the new manifest only after all parts.
    target=OUT/name
    prior=ROOT/'reconstructions/scene-06/assets/sculptural-cast-r10'/name
    if prior.exists() and hashlib.sha256(prior.read_bytes()).hexdigest()==digest:
        name='../sculptural-cast-r10/'+name
    elif not target.exists():
        temporary=OUT/(name+'.tmp');temporary.write_bytes(data);os.replace(temporary,target)
    item={'material':material,'file':name,'vertices':len(mesh.vertices),'triangles':len(indices)//3,'sha256':digest,'bounds':[points.min(axis=0).tolist(),points.max(axis=0).tolist()]}
    if inspect_topology:item['topology']=topology
    return item

manifest={'revision':'scene06-sculptural-cast-r11','format':'SC07:20-byte header, float32 position/normal/uv, uint32 triangle indices','variants':{},'visualAccepted':False}
for variant,parts in source['variants'].items():
    core=[];separate=[]
    for part in parts:
        obj=raw_object(part,variant)
        if part['material'] in ['central','buddha','cloth','hand','face']:core.append(obj)
        elif part['material']!='crease':separate.append((obj,part['material']))
        else:bpy.data.objects.remove(obj,do_unlink=True)
    if variant!='central':core.append(cupped_wrist_bridge(variant))
    activate(core);bpy.ops.object.join();obj=core[0];obj.name=variant+'-continuous-cast'
    # Replace only the anatomy above each closed neckline; all three source-
    # led seated poses, hands, robe masses, and furniture anchors are retained.
    trim_at_y(obj,2.49 if variant=='central' else 2.72,True)
    head=scanned_head(variant);activate([obj,head]);bpy.ops.object.join()
    bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free();obj.data.update()
    remesh=obj.modifiers.new('Physical union of cast body, hands and robe','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.0045;remesh.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smooth=obj.modifiers.new('Relax voxel stair steps, preserve sculptural planes','SMOOTH');smooth.factor=.23;smooth.iterations=2
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    # Relax the actual mesh across the anatomical throat bearing. This is an
    # offline surface sculpture, not a view/shader mask or a normal-map repair.
    group=obj.vertex_groups.new(name='R11-natural-throat-transition')
    center=2.265 if variant=='central' else 2.5596;radius=.090 if variant=='central' else .082
    for v in obj.data.vertices:
        x,y,z=v.co;weight=math.exp(-((y-center)/radius)**4)*(1-max(0,min(1,(abs(x)-.21)/.13)))
        if weight>.005:group.add([v.index],weight,'REPLACE')
    relax=obj.modifiers.new('Sculpt a continuous jaw-to-throat bearing','SMOOTH');relax.factor=.55;relax.iterations=12;relax.vertex_group=group.name
    bpy.ops.object.modifier_apply(modifier=relax.name)
    lips_group=obj.vertex_groups.new(name='R11-soft-labial-to-skin-transition')
    mouth_y=2.690-.18 if variant=='central' else 2.72+(2.690-.18-2.48)*.78
    for v in obj.data.vertices:
        x,y,z=v.co;w=math.exp(-((x/(.145 if variant=='central' else .115))**4+((y-mouth_y)/(.060 if variant=='central' else .047))**4))*max(0,min(1,(z-.19)/.08))
        if w>.005:lips_group.add([v.index],w,'REPLACE')
    soften=obj.modifiers.new('Sculpt soft continuous labial bearing','SMOOTH');soften.factor=.38;soften.iterations=6;soften.vertex_group=lips_group.name
    bpy.ops.object.modifier_apply(modifier=soften.name)
    decimate=obj.modifiers.new('Surface-preserving export density','DECIMATE');decimate.ratio=.36;decimate.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    # Three shallow iconic neck folds belong to the final continuous skin,
    # so the intersecting head/body construction cannot fill them back in.
    fold_centers=[2.24,2.29,2.34] if variant=='central' else [2.535,2.575,2.615]
    for v in obj.data.vertices:
        x,y,z=v.co
        gate=(1-max(0,min(1,(abs(x)-(.20 if variant=='central' else .155))/.065)))*max(0,min(1,(z-.055)/.10))
        if gate<=0:continue
        for cy in fold_centers:
            v.co.z-=gate*(.0045 if variant=='central' else .0037)*math.exp(-((y-cy-.003*(x/.22)**2)/.010)**2)
    obj.data.update()
    material='central' if variant=='central' else 'buddha' 
    manifest['variants'][variant]=[save_mesh(obj,variant,material,True)]
    if manifest['variants'][variant][0]['topology']['connectedComponents']!=1:
        raise RuntimeError('Refuse to publish disconnected physical anatomy: '+variant)
    for o,m in separate:
        activate([o])
        # Fine cast flowers and hair curls are heavily oversampled in source.
        # Weld their duplicate parametric seams before reducing export density.
        bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.00002);bpy.ops.object.mode_set(mode='OBJECT')
        detail=o.modifiers.new('Preserve chased casting silhouette, reduce redundant samples','DECIMATE');detail.ratio=.32 if m=='gold' else .65;detail.use_collapse_triangulate=True
        bpy.ops.object.modifier_apply(modifier=detail.name)
        manifest['variants'][variant].append(save_mesh(o,variant,m))
    print(json.dumps({'event':'fused-cast','variant':variant,'core':manifest['variants'][variant][0]}),flush=True)

provenance={'asset':'scene06-sculptural-cast-r11','createdUtc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'method':'R11 source-led C2 soft-tissue sections, rounded chin/throat, actual new closed lip solids replacing inherited puckering, gentler orbital corners and asymmetric broad tension drapery. Editable procedural body/cloth and signed-distance hands with genuine CC0 structured-light head anatomy retargeted and actually sculpted toward the reference cheeks, jaw, forehead and downcast lids. The full-figure museum pose is not substituted. Each closed neckline, head, body, robe and newly cupped hands are physically voxel-unioned, gently relaxed, and decimated. No image projection, depth photograph mesh, AI frame, image plane, photographic texture, or source RGB used.','reference':'references/hd/4-照片-5.jpg, visual proportion/pose comparison only','anatomicalBase':'assets/cc0-fralin-buddha-head/provenance.json','referenceLandmarkGuide':'reconstructions/scene-06/modeling/scene06-r11-sculpture-landmarks.json','referenceLandmarkGuideSha256':hashlib.sha256((ROOT/'reconstructions/scene-06/modeling/scene06-r11-sculpture-landmarks.json').read_bytes()).hexdigest(),'source':source['source'],'sourceSha256':source['sourceSha256'],'generator':'reconstructions/scene-06/modeling/build-sculptural-cast-r11.mjs','fuser':'reconstructions/scene-06/modeling/fuse-sculptural-cast-r11.py','fuserSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'blenderVersion':bpy.app.version_string,'headMeshSculpture':head_sculpt_log,'voxelSizeModelUnits':.0045,'decimateRatio':.36,'elapsedSeconds':time.time()-started,'visualAccepted':False,'limits':['A valid connected cast mesh does not establish a photo match.','The anatomical source is a different historical artifact, retargeted as a real 3D modeling base; it is not claimed as a scan of the photographed statue.','Voxel union may soften features finer than 4.5mm in pre-conversion model units.','The indoor light field and carved mandorlas remain separate reconstruction candidates.']}
temporary=OUT/'provenance.json.tmp';temporary.write_text(json.dumps(provenance,indent=2));os.replace(temporary,OUT/'provenance.json')
temporary=OUT/'manifest.json.tmp';temporary.write_text(json.dumps(manifest,indent=2));os.replace(temporary,OUT/'manifest.json')
print(json.dumps({'event':'cast-assets-written','out':str(OUT),'elapsedSeconds':time.time()-started}),flush=True)
