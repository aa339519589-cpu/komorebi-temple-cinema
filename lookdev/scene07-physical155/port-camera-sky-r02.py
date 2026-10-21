"""PNG-only reuse of the exact155 blend, source146 camera-sky branch port.
No export, model/material/light/exposure changes, or blend save.
"""
import bpy,json,math,time,hashlib
from pathlib import Path
WORK=Path('/Users/mima1234/temple-cinema-live-sync');HERE=WORK/'lookdev/scene07-physical155';BASE=WORK/'qa/ten-reference/07/iteration-scene07-physical155-20261022';OUT=WORK/'qa/ten-reference/07/iteration-scene07-physical155-r02-20261022';OUT.mkdir(parents=True,exist_ok=True)
EXPECTED='f3638c92c8f80d8cee8e40f346d179b4ce24e0211a44b1619ec8c2076ac03281';baseline=json.loads((BASE/'report.json').read_text());export=json.loads((HERE/'export/export-report.json').read_text());native=json.loads(Path(baseline['nativeReport']).read_text());sky=native['frames'][0]['info']['garden']['skyRadiance'];asset=WORK/sky['cameraSky']['asset'].lstrip('/');shader=WORK/'reconstructions/scene-07/src/sky-radiance144.js';H=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
assert baseline['sourceHash']==export['sourceHash']==native['source']['hash']==EXPECTED
assert H(asset)==export['source']['files'][str(asset.relative_to(WORK))];assert H(shader)==export['source']['files'][str(shader.relative_to(WORK))]
blend=Path(baseline['blend']['path']);assert H(blend)==baseline['blend']['sha256'];started=time.time();bpy.ops.wm.open_mainfile(filepath=str(blend));scene=bpy.context.scene

def unchanged_state():
 objects=[]
 for o in scene.objects:
  d=o.data;row={'name':o.name,'type':o.type,'data':d.name if d else None,'matrix':[list(v)for v in o.matrix_world],'materialSlots':[s.material.name if s.material else None for s in o.material_slots]}
  if o.type=='LIGHT':row['light']={'type':d.type,'energy':d.energy,'color':list(d.color)}
  if o.type=='CAMERA':row['camera']={'lens':d.lens,'shift':[d.shift_x,d.shift_y],'focus':d.dof.focus_distance,'fstop':d.dof.aperture_fstop}
  objects.append(row)
 mats=[{'name':m.name,'nodes':[(n.name,n.type)for n in m.node_tree.nodes]if m.use_nodes else[],'links':[(x.from_node.name,x.from_socket.name,x.to_node.name,x.to_socket.name)for x in m.node_tree.links]if m.use_nodes else[]}for m in bpy.data.materials]
 value={'objects':objects,'materials':mats,'exposure':scene.view_settings.exposure,'transform':scene.view_settings.view_transform,'look':scene.view_settings.look,'resolution':[scene.render.resolution_x,scene.render.resolution_y],'samples':scene.cycles.samples,'seed':scene.cycles.seed}
 return hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()
before=unchanged_state();world=scene.world;n=world.node_tree.nodes;l=world.node_tree.links;out=next(x for x in n if x.type=='OUTPUT_WORLD');old_surface=out.inputs['Surface'].links[0].from_socket;measured=next(x for x in n if x.type=='TEX_IMAGE' and x.image and 'qwantani' in x.image.filepath.lower());coord=next(x for x in n if x.type=='TEX_COORD');path=next(x for x in n if x.type=='LIGHT_PATH')

def op(kind,a,b=None):
 q=n.new('ShaderNodeMath');q.operation=kind
 for i,x in enumerate([a,b]):
  if x is None:continue
  if isinstance(x,(int,float)):q.inputs[i].default_value=x
  else:l.new(x,q.inputs[i])
 return q.outputs[0]
def clamp(x,a,b):
 q=n.new('ShaderNodeClamp');q.inputs['Min'].default_value=a;q.inputs['Max'].default_value=b;l.new(x,q.inputs['Value']);return q.outputs[0]
def smooth(a,b,x):
 t=clamp(op('DIVIDE',op('SUBTRACT',x,a),b-a),0,1);return op('MULTIPLY',op('MULTIPLY',t,t),op('SUBTRACT',3,op('MULTIPLY',2,t)))
def color_mul(color,factor):
 q=n.new('ShaderNodeMixRGB');q.blend_type='MULTIPLY';q.inputs[0].default_value=1
 for i,x in[(1,color),(2,factor)]:
  if isinstance(x,(list,tuple)):q.inputs[i].default_value=tuple(x)+(1,)
  elif isinstance(x,(int,float)):q.inputs[i].default_value=(x,x,x,1)
  else:l.new(x,q.inputs[i])
 return q.outputs[0]
def color_add(a,b):
 q=n.new('ShaderNodeMixRGB');q.blend_type='ADD';q.inputs[0].default_value=1;l.new(a,q.inputs[1]);l.new(b,q.inputs[2]);return q.outputs[0]
# Cycles world Normal=-outgoing ray. Convert once to unchanged Three.js Y-up.
w=[]
for row in[(-1,0,0),(0,0,-1),(0,1,0)]:
 q=n.new('ShaderNodeVectorMath');q.operation='DOT_PRODUCT';q.inputs[1].default_value=row;l.new(coord.outputs['Normal'],q.inputs[0]);w.append(q.outputs['Value'])
x,y,z=w;cap=sky['cameraSky'];center=cap['azimuthCenterRadians'];width=math.radians(cap['horizontalSpanDegrees']);low=math.radians(cap['elevationRangeDegrees'][0]);height=math.radians(cap['elevationRangeDegrees'][1]-cap['elevationRangeDegrees'][0]);gain=cap['linearRadianceGain']
longitude=op('SUBTRACT',op('MODULO',op('ADD',op('SUBTRACT',op('ARCTAN2',z,x),center),math.pi),2*math.pi),math.pi);u=op('ADD',op('DIVIDE',longitude,width),.5);v=op('DIVIDE',op('SUBTRACT',op('ARCSINE',clamp(y,-1,1)),low),height);edge_u=op('MINIMUM',u,op('SUBTRACT',1,u));edge_v=op('MINIMUM',v,op('SUBTRACT',1,v));blend_factor=op('MULTIPLY',smooth(0,.08,edge_u),smooth(0,.08,edge_v));uv=n.new('ShaderNodeCombineXYZ');l.new(clamp(u,0,1),uv.inputs['X']);l.new(clamp(v,0,1),uv.inputs['Y']);cloud=n.new('ShaderNodeTexImage');cloud.name='Original source145 sky-only cap (camera rays only)';cloud.image=bpy.data.images.load(str(asset),check_existing=False);cloud.image.colorspace_settings.name='sRGB';cloud.extension='EXTEND';cloud.interpolation='Linear';l.new(uv.outputs[0],cloud.inputs['Vector'])
base=color_mul(measured.outputs['Color'],.08);cap_color=color_mul(cloud.outputs['Color'],gain);mix=n.new('ShaderNodeMixRGB');mix.blend_type='MIX';l.new(blend_factor,mix.inputs[0]);l.new(base,mix.inputs[1]);l.new(cap_color,mix.inputs[2]);camera_color=mix.outputs[0]
world_vector=n.new('ShaderNodeCombineXYZ')
for k,q in zip(['X','Y','Z'],w):l.new(q,world_vector.inputs[k])
dot=n.new('ShaderNodeVectorMath');dot.operation='DOT_PRODUCT';dot.inputs[1].default_value=tuple(sky['targetSunDirection']);l.new(world_vector.outputs[0],dot.inputs[0]);solar_cos=clamp(dot.outputs['Value'],-1,1);angle=op('ARCCOSINE',solar_cos);halo=op('MULTIPLY',op('EXPONENT',op('DIVIDE',op('MULTIPLY',angle,angle),-.0032)),.48);disk=smooth(.999987,.999990,solar_cos);camera_color=color_add(color_add(camera_color,color_mul((1.,.46,.12),halo)),color_mul((35.,22.,8.),disk));camera_bg=n.new('ShaderNodeBackground');camera_bg.name='Source146 camera-ray cloud/halo/disk radiance';camera_bg.inputs['Strength'].default_value=1;l.new(camera_color,camera_bg.inputs['Color']);surface=n.new('ShaderNodeMixShader');surface.name='Camera sky only; existing measured GI/reflections untouched';l.new(path.outputs['Is Camera Ray'],surface.inputs[0]);l.new(old_surface,surface.inputs[1]);l.new(camera_bg.outputs[0],surface.inputs[2]);l.new(surface.outputs[0],out.inputs['Surface'])
assert unchanged_state()==before,'A source model/material/light/camera/exposure value changed'
report={'status':'rendering-camera-background-port','sourceHash':EXPECTED,'baselineReport':str(BASE/'report.json'),'reusedBlend':str(blend),'reusedBlendSha256':baseline['blend']['sha256'],'exportReused':str(HERE/'export/export-report.json'),'runnerSha256':H(__file__),'started':started,'scope':'Only the World camera-ray background branch is replaced with the exact source146 sky-cap sampling/blend/gain/solar halo and disk. Geometry, PBR, sourceUV, normals, RGB, affine matrices, physical lights, GI/reflection sky and camera/exposure are reused unchanged.','objectMaterialLightCameraStateSignatureBefore':before,'objectMaterialLightCameraStateSignatureAfter':unchanged_state(),'signatureScope':'Object/data identifiers, transforms, material node/link identifiers, lights, camera, render color/sampling state; source vertex buffers are the verified unchanged saved blend, not rescanned.','cameraSky':{'asset':str(asset.relative_to(WORK)),'sha256':H(asset),'provenance':'reconstructions/scene-07/assets/sky145/provenance.json','sourceShader':'reconstructions/scene-07/src/sky-radiance144.js','sourceShaderSha256':H(shader),'capCenterRadians':center,'capWidthDegrees':cap['horizontalSpanDegrees'],'elevationRangeDegrees':cap['elevationRangeDegrees'],'linearGain':gain,'boundarySmoothstepFraction':.08,'outsideCapMeasuredGain':.08,'sunDirection':sky['targetSunDirection'],'analyticHalo':{'RGB':[1.,.46,.12],'angleSquaredDenominator':.0032,'gain':.48},'analyticDisk':{'RGB':[35.,22.,8.],'cosineSmoothstep':[.999987,.999990]},'worldFixed':True,'translationParallax':False,'cameraFacingPlane':False,'architecturePhotoOrPlate':False},'GIAndReflections':baseline['physicalLighting'],'camera':baseline['camera'],'nativePixelEquivalence':False,'visualAccepted':False,'newBlendSaved':False,'newExportCreated':False,'hallDetailReused':baseline['trueHallDetail'],'hallDetailReason':'Same original hall subfrustum is fully occupied by source building/forest geometry and contains no visible camera-sky background; no duplicate close render is needed.','warnings':['AgX remains the unchanged physical color curve; source146 shader radiance port is not ACES/WebGL pixel equivalence.','This ports only the already-declared original authored sky-only asset to camera environment rays. Physical GI/reflections continue to use the same original measured Qwantani field.','Model proportions, ornament and garden remain unaccepted source approximations.']}
report_path=OUT/'report.json';report_path.write_text(json.dumps(report,indent=2));png=OUT/'scene07-physical155-r02-camera-sky-full.png';assert not png.exists(),'Preserve existing candidate PNG';scene.render.filepath=str(png);bpy.ops.render.render(write_still=True);assert unchanged_state()==before;assert H(blend)==baseline['blend']['sha256'];report['status']='camera-background-port-rendered';report['full']={'path':str(png),'sha256':H(png),'nativeResolution':[scene.render.resolution_x,scene.render.resolution_y],'samples':scene.cycles.samples};report['elapsedSeconds']=time.time()-started;report['visualAccepted']=False;report_path.write_text(json.dumps(report,indent=2));print('SCENE07_CAMERA_SKY_R02',json.dumps({'sourceHash':EXPECTED,'status':report['status'],'full':report['full'],'elapsedSeconds':report['elapsedSeconds'],'noBlendOrExportWrite':True}),flush=True)
