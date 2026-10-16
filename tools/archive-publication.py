"""Archive every project file for the public checkpoint without storing large videos in Git."""
from pathlib import Path
import hashlib,json,zipfile,datetime

root=Path(__file__).resolve().parents[1]
dest=root/'.publication';dest.mkdir(exist_ok=True)
manifest_path=root/'archives/checkpoint-manifest.json'
files=[]
for p in sorted(root.rglob('*')):
    if not p.is_file():continue
    rel=p.relative_to(root)
    if any(x in {'.git','node_modules','.publication'} for x in rel.parts):continue
    if p==manifest_path:continue
    files.append((p,rel))

limit=850*1024*1024
groups=[];group=[];size=0
for p,rel in files:
    n=p.stat().st_size
    if group and size+n>limit:groups.append(group);group=[];size=0
    group.append((p,rel));size+=n
if group:groups.append(group)

def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for data in iter(lambda:f.read(8*1024*1024),b''):h.update(data)
    return h.hexdigest()

entries=[];assets=[]
for number,items in enumerate(groups,1):
    name=f'komorebi-checkpoint-part-{number:02d}.zip';archive=dest/name
    with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_STORED,allowZip64=True) as z:
        for p,rel in items:
            z.write(p,rel.as_posix())
            entries.append({'path':rel.as_posix(),'bytes':p.stat().st_size,'sha256':sha(p),'archive':name})
    assets.append({'file':name,'bytes':archive.stat().st_size,'sha256':sha(archive)})
    print(json.dumps({'archive':name,'bytes':archive.stat().st_size,'files':len(items)}),flush=True)

report={'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'work-in-progress checkpoint; includes rejected drafts and incomplete renders','repository':'https://github.com/aa339519589-cpu/komorebi-temple-cinema','releaseTag':'checkpoint-2026-10-16','restore':'Extract every ZIP part into the same empty project directory. Each ZIP is independently readable and preserves original relative paths.','excluded':['.git/','node_modules/','.publication/','this manifest (available separately and in Git)'],'fileCount':len(entries),'originalBytes':sum(x['bytes'] for x in entries),'assets':assets,'files':entries}
manifest_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(dest/'checkpoint-manifest.json').write_bytes(manifest_path.read_bytes())
print(json.dumps({'fileCount':len(entries),'originalBytes':report['originalBytes'],'assets':len(assets)}),flush=True)
