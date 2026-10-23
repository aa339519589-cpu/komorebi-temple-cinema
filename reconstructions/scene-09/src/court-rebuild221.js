import * as T from 'three';
import {HALL_ENVELOPE143 as H} from './hall-envelope143.js';

export const REBUILD221_REVISION='scene09-hard-cut-masonry-and-warm-sanctuary221-r04';
const V=a=>new T.Vector3(...a);
const world=(p)=>V(p).applyMatrix4(new T.Matrix4().compose(V(H.position),new T.Quaternion().setFromAxisAngle(V([0,1,0]),H.yaw),V(H.scale)));

// The comparison resolves a masonry arch carrying the red railing. The old
// central timber bent closed its water opening. These are complete wedge
// stones across the barrel, with a continuous open intrados and real mortar
// gaps; neither the arch nor its lighting depends on a viewing direction.
export function buildMasonryGardenBridge221({emit,box,between,lantern,materials:M},ownedMaterials){
 const deck=x=>1.25+1.36*Math.pow(Math.max(0,1-(x/8)**2),1.15);
 const soffit=x=>.10+1.95*Math.sqrt(Math.max(0,1-(x/8)**2));
 const masonry=new T.MeshPhysicalMaterial({name:'scene09-221-wet-cut-granite-arch',color:new T.Color().setRGB(.70,.72,.68),map:M.cutStone.map,normalMap:M.cutStone.normalMap,normalScale:new T.Vector2(.14,.14),roughnessMap:M.cutStone.roughnessMap,roughness:1,clearcoat:.06,clearcoatRoughness:.65,metalness:0,vertexColors:true});
 const mortar=new T.MeshStandardMaterial({name:'scene09-221-recessed-damp-lime-mortar',color:0x242923,roughness:1,metalness:0});ownedMaterials.push(masonry,mortar);
 const stones=[];
 function wedge(a,b,z0,z1,material,tone=1){
  const p=[],uv=[],ix=[],N=4;
  for(let j=0;j<=N;j++){
   const angle=a+(b-a)*j/N,xi=8*Math.sin(angle),xo=8.35*Math.sin(angle),lo=.10+1.95*Math.cos(angle),hi=deck(xo)-.115;
   for(const[x,y,z]of[[xi,lo,z0],[xo,hi,z0],[xo,hi,z1],[xi,lo,z1]]){p.push(x,y,z);uv.push(z*1.3,x*1.3+y*.4);}
  }
  for(let j=0;j<N;j++)for(let k=0;k<4;k++){const q=(k+1)%4,a=j*4+k,b=j*4+q,c=(j+1)*4+q,d=(j+1)*4+k;ix.push(a,b,c,a,c,d);}
  ix.push(0,2,1,0,3,2,N*4,N*4+1,N*4+2,N*4,N*4+2,N*4+3);
  const indexed=new T.BufferGeometry();indexed.setAttribute('position',new T.Float32BufferAttribute(p,3));indexed.setIndex(ix);
  // A stone face has its own flat chart and cut normal. Sharing the four
  // section corners had collapsed the front chart to one dimension and
  // smoothed its normals over90-degree edges, creating polished tooth stripes.
  const g=indexed.toNonIndexed();indexed.dispose();g.computeVertexNormals();const pos=g.attributes.position,normal=g.attributes.normal,charts=new Float32Array(pos.count*2),tints=new Float32Array(pos.count*3);
  for(let k=0;k<pos.count;k+=3){const nx=Math.abs(normal.getX(k)),ny=Math.abs(normal.getY(k)),nz=Math.abs(normal.getZ(k)),up=ny>=Math.max(nx,nz),side=nx>nz;for(let j=0;j<3;j++){const i=k+j;charts[i*2]=(up?pos.getX(i):side?pos.getZ(i):pos.getX(i))*1.30;charts[i*2+1]=(up?pos.getZ(i):pos.getY(i))*1.30;tints[i*3]=tints[i*3+1]=tints[i*3+2]=tone;}}
  g.setAttribute('uv',new T.Float32BufferAttribute(charts,2));g.setAttribute('color',new T.Float32BufferAttribute(tints,3));g.setIndex(Array.from({length:pos.count},(_,i)=>i));stones.push(g);
 }
 // Seven longitudinal courses cross fifty-two arch segments. Staggered
 // joints remain separate solid stones, including the underside of the arch.
 let stoneCount=0;const half=Math.PI/2,step=Math.PI/52;
 for(let row=0;row<7;row++){
  const z0=-.02+row*3.24/7,z1=z0+3.24/7-.012,offset=row%2?step*.5:0;
  for(let j=-1;j<53;j++){
   const a=Math.max(-half,-half+j*step+offset)+.0009,b=Math.min(half,-half+(j+1)*step+offset)-.0009;if(b<=a)continue;
   wedge(a,b,z0,z1,masonry,.79+.19*(.5+.5*Math.sin(j*7.31+row*11.7)));stoneCount++;
  }
 }
 // One draw buffer keeps every stone disconnected and every mortar gap
 // open, while avoiding hundreds of identical native shadow draw calls.
 const vertexCount=stones.reduce((n,g)=>n+g.attributes.position.count,0),indexCount=stones.reduce((n,g)=>n+g.index.count,0),positions=new Float32Array(vertexCount*3),normals=new Float32Array(vertexCount*3),uvs=new Float32Array(vertexCount*2),colors=new Float32Array(vertexCount*3),indices=new Uint32Array(indexCount);let vo=0,io=0;
 for(const g of stones){positions.set(g.attributes.position.array,vo*3);normals.set(g.attributes.normal.array,vo*3);uvs.set(g.attributes.uv.array,vo*2);colors.set(g.attributes.color.array,vo*3);for(const v of g.index.array)indices[io++]=vo+v;vo+=g.attributes.position.count;g.dispose();}
 const barrel=new T.BufferGeometry();barrel.name='scene09-221-closed-masonry-arch-voussoirs-merged';barrel.setAttribute('position',new T.BufferAttribute(positions,3));barrel.setAttribute('normal',new T.BufferAttribute(normals,3));barrel.setAttribute('uv',new T.BufferAttribute(uvs,2));barrel.setAttribute('color',new T.BufferAttribute(colors,3));barrel.setIndex(new T.BufferAttribute(indices,1));barrel.userData.solidParts=stoneCount;emit(barrel,masonry);
 // Closed blocks and low returns carry both landing ends into the rock bank.
 for(const side of[-1,1])for(let course=0;course<3;course++)for(let j=0;j<4;j++){
  const x=side*(7.78+course*.12),z=.10+j*.95+(course%2?-.19:0);
  box(x,.21+course*.28,z,.94,.264,.91,masonry,0,.79+.13*Math.sin(j*2.7+course)**2);
 }
 for(let i=0;i<58;i++){
  const x=-8+(i+.5)*16/58,a=-8+i*16/58,b=a+16/58,angle=Math.atan((deck(b)-deck(a))/(b-a));
  box(x,deck(x)-.045,1.60,16/58-.012,.12,3.18,M.bridgeDeck,[0,0,angle],.84+.12*Math.sin(i*1.71)**2);
 }
 // Scarfed arch rails retain their own curved rectangular section and the
 // actual openings through the baluster posts. All through-mortises are solid
 // cheeks around the rail; no straight handrail floats over the arch.
 function rail(z,width,offset,depth,material,bevel=.008){
  const s=new T.Shape();for(let i=0;i<=80;i++){const x=-8+i*.2;i?s.lineTo(x,deck(x)+offset):s.moveTo(x,deck(x)+offset);}for(let i=80;i>=0;i--){const x=-8+i*.2;s.lineTo(x,deck(x)+offset-depth);}s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth:width,steps:1,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2,curveSegments:1});g.translate(0,0,z-width/2);g.name='scene09-221-closed-arched-vermilion-rail';emit(g,material);
 }
 const finial=new T.LatheGeometry([[0,0],[.095,0],[.105,.035],[.08,.08],[.125,.14],[.13,.22],[.09,.29],[.035,.34],[0,.39]].map(p=>new T.Vector2(...p)),24);
 for(const z of[.17,3.03]){
  rail(z,.22,1.025,.16,M.bridgeRed,.014);rail(z,.15,.61,.10,M.bridgeRed);rail(z,.17,.28,.11,M.bridgeRed);rail(z,.205,.865,.028,M.bridgeTimber,.003);
  for(let i=0;i<=12;i++){
   const x=-8+i*16/12,y=deck(x);
   for(const[lo,hi]of[[-.045,.17],[.28,.51],[.61,.865],[1.025,1.125]])box(x,y+(lo+hi)/2,z,.235,hi-lo,.25,M.bridgeRed);
   for(const side of[-1,1])box(x,y+.54,z+side*.114,.235,1.17,.029,M.bridgeRed);
   box(x,y+.04,z,.30,.12,.30,M.bridgeTimber);box(x,y+1.16,z,.31,.10,.31,M.bridgeRed);box(x,y+1.22,z,.21,.03,.23,M.bronze);emit(finial,M.gold,x,y+1.235,z,.74,.74,.74);
   if(i<12)for(const t of[1/3,2/3]){const xx=x+16/12*t;box(xx,deck(xx)+.575,z,.06,.58,.08,M.bridgeRed);}
  }
 }
 // A small existing case hangs from a real bracket fixed into the intrados.
 lantern(0,1.35,1.60,.40);between([0,1.78,1.60],[0,soffit(0)-.015,1.60],.017,.017,M.bronze,true);box(0,soffit(0)-.018,1.60,.22,.035,.22,M.bronze);
 return{revision:REBUILD221_REVISION,structure:'Open masonry barrel arch with radial voussoir joints carrying timber deck and mortised vermilion rails',barrelStoneCount:stoneCount,barrelDrawBuffers:1,stoneCharts:'Independent per-triangle metric planar charts with cut face normals; no collapsed front UV',abutmentBlocks:24,intradosCrown:soffit(0),deckCrown:deck(0),centrePier:false,closedGeometry:true,dimensionsInferred:true,referencePixelsSampled:false,visualAccepted:false};
}

// Two small lanterns occupy the deep central portal, below its real ceiling.
// Their chains, four paper faces, mullions, caps and base are actual solids.
export function buildSanctuaryLamps221(api){
 const{emit,box,between,group,light,materials:M}=api,cap=new T.CylinderGeometry(.10,.27,.13,4,1,false),ring=new T.TorusGeometry(.031,.006,5,12),records=[];
 group(...H.position,H.yaw,()=>{
  for(const[x,z,cd]of[[-2.26,.75,26],[.35,.80,22]]){
   const y=5.87;group(x,y,z,0,()=>{
    for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     box(0,0,.151,.297,.50,.009,M.paper);
     for(const xx of[-.158,.158])box(xx,0,.167,.022,.56,.026,M.lanternMetal);
     for(const yy of[-.267,.267])box(0,yy,.168,.35,.027,.032,M.lanternEdge);
     for(const xx of[-.075,.075])box(xx,0,.168,.011,.48,.015,M.lanternMetal);
     for(const yy of[-.13,.12])box(0,yy,.169,.30,.012,.016,M.lanternMetal);
    });
    box(0,-.293,0,.37,.055,.37,M.lanternMetal);box(0,-.328,0,.32,.022,.32,M.lanternEdge);box(0,.294,0,.37,.055,.37,M.lanternMetal);emit(cap,M.lanternMetal,0,.38,0,1,1,1,Math.PI/4);
    for(let k=0;k<20;k++)emit(ring,M.lanternMetal,0,.47+k*.053,0,1,1,1,[0,k%2*Math.PI/2,0]);
    between([0,1.506,0],[0,7.40-y,1.0-z],.027,.027,M.lanternMetal,true);box(0,7.40-y,1.0-z,.17,.035,.15,M.lanternMetal);light(0,0,0,cd,5.6,{kind:'sanctuary-hanging221'});
   });
   records.push({chamberLocal:[x,y,z],worldChamber:world([x,y,z]).toArray(),innerBeamMountLocal:[x,7.40,1.0],candela:cd,closedCase:true,behindBuddha:true});
  }
 },H.scale);
 return{revision:REBUILD221_REVISION,fixtures:records,geometry:'Two complete bronze/washi cases behind the Buddha, suspended on interlinked chains and closed bronze couplings from the actual inner ceiling crossbeam',inferredPlacement:true,visualAccepted:false};
}

// Source and surface calibration, executed before finite-emitter shader
// installation so the native shadow/point ordering remains explicit.
export function configureCourt221({scene,materials,fixtures,night203}){
 const changes=[],sources=[];
 for(const m of materials){
  if(m.name==='scene09-203-hall-wood'){m.color.setRGB(2.05,1.44,.88);m.clearcoat=.065;m.clearcoatRoughness=.87;changes.push(m.name);}
  if(m.name==='scene09-203-hall-red'){m.color.setRGB(3.35,1.86,1.16);m.clearcoat=.12;m.clearcoatRoughness=.75;changes.push(m.name);}
  if(m.name==='scene09-203-hall-ivory'){m.color.setHex(0x9c907a);changes.push(m.name);}
  if(m.name==='scene09-licensed-leaf-and-groundcover145'){m.color.setHex(0xbdc8a7);m.roughness=1;m.clearcoat=.035;m.clearcoatRoughness=.65;m.specularIntensity=.32;m.normalScale.set(.42,.42);changes.push(m.name);}
  if(m.name.startsWith('scene09-cc0-scanned-fixture-foundation-')){m.color.setRGB(.84,.88,.83);m.roughness=.93;changes.push(m.name);}
  if(m.name==='scene09-bridge-vermilion-coating'){m.color.setRGB(4.6,2.20,1.43);m.clearcoat=.22;m.clearcoatRoughness=.32;changes.push(m.name);}
 }
 // Replace two exterior paper-exit point proxies by wide, geometry-shadowed
 // cones at the same actual case faces. The small centre bulbs remain local
 // to the chamber; the body no longer receives a point singularity from a
 // source floating in front of it. These cones are a native approximation
 // to paper-face transport, not additional invisible courtyard fill lights.
 for(const l of fixtures){
  const role=l.userData.pool203;
  if(l.userData.source203?.kind==='sanctuary-hanging221'){l.intensity=l.userData.source203.requestedIntensity;l.color.setRGB(1,.52,.18);l.distance=5.6;sources.push({name:'central-sanctuary-hanging-case',position:l.position.toArray(),candela:l.intensity,linearRGB:l.color.toArray(),reach:l.distance,geometryShadow:false,source:'Actual chained bronze and four-sided washi case behind Buddha'});}
  if(role==='hero158-stone-chamber'||role==='east158-stone-chamber'){
   const record=night203.practicals.find(p=>p.role===role),centre=V(record.chamberAnchor),front=V(l.userData.source203.worldFront),radius=(role==='hero158-stone-chamber'?.44:.40)*(l.userData.source203.assemblyScale||1),p=centre.clone().addScaledVector(front,radius+.018),target=role==='hero158-stone-chamber'?V([-4.4,.32,11.3]):V([8.6,.38,10.3]);
   l.position.copy(centre);l.castShadow=false;l.intensity=role==='hero158-stone-chamber'?15:12;l.distance=2.8;
   const cone=new T.SpotLight(0xffffff,role==='hero158-stone-chamber'?190:165,12,1.08,.82,2);cone.color.setRGB(1,.64,.31);cone.position.copy(p);cone.target.position.copy(target);cone.name='scene09-221-'+role+'-paper-face-transport';cone.castShadow=true;cone.shadow.mapSize.set(768,768);cone.shadow.camera.near=.10;cone.shadow.camera.far=12;cone.shadow.bias=-.000025;cone.shadow.normalBias=.012;cone.shadow.radius=4;cone.userData.source221={actualCaseFace:true,paperAreaApproximation:true};scene.add(cone,cone.target);
   sources.push({name:cone.name,chamber:centre.toArray(),position:p.toArray(),target:target.toArray(),candela:cone.intensity,geometryShadow:true,source:'Existing visible modeled square paper case; wide outgoing paper-face cone'});
  }
  if(l.userData.source203?.kind==='bridge-post203'){
   const west=l.position.x<0;l.intensity=west?62:78;l.distance=8;l.castShadow=west;if(west){l.shadow.mapSize.set(768,768);l.shadow.camera.near=.06;l.shadow.camera.far=8;l.shadow.bias=-.000025;l.shadow.normalBias=.009;l.shadow.radius=4;}
   sources.push({name:west?'bridge-west-case':'bridge-east-case',position:l.position.toArray(),candela:l.intensity,reach:l.distance,geometryShadow:l.castShadow,source:'Actual mounted bridge case centre'});
  }
 }
 scene.traverse(o=>{
  if(o.name==='scene09-203-original-underbridge-case-source'){o.castShadow=false;o.intensity=24;o.distance=5;const r=night203.practicals.find(r=>r.role==='original-underbridge-case-source');Object.assign(r,{intensity:24,reach:5,geometryShadow:false,sourceApproximation:'Actual hanging case below the closed masonry intrados; unshadowed secondary source'});}
  if(o.name==='scene09-203-west-entry-hooded-practical-finite-cone'){
   const label='scene09-203-west-entry-hooded-practical',hood=scene.getObjectByName(label),stem=scene.getObjectByName(label+'-mount-stem'),record=night203.downlights?.find(r=>r.label===label);o.target.position.copy(world([-1.1,4.75,1.30]));
   if(hood){const direction=o.target.position.clone().sub(hood.position).normalize();hood.quaternion.setFromUnitVectors(V([0,-1,0]),direction);o.position.copy(hood.position).addScaledVector(direction,.055);if(stem&&record){const head=hood.position.clone().addScaledVector(direction,-.07),anchor=V(record.mountAnchor),delta=anchor.clone().sub(head);stem.position.copy(anchor).add(head).multiplyScalar(.5);stem.scale.y=delta.length()/.30;stem.quaternion.setFromUnitVectors(V([0,1,0]),delta.normalize());}}
   o.intensity=265;o.distance=12;o.angle=.83;o.penumbra=.85;if(record)Object.assign(record,{target:o.target.position.toArray(),candela:o.intensity,reach:o.distance,coneAngle:o.angle,reaimed221:true,actualHoodAndMountReoriented:true});sources.push({name:o.name,position:o.position.toArray(),target:o.target.position.toArray(),candela:o.intensity,geometryShadow:true,source:'Existing closed joist-mounted bronze hood and connected stem, physically re-aimed through the open altar portal'});
  }
 });
 return{revision:REBUILD221_REVISION,changes,sources,exposureChanged:false,emissiveArchitecture:false,shadowCount:scene.children.filter(o=>o.isLight&&o.castShadow).length,limitations:['Paper cones remain finite native source approximations.','Other secondary lamps and the underbridge case have no full geometry shadow.','SH and planar reflections are retained native approximations.'],visualAccepted:false};
}
