"""Physical material-state transfer of frozen Scene04 meshes and vertex fields.

The geometry and instance matrices come from a verified native source frame.
Custom GLSL hooks/planar reflection approximations are explicitly not equivalent
across renderers. This diagnostic does not replace native scene acceptance.
"""
import bpy, json, math, os, sys, time, hashlib
from pathlib import Path
import numpy as np
from mathutils import Matrix, Vector, Quaternion
ROOT=Path(os.environ.get('SCENE_PACKAGE','lookdev/scene04-porch135/export-r06')).resolve()
OUT=Path(os.environ.get('CYCLES_OUTPUT','lookdev/scene04-porch135/cycles-r06')).resolve();OUT.mkdir(parents=True,exist_ok=True)
MODE=os.environ.get('LIGHTING_MODE','scene04-porch135-source-aligned-physical-daylight')
REPO=Path(os.environ.get('REPO_ROOT',Path(__file__).resolve().parents[2])).resolve()
scene_data=json.loads((ROOT/'scene.json').read_text())
source_export=json.loads((ROOT/'export-report.json').read_text())
if source_export.get('status')!='exported-existing-geometry' or not source_export.get('servedSource',{}).get('allMatch'):raise ValueError('Verified complete official export required before import')
native_report_path=Path(os.environ.get('NATIVE_REPORT','qa/ten-reference/04/iteration-scene04-porch135-r06/report.json')).resolve()
native_report=json.loads(native_report_path.read_text())
if native_report.get('status')!='rendered-review' or source_export.get('sourceHash')!=native_report.get('source',{}).get('hash'):raise ValueError('Export does not match the reviewed native source')
canonical_reference=int(scene_data.get('view',{}).get('reference',0))
report={'sourceCommit':source_export.get('sourceCommit'),'sourceHash':source_export.get('sourceHash'),'renderScript':{'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'sourceStatistics':scene_data['statistics'],'lightingMode':MODE,'blender':bpy.app.version_string,'scope':scene_data.get('renderingScope'),'nativeReport':str(native_report_path),'geometryRebuilt':False,'excluded':scene_data['excluded'],'warnings':[],'status':'importing','started':time.time()}
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene

def binary(record):
    kind={'Float32Array':'<f4','Uint32Array':'<u4','Uint16Array':'<u2'}[record['type']]
    data=np.fromfile(ROOT/'assets'/record['file'],dtype=kind)
    if len(data)!=record['count']: raise ValueError('Truncated geometry buffer '+record['file'])
    return data

def value(node,names,v):
    for name in names:
        if name in node.inputs: node.inputs[name].default_value=v;return node.inputs[name]
    return None

import importlib.util
material_path=Path(__file__).with_name('material-nodes04-vertex-state.py')
spec=importlib.util.spec_from_file_location('scene04_materials',material_path);material_module=importlib.util.module_from_spec(spec);spec.loader.exec_module(material_module)
materials,geometry_materials,material_records,instance_colored,textures=material_module.build_materials(scene_data,ROOT,report)
attribute_path=Path(__file__).with_name('vertex-attributes04.py')
attribute_spec=importlib.util.spec_from_file_location('scene04_vertex_attributes',attribute_path);attribute_module=importlib.util.module_from_spec(attribute_spec);attribute_spec.loader.exec_module(attribute_module)
attribute_transfer=attribute_module.VertexTransfer(ROOT,scene_data,report)
report['attributeScript']={'file':attribute_path.name,'sha256':hashlib.sha256(attribute_path.read_bytes()).hexdigest()}
report['materialScript']={'file':material_path.name,'sha256':hashlib.sha256(material_path.read_bytes()).hexdigest()}
report['importerProvenance']={'source':'lookdev/scene04-solmax-cycles-20261021/render-vertex-state04.py (retained importer, new native source and light calibration)','scope':'Actual linked instance/full-affine importer and source vertex/instance attribute domains; no Scene01 sunset profile, scene02 sky helper, extra water plane or scene06 lighting fit is included.'}
geo={g['id']:g for g in scene_data['geometries']}; loaded={}; mesh_cache={}; template_objects={}; imported_triangles=0; collapsed_instance_count=0
linked_instance_count=0; sheared_instance_count=0; sheared_vertex_count=0; sheared_triangle_count=0; max_trs_residual=0.0; max_shear_residual=0.0
conversion=Matrix.Rotation(math.pi/2,4,'X')
template_collection=bpy.data.collections.new('Geometry Nodes source meshes (hidden; linked, not flattened)')
scene.collection.children.link(template_collection)

def mesh_for(record,g,data,at):
    key=(g['id'],tuple(record['materials']))
    if key in mesh_cache:return mesh_cache[key]
    p=data['position']; indices=data['index']; vcount=len(p); fcount=len(indices)
    mesh=bpy.data.meshes.new((record['name'] or 'source-mesh-'+str(at))[:60]+' source')
    mesh.vertices.add(vcount);mesh.vertices.foreach_set('co',p.astype(np.float32,copy=False).ravel())
    faces=indices.astype(np.int32,copy=False)
    mesh.loops.add(faces.size);mesh.loops.foreach_set('vertex_index',faces.ravel())
    mesh.polygons.add(fcount);mesh.polygons.foreach_set('loop_start',np.arange(fcount,dtype=np.int32)*3);mesh.polygons.foreach_set('loop_total',np.full(fcount,3,dtype=np.int32));mesh.polygons.foreach_set('use_smooth',np.ones(fcount,dtype=np.bool_));mesh.update(calc_edges=True)
    if 'normal' in data:
        try:mesh.normals_split_custom_set_from_vertices(data['normal'].astype(np.float32,copy=False).tolist())
        except Exception as e:report['warnings'].append('Custom normals '+str(record['name'])+': '+str(e))
    if 'uv' in data:
        uv=data['uv'][faces.ravel(),:2].astype(np.float32,copy=False);layer=mesh.uv_layers.new(name='sourceUV');layer.data.foreach_set('uv',uv.ravel())
    needs_color=any(material_records[mid].get('vertexColors') for mid in record['materials'])
    if needs_color or 'color' in data:
        colors=np.ones((vcount,4),dtype=np.float32)
        if 'color' in data:colors[:,:min(4,data['color'].shape[1])]=data['color'][:,:4]
        attr=mesh.color_attributes.new(name='sourceColor',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',colors.ravel())
    if any(mid in instance_colored for mid in record['materials']):
        attr=mesh.color_attributes.new(name='instanceColor',type='FLOAT_COLOR',domain='POINT');white=np.ones((vcount,4),dtype=np.float32);attr.data.foreach_set('color',white.ravel())
    for mid in record['materials']:mesh.materials.append(materials[mid])
    if len(record['materials'])>1 and g['groups']:
        owners=np.zeros(fcount,dtype=np.int32)
        for group in g['groups']:owners[group['start']//3:(group['start']+group['count'])//3]=group.get('materialIndex',0)
        mesh.polygons.foreach_set('material_index',owners)
    attribute_transfer.attach(mesh,g,data,record['materials'],material_records,expected_loop_uv=uv if 'uv' in data else None)
    mesh_cache[key]=mesh;return mesh

def load_geometry(g):
    if g['id'] not in loaded:
        loaded[g['id']]={k:binary(v).reshape(-1,v['itemSize']) for k,v in g['attributes'].items()}
        loaded[g['id']]['index']=binary(g['index']).reshape(-1,3).astype(np.int64)
    return loaded[g['id']]

def use_geometry_variant(obj,material_ids):
    for i,mid in enumerate(material_ids):
        if mid not in instance_colored:continue
        slot=obj.material_slots[i];slot.link='OBJECT';slot.material=geometry_materials[mid]

def build_gn_group(template):
    tree=bpy.data.node_groups.new('Exact linked source instances (orthogonal TRS only)','GeometryNodeTree')
    geo_in=tree.interface.new_socket(name='Points',in_out='INPUT',socket_type='NodeSocketGeometry')
    geo_out=tree.interface.new_socket(name='Instances',in_out='OUTPUT',socket_type='NodeSocketGeometry')
    nodes=tree.nodes;links=tree.links;gin=nodes.new('NodeGroupInput');gout=nodes.new('NodeGroupOutput')
    obj_info=nodes.new('GeometryNodeObjectInfo');obj_info.transform_space='ORIGINAL';obj_info.inputs['Object'].default_value=template;obj_info.inputs['As Instance'].default_value=True
    rotate_attr=nodes.new('GeometryNodeInputNamedAttribute');rotate_attr.data_type='FLOAT_VECTOR';rotate_attr.inputs['Name'].default_value='sourceRotationEuler'
    scale_attr=nodes.new('GeometryNodeInputNamedAttribute');scale_attr.data_type='FLOAT_VECTOR';scale_attr.inputs['Name'].default_value='sourceScale'
    euler=nodes.new('FunctionNodeEulerToRotation');links.new(rotate_attr.outputs['Attribute'],euler.inputs['Euler'])
    color_attr=nodes.new('GeometryNodeInputNamedAttribute');color_attr.data_type='FLOAT_COLOR';color_attr.inputs['Name'].default_value='instanceColor'
    store_color=nodes.new('GeometryNodeStoreNamedAttribute');store_color.data_type='FLOAT_COLOR';store_color.domain='POINT';store_color.inputs['Name'].default_value='instanceColor';links.new(gin.outputs[geo_in.name],store_color.inputs['Geometry']);links.new(color_attr.outputs['Attribute'],store_color.inputs['Value'])
    instance=nodes.new('GeometryNodeInstanceOnPoints');links.new(store_color.outputs['Geometry'],instance.inputs['Points']);links.new(obj_info.outputs['Geometry'],instance.inputs['Instance']);links.new(euler.outputs['Rotation'],instance.inputs['Rotation']);links.new(scale_attr.outputs['Attribute'],instance.inputs['Scale']);links.new(instance.outputs['Instances'],gout.inputs[geo_out.name])
    return tree

for at,record in enumerate(scene_data['meshes']):
    g=geo[record['geometry']];data=load_geometry(g);p=data['position'];indices=data['index'];fcount=len(indices);vcount=len(p)
    source_mesh=mesh_for(record,g,data,at);world=Matrix(np.array(record['matrix'],dtype=np.float64).reshape(4,4).T.tolist());objname=(record['name'] or 'source-object-'+str(at))[:56]
    if 'instanceMatrices' not in record:
        obj=bpy.data.objects.new(objname,source_mesh);scene.collection.objects.link(obj);obj.matrix_world=world;use_geometry_variant(obj,record['materials']);imported_triangles+=fcount
        continue
    count=record['instances'];raw=binary(record['instanceMatrices']).reshape(count,4,4).transpose(0,2,1);instance_colors=binary(record['instanceColors']).reshape(count,3) if 'instanceColors' in record else None
    good=[];bad=[];positions=[];rotations=[];scales=[];all_dets=np.linalg.det(raw[:,:3,:3]);valid=np.isfinite(all_dets)&(np.abs(all_dets)>1e-12)
    if not np.all(valid):
        collapsed_instance_count+=int(np.count_nonzero(~valid));report.setdefault('excludedCollapsedInstances',[]).append({'name':record['name'],'count':int(np.count_nonzero(~valid)),'reason':'Singular source transform has no invertible normal matrix; excluded only because it has zero or near-zero area.'})
    for i in np.flatnonzero(valid):
        m=Matrix(raw[i].tolist());loc,quat,scale=m.decompose();recon=Matrix.LocRotScale(loc,quat,scale)
        residual=max(abs(float(m[r][c]-recon[r][c])) for r in range(3) for c in range(3))
        normalized=[];linear=raw[i,:3,:3];lens=np.linalg.norm(linear,axis=0)
        gram=linear.T@linear
        for a in range(3):
            for b in range(a+1,3):normalized.append(abs(float(gram[a,b]/max(lens[a]*lens[b],1e-30))))
        shear=max(normalized,default=0.0)
        if shear>1e-7:
            bad.append(int(i));max_shear_residual=max(max_shear_residual,shear)
        else:
            good.append(int(i));positions.append(tuple(loc));rotations.append(tuple(quat.to_euler('XYZ')));scales.append(tuple(scale));max_trs_residual=max(max_trs_residual,residual)
    if good:
        point_mesh=bpy.data.meshes.new((objname+' points')[:62]);point_mesh.vertices.add(len(good));point_mesh.vertices.foreach_set('co',np.asarray(positions,dtype=np.float32).ravel())
        rotattr=point_mesh.attributes.new(name='sourceRotationEuler',type='FLOAT_VECTOR',domain='POINT');rotattr.data.foreach_set('vector',np.asarray(rotations,dtype=np.float32).ravel())
        scaleattr=point_mesh.attributes.new(name='sourceScale',type='FLOAT_VECTOR',domain='POINT');scaleattr.data.foreach_set('vector',np.asarray(scales,dtype=np.float32).ravel())
        pointcolors=np.ones((len(good),4),dtype=np.float32)
        if instance_colors is not None:pointcolors[:,:3]=instance_colors[good]
        colorattr=point_mesh.attributes.new(name='instanceColor',type='FLOAT_COLOR',domain='POINT');colorattr.data.foreach_set('color',pointcolors.ravel())
        points=bpy.data.objects.new(objname+' linked instances',point_mesh);scene.collection.objects.link(points);points.matrix_world=world
        mod=points.modifiers.new('Linked source geometry; exact TRS matrices','NODES')
        template=template_objects.get((g['id'],tuple(record['materials'])))
        if template is None:
            template=bpy.data.objects.new((objname+' source geometry')[:62],source_mesh);template_collection.objects.link(template);template.hide_render=True;template.hide_set(True);template_objects[(g['id'],tuple(record['materials']))]=template
        mod.node_group=build_gn_group(template)
        linked_instance_count+=len(good);imported_triangles+=len(good)*fcount
    if bad:
        n=len(bad);coords=np.empty((n*vcount,3),dtype=np.float32);normals=np.empty_like(coords) if 'normal' in data else None
        faces=np.tile(indices[None,:,:],(n,1,1)).astype(np.int64,copy=False)+(np.arange(n,dtype=np.int64)*vcount)[:,None,None]
        colors=np.ones((n*vcount,4),dtype=np.float32) if any(material_records[mid].get('vertexColors') for mid in record['materials']) else None
        if colors is not None and 'color' in data:colors[:,:min(4,data['color'].shape[1])]=np.tile(data['color'],(n,1))[:,:4]
        shear_instance_colors=np.ones((n*vcount,4),dtype=np.float32) if any(mid in instance_colored for mid in record['materials']) else None
        if shear_instance_colors is not None and instance_colors is not None:
            for j,i in enumerate(bad):shear_instance_colors[j*vcount:(j+1)*vcount,:3]=instance_colors[i]
        for j,i in enumerate(bad):
            transform=raw[i];sl=slice(j*vcount,(j+1)*vcount);coords[sl]=p@transform[:3,:3].T+transform[:3,3]
            if normals is not None:
                ns=data['normal']@np.linalg.inv(transform[:3,:3]);length=np.maximum(np.linalg.norm(ns,axis=1),1e-12);normals[sl]=ns/length[:,None]
            if np.linalg.det(transform[:3,:3])<0:faces[j]=faces[j][:,[0,2,1]]
        uv=data['uv'][faces.reshape(-1)%vcount,:2].astype(np.float32,copy=False) if 'uv' in data else None
        mesh=bpy.data.meshes.new((objname+' exact affine shears')[:62]);mesh.vertices.add(len(coords));mesh.vertices.foreach_set('co',coords.ravel());mesh.loops.add(faces.size);mesh.loops.foreach_set('vertex_index',faces.ravel().astype(np.int32));mesh.polygons.add(len(faces.reshape(-1,3)));mesh.polygons.foreach_set('loop_start',np.arange(len(faces.reshape(-1,3)),dtype=np.int32)*3);mesh.polygons.foreach_set('loop_total',np.full(len(faces.reshape(-1,3)),3,dtype=np.int32));mesh.polygons.foreach_set('use_smooth',np.ones(len(faces.reshape(-1,3)),dtype=np.bool_));mesh.update(calc_edges=True)
        if normals is not None:
            try:mesh.normals_split_custom_set_from_vertices(normals.tolist())
            except Exception as e:report['warnings'].append('Sheared custom normals '+str(record['name'])+': '+str(e))
        if uv is not None:uvlayer=mesh.uv_layers.new(name='sourceUV');uvlayer.data.foreach_set('uv',uv.ravel())
        if colors is not None:attr=mesh.color_attributes.new(name='sourceColor',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',colors.ravel())
        if shear_instance_colors is not None:attr=mesh.color_attributes.new(name='instanceColor',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',shear_instance_colors.ravel())
        for mid in record['materials']:mesh.materials.append(geometry_materials[mid])
        if len(record['materials'])>1 and g['groups']:
            owners=np.zeros(fcount,dtype=np.int32)
            for group in g['groups']:owners[group['start']//3:(group['start']+group['count'])//3]=group.get('materialIndex',0)
            mesh.polygons.foreach_set('material_index',np.tile(owners,n))
        attribute_transfer.attach(mesh,g,data,record['materials'],material_records,tiles=n,expected_loop_uv=uv)
        baked=bpy.data.objects.new(objname+' baked affine shear subset',mesh);scene.collection.objects.link(baked);baked.matrix_world=world
        sheared_instance_count+=n;sheared_vertex_count+=len(coords);sheared_triangle_count+=len(faces.reshape(-1,3));imported_triangles+=len(faces.reshape(-1,3))
    if at%50==0:print('SOURCE_MESH',at,'/',len(scene_data['meshes']),'linked',linked_instance_count,'affine-baked',sheared_instance_count,flush=True)

report['affinePreservation']={'parentMatrices':'Retained as full source object matrices. Source parent shear residual is checked separately below.','linkedLocalMatrices':'Geometry Nodes Object Info + Instance on Points with TRS decomposition only for matrices with normalized column shear residual <= 1e-7; retained translations, rotations and scales.','linkedInstances':linked_instance_count,'bakedShearedInstances':sheared_instance_count,'bakedShearedTriangles':sheared_triangle_count,'bakedShearedVertices':sheared_vertex_count,'maxLinkedTRSMatrixResidual':max_trs_residual,'maxBakedShearResidual':max_shear_residual,'flattenedOnlyForShearedTransforms':True,'geometryDecimated':False}

attribute_transfer.finish(OUT/'vertex-state-transfer.json')
parent_shear=0.0
for rec in scene_data['meshes']:
 m=np.asarray(rec['matrix'],dtype=np.float64).reshape(4,4).T[:3,:3];length=np.linalg.norm(m,axis=0);gram=m.T@m
 parent_shear=max(parent_shear,max((abs(float(gram[a,b]/max(length[a]*length[b],1e-30))) for a in range(3) for b in range(a+1,3)),default=0))
report['affinePreservation']['maxSourceParentShearResidual']=parent_shear
if parent_shear>1e-7:raise ValueError('Unexpected parent shear requires full parent affine baking; do not silently decompose')
if imported_triangles!=scene_data['statistics']['triangles']:raise ValueError('Source triangle preservation failed')

sun_yup=None;light_transfers=[]
for rec in scene_data['lights']:
 if rec['intensity']<=0 or rec['type']=='HemisphereLight':continue
 typ={'DirectionalLight':'SUN','PointLight':'POINT','SpotLight':'SPOT','RectAreaLight':'AREA'}.get(rec['type'])
 if not typ:continue
 light=bpy.data.lights.new(rec['name'] or typ,typ);light.color=rec['color'];obj=bpy.data.objects.new(rec['name'] or typ,light);scene.collection.objects.link(obj);obj.matrix_world=Matrix(np.array(rec['matrix']).reshape(4,4).T.tolist())
 intensity=rec['intensity']
 if typ=='SUN':
  light.energy=intensity*float(os.environ.get('CYCLES_SUN_GAIN','1.45'));light.angle=math.radians(float(os.environ.get('CYCLES_SUN_ANGLE','.53')));sun_yup=(obj.location-Vector(rec['target'])).normalized()
 elif typ=='AREA':light.shape='RECTANGLE';light.size=rec.get('width',1);light.size_y=rec.get('height',1);light.energy=intensity*light.size*light.size_y*math.pi
 else:light.energy=intensity*4*math.pi;light.shadow_soft_size=.035
 if typ=='SPOT':light.spot_size=2*(rec.get('angle') or .8);light.spot_blend=rec.get('penumbra') or .2
 if typ in ['SUN','SPOT'] and rec.get('target'):obj.rotation_euler=(Vector(rec['target'])-obj.location).to_track_quat('-Z','Y').to_euler()
 light_transfers.append({'name':rec['name'],'type':typ,'sourceIntensity':intensity,'cyclesEnergy':light.energy,'sourceLinearColor':rec['color']})
if sun_yup is None:raise ValueError('Expected actual exported Scene04 directional sun')

cam_data=bpy.data.cameras.new('source04-monumental134-reference-camera');camera=bpy.data.objects.new('source04-monumental134-reference-camera',cam_data);scene.collection.objects.link(camera);camera.matrix_world=Matrix(np.array(scene_data['cameraMatrix']).reshape(4,4).T.tolist());cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=24;cam_data.lens=12/math.tan(math.radians(scene_data['view']['fov'])/2);cam_data.clip_start=.08;cam_data.clip_end=1200;scene.camera=camera
bpy.context.view_layer.update()
for obj in list(scene.objects):obj.matrix_world=conversion@obj.matrix_world
bpy.context.view_layer.update()
report['worldCoordinateConversion']='One rigid +90degree X rotation of all source objects, instance parents, lights and the exact reference camera. Y-up becomes Z-up; no geometry/camera fit.'
report['referenceCamera']={'sourceMatrix':scene_data['cameraMatrix'],'sourceVerticalFov':scene_data['view']['fov'],'sourcePositionYUp':scene_data['view']['position'],'blenderLens':cam_data.lens,'verticalSensorMm':24,'dofAdded':False}

# No new atmosphere/backdrop mesh. One physical world supplies camera rays,
# actual bounce illumination and true surface reflections from the same sky.
world=bpy.data.worlds.new('Scene04 source-aligned physical daytime sky');scene.world=world;world.use_nodes=True;n=world.node_tree.nodes;n.clear();l=world.node_tree.links
sky=n.new('ShaderNodeTexSky');sky.name='SCENE04_PHYSICAL_SKY';available=[v.identifier for v in sky.bl_rna.properties['sky_type'].enum_items];sky.sky_type=next(v for v in ['MULTIPLE_SCATTERING','NISHITA','SINGLE_SCATTERING','HOSEK_WILKIE'] if v in available)
sun_zup=conversion.to_3x3()@sun_yup
if hasattr(sky,'sun_elevation'):sky.sun_elevation=math.asin(max(-1,min(1,sun_zup.z)))
if hasattr(sky,'sun_rotation'):sky.sun_rotation=math.atan2(sun_zup.y,sun_zup.x)
if hasattr(sky,'sun_direction'):sky.sun_direction=sun_zup
if hasattr(sky,'sun_disc'):sky.sun_disc=False
for key,v in [('air_density',1.0),('dust_density',.40),('ozone_density',1.20),('altitude',0.0)]:
 if hasattr(sky,key):setattr(sky,key,v)
background=n.new('ShaderNodeBackground');background.name='SCENE04_SKY_RADIANCE_GAIN';background.inputs['Strength'].default_value=float(os.environ.get('CYCLES_WORLD_GAIN','.075'));l.new(sky.outputs['Color'],background.inputs['Color']);output=n.new('ShaderNodeOutputWorld');l.new(background.outputs[0],output.inputs[0])
report['lightCalibration']={'physicalSky':sky.sky_type,'availableSkyModels':available,'skyWorldGain':background.inputs['Strength'].default_value,'sunDirectionYUp':list(sun_yup),'sunDirectionZUp':list(sun_zup),'sunDiskEnabled':getattr(sky,'sun_disc',None),'sourceHemisphereLight':'Replaced by shadowed physical sky GI; not added a second time as a nonphysical fill.','sourceLights':light_transfers,'calibrationScope':'Source linear direct irradiance starting point retained; point power uses intensity*4pi. This is a documented radiometric proxy, not an absolute photometric measurement. No new studio lights, photographic shadows or environment geometry.'}

scene.render.engine='CYCLES';scene.cycles.device='GPU';preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
for device in preferences.devices:device.use=device.type=='METAL'
if not any(device.use for device in preferences.devices):raise RuntimeError('No Metal rendering device')
scene.cycles.samples=int(os.environ.get('CYCLES_SAMPLES','96'));scene.cycles.use_denoising=os.environ.get('CYCLES_DENOISE','1')=='1';scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.adaptive_threshold=.025
scene.cycles.max_bounces=10;scene.cycles.diffuse_bounces=5;scene.cycles.glossy_bounces=5;scene.cycles.transmission_bounces=8;scene.cycles.transparent_max_bounces=24;scene.cycles.sample_clamp_indirect=10
scene.render.resolution_x=int(os.environ.get('CYCLES_SIZE','1254'));scene.render.resolution_y=scene.render.resolution_x;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.film_transparent=False
scene.view_settings.view_transform='AgX';scene.view_settings.exposure=float(os.environ.get('CYCLES_EXPOSURE',str(.04)));scene.view_settings.gamma=1
render_name=os.environ.get('CYCLES_RENDER_NAME','scene04-porch135-physical-r06.png')
if Path(render_name).name!=render_name:raise ValueError('Render name must be a filename')
scene.render.filepath=str(OUT/render_name)
report.update(status='rendering-physical-daylight',importedTriangles=imported_triangles,sourceTriangleCount=scene_data['statistics']['triangles'],geometryTriangleCountPreserved=imported_triangles==scene_data['statistics']['triangles'],excludedCollapsedInstanceCount=collapsed_instance_count,materialAttributeParity={'linkedInstances':'ShaderNodeAttribute Instancer with explicit POINT Store Named Attribute; exact source instance color once','directAndBakedShear':'Separate Geometry domain material variants; white direct fallback, source RGB for exact affine bake','vertexColorMultiply':'Only when source vertexColors flag is true; sourceColor POINT attribute preserved'},physicalWater={'geometry':'Two actual exported pond surfaces only; no added water plane or backdrop','IOR':1.333,'roughness':.075,'transmission':.92,'reflections':'Cycles actual scene/world radiance'},transport={'maxBounces':10,'diffuseBounces':5,'glossyBounces':5,'transmissionBounces':8,'transparentBounces':24,'denoised':scene.cycles.use_denoising},viewTransform={'name':'AgX','exposureStops':scene.view_settings.exposure,'nativePixelEquivalence':False},visualAccepted=False)
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if os.environ.get('CYCLES_SAVE_BLEND','1')=='1':
 bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'scene04-porch135-physical.blend'),compress=True)
t=time.time();bpy.ops.render.render(write_still=True)
report['fullFrame']={'file':render_name,'size':[scene.render.resolution_x,scene.render.resolution_y],'sha256':hashlib.sha256(Path(scene.render.filepath).read_bytes()).hexdigest(),'seconds':time.time()-t,'samples':scene.cycles.samples}
if os.environ.get('CYCLES_RENDER_DETAIL','0')=='1':
 # Fresh path traces of physical source-camera subfrusta; no image cropping or
 # enlargement. Integer border coordinates avoid the old one-pixel rounding.
 logical=1254;virtual=int(os.environ.get('CYCLES_DETAIL_VIRTUAL','4096'));report['detailFrames']=[]
 for name,crop in [('paving',(300,760,480)),('roof',(285,105,680))]:
  size=round(crop[2]/logical*virtual);left=round(crop[0]/logical*virtual);top=round(crop[1]/logical*virtual);bottom=virtual-top-size
  scene.render.resolution_x=scene.render.resolution_y=virtual;scene.render.use_border=True;scene.render.use_crop_to_border=True
  scene.render.border_min_x=(left+.25)/virtual;scene.render.border_max_x=(left+size+.25)/virtual;scene.render.border_min_y=(bottom+.25)/virtual;scene.render.border_max_y=(bottom+size+.25)/virtual
  scene.render.filepath=str(OUT/(name+'-detail-native-cycles.png'));t=time.time();bpy.ops.render.render(write_still=True)
  report['detailFrames'].append({'file':name+'-detail-native-cycles.png','requestedSourceCropPixels':[*crop,logical],'virtualFullResolution':virtual,'nominalNativeSize':size,'actualSourcePixelBounds':[(left+.25)*logical/virtual,(top-.25)*logical/virtual,size*logical/virtual],'sha256':hashlib.sha256(Path(scene.render.filepath).read_bytes()).hexdigest(),'seconds':time.time()-t,'freshPathTrace':True,'upscaled':False})
report.update(status='path-traced-review',finished=time.time(),photographicAcceptance=False)
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print('SCENE04_CYCLES_COMPLETE',json.dumps({'status':report['status'],'sourceHash':report['sourceHash'],'fullFrame':report['fullFrame'],'detailFrames':report.get('detailFrames')}),flush=True)

