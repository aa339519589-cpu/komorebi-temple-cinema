import * as T from 'three';
import {V,lin,surface} from './kernel.js';
import {layout124 as L} from './layout124.js';

export function verandaEdge124(z){const a=L.foreground.postL,b=L.foreground.postN,t=(z-a[2])/(b[2]-a[2]);return[a[0]+(b[0]-a[0])*t,L.foreground.deckY,z];}
export function solidTerrain124(grid,bottom=-.35){const g=surface(grid,.72),p=g.attributes.position,n=grid.length*grid[0].length;for(let i=n;i<p.count;i++)p.setY(i,bottom);g.computeVertexNormals();return g;}
export function bridgeSupport124(x,z){const G=L.bridge,c=Math.cos(G.yaw),s=Math.sin(G.yaw),dx=x-G.position[0],dz=z-G.position[2],u=(c*dx-s*dz)/G.scale[0],v=(s*dx+c*dz)/G.scale[2];let h=0;for(const end of[-G.halfSpan,G.halfSpan]){const r=Math.max(Math.abs(u-end)/1.9,Math.abs(v)/2.2);if(r<1){const top=G.position[1]+G.deckBaseline+G.slope*end/G.halfSpan-.14;h=Math.max(h,.14+(top-.14)*(1-T.MathUtils.smoothstep(r,.28,1)));}}return h;}

export function buildForeground124(B,{carvedFitting,squareGold}){
 const F=L.foreground,a=F.postL,b=F.postN,dx=b[0]-a[0],dz=b[2]-a[2],yaw=Math.atan2(dx,dz),length=Math.hypot(dx,dz),dir=V([dx,0,dz]).normalize(),normal=V([dir.z,0,-dir.x]);
 const capProfile=[[0,-1.48],[.76,-1.48],[.80,-1.36],[.80,-1.22],[.70,-1.16],[.70,-1.02],[.52,-.91],[.40,-.73],[.42,-.60],[.62,-.42],[.68,-.15],[.65,.10],[.52,.34],[.33,.53],[.20,.61],[.18,.77],[.12,.94],[0,1.15]],cap=new T.LatheGeometry(capProfile.map(p=>new T.Vector2(...p)),64);
 B.label('foreground124-connected-deck',()=>{
  const [cx,,cz]=F.columnPosition;
  for(let z=10.8;z<22;z+=.20){const right=verandaEdge124(z)[0]-.055,left=-6.0,r=F.columnRadius+.025,dz=z-cz,cuts=[left,right];
   if(Math.abs(dz)<r){const q=Math.sqrt(r*r-dz*dz);cuts.splice(1,0,cx-q,cx+q);}
   for(let i=0;i<cuts.length-1;i+=cuts.length===4?2:1){const lo=Math.max(left,cuts[i]),hi=Math.min(right,cuts[i+1]);if(hi>lo)B.box((lo+hi)/2,1.73,z,hi-lo,.14,.193,'wood');}
  }
  for(let z=11;z<22;z+=.60){const edge=verandaEdge124(z)[0]-.04,dz=z-cz,r=F.columnRadius+.025,cuts=[-6,edge];if(Math.abs(dz)<r+.06){const q=Math.sqrt(Math.max(0,r*r-dz*dz))+.015;cuts.splice(1,0,cx-q,cx+q);}for(let i=0;i<cuts.length-1;i+=cuts.length===4?2:1){const lo=Math.max(-6,cuts[i]),hi=Math.min(edge,cuts[i+1]);if(hi>lo)B.box((lo+hi)/2,1.56,z,hi-lo,.20,.12,'wood');}}
  for(const z of[12,16,20])for(const x of[-5.70,verandaEdge124(z)[0]-.13]){B.box(x,1.36,z,.24,.20,1.10,'wood');B.box(x,(.13+1.26)/2,z,.20,1.26-.13,.20,'wood');B.box(x,.025,z,.45,.21,.45,'stone');}
 });
 B.label('foreground124-measured-column-and-bearing',()=>{
  const p=F.columnPosition,r=F.columnRadius,h=F.columnTop,col=new T.LatheGeometry([[0,0],[r*.96,0],[r,.15],[r,3.8],[r*.95,8.2],[r*.90,h],[0,h]].map(p=>new T.Vector2(...p)),64);B.emit(col,'red',...p);
  // The existing fitting is bolted to an actual cylinder intersection. Its
  // height is recovered with this closer column rather than left at an old
  // world height that would now place it entirely above the photograph.
  const cam=new T.PerspectiveCamera(59,1,.1,260);cam.position.fromArray(L.camera.position);cam.lookAt(...L.camera.target);cam.updateMatrixWorld(true);const d=new T.Vector3(110/627-1,1-158/627,.5).unproject(cam).sub(cam.position).normalize(),ox=cam.position.x-p[0],oz=cam.position.z-p[2],aa=d.x*d.x+d.z*d.z,bb=2*(ox*d.x+oz*d.z),cc=ox*ox+oz*oz-r*r,dis=bb*bb-4*aa*cc;
  if(dis>=0){const t=(-bb-Math.sqrt(dis))/(2*aa),q=cam.position.clone().addScaledVector(d,t),n=V([q.x-p[0],0,q.z-p[2]]).normalize();B.with(q.x,q.y,q.z,Math.atan2(n.x,n.z),()=>carvedFitting(0,0,.007,.17,.22));}
 });
 B.label('foreground124-continuous-ceiling-load-path',()=>{
  const cam=new T.PerspectiveCamera(59,1,.1,260);cam.position.fromArray(L.camera.position);cam.lookAt(...L.camera.target);cam.updateMatrixWorld(true);
  const cast=(u,v)=>{const d=new T.Vector3(u*2-1,1-v*2,.5).unproject(cam).sub(cam.position).normalize();return cam.position.clone().addScaledVector(d,(F.ceilingY-cam.position.y)/d.y);};
  const pa=cast(-.08,.20),pb=cast(.44,-.025),mid=pa.clone().add(pb).multiplyScalar(.5),delta=pb.clone().sub(pa),w=delta.length(),angle=Math.atan2(-delta.z,delta.x),matrix=new T.Matrix4().compose(V([mid.x,F.ceilingY,mid.z]),new T.Quaternion().setFromAxisAngle(V([0,1,0]),angle),V([1,1,1]));
  const colLocal=V(F.columnPosition).applyMatrix4(matrix.clone().invert());
  B.with(mid.x,F.ceilingY,mid.z,angle,()=>{
   // Two joined rectangular bays form a real L gallery. The near return is
   // above the photographic crop and contains the newly recovered column.
   for(const [lo,hi,z0,z1]of[[-w/2,w/2,0,12],[w/2,9.2,4,12]]){
    B.box((lo+hi)/2,.05,(z0+z1)/2,hi-lo,.16,z1-z0,'darkwood');
    for(let x=lo+.10;x<hi;x+=.62)B.box(x,-.18,(z0+z1)/2,.19,.33,z1-z0,'wood');
    for(let z=z0+.15;z<z1;z+=1.8)B.box((lo+hi)/2,-.41,z,hi-lo,.28,.29,'redLight');
   }
   for(let i=0;i<=14;i++){const x=-w/2+w*i/14;B.box(x,-.35,.04,.24,.12,.35,'redLight');squareGold(x,-.35,.23,.20,.12);}
   // This beam's lower face is exactly the column top (Y9.595), while its
   // upper face bears against the rafters at Y9.955. No suspended column.
   B.box((9.2-w/2)/2,-.525,colLocal.z,9.2+w/2,.36,.34,'wood');
  });
 });
 B.label('foreground124-joined-panel-balustrade',()=>{
  const start=V([a[0],0,a[2]]).addScaledVector(dir,-1.5),end=V([b[0],0,b[2]]).addScaledVector(dir,3.5),spans=[start,V([a[0],0,a[2]]),V([b[0],0,b[2]]),end];
  for(const [y,w,h]of[[2.53,.17,.13],[2.20,.12,.12],[1.87,.14,.12],[1.825,.20,.05]]){const matrix=new T.Matrix4().makeBasis(normal,dir,V([0,-1,0]));matrix.scale(V([w,start.distanceTo(end),h]));matrix.setPosition(start.clone().add(end).multiplyScalar(.5).setY(y));B.put(B.boxG,'redLight',matrix);}
  for(const [p,r]of[[start,.22],[V(a),.22],[V(b),.095],[end,.095]])B.with(p.x,0,p.z,yaw,()=>{
   const width=r>.15?.34:.19;B.box(0,(1.8+F.postHeadY-.024)/2,0,width,F.postHeadY-.024-1.8,width,'redLight');B.box(0,F.postHeadY-.012,0,width*1.15,.024,width*1.15,'bronze');B.emit(cap,'giltBronze',0,F.postHeadY+1.48*r,0,r,r,r);
  });
  for(let k=0;k<spans.length-1;k++){
   const pa=spans[k],pb=spans[k+1],n=Math.max(2,Math.ceil(pa.distanceTo(pb)/.65));
   for(let i=1;i<n;i++){const p=pa.clone().lerp(pb,i/n);B.with(p.x,0,p.z,yaw,()=>B.box(0,2.14,0,.085,.68,.085,'red'));}
   for(let i=0;i<n;i++){const p=pa.clone().lerp(pb,(i+.5)/n),span=pa.distanceTo(pb)/n-.11;B.with(p.x,0,p.z,yaw,()=>{B.box(0,2.025,0,.055,.23,span,'darkwood');B.with(-.042,2.025,0,-Math.PI/2,()=>squareGold(0,0,0,Math.min(.26,span*.65),.18));});}
  }
 });
 B.layout124??={};B.layout124.foreground={postHeadY:F.postHeadY,deckY:F.deckY,columnTop:F.columnTop,ceilingBearingBottom:F.columnTop,columnDeckHole:true,structuralRails:4,postCentres:[a,b],mainVisibleSpan:length};
}

export function buildStair124(B){
 const S=L.stair,a=V(S.bottom),b=V(S.top),d=b.clone().sub(a),run=Math.hypot(d.x,d.z),yaw=Math.atan2(d.x,d.z);
 B.label('layout124-connected-hall-flight-and-landing',()=>{
  B.box(a.x,S.bearingY+.015,a.z,S.width+.20,.03,2.7,'stone');
  for(let i=0;i<S.steps;i++){
   const t=(i+.5)/S.steps,p=a.clone().lerp(b,t),top=T.MathUtils.lerp(a.y,b.y,(i+1)/S.steps);
   B.with(p.x,0,p.z,yaw,()=>{B.box(0,(S.bearingY+top)/2,0,S.width,top-S.bearingY,run/S.steps+.004,'stone');B.box(0,top-.025,0,S.width+.04,.05,run/S.steps,'stoneLight');
    for(const sign of[-1,1]){B.box(sign*(S.width/2+.13),(S.bearingY+top+.24)/2,0,.22,top+.24-S.bearingY,run/S.steps+.005,'stone');B.box(sign*(S.width/2+.13),top+.265,0,.28,.05,run/S.steps+.005,'stoneLight');}
   });
  }
 });
 B.layout124??={};B.layout124.stair={top:S.top,bottom:S.bottom,width:S.width,steps:S.steps,run,connectedHallFloorY:S.top[1],landingY:S.landingY,bearingY:S.bearingY};
}

export function bankHeight124(x,z,original){
 const s=L.stair,q=Math.max(Math.abs(x-s.bottom[0])/2.4,Math.abs(z-s.bottom[2])/2.25),landing=s.bearingY*(1-T.MathUtils.smoothstep(q,.55,1.6));
 let height=Math.max(original,landing,bridgeSupport124(x,z));
 // The falling water occupies a cut channel with a supporting bed. The soil
 // must not seal that passage simply because a landing was raised nearby.
 const cross=1-T.MathUtils.smoothstep(Math.abs(x-L.waterfall.x),.50,.75),mask=cross*T.MathUtils.smoothstep(z,-1.75,-1.35)*(1-T.MathUtils.smoothstep(z,.15,.45));
 if(mask>0){let bed;if(z<=-.68){const t=Math.sqrt(T.MathUtils.clamp((z+1.35)/.67,0,1));bed=1.35-.60*t-.05;}else if(z<-.60)bed=.70;else{const t=Math.sqrt(T.MathUtils.clamp((z+.60)/.67,0,1));bed=.75-.60*t-.05;}height=T.MathUtils.lerp(height,Math.min(height,bed),mask);}
 return height;
}

export function buildTowerGround124(B){
 const p=L.pagoda.position,h=p[1]-.35*L.pagoda.scale[1];
 B.label('layout124-pagoda-supported-ground',()=>{const grid=lin(p[2]-6,p[2]+6,32).map(z=>lin(p[0]-6,p[0]+6,32).map(x=>{const r=Math.max(Math.abs(x-p[0]),Math.abs(z-p[2])),y=h*(1-T.MathUtils.smoothstep(r,2.8,6));return[x,y,z];}));B.emit(solidTerrain124(grid),'earth');});
}
