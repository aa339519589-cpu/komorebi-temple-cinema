from pathlib import Path
import json
p=Path('lookdev/scene07-stone-toro156/build-toro156.py');s=p.read_text().replace("os.environ.get('TORO_REVISION','r02')","os.environ.get('TORO_REVISION','r03')")
s=s.replace('from mathutils.bvhtree import BVHTree','from mathutils.bvhtree import BVHTree\nfrom mathutils.kdtree import KDTree')
a=s.index('register(shaft);bpy.context.view_layer.objects.active=shaft;')
b=s.index('bvh=BVHTree.FromObject(shaft',a)
s=s[:a]+'''register(shaft);bpy.context.view_layer.update();captured_bvh=BVHTree.FromObject(shaft,bpy.context.evaluated_depsgraph_get())
# The source has796 real missing-scan boundaries. A direct voxel modifier
# collapsed it into debris. Build a closed radial surface by sampling the
# actual captured triangles in3D; interpolate only where capture has holes.
# This is geometry retopology, with no photograph or raster height field.
observed=[v.co.copy() for v in shaft.data.vertices];kd=KDTree(len(observed));observed_r=[]
for i,p in enumerate(observed):
    angle=math.atan2(p.y,p.x);kd.insert((math.cos(angle),math.sin(angle),(p.z-.47)/1.21),i);observed_r.append(math.hypot(p.x,p.y))
kd.balance();ANG=256;LEVELS=160;verts=[];faces=[];captured_hits=0;hole_fills=0
for j in range(LEVELS+1):
    z=.4701+(1.6799-.4701)*j/LEVELS
    for i in range(ANG):
        a=i*TAU/ANG;N=Vector((math.cos(a),math.sin(a),0));hit=captured_bvh.ray_cast(N*2+Vector((0,0,z)),-N,3)[0];r=hit.dot(N) if hit is not None else -1
        if .10<r<.85:captured_hits+=1
        else:
            near=kd.find_n((math.cos(a),math.sin(a),(z-.47)/1.21),12);weights=[1/max(d,1e-4)**2 for _,_,d in near];r=sum(observed_r[idx]*w for (_,idx,_),w in zip(near,weights))/sum(weights);hole_fills+=1
        verts.append((N.x*r,N.y*r,z))
for j in range(LEVELS):
    for i in range(ANG):q=(i+1)%ANG;a=j*ANG+i;b=j*ANG+q;faces.append((a,b,b+ANG,a+ANG))
bottom=len(verts);verts.append((0,0,.4701));top=len(verts);verts.append((0,0,1.6799))
for i in range(ANG):q=(i+1)%ANG;faces.append((bottom,q,i));faces.append((top,LEVELS*ANG+i,LEVELS*ANG+q))
new_mesh=bpy.data.meshes.new('Watertight retopology of actual captured stone surface');new_mesh.from_pydata(verts,[],faces);new_mesh.update();shaft.data=new_mesh
bm=bmesh.new();bm.from_mesh(shaft.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));
if bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
assert not any(e.is_boundary for e in bm.edges);assert bm.calc_volume(signed=True)>.10;bm.to_mesh(shaft.data);bm.free()
for p in shaft.data.polygons:p.use_smooth=True
bpy.context.view_layer.update()
''' +s[b:]
s=s.replace("front=N*(radius-.066)","front=N*(radius-.092)")
s=s.replace("'retainedCapturedGeometry':'Only the actual weathered shaft, cropped/capped, horizontally scaled0.8, vertically remapped and6mm voxel-closed, then carved with four actual arched boolean niches. Unsuitable original scanned pyramidal roof, closed chamber and incidental ground are excluded.'", "'retainedCapturedGeometry':'Only the actual weathered shaft, cropped/capped, horizontally scaled0.8 and vertically remapped. Closed radial retopology samples the actual source triangle surface at256angles/161levels; missing-scan holes alone are interpolated from nearby captured radial samples. Four actual arched Boolean niches are then cut into the closed stone. Unsuitable source roof/chamber/ground are excluded.', 'capturedSurfaceSamples':captured_hits,'interpolatedMissingScanSamples':hole_fills,'capturedSampleFraction':captured_hits/(captured_hits+hole_fills)")
s=s.replace("export_materials='EXPORT',export_animations=False", "export_materials='EXPORT',export_vertex_color='ACTIVE',export_all_vertex_colors=False,export_animations=False")
p.write_text(s)
r=Path('lookdev/scene07-stone-toro156/r02/rejected-review.json');r.parent.mkdir(exist_ok=True);r.write_text(json.dumps({'status':'rejected-before-render','reason':'The structural guard correctly refused the second build. Focused actual geometry inspection showed that the source scan has796 missing-scan boundary edges; a direct voxel remesh reduced it to464 debris faces with~2e-7 volume, before carving. Cutter winding was not the sole cause.','repair':'R03 constructs a closed radial retopology from actual captured triangle-surface ray samples, interpolating only missing scan regions. It guards nonzero closed volume before carving and substantial evaluated faces after carving.','visualAccepted':False},indent=2)+'\n')
