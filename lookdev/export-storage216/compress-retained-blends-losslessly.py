"""Keep every selected historical Blend and exact byte using APFS compression.
No Blender save/re-render/conversion occurs; the normal filesystem read remains
the identical original .blend. Only verified no-reader single-inode old files
are replaced by their exact transparently compressed copy.
"""
from pathlib import Path
import subprocess,hashlib,os,json,shutil,time,datetime
ROOT=Path('/Users/mima1234/temple-cinema-live-sync')
BASE=ROOT/'lookdev/scene01-cycles-current-20261021/cycles'
OUT=ROOT/'lookdev/export-storage216/retained-blend-storage';OUT.mkdir(exist_ok=False)
def sha(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
results=[]
for src in sorted(BASE.rglob('*.blend')):
 assert src.is_file()and not src.is_symlink();before=src.stat()
 if before.st_nlink!=1 or getattr(before,'st_flags',0)&0x20:continue
 if shutil.disk_usage(ROOT).free<max(512*1048576,before.st_size*2+256*1048576):break
 handles=subprocess.run(['lsof',str(src)],capture_output=True,text=True)
 assert handles.returncode==1 and not handles.stdout.strip(),'Historical Blend is open'
 digest=sha(src);temp=src.with_name(src.name+'.apfs-storage216');assert not temp.exists()
 with (OUT/'ditto.log').open('a')as log:
  proc=subprocess.Popen(['ditto','--hfsCompression','--noclone',str(src),str(temp)],env={**os.environ,'DITTOABORT':'1'},stdout=log,stderr=log)
  stopped=False
  while proc.poll()is None:
   if shutil.disk_usage(ROOT).free<256*1048576:
    proc.terminate();proc.wait();stopped=True;break
   time.sleep(.5)
  code=proc.wait()
 if code or stopped:
  if temp.exists():temp.unlink() # only the owned incomplete temporary copy
  results.append({'path':str(src.relative_to(ROOT)),'status':'copy-not-promoted-original-retained','exitCode':code,'emergencyFloor':stopped});break
 assert sha(temp)==digest and temp.stat().st_size==before.st_size
 assert src.stat().st_ino==before.st_ino and src.stat().st_mtime_ns==before.st_mtime_ns
 after=temp.stat();record={'path':str(src.relative_to(ROOT)),'sha256':digest,'logicalBytes':before.st_size,'oldAllocatedBytes':before.st_blocks*512,'newAllocatedBytes':after.st_blocks*512,'compressedFlag':bool(getattr(after,'st_flags',0)&0x20),'uncompressedBytesIdentical':True,'oldMode':before.st_mode,'newMode':after.st_mode,'oldMtimeNs':before.st_mtime_ns,'newMtimeNs':after.st_mtime_ns}
 if not record['compressedFlag']or after.st_blocks>=before.st_blocks:
  temp.unlink();record['status']='not-beneficial-original-retained'
 else:
  (OUT/('project-'+str(len(results))+'.json')).write_text(json.dumps({**record,'status':'verified-before-storage-only-replacement'},indent=2)+'\n')
  os.replace(temp,src);assert sha(src)==digest
  record.update(status='selected-blend-retained-byte-exact-with-transparent-storage-compression',freeAfter=shutil.disk_usage(ROOT).free)
 results.append(record);(OUT/('project-'+str(len(results)-1)+'.json')).write_text(json.dumps(record,indent=2)+'\n')
 print(json.dumps({'path':record['path'],'status':record['status'],'savedAllocatedMiB':(record['oldAllocatedBytes']-record['newAllocatedBytes'])/2**20,'freeGiB':shutil.disk_usage(ROOT).free/2**30}),flush=True)
(OUT/'summary.json').write_text(json.dumps({'status':'complete','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'everySelectedBlendRetained':True,'allPromotedBytesHashEqual':True,'projects':results,'freeAfter':shutil.disk_usage(ROOT).free},indent=2)+'\n')
