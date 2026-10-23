"""Fuse intersecting sculptural construction sections into actual cast meshes.

Run only through tools/run-blender-queued.mjs. This is offline mesh generation,
not a frame generator. Runtime images remain the actual Three.js scene.
"""
import bpy, bmesh, json, math, struct, hashlib, os, time
from pathlib import Path
import numpy as np
from mathutils.kdtree import KDTree

ROOT=Path(os.getcwd())
RAW=ROOT/'qa/ten-reference/06/sculptural-cast-r10-build/raw'
OUT=ROOT/'reconstructions/scene-06/assets/sculptural-cast-r10'
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

def scanned_head(variant='central'):
    # R10-04 rebuilds broad tissue/skull/jaw/throat volumes. Measured fine
    # anatomical relief is separated from the real mesh, then transferred
    # along the new surface normals, never as RGB or a view-facing texture.
    path=ROOT/'reconstructions/scene-06/assets/cc0-fralin-buddha-head/BuddhaHead_surfmerg_remesh.ply'
    bpy.ops.wm.ply_import(filepath=str(path));head=bpy.context.object;head.name='R10-rounded-real-anatomy-'+variant
    def ease(q):
        q=max(0.0,min(1.0,float(q)));return q*q*(3-2*q)
    def G(x,y,cx,cy,sx,sy):return math.exp(-((x-cx)/sx)**2-((y-cy)/sy)**2)
    for v in head.data.vertices:v.co=(v.co.x*.0057,v.co.y*.0086+2.99,v.co.z*.0038+.09)
    head.data.update();n=len(head.data.vertices)
    original=np.empty((n,3),dtype=np.float64);head.data.vertices.foreach_get('co',original.ravel())
    # This physical mesh smooth is only a temporary low-frequency component.
    # The actual measured eye/nose/lip/concha relief is retained separately.
    group=head.vertex_groups.new(name='Measured facial base, protected conchae')
    for v in head.data.vertices:
        x,y,z=v.co;ear=ease((abs(x)-.285)/.045)*(1-ease((z-.14)/.07))
        w=ease((z-.045)/.11)*(1-ear)
        if w>.001:group.add([v.index],w,'REPLACE')
    activate([head]);modifier=head.modifiers.new('Separate broad 3D base from measured anatomical relief','SMOOTH');modifier.factor=.42;modifier.iterations=80;modifier.vertex_group=group.name;bpy.ops.object.modifier_apply(modifier=modifier.name)
    base=np.empty((n,3),dtype=np.float64);old_normals=np.empty((n,3),dtype=np.float64)
    head.data.vertices.foreach_get('co',base.ravel());head.data.vertices.foreach_get('normal',old_normals.ravel())
    measured_relief=np.einsum('ij,ij->i',original-base,old_normals)
    # Piecewise C1 skull/tissue profiles, in model-local metres. They define
    # distinct narrow throat, curved submental return, rounded chin, full
    # buccal/malar cheeks and a soft domed forehead, rather than one ellipsoid.
    rows=[
      [2.34,.145,.145,-.015],[2.44,.160,.170,-.015],
      [2.52,.185,.230,-.015],[2.60,.242,.340,-.018],
      [2.72,.315,.352,-.020],[2.86,.349,.356,-.025],
      [3.00,.343,.351,-.028],[3.14,.326,.355,-.030],
      [3.26,.294,.339,-.030],[3.32,.254,.300,-.030]
    ]
    def profile(y):
        if y<=rows[0][0]:return rows[0][1:]
        if y>=rows[-1][0]:return rows[-1][1:]
        for j in range(len(rows)-1):
            a,b=rows[j],rows[j+1]
            if y>b[0]:continue
            dt=b[0]-a[0];t=(y-a[0])/dt;t2=t*t;t3=t2*t
            p=rows[max(0,j-1)];q=rows[min(len(rows)-1,j+2)]
            out=[]
            for k in [1,2,3]:
                m0=(b[k]-p[k])/(b[0]-p[0]);m1=(q[k]-a[k])/(q[0]-a[0])
                out.append((2*t3-3*t2+1)*a[k]+(t3-2*t2+t)*dt*m0+(-2*t3+3*t2)*b[k]+(t3-t2)*dt*m1)
            return out
    sculpted=base.copy()
    for i,(x,y,z) in enumerate(base):
        ear=ease((abs(x)-.285)/.045)*(1-ease((z-.14)/.07))
        front=ease((z-.015)/.13)*(1-ear)
        if front<=0:continue
        rx,rz,cz=profile(y);angle=math.atan2(x/.34,(z-.020)/.34)
        tx=rx*math.sin(angle);tz=cz+rz*math.cos(angle)
        nose=G(x,y,0,2.89,.080,.185);eye=G(abs(x),y,.155,3.05,.115,.095)
        strength=(.59+.20*math.exp(-((y-2.62)/.20)**2)+.28*math.exp(-((y-2.44)/.11)**2))
        strength=min(.96,strength)*(1-.58*nose)*(1-.22*eye)*front
        xx=x+(tx-x)*strength;zz=z+(tz-z)*strength
        # Normal-directed clay pads change real soft-tissue volume laterally
        # as well as forward; they do not build another flat malar plate.
        radial=np.array([xx/(rx*rx),0,(zz-cz)/(rz*rz)],dtype=np.float64);radial/=max(np.linalg.norm(radial),1e-12)
        clay=(.020*G(abs(xx),y,.205,2.84,.125,.155)+.012*G(abs(xx),y,.165,2.70,.12,.13)+.013*G(xx,y,0,2.60,.14,.10)+.009*G(xx,y,0,3.165,.235,.125))*front
        xx+=radial[0]*clay;zz+=radial[2]*clay
        # Raise and draw in the lateral mandibular corners, leaving a rounded
        # low central chin. This replaces the inherited horizontal jaw shelf.
        jaw=math.exp(-((y-2.575)/.125)**2)*ease((abs(xx)-.055)/.245)*front
        yy=y+.060*jaw;xx*=1-.055*jaw
        sculpted[i]=(xx,yy,zz)
    head.data.vertices.foreach_set('co',sculpted.ravel());head.data.update()
    new_normals=np.empty((n,3),dtype=np.float64);head.data.vertices.foreach_get('normal',new_normals.ravel())
    mouth_mask=(abs(base[:,0])<.245)&(base[:,1]>2.575)&(base[:,1]<2.82)&(base[:,2]>.18)
    source_ids=np.flatnonzero(mouth_mask);tree=KDTree(len(source_ids))
    for j,i in enumerate(source_ids):tree.insert((float(base[i,0]),float(base[i,1]),0),j)
    tree.balance();transferred=0
    for i,v in enumerate(head.data.vertices):
        x,y,z=base[i];xx,yy,zz=sculpted[i]
        ear=ease((abs(x)-.285)/.045)*(1-ease((z-.14)/.07))
        if ear>.98:
            v.co=original[i];continue
        front=ease((z-.045)/.11)*(1-ear)
        eye=G(abs(x),y,.155,3.045,.12,.11);nose=G(x,y,0,2.88,.075,.18)
        mouth=G(x,y,0,2.69,.17,.085)*front
        height=float(measured_relief[i])
        if mouth>.015:
            # Retarget genuine 3D lip relief onto the new curved tissue base.
            # Base cheeks never undergo the puckering X compression of -02.
            qx=x/.76;qy=y+.028-.010*(abs(x)/.095)**2
            found=tree.find_n((float(qx),float(qy),0),4);weighted=total=0.0
            for co,j,d in found:
                w=1/max(d*d,1e-8);weighted+=w*measured_relief[source_ids[j]];total+=w
            if total:height=(1-mouth)*height+mouth*weighted/total;transferred+=1
        detail_scale=(.28+.65*max(eye,nose)+.72*mouth)*front+.95*(1-front)
        position=np.array([xx,yy,zz])+new_normals[i]*height*detail_scale
        x,y,z=map(float,position)
        # Quiet downcast real orbital planes; the anatomical lid relief above
        # is measured mesh detail, not a duplicate raised gold eyelid cord.
        eye=G(abs(x),y,.155,3.045,.12,.095)*front;theta=math.radians(10)*eye
        ey=y-3.045;ez=z-.305;y=3.045+ey*math.cos(theta)-ez*math.sin(theta);z=.305+ey*math.sin(theta)+ez*math.cos(theta)
        y-=.075*(y-3.035)*eye
        v.co=(x,y,z)
    head.data.update()
    trim_at_y(head,3.32,True);trim_at_y(head,2.40,False)
    front=max(v.co.z for v in head.data.vertices if abs(v.co.x)<.025 and 3.195<v.co.y<3.225)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=(0,3.21,front+.002));urna=bpy.context.object;urna.name='R10-small-raised-urna';urna.scale=(.012,.014,.008);activate([urna]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    activate([head,urna]);bpy.ops.object.join()
    for v in head.data.vertices:v.co.y-=.18
    if variant!='central':
        for v in head.data.vertices:
            x,y,z=v.co;x*=.79;y=2.72+(y-2.48)*.78;z*=.88
            if z>.12:z-=.012*G(x,y,0,2.72+(2.675-.18-2.48)*.78,.034,.020)
            theta=.025 if variant=='left' else -.020
            x,z=x*math.cos(theta)+z*math.sin(theta),-x*math.sin(theta)+z*math.cos(theta)
            v.co=(x,y,z)
    head_sculpt_log.append({'variant':variant,'method':'Broad C1 skull/soft-tissue/rounded-jaw/narrow-throat profile sculpture and normal-directed clay volumes, retaining actual measured 3D orbital/nasal/labial/concha relief along new surface normals. No raster/RGB/face plate.','profileRowsYRxRzCz':rows,'measuredReliefVertexCount':n,'retargetedMeasuredLipReliefVertices':transferred,'sourceMouthDetailWidthFactor':.76,'sourceMouthDetailYShift':-.028,'headPlacementY':-.18,'jawCornerRaiseModelUnits':.060,'temporaryBaseSmoothIterations':80,'temporaryBaseIsNotFinalSurface':True})
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
    c=bpy.data.curves.new('R10-anatomical-curved-carpal-bearing','CURVE');c.dimensions='3D';c.resolution_u=24;c.bevel_depth=.048;c.bevel_resolution=4;c.use_fill_caps=True
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
    if not target.exists():
        temporary=OUT/(name+'.tmp');temporary.write_bytes(data);os.replace(temporary,target)
    item={'material':material,'file':name,'vertices':len(mesh.vertices),'triangles':len(indices)//3,'sha256':digest,'bounds':[points.min(axis=0).tolist(),points.max(axis=0).tolist()]}
    if inspect_topology:item['topology']=topology
    return item

manifest={'revision':'scene06-sculptural-cast-r10','format':'SC07:20-byte header, float32 position/normal/uv, uint32 triangle indices','variants':{},'visualAccepted':False}
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
    group=obj.vertex_groups.new(name='R10-natural-throat-transition')
    center=2.265 if variant=='central' else 2.5596;radius=.090 if variant=='central' else .082
    for v in obj.data.vertices:
        x,y,z=v.co;weight=math.exp(-((y-center)/radius)**4)*(1-max(0,min(1,(abs(x)-.21)/.13)))
        if weight>.005:group.add([v.index],weight,'REPLACE')
    relax=obj.modifiers.new('Sculpt a continuous jaw-to-throat bearing','SMOOTH');relax.factor=.55;relax.iterations=12;relax.vertex_group=group.name
    bpy.ops.object.modifier_apply(modifier=relax.name)
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

provenance={'asset':'scene06-sculptural-cast-r10','createdUtc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'method':'R10 source-led face/orbital/lip/jaw/submental-return mesh sculpture, higher flared clavicular bearing and hierarchical nonrepeating drapery. Editable procedural body/cloth and signed-distance hands with genuine CC0 structured-light head anatomy retargeted and actually sculpted toward the reference cheeks, jaw, forehead and downcast lids. The full-figure museum pose is not substituted. Each closed neckline, head, body, robe and newly cupped hands are physically voxel-unioned, gently relaxed, and decimated. No image projection, depth photograph mesh, AI frame, image plane, photographic texture, or source RGB used.','reference':'references/hd/4-照片-5.jpg, visual proportion/pose comparison only','anatomicalBase':'assets/cc0-fralin-buddha-head/provenance.json','referenceLandmarkGuide':'reconstructions/scene-06/modeling/scene06-r10-sculpture-landmarks.json','referenceLandmarkGuideSha256':hashlib.sha256((ROOT/'reconstructions/scene-06/modeling/scene06-r10-sculpture-landmarks.json').read_bytes()).hexdigest(),'source':source['source'],'sourceSha256':source['sourceSha256'],'generator':'reconstructions/scene-06/modeling/build-sculptural-cast-r10.mjs','fuser':'reconstructions/scene-06/modeling/fuse-sculptural-cast-r10.py','fuserSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'blenderVersion':bpy.app.version_string,'headMeshSculpture':head_sculpt_log,'voxelSizeModelUnits':.0045,'decimateRatio':.36,'elapsedSeconds':time.time()-started,'visualAccepted':False,'limits':['A valid connected cast mesh does not establish a photo match.','The anatomical source is a different historical artifact, retargeted as a real 3D modeling base; it is not claimed as a scan of the photographed statue.','Voxel union may soften features finer than 4.5mm in pre-conversion model units.','The indoor light field and carved mandorlas remain separate reconstruction candidates.']}
temporary=OUT/'provenance.json.tmp';temporary.write_text(json.dumps(provenance,indent=2));os.replace(temporary,OUT/'provenance.json')
temporary=OUT/'manifest.json.tmp';temporary.write_text(json.dumps(manifest,indent=2));os.replace(temporary,OUT/'manifest.json')
print(json.dumps({'event':'cast-assets-written','out':str(OUT),'elapsedSeconds':time.time()-started}),flush=True)
