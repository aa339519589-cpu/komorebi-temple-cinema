import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {layout118} from './layout118-data.js';
import {createWeatheredBoulderGeometry} from './boulder.js';
const V=p=>new T.Vector3(...p),TAU=Math.PI*2;

export function buildReferenceLayout118(api){
 const {emit,box,rod,group,mats,graniteMaps}=api,land=layout118.landmarks;
 const timber=mats.red.clone();timber.name='layout118-red-lacquered-solid-timber';timber.color.setRGB(6.2,2.65,3.2);timber.onBeforeCompile=mats.red.onBeforeCompile;timber.customProgramCacheKey=()=>mats.red.customProgramCacheKey()+':red-lacquer118';timber.userData.scannedTimber=true;
 const gilt=new T.MeshPhysicalMaterial({name:'layout118-cast-gilt-copper',color:0xc9a15b,metalness:.96,roughness:.23,clearcoat:.08,clearcoatRoughness:.2});
 const patina=new T.MeshStandardMaterial({name:'layout118-aged-bronze',color:0x514a31,metalness:.85,roughness:.48});
 const b=(p,d,m=timber,yaw=0)=>{const g=new RoundedBoxGeometry(...d,2,Math.min(.012,...d.map(x=>x*.1)));if(m.userData.metricGranite){const a=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(a.count*2);for(let i=0;i<a.count;i++){const ax=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],k=ax.indexOf(Math.max(...ax));uv[i*2]=((k===0?a.getZ(i):a.getX(i))+p[0])/.317;uv[i*2+1]=((k===1?a.getZ(i):a.getY(i))+p[2])/.317;}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}emit(g,m,...p,1,1,1,[0,yaw,0]);};
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
 const bridgeWidth=2.8,knots=['bridgeLeft','bridgeQuarter','bridgeCrown','bridgeThreeQuarter','bridgeRight'].map(k=>V(land[k].world)),curve=new T.CatmullRomCurve3(knots,false,'centripetal');
 const deckPoint=t=>curve.getPoint(t);
 const cross=(t,side=0)=>{const p=deckPoint(t),d=curve.getTangent(t),n=new T.Vector3(-d.z,0,d.x).normalize();return p.addScaledVector(n,side*bridgeWidth*.5);};
 const stone=new T.MeshStandardMaterial({name:'layout118-metric-worn-granite',color:0xa5a198,roughness:.9,map:graniteMaps.map,normalMap:graniteMaps.normalMap,roughnessMap:graniteMaps.roughnessMap});stone.normalScale.set(.22,.22);stone.userData.metricGranite=true;
 stone.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 vec3 g=texture2D(map,vMapUv).rgb;float mineral=dot(g,vec3(.2126,.7152,.0722));diffuseColor.rgb*=clamp(pow(max(mineral,.0001)/.153180782734,.65),.66,1.42);
 #endif`);};stone.customProgramCacheKey=()=> 'layout118-metric-neutral-granite';
 const terrainHeight=typeof api.terrainHeight==='function'?api.terrainHeight:()=>-.2;
 const abutmentRocks=[
  createWeatheredBoulderGeometry(T,{scale:[1,.72,.9],seed:1207,sectors:28,rings:14}),
  createWeatheredBoulderGeometry(T,{scale:[.88,.68,1],seed:1229,sectors:28,rings:14})
 ];
 function bankBearing(t,landwardSign){
  const p=deckPoint(t),d=curve.getTangent(t).normalize(),n=new T.Vector3(-d.z,0,d.x).normalize(),yaw=-Math.atan2(d.z,d.x);
  for(const side of[-1,1]){
   const foot=p.clone().addScaledVector(d,landwardSign*.56).addScaledVector(n,side*.82),ground=terrainHeight(foot.x,foot.z);
   const footY=Math.min(Math.max(.45,ground+.66),p.y-2.65);
   emit(abutmentRocks[(side+1)/2],mats.rock,foot.x,footY,foot.z,1.20,1.34,1.08,[.02,yaw+side*.06,-.025]);
   const middle=foot.clone().addScaledVector(n,-side*.12),middleY=footY+(p.y-.65-footY)*.58;
   emit(abutmentRocks[(side+1)/2],mats.rock,middle.x,middleY,middle.z,1.02,1.55,1.00,[.01,yaw-side*.04,.01]);
   const upper=middle.clone().addScaledVector(n,side*.10);
   emit(abutmentRocks[(side+1)/2],mats.rock,upper.x,p.y-.48,upper.z,.90,.96,.92,[.01,yaw-side*.07,.015]);
  }
  const seat=p.clone().addScaledVector(d,landwardSign*.10);
  b([seat.x,p.y-.19,seat.z],[bridgeWidth+.90,.38,1.34],stone,yaw);
 }
 // Bearing stones rise only at the two banks; the crossing remains clear over
 // the water instead of standing on exposed mid-channel piers.
 bankBearing(0,-1);bankBearing(1,1);
 const band=(side,y0,y1,width,material,end=1)=>{
  const p=[],ix=[],N=96;
  for(let i=0;i<=N;i++){const t=end*i/N,c=cross(t,side),d=curve.getTangent(t),n=new T.Vector3(-d.z,0,d.x).normalize();for(const [w,y]of[[-width/2,y0],[width/2,y0],[width/2,y1],[-width/2,y1]])p.push(c.x+n.x*w,c.y+y,c.z+n.z*w);}
  for(let i=0;i<N;i++)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4,c=(i+1)*4+j,d=(i+1)*4+(j+1)%4;ix.push(a,b,c,b,d,c);}
  ix.push(0,3,2,0,2,1,N*4,N*4+1,N*4+2,N*4,N*4+2,N*4+3);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();g.setAttribute('uv',new T.Float32BufferAttribute(p.flatMap((q,i)=>i%3===0?[q,p[i+2]]:[]),2));emit(g,material,0,0,0);
 };
 for(let i=0;i<52;i++){const t=(i+.5)/52,p=deckPoint(t),d=curve.getTangent(t),yaw=-Math.atan2(d.z,d.x);b([p.x,p.y-.13,p.z],[curve.getLength()/52*.98,.26,bridgeWidth+.04],stone,yaw);}
 for(const side of[-1,1]){
  band(side,-.46,-.14,.27,timber);
  for(const y of[.24,.64,1.06])band(side,y-.06,y+.06,y>1?.18:.12,timber,side<0?.73:1);
  for(let i=0;i<=(side<0?5:8);i++){
   const p=cross(i/8,side),d=curve.getTangent(i/8),yaw=-Math.atan2(d.z,d.x),major=i%4===0;
   b([p.x,p.y+.59,p.z],[major?.25:.16,1.18,major?.25:.16],major?stone:timber,yaw);
   if(major){b([p.x,p.y+1.23,p.z],[.34,.12,.34],stone,yaw);finial([p.x,p.y+1.29,p.z],.12);}
  }
 }
 // A connected stair/landing/bridge graph. Every datum is shared by the
 // adjacent pieces, rather than placing independent solid boxes by eye.
 const hall=new T.Matrix4().makeTranslation(4.6,0,-9).multiply(new T.Matrix4().makeRotationY(-.25));
 const hp=(x,y,z)=>V([x,y,z]).applyMatrix4(hall);
 const flightTop=6.60,flightBottom=5.0,flightCount=10,runStart=5.15,tread=.32,stairWidth=5.8;
 const stepSolids=[];
 for(let i=0;i<flightCount;i++){
  const y=flightTop-(i+1)*(flightTop-flightBottom)/flightCount,z=runStart+(i+.5)*tread;
  // Four independently jointed granite slabs form each tread. Full-height
  // riser faces are supported by masonry, with no huge smooth gray frontage.
  for(let j=0;j<4;j++){const q=hp(-stairWidth/2+(j+.5)*stairWidth/4,y-.085,z);b(q.toArray(),[stairWidth/4-.012,.17,tread+.018],stone,-.25);stepSolids.push({centre:q.toArray(),top:y});}
  for(const side of[-1,1]){const q=hp(side*(stairWidth/2+.10),y-.20,z);b(q.toArray(),[.22,.40,tread+.016],stone,-.25);}
  // Solid coursed backing rises directly below its own tread.
  const bottom=4.82;
  for(let yy=bottom+.10;yy<y-.17;yy+=.20)for(let j=0;j<8;j++){const q=hp(-stairWidth/2+(j+.5)*stairWidth/8,yy,z);b(q.toArray(),[stairWidth/8-.012,.192,tread+.014],stone,-.25);}
 }
 function slabQuad(corners,thickness=.25){const pos=[],ix=[];for(const h of[0,-thickness])for(const q of corners)pos.push(q.x,q.y+h,q.z);ix.push(0,2,1,0,3,2,4,5,6,4,6,7);for(let i=0;i<4;i++){const j=(i+1)%4;ix.push(i,j,i+4,j,j+4,i+4);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(pos.flatMap((q,i)=>i%3===0?[q/.317,pos[i+2]/.317]:[]),2));g.setIndex(ix);g.computeVertexNormals();emit(g,stone,0,0,0);}
 const stairBottomLeft=hp(-stairWidth/2,5,runStart+flightCount*tread+.01),stairBottomRight=hp(stairWidth/2,5,runStart+flightCount*tread+.01);
 const bridgeLandingRight=cross(1,-1),bridgeLandingLeft=cross(1,1);
 // One broad granite landing ties the stair edge directly to the bridge seat.
 slabQuad([stairBottomLeft,stairBottomRight,bridgeLandingRight,bridgeLandingLeft],.24);
 function slopeBeam(a,bp,h,width=.14){const p=a.clone().add(new T.Vector3(0,h,0)),q=bp.clone().add(new T.Vector3(0,h,0)),direction=q.clone().sub(p),mid=p.clone().add(q).multiplyScalar(.5),g=new RoundedBoxGeometry(direction.length(),width,width,2,.012),quat=new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),direction.normalize()),e=new T.Euler().setFromQuaternion(quat);emit(g,timber,...mid.toArray(),1,1,1,[e.x,e.y,e.z]);}
 for(const side of[-1,1]){const a=hp(side*3.02,flightTop,runStart),end=hp(side*3.02,flightBottom,runStart+flightCount*tread);for(let i=0;i<=5;i++){const p=a.clone().lerp(end,i/5);b([p.x,p.y+.52,p.z],[.20,1.04,.20],timber,-.25);}for(const h of[.24,.66,1.03])slopeBeam(a,end,h);}
 const connectionAudit={stairRisers:flightCount,riseMetres:.16,treadMetres:.32,slabsPerTread:4,mainLandingY:5,bridgeJoinY:deckPoint(1).y,connectorRisers:0,stairTreadSlabs:stepSolids.length,landingSupports:'Irregular stone abutments at both banks; no mid-water piers',unmeasuredDepths:true};
 const audit={revision:'layout121',connections:connectionAudit,reference:layout118.reference,observedLandmarks:layout118.landmarks,nearRail:{corner:corner.toArray(),heightSectionMetres:.25,depthSectionMetres:.34,postSectionMetres:.56,intermediateGoldFinials:0,lowerPanelBelowHandrailMetres:1.72},bridge:{widthMetres:bridgeWidth,screenSpanFraction:(land.bridgeRight.pixel[0]-land.bridgeLeft.pixel[0])/layout118.imageDimensions[0],knots:knots.map(p=>p.toArray()),lengthMetres:curve.getLength(),separateDescendingStairFlight:false,midWaterPiers:0,abutments:'Weathered rock masses and granite bearing seats at both ends'},scope:'Reconstructed near rail and short arched bridge crossing in real3D; endpoint depths and abutment internals are inferred from the fixed camera fit.',visualAccepted:false};
 return{audit,dispose(){timber.dispose();gilt.dispose();patina.dispose();stone.dispose();for(const g of abutmentRocks)g.dispose();}};
}
