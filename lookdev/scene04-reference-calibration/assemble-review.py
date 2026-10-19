"""CPU-only actual before/after ROI statistics and labelled-by-colour evidence."""
import json,hashlib,subprocess,shutil
from pathlib import Path
import numpy as np
import OpenImageIO as o
import PyOpenColorIO as ocio

HERE=Path('lookdev/scene04-reference-calibration');OUT=HERE/'results';DATA=Path('output/scene04-reference-calibration')
sel=json.loads((HERE/'selections.json').read_text());classes=json.loads((HERE/'material-classes.json').read_text());meta=json.loads((DATA/'pass-metadata.json').read_text());fit=json.loads((OUT/'fit.json').read_text())
def read(p):
    i=o.ImageInput.open(str(p));a=i.read_image(format=o.FLOAT);i.close();return a
def save(p,a):
    a=np.rint(np.clip(a,0,1)*255).astype(np.uint8);h,w=a.shape[:2];i=o.ImageOutput.create(str(p));i.open(str(p),o.ImageSpec(w,h,3,o.UINT8));i.write_image(a);i.close()
def classify(name):return next((k for k,r in classes.items() if name in r['names'] or any(name.startswith(x) for x in r['startsWith'])),None)
def rects(r,h,w):
    mask=np.zeros((h,w),bool)
    for x,y,ww,hh in r:mask[round(y*h/1254):round((y+hh)*h/1254),round(x*w/1254):round((x+ww)*w/1254)]=True
    return mask
def Y(a):return np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4)@np.array([.2126,.7152,.0722])
def trim(a,m):
    y=Y(a);lo,hi=np.quantile(y[m],[.1,.9]);return m&(y>=lo)&(y<=hi)
def stats(a):return {'count':len(a),'medianRGB':np.median(a,axis=0).tolist(),'quantileRGB':np.quantile(a,[.25,.5,.75],axis=0).tolist(),'medianDisplayLinearY':float(np.median(Y(a)))}
parts={};i=o.ImageInput.open(str(DATA/'calibration-pass512.exr'));n=0
while i.seek_subimage(n,0):parts[i.spec().channelnames[0].split('.')[1]]=i.read_image(format=o.FLOAT);n+=1
i.close();ids=np.rint(parts['Material Index'].squeeze()).astype(int);wet=parts['wet_coverage'].squeeze()
config=ocio.Config.CreateFromFile(meta['display']['ocioConfig']);processor=config.getProcessor(ocio.DisplayViewTransform(src='Linear Rec.709',display='sRGB',view='AgX')).getDefaultCPUProcessor()
raw_display=np.ascontiguousarray(parts['Combined'][:,:,:3]).copy();processor.applyRGB(raw_display.reshape(-1,3));raw_display=np.clip(raw_display,0,1)
files={'reference':Path(sel['reference']),'before':Path(sel['baseline']),'after':OUT/'scene04-reference-calibrated.png'};images={k:read(v)[:,:,:3] for k,v in files.items()}
grid=((np.arange(512)+.5)*1254/512).astype(int);sampled={k:a[grid[:,None],grid[None,:]] for k,a in images.items() if k!='reference'}
actual={}
for key,r in sel['regions'].items():
    target=rects(r['referenceRects'],1254,1254)
    if 'referenceChromaFilter' in r:
        f=r['referenceChromaFilter'];red,green,blue=np.moveaxis(images['reference'],-1,0);target&=(red>f['minR'])&(green/np.maximum(red,1e-5)>f['minGOverR'])&(green/np.maximum(red,1e-5)<f['maxGOverR'])&(blue/np.maximum(red,1e-5)<f['maxBOverR'])&(red-blue>f['minRMinusB'])
    target=trim(images['reference'],target);mask=rects(r['renderRects'],512,512)
    mask&=ids==0 if key=='sky' else np.isin(ids,[m['index'] for m in meta['materials'] if classify(m['name'])==key])
    if key=='paving':mask&=wet<r['maxSourceWetCoverage']
    mask=trim(raw_display,mask)
    values={'reference':stats(images['reference'][target]),'beforeActual':stats(sampled['before'][mask]),'afterActual':stats(sampled['after'][mask])}
    target_q=np.quantile(images['reference'][target],[.25,.5,.75],axis=0)
    for name in ['before','after']:
        q=np.quantile(sampled[name][mask],[.25,.5,.75],axis=0);values[name+'QuantileRMSE']=float(np.sqrt(np.mean((q-target_q)**2)))
    actual[key]=values

for role,key in [('reference','referenceRects'),('before','renderRects')]:
    a=images[role].copy()
    for r in sel['regions'].values():
        for x,y,w,h in r[key]:
            c=np.asarray(r['color']);a[y:y+3,x:x+w]=c;a[y+h-3:y+h,x:x+w]=c;a[y:y+h,x:x+3]=c;a[y:y+h,x+w-3:x+w]=c
    save(OUT/('selections-'+('reference' if role=='reference' else 'baseline')+'.png'),a)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(files['reference']),'-i',str(files['before']),'-i',str(files['after']),'-filter_complex','[0:v]setsar=1[a];[1:v]setsar=1[b];[2:v]setsar=1[c];[a][b][c]hstack=inputs=3[out]','-map','[out]','-frames:v','1',str(OUT/'comparison-original-before-after.png')],check=True)
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
report={'status':'actual-one-shot-fit-validation','analysisGrid':[512,512],'gridMeaning':'Nearest full-frame1254 pixel centre at the512 material-index grid. No extra render; source masks frozen from the one statistics pass.','referenceROIs':'selections.json','actualStatistics':actual,'frames':{k:{'file':str(v),'sha256':sha(v),'size':[1254,1254]} for k,v in files.items()},'comparisonOrder':['reference photograph','actual original Nishita','actual fitted1254 path trace'],'globalExposureEV':fit['exposureEV'],'classGains':fit['classGains'],'referenceTextureOrSpatialGain':False,'validationLimits':['The low-pass linear-response solver approximates indirect/metallic changes; these are actual1254 pixel statistics after full physical retracing.','Reference and source ROI geometry/shadow patterns differ. Common material categories do not establish measured albedo.']}
(OUT/'actual-statistics.json').write_text(json.dumps(report,indent=2)+'\n');shutil.copy2(DATA/'calibration-pass512.exr',OUT/'calibration-pass512.exr')
print(json.dumps({key:{'ref':v['reference']['medianRGB'],'before':v['beforeActual']['medianRGB'],'after':v['afterActual']['medianRGB'],'rmseBefore':v['beforeQuantileRMSE'],'rmseAfter':v['afterQuantileRMSE']} for key,v in actual.items()},indent=2))
