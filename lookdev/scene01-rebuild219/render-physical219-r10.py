"""One source-pinned Scene01 Cycles GI diagnostic; no replacement scene or Blend."""
import bpy, json, math, os, time, hashlib, sys, traceback
from pathlib import Path
import numpy as np
from mathutils import Matrix, Vector

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[1]
SETTINGS=json.loads(Path(os.environ.get('PHYSICAL219_SETTINGS',HERE/'physical-r10-settings.json')).read_text())
ROOT=(REPO/SETTINGS['exportDirectory']).resolve()
OUT=(REPO/SETTINGS['outputDirectory']).resolve();OUT.mkdir(parents=True,exist_ok=True)
if (OUT/'scene01-d2587-physical-r10.png').exists():raise RuntimeError('Preserve existing physical result; do not render twice')
source_export=json.loads((ROOT/'export-report.json').read_text())
scene_bytes=(ROOT/'scene.json').read_bytes();scene_data=json.loads(scene_bytes)
VERIFICATION=Path(os.environ.get('PHYSICAL219_VERIFICATION',HERE/'export-verification-r09.json'))
verification=json.loads(VERIFICATION.read_text())
digest=lambda b:hashlib.sha256(b).hexdigest()
if source_export['sourceHash']!=SETTINGS['expectedSourceHash'] or verification['sourceHash']!=SETTINGS['expectedSourceHash']:raise RuntimeError('Source pin differs')
if source_export['status']!='exported-existing-geometry' or source_export['errors'] or verification['status']!='all-export-payloads-byte-and-hash-verified':raise RuntimeError('Export validation incomplete')
if digest(scene_bytes)!=verification['manifestSha256'] or digest((ROOT/'export-report.json').read_bytes())!=verification['exportReportSha256']:raise RuntimeError('Verified manifest changed')
report={'status':'importing','startedAt':time.time(),'sourceHash':source_export['sourceHash'],'sourceCommit':source_export['sourceCommit'],'sourceStatistics':scene_data['statistics'],'sourceManifestSha256':digest(scene_bytes),'settings':SETTINGS,'renderScriptSha256':digest(Path(__file__).read_bytes()),'verificationSha256':digest(VERIFICATION.read_bytes()),'blender':bpy.app.version_string,'photographicAcceptance':False,'nativePixelEquivalence':False,'warnings':[],'excluded':scene_data['excluded']}
def save_report(): (OUT/'report.json').write_text(json.dumps(report,indent=2))
save_report()
def record_exception(kind,error,trace):
    report['status']='failed';report['error']=''.join(traceback.format_exception(kind,error,trace));save_report();sys.__excepthook__(kind,error,trace)
sys.excepthook=record_exception
bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene

# Verify the actual installed sky RNA before loading large geometry/textures.
# This is part of the same single official physical job, not a probe job.
conversion=Matrix.Rotation(math.pi/2,4,'X')
source_suns=[r for r in scene_data['lights'] if r['type']=='DirectionalLight' and r.get('name','')!='warm-courtyard-reflected-daylight']
if len(source_suns)!=1:raise RuntimeError('Expected exactly the actual source solar direction')
sun_record=source_suns[0];sun_matrix=np.array(sun_record['matrix']).reshape(4,4).T;direction=Vector(sun_matrix[:3,3])-Vector(sun_record['target']);direction.normalize();sun_blender=conversion.to_3x3()@direction
physical_world=bpy.data.worlds.new('source-aligned physical atmosphere only');scene.world=physical_world;physical_world.use_nodes=True
sky_nodes=physical_world.node_tree.nodes;sky_nodes.clear();sky_links=physical_world.node_tree.links;physical_sky=sky_nodes.new('ShaderNodeTexSky')
compatibility={'status':'inspecting-installed-RNA','blender':bpy.app.version_string,'beforeLargeGeometryOrTextureImport':True,'sourceHash':source_export['sourceHash'],'selectedSkyType':None,'supportedSkyTypeEnum':[],'requiredProperties':{},'methodChangeAfterFailureAllowed':False}
def save_compatibility(): (OUT/'sky-api-compatibility-r10.json').write_text(json.dumps(compatibility,indent=2))
try:
    compatibility['allRNAProperties']={prop.identifier:{'type':prop.type,'readOnly':prop.is_readonly,**({'enumItems':[{'identifier':e.identifier,'name':e.name,'description':e.description} for e in prop.enum_items]} if prop.type=='ENUM' else {})} for prop in physical_sky.bl_rna.properties}
    compatibility['sunIntensityUnmodifiedActual']=getattr(physical_sky,'sun_intensity',None)
    save_compatibility()
    sky_type_property=physical_sky.bl_rna.properties.get('sky_type')
    if sky_type_property is None:raise RuntimeError('Installed Sky Texture has no sky_type RNA')
    compatibility['supportedSkyTypeEnum']=[{'identifier':e.identifier,'name':e.name,'description':e.description} for e in sky_type_property.enum_items]
    identifiers={e['identifier'] for e in compatibility['supportedSkyTypeEnum']}
    selected=SETTINGS['lighting']['skyType'] if SETTINGS['lighting']['skyType'] in identifiers else None
    if selected is None:raise RuntimeError('The explicitly declared MULTIPLE_SCATTERING enum is not supported by installed Blender')
    physical_sky.sky_type=selected;compatibility['selectedSkyType']=physical_sky.sky_type
    requested={'sun_disc':True,'sun_size':SETTINGS['lighting']['sunAngularDiameterRadians'],'sun_elevation':math.asin(max(-1,min(1,sun_blender.z))),'sun_rotation':math.atan2(sun_blender.x,sun_blender.y),'air_density':SETTINGS['lighting']['airDensity'],'aerosol_density':SETTINGS['lighting']['aerosolDensity'],'ozone_density':SETTINGS['lighting']['ozoneDensity'],'altitude':0.0}
    compatibility['requiredProperties']={name:{'exists':physical_sky.bl_rna.properties.get(name) is not None,'requested':target} for name,target in requested.items()}
    missing=[name for name,info in compatibility['requiredProperties'].items() if not info['exists']]
    save_compatibility()
    if missing:raise RuntimeError('Required physical atmosphere RNA absent: '+','.join(missing))
    for name,target in requested.items():
        prop=physical_sky.bl_rna.properties.get(name)
        if prop is None:
            compatibility['requiredProperties'][name]={'exists':False,'requested':target};save_compatibility();raise RuntimeError('Required physical atmosphere RNA absent: '+name)
        compatibility['requiredProperties'][name]={'exists':True,'type':prop.type,'readOnly':prop.is_readonly,'requested':target}
        setattr(physical_sky,name,target);actual=getattr(physical_sky,name);compatibility['requiredProperties'][name]['actual']=actual
        residual=abs(float(actual)-float(target))
        if name=='sun_rotation':residual=abs(math.atan2(math.sin(float(actual)-target),math.cos(float(actual)-target)))
        compatibility['requiredProperties'][name]['assignmentResidual']=residual
        if residual>1e-6:raise RuntimeError('Physical atmosphere RNA assignment differs: '+name)
    # Official v5.2.1 code: RNA r is negated internally; the geographic
    # conversion gives D=(cos(e)*sin(r),cos(e)*cos(r),sin(e)).
    e=physical_sky.sun_elevation;r=physical_sky.sun_rotation
    effective_sky_sun=Vector((math.cos(e)*math.sin(r),math.cos(e)*math.cos(r),math.sin(e)))
    effective_source_sun=conversion.inverted().to_3x3()@effective_sky_sun
    audit_camera=Matrix(np.array(scene_data['cameraMatrix'],dtype=np.float64).reshape(4,4).T.tolist())
    audit_camera_inverse=audit_camera.inverted().to_3x3();audit_half_tan=math.tan(math.radians(scene_data['view']['fov'])/2)
    def project_sun_vector(source):
        v=audit_camera_inverse@source
        return {'inFrontOfCamera':v.z<0,'uv':[.5+v.x/(-v.z)/(2*audit_half_tan),.5-v.y/(-v.z)/(2*audit_half_tan)]}
    intended_sun_projection=project_sun_vector(direction);effective_sun_projection=project_sun_vector(effective_source_sun)
    sky_direction_residual=(effective_sky_sun-sun_blender.normalized()).length
    sky_projection_residual=[(a-b)*SETTINGS['render']['size'] for a,b in zip(effective_sun_projection['uv'],intended_sun_projection['uv'])]
    compatibility['actualRNAForwardDirectionAudit']={'officialV521ForwardFormula':SETTINGS['rotationRepair']['forwardFormula'],'officialImplementation':SETTINGS['rotationRepair']['officialVersionSources'],'intendedSourceDirectionYUp':list(direction),'intendedSourceDirectionZUp':list(sun_blender),'actualRNAForwardMappedSkyDirectionZUp':list(effective_sky_sun),'actualRNAForwardMappedSkyDirectionSourceYUp':list(effective_source_sun),'directionVectorResidual':sky_direction_residual,'intendedSourceProjection':intended_sun_projection,'actualRNAForwardMappedSkyProjection':effective_sun_projection,'projectionResidualPixels':sky_projection_residual,'actualSolarDiscImageVerificationStillRequired':True,'R09bInputProjectionWasNotPhysicalSkyDirectionProof':True}
    save_compatibility()
    if not effective_sun_projection['inFrontOfCamera'] or sky_direction_residual>SETTINGS['rotationRepair']['directionResidualLimit'] or max(abs(v) for v in sky_projection_residual)>SETTINGS['rotationRepair']['projectionResidualPixelsLimit']:raise RuntimeError('Physical sky forward-mapped source sun direction/projection differs')
    sky_background=sky_nodes.new('ShaderNodeBackground');sky_background.inputs['Strength'].default_value=float(scene_data['environmentIntensity']);sky_links.new(physical_sky.outputs['Color'],sky_background.inputs['Color']);sky_out=sky_nodes.new('ShaderNodeOutputWorld');sky_links.new(sky_background.outputs[0],sky_out.inputs['Surface'])
    compatibility['worldStrengthActual']=sky_background.inputs['Strength'].default_value;compatibility['sunDirectionSourceYUp']=list(direction);compatibility['sunDirectionBlenderZUp']=list(sun_blender);compatibility['status']='actual-RNA-enum-properties-and-values-confirmed';save_compatibility()
except Exception as error:
    compatibility['status']='failed-installed-sky-compatibility';compatibility['error']=str(error);save_compatibility();report['skyAPICompatibility']=compatibility;save_report();raise
report['skyAPICompatibility']=compatibility;save_report();print('PHYSICAL219_SKY_API_CONFIRMED',json.dumps(compatibility),flush=True)

buffer_cache={}
def binary(record):
    kind={'Float32Array':'<f4','Uint32Array':'<u4','Uint16Array':'<u2'}[record['type']]
    expected=source_export['exportedAssets'][record['file']];key=(expected['sha256'],kind,record['count'])
    if key not in buffer_cache:
        data=np.fromfile(ROOT/'assets'/record['file'],dtype=kind)
        if len(data)!=record['count']:raise ValueError('Truncated source buffer '+record['file'])
        data.setflags(write=False);buffer_cache[key]=data
    return buffer_cache[key]

def value(node,names,v):
    for name in names:
        if name in node.inputs:node.inputs[name].default_value=v;return node.inputs[name]
    return None

def mul_color(n,links,a,b):
    node=n.new('ShaderNodeMixRGB');node.blend_type='MULTIPLY';node.inputs[0].default_value=1
    for slot,source in [(1,a),(2,b)]:
        if isinstance(source,tuple):node.inputs[slot].default_value=source
        else:links.new(source,node.inputs[slot])
    return node.outputs[0]

def texture_uv(n,links,source,tex):
    sx,sy=tex.get('repeat',[1,1]);ox,oy=tex.get('offset',[0,0]);cx,cy=tex.get('center',[0,0]);r=tex.get('rotation',0);c,s=math.cos(r),math.sin(r)
    rows=[(sx*c,sx*s,-sx*(c*cx+s*cy)+cx+ox),(-sy*s,sy*c,-sy*(-s*cx+c*cy)+cy+oy)]
    if not tex.get('flipY',True):a,b,d=rows[1];rows[1]=(-a,-b,1-d)
    combine=n.new('ShaderNodeCombineXYZ')
    for i,(a,b,d) in enumerate(rows):
        dot=n.new('ShaderNodeVectorMath');dot.operation='DOT_PRODUCT';dot.inputs[1].default_value=(a,b,0);links.new(source,dot.inputs[0]);add=n.new('ShaderNodeMath');add.operation='ADD';add.inputs[1].default_value=d;links.new(dot.outputs['Value'],add.inputs[0]);links.new(add.outputs[0],combine.inputs[i])
    return combine.outputs[0]

instance_colored={mid for o in scene_data['meshes'] if 'instanceColors' in o for mid in o['materials']}
waterfall_ids={mid for o in scene_data['meshes'] if 'individual-falling-water-ribbons' in o.get('name','') for mid in o['materials']}
textures={t['id']:t for t in scene_data['textures']};material_records={m['id']:m for m in scene_data['materials']};materials={};geometry_materials={};images={};leaf_ports=[]
for rec in scene_data['materials']:
    mat=bpy.data.materials.new(rec['name'] or rec['id']);mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();links=mat.node_tree.links;bs=n.new('ShaderNodeBsdfPrincipled');out=n.new('ShaderNodeOutputMaterial');links.new(bs.outputs['BSDF'],out.inputs['Surface'])
    color=tuple(rec.get('color') or [.5,.5,.5])+(1,)
    for names,v in [(['Base Color'],color),(['Metallic'],float(rec.get('metalness') or 0)),(['Roughness'],float(rec.get('roughness',.5))),(['IOR'],float(rec.get('ior') or 1.5)),(['Transmission Weight','Transmission'],float(rec.get('transmission') or 0)),(['Coat Weight','Clearcoat'],float(rec.get('clearcoat') or 0)),(['Coat Roughness','Clearcoat Roughness'],float(rec.get('clearcoatRoughness') or .15)),(['Specular IOR Level'],.5*float(rec.get('specularIntensity',1))),(['Alpha'],float(rec.get('opacity',1)))]:value(bs,names,v)
    emission=tuple(rec.get('emissive') or [0,0,0])+(1,);value(bs,['Emission Color','Emission'],emission);value(bs,['Emission Strength'],float(rec.get('emissiveIntensity',1)))
    uv=n.new('ShaderNodeTexCoord');tex_nodes={}
    for channel,tid in rec['textures'].items():
        tex=textures[tid]
        if 'file' not in tex:raise RuntimeError('Portable source texture missing '+rec['name']+'/'+channel)
        space='sRGB' if channel in ['map','emissiveMap'] and tex.get('colorSpace')=='srgb' else 'Non-Color';key=(source_export['exportedAssets'][tex['file']]['sha256'],space)
        if key not in images:
            image=bpy.data.images.load(str(ROOT/'assets'/tex['file']),check_existing=False);image.colorspace_settings.name=space;images[key]=image
        tn=n.new('ShaderNodeTexImage');tn.image=images[key];tn.extension='REPEAT';tn.interpolation='Linear';links.new(texture_uv(n,links,uv.outputs['UV'],tex),tn.inputs['Vector']);tex_nodes[channel]=tn
    base=mul_color(n,links,tex_nodes['map'].outputs['Color'],color) if 'map' in tex_nodes else None
    if rec.get('vertexColors'):
        attr=n.new('ShaderNodeVertexColor');attr.layer_name='sourceColor';base=mul_color(n,links,attr.outputs['Color'],base or color)
    if rec['id'] in instance_colored:
        attr=n.new('ShaderNodeAttribute');attr.attribute_name='instanceColor';attr.attribute_type='INSTANCER';base=mul_color(n,links,attr.outputs['Color'],base or color)
    if base:links.new(base,bs.inputs['Base Color'])
    if 'normalMap' in tex_nodes:
        subtract=n.new('ShaderNodeVectorMath');subtract.operation='SUBTRACT';subtract.inputs[1].default_value=(.5,.5,.5);links.new(tex_nodes['normalMap'].outputs['Color'],subtract.inputs[0]);scale=n.new('ShaderNodeVectorMath');scale.operation='MULTIPLY';ns=rec.get('normalScale') or [1,1];scale.inputs[1].default_value=(ns[0],ns[1],1);links.new(subtract.outputs[0],scale.inputs[0]);add=n.new('ShaderNodeVectorMath');add.operation='ADD';add.inputs[1].default_value=(.5,.5,.5);links.new(scale.outputs[0],add.inputs[0]);nm=n.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=1;links.new(add.outputs[0],nm.inputs['Color']);links.new(nm.outputs['Normal'],bs.inputs['Normal'])
    if 'bumpMap' in tex_nodes:
        bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=1;bump.inputs['Distance'].default_value=abs(float(rec.get('bumpScale',.003)));previous=next(iter(bs.inputs['Normal'].links),None)
        if previous:links.new(previous.from_socket,bump.inputs['Normal'])
        links.new(tex_nodes['bumpMap'].outputs['Color'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
    for channel,target,component,factor in [('roughnessMap','Roughness','Green',rec.get('roughness',.5)),('metalnessMap','Metallic','Blue',rec.get('metalness',0))]:
        if channel in tex_nodes:
            sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes[channel].outputs['Color'],sep.inputs['Color']);m=n.new('ShaderNodeMath');m.operation='MULTIPLY';m.inputs[1].default_value=float(factor);links.new(sep.outputs[component],m.inputs[0]);links.new(m.outputs[0],bs.inputs[target])
    if 'alphaMap' in tex_nodes:
        sep=n.new('ShaderNodeSeparateColor');links.new(tex_nodes['alphaMap'].outputs['Color'],sep.inputs['Color']);links.new(sep.outputs['Green'],bs.inputs['Alpha'])
    if 'map' in tex_nodes and rec.get('alphaTest',0)>0:
        cut=n.new('ShaderNodeMath');cut.operation='GREATER_THAN';cut.inputs[1].default_value=rec['alphaTest'];links.new(tex_nodes['map'].outputs['Alpha'],cut.inputs[0]);links.new(cut.outputs[0],bs.inputs['Alpha'])
    if 'emissiveMap' in tex_nodes:
        port=mul_color(n,links,tex_nodes['emissiveMap'].outputs['Color'],emission)
        for name in ['Emission Color','Emission']:
            if name in bs.inputs:links.new(port,bs.inputs[name]);break
    name=rec['name'].lower();is_leaf=name in ['leaf','leafdark','leaflight','mapleleaf','maplelight','mapledark','pineleaf','vineleaf','lotusleaf','lotus','lotusinside','pink','pinklight','flowercream'] or name.startswith('garden219-')
    if is_leaf:
        value(bs,['Emission Strength'],0);thin=n.new('ShaderNodeBsdfTranslucent')
        if base:links.new(base,thin.inputs['Color'])
        else:thin.inputs['Color'].default_value=color
        mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=.18 if name=='pineleaf' else .28;links.new(bs.outputs[0],mix.inputs[1]);links.new(thin.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface']);leaf_ports.append(rec['name'])
    if rec['id'] in waterfall_ids:
        value(bs,['IOR'],1.333);value(bs,['Transmission Weight','Transmission'],.9);transparent=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=.68;links.new(bs.outputs[0],mix.inputs[1]);links.new(transparent.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface'])
    materials[rec['id']]=mat
    if rec['id'] in instance_colored:
        copy=mat.copy();copy.name=mat.name+' [GEOMETRY instanceColor]'
        for node in copy.node_tree.nodes:
            if node.type=='ATTRIBUTE' and getattr(node,'attribute_name','')=='instanceColor':node.attribute_type='GEOMETRY'
        geometry_materials[rec['id']]=copy
    else:geometry_materials[rec['id']]=mat
report['materialTransfer']={'originalPortablePBRAndTextureColor':True,'UVTransform':'Exact source repeat, offset, center, rotation and flipY sampling convention retained','normalXYScale':True,'vertexAndInstanceColorDomainsSeparate':True,'leafPhysicalAdapters':leaf_ports,'waterfallMaterialIds':sorted(waterfall_ids),'nativeCustomHooksNotPorted':['wood age/chips','bark lichen','scanned stone charcoal/moss coloration','granite mineral albedo and differential bump','GLSL leaf/petal view-dependent emission','GLSL waterfall dynamic foam/alpha','GLSL water screen/planar sampling','generated-LDR sky shader and material-local captured env maps'],'omittedNativePost':'GTAO and native post-CoC are not imported; actual GI and physical thin-lens camera used'}

# Affine/instance-color importer evolved from the audited Scene01 physical150 script.
geo={g['id']:g for g in scene_data['geometries']}; loaded={}; mesh_cache={}; template_objects={}; imported_triangles=0; collapsed_instance_count=0
linked_instance_count=0; sheared_instance_count=0; sheared_vertex_count=0; sheared_triangle_count=0; max_trs_residual=0.0; max_shear_residual=0.0
conversion=Matrix.Rotation(math.pi/2,4,'X')
template_collection=bpy.data.collections.new('Geometry Nodes source meshes (hidden; linked, not flattened)')
scene.collection.children.link(template_collection)

def mesh_for(record,g,data,at):
    key=(tuple((k,v['itemSize'],source_export['exportedAssets'][v['file']]['sha256']) for k,v in sorted(g['attributes'].items())),source_export['exportedAssets'][g['index']['file']]['sha256'],json.dumps(g['groups'],sort_keys=True),tuple(record['materials']))
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
    if needs_color:
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
    good=[];bad=[];positions=[];rotations=[];scales=[];all_dets=np.linalg.det(raw[:,:3,:3])
    if not np.isfinite(raw).all():raise ValueError('Nonfinite source instance matrix '+record['name'])
    for i in range(count):
        if abs(float(all_dets[i]))<=1e-12:
            bad.append(i);collapsed_instance_count+=1;continue
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
                ns=data['normal']@(np.linalg.inv(transform[:3,:3]) if abs(float(all_dets[i]))>1e-12 else np.linalg.pinv(transform[:3,:3]));length=np.maximum(np.linalg.norm(ns,axis=1),1e-12);normals[sl]=ns/length[:,None]
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
        baked=bpy.data.objects.new(objname+' baked affine shear subset',mesh);scene.collection.objects.link(baked);baked.matrix_world=world
        sheared_instance_count+=n;sheared_vertex_count+=len(coords);sheared_triangle_count+=len(faces.reshape(-1,3));imported_triangles+=len(faces.reshape(-1,3))
    if at%50==0:print('SOURCE_MESH',at,'/',len(scene_data['meshes']),'linked',linked_instance_count,'affine-baked',sheared_instance_count,flush=True)

report['affinePreservation']={'parentMatrices':'Full actual exported object matrices retained; no parent TRS approximation.','linkedLocalMatrices':'Geometry Nodes Object Info + Instance on Points with TRS decomposition only for matrices with normalized column shear residual <= 1e-7; retained translations, rotations and scales.','linkedInstances':linked_instance_count,'bakedShearedInstances':sheared_instance_count,'bakedShearedTriangles':sheared_triangle_count,'bakedShearedVertices':sheared_vertex_count,'maxLinkedTRSMatrixResidual':max_trs_residual,'maxBakedShearResidual':max_shear_residual,'flattenedOnlyForShearedTransforms':True,'geometryDecimated':False,'singularInstancesBakedWithoutDroppingTriangles':collapsed_instance_count,'bakedUVOrder':'UV loops sampled after negative-determinant face winding, retaining source vertex-to-UV correspondence'}


# Only the actual retained native Reflector is given a physical water BSDF.
water_record=next((r for r in scene_data.get('diagnosticSurfaces',[]) if r.get('name')=='real-reflected-garden-pond-ripple-surface'),None)
if not water_record or water_record.get('kind')!='actual-native-planar-reflector-geometry' or water_record.get('automaticMaterialTransfer') is not False:raise RuntimeError('Actual native water geometry was not retained')
if water_record['geometry']!=verification['water']['sourceGeometryId']:raise RuntimeError('Verified water record changed')
g=geo[water_record['geometry']];data=load_geometry(g)
water_mesh=mesh_for({'name':water_record['name'],'materials':[]},g,data,-1)
water=bpy.data.objects.new(water_record['name']+' physical material diagnostic',water_mesh);scene.collection.objects.link(water);water.matrix_world=Matrix(np.array(water_record['matrix'],dtype=np.float64).reshape(4,4).T.tolist())
water_mat=bpy.data.materials.new('219 actual held pond surface / physical water approximation');water_mat.use_nodes=True;n=water_mat.node_tree.nodes;n.clear();links=water_mat.node_tree.links;bs=n.new('ShaderNodeBsdfPrincipled');out=n.new('ShaderNodeOutputMaterial');links.new(bs.outputs[0],out.inputs['Surface']);bs.inputs['Base Color'].default_value=(.006,.014,.009,1);bs.inputs['Roughness'].default_value=.07;bs.inputs['Metallic'].default_value=0;bs.inputs['IOR'].default_value=1.333;value(bs,['Transmission Weight','Transmission'],0);value(bs,['Coat Weight','Clearcoat'],0)
pos=n.new('ShaderNodeNewGeometry');height=None
waves=[(.050,.48,.76,.65),(.031,.73,.38,-.92),(.010,2.25,.91,.41),(.0065,3.65,.54,-.84),(.0018,14.,.82,.57),(.0010,20.,.36,-.93)]
for amplitude,frequency,dx,dz in waves:
    dot=n.new('ShaderNodeVectorMath');dot.operation='DOT_PRODUCT';dot.inputs[1].default_value=(dx,-dz,0);links.new(pos.outputs['Position'],dot.inputs[0]);phase=n.new('ShaderNodeMath');phase.operation='MULTIPLY';phase.inputs[1].default_value=frequency;links.new(dot.outputs['Value'],phase.inputs[0]);sine=n.new('ShaderNodeMath');sine.operation='SINE';links.new(phase.outputs[0],sine.inputs[0]);scale=n.new('ShaderNodeMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=amplitude;links.new(sine.outputs[0],scale.inputs[0])
    if height is None:height=scale.outputs[0]
    else:add=n.new('ShaderNodeMath');add.operation='ADD';links.new(height,add.inputs[0]);links.new(scale.outputs[0],add.inputs[1]);height=add.outputs[0]
bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=1;bump.inputs['Distance'].default_value=1;links.new(height,bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal']);water_mesh.materials.append(water_mat)
report['physicalWater']={'actualExportedGeometryOnly':True,'sourceObject':water_record['name'],'positionBuffer':g['attributes']['position'],'indexBuffer':g['index'],'sourceMatrixYUp':water_record['matrix'],'vertexCount':len(data['position']),'triangles':len(data['index']),'material':{'IOR':1.333,'roughness':.07,'baseLinearRGB':[.006,.014,.009],'metallic':0,'transmission':0,'scope':'Opaque shallow-water surface BSDF approximation; no added volume/bottom geometry'},'normalAdapter':'Same six source world-space sine heights at time0 become a physical bump normal; the actual exported surface vertices remain unchanged. Three.js x,z -> Blender x,-y.','reflection':'Actual full scene and physical atmosphere ray traced; native reflected image and photograph are never imported','nativeShaderPixelParity':False}

# The physical camera keeps the source angular projection and source pose.
cam_data=bpy.data.cameras.new('exact reference camera');camera=bpy.data.objects.new('exact reference camera',cam_data);scene.collection.objects.link(camera);source_camera=Matrix(np.array(scene_data['cameraMatrix'],dtype=np.float64).reshape(4,4).T.tolist());camera.matrix_world=source_camera;cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=36;cam_data.lens=18/math.tan(math.radians(scene_data['view']['fov'])/2);cam_data.clip_start=.1;cam_data.clip_end=260;scene.camera=camera
camera.data.dof.use_dof=True;camera.data.dof.focus_distance=math.sqrt(30*30+3*3);camera.data.dof.aperture_fstop=1.4;camera.data.dof.aperture_blades=8
bpy.context.view_layer.update()
source_parent_residual=0
for obj in list(scene.objects):
    if obj.name in template_collection.objects:continue
    before=obj.matrix_world.copy();obj.matrix_world=conversion@before
    source_parent_residual=max(source_parent_residual,max(abs(obj.matrix_world[r][c]-(conversion@before)[r][c]) for r in range(4) for c in range(4)))
bpy.context.view_layer.update()
if source_parent_residual>1e-5:raise RuntimeError('A parent affine transform was lost on Blender assignment')
report['coordinateConversion']={'rigidRotationRadiansX':math.pi/2,'rule':'Source direct meshes, instance parents and camera converted once; hidden Object Info templates remain in original local coordinates at identity','maxObjectMatrixAssignmentResidual':source_parent_residual,'cameraSourceYUp':scene_data['cameraMatrix'],'cameraBlenderZUp':[v for row in camera.matrix_world for v in row],'sourceFovDegrees':scene_data['view']['fov'],'physicalFilmGateMM':36,'physicalFocalLengthMM':cam_data.lens,'thinLensFstop':1.4,'focusMetres':camera.data.dof.focus_distance,'nativePostCoCPixelParity':False}

# One physical sky supplies solar disc, diffuse skylight, specular reflection
# and all indirect paths. No separate SUN duplicates its disc, no bounce card.
sky=physical_sky;background=sky_background;world=physical_world
view_direction=source_camera.inverted().to_3x3()@direction;half_tan=math.tan(math.radians(scene_data['view']['fov'])/2);sun_uv=[.5+view_direction.x/(-view_direction.z)/(2*half_tan),.5-view_direction.y/(-view_direction.z)/(2*half_tan)]
report['physicalLighting']={'method':'Single physical atmosphere including solar disc; no other scene light objects, painted background, hidden lighting geometry or added reflection capture','skyType':sky.sky_type,'intendedSourceSunProjectedUV':sun_uv,'actualRNAForwardDirectionAudit':compatibility['actualRNAForwardDirectionAudit'],'intendedSourceSunProjected1254Pixels':[v*1254 for v in sun_uv],'sunDirectionSourceYUp':list(direction),'sunDirectionBlenderZUp':list(sun_blender),'sunElevationDegrees':math.degrees(sky.sun_elevation),'sunRotationRadians':sky.sun_rotation,'sunSizeRadians':sky.sun_size,'worldStrength':background.inputs['Strength'].default_value,'sourceDirectionalIntensityRecordedButNotRadiometricallyMatched':sun_record['intensity'],'sourceDirectionalColorRecordedButAtmosphereSuppliesSpectrum':sun_record['color'],'nativeLightsNotImported':[{'name':r.get('name'),'type':r['type'],'intensity':r['intensity']} for r in scene_data['lights']],'physicalFixtureSurfaceEmission':'Original exported emissive BSDFs on actual modeled fixture surfaces, no point-light proxies','nativeGeneratedSkyGLSLNotImported':True,'nativePixelParity':False,'nativeFogNotImported':True}

if imported_triangles!=scene_data['statistics']['triangles']:raise RuntimeError('PBR source triangle count changed')
report['geometryPreservation']={'sourcePBRImportedTriangles':imported_triangles,'sourcePBRExpectedTriangles':scene_data['statistics']['triangles'],'diagnosticOriginalWaterTriangles':len(data['index']),'expectedDiagnosticTriangles':scene_data['statistics'].get('diagnosticSurfaceTriangles'),'sourceIndicesPositionsNormalsAndUVRetained':True,'newSceneGeometry':False,'referencePhotographImported':False,'sourceMeshBuffersByteVerified':True}
scene.render.engine='CYCLES';preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
for d in preferences.devices:d.use=d.type=='METAL'
if not any(d.use for d in preferences.devices):raise RuntimeError('Metal GPU unavailable; no unbounded CPU fallback')
scene.cycles.device='GPU';r=SETTINGS['render'];scene.cycles.samples=r['samples'];scene.cycles.time_limit=r['timeLimitSeconds'];scene.cycles.use_adaptive_sampling=r['adaptiveSampling'];scene.cycles.adaptive_threshold=r['adaptiveThreshold'];scene.cycles.adaptive_min_samples=r['adaptiveMinimumSamples'];scene.cycles.max_bounces=r['maxBounces'];scene.cycles.diffuse_bounces=r['diffuseBounces'];scene.cycles.glossy_bounces=r['glossyBounces'];scene.cycles.transmission_bounces=r['transmissionBounces'];scene.cycles.transparent_max_bounces=12;scene.cycles.volume_bounces=0;scene.cycles.sample_clamp_direct=0;scene.cycles.sample_clamp_indirect=0;scene.cycles.use_denoising=r['denoise'];scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.use_light_tree=True
scene.render.resolution_x=r['size'];scene.render.resolution_y=r['size'];scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.film_transparent=False
scene.view_settings.view_transform='AgX';scene.view_settings.exposure=r['exposureEV'];scene.view_settings.gamma=1
try:scene.view_settings.look='AgX - Medium High Contrast'
except TypeError:pass
scene.render.filepath=str(OUT/'scene01-d2587-physical-r10.png');report['renderSettings']={'resolution':[r['size'],r['size']],'samplesMaximum':scene.cycles.samples,'adaptiveSampling':scene.cycles.use_adaptive_sampling,'timeLimitSeconds':scene.cycles.time_limit,'adaptiveThreshold':scene.cycles.adaptive_threshold,'denoising':scene.cycles.use_denoising,'device':scene.cycles.device,'devices':[{'name':d.name,'type':d.type,'enabled':d.use} for d in preferences.devices],'maxBounces':scene.cycles.max_bounces,'diffuseBounces':scene.cycles.diffuse_bounces,'glossyBounces':scene.cycles.glossy_bounces,'viewTransform':scene.view_settings.view_transform,'look':scene.view_settings.look,'exposureEV':scene.view_settings.exposure,'savedBlend':False,'frameCount':1}
report['status']='ready-for-one-render';save_report();print('PHYSICAL219_READY',json.dumps({'sourceHash':report['sourceHash'],'PBRtriangles':imported_triangles,'waterTriangles':len(data['index']),'lighting':report['physicalLighting'],'render':report['renderSettings']}),flush=True)
began=time.time();bpy.ops.render.render(write_still=True);report['renderSeconds']=time.time()-began;report['renderSha256']=digest(Path(scene.render.filepath).read_bytes());report['renderFile']=scene.render.filepath;report['status']='path-traced-review';report['completedAt']=time.time();save_report();print('PHYSICAL219_COMPLETE',json.dumps({'sourceHash':report['sourceHash'],'renderFile':scene.render.filepath,'seconds':report['renderSeconds'],'pngSha256':report['renderSha256']}),flush=True)
