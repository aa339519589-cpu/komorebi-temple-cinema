import * as T from 'three';
import {garden130BridgeKnots,approach214} from './layout118-data.js';

// The terrace is cut into a planted hillside. A narrow stream passes under
// the bridge and widens toward the veranda, instead of removing the ground
// underneath the entire hall. All heights are scene-authored metres.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const hpoint=(x,y,z)=>{const c=Math.cos(-.25),s=Math.sin(-.25);return[4.6+c*x+s*z,y,-9-s*x+c*z];};
const routeSegments=[
 [hpoint(0,7.50,5.15),hpoint(0,5.80,8.03),2.425],
 [hpoint(0,5.80,8.03),hpoint(0,5.80,9.0),2.425],
 [hpoint(2.10,5.80,9.0),garden130BridgeKnots.at(-1),1.275],
 [garden130BridgeKnots.at(-1),approach214.rightEnd,1.4],
 [approach214.rightEnd,approach214.gardenTurn,1.4]
];
const approachSegments=routeSegments.slice(3);
const bridgePoints=garden130BridgeKnots.map(p=>p.slice());
const bridgeSegments=bridgePoints.slice(1).map((p,i)=>[bridgePoints[i],p,1.4]);
export function gardenWalkHeight214(x,z,margin=0){
 let lowest=Infinity;
 for(const [a,b,halfWidth]of [...routeSegments,...bridgeSegments]){const dx=b[0]-a[0],dz=b[2]-a[2],raw=((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz);if(raw<-.03||raw>1.03)continue;const t=clamp(raw);if(Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t)<halfWidth+margin)lowest=Math.min(lowest,a[1]+(b[1]-a[1])*t);}
 return Number.isFinite(lowest)?lowest:-Infinity;
}
export function isGardenRoute(x,z,margin=.22){
 for(const [a,b,halfWidth]of [...routeSegments,...bridgeSegments]){
  const dx=b[0]-a[0],dz=b[2]-a[2],t=clamp(((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz));
  if(Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t)<halfWidth+margin)return true;
 }
 const c=Math.cos(-.25),s=Math.sin(-.25),hx=c*(x-4.6)-s*(z+9),hz=s*(x-4.6)+c*(z+9);
 if(Math.abs(hx)<8.25&&hz>-5.9&&hz<5.12)return true;
 if(x>-10.2&&x<2.2&&z>-10.8&&z<-7.2)return true;
 return false;
}
export function approachBankHeight(x,z){
 let bank=-.34;
 for(const [a,b,halfWidth]of approachSegments){
  const dx=b[0]-a[0],dz=b[2]-a[2],l2=dx*dx+dz*dz,raw=((x-a[0])*dx+(z-a[2])*dz)/l2;
  if(raw<-.02||raw>1.03)continue;
  const t=clamp(raw),
   px=a[0]+dx*t,pz=a[2]+dz*t,d=Math.hypot(x-px,z-pz),y=a[1]+(b[1]-a[1])*t-.29;
  // A narrow rubble-backed causeway, with a broken planted toe. This no
  // longer spreads the stair datum across the full right-hand water garden.
  const edge=halfWidth+.78+.14*Math.sin(t*19.7)+.09*Math.sin(t*43.1);
  bank=Math.max(bank,-.34+(y+.34)*(1-smooth(halfWidth-.08,edge,d)));
 }
 return bank;
}
export function gardenHeight(x,z){
 const c=Math.cos(-.25),s=Math.sin(-.25),dx=x-4.6,dz=z+9;
 const hx=c*dx-s*dz,hz=s*dx+c*dz;
 const edge=smooth(31,23,Math.abs(x));
 let h=5.05*smooth(8,-12,z)*edge;
 const terrace=6.22-.38*Math.max(0,hz-3.55);
 const terraceMask=smooth(9.8,7.9,Math.abs(hx))*smooth(-14,-8,hz)*smooth(6.8,4.8,hz);
 h=Math.max(h,terrace*terraceMask);
 h=Math.max(h,3.55*Math.exp(-((x+10.2)**2/45+(z+3.1)**2/69)));
 h=Math.max(h,3.85*Math.exp(-((x-12.4)**2/57+(z+1.0)**2/85)));
 h=Math.max(h,1.70*Math.exp(-((x-13.0)**2/32+(z-10.5)**2/30)));
 h=Math.max(h,1.25*Math.exp(-((x+11.0)**2/35+(z-8.0)**2/45)));
 const flowZ=Math.max(0,z+3),centre=-2.9+.18*flowZ,width=2.35+.45*flowZ+.65*Math.max(0,z-1);
 const wet=smooth(-8.4,-5.15,z)*(1-smooth(width,width+3.2,Math.abs(x-centre)));
 h=h*(1-wet)-.32*wet;
 // The former broad 4.92m shelf occluded the pond behind the lantern island.
 // Excavate a connected east inlet. Its irregular eastern edge remains a
 // real height-field shore; the narrow walking bank is restored separately.
 const shoreX=10.85+.42*Math.sin(z*.73)+.23*Math.sin(z*2.3+.8);
 const eastInlet=smooth(-5.8,-2.1,z)*smooth(3.2,5.4,x)*(1-smooth(shoreX-.85,shoreX+1.10,x));
 h=h*(1-eastInlet)-.34*eastInlet;
 // A compact earth-and-rubble apron belongs only to the actual hall stair.
 // Opening the inlet must not leave the old forecourt's bearing stones as
 // freestanding five-metre cairns. The east inlet remains outside this apron.
 const stairApron=-.34+5.32*smooth(4.15,2.65,Math.abs(hx))*smooth(1.5,4.0,hz)*smooth(11.2,8.65,hz);
 h=Math.max(h,stairApron);
 // A narrow rock headland carries the right bank lantern OUTSIDE the hall
 // foundation. Its former backward placement entered the actual solid plinth.
 const lanternHeadland=-.34+4.52*(1-smooth(.60,1.38,Math.abs(x-9)))*smooth(-5.5,-3.9,z)*smooth(-.65,-1.60,z);
 h=Math.max(h,lanternHeadland);
 const rockySlope=smooth(.35,1.2,h)*(1-smooth(3.65,4.85,h));
 const relief=(.075*Math.sin(x*1.17+z*.79)+.042*Math.sin(x*2.43-z*1.69)+.018*Math.cos(z*5.1+x*3.4))*(1-wet)+rockySlope*(.15*Math.sin(x*2.1+z*.9)+.09*Math.sin(x*4.3-z*2.7));
 let result=Math.max(-.34,h+relief,approachBankHeight(x,z));
 // Cut the bank to the walking plane, including the new receding approach.
 // The previous maximum-only bank built a five-metre mound through its stairs.
 for(const [a,b,halfWidth]of routeSegments){const dx=b[0]-a[0],dz=b[2]-a[2],raw=((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz);if(raw<-.015||raw>1.015)continue;const t=clamp(raw),distance=Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t),walk=a[1]+(b[1]-a[1])*t;if(distance<halfWidth+.18)result=Math.min(result,walk-.23);}
 for(const [a,b]of bridgeSegments){const dx=b[0]-a[0],dz=b[2]-a[2],t=clamp(((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz));if(Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t)<1.72)result=Math.min(result,a[1]+(b[1]-a[1])*t-.48);}
 return result;
}

export function gardenTerrainGeometry(){
 const p=[],uv=[],colour=[],ix=[],nx=154,nz=132;
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const x=-32+i*64/nx,z=-36+j*54/nz,y=gardenHeight(x,z);
  p.push(x,y,z);uv.push(x*.65,z*.65);
  const v=.72+.12*Math.sin(x*.67+z*.91)+.10*Math.sin(x*2.18-z*1.43);
  colour.push(v*.83,v,v*.78);
 }
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;ix.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colour,3));g.setIndex(ix);g.computeVertexNormals();
 return g;
}

// An evergreen shoot with attached curved leaves. The folded leaf surfaces
// make the low banks read as fine shrub growth from above, rather than a
// carpet of large crossed triangles.
export function gardenShrubShoot(seed=7){
 let state=seed>>>0;const r=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296),p=[];
 const tri=(a,b,c)=>p.push(...a,...b,...c);
 const stem=(a,b,radius)=>{
  const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av).normalize(),u=new T.Vector3(1,0,0).cross(d).normalize(),v=d.clone().cross(u).normalize();
  for(let j=0;j<5;j++){const q=j/5*Math.PI*2,qq=(j+1)/5*Math.PI*2,
   a0=av.clone().addScaledVector(u,Math.cos(q)*radius).addScaledVector(v,Math.sin(q)*radius),
   a1=av.clone().addScaledVector(u,Math.cos(qq)*radius).addScaledVector(v,Math.sin(qq)*radius),
   b0=bv.clone().addScaledVector(u,Math.cos(q)*radius*.35).addScaledVector(v,Math.sin(q)*radius*.35),
   b1=bv.clone().addScaledVector(u,Math.cos(qq)*radius*.35).addScaledVector(v,Math.sin(qq)*radius*.35);
   tri(a0.toArray(),a1.toArray(),b0.toArray());tri(a1.toArray(),b1.toArray(),b0.toArray());
  }
 };
 for(let branch=0;branch<5;branch++){
  const a=branch*2.39996+r()*.4,h=.35+r()*.20,reach=.12+r()*.14;
  stem([0,0,0],[Math.cos(a)*reach,h,Math.sin(a)*reach],.007);
  for(let k=0;k<9;k++){
   const t=(k+.3)/9,aa=a+(k%2?1:-1)*(.82+r()*.4),rad=reach*t,
    b=[Math.cos(a)*rad,h*t,Math.sin(a)*rad],len=.068+r()*.055,w=len*(.19+r()*.12),
    tip=[b[0]+Math.cos(aa)*len,b[1]+len*.23,b[2]+Math.sin(aa)*len],
    mid=[b[0]+Math.cos(aa)*len*.49,b[1]+len*.25,b[2]+Math.sin(aa)*len*.49],
    l=[mid[0]-Math.sin(aa)*w,mid[1]-w*.23,mid[2]+Math.cos(aa)*w],
    rr=[mid[0]+Math.sin(aa)*w,mid[1]-w*.23,mid[2]-Math.cos(aa)*w];
   tri(b,l,mid);tri(l,tip,mid);tri(mid,tip,rr);tri(b,mid,rr);
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;
}

export const GARDEN_REBUILD_REVISION='scene07-open-water-rock-headland-and-gallery214-r10';
