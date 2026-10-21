"""CPU-only exact glTF component extraction; no renderer, image, or deformation."""
from pathlib import Path
import struct,json,copy,hashlib
ROOT=Path(__file__).resolve().parents[3];SOURCE=ROOT/'reconstructions/scene-07/assets/toro156/r05/toro156.glb';OUT=ROOT/'reconstructions/scene-09/assets/toro09-158'
b=SOURCE.read_bytes();size=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+size]);binary=b[28+size:];contract=json.loads((SOURCE.parents[1]/'asset156.json').read_text());assert hashlib.sha256(b).hexdigest()==contract['glb']['sha256']
prefixes=['Captured weathered shaft','Broad irregular square foot','Chiselled plinth shoulder','Shaft lower seated collar','Worn carved lotus petal','Carved lotus stem','Carved lower lotus leaf']
selected=[(i,n) for i,n in enumerate(g['nodes']) if any(n.get('name','').startswith(s) for s in prefixes)]
out={'asset':{'version':'2.0','generator':'Scene09 exact-component CPU extractor158'},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'accessors':[],'bufferViews':[],'buffers':[{'byteLength':0}],'materials':[{'name':'CCBY-toro156-captured-shaft-stone','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':.9}}]};data=bytearray();accessors={};views={};trace=[]
def view(i):
 if i in views:return views[i]
 old=g['bufferViews'][i];p=old.get('byteOffset',0);raw=binary[p:p+old['byteLength']]
 while len(data)%4:data.append(0)
 new=copy.deepcopy(old);new['buffer']=0;new['byteOffset']=len(data);data.extend(raw);idx=len(out['bufferViews']);out['bufferViews'].append(new);views[i]=idx;return idx

def accessor(i):
 if i in accessors:return accessors[i]
 a=copy.deepcopy(g['accessors'][i]);a['bufferView']=view(a['bufferView']);idx=len(out['accessors']);out['accessors'].append(a);accessors[i]=idx;return idx
for index,node in selected:
 old=g['meshes'][node['mesh']];m=copy.deepcopy(old)
 for primitive in m['primitives']:
  primitive['attributes']={k:accessor(v) for k,v in primitive['attributes'].items()};primitive['indices']=accessor(primitive['indices']);primitive['material']=0
 mi=len(out['meshes']);out['meshes'].append(m);n=copy.deepcopy(node);n['mesh']=mi;n.pop('children',None);out['scenes'][0]['nodes'].append(len(out['nodes']));out['nodes'].append(n);trace.append({'originalNode':index,'name':node['name'],'originalMesh':node['mesh'],'copiedAccessors':old['primitives'][0]})
out['buffers'][0]['byteLength']=len(data);raw=json.dumps(out,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);data+=b'\0'*((-len(data))%4);glb=struct.pack('<III',0x46546c67,2,12+8+len(raw)+8+len(data))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(data),0x004e4942)+data
OUT.mkdir(exist_ok=True);(OUT/'shaft-components158.glb').write_bytes(glb);(OUT/'source156-contract.json').write_text(json.dumps(contract,indent=2)+'\n')
p={'revision':'scene09-square-stone-lantern158-r01','source':contract['source'],'parentHybridAsset':{'path':str(SOURCE.relative_to(ROOT)),'sha256':hashlib.sha256(b).hexdigest()},'selectedComponents':trace,'componentGLB':{'file':'shaft-components158.glb','bytes':len(glb),'sha256':hashlib.sha256(glb).hexdigest()},'changes':'Exact source attribute/index buffer views and source node transforms retained for shaft, foot, collars and attached niche relief. Runtime adds reference09-controlled square hollow chamber, four-corner cap, mullions, real moss and rooted substrate. Source07 six-sided roof/chamber/lotus receiver excluded.','maps':'Existing declared Scene09 CC0 Granite Tile04 RGB/normal/roughness files unchanged, sampled in metres.','referenceUse':'Reference09 is comparison-only; no reference RGB, image displacement, depth card or replacement frame.','visualAccepted':False};(OUT/'provenance.json').write_text(json.dumps(p,indent=2)+'\n');print(len(selected),'selected components;',len(glb),'bytes;',p['componentGLB']['sha256'])
