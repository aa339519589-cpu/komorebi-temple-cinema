"""Source-independent pixel evidence for R17 actual Cycles renders.
No synthetic pixels, color transfer, artistic filtering or reference compositing.
Numbers help compare lighting only; do not constitute photographic fidelity.
"""
import json,sys,subprocess,hashlib
from pathlib import Path

if len(sys.argv)!=4:raise SystemExit("usage: python3 evaluate-sanctuary-light-rois.py REFERENCE RENDER REPORT.json")
ref,target,out=map(Path,sys.argv[1:])
for name,path in [('reference',ref),('actual-render',target)]:
 if not path.is_file() or path.stat().st_size<10000:raise SystemExit('Missing '+name+' image '+str(path))
S=720
def rgb(path):
 args=['ffmpeg','-v','error','-i',str(path),'-frames:v','1','-vf',f'scale={S}:{S}:flags=lanczos','-f','rawvideo','-pix_fmt','rgb24','pipe:1']
 data=subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE).stdout
 if len(data)!=S*S*3:raise RuntimeError('Unexpected decoded RGB buffer size '+str(len(data)))
 return memoryview(data)
refpix,renderpix=rgb(ref),rgb(target)
rois={
 'left_window_wall':(.02,.31,.16,.61),
 'altar_central':(.30,.70,.38,.68),
 'upper_ceiling':(.12,.85,.01,.19),
 'foreground_floor':(.12,.85,.72,.98),
 'central_buddha':(.38,.64,.19,.45)
}
def measure(image,box):
 x0,x1,y0,y1=box;x0=int(x0*S);x1=int(x1*S);y0=int(y0*S);y1=int(y1*S)
 values=[];r=g=b=0
 for y in range(y0,y1):
  for x in range(x0,x1):
   i=(y*S+x)*3;red,green,blue=image[i],image[i+1],image[i+2]
   r+=red;g+=green;b+=blue
   values.append((.2126*red+.7152*green+.0722*blue)/255)
 n=len(values);values.sort()
 return {'luminanceMean':sum(values)/n,'luminanceMedian':values[n//2],
         'p90':values[int(.9*(n-1))],'meanRgb':[r/(n*255),g/(n*255),b/(n*255)],'pixels':n}
data={}
for name,roi in rois.items():
 lhs,rhs=measure(refpix,roi),measure(renderpix,roi)
 data[name]={'reference':lhs,'actualRender':rhs,'meanLumaError':rhs['luminanceMean']-lhs['luminanceMean'],'actualOverReference':rhs['luminanceMean']/max(lhs['luminanceMean'],1e-9)}
def r(name,img):
 return measure(img,rois[name])['luminanceMean']
metrics={'referenceFloorToAltar':r('foreground_floor',refpix)/r('altar_central',refpix),
         'renderFloorToAltar':r('foreground_floor',renderpix)/r('altar_central',renderpix),
         'referenceLeftWallToAltar':r('left_window_wall',refpix)/r('altar_central',refpix),
         'renderLeftWallToAltar':r('left_window_wall',renderpix)/r('altar_central',renderpix)}
report={'status':'measured-real-frame','reference':str(ref),'render':str(target),
        'imageSize':[S,S],'photoNotUsedAsSceneTexture':True,'sampling':'8-bit sRGB luma, region means; visual metric only, not linear light energy',
        'roi':data,'ratios':metrics,'visualFidelityAccepted':False,
        'sha256':{str(ref):hashlib.sha256(ref.read_bytes()).hexdigest(),str(target):hashlib.sha256(target.read_bytes()).hexdigest()}}
out.parent.mkdir(parents=True,exist_ok=True)
if out.exists():raise FileExistsError('Do not overwrite ROI report '+str(out))
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':report['status'],'ratios':metrics},ensure_ascii=False))
