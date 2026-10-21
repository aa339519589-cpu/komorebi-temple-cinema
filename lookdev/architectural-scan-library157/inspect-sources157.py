"""Original licensed scan inspection; no canonical scene edits or remeshing."""
import bpy, json, math, hashlib, time
import numpy as np
from pathlib import Path
from mathutils import Matrix, Vector

BASE=Path(__file__).resolve().parent
OUT=BASE/'inspection-metal-fixed-if-needed';OUT.mkdir(parents=True,exist_ok=True)
cases=[('rinzai-gate','ccby-areong-rinzai-gate'),('floral-panel','ccby-diana-liu-floral-panel')]
all_reports=[]

def point_data(obj):
    co=np.empty(len(obj.data.vertices)*3,dtype=np.float32);obj.data.vertices.foreach_get('co',co)
    m=np.asarray(obj.matrix_world,dtype=np.float64)
    return co.reshape(-1,3)@m[:3,:3].T+m[:3,3]

def camera(scene,center,direction,span,path,w=960,h=960):
    data=bpy.data.cameras.new(path.stem);obj=bpy.data.objects.new(data.name,data);scene.collection.objects.link(obj)
    obj.location=Vector(center)+Vector(direction).normalized()*span*2.7
    obj.rotation_euler=(Vector(center)-obj.location).to_track_quat('-Z','Y').to_euler()
    data.type='ORTHO';data.ortho_scale=span*1.18;data.clip_start=.001;data.clip_end=10000;scene.camera=obj
    scene.render.resolution_x=w;scene.render.resolution_y=h;scene.render.filepath=str(path)
    start=time.time();bpy.ops.render.render(write_still=True)
    report={'file':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'cameraWorldMatrix':[list(r)for r in obj.matrix_world],'orthographicScale':data.ortho_scale,'seconds':time.time()-start,'resolution':[w,h]}
    bpy.data.objects.remove(obj,do_unlink=True);return report

for slug,folder in cases:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene
    source=BASE/'sources'/folder/'source-objaverse.glb'
    bpy.ops.import_scene.gltf(filepath=str(source))
    bpy.context.view_layer.update()
    meshes=[o for o in scene.objects if o.type=='MESH']
    chunks=[point_data(o)for o in meshes];cloud=np.concatenate(chunks);mn=cloud.min(0);mx=cloud.max(0)
    if not np.isfinite(cloud).all() or float(max(mx-mn))>3000 or float(max(mx-mn))<=0:raise RuntimeError('Invalid imported bounds before rendering; source untouched')
    originals=[{'name':o.name,'vertices':len(o.data.vertices),'triangles':sum(len(p.vertices)-2 for p in o.data.polygons),'uvLayers':[u.name for u in o.data.uv_layers],'worldMatrix':[list(r)for r in o.matrix_world]}for o in meshes]
    preview=np.eye(4,dtype=np.float64)
    if slug=='floral-panel':
        sample=cloud[::max(1,len(cloud)//180000)];center=sample.mean(0);values,vectors=np.linalg.eigh(np.cov((sample-center).T));right=vectors[:,2];up=vectors[:,1];normal=np.cross(right,up)
        # A reversible PCA frame is only a viewing aid. Native scanner units
        # remain in the original GLB and are not silently called metres.
        axes=np.array([right,-normal,up]);preview[:3,:3]=axes*.001;preview[:3,3]=-axes@center*.001
        units='Preview only: scanner-native coordinates uniformly scaled0.001, consistent with millimetres but creator does not state verified dimensions.'
    else:
        preview[:3,3]=[-(mn[0]+mx[0])/2,-(mn[1]+mx[1])/2,-mn[2]]
        units='Source glTF scene scale retained; creator explicitly describes it as roughly scaled.'
    for o in meshes:
        world=o.matrix_world.copy();o.parent=None;o.matrix_world=Matrix(preview.tolist())@world
    for o in list(scene.objects):
        if o.type!='MESH':bpy.data.objects.remove(o,do_unlink=True)
    bpy.context.view_layer.update();staged=np.concatenate([point_data(o)for o in meshes]);lo=staged.min(0);hi=staged.max(0);center=(lo+hi)/2;span=float(max(hi-lo))
    scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.max_bounces=6;scene.cycles.use_denoising=True;scene.cycles.device='GPU'
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
    for device in prefs.devices:device.use=device.type=='METAL'
    if not any(d.use for d in prefs.devices):raise RuntimeError('Metal device unavailable')
    world=bpy.data.worlds.new('Neutral inspection world');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.69,.74,1);world.node_tree.nodes['Background'].inputs[1].default_value=.4;scene.world=world
    for i,(relative,power,size) in enumerate([((-1.1,-1.4,1.2),450,1.3),((1.2,-.5,.6),230,1.0),((.4,1.2,1.0),350,1.1)]):
        light=bpy.data.lights.new('Physical source inspection area'+str(i),'AREA');light.energy=power*span*span;light.shape='DISK';light.size=size*span
        obj=bpy.data.objects.new(light.name,light);scene.collection.objects.link(obj);obj.location=Vector(center)+Vector(relative)*span;obj.rotation_euler=(Vector(center)-obj.location).to_track_quat('-Z','Y').to_euler()
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.resolution_percentage=100
    scene.view_settings.view_transform='AgX';scene.view_settings.exposure=0
    report={'source':str(source.relative_to(BASE)),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'originalWorldBoundsBlenderZUp':[mn.tolist(),mx.tolist()],'originalWorldDimensions':(mx-mn).tolist(),'previewTransform':preview.tolist(),'units':units,'sourceObjects':originals,'sourceTriangles':sum(x['triangles']for x in originals),'sourceMaterialCount':len(bpy.data.materials),'materials':[],'geometryRemeshed':False,'UVRebaked':False,'sourceMaterialsPreserved':True,'renders':[]}
    for mat in bpy.data.materials:
        report['materials'].append({'name':mat.name,'diffuseColor':list(mat.diffuse_color),'images':[{'node':n.name,'image':n.image.name,'size':list(n.image.size),'colorSpace':n.image.colorspace_settings.name}for n in mat.node_tree.nodes if n.type=='TEX_IMAGE'and n.image]if mat.use_nodes else []})
    report['renders'].append(camera(scene,center,(0,-1,.05),span,OUT/(slug+'-source-front.png')))
    report['renders'].append(camera(scene,center,(.7,-1,.35),span,OUT/(slug+'-source-three-quarter.png')))
    if slug=='floral-panel':report['renders'].append(camera(scene,center,(0,1,.05),span,OUT/(slug+'-source-reverse.png')))
    (OUT/(slug+'-source-inspection.json')).write_text(json.dumps(report,indent=2)+'\n');all_reports.append(report)
    print('INSPECTED_SOURCE',slug,report['sourceTriangles'],report['originalWorldDimensions'],flush=True)
(OUT/'inspection-index.json').write_text(json.dumps({'status':'original-source-mesh-inspection-rendered','sources':all_reports,'canonicalScenesTouched':False,'photographicAcceptance':False},indent=2)+'\n')
