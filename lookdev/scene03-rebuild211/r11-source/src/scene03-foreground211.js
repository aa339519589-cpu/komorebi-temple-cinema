// Hero peltate tissue keeps the closed upper/lower lamina and UV provenance
// of the source mesh. Correlated radial pleats continue into unequal rim
// lobes; this is authored geometry, not a photographed cutout or shader mask.
export function sculptForegroundLeaf211(source,seed=6){
 const g=source.clone(),p=g.attributes.position,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++){
  const u=(uv.getX(i)-.5)/.49,v=(uv.getY(i)-.5)/.49,r=Math.min(1,Math.hypot(u,v)),a=Math.atan2(v,u);
  const radial=1+.035*Math.sin(a*9+seed*.5)*r**7+.014*Math.sin(a*19)*r**10;
  const fold=.019*Math.sin(a*19+seed*.12)*(.15*r+.85*r**1.4),rim=.022*Math.sin(a*6+seed)*r**8,asym=.013*Math.sin(a*3+seed*.8)*r**3;
  p.setXYZ(i,p.getX(i)*radial,p.getY(i)+fold+rim+asym,p.getZ(i)*radial);
 }
 p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 g.name='scene03-211-closed-hero-lamina-with-coherent-rim-pleats-r07';
 g.userData={...source.userData,revision:'211-r07',sourceGeometry:source.name,authoredHeroPleats:true,referenceRGB:false,topologyRetained:true};
 return g;
}
export const foregroundPlacement211=Object.freeze({
 shadeLeaf:{position:[-1.98,.04,15.33],size:1.55,rotation:[.14,-.30,.10],variant:3,tint:.82},
 mainFlower:{position:[-2.245,.43,14.70],size:.46},
 retainedCamera:true,referenceRGB:false,
 scope:'Authored foreground layout from the fixed low camera; projected bounds guide placement, not photographic acceptance'
});
