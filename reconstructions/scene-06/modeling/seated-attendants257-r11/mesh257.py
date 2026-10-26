"""Pure CPU closed surface construction. No image, viewport, bake or scene export."""
import bpy,bmesh,math,struct,array,gzip,hashlib
from pathlib import Path
from mathutils import Vector,Matrix

TAU=2*math.pi
def clamp(x,a=0,b=1): return max(a,min(b,x))
def smooth(x):
    t=clamp(x); return t*t*t*(t*(6*t-15)+10)
def bell(x,w): return math.exp(-(x/w)**2)
def wrapped(a): return math.atan2(math.sin(a),math.cos(a))

def object_mesh(name,vertices,faces):
    me=bpy.data.meshes.new(name);me.from_pydata(vertices,[],faces);me.update()
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob)
    for p in me.polygons:p.use_smooth=True
    return ob

def read_sc07(path,name,expected):
    raw=Path(path).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=expected:raise RuntimeError('Input SHA differs '+str(path))
    magic,n,ni,_,_=struct.unpack_from('<4sIIII',raw)
    if magic!=b'SC07' or len(raw)!=20+n*32+ni*4:raise RuntimeError('Invalid actual SC07')
    p=array.array('f');p.frombytes(raw[20:20+n*12]);ix=array.array('I');ix.frombytes(raw[20+n*32:])
    me=bpy.data.meshes.new(name);me.vertices.add(n);me.vertices.foreach_set('co',p);me.loops.add(ni);me.loops.foreach_set('vertex_index',ix);me.polygons.add(ni//3);me.polygons.foreach_set('loop_start',range(0,ni,3));me.polygons.foreach_set('loop_total',[3]*(ni//3));me.update()
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob)
    return ob,dict(file=str(path),sha256=expected,vertices=n,triangles=ni//3)

def derive_local_neck(path,name,source_part,policy,out):
    # Separate licensed derivative: original source is read-only. Face/ear
    # protection, original topology/UV, and an exact attribute replay are kept.
    raw=Path(path).read_bytes();source_sha=hashlib.sha256(raw).hexdigest()
    if source_sha!=source_part['sha256']:raise RuntimeError('Original legal head source differs')
    magic,n,ni,_,_=struct.unpack_from('<4sIIII',raw)
    if magic!=b'SC07' or len(raw)!=20+n*32+ni*4:raise RuntimeError('Original head SC07 invalid')
    P=array.array('f');P.frombytes(raw[20:20+n*12]);N=array.array('f');N.frombytes(raw[20+n*12:20+n*24]);I=array.array('I');I.frombytes(raw[20+n*32:])
    coords=[Vector(P[i*3:i*3+3]) for i in range(n)];weights=[];protected=[];layout=None
    if policy.get('mode')=='authored-bridge-source-ancestry':
        start=policy['protectedScanVertices'];rows=policy['ringCount'];size=policy['ringSize'];cap=policy['baseVertices'];fixed=policy['fixedUpperRings']
        if n!=start+rows*size+cap or not (1<=fixed<rows-1):raise RuntimeError('Exact source authored-neck suffix differs')
        ys=[]
        for j in range(rows):
            y=P[(start+j*size)*3+1]
            if any(P[(start+j*size+k)*3+1]!=y for k in range(size)):raise RuntimeError('Original authored neck row is not constantY')
            ys.append(y)
        cap_start=start+rows*size;cap_y=P[cap_start*3+1]
        if any(P[i*3+1]!=cap_y for i in range(cap_start,n)) or not all(a>b for a,b in zip(ys,ys[1:])) or min(P[1:start*3:3])<=max(ys):raise RuntimeError('Original scan/regular-neck/base ancestry layout differs')
        weights=[0 if i<start else 1 for i in range(n)];protected=[i<start for i in range(n)];scale=policy['bottomRadialScale'];center_z=policy['centerZ']
        def tapered(p):return Vector((p.x*scale,p.y,center_z+(p.z-center_z)*scale))
        for i in range(cap_start,n):coords[i]=tapered(coords[i])
        top_row=fixed-1
        for j in range(fixed,rows):
            q=clamp((ys[top_row]-ys[j])/(ys[top_row]-ys[-1]));ease=policy.get('profileEase',1);t=(1-ease)*q+ease*smooth(q)
            for k in range(size):
                top=Vector(P[(start+top_row*size+k)*3:(start+top_row*size+k)*3+3]);bottom=tapered(Vector(P[(start+(rows-1)*size+k)*3:(start+(rows-1)*size+k)*3+3]));i=start+j*size+k
                coords[i].x=top.x+(bottom.x-top.x)*t;coords[i].z=top.z+(bottom.z-top.z)*t
        layout=dict(protectedScanVertices=start,authoredRingCount=rows,authoredRingSize=size,originalBaseVertices=cap,fixedUpperRingPositions=fixed,scanMinimumY=min(P[1:start*3:3]),authoredTopY=ys[0],authoredBottomY=ys[-1],baseY=cap_y,allSourceYUnchanged=True,sourceStructureVerified=True)
    else:
        for i,p in enumerate(coords):
            ear=(p.y>=policy['earMinimumY'] and abs(p.x)>=policy['earMinimumAbsX'] and p.z<=policy['earMaximumZ'])
            wy=1-smooth((p.y-policy['fullNeckY'])/(policy['maximumNeckY']-policy['fullNeckY']))
            free=max(smooth((policy['earMinimumAbsX']-abs(p.x))/policy['earMarginX']),smooth((p.z-policy['earMaximumZ'])/policy['earMarginZ']),smooth((policy['earMinimumY']-p.y)/policy['earMarginY']))
            w=0 if ear or p.y>=policy['maximumNeckY'] else wy*free
            weights.append(w);protected.append(w==0)
            if w:
                factor=1-policy['baseRadialReduction']*w;p.x*=factor;p.z=policy['centerZ']+(p.z-policy['centerZ'])*factor
        active=[i for i,w in enumerate(weights) if w>0];neighbors={i:set() for i in active}
        for q in range(0,ni,3):
            a,b,c=I[q:q+3]
            if weights[a]:neighbors[a].update((b,c))
            if weights[b]:neighbors[b].update((a,c))
            if weights[c]:neighbors[c].update((a,b))
        for _ in range(policy['smoothPairs']):
            for coefficient in [policy['lambda'],policy['mu']]:
                updates=[]
                for i in active:
                    ns=neighbors[i]
                    if not ns:raise RuntimeError('Neck vertex lacks original neighbors')
                    cap_gate=smooth((P[i*3+1]-policy['smoothingCapMinY'])/(policy['smoothingCapFullY']-policy['smoothingCapMinY']))
                    cx=sum(coords[j].x for j in ns)/len(ns);cz=sum(coords[j].z for j in ns)/len(ns);w=coefficient*weights[i]*cap_gate
                    updates.append((i,coords[i].x+(cx-coords[i].x)*w,coords[i].z+(cz-coords[i].z)*w))
                for i,x,z in updates:coords[i].x=x;coords[i].z=z
    active=[i for i,w in enumerate(weights) if w>0]
    newP=array.array('f',P)
    for i in active:newP[i*3]=coords[i].x;newP[i*3+2]=coords[i].z
    ob,info=read_sc07(path,name,source_sha);ob.data.vertices.foreach_set('co',newP);ob.data.update()
    for f in ob.data.polygons:f.use_smooth=True
    ob.data.update()
    newN=array.array('f',N)
    for i in active:newN[i*3:i*3+3]=array.array('f',ob.data.vertices[i].normal)
    changed=[i for i in active if any(newP[i*3+k]!=P[i*3+k] or newN[i*3+k]!=N[i*3+k] for k in range(3))]
    bm=bmesh.new();bm.from_mesh(ob.data);boundary=sum(e.is_boundary for e in bm.edges);nonmanifold=sum(not e.is_manifold for e in bm.edges);volume=bm.calc_volume(signed=True);bm.free()
    flipped=0;zero_area=0;changed_set=set(changed)
    for q in range(0,ni,3):
        ids=I[q:q+3]
        if not any(i in changed_set for i in ids):continue
        a,b,c=[Vector(P[i*3:i*3+3]) for i in ids];aa,bb,cc=[Vector(newP[i*3:i*3+3]) for i in ids];old=(b-a).cross(c-a);new=(bb-aa).cross(cc-aa)
        if new.length<1e-12:zero_area+=1
        if old.dot(new)<=0:flipped+=1
    protected_ids=[i for i,p in enumerate(protected) if p]
    def protected_bytes(p,norm):return b''.join(struct.pack('<6f',*(p[i*3:i*3+3]+norm[i*3:i*3+3])) for i in protected_ids)
    protected_original=protected_bytes(P,N);protected_derived=protected_bytes(newP,newN)
    max_delta=max((Vector(newP[i*3:i*3+3])-Vector(P[i*3:i*3+3])).length for i in changed) if changed else 0
    normal_error=max(abs(Vector(newN[i*3:i*3+3]).length-1) for i in changed) if changed else 0
    raw_out=bytearray(raw);raw_out[20:20+n*12]=newP.tobytes();raw_out[20+n*12:20+n*24]=newN.tobytes()
    trace=struct.pack('<4sIIII',b'NP25',1,n,len(changed),32)+b''.join(struct.pack('<I7f',i,*newP[i*3:i*3+3],*newN[i*3:i*3+3],weights[i]) for i in changed)
    replay=bytearray(raw)
    for i,x,y,z,nx,ny,nz,w in struct.iter_unpack('<I7f',trace[20:]):struct.pack_into('<3f',replay,20+i*12,x,y,z);struct.pack_into('<3f',replay,20+n*12+i*12,nx,ny,nz)
    valid=(len(changed)>100 and not boundary and not nonmanifold and volume>0 and not flipped and not zero_area and max_delta<=policy['maximumDisplacement'] and normal_error<1e-4 and protected_original==protected_derived and replay==raw_out and all(math.isfinite(x) for x in newP) and all(math.isfinite(x) for x in newN))
    suffix='' if valid else '-FAILED';packed=gzip.compress(bytes(raw_out),compresslevel=7,mtime=0);h=hashlib.sha256(packed).hexdigest();file=name+suffix+'-'+h[:16]+'-gzip.bin';trace_packed=gzip.compress(trace,compresslevel=7,mtime=0);trace_sha=hashlib.sha256(trace_packed).hexdigest();trace_file=name+'-source-ancestry-'+trace_sha[:16]+'-gzip.bin'
    for filename,data in [(file,packed),(trace_file,trace_packed)]:
        target=Path(out)/filename
        if target.exists():raise RuntimeError('Preserve previous derived output')
        target.write_bytes(data)
    ancestry=dict(status='validated-local-neck-derivative' if valid else 'rejected-all-output-preserved',originalHeadFile=source_part['file'],originalHeadSha256=source_sha,originalLegalAssetPreserved=True,originalTriangleIndexBytesUnchanged=True,originalNeutralUVBytesUnchanged=True,originalIndexSha256=hashlib.sha256(raw[20+n*32:]).hexdigest(),originalUvSha256=hashlib.sha256(raw[20+n*24:20+n*32]).hexdigest(),faceEarProtectedDataUnchanged=protected_original==protected_derived,protectedVertices=len(protected_ids),protectedPositionNormalSha256=hashlib.sha256(protected_original).hexdigest(),changedVertices=len(changed),maximumDisplacement=max_delta,maximumUnitNormalError=normal_error,sourceYUnchanged=True,policy=policy,trace=dict(file=trace_file,sha256=trace_sha,compression='gzip',format='NP25 header20:magic,version,sourceVertexCount,changedCount,stride32; then uint32 originalVertexIndex,float32newXYZ,float32newNormalXYZ,float32weight. Exact replay onto original SC07 yields derived SC07; UV/index/header unchanged.'),exactAttributeReplay=replay==raw_out,topology=dict(boundaryEdges=boundary,nonManifoldEdges=nonmanifold,signedVolume=volume,flippedChangedTriangles=flipped,zeroAreaChangedTriangles=zero_area),faceNonRigidWarp=False,neckLocallyModified=True)
    if layout is not None:ancestry['exactSourceAuthoredNeckLayout']=layout
    import json
    (Path(out)/(name+'-derivation.json')).write_text(json.dumps(ancestry,indent=2)+'\n')
    if not valid:raise RuntimeError('Local neck repair rejected; every generated byte preserved '+str(ancestry))
    return dict(material='face',file=file,sha256=h,compression='gzip',uncompressedSha256=hashlib.sha256(raw_out).hexdigest(),vertices=n,triangles=ni//3,bytes=len(packed),uncompressedBytes=len(raw_out),bounds=[[min(newP[k::3]) for k in range(3)],[max(newP[k::3]) for k in range(3)]],neckDerivative=ancestry,topology=ancestry['topology'])

def keep_upper_body(ob,cut_y,remove_hand_y,remove_hand_z,shift_y,collar_recess=None,hand_x_ranges=None,hand_sign=1):
    bm=bmesh.new();bm.from_mesh(ob.data)
    # Remove the old high palm/finger lobes before retaining the upper torso.
    # The old pose's forearm dips below the retained region; largest-component
    # selection also removes any closed hand islands left by this real cut.
    old_hands=[v for v in bm.verts if v.co.y<remove_hand_y and v.co.z>remove_hand_z and (hand_x_ranges is None or any(a<=v.co.x*hand_sign<=b for a,b in hand_x_ranges))]
    if old_hands:bmesh.ops.delete(bm,geom=old_hands,context='VERTS')
    bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-7,plane_co=(0,cut_y,0),plane_no=(0,1,0),clear_inner=True,clear_outer=False)
    seen=set();components=[]
    for start in bm.verts:
        if start in seen:continue
        todo=[start];seen.add(start);part=[]
        while todo:
            v=todo.pop();part.append(v)
            for e in v.link_edges:
                q=e.other_vert(v)
                if q not in seen:seen.add(q);todo.append(q)
        components.append(part)
    components.sort(key=len,reverse=True)
    discard=[v for part in components[1:] for v in part]
    if discard:bmesh.ops.delete(bm,geom=discard,context='VERTS')
    boundary=[e for e in bm.edges if e.is_boundary]
    if boundary:bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
    if not bm.verts or min(v.co.y for v in bm.verts)<cut_y-1e-4:raise RuntimeError('Upper cut kept the wrong side')
    recessed=0
    for v in bm.verts:
        if collar_recess is not None and v.co.y>collar_recess['baseSourceY']:
            core=math.exp(-(v.co.x/collar_recess['neckWidth'])**4-((v.co.z-collar_recess['neckCenterZ'])/collar_recess['neckDepth'])**4)
            factor=collar_recess['outsideScale']+(1-collar_recess['outsideScale'])*core
            v.co.y=collar_recess['baseSourceY']+(v.co.y-collar_recess['baseSourceY'])*factor;recessed+=1
        v.co.y+=shift_y
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.normal_update();bm.to_mesh(ob.data);bm.free();ob.data.update()
    return dict(retainedUpperVertices=len(ob.data.vertices),oldHandVerticesRemoved=len(old_hands),oldHandSpatialXRanges=hand_x_ranges,oldHandSourceXSign=hand_sign,detachedVerticesRemoved=len(discard),cutSourceY=cut_y,rigidUpperTranslationY=shift_y,authoredCollarRecess=collar_recess,authoredCollarVerticesReshaped=recessed,legalScanHeadImported=False,legacyLowerLegsRetained=False)

def sample_rows(rows,y):
    if y<=rows[0][0]:return rows[0][1:]
    if y>=rows[-1][0]:return rows[-1][1:]
    for a,b in zip(rows,rows[1:]):
        if a[0]<=y<=b[0]:
            t=smooth((y-a[0])/(b[0]-a[0]));return [x+(z-x)*t for x,z in zip(a[1:],b[1:])]

def closed_loft(name,rows,nu=96,nv=128,cloth=True):
    p=[];f=[];lo,hi=rows[0][0],rows[-1][0]
    for j in range(nv+1):
        y=lo+(hi-lo)*j/nv;rx,rz,cz=sample_rows(rows,y)
        for i in range(nu):
            a=i/nu*TAU;x=math.sin(a)*rx;front=max(0,math.cos(a))
            relief=0
            if cloth:
                # A continuous garment carries the two knee bulges and upper
                # thigh bridges; the real bent limbs stay under this skin.
                # This avoids exposing a thick U-shaped cylindrical leg loop.
                knee=.48*bell(abs(x)-.72,.30)*bell(y-.80,.32)
                thigh=.15*bell(abs(x)-.48,.27)*bell(y-1.05,.28)
                relief+=(knee+thigh)*front
                relief-=.045*bell(x,.30)*bell(y-.82,.35)*front**2
                ridge_y=.38+.55*(abs(x)/.96)**.80
                relief+=(.040*bell(y-ridge_y,.065)-.014*bell(y-ridge_y-.080,.034))*front**2
                for side in [-1,1]:
                    line=side*(.17+.72*clamp((1.50-y)/1.15))
                    relief+=(.026*bell(x-line,.053)-.009*bell(x-line-side*.067,.027))*bell(y-.80,.62)*front**2
                relief+=.018*bell(x+.08,.045)*bell(y-1.12,.50)*front**2
            p.append((x,y,cz+math.cos(a)*rz+relief))
    for j in range(nv):
        for i in range(nu):
            a=j*nu+i;b=j*nu+(i+1)%nu;c=(j+1)*nu+i;d=(j+1)*nu+(i+1)%nu;f.extend([(a,b,c),(b,d,c)])
    bot=len(p);p.append((0,lo,rows[0][3]));top=len(p);p.append((0,hi,rows[-1][3]))
    for i in range(nu):f.extend([(bot,(i+1)%nu,i),(top,nv*nu+i,nv*nu+(i+1)%nu)])
    return object_mesh(name,p,f)

def catmull(points,t):
    n=len(points)-1;s=clamp(t)*n;i=min(n-1,int(s));u=s-i
    p0=Vector(points[max(0,i-1)]);p1=Vector(points[i]);p2=Vector(points[i+1]);p3=Vector(points[min(n,i+2)])
    return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u)

def sweep(name,points,radius,depth=None,segments=96,radial=40,cloth=False,taper=.0):
    depth=radius if depth is None else depth;p=[];f=[];last_u=None
    for j in range(segments+1):
        t=j/segments;c=catmull(points,t);d=catmull(points,min(1,t+.001))-catmull(points,max(0,t-.001));d.normalize()
        if last_u is None:
            ref=Vector((0,1,0)) if abs(d.y)<.92 else Vector((1,0,0));u=(ref-d*ref.dot(d)).normalized()
        else:u=(last_u-d*last_u.dot(d)).normalized()
        v=d.cross(u).normalized();last_u=u
        rr=(.90+.15*math.sin(math.pi*t))*(1-taper*t)
        for k in range(radial):
            a=k/radial*TAU;fold=0
            if cloth:
                fold=.026*bell(wrapped(a-(.45+1.1*t)),.23)*math.sin(math.pi*t)**1.2
                fold+=.017*bell(wrapped(a-(-1.15+.45*t)),.17)*bell(t-.45,.28)
                fold-=.007*bell(wrapped(a-(.71+1.1*t)),.12)*math.sin(math.pi*t)
            q=c+u*(math.cos(a)*(radius*rr+fold))+v*(math.sin(a)*(depth*rr+fold));p.append(tuple(q))
    for j in range(segments):
        for k in range(radial):
            a=j*radial+k;b=j*radial+(k+1)%radial;c=(j+1)*radial+k;d=(j+1)*radial+(k+1)%radial;f.extend([(a,b,c),(b,d,c)])
    bot=len(p);p.append(tuple(catmull(points,0)));top=len(p);p.append(tuple(catmull(points,1)))
    for k in range(radial):f.extend([(bot,(k+1)%radial,k),(top,segments*radial+k,segments*radial+(k+1)%radial)])
    return object_mesh(name,p,f)

def ellipsoid(name,center,radii,nu=48,nv=28):
    p=[(center[0],center[1]-radii[1],center[2])];f=[]
    for j in range(1,nv):
        lat=-math.pi/2+math.pi*j/nv
        for i in range(nu):
            a=TAU*i/nu;p.append((center[0]+radii[0]*math.cos(lat)*math.sin(a),center[1]+radii[1]*math.sin(lat),center[2]+radii[2]*math.cos(lat)*math.cos(a)))
    top=len(p);p.append((center[0],center[1]+radii[1],center[2]))
    for i in range(nu):f.append((0,1+(i+1)%nu,1+i))
    for j in range(nv-2):
        for i in range(nu):
            a=1+j*nu+i;b=1+j*nu+(i+1)%nu;c=a+nu;d=b+nu;f.extend([(a,b,c),(b,d,c)])
    for i in range(nu):f.append((top,1+(nv-2)*nu+i,1+(nv-2)*nu+(i+1)%nu))
    return object_mesh(name,p,f)

def mirror_objects(objects,sign):
    if sign==1:return
    for ob in objects:
        for v in ob.data.vertices:v.co.x*=-1
        bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free();ob.data.update()

def audit(ob,require_one=False):
    bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-7)
    loose=[v for v in bm.verts if not v.link_faces]
    if loose:bmesh.ops.delete(bm,geom=loose,context='VERTS')
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    if bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
    bm.normal_update();seen=set();count=0;component_bounds=[]
    for start in bm.verts:
        if start in seen:continue
        count+=1;stack=[start];seen.add(start);part=[]
        while stack:
            v=stack.pop();part.append(v)
            for e in v.link_edges:
                q=e.other_vert(v)
                if q not in seen:seen.add(q);stack.append(q)

        component_bounds.append(dict(vertices=len(part),min=[min(v.co[k] for v in part) for k in range(3)],max=[max(v.co[k] for v in part) for k in range(3)]))
    directions={}
    for face in bm.faces:
        for loop in face.loops:directions.setdefault(loop.edge,[]).append(1 if loop.vert==loop.edge.verts[0] else -1)
    winding=sum(len(a)==2 and a[0]==a[1] for a in directions.values())
    result=dict(vertices=len(bm.verts),faces=len(bm.faces),boundaryEdges=sum(e.is_boundary for e in bm.edges),nonManifoldEdges=sum(not e.is_manifold for e in bm.edges),components=count,componentBounds=sorted(component_bounds,key=lambda x:x['vertices'],reverse=True),inconsistentDirectedEdgeWinding=winding,signedVolume=bm.calc_volume(signed=True))
    if result['boundaryEdges'] or result['nonManifoldEdges'] or winding or (require_one and count!=1):raise RuntimeError('Closed source audit failed '+str(result))
    bm.to_mesh(ob.data);bm.free();ob.data.update()
    for p in ob.data.polygons:p.use_smooth=True
    return result

def clean_known_generated_body_shell(ob,voxel,policy):
    # Exact, body-stage-only cleanup of the independently verified internal
    # subvoxel eight-corner process residue. Never a scan/head/hand/crown rule.
    if ob.name not in policy['bodyNames']:return dict(removed=[],reason='not a permitted authored body stage')
    bm=bmesh.new();bm.from_mesh(ob.data);bm.verts.ensure_lookup_table();bm.verts.index_update();seen=set();parts=[]
    for start in bm.verts:
        if start in seen:continue
        part=[];todo=[start];seen.add(start)
        while todo:
            v=todo.pop();part.append(v)
            for e in v.link_edges:
                q=e.other_vert(v)
                if q not in seen:seen.add(q);todo.append(q)
        parts.append(part)
    parts.sort(key=len,reverse=True)
    if len(parts)==1:bm.free();return dict(removed=[],reason='body already single connected')
    if len(parts)!=2 or len(parts[0])<policy['minimumMainVertices']:bm.free();return dict(removed=[],reason='unexpected component layout; preserve all and reject')
    small=parts[1];verts=set(small);faces={f for v in small for f in v.link_faces};lo=[min(v.co[k] for v in small) for k in range(3)];hi=[max(v.co[k] for v in small) for k in range(3)]
    center=sum((v.co for v in small),Vector())/len(small);area=sum(f.calc_area() for f in faces);volume=0
    for f in faces:
        a=f.verts[0].co-center
        for j in range(1,len(f.verts)-1):volume+=a.dot((f.verts[j].co-center).cross(f.verts[j+1].co-center))/6
    qualified=(len(small)==8 and len(faces)==6 and all(len(f.verts)==4 for f in faces) and all(len(v.link_edges)==3 for v in small) and max(hi[k]-lo[k] for k in range(3))<=min(policy['maximumSpan'],voxel*.5) and area<=policy['maximumArea'] and abs(volume)<=policy['maximumAbsoluteVolume'] and all(lo[k]>=policy['regionMin'][k] and hi[k]<=policy['regionMax'][k] for k in range(3)) and hi[1]<policy['unscannedBodyMaxY'])
    if not qualified:bm.free();return dict(removed=[],reason='component fails exact generated-noise conditions; preserve and reject',bounds=[lo,hi],vertices=len(small),area=area,volume=volume)
    from mathutils.bvhtree import BVHTree
    main=parts[0];index={v:i for i,v in enumerate(main)};main_faces={f for v in main for f in v.link_faces};tree=BVHTree.FromPolygons([tuple(v.co) for v in main],[[index[v] for v in f.verts] for f in main_faces],all_triangles=False)
    direction=Vector((1,.000031,.000073)).normalized();origin=center.copy();hits=0
    for _ in range(128):
        location,normal,face,distance=tree.ray_cast(origin,direction,100)
        if location is None:break
        hits+=1;origin=location+direction*1e-6
    else:bm.free();return dict(removed=[],reason='inside test did not terminate; preserve and reject')
    if hits%2!=1:bm.free();return dict(removed=[],reason='not inside complete main body; preserve and reject',positiveRayHits=hits)
    record=dict(vertices=8,quadFaces=6,triangles=12,vertexIndices=[v.index for v in small],coordinates=[list(v.co) for v in small],bounds=[lo,hi],centroid=list(center),surfaceArea=area,stableSignedVolume=volume,voxelSize=voxel,positiveRayHits=hits,insideMain=True,sourceRegion='newly authored pelvis/thigh, below retained source upperY1.52; head is not imported into remesh and hands/crown do not yet exist',predicate=policy)
    # Remove only the verified algorithm-generated internal micro-shell.
    # Every meaningful source/posed part stays; final closed body1 is mandatory.
    bmesh.ops.delete(bm,geom=small,context='VERTS');bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.normal_update();bm.to_mesh(ob.data);bm.free();ob.data.update()
    return dict(removed=[record],reason='verified internal subvoxel process residue cleaned; outer body/source parts preserved')

def union_cpu(objects,name,voxel,smooth_factor=.20,smooth_iterations=2,failure_dir=None,body_cleanup=None):
    input_audits=[dict(name=ob.name,**audit(ob,True)) for ob in objects]
    bpy.ops.object.select_all(action='DESELECT')
    for ob in objects:ob.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();ob=objects[0];ob.name=name
    mod=ob.modifiers.new('CPU-voxel-solid-union','REMESH');mod.mode='VOXEL';mod.voxel_size=voxel;mod.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    if smooth_iterations:
        mod=ob.modifiers.new('restrained-CPU-surface-polish','SMOOTH');mod.factor=smooth_factor;mod.iterations=smooth_iterations;bpy.ops.object.modifier_apply(modifier=mod.name)
    cleanup=clean_known_generated_body_shell(ob,voxel,body_cleanup) if body_cleanup is not None else None
    result=audit(ob,False);result['inputClosedParts']=input_audits;result['generatedSubvoxelCleanup']=cleanup
    if result['components']!=1:
        # Keep every rejected component in a compact buffer for read-only
        # diagnosis. It is not a valid body or an installable candidate.
        if failure_dir is not None:
            failed=write_sc07(ob,failure_dir,name+'-FAILED-all-components','buddha')
            import json
            (Path(failure_dir)/(name+'-CPU-rejection.json')).write_text(json.dumps(dict(status='rejected-multiple-body-components',audit=result,allComponentsPreserved=failed,rendered=False,installed=False),indent=2)+chr(10))
        raise RuntimeError('One-body union failed; all components preserved '+str(result))
    return ob,result

def merge_closed(objects,name):
    for ob in objects:audit(ob)
    bpy.ops.object.select_all(action='DESELECT')
    for ob in objects:ob.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();ob=objects[0];ob.name=name;return ob,audit(ob)

def make_hand(name,kind,voxel,failure_dir=None):
    parts=[ellipsoid(name+'-palm',(0,0,0),(.090,.110,.044)),sweep(name+'-wrist',[(0,-.19,-.005),(0,-.08,0)],.048,.044,24,24)]
    if kind=='raised':
        fingers=[([(-.047,.057,.0),(-.055,.15,.008),(-.050,.233,.015)],.020), ([(.0,.070,0),(.0,.18,.002),(.006,.250,.018)],.021), ([(.043,.060,0),(.053,.145,.035),(.044,.186,.080)],.020), ([(.077,.040,0),(.092,.105,.042),(.070,.130,.095)],.017), ([(-.070,-.034,.010),(-.131,.012,.035),(-.110,.071,.077),(-.058,.085,.092)],.025)]
    else:
        fingers=[([(-.047,.057,.0),(-.060,.146,.025),(-.047,.170,.095)],.021), ([(.0,.070,0),(.0,.168,.040),(.006,.172,.114)],.022), ([(.043,.060,0),(.058,.140,.050),(.047,.130,.120)],.020), ([(.077,.040,0),(.100,.095,.055),(.080,.085,.115)],.018), ([(-.070,-.034,.010),(-.132,.014,.044),(-.098,.080,.098),(-.048,.085,.110)],.025)]
    for i,(points,r) in enumerate(fingers):parts.append(sweep(name+'-finger-'+str(i),points,r,r*.88,36,20,taper=.23))
    return union_cpu(parts,name,voxel,.14,2,failure_dir)

def transform_hand(ob,position,tilt_x,tilt_z,sign):
    matrix=Matrix.Rotation(tilt_z,4,'Z')@Matrix.Rotation(tilt_x,4,'X')
    for v in ob.data.vertices:
        p=matrix@v.co;p.x*=sign;v.co=Vector((position[0]*sign,position[1],position[2]))+p
    if sign<0:
        bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free()
    ob.data.update();return audit(ob,True)

def band(name,radius,y,height,thickness,cz=-.025,nu=96):
    p=[];f=[];section=[(radius-thickness,y-height/2),(radius+thickness,y-height/2),(radius+thickness,y+height/2),(radius-thickness,y+height/2)]
    for i in range(nu):
        a=i/nu*TAU
        for r,h in section:p.append((math.sin(a)*r,h,cz+math.cos(a)*r))
    for i in range(nu):
        for j in range(4):a=4*i+j;b=4*((i+1)%nu)+j;c=4*i+(j+1)%4;d=4*((i+1)%nu)+(j+1)%4;f.extend([(a,b,c),(b,d,c)])
    return object_mesh(name,p,f)

def crown_leaf(name,angle,height,width,base_y=3.035,radius=.283,rows=40,cols=18):
    p=[];f=[];front=[];back=[]
    for skin in [0,1]:
        lines=[]
        for j in range(rows+1):
            t=j/rows;ids=[];us=[0] if j in [0,rows] else [i/cols*2-1 for i in range(cols+1)]
            for u in us:
                w=width*math.sin(math.pi*t)**.72;rad=radius+.035*math.sin(math.pi*t)+(.008 if skin==0 else -.008)
                x=math.sin(angle)*rad+math.cos(angle)*u*w;z=-.025+math.cos(angle)*rad-math.sin(angle)*u*w
                ids.append(len(p));p.append((x,base_y+height*t,z))
            lines.append(ids)
        tri=lambda a,b,c:f.append((a,b,c) if skin==0 else (a,c,b))
        for i in range(cols):tri(lines[0][0],lines[1][i],lines[1][i+1])
        for j in range(1,rows-1):
            for i in range(cols):a=lines[j][i];b=lines[j][i+1];c=lines[j+1][i];d=lines[j+1][i+1];tri(a,c,b);tri(b,c,d)
        for i in range(cols):tri(lines[-2][i],lines[-1][0],lines[-2][i+1])
        per=[lines[0][0]]+[r[-1] for r in lines[1:-1]]+[lines[-1][0]]+[r[0] for r in lines[1:-1][::-1]]
        (front if skin==0 else back).extend(per)
    for i,a in enumerate(front):j=(i+1)%len(front);f.extend([(a,front[j],back[i]),(front[j],back[j],back[i])])
    return object_mesh(name,p,f)

def write_sc07(ob,out,name,material):
    topology=audit(ob);me=ob.data;me.calc_loop_triangles();P=array.array('f');N=array.array('f');UV=array.array('f');I=array.array('I')
    for v in me.vertices:
        if not all(math.isfinite(x) for x in v.co):raise RuntimeError('Nonfinite authored position')
        P.extend(v.co);N.extend(v.normal);UV.extend((.5,.5))
    for t in me.loop_triangles:I.extend(t.vertices)
    raw=struct.pack('<4sIIII',b'SC07',len(me.vertices),len(I),0,0)+P.tobytes()+N.tobytes()+UV.tobytes()+I.tobytes();packed=gzip.compress(raw,compresslevel=7,mtime=0);h=hashlib.sha256(packed).hexdigest();file=name+'-'+h[:16]+'-gzip.bin';target=Path(out)/file
    if target.exists():raise RuntimeError('Preserve authored output '+str(target))
    target.write_bytes(packed);bounds=[[min(v.co[k] for v in me.vertices) for k in range(3)],[max(v.co[k] for v in me.vertices) for k in range(3)]]
    return dict(material=material,file=file,sha256=h,compression='gzip',uncompressedSha256=hashlib.sha256(raw).hexdigest(),vertices=len(me.vertices),triangles=len(I)//3,bytes=len(packed),uncompressedBytes=len(raw),bounds=bounds,topology=topology)

def bearing_profile(ob,raw_sha,scale,band_height=.04):
    points=[tuple(v.co) for v in ob.data.vertices if v.co.y<=band_height]
    points=sorted(set((round(x,6),round(z,6),round(y,6)) for x,y,z in points))
    def cross(a,b,c):return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
    low=[];high=[]
    for q in points:
        while len(low)>1 and cross(low[-2],low[-1],q)<=0:low.pop()
        low.append(q)
    for q in points[::-1]:
        while len(high)>1 and cross(high[-2],high[-1],q)<=0:high.pop()
        high.append(q)
    hull=low[:-1]+high[:-1]
    if len(hull)<8:raise RuntimeError('New real hem contour too sparse')
    if not all(cross(a,b,(0,0,0))>1e-9 for a,b in zip(hull,hull[1:]+hull[:1])):raise RuntimeError('Actual low-hem contour does not enclose the lotus origin; preserve and reject')
    return dict(sourceBufferSha256=raw_sha,scale=scale,outlineXYZ=[[x,y,z] for x,z,y in hull],actualLowHemBandHeight=band_height,actualSamplePoints=len(points),originStrictlyInsideActualHull=True,meaning='Convex actual low-hem support contour from the new closed seated body, Y<='+str(band_height)+' modelunits. Every hull coordinate is an actual body vertex; strict enclosed-origin check prevents a forward-only folded-foot contour. Source body is not scaled to an old standing hem; folded calves and skirt carry the real bearing.')

def front_sampler6(objects):
    # Snapshot only torso/shoulders/hips before union. Foreground bare arms do
    # not pull the clothing over themselves when sampled from the front.
    from mathutils.bvhtree import BVHTree
    p=[];f=[]
    for ob in objects:
        offset=len(p);p.extend(tuple(v.co) for v in ob.data.vertices);f.extend([offset+int(i) for i in q.vertices] for q in ob.data.polygons)
    tree=BVHTree.FromPolygons(p,f,all_triangles=False)
    def sample(x,y):
        hit,normal,face,distance=tree.ray_cast(Vector((x,y,3)),Vector((0,0,-1)),6)
        if hit is None:raise RuntimeError('Actual torso cloth carrier missed '+str((x,y)))
        return hit.z
    return sample

def anatomical_loft7(name,rows,nu=112,nv=144):
    # Shape-preserving C1 radius interpolation. The rejected per-span smooth
    # step forced a zero tangent at every neck row and made visible terraces.
    def slope(i,k):
        if i==0:return (rows[1][k]-rows[0][k])/(rows[1][0]-rows[0][0])
        if i==len(rows)-1:return (rows[-1][k]-rows[-2][k])/(rows[-1][0]-rows[-2][0])
        a=(rows[i][k]-rows[i-1][k])/(rows[i][0]-rows[i-1][0]);b=(rows[i+1][k]-rows[i][k])/(rows[i+1][0]-rows[i][0])
        if a*b<=0:return 0
        ha=rows[i][0]-rows[i-1][0];hb=rows[i+1][0]-rows[i][0]
        return (ha+hb)/(ha/a+hb/b)
    def sample(y):
        i=min(len(rows)-2,next((i for i in range(len(rows)-1) if y<=rows[i+1][0]),len(rows)-2));a,b=rows[i:i+2];h=b[0]-a[0];t=clamp((y-a[0])/h)
        return [(2*t**3-3*t*t+1)*a[k]+(t**3-2*t*t+t)*h*slope(i,k)+(-2*t**3+3*t*t)*b[k]+(t**3-t*t)*h*slope(i+1,k) for k in [1,2,3]]
    p=[];f=[];lo,hi=rows[0][0],rows[-1][0]
    for j in range(nv+1):
        y=lo+(hi-lo)*j/nv;rx,rz,cz=sample(y)
        if rx<=0 or rz<=0:raise RuntimeError('Anatomical radius must remain positive')
        for i in range(nu):a=i/nu*TAU;p.append((math.sin(a)*rx,y,cz+math.cos(a)*rz))
    for j in range(nv):
        for i in range(nu):a=j*nu+i;b=j*nu+(i+1)%nu;c=a+nu;d=b+nu;f.extend([(a,b,c),(b,d,c)])
    bot=len(p);p.append((0,lo,rows[0][3]));top=len(p);p.append((0,hi,rows[-1][3]))
    for i in range(nu):f.extend([(bot,(i+1)%nu,i),(top,nv*nu+i,nv*nu+(i+1)%nu)])
    return object_mesh(name,p,f)

def cloth_patch6(name,fn,thickness=.012,nu=56,nv=84):
    # Real two-sided thin solid, including all four curved edge walls.
    p=[];faces=[];stride=(nu+1)*(nv+1)
    for skin in [0,1]:
        for j in range(nv+1):
            for i in range(nu+1):
                x,y,z=fn(i/nu*2-1,j/nv);p.append((x,y,z+(1 if skin==0 else -1)*thickness/2))
        for j in range(nv):
            for i in range(nu):
                a=skin*stride+j*(nu+1)+i;b=a+1;c=a+nu+1;d=c+1
                faces.extend([(a,b,c),(b,d,c)] if skin==0 else [(a,c,b),(b,c,d)])
    edge=list(range(nu+1))+[j*(nu+1)+nu for j in range(1,nv+1)]+[nv*(nu+1)+i for i in range(nu-1,-1,-1)]+[j*(nu+1) for j in range(nv-1,0,-1)]
    for a,b in zip(edge,edge[1:]+edge[:1]):faces.extend([(a,a+stride,b),(b,a+stride,b+stride)])
    return object_mesh(name,p,faces)

def knee_drape6(name,rows,side,thickness=.012,nu=96,nv=112):
    # A genuine hollow cloth wall around one bent leg, not a filled bell skirt.
    p=[];faces=[];stride=nu*(nv+1);lo,hi=rows[0][0],rows[-1][0]
    for skin in [0,1]:
        for j in range(nv+1):
            y=lo+(hi-lo)*j/nv;rx,rz,cz,cx=sample_rows(rows,y);rx-=skin*thickness;rz-=skin*thickness
            for i in range(nu):
                a=i/nu*TAU;t=j/nv;front=max(0,math.cos(a));fold=(.022*bell(wrapped(a-(.2+.9*t)),.20)+.015*bell(wrapped(a+.7-.4*t),.17))*math.sin(math.pi*t)
                fold+=(.023*bell(y-(.38+.43*math.sin(a)**2),.057)-.007*bell(y-(.46+.43*math.sin(a)**2),.032))*front**2
                p.append((side*(cx+math.sin(a)*rx),y,cz+math.cos(a)*rz+fold*front))
        for j in range(nv):
            for i in range(nu):
                a=skin*stride+j*nu+i;b=skin*stride+j*nu+(i+1)%nu;c=a+nu;d=b+nu
                faces.extend([(a,b,c),(b,d,c)] if skin==0 else [(a,c,b),(b,c,d)])
    for j in [0,nv]:
        for i in range(nu):
            a=j*nu+i;b=j*nu+(i+1)%nu;c=a+stride;d=b+stride;faces.extend([(a,c,b),(b,c,d)] if j==0 else [(a,b,c),(b,d,c)])
    ob=object_mesh(name,p,faces);audit(ob,True);return ob

def layered_robes6(variant,front,rows,hip_rows,lap_front=None,wide_v_pelvic=False):
    garments=[]
    def bodice(u,v):
        x=u*(.40-.035*v);top=1.90+.19*abs(u)**1.7;bottom=1.16+.10*u-.05*(1-u*u);y=top+(bottom-top)*v
        f=.025*bell(y-(1.78+.34*abs(u)**1.7),.040)+.020*bell(y-(1.57+.43*abs(u)**1.6),.041)
        for k in [-1,0,1]:f+=.022*bell(x-(.10+.11*k-.27*(1.8-y)),.037)*bell(y-1.38,.36)
        tuck=smooth((v-.84)/.16)
        return x,y,front(x,y)+.025+f-.055*tuck
    garments.append(cloth_patch6(variant+'-thin-open-neck-bodice',bodice))
    for k in [0,1]:
        def collar(u,v,k=k):
            x=.39*u;curve=(1.87-.12*k)+(.20+.10*k)*abs(u)**1.7;y=curve+(v-.5)*(.055 if k else .075)
            return x,y,front(x,y)+.037+.018*math.sin(math.pi*v)
        garments.append(cloth_patch6(variant+'-hanging-U-neck-fold-'+str(k),collar,.010,64,16))
    for k in [0,1]:
        def waist(u,v,k=k):
            x=.37*u;y=1.23+.14*(u if k==0 else -u)-.11*k+(v-.5)*.12
            return x,y,front(x,y)+.036+.025*math.sin(math.pi*v)-.040*abs(u)**8
        garments.append(cloth_patch6(variant+'-overlapping-diagonal-waist-fold-'+str(k),waist,.012,64,20))
    def lap(u,v):
        if wide_v_pelvic:
            if lap_front is None:raise RuntimeError('Actual pelvis/inner-knee support required for V cloth')
            x=u*(.34+.16*smooth(v/.45)+.02*math.sin(math.pi*v));top=1.36+.06*u;hem=.26+.18*abs(u)**.8+.015*u;y=top+(hem-top)*v
            support=lap_front(x,y);fold=0
            for base,height,width,center,curve in [(1.14,.016,.100,.12,.18),(.87,.020,.110,-.08,.20),(.56,.016,.090,.15,.13)]:
                line=base+curve*(math.sqrt((u-center)**2+.22**2)-.22)+.045*u
                fold+=(height*bell(y-line,width)-.005*bell(y-line+.100,.065))*math.sin(math.pi*v)**.65
            gather=-.18-.20*v+.07*math.sin(math.pi*v)
            fold+=(.011*bell(x-gather,.090)-.003*bell(x-gather-.10,.065))*math.sin(math.pi*v)**.7
            z=support+.020+fold-.045*abs(u)**8
            if v<.22:z=support-.025+(z-support+.025)*smooth(v/.22)
            return x,y,z
        c=catmull([(.15,1.43,.20),(.10,1.25,.30),(0,1.02,.38),(-.10,.72,.42),(-.17,.43,.35),(-.15,.22,.27)],v)
        x=c.x+u*(.22*(1-.40*v)+.08*math.sin(math.pi*v));y=c.y+.035*u*math.sin(math.pi*v)+.080*abs(u)**.7*smooth((v-.8)/.2)
        support=lap_front(x,y) if lap_front is not None else c.z
        z=support+.025+.030*bell(u-(.25-.35*v),.18)-.008*bell(u-(.43-.35*v),.08)+.018*bell(u+.44+.15*v,.14)-.020*abs(u)**6
        if v<.22:z+=(front(x,y)-.025-z)*(1-smooth(v/.22))
        return x,y,z
    garments.append(cloth_patch6(variant+('-supported-thin-V-pelvic-inner-knee-drape' if wide_v_pelvic else '-layered-pointed-lap-sash'),lap,.014,80 if wide_v_pelvic else 64,112))
    def rear_mantle(u,v):
        a=math.pi+u*math.pi/2;y=.25+1.06*v+.018*math.sin(3*u)*(1-v)**3;rx,rz,cz=sample_rows(hip_rows,y)
        fold=.020*math.sin(4*math.pi*u+.8*v)**2*math.sin(math.pi*v)
        return math.sin(a)*(rx+.020+fold),y,cz+math.cos(a)*(rz+.020+fold)
    garments.append(cloth_patch6(variant+'-thin-rear-hip-mantle',rear_mantle,.014,64,88))
    for side in [-1,1]:
        garments.append(knee_drape6(variant+'-individual-thin-knee-drape-'+str(side),rows,side))
        def shawl(u,v,side=side):
            x=side*(.42+.20*math.sin(math.pi*v*.8)+u*(.06+.07*math.sin(math.pi*v)))
            y=2.10-.64*v+.08*u*v+.040*math.sin(2*math.pi*u)*v*v
            z=-.035+.19*v-.10*u+.023*math.sin(3*math.pi*u+.8*v)*math.sin(math.pi*v)
            return x,y,z
        garments.append(cloth_patch6(variant+'-back-side-shoulder-drape-curved-hem-'+str(side),shawl,.013,36,88))
    return garments

def anatomical_hand6(name,kind,voxel,out):
    parts=[ellipsoid(name+'-metacarpal-palm',(0,0,0),(.094,.112,.048)),ellipsoid(name+'-thenar',(-.063,-.025,.020),(.052,.066,.040)),sweep(name+'-wrist',[(0,-.17,-.005),(0,-.075,0)],.053,.047,24,24)]
    if kind=='raised':
        fingers=[([(-.048,.054,0),(-.054,.130,.010),(-.047,.205,.021)],.027), ([(0,.066,0),(.001,.149,.008),(.008,.222,.025)],.028), ([(.044,.058,0),(.057,.125,.044),(.041,.157,.094)],.027), ([(.077,.035,0),(.098,.091,.043),(.074,.111,.103)],.024), ([(-.068,-.035,.012),(-.126,.014,.044),(-.095,.075,.091),(-.049,.080,.105)],.031)]
    else:
        fingers=[([(-.048,.053,0),(-.061,.119,.029),(-.042,.137,.108)],.028), ([(0,.066,0),(.002,.136,.045),(.011,.137,.126)],.029), ([(.044,.055,0),(.061,.114,.052),(.042,.098,.131)],.027), ([(.077,.035,0),(.103,.083,.054),(.078,.062,.123)],.025), ([(-.068,-.035,.012),(-.126,.014,.048),(-.094,.070,.105),(-.044,.074,.118)],.031)]
    for i,(path,r) in enumerate(fingers):
        parts.append(sweep(name+'-segmented-phalanges-'+str(i),path,r,r*.82,42,24,taper=.22))
        for j,p in enumerate(path[1:]):parts.append(ellipsoid(name+'-joint-pad-'+str(i)+'-'+str(j),p,(r*(.94-.10*j),r*(1.08-.12*j),r*.80),24,16))
    return union_cpu(parts,name,voxel,.12,2,out)

def open_crown_flame6(name,angle,height,width,base_y,radius=.30,n=64):
    p=[];faces=[]
    for skin in [0,1]:
        for inner in [0,1]:
            for i in range(n):
                a=i/n*TAU;t=.5+.5*math.cos(a);yy=base_y+height*(.18+.64*t if inner else t);u=width*(.48 if inner else 1)*math.sin(a)*abs(math.sin(a))**.12
                rr=radius+.032*math.sin(math.pi*((yy-base_y)/height))+(.008 if skin==0 else -.008)
                p.append((math.sin(angle)*rr+math.cos(angle)*u,yy,-.025+math.cos(angle)*rr-math.sin(angle)*u))
        for i in range(n):
            j=(i+1)%n;a=skin*2*n+i;b=skin*2*n+j;c=a+n;d=b+n;faces.extend([(a,b,c),(b,d,c)] if skin==0 else [(a,c,b),(b,c,d)])
    for loop in [0,1]:
        for i in range(n):
            j=(i+1)%n;a=loop*n+i;b=loop*n+j;c=a+2*n;d=b+2*n;faces.extend([(a,c,b),(b,c,d)] if loop==0 else [(a,b,c),(b,d,c)])
    ob=object_mesh(name,p,faces);audit(ob,True);return ob

def bearing_many6(objects,source_hashes,scale,band_height=.10):
    # Measure the actual low robe + physical feet together, not a nominal disk.
    points=[]
    for ob in objects:points.extend(tuple(v.co) for v in ob.data.vertices if v.co.y<=band_height)
    points=sorted(set((round(x,6),round(z,6),round(y,6)) for x,y,z in points));cross=lambda a,b,c:(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);lo=[];hi=[]
    for q in points:
        while len(lo)>1 and cross(lo[-2],lo[-1],q)<=0:lo.pop()
        lo.append(q)
    for q in points[::-1]:
        while len(hi)>1 and cross(hi[-2],hi[-1],q)<=0:hi.pop()
        hi.append(q)
    hull=lo[:-1]+hi[:-1]
    if len(hull)<8 or not all(cross(a,b,(0,0,0))>1e-9 for a,b in zip(hull,hull[1:]+hull[:1])):raise RuntimeError('Actual new body/robe bearing does not enclose origin')
    combined=hashlib.sha256(('\0'.join(source_hashes)).encode()).hexdigest()
    return dict(sourceBufferSha256=combined,sourceComponentGeometrySha256=source_hashes,scale=scale,outlineXYZ=[[x,y,z] for x,z,y in hull],actualLowHemBandHeight=band_height,actualSamplePoints=len(points),originStrictlyInsideActualHull=True,attendants257=True,meaning='Actual low vertices of new anatomical body/feet and separate closed thin robe solids. Combined source hash identifies both geometries; no nominal circle/standing compression.')

def boundary_loop8(vertices,faces):
    uses={}
    for f in faces:
        for a,b in zip(f,f[1:]+f[:1]):
            key=tuple(sorted((a,b)));uses.setdefault(key,[]).append((a,b))
    edges=[v[0] for v in uses.values() if len(v)==1];adj={}
    for a,b in edges:adj.setdefault(a,[]).append(b);adj.setdefault(b,[]).append(a)
    if not adj or any(len(v)!=2 for v in adj.values()):raise RuntimeError('Neck cut must be a simple manifold loop')
    first=min(adj);loop=[];previous=None;current=first
    while True:
        if current in loop:raise RuntimeError('Neck loop self repeats')
        loop.append(current);options=adj[current];nxt=options[0] if options[0]!=previous else options[1];previous,current=current,nxt
        if current==first:break
    if len(loop)!=len(adj):raise RuntimeError('Multiple neck cut loops; preserve/reject')
    area=sum(vertices[a].x*vertices[b].z-vertices[b].x*vertices[a].z for a,b in zip(loop,loop[1:]+loop[:1]))
    if area<0:loop.reverse()
    center=sum((vertices[i] for i in loop),Vector())/len(loop)
    anchor=min(range(len(loop)),key=lambda k:abs(math.atan2(vertices[loop[k]].x-center.x,vertices[loop[k]].z-center.z)))
    return loop[anchor:]+loop[:anchor],center

def weld_actual_scan_neck8(body,path,source_part,raw_translation,cut_y,policy):
    # Remove only the obsolete authored neck/cap, retain every real scanned
    # vertex and source-face triangle. The scan cut loop is topology-derived.
    original_body_data=body.data.copy();raw=Path(path).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=source_part['sha256']:raise RuntimeError('Original scan source changed')
    _,n,ni,_,_=struct.unpack_from('<4sIIII',raw);prefix=policy['scanPrefixVertices']
    P=array.array('f');P.frombytes(raw[20:20+n*12]);N=array.array('f');N.frombytes(raw[20+n*12:20+n*24]);I=array.array('I');I.frombytes(raw[20+n*32:]);UV=raw[20+n*24:20+n*32]
    scan_p=[Vector((P[i*3],P[i*3+1]+raw_translation,P[i*3+2])) for i in range(prefix)]
    scan_f=[tuple(I[q:q+3]) for q in range(0,ni,3) if max(I[q:q+3])<prefix]
    head_loop,hc=boundary_loop8(scan_p,scan_f)
    if len(head_loop)!=policy['expectedScanCutLoopVertices']:raise RuntimeError('Actual scan neck loop differs from audited source')
    if max(scan_p[i].y for i in head_loop)-min(scan_p[i].y for i in head_loop)>1e-5:raise RuntimeError('Source neck cut is not the actual original plane')
    bm=bmesh.new();bm.from_mesh(body.data);bm.verts.ensure_lookup_table();bm.verts.index_update()
    snap_distance=policy.get('bodyCutPlaneSnapDistance',0)
    if not 0<=snap_distance<=.000002:raise RuntimeError('Only the reviewed micro-scale authored-body cut snap is allowed')
    cut_snaps=[]
    for v in bm.verts:
        if 0<abs(v.co.y-cut_y)<=snap_distance:
            before=list(v.co);v.co.y=cut_y;cut_snaps.append(dict(preweldBodyVertexIndex=v.index,originalPosition=before,snappedPosition=list(v.co)))
    bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-7,plane_co=(0,cut_y,0),plane_no=(0,1,0),clear_outer=True,clear_inner=False)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-7);bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.normal_update();bm.verts.ensure_lookup_table();bm.verts.index_update()
    loose=[v for v in bm.verts if not v.link_faces]
    if loose:bmesh.ops.delete(bm,geom=loose,context='VERTS');bm.verts.ensure_lookup_table();bm.verts.index_update();bm.normal_update()
    bp=[v.co.copy() for v in bm.verts];bf=[tuple(v.index for v in f.verts) for f in bm.faces];bm.free()
    body_loop,bc=boundary_loop8(bp,bf)
    if abs(max(bp[i].y for i in body_loop)-cut_y)>1e-5 or abs(min(bp[i].y for i in body_loop)-cut_y)>1e-5:raise RuntimeError('Body neck cut produced unexpected boundary')
    vertices=scan_p+bp;faces=list(scan_f)+[tuple(prefix+i for i in f) for f in bf];bottom_loop=[prefix+i for i in body_loop]
    def parameterize(loop):
        distance=[0]
        for a,b in zip(loop,loop[1:]+loop[:1]):distance.append(distance[-1]+(vertices[b]-vertices[a]).length)
        return [d/distance[-1] for d in distance]
    hp=parameterize(head_loop);bottom_params=parameterize(bottom_loop)
    def sample_point(loop,params,t):
        import bisect
        j=min(len(loop)-1,bisect.bisect_right(params,t)-1);u=(t-params[j])/(params[j+1]-params[j]);a=loop[j];b=loop[(j+1)%len(loop)]
        return vertices[a].lerp(vertices[b],u)
    def zipper(upper,up,lower,lp):
        i=j=0
        while i<len(upper) or j<len(lower):
            a=upper[i%len(upper)];b=lower[j%len(lower)];ta=up[i+1] if i<len(upper) else math.inf;tb=lp[j+1] if j<len(lower) else math.inf
            if abs(ta-tb)<1e-9:
                c=upper[(i+1)%len(upper)];d=lower[(j+1)%len(lower)];faces.extend([(a,c,b),(c,d,b)]);i+=1;j+=1
            elif ta<tb:faces.append((a,upper[(i+1)%len(upper)],b));i+=1
            else:faces.append((a,lower[(j+1)%len(lower)],b));j+=1
    count=policy['bridgeColumns'];rows=policy['bridgeRows'];uniform=[i/count for i in range(count+1)];rings=[]
    position_sigma=policy['angularPositionSigmaColumns'];residual_span=policy['sourceCutResidualBlendFraction']
    if policy['bridgeMode']!='monotone-radial-contraction' or not (0<position_sigma<=12 and .1<=residual_span<=.5):raise RuntimeError('Explicit bounded monotone bridge required')
    top_points=[sample_point(head_loop,hp,k/count) for k in range(count)];bottom_points=[sample_point(bottom_loop,bottom_params,k/count) for k in range(count)]
    head_radii=[Vector((a.x-hc.x,0,a.z-hc.z)).length for a in top_points];body_radii=[Vector((b.x-bc.x,0,b.z-bc.z)).length for b in bottom_points]
    if any(a<=b for a,b in zip(head_radii,body_radii)):raise RuntimeError('Measured cut contours do not permit an inward-only neck; preserve and review')
    def cyclic_gaussian(values,sigma):
        radius=math.ceil(3*sigma);weights=[(j,math.exp(-.5*(j/sigma)**2)) for j in range(-radius,radius+1)];total=sum(w for j,w in weights)
        return [sum((values[(k+j)%count]*w for j,w in weights),Vector())/total for k in range(count)]
    coarse_top=cyclic_gaussian(top_points,position_sigma);previous_radii=list(head_radii);clamped_samples=0
    bridge_start=len(vertices)
    for j in range(1,rows+1):
        t=j/(rows+1);ring=[]
        for k in range(count):
            original_top=top_points[k];a=coarse_top[k];b=bottom_points[k];center=hc.lerp(bc,t)
            p=a.lerp(b,t)+(original_top-a)*(1-smooth(t/residual_span));radial=Vector((p.x-center.x,0,p.z-center.z));radius=radial.length
            fitted=max(body_radii[k],min(previous_radii[k],radius));clamped_samples+=abs(fitted-radius)>1e-9
            if radius<=0:raise RuntimeError('New neck radial direction collapsed')
            radial*=fitted/radius;p.x=center.x+radial.x;p.z=center.z+radial.z;p.y=original_top.y+(b.y-original_top.y)*t;previous_radii[k]=fitted
            ring.append(len(vertices));vertices.append(p)
        rings.append(ring)
    zipper(head_loop,hp,rings[0],uniform)
    for a,b in zip(rings,rings[1:]):zipper(a,uniform,b,uniform)
    zipper(rings[-1],uniform,bottom_loop,bottom_params)
    joined=object_mesh(body.name+'-actual-scan-neck-weld',vertices,faces);bpy.data.objects.remove(body,do_unlink=True)
    source=dict(raw=raw,P=P,N=N,UV=UV,scanFaces=scan_f,prefix=prefix,boundary=sorted(head_loop),sourcePart=source_part,rawTranslation=raw_translation,bodyCutY=cut_y,bodyCutVertices=len(body_loop),bridgeColumns=count,bridgeRows=rows,originalBodyData=original_body_data,bodyCutPlaneSnap=dict(maximumPermittedDistance=snap_distance,snappedVertices=cut_snaps,scanVerticesTouched=0))
    source['newBridgeFairing']=dict(bridgeMode=policy['bridgeMode'],angularPositionSigmaColumns=position_sigma,sourceCutResidualBlendFraction=residual_span,newBridgeStartVertex=bridge_start,newBridgeVertices=count*rows,sourceScanPositionsChanged=0,onlyNewBridgeVerticesFaired=True,headCenterXZ=[hc.x,hc.z],bodyCenterXZ=[bc.x,bc.z],bodyCutVertexIndices=sorted(bottom_loop),headSampleRadii=head_radii,bodySampleRadii=body_radii,radialClampedSamples=clamped_samples,meaning='No cut-normal tangent extrapolation. Only new bridge samples are constrained to monotone radial contraction about the linearly interpolated actual cut centers. Original scan positions/faces and all other body positions stay exact.')
    return joined,source

def write_welded_scan8(ob,out,name,source,ground_shift):
    # No remesh/weld/normal rewrite of the identifiable scan surface. Only its
    # true neck-cut boundary normals are recomputed by the continuous skin.
    bm=bmesh.new();bm.from_mesh(ob.data);bm.normal_update();seen=set();components=0
    for v in bm.verts:
        if v in seen:continue
        components+=1;stack=[v];seen.add(v)
        while stack:
            a=stack.pop()
            for e in a.link_edges:
                b=e.other_vert(a)
                if b not in seen:seen.add(b);stack.append(b)
    winding=0
    for e in bm.edges:
        dirs=[1 if l.vert==e.verts[0] else -1 for f in e.link_faces for l in f.loops if l.edge==e]
        winding+=len(dirs)==2 and dirs[0]==dirs[1]
    topology=dict(vertices=len(bm.verts),faces=len(bm.faces),components=components,boundaryEdges=sum(e.is_boundary for e in bm.edges),nonManifoldEdges=sum(not e.is_manifold for e in bm.edges),inconsistentDirectedEdgeWinding=winding,signedVolume=bm.calc_volume(signed=True));bm.free()
    me=ob.data;me.calc_loop_triangles();P=array.array('f');N=array.array('f');UV=array.array('f');I=array.array('I');prefix=source['prefix'];boundary=set(source['boundary']);translation=source['rawTranslation']+ground_shift
    original_uv=array.array('f');original_uv.frombytes(source['UV'])
    for i,v in enumerate(me.vertices):
        if i<prefix:P.extend((source['P'][i*3],source['P'][i*3+1]+translation,source['P'][i*3+2]));UV.extend(original_uv[i*2:i*2+2])
        else:P.extend(v.co);UV.extend((.5,.5))
        N.extend(source['N'][i*3:i*3+3] if i<prefix and i not in boundary else v.normal)
    for t in me.loop_triangles:I.extend(t.vertices)
    face_i=array.array('I',[i for f in source['scanFaces'] for i in f]);face_exact=I[:len(face_i)]==face_i;zero_area=0
    for q in range(0,len(I),3):
        a,b,c=[Vector(P[I[q+k]*3:I[q+k]*3+3]) for k in range(3)]
        if (b-a).cross(c-a).length<1e-12:zero_area+=1
    topology['zeroAreaTriangles']=zero_area
    fair=source['newBridgeFairing'];previous=list(fair['headSampleRadii']);radial_violations=0;maximum_outward_step=0;epsilon=.0000002
    for j in range(source['bridgeRows']):
        t=(j+1)/(source['bridgeRows']+1);cx=fair['headCenterXZ'][0]*(1-t)+fair['bodyCenterXZ'][0]*t;cz=fair['headCenterXZ'][1]*(1-t)+fair['bodyCenterXZ'][1]*t
        for k in range(source['bridgeColumns']):
            i=fair['newBridgeStartVertex']+j*source['bridgeColumns']+k;r=math.hypot(P[i*3]-cx,P[i*3+2]-cz);maximum_outward_step=max(maximum_outward_step,r-previous[k])
            if r>previous[k]+epsilon or r<fair['bodySampleRadii'][k]-epsilon:radial_violations+=1
            previous[k]=r
    fair.update(serializedRadialMonotoneViolations=radial_violations,maximumSerializedOutwardStep=maximum_outward_step,radialFloatTolerance=epsilon)
    unit_error=max(abs(Vector(N[i:i+3]).length-1) for i in range(0,len(N),3));valid=components==1 and not any(topology[k] for k in ['boundaryEdges','nonManifoldEdges','inconsistentDirectedEdgeWinding','zeroAreaTriangles']) and topology['signedVolume']>0 and face_exact and not radial_violations and unit_error<1e-4 and all(math.isfinite(v) for v in P)
    raw=struct.pack('<4sIIII',b'SC07',len(me.vertices),len(I),0,0)+P.tobytes()+N.tobytes()+UV.tobytes()+I.tobytes();packed=gzip.compress(raw,compresslevel=7,mtime=0);h=hashlib.sha256(packed).hexdigest();file=name+('' if valid else '-FAILED')+'-'+h[:16]+'-gzip.bin';Path(out,file).write_bytes(packed)
    edited=[i for i in source['boundary'] if N[i*3:i*3+3].tobytes()!=source['N'][i*3:i*3+3].tobytes()]
    protected_n=b''.join(source['N'][i*3:i*3+3].tobytes() for i in range(prefix) if i not in boundary)
    ancestry=dict(originalHeadFile=source['sourcePart']['file'],originalHeadSha256=source['sourcePart']['sha256'],originalLegalAssetPreserved=True,scanPrefixVertices=prefix,scanPrefixIndexOffset=0,allActualScanPositionsRigidOnly=True,appliedModelTranslation=[0,translation,0],positionPrefixSha256=hashlib.sha256(P[:prefix*3].tobytes()).hexdigest(),sourceScanFaceTriangles=len(face_i)//3,sourceScanFaceTriangleSha256=hashlib.sha256(face_i.tobytes()).hexdigest(),allOriginalScanFaceTrianglesRetainedExact=face_exact,sourceFaceUvPrefixSha256=hashlib.sha256(original_uv[:prefix*2].tobytes()).hexdigest(),actualNeckCutNormalEditableIndices=source['boundary'],actualNeckCutNormalsModifiedIndices=edited,protectedFaceEarNormalsOutsideNeckCount=prefix-len(boundary),protectedFaceEarNormalSha256=hashlib.sha256(protected_n).hexdigest(),removedOnlyOldAuthoredNeckAndBase=True,removedOldAuthoredSuffixVertices=9368,bodyNeckCutRawY=source['bodyCutY'],bodyNeckCutVertices=source['bodyCutVertices'],newBridgeRows=source['bridgeRows'],newBridgeColumns=source['bridgeColumns'],bridgeConstruction=fair['bridgeMode'],singleContinuousClosedSkin=True,topology=topology,maximumUnitNormalError=unit_error)
    ancestry['status']='validated-continuous-scan-body-skin' if valid else 'rejected-full-combined-skin-and-original-input-preserved';ancestry['singleContinuousClosedSkin']=valid
    ancestry['authoredBodyCutPlaneSnap257']={**source['bodyCutPlaneSnap'],'preweldInput':source['preweldInput'],'preweldInputDirectory':'preweld-inputs','preweldInputArchiveRelativeToRepository':source['preweldInputArchiveRelativeToRepository'],'meaning':'Only new authored-body vertices near its cut plane are snapped; true source scan positions and the724normal mask are separate and unchanged. Complete preweld input remains in its stated source archive, not a runtime asset.'}
    ancestry['newBridgeFairing257']=source['newBridgeFairing']
    import json
    Path(out,name+'-scan-weld-ancestry.json').write_text(json.dumps(ancestry,indent=2)+'\n')
    if not valid:
        old=bpy.data.objects.new(name+'-FAILED-original-preweld-body',source['originalBodyData']);bpy.context.collection.objects.link(old);write_sc07(old,out,name+'-FAILED-original-preweld-body','buddha')
        raise RuntimeError('Actual scan/body weld rejected, complete failedskin and preweld input preserved '+str(ancestry))
    bpy.data.meshes.remove(source['originalBodyData'])
    return dict(material='buddha',file=file,sha256=h,compression='gzip',uncompressedSha256=hashlib.sha256(raw).hexdigest(),vertices=len(me.vertices),triangles=len(I)//3,bytes=len(packed),uncompressedBytes=len(raw),bounds=[[min(P[k::3]) for k in range(3)],[max(P[k::3]) for k in range(3)]],topology=topology,sourceScanPrefix257=ancestry)

def nc_hand_input11(path,definition):
    packed=Path(path).read_bytes()
    if hashlib.sha256(packed).hexdigest()!=definition['sha256']:raise RuntimeError('Exact existing NC hand source changed')
    raw=gzip.decompress(packed) if definition.get('compression')=='gzip' else packed
    if hashlib.sha256(raw).hexdigest()!=definition['uncompressedSha256']:raise RuntimeError('NC decoded source changed')
    magic,n,ni,_,_=struct.unpack_from('<4sIIII',raw)
    if magic!=b'SC07' or len(raw)!=20+n*32+ni*4:raise RuntimeError('NC source SC07 invalid')
    values=[]
    for start,end,kind in [(20,20+n*12,'f'),(20+n*12,20+n*24,'f'),(20+n*24,20+n*32,'f'),(20+n*32,len(raw),'I')]:
        a=array.array(kind);a.frombytes(raw[start:end]);values.append(a)
    return dict(P=values[0],N=values[1],UV=values[2],I=values[3],n=n,triangles=ni//3,definition=definition,path=str(path))

def extract_nc_hand11(source,kind,policy,out):
    # This is an explicitly intended source-hand extraction, not a body
    # largest-component cleanup. Its exact source-ID mask is independently pinned.
    P,N,UV,I,n=[source[k] for k in ['P','N','UV','I','n']];spec=policy['components'][kind];origin=spec['planeOrigin'];normal=spec['planeNormal'];offset=spec['offset'];roi=spec['roi']
    signed=lambda i:sum((P[i*3+k]-origin[k])*normal[k] for k in range(3))-offset
    parent=array.array('i',[-1])*n;active=[]
    for i in range(n):
        if all(roi[0][k]<P[i*3+k]<roi[1][k] for k in range(3)) and signed(i)>0:parent[i]=i;active.append(i)
    def root(i):
        while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
        return i
    for q in range(0,len(I),3):
        a,b,c=I[q:q+3]
        if parent[a]<0 and parent[b]<0 and parent[c]<0:continue
        for x,y in [(a,b),(b,c),(c,a)]:
            if parent[x]>=0 and parent[y]>=0:
                x,y=root(x),root(y)
                if x!=y:parent[y]=x
    seed=spec['seedVertex']
    if parent[seed]<0:raise RuntimeError('Actual source palm seed outside the measured wrist region')
    component=root(seed);core=[i for i in active if root(i)==component];core.sort();core_array=array.array('I',core)
    if len(core)!=spec['expectedCoreVertices'] or hashlib.sha256(core_array.tobytes()).hexdigest()!=spec['expectedCoreIndexSha256']:raise RuntimeError('Measured complete source-hand component differs')
    selected=bytearray(n)
    for i in core:selected[i]=1
    retained=[];crossed=[];roi_faces=[];roi_ids=set()
    for q in range(0,len(I),3):
        a,b,c=I[q:q+3];count=selected[a]+selected[b]+selected[c]
        if not count:continue
        roi_faces.append(q//3);roi_ids.update((a,b,c))
        (retained if count==3 else crossed).append(q//3)
    original_faces=array.array('I',retained)
    if len(retained)!=spec['expectedSourceTriangles'] or hashlib.sha256(original_faces.tobytes()).hexdigest()!=spec['expectedSourceTriangleIndexSha256']:raise RuntimeError('Original retained hand triangles differ')
    # Preserve the compact, uncut original-source ROI before any authoring.
    diagnostic=Path(out)/'preweld-inputs';diagnostic.mkdir(exist_ok=True);roi_ids=sorted(roi_ids);roi_map={g:i for i,g in enumerate(roi_ids)};rp=array.array('f');rn=array.array('f');ru=array.array('f');ri=array.array('I')
    for i in roi_ids:rp.extend(P[i*3:i*3+3]);rn.extend(N[i*3:i*3+3]);ru.extend(UV[i*2:i*2+2])
    for t in roi_faces:ri.extend(roi_map[i] for i in I[t*3:t*3+3])
    raw=struct.pack('<4sIIII',b'SC07',len(roi_ids),len(ri),0,0)+rp.tobytes()+rn.tobytes()+ru.tobytes()+ri.tobytes();packed=gzip.compress(raw,compresslevel=7,mtime=0);roi_sha=hashlib.sha256(packed).hexdigest();roi_file=kind+'-original-NC-hand-ROI-'+roi_sha[:16]+'-gzip.bin';(diagnostic/roi_file).write_bytes(packed)
    mapping={g:i for i,g in enumerate(core)};vertices=[Vector(P[i*3:i*3+3]) for i in core];faces=[tuple(mapping[i] for i in I[t*3:t*3+3]) for t in retained];cut_cache={};cut_records=[];clipped_parents=[]
    def intersection(a,b):
        if a>b:a,b=b,a
        key=(a,b)
        if key in cut_cache:return cut_cache[key]
        da,db=signed(a),signed(b);t=-da/(db-da)
        if not 0<t<1:raise RuntimeError('Actual wrist intersection outside original source edge')
        point=Vector(tuple(P[a*3+k]+(P[b*3+k]-P[a*3+k])*t for k in range(3)))
        i=len(vertices);vertices.append(point);cut_cache[key]=i;cut_records.append((a,b,t));return i
    for t in crossed:
        ids=list(I[t*3:t*3+3]);polygon=[]
        for a,b in zip(ids,ids[1:]+ids[:1]):
            aa,bb=signed(a)>0,signed(b)>0
            if aa and a not in mapping or bb and b not in mapping:raise RuntimeError('Source ROI omitted a connected original hand vertex')
            if aa and bb:polygon.append(mapping[b])
            elif aa and not bb:polygon.append(intersection(a,b))
            elif not aa and bb:polygon.extend((intersection(a,b),mapping[b]))
        for j in range(1,len(polygon)-1):faces.append((polygon[0],polygon[j],polygon[j+1]));clipped_parents.append(t)
    loop,unused=boundary_loop8(vertices,faces)
    if len(loop)!=spec['expectedCutEdges'] or len(cut_records)!=len(loop) or any(i<len(core) for i in loop):raise RuntimeError('Real wrist must have the measured single source-edge cut loop')
    length=0;center=Vector()
    for a,b in zip(loop,loop[1:]+loop[:1]):
        w=(vertices[b]-vertices[a]).length;center+=(vertices[a]+vertices[b])*(.5*w);length+=w
    center/=length
    if (center-Vector(spec['cutCentroid'])).length>2e-6:raise RuntimeError('Measured source wrist centroid differs')
    return dict(kind=kind,vertices=vertices,faces=faces,core=core,retained=retained,cutRecords=cut_records,clippedParents=clipped_parents,loop=loop,cutCenter=list(center),cutPerimeter=length,source=source,policy=spec,roiInput=dict(file='preweld-inputs/'+roi_file,archiveRelativeToRepository='lookdev/scene06-attendants257/'+Path(out).name+'/preweld-inputs/'+roi_file,sha256=roi_sha,vertices=len(roi_ids),triangles=len(ri)//3,meaning='Original complete compact hand ROI, intentionally open; no authored positions; retained at the stated source archive, not installed as runtime geometry.'))

def source_frame11(finger,palm):
    y=Vector(finger).normalized();z=Vector(palm);z=(z-y*z.dot(y)).normalized();x=y.cross(z).normalized()
    return Matrix((x,y,z)).transposed()

def pose_nc_hand11(base,name,target,uniform_scale,body_tree,out):
    # Source palm/finger vertices remain an exact uniform-scale/rigid anatomy
    # component. Only the measured wrist cut and hidden connector are authored.
    R=source_frame11(target['fingerAxis'],target['palmNormal'])@source_frame11(base['policy']['fingerAxis'],base['policy']['palmNormal']).transposed()
    if abs(R.determinant()-1)>1e-5 or not .5<=uniform_scale<=1:raise RuntimeError('Proper rigid anatomy frame and bounded uniform scale required')
    rows=[list(row) for row in R];origin=base['cutCenter'];body_end=Vector(target['bodyArmEnd']);body_inner=Vector(target['bodyArmPrevious']);direction=(body_end-body_inner).normalized();center=body_end-direction*target['wristInset'];T=list(center)
    affine=lambda p:tuple(uniform_scale*(rows[r][0]*(float(p[0])-origin[0])+rows[r][1]*(float(p[1])-origin[1])+rows[r][2]*(float(p[2])-origin[2]))+T[r] for r in range(3))
    vertices=[Vector(affine(p)) for p in base['vertices']];faces=list(base['faces']);loop=base['loop'];normal_source=Vector(base['policy']['planeNormal']).normalized();u_source=(Vector((1,0,0))-normal_source*normal_source.x).normalized();v_source=normal_source.cross(u_source).normalized();normal_pose=(R@normal_source).normalized();turn=normal_pose.rotation_difference(direction);u_end=turn@(R@u_source);v_end=turn@(R@v_source)
    relative=base['vertices'][loop[0]]-Vector(origin);phase=math.atan2(relative.dot(u_source),relative.dot(v_source));distance=[0]
    for a,b in zip(loop,loop[1:]+loop[:1]):distance.append(distance[-1]+(base['vertices'][b]-base['vertices'][a]).length)
    endpoint=[]
    for k in range(len(loop)):
        a=phase+TAU*distance[k]/distance[-1];endpoint.append(body_inner+u_end*(math.sin(a)*target['innerRadiusX'])+v_end*(math.cos(a)*target['innerRadiusZ']))
    adapter_start=len(vertices);previous=loop;adapter_rows=target['adapterRows'];minimum_below=math.inf
    for j in range(1,adapter_rows+1):
        t=j/adapter_rows;ring=[]
        for k,i in enumerate(loop):
            p=vertices[i].lerp(endpoint[k],t);minimum_below=min(minimum_below,-(p-center).dot(normal_pose));ring.append(len(vertices));vertices.append(p)
        for k,a in enumerate(previous):
            nxt=(k+1)%len(loop);faces.extend(((a,previous[nxt],ring[k]),(previous[nxt],ring[nxt],ring[k])))
        previous=ring
    cap=len(vertices);vertices.append(body_inner)
    for k,a in enumerate(previous):faces.append((cap,a,previous[(k+1)%len(loop)]))
    outside=0;minimum_inside=math.inf
    for p in [vertices[i] for i in previous]+[body_inner]:
        co,no,triangle,distance=body_tree.find_nearest(p)
        signed=(p-co).dot(no) if co is not None else math.inf;minimum_inside=min(minimum_inside,-signed)
        if signed>=-1e-5:outside+=1
    ob=object_mesh(name,vertices,faces)
    return ob,dict(base=base,rotation=rows,uniformScale=uniform_scale,sourceOrigin=origin,targetOrigin=T,target=target,adapterStart=adapter_start,adapterRows=adapter_rows,adapterEndRing=previous,adapterMinimumBelowSourceCutPlane=minimum_below,adapterEndOutsideActualParentBody=outside,minimumEndInsideDistance=minimum_inside)

def write_nc_hand11(ob,out,name,context):
    base=context['base'];source=base['source'];core=base['core'];count=len(core);me=ob.data;me.calc_loop_triangles();P=array.array('f');N=array.array('f');UV=array.array('f');I=array.array('I');R=context['rotation']
    for i,v in enumerate(me.vertices):
        P.extend(v.co)
        if i<count:N.extend(R[r][0]*source['N'][core[i]*3]+R[r][1]*source['N'][core[i]*3+1]+R[r][2]*source['N'][core[i]*3+2] for r in range(3));UV.extend(source['UV'][core[i]*2:core[i]*2+2])
        else:N.extend(v.normal);UV.extend((.5,.5))
    for t in me.loop_triangles:I.extend(t.vertices)
    bm=bmesh.new();bm.from_mesh(me);seen=set();components=0
    for v in bm.verts:
        if v in seen:continue
        components+=1;stack=[v];seen.add(v)
        while stack:
            a=stack.pop()
            for e in a.link_edges:
                b=e.other_vert(a)
                if b not in seen:seen.add(b);stack.append(b)
    winding=0
    for e in bm.edges:
        directions=[1 if l.vert==e.verts[0] else -1 for f in e.link_faces for l in f.loops if l.edge==e];winding+=len(directions)==2 and directions[0]==directions[1]
    topology=dict(vertices=len(bm.verts),faces=len(bm.faces),components=components,boundaryEdges=sum(e.is_boundary for e in bm.edges),nonManifoldEdges=sum(not e.is_manifold for e in bm.edges),inconsistentDirectedEdgeWinding=winding,signedVolume=bm.calc_volume(signed=True));bm.free();zero=0
    for q in range(0,len(I),3):
        a,b,c=[Vector(P[I[q+k]*3:I[q+k]*3+3]) for k in range(3)]
        if (b-a).cross(c-a).length<1e-12:zero+=1
    topology['zeroAreaTriangles']=zero;normal_error=max(abs(Vector(N[i:i+3]).length-1) for i in range(0,len(N),3));valid=components==1 and not any(topology[k] for k in ['boundaryEdges','nonManifoldEdges','inconsistentDirectedEdgeWinding','zeroAreaTriangles']) and topology['signedVolume']>0 and normal_error<1e-4 and all(math.isfinite(x) for x in P) and context['adapterMinimumBelowSourceCutPlane']>1e-7 and context['adapterEndOutsideActualParentBody']==0
    raw=struct.pack('<4sIIII',b'SC07',len(me.vertices),len(I),0,0)+P.tobytes()+N.tobytes()+UV.tobytes()+I.tobytes();packed=gzip.compress(raw,compresslevel=7,mtime=0);h=hashlib.sha256(packed).hexdigest();file=name+('' if valid else '-FAILED')+'-'+h[:16]+'-gzip.bin';Path(out,file).write_bytes(packed)
    trace=struct.pack('<4s7I',b'HA11',1,count,len(base['retained']),len(base['cutRecords']),len(base['clippedParents']),context['adapterRows'],len(base['loop']))+array.array('I',core).tobytes()+array.array('I',base['retained']).tobytes()+b''.join(struct.pack('<IId',a,b,t) for a,b,t in base['cutRecords'])+array.array('I',base['clippedParents']).tobytes();tp=gzip.compress(trace,compresslevel=7,mtime=0);th=hashlib.sha256(tp).hexdigest();tf=name+'-actual-source-ancestry-'+th[:16]+'-gzip.bin';Path(out,tf).write_bytes(tp)
    ancestry=dict(status='validated-real-source-hand-and-hidden-wrist-adapter' if valid else 'rejected-full-hand-and-input-preserved',sourceAsset=source.get('assetRelativePath',source['path']),sourcePackedSha256=source['definition']['sha256'],sourceDecodedSha256=source['definition']['uncompressedSha256'],sourceHandKind=base['kind'],sourceCoreVertices=count,sourceCoreTriangles=len(base['retained']),sourceCoreVertexIndexSha256=hashlib.sha256(array.array('I',core).tobytes()).hexdigest(),sourceOriginalTriangleIndexSha256=hashlib.sha256(array.array('I',base['retained']).tobytes()).hexdigest(),policy=base['policy'],sourceOrigin=context['sourceOrigin'],rotationMatrix3x3=R,uniformScale=context['uniformScale'],targetOrigin=context['targetOrigin'],sourceCorePAndNExactAffine=True,sourceCoreUVExact=True,clippedSourceFaces=len(base['clippedParents']),actualSourceEdgeCutVertices=len(base['cutRecords']),cutInterpolantsRoundedFloat32BeforeAffine=True,actualCutLoopVertices=len(base['loop']),authoredWristAdapterVertexRange=[context['adapterStart'],len(me.vertices)-1],wristAdapterRows=context['adapterRows'],target=context['target'],adapterEndRingIndices=context['adapterEndRing'],adapterMinimumBelowSourceCutPlane=context['adapterMinimumBelowSourceCutPlane'],adapterEndOutsideActualParentBody=context['adapterEndOutsideActualParentBody'],minimumEndInsideDistance=context['minimumEndInsideDistance'],sourceROIInput=base['roiInput'],trace=dict(file=tf,sha256=th,compression='gzip',format='HA11v1 32byteheader coreIDs/retainedTriangleIDs/cutEdgeIIdrecords/clippedParentTriangleIDs'),license='CC-BY-NC-SA-4.0',noSyntheticFingerPrimitives=True,photographicFidelityAccepted=False)
    import json
    ancestry['actualParentBodyContainmentSourceSha256']=context['actualParentBodyContainmentSourceSha256']
    Path(out,name+'-derivation.json').write_text(json.dumps(ancestry,indent=2)+'\n')
    if not valid:raise RuntimeError('Actual source hand rejected; complete hand/input/ancestry preserved '+str(topology))
    return dict(material='hand',file=file,sha256=h,compression='gzip',uncompressedSha256=hashlib.sha256(raw).hexdigest(),vertices=len(me.vertices),triangles=len(I)//3,bytes=len(packed),uncompressedBytes=len(raw),bounds=[[min(P[k::3]) for k in range(3)],[max(P[k::3]) for k in range(3)]],topology=topology,sourceHandAnatomy11=ancestry)

def build_actual_source_hands11(lane,root,out,cfg):
    import json,copy,os
    from mathutils.bvhtree import BVHTree
    sha=lambda b:hashlib.sha256(b).hexdigest();parent=cfg['geometryReuseParent'];spec=cfg['actualSourceHands11'];parent_dir=Path(lane)/('authored-'+parent['revision'])
    if parent['revision']!='r10':raise RuntimeError('Only the actual reviewed immutable R10 baseline is reused')
    mb=(parent_dir/'manifest.json').read_bytes();gb=(parent_dir/'geometry-report.json').read_bytes()
    if sha(mb)!=parent['manifestSha256'] or sha(gb)!=parent['geometryReportSha256']:raise RuntimeError('Exact reviewed R10 geometry metadata changed')
    original=json.loads(mb);manifest=copy.deepcopy(original);report=copy.deepcopy(json.loads(gb));source_dir=Path(root)/'reconstructions/scene-06/assets'/spec['assetDirectory'];source_manifest_bytes=(source_dir/'manifest.json').read_bytes()
    if sha(source_manifest_bytes)!=spec['manifestSha256']:raise RuntimeError('Exact existing NC adaptation manifest changed')
    source_manifest=json.loads(source_manifest_bytes);definition=source_manifest['variants']['central'][0]
    if definition['sha256']!=spec['packedSha256'] or definition['uncompressedSha256']!=spec['rawSha256']:raise RuntimeError('NC source definition differs')
    source=nc_hand_input11(source_dir/definition['file'],definition);source['assetRelativePath']='reconstructions/scene-06/assets/'+spec['assetDirectory']+'/'+definition['file']
    bases={kind:extract_nc_hand11(source,kind,spec,out) for kind in ['positive','negative']};reused=[];all_hands={}
    for variant in ['left','right']:
        parts=[];old_parts=original['variants'][variant];body_part=next(p for p in old_parts if '-closed-seated-body-' in p['file']);body_bytes=(parent_dir/body_part['file']).read_bytes()
        if sha(body_bytes)!=body_part['sha256']:raise RuntimeError('Actual parent body changed before wrist containment test')
        body_raw=gzip.decompress(body_bytes);bn=struct.unpack_from('<I',body_raw,4)[0];bp=array.array('f');bp.frombytes(body_raw[20:20+bn*12]);bi=array.array('I');bi.frombytes(body_raw[20+bn*32:]);body_tree=BVHTree.FromPolygons([tuple(bp[q:q+3]) for q in range(0,len(bp),3)],[tuple(bi[q:q+3]) for q in range(0,len(bi),3)],all_triangles=True)
        authored_hands=[]
        for kind in ['near','outer']:
            target=spec['placements'][variant][kind];name=variant+'-actual-NC-'+kind+'-hand';ob,context=pose_nc_hand11(bases[target['sourceKind']],name,target,spec['uniformScale'],body_tree,out);context['actualParentBodyContainmentSourceSha256']=body_part['sha256'];hand=write_nc_hand11(ob,out,name,context);authored_hands.append(hand);bpy.data.objects.remove(ob,do_unlink=True)
        del body_tree,bp,bi,body_raw,body_bytes
        for p in old_parts:
            if p['material']=='hand':parts.extend(authored_hands);continue
            data=(parent_dir/p['file']).read_bytes()
            if sha(data)!=p['sha256'] or (parent_dir/p['file']).stat().st_mode&0o222:raise RuntimeError('Non-hand geometry may only reuse exact read-only R10 bytes')
            target=Path(out)/p['file']
            if not target.exists():os.link(parent_dir/p['file'],target)
            parts.append(copy.deepcopy(p));reused.append(dict(variant=variant,file=p['file'],sha256=p['sha256'],material=p['material']))
        manifest['variants'][variant]=parts;all_hands[variant]=authored_hands;report['variants'][variant]['hands']=[h['sourceHandAnatomy11'] for h in authored_hands];report['variants'][variant]['handCombined']=dict(components=2,eachSourceHandClosed=True,noSyntheticFingerPrimitives=True);report['variants'][variant]['realSourceHandParts']=authored_hands
    method='R11 changes hands only. All R10 body/actual-scan head/cloth/crown/cap geometry buffers, native material values and measured body/hem bearing are reused exactly under SHA/read-only guards. Two measured true-wrist source-hand components are extracted from the existing NC Sainsbury Amida adaptation. Every retained source palm/finger vertex/normal/UV and every complete original hand triangle has an explicit original source index and uniform-scale/proper-rigid replay. Actual wrist edge-intersection fractions, clipped source triangle parents and hidden authored wrist adapters are recorded in HA11 ancestry. Adapter ends are tested inside actual immutable R10 forearms and all adapter interior lies below the original source wrist cut. Source raw/model and complete local input/failed buffers retained. No procedural finger rods, photograph/depth carrier, viewport/render/export/bake/GPU or Blend. Pure CPU max4threads/exclusive reviewed lock; actual appearance still requires official native review.'
    hand_attribution='Real hand components retained from the existing R08a adaptation of Scan-the-World Sainsbury Amida, https://doi.org/10.5281/zenodo.21353739, CC BY-NC-SA4.0. The selected hands are below sourceY1.867 and do not include the donor-head derivative. Original source raw/indices are preserved; wrist cut, uniform scaling, proper rigid placement and hidden wrist adapters are declared derivatives. Different statue from the reference; personal noncommercial adaptation, no endorsement.'
    manifest.update(revision='scene06-attendants257-'+cfg['revision'],license='CC-BY-NC-SA-4.0 adaptation with original CC-BY-4.0 head input retained',attribution=json.dumps(original['sourceAttribution'],ensure_ascii=False)+'; '+hand_attribution,visualAccepted=False,photographicFidelityAccepted=False)
    manifest['sourceLicenses'].append(dict(source='Scan-the-World Sainsbury Amida actual hand surfaces via retained R08a adaptation',license='CC-BY-NC-SA-4.0',url='https://doi.org/10.5281/zenodo.21353739',licenseFile='LICENSE-source-hands-CC-BY-NC-SA-4.0.txt'))
    manifest['sourceHandInputHistoricalAttribution']=source_manifest['attribution'];manifest['geometryReuseParent257']={**parent,'reusedParts':reused,'bodyClothCrownCapBytesExact':True,'bearingAndMaterialsExact':True};manifest['pose257'].update(realExistingNCSourceHands=True,primitiveFingerHandPartsReplaced=True,bodyClothHeadCrownBytesExactFromR10=True)
    manifest['provenanceLimit']=original['provenanceLimit']+' '+hand_attribution+' The R11 hand phase does not repair remaining inferred neck/garment shape or establish photographic fidelity.'
    report.update(revision=cfg['revision'],config=cfg,method=method,geometryReuseParent=manifest['geometryReuseParent257'],noRenderViewportSceneExportOrGpu=True,photographicFidelityAccepted=False);report['sourceInputHashes'].update({str(parent_dir/'manifest.json'):sha(mb),str(parent_dir/'geometry-report.json'):sha(gb),str(source_dir/'manifest.json'):sha(source_manifest_bytes),str(source_dir/definition['file']):definition['sha256']})
    for name,value in [('manifest.json',manifest),('geometry-report.json',report),('provenance.json',dict(revision=manifest['revision'],changes=method,sourceLicenses=manifest['sourceLicenses'],attribution=manifest['attribution'],sourceInputHistoricalAttribution=source_manifest['attribution'],geometryReuseParent=manifest['geometryReuseParent257'],photographicFidelityAccepted=False))]:Path(out,name).write_text(json.dumps(value,indent=2)+'\n')
    print(json.dumps(dict(status='real-source-hands-written-all-other-R10geometry-reused',revision=cfg['revision'],handVertices={k:[h['vertices'] for h in v] for k,v in all_hands.items()},nonHandGeometryFilesReused=len(reused),photographicFidelityAccepted=False)))
