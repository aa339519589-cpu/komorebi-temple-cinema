"""Read-only proof of exact binary delta storage; no original Blend removed."""
from pathlib import Path
import subprocess,hashlib,json,os,shutil,time
ROOT=Path('/Users/mima1234/temple-cinema-live-sync')
HERE=ROOT/'lookdev/export-storage216/diagnostic-blend-deltas';HERE.mkdir(exist_ok=False)
BASE=ROOT/'lookdev/scene01-cycles-current-20261021/cycles/scene01-cycles-final-960px.blend'
TARGET=BASE.with_name('scene01-cycles-linked-pass10.blend')
def sha(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
baseline=HERE/'immutable-reference.blend';subprocess.run(['cp','-c','-p',str(BASE),str(baseline)],check=True)
assert sha(baseline)==sha(BASE);os.chmod(baseline,0o444)
delta=HERE/'linked-pass10.blend.delta.zst';started=time.time()
with (HERE/'zstd.log').open('w')as log:
 proc=subprocess.Popen(['zstd','--patch-from='+str(baseline),'--long=27','-10','-T2',str(TARGET),'-o',str(delta)],stdout=log,stderr=log)
 while proc.poll()is None:
  if shutil.disk_usage(ROOT).free<256*1048576:
   proc.terminate();proc.wait();raise RuntimeError('Delta creation stopped at storage floor; originals untouched')
  time.sleep(.5)
 assert proc.wait()==0
h=hashlib.sha256();length=0
with (HERE/'decode.log').open('w')as log:
 proc=subprocess.Popen(['zstd','-d','--patch-from='+str(baseline),'--stdout',str(delta)],stdout=subprocess.PIPE,stderr=log)
 for b in iter(lambda:proc.stdout.read(1048576),b''):h.update(b);length+=len(b)
 assert proc.wait()==0
assert h.hexdigest()==sha(TARGET)and length==TARGET.stat().st_size
r={'status':'exact-original-byte-reconstruction-verified-no-original-deletion','base':str(BASE.relative_to(ROOT)),'immutableReference':str(baseline.relative_to(ROOT)),'baseSha256':sha(BASE),'target':str(TARGET.relative_to(ROOT)),'targetSha256':h.hexdigest(),'rawBytes':length,'deltaBytes':delta.stat().st_size,'elapsedSeconds':time.time()-started,'allOriginalAndSelectedBlendsStillPresent':True,'freeAfter':shutil.disk_usage(ROOT).free}
(HERE/'pilot-proof.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r),flush=True)
