"""CPU-only statistic fit of one actual scene-linear pass, using Blender OCIO."""
import json,math,hashlib
from pathlib import Path
import numpy as np
import OpenImageIO as oiio
import PyOpenColorIO as ocio

HERE=Path('lookdev/scene04-reference-calibration');OUT=HERE/'results';OUT.mkdir(exist_ok=True)
DATA=Path('output/scene04-reference-calibration');PACKAGE=Path('output/scene04-physical-frozen-export')
selection=json.loads((HERE/'selections.json').read_text());classes=json.loads((HERE/'material-classes.json').read_text());metadata=json.loads((DATA/'pass-metadata.json').read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def classify(name):return next((k for k,r in classes.items() if name in r['names'] or any(name.startswith(x) for x in r['startsWith'])),None)
def read_image(path):
    i=oiio.ImageInput.open(str(path));a=i.read_image(format=oiio.FLOAT);i.close();return a
reference=read_image(selection['reference'])[:,:,:3];baseline=read_image(selection['baseline'])[:,:,:3]
parts={};i=oiio.ImageInput.open(str(DATA/'calibration-pass512.exr'));sub=0
while i.seek_subimage(sub,0):
    channels=i.spec().channelnames;name=channels[0].split('.')[1];parts[name]=i.read_image(format=oiio.FLOAT);sub+=1
i.close();linear=parts['Combined'][:,:,:3];h,w=linear.shape[:2];ids=np.rint(parts['Material Index'].squeeze()).astype(int)
diffuse=np.maximum(0,(parts['Diffuse Direct']+parts['Diffuse Indirect'])*parts['Diffuse Color']);diffuse=np.minimum(diffuse,linear)
wet=parts['wet_coverage'].squeeze();metallic=np.zeros((h,w))
for rec in metadata['materials']:metallic[ids==rec['index']]=rec['metalness']
config=ocio.Config.CreateFromFile(metadata['display']['ocioConfig']);transform=ocio.DisplayViewTransform(src='Linear Rec.709',display=metadata['display']['device'],view=metadata['display']['view'])
if metadata['display']['look']!='None':raise ValueError('This fit requires the recorded neutral AgX look')
processor=config.getProcessor(transform).getDefaultCPUProcessor()
def display(values,ev=0):
    a=np.ascontiguousarray(np.maximum(values,0)*2**ev,dtype=np.float32);processor.applyRGB(a);return np.clip(a,0,1)
def srgb_decode(a):return np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4)
def luminance(a):return srgb_decode(a)@np.asarray([.2126,.7152,.0722])
def rect_mask(rects,height,width):
    mask=np.zeros((height,width),dtype=bool)
    for x,y,ww,hh in rects:
        x0,x1=round(x*width/1254),round((x+ww)*width/1254);y0,y1=round(y*height/1254),round((y+hh)*height/1254);mask[y0:y1,x0:x1]=True
    return mask
def trim_mask(rgb,mask):
    values=luminance(rgb);lo,hi=np.quantile(values[mask],selection['robustStatistics']['luminanceTrimQuantiles']);return mask&(values>=lo)&(values<=hi)
def stats(a):return {'count':len(a),'medianRGB':np.median(a,axis=0).tolist(),'rgbQuantiles':np.quantile(a,[.1,.25,.5,.75,.9],axis=0).tolist(),'medianDisplayLinearY':float(np.median(luminance(a)))}
targets={};masks={};baseline_display=display(linear.reshape(-1,3)).reshape(h,w,3)
for key,r in selection['regions'].items():
    target_mask=rect_mask(r['referenceRects'],1254,1254)
    if 'referenceChromaFilter' in r:
        f=r['referenceChromaFilter'];red=reference[:,:,0];green=reference[:,:,1];blue=reference[:,:,2];target_mask&=(red>f['minR'])&(green/np.maximum(red,1e-5)>f['minGOverR'])&(green/np.maximum(red,1e-5)<f['maxGOverR'])&(blue/np.maximum(red,1e-5)<f['maxBOverR'])&(red-blue>f['minRMinusB'])
    target_mask=trim_mask(reference,target_mask);targets[key]=reference[target_mask]
    source_mask=rect_mask(r['renderRects'],h,w)
    source_mask&=ids==0 if key=='sky' else np.isin(ids,[m['index'] for m in metadata['materials'] if classify(m['name'])==key])
    if key=='paving':source_mask&=wet<r['maxSourceWetCoverage']
    source_mask=trim_mask(baseline_display,source_mask);masks[key]=source_mask
    if source_mask.sum()<30 or len(targets[key])<100:raise ValueError('Insufficient unambiguous ROI samples '+key)

# One scalar exposure from clear sky. Search is numerical OCIO evaluation of
# the same raw sky samples; no rendered parameter sweep or spatial correction.
sky_linear=linear[masks['sky']];target_y=float(np.median(luminance(targets['sky'])))
lo,hi=-2.,4.
for iteration in range(36):
    ev=(lo+hi)/2;predicted=float(np.median(luminance(display(sky_linear,ev))))
    if predicted<target_y:lo=ev
    else:hi=ev
exposure=(lo+hi)/2

# Bound effective albedo, not a white texture multiplier in isolation. The
# original maps/linear source colours/instance tints remain untouched.
scene=json.loads((PACKAGE/'scene.json').read_text());tex={t['id']:t for t in scene['textures']};geos={g['id']:g for g in scene['geometries']};records={m['id']:m for m in scene['materials']};max_tint={m['id']:np.ones(3) for m in scene['materials']}
def binary(rec):return np.fromfile(PACKAGE/'assets'/rec['file'],dtype={'Float32Array':'<f4','Uint32Array':'<u4','Uint16Array':'<u2'}[rec['type']])
for mesh in scene['meshes']:
    if not any(classify(records[mid]['name']) for mid in mesh['materials']):continue
    tint=np.ones(3);color=geos[mesh['geometry']]['attributes'].get('color')
    if color:tint*=binary(color).reshape(-1,color['itemSize'])[:,:3].max(axis=0)
    if 'instanceColors' in mesh:tint*=binary(mesh['instanceColors']).reshape(-1,3).max(axis=0)
    for mid in mesh['materials']:max_tint[mid]=np.maximum(max_tint[mid],tint)
albedo_max={k:np.zeros(3) for k in classes};material_members={k:[] for k in classes}
for rec in scene['materials']:
    key=classify(rec['name'])
    if not key:continue
    color=np.asarray(rec.get('color') or [1,1,1]);texture_max=np.ones(3)
    if 'map' in rec['textures']:
        t=tex[rec['textures']['map']];a=read_image(PACKAGE/'assets'/t['file'])[:,:,:3];a=srgb_decode(a) if t.get('colorSpace')=='srgb' else a;texture_max=a.max(axis=(0,1))
    albedo_max[key]=np.maximum(albedo_max[key],color*texture_max*max_tint[rec['id']]);material_members[key].append(rec['name'])

quantiles=selection['robustStatistics']['fitRGBQuantiles'];weights=np.sqrt(np.repeat(selection['robustStatistics']['quantileWeights'],3))
fitted={};summary={}
for key in classes:
    mask=masks[key];L=linear[mask].astype(np.float64);D=diffuse[mask].astype(np.float64)
    # Dielectric specular/coat stays fixed in this one-pass approximation.
    # Metal colours also affect the reflective lobe; use the existing metallic
    # fraction as a first-order response, not a recovered optical measurement.
    T=D+(L-D)*metallic[mask,None] if key=='gilding' else D;U=np.maximum(0,L-T)
    target=np.quantile(targets[key],quantiles,axis=0)
    upper=np.minimum(6.,.95/np.maximum(albedo_max[key],1e-6));lower=np.full(3,1e-4);bounds=(np.log(lower),np.log(upper))
    def residual(x):return (np.quantile(display(U+T*np.exp(x),exposure),quantiles,axis=0)-target).ravel()*weights
    x=np.clip(np.zeros(3),*bounds);history=[]
    for iteration in range(32):
        r=residual(x);loss=float(r@r);history.append(loss);J=[]
        for c in range(3):
            y=x.copy();y[c]+=.015;J.append((residual(y)-r)/.015)
        step=np.linalg.lstsq(np.asarray(J).T,-r,rcond=1e-6)[0];step=np.clip(step,-.55,.55)
        choices=[np.clip(x+step*a,*bounds) for a in [1,.5,.25,.125,.0625]];losses=[float(residual(y)@residual(y)) for y in choices];best=int(np.argmin(losses))
        if losses[best]>=loss-1e-9:break
        x=choices[best]
    gain=np.exp(x);prediction=display(U+T*gain,exposure);fitted[key]=gain.tolist()
    summary[key]={'target':stats(targets[key]),'baseline':stats(baseline_display[mask]),'exposureOnlyPrediction':stats(display(L,exposure)),'fittedOnePassPrediction':stats(prediction),'gainRGB':gain.tolist(),'gainBoundsRGB':[lower.tolist(),upper.tolist()],'effectiveSourceAlbedoMaxRGB':albedo_max[key].tolist(),'effectiveFittedAlbedoMaxRGB':(albedo_max[key]*gain).tolist(),'materials':material_members[key],'weightedLossHistory':history,'finalWeightedLoss':float(residual(x)@residual(x)),'sourceMaskPixelCount':int(mask.sum()),'response':'D*g + fixed remainder; gilding includes metallic fraction of remainder','meanBaseSensitiveFractionRGB':np.mean(T/np.maximum(L,1e-7),axis=0).tolist()}

report={'status':'one-pass-statistical-artistic-fit','sourceHash':metadata['sourceHash'],'selectionFile':'selections.json','selectionSHA256':sha(HERE/'selections.json'),'classesFile':'material-classes.json','classesSHA256':sha(HERE/'material-classes.json'),'rawPass':str(DATA/'calibration-pass512.exr'),'rawPassSHA256':sha(DATA/'calibration-pass512.exr'),'ocioConfig':metadata['display'],'ocioConfigSHA256':sha(metadata['display']['ocioConfig']),'exposureEV':exposure,'linearExposureGain':2**exposure,'sky':{'target':stats(targets['sky']),'baseline':stats(baseline_display[masks['sky']]),'exposurePrediction':stats(display(sky_linear,exposure)),'solve':'Bisection on median decoded display luminance through actual neutral AgX/sRGB OCIO; single global exposure.'},'classGains':fitted,'classes':summary,'parameterCount':13,'spatialReferenceTransfer':False,'actualCalibrationRenders':1,'actualFullRendersBeforeFit':0,'method':'Reference RGB quantiles in declared ROIs; material IDs and wet-film coverage isolate source samples. Bounded log-gain Gauss-Newton evaluates the fixed linear-response approximation through OCIO. No rendered sweep.','limits':['Single photograph artistic appearance hypothesis; neither true camera response nor measured reflectance recovered.','The one-pass response approximates GI recolouring, metal Fresnel and energy redistribution; the final path trace is the actual validation.','Sky chromaticity is not fitted separately, and material texture/spatial light variation is retained.']}
(OUT/'fit.json').write_text(json.dumps(report,indent=2)+'\n');(OUT/'pass-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps({'exposureEV':exposure,'skyTargetRGB':report['sky']['target']['medianRGB'],'skyPredictionRGB':report['sky']['exposurePrediction']['medianRGB'],'gains':fitted,'losses':{k:v['finalWeightedLoss'] for k,v in summary.items()}},indent=2))
