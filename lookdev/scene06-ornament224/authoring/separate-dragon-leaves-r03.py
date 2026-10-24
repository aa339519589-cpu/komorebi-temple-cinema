from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np,json,hashlib,shutil
root=Path(__file__).resolve().parents[1]
asset=root/'candidate-root/reconstructions/scene-06/assets/ornament224-r01'
w,h=1536,256
r02=np.frombuffer((asset/'dragon-peony-mass-chisel-r02.gray8.bin').read_bytes(),dtype=np.uint8).reshape((3,h,w))
mask=Image.new('L',(w,h));draw=ImageDraw.Draw(mask)
head=[(.015,.25),(.055,.14),(.16,.15),(.26,.02),(.21,.29),(.25,.42),(.19,.67),(.10,.71),(.04,.56),(.01,.39)]
draw.polygon([(round(x*w),round(y*h))for x,y in head],fill=255)
spine=[(.19,.34),(.22,.60),(.25,.73),(.29,.67),(.32,.46),(.35,.32),(.39,.32),(.43,.45),(.47,.62),(.52,.74),(.57,.69),(.61,.49),(.64,.28),(.68,.28),(.72,.42),(.77,.65),(.82,.73),(.86,.67),(.89,.47),(.92,.27),(.96,.16)]
pts=[]
for k in range(len(spine)-1):
 p0=np.array(spine[max(0,k-1)]);p1=np.array(spine[k]);p2=np.array(spine[k+1]);p3=np.array(spine[min(len(spine)-1,k+2)])
 for t in np.linspace(0,1,24,endpoint=False):
  p=.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)
  pts.append((round(p[0]*w),round(p[1]*h)))
pts.append((round(spine[-1][0]*w),round(spine[-1][1]*h)))
draw.line(pts,fill=255,width=53,joint='curve')
mask=mask.filter(ImageFilter.GaussianBlur(7.0))
m=np.asarray(mask)
out=asset/'dragon-leaf-separated-r03.gray8.bin';out.write_bytes(r02.tobytes()+m.tobytes())
mask.save(root/'authoring/r03-authored-dragon-domain.png')
r={'revision':'ornament224-r03','sourceMultiscaleSha256':hashlib.sha256((asset/'dragon-peony-mass-chisel-r02.gray8.bin').read_bytes()).hexdigest(),'scalarSha256':hashlib.sha256(out.read_bytes()).hexdigest(),'layout':'4 planar1536x256 gray8 fields: original sculpt scalar; broad mass; geometric edge distance; manually authored soft dragon domain','authoringDomain':{'basis':'Manual author interpretation over the independent generated sculpture guide, not a trace of photograph geometry. Domain affects sculpt depth only; never rendered as RGB.','headPolygonNormalized':head,'bodySpineNormalized':spine,'spineWidthPixels':53,'softTransitionSigmaPixels':7.0},'geometryChange':'Dragon body retains maximum34mm macro relief. Subordinate leaf/cloud plane uses28percent of that relief and predominantly broad guide curvature, replacing uniform distance-field puffing. Fine chisels remain submillimeter.','frameCoverage':[.87,.78],'material':'exact clone of the inherited198 tableGilt198 old gold, same color/roughness/metalness/environment response; no per-frame filter','visualAccepted':False,'photographicAccepted':False}
(asset/'dragon-leaf-separated-r03-provenance.json').write_text(json.dumps(r,indent=2))
# Preserve newly generated family guides away from the frozen R02 scene until selected.
for name,src,prompt in [('two-families-r03','exec-72dbf2ca-8c55-4180-b951-ec51df035759.png','prompt-r03-two-families.txt'),('compact-dragon-r04','exec-16c5647c-c9bd-4d85-9722-a965ce907910.png','prompt-r04-compact-dragon.txt')]:
 target=root/'cpu-drafts'/name;target.mkdir(parents=True,exist_ok=True)
 source=Path('/Users/mima1234/.codex/generated_images/01a16ad8-2849-70f3-ab04-8a69688ed364')/src
 shutil.copy2(source,target/'independent-guide.png');shutil.copy2(root/'authoring'/prompt,target/'prompt.txt')
 p={'asset':name,'generator':'built-in image_gen via imagegen skill','guideSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'promptSha256':hashlib.sha256((target/'prompt.txt').read_bytes()).hexdigest(),'reference':'Photograph06 used only for altar vocabulary and organization; independent author form, not artifact scan','use':'CPU geometry draft only, no integration selected','imageMaterialUsed':False,'visualAccepted':False,'photographicAccepted':False,'licenseScope':'New inferred authored form; surrounding scene mixed CC BY/CC BY-NC-SA licenses preserved.'}
 (target/'provenance.json').write_text(json.dumps(p,indent=2))
print(json.dumps(r,indent=2))
