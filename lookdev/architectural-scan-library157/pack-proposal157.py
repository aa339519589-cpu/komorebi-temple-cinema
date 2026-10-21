"""Embed credit/changes and recorded review cameras; no geometry rebuild."""
import bpy,json,hashlib,time
from pathlib import Path
from mathutils import Matrix
BASE=Path(__file__).resolve().parent;OUT=BASE/'review-floral157-r01';path=OUT/'floral-frieze157-editable-proposal.blend';report=json.loads((OUT/'report.json').read_text());before=hashlib.sha256(path.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(path));scene=bpy.context.scene
for filename in['ATTRIBUTION.md','PROPOSAL.md']:
    old=bpy.data.texts.get(filename)
    if old:bpy.data.texts.remove(old)
    text=bpy.data.texts.new(filename);text.write((BASE/filename).read_text())
for record in report['renders']:
    if not record['file'].startswith('floral-frieze-proposal-'):continue
    data=bpy.data.cameras.new('Recorded '+record['file']);obj=bpy.data.objects.new(data.name,data);scene.collection.objects.link(obj);obj.matrix_world=Matrix(record['cameraWorldMatrix']);data.type='ORTHO';data.ortho_scale=record['orthographicWidth'];data.clip_start=.001;data.clip_end=100;scene.camera=obj
root=bpy.data.objects.get('157 carved frieze assembly; proposed metric frame')
if root:
    root['primary_source_url']='https://sketchfab.com/3d-models/wood-carving-93766a4c12eb4c278d23294582034e8c'
    root['license_url']='https://creativecommons.org/licenses/by/4.0/'
    root['changes_record']='ATTRIBUTION.md and PROPOSAL.md are embedded Text datablocks. Original scan face subset/attributes retained; carrier/material study added.'
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True)
after=hashlib.sha256(path.read_bytes()).hexdigest();package={'status':'editable-proposal-credit-and-cameras-embedded','file':path.name,'bytes':path.stat().st_size,'previousUnpackagedSha256':before,'sha256':after,'geometryRebuilt':False,'sourceMaterialsRetained':True,'embeddedTexts':['ATTRIBUTION.md','PROPOSAL.md'],'recordedReviewCamerasRestored':2,'metricConversionVerified':False,'canonicalIntegration':False}
(OUT/'package-report.json').write_text(json.dumps(package,indent=2)+'\n');report['editableModel'].update({'bytes':path.stat().st_size,'sha256':after,'previousUnpackagedSha256':before,'embeddedCreditAndChanges':True,'recordedReviewCameras':2});(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print('PACKAGED_COMPONENT157',json.dumps(package),flush=True)
