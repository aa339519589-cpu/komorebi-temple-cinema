"""Transparent APFS compression of exact old exported binary-buffer groups.
Every filename and uncompressed byte remains, all aliases keep one inode.
Never touches original/canonical source, PNGs, selected Blends or live exports.
"""
from pathlib import Path
import os,json,hashlib,subprocess,shutil,datetime
ROOT=Path('/Users/mima1234/temple-cinema-live-sync')
tag=os.environ.get('COMPRESSION_PASS','pilot');assert tag.replace('-','').isalnum()
OUT=ROOT/('lookdev/export-storage216/apfs-cache-compression-'+tag);OUT.mkdir(exist_ok=False)
groups={};live=set();reports=[]
def sha(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
for path in ROOT.glob('lookdev/**/export-report.json'):
 r=json.loads(path.read_text())
 if r.get('status')!='exported-existing-geometry':continue
 for name in r['source']['files']:
  p=ROOT/name
  if p.exists():s=p.stat();live.add((s.st_dev,s.st_ino))
 reports.append(path.parent)
 for name,record in r['exportedAssets'].items():
  if not name.endswith('.bin')or not name.startswith(('geometry-','instances-','instance-colors-')):continue
  p=path.parent/'assets'/name
  if not p.exists():continue
  s=p.stat()
  if s.st_size<int(os.environ.get('MIN_COMPRESSION_BYTES','1048576')) or s.st_size>256*1048576:continue
  group=groups.setdefault((s.st_dev,s.st_ino),{'paths':[],'bytes':s.st_size,'sha256':record['sha256']})
  assert s.st_size==record['bytes']and record['sha256']==group['sha256']
  group['paths'].append(p)
results=[];checked=set();maxGroups=int(os.environ.get('MAX_COMPRESSION_GROUPS','1'))
for key,g in sorted(groups.items(),key=lambda item:-item[1]['bytes']):
 assert key not in live,'Refuse a live-source inode'
 paths=list(dict.fromkeys(g['paths']));first=paths[0];old=first.stat()
 if old.st_nlink!=len(paths):continue # external alias exists; do not touch
 if getattr(old,'st_flags',0)&0x20:continue # already transparently compressed
 for p in paths:
  assert not p.is_symlink()and(p.stat().st_dev,p.stat().st_ino)==key
  folder=p.parent.parent
  if folder not in checked:
   handles=subprocess.run(['lsof','+D',str(folder)],capture_output=True,text=True)
   assert handles.returncode==1 and not handles.stdout.strip();checked.add(folder)
 assert sha(first)==g['sha256']
 if shutil.disk_usage(ROOT).free<max(384*1048576,g['bytes']*2):break
 temporary=first.with_name(first.name+'.compressed216');assert not temporary.exists()
 beforeFree=shutil.disk_usage(ROOT).free
 subprocess.run(['ditto','--hfsCompression','--noclone',str(first),str(temporary)],check=True,env={**os.environ,'DITTOABORT':'1'},stdout=subprocess.DEVNULL)
 assert temporary.stat().st_size==g['bytes']and sha(temporary)==g['sha256']
 compressed=temporary.stat();oldBlocks=old.st_blocks*512;newBlocks=compressed.st_blocks*512
 rec={'paths':[str(p.relative_to(ROOT))for p in paths],'bytes':g['bytes'],'sha256':g['sha256'],'oldAllocatedBlocksBytes':oldBlocks,'newAllocatedBlocksBytes':newBlocks,'compressedFlag':bool(getattr(compressed,'st_flags',0)&0x20),'allRawBytesVerified':True,'freeBefore':beforeFree}
 if not rec['compressedFlag']or newBlocks>=oldBlocks*.95:
  temporary.unlink();rec['status']='compression-not-beneficial-original-group-retained';results.append(rec)
 else:
  receipt=OUT/('group-'+str(len(results))+'.json');receipt.write_text(json.dumps({**rec,'status':'verified-before-alias-remap'},indent=2)+'\n')
  for p in paths:
   assert(p.stat().st_dev,p.stat().st_ino)==key
   alias=p.with_name(p.name+'.compressed-link216');assert not alias.exists();os.link(temporary,alias);os.replace(alias,p)
  temporary.unlink();assert sha(first)==g['sha256']
  assert all(p.stat().st_ino==first.stat().st_ino for p in paths)
  rec.update(status='all-paths-and-raw-bytes-retained-transparent-apfs-compression',freeAfter=shutil.disk_usage(ROOT).free);receipt.write_text(json.dumps(rec,indent=2)+'\n');results.append(rec)
 if len(results)>=maxGroups:break
summary={'status':'complete','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'groups':results,'originalSourceOrActualRenderChanged':False,'rawBytesAndAllAliasesRetained':True,'freeAfter':shutil.disk_usage(ROOT).free}
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({'groups':len(results),'results':[{'status':r['status'],'rawMiB':r['bytes']/2**20,'oldBlocksMiB':r['oldAllocatedBlocksBytes']/2**20,'newBlocksMiB':r['newAllocatedBlocksBytes']/2**20}for r in results],'freeGiB':summary['freeAfter']/2**30}),flush=True)
