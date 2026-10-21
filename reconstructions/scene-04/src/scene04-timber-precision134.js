import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// The surface grain is authored material detail, never source-photograph RGB.
// Its U direction follows the longest visible direction of each timber face.
// These UVs are actual geometry attributes and survive the official export.
export function createPrecisionTimberFactory04(){
 const cache=new Map();
 function box(w,h,d){
  const key=[w,h,d].map(v=>v.toFixed(5)).join(':');
  if(cache.has(key))return cache.get(key);
  const radius=Math.min(.0065,Math.min(w,h,d)*.075),g=new RoundedBoxGeometry(w,h,d,1,radius),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,dims=[w,h,d];
  for(let i=0;i<p.count;i++){
   const q=[p.getX(i),p.getY(i),p.getZ(i)],nn=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],normalAxis=nn.indexOf(Math.max(...nn)),axes=[0,1,2].filter(a=>a!==normalAxis).sort((a,b)=>dims[b]-dims[a]);
   uv.setXY(i,q[axes[0]]/1.45+.37,q[axes[1]]/.38+.23);
  }
  g.userData.architectureMember='134-bevelled-metric-grain-timber';g.userData.precision={edgeRadiusMetres:radius,longitudinalTextureMetres:1.45,transverseTextureMetres:.38};cache.set(key,g);return g;
 }
 return{box,cache};
}

export function setTurnedShaftTimberUV04(g){
 const p=g.attributes.position,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);uv.setXY(i,y/1.45+.37,Math.atan2(z,x)*Math.hypot(x,z)/.38+.23);}
 g.userData.timberUV={grainDirection:'vertical shaft axis',longitudinalTextureMetres:1.45,transverseTextureMetres:.38};return g;
}
