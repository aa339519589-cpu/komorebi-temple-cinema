"""CPU-only original table-capital sculpture, exact recipe for Root review.

Writes compact SC07 mesh buffers and JSON only, under authored-r03 here.
No render, viewport, scene export, blend save, image read/sampling, UV bake,
external network, source scan import or GPU operation is reachable.
Coordinates are Three's +Y up/+Z front throughout Blender mesh operations.
"""
import bpy,bmesh,math,json,hashlib,struct,array
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

HERE=Path(__file__).resolve().parent
GUIDE=HERE/'capital254-guides-r03.json'
DEST=HERE/'authored-r03'
if (DEST/'manifest.json').exists():raise RuntimeError('Preserve prior candidate; use a new reviewed recipe revision.')
DATA=json.loads(GUIDE.read_text())
bpy.ops.wm.read_factory_settings(use_empty=True)
COL=bpy.data.collections.new('capital254_original_authored_cpu_sculpt')
bpy.context.scene.collection.children.link(COL)

def clamp(x,a=0,b=1):return max(a,min(b,x))
def smooth(x):x=clamp(x);return x*x*(3-2*x)
def mesh(name,vertices,faces):
    me=bpy.data.meshes.new(name);me.from_pydata(vertices,[],faces);me.update()
    ob=bpy.data.objects.new(name,me);COL.objects.link(ob)
    for p in me.polygons:p.use_smooth=True
    bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free();return ob
def activate(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
def catmull(points,steps=18):
    ps=[Vector(p)for p in points];out=[]
    for i in range(len(ps)-1):
        a=ps[max(0,i-1)];b=ps[i];c=ps[i+1];d=ps[min(len(ps)-1,i+2)]
        for k in range(steps):
            t=k/steps;out.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
    out.append(ps[-1]);return out
def keyed(values,t):
    u=clamp(t)*(len(values)-1);i=min(len(values)-2,int(u));q=smooth(u-i);return values[i]*(1-q)+values[i+1]*q
def ribbon(name,points,widths,depths,sides=28,steps=18,leaf=False,phase=0):
    path=catmull(points,steps);vv=[];ff=[]
    for j,p in enumerate(path):
        t=j/(len(path)-1);tangent=(path[min(j+1,len(path)-1)]-path[max(0,j-1)]).normalized()
        front=Vector((0,0,1));front=(front-tangent*tangent.dot(front)).normalized();side=tangent.cross(front).normalized()
        w=keyed(widths,t);dep=keyed(depths,t)
        if leaf:w*=.83+.14*math.sin(7*math.pi*t+phase)+.07*math.sin(13*math.pi*t-phase)
        for k in range(sides):
            a=2*math.pi*k/sides;u=math.cos(a);v=math.sin(a)
            # A broad, keeled rolled leaf section, not a round tube.
            shoulder=1+.10*max(0,v)*math.sin(3*math.pi*t+phase)
            z=math.copysign(abs(v)**.68,v)*dep*.5+max(0,v)**3*(1-u*u)*dep*.10
            if leaf:
                # A keeled rolled leaf, with two physical valley channels.
                # This changes the cross-section rather than its tessellation.
                z+=max(0,v)**3*dep*(.14*(1-u*u)-.17*math.exp(-((abs(u)-.47)/.13)**2))
            q=p+side*(u*w*.5*shoulder)+front*z;vv.append(tuple(q))
    for j in range(len(path)-1):
        for k in range(sides):
            a=j*sides+k;b=j*sides+(k+1)%sides;ff.append((a,b,b+sides,a+sides))
    ff.append(tuple(range(sides-1,-1,-1)));ff.append(tuple((len(path)-1)*sides+k for k in range(sides)))
    return mesh(name,vv,ff)
def rounded_block(name,w,h,d,cy,cz,radius):
    # An authored structural web/bearing, not the visible ornament model.
    x=w*.5;y=h*.5;v=[(sx*x,cy+sy*y,cz+sz*d*.5)for sz in(-1,1)for sy in(-1,1)for sx in(-1,1)]
    f=[(0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)]
    ob=mesh(name,v,f);activate([ob]);be=ob.modifiers.new('authored_rounded_structural_arris','BEVEL');be.width=radius;be.segments=3;bpy.ops.object.modifier_apply(modifier=be.name);return ob
def fan_shell(name,contour,W,H,D):
    # One thick, scalloped palmette with a rolled rim and fluted front.
    # Both faces and the complete returning edge are explicitly constructed.
    # These hand-authored contour coordinates do not contain raster samples.
    cx,cy=DATA['fanLoftCenter'];center=Vector((cx*W*.5,cy*H,0))
    controls=[Vector((x*W*.5,y*H,0))-center for x,y in contour];edge=[]
    polar=sorted((math.atan2(p.y,p.x),p.length)for p in controls)
    for i,(a,ra) in enumerate(polar):
        b,rb=polar[(i+1)%len(polar)]
        if i==len(polar)-1:b+=2*math.pi
        if not(0<b-a<math.pi):raise RuntimeError('A round-lobed fan must enclose its loft center.')
        # Smooth radial outline through hand controls: no Catmull overshoot
        # into neighbouring notches, and no folded radial interior cells.
        for k in range(10):
            t=k/10;angle=a+(b-a)*t;r=ra+(rb-ra)*smooth(t)
            edge.append(center+Vector((math.cos(angle)*r,math.sin(angle)*r,0)))
    N=len(edge);R=28;vv=[];ff=[]
    turns=[(edge[(i+1)%N]-p).cross(center-p).z for i,p in enumerate(edge)]
    if not(min(turns)>1e-12 or max(turns)<-1e-12):raise RuntimeError('Fan loft center must lie in contour visibility kernel; no folded radial cells allowed.')
    def surface(p,r,front):
        theta=math.atan2(p.x/(W*.5)*1.35,p.y/H+.94)
        fan=smooth(r/.18)*(1-r*r)
        flutes=D*.024*fan*(.5+.5*math.cos(23*theta+.35*math.sin(3*theta)))
        rolled=D*.045*math.exp(-((r-.88)/.075)**2)
        fold=D*.070*smooth((r-.76)/.24)*math.sin(3*theta+.3)**2
        # Edge thickness stays positive; the rear bows into the real wood web.
        z=D*(.745+.125*(1-r*r))+flutes+rolled+fold if front else D*(.675-.135*(1-r*r))+fold
        return(p.x,p.y-H*.018*smooth((r-.78)/.22),z)
    for front in(True,False):
        vv.append(surface(center,0,front))
        for j in range(1,R+1):
            r=j/R
            for p in edge:vv.append(surface(center+(p-center)*r,r,front))
    stride=1+R*N
    for s in range(2):
        o=s*stride
        for k in range(N):ff.append((o,o+1+k,o+1+(k+1)%N))
        for j in range(R-1):
            a=o+1+j*N;b=a+N
            for k in range(N):q=(k+1)%N;ff.append((a+k,b+k,b+q,a+q))
    a=1+(R-1)*N;b=stride+a
    for k in range(N):q=(k+1)%N;ff.append((a+k,a+q,b+q,b+k))
    return mesh(name,vv,ff)
def topology(ob):
    bm=bmesh.new();bm.from_mesh(ob.data);bm.normal_update();seen=set();comps=[]
    for first in bm.verts:
        if first in seen:continue
        stack=[first];seen.add(first);vs=[]
        while stack:
            v=stack.pop();vs.append(v)
            for e in v.link_edges:
                q=e.other_vert(v)
                if q not in seen:seen.add(q);stack.append(q)
        comps.append(len(vs))
    result={'vertices':len(bm.verts),'faces':len(bm.faces),'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonmanifoldEdges':sum(len(e.link_faces)!=2 for e in bm.edges),'components':sorted(comps,reverse=True),'signedVolume':bm.calc_volume(signed=True)}
    bm.free();return result
def remove_dust(ob):
    bm=bmesh.new();bm.from_mesh(ob.data);seen=set();comps=[]
    for first in bm.verts:
        if first in seen:continue
        stack=[first];seen.add(first);vs=[]
        while stack:
            v=stack.pop();vs.append(v)
            for e in v.link_edges:
                q=e.other_vert(v)
                if q not in seen:seen.add(q);stack.append(q)
        comps.append(vs)
    comps.sort(key=len,reverse=True);dust=sum(len(x)for x in comps[1:])
    if dust>len(comps[0])*.002:bm.free();raise RuntimeError('A substantial sculptural part is disconnected: '+str([len(c)for c in comps]))
    if dust:bmesh.ops.delete(bm,geom=[v for c in comps[1:]for v in c],context='VERTS')
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free();ob.data.update();return dust
def chase(ob,guide_paths,width,depth):
    ob.data.calc_loop_triangles();tree=BVHTree.FromPolygons([v.co.copy()for v in ob.data.vertices],[tuple(t.vertices)for t in ob.data.loop_triangles],all_triangles=True)
    samples=[]
    for path in guide_paths:
        for p in catmull(path,40):
            hit=tree.ray_cast(Vector((p.x,p.y,.25)),Vector((0,0,-1)),.40)
            if hit[0]is not None and hit[1].z>.10:samples.append(hit[0])
    kd=KDTree(len(samples))
    for i,p in enumerate(samples):kd.insert(p,i)
    kd.balance();updates=[]
    for v in ob.data.vertices:
        n=v.normal.copy();front=smooth((n.z-.12)/.72)
        if front<=0:continue
        point,idx,d=kd.find(v.co)
        if d<width*3:
            amount=depth*math.exp(-.5*(d/width)**2)*front
            updates.append((v,v.co-n*amount))
    for v,p in updates:v.co=p
    bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free();ob.data.update();return{'projectedGuideSamples':len(samples),'surfaceVerticesCarved':len(updates),'method':'Actual authored-mesh ray intersections followed by local normal incisions; no source-image sampling.'}
def export_sc07(ob,variant,spec,chasing):
    # Rigid origin correction only: topY0, rearZ0. No final affine fitting.
    maxy=max(v.co.y for v in ob.data.vertices);minz=min(v.co.z for v in ob.data.vertices)
    for v in ob.data.vertices:v.co.y-=maxy;v.co.z-=minz
    ob.data.update();ob.data.calc_loop_triangles();groups={0:[],1:[]}
    for t in ob.data.loop_triangles:
        c=sum((ob.data.vertices[i].co for i in t.vertices),Vector())/3
        role=1 if c.z<spec['depth']*.20 and c.y< -spec['height']*.12 else 0;groups[role].append(t)
    pos=array.array('f');norm=array.array('f');uv=array.array('f');indices=array.array('I');lookup={};normal_splits=0;matgroups=[]
    for role,triangles in groups.items():
        start=len(indices)
        for t in triangles:
            ids=list(t.vertices);a,b,c=(ob.data.vertices[i].co for i in ids);fn=(b-a).cross(c-a).normalized()
            for i in ids:
                v=ob.data.vertices[i];n=v.normal.copy();split=n.dot(fn)<=.025
                if split:n=fn;normal_splits+=1
                key=(i,tuple(round(x,6)for x in n)if split else None)
                if key not in lookup:
                    lookup[key]=len(pos)//3;pos.extend(v.co);norm.extend(n);uv.extend((v.co.x/spec['width']+.5,-v.co.y/spec['height']))
                indices.append(lookup[key])
        matgroups.append({'start':start,'count':len(indices)-start,'role':DATA['materialRoles'][role]})
    n=len(pos)//3;ni=len(indices);data=struct.pack('<4sIIII',b'SC07',n,ni,0,0)+pos.tobytes()+norm.tobytes()+uv.tobytes()+indices.tobytes()
    if any(not math.isfinite(x)for x in pos)or any(not math.isfinite(x)for x in norm):raise RuntimeError('Non-finite output')
    sha=hashlib.sha256(data).hexdigest();name=f'capital254-{variant}-{sha[:16]}.sc07.bin';(DEST/name).write_bytes(data)
    lo=[min(v.co[i]for v in ob.data.vertices)for i in range(3)];hi=[max(v.co[i]for v in ob.data.vertices)for i in range(3)]
    return{'variant':variant,'file':name,'sha256':sha,'bytes':len(data),'vertices':n,'triangles':ni//3,'bounds':{'min':lo,'max':hi,'size':[b-a for a,b in zip(lo,hi)]},'materialGroups':matgroups,'normalCornerSplits':normal_splits,'chasing':chasing,'originCorrectionRigidTranslation':[0,-maxy,-minz]}

DEST.mkdir(parents=True,exist_ok=True);results=[]
for variant,spec in DATA['variants'].items():
    W,H,D=spec['width'],spec['height'],spec['depth'];paths={name:[(u*W*.5,v*H,z*D)for u,v,z in points]for name,points in DATA['normalizedPaths'].items()};parts=[]
    parts.append(rounded_block(variant+'_full_bearing_cornice',W,H*.23,D,-H*.115,D*.5,min(.002,H*.035)))
    parts.append(rounded_block(variant+'_real_rear_mounting_web',W*.35,H*.64,D*.16,-H*.43,D*.08,min(.0012,H*.02)))
    for j,name in enumerate(['leftShoulder','rightShoulder']):parts.append(ribbon(variant+'_'+name,paths[name],[W*.077,W*.105,W*.091,W*.070,W*.034],[D*.23,D*.25,D*.22,D*.20,D*.15],leaf=True,phase=j*.7))
    parts.append(ribbon(variant+'_broad_lower_cartouche',paths['wideLowerCartouche'],[H*.065,H*.105,H*.098,H*.090,H*.064],[D*.19,D*.22,D*.21,D*.18],phase=.9))
    parts.append(ribbon(variant+'_central_structural_stem',paths['centralStem'],[W*.044,W*.066,W*.064,W*.044],[D*.18,D*.20,D*.18,D*.16],phase=1.2))
    for name in ['leftReturn','rightReturn']:parts.append(ribbon(variant+'_'+name,paths[name],[W*.050,W*.054,W*.060,W*.057],[D*.20,D*.23,D*.22,D*.19],phase=.4))
    parts.append(fan_shell(variant+'_continuous_scalloped_palmette_shell',DATA['fanContour'],W,H,D))
    for j,name in enumerate(['leftFanTurnback','rightFanTurnback']):parts.append(ribbon(variant+'_'+name,paths[name],[W*.025,W*.070,W*.055,W*.030,W*.008],[D*.15,D*.14,D*.13,D*.10,D*.065],leaf=True,phase=.6+j*.9))
    for j,name in enumerate(['leftLateralLeaf','rightLateralLeaf']):parts.append(ribbon(variant+'_'+name,paths[name],[W*.024,W*.065,W*.075,W*.006],[D*.14,D*.21,D*.19,D*.06],leaf=True,phase=j*.73))
    parts.append(ribbon(variant+'_upper_continuous_foliated_field',paths['upperVine'],[H*.032,H*.061,H*.047,H*.057,H*.030],[D*.10,D*.15,D*.13,D*.10],leaf=True,phase=.8))
    activate(parts);bpy.ops.object.join();ob=bpy.context.object;ob.name='capital254_'+variant+'_single_continuous_sculpt'
    rem=ob.modifiers.new('CPU_closed_sculptural_union','REMESH');rem.mode='VOXEL';rem.voxel_size=spec['voxel'];rem.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=rem.name)
    sm=ob.modifiers.new('CPU_small_tooling_surface_relaxation','SMOOTH');sm.factor=.28;sm.iterations=2;bpy.ops.object.modifier_apply(modifier=sm.name)
    dust=remove_dust(ob);chasing=chase(ob,[paths[name]for name in DATA['chiselGuideNames']],spec['voxel']*1.7,spec['chiselDepth']);stats=topology(ob)
    if stats['boundaryEdges']or stats['nonmanifoldEdges']or len(stats['components'])!=1 or stats['signedVolume']<=0:raise RuntimeError('Capital is not one closed outward solid: '+str(stats))
    result=export_sc07(ob,variant,spec,chasing);result['topology']=stats;result['discardedAuthoredRemeshDustVertices']=dust;results.append(result)
manifest={'revision':DATA['revision'],'status':'cpu-sculpted-component-awaiting-actual-native-review','coordinateSystem':DATA['coordinateSystem'],'units':'Authored metres, inferred from table247 installation envelope. Not scanned/surveyed historic object dimensions.','origin':'X structural axis0 / highest bearing topY0 / rear mountZ0','format':'SC07 20-byte header, float32 position/normal/neutral authored UV, uint32 triangles; material group ranges in manifest','components':results,'source':'Original authored broad-bottom cloud/palmette sculpture, manual HD05 contour/flow guides, independent complete depth and rear construction. No third-party scan geometry in these authored meshes.','inputGuides':str(GUIDE.name),'guideSHA256':hashlib.sha256(GUIDE.read_bytes()).hexdigest(),'scriptSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'referenceRasterRead':False,'sourceImageBrightnessToZ':False,'sourceImageTexture':False,'operations':'Thick round-lobed front/back fan-shell loft with depth-curled rim + two asymmetric undercut turnback leaves + keeled/channelled shoulder leaves -> CPU voxel union -> small surface relaxation -> geometry-projected chisel paths carved along actual normals -> closed-volume/topology validation -> compact mesh buffers.','materialRoles':DATA['materialRoles'],'materialPolicy':'No bright-yellow finish baked or assigned. Gilt/body and rear-cut wood are semantic roles; host chooses physical materials.','mirrorPolicy':'Geometry X reflection with normalX reflection and triangle-winding reversal; positive instance determinant.','recommendedWorldTopY':.604,'recommendedWorldRearZ':3.000,'maximumWorldFrontZ':3.070,'completeParentScaleToCompensate':[.6216,.8,.74],'license':DATA['license'],'photographicAcceptance':False}
(DEST/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'status':manifest['status'],'components':[{k:x[k]for k in('variant','file','vertices','triangles','bounds','topology')}for x in results],'photographicAcceptance':False}))
