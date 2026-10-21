from pathlib import Path
import hashlib
original=Path('lookdev/scene02-monumental-v2/render-physical161-r03.py')
s=original.read_text();s=s[:s.index('\ndef _fract')]
s=s[s.index('import bpy,'):]
s=s.replace("HERE/'export-r03'","HERE/'export-r03'").replace("HERE/'cycles-r03'","HERE/'cycles-r03'")
s=s.replace("MODE='scene02-source-sun-and-physical-bounce'","MODE='scene08-current-source-affine-PBR-and-measured-radiance'")
s=s.replace("assert scene_data['view']['reference']==2","assert scene_data['view']['reference']==8")
a=s.index('def native_floor_transfer');b=s.index('instance_colored=',a);s=s[:a]+s[b:]
a=s.index('timber_names=');b=s.index("for rec in scene_data['materials']:",a);s=s[:a]+"timber_ids=set() # Scene08 pigment/roughness is already baked into portable PBR textures.\n"+s[b:]
# Remove the other scene's shader adaptations. Keep original values, decoded
# scan pixels, all geometry/affine transforms and separate instance RGB.
a=s.index("        is_floor=rec['name']==");b=s.index("        mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';",a);s=s[:a]+s[b:]
a=s.index("            if rec['id'] in timber_ids and ch=='roughnessMap':");b=s.index("            links.new(factor_socket,bs.inputs[input_name])",a);s=s[:a]+s[b:]
a=s.index("    # The exact same physical pond surface");b=s.index("    materials[rec['id']]=mat",a)
s=s[:a]+'''    # Energy-conserving physical thin-leaf transport replaces the native
    # shader's unshadowed approximation. It sees actual source occlusion.
    if rec['name'] in ['leaf','leaflight','maple','flower','pine'] or any(k in rec['name'] for k in ['scanned-blade148','scanned-foliage148','periwinkle-plant']):
        thin=n.new('ShaderNodeBsdfTranslucent')
        if base_socket:links.new(base_socket,thin.inputs['Color'])
        else:thin.inputs['Color'].default_value=color
        mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=.20 if rec['name']=='pine' else .27;links.new(bs.outputs['BSDF'],mix.inputs[1]);links.new(thin.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface'])
''' +s[b:]
s='''"""Scene08 physical review of the verified existing Three.js reconstruction.
Exact indexed source geometry, RGB and full affine transforms are retained.
Orthogonal transforms stay instanced; shears are baked without simplification.
Generic importer derived from the repository Scene02/Scene06 transfer, copied
locally under Scene08 ownership; no temple reconstruction happens in Blender.
"""\n'''+s
s+='''
# Exact source framing, converted once with the whole model into Z-up.
SUN=max((r for r in scene_data['lights'] if r['type']=='DirectionalLight'),key=lambda r:r['intensity'])
physical_lights=[]
for rec in scene_data['lights']:
    if rec is not SUN and rec['type']!='PointLight':continue
    typ='SUN' if rec is SUN else 'POINT';ld=bpy.data.lights.new(rec['name'] or 'Scene08 source warm sun',typ);ld.color=rec['color'];obj=bpy.data.objects.new(ld.name,ld);scene.collection.objects.link(obj);obj.matrix_world=Matrix(np.asarray(rec['matrix']).reshape(4,4).T.tolist())
    if typ=='SUN':ld.energy=float(os.environ.get('CYCLES_SUN_ENERGY','4.20'));ld.angle=math.radians(.53);obj.rotation_euler=(Vector(rec['target'])-obj.location).to_track_quat('-Z','Y').to_euler()
    else:ld.energy=rec['intensity']*4*math.pi;ld.shadow_soft_size=.06
    physical_lights.append({'name':obj.name,'type':typ,'energy':ld.energy,'sourceLinearRGB':list(ld.color)})
cam_data=bpy.data.cameras.new('Scene08 exact original reference lens');camera=bpy.data.objects.new(cam_data.name,cam_data);scene.collection.objects.link(camera);camera.matrix_world=Matrix(np.asarray(scene_data['cameraMatrix']).reshape(4,4).T.tolist());cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=36;cam_data.lens=18/math.tan(math.radians(scene_data['view']['fov'])/2);cam_data.clip_start=.06;cam_data.clip_end=10000;scene.camera=camera
cam_data.dof.use_dof=True;cam_data.dof.focus_distance=22.420133808699713;cam_data.dof.aperture_fstop=2.8;cam_data.dof.aperture_blades=9
for obj in list(scene.objects):obj.matrix_world=conversion@obj.matrix_world
bpy.context.view_layer.update()
# Audit actual evaluated instances, independently of the decomposition code.
audit_graph=bpy.context.evaluated_depsgraph_get();audit_conversion=np.asarray(conversion)
for group in gn_expected_audit.values():
    for sample in group:sample['matrix']=audit_conversion@sample['matrix']
for inst in audit_graph.object_instances:
    if not inst.is_instance or not inst.parent:continue
    group=gn_expected_audit.get(inst.parent.original.name)
    if not group:continue
    actual=np.asarray(inst.matrix_world)
    for sample in group:
        if np.max(np.abs(actual[:3,3]-sample['matrix'][:3,3]))<.0001:sample['bestResidual']=min(sample['bestResidual'],float(np.max(np.abs(actual-sample['matrix']))))
rows=[{'parent':parent,'sampledInstances':len(group),'maxAbsoluteMatrixResidual':max(s['bestResidual'] for s in group)} for parent,group in gn_expected_audit.items()]
report['evaluatedGNMatrixAudit']={'groups':rows,'maxAbsoluteMatrixResidual':max(r['maxAbsoluteMatrixResidual'] for r in rows),'tolerance':.0001}
assert report['evaluatedGNMatrixAudit']['maxAbsoluteMatrixResidual']<.0001,'Actual evaluated source instance transform differs'
# Same independent original CC0 measured sky as native, solar-aligned using
# the exact rotation retained in the actual matching native frame receipt.
native=json.loads(Path(os.environ['SCENE_NATIVE_REPORT']).read_text());assert native['source']['hash']==source_export['sourceHash'];sky_info=native['frames'][0]['info']['measuredSky'];sky_path=Path(os.environ['SCENE_WORKTREE'])/sky_info['source'];assert sky_path.is_file()
angles=sky_info['rotation'][:3];rx,ry,rz=angles;cx,sx=math.cos(rx),math.sin(rx);cy,sy=math.cos(ry),math.sin(ry);cz,sz=math.cos(rz),math.sin(rz)
Rx=np.array([[1,0,0],[0,cx,-sx],[0,sx,cx]]);Ry=np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]]);Rz=np.array([[cz,-sz,0],[sz,cz,0],[0,0,1]]);native_rotation=Rx@Ry@Rz
sky_image=bpy.data.images.load(str(sky_path),check_existing=False);sky_image.colorspace_settings.name='Non-Color';sky_image.pack()
lon_steps,lat_steps=128,64;verts=[];radius=3000
for j in range(lat_steps+1):
    lat=(j/lat_steps-.5)*math.pi;cl=math.cos(lat)
    for i in range(lon_steps+1):
        lon=(i/lon_steps-.5)*2*math.pi;v=native_rotation@np.array([cl*math.cos(lon),math.sin(lat),cl*math.sin(lon)]);verts.append((radius*v[0],-radius*v[2],radius*v[1]))
faces=[]
for j in range(lat_steps):
    for i in range(lon_steps):a=j*(lon_steps+1)+i;faces.append((a,a+1,a+lon_steps+2,a+lon_steps+1))
mesh=bpy.data.meshes.new('Original calibrated CC0 sky radiance dome');mesh.from_pydata(verts,[],faces);mesh.update();uv=mesh.uv_layers.new(name='nativeMeasuredRadianceUV')
for poly in mesh.polygons:
    for li in poly.loop_indices:
        j,i=divmod(mesh.loops[li].vertex_index,lon_steps+1);uv.data[li].uv=(i/lon_steps,j/lat_steps)
mat=bpy.data.materials.new('Independent measured sky transport');mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();l=mat.node_tree.links;tex=n.new('ShaderNodeTexImage');tex.image=sky_image;tex.extension='REPEAT';coord=n.new('ShaderNodeTexCoord');l.new(coord.outputs['UV'],tex.inputs['Vector']);em=n.new('ShaderNodeEmission');l.new(tex.outputs['Color'],em.inputs['Color']);path=n.new('ShaderNodeLightPath');mix=n.new('ShaderNodeMix');mix.data_type='FLOAT';mix.inputs[2].default_value=float(os.environ.get('CYCLES_WORLD_GAIN',str(sky_info['environmentIntensity'])));mix.inputs[3].default_value=float(os.environ.get('CYCLES_SKY_GAIN',str(sky_info['cameraRadianceGain'])));l.new(path.outputs['Is Camera Ray'],mix.inputs[0]);l.new(mix.outputs[0],em.inputs['Strength']);out=n.new('ShaderNodeOutputMaterial');l.new(em.outputs[0],out.inputs['Surface']);mesh.materials.append(mat);dome=bpy.data.objects.new('Scene08 original sky radiance boundary',mesh);scene.collection.objects.link(dome);dome.visible_shadow=False
world=bpy.data.worlds.new('Black outside the radiance boundary');world.use_nodes=True;world.node_tree.nodes.get('Background').inputs['Strength'].default_value=0;scene.world=world
report['skyTransfer']={'nativeInfo':sky_info,'exrSha256':hashlib.sha256(sky_path.read_bytes()).hexdigest(),'worldDirectionMapping':'Same XYZ Euler matrix Rx@Ry@Rz, native inverse lookup represented by forward rotated explicit UV dome, then common Y-up to Z-up conversion.','cameraGain':float(os.environ.get('CYCLES_SKY_GAIN',str(sky_info['cameraRadianceGain']))),'otherRayGain':float(os.environ.get('CYCLES_WORLD_GAIN',str(sky_info['environmentIntensity']))),'referencePhotoUsed':False}
report['physicalLights']=physical_lights;report['omittedNativeLightProxies']=[{'type':r['type'],'intensity':r['intensity']} for r in scene_data['lights'] if r is not SUN and r['type']!='PointLight'];report['physicalFoliageAdaptation']='27% energy-conserving diffuse transmission with actual light occlusion;20% pine. Source GLSL thin-leaf approximation is not pixel-equivalent.'
scene.render.engine='CYCLES';scene.cycles.samples=int(os.environ.get('CYCLES_SAMPLES','64'));scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.max_bounces=10;scene.cycles.diffuse_bounces=6;scene.cycles.glossy_bounces=6;scene.cycles.transmission_bounces=8;scene.cycles.volume_bounces=2;scene.cycles.transparent_max_bounces=16;scene.cycles.sample_clamp_indirect=12;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.035
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for dev in prefs.devices:dev.use=dev.type=='METAL'
assert any(dev.use for dev in prefs.devices),'No Metal GPU';scene.cycles.device='GPU'
scene.render.resolution_x=scene.render.resolution_y=int(os.environ.get('CYCLES_SIZE','1254'));scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.threads_mode='FIXED';scene.render.threads=4
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=float(os.environ.get('CYCLES_EXPOSURE','.14'))
report['camera']={'sourcePositionYUp':scene_data['view']['position'],'sourceFovDegrees':scene_data['view']['fov'],'sourceMatrix':scene_data['cameraMatrix'],'unchangedMatrix':True,'sensorHeightMM':36,'physicalFocalLengthMM':cam_data.lens,'focusDistanceM':cam_data.dof.focus_distance,'apertureFStop':cam_data.dof.aperture_fstop}
report['materialTransfer']={'sourceOriginalAssets':'All original compressed declared source assets remain immutable; verified exporter retains file hashes and decoded pixel buffers. Every exported binary and texture hash checked before import.','geometry':'Original indexed positions/indices/normals and complete matrices retained without decimation; shear subsets baked exactly.','RGB':'Original source vertex RGB only when enabled, multiplied separately by exact source per-instance RGB. Linked instances use INSTANCER; direct/shear meshes use GEOMETRY.','paint':'Portable pigmented PBR albedo baked by the actual Scene08 native source; no Blender pigment override.','water':'Exact source-authored meander backing immediately beneath the WebGL-only Reflector. Same source PBR values; real surface transport replaces planar reflection capture.','limits':['Native AO/PMREM/fog and custom GLSL do not match physical ray transport.','ACESFilmic native and AgX are different camera curves.','No photographic acceptance or native pixel equivalence is claimed.']}
report['importedTriangles']=imported_triangles;report['sourceTriangles']=scene_data['statistics']['triangles'];report['excludedCollapsedTriangles']=collapsed_triangle_count;assert imported_triangles==scene_data['statistics']['triangles']-collapsed_triangle_count
report['renderableTriangleCountPreserved']=True;report['resolution']=[scene.render.resolution_x,scene.render.resolution_y];report['samples']=scene.cycles.samples;report['exposureEV']=scene.view_settings.exposure;report['nativeWebglPixelEquivalence']=False;report['visualAccepted']=False;report['status']='rendering';(OUT/'report.json').write_text(json.dumps(report,indent=2))
blend=OUT/'scene08-current-source-physical148.blend';bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True);report['blend']=str(blend)
render=OUT/'scene08-current-source-physical148.png';scene.render.filepath=str(render);bpy.ops.render.render(write_still=True)
report['full']={'path':str(render),'sha256':hashlib.sha256(render.read_bytes()).hexdigest(),'resolution':[scene.render.resolution_x,scene.render.resolution_y],'samples':scene.cycles.samples}
if os.environ.get('CYCLES_TRUE_DETAIL','1')=='1':
    original_lens=cam_data.lens;original_fstop=cam_data.dof.aperture_fstop;frame=[v.copy() for v in cam_data.view_frame(scene=scene)];slopes=np.asarray([(v.x/-v.z,v.y/-v.z) for v in frame]);l,b=slopes.min(axis=0);r,t=slopes.max(axis=0);x,y,size,full=320,270,640,1254;desired=np.array([l+(r-l)*x/full,r-(r-l)*(full-x-size)/full,b+(t-b)*(full-y-size)/full,t-(t-b)*y/full]);cam_data.lens*=full/size;focus_mm=cam_data.dof.focus_distance*1000;cam_data.dof.aperture_fstop=original_fstop*(full/size)*(focus_mm-original_lens)/(focus_mm-cam_data.lens)
    def bounds():
        a=np.asarray([(v.x/-v.z,v.y/-v.z) for v in cam_data.view_frame(scene=scene)]);lo=a.min(axis=0);hi=a.max(axis=0);return np.array([lo[0],hi[0],lo[1],hi[1]])
    initial=bounds();cam_data.shift_x=1;dx=(bounds()-initial)[0];cam_data.shift_x=0;cam_data.shift_y=1;dy=(bounds()-initial)[2];cam_data.shift_y=0;cam_data.shift_x=float((desired[0]-initial[0])/dx);cam_data.shift_y=float((desired[2]-initial[2])/dy);error=float(np.max(np.abs(bounds()-desired)));assert error<2e-6
    scene.cycles.samples=int(os.environ.get('CYCLES_DETAIL_SAMPLES','48'));detail=OUT/'scene08-true-detail-physical148.png';scene.render.filepath=str(detail);bpy.ops.render.render(write_still=True);report['trueDetail']={'path':str(detail),'sha256':hashlib.sha256(detail.read_bytes()).hexdigest(),'cropInSourcePixels':[x,y,size,full],'nativeResolution':[scene.render.resolution_x,scene.render.resolution_y],'samples':scene.cycles.samples,'sourceCameraMatrixUnchanged':True,'maximumRaySlopeError':error,'originalApertureAndCoCPreserved':True,'upsampledScreenshot':False};cam_data.lens=original_lens;cam_data.dof.aperture_fstop=original_fstop;cam_data.shift_x=cam_data.shift_y=0
report['render']=str(render);report['renderSha256']=hashlib.sha256(render.read_bytes()).hexdigest();report['blendSha256']=hashlib.sha256(blend.read_bytes()).hexdigest();report['status']='physical-current-source-review';report['elapsedSeconds']=time.time()-report['started'];(OUT/'report.json').write_text(json.dumps(report,indent=2));print('SCENE08_PHYSICAL148',json.dumps({k:report[k] for k in ['status','sourceHash','render','renderSha256','elapsedSeconds','visualAccepted']}),flush=True)
'''
s=s.replace("report={'sourceCommit':", "report={'genericImporterProvenance':{'source':'lookdev/scene02-monumental-v2/render-physical161-r03.py','sha256':'"+hashlib.sha256(original.read_bytes()).hexdigest()+"'},'sourceCommit':")
Path('lookdev/scene08-monumental-court-v2/render-physical148.py').write_text(s)
