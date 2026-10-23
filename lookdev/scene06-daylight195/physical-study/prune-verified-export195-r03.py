"""Prune only the reviewed, owned derived export after actual R04 root review.

Keep both native source-frame encodings, all manifests, exact source/rebuild
scripts, recipes, diagnostics and both actual physical PNGs/reports. This does
not remove or modify any source asset, other job, history or scene source.
"""
import hashlib,json,subprocess,shutil,time
from pathlib import Path

HERE=Path(__file__).resolve().parent
WORKSPACE=HERE.parents[2]
EXPORT=HERE/'cycles-195-r03-export'
ASSETS=EXPORT/'assets'
SOURCE='c2412401f7386f2bf480e06de27120ec958f8139f4466f3cd2d45f0699cdd118'
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert (WORKSPACE/'AGENTS.md').is_file()
assert digest(EXPORT/'scene.json')=='f81b85c61fc0f364749f1c16fd7a36c02dbc94431d18f0108eaf6abf25d65a17'
assert digest(EXPORT/'export-report.json')=='3414504c59a4f41a0148f24f19c564f1eda39b1676fb61e6ad24c74b9154929c'
inventory_path=HERE/'cycles-195-r03-export-verified-inventory.json'
assert digest(inventory_path)=='32fab9d4d6dbe28dd62a168c559ede9e06ec363885eb3f1a625a9d059d81bdaa'
inventory=json.loads(inventory_path.read_text())
report=json.loads((EXPORT/'export-report.json').read_text())
assert inventory['sourceHash']==report['sourceHash']==SOURCE
assert inventory['allRecordedHashesAndSizesVerified']
replay=HERE/'rebuild-source195-r03/exact-replay-map.json'
replay_data=json.loads(replay.read_text());assert replay_data['sourceHash']==SOURCE
for entry in replay_data['files']:
    p=WORKSPACE/(entry.get('storedSource')or entry['retainedOriginalAsset'])
    assert p.is_file() and digest(p)==entry['sha256'],entry['path']

protected={p for p in [EXPORT/'scene.json',EXPORT/'export-report.json',ASSETS/'source-frame.png',ASSETS/'source-frame.rgba',replay,HERE/'cycles-195-r03-full/report.json',HERE/'cycles-195-floor-r04-full/report.json']}
for folder in ['cycles-195-r03-full','cycles-195-floor-r04-full']:
    render=json.loads((HERE/folder/'report.json').read_text())
    png=Path(render['output']);assert digest(png)==render['sha256'];protected.add(png)
    protected.add(png.with_name(png.name+'.LICENSE.txt'))
protected_hashes={str(p):digest(p)for p in protected}
# Snapshot current source, including the primary agent's newer native200 hook.
# Never restore old source into canonical merely to prune a derived input cache.
source_before={str(WORKSPACE/name):digest(WORKSPACE/name)for name in report['source']['files']}
source_inodes={(Path(p).stat().st_dev,Path(p).stat().st_ino)for p in source_before}
keep_names={'source-frame.png','source-frame.rgba'}
expected_names={r['name']for r in inventory['assetRecords']}|{'source-frame.png'}
assert {p.name for p in ASSETS.iterdir()}==expected_names
selected=[];unique={}
for rec in inventory['assetRecords']:
    name=rec['name'];assert Path(name).name==name and name not in ('.','..')
    p=ASSETS/name;assert p.is_file() and not p.is_symlink() and p.resolve().parent==ASSETS.resolve()
    stat=p.stat();assert stat.st_size==rec['bytes'] and digest(p)==rec['sha256'],name
    assert (stat.st_dev,stat.st_ino)not in source_inodes,'Export aliases source inode'
    if name in keep_names:continue
    selected.append((p,rec));unique[(stat.st_dev,stat.st_ino)]=stat.st_size
handles=subprocess.run(['lsof','-nP','+D',str(EXPORT)],capture_output=True,text=True)
assert handles.returncode in(0,1) and not handles.stdout.strip(),handles.stdout or handles.stderr
receipt={'status':'pruning-verified-owned-export','sourceHash':SOURCE,'actualRootR04ReviewReceived':True,'inventoryPath':inventory_path.name,'inventorySha256':digest(inventory_path),'rebuildSourceManifestSha256':digest(replay),'dedupInventoryPath':'cycles-195-r03-export-dedup-inventory.json','assetHashesAndSizesReverified':True,'noSourceInodeAliases':True,'openHandleCheck':{'command':['lsof','-nP','+D',str(EXPORT)],'exitCode':handles.returncode,'stdout':handles.stdout,'stderr':handles.stderr},'selectedFiles':len(selected),'selectedLogicalBytes':sum(r['bytes']for _,r in selected),'selectedUniqueBytes':sum(unique.values()),'keptSourceFrameFormats':['PNG','RGBA'],'protectedFilesBefore':protected_hashes,'currentSourceFilesBefore':source_before,'freeBytesBefore':shutil.disk_usage(WORKSPACE).free,'deletedFiles':[],'started':time.time(),'sourceOrHistoricalFilesDeleted':0,'noBlendOrMovieCreated':True,'visualAccepted':False}
receipt_path=HERE/'cycles-195-r03-prune-receipt.json'
try:
    for p,rec in selected:
        p.unlink();receipt['deletedFiles'].append(rec['name'])
    assert {p.name for p in ASSETS.iterdir()}==keep_names
    assert all(digest(Path(p))==want for p,want in protected_hashes.items())
    assert all(digest(Path(p))==want for p,want in source_before.items())
    receipt.update({'status':'verified-owned-derived-export-pruned','deletedFileCount':len(receipt['deletedFiles']),'allProtectedFilesStillByteExact':True,'currentCanonicalSourceStillByteExact':True,'retainedSourceFrameFiles':[{ 'name':p.name,'bytes':p.stat().st_size,'sha256':digest(p)}for p in sorted(ASSETS.iterdir())],'freeBytesAfter':shutil.disk_usage(WORKSPACE).free,'finished':time.time()})
except Exception as exc:
    receipt['status']='prune-failed-with-receipt';receipt['error']=str(exc);raise
finally:
    receipt_path.write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({k:receipt[k]for k in ['status','deletedFileCount','selectedUniqueBytes','sourceOrHistoricalFilesDeleted','allProtectedFilesStillByteExact','currentCanonicalSourceStillByteExact','freeBytesAfter']},indent=2))
