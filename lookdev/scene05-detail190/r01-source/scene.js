import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createRestorationArchitecture} from './architecture.js';
import {createReference4MaterialSet} from './materials.js';
import {buildMapleCanopy} from './foliage.js';
import {loadBlenderJoinery} from './blender-joinery.js';
import {createSculptedJoinery} from './sculpted-joinery.js';
import {createRafterEndCopper} from './rafter-end-copper.js';
import {createClayTile05} from './handlaid-ceramics.js';
import {createAgedPier05} from './aged-pier.js';
import {assignTimberPathUV05} from './timber-path-uv.js';
import {createHipTimber190,closedWire190} from './detail190-solids.js';
import {createSecondaryCopper190} from './secondary-copper190.js';
import {createLantern190} from './lantern190.js';
import {createCornerMask190} from './corner-mask190.js';
import {installScannedTimber,assignMetricTimberUV} from './scanned-timber.js';
import {installMeasuredSky} from './measured-sky.js';
import {POSE,TIER_SPEC,tierPlacement,tierWorldPoint} from './tier-layout.js';
export {POSE};
export async function buildScene(){
 const scene=new T.Scene();scene.background=new T.Color('#79b8f2');
 const materialSet=createReference4MaterialSet(T),mats=materialSet.mats;
 mats.red.color.set('#aa5030');mats.cedar.color.set('#985430');mats.endwood.color.set('#c28545');
 mats.slate.color.set('#2b3e4b');mats.slate.roughness=.48;mats.tileEdge.color.set('#a3a69f');mats.darkwood.color.set('#555b4d');mats.paper.color.set('#282e25');
 mats.gold.color.set('#e1af46');mats.oldgold.color.set('#c79a43');
 mats.gold.roughness=.33;mats.oldgold.roughness=.42;
 mats.lanternPaper=mats.paper.clone();mats.lanternPaper.name='scene05-lantern-paper';mats.lanternPaper.color.set('#f2e5bb');mats.lanternPaper.emissive.set('#f7d792');mats.lanternPaper.emissiveIntensity=.12;
 // Private cap surfaces keep the glazed ceramic recess distinct from the roof.
 mats.tileEndCeramic=mats.slate.clone();mats.tileEndCeramic.name='scene05-dark-inset-tile-cap';mats.tileEndCeramic.color.set('#515650');mats.tileEndCeramic.roughness=.65;
 mats.tileEndRelief=mats.slate.clone();mats.tileEndRelief.name='scene05-worn-ceramic-floral-relief';mats.tileEndRelief.color.set('#b49b64');mats.tileEndRelief.roughness=.66;mats.tileEndRelief.metalness=.28;
 mats.cornerCeramic=mats.slate.clone();mats.cornerCeramic.name='scene05-aged-charcoal-ceramic-corner-carving';mats.cornerCeramic.color.set('#4b5052');mats.cornerCeramic.roughness=.68;mats.cornerCeramic.bumpScale=.0018;

 const baseJoineryKit=await loadBlenderJoinery(),sculptedJoinery=createSculptedJoinery(),endCopper=createRafterEndCopper(),endCopperSmall=createRafterEndCopper({detail:'small'}),secondary190=createSecondaryCopper190(),lantern190=createLantern190(),mask190=createCornerMask190();
 const joineryKit={...baseJoineryKit,bracket:sculptedJoinery.bracket,cornerFan:sculptedJoinery.cornerFan,bracketFittings:sculptedJoinery.bracketFittings,cornerFanFittings:sculptedJoinery.cornerFanFittings,waistBearing:sculptedJoinery.waistBearing,waistFittings:sculptedJoinery.waistFittings,relief:sculptedJoinery.relief,fittingParts:endCopper.parts,fittingPartsSmall:endCopperSmall.parts,secondaryFittingParts:secondary190.parts,cornerMask:mask190.parts,sculpted:true,info:{...sculptedJoinery.info,endFitting:endCopper.info,secondary190:secondary190.info,lantern190:lantern190.info,mask190:mask190.info},dispose(){baseJoineryKit.dispose();sculptedJoinery.dispose();endCopper.dispose();endCopperSmall.dispose();secondary190.dispose();lantern190.dispose();mask190.dispose();}};Object.assign(mats,joineryKit.materials);
 const copperPixels=new Uint8Array(128*128*4);for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   const hash=(a,b)=>{const q=Math.sin(a*127.1+b*311.7)*43758.5453;return q-Math.floor(q);};
   const q=Math.round(255*(.83+.09*Math.sin(x*.20+Math.sin(y*.11))+.06*(hash(x,y)-.5)-.09*(hash(x>>2,y>>2)>.92?1:0))),i=(y*128+x)*4;copperPixels[i]=copperPixels[i+1]=copperPixels[i+2]=q;copperPixels[i+3]=255;
 }
 const copperFinish=new T.DataTexture(copperPixels,128,128);copperFinish.wrapS=copperFinish.wrapT=T.RepeatWrapping;copperFinish.minFilter=T.LinearMipmapLinearFilter;copperFinish.magFilter=T.LinearFilter;copperFinish.generateMipmaps=true;copperFinish.needsUpdate=true;
 mats.fittingCopper=new T.MeshStandardMaterial({name:'scene05-worked-copper-wrapped-end-cup',color:'#bc944e',metalness:.86,roughness:.46,envMapIntensity:1.30,bumpMap:copperFinish,bumpScale:.00025,roughnessMap:copperFinish});
 mats.fittingEdge=new T.MeshStandardMaterial({name:'scene05-folded-chrysanthemum-copper',color:'#dab86f',metalness:.90,roughness:.39,envMapIntensity:1.45,bumpMap:copperFinish,bumpScale:.00018,roughnessMap:copperFinish});
 mats.fittingPatina=new T.MeshStandardMaterial({name:'scene05-lower-patinated-copper-grooves',color:'#5c4325',metalness:.65,roughness:.80,envMapIntensity:.45});
 // Solid code-built geometry and the user-authorized image-assisted relief.
 const stack=[new T.Matrix4()],bucket=new Map(),geometryCache=new Map(),columns=[];
 const primitive={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,16,10),cone:new T.ConeGeometry(1,1,16)};
 function instance(geo,mat,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=null,tint=1){
   if(typeof geo==='string')geo=primitive[geo];if(!geo)throw Error('Unknown geometry');
   let material=mats[mat];if(!material)throw Error('Unknown material '+mat);
   const quaternion=rot?.isQuaternion?rot:new T.Quaternion().setFromEuler(new T.Euler(...(Array.isArray(rot)?rot:[0,0,0])));
   const matrix=stack.at(-1).clone().multiply(new T.Matrix4().compose(new T.Vector3(x,y,z),quaternion,new T.Vector3(sx,sy,sz)));
   if(!bucket.has(material))bucket.set(material,[]);bucket.get(material).push({geo,matrix,tint});
 }
 function group(x,y,z,angle,fn){stack.push(stack.at(-1).clone().multiply(new T.Matrix4().makeTranslation(x,y,z)).multiply(new T.Matrix4().makeRotationY(angle)));try{fn();}finally{stack.pop();}}
 function box(x,y,z,w,h,d,ma='cedar',rot=0,tint=1){
   if(ma==='postwood'){
     const key='checked-pier:'+w.toFixed(5)+':'+h.toFixed(5)+':'+d.toFixed(5);
     if(!geometryCache.has(key))geometryCache.set(key,createAgedPier05(w,h,d));
     instance(geometryCache.get(key),ma,x,y,z,1,1,1,[0,rot,0],tint);return;
   }
   if(['red','cedar','endwood','darkwood','architecture_red','architecture_cedar','architecture_endwood','windowBars','postwood'].includes(ma)&&Math.min(w,h,d)>.045){
     const key=[w,h,d].map(n=>n.toFixed(5)).join(':');
     if(!geometryCache.has(key))geometryCache.set(key,new RoundedBoxGeometry(w,h,d,1,Math.min(.014,Math.min(w,h,d)*.10)));
     instance(geometryCache.get(key),ma,x,y,z,1,1,1,[0,rot,0],tint);
   }else instance('box',ma,x,y,z,w,h,d,[0,rot,0],tint);
 }
 mats.handformedClay=new T.MeshPhysicalMaterial({name:'scene05-handformed-grey-fired-clay',color:'#555951',roughness:.63,metalness:.015,clearcoat:.10,clearcoatRoughness:.49,vertexColors:true});
 const arch=createRestorationArchitecture({instance,group,box,materials:mats,columns,stack,joineryKit,handlaidCeramics:true,tierCollarMaterial:'red',pagodaPostMaterial:'postwood',cornerCeramicScale:.82});
 mats.architecture_red.color.set('#b35c34');mats.architecture_cedar.color.set('#a9653d');mats.architecture_endwood.color.set('#b47538');mats.architecture_slate.color.set('#293b48');mats.architecture_slate.roughness=.48;mats.architecture_tileEdge.color.set('#a9aca4');mats.architecture_gold.color.set('#e8b84f');mats.architecture_oldgold.color.set('#c99c4e');mats.architecture_darkwood.color.set('#565d50');
 mats.windowBars=mats.architecture_darkwood.clone();mats.windowBars.name='scene05-weathered-gray-window-bars';mats.windowBars.color.set('#526053');mats.windowBars.roughnessMap=null;mats.windowBars.roughness=.87;mats.windowBars.envMapIntensity=.25;
 for(const [name,m]of Object.entries(mats)){
   if(['red','cedar','endwood','darkwood'].some(k=>name===k||name==='architecture_'+k)){
     m.roughnessMap=null;m.roughness=name.includes('endwood')?.84:.76;m.envMapIntensity=.28;m.bumpScale=.006;
     m.onBeforeCompile=shader=>{
       shader.vertexShader='varying vec2 vWearUv;\n'+shader.vertexShader;
       shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvWearUv=uv;');
       shader.fragmentShader='varying vec2 vWearUv;\n'+shader.fragmentShader;
       shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float warped=vWearUv.x*470.+sin(vWearUv.y*24.)*2.0+sin(vWearUv.y*57.+vWearUv.x*13.)*.7;
float grainFilter=1.-smoothstep(.65,2.5,fwidth(warped));
float grain=(sin(warped)*.055+sin(warped*2.31)*.032)*grainFilter;
float aged=sin(vWearUv.x*16.+sin(vWearUv.y*8.))*.065;
float split=pow(max(0.,sin(vWearUv.x*169.+sin(vWearUv.y*12.)*.4)),30.)*smoothstep(.0,.6,sin(vWearUv.y*14.+vWearUv.x*31.));
diffuseColor.rgb*=.94+grain+aged-split*.20;
`);
     };m.customProgramCacheKey=()=> 'scene05-aged-wood-grain-v3';
   }
   if(name==='gold'||name==='architecture_gold'){m.roughness=.38;m.envMapIntensity=1.45;}
   if(name==='oldgold'||name==='architecture_oldgold'){m.roughness=.46;m.envMapIntensity=1.08;}
 }
 mats.lanternBronze=new T.MeshStandardMaterial({name:'scene05-lantern-aged-bronze',color:'#654322',metalness:.82,roughness:.46,envMapIntensity:.88});
 const scannedTimber=await installScannedTimber(mats);
 mats.hipwood=mats.red.clone();mats.hipwood.name='scene05-aged-raked-hip-timber';mats.hipwood.color.set('#713817');mats.hipwood.roughness=.92;mats.hipwood.clearcoat=.025;mats.hipwood.specularIntensity=.24;mats.hipwood.envMapIntensity=.55;mats.hipwood.onBeforeCompile=mats.red.onBeforeCompile;mats.hipwood.customProgramCacheKey=mats.red.customProgramCacheKey;mats.hipwood.userData.metricTimberGrain=true;
 mats.postwood=mats.architecture_red.clone();mats.postwood.name='scene05-square-weathered-structural-pier';mats.postwood.color.set('#926645');mats.postwood.roughness=.93;mats.postwood.clearcoat=.045;mats.postwood.onBeforeCompile=mats.architecture_red.onBeforeCompile;mats.postwood.customProgramCacheKey=mats.architecture_red.customProgramCacheKey;mats.postwood.userData.metricTimberGrain=true;
 // Lower story begins at 0.35 m; the low camera sees an architectural tower continuing beyond the top crop.
 mats.carvingGround=new T.MeshStandardMaterial({name:'scene05-dark-carved-ground',color:'#2b2116',roughness:.9});
 const leafShape=new T.Shape();leafShape.moveTo(-.5,0);leafShape.bezierCurveTo(-.15,.23,.29,.28,.5,0);leafShape.bezierCurveTo(.15,-.19,-.2,-.13,-.5,0);
 const carvedLeaf=new T.ExtrudeGeometry(leafShape,{depth:.025,steps:1,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:1,curveSegments:5});
 const levels=[],landmarkWorlds={};
 for(let level=0;level<5;level++){
   const placement=tierPlacement(level);stack.push(stack.at(-1).clone().multiply(new T.Matrix4().makeTranslation(0,placement.baseY,0)).multiply(new T.Matrix4().makeScale(placement.scale,placement.scale,placement.scale)));
   const scale=1,w=TIER_SPEC.width,y=0,deckWidth=level?w*tierPlacement(level-1).scale/placement.scale:w+.5,roofWidth=w+TIER_SPEC.roofAddition,roofY=placement.roofHeight,roofRise=placement.roofRise,lanternY=placement.lanternHeight;
   box(0,.15,0,deckWidth,.30,deckWidth,'darkwood');
   const next=level<4?tierPlacement(level+1):null,storyPitch=next?(next.baseY-placement.baseY)/placement.scale:null;
   // Below the photographed waist is another occupied timber room. Carry
   // the visible gallery directly on its real purlin; a ghost full roof and
   // a tall solid collar were the wrong construction here (R01/R02 retained).
   const lowerFrame=placement.lowerOccupiedFrame,
     frame=arch.pagodaStoreyFrame({w,d:w,y,level,scale,roofWidth,roofDepth:roofWidth,roofRise,roofY,bracketVerticalScale:placement.bearingVerticalScale,bracketHorizontalScale:TIER_SPEC.bearingHorizontalScale,windowMaterial:'paper',detail:true,...(lowerFrame?{floorBearingY:storyPitch,windowHeadY:storyPitch-.13-.3868*placement.bearingVerticalScale-.14}:{})});
   const upperFloor=next?{width:w,depth:w,bottomY:storyPitch,topY:storyPitch+.30*next.scale/placement.scale}:null;
   if(!lowerFrame)arch.pagodaRoof({y:roofY,w:roofWidth,d:roofWidth,rise:roofRise,wallWidth:w,wallDepth:w,frameScale:1,detail:true,soffitMaterial:'darkwood',referenceMode:'scene05-calibrated',upperFloor});
   levels.push({level,y:placement.baseY,scale:placement.scale,width:w*placement.scale,shaftTop:placement.baseY+frame.shaftTop*placement.scale,roofY:placement.baseY+roofY*placement.scale,roofWidth:roofWidth*placement.scale,upperFloor:upperFloor?{width:w*placement.scale,bottomY:next.baseY}:null});
   const R=roofWidth/2;landmarkWorlds[level]={hipNear:tierWorldPoint(level,[R+.125,roofY+.8374,R+.125]),hipLeft:tierWorldPoint(level,[-R-.125,roofY+.8374,R+.125]),postHead:tierWorldPoint(level,[w/2,frame.shaftTop,w/2]),waistNear:tierWorldPoint(level,[deckWidth/2+.04,.58,deckWidth/2+.04]),lanternNear:tierWorldPoint(level,[R*1.025,lanternY,R*1.025]),lanternLeft:tierWorldPoint(level,[-R*1.025,lanternY,R*1.025]),tailSeat:tierWorldPoint(level,tailPath(w,y,scale,1,1,placement).getPoint(0).toArray()),tailCut:tierWorldPoint(level,[w/2+TIER_SPEC.roofAddition/2*TIER_SPEC.tailReach,placement.tailCutHeight,w/2+TIER_SPEC.roofAddition/2*TIER_SPEC.tailReach])};
   balcony(w,y+(level===0?.58:0),scale,deckWidth);
   if(!lowerFrame)cornerTails(w,y,scale,placement);
   pentRoof(w,y+.32,scale,deckWidth);carvedWindowInserts(w,y,scale);
   // Four identical suspended lanterns, each is fixed to the outer hip beam.
   const r=roofWidth/2;
   if(!lowerFrame)for(const sx of [-1,1])for(const sz of [-1,1])lantern(sx*r*1.025,y+lanternY,sz*r*1.025,.62*scale,[tailPath(w,y,scale,sx,sz,placement).getPoint(.20).toArray(),tailPath(w,y,scale,sx,sz,placement).getPoint(.28).toArray()]);
   // Flanking upper ties and chased metal straps on the visible actual member ends.
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     for(let k=-1;k<=1;k++){
       const x=k*w/3;box(x,y+2.65,w/2+.026,w/3-.22,.26,.16,'red');
       arch.squareFitting(x,y+2.65,w/2+.114,.15,.15,0,true);
       if(level<4){
         box(x,y+2.65,w/2+.116,.72*scale,.205*scale,.014,'carvingGround');
         const stalk=[];for(let j=0;j<=24;j++){const q=-.32+j*.64/24;stalk.push(new T.Vector3(x+q*scale,y+2.65+Math.sin(q*11+level)*.025*scale,w/2+.132));}
         instance(new T.TubeGeometry(new T.CatmullRomCurve3(stalk),24,.007*scale,5,false),'oldgold');
         for(let j=0;j<7;j++){const q=-.28+j*.09,sgn=j%2?1:-1;instance(carvedLeaf,j%3?'oldgold':'gold',x+q*scale,y+2.65+sgn*.039*scale,w/2+.138,.13*scale,.18*scale,.13,[0,0,sgn*.65+Math.sin(level+j)*.15]);}
       }
     }
   });
   stack.pop();
 }
 function carvedWindowInserts(w,y,s){
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>group(0,y+1.57,w/2+.09,0,()=>{
     for(const side of [-1,1]){box(side*.47*s,0,0,.055*s,.72*s,.055*s,'red');box(0,side*.34*s,0,.94*s,.05*s,.055*s,'red');}
     for(let n=0;n<3;n++){
       const points=[];for(let j=0;j<=32;j++){const t=j/32,phase=t*Math.PI*2+n*Math.PI*.67;points.push(new T.Vector3((t-.5)*.86*s,Math.sin(phase)*(.19-.02*n)*s,.018+Math.sin(phase*.7)*.012));}
       instance(new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.014*s,6,false),n%2?'oldgold':'cedar');
       for(let j=0;j<7;j++){const t=(j+.5)/7,p=points[Math.round(t*32)],sgn=j%2?1:-1;instance(carvedLeaf,j%3?'oldgold':'gold',p.x,p.y+sgn*.035*s,p.z+.014,.16*s,.22*s,.17,[0,0,sgn*.6+n*.23]);}
     }
     for(let k=0;k<5;k++){
       const cx=-.34+k*.17,points=[];for(let j=0;j<=28;j++){const a=j/28*Math.PI*1.85,r=.077*(1-j/40);points.push(new T.Vector3((cx+Math.cos(a)*r)*s,Math.sin(a)*r*s,.037));}
       instance(new T.TubeGeometry(new T.CatmullRomCurve3(points),28,.008*s,5,false),'oldgold');
     }
   }));
 }
 function tailPath(w,y,s,sx,sz,placement=TIER_SPEC){
   const radius=w/2+TIER_SPEC.roofAddition/2*(1.10/1.75)*s,t=radius/((w+TIER_SPEC.roofAddition)/2),
     // Seat the real brace in the actual diagonal hip timber. The former
     // fixed +.40 start lay inside the ceramic shell, above that bearing.
     hipCentre=placement.roofHeight+placement.roofRise*Math.pow(Math.max(0,1-t),1.43)+.48*Math.pow(t,9)*1.25-.365;
   const start=new T.Vector3(sx*radius,y+hipCentre,sz*radius);
   const end=new T.Vector3(sx*(w/2+TIER_SPEC.roofAddition/2*TIER_SPEC.tailReach*s),y+placement.tailCutHeight,sz*(w/2+TIER_SPEC.roofAddition/2*TIER_SPEC.tailReach*s));
   const mid=start.clone().lerp(end,.55).add(new T.Vector3(sx*.015,.025,sz*.015));return new T.CatmullRomCurve3([start,mid,end]);
 }
 function cornerTails(w,y,s,placement){
   for(const sx of [-1,1])for(const sz of [-1,1]){
     const path=tailPath(w,y,s,sx,sz,placement),end=path.getPoint(1);
     // Rectangular curved timber with real depth, connected to the crossing capital.
     const shaped=createHipTimber190(path,s),geometry=shaped.geometry;assignTimberPathUV05(geometry,path);instance(geometry,'hipwood');
     // One worked surface fitting belongs on each of the two principal
     // photographed hip ranks. It is seated on the true waisted cheek.
     if(placement.level===1||placement.level===2){const m=shaped.face(.68,new T.Vector3(sx,0,sz).normalize()),position=new T.Vector3(),q=new T.Quaternion(),v=new T.Vector3();m.decompose(position,q,v);for(const part of endCopper.parts)instance(part.geometry,part.material,...position.toArray(),.19*s,.21*s,.17*s,q);}
     const normal=path.getTangent(1).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),normal);
     const goldEnd=end.clone().addScaledVector(normal,.008);
     // The sleeve and its flower follow the real downward cut-plane normal.
     // The old yaw-only plaque left that true underside as a blank gold box.
     for(const p of endCopper.parts)instance(p.geometry,p.material,...goldEnd.toArray(),.276*s,.365*s,.276*s,q);
     // Small carved cheek leaves follow the load-bearing timber instead of floating in the bay.
     for(let j=0;j<4;j++){const p=path.getPoint(.30+j*.14);group(p.x,p.y,p.z,Math.atan2(sx,sz),()=>{instance(carvedLeaf,'oldgold',.165*s,0,0,.18*s,.14*s,.16,[0,Math.PI/2,j%2?.6:-.6]);});}
   }
 }
 function pentRoof(w,y,s,deckWidth=w+1.5*s){
   const inner=w/2+.035,outer=Math.max(w/2+.25,deckWidth/2+.04);
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     const p=[],ids=[],rows=5,cols=Math.round((2*outer)/.26),profile=t=>.36*s*Math.pow(Math.max(0,1-t),1.3)+.16*s*Math.pow(t,5);
     for(let j=0;j<=rows;j++)for(let k=0;k<=cols;k++){const t=j/rows,z=inner+(outer-inner)*t,x=(-1+2*k/cols)*(inner+(outer-inner)*t);p.push(x,y+profile(t),z);if(j<rows&&k<cols){const a=j*(cols+1)+k;ids.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}}
     const stride=p.length/3,upper=[...p],original=[...ids];for(let k=0;k<upper.length;k+=3)p.push(upper[k],upper[k+1]-.028,upper[k+2]);for(let k=0;k<original.length;k+=3)ids.push(original[k]+stride,original[k+2]+stride,original[k+1]+stride);
     const border=[...Array.from({length:cols},(_,i)=>i),...Array.from({length:rows},(_,j)=>j*(cols+1)+cols),...Array.from({length:cols},(_,i)=>rows*(cols+1)+cols-i),...Array.from({length:rows},(_,j)=>(rows-j)*(cols+1))];for(let k=0;k<border.length;k++){const a=border[k],b=border[(k+1)%border.length];ids.push(a,b,a+stride,b,b+stride,a+stride);}
     const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();instance(g,'slate');
     const pieces=[];
     for(let j=0;j<=cols;j++){
      const x=-outer+2*outer*j/cols,lo=Math.max(0,(Math.abs(x)-inner)/(outer-inner));
      if(lo<.98){for(let row=0;row<2;row++){const a=lo+(1.025-lo)*row/2,b=lo+(1.025-lo)*(row+1.025)/2,ts=Array.from({length:5},(_,k)=>a+(b-a)*k/4);pieces.push(createClayTile05(ts.map(t=>[x,y+profile(t),inner+(outer-inner)*t]),.163,{cover:true,variant:face*7+j*1.71+row}));if(j<cols){const xx=x+outer/cols;pieces.push(createClayTile05(ts.map(t=>[xx,y+profile(t),inner+(outer-inner)*t]),.213,{cover:false,variant:face*3+j*.87+row}));}}}
      arch.tileEnd(new T.Vector3(x,y+.16*s+.028,outer+.045),0,.102,true);
     }
     if(pieces.length){instance(mergeGeometries(pieces,false),'handformedClay');pieces.forEach(g=>g.dispose());}
     box(0,y+.08*s,outer,outer*2,.13*s,.15*s,'red');
     for(let j=1;j<cols;j++){const x=-inner+2*inner*j/cols;box(x,y+.10*s,(inner+outer)/2,.075*s,.105*s,outer-inner,'cedar');}
     // Narrow carved ceramic fascia under the round cap row. Its scrolls
     // project in real relief and stay attached to the small waist roof.
     box(0,y+.205*s,outer+.023,outer*2-.12,.105*s,.055*s,'cornerCeramic');
     const cloud=new T.Shape();cloud.moveTo(-.095,-.025);cloud.bezierCurveTo(-.11,.025,-.05,.061,-.018,.020);cloud.bezierCurveTo(.015,-.035,.062,-.023,.069,.011);cloud.bezierCurveTo(.060,.036,.022,.035,.022,.012);cloud.lineTo(.006,.002);cloud.bezierCurveTo(.022,.067,.095,.059,.101,.005);cloud.bezierCurveTo(.11,-.052,.025,-.062,-.014,-.021);cloud.bezierCurveTo(-.040,.014,-.081,.018,-.081,-.023);cloud.closePath();
     const cloudG=new T.ExtrudeGeometry(cloud,{depth:.012,steps:1,curveSegments:7,bevelEnabled:true,bevelThickness:.002,bevelSize:.002,bevelSegments:1});
     for(let j=0;j<Math.floor(2*outer/.22);j++)instance(cloudG,'tileEdge',-outer+.12+j*.22,y+.205*s,outer+.054,1,.66,1,[0,0,0],.61+(j%3)*.035);
   });
   for(const sx of[-1,1])for(const sz of[-1,1]){
     const angle=Math.atan2(sx,sz),corner=new T.Vector3(sx*outer,y+.19*s,sz*outer);
     group(...corner.toArray(),angle,()=>{for(const part of joineryKit.cornerMask)instance(part.geometry,part.material==='oldgold'?'oldgold':'cornerCeramic',0,.005,.012,.72,.72,.72);});
     const path=new T.CatmullRomCurve3([new T.Vector3(sx*inner,y+.37*s,sz*inner),new T.Vector3(sx*(inner+outer)/2,y+.24*s,sz*(inner+outer)/2),corner.clone().add(new T.Vector3(0,.025,0))]);
     instance(new T.TubeGeometry(path,16,.065*s,10,false),'cornerCeramic');
     const start=new T.Vector3(sx*(inner-.10),y+.20*s,sz*(inner-.10)),end=new T.Vector3(sx*(outer+.11),y-.12*s,sz*(outer+.11)),direction=end.clone().sub(start),normal=direction.clone().normalize(),mid=start.clone().add(end).multiplyScalar(.5),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),normal);
     instance('box','red',...mid.toArray(),.19*s,.215*s,direction.length(),q);
     for(const part of endCopper.parts)instance(part.geometry,part.material,...end.clone().addScaledVector(normal,.003).toArray(),.195*s,.220*s,.195*s,q);
   }
 }
 function balcony(w,y,s,deckWidth=w+.72){
   const d=deckWidth+.10,base=y+.29,top=base+.82;
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     box(0,base,d/2,d+.10,.15,.22,'red');box(0,base+.43,d/2,d+.10,.10,.14,'red');box(0,top,d/2,d+.18,.135,.19,'red');
     for(let i=0;i<=6;i++){
       const x=-d/2+i*d/6;box(x,(top+base)/2,d/2,.105,.95,.105,'red');
       if(i%2===0){instance(new T.LatheGeometry([[0,0],[.06,.015],[.09,.06],[.075,.14],[.025,.18],[0,.18]].map(p=>new T.Vector2(...p)),12),'gold',x,top+.02,d/2);
         for(let k=0;k<8;k++){const a=k*Math.PI/4;instance('sphere','oldgold',x+Math.sin(a)*.067,top+.10,d/2+Math.cos(a)*.067,.020,.074,.020);} arch.squareFitting(x,top-.09,d/2+.099,.085,.085,0,true);}
     }
   });
 }
 function lantern(x,y,z,s,beamAnchors){
   group(x,y,z,0,()=>{
    for(const part of lantern190.parts)instance(part.geometry,part.material,0,0,0,s,s,s);
    const anchor=beamAnchors.map(p=>new T.Vector3(...p).sub(new T.Vector3(x,y,z))),top=new T.Vector3(0,1.64*s,0);
    for(let i=0;i<anchor.length;i++){
     const a=anchor[i],mid=a.clone().multiplyScalar(.48);mid.y=Math.max(a.y,top.y)+.08*s;
     instance(closedWire190([a.toArray(),mid.toArray(),top.toArray()],(i?.011:.017)*s,32,10),'lanternBronze');
     box(a.x,a.y,a.z,.075*s,.11*s,.075*s,'lanternBronze');
    }
   });
 }
 const hemi=new T.HemisphereLight('#cce5ff','#a3784c',.24);scene.add(hemi);
 const sun=new T.DirectionalLight('#ffdfaa',5.3);sun.position.set(-18,36,30);sun.target.position.set(0,9,0);sun.castShadow=true;
 sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-17,right:17,top:24,bottom:-12,near:1,far:85});sun.shadow.bias=-.000012;sun.shadow.normalBias=.002;sun.shadow.radius=1.2;sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;scene.add(sun,sun.target);
 // Bounded first-bounce courtyard proxy. Its own actual shadows preserve
 // the separate eave layers; it is not a screen exposure or flat ambient lift.
 const groundBounce=new T.DirectionalLight('#ffc77c',.64);groundBounce.position.set(2,.35,15);groundBounce.target.position.set(0,12,0);groundBounce.castShadow=true;
 groundBounce.shadow.mapSize.set(2048,2048);Object.assign(groundBounce.shadow.camera,{left:-18,right:18,top:25,bottom:-12,near:1,far:85});groundBounce.shadow.bias=-.000012;groundBounce.shadow.normalBias=.0015;groundBounce.shadow.autoUpdate=false;groundBounce.shadow.needsUpdate=true;scene.add(groundBounce,groundBounce.target);
 const measuredSky=await installMeasuredSky(scene,sun.position.clone().sub(sun.target.position));
 const canopy=buildMapleCanopy(scene);
 // Flatten static geometry by material: dense joinery remains real 3D but submission cost stays bounded.
 let triangles=0,parts=0;
 for(const [material,records]of bucket){
   if([mats.fittingCopper,mats.fittingEdge,mats.fittingPatina].includes(material)){
     // These are the SAME closed end-cup templates at many real timber cut
     // planes. Preserve every vertex/normal/UV and actual placement while
     // sharing the template instead of baking ~10.5M duplicate triangles.
     // Timber stays in the metric-UV merge path below.
     const batches=new Map();for(const record of records){if(!batches.has(record.geo))batches.set(record.geo,[]);batches.get(record.geo).push(record);}
     for(const [template,placements]of batches){
       const geometry=template.clone(),mesh=new T.InstancedMesh(geometry,material,placements.length);mesh.name='scene05-shared-solid-'+material.name;
       for(const [i,r]of placements.entries()){mesh.setMatrixAt(i,r.matrix);mesh.setColorAt(i,new T.Color().setRGB(r.tint,r.tint,r.tint));}
       mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
       triangles+=(geometry.index?.count??geometry.attributes.position.count)/3*placements.length;parts+=placements.length;
     }
     continue;
   }
   const pieces=records.map(({geo,matrix,tint})=>{
     const g=geo.index?geo.toNonIndexed():geo.clone();
     if(material.userData.metricTimberGrain)assignMetricTimberUV(g,matrix);
     g.applyMatrix4(matrix);
     for(const attr of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(attr))g.deleteAttribute(attr);
     const n=g.attributes.position.count;if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(n*2),2));
     const existing=g.attributes.color,c=new Float32Array(n*3);if(existing){for(let i=0;i<n;i++){c[i*3]=existing.getX(i)*tint;c[i*3+1]=existing.getY(i)*tint;c[i*3+2]=existing.getZ(i)*tint;}}else c.fill(tint);g.setAttribute('color',new T.Float32BufferAttribute(c,3));material.vertexColors=true;material.needsUpdate=true;
     return g;
   });
   const geo=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());if(!geo)throw Error('Unable to merge '+material.name);
   const mesh=new T.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);triangles+=geo.attributes.position.count/3;parts+=records.length;
 }
 return {scene,info:()=>({reference:5,revision:'scene05-worked-corner-detail190-r01',levels,tierSpec:TIER_SPEC,landmarkWorlds,triangles,parts,detail190:{hip:'Closed waisted/faceted loft follows the retained tail centreline and flat cuts; selective fitted surface copper on two primary ranks',lantern:lantern190.info,mask:mask190.info,secondaryCopper:secondary190.info,contactDatumsUnchanged:true},geometry:'Retained measured concentric storeys and compact same-story waist; concave-neck closed receivers preserve flat bearing datums; inset arm arrises; folded chrysanthemum sleeves and worked returns; pierced acanthus collars; shallow checks in closed piers; darker raked hip members with actual 3D path arclength grain; one physical low frustum',joineryKit:joineryKit.info,timber:scannedTimber.info,lighting:{sunPosition:sun.position.toArray(),sunIntensity:sun.intensity,sunColor:'#ffdfaa',courtyardBounce:groundBounce.intensity,courtyardBounceCastsShadows:true,hemisphere:hemi.intensity,environmentIntensity:scene.environmentIntensity,measuredSky:measuredSky.info,limits:'Measured CC0 sky/metal radiance with inferred native directional key and shadow-casting courtyard-bounce proxy; not measured GI'},canopy,cameraHeightRange:[.72,.80]}),dispose(){scene.traverse(o=>{o.geometry?.dispose();});Object.values(mats).forEach(m=>m.dispose());joineryKit.dispose();scannedTimber.dispose();measuredSky.dispose();copperFinish.dispose();}};
}
