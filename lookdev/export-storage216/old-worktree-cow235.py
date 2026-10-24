"""Replace only byte-identical inactive asset copies with independent APFS clones.

Every original path and raw byte remains; no hardlinks, history pruning, asset
deletion, image encoding, or changes to active source trees are permitted.
"""
from pathlib import Path
import ctypes,datetime,hashlib,json,os,shutil,stat,subprocess
root=Path('/Users/mima1234/temple-cinema-live-sync')
out=root/'lookdev/export-storage216/old-worktree-cow235'
rows=json.loads((out/'candidates.json').read_text())
proof={'status':'running','freeBefore':shutil.disk_usage(root).free,'method':'Independent exact-byte native clonefile(2), no mutable hardlinks','files':[]}
lib=ctypes.CDLL(None,use_errno=True);clone=lib.clonefile
clone.argtypes=[ctypes.c_char_p,ctypes.c_char_p,ctypes.c_uint];clone.restype=ctypes.c_int
def sha(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def signature(s):return(s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns)
def xattrs(p):return subprocess.check_output(['/usr/bin/xattr','-lx',str(p)])
def save():(out/'proof.json').write_text(json.dumps(proof,indent=2)+'\n')
cache={}
save()
for row in sorted(rows,key=lambda x:x['bytes'],reverse=True):
 src,dst=Path(row['source']),Path(row['destination'])
 if src.suffix in ['.blend','.blend1'] or dst.parts[3] in ['temple-cinema','temple-cinema-live-sync'] or 'temple-cinema-film' in dst.parts[3]:continue
 if not os.access(dst.parent,os.W_OK):continue
 if not str(src).startswith(str(root/'assets')+'/'):continue
 if src.is_symlink()or dst.is_symlink():continue
 s,d=src.stat(),dst.stat()
 if d.st_nlink!=1 or not stat.S_ISREG(d.st_mode)or(s.st_dev,s.st_ino)==(d.st_dev,d.st_ino)or s.st_size!=d.st_size:continue
 if getattr(d,'st_flags',0)&~0x20 or s.st_uid!=d.st_uid or s.st_gid!=d.st_gid:continue
 original_attrs=xattrs(dst)
 if xattrs(src)!=original_attrs:continue
 opened=subprocess.run(['/usr/sbin/lsof','-Fn','--',str(src),str(dst)],capture_output=True,text=True)
 if opened.returncode!=1 or opened.stdout or opened.stderr:continue
 key=(str(src),signature(s));expected=cache.get(key)
 if expected is None:expected=sha(src);cache[key]=expected
 if sha(dst)!=expected:continue
 tmp=dst.with_name(dst.name+'.cow235');assert not tmp.exists()
 assert signature(src.stat())==signature(s)
 result=clone(os.fsencode(src),os.fsencode(tmp),0)
 if result:raise OSError(ctypes.get_errno(),os.strerror(ctypes.get_errno()),str(tmp))
 assert sha(tmp)==expected and tmp.stat().st_ino not in [s.st_ino,d.st_ino]
 os.chmod(tmp,stat.S_IMODE(d.st_mode));os.utime(tmp,ns=(d.st_atime_ns,d.st_mtime_ns))
 assert signature(dst.stat())==signature(d) and sha(dst)==expected and xattrs(tmp)==original_attrs
 assert signature(src.stat())==signature(s)
 os.replace(tmp,dst)
 a=dst.stat();assert sha(dst)==expected and a.st_size==d.st_size and a.st_mtime_ns==d.st_mtime_ns and stat.S_IMODE(a.st_mode)==stat.S_IMODE(d.st_mode)
 assert a.st_ino!=s.st_ino and a.st_nlink==1
 record={'source':str(src),'destination':str(dst),'sha256':expected,'bytes':a.st_size,'previousDestinationInode':d.st_ino,'newIndependentDestinationInode':a.st_ino,'sourceInode':s.st_ino,'originalMode':stat.S_IMODE(d.st_mode),'originalMtimeNs':d.st_mtime_ns,'originalXattrsRetained':True,'rawBytesRetained':True,'freeAfter':shutil.disk_usage(root).free}
 proof['files'].append(record)
 if len(proof['files'])%10==0:save();print(json.dumps({'processed':len(proof['files']),'free':record['freeAfter']}),flush=True)
 if record['freeAfter']>=int(1.5*1024**3):break
proof.update(status='complete',freeAfter=shutil.disk_usage(root).free,completedUtc=datetime.datetime.now(datetime.timezone.utc).isoformat())
save();print(json.dumps({'status':proof['status'],'processed':len(proof['files']),'freeBefore':proof['freeBefore'],'freeAfter':proof['freeAfter']}),flush=True)
