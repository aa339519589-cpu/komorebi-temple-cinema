"""Apache-2.0 DA2 Small depth, independently backprojected to anisotropic 3D Gaussians."""
from __future__ import annotations
import argparse, hashlib, json, math, subprocess, sys, time
from pathlib import Path
from datetime import datetime, timezone

def digest(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for b in iter(lambda:f.read(8*1024*1024),b''):h.update(b)
    return h.hexdigest()

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--image',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
    p.add_argument('--id',default='01');p.add_argument('--input-size',type=int,default=1254)
    p.add_argument('--fov',type=float,default=54);p.add_argument('--near',type=float,default=3);p.add_argument('--far',type=float,default=40)
    p.add_argument('--footprint',type=float,default=.62);p.add_argument('--opacity',type=float,default=.995)
    p.add_argument('--device',default='mps',choices=['mps','cpu'])
    p.add_argument('--upstream',type=Path,default=Path.home()/'.cache/depth-field/Depth-Anything-V2')
    p.add_argument('--checkpoint',type=Path,default=Path.home()/'.cache/depth-field/checkpoints/depth_anything_v2_vits.pth')
    a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True);began=time.monotonic()
    def log(stage,**kw):print(json.dumps({'stage':stage,'seconds':round(time.monotonic()-began,3),**kw}),flush=True)
    log('importing')
    import cv2,numpy as np,torch
    from PIL import Image
    from plyfile import PlyData,PlyElement
    sys.path.insert(0,str(a.upstream));from depth_anything_v2.dpt import DepthAnythingV2
    torch.set_num_threads(8)
    raw=cv2.imread(str(a.image),cv2.IMREAD_COLOR)
    if raw is None:raise ValueError(f'Cannot read {a.image}')
    rgb=cv2.cvtColor(raw,cv2.COLOR_BGR2RGB);h,w=rgb.shape[:2]
    model=DepthAnythingV2(encoder='vits',features=64,out_channels=[48,96,192,384])
    model.load_state_dict(torch.load(a.checkpoint,map_location='cpu',weights_only=True))
    model=model.to(a.device).eval();log('predicting',model='Depth-Anything-V2-Small',width=w,height=h,inputSize=a.input_size)
    with torch.no_grad():
        tensor,_=model.image2tensor(raw,a.input_size);tensor=tensor.to(a.device)
        prediction=model(tensor)
        prediction=torch.nn.functional.interpolate(prediction[:,None],(h,w),mode='bilinear',align_corners=True)[0,0]
        relative=prediction.cpu().numpy().astype(np.float32)
    log('depth-inferred',tensorShape=list(tensor.shape))
    lo,hi=np.quantile(relative,[.01,.99]);normalized=np.clip((relative-lo)/max(float(hi-lo),1e-8),0,1)
    z=(1/(1/a.far+normalized*(1/a.near-1/a.far))).astype(np.float32)
    np.save(a.output/'relative-inverse-depth.npy',relative);np.save(a.output/'mapped-depth.npy',z)
    Image.fromarray((normalized*65535).astype(np.uint16)).save(a.output/'relative-inverse-depth.png')
    # Independent assumed pinhole camera; no SHARP data, intrinsics or assets.
    f=w/(2*math.tan(math.radians(a.fov)/2));cx=w/2;cy=h/2
    yy,xx=np.mgrid[:h,:w].astype(np.float32);n=h*w
    fields=['x','y','z','f_dc_0','f_dc_1','f_dc_2','opacity','scale_0','scale_1','scale_2','rot_0','rot_1','rot_2','rot_3']
    vertices=np.zeros(n,dtype=[(name,'<f4') for name in fields])
    vertices['x']=(((xx+.5-cx)/f)*z).ravel();vertices['y']=(((yy+.5-cy)/f)*z).ravel();vertices['z']=z.ravel()
    sh=((rgb.astype(np.float32)/255-.5)/math.sqrt(1/(4*math.pi))).reshape(n,3)
    for i in range(3):vertices[f'f_dc_{i}']=sh[:,i]
    tangent=(z*a.footprint/f).ravel()
    vertices['scale_0']=np.log(tangent);vertices['scale_1']=np.log(tangent);vertices['scale_2']=np.log(np.maximum(tangent*.08,1e-6))
    vertices['opacity']=math.log(a.opacity/(1-a.opacity));vertices['rot_0']=1
    ply=a.output/f'{a.id}.ply';partial=a.output/f'{a.id}.partial.ply'
    PlyData([PlyElement.describe(vertices,'vertex')],text=False,byte_order='<').write(partial);partial.replace(ply)
    q=np.quantile(z,[.01,.05,.1,.5,.9,.99]).tolist();identity=np.eye(4).ravel().tolist()
    metadata={'id':a.id,'model':{'url':f'./{a.id}.ply','format':'binary-ply-gaussian-splat','gaussianCount':n,'sha256':digest(ply)},
      'image':{'path':str(a.image.resolve()),'width':w,'height':h,'sha256':digest(a.image)},
      'intrinsics':{'fx':f,'fy':f,'cx':cx,'cy':cy,'width':w,'height':h,'assumption':'Independent horizontal54deg FOV unless --fov overrides; not measured','horizontalFovDegrees':a.fov},
      'coordinateSystem':'opencv-camera','units':'arbitrary declared scene metres; not measured metric depth',
      'sourceCamera':{'cameraToWorld':identity,'worldToCamera':identity,'matrixOrder':'row-major'},
      'depth':{'positiveZQuantiles':dict(zip(['p01','p05','p10','median','p90','p99'],q)),'mapping':{'relativeInverseDepthPercentile01':float(lo),'relativeInverseDepthPercentile99':float(hi),'near':a.near,'far':a.far,'formula':'s=clip((prediction-p01)/(p99-p01),0,1); z=1/(1/far+s*(1/near-1/far))'},'inferenceInputShape':list(tensor.shape)},
      'gaussianEncoding':{'sphericalHarmonicsDegree':0,'color':'original unresized sRGB pixels encoded SH0 (rgb-.5)/sqrt(1/(4*pi))','opacity':'logit','opacityValue':a.opacity,'scale':'log principal standard deviations; tangent sigma=z*footprint/f, thickness=.08*tangent','projectedSigmaPixels':a.footprint,'quaternion':'wxyz; camera-plane tangent axes identity; no edge-gradient stretching'},
      'reconstruction':{'method':'Depth Anything V2 Small relative inverse-depth inference, independent per-pixel backprojection, no triangle connectivity','model':'vits; features64; channels48,96,192,384','device':a.device,'source':'https://github.com/DepthAnything/Depth-Anything-V2','sourceCommit':subprocess.check_output(['git','-C',str(a.upstream),'rev-parse','HEAD'],text=True).strip(),'checkpointUrl':'https://huggingface.co/depth-anything/Depth-Anything-V2-Small/resolve/main/depth_anything_v2_vits.pth','checkpointSha256':digest(a.checkpoint),'torch':torch.__version__,'generatedAt':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':round(time.monotonic()-began,3)},
      'license':{'code':'Apache-2.0','weights':'Depth-Anything-V2-Small Apache-2.0; no Base/Large/Giant weights used','url':'https://github.com/DepthAnything/Depth-Anything-V2#license','attribution':'Depth Anything V2, Lihe Yang et al.; source LICENSE preserved'},
      'limitations':['Relative depth mapped to a declared unmeasured scale; focal length assumed independently.','Visible colored surface only; hidden geometry is unknown, not a closed CAD model.','Lighting/reflections encoded in source colors; no relightable PBR material reconstruction.','No SHARP model, predicted depth, PLY or camera metadata used.']}
    (a.output/'viewer.json').write_text(json.dumps(metadata,indent=2)+'\n')
    log('complete',ply=str(ply),metadata=str(a.output/'viewer.json'),gaussianCount=n,medianDepth=q[3],bytes=ply.stat().st_size)

if __name__=='__main__':main()
