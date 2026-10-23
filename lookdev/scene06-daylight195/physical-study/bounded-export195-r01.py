"""Run the unchanged official scene exporter with a temporary disk bound.
Duplicates are hard-linked only after official export completion and hash checks.
The derived export is read-only input to Cycles; live source files are never linked.
"""
import os,sys,json,time,signal,subprocess,shutil,hashlib
from pathlib import Path
ROOT=Path('/Users/mima1234/temple-cinema-live-sync')
HERE=Path(__file__).resolve().parent
OUT=HERE/'cycles-195-r01-export'
GIB=1024**3
MAX_EXPORT_BYTES=int(3.75*GIB)
MIN_FREE_BYTES=int(3.5*GIB)
expected=os.environ['EXPECTED_SCENE_HASH']
if expected!='e4eb8927001e1b396435ca086e9365718a5c1f45f6a4f0df265fb5a2f1aae6b7':raise ValueError('Exact reviewed native195 R01 source pin required')
if OUT.exists():raise ValueError('Fresh export path required; preserve earlier evidence')
if shutil.disk_usage(ROOT).free<7*GIB:raise RuntimeError('Less than7GiB free; defer bounded physical study')
live_source=subprocess.check_output(['node','--input-type=module','-e',"import {reconstructionSourceIdentity} from './tools/reconstruction-source-identity.mjs'; console.log((await reconstructionSourceIdentity(process.cwd(),'06')).hash);"],cwd=ROOT,text=True).strip()
if live_source!=expected:raise RuntimeError('Live source differs from reviewed195 pin; do not export')
OUT.mkdir()
env=os.environ.copy();env.update({'REFERENCE':'6','SCENE_EXPORT':str(OUT),'EXPORT_PORT':'4636'})
log=HERE/'cycles-195-r01-export.log'
started=time.time();reason=None;peak=0;proc=None
with log.open('w')as stream:
 proc=subprocess.Popen(['node','tools/export-reconstructed-scene.mjs'],cwd=ROOT,env=env,stdout=stream,stderr=subprocess.STDOUT,start_new_session=True)
 while proc.poll() is None:
  size=sum(p.stat().st_size for p in OUT.rglob('*')if p.is_file());peak=max(peak,size);free=shutil.disk_usage(ROOT).free
  if size>MAX_EXPORT_BYTES or free<MIN_FREE_BYTES:
   reason='Temporary export disk bound exceeded';os.killpg(proc.pid,signal.SIGTERM)
   try:proc.wait(timeout=15)
   except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait()
   break
  time.sleep(2)
 code=proc.wait()
receipt={'expectedSceneHash':expected,'officialExporter':'tools/export-reconstructed-scene.mjs','officialExporterSha256':hashlib.sha256((ROOT/'tools/export-reconstructed-scene.mjs').read_bytes()).hexdigest(),'maxTemporaryExportBytes':MAX_EXPORT_BYTES,'minimumFreeBytes':MIN_FREE_BYTES,'peakObservedLogicalBytes':peak,'exitCode':code,'failure':reason,'elapsedSeconds':time.time()-started,'noLiveSourceMutations':True,'status':'export-failed' if code or reason else 'hash-audit'}
try:
 if code or reason:raise RuntimeError(reason or 'Official export exited nonzero')
 report=json.loads((OUT/'export-report.json').read_text())
 assert report['status']=='exported-existing-geometry' and report['sourceHash']==expected and not report['errors']
 first={};duplicates=0;saved=0;physical=0
 for name,record in report['exportedAssets'].items():
  p=OUT/'assets'/name
  assert p.is_file() and p.stat().st_size==record['bytes']
  digest=hashlib.sha256(p.read_bytes()).hexdigest();assert digest==record['sha256']
  if digest in first:
   original=first[digest];p.unlink();os.link(original,p);duplicates+=1;saved+=record['bytes']
  else:first[digest]=p;physical+=record['bytes']
 for p in first.values():p.chmod(0o444)
 receipt.update({'status':'official-export-verified-and-duplicate-bytes-linked','sourceHash':report['sourceHash'],'statistics':report['statistics'],'sourceGeometryChanged':False,'duplicateFilesReplacedByLinks':duplicates,'duplicateBytesSaved':saved,'uniqueAssetBytes':physical,'logicalExportBytes':sum(x['bytes']for x in report['exportedAssets'].values()),'allExportedBytesHashVerified':True,'freeBytesAfterDedup':shutil.disk_usage(ROOT).free})
except Exception as exc:
 receipt['failure']=str(exc);receipt['status']='export-failed';raise
finally:
 (HERE/'cycles-195-r01-export-disk-proof.json').write_text(json.dumps(receipt,indent=2)+'\n')
 print(json.dumps(receipt,indent=2),flush=True)
