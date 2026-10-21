"""Pack the already-rendered R9 whole-room prototype without changing geometry/light.

Run only through tools/run-blender-queued.mjs. This is a portable editable copy,
not a new rendered candidate or native runtime asset.
"""
import bpy,json,hashlib,time
from pathlib import Path
HERE=Path(__file__).resolve().parent
REPO=HERE.parents[1]
candidate=HERE/'iteration-03-thinner-air'
source_report=json.loads((candidate/'report.json').read_text())
assert source_report['status']=='path-traced-review'
assert source_report['sourceHash']=='061e581d9b6fdf04e08a8133ad6f45b28bc9c6531c6a41aefd3b142ca2deefe0'
source_blend=candidate/'scene06-r9-physical-prototype.blend'
started=time.time();source_digest=hashlib.sha256(source_blend.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source_blend))
scene=bpy.context.scene
before={'objects':len(scene.objects),'meshes':len(bpy.data.meshes),'vertices':sum(len(m.vertices) for m in bpy.data.meshes),'polygons':sum(len(m.polygons) for m in bpy.data.meshes),'cameraMatrix':list(v for row in scene.camera.matrix_world for v in row)}
for name,path in [('Scene06 actual physical render receipt.json',candidate/'report.json'),('Scene06 exact import and render source.py',candidate/'render-source.py'),('Scene06 lookdev provenance.json',HERE/'lookdev-provenance.json'),('Scene06 anatomical input CC0 license.md',REPO/'reconstructions/scene-06/assets/cc0-fralin-buddha-head/LICENSE.md'),('Scene06 R9 cast provenance.json',REPO/'reconstructions/scene-06/assets/sculptural-cast-r9/provenance.json')]:
    text=bpy.data.texts.new(name);text.write(path.read_text())
scene['sourceCommit']=source_report['sourceCommit'];scene['sourceHash']=source_report['sourceHash'];scene['physicalRenderPngSha256']=source_report['sha256'];scene['visualAccepted']=False
bpy.ops.file.pack_all()
images=[]
for image in bpy.data.images:
    if image.source not in ['FILE','TILED']:continue
    packed=bool(image.packed_file) or bool(image.packed_files)
    assert packed,('Unpacked external image',image.name)
    images.append({'name':image.name,'packed':packed,'size':list(image.size)})
after={'objects':len(scene.objects),'meshes':len(bpy.data.meshes),'vertices':sum(len(m.vertices) for m in bpy.data.meshes),'polygons':sum(len(m.polygons) for m in bpy.data.meshes),'cameraMatrix':list(v for row in scene.camera.matrix_world for v in row)}
assert before==after,'Packing changed source geometry or camera'
output=HERE/'scene06-r9-physical-portable.blend';bpy.ops.wm.save_as_mainfile(filepath=str(output),compress=True)
receipt={'status':'packed-editable-existing-prototype','sourceCommit':source_report['sourceCommit'],'sourceHash':source_report['sourceHash'],'sourceCandidate':'iteration-03-thinner-air','renderedImage':source_report['output'],'renderedImageSha256':source_report['sha256'],'sourceBlendSha256':source_digest,'portableBlend':str(output),'portableBlendSha256':hashlib.sha256(output.read_bytes()).hexdigest(),'portableBlendBytes':output.stat().st_size,'packedImages':images,'embeddedProvenanceAndExactBuildSource':True,'geometryAndCameraUnchanged':before==after,'geometryCounts':after,'geometryOrLightingAltered':False,'newImageRendered':False,'visualAccepted':False,'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'elapsedSeconds':time.time()-started}
(HERE/'portable-prototype-report.json').write_text(json.dumps(receipt,indent=2));print('PORTABLE_PROTOTYPE',json.dumps({k:receipt[k] for k in ['status','portableBlendBytes','geometryAndCameraUnchanged','visualAccepted']}),flush=True)
