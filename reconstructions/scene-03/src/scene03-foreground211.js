// Hero peltate tissue keeps the closed upper/lower lamina and UV provenance
// of the source mesh. Correlated radial pleats continue into unequal rim
// lobes; this is authored geometry, not a photographed cutout or shader mask.
export function sculptForegroundLeaf211(source,seed=6){
 const g=source.clone(),p=g.attributes.position,uv=g.attributes.uv,half=p.count/2;
 for(let i=0;i<p.count;i++){
  const u=(uv.getX(i)-.5)/.49,v=(uv.getY(i)-.5)/.49,r=Math.min(1,Math.hypot(u,v)),a=Math.atan2(v,u),j=i%half,
   originalMid=(source.attributes.position.getY(j)+source.attributes.position.getY(j+half))/2,tissueOffset=p.getY(i)-originalMid,
   visible=Math.atan2(Math.sin(a-.35),Math.cos(a-.35)),backRim=Math.atan2(Math.sin(a-5.0),Math.cos(a-5.0)),
   edge=1+.080*Math.sin(a*5+seed*.5)+.040*Math.sin(a*9-seed*.3)+.012*Math.cos(a*19)+(seed===5?.18*Math.exp(-((visible/.65)**2)):0),
   broadFold=(.042*Math.sin(a*3+seed*.7)+.028*Math.sin(a*5-seed*.4))*r**2,
   finePleat=.0027*Math.sin(a*19+.10*Math.sin(r*4))*r**.9*(1-.20*r),
   rim=(.035+.024*Math.sin(a*4+seed)+.014*Math.sin(a*7-seed*.4))*r**9,
   asym=.017*Math.sin(a+seed*.66)*r*r,
   sector=Math.atan2(Math.sin(a-seed*.80),Math.cos(a-seed*.80)),opposite=Math.atan2(Math.sin(a-seed*.80+2.2),Math.cos(a-seed*.80+2.2)),
   localCurl=(.095*Math.exp(-((sector/.44)**2))-.038*Math.exp(-((opposite/.50)**2)))*r**7,
   visibleFold=seed===5?.055*Math.sin(visible*5)*Math.exp(-((visible/.75)**2))*r**2.2+.035*Math.exp(-((backRim/.48)**2))*r**7:0,
   y=-.025+.063*r*r+broadFold+finePleat+rim+asym+localCurl+visibleFold;
  p.setXYZ(i,Math.cos(a)*r*edge*.5,y+tissueOffset,Math.sin(a)*r*edge*(.455+.018*Math.sin(seed)));
 }
 p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 g.name='scene03-211-peltate-tissue-with-visible-edge-folds344-r03';
 g.userData={...source.userData,revision:'344-r03',sourceGeometry:source.name,authoredBroadFolds:true,visibleSectorSculpt:true,referenceRGB:false,topologyRetained:true,attachmentLocalY:-.02625};
 return g;
}
export const foregroundPlacement211=Object.freeze({
 shadeLeaf:{position:[-2.3037,.4144,17.1250],size:.651,rotation:[.14,-.30,.10],variant:3,tint:.82},
 mainFlower:{position:[-2.305,.595,16.95],size:1,diameterMetres:.26},
 nearLeaf:{position:[-2.7589,.7069,17.1344],size:.630,rotation:[.67,.55,-.28],variant:2,tint:.88},
 retainedCamera:true,referenceRGB:false,
 scope:'26cm flower; 63–65cm foreground leaves moved along fixed architectural reference-camera rays. Inferred dimensions and projected bounds, not botanical measurement or photographic acceptance'
});
