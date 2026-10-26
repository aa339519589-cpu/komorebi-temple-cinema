import * as T from 'three';
import {sitePoint214} from './site-transform214.js';

// Metric soil and geological masses for the water garden. These low, joined
// shoulders interrupt the former empty basin; they are not foliage hulls.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const TAU=Math.PI*2;
export const GARDEN_LANDFORMS340=Object.freeze([
 {id:'left-bridge-toe',x:-13.8,z:-16.8,rx:3.15,rz:2.55,top:.82,phase:.4,plants:3},
 {id:'left-middle-headland',x:-10.1,z:-5.9,rx:4.15,rz:2.70,top:1.35,phase:1.5,plants:5},
 {id:'left-middle-return',x:-9.2,z:-2.1,rx:3.65,rz:3.05,top:1.15,phase:2.4,plants:4},
 {id:'low-islet',x:-4.9,z:-3.8,rx:2.75,rz:1.85,top:1.08,phase:3.6,plants:4},
 {id:'left-pine-root',x:-9.8,z:1.5,rx:3.40,rz:2.65,top:.96,phase:4.3,plants:4},
 {id:'foreground-root-shoulder',x:-4.9,z:9.1,rx:3.30,rz:2.30,top:.92,phase:5.2,plants:3},
 {id:'lantern-west-shelf',x:2.95,z:5.6,rx:2.45,rz:1.95,top:1.03,phase:.9,plants:3},
 {id:'lantern-north-shelf',x:5.15,z:3.95,rx:2.50,rz:1.80,top:1.09,phase:1.9,plants:3},
 {id:'lantern-south-toe',x:5.45,z:7.20,rx:2.80,rz:1.80,top:.73,phase:3.3,plants:3},
 {id:'lantern-east-toe',x:7.05,z:5.90,rx:1.90,rz:2.15,top:.86,phase:4.7,plants:3},
 {id:'east-pine-wet-shoulder',x:11.4,z:4.55,rx:2.45,rz:3.20,top:1.08,phase:5.5,plants:4},
 {id:'pavilion-rear-slope',x:-36.5,z:-33.0,rx:11.5,rz:7.0,top:2.6,phase:1.2,plants:0,background:true},
 {id:'pagoda-rear-knoll',x:-28.0,z:-45.5,rx:12.8,rz:9.0,top:4.3,phase:2.8,plants:0,background:true},
 {id:'grove-back-rise',x:-25.0,z:-54.0,rx:16.0,rz:8.2,top:5.4,phase:4.1,plants:0,background:true}
]);

export function landformPoint340(form,angle,radius=1){
 const edge=1+.115*Math.sin(angle*3+form.phase)+.062*Math.sin(angle*7-form.phase*.7);
 return[form.x+Math.cos(angle)*form.rx*edge*radius,form.z+Math.sin(angle)*form.rz*edge*radius];
}
export function gardenLandformHeight340(x,z){
 let y=-.34;
 for(const f of GARDEN_LANDFORMS340){
  const dx=(x-f.x)/f.rx,dz=(z-f.z)/f.rz,a=Math.atan2(dz,dx),edge=1+.115*Math.sin(a*3+f.phase)+.062*Math.sin(a*7-f.phase*.7),r=Math.hypot(dx,dz)/edge;
  if(r>1.06)continue;
  // A dry crown, an exposed irregular bench and a lower wetted toe. The
  // benches overlap continuously with the existing river bed at -.34m.
  const crown=.57*(1-smooth(.18,.69,r)),bench=.31*(1-smooth(.54,.91,r)),toe=.12*(1-smooth(.82,1.045,r));
  const relief=.045*Math.sin(x*2.17+z*.94+f.phase)*(1-smooth(.58,1.02,r));
  y=Math.max(y,-.34+(f.top+.34)*(crown+bench+toe)+relief);
 }
 return y;
}

// A small companion niwaki is rooted in the new middle islet. It borrows the
// existing complete branched pine recipe; original materials/assets remain.
export const GARDEN_PINE340=Object.freeze({id:'middle-islet-pine340',x:-5.15,z:(-3.85+3)/.6,h:3.65,spread:1.19,yaw:.63,seed:340091});

export function buildGardenShore340({emit,scannedStones,height,isRoute,walkHeight}){
 let seed=340071;const R=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296),rr=(a,b)=>a+(b-a)*R();
 const stones=[],groups=[];
 function seat(x,z,scale,variant,heading,kind,topLimit=Infinity){
  const v=scannedStones.variants[variant%scannedStones.variants.length],ground=height(x,z);
  if(ground<-.32||isRoute(x,z,.36)&&ground>2.8)return;
  const rotation=new T.Euler(rr(-.15,.15),heading,rr(-.12,.12)),q=new T.Quaternion().setFromEuler(rotation),matrix=new T.Matrix4().makeRotationFromQuaternion(q).scale(new T.Vector3(scale,scale,scale));
  if(!v.geometry.boundingBox)v.geometry.computeBoundingBox();
  const b=v.geometry.boundingBox.clone().applyMatrix4(matrix),h=b.max.y-b.min.y,embed=kind.startsWith('interlocking')?rr(.30,.44):rr(.52,.68),walk=walkHeight(x,z,scale*.72+.2);
  let y=Math.min(ground-embed*h-b.min.y,topLimit-b.max.y);
  if(Number.isFinite(walk))y=Math.min(y,walk-.20-b.max.y);
  if(y+b.max.y<.045)return;
  emit(v.geometry,ground<.45?v.wet:v.dry,x,y,z,scale,scale,scale,[rotation.x,rotation.y,rotation.z],rr(.85,1.08));
  stones.push({kind,x,z,ground,scale,variant:variant%6,bottom:y+b.min.y,top:y+b.max.y,burial:ground-(y+b.min.y),walkingPlane:Number.isFinite(walk)?walk:null});
 }
 // Unequal stone groups follow selected shoreline sectors. Deliberate water
 // gaps avoid a bead necklace; subordinate stones overlap a larger parent.
 for(let k=0;k<GARDEN_LANDFORMS340.length;k++){
  const f=GARDEN_LANDFORMS340[k];if(f.background)continue;const n=Math.ceil((f.rx+f.rz)*1.65),before=stones.length;
  for(let j=0;j<n;j++){
   if((j+k*2)%5===1||(j*3+k)%11===0)continue;
   const angle=(j+rr(-.16,.16))/n*TAU,[x,z]=landformPoint340(f,angle,rr(.68,.87)),s=rr(.56,.98)*(j%4===0?1.28:1);
   seat(x,z,s,k*3+j,angle+.55+rr(-.45,.45),f.id+'-edge');
   if(j%3===0){const [xx,zz]=landformPoint340(f,angle+.19,.94);seat(xx,zz,s*.61,j+k+2,angle-.28,f.id+'-wet-toe');}
   if(j%4===0){const [xx,zz]=landformPoint340(f,angle-.14,.63);seat(xx,zz,s*.74,j+k+4,angle+.9,f.id+'-inner-bench');}
  }
  groups.push({id:f.id,stones:stones.length-before,centre:[f.x,f.z],soilTop:f.top,footprint:[f.rx*2,f.rz*2]});
 }
 // Larger interlocking shoulders expose original eroded stone volume at
 // the soil/water joint. Each is sunk into the continuous bed, with adjacent
 // subordinate stones; the lantern base keeps a low open front window.
 const massifs340=[
  [3.55,5.25,1.35,2,.42,1.74],[5.95,4.78,1.42,4,-.65,1.74],
  [6.78,5.75,1.20,1,.88,1.54],[4.60,6.82,1.48,3,.16,1.50],
  [2.65,6.12,1.16,5,-.42,1.33],[6.05,7.38,1.08,0,.75,1.17],
  [-10.40,-5.32,1.50,4,.36,Infinity],[-8.0,-4.80,1.27,2,-.46,Infinity],
  [-8.60,-1.05,1.34,1,.88,Infinity],[-4.16,-3.78,1.26,3,-.20,Infinity],
  [-9.15,1.30,1.23,5,.24,Infinity],[10.35,4.35,1.32,4,-.57,Infinity]
 ];
 for(const [x,z,scale,variant,yaw,top]of massifs340)seat(x,z,scale,variant,yaw,'interlocking-massif',top);
 // Substantial geology seats the stair shoulders in the planted banks. The
 // central stair and bridge walking planes are kept clear in actual height.
 const c=Math.cos(-.25),s=Math.sin(-.25);
 for(const side of[-1,1])for(let tier=0;tier<3;tier++)for(let j=0;j<5;j++){
  const hx=side*(3.35+j*.63+rr(-.14,.14)),hz=6.8+tier*.96+rr(-.16,.16),p=sitePoint214([4.6+c*hx+s*hz,0,-9-s*hx+c*hz]);
  seat(p[0],p[2],rr(.68,1.15),j*3+tier+(side+1)*2,rr(-1,1)+side*.6,'stair-shoulder');
 }
 const audit={rocks:stones.length,groups,uniformOriginalScanScale:true,allCentresEmbedded:stones.every(s=>s.burial>0),minimumCentreBurial:Math.min(...stones.map(s=>s.burial)),walkingPlaneOverruns:stones.filter(s=>s.walkingPlane!==null&&s.top>s.walkingPlane-.19).length,placements:stones};
 return{info:{revision:'scene07-interlocking-rock-benches-and-open-lantern-foot340-r02',...audit,terrainShape:'Continuous multi-bench soil lobes join the existing submerged bed; actual scan stones interrupt selected irregular shore sectors.',cameraInput:false,referencePixels:false,newAssets:0,visualAccepted:false}};
}
