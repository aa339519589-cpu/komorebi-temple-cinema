"""380 exact source geometry with full affine matrix instances.
Original354 bounded buffers/attributes; installed5.2 matrix GN capability verified.
No instance TRS decomposition, no per-shear mesh duplication, no model reduction.
"""
import hashlib
import json
import math
from collections import OrderedDict
import numpy as np
from mathutils import Matrix


class SourceBuffers:
    def __init__(self, root, export_report, cache_limit_bytes=64*1024**2):
        self.root = root; self.report = export_report; self.cache = OrderedDict()
        self.cache_limit_bytes = cache_limit_bytes; self.cache_bytes = 0; self.cache_high_water = 0; self.payload_reads = 0

    def binary(self, rec):
        dtype = {'Float32Array': '<f4', 'Uint32Array': '<u4', 'Uint16Array': '<u2', 'Uint8Array': 'u1'}[rec['type']]
        proof = self.report['exportedAssets'][rec['file']]; key = (proof['sha256'], dtype, rec['count'])
        if key in self.cache:
            self.cache.move_to_end(key)
        else:
            path = self.root/'assets'/rec['file']; payload = path.read_bytes()
            if len(payload) != proof['bytes'] or hashlib.sha256(payload).hexdigest() != proof['sha256']: raise RuntimeError('Changed exact source payload: '+rec['file'])
            data = np.frombuffer(payload, dtype=dtype)
            if len(data) != rec['count']: raise RuntimeError('Truncated exact source payload: '+rec['file'])
            data.setflags(write=False); self.payload_reads += 1
            # Large current geometry arrays remain alive only in its local
            # data dict. Do not pin the entire645MB package in a second cache.
            if data.nbytes > self.cache_limit_bytes: return data
            while self.cache and self.cache_bytes+data.nbytes > self.cache_limit_bytes:
                _, old = self.cache.popitem(last=False); self.cache_bytes -= old.nbytes
            self.cache[key] = data; self.cache_bytes += data.nbytes; self.cache_high_water = max(self.cache_high_water, self.cache_bytes)
        return self.cache[key]

    def geometry(self, rec):
        data = {name: self.binary(attr).reshape(-1, attr['itemSize']) for name, attr in rec['attributes'].items()}
        data['index'] = self.binary(rec['index']).reshape(-1, 3)
        return data


def full_transforms(record, buffers, conversion=None):
    world = np.asarray(record['matrix'], np.float64).reshape(4, 4).T
    if 'instanceMatrices' in record:
        local = buffers.binary(record['instanceMatrices']).reshape(record['instances'], 4, 4).transpose(0, 2, 1)
        values = np.einsum('ij,njk->nik', world, local)
    else: values = world[None, :, :]
    if conversion is not None: values = np.einsum('ij,njk->nik', conversion, values)
    if not np.isfinite(values).all(): raise RuntimeError('Nonfinite actual source transform')
    return values


def triangle_area(data, transform):
    points = data['position'] @ transform[:3, :3].T + transform[:3, 3]
    p = points[data['index']]
    return float(np.linalg.norm(np.cross(p[:, 1]-p[:, 0], p[:, 2]-p[:, 0]), axis=1).sum()*.5)


def closed_geometry(data):
    # Analysis only; no source weld, coordinate or triangle is changed.
    keys, inverse = np.unique(np.round(data['position']*1e6).astype(np.int64), axis=0, return_inverse=True)
    triangles = inverse[data['index']]; edges = np.concatenate([triangles[:, [0, 1]], triangles[:, [1, 2]], triangles[:, [2, 0]]]); edges.sort(axis=1)
    edges = edges[edges[:, 0] != edges[:, 1]]
    if not len(edges): return False
    _, counts = np.unique(edges, axis=0, return_counts=True)
    return bool(np.all(counts == 2))


def import_geometry(bpy, package, buffers, materials, direct_materials, optics, report):
    scene = bpy.context.scene; geometries = {g['id']: g for g in package['geometries']}; mat_recs = {m['id']: m for m in package['materials']}
    conversion = np.asarray(Matrix.Rotation(math.pi/2, 4, 'X'), np.float64)
    prototypes = {}; templates = {}; source_alias_rows = []; imported_triangles = 0; linked = baked = singular = reflected = 0; max_residual = max_vertex_residual = 0
    uv_storage = {'pointFloat3Sets': 0, 'pointUVVertices': 0, 'tangentCornerSets': 0, 'tangentUVLoops': 0, 'maximumOriginalXYResidual': 0.0}
    templates_collection = bpy.data.collections.new('252 original hidden prototypes, identity local coordinates'); scene.collection.children.link(templates_collection)

    def point_attribute(mesh, name, values, kind):
        attr = mesh.attributes.new(name=name, type=kind, domain='POINT')
        attr.data.foreach_set('color' if kind == 'FLOAT_COLOR' else 'vector' if kind == 'FLOAT_VECTOR' else 'value', np.asarray(values).ravel())

    def mesh_data(record, g, data, at, linear=None, source_instance=None, fields=None):
        nonlocal max_vertex_residual
        cache_key = (tuple((k, v['itemSize'], buffers.report['exportedAssets'][v['file']]['sha256']) for k, v in sorted(g['attributes'].items())), buffers.report['exportedAssets'][g['index']['file']]['sha256'], json.dumps(g['groups'], sort_keys=True), tuple(materials[mid].as_pointer() for mid in record['materials']))
        if linear is None and cache_key in prototypes:
            mesh=prototypes[cache_key];ids=json.loads(mesh.get('sourceGeometryIds','[]'))
            if g['id'] not in ids: ids.append(g['id']);mesh['sourceGeometryIds']=json.dumps(ids)
            return mesh
        p = data['position']; count = len(p); faces = data['index']
        if faces.min(initial=0) < 0 or faces.max(initial=0) >= count: raise RuntimeError('Original source index outside prototype')
        positions = p if linear is None else p @ linear.T
        determinant = 1 if linear is None else float(np.linalg.det(linear))
        if determinant < 0: faces = faces[:, [0, 2, 1]]
        mesh = bpy.data.meshes.new((record['name'] or 'source-'+str(at))[:44]+(' exact affine' if linear is not None else ' original prototype'))
        mesh.vertices.add(count); mesh.vertices.foreach_set('co', np.asarray(positions, np.float32).ravel())
        if faces.max(initial=0) >= 2**31: raise RuntimeError('Source indices exceed Blender signed32 mesh index range')
        mesh.loops.add(faces.size); mesh.loops.foreach_set('vertex_index', np.ascontiguousarray(faces, dtype=np.uint32).view(np.int32).ravel())
        mesh.polygons.add(len(faces)); mesh.polygons.foreach_set('loop_start', np.arange(len(faces), dtype=np.int32)*3); mesh.polygons.foreach_set('loop_total', np.full(len(faces), 3, np.int32))
        owners = np.zeros(len(faces), np.int32)
        if len(record['materials']) > 1:
            for group in g['groups']:
                owners[group['start']//3:(group['start']+group['count'])//3] = group.get('materialIndex', 0)
        if owners.max(initial=0) >= len(record['materials']): raise RuntimeError('Source material group outside slot array')
        smooth = np.asarray([not mat_recs[record['materials'][i]].get('flatShading', False) for i in owners], np.bool_)
        mesh.polygons.foreach_set('material_index', owners); mesh.polygons.foreach_set('use_smooth', smooth); mesh.update(calc_edges=True)
        needs_tangent_uv = any(mat_recs[mid].get('textures', {}).get('normalMap') or mat_recs[mid].get('textures', {}).get('clearcoatNormalMap') or float(mat_recs[mid].get('anisotropy') or 0) != 0 for mid in record['materials'])
        if 'normal' in data:
            normals = data['normal']
            if linear is not None:
                inverse = np.linalg.inv(linear) if abs(determinant) > 1e-12 else np.linalg.pinv(linear)
                normals = normals @ inverse; normals = normals/np.maximum(np.linalg.norm(normals, axis=1), 1e-30)[:, None]
            # Blender5.2 directly supports float3 POINT custom_normal. This
            # retains the full source values and avoids both the huge Python
            # list and the older corner-short2 compression path.
            attr = mesh.attributes.new(name='custom_normal', type='FLOAT_VECTOR', domain='POINT')
            if attr.name != 'custom_normal': raise RuntimeError('Exact point-normal attribute was not accepted')
            attr.data.foreach_set('vector', np.asarray(normals, np.float32).ravel())
        for key, values in data.items():
            if key == 'index': continue
            if len(values) != count: raise RuntimeError('Unsupported non-vertex prototype attribute, never silently discard '+key)
            if key == 'uv' or (key.startswith('uv') and key[2:].isdigit()):
                if values.shape[1] != 2: raise RuntimeError('Source UV item size is not2')
                name = 'sourceUV' if key == 'uv' else 'sourceUV'+key[2:]
                if needs_tangent_uv:
                    layer = mesh.uv_layers.new(name=name); layer.data.foreach_set('uv', values[faces.ravel(), :2].astype(np.float32).ravel())
                    uv_storage['tangentCornerSets'] += 1; uv_storage['tangentUVLoops'] += faces.size
                else:
                    # Three already splits vertices at UV seams. Preserve the
                    # original float2 exactly in POINT float3(U,V,0); shader
                    # barycentric interpolation is identical per triangle.
                    # Tangent-dependent maps retain real UV loop layers above.
                    expanded = np.zeros((count, 3), np.float32); expanded[:, :2] = values
                    point_attribute(mesh, name, expanded, 'FLOAT_VECTOR')
                    if not np.array_equal(expanded[:, :2], values): raise RuntimeError('Original source UV changed')
                    readback = np.empty((count, 3), np.float32); mesh.attributes[name].data.foreach_get('vector', readback.ravel())
                    if not np.array_equal(readback, expanded): raise RuntimeError('Actual Blender POINT UV storage differs from original')
                    del readback, expanded
                    uv_storage['pointFloat3Sets'] += 1; uv_storage['pointUVVertices'] += count
            if key == 'color':
                colors = np.ones((count, 4), np.float32); colors[:, :values.shape[1]] = values
                point_attribute(mesh, 'sourceColor', colors, 'FLOAT_COLOR')
            elif key not in ('position', 'normal') and not (key == 'uv' or (key.startswith('uv') and key[2:].isdigit())):
                size = values.shape[1]; name = 'sourceRaw_'+key
                if size == 1: point_attribute(mesh, name, values[:, 0], 'FLOAT')
                elif size in (2, 3):
                    expanded = np.zeros((count, 3), np.float32); expanded[:, :size] = values; point_attribute(mesh, name, expanded, 'FLOAT_VECTOR')
                elif size == 4: point_attribute(mesh, name, values, 'FLOAT_COLOR')
                else: raise RuntimeError('Unsupported original attribute size, never delete '+key)
        if 'color' not in data and any(mat_recs[mid].get('vertexColors') for mid in record['materials']): point_attribute(mesh, 'sourceColor', np.ones((count, 4), np.float32), 'FLOAT_COLOR')
        # GN reads these from the point/instance domain, never per prototype
        # vertex. Only the exact affine-baked subset needs geometry fields.
        values = fields or {}
        for name, field in values.items():
            if isinstance(field, (tuple, list, np.ndarray)): point_attribute(mesh, name, np.tile(field, (count, 1)), 'FLOAT_COLOR')
            else: point_attribute(mesh, name, np.full(count, field, np.float32), 'FLOAT')
        mesh['sourceGeometryId'] = g['id']; mesh['sourceGeometryIds']=json.dumps([g['id']]); mesh['sourcePrototypeAttributeLayout'] = json.dumps({k: list(v.shape) for k, v in data.items() if k != 'index'}, sort_keys=True)
        mesh['sourceImmutablePackage'] = str(buffers.root); mesh['positionNormalUVStorage'] = 'Actual co / exact float3 point custom_normal / full source UV in exact point or tangent corner domains; original raw bytes remain in verified package, no redundant debug copies'
        mesh.update()
        if source_instance is not None: mesh['sourceInstanceIndex'] = source_instance
        for mid in record['materials']: mesh.materials.append(direct_materials[mid] if linear is not None or fields is not None else materials[mid])
        if linear is None and fields is None: prototypes[cache_key] = mesh
        return mesh

    def gn_group(template):
        tree = bpy.data.node_groups.new('252 complete original prototype instances', 'GeometryNodeTree'); incoming = tree.interface.new_socket(name='Points', in_out='INPUT', socket_type='NodeSocketGeometry'); outgoing = tree.interface.new_socket(name='Instances', in_out='OUTPUT', socket_type='NodeSocketGeometry')
        nodes = tree.nodes; links = tree.links; gin = nodes.new('NodeGroupInput'); gout = nodes.new('NodeGroupOutput'); obj = nodes.new('GeometryNodeObjectInfo'); obj.transform_space = 'ORIGINAL'; obj.inputs['Object'].default_value = template; obj.inputs['As Instance'].default_value = True
        geometry = gin.outputs[incoming.name]
        for name, kind in [('instanceColor', 'FLOAT_COLOR'), ('physical252_emissionRGB', 'FLOAT_COLOR'), ('physical252_emitBack', 'FLOAT')]:
            attr = nodes.new('GeometryNodeInputNamedAttribute'); attr.data_type = kind; attr.inputs['Name'].default_value = name
            store = nodes.new('GeometryNodeStoreNamedAttribute'); store.data_type = kind; store.domain = 'POINT'; store.inputs['Name'].default_value = name; links.new(geometry, store.inputs['Geometry']); links.new(attr.outputs['Attribute'], store.inputs['Value']); geometry = store.outputs['Geometry']
        instances = nodes.new('GeometryNodeInstanceOnPoints'); links.new(geometry, instances.inputs['Points']); links.new(obj.outputs['Geometry'], instances.inputs['Instance'])
        matrix = nodes.new('GeometryNodeInputNamedAttribute'); matrix.data_type = 'FLOAT4X4'; matrix.inputs['Name'].default_value = 'sourceFullMatrix'
        exact = nodes.new('GeometryNodeSetInstanceTransform'); links.new(instances.outputs['Instances'], exact.inputs['Instances']); links.new(matrix.outputs['Attribute'], exact.inputs['Transform']); links.new(exact.outputs['Instances'], gout.inputs[outgoing.name]); return tree

    for at, record in enumerate(package['meshes']):
        g=geometries[record['geometry']]; data=buffers.geometry(g); transforms=full_transforms(record,buffers,conversion); count=len(transforms); faces=len(data['index'])
        # Some Three.js geometry attributes belong to instances, not vertices.
        # Keep those exact source values on the corresponding carrier points.
        instance_attrs={}
        for attr in list(data):
            if attr not in ('index','position') and len(data[attr])!=len(data['position']):
                if len(data[attr])!=count:raise RuntimeError('Unsupported attribute domain '+attr)
                instance_attrs[attr]=data.pop(attr)
        if record.get('opticalKind380')=='sky-boundary-353':
            # Exact raw sky sphere is retained in the package. Its material is
            # an infinite spherical boundary, explicitly transferred to World.
            report.setdefault('opticalBoundaryGeometry380',[]).append({'name':record['name'],'triangles':faces*count,'replacement':'exact353 spherical radiance field in World','rawGeometryRetainedInPackage':True})
            imported_triangles+=faces*count; del data; continue
        tint=buffers.binary(record['instanceColors']).reshape(count,3) if 'instanceColors' in record else np.ones((count,3),np.float32)
        rgb=optics[at]['emissionRGB']; emit_back=optics[at]['emitBack']; prototype=mesh_data(record,g,data,at); key=prototype.as_pointer()
        if key not in templates:
            template=bpy.data.objects.new('source prototype '+str(len(templates)),prototype); templates_collection.objects.link(template); template.hide_render=True; template.hide_set(True); templates[key]=template
        point_mesh=bpy.data.meshes.new('380 source matrix points '+str(at)); point_mesh.vertices.add(count)
        for attr, values in instance_attrs.items():
            size=values.shape[1]; name='sourceRaw_'+attr
            if size==1: point_attribute(point_mesh,name,values[:,0],'FLOAT')
            elif size in (2,3):
                expanded=np.zeros((count,3),np.float32);expanded[:,:size]=values;point_attribute(point_mesh,name,expanded,'FLOAT_VECTOR')
            elif size==4:point_attribute(point_mesh,name,values,'FLOAT_COLOR')
            else:raise RuntimeError('Unsupported source instance attribute '+attr)
        # Carrier vertices remain zero. Full absolute C*world*instance matrices
        # are installed after InstanceOnPoints; neither Euler nor TRS is used.
        ma=point_mesh.attributes.new('sourceFullMatrix','FLOAT4X4','POINT'); stored=np.asarray(transforms,np.float32); ma.data.foreach_set('value',np.ascontiguousarray(stored.transpose(0,2,1)).ravel())
        readback=np.empty((count,4,4),np.float32); ma.data.foreach_get('value',readback.ravel()); readback=readback.transpose(0,2,1)
        if not np.array_equal(stored,readback): raise RuntimeError('Actual full matrix attribute changed')
        max_residual=max(max_residual,float(np.max(np.abs(stored.astype(np.float64)-transforms),initial=0)))
        determinants=np.linalg.det(transforms[:,:3,:3]); singular+=int(np.count_nonzero(np.abs(determinants)<=1e-12)); reflected+=int(np.count_nonzero(determinants<0))
        colors=np.ones((count,4),np.float32); colors[:,:3]=tint; point_attribute(point_mesh,'instanceColor',colors,'FLOAT_COLOR')
        emission=np.ones((count,4),np.float32); emission[:,:3]=rgb; point_attribute(point_mesh,'physical252_emissionRGB',emission,'FLOAT_COLOR'); point_attribute(point_mesh,'physical252_emitBack',emit_back,'FLOAT')
        trace=point_mesh.attributes.new(name='sourceInstanceIndex',type='INT',domain='POINT'); trace.data.foreach_set('value',np.arange(count,dtype=np.int32))
        obj=bpy.data.objects.new((record['name'] or 'source-'+str(at))[:48]+' full affine shared',point_mesh); scene.collection.objects.link(obj); modifier=obj.modifiers.new('complete full matrix instances','NODES'); modifier.node_group=gn_group(templates[key]); linked+=count; imported_triangles+=count*faces
        del data,transforms,stored,readback,tint,rgb,emit_back,colors,emission
        if at%50==0: print('PHYSICAL380_SOURCE',at,'/',len(package['meshes']),'linkedFullAffine',linked,flush=True)
    expected = package['statistics']['triangles']
    if imported_triangles != expected: raise RuntimeError('No source triangle deletion is allowed: '+str((imported_triangles, expected)))
    report['geometry252'] = {'originalPrototypeCount': len(geometries), 'contentAndMaterialSharedMeshes': len(prototypes), 'sourceInstances': sum(m['instances'] for m in package['meshes']), 'linkedFullAffineInstances': linked, 'bakedShearedReflectedOrSingularInstances': baked, 'singularInstancesRetained': singular, 'reflectedInstancesRetained': reflected, 'sourceTriangles': expected, 'importedTriangles': imported_triangles, 'allSourceTrianglesRetained': True, 'maximumFullMatrixFloatStorageResidual': max_residual, 'maximumBakedVertexResidualMetres': max_vertex_residual, 'fullWorldMatricesRetainedWithoutDecomposition': True, 'originalDataPreserved': 'Actual co, full float3 custom_normal, complete source UV and colors/custom attributes; exact raw original buffers retained in immutable package', 'noRedundantPositionNormalUVDebugCopies': True, 'bufferCache': {'limitBytes': buffers.cache_limit_bytes, 'observedCachedBytesPeak': buffers.cache_high_water, 'payloadReads': buffers.payload_reads}, 'vertexAndInstanceColorDomainsSeparate': True, 'negativeDeterminantHandledByActualAffineInstances': True, 'hiddenPrototypesRemainIdentity': True, 'exactImportedMaterialAliasesUsedForGeometrySharing': True, 'decimation': False, 'substituteModel': False, 'coordinateConversion': 'One rigid +pi/2 X: Three (x,y,z) to Blender (x,-z,y)'}
    report['uvStorage284'] = {**uv_storage, 'originalFloatXYUnchanged': True, 'nativeUVSeamsAlreadySplitInOriginalVertices': True, 'tangentDependentMaterialsRetainCornerUVLayers': True, 'shaderLookup': 'Same named sourceUV through GEOMETRY Attribute Vector; POINT and CORNER both use native triangle barycentric interpolation', 'originalRawPackagePreserved': True}
    return conversion
