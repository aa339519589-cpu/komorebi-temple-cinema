"""Transparent APFS compression of closed native-render report JSON only.

Every original path, uncompressed byte and timestamp remains. No source, image,
video, user-dirty report or active/nonterminal report is changed or removed.
"""
from pathlib import Path
import datetime,hashlib,json,os,shutil,stat,subprocess,time

ROOT=Path('/Users/mima1234/temple-cinema-live-sync')
OUT=ROOT/'lookdev/export-storage216/native-report-compression302'
OUT.mkdir(exist_ok=False)
FLOOR=256*1048576

def sha(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()

def atomic(path,data):
 tmp=path.with_name(path.name+'.tmp')
 with tmp.open('w')as f:json.dump(data,f,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
 os.replace(tmp,path)

dirty=subprocess.check_output(['git','diff','--name-only','HEAD'],cwd=ROOT,text=True).splitlines()
protected={str((ROOT/p).resolve())for p in dirty}
files=subprocess.check_output(['rg','--files','--no-ignore','qa/ten-reference','lookdev','-g','report.json'],cwd=ROOT,text=True).splitlines()
candidates=[]
for name in files:
 if '/qa/ten-reference/'not in'/'+name:continue
 p=ROOT/name
 if p.is_symlink()or str(p.resolve())in protected:continue
 s=p.stat()
 if s.st_size<131072 or s.st_size>128*1048576 or s.st_nlink!=1 or getattr(s,'st_flags',0)&0x20 or time.time()-s.st_mtime<900:continue
 candidates.append((s.st_size,p))
summary={'status':'running','startedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'freeBefore':shutil.disk_usage(ROOT).free,'candidates':len(candidates),'processed':0,'promoted':0,'allocatedBytesReduced':0,'sourceImagesVideosAndRawReportBytesRetained':True,'changesPhotographicFidelity':False}
atomic(OUT/'summary.json',summary)
try:
 for size,p in sorted(candidates,reverse=True):
  if shutil.disk_usage(ROOT).free<FLOOR+2*size:continue
  before=p.stat();identity=(before.st_dev,before.st_ino,before.st_size,before.st_mtime_ns)
  if before.st_nlink!=1:continue
  record=json.loads(p.read_text())
  if record.get('status')not in('rendered-review','motion-review-rendered','failed','motion-review-failed'):continue
  opened=subprocess.run(['/usr/sbin/lsof','-Fn','--',str(p)],capture_output=True,text=True)
  if opened.returncode!=1 or opened.stdout or opened.stderr:continue
  expected=sha(p);tmp=p.with_name(p.name+'.compressed302');assert not tmp.exists()
  subprocess.run(['ditto','--hfsCompression','--noclone',str(p),str(tmp)],check=True,env={**os.environ,'DITTOABORT':'1'},stdout=subprocess.DEVNULL)
  after=tmp.stat();assert after.st_size==before.st_size and sha(tmp)==expected
  current=p.stat();assert(current.st_dev,current.st_ino,current.st_size,current.st_mtime_ns)==identity and sha(p)==expected
  old_alloc=before.st_blocks*512;new_alloc=after.st_blocks*512
  proof={'path':str(p.relative_to(ROOT)),'sha256':expected,'bytes':before.st_size,'oldAllocatedBytes':old_alloc,'newAllocatedBytes':new_alloc,'oldMode':stat.S_IMODE(before.st_mode),'oldMtimeNs':before.st_mtime_ns,'allRawBytesVerified':True,'compressedFlag':bool(getattr(after,'st_flags',0)&0x20),'status':'verified-before-promotion'}
  receipt=OUT/('report-%04d.json'%summary['processed']);atomic(receipt,proof)
  if proof['compressedFlag']and new_alloc<old_alloc*.9:
   assert after.st_mtime_ns==before.st_mtime_ns and stat.S_IMODE(after.st_mode)==stat.S_IMODE(before.st_mode)
   os.replace(tmp,p);assert sha(p)==expected and p.stat().st_size==before.st_size
   proof['status']='same-path-and-raw-bytes-retained-transparent-apfs-compression'
   summary['promoted']+=1;summary['allocatedBytesReduced']+=old_alloc-new_alloc
  else:
   tmp.unlink();proof['status']='not-beneficial-original-retained'
  summary['processed']+=1;proof['freeAfter']=shutil.disk_usage(ROOT).free;atomic(receipt,proof)
  if summary['processed']%25==0:summary['freeAfter']=shutil.disk_usage(ROOT).free;atomic(OUT/'summary.json',summary);print(json.dumps({k:summary[k]for k in('processed','promoted','allocatedBytesReduced','freeAfter')}),flush=True)
  if shutil.disk_usage(ROOT).free>=int(3.0*1024**3):break
 summary['status']='complete'
except BaseException as error:
 summary['status']='stopped-current-original-retained';summary['error']=str(error);raise
finally:
 summary['freeAfter']=shutil.disk_usage(ROOT).free;atomic(OUT/'summary.json',summary)
print(json.dumps(summary),flush=True)
