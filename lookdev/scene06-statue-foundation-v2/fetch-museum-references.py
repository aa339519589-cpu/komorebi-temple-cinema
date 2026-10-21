"""Fetch official CC0 museum references. No model login or viewer extraction.

Uses curl's ordinary public HTTPS client, because the local Python URL client
received a CDN 403. HTTP errors are fatal; no protected endpoint is bypassed.
"""
from pathlib import Path
import json,subprocess,hashlib,concurrent.futures

OUT=Path(__file__).resolve().parent/'sources';OUT.mkdir(exist_ok=True,parents=True)
API='https://openaccess-api.clevelandart.org/api/artworks/?accession_number=1973.85.a'
SKETCHFAB='https://api.sketchfab.com/v3/models/c9e0d5000ca345ea9dacf35f25db57b2'

def fetch(url,path):
    subprocess.run(['curl','-f','-L','--max-time','45','-sS',url,'-o',str(path)],check=True)
    return {'url':url,'file':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}

meta=fetch(API,OUT/'cma-1973.85.a-collection-metadata.json')
model=fetch(SKETCHFAB,OUT/'cma-1973.85.a-sketchfab-metadata.json')
p=json.loads((OUT/meta['file']).read_text())['data'][0]
m=json.loads((OUT/model['file']).read_text())
assert p['accession_number']=='1973.85.a' and p['share_license_status']=='CC0'
assert m['user']['username']=='clevelandart' and m['license']['slug']=='cc0'
jobs=[p['images']['web']]+[q['web']for q in p['alternate_images']]
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
    files=list(pool.map(lambda q:fetch(q['url'],OUT/q['url'].split('/')[-1]),jobs))
receipt={'license':'CC0-1.0','author':'Cleveland Museum of Art','source_record':'https://www.clevelandart.org/art/1973.85.a',
 'use':'Multi-view sculptural reference only. No photographic pixels are used in mesh or material.',
 'source3dDownloaded':False,'source3dEndpointStatus':'401 Authentication credentials were not provided; no payload extraction performed.',
 'metadata':[meta,model],'files':files}
(OUT/'image-provenance.json').write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt,indent=2))
