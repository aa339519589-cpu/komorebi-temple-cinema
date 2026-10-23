"""Preserve every old compiled-cache filename and byte while sharing duplicates.
No canonical input, original asset, unique payload or actual render is deleted.
All old export packages must have no open handles; all present payloads are
checked against the original exporter SHA256 and size before being linked.
"""
from pathlib import Path
import json,hashlib,os,subprocess,shutil,datetime,re
ROOT=Path('/Users/mima1234/temple-cinema-live-sync')
OUT=ROOT/'lookdev/export-storage216/all-closed-cache-dedup';OUT.mkdir(exist_ok=False)
reports=[];live=set();items=[];hashed={};leaders={};count=0;saved=0
for path in ROOT.glob('lookdev/**/export-report.json'):
 r=json.loads(path.read_text())
 if r.get('status')!='exported-existing-geometry':continue
 handles=subprocess.run(['lsof','+D',str(path.parent)],capture_output=True,text=True)
 assert handles.returncode==1 and not handles.stdout.strip(),str(path)
 for name in r.get('source',{}).get('files',{}):
  p=ROOT/name
  if p.exists():s=p.stat();live.add((s.st_dev,s.st_ino))
 reports.append({'path':str(path.relative_to(ROOT)),'sourceHash':r['sourceHash']})
 for name,record in r['exportedAssets'].items():
  if not re.fullmatch(r'(geometry-.*\.bin|instances-.*\.bin|instance-colors-.*\.bin|texture-.*\.png)',name):continue
  p=path.parent/'assets'/name
  if p.exists():items.append((p,record))
def digest(p,stat):
 key=(stat.st_dev,stat.st_ino,stat.st_size,stat.st_mtime_ns)
 if key not in hashed:
  h=hashlib.sha256()
  with p.open('rb')as f:
   for b in iter(lambda:f.read(1048576),b''):h.update(b)
  hashed[key]=h.hexdigest()
 return hashed[key]
startFree=shutil.disk_usage(ROOT).free
with (OUT/'verified-link-journal.jsonl').open('x')as journal:
 for p,r in sorted(items,key=lambda item:-item[1]['bytes']):
  assert p.is_file()and not p.is_symlink();s=p.stat();assert(s.st_dev,s.st_ino)not in live
  assert s.st_size==r['bytes']and digest(p,s)==r['sha256'],str(p)
  key=(r['bytes'],r['sha256']);leader=leaders.setdefault(key,p)
  if p.stat().st_ino==leader.stat().st_ino:continue
  assert digest(leader,leader.stat())==r['sha256']
  record={'path':str(p.relative_to(ROOT)),'leader':str(leader.relative_to(ROOT)),**r}
  journal.write(json.dumps(record,separators=(',',':'))+'\n');journal.flush()
  if s.st_nlink==1:saved+=s.st_size
  temporary=p.with_name(p.name+'.verified-dedup216');assert not temporary.exists()
  os.link(leader,temporary);os.replace(temporary,p);assert p.stat().st_ino==leader.stat().st_ino
  count+=1
summary={'status':'closed-derived-cache-identical-bytes-linked-all-paths-retained','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reports':reports,'presentFilesVerified':len(items),'linkedDuplicatePaths':count,'duplicateBytesWhoseOldInodeHadOneLink':saved,'physicalReclamationNotEqualToLogicalBytesUnderApfsClones':True,'freeBefore':startFree,'freeAfter':shutil.disk_usage(ROOT).free,'originalOrUniqueAssetsDeleted':False,'journal':'verified-link-journal.jsonl'}
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({'verifiedFiles':len(items),'newLinks':count,'logicalSingleLinkMiB':saved/2**20,'freeGiB':summary['freeAfter']/2**30}),flush=True)
