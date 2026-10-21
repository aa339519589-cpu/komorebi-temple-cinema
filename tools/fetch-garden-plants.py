"""Fetch independently licensed botanical meshes with publisher checksums."""
import hashlib, json, urllib.request
from pathlib import Path

root=Path(__file__).resolve().parents[1]
ua='TempleCinemaLookdev/1.0 (+https://github.com/aa339519589-cpu/komorebi-temple-cinema)'
def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':ua}),timeout=120).read()
for asset,author in [('shrub_02','Rico Cilliers'),('periwinkle_plant','Amal Kumar')]:
    out=root/'assets/polyhaven'/asset.replace('_','-');out.mkdir(parents=True,exist_ok=True)
    listing=fetch('https://api.polyhaven.com/files/'+asset)
    metadata=fetch('https://api.polyhaven.com/info/'+asset)
    (out/'provider-files.json').write_bytes(listing);(out/'provider-info.json').write_bytes(metadata)
    chosen=json.loads(listing)['gltf']['4k']['gltf']
    files={asset+'_4k.gltf':chosen,**chosen.get('include',{})};records=[]
    for name,file in files.items():
        dest=out/name
        if not dest.resolve().is_relative_to(out.resolve()):raise ValueError('Asset path escapes destination')
        dest.parent.mkdir(parents=True,exist_ok=True)
        data=dest.read_bytes() if dest.is_file() else b''
        if hashlib.md5(data).hexdigest()!=file['md5']:data=fetch(file['url'])
        if len(data)!=file['size'] or hashlib.md5(data).hexdigest()!=file['md5']:raise ValueError('Publisher checksum mismatch: '+name)
        dest.write_bytes(data)
        records.append({'file':name,'url':file['url'],'bytes':len(data),'md5':file['md5'],'sha256':hashlib.sha256(data).hexdigest()})
        print(json.dumps({'asset':asset,'file':name,'bytes':len(data),'verified':True}),flush=True)
    provenance={'provider':'Poly Haven','asset':asset,'source':'https://polyhaven.com/a/'+asset,'author':author,'license':'CC0-1.0','licenseSource':'https://polyhaven.com/license','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','resolution':'Original 4K surface maps and original glTF meshes; no geometry decimation.','primaryMetadata':'provider-info.json','primaryFileListing':'provider-files.json','files':records,'use':'Independent botanical meshes for actual modeled garden planting. No supplied reference-scene image is used as model radiance, backdrop or projection.'}
    (out/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
