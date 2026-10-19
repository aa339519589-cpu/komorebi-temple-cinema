"""Five native-image structural anchors; one connected physical lantern pose.

Use numpy/Pillow. No photograph pixels become scene geometry or texture data.
Ground contact is fixed at water-relative Y=.15; the common pose and measured
levels stay connected, rather than independently placing each image feature.
"""
from pathlib import Path
import json,math
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa/ten-reference/02/iteration-stonelantern120-b'
OUT.mkdir(parents=True,exist_ok=True)
W=1254;C=np.array([16.2,2.72,25.]);TARGET=np.array([-1.,4.7,-7.]);Z=TARGET-C;Z/=np.linalg.norm(Z);X=np.cross(Z,[0,1.,0]);X/=np.linalg.norm(X);Y=np.cross(X,Z);f=627/np.tan(np.deg2rad(52)/2)
def project(v):
 p=np.atleast_2d(v)-C;return np.stack([627+f*(p@X)/(p@Z),627-f*(p@Y)/(p@Z)],axis=-1)
def ray_at_y(pixel,y):
 d=Z+(pixel[0]-627)/f*X-(pixel[1]-627)/f*Y;return C+d*((y-C[1])/d[1])
anchor=ray_at_y([51,887],.15);yaw=-.15;co,si=np.cos(yaw),np.sin(yaw)
def local(p):return np.asarray(p)@np.array([[co,0,-si],[0,1,0],[si,0,co]])+anchor
# Five anchors are structural contour tips or the centres of visible horizontal
# contour edges, read on the original 1254px reference (uncertainty +/-4px).
landmarks=[
 ('L1','stone finial tip',[58,586],[0,4.09,0],[-3.8,3.90,8]),
 ('L2','right curved roof corner',[130,634],[.68,3.44,-.68],None),
 ('L3','centre of fire-bag seat edge',[55,704],[0,2.48,0],[-3.8,2.24,8]),
 ('L4','centre of shaft foot edge',[52,824],[0,.85,0],[-3.8,.40,8]),
 ('L5','centre of lower masonry foot edge',[51,887],[0,0,0],[-3.8,0,8]),
]
# The former six-sided roof's right tip at its original broad eave radius.
old_roof=[]
for side in range(6):
 co0,si0=np.cos(side*np.pi/3),np.sin(side*np.pi/3)
 for u in np.linspace(-1,1,201):
  x,z=u*.63*.57735,.63
  old_roof.append([-3.8+co0*x+si0*z,2.94+.12*abs(u)**4,8-si0*x+co0*z])
old_px=project(old_roof);old_roof_right=old_px[old_px[:,0].argmax()]
rows=[]
for ident,desc,ref,p,before in landmarks:
 after=project(local([p]))[0];old=project([before])[0] if before is not None else old_roof_right
 rows.append({'id':ident,'description':desc,'referencePixel':ref,'beforeProjection':old.tolist(),'afterProjection':after.tolist(),'beforeErrorPixels':math.dist(ref,old),'afterErrorPixels':math.dist(ref,after),'nativeReadUncertaintyPixels':4})
report=json.loads((OUT/'report.json').read_text());contact=json.loads((OUT/'geometry-contact-inspection.json').read_text())
review={'status':'foreground structure/layout candidate; full photographic fidelity unaccepted','visualAccepted':False,'reference':'references/hd/1-照片-2.jpg','nativeReferenceSize':[1254,1254],
 'before':{'actual':'qa/ten-reference/02/iteration-layout117-c/reference.png','commit':'0d9840537b7afc43c25cf56bc0429dd5ef50b8f8','sourceHash':'2f2e782ff042ec1c242732fed4f2dc2a1465e2fa48098ae6fb6099b94201d9bd'},
 'after':{'actual':'qa/ten-reference/02/iteration-stonelantern120-b/reference.png','nativeCrop':'qa/ten-reference/02/iteration-stonelantern120-b/detail-native.png','sourceHash':report['source']['hash'],'report':'qa/ten-reference/02/iteration-stonelantern120-b/report.json'},
 'camera':{'position':C.tolist(),'target':TARGET.tolist(),'fov':52,'unchanged':True},
 'recovery':{'method':'One common axis recovered from lower-foot contour and fixed supported contact height. Connected levels, square sections and curved roof width follow five reference contour anchors; silhouette/whole-frame fidelity is not inferred from these points.','contactWorldY':.15,'recoveredAnchor':anchor.tolist(),'implementedAnchor':[.99884134,.15,13.20506184],'commonYaw':yaw,'heightMetres':4.09,'roofSquareWidthMetres':1.36,'fireBagSideMetres':.86,'squareStemSidesMetres':[.50,.43],'landmarks':rows,'selectedProjectionRmsBeforePixels':math.sqrt(sum(p['beforeErrorPixels']**2 for p in rows)/5),'selectedProjectionRmsAfterPixels':math.sqrt(sum(p['afterErrorPixels']**2 for p in rows)/5),'interpretation':'Selected structural anchor projection only, not image/photographic similarity.'},
 'depthAndContact':{'oldLampOverlappedBridgeFootprint':contact['bridgeClearance']['oldLampFootprintOverlapsBridge'],'newRoofToConservativeBridgeFootprintClearanceMetres':contact['bridgeClearance']['minimumHorizontalClearanceMetres'],'bridgeLeftFinialVisibleInNativeActual':True,'footingNativeBoundsApproximate':{'reference':[0,860,130,965],'actual':[0,881,123,943],'uncertaintyPixels':6},'masonryToRockGapMetres':0,'roofFlatBearingGapMetres':contact['roofSupport']['gapMetres'],'geometryInspection':'geometry-contact-inspection.json','naturalStoneMass':'Peripheral rock solids intersect the bearing rock as one continuous natural mass. They do not independently support a floating pedestal.','sideGeometryCheck':'Actual closed-mesh cross sections and all connected stage levels inspected on CPU; no side-camera GPU job used.'},
 'heldGeometry':['reconstructions/scene-02/architecture.js','reconstructions/scene-02/layout117.js','reconstructions/scene-02/kernel.js','reconstructions/scene-02/veranda-rail117.js','reconstructions/scene-02/veranda-boards.js','reconstructions/scene-02/pagoda-ground.js'],
 'materials':{'scan':'Existing scene07 CC0 Poly Haven Granite Tile04 single-face crop, copied with provenance.','metricRepeatMetres':.3173828125,'referencePixelsUsed':False},
 'renderBudget':{'wrapperJobs':2,'native1254FullFrames':2,'nativeSubfrustumFrames':2,'runner':'tools/render-one-reconstruction.mjs','sharedMutexUsed':True,'softwareTestSuitesRun':False},
 'retainedCandidateA':{'actual':'qa/ten-reference/02/iteration-stonelantern120-a/reference.png','status':'superseded; rock footing did not extend far enough into foreground, and roof underside/stack contacts needed explicit correction'},
 'nativeVisualReview':{'improved':['Entire lantern moved to the left foreground instead of occupying the bridge-end post.','Roof, fire-bag, square shaft and masonry foot have the intended broad vertical arrangement.','Bridge left cap is now visible.','Rock footing bears the masonry and extends into the foreground; pond foliage is clipped only from the new solid footprint.'],
 'remaining':['Stone light/colour response and window grille remain substantially simpler than the supplied photograph.','Fire-bag/platform widths and rock silhouette remain approximate; some contours differ around 8–12 native pixels.','The footing is still plainer and less planted than the reference; its front extent remains roughly 20–30px short in this native view.','Main-scene planting, lighting, crude remaining stair/shore geometry and general photo fidelity were not accepted by this target pass.']}}
(OUT/'landmark-contact-and-visual-review.json').write_text(json.dumps(review,indent=2)+'\n')
# Native-pixel local comparison: crop only, no scaling or replacement imagery.
region=(0,560,430,990);panels=[('SUPPLIED REFERENCE',ROOT/'references/hd/1-照片-2.jpg'),('BEFORE / layout117-c',ROOT/'qa/ten-reference/02/iteration-layout117-c/reference.png'),('AFTER / stone-lantern120-b',OUT/'reference.png')]
im=Image.new('RGB',(1290,466),(24,22,20));draw=ImageDraw.Draw(im)
for i,(label,path) in enumerate(panels):im.paste(Image.open(path).convert('RGB').crop(region),(i*430,36));draw.text((i*430+12,12),label,fill='white')
im.save(OUT/'reference-before-after-native.png')
for name,path,key in [('reference',panels[0][1],'referencePixel'),('after',panels[2][1],'afterProjection')]:
 im=Image.open(path).convert('RGB');d=ImageDraw.Draw(im)
 for p in rows:
  x,y=p[key];d.ellipse((x-5,y-5,x+5,y+5),outline='yellow',width=2);d.text((x+8,y-10),p['id'],fill='white',stroke_width=2,stroke_fill='black')
 im.crop(region).save(OUT/(name+'-anchor-overlay-native.png'))
print(json.dumps({'anchor':anchor.tolist(),'projectionBeforeRms':review['recovery']['selectedProjectionRmsBeforePixels'],'projectionAfterRms':review['recovery']['selectedProjectionRmsAfterPixels'],'visualAccepted':False,'sourceHash':report['source']['hash']}))
