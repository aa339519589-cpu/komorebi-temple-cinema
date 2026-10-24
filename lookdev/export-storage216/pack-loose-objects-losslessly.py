"""Bounded normal Git packing: retain every object, ref and worktree byte.
Only prune-packed is used, after all new pack indexes/content verify and every
requested object is present. No history rewrite, expiration or object pruning.
"""
from pathlib import Path
import json,subprocess,shutil,time,datetime
ROOT=Path('/Users/mima1234/temple-cinema-live-sync')
OUT=ROOT/'lookdev/export-storage216/lossless-git-packing';OUT.mkdir(exist_ok=False)
common=Path(subprocess.check_output(['git','rev-parse','--git-common-dir'],cwd=ROOT,text=True).strip()).resolve()
data=json.loads((OUT.parent/'loose-lossless-pack-candidates.json').read_text())
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
# Similar large authored meshes share most indexed geometry; keep them in the
# same bounded batch. PNG/JPEG payloads above1MiB are deliberately not selected.
data.sort(key=lambda r:(0 if Path(r[4]).suffix=='.bin'else 1,-r[2]))
batches=[];batch=[];stored=0;raw=0
for r in data:
 p=common/'objects'/r[0][:2]/r[0][2:]
 if not p.is_file():continue
 if batch and(stored+r[3]>192*1048576 or raw+r[2]>384*1048576):batches.append(batch);batch=[];stored=0;raw=0
 batch.append(r);stored+=r[3];raw+=r[2]
if batch:batches.append(batch)
results=[]
for index,batch in enumerate(batches):
 if shutil.disk_usage(ROOT).free<384*1048576:break
 rows=[r for r in batch if(common/'objects'/r[0][:2]/r[0][2:]).is_file()]
 if not rows:continue
 before=shutil.disk_usage(ROOT).free;started=time.time();objects='\n'.join(r[0]+(' '+r[4]if r[4]else'')for r in rows)+'\n'
 hashes=subprocess.check_output(['git','pack-objects','--threads=2','--window=32','--window-memory=128m','--depth=20','--delta-base-offset','--max-pack-size=64m',str(common/'objects/pack/pack')],cwd=ROOT,input=objects.encode()).decode().splitlines()
 actual=set();packBytes=0
 for h in hashes:
  assert len(h)==40 and all(c in'0123456789abcdef'for c in h)
  idx=common/'objects/pack'/('pack-'+h+'.idx');pack=idx.with_suffix('.pack')
  proof=subprocess.check_output(['git','verify-pack','-v',str(idx)],cwd=ROOT,text=True)
  for line in proof.splitlines():
   words=line.split()
   if words and len(words[0])==40 and words[1]in['blob','tree','commit','tag']:actual.add(words[0])
  packBytes+=pack.stat().st_size+idx.stat().st_size
 assert all(r[0]in actual for r in rows),'Never remove a loose object without a verified packed copy'
 record={'batch':index,'status':'all-requested-objects-verified-in-new-packs-before-prune-packed','packs':hashes,'objects':[{'oid':r[0],'type':r[1],'rawBytes':r[2],'previousLooseBytes':r[3],'path':r[4]}for r in rows],'newPackBytes':packBytes,'freeBefore':before}
 dst=OUT/('batch-'+str(index)+'.json');dst.write_text(json.dumps(record,indent=2)+'\n')
 subprocess.run(['git','prune-packed'],cwd=ROOT,check=True)
 record.update(status='redundant-loose-copies-removed-all-objects-retained-in-verified-packs',freeAfter=shutil.disk_usage(ROOT).free,elapsedSeconds=time.time()-started);dst.write_text(json.dumps(record,indent=2)+'\n');results.append(record)
 print(json.dumps({'batch':index,'objects':len(rows),'priorLooseMiB':sum(r[3]for r in rows)/2**20,'newPackMiB':packBytes/2**20,'freeGiB':record['freeAfter']/2**30}),flush=True)
subprocess.run(['git','fsck','--connectivity-only','--no-progress'],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()==head
(OUT/'summary.json').write_text(json.dumps({'status':'verified-lossless-packing-complete','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'headUnchanged':head,'allObjectsKept':True,'noHistoryRewriteOrExpiration':True,'batches':len(results),'freeAfter':shutil.disk_usage(ROOT).free},indent=2)+'\n')
