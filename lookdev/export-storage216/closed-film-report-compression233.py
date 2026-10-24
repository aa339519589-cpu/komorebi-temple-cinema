"""Transparent compression of explicitly retained, closed historical receipts.

No JSON fields, original bytes, source, image or movie are removed or rewritten.
The original names, permissions and modification times remain unchanged.
"""
from pathlib import Path
import datetime, hashlib, json, os, shutil, stat, subprocess

root=Path('/Users/mima1234/temple-cinema-live-sync')
out=root/'lookdev/export-storage216/closed-film-report-compression233'
out.mkdir(exist_ok=False)
files=[root/('lookdev/film-f-20261022/retained-completed-clips/scene-%02d/report.json'%i) for i in range(1,9)]
def sha(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
dirty=set(subprocess.check_output(['git','diff','--name-only','HEAD'],cwd=root,text=True).splitlines())
proof={'status':'running','freeBefore':shutil.disk_usage(root).free,'preservesRawReportBytes':True,'photographicProgress':False,'files':[]}
for p in files:
 if not p.is_file() or p.is_symlink() or str(p.relative_to(root))in dirty:continue
 s=p.stat()
 if s.st_nlink!=1 or s.st_size<131072 or getattr(s,'st_flags',0)&0x20:continue
 if shutil.disk_usage(root).free<256*1048576+2*s.st_size:continue
 report=json.loads(p.read_text())
 if report.get('status')not in ['motion-review-rendered','rendered-review']:continue
 opened=subprocess.run(['/usr/sbin/lsof','-Fn','--',str(p)],capture_output=True,text=True)
 if opened.returncode!=1 or opened.stdout or opened.stderr:continue
 before=sha(p);identity=(s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns)
 tmp=p.with_name('report.json.compressed233');assert not tmp.exists()
 subprocess.run(['ditto','--hfsCompression','--noclone',str(p),str(tmp)],check=True,env={**os.environ,'DITTOABORT':'1'})
 t=tmp.stat();now=p.stat()
 assert sha(tmp)==before and t.st_size==s.st_size
 assert identity==(now.st_dev,now.st_ino,now.st_size,now.st_mtime_ns) and sha(p)==before
 assert stat.S_IMODE(t.st_mode)==stat.S_IMODE(s.st_mode) and t.st_mtime_ns==s.st_mtime_ns
 record={'path':str(p.relative_to(root)),'sha256':before,'rawBytes':s.st_size,'oldAllocatedBytes':s.st_blocks*512,'newAllocatedBytes':t.st_blocks*512,'compressedFlag':bool(getattr(t,'st_flags',0)&0x20)}
 if record['compressedFlag'] and t.st_blocks<s.st_blocks:
  os.replace(tmp,p);assert sha(p)==before
  record['status']='same-path-raw-bytes-mode-and-mtime-verified'
 else:tmp.unlink();record['status']='not-beneficial-original-retained'
 proof['files'].append(record)
 (out/'proof.json').write_text(json.dumps(proof,indent=2)+'\n')
proof.update(status='complete',freeAfter=shutil.disk_usage(root).free,completedUtc=datetime.datetime.now(datetime.timezone.utc).isoformat())
(out/'proof.json').write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps(proof))
