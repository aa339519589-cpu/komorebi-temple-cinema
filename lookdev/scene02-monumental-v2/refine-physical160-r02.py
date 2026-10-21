"""Independent physical-lighting refinement of the same verified source buffers.
No native source, original asset bytes, mesh coordinates, source UVs, vertex RGB,
instance RGB, instance matrices, or source camera matrices are modified.
"""
import bpy,json,math,os,time,hashlib,numpy as np
from pathlib import Path
from mathutils import Matrix
HERE=Path(__file__).resolve().parent;BASE=HERE/'cycles-r01';OUT=HERE/'cycles-r02';OUT.mkdir(exist_ok=True);start=time.time()
prior=json.loads((BASE/'report.json').read_text());source=json.loads((HERE/'export/scene.json').read_text());export=json.loads((HERE/'export/export-report.json').read_text());assert prior['status']=='physical-current-source-review';assert prior['sourceHash']==export['sourceHash']=='ab494e2ae55612c501a5823e1d8b1cc32568584cdc82f2981f38f28a6bd8c677'
bpy.ops.wm.open_mainfile(filepath=str(BASE/'scene02-current-source-physical160.blend'));scene=bpy.context.scene;camera=scene.camera;before=np.asarray(camera.matrix_world).copy();conversion=np.asarray(Matrix.Rotation(math.pi/2,4,'X'))
report={'sourceHash':prior['sourceHash'],'sourceCommit':prior['sourceCommit'],'renderScript':{'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'scope':'Same source-buffer import and preserved camera, calibrated physical light and water normals only','geometryReimported':False,'geometryModified':False,'assetBytesModified':False,'sourceUVModified':False,'sourceVertexAndInstanceRGBModified':False,'visualAccepted':False,'nativeWebglPixelEquivalence':False,'status':'evaluating-exact-transform-transfer','started':start}
# Inspect actual evaluated linked transforms instead of inferring parity solely
# from source triangle counts. Stored source vertices remain unchanged.
expected={}
for at,rec in enumerate(source['meshes']):
    name=(rec['name'] or 'source-object-'+str(at))[:56]+' linked instances'
    if name not in scene.objects or 'instanceMatrices' not in rec:continue
    buf=rec['instanceMatrices'];raw=np.fromfile(HERE/'export/assets'/buf['file'],dtype='<f4').reshape(rec['instances'],4,4).transpose(0,2,1);world=np.asarray(rec['matrix']).reshape(4,4).T
    samples=[]
    for m in raw:
        lin=m[:3,:3];lens=np.linalg.norm(lin,axis=0);det=np.linalg.det(lin)
        if abs(det)<1e-12:continue
        gram=lin.T@lin;shear=max(abs(float(gram[a,b]/max(lens[a]*lens[b],1e-30))) for a,b in [(0,1),(0,2),(1,2)])
        if shear>1e-7:continue
        samples.append({'matrix':conversion@world@m,'bestResidual':1e30})
        if len(samples)==4:break
    if samples:expected[name]=samples
    if len(expected)==40:break
for inst in bpy.context.evaluated_depsgraph_get().object_instances:
    if not inst.is_instance or not inst.parent:continue
    group=expected.get(inst.parent.original.name)
    if not group:continue
    actual=np.asarray(inst.matrix_world)
    for sample in group:
        if np.max(np.abs(actual[:3,3]-sample['matrix'][:3,3]))<.0001:sample['bestResidual']=min(sample['bestResidual'],float(np.max(np.abs(actual-sample['matrix']))))
rows=[{'parent':name,'sampledInstances':len(group),'maxAbsoluteMatrixResidual':max(r['bestResidual'] for r in group)} for name,group in expected.items()]
report['evaluatedGNMatrixAudit']={'scope':'Four actual evaluated linked matrices from each of the first forty GN buckets, against original source matrices after the common coordinate conversion.','groups':rows,'maxAbsoluteMatrixResidual':max(r['maxAbsoluteMatrixResidual'] for r in rows),'tolerance':.0001};(OUT/'report.json').write_text(json.dumps(report,indent=2));assert report['evaluatedGNMatrixAudit']['maxAbsoluteMatrixResidual']<.0001
# The finite dome previously introduced a visible background sun parallax.
# Use a normal far environment boundary; authored sky pixels remain identical.
sky=scene.objects['Physical authored atmosphere boundary160'];sky.scale=(5000/220,)*3;camera.data.clip_end=20000
sun=next(o for o in scene.objects if o.type=='LIGHT' and o.data.type=='SUN');sun.data.energy=4.5
scene.view_settings.exposure=.1
# Keep the original water UV and all original texture bytes. A world-metric
# 0.17m wave normal is the physical substitute for the native planar reflection
# displacement; the old sub-millimetre UV bump is retained but disconnected.
water=bpy.data.materials.get('scene02-water');assert water;nodes=water.node_tree.nodes;links=water.node_tree.links;bs=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
for l in list(bs.inputs['Normal'].links):links.remove(l)
geo=nodes.new('ShaderNodeNewGeometry');wave=nodes.new('ShaderNodeTexWave');wave.wave_type='BANDS';wave.bands_direction='DIAGONAL';wave.wave_profile='SIN';wave.inputs['Scale'].default_value=6;wave.inputs['Distortion'].default_value=4;wave.inputs['Detail'].default_value=3;wave.inputs['Detail Scale'].default_value=1.7;links.new(geo.outputs['Position'],wave.inputs['Vector']);bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.45;bump.inputs['Distance'].default_value=.0016;links.new(wave.outputs['Color'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal']);bs.inputs['Roughness'].default_value=.038
scene.cycles.samples=64;scene.cycles.adaptive_threshold=.02;scene.cycles.use_denoising=True;scene.render.resolution_x=scene.render.resolution_y=1254;scene.render.resolution_percentage=100
assert np.array_equal(before,np.asarray(camera.matrix_world));report['cameraMatrixUnchanged']=True;report['sourceCameraMatrix']=source['cameraMatrix'];report['lightCalibration']={'sourceSunDirectionUnchanged':True,'physicalSunEnergy':4.5,'priorSunEnergy':8.5,'exposureEV':.1,'priorExposureEV':.4,'reason':'First physical diagnostic clipped broad bridge/rail sunlit wood. Reduce physical incident sun budget and exposure; native lighting is unchanged.'};report['skyTransfer']={'authoredFloatPixelsUnchanged':True,'sphereRadiusMetres':5000,'purpose':'Reduce camera-to-environment parallax from the prior finite220m boundary; no image warp, camera-only plate or source photograph.'};report['waterCalibration']={'sourceMeshUVAndTextureBytesUnchanged':True,'nativePlanarReflectionNotImported':True,'physicalWaveScale':6,'bumpDistanceMetres':.0016,'bumpStrength':.45,'roughness':.038,'metricCoordinates':'Physical world Position; no screen-space sampling.'};report['materialTransfer']=prior['materialTransfer'];report['affinePreservation']=prior['affinePreservation'];report['renderableTriangleCountPreserved']=True;report['sourceTriangles']=prior['sourceTriangles'];report['physicalAir']=prior['physicalAir'];report['status']='rendering';(OUT/'report.json').write_text(json.dumps(report,indent=2))
render=OUT/'scene02-current-source-physical160-r02.png';scene.render.filepath=str(render);bpy.ops.render.render(write_still=True)
report['full']={'path':str(render),'sha256':hashlib.sha256(render.read_bytes()).hexdigest(),'resolution':[1254,1254],'samples':64};(OUT/'report.json').write_text(json.dumps(report,indent=2))
# True ray subfrustum of the source camera, rendered natively at1254px.
cam=camera.data;frame=[v.copy() for v in cam.view_frame(scene=scene)];slopes=np.asarray([(v.x/-v.z,v.y/-v.z) for v in frame]);l,b=slopes.min(axis=0);r,t=slopes.max(axis=0);x,y,size,full=590,180,340,1254;desired=np.array([l+(r-l)*x/full,r-(r-l)*(full-x-size)/full,b+(t-b)*(full-y-size)/full,t-(t-b)*y/full]);lens=cam.lens;cam.lens*=full/size
get_bounds=lambda:np.array([min(v.x/-v.z for v in cam.view_frame(scene=scene)),max(v.x/-v.z for v in cam.view_frame(scene=scene)),min(v.y/-v.z for v in cam.view_frame(scene=scene)),max(v.y/-v.z for v in cam.view_frame(scene=scene))])
initial=get_bounds();cam.shift_x=1;dx=(get_bounds()-initial)[0];cam.shift_x=0;cam.shift_y=1;dy=(get_bounds()-initial)[2];cam.shift_y=0;cam.shift_x=float((desired[0]-initial[0])/dx);cam.shift_y=float((desired[2]-initial[2])/dy);actual=get_bounds();error=float(np.max(np.abs(actual-desired)));assert error<2e-6
scene.cycles.samples=48;detail=OUT/'scene02-true-gable-physical160-r02.png';scene.render.filepath=str(detail);bpy.ops.render.render(write_still=True);report['trueGable']={'path':str(detail),'sha256':hashlib.sha256(detail.read_bytes()).hexdigest(),'cropInSourcePixels':[x,y,size,full],'nativeResolution':[1254,1254],'samples':48,'sourceCameraMatrixUnchanged':True,'raySlopeMaxAbsoluteError':error,'upsampledScreenshot':False}
cam.lens=lens;cam.shift_x=cam.shift_y=0;scene.cycles.samples=64;scene.render.filepath=str(render);blend=OUT/'scene02-current-source-physical160-r02.blend';bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True);report['blend']=str(blend);report['blendSha256']=hashlib.sha256(blend.read_bytes()).hexdigest();report['status']='physical-current-source-review';report['elapsedSeconds']=time.time()-start;(OUT/'report.json').write_text(json.dumps(report,indent=2));print('SCENE02_PHYSICAL160_R02',json.dumps({k:report[k] for k in ['status','sourceHash','elapsedSeconds','visualAccepted']}),flush=True)
