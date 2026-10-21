"""Fetch an openly licensed creator scan, retaining its exact public GLB bytes."""
from pathlib import Path
import json,subprocess,hashlib,struct
OUT=Path(__file__).resolve().parent/'sources/ccby-beachmouse-japanese-head';OUT.mkdir(exist_ok=True,parents=True)
UID='5feec372c644454fb9514db5b1834eab'
META='https://api.sketchfab.com/v3/models/'+UID
PUBLIC='https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-090/'+UID+'.glb'
DELIVERY='https://hf-mirror.com/datasets/allenai/objaverse/resolve/main/glbs/000-090/'+UID+'.glb'
EXPECTED='f5d0a1ea3f6bd79e4bfce4904b089ba48e693acb3bfa6e3851cc15f08fe52302'
def fetch(url,path):subprocess.run(['curl','-f','-L','--max-time','90','-sS',url,'-o',str(path)],check=True)
fetch(META,OUT/'creator-primary-metadata.json')
m=json.loads((OUT/'creator-primary-metadata.json').read_text())
assert m['uid']==UID and m['user']['username']=='beachmouse' and m['license']['slug']=='by'
source=OUT/'source-objaverse.glb'
if not source.exists():fetch(DELIVERY,source)
b=source.read_bytes();sha=hashlib.sha256(b).hexdigest()
assert sha==EXPECTED,'The public source bytes changed; inspect source and license before proceeding.'
assert b[:4]==b'glTF' and struct.unpack_from('<I',b,8)[0]==len(b)
n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);assert 'CC-BY-4.0'in g['asset']['extras']['license']
p={'title':m['name'],'author':'beachmouse','authorProfile':m['user']['profileUrl'],'originalModel':m['viewerUrl'],'metadataSource':META,'sourceDescription':m['description'],'license':'CC-BY-4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','licenseLabelVerified':m['license']['label'],'datasetMirror':PUBLIC,'deliveryMirror':DELIVERY,'sourceFile':source.name,'sourceBytes':len(b),'sourceSha256':sha,'sourceVertexCount':g['accessors'][0]['count'],'creatorReportedVertices':m['vertexCount'],'creatorReportedTriangles':m['faceCount'],'changes':'Original public GLB bytes preserved unchanged. Derived studies remove all source scan textures, use new physical gold, weld exact UV seams and rigidly crop/retarget the source cage; optional editable subdivision is declared in each report.','attribution':'Buddha Head by beachmouse, licensed CC BY 4.0, via Sketchfab and the public Objaverse dataset; modified in temple-cinema statue foundation studies.','visualAccepted':False}
(OUT/'provenance.json').write_text(json.dumps(p,indent=2));print(json.dumps(p,indent=2))
