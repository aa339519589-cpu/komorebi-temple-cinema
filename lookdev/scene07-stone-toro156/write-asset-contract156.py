"""Refresh only the owned asset's immutable-byte contract after a queued build."""
import json,hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent;revision=sys.argv[1] if len(sys.argv)>1 else 'r05';report=json.loads((HERE/revision/'report.json').read_text());assert report['status']=='rendered-hybrid-toro-review'
source=HERE/'sources/ccby-3dlunatic-toro/source-objaverse.glb';assert hashlib.sha256(source.read_bytes()).hexdigest()==report['sourceSha256'];path=HERE/revision/'toro156.glb';assert hashlib.sha256(path.read_bytes()).hexdigest()==report['glb']['sha256']
for frame in report['renders']:assert hashlib.sha256(Path(frame['path']).read_bytes()).hexdigest()==frame['sha256']
contract=HERE/'asset156.json';d=json.loads(contract.read_text());d['revision']=revision+'-weathered-reference-profile';d['glb']={'file':revision+'/toro156.glb','sha256':report['glb']['sha256'],'bytes':path.stat().st_size};d['builder']={'file':'build-toro156.py','sha256':report['scriptSha256'],'geometryReport':revision+'/report.json','editableBlend':revision+'/toro156-editable.blend'};d['evidence']=report['renders'];d['visualAccepted']=False;contract.write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n');print(json.dumps({'revision':revision,'glbSha256':d['glb']['sha256'],'visualAccepted':False}))
