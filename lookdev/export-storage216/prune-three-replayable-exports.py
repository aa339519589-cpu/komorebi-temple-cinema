"""Prune only three obsolete compiled packages after full source/payload proofs.
Original assets, rendered evidence, selected Blends, source frames and manifests
remain. Each historical text input and exporter is retained for replay.
"""
from pathlib import Path
import json, hashlib, subprocess, re, datetime, shutil
ROOT=Path('/Users/mima1234/temple-cinema-live-sync')
PACKAGES={
 'lookdev/scene03-solmax-cycles-20261021/export':'2115956f5eb49510e45b190eb6f52ebbe0c761100f3e93f00d96863e61482d59',
 'lookdev/scene04-solmax-cycles-20261021/export-vertex-state':'a54f64c748ae854462e55429449a78611f7c8feb45f95f02f94dbd3636e61668',
 'lookdev/scene04-solmax-cycles-20261021/export':'a54f64c748ae854462e55429449a78611f7c8feb45f95f02f94dbd3636e61668',
}
OUT=ROOT/'lookdev/export-storage216/three-replayable-exports';OUT.mkdir(exist_ok=False)
def sha(path):
 h=hashlib.sha256()
 with path.open('rb')as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def git_bytes(commit,name):
 return subprocess.check_output(['git','show',commit+':'+name],cwd=ROOT)
proofs=[];payloads=[];seen=set();unique=0
for relative,pin in PACKAGES.items():
 base=ROOT/relative;r=json.loads((base/'export-report.json').read_text());assert r['sourceHash']==pin
 label=relative.replace('/','__'); inputs=[]
 for name,want in r['source']['files'].items():
  p=ROOT/name
  if p.exists() and sha(p)==want:
   data=p.read_bytes() if p.suffix in ['.js','.mjs','.py','.json','.html','.md','.txt'] else None
   where='canonical exact bytes'
  else:
   data=git_bytes(r['sourceCommit'],name);assert hashlib.sha256(data).hexdigest()==want,name
   where='git:'+r['sourceCommit']+':'+name
  if data is not None and p.suffix in ['.js','.mjs','.py','.json','.html','.md','.txt']:
   dst=OUT/label/'rebuild-source'/name;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(data);where=str(dst.relative_to(ROOT))
  inputs.append({'path':name,'sha256':want,'retained':where})
 for name in ['tools/export-reconstructed-scene.mjs','tools/server.mjs','tools/reconstruction-source-identity.mjs','tools/gpu-render-slot.mjs','tools/render-runtime.mjs','tools/encode-webgl-png.mjs']:
  data=git_bytes(r['sourceCommit'],name);dst=OUT/label/'rebuild-source'/name;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(data)
 records=[]
 for name,rec in r['exportedAssets'].items():
  if not re.fullmatch(r'(geometry-.*\.bin|instances-.*\.bin|instance-colors-.*\.bin|texture-.*\.png)',name):continue
  p=base/'assets'/name
  if not p.exists():continue
  assert p.is_file() and not p.is_symlink(); st=p.stat()
  assert st.st_size==rec['bytes'] and sha(p)==rec['sha256'],str(p)
  if (st.st_dev,st.st_ino)not in seen:seen.add((st.st_dev,st.st_ino));unique+=st.st_size
  records.append({'path':str(p.relative_to(ROOT)),**rec});payloads.append(p)
 handles=subprocess.run(['lsof','+D',str(base)],capture_output=True,text=True)
 assert handles.returncode==1 and not handles.stdout.strip(),handles.stdout
 proofs.append({'package':relative,'sourceHash':pin,'sourceCommit':r['sourceCommit'],'sourceInputs':inputs,'derivedPayloads':records})
receipt={'status':'all-source-and-derived-payload-hashes-verified-before-removal','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'packages':proofs,'payloadCount':len(payloads),'uniqueInodeBytesBefore':unique,'freeBefore':shutil.disk_usage(ROOT).free,'retained':['all source images, original mesh assets, selected Blend projects and actual rendered PNG/video evidence','scene.json, export-report.json and source-frame PNG/RGBA','every exact historical text input and official exporter helpers','binary input hashes and exact current or Git locations'],'regeneration':'Materialize every exact source input with retained historical exporter/tools and historical vendor checkout from sourceCommit, then run through the current shared GPU FIFO. Do not substitute current scene03/04 source.'}
path=OUT/'verified-pruning-receipt.json';path.write_text(json.dumps(receipt,indent=2)+'\n')
for p in payloads:p.unlink()
receipt.update(status='only-three-verified-replayable-derived-packages-pruned',freeAfter=shutil.disk_usage(ROOT).free);path.write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'verifiedInputs':sum(len(p['sourceInputs'])for p in proofs),'removedDerivedPayloads':len(payloads),'uniqueMiBBefore':unique/2**20,'freeGiBAfter':receipt['freeAfter']/2**30}))
