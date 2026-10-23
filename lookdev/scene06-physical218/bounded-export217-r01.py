"""Hash-pinned current geometry export with write-time exact-byte deduplication.
The older195 recipe required7GiB because it first wrote every duplicate buffer.
This recipe never materializes duplicate payloads, caps UNIQUE assets at640MiB
and refuses a unique write that would leave less than384MiB free. No original
source, previous render, or selected Blend is removed by this operation.
"""
from pathlib import Path
import os,json,hashlib,subprocess,shutil,time,signal
ROOT=Path('/Users/mima1234/temple-cinema-live-sync');HERE=Path(__file__).resolve().parent
OUT=HERE/'export217-r01';PIN='7514b2fddc215ebae8c48dbf0f7f7d41fa23e8b5c3b514f3df72dfacffbe6b62'
assert not OUT.exists(),'Fresh export path required; retain failed evidence'
assert shutil.disk_usage(ROOT).free>=int(1.2*1024**3),'Defer until1.2GiB free for browser/manifest overhead'
actual=subprocess.check_output(['node','--input-type=module','-e',"import {reconstructionSourceIdentity} from './tools/reconstruction-source-identity.mjs'; console.log((await reconstructionSourceIdentity(process.cwd(),'06')).hash);"],cwd=ROOT,text=True).strip()
assert actual==PIN,'Canonical source is no longer the reviewed217 source'
env=os.environ.copy();env.update(REFERENCE='6',SCENE_EXPORT=str(OUT),EXPORT_PORT='4638',EXPORT_MAX_UNIQUE_BYTES=str(640*1024**2),EXPORT_MIN_FREE_BYTES=str(384*1024**2))
started=time.time();failure=None;peak=0
with (HERE/'export217-r01.log').open('w')as log:
 proc=subprocess.Popen(['node','tools/export-reconstructed-scene.mjs'],cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
 while proc.poll()is None:
  if OUT.exists():
   seen=set();physical=0
   for p in OUT.rglob('*'):
    if not p.is_file():continue
    st=p.stat();key=(st.st_dev,st.st_ino)
    if key not in seen:seen.add(key);physical+=st.st_size
   peak=max(peak,physical)
  if shutil.disk_usage(ROOT).free<256*1024**2:
   failure='Emergency256MiB free-space floor crossed';os.killpg(proc.pid,signal.SIGTERM)
   try:proc.wait(timeout=15)
   except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait()
   break
  time.sleep(2)
 code=proc.wait()
receipt={'sourcePin':PIN,'status':'export-failed','exitCode':code,'failure':failure,'elapsedSeconds':time.time()-started,'peakObservedUniqueFilesystemBytes':peak,'maxUniqueAssetBytes':640*1024**2,'perWriteMinimumFreeBytes':384*1024**2,'emergencyMinimumFreeBytes':256*1024**2,'officialFifoUnchanged':True,'originalOrCanonicalFilesDeleted':False,'writeTimeExactDeduplication':True,'tools':{name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest()for name in ['tools/export-reconstructed-scene.mjs','tools/export-asset-writer.mjs']}}
try:
 assert code==0 and failure is None,'Official export failed; preserve partial output'
 r=json.loads((OUT/'export-report.json').read_text());assert r['sourceHash']==PIN and r['status']=='exported-existing-geometry' and not r['errors']
 seen=set();unique=0
 for name,rec in r['exportedAssets'].items():
  p=OUT/'assets'/name;assert p.is_file()and p.stat().st_size==rec['bytes']
  assert hashlib.sha256(p.read_bytes()).hexdigest()==rec['sha256'],name
  st=p.stat();key=(st.st_dev,st.st_ino)
  if key not in seen:seen.add(key);unique+=st.st_size
 assert unique==r['assetStorage']['uniqueBytes'],'Storage receipt differs from actual inodes'
 receipt.update(status='official-current217-export-all-bytes-and-source-verified',statistics=r['statistics'],assetStorage=r['assetStorage'],uniqueBytesVerified=unique,allPayloadHashesVerified=True,freeBytesAfter=shutil.disk_usage(ROOT).free)
finally:
 (HERE/'export217-r01-disk-and-byte-proof.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt,indent=2),flush=True)
