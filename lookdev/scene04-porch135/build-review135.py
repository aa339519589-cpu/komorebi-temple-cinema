"""Scene04 source/render packaging and CPU comparisons only, never a scene plate."""
import json,hashlib,tarfile,subprocess
from pathlib import Path
REPO=Path(__file__).resolve().parents[2];DEV=Path(__file__).resolve().parent
QA=REPO/'qa/ten-reference/04/iteration-scene04-porch135-r03'
OBLIQUE=REPO/'qa/ten-reference/04/iteration-scene04-porch135-r03-oblique'
load=lambda p:json.loads(p.read_text())
native=load(QA/'report.json');oblique=load(OBLIQUE/'report.json')
export=load(DEV/'export-r03/export-report.json');physical=load(DEV/'cycles-r03/report.json')
source=native['source']['hash']
assert source=='05dd5b9e39b3a93114a76f2101acca481e7136e0306a3ab29c510ff2bd243e44'
assert native['status']==oblique['status']=='rendered-review'
assert all(f['valid'] and f['width']==1254 and f['height']==1254 for r in [native,oblique] for f in r['frames'])
assert source==oblique['source']['hash']==export['sourceHash']==physical['sourceHash']
assert export['status']=='exported-existing-geometry' and export['servedSource']['allMatch']
assert physical['status']=='path-traced-review' and physical['geometryTriangleCountPreserved']
assert physical['vertexAttributeTransfer']['allReadBackHashesMatch']
assert physical['vertexAttributeTransfer']['sourceGeometryFields']['r4Wetness']==5
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
 return h.hexdigest()
photo=REPO/'references/hd/3-照片-4.jpg'
before=REPO/'qa/ten-reference/04/iteration-scene04-monumental134-r03/reference.png'
full=QA/'reference.png';detail=QA/'detail-native.png'
physical_frame=DEV/'cycles-r03'/physical['fullFrame']['file']
def compare(files,name,labels,crop=None,scale=None):
 args=['ffmpeg','-y','-hide_banner','-loglevel','error','-filter_complex_threads','1']
 for p in files:args+=['-i',str(p)]
 filters=[]
 for i in range(len(files)):
  ops=[]
  if crop:ops.append('crop='+':'.join(map(str,crop)))
  if scale:ops.append('scale='+str(scale[0])+':'+str(scale[1])+':flags=lanczos')
  filters.append('['+str(i)+':v]'+','.join(ops or ['null'])+'[p'+str(i)+']')
 filters.append(''.join('[p'+str(i)+']' for i in range(len(files)))+'hstack=inputs='+str(len(files))+'[out]')
 dest=QA/name
 args+=['-filter_complex',';'.join(filters),'-map','[out]','-frames:v','1','-threads','1',str(dest)]
 subprocess.run(args,check=True)
 dest.with_suffix('.json').write_text(json.dumps({'scope':'CPU comparison only, never a scene render or runtime surface','leftToRight':labels,'crop':crop,'scale':scale},indent=2)+'\n')
 return dest
whole=compare([photo,before,full,physical_frame],'comparison-only-photo-134-135-native-135-cycles.png',['Source04 photograph','Actual native134 R03','Actual native135 R03','Actual physical135 R03'],scale=(627,627))
porch=compare([photo,before,full,physical_frame],'comparison-only-dominant-porch.png',['Source04 comparison crop','Actual native134 comparison crop','Actual native135 comparison crop','Actual physical135 comparison crop'],crop=(710,390,275,195))
r1=REPO/'qa/ten-reference/04/iteration-scene04-porch135-r01/reference.png'
r2=REPO/'qa/ten-reference/04/iteration-scene04-porch135-r02/reference.png'
history=compare([r1,r2,full],'comparison-only-135-native-repair-history.png',['135R01 - gold carpet candidate','135R02 - separated but clipped patches','135R03 - remeshed natural margins/canted bearings'],crop=(710,390,275,195))
# Freeze current editable namespace plus the newly selected small modeling input.
editable=[]
for rel,digest in native['source']['files'].items():
 p=REPO/rel
 if rel.startswith('reconstructions/scene-04/') and (p.suffix in ['.js','.mjs','.html','.json'] or rel.startswith('reconstructions/scene-04/assets/carving135/')):
  assert sha(p)==digest,rel
  editable.append(rel)
archive=QA/'source-scripts-and-carving-input-provenance.tar.gz'
with tarfile.open(archive,'w:gz') as tar:
 for rel in editable:tar.add(REPO/rel,arcname=rel)
(QA/'retained-source.json').write_text(json.dumps({'sourceHash':source,'sourceFiles':native['source']['files'],'archive':archive.name,'archiveSha256':sha(archive),'editableFiles':editable,'scope':'Exact namespace scripts/HTML/JSON plus selected carving135 guide and scalar data. Existing large PBR/scan/shared dependencies remain at their exact declared repository hashes.'},indent=2)+'\n')
blend=DEV/'cycles-r03/scene04-porch135-physical.blend'
provenance={'revision':'scene04-porch135-r03','sourceHash':source,'nativeReport':str((QA/'report.json').relative_to(REPO)),'officialExportReport':str((DEV/'export-r03/export-report.json').relative_to(REPO)),'sceneBufferManifestSha256':sha(DEV/'export-r03/scene.json'),'packedBlend':{'file':str(blend.relative_to(REPO)),'sha256':sha(blend),'bytes':blend.stat().st_size},'physicalFrame':{'file':str(physical_frame.relative_to(REPO)),'sha256':sha(physical_frame)},'scripts':[{'file':str((DEV/f).relative_to(REPO)),'sha256':sha(DEV/f)} for f in ['render-porch135-physical.py','material-nodes04-vertex-state.py','vertex-attributes04.py']],'geometryTrianglesRetained':physical['sourceTriangleCount'],'triangleCountPreserved':True,'UVAndPointReadBackHashesMatch':True,'sourceInstanceColorPath':'Exact source POINT instancer RGB retained by independent INSTANCER attribute; direct/affine variants use GEOMETRY material domains.','heightGuideUse':'Scalar modeling input only; all new carving is actual independently lit closed wood/gilt geometry. No generated guide or source photo is visible albedo, sky, camera plate or film frame.','nativePixelEquivalence':False,'visualAccepted':False}
(DEV/'cycles-r03/physical-scene-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
files=[full,detail,OBLIQUE/'inspection-view.png',physical_frame,whole,porch,history]
review={'revision':'scene04-porch135-r03','status':'major-porch-gable-rebuild-rendered-unaccepted','visualAccepted':False,'sourceHash':source,'reference':'references/hd/3-照片-4.jpg','baseline':'qa/ten-reference/04/iteration-scene04-monumental134-r03','nativeEvidence':{'fullAndTrueSubfrustum':'qa/ten-reference/04/iteration-scene04-porch135-r03/report.json','oblique':'qa/ten-reference/04/iteration-scene04-porch135-r03-oblique/report.json','all1254':True,'allSameSourceHash':True,'motionRendered':False},'physicalEvidence':{'export':'lookdev/scene04-porch135/export-r03/export-report.json','render':'lookdev/scene04-porch135/cycles-r03/report.json','packedModel':'lookdev/scene04-porch135/cycles-r03/scene04-porch135-physical.blend','sameSource':True,'triangleCountPreserved':True,'UVAndPointReadBackHashesMatch':True,'nativePixelEquivalence':False},'actualAssembly':native['frames'][0]['info']['architecture']['porchJoinery'],'implementation':['Replaced running133 small toy flower/wire-leaf module with a dominant closed solid relief and deep architectural assembly;134R03 receipts and frozen source remain intact.','Two thinner visible compound swept hafu bodies retreat0.54m, with actual solid shoulder returns coupling them, heavy sculpted carved crown/end bodies and seated thin metal fillets.','Actual raised wood and conforming gilt volumes form shaped transfer/nuki carvings, dense pierced ranma and an occupied recessed arched tympanum; selected existing generated hosoge-karakusa scalar guide never becomes scene albedo.','Thirty-six interlocked mortised cloud-arm bearing clusters, six shaft-bearing sets, canted octagonal receivers and bevelled bridges replace plain bracket/ladder stacks.','Thirty-two curved closed vault boards with verified outward winding and broad structural arch trimmers replace bare vault/thin repeated ribs.','Straight main-ridge box is replaced by a gently curved multi-step ceramic section; its carved medallions conform to the actual new face.'],'sourceUse':{'selectedGuide':'reconstructions/scene-04/assets/carving135/hosoge-karakusa-height-guide.png','provenance':'reconstructions/scene-04/assets/carving135/provenance.json','newGeneratedRejectedGuide':'lookdev/scene04-porch135/rejected-authored-dragon-cloud-height-guide.png','newGeneratedPrompt':'lookdev/scene04-porch135/rejected-imagegen-prompt.txt','guideIsNonMetric':True,'photoRGBRendered':False,'guideUsedAsVisibleMap':False},'preserved':['Reference camera/film path','Main hall weather roof profile and bay axes','Actual statue/stair/path/toro/root contacts','Shared/global asset bytes','Native global light settings from134; no additional light-parameter sweep'],'critiqueAndRepairs':['135R01 actual full/detail showed overcontinuous gold carpets and low-gray guide substrate. Candidate/source archive retained.','135R02 actual full/detail restored wood intervals but exposed clipped rectangular ornaments and plain receiver stacks; candidate/source archive retained.','135R03 removes more low substrate by average-cell threshold0.21 after0.18 remap, uses high-surface gilt cutoff0.60, full guide-height margins and corresponding physical field sizes, thinner coupled visible sections with real returns, canted receivers and fewer duplicate bridge strips.','Actual R03 oblique confirms real front/rear depth and independently shadowed sculpture/bearings. A fresh verified export and physical keyframe use exactly this source geometry.'],'review':{'wholeFrame':'Major porch/gable mass, occupied carving and real coupled member depth are a substantive correction over134. This still looks like an authored CG reconstruction compared with Source04.','physical':'One fresh full1254/96 physical keyframe uses the already established134 sunlight/sky/pool interpretation, without a new light sweep. The source shader sky/cloud and planar reflection remain renderer-specific exclusions; physical world/GI/reflections and BSDF are documented adaptations.','remainingGaps':['Carving layout still has visible repetition and some stamped/regular panel read; it does not recover source iconography or arbitrary hidden rear undercuts.','Whole-scene wood/gilt/ceramic response, weathering and fine structure remain less photographic than the source.','Garden/stone-lantern/roof-tile/statue simplification persists outside this dominant-porch correction.','No film or temporal acceptance is established.']},'files':[{'file':str(p.relative_to(REPO)),'sha256':sha(p)} for p in files]}
(QA/'final-review.json').write_text(json.dumps(review,indent=2)+'\n')
(DEV/'README.txt').write_text('Scene04 porch135 dominant assembly rebuild\nSource: '+source+'\n\nActual native full1254, true1254 source-camera porch subfrustum, oblique1254 and exact-source physical1254/96 completed. Physical geometry/UV/POINT/instance data preserved; current source geometry was freshly exported and no old bins were reused.\n\nSelected existing generated hosoge-karakusa guide is scalar modeling input only, converted into actual closed pierced wood relief and closed conforming gilt. It is not visible albedo or an image plate. New generated dragon guide was rejected and retained only in lookdev with prompt/provenance. All134 receipts remain intact.\n\nCurrent physical image uses the already established134 global transport calibration without a new lighting sweep: sun source*1.45, world0.075, dust0.40, ozone1.20, AgX exposure0.04. Existing completed damp/pool POINT interpretation is carried forward directly. Independent BRDF/GI/world/sky/reflection differs from native WebGL; no pixel equivalence.\n\nNative gold-carpet/clipped-patch candidates were critiqued and repaired as real topology/member changes. Current image remains CG with repeated/stamped ornament and fine source gaps. visualAccepted=false. No film and no commit in this lane.\n')
print(json.dumps({'sourceHash':source,'status':review['status'],'native':native['status'],'oblique':oblique['status'],'physical':physical['status'],'visualAccepted':False,'review':str((QA/'final-review.json').relative_to(REPO))}))
