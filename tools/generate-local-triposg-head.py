"""Produce an untextured connected mesh from a labeled sculpture guide.
Uses the original MIT TripoSG RF/VAE, not the later FlashVDM acceleration.
Only surface extraction is replaced by a CPU octree with MPS VAE queries.
"""
import os
os.environ.setdefault('PYTORCH_ENABLE_MPS_FALLBACK','1')
from pathlib import Path
import sys,json,time,hashlib,traceback
import numpy as np
from PIL import Image
import scipy.ndimage as ndi
from skimage.measure import marching_cubes
import torch,trimesh
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools/vendor/triposg-original-mps'))
from triposg.pipelines import pipeline_triposg as module
from triposg.pipelines.pipeline_triposg import TripoSGPipeline
OUT=ROOT/'lookdev/local-triposg-head';OUT.mkdir(parents=True,exist_ok=True)
GUIDE=ROOT/'lookdev/trellis2-head-study/sculpt-guide-v01.png'
WEIGHTS=Path(os.environ.get('TRIPOSG_WEIGHTS','/Users/mima1234/.cache/temple-triposg-weights'))
report={'status':'loading','source':'VAST-AI/TripoSG','codeCommit':'ca7ffd3f609e53a324a32fdbc958b7439c1ddb13','codeLicense':'MIT','sourceScriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'upstreamCallbackFix':'Unused undefined dual-encoder callback slots removed; RF/VAE mathematics unchanged','guide':str(GUIDE),'guideSha256':hashlib.sha256(GUIDE.read_bytes()).hexdigest(),'purpose':'Provisional real 3D head geometry; not a replacement film frame','textureUsedInOutput':False,'photographicAcceptance':False,'torch':torch.__version__,'startedAt':time.time(),'seed':804231,'steps':50,'guidance':7.0,'octree':[6,9],'device':'mps','meshLevels':[]}
def save(): (OUT/'generation-receipt.json').write_text(json.dumps(report,indent=2)+'\n')
def emit(event,**kw): print(json.dumps({'event':event,**kw}),flush=True)
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
module.hierarchical_extract_geometry=extract
try:
 if not torch.backends.mps.is_available():raise RuntimeError('Apple Metal is required for this bounded local attempt')
 pipe=TripoSGPipeline.from_pretrained(str(WEIGHTS),torch_dtype=torch.float16,local_files_only=True,low_cpu_mem_usage=True).to('mps')
 pipe.set_progress_bar_config(disable=True)
 # The upstream learned decoder is unchanged; smaller query batches bound
 # activation memory on the shared 32GB device while retaining its KV cache.
 original_decode=pipe.vae._decode
 def bounded_decode(z,sampled_points,**kw):
  kw.pop('num_chunks',None)
  return original_decode(z,sampled_points,num_chunks=8192,**kw)
 pipe.vae._decode=bounded_decode
 rgba=Image.open(GUIDE).convert('RGBA');alpha=rgba.getchannel('A');box=alpha.point(lambda p:255 if p>200 else 0).getbbox();rgba=rgba.crop(box)
 # Standard inference alpha compositing, no paint, lighting or reference RGB
 # is transferred into the resulting mesh or its eventual scene material.
 side=max(rgba.size);canvas=Image.new('RGBA',(side,side),(255,255,255,255));canvas.alpha_composite(rgba,((side-rgba.width)//2,(side-rgba.height)//2));image=canvas.convert('RGB')
 report['status']='generating-shape';save();emit('local-shape-start',steps=50,device='mps')
 def callback(p,i,t,kw):
  if i%5==0 or i==49:emit('shape-step',step=i+1,total=50)
  if i==49:torch.save(kw['latents'].detach().cpu(),OUT/'shape-latents.pt')
  return kw
 with torch.no_grad():result=pipe(image=image,generator=torch.Generator(device='cpu').manual_seed(804231),num_inference_steps=50,guidance_scale=7.0,dense_octree_depth=6,hierarchical_octree_depth=9,callback_on_step_end=callback)
 mesh=result.meshes[0]
 if not isinstance(mesh,trimesh.Trimesh) or len(mesh.faces)<1000:raise ValueError('No usable explicit mesh produced')
 mesh.visual=trimesh.visual.ColorVisuals(mesh=mesh,vertex_colors=np.tile(np.array([175,175,175,255],np.uint8),(len(mesh.vertices),1)))
 dst=OUT/'head-provisional-untextured.glb';mesh.export(dst)
 report.update(status='explicit-mesh-generated-unaccepted',vertices=len(mesh.vertices),triangles=len(mesh.faces),bounds=mesh.bounds.tolist(),watertight=bool(mesh.is_watertight),file=dst.name,bytes=dst.stat().st_size,sha256=hashlib.sha256(dst.read_bytes()).hexdigest(),finishedAt=time.time());save();emit(report['status'],vertices=report['vertices'],triangles=report['triangles'],watertight=report['watertight'])
except Exception as e:
 report.update(status='failed',error=str(e),traceback=traceback.format_exc(),finishedAt=time.time());save();emit('failed',error=str(e));raise
