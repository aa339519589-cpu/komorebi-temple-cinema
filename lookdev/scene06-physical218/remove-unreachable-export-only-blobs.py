"""Undo storage from accidentally staged, then unstaged generated export blobs.
Never run general git prune/gc. Only NEW loose, unreachable blobs whose exact
bytes match the already-pruned/replayable217 export are eligible. All refs,
reflogs and every linked worktree index are protected and checked for changes.
"""
from pathlib import Path
import subprocess,hashlib,json,datetime,shutil
ROOT=Path('/Users/mima1234/temple-cinema-live-sync');HERE=Path(__file__).resolve().parent
def git(*args,where=ROOT):return subprocess.check_output(['git',*args],cwd=where)
common=Path(git('rev-parse','--git-common-dir').decode().strip()).resolve()
report=json.loads((HERE/'export217-r01/export-report.json').read_text())
assert report['sourceHash']=='7514b2fddc215ebae8c48dbf0f7f7d41fa23e8b5c3b514f3df72dfacffbe6b62'
assert json.loads((HERE/'verified-completed-export-pruning.json').read_text())['status']=='only-completed-study-regenerable-cache-pruned'
known={(r['bytes'],r['sha256'])for n,r in report['exportedAssets'].items()if n.startswith(('geometry-','instances-','instance-colors-','texture-'))}
sizes={size for size,digest in known};threshold=(HERE/'root-actual-review218-r01.json').stat().st_mtime-5
worktrees=[Path(line[9:])for line in git('worktree','list','--porcelain').decode().splitlines()if line.startswith('worktree ')]
def fingerprint():
 h=hashlib.sha256();protected=set()
 for payload in [git('show-ref','--head'),git('reflog','--all','--format=%H')]:h.update(payload)
 for tree in worktrees:
  payload=git('ls-files','--stage','-z',where=tree);h.update(str(tree).encode()+b'\0'+payload)
  protected.update(item.split(b' ',2)[1].decode()for item in payload.split(b'\0')if item)
  index=Path(git('rev-parse','--git-path','index',where=tree).decode().strip())
  if not index.is_absolute():index=tree/index
  assert not index.with_name(index.name+'.lock').exists(),'An index writer is active'
 return h.hexdigest(),protected
before,protected=fingerprint()
assert not (common/'packed-refs.lock').exists()
oids=[line.split()[2]for line in (HERE/'unreachable-object-audit.txt').read_text().splitlines()if line.startswith('unreachable blob ')]
batch=subprocess.check_output(['git','cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize)'],cwd=ROOT,input=('\n'.join(oids)+'\n').encode()).decode().splitlines()
matches=[]
for line in batch:
 oid,kind,size=line.split();size=int(size);p=common/'objects'/oid[:2]/oid[2:]
 if kind!='blob'or size not in sizes or oid in protected or not p.is_file()or p.is_symlink()or p.stat().st_mtime<threshold:continue
 data=git('cat-file','blob',oid);digest=hashlib.sha256(data).hexdigest()
 if(len(data),digest)not in known:continue
 matches.append({'oid':oid,'objectPath':str(p),'payloadBytes':len(data),'payloadSha256':digest,'looseStorageBytes':p.stat().st_size,'mtime':p.stat().st_mtime})
after,protected_after=fingerprint();assert before==after,'Refs/reflogs/worktree indexes changed during inspection'
assert not any(r['oid']in protected_after for r in matches)
receipt={'status':'exact-generated-export-blob-matches-verified-before-removal','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Only accidentally staged then unstaged current217 generated export payloads, still unreachable and loose. No reachable source blob, commit/tree, pack, reflog, index or user file changed.','protectedWorktreeCount':len(worktrees),'protectedRefsReflogsAndIndexFingerprint':before,'newerThanTimestamp':threshold,'exactExportByteHashesMatched':True,'matches':matches,'freeBefore':shutil.disk_usage(ROOT).free}
out=HERE/'unreachable-export-only-blob-removal.json';out.write_text(json.dumps(receipt,indent=2)+'\n')
assert fingerprint()[0]==before
for r in matches:
 p=Path(r['objectPath']);assert p.stat().st_mtime==r['mtime']and p.stat().st_size==r['looseStorageBytes'];p.unlink()
receipt.update(status='only-unreachable-byte-matched-new-export-blobs-removed',freeAfter=shutil.disk_usage(ROOT).free);out.write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'removedDerivedLooseBlobs':len(matches),'compressedStorageMiB':sum(r['looseStorageBytes']for r in matches)/2**20,'protectedWorktrees':len(worktrees),'freeMiBAfter':receipt['freeAfter']/2**20}))
