"""Source-preserving CC0 Tang cloth component authoring (pure CPU; no Blender).

This deliberately retains actual scan triangles. It never remeshes, smooths,
displaces, or creates texture-driven geometry. Run from the repository root with
a Python interpreter providing numpy. Render only with render-components.py
through tools/run-blender-queued.mjs.
"""
from pathlib import Path
import argparse, hashlib, json, math, struct
import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SOURCE = ROOT / 'lookdev/buddha-fullscan-source-v1/sources/pett-tang-seated-buddha-cc0/source-objaverse.glb'
CLEAN = ROOT / 'lookdev/buddha-fullscan-source-v1/pett-tang-seated-buddha-study/fullscan-axis-clean-y-up.glb'
SOURCE_SHA = '5834c2c7fc67c92b3bb258dc0aa5393bd79fd529358bfd33360bfeebae3335e7'
CLEAN_SHA = 'dde35900b90c88af03aeca617c712fc12af71867d957253f8e3ec92ad45c640b'

def read_glb(path):
    b = path.read_bytes()
    assert b[:4] == b'glTF'
    cursor = 12
    g = binary = None
    while cursor < len(b):
        size, kind = struct.unpack_from('<II', b, cursor)
        data = b[cursor + 8:cursor + 8 + size]
        cursor += 8 + size
        if kind == 0x4e4f534a:
            g = json.loads(data)
        elif kind == 0x004e4942:
            binary = data
    return g, binary

def accessor(g, binary, index):
    a = g['accessors'][index]
    view = g['bufferViews'][a['bufferView']]
    dtype = np.dtype({5121: 'u1', 5123: '<u2', 5125: '<u4', 5126: '<f4'}[a['componentType']])
    width = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
    offset = view.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = view.get('byteStride', dtype.itemsize * width)
    return np.ndarray((a['count'], width), dtype=dtype, buffer=binary,
                      offset=offset, strides=(stride, dtype.itemsize)).copy()

def matrix(node):
    if 'matrix' in node:
        return np.array(node['matrix']).reshape(4, 4, order='F')
    x, y, z, w = node.get('rotation', [0, 0, 0, 1])
    rotation = np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
                         [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
                         [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
    m = np.eye(4)
    m[:3, :3] = rotation @ np.diag(node.get('scale', [1, 1, 1]))
    m[:3, 3] = node.get('translation', [0, 0, 0])
    return m

def load_source():
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == SOURCE_SHA
    assert hashlib.sha256(CLEAN.read_bytes()).hexdigest() == CLEAN_SHA
    g, binary = read_glb(SOURCE)
    clean_g, _ = read_glb(CLEAN)
    normalize = matrix(clean_g['nodes'][-1])
    rows = []
    def visit(index, parent):
        node = g['nodes'][index]
        world = parent @ matrix(node)
        if 'mesh' in node:
            mesh_index = node['mesh']
            for primitive_index, primitive in enumerate(g['meshes'][mesh_index]['primitives']):
                assert primitive.get('mode', 4) == 4
                transform = normalize @ world
                attr = primitive['attributes']
                local = accessor(g, binary, attr['POSITION']).astype(np.float64)
                positions = local @ transform[:3, :3].T + transform[:3, 3]
                normals = accessor(g, binary, attr['NORMAL']).astype(np.float64) @ np.linalg.inv(transform[:3, :3])
                normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-20)
                faces = accessor(g, binary, primitive['indices']).reshape(-1, 3).astype(np.int32)
                rows.append(dict(name=node.get('name'), mesh=mesh_index,
                                 primitive=primitive_index, positions=positions,
                                 normals=normals, faces=faces, transform=transform))
        for child in node.get('children', []):
            visit(child, world)
    for index in g['scenes'][g.get('scene', 0)]['nodes']:
        visit(index, np.eye(4))
    return rows

def analyze(rows):
    p = np.concatenate([r['positions'] for r in rows])
    report = {'bounds': [p.min(0).tolist(), p.max(0).tolist()], 'heightBands': []}
    for y in np.arange(0, 2, .05):
        q = p[(p[:, 1] >= y) & (p[:, 1] < y + .05)]
        if len(q):
            report['heightBands'].append(dict(y=[round(float(y), 3), round(float(y + .05), 3)],
                count=len(q), bounds=[q.min(0).tolist(), q.max(0).tolist()],
                frontQuantile=[np.quantile(q[:, 2], .5), np.quantile(q[:, 2], .9)]))
    return report

def clipped_component(rows, name, planes, anchor):
    """Clip original triangle planes, retaining every wholly enclosed triangle.

    Plane convention: dot(normal, source-normalized point) <= distance.
    All new edge positions/normals are barycentric interpolants on a documented
    original triangle, never a reconstructed surface or displacement field.
    """
    positions, normals, faces = [], [], []
    vertex_mesh, vertex_source, vertex_triangle, vertex_bary = [], [], [], []
    face_mesh, face_source, face_whole = [], [], []
    cache = {}
    counters = []
    for row in rows:
        p, n, triangles = row['positions'], row['normals'], row['faces']
        tests = np.stack([p @ np.array(pl['normal']) - pl['distance'] for pl in planes], axis=1)
        tri_test = tests[triangles]
        reject = np.any(np.min(tri_test, axis=1) > 1e-11, axis=1)
        whole = np.all(np.max(tri_test, axis=1) <= 1e-11, axis=1)
        selected = np.flatnonzero(~reject)
        raw_count = clip_count = 0
        for fi in selected:
            source_ids = triangles[fi]
            source_p = p[source_ids]
            source_n = n[source_ids]
            poly = [np.array(v, dtype=np.float64) for v in np.eye(3)]
            if not whole[fi]:
                for pl in planes:
                    normal = np.array(pl['normal'])
                    result = []
                    for k in range(len(poly)):
                        a, b = poly[k - 1], poly[k]
                        da = float((a @ source_p) @ normal - pl['distance'])
                        db = float((b @ source_p) @ normal - pl['distance'])
                        ain, bin_ = da <= 1e-11, db <= 1e-11
                        if ain != bin_:
                            t = da / (da - db)
                            result.append(a + t * (b - a))
                        if bin_: result.append(b)
                    poly = result
                    if len(poly) < 3: break
                if len(poly) < 3: continue
            ids = []
            for bary in poly:
                exact = np.flatnonzero(np.abs(bary - 1) < 1e-10)
                source_vertex = int(source_ids[exact[0]]) if len(exact) else -1
                point = bary @ source_p
                norm = bary @ source_n
                norm /= max(np.linalg.norm(norm), 1e-20)
                key = (row['mesh'], source_vertex) if source_vertex >= 0 else (
                    row['mesh'], tuple(np.round(point, 11)), tuple(np.round(norm, 8)))
                if key not in cache:
                    cache[key] = len(positions)
                    positions.append(point - anchor)
                    normals.append(norm)
                    vertex_mesh.append(row['mesh'])
                    vertex_source.append(source_vertex)
                    vertex_triangle.append(int(fi))
                    vertex_bary.append(bary)
                ids.append(cache[key])
            for k in range(1, len(ids) - 1):
                inds = [ids[0], ids[k], ids[k + 1]]
                pp = np.array([positions[i] for i in inds])
                if np.linalg.norm(np.cross(pp[1] - pp[0], pp[2] - pp[0])) < 1e-14:
                    continue
                faces.append(inds)
                face_mesh.append(row['mesh']); face_source.append(int(fi)); face_whole.append(bool(whole[fi]))
                raw_count += int(whole[fi]); clip_count += int(not whole[fi])
        counters.append(dict(sourceMesh=row['mesh'], retainedWholeTriangles=raw_count,
                             boundaryClippedTriangles=clip_count))
    return dict(name=name, positions=np.array(positions), normals=np.array(normals),
                faces=np.array(faces, dtype=np.int32), anchor=anchor, planes=planes,
                vertexMesh=np.array(vertex_mesh, dtype=np.int8),
                vertexSource=np.array(vertex_source, dtype=np.int32),
                vertexTriangle=np.array(vertex_triangle, dtype=np.int32),
                vertexBary=np.array(vertex_bary, dtype=np.float32),
                faceMesh=np.array(face_mesh, dtype=np.int8),
                faceSource=np.array(face_source, dtype=np.int32),
                faceWhole=np.array(face_whole, dtype=bool), counts=counters)

def keep_main_surface(component):
    """Remove detached crop fragments/scan floaters without touching main points."""
    p,f=component['positions'],component['faces']
    parents=list(range(len(p)))
    def find(i):
        while parents[i]!=i:
            parents[i]=parents[parents[i]];i=parents[i]
        return i
    def union(a,b):
        a,b=find(int(a)),find(int(b))
        if a!=b:parents[b]=a
    keys={}
    for i,key in enumerate(map(tuple,np.round(p,6))):
        if key in keys:union(i,keys[key])
        else:keys[key]=i
    for a,b,c in f:union(a,b);union(a,c)
    labels=np.array([find(int(i))for i in f[:,0]])
    areas=np.linalg.norm(np.cross(p[f[:,1]]-p[f[:,0]],p[f[:,2]]-p[f[:,0]]),axis=1)*.5
    components=[]
    for label in np.unique(labels):
        ids=np.flatnonzero(labels==label);q=p[np.unique(f[ids])]
        components.append(dict(label=int(label),triangles=len(ids),area=float(areas[ids].sum()),bounds=[q.min(0).tolist(),q.max(0).tolist()]))
    components.sort(key=lambda c:-c['area'])
    keep=labels==components[0]['label']
    removed=dict(faceMesh=component['faceMesh'][~keep],faceSource=component['faceSource'][~keep])
    component['faces']=f[keep]
    for key in ['faceMesh','faceSource','faceWhole']:component[key]=component[key][keep]
    used=np.unique(component['faces']);remap=np.full(len(p),-1,dtype=np.int32);remap[used]=np.arange(len(used))
    component['faces']=remap[component['faces']]
    for key in ['positions','normals','vertexMesh','vertexSource','vertexTriangle','vertexBary']:component[key]=component[key][used]
    component['fragmentRemoval']=dict(method='Largest connected source surface by area; coordinate keys only, no weld/deformation.',
        main=components[0],removed=components[1:],removedTriangles=int(np.sum(~keep)))
    component['removedFaceTrace']=removed
    return component

def surface_plane_anchor(rows, y, target):
    """Select an actual surface intersection, with its exact original face trace."""
    target=np.array(target,dtype=float);best=None
    for row in rows:
        p=row['positions'];f=row['faces'];v=p[f]
        selected=np.flatnonzero((v[:,:,1].min(1)<=y)&(v[:,:,1].max(1)>=y))
        for fi in selected:
            triangle=v[fi];intersections=[]
            for i,j in [(0,1),(1,2),(2,0)]:
                a,b=triangle[i],triangle[j]
                if (a[1]-y)*(b[1]-y)>0 or abs(a[1]-b[1])<1e-14:continue
                t=(y-a[1])/(b[1]-a[1]);bary=np.zeros(3);bary[i]=1-t;bary[j]=t
                intersections.append((a+t*(b-a),bary))
            if len(intersections)<2:continue
            a,ba=intersections[0];b,bb=intersections[1];direction=b-a
            t=float(np.clip(np.dot(target-a,direction)/max(np.dot(direction,direction),1e-20),0,1))
            point=a+t*direction;distance=float(np.linalg.norm(point-target))
            if best is None or distance<best['distance']:
                best=dict(point=point.tolist(),sourceMesh=row['mesh'],sourceTriangle=int(fi),barycentric=(ba+t*(bb-ba)).tolist(),distance=distance)
    assert best is not None
    return best

def boundary_loops(component):
    """Measure loops with coordinate keys only; do not mutate source vertices."""
    p = component['positions']
    point_keys = [tuple(np.round(q, 6)) for q in p]
    key_to_index = {}
    for i,key in enumerate(point_keys): key_to_index.setdefault(key, i)
    edge_counts, edge_orientation = {}, {}
    for face in component['faces']:
        for i,j in zip(face, np.roll(face, -1)):
            a,b = point_keys[i], point_keys[j]
            if a == b: continue
            key = tuple(sorted([a,b]))
            edge_counts[key] = edge_counts.get(key, 0) + 1
            edge_orientation[key] = (a,b)
    edges = [edge_orientation[e] for e,count in edge_counts.items() if count == 1]
    classified, all_records = {}, []
    source_p = p + component['anchor']
    for pl in component['planes']:
        n = np.array(pl['normal'])
        cut_edges = [(a,b) for a,b in edges if
            abs(float(source_p[key_to_index[a]] @ n) - pl['distance']) < 2e-6 and
            abs(float(source_p[key_to_index[b]] @ n) - pl['distance']) < 2e-6]
        adjacent = {}
        for a,b in cut_edges:
            adjacent.setdefault(a, set()).add(b)
            adjacent.setdefault(b, set()).add(a)
        # Multiple clipping planes meet in hidden cut sections. Complete only
        # those planar mounting boundaries with explicit straight connectors
        # on plane/plane intersections. Original surface remains untouched.
        connectors=[]
        endpoints=[key for key,neighbors in adjacent.items() if len(neighbors)==1]
        for other in component['planes'] if component.get('connectMountIntersections',True) else []:
            if other['name']==pl['name']:continue
            on=np.array(other['normal']);line=np.cross(n,on)
            if np.linalg.norm(line)<1e-12:continue
            group=[key for key in endpoints if abs(float(source_p[key_to_index[key]]@on)-other['distance'])<2e-6]
            group.sort(key=lambda key:float(source_p[key_to_index[key]]@line))
            if len(group)%2:continue
            for a,b in zip(group[::2],group[1::2]):
                if a==b:continue
                adjacent.setdefault(a,set()).add(b);adjacent.setdefault(b,set()).add(a)
                connectors.append((a,b))
        unused = {tuple(sorted([a,b])) for a,b in cut_edges+connectors}
        records=[]
        while unused:
            a,b = min(unused)
            unused.remove(tuple(sorted([a,b])))
            chain = [a,b]
            while chain[-1] != chain[0]:
                choices = [q for q in adjacent[chain[-1]] if tuple(sorted([chain[-1], q])) in unused]
                if not choices: break
                q = min(choices)
                unused.remove(tuple(sorted([chain[-1],q])))
                chain.append(q)
            closed = chain[0] == chain[-1]
            if closed: chain.pop()
            ids=[key_to_index[q] for q in chain]
            coords=p[ids]
            length=float(np.linalg.norm(np.diff(np.vstack([coords, coords[:1]]) if closed else coords, axis=0),axis=1).sum())
            record=dict(plane=pl['name'], closed=closed, vertices=ids,
                        coordinates=coords.tolist(), perimeter=length,
                        bounds=[coords.min(0).tolist(), coords.max(0).tolist()],
                        centerMean=coords.mean(0).tolist(),
                        centersAreNotSurfaceAnchors=True,
                        mountingConnectorEdges=[dict(start=p[key_to_index[a]].tolist(),end=p[key_to_index[b]].tolist(),purpose='New hidden mounting edge at intersection of clipping planes')for a,b in connectors if a in chain and b in chain])
            records.append(record); all_records.append(record)
        classified[pl['name']] = records
    nonmanifold = sum(count > 2 for count in edge_counts.values())
    return dict(coordinateKeyTolerance=1e-6, retainedGeometryChanged=False,
                boundaryEdges=len(edges), nonmanifoldEdges=nonmanifold,
                classified=classified, records=all_records)

def triangulate_cap(coords, desired_normal):
    """Ear-clip the actual planar cut loop; reject failure, never fan-fill holes."""
    normal=np.asarray(desired_normal,dtype=float); normal /= np.linalg.norm(normal)
    axis=np.argmin(np.abs(normal)); basis=np.eye(3)[axis]
    u=np.cross(normal,basis); u/=np.linalg.norm(u); v=np.cross(normal,u)
    q=np.stack([coords@u,coords@v],axis=1)
    signed_area=.5*np.sum(q[:,0]*np.roll(q[:,1],-1)-q[:,1]*np.roll(q[:,0],-1))
    indices=list(range(len(q)))
    if signed_area<0:indices.reverse()
    tris=[]
    def cross(a,b,c):
        ab,ac=b-a,c-a
        return float(ab[0]*ac[1]-ab[1]*ac[0])
    def cross2(a,b):return a[...,0]*b[...,1]-a[...,1]*b[...,0]
    for _ in range(len(indices)*len(indices)+10):
        if len(indices)<=3:break
        found=False
        for j in range(len(indices)):
            a,b,c=indices[j-1],indices[j],indices[(j+1)%len(indices)]
            turn=cross(q[a],q[b],q[c])
            if turn<=1e-13: continue
            candidates=[k for k in indices if k not in (a,b,c)]
            if candidates:
                test=q[candidates]
                ab=cross2(q[b]-q[a],test-q[a]); bc=cross2(q[c]-q[b],test-q[b]); ca=cross2(q[a]-q[c],test-q[c])
                if np.any((ab>1e-12)&(bc>1e-12)&(ca>1e-12)):continue
            tris.append([a,b,c]); indices.pop(j); found=True; break
        if not found:return None
    if len(indices)==3 and cross(q[indices[0]],q[indices[1]],q[indices[2]])>1e-13:
        tris.append(indices)
    else:return None
    return np.array(tris,dtype=np.int32)

def mount_caps(component, boundary):
    positions=[]; normals=[]; faces=[]; report=[];parts=[]
    for pl in component['planes']:
        for i,loop in enumerate(boundary['classified'][pl['name']]):
            if not loop['closed'] or len(loop['vertices'])<3:
                report.append(dict(plane=pl['name'], loop=i, status='open chain left unfilled'))
                continue
            p=component['positions'][loop['vertices']]
            tris=triangulate_cap(p,pl['normal'])
            if tris is None:
                report.append(dict(plane=pl['name'], loop=i, status='non-simple or degenerate loop left unfilled'))
                continue
            start=len(positions); normal=np.array(pl['normal'],dtype=float);normal/=np.linalg.norm(normal)
            start_triangle=len(faces)
            positions.extend(p); normals.extend([normal]*len(p)); faces.extend(tris+start)
            parts.append(dict(name='hidden_mount_cap_'+pl['name']+'_'+str(i),positions=p,
                              normals=np.tile(normal,(len(p),1)),faces=tris))
            report.append(dict(plane=pl['name'],loop=i,status='separate planar mounting cap',
                               vertices=len(p),triangles=len(tris),visibleSurfaceRepair=False,
                               startVertex=start,startTriangle=start_triangle,node=parts[-1]['name']))
    return dict(name='hidden_mount_caps', positions=np.array(positions),normals=np.array(normals),
                faces=np.array(faces,dtype=np.int32),parts=parts),report

def validate_source_trace(rows, component):
    max_position=max_normal=max_bary_error=0
    for row in rows:
        indices=np.flatnonzero(component['vertexMesh']==row['mesh'])
        triangle_ids=component['vertexTriangle'][indices]
        bary=component['vertexBary'][indices].astype(np.float64)
        original_triangles=row['faces'][triangle_ids]
        expected=np.einsum('ni,nij->nj',bary,row['positions'][original_triangles])
        actual=component['positions'][indices]+component['anchor']
        max_position=max(max_position,float(np.linalg.norm(expected-actual,axis=1).max(initial=0)))
        norm=np.einsum('ni,nij->nj',bary,row['normals'][original_triangles]);norm/=np.maximum(np.linalg.norm(norm,axis=1,keepdims=True),1e-20)
        max_normal=max(max_normal,float(np.linalg.norm(norm-component['normals'][indices],axis=1).max(initial=0)))
        max_bary_error=max(max_bary_error,float(np.abs(bary.sum(1)-1).max(initial=0)))
    assert max_position<1e-7 and max_normal<1e-7 and max_bary_error<1e-6
    return dict(positionMaxError=max_position,normalMaxError=max_normal,barycentricSumMaxError=max_bary_error,
                wholeSourceTrianglesRetained=int(component['faceWhole'].sum()),
                outputVertexPrecision='float32 GLB, computed in float64',
                method='Every retained vertex checked against barycentric position and interpolated transformed normal on its original source face.',
                sourceNormalizedTransformIsRigidUniform=True,nonrigidDisplacement=0)

def write_glb(path, parts, extras):
    binary=bytearray(); views=[]; accessors=[]; meshes=[]; nodes=[]
    def acc(array, component_type, accessor_type, target, bounds=False):
        while len(binary)%4:binary.append(0)
        a=np.asarray(array,dtype={5126:'<f4',5125:'<u4'}[component_type])
        offset=len(binary); raw=a.tobytes(); binary.extend(raw)
        vi=len(views);views.append(dict(buffer=0,byteOffset=offset,byteLength=len(raw),target=target))
        record=dict(bufferView=vi,componentType=component_type,count=len(a),type=accessor_type)
        if bounds:record.update(min=a.min(0).tolist(),max=a.max(0).tolist())
        ai=len(accessors);accessors.append(record);return ai
    for pi, part in enumerate(parts):
        if len(part['faces'])==0:continue
        pa=acc(part['positions'],5126,'VEC3',34962,True)
        na=acc(part['normals'],5126,'VEC3',34962)
        fa=acc(part['faces'].reshape(-1),5125,'SCALAR',34963)
        mi=len(meshes)
        meshes.append(dict(name=part['name'],primitives=[dict(attributes={'POSITION':pa,'NORMAL':na},indices=fa,material=min(pi,1))]))
        nodes.append(dict(name=part['name'],mesh=mi,extras=dict(geometryRole='retained scan surface' if pi==0 else 'declared planar mounting closures')))
    document=dict(asset=dict(version='2.0',generator='CC0 Tang source-preserving cloth crop169'),scene=0,
        scenes=[dict(nodes=list(range(len(nodes))),extras=extras)],nodes=nodes,meshes=meshes,
        materials=[dict(name='neutral_clay_source_surface',pbrMetallicRoughness=dict(baseColorFactor=[.39,.36,.31,1],metallicFactor=0,roughnessFactor=.7)),
                   dict(name='hidden_mount_closures_declared',pbrMetallicRoughness=dict(baseColorFactor=[.24,.22,.19,1],metallicFactor=0,roughnessFactor=.8))],
        accessors=accessors,bufferViews=views,buffers=[dict(byteLength=len(binary))])
    raw_json=json.dumps(document,separators=(',',':')).encode(); raw_json+=b' '*((-len(raw_json))%4)
    binary+=b'\0'*((-len(binary))%4)
    length=12+8+len(raw_json)+8+len(binary)
    path.write_bytes(struct.pack('<4sII',b'glTF',2,length)+struct.pack('<II',len(raw_json),0x4e4f534a)+raw_json+struct.pack('<II',len(binary),0x004e4942)+binary)

def write_sc07(path, mesh):
    n=len(mesh['positions']);f=mesh['faces'].astype('<u4');p=mesh['positions'].astype('<f4');normal=mesh['normals'].astype('<f4')
    uv=np.zeros((n,2),dtype='<f4')
    data=struct.pack('<4sIIII',b'SC07',n,len(f)*3,0,0)+p.tobytes()+normal.tobytes()+uv.tobytes()+f.tobytes()
    path.write_bytes(data)
    return dict(file=path.name,vertices=n,triangles=len(f),bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),
                material='cloth',bounds=[p.min(0).tolist(),p.max(0).tolist()],
                sourceNormalsPreserved=True,uv='Neutral zero UVs; no scan texture data.')

def export_component(rows, name, planes, anchor, dest, clean_fragments=True,connect_mounts=True):
    component=clipped_component(rows,name,planes,np.asarray(anchor,dtype=float))
    if clean_fragments:component=keep_main_surface(component)
    else:
        component['fragmentRemoval']=dict(method='No disconnected-fragment cleanup in initial candidate.',removedTriangles=0)
        component['removedFaceTrace']=dict(faceMesh=np.array([],dtype=np.int8),faceSource=np.array([],dtype=np.int32))
    component['connectMountIntersections']=connect_mounts
    boundary=boundary_loops(component)
    caps,cap_report=mount_caps(component,boundary)
    validation=validate_source_trace(rows,component)
    extras=dict(sourceLicense='CC0-1.0',sourceAuthor='Daniel Pett',sourceSha256=SOURCE_SHA,
        culture='Chinese Tang dynasty sculpture; different artifact from Japanese reference06',
        sourceUrl='https://sketchfab.com/3d-models/a4d22eb6d3c44848bd49b89fb4c28759',
        coordinateSystem='+Y up/+Z front/+X viewer right',sourceNormalizedToComponentTranslation=(-component['anchor']).tolist(),
        nonrigidRestoration='None',visibleSurfaceChanges='Source triangles clipped only at declared boundaries. No smoothing, displacement or remeshing.',
        sourceTriangleTrace=name+'-source-trace.npz',cutLoops=name+'-mount-loops.json',visualAccepted=False)
    path=dest/(name+'.glb');write_glb(path,[component]+caps['parts'],extras)
    write_glb(dest/(name+'-surface-only.glb'),[component],extras)
    sc07=write_sc07(dest/(name+'-source-surface.sc07.bin'),component)
    np.savez_compressed(dest/(name+'-source-trace.npz'),
        vertexMesh=component['vertexMesh'],vertexSource=component['vertexSource'],
        vertexTriangle=component['vertexTriangle'],vertexBary=component['vertexBary'],
        faceMesh=component['faceMesh'],faceSource=component['faceSource'],faceWhole=component['faceWhole'],
        removedCropFragmentFaceMesh=component['removedFaceTrace']['faceMesh'],removedCropFragmentFaceSource=component['removedFaceTrace']['faceSource'])
    # Compact editable geometry buffers provide a direct application integration path.
    np.savez_compressed(dest/(name+'-editable-mesh.npz'),positions=component['positions'].astype(np.float32),
        normals=component['normals'].astype(np.float32),triangles=component['faces'].astype(np.uint32),
        mountPositions=caps['positions'].astype(np.float32),mountNormals=caps['normals'].astype(np.float32),mountTriangles=caps['faces'].astype(np.uint32))
    (dest/(name+'-mount-loops.json')).write_text(json.dumps(boundary,indent=2))
    p=component['positions']
    return dict(name=name,glb=path.name,glbBytes=path.stat().st_size,glbSha256=hashlib.sha256(path.read_bytes()).hexdigest(),
        bounds=[p.min(0).tolist(),p.max(0).tolist()],sourceNormalizedAnchor=anchor,
        retainedScanVertices=len(p),retainedWholeTriangles=int(np.sum(component['faceWhole'])),
        boundaryClippedTriangles=int(np.sum(~component['faceWhole'])),mountTriangles=len(caps['faces']),
        sourceCounts=component['counts'],cutPlanes=planes,mountCaps=cap_report,
        fragmentRemoval=component['fragmentRemoval'],
        sourceSurfaceValidation=validation,
        nativeSC07=sc07,
        sourceBoundaryEdgesBeforeMounting=boundary['boundaryEdges'],
        nonmanifoldEdgesBeforeMounting=boundary['nonmanifoldEdges'],
        loopFile=name+'-mount-loops.json',sourceTrace=name+'-source-trace.npz',editableMesh=name+'-editable-mesh.npz',
        unchangedOriginalSourceVertices=int(np.sum(component['vertexSource']>=0)),
        interpolatedBoundaryVertices=int(np.sum(component['vertexSource']<0)))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--analyze', action='store_true')
    parser.add_argument('--revision', choices=['r01','r02','r03'],default='r03')
    args = parser.parse_args()
    rows = load_source()
    if args.analyze:
        print(json.dumps(analyze(rows), indent=2))
        return
    dest=HERE/args.revision;dest.mkdir(exist_ok=True)
    seat_anchor=surface_plane_anchor(rows,.555,[.02,.555,-.53])
    anchor=[.02,.555,-.10] if args.revision=='r01' else seat_anchor['point']
    lower=[dict(name='seat_mount',normal=[0,-1,0],distance=-.555),
           dict(name='waist_mount',normal=[0,1,0],distance=.810)]
    if args.revision=='r03':
        lower.append(dict(name='rear_right_sleeve_exclusion',normal=[1,1,-.5],distance=1.2))
    torso=[dict(name='waist_overlap',normal=[0,-1,0],distance=-.780 if args.revision=='r03' else -.755),
           dict(name='neck_mount',normal=[0,1,0],distance=1.490),
           dict(name='right_arm_mount',normal=[1,-.2142857142857143,0],distance=.0792857142857143),
           dict(name='left_arm_mount',normal=[-1,-.14285714285714285,0],distance=.13285714285714287)]
    clean=args.revision!='r01'
    components=[export_component(rows,'crossed-knees-hips',lower,anchor,dest,clean,clean),
                export_component(rows,'torso-cloak-core',torso,anchor,dest,clean,clean)]
    anchors={}
    for name,y,target in [
        ('seat_rear_surface',.555,[.02,.555,-.53]),
        ('seat_front_surface',.555,[.02,.555,.58]),
        ('waist_front_surface',.81,[.02,.81,-.11]),
        ('waist_back_surface',.81,[.02,.81,-.55]),
        ('neck_front_surface',1.49,[.1,1.49,-.33]),
        ('neck_back_surface',1.49,[.1,1.49,-.59]),
        ('left_knee_front_surface',.64,[-.45,.64,.40]),
        ('right_knee_front_surface',.61,[.45,.61,.45]),
    ]:
        a=surface_plane_anchor(rows,y,target)
        a['sourceNormalizedPoint']=a.pop('point');a['componentPoint']=(np.array(a['sourceNormalizedPoint'])-anchor).tolist()
        a['pointIsOnActualRetainedSourcePlane']=True
        anchors[name]=a
    (dest/'surface-anchors.json').write_text(json.dumps(dict(coordinateSystem='+Y up/+Z front',origin='Actual rear seat-cut scan surface point, not a bbox center.' if clean else 'Initial virtual framing origin.',anchors=anchors),indent=2))
    report=dict(revision=args.revision,status='source-preserving scoped geometry candidate; actual clay evaluation pending',
        visualAccepted=False,productionIntegrated=False,coordinateSystem='+Y-up/+Z-front/+X viewer right',
        sourceFile=str(SOURCE.relative_to(ROOT)),sourceSha256=SOURCE_SHA,sourceBytes=SOURCE.stat().st_size,
        normalizationInputFile=str(CLEAN.relative_to(ROOT)),normalizationInputSha256=CLEAN_SHA,
        sourceLicense='CC0-1.0',sourceAuthor='Daniel Pett',sourceCulture='Chinese Tang dynasty, not Japanese',
        physicalUnits='Source real dimensions undocumented; prior full-height2.0 normalization is retained. Treat output units as inferred viewing metres.',
        originalToNormalizedTransforms=[dict(mesh=r['mesh'],matrix=r['transform'].tolist())for r in rows],
        sourceNormalizedToComponentTranslation=(-np.array(anchor)).tolist(),
        originSurfaceAnchor=dict(name='Actual rear seat-cut surface intersection',**seat_anchor) if clean else None,
        mountingUse='Use the surface-only GLBs for joining; each hidden_mount_cap node is a removable closure at a declared crop. No cap represents original cloth.',
        surfaceAnchors='surface-anchors.json',
        uniformFitExample=dict(purpose='Optional scale to existing owner165 model neck attachment height2.25; no geometry deformation.',
            scale=2.25/(1.49-.555),aboveSeatNeckHeight=2.25,
            kneeSpan=(components[0]['bounds'][1][0]-components[0]['bounds'][0][0])*2.25/(1.49-.555),
            caveat='This is only a uniform Y-height fit. Actual torso setback and asymmetric neck/leg centers remain; fit the head and sleeves to the measured loops.'),
        nonrigidRestoration='None. Original vertices/normals retained; boundary intersections interpolate within original triangle planes.',
        components=components,builderSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest())
    (dest/'manifest.json').write_text(json.dumps(report,indent=2))
    (dest/'native-manifest.json').write_text(json.dumps(dict(revision='cc0-tang-cloth169-'+args.revision,
        format='SC07:20-byte header, float32 position/normal/neutral UV, uint32 triangle indices',
        coordinateSystem='+Y up/+Z front',sourceSurfaceOrigin=anchor,
        variants=dict(central=[c['nativeSC07']for c in components]),
        sourceAttribution='Seated figure of Buddha by Daniel Pett, CC0-1.0. Chinese Tang dynasty; scoped cloth surface donor only, different artifact from Japanese reference06.',
        sourceSha256=SOURCE_SHA,visualAccepted=False),indent=2))
    print(json.dumps(report,indent=2))

if __name__ == '__main__':
    main()
