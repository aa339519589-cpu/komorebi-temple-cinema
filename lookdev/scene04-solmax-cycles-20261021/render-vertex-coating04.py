"""Physical pool/damp response on the verified all-attribute Scene04 project.

Only material BSDF response changes. Actual wetness/dampness POINT fields,
geometry, UVs, linked instances, camera and incident lighting remain unchanged.
"""
import bpy, json, hashlib, time, math, os, importlib.util
import numpy as np
from pathlib import Path
BASE=Path(__file__).resolve().parent
INPUT=Path(os.environ.get('CYCLES_INPUT_BLEND',BASE/'cycles-vertex-r04/scene04-sourceR05-physical.blend')).resolve()
OUT=Path(os.environ.get('CYCLES_OUTPUT',BASE/'cycles-vertex-r05')).resolve();OUT.mkdir(parents=True,exist_ok=True)
source_report=json.loads((INPUT.parent/'report.json').read_text());transfer=json.loads((INPUT.parent/'vertex-state-transfer.json').read_text())
if source_report.get('sourceHash')!='a54f64c748ae854462e55429449a78611f7c8feb45f95f02f94dbd3636e61668' or not transfer['summary']['allReadBackHashesMatch']:raise ValueError('Verified R05 geometry/vertex-state project required')
def sha_file(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
 return h.hexdigest()
def sha(a):return hashlib.sha256(np.ascontiguousarray(a)).hexdigest()
report={'sourceHash':source_report['sourceHash'],'sourceCommit':source_report['sourceCommit'],'inputPackedBlend':{'file':str(INPUT),'sha256':sha_file(INPUT)},'sourceAttributeManifest':{'file':str(INPUT.parent/'vertex-state-transfer.json'),'sha256':sha_file(INPUT.parent/'vertex-state-transfer.json')},'script':{'file':Path(__file__).name,'sha256':sha_file(Path(__file__))},'geometryRebuilt':False,'status':'verifying-reused-field-geometry','visualAccepted':False,'warnings':[]}
bpy.ops.wm.open_mainfile(filepath=str(INPUT));scene=bpy.context.scene
checks=[]
for entry in transfer['importedMeshes']:
 if not any(k in entry['fields'] for k in ['r4Wetness','r4Dampness']):continue
 mesh=bpy.data.meshes.get(entry['blenderMesh']);g=transfer['originalGeometryAttributes'][entry['sourceGeometry']]
 if mesh is None or mesh.get('sourceGeometryId')!=entry['sourceGeometry'] or len(mesh.vertices)!=entry['importedPointCount']:raise ValueError('Packed source mesh correspondence failed')
 position=np.empty(len(mesh.vertices)*3,dtype=np.float32);mesh.vertices.foreach_get('co',position);position_hash=sha(position)
 if position_hash!=g['attributes']['position']['sha256']:raise ValueError('Packed geometry position hash changed')
 uv=np.empty(len(mesh.uv_layers['sourceUV'].data)*2,dtype=np.float32);mesh.uv_layers['sourceUV'].data.foreach_get('uv',uv);uv_hash=sha(uv)
 if uv_hash!=entry['sourceUV']['importedLoopSha256']:raise ValueError('Packed paving UV hash changed')
 fields={}
 for field in ['r4Wetness','r4Dampness']:
  attr=mesh.attributes.get(field)
  if attr is None or attr.domain!='POINT' or attr.data_type!='FLOAT':raise ValueError('Actual POINT FLOAT field missing')
  values=np.empty(len(mesh.vertices),dtype=np.float32);attr.data.foreach_get('value',values);actual=sha(values)
  if actual!=entry['fields'][field]['importedFloat32Sha256']:raise ValueError('Packed vertex state changed')
  fields[field]={'sha256':actual,'minimum':float(values.min()),'maximum':float(values.max()),'mean':float(values.mean(dtype=np.float64))}
 checks.append({'mesh':mesh.name,'sourceGeometry':entry['sourceGeometry'],'pointCount':len(mesh.vertices),'positionSha256':position_hash,'uvLoopSha256':uv_hash,'fields':fields,'exactMatch':True})
if len(checks)!=5:raise ValueError('Expected all five paving state geometries')
report['packedFieldGeometryVerification']={'meshes':checks,'allMatch':True,'instanceColor':'Unchanged; independent INSTANCER path retained.','otherVertexAttributes':'Unchanged packed R04 project; original attribute hashes/read-back manifest retained.'}

material_file=BASE/'material-nodes04-vertex-state.py';spec=importlib.util.spec_from_file_location('vertex_graph04',material_file);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
changed=[]
for material in bpy.data.materials:
 if not material.name.startswith('metre-scaled-worn-wet-paver-'):continue
 nodes=material.node_tree.nodes;links=material.node_tree.links;g=module.Graph(nodes,links);bs=nodes['SOURCE_PBR'];wet_attr=nodes['SOURCE_POINT_r4Wetness'];damp_attr=nodes['SOURCE_POINT_r4Dampness']
 # Recover the R04 uncoated substrate, not its already darkened output.
 original_color=bs.inputs['Base Color'].links[0].from_socket.node.inputs[1].links[0].from_socket
 rough_min=bs.inputs['Roughness'].links[0].from_socket.node;rough_max=rough_min.inputs[0].links[0].from_socket.node;rough_mix=rough_max.inputs[0].links[0].from_socket.node;dry_roughness=rough_mix.inputs[1].links[0].from_socket
 pool=g.clamp(wet_attr.outputs['Fac'],0,1);damp=g.clamp(damp_attr.outputs['Fac'],0,1)
 # r4Wetness is the actual geometric hollow mask; r4Dampness is the actual
 # source per-stone moisture propensity. Each receives a distinct BSDF role.
 dark=g.clamp(g.math('SUBTRACT',g.math('SUBTRACT',1,g.math('MULTIPLY',damp,.25)),g.math('MULTIPLY',pool,.12)),.55,1);links.new(g.multiply(original_color,dark),bs.inputs['Base Color'])
 damp_roughness=g.mix(dry_roughness,.22,damp);links.new(g.mix(damp_roughness,.10,pool),bs.inputs['Roughness'])
 weight=g.clamp(g.math('MAXIMUM',g.math('MULTIPLY',damp,.15),g.math('MULTIPLY',pool,.96)),0,1);weight.node.name='ACTUAL_POINT_POOL_COAT_WEIGHT';links.new(weight,bs.inputs['Coat Weight']);links.new(g.mix(.30,.025,pool),bs.inputs['Coat Roughness']);bs.inputs['Coat IOR'].default_value=1.333
 changed.append(material.name)
if len(changed)!=4:raise ValueError('Expected exactly four active paving materials')
report['materialAdaptation']={'materials':changed,'wetnessSource':'Unchanged original r4Wetness POINT FLOAT geometric hollow state','dampnessSource':'Unchanged original r4Dampness POINT FLOAT per-stone moisture propensity','baseColorFactor':'clamp(1 -0.25*damp -0.12*pool,0.55,1)','baseRoughness':'mix(mix(dryGraniteRoughness,0.22,damp),0.10,pool)','coatWeight':'clamp(max(0.15*damp,0.96*pool),0,1)','coatRoughness':'mix(0.30,0.025,pool)','coatIOR':1.333,'spatialCoverageNoiseAdded':False,'sourceFieldsEdited':False,'geometryUVInstancesCameraLightsEdited':False,'physicalInterpretation':'Damp stone darkens and broadens its mineral sheen; actual wet hollows form the smoother continuous water interface. Existing lower-frequency coating normals retained. This is a physical BSDF adaptation, not exact native GLSL pixel parity.'}
scene.render.engine='CYCLES';scene.cycles.device='GPU';preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
for device in preferences.devices:device.use=device.type=='METAL'
if not any(d.use for d in preferences.devices):raise RuntimeError('Metal unavailable')
scene.cycles.samples=int(os.environ.get('CYCLES_SAMPLES','96'));scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.render.resolution_x=scene.render.resolution_y=1254;scene.render.resolution_percentage=100;scene.render.use_border=False;scene.render.use_crop_to_border=False;scene.render.filepath=str(OUT/'scene04-sourceR05-vertex-state-physical-r05.png')
report.update(status='rendering-actual-vertex-material-state',blender=bpy.app.version_string,geometryTriangleCountPreserved=source_report['geometryTriangleCountPreserved'],sourceTriangleCount=source_report['sourceTriangleCount'],affinePreservation=source_report['affinePreservation'],lightCalibration=source_report['lightCalibration'],referenceCamera=source_report['referenceCamera'],transport=source_report['transport'])
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
bpy.ops.file.pack_all();blend=OUT/'scene04-r05-cycles-vertex-state-physical-r05.blend';bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True);report['packedEditableModel']={'file':blend.name,'sha256':sha_file(blend),'bytes':blend.stat().st_size,'sourceFieldGeometryVerified':True}
t=time.time();bpy.ops.render.render(write_still=True);report['fullFrame']={'file':Path(scene.render.filepath).name,'sha256':sha_file(Path(scene.render.filepath)),'size':[1254,1254],'samples':scene.cycles.samples,'seconds':time.time()-t}
logical=1254;virtual=4096;report['detailFrames']=[]
for name,crop in [('paving',(300,760,480)),('roof',(285,105,680))]:
 size=round(crop[2]/logical*virtual);left=round(crop[0]/logical*virtual);top=round(crop[1]/logical*virtual);bottom=virtual-top-size;scene.render.resolution_x=scene.render.resolution_y=virtual;scene.render.use_border=True;scene.render.use_crop_to_border=True;scene.render.border_min_x=(left+.25)/virtual;scene.render.border_max_x=(left+size+.25)/virtual;scene.render.border_min_y=(bottom+.25)/virtual;scene.render.border_max_y=(bottom+size+.25)/virtual;scene.render.filepath=str(OUT/(name+'-detail-native-cycles.png'));t=time.time();bpy.ops.render.render(write_still=True)
 report['detailFrames'].append({'file':Path(scene.render.filepath).name,'sha256':sha_file(Path(scene.render.filepath)),'requestedSourceCropPixels':[*crop,logical],'virtualFullResolution':virtual,'nominalNativeSize':size,'seconds':time.time()-t,'freshPathTrace':True,'upscaled':False})
report.update(status='path-traced-review',photographicAcceptance=False,finished=time.time());(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print('SCENE04_POINT_STATE_COMPLETE',json.dumps({'status':report['status'],'sourceHash':report['sourceHash'],'fullFrame':report['fullFrame'],'detailFrames':report['detailFrames'],'packedEditableModel':report['packedEditableModel']}),flush=True)
