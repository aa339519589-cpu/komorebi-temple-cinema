from pathlib import Path
import json,hashlib,shutil,sys
ROOT=Path('/Users/mima1234/temple-cinema-live-sync');SCENE=ROOT/'reconstructions/scene-06';LOOK=ROOT/'lookdev/scene06-nc-adoption179'
revision=sys.argv[1];report=ROOT/sys.argv[2];r=json.loads(report.read_text());target=LOOK/(revision+'-source')
if target.exists():raise ValueError('Fresh source archive required')
for p in SCENE.rglob('*'):
 if p.is_file() and p.suffix in ['.js','.mjs','.py','.html','.json','.md','.txt']:
  q=target/p.relative_to(SCENE);q.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,q)
other=[target,LOOK/'r06-held-source',LOOK/'r05-source',LOOK/'r04-source',LOOK/'r03-source',LOOK/'r02-source',LOOK/'r01-adopted-source',LOOK/'preserved-canonical165-r07-before-adoption',SCENE];records=[]
for path,digest in r['source']['files'].items():
 ps=[base/path.removeprefix('reconstructions/scene-06/')for base in other]if path.startswith('reconstructions/scene-06/')else[ROOT/path]
 p=next((p for p in ps if p.is_file()and hashlib.sha256(p.read_bytes()).hexdigest()==digest),None)
 if p is None:raise ValueError('Exact runtime/source bytes missing '+path)
 records.append({'originalPath':path,'sha256':digest,'preservedAt':str(p)})
(target/'exact-replay-map.json').write_text(json.dumps({'revision':revision,'historicalSourceIdentity':r['source']['hash'],'allHistoricalReferencedFileBytesResolvable':True,'resolvedFileCount':len(records),'files':records,'unchangedRuntimeBytesNotDuplicated':True},indent=2)+'\n')
print(revision,'all',len(records),'exact referenced files resolvable; text sources preserved.')
