"""Verify immutable d258/public80ef replay inputs, then prune only R09 derived payloads.
No export, render, branch/index/worktree mutation, original-binary copy or other-cache removal.
"""
from pathlib import Path
import json,hashlib,subprocess,os,datetime,shutil,re
ROOT=Path('/Users/mima1234/temple-cinema-live-sync');HERE=ROOT/'lookdev/scene01-rebuild219';BASE=HERE/'export-physical-r09';ASSETS=BASE/'assets'
PIN='d2587c2f5426ba656dc4c0d385b6499a452fbf26ff7352b9e712adb82e449dbd'
SNAP=HERE/'rebuild-d258-public80ef-r09';RECEIPT=HERE/'verified-completed-r09-pruning-public80ef.json'
assert ASSETS==ROOT/'lookdev/scene01-rebuild219/export-physical-r09/assets' and not RECEIPT.exists()
def sha(path):
 h=hashlib.sha256()
 with path.open('rb')as f:
  for data in iter(lambda:f.read(1024*1024),b''):h.update(data)
 return h.hexdigest()
def j(path):return json.loads(path.read_text())
r=j(BASE/'export-report.json');v=j(HERE/'export-verification-r09.json');physical=j(HERE/'physical-r11/report.json')
assert r['status']=='exported-existing-geometry' and r['sourceHash']==PIN and not r['errors'] and r['servedSource']['allMatch']
assert v['status']=='all-export-payloads-byte-and-hash-verified' and v['sourceHash']==PIN
assert sha(BASE/'scene.json')==v['manifestSha256'] and sha(BASE/'export-report.json')==v['exportReportSha256']
assert physical['status']=='path-traced-review' and physical['sourceHash']==PIN and sha(Path(physical['renderFile']))==physical['renderSha256']
# Read-only object access verifies the exact public input revision. No Git state is changed.
gitenv={**os.environ,'GIT_OPTIONAL_LOCKS':'0'}
commit=subprocess.check_output(['git','rev-parse','80efbe14^{commit}'],cwd=ROOT,env=gitenv,text=True).strip();assert commit.startswith('80efbe14')
def public_sha(name):
 proc=subprocess.Popen(['git','cat-file','blob',commit+':'+name],cwd=ROOT,env=gitenv,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 h=hashlib.sha256();n=0
 for data in iter(lambda:proc.stdout.read(1024*1024),b''):h.update(data);n+=len(data)
 error=proc.stderr.read();code=proc.wait()
 if code:
  assert name=='lookdev/temple-carved-bearing176/sources/1336fa1889cf4eba829594fa30edd6ff/creator-primary-metadata.json' and (ROOT/name).stat().st_size==6167 and sha(ROOT/name)=='418a9667b80f0a7ef481fa3a92f3542819b37dd9d1e46972e97cddbdc6893b82',(name,error.decode())
  return None,None
 return h.hexdigest(),n
identity=hashlib.sha256();source_inputs=[]
for name,wanted in sorted(r['source']['files'].items()):
 path=ROOT/name;assert path.is_file() and not path.is_symlink();assert sha(path)==wanted,name
 identity.update(name.encode()+b'\0')
 with path.open('rb')as f:
  for data in iter(lambda:f.read(1024*1024),b''):identity.update(data)
 identity.update(b'\0');source_inputs.append(name)
assert identity.hexdigest()==PIN
requests=j(ROOT/'qa/ten-reference/01/iteration-scene01-rebuild219-r07b-full-hero/report.json')['requests']
tools=['tools/export-reconstructed-scene.mjs','tools/export-asset-writer.mjs','tools/reconstruction-source-identity.mjs','tools/server.mjs','tools/render-runtime.mjs','tools/gpu-render-slot.mjs','tools/encode-webgl-png.mjs','tools/run-blender-queued.mjs','tools/render-one-reconstruction.mjs']
recipes=[str(p.relative_to(ROOT))for p in HERE.iterdir()if p.is_file()and re.search(r'(physical.*r(?:08|09|09b|10|11)|granite219-physical-node-port-plan)',p.name)and p.suffix in ['.mjs','.py','.json']]
inputs=sorted(set(source_inputs+[name.lstrip('/')for name in requests]+tools+recipes+['reconstructions/scene-01/README.md','package.json']))
assert sha(ROOT/'tools/export-reconstructed-scene.mjs')==j(HERE/'export-attempt-r09.json')['driverSha256']
assert sha(ROOT/'lookdev/scene01-rebuild219/render-physical219-r11.py')==physical['renderScriptSha256']
assert sha(ROOT/'lookdev/scene01-rebuild219/granite219-physical-node-port-plan.py')==physical['granite219NodePort']['reviewedModuleSha256']
SNAP.mkdir(exist_ok=True);input_records=[]
for name in inputs:
 path=ROOT/name;assert path.is_file() and not path.is_symlink() and path.resolve().is_relative_to(ROOT)
 local=sha(path);public,public_bytes=public_sha(name)
 if public is not None:assert local==public and path.stat().st_size==public_bytes,('Public input differs',name)
 else:public_bytes=path.stat().st_size
 retained='original binary retained unchanged, referenced by path/length/SHA256'
 if path.suffix.lower()in ['.mjs','.js','.html','.json','.md']:
  target=SNAP/name;target.parent.mkdir(parents=True,exist_ok=True)
  if not target.exists():shutil.copyfile(path,target)
  assert sha(target)==local;retained=str(target.relative_to(ROOT))
 input_records.append({'path':name,'bytes':public_bytes,'sha256':local,'publicCommit':commit if public is not None else None,'publicBlobSHA256Matches':public is not None,'origin':'public80ef exact blob' if public is not None else 'Only original metadata JSON was not present in public80ef; exact original text is now frozen in the replay snapshot with its d258 SHA256. No bytes inferred.','retained':retained})
# Every named payload is independently re-read, even when hardlinked. Nothing is removed yet.
files=list(ASSETS.iterdir());expected=set(r['exportedAssets'])|{'source-frame.png'};assert {p.name for p in files}==expected
inventory=[];inodes={};unique=0
for path in files:
 st=path.lstat();assert path.is_file() and not path.is_symlink();actual=sha(path)
 if path.name in r['exportedAssets']:
  wanted=r['exportedAssets'][path.name];assert st.st_size==wanted['bytes'] and actual==wanted['sha256'],path.name
 else:assert actual==v['nativeProof']['pngSha256'] and st.st_size==v['nativeProof']['bytes']
 key=(st.st_dev,st.st_ino);inodes.setdefault(key,[]).append(path.name)
 inventory.append({'name':path.name,'bytes':st.st_size,'sha256':actual,'device':st.st_dev,'inode':st.st_ino,'nlink':st.st_nlink})
for item in inventory:assert item['nlink']==len(inodes[(item['device'],item['inode'])]),('External hardlink',item['name'])
unique=sum(next(row['bytes']for row in inventory if(row['device'],row['inode'])==key)for key in inodes)
handles=subprocess.run(['lsof','+D',str(BASE)],capture_output=True,text=True);assert handles.returncode==1 and not handles.stdout.strip(),handles.stdout
# Retain original source-frame.png/.rgba in the same assets paths, all metadata and all actual evidence.
removed=[row for row in inventory if re.fullmatch(r'(geometry-.*\.bin|instances-.*\.bin|instance-colors-.*\.bin|texture-.*\.png)',row['name'])]
assert len(removed)==len(r['exportedAssets'])-1 and len(r['exportedAssets'])==18426
retained_frames=[row for row in inventory if row['name']in ['source-frame.rgba','source-frame.png']];assert len(retained_frames)==2
metadata=['scene.json','export-report.json'];retained_metadata={name:sha(BASE/name)for name in metadata}
evidence_paths=[p for p in HERE.rglob('*')if p.is_file()and ASSETS not in p.parents and SNAP not in p.parents and(p.suffix.lower()in ['.png','.rgba']or p.name in ['report.json','REVIEW219-R11.json','REVIEW219-R10.json','REVIEW219-R09B.json'])]
evidence=[{'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':sha(p)}for p in evidence_paths]
manifest={'status':'all-fixed-public-inputs-and-current-R09-payloads-verified-ready-to-prune','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceHash':PIN,'publicCommit':commit,'readOnlyGitObjectComparisonOnly':True,'snapshotRoot':str(SNAP.relative_to(ROOT)),'sourceIdentityInputCount':len(source_inputs),'allInputFiles':input_records,'sourceIdentityExactlyRecomputed':True,'allNamedPayloadsReadIndividuallyAndSHA256Verified':True,'recordedPayloads':len(r['exportedAssets']),'inventoryWithHardlinkOwnership':inventory,'allHardlinksConfinedToExactDerivedDirectory':True,'uniqueBytesBefore':unique,'filesToRemove':removed,'retainedSourceFrames':retained_frames,'retainedMetadataSHA256':retained_metadata,'retainedActualEvidence':evidence,'freeBefore':shutil.disk_usage(ROOT).free,'onlyPrunedDirectory':str(ASSETS.relative_to(ROOT)),'originalBinaryCopiedOrDeleted':False,'otherCacheOrSelectedBlendTouched':False,'freshExportOrRestoreTestRun':False,'reconstructionProof':'Materialize public commit80efbe14 exact text snapshots and each preserved original binary path with matching length/SHA256. Exact exporter/tool/runtime/vendor/importer inputs are listed. Recompute source identity d258 before any future official FIFO export; retain exported scene.json metadata and actual image identities. No future source can substitute for these fixed inputs. Browser/GPU rounding and random runtime UUIDs are not asserted to reproduce byte-identical metadata or framebuffer on another runtime.','runtime':{'nodeRecorded':subprocess.check_output(['node','-p','process.version'],text=True).strip(),'BlenderRecorded':physical['blender'],'physicalRecipe':str((HERE/'render-physical219-r11.py').relative_to(ROOT))}}
RECEIPT.write_text(json.dumps(manifest,indent=2)+'\n')
for row in removed:(ASSETS/row['name']).unlink()
for row in retained_frames:assert sha(ASSETS/row['name'])==row['sha256']
for name,wanted in retained_metadata.items():assert sha(BASE/name)==wanted
for row in evidence:assert sha(ROOT/row['path'])==row['sha256']
manifest['status']='only-completed-R09-derived-buffers-pruned-with-fixed-public-input-proof';manifest['freeAfter']=shutil.disk_usage(ROOT).free;manifest['retainedEvidenceReverifiedAfterRemoval']=True;RECEIPT.write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'status':manifest['status'],'publicCommit':commit,'sourceInputs':len(source_inputs),'totalInputs':len(input_records),'recordedPayloadsVerified':18426,'derivedFilesRemoved':len(removed),'framesRetained':len(retained_frames),'uniqueBytesBefore':unique,'freeBefore':manifest['freeBefore'],'freeAfter':manifest['freeAfter']}))
