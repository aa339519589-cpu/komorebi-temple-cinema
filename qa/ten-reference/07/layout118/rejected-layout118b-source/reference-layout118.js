import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {layout118} from './layout118-data.js';
const V=p=>new T.Vector3(...p),TAU=Math.PI*2;

export function buildReferenceLayout118(api){
 const {emit,box,rod,group,mats}=api,land=layout118.landmarks;
 const timber=mats.red.clone();timber.name='layout118-red-lacquered-solid-timber';timber.color.setRGB(6.2,2.65,3.2);timber.onBeforeCompile=mats.red.onBeforeCompile;timber.customProgramCacheKey=()=>mats.red.customProgramCacheKey()+':red-lacquer118';timber.userData.scannedTimber=true;
 const gilt=new T.MeshPhysicalMaterial({name:'layout118-cast-gilt-copper',color:0xc9a15b,metalness:.96,roughness:.23,clearcoat:.08,clearcoatRoughness:.2});
 const patina=new T.MeshStandardMaterial({name:'layout118-aged-bronze',color:0x514a31,metalness:.85,roughness:.48});
 const b=(p,d,m=timber,yaw=0)=>emit(new RoundedBoxGeometry(...d,2,Math.min(.018,...d.map(x=>x*.12))),m,...p,1,1,1,[0,yaw,0]);
 const along=(a,bp,h,width,depth,m=timber)=>{const a1=V(a),b1=V(bp),c=a1.clone().add(b1).multiplyScalar(.5),dx=b1.x-a1.x,dz=b1.z-a1.z,len=Math.hypot(dx,dz),yaw=-Math.atan2(dz,dx);b([c.x,c.y+h,c.z],[len,width,depth],m,yaw);};
 function finial(p,r=.30){
  const profile=[[0,0],[r*.85,0],[r*.88,.05],[r*.66,.08],[r*.66,.14],[r*.83,.18],[r*.86,.24],[r*.67,.29],[r*.52,.34],[r*.61,.38],[r*.90,.43],[r,.50],[r*.96,.58],[r*.75,.66],[r*.40,.71],[r*.18,.74],[r*.09,.80],[0,.83]];
  emit(new T.LatheGeometry(profile.map(q=>new T.Vector2(...q)),64),gilt,...p);
  for(const [dy,rr]of [[.05,r*.88],[.23,r*.86],[.36,r*.61]])emit(new T.TorusGeometry(rr,.012,10,48),gilt,p[0],p[1]+dy,p[2],1,1,1,[Math.PI/2,0,0]);
 }
 const corner=V(land.railCorner.world),right=V(land.railRightEnd.world),left=V(land.railLeftEnd.world);
 // One dominant corner post. Intermediate supports end at the underside of
 // the handrail, as observed; there is no arbitrary line of golden finials.
 b([corner.x,corner.y-.86,corner.z],[.56,2.28,.56]);
 b([corner.x,corner.y+.10,corner.z],[.64,.14,.64],gilt);
 finial([corner.x,corner.y+.17,corner.z],.32);
 const panelLeaf=new T.Shape();panelLeaf.moveTo(0,0);panelLeaf.bezierCurveTo(-.07,.04,-.055,.15,0,.21);panelLeaf.bezierCurveTo(.08,.14,.07,.04,0,0);panelLeaf.closePath();
 const petal=new T.ExtrudeGeometry(panelLeaf,{depth:.028,steps:1,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:2,curveSegments:10});
 for(const end of[right,left]){
  const length=corner.distanceTo(end),yaw=-Math.atan2(end.z-corner.z,end.x-corner.x),point=t=>corner.clone().lerp(end,t);
  for(const [h,w,d]of[[0,.25,.34],[-.61,.19,.23],[-1.35,.27,.29],[-2.08,.23,.29]])along(corner.toArray(),end.toArray(),h,w,d);
  const count=Math.ceil(length/1.64);
  for(let j=1;j<count;j++){
   const p=point(j/count);
   b([p.x,p.y-.72,p.z],[.23,1.30,.23],timber,yaw);
   b([p.x,p.y-.24,p.z],[.31,.17,.30],timber,yaw);
   b([p.x,p.y-.53,p.z],[.30,.14,.30],timber,yaw);
   b([p.x,p.y-1.18,p.z],[.31,.16,.30],timber,yaw);
  }
  for(let j=0;j<count;j++){
   const p=point((j+.5)/count),w=length/count-.25;
   group(p.x,p.y,p.z,yaw,1,()=>{
    b([0,-1.72,0],[w,.61,.09],mats.dark);
    for(const yy of[-1.43,-2.01])b([0,yy,.061],[w,.035,.04],gilt);
    for(const xx of[-w/2,w/2])b([xx,-1.72,.061],[.035,.58,.04],gilt);
    // Layered cast rosettes and curled foliage, physically recessed between
    // structural rails. The formerly high ornamental stripe is removed.
    for(let k=0;k<8;k++)emit(petal,gilt,0,-1.72,.07,.70,.70,1,[0,0,k*TAU/8]);
    for(const side of[-1,1])for(let k=0;k<2;k++){
     const x=side*(.25+k*.22),points=Array.from({length:40},(_,i)=>{const a=i/39*TAU*1.4,r=.16*(1-i/46);return new T.Vector3(x+side*Math.cos(a)*r,-1.72+Math.sin(a)*r,.09);});
     emit(new T.TubeGeometry(new T.CatmullRomCurve3(points),48,.013,8,false),gilt,0,0,0);
     emit(petal,gilt,x,-1.85,.08,.60,.60,1,[0,0,side*.9]);
    }
   });
  }
 }
 const knots=['bridgeLeft','bridgeQuarter','bridgeCrown','bridgeThreeQuarter','bridgeRight'].map(k=>V(land[k].world)),curve=new T.CatmullRomCurve3(knots,false,'centripetal');
 const cross=(t,side=0)=>{const p=curve.getPoint(t),d=curve.getTangent(t),n=new T.Vector3(-d.z,0,d.x).normalize();return p.addScaledVector(n,side*1.12);};
 const stone=mats.stone.clone();stone.name='layout118-bridge-granite';stone.color.setHex(0x8b8c80);
 const band=(side,y0,y1,width,material)=>{
  const p=[],ix=[],N=96;
  for(let i=0;i<=N;i++){const t=i/N,c=cross(t,side),d=curve.getTangent(t),n=new T.Vector3(-d.z,0,d.x).normalize();for(const [w,y]of[[-width/2,y0],[width/2,y0],[width/2,y1],[-width/2,y1]])p.push(c.x+n.x*w,c.y+y,c.z+n.z*w);}
  for(let i=0;i<N;i++)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4,c=(i+1)*4+j,d=(i+1)*4+(j+1)%4;ix.push(a,b,c,b,d,c);}
  ix.push(0,3,2,0,2,1,N*4,N*4+1,N*4+2,N*4,N*4+2,N*4+3);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();g.setAttribute('uv',new T.Float32BufferAttribute(p.flatMap((q,i)=>i%3===0?[q,p[i+2]]:[]),2));emit(g,material,0,0,0);
 };
 for(let i=0;i<52;i++){const t=(i+.5)/52,p=curve.getPoint(t),d=curve.getTangent(t),yaw=-Math.atan2(d.z,d.x);b([p.x,p.y-.13,p.z],[curve.getLength()/52*.98,.26,2.25],stone,yaw);}
 for(const side of[-1,1]){
  band(side,-.46,-.14,.27,timber);
  for(const y of[.24,.64,1.06])band(side,y-.06,y+.06,y>1?.18:.12,timber);
  for(let i=0;i<=8;i++){
   const p=cross(i/8,side),d=curve.getTangent(i/8),yaw=-Math.atan2(d.z,d.x),major=i%4===0;
   b([p.x,p.y+.59,p.z],[major?.25:.16,1.18,major?.25:.16],major?stone:timber,yaw);
   if(major){b([p.x,p.y+1.23,p.z],[.34,.12,.34],stone,yaw);finial([p.x,p.y+1.29,p.z],.12);}
  }
 }
 // The right section is a separate descending stair flight, not continuation
 // of one oversized curve across the entire pond.
 const a=knots.at(-1),end=V(land.bridgeStairEnd.world),delta=end.clone().sub(a),run=Math.hypot(delta.x,delta.z),yaw=-Math.atan2(delta.z,delta.x),n=new T.Vector3(-delta.z,0,delta.x).normalize();
 const steps=11;
 for(let i=0;i<steps;i++){const t=(i+.5)/steps,p=a.clone().lerp(end,t),top=a.y+(end.y-a.y)*i/steps;b([p.x,top-.12,p.z],[run/steps+.012,.24,2.24],stone,yaw);}
 for(const side of[-1,1]){
  const pa=a.clone().addScaledVector(n,side*1.12),pb=end.clone().addScaledVector(n,side*1.12);
  for(let j=0;j<=5;j++){const p=pa.clone().lerp(pb,j/5);b([p.x,p.y+.53,p.z],[.17,1.06,.17],timber,yaw);}
  for(const h of[.26,.65,1.04]){
   const p=pa.clone().add(new T.Vector3(0,h,0)),q=pb.clone().add(new T.Vector3(0,h,0)),direction=q.clone().sub(p),mid=p.clone().add(q).multiplyScalar(.5),g=new RoundedBoxGeometry(direction.length(),.13,.15,2,.015);
   const quat=new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),direction.normalize()),e=new T.Euler().setFromQuaternion(quat);emit(g,timber,...mid.toArray(),1,1,1,[e.x,e.y,e.z]);
  }
 }
 // Closed landing at the foot of the main stair, fitted independently of
 // the oblique descending bridge flight. Supports terminate at the bank.
 const landing=layout118.landing.map(q=>q.world),lp=[],li=[];
 for(const h of[0,-.30])for(const q of landing)lp.push(q[0],q[1]+h,q[2]);
 li.push(0,2,1,0,3,2,4,5,6,4,6,7);
 for(let j=0;j<4;j++){const k=(j+1)%4;li.push(j,k,j+4,k,k+4,j+4);}
 const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(lp,3));lg.setAttribute('uv',new T.Float32BufferAttribute(lp.flatMap((q,i)=>i%3===0?[q,lp[i+2]]:[]),2));lg.setIndex(li);lg.computeVertexNormals();emit(lg,stone,0,0,0);
 for(const q of landing)b([q[0],1.85,q[2]],[.52,3.7,.52],stone);
 const audit={revision:'layout118',reference:layout118.reference,observedLandmarks:layout118.landmarks,nearRail:{corner:corner.toArray(),heightSectionMetres:.25,depthSectionMetres:.34,postSectionMetres:.56,intermediateGoldFinials:0,lowerPanelBelowHandrailMetres:1.72},bridge:{widthMetres:2.25,knots:knots.map(p=>p.toArray()),lengthMetres:curve.getLength(),separateDescendingFlightSteps:steps},scope:'Reconstructed main foreground rail assembly and garden bridge/descending flight in real3D. Photo used only for geometric measurements. Inferred depths are explicitly not measured geometry.',visualAccepted:false};
 return{audit,dispose(){timber.dispose();gilt.dispose();patina.dispose();stone.dispose();}};
}
