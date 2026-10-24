import {gardenWalkHeight214} from './garden-terrain.js';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {layout118,garden130BridgeKnots,approach214} from './layout118-data.js';
import {createWeatheredBoulderGeometry} from './boulder.js';
import {handcutStep184} from './handcut-steps184.js';
const V=p=>new T.Vector3(...p),TAU=Math.PI*2;

export function buildReferenceLayout118(api){
 const {emit,box,rod,group,mats,graniteMaps,scannedStones,scannedFrieze}=api,land=layout118.landmarks;
 const timber=mats.red.clone();timber.name='layout166-aged-vermilion-solid-timber';timber.color.setRGB(6.2,2.65,1.35);timber.onBeforeCompile=mats.red.onBeforeCompile;timber.customProgramCacheKey=()=>mats.red.customProgramCacheKey()+':red-lacquer166';timber.userData.scannedTimber=true;
 const handrail=timber.clone();handrail.name='layout166-hand-polished-vermilion-crest';handrail.clearcoat=.32;handrail.clearcoatRoughness=.31;handrail.roughness=.65;handrail.onBeforeCompile=timber.onBeforeCompile;handrail.customProgramCacheKey=timber.customProgramCacheKey;
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
  for(const [h,w,d]of[[0,.25,.34],[-.61,.19,.23],[-1.35,.27,.29],[-2.08,.23,.29]])along(corner.toArray(),end.toArray(),h,w,d,h===0?handrail:timber);
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
    // A complete measured 3D floral field sits within each recessed cassette,
    // with rigid natural-aspect fitting. It replaces disconnected wire curls.
    // This is a declared reused peony scan, not an exact source-photo motif.
    scannedFrieze.panel(0,-1.72,.077,w-.105,.51,{hostY:1,copies:1,label:'veranda-lower-cassette166'});
    for(const xx of[-w/2+.06,w/2-.06])for(const yy of[-1.48,-1.96]){
     emit(new T.SphereGeometry(.012,10,6),patina,xx,yy,.087,1,1,.48);
    }
   });
  }
 }
 const bridgeWidth=2.8,knots=garden130BridgeKnots.map(V);
 // The arch ends on a planted bank. Its right end continues into the
 // descending garden stair visible in the photograph, rather than ending
 // abruptly at the hall's tall foundation wall.
 const curve=new T.CatmullRomCurve3(knots,false,'centripetal');
 const deckPoint=t=>curve.getPoint(t);
 const cross=(t,side=0)=>{const p=deckPoint(t),d=curve.getTangent(t),n=new T.Vector3(-d.z,0,d.x).normalize();return p.addScaledVector(n,side*bridgeWidth*.5);};
 const stone=new T.MeshStandardMaterial({name:'scene07-jointed-weathered-path-granite',color:0x858d8d,roughness:.92,map:graniteMaps.map,normalMap:graniteMaps.normalMap,roughnessMap:graniteMaps.roughnessMap});stone.normalScale.set(.32,.32);stone.userData.metricGranite=true;
 stone.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 vec3 g=texture2D(map,vMapUv).rgb;float mineral=dot(g,vec3(.2126,.7152,.0722));diffuseColor.rgb*=clamp(pow(max(mineral,.0001)/.153180782734,.65),.66,1.42);
 #endif`);};stone.customProgramCacheKey=()=> 'scene07-neutral-path-granite130';
 const stairTimber=timber.clone();stairTimber.name='scene07-aged-stair-rail';stairTimber.color.setRGB(2.8,1.55,1.40);stairTimber.onBeforeCompile=timber.onBeforeCompile;stairTimber.customProgramCacheKey=timber.customProgramCacheKey;
 const terrainHeight=typeof api.terrainHeight==='function'?api.terrainHeight:()=>-.2;
 const abutmentRocks=[
  createWeatheredBoulderGeometry(T,{scale:[1,.72,.9],seed:1207,sectors:28,rings:14}),
  createWeatheredBoulderGeometry(T,{scale:[.88,.68,1],seed:1229,sectors:28,rings:14})
 ];
 function bankBearing(t,landwardSign){
  const p=deckPoint(t),d=curve.getTangent(t).normalize(),n=new T.Vector3(-d.z,0,d.x).normalize(),yaw=-Math.atan2(d.z,d.x);
  for(const side of[-1,1]){
   const foot=p.clone().addScaledVector(d,landwardSign*.50).addScaledVector(n,side*.72),walk=gardenWalkHeight214(foot.x,foot.z,.1),stoneTop=Math.min(p.y-.28,Number.isFinite(walk)?walk-.23:Infinity),ground=Math.min(terrainHeight(foot.x,foot.z),stoneTop-.34),height=stoneTop-ground;
   const rows=Math.max(1,Math.ceil(height/.42));
   for(let j=0;j<rows;j++){const v=scannedStones.variants[(j*3+(side+1)/2)%6],ss=.57+.025*Math.sin(j*2.4+side),rot=[0,yaw+j*.34,side*.03];if(!v.geometry.boundingBox)v.geometry.computeBoundingBox();const bounds=v.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(...rot)).scale(V([ss,ss,ss]))),yy=Math.min(ground+.20+j*.42,stoneTop-bounds.max.y);emit(v.geometry,ground+j*.42<.6?v.wet:v.dry,foot.x+.10*Math.sin(j*2.1),yy,foot.z+.08*Math.cos(j*1.9),ss,ss,ss,rot,.86+.08*Math.sin(j));}
  }
  const seat=p.clone().addScaledVector(d,landwardSign*.10);if(t===0)b([seat.x,p.y-.22,seat.z],[1.15,.32,bridgeWidth+.48],stone,yaw); // Right closed arch bed bears directly on fitted rubble; a broad cap would cross the descending treads.
 }
 bankBearing(0,-1);bankBearing(1,1);
 const band=(side,y0,y1,width,material,end=1)=>{
  const p=[],ix=[],N=96;
  for(let i=0;i<=N;i++){const t=end*i/N,c=cross(t,side),d=curve.getTangent(t),n=new T.Vector3(-d.z,0,d.x).normalize();for(const [w,y]of[[-width/2,y0],[width/2,y0],[width/2,y1],[-width/2,y1]])p.push(c.x+n.x*w,c.y+y,c.z+n.z*w);}
  for(let i=0;i<N;i++)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4,c=(i+1)*4+j,d=(i+1)*4+(j+1)%4;ix.push(a,b,c,b,d,c);}
  ix.push(0,3,2,0,2,1,N*4,N*4+1,N*4+2,N*4,N*4+2,N*4+3);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();g.setAttribute('uv',new T.Float32BufferAttribute(p.flatMap((q,i)=>i%3===0?[q,p[i+2]]:[]),2));emit(g,material,0,0,0);
 };
 // A closed curved bed carries the individual jointed treads. Its timber
 // edge beams bend with the arch; there are no mid-channel support stacks.
 band(0,-.42,-.14,bridgeWidth,stone);
 for(let i=0;i<56;i++){const t=(i+.5)/56,p=deckPoint(t),d=curve.getTangent(t),yaw=-Math.atan2(d.z,d.x);for(let j=0;j<3;j++){const n=new T.Vector3(-d.z,0,d.x).normalize(),q=p.clone().addScaledVector(n,(j-1)*bridgeWidth/3);b([q.x,q.y-.08,q.z],[curve.getLength()/56*.99,.16,bridgeWidth/3-.014],stone,yaw);}}
 const bridgeFinial=(p)=>{const profile=[[0,0],[.15,0],[.15,.06],[.10,.10],[.085,.18],[.14,.23],[.12,.29],[0,.40]];emit(new T.LatheGeometry(profile.map(q=>new T.Vector2(...q)),20),patina,p.x,p.y,p.z);};
 for(const side of[-1,1]){
  band(side,-.43,-.17,.24,timber);
  const end=side<0?.64:1;
  for(const y of[.24,.64,1.06])band(side,y-.055,y+.055,y>1?.18:.115,timber,end);
  const count=side<0?7:9;
  for(let i=0;i<=count;i++){
   const t=end*i/count,p=cross(t,side),d=curve.getTangent(t),yaw=-Math.atan2(d.z,d.x),major=i===0||i===count||i===Math.floor(count/2);
   b([p.x,p.y+.55,p.z],[major?.24:.15,1.10,major?.24:.15],major?stone:timber,yaw);
   if(major){b([p.x,p.y+1.13,p.z],[.32,.10,.32],stone,yaw);bridgeFinial(new T.Vector3(p.x,p.y+1.18,p.z));}
  }
 }
 function slopeBeam(a,bp,h,width=.14,material=timber){const p=a.clone().add(new T.Vector3(0,h,0)),q=bp.clone().add(new T.Vector3(0,h,0)),direction=q.clone().sub(p),mid=p.clone().add(q).multiplyScalar(.5),g=new RoundedBoxGeometry(direction.length(),width,width,2,.012),quat=new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),direction.normalize()),e=new T.Euler().setFromQuaternion(quat);emit(g,material,...mid.toArray(),1,1,1,[e.x,e.y,e.z]);}
 function stair(a,end,width,count,{railMaterial=timber,railSides=[-1,1],minBase=-.3}={}){
  const direction=end.clone().sub(a),horizontal=Math.hypot(direction.x,direction.z),d=new T.Vector3(direction.x,0,direction.z).normalize(),n=new T.Vector3(-d.z,0,d.x),yaw=-Math.atan2(d.z,d.x),depth=horizontal/count;
  for(let i=0;i<count;i++){
   const t=(i+.5)/count,p=a.clone().lerp(end,t),top=a.y+(end.y-a.y)*(i+1)/count;
   const ground=Math.min(top-.18,Math.max(minBase,terrainHeight(p.x,p.z)-.08)),h=Math.max(.18,top-ground);
   b([p.x,top-h/2-.02,p.z],[depth+.025,h,width],mats.terraceStone,yaw);
   for(let j=0;j<4;j++){
    const q=p.clone().addScaledVector(n,(-.5+(j+.5)/4)*width),g=handcutStep184(depth+.028,width/4-.012,.13,Math.round((a.x+31)*29+(a.z+41)*17)+i*13+j*3);
    emit(g,stone,q.x,top-.065,q.z,1,1,1,[0,yaw,0],.94+.035*Math.sin(i*2.1+j*1.7));
   }
  }
  for(const side of railSides){
   const aa=a.clone().addScaledVector(n,side*(width*.5+.06)),bb=end.clone().addScaledVector(n,side*(width*.5+.06));
   const posts=Math.max(3,Math.ceil(horizontal/.75));
   for(let j=0;j<=posts;j++){const p=aa.clone().lerp(bb,j/posts);b([p.x,p.y+.51,p.z],[.17,1.02,.17],railMaterial,yaw);b([p.x,p.y+1.04,p.z],[.22,.08,.22],railMaterial,yaw);}
   for(const h of[.24,.64,1.05])slopeBeam(aa,bb,h,h>1?.15:.11,railMaterial);
  }
 }
 // The shortened lower storey raises the entrance floor while preserving
 // every roof/pagoda anchor. Twelve shallow treads meet a compact forecourt.
 const hall=new T.Matrix4().makeTranslation(4.6,0,-9).multiply(new T.Matrix4().makeRotationY(-.25)),hp=(x,y,z)=>V([x,y,z]).applyMatrix4(hall);
 const flightTop=7.50,flightBottom=5.80,flightCount=12,runStart=5.15,tread=.24,stairWidth=4.85;
 const stairTop=hp(0,flightTop,runStart),stairBottom=hp(0,flightBottom,runStart+flightCount*tread);
 stair(stairTop,stairBottom,stairWidth,flightCount,{railMaterial:stairTimber});
 const landingCentre=hp(0,flightBottom,runStart+flightCount*tread+.47);
 b([landingCentre.x,flightBottom-.17,landingCentre.z],[stairWidth,.34,.96],stone,-.25);
 // Four closed timber bearing members carry the short over-bank landing.
 // Its two rubble seats use uniformly scaled stones, rather than stretching
 // a single boulder into the tall smooth pillars rejected in native r03.
 for(const zz of[8.08,8.35,8.62,8.89]){const p=hp(0,flightBottom-.55,zz);b([p.x,p.y,p.z],[stairWidth+.12,.46,.24],stairTimber,-.25);}
 for(const side of[-1,1]){
  const p=hp(side*(stairWidth/2-.50),0,8.48),ground=terrainHeight(p.x,p.z),height=flightBottom-.78-ground,rows=Math.max(1,Math.ceil(height/.40));
  for(let j=0;j<rows;j++){const v=scannedStones.variants[(j*3+(side+1)/2)%6],ss=.53+.02*Math.cos(j*2.1),rot=[0,-.25+j*.31,side*.025];if(!v.geometry.boundingBox)v.geometry.computeBoundingBox();const bounds=v.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(...rot)).scale(V([ss,ss,ss]))),yy=Math.min(ground+.19+j*.40,flightBottom-.80-bounds.max.y);emit(v.geometry,yy<.55?v.wet:v.dry,p.x+.08*Math.sin(j*2.2),yy,p.z+.08*Math.cos(j*1.7),ss,ss,ss,rot,.86+.06*Math.cos(j*1.8));}
 }
 // A short side connection descends from the forecourt to the bridge bank.
 // The longer visible right approach continues from the same bridge datum.
 const connectorStart=hp(2.10,flightBottom,9.0),connectorEnd=deckPoint(1);
 stair(connectorStart,connectorEnd,2.55,3,{railMaterial:timber,railSides:[]});
 const rightApproachEnd=V(approach214.rightEnd);
 stair(deckPoint(1),rightApproachEnd,bridgeWidth,approach214.risers,{railMaterial:timber,railSides:[-1]});
 const pathEnd=V(approach214.gardenTurn);stair(rightApproachEnd,pathEnd,bridgeWidth,12,{railMaterial:timber,railSides:[-1]});
 // True staggered rubble shoulders cover both the short stair and the level
 // causeway. Each uniform scan is fitted below the walking plane. The solid
 // terrain core carries them; no narrow stacked boulder columns are added.
 let retainingStones214=0;
 for(const [a,end]of[[deckPoint(1),rightApproachEnd],[rightApproachEnd,pathEnd]]){
  const d=end.clone().sub(a);d.y=0;const len=d.length();d.normalize();const n=new T.Vector3(-d.z,0,d.x),courses=Math.ceil(len/.63);
  for(let row=0;row<8;row++)for(let j=0;j<=courses;j++){
   const t=Math.max(.015,Math.min(.985,(j+.23+(row%2)*.39)/(courses+.65))),p=a.clone().lerp(end,t),y=p.y-.64-row*.53,
    toe=.10+.42*Math.min(1,row/5),off=bridgeWidth*.5+toe+.08*Math.sin(j*1.9+row),q=p.clone().addScaledVector(n,off),soil=terrainHeight(q.x+n.x*.46,q.z+n.z*.46);
   if(y<soil-.35||y<-.12)continue;
   const v=scannedStones.variants[(j*5+row*3)%6],ss=.58+.10*Math.sin(j*2.1+row*.71),rot=[.06*Math.sin(row+j),j*.63+row*.97,.055*Math.cos(j-row)];
   if(!v.geometry.boundingBox)v.geometry.computeBoundingBox();const bounds=v.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(...rot)).scale(V([ss,ss,ss]))),walk=gardenWalkHeight214(q.x,q.z,ss+.25),yy=Number.isFinite(walk)?Math.min(y,walk-.22-bounds.max.y):y;
   emit(v.geometry,yy<.7?v.wet:v.dry,q.x,yy,q.z,ss,ss,ss,rot,.92+.06*Math.sin(j+row*2.4));retainingStones214++;
  }
 }
 stair(new T.Vector3(-10.2,3.30,-3.5),deckPoint(0),bridgeWidth,5,{railMaterial:timber,railSides:[-1]});
 const connectionAudit={revision:'scene07-rock-founded-short-descent214-r08',stairWidth,stairRisers:flightCount,riseMetres:(flightTop-flightBottom)/flightCount,treadMetres:tread,slabsPerTread:4,mainLandingY:flightBottom,bridgeJoinY:deckPoint(1).y,connectorRisers:3,rightApproachRisers:approach214.risers,rightApproachRailSides:[-1],rightApproachEnd:rightApproachEnd.toArray(),gardenTurn:pathEnd.toArray(),retainingStones214,landingSupports:'Compact stair apron, narrow terrain-core causeway, eight staggered rubble courses fitted below walking plane; full east inlet remains open',granite:'Closed hand-cut solid treads with variable clipped corners, 6mm top arris and separate walked plane',unmeasuredDepths:true};
 const auditCamera=new T.PerspectiveCamera(layout118.camera.fov,1,.1,350);auditCamera.position.fromArray(layout118.camera.position);auditCamera.lookAt(V(layout118.camera.target));auditCamera.updateMatrixWorld(true);const projected=knots.map(p=>p.clone().project(auditCamera));
 const audit={revision:'layout130-connected-garden',connections:connectionAudit,reference:layout118.reference,observedLandmarks:layout118.landmarks,nearRail:{corner:corner.toArray(),heightSectionMetres:.25,depthSectionMetres:.34,postSectionMetres:.56,intermediateGoldFinials:0,lowerPanelBelowHandrailMetres:1.72},bridge:{widthMetres:bridgeWidth,screenSpanFraction:(projected.at(-1).x-projected[0].x)/2,observedReferenceSpanFraction:(land.bridgeRight.pixel[0]-land.bridgeLeft.pixel[0])/layout118.imageDimensions[0],knots:knots.map(p=>p.toArray()),lengthMetres:curve.getLength(),separateDescendingStairFlight:true,midWaterPiers:0,abutments:'Weathered rock shoulders embedded in the two planted banks'},scope:'Actual closed arched bridge in front of the main stair/landing, with jointed granite deck, compact hall stair, front-edge side connection and descending right approach; hidden depths and heights remain inferred.',visualAccepted:false};
 audit.nearRail.revision='scene07-recessed-scanned-floral-cassettes166-r01';audit.nearRail.scannedCarving='Declared CC BY peony field, mounted as a uniform 3D reused ornament; exact photographic motif unaccepted';
 return{audit,dispose(){timber.dispose();handrail.dispose();stairTimber.dispose();gilt.dispose();patina.dispose();stone.dispose();for(const g of abutmentRocks)g.dispose();}};
}
