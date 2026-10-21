"""Deduplicate identical external textures, then make a standalone model."""
import bpy, json, hashlib
from pathlib import Path

base=Path('lookdev/scene01-solmax-cycles-20261021/cycles').resolve()
model=base/'scene01-source132-packed-physical.blend'
bpy.ops.wm.open_mainfile(filepath=str(model))
scene=bpy.context.scene
source=json.loads((base/'low-courtyard-balanced-review.json').read_text())
before=len(bpy.data.images);unique={};removed=[]
for image in list(bpy.data.images):
    path=bpy.path.abspath(image.filepath)
    key=(path,image.colorspace_settings.name,image.alpha_mode,image.source)
    if image.source!='FILE' or not path:continue
    if key in unique:
        image.user_remap(unique[key]);removed.append(image.name);bpy.data.images.remove(image)
    else:unique[key]=image
scene['source_repository']='https://github.com/aa339519589-cpu/komorebi-temple-cinema'
scene['source_commit']=source['sourceCommit']
scene['source_scene_sha256']=source['sourceHash']
scene['status']='Actual 3D reconstruction in progress; photographic fidelity unaccepted.'
scene['lighting_scope']='Source scene plus declared 6000W low courtyard area bounce; physical water and leaf material adaptation.'
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(model),compress=True)
images=[{'name':i.name,'packed':bool(i.packed_file),'source':i.source,'colorSpace':i.colorspace_settings.name} for i in bpy.data.images if i.users]
report={'sourceHash':source['sourceHash'],'sourceCommit':source['sourceCommit'],'model':model.name,'bytes':model.stat().st_size,'sha256':hashlib.sha256(model.read_bytes()).hexdigest(),'imagesBefore':before,'imagesAfter':len(bpy.data.images),'deduplicatedImageCount':len(removed),'images':images,'allUsedFileImagesPacked':all(i['packed'] for i in images if i['source']=='FILE'),'geometryDecimated':False,'cameraChanged':False,'visualAccepted':False}
(base/'editable-model-manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='images'}))
