"""Fetch only public commercial-compatible CC licensed primary scans mirrored by Objaverse.
Primary creator metadata is preserved separately from unmodified public GLB bytes.
"""
from pathlib import Path
import urllib.request,json,hashlib,struct,subprocess,sys
ROOT=Path(__file__).resolve().parent
index={
 'fb17c123ad9c4c0fb6baf723b3fffd79':'glbs/000-156/fb17c123ad9c4c0fb6baf723b3fffd79.glb',
 '739d2c82ee564863a2dfa579910f8369':'glbs/000-103/739d2c82ee564863a2dfa579910f8369.glb'
}
for uid in sys.argv[1:]:
 out=ROOT/'sources'/uid;out.mkdir(parents=True,exist_ok=True)
 primary='https://api.sketchfab.com/v3/models/'+uid
 metadata=out/'creator-primary-metadata.json'
 if not metadata.exists():metadata.write_bytes(urllib.request.urlopen(primary,timeout=45).read())
 m=json.loads(metadata.read_text())
 assert m['uid']==uid and m['license']['slug'] in ('by','cc0')
 public='https://huggingface.co/datasets/allenai/objaverse/resolve/main/'+index[uid]
 delivery=public.replace('huggingface.co','hf-mirror.com')
 raw=out/'source-original.glb'
 if not raw.exists():subprocess.run(['curl','-f','-L','--max-time','180','--max-filesize','80000000','-sS',delivery,'-o',str(raw)],check=True)
 b=raw.read_bytes();assert len(b)<80000000 and b[:4]==b'glTF' and struct.unpack_from('<I',b,8)[0]==len(b)
 n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n])
 (out/'source-gltf-manifest.json').write_text(json.dumps(g,indent=2))
 p=dict(title=m['name'],uid=uid,author=m['user']['displayName'],authorUsername=m['user']['username'],authorProfile=m['user']['profileUrl'],originalModel=m['viewerUrl'],primaryMetadata=primary,description=m['description'],license=m['license'],publicDatasetMirror=public,deliveryMirror=delivery,sourceFile=raw.name,sourceBytes=len(b),sourceSha256=hashlib.sha256(b).hexdigest(),creatorReportedTriangles=m['faceCount'],creatorReportedVertices=m['vertexCount'],changes='None. Exact unmodified public GLB preserved. All downstream components and renders remove scan color textures and have their own report.',visualAccepted=False)
 (out/'provenance.json').write_text(json.dumps(p,indent=2))
 print(json.dumps({k:p[k] for k in ('title','author','sourceBytes','sourceSha256')}),flush=True)
