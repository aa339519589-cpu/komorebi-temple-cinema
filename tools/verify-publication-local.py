"""Verify every byte of the public checkpoint ZIPs against the original file inventory."""
from pathlib import Path
import hashlib,json,zipfile,datetime
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'archives/checkpoint-manifest.json').read_text())
expected={x['path']:x for x in m['files']};seen=set()
for asset in m['assets']:
    p=root/'.publication'/asset['file'];h=hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda:f.read(8*1024*1024),b''):h.update(chunk)
    assert p.stat().st_size==asset['bytes']
    assert h.hexdigest()==asset['sha256']
    with zipfile.ZipFile(p) as z:
        for name in z.namelist():
            assert name in expected and name not in seen
            entry=expected[name];assert entry['archive']==asset['file'];h=hashlib.sha256();size=0
            with z.open(name) as f:
                for chunk in iter(lambda:f.read(8*1024*1024),b''):h.update(chunk);size+=len(chunk)
            assert size==entry['bytes'] and h.hexdigest()==entry['sha256'],name
            seen.add(name)
    print(asset['file']+' verified',flush=True)
assert seen==set(expected)
report={'scope':'Local checkpoint ZIP integrity; remote publication is checked separately','verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':len(seen),'originalBytes':m['originalBytes'],'archiveCount':len(m['assets']),'allFileHashesMatch':True,'allArchiveHashesMatch':True,'passed':True}
(root/'archives/local-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report),flush=True)
