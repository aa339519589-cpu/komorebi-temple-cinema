"""Retain exact replay inputs and all rendered evidence; remove derived buffers.
This is only for the completed, byte-audited218 study, never original meshes.
"""
from pathlib import Path
import json,hashlib,subprocess,shutil,datetime,re
ROOT=Path('/Users/mima1234/temple-cinema-live-sync');HERE=Path(__file__).resolve().parent
BASE=HERE/'export217-r01';r=json.loads((BASE/'export-report.json').read_text())
PIN='7514b2fddc215ebae8c48dbf0f7f7d41fa23e8b5c3b514f3df72dfacffbe6b62'
assert r['sourceHash']==PIN and r['status']=='exported-existing-geometry'
assert json.loads((HERE/'cycles217-r01-full/report.json').read_text())['status']=='path-traced-review'
assert json.loads((HERE/'root-actual-review218-r01.json').read_text())['photographicAcceptance']is False
def sha(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
inputs=[]
for name,want in r['source']['files'].items():
 p=ROOT/name;assert p.is_file()and sha(p)==want,name
 where='canonical exact bytes, retained unchanged'
 if p.suffix in ['.js','.mjs','.json','.html']:
  dst=HERE/'rebuild-source217'/name;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(p.read_bytes());where=str(dst.relative_to(ROOT))
 inputs.append({'path':name,'sha256':want,'retained':where})
for name in ['tools/export-reconstructed-scene.mjs','tools/export-asset-writer.mjs','tools/reconstruction-source-identity.mjs','tools/server.mjs','tools/render-runtime.mjs','tools/gpu-render-slot.mjs','tools/encode-webgl-png.mjs']:
 p=ROOT/name;dst=HERE/'rebuild-source217'/name;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(p.read_bytes())
records=[];seen=set();unique=0
for name,rec in r['exportedAssets'].items():
 if not re.fullmatch(r'(geometry-.*\.bin|instances-.*\.bin|instance-colors-.*\.bin|texture-.*\.png)',name):continue
 p=BASE/'assets'/name;assert p.is_file()and not p.is_symlink();st=p.stat()
 assert st.st_size==rec['bytes']and sha(p)==rec['sha256'],name
 if(st.st_dev,st.st_ino)not in seen:seen.add((st.st_dev,st.st_ino));unique+=st.st_size
 records.append({'path':'assets/'+name,**rec})
handles=subprocess.run(['lsof','+D',str(BASE)],capture_output=True,text=True);assert handles.returncode==1 and not handles.stdout.strip(),handles.stdout
receipt={'status':'all-current217-source-and-cache-bytes-verified-before-pruning','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceHash':PIN,'sourceInputs':inputs,'derivedPayloads':records,'uniqueBytesBefore':unique,'freeBefore':shutil.disk_usage(ROOT).free,'retained':['all original and authored source meshes/textures','all actual native and physical PNGs and their reports','source-frame.png and source-frame.rgba','scene.json/export-report.json','exact text inputs and exporter tools in rebuild-source217'],'regeneration':'Materialize exact rebuild-source217 text plus each hash-verified source binary, then run bounded official export through shared FIFO. Renderer and all physical calibration code remain. Do not substitute future sculpture or lotus source.'}
dst=HERE/'verified-completed-export-pruning.json';dst.write_text(json.dumps(receipt,indent=2)+'\n')
for rec in records:(BASE/rec['path']).unlink()
receipt.update(status='only-completed-study-regenerable-cache-pruned',freeAfter=shutil.disk_usage(ROOT).free);dst.write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'sourceInputs':len(inputs),'derivedFilesRemoved':len(records),'uniqueMiB':unique/2**20,'freeMiBAfter':receipt['freeAfter']/2**20}))
