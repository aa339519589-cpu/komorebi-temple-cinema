"""Re-extract the same learned shape using full-precision coordinate embeddings.
No image input, RF resampling, texture, or manual change to anatomy is involved.
"""
import os
os.environ.setdefault('PYTORCH_ENABLE_MPS_FALLBACK','1')
from pathlib import Path
import sys,json,time,hashlib,traceback
import numpy as np
import scipy.ndimage as ndi
from skimage.measure import marching_cubes
import torch,trimesh
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools/vendor/triposg-original-mps'))
from triposg.models.autoencoders.autoencoder_kl_triposg import TripoSGVAEModel
BASE=ROOT/'lookdev/local-triposg-head';OUT=BASE/'full-precision';OUT.mkdir(parents=True,exist_ok=True)
WEIGHTS=Path(os.environ.get('TRIPOSG_WEIGHTS','/Users/mima1234/.cache/temple-triposg-weights'))
LATENTS=BASE/'shape-latents.pt'
report={'status':'loading','sourceLatents':str(LATENTS),'latentSha256':hashlib.sha256(LATENTS.read_bytes()).hexdigest(),'sourceCodeCommit':'ca7ffd3f609e53a324a32fdbc958b7439c1ddb13','sourceModel':'VAST-AI/TripoSG','weightsLicense':'MIT','scope':'Same generated 3D shape; full FP32 VAE and position embedding instead of FP16. No image or texture loaded.','imageLoaded':False,'RFRepeated':False,'photographicAcceptance':False,'decoderDtype':'float32','startedAt':time.time(),'meshLevels':[]}
def save():(OUT/'generation-receipt.json').write_text(json.dumps(report,indent=2)+'\n')
def emit(event,**kw):print(json.dumps({'event':event,**kw}),flush=True)
save()
def extract(geometric_func,device,bounds=(-1.005,)*3+(1.005,)*3,dense_octree_depth=6,hierarchical_octree_depth=9):
 lo=np.asarray(bounds[:3],np.float32);hi=np.asarray(bounds[3:],np.float32)
 grid=None
 for depth in range(dense_octree_depth,hierarchical_octree_depth+1):
  n=2**depth
  if grid is None:coords=np.indices((n,n,n),dtype=np.int32).reshape(3,-1).T
  else:
   sign=grid>=0;surface=np.zeros_like(sign)
   for axis in range(3):
    a=[slice(None)]*3;b=a.copy();a[axis]=slice(None,-1);b[axis]=slice(1,None);d=sign[tuple(a)]!=sign[tuple(b)];surface[tuple(a)]|=d;surface[tuple(b)]|=d
   surface=ndi.maximum_filter(surface,size=5)
   mask=ndi.zoom(surface.astype(np.uint8),n/grid.shape[0],order=0,prefilter=False)>0
   mask=ndi.maximum_filter(mask,size=3)
   coords=np.argwhere(mask).astype(np.int32)
   grid=ndi.zoom(grid,n/grid.shape[0],order=1,prefilter=False).astype(np.float32)
  xyz=lo+coords.astype(np.float32)/(n-1)*(hi-lo)
  emit('querying-3d-surface',depth=depth,grid=n,queries=len(xyz))
  with torch.no_grad():values=geometric_func(torch.from_numpy(xyz).unsqueeze(0)).float().cpu().numpy().reshape(-1)
  if not np.isfinite(values).all():raise ValueError('Non-finite learned SDF')
  if grid is None:grid=values.reshape(n,n,n)
  else:grid[coords[:,0],coords[:,1],coords[:,2]]=values
  report['meshLevels'].append({'depth':depth,'grid':n,'queries':len(xyz),'min':float(grid.min()),'max':float(grid.max())});save()
  torch.mps.empty_cache()
 vertices,faces,_,_=marching_cubes(grid,level=0,allow_degenerate=False)
 vertices=vertices/(n-1)*(hi-lo)+lo
 return[(vertices.astype(np.float32),np.ascontiguousarray(faces))]
try:
 if not torch.backends.mps.is_available():raise RuntimeError('Metal unavailable')
 vae=TripoSGVAEModel.from_pretrained(str(WEIGHTS/'vae'),torch_dtype=torch.float32,local_files_only=True,low_cpu_mem_usage=True).to('mps').eval()
 latents=torch.load(LATENTS,map_location='cpu',weights_only=True).to('mps',dtype=torch.float32)
 original_decode=vae._decode
 def bounded_decode(z,sampled_points,**kw):
  kw.pop('num_chunks',None);return original_decode(z,sampled_points,num_chunks=8192,**kw)
 vae._decode=bounded_decode
 def query(points):return vae.decode(latents,sampled_points=points).sample
 report['status']='decoding-fp32';save()
 with torch.no_grad():vertices,faces=extract(query,torch.device('mps'))[0]
 mesh=trimesh.Trimesh(vertices,faces,process=True)
 mesh.visual=trimesh.visual.ColorVisuals(mesh=mesh,vertex_colors=np.tile(np.array([175,175,175,255],np.uint8),(len(mesh.vertices),1)))
 dst=OUT/'head-fp32-untextured.glb';mesh.export(dst)
 report.update(status='explicit-fp32-mesh-generated-unaccepted',vertices=len(mesh.vertices),triangles=len(mesh.faces),bounds=mesh.bounds.tolist(),watertight=bool(mesh.is_watertight),file=dst.name,bytes=dst.stat().st_size,sha256=hashlib.sha256(dst.read_bytes()).hexdigest(),finishedAt=time.time());save();emit(report['status'],vertices=report['vertices'],triangles=report['triangles'],watertight=report['watertight'])
except Exception as e:
 report.update(status='failed',error=str(e),traceback=traceback.format_exc());save();emit('failed',error=str(e));raise
