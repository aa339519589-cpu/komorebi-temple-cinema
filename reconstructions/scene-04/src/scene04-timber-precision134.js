import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {Float32BufferAttribute} from 'three';

export function setTimberEndGrainAttributes212(g,longAxis){
 const p=g.attributes.position,n=g.attributes.normal,axes=[0,1,2].filter(a=>a!==longAxis),end=new Float32Array(p.count),uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){const q=[p.getX(i),p.getY(i),p.getZ(i)],nn=[n.getX(i),n.getY(i),n.getZ(i)],f=Math.max(0,Math.min(1,(Math.abs(nn[longAxis])-.72)/.26));end[i]=f*f*(3-2*f);uv[i*2]=q[axes[0]];uv[i*2+1]=q[axes[1]];}
 g.setAttribute('timber212End',new Float32BufferAttribute(end,1));g.setAttribute('timber212EndUv',new Float32BufferAttribute(uv,2));return g;
}
export function ensureTimberEndGrainAttributes212(g){
 const n=g.attributes.position.count;if(!g.attributes.timber212End)g.setAttribute('timber212End',new Float32BufferAttribute(new Float32Array(n),1));if(!g.attributes.timber212EndUv)g.setAttribute('timber212EndUv',new Float32BufferAttribute(new Float32Array(n*2),2));return g;
}

// The surface grain is authored material detail, never source-photograph RGB.
// Its U direction follows the longest visible direction of each timber face.
// These UVs are actual geometry attributes and survive the official export.
export function createPrecisionTimberFactory04(){
 const cache=new Map();
 function box(w,h,d){
  const key=[w,h,d].map(v=>v.toFixed(5)).join(':');
  if(cache.has(key))return cache.get(key);
  const radius=Math.min(.018,Math.min(w,h,d)*.09),g=new RoundedBoxGeometry(w,h,d,2,radius),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,dims=[w,h,d],longAxis=dims.indexOf(Math.max(...dims));
  for(let i=0;i<p.count;i++){
   const q=[p.getX(i),p.getY(i),p.getZ(i)],nn=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],normalAxis=nn.indexOf(Math.max(...nn)),axes=[0,1,2].filter(a=>a!==normalAxis).sort((a,b)=>dims[b]-dims[a]);
   uv.setXY(i,q[axes[0]]/1.45+.37,q[axes[1]]/.38+.23);
  }
  setTimberEndGrainAttributes212(g,longAxis);g.userData.architectureMember='212-real-rounded-arrises-and-transverse-end-grain';g.userData.precision={edgeRadiusMetres:radius,bevelSegments:2,longitudinalTextureMetres:1.45,transverseTextureMetres:.38,physicalEndGrainAxis:longAxis};cache.set(key,g);return g;
 }
 return{box,cache};
}

export function setTurnedShaftTimberUV04(g){
 const p=g.attributes.position,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);uv.setXY(i,y/1.45+.37,Math.atan2(z,x)*Math.hypot(x,z)/.38+.23);}
 g.userData.timberUV={grainDirection:'vertical shaft axis',longitudinalTextureMetres:1.45,transverseTextureMetres:.38};return g;
}
