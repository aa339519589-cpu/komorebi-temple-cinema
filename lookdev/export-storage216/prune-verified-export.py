from pathlib import Path
import json,hashlib,subprocess,re,datetime,shutil
ROOT=Path('/Users/mima1234/temple-cinema-live-sync')
BASE=ROOT/'lookdev/scene07-physical155/export'
OUT=ROOT/'lookdev/export-storage216/scene07-physical155';OUT.mkdir(exist_ok=False)
r=json.loads((BASE/'export-report.json').read_text());assert r['sourceHash']=='f3638c92c8f80d8cee8e40f346d179b4ce24e0211a44b1619ec8c2076ac03281'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
inputs=[]
for n,want in r['source']['files'].items():
 p=ROOT/n
 if p.exists()and sha(p)==want:inputs.append({'path':n,'sha256':want,'retained':'canonical exact bytes'});continue
 b=subprocess.check_output(['git','show',r['sourceCommit']+':'+n],cwd=ROOT);assert hashlib.sha256(b).hexdigest()==want,n
 if Path(n).suffix in ['.js','.mjs','.json','.html','.md','.txt','.py']:
  dst=OUT/'rebuild-source'/n;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(b);where=str(dst.relative_to(ROOT))
 else:where='git:'+r['sourceCommit']+':'+n
 inputs.append({'path':n,'sha256':want,'retained':where})
for n in ['tools/export-reconstructed-scene.mjs','tools/reconstruction-source-identity.mjs','tools/gpu-render-slot.mjs']:
 q=subprocess.run(['git','show',r['sourceCommit']+':'+n],cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
 if q.returncode==0:
  dst=OUT/'rebuild-source'/n;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(q.stdout)
items=[];inodes=set();unique=0
for n,rec in r['exportedAssets'].items():
 if not re.fullmatch(r'(geometry-.*\.bin|instances-.*\.bin|instance-colors-.*\.bin|texture-.*\.png)',n):continue
 p=BASE/'assets'/n
 if not p.exists():continue
 assert p.is_file()and not p.is_symlink();s=p.stat();assert s.st_size==rec['bytes']and sha(p)==rec['sha256'],n
 if(s.st_dev,s.st_ino)not in inodes:unique+=s.st_size;inodes.add((s.st_dev,s.st_ino))
 items.append({'path':'assets/'+n,**rec})
handles=subprocess.run(['lsof','+D',str(BASE)],capture_output=True,text=True);assert handles.returncode==1 and not handles.stdout.strip(),handles.stdout
proof={'status':'source-and-cache-bytes-verified-before-pruning','sourceHash':r['sourceHash'],'sourceCommit':r['sourceCommit'],'inputs':inputs,'derivedFiles':items,'uniqueBytes':unique,'retained':['all original assets and exact source versions','all actual rendered images and selected Blend projects','scene.json','export-report.json','source-frame.png and source-frame.rgba if present'],'regeneration':'Materialize rebuild-source overrides plus each exact retained input; run preserved official exporter through current shared FIFO. Never substitute current214 source. Physical155 recipes and outputs remain untouched.','date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'freeBefore':shutil.disk_usage(ROOT).free}
receipt=OUT/'verified-pruning-receipt.json';receipt.write_text(json.dumps(proof,indent=2)+'\n')
for rec in items:(BASE/rec['path']).unlink()
proof.update(status='only-verified-regenerable-derived-buffers-pruned',freeAfter=shutil.disk_usage(ROOT).free);receipt.write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps({'removedDerivedPaths':len(items),'uniqueMiB':unique/2**20,'sourceInputsVerified':len(inputs),'freeGiB':shutil.disk_usage(ROOT).free/2**30}))
