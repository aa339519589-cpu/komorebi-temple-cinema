// Hero peltate tissue keeps the closed upper/lower lamina and UV provenance
// of the source mesh. Correlated radial pleats continue into unequal rim
// lobes; this is authored geometry, not a photographed cutout or shader mask.
export function sculptForegroundLeaf211(source,seed=6){
 const g=source.clone(),p=g.attributes.position,uv=g.attributes.uv,half=p.count/2;
 for(let i=0;i<p.count;i++){
  const u=(uv.getX(i)-.5)/.49,v=(uv.getY(i)-.5)/.49,r=Math.min(1,Math.hypot(u,v)),a=Math.atan2(v,u),j=i%half,
   originalMid=(source.attributes.position.getY(j)+source.attributes.position.getY(j+half))/2,tissueOffset=p.getY(i)-originalMid,
   edge=1+.043*Math.sin(a*5+seed*.5)+.021*Math.sin(a*9-seed*.3)+.005*Math.cos(a*19),
   broadFold=(.021*Math.sin(a*3+seed*.7)+.014*Math.sin(a*5-seed*.4))*r**2,
   finePleat=.0027*Math.sin(a*19+.10*Math.sin(r*4))*r**.9*(1-.20*r),
   rim=(.019+.012*Math.sin(a*4+seed)+.007*Math.sin(a*7-seed*.4))*r**9,
   asym=.017*Math.sin(a+seed*.66)*r*r,
   sector=Math.atan2(Math.sin(a-seed*.80),Math.cos(a-seed*.80)),opposite=Math.atan2(Math.sin(a-seed*.80+2.2),Math.cos(a-seed*.80+2.2)),
   localCurl=(.055*Math.exp(-((sector/.44)**2))-.022*Math.exp(-((opposite/.50)**2)))*r**7,
   y=-.025+.063*r*r+broadFold+finePleat+rim+asym+localCurl;
  p.setXYZ(i,Math.cos(a)*r*edge*.5,y+tissueOffset,Math.sin(a)*r*edge*(.455+.018*Math.sin(seed)));
 }
 p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 g.name='scene03-211-shallow-peltate-tissue-with-broad-folds-r12';
 g.userData={...source.userData,revision:'211-r12',sourceGeometry:source.name,authoredBroadFolds:true,referenceRGB:false,topologyRetained:true,attachmentLocalY:-.02625};
 return g;
}
export const foregroundPlacement211=Object.freeze({
 shadeLeaf:{position:[-1.98,.04,15.33],size:1.55,rotation:[.14,-.30,.10],variant:3,tint:.82},
 mainFlower:{position:[-2.245,.43,14.70],size:.46},
 retainedCamera:true,referenceRGB:false,
 scope:'Authored foreground layout from the fixed low camera; projected bounds guide placement, not photographic acceptance'
});
