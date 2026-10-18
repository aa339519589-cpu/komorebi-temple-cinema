"""Change only Gaussian sampling footprint from an existing DA2 depth-field PLY.

No predictor runs. Positions, original colors, opacity and orientation remain
unchanged. A separate output folder preserves the prior actual candidate.
"""
import argparse,hashlib,json,math
from pathlib import Path
from datetime import datetime,timezone
import numpy as np
from plyfile import PlyData,PlyElement

def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for b in iter(lambda:f.read(8*1024*1024),b''):h.update(b)
 return h.hexdigest()

p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--footprint',type=float,default=.8);a=p.parse_args()
if a.source.resolve()==a.output.resolve():raise ValueError('Use a distinct candidate folder.')
if not .55<=a.footprint<=.8:raise ValueError('This bounded coverage pass supports .55–.80 source pixels.')
source_meta=a.source/'viewer.json';meta=json.loads(source_meta.read_text());source_ply=a.source/f"{meta['id']}.ply"
if 'Depth Anything V2 Small' not in meta['reconstruction']['method']:raise ValueError('Only independently generated DA2Small depth-field candidates are accepted.')
vertices=PlyData.read(source_ply,mmap=False)['vertex'].data.copy();f=meta['intrinsics']['fx'];tangent=vertices['z']*a.footprint/f
vertices['scale_0']=np.log(tangent);vertices['scale_1']=np.log(tangent);vertices['scale_2']=np.log(np.maximum(tangent*.08,1e-6))
a.output.mkdir(parents=True,exist_ok=True);target=a.output/f"{meta['id']}.ply"
PlyData([PlyElement.describe(vertices,'vertex')],text=False,byte_order='<').write(target)
meta['model']['sha256']=sha(target);meta['gaussianEncoding']['projectedSigmaPixels']=a.footprint
meta['reconstruction']['samplingCandidate']={'method':'Only principal standard deviations recalculated for bounded pixel coverage; positions, colors, opacities and orientations unchanged','sourcePly':str(source_ply.resolve()),'sourcePlySha256':sha(source_ply),'sourceMetadataSha256':sha(source_meta),'sourceFootprintPixels':json.loads(source_meta.read_text())['gaussianEncoding']['projectedSigmaPixels'],'candidateFootprintPixels':a.footprint,'predictorRerun':False,'generatedAt':datetime.now(timezone.utc).isoformat()}
(a.output/'viewer.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps({'status':'real-gaussian-footprint-candidate-exported','path':str(target),'bytes':target.stat().st_size,'sha256':meta['model']['sha256'],'gaussians':len(vertices),'footprint':a.footprint}))
