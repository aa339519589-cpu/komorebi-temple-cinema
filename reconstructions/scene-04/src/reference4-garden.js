import {unobservedContinuationMaterial04} from './traced-stone-material04.js';
import {createTracedPaving04,tracedSlabGeometry,observedCurbCuts04} from './traced-paving04.js';
import {stoneMaterial,polygonSlab,applyMetricUV} from './scene04-surfaces.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {stoneMaps,createWeatheredFlagstone} from './reference4-garden-stone.js';
import {createWeatheredBoulderGeometry,createBoulderMossGeometry} from './reference4-weathered-boulder.js';
import {foregroundScan04,disposeReference4ForegroundScans} from './reference4-foreground-scans.js';
import {createPrunedCrownGeometry} from './reference4-pruned-crown.js';
import {buildRestorationStoneLanterns} from './scene04-lanterns.js';
import {createReference4StairPlan} from './reference4-stair-plan.js';
import {buildRestorationPrunedPine} from './restoration-pruned-pines-v1.js';
import {createRestorationLotusLeaf} from './restoration-lotus-leaf.js';
import {createRestorationLotusPetal} from './restoration-lotus-petal.js';
// Complete new reconstruction after the third actual exterior image. This is
// newly authored source, not a claimed byte recovery of the lost v5/a22f file.
export const REFERENCE4_GARDEN_PLAN=Object.freeze({revision:'reference4-garden-v8-joint-moss-neutral-granite',stairTopY:1.8,stairBottomZ:8,pathEndZ:27,pathWidth:6.4,soilY:-.08,waterY:-.14,lanternX:4.4,lanternZ:12.1,lanternHeight:4.4,pineX:4.9,pineZ:4.5,pineHeight:4.4,towerPosition:[-14.21,-.64,-12.0044],towerHalfWidth:3.8,towerGroundY:-.8});
const TAU=Math.PI*2;
export function buildReference4Garden(T,options={}){
 const plan={...REFERENCE4_GARDEN_PLAN,...options};if(!T?.Mesh)throw Error('Actual THREE namespace required.');
 for(const k of['stairTopY','stairBottomZ','pathEndZ','pathWidth','soilY','waterY','lanternX','lanternZ','lanternHeight','pineX','pineZ','pineHeight','towerHalfWidth','towerGroundY'])if(!Number.isFinite(plan[k]))throw Error('Nonfinite garden option '+k);
 if(!Array.isArray(plan.towerPosition)||plan.towerPosition.length!==3||!plan.towerPosition.every(Number.isFinite)||plan.pathWidth<3||plan.waterY>=plan.soilY||plan.pathEndZ<plan.stairBottomZ+5)throw Error('Invalid garden plan');
 plan.towerExclusion={min:[plan.towerPosition[0]-plan.towerHalfWidth,plan.towerPosition[2]-plan.towerHalfWidth],max:[plan.towerPosition[0]+plan.towerHalfWidth,plan.towerPosition[2]+plan.towerHalfWidth]};
 let seed=options.seed??174221;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),rr=(a,b)=>a+(b-a)*random(),V=p=>new T.Vector3(...p);
 const group=new T.Group();group.name='reference4-independent-complete-garden';const ownedG=new Set(),ownedM=new Set(),ownedT=new Set(),children=[],rockBounds=[],records={supports:[],treeRoots:[],plantRoots:[],stoneSlabs:[],rockBounds:[],water:[],assumptions:[]};
 children.push({dispose:disposeReference4ForegroundScans});
 const ownG=g=>(ownedG.add(g),g),ownM=m=>(ownedM.add(m),m);const subgroups={};for(const k of['ground','path','water','shore','plants','trees','bridge','lanterns']){const g=new T.Group();g.name='reference4-'+k;group.add(g);subgroups[k]=g;}
 function texture(n,fn,srgb=false){const d=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const q=fn(x,y,n),i=(y*n+x)*4;for(let k=0;k<4;k++)d[i+k]=T.MathUtils.clamp(q[k]??255,0,255);}const t=new T.DataTexture(d,n,n,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=8;if(srgb)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;ownedT.add(t);return t;}
 const mineral=texture(256,(x,y)=>{const q=205+18*Math.sin(x*.12+y*.06)*Math.cos(y*.15)+rr(-20,20);return[q,q*.97,q*.91];},true),bark=texture(256,(x,y)=>{const q=180+35*Math.sin(x*.37+2*Math.sin(y*.035))+rr(-13,13);return[q,q*.87,q*.71];},true),mossMap=texture(128,()=>{const q=rr(170,255);return[q*.93,q,q*.80];},true),ripple=texture(256,(x,y)=>[128+24*Math.sin(x*.27+y*.14),128+24*Math.cos(y*.24-x*.11),252]);ripple.repeat.set(18,22);
 const material=(name,color,props={})=>ownM(new T.MeshStandardMaterial({name,color,roughness:.85,...props})),shoreMaps=stoneMaps(947);for(const t of Object.values(shoreMaps))ownedT.add(t);
 const m={stone:ownM(stoneMaterial('metre-scaled-pond-boulder-granite','#656b63',{seed:947,roughness:.89})),soil:material('reference4-earth','#62533c',{map:mineral,roughness:1}),bed:material('reference4-pond-bed','#53614b',{map:mineral,roughness:1}),moss:material('reference4-discontinuous-rock-moss','#536538',{map:mossMap,vertexColors:true,roughness:.98}),bark:material('reference4-living-grey-brown-bark','#493c2d',{map:bark,bumpMap:bark,bumpScale:.012}),bridge:material('reference4-aged-red-bridge','#9b402c',{map:bark,roughness:.65}),leaf:material('reference4-lotus-green','#668542',{roughness:.67,side:T.DoubleSide}),leafDark:material('reference4-low-green-leaves','#5d7138',{side:T.DoubleSide}),maple:material('reference4-maple-olive','#727d36',{side:T.DoubleSide}),petal:material('reference4-lotus-pink','#d68da9',{side:T.DoubleSide,roughness:.62}),blossom:material('reference4-cherry-pink','#dc91a9',{side:T.DoubleSide}),gold:material('reference4-lotus-centre','#c6a438'),paper:material('reference4-garden-lantern-warm-paper','#ce9a43',{side:T.DoubleSide,emissive:'#e6a13c',emissiveIntensity:.32})};
 for(const t of Object.values(m.stone.userData.maps))ownedT.add(t);
 m.water=options.waterMaterial??ownM(new T.MeshPhysicalMaterial({name:'reference4-green-clear-pond-surface',color:'#819678',roughness:.20,metalness:0,ior:1.333,transparent:true,opacity:.68,depthWrite:false,normalMap:ripple,normalScale:new T.Vector2(.09,.09),clearcoat:.85,clearcoatRoughness:.16}));
 function mesh(g,mat,name,parent,pos){if(!mat?.isMaterial)throw Error('Missing scene04 material: '+name);ownG(g);const o=new T.Mesh(g,mat);o.name=name;o.castShadow=mat!==m.water;o.receiveShadow=true;if(pos)o.position.fromArray(pos);parent.add(o);return o;}
 const box=(size,pos,mat,name,parent)=>mesh(new T.BoxGeometry(...size),mat,name,parent,pos);
 function line(a,b,r,mat,name,parent,r2=r*.7){const d=V(b).sub(V(a)),o=mesh(new T.CylinderGeometry(r2,r,d.length(),8,1,false),mat,name,parent,V(a).addScaledVector(d,.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
 function sweep(points,r,mat,name,parent,n=24){const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V)),n,r,7,false),uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);uv.setXY(i,v,u*3);}return mesh(g,mat,name,parent);}
 function island(cx,cz,rx,rz,name,top=plan.soilY){const shape=new T.Shape();for(let i=0;i<48;i++){const a=i/48*TAU,k=1+.025*Math.sin(i*2.17+cx),x=cx+Math.cos(a)*rx*k,z=cz+Math.sin(a)*rz*k;i?shape.lineTo(x,-z):shape.moveTo(x,-z);}shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:top+.9,bevelEnabled:false,steps:1});g.rotateX(-Math.PI/2);g.translate(0,-.9,0);const o=mesh(g,m.soil,name,subgroups.ground);records.supports.push({name,center:[cx,top,cz],radii:[rx,rz],bottom:-.9,top});return o;}
 const hw=plan.pathWidth/2,curb=.28,halfCauseway=hw+curb+.06,waterMeshes=[],pathHalf=z=>Math.max(1.10,hw-.133*Math.max(0,z-plan.stairBottomZ));
 box([48,.8,48],[0,-1.2,9],m.soil,'continuous-lower-earth',subgroups.ground);box([2*plan.towerHalfWidth+.5,.85,2*plan.towerHalfWidth+.5],[plan.towerPosition[0],plan.towerGroundY-.425,plan.towerPosition[2]],m.soil,'tower-dry-ground-at-actual-anchor',subgroups.ground);box([38,.15,31],[0,-.63,12],m.bed,'submerged-pond-bed',subgroups.water);
 const causeShape=new T.Shape(),causeOutline=[];for(let i=0;i<=32;i++){const z=plan.stairBottomZ-.25+(plan.pathEndZ-plan.stairBottomZ+.5)*i/32;causeOutline.push([pathHalf(z)+curb+.07,z]);}for(let i=32;i>=0;i--){const z=plan.stairBottomZ-.25+(plan.pathEndZ-plan.stairBottomZ+.5)*i/32;causeOutline.push([-pathHalf(z)-curb-.07,z]);}causeOutline.forEach(([x,z],i)=>i?causeShape.lineTo(x,-z):causeShape.moveTo(x,-z));causeShape.closePath();const causeGeo=new T.ExtrudeGeometry(causeShape,{depth:.76,bevelEnabled:false,steps:1});causeGeo.rotateX(-Math.PI/2);causeGeo.translate(0,-.84,0);mesh(causeGeo,m.soil,'flared-processional-causeway',subgroups.ground);
 for(const side of[-1,1]){const x1=side<0?-17:0,x2=side<0?0:17,g=new T.PlaneGeometry(x2-x1,28);g.rotateX(-Math.PI/2);g.translate((x1+x2)/2,plan.waterY,13);const water=mesh(g,m.water,'connected-pond-'+side,subgroups.water);water.castShadow=false;water.renderOrder=2;waterMeshes.push(water);records.water.push({side,bounds:[[x1,plan.waterY,-1],[x2,plan.waterY,27]]});
  island(side*16,12,3.3,17,'outer-garden-bank-'+side);box([.72,.73,plan.pathEndZ-plan.stairBottomZ+.22],[side*(halfCauseway+.26),-.42,(plan.pathEndZ+plan.stairBottomZ)/2],m.soil,'dry-low-path-side-bank-'+side,subgroups.ground);
  for(const [x,z,rx,rz,name]of[[plan.pineX,plan.pineZ,1.6,3.4,'pine'],[plan.lanternX,plan.lanternZ,1.35,2.05,'large-lantern'],[10.5,1.1,3,2.1,'cherry'],[8.8,2.8,.75,.85,'small-lantern'],[12.8,15,3,4.2,'maple']])island(side*x,z,rx,rz,name+'-dry-island-'+side);
 }

 const stairPlan=createReference4StairPlan({stairTopY:plan.stairTopY,stairTopZ:0,stairBottomZ:plan.stairBottomZ,stairWidth:5.65,...options.stairDimensions});
 const bankY=(x,z)=>stairPlan.walkY(z)-.12;
 for(const side of[-1,1]){
  const pp=[],ii=[],nn=24,mm=20;
  for(let j=0;j<=mm;j++)for(let i=0;i<=nn;i++){const z=stairPlan.z0-2+j/mm*(stairPlan.run+2),x=side*(stairPlan.halfWidth(z)+.44+i/nn*13.6);pp.push(x,bankY(x,z),z);}
  for(let j=0;j<mm;j++)for(let i=0;i<nn;i++){const a=j*(nn+1)+i,b=a+nn+1;side>0?ii.push(a,b,a+1,a+1,b,b+1):ii.push(a,a+1,b,a+1,b+1,b);}
  // Close the terrain mass at the shared lower-earth support datum.
  const topCount=pp.length/3,topIndices=[...ii];for(let i=0;i<topCount;i++)pp.push(pp[i*3],-.85,pp[i*3+2]);
  for(let i=0;i<topIndices.length;i+=3)ii.push(topIndices[i]+topCount,topIndices[i+2]+topCount,topIndices[i+1]+topCount);
  const boundary=[...Array.from({length:nn+1},(_,i)=>i),...Array.from({length:mm},(_,i)=>(i+1)*(nn+1)+nn),...Array.from({length:nn},(_,i)=>mm*(nn+1)+nn-1-i),...Array.from({length:mm-1},(_,i)=>(mm-1-i)*(nn+1))];
  for(let i=0;i<boundary.length;i++){const a=boundary[i],b=boundary[(i+1)%boundary.length];side>0?ii.push(a,b,a+topCount,b,b+topCount,a+topCount):ii.push(a,a+topCount,b,b,a+topCount,b+topCount);}
  const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(pp,3));gg.setAttribute('uv',new T.Float32BufferAttribute(pp.flatMap((_,i)=>i%3===0?[pp[i]*.7,pp[i+2]*.7]:[]),2));gg.setIndex(ii);gg.computeVertexNormals();
  mesh(gg,m.soil,'continuous-planted-stair-embankment-'+side,subgroups.ground);
  for(let j=0;j<30;j++){const x=side*rr(3.8,15.8),z=rr(-.8,7.7);rock(x,bankY(x,z)-.13,z,rr(.36,.83),rr(.28,.65),rr(.3,.7),'terrace-outcrop-'+side+'-'+j);}
 }
 const paving=['#817b72','#777972','#8b7d71','#72756d'].map((color,i)=>{const mm=ownM(stoneMaterial('metre-scaled-worn-wet-paver-'+i,color,{wet:false,seed:741+i*31}));mm.color.multiplyScalar(1.08);mm.normalScale.set(1.05,1.05);mm.roughness=.97;mm.clearcoat=.30;mm.clearcoatRoughness=.86;
  const compile=mm.onBeforeCompile,key=mm.customProgramCacheKey,broad='diffuseColor.rgb*=.78+.40*ssMacro;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.40+vec3(.015,.017,.020),ssPale*.42);',mineral=`diffuseColor.rgb*=.89+.22*ssMacro;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.24+vec3(.009,.011,.014),ssPale*.20);vec3 r4MicroSamples=vec3(ssNoise(ssPosition.zy*168.0),ssNoise(ssPosition.xz*168.0),ssNoise(ssPosition.xy*168.0));float r4Quartz=dot(r4MicroSamples,ssCW);float r4Mica=smoothstep(.72,.88,r4Quartz+.14*dot(vec3(ssNoise(ssPosition.zy*38.0),ssNoise(ssPosition.xz*38.0),ssNoise(ssPosition.xy*38.0)),ssCW));diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.42+vec3(.018,.020,.024),r4Mica*.64);diffuseColor.rgb*=1.0-.26*vR4Wetness;`;
  mm.onBeforeCompile=shader=>{compile(shader);const worldVarying='varying vec3 ssWorldNormal;',normalAnchor='normal=normalize(mat3(viewMatrix)*normalize(ssAX*ssW.x+ssAY*ssW.y+ssAZ*ssW.z));',physicalChunk='#include <lights_physical_fragment>';if(!shader.vertexShader.includes(worldVarying)||!shader.fragmentShader.includes(worldVarying)||!shader.vertexShader.includes('#include <begin_vertex>')||!shader.fragmentShader.includes(broad)||!shader.fragmentShader.includes(normalAnchor)||!shader.fragmentShader.includes(physicalChunk))throw Error('Pinned granite fleck and wet-hollow shader boundaries changed');shader.vertexShader=shader.vertexShader.replace(worldVarying,`${worldVarying}\nattribute float r4Wetness;\nvarying float vR4Wetness;`).replace('#include <begin_vertex>','#include <begin_vertex>\nvR4Wetness=r4Wetness;');shader.fragmentShader=shader.fragmentShader.replace(worldVarying,`${worldVarying}\nvarying float vR4Wetness;`).replaceAll('r4Wetness','vR4Wetness').replace(broad,mineral).replace(normalAnchor,`${normalAnchor}\nroughnessFactor=clamp(mix(roughnessFactor,.34,vR4Wetness*.88),.24,1.0);`).replace(physicalChunk,`${T.ShaderChunk.lights_physical_fragment}\nmaterial.clearcoat=mix(material.clearcoat,.48,vR4Wetness*.72);\nmaterial.clearcoatRoughness=mix(material.clearcoatRoughness,.34,vR4Wetness*.84);`);};mm.customProgramCacheKey=()=>`${key()}-scene04-neutral-granite-microflecks168-wet-hollows`;
  mm.userData.surfaceFinish='neutral triplanar granite scan with 4–9 mm authored pale mineral flecks and per-fleck roughness';for(const t of Object.values(mm.userData.maps))ownedT.add(t);return mm;});
 // Keep the pre-existing garden's random placement sequence while replacing
 // its randomly laid paving with individually observed stone-joint geometry.
 for(let k=0;k<266;k++)random();
 const traced=createTracedPaving04();
 const pavingMaterials=[...paving];
 const pavingHash=(x,z,s)=>{const q=Math.sin(x*127.1+z*311.7+s*17.13)*43758.5453;return q-Math.floor(q);};
 function observedFlagstone(record){
  const seed=record.column*193+record.row*79+43;
  // These four-sided records already follow photographed joints. Retaining
  // each as one fitted block keeps the observed large slabs instead of
  // replacing them with a second, more regular invented grid.
  return {...record,detailSeed:0,thickness:.14+.045*pavingHash(record.row,record.column,seed+37),top:record.top+.004*(pavingHash(record.row,record.column,seed+47)-.5),jointGap:.008+.004*pavingHash(record.row,record.column,seed+59),edgeBevel:.012,detailSpacing:.024,boundarySpacing:.028,source:'single weathered granite flagstone fitted to observed outer joints'};
 }
 for(const record of traced.records){
  const materialIndex=Math.floor(pavingHash(record.row,record.column,607)*paving.length),mat=paving[materialIndex];
  const tile=observedFlagstone(record);mesh(tracedSlabGeometry(tile),mat,tile.id,subgroups.path);records.stoneSlabs.push({...tile,sourceRecordId:record.id,referenceBitmapUsed:false,materialProvider:'Poly Haven Granite Tile 04, CC0-1.0',materialVariant:materialIndex});
 }
 // Continue the constructed path behind the supplied view, so its top and
 // support remain complete when inspected from above. These slabs are authored
 // extrapolation, explicitly separate from the 31 observed visible stones.
 const rearEdges=traced.edgeProfiles.map(profile=>traced.world([profile.at(-1)[1],profile.at(-1)[0]])),rearStart=rearEdges.reduce((v,p)=>v+p[1],0)/4,rearEnd=plan.pathEndZ,rearRows=Math.max(1,Math.ceil((rearEnd-rearStart)/.82)),rearCentre=(rearEdges[0][0]+rearEdges[3][0])/2,rearHalf=(rearEdges[3][0]-rearEdges[0][0])/2;
 const rearX=(i,z)=>{const t=T.MathUtils.clamp((z-rearStart)/(rearEnd-rearStart),0,1);return T.MathUtils.lerp(rearEdges[i][0],(rearEdges[i][0]-rearCentre)/rearHalf*1.10,t);};
 const rearOutline=[[rearX(0,rearStart),rearStart],[rearX(3,rearStart),rearStart],[rearX(3,rearEnd),rearEnd],[rearX(0,rearEnd),rearEnd]],rearMat=ownM(unobservedContinuationMaterial04());pavingMaterials.push(rearMat);for(const t of Object.values(rearMat.userData.maps))ownedT.add(t);
 for(let k=0;k<rearRows;k++){
  const z0=T.MathUtils.lerp(rearStart,rearEnd,k/rearRows),z1=T.MathUtils.lerp(rearStart,rearEnd,(k+1)/rearRows);
  for(let column=0;column<3;column++){
   const record={id:'authored-rear-continuation-'+column+'-'+k,column,row:12+k,outline:[[rearX(column,z0),z0],[rearX(column+1,z0),z0],[rearX(column+1,z1),z1],[rearX(column,z1),z1]],top:traced.groundY,thickness:.14,source:'Authored unseen continuation, not observed photograph detail'};
   mesh(tracedSlabGeometry(record),rearMat,record.id,subgroups.path);records.stoneSlabs.push(record);
  }
  for(const side of[-1,1]){
   const i=side<0?0:3,a=[rearX(i,z0),z0],b=[rearX(i,z1),z1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=side*dz/len,nz=-side*dx/len;
   const record={id:'authored-rear-curb-'+side+'-'+k,column:side+3,row:30+k,outline:[[a[0]+nx*.018,a[1]+nz*.018],[b[0]+nx*.018,b[1]+nz*.018],[b[0]+nx*.22,b[1]+nz*.22],[a[0]+nx*.22,a[1]+nz*.22]],top:.105,thickness:.22};
   mesh(tracedSlabGeometry(record),paving[(k+1)%4],record.id,subgroups.path);
  }
 }
 // Curb joints follow individually observed cuts rather than equal screen rows.
 for(const side of[-1,1]){const cuts=side<0?observedCurbCuts04.west:observedCurbCuts04.east;for(let k=0;k<cuts.length-1;k++){const a=traced.edgePoint(side,cuts[k]),b=traced.edgePoint(side,cuts[k+1]),dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=side*dz/len,nz=-side*dx/len,inner=.018,outer=.22,outline=[[a[0]+nx*inner,a[1]+nz*inner],[b[0]+nx*inner,b[1]+nz*inner],[b[0]+nx*outer,b[1]+nz*outer],[a[0]+nx*outer,a[1]+nz*outer]];mesh(tracedSlabGeometry({id:'observed-curb-'+side+'-'+k,outline,top:.105+.004*Math.sin(k*1.79),thickness:.22,column:side+3,row:k}),paving[(k+1)%4],'observed-curb-'+side+'-'+k,subgroups.path);}}
 // The photograph's foreground keeps stone paving outside the paired curbs.
 // These shallow shoulder blocks are fitted between each observed curb and
 // the image boundary; they are authored continuation, not extra traced joints.
 const shoulderRows=[880,930,980,1030,1080,1130,1170];
 for(const side of[-1,1])for(let row=0;row<shoulderRows.length-1;row++){
  const y0=shoulderRows[row],y1=shoulderRows[row+1],frameX=side<0?0:1254;
  const cross=y=>{const inner=traced.edgePoint(side,y),outer=traced.world([frameX,y]);return[inner,outer];};
  const [nearInner,nearOuter]=cross(y0),[farInner,farOuter]=cross(y1),width0=(nearOuter[0]-nearInner[0])*side,width1=(farOuter[0]-farInner[0])*side;
  const avgWidth=(width0+width1)*.5,depth=Math.abs(farInner[1]-nearInner[1]);
  if(avgWidth<.12||depth<.10)continue;
  const acrossCount=Math.max(1,Math.ceil(avgWidth/.52)),alongCount=Math.max(1,Math.ceil(depth/.58)),seed=941+row*47+(side+1)*131;
  const point=(u,v)=>{
   const front=[T.MathUtils.lerp(nearInner[0],nearOuter[0],u),nearInner[1]],back=[T.MathUtils.lerp(farInner[0],farOuter[0],u),farInner[1]];
   return[T.MathUtils.lerp(front[0],back[0],v),T.MathUtils.lerp(front[1],back[1],v)];
  };
  const nodes=[];for(let j=0;j<=alongCount;j++){nodes[j]=[];for(let i=0;i<=acrossCount;i++){
   let u=i/acrossCount,v=j/alongCount;if(i>0&&i<acrossCount&&j>0&&j<alongCount){u=T.MathUtils.clamp(u+(.20*(pavingHash(i,j,seed)-.5))/acrossCount,.20/acrossCount,1-.20/acrossCount);v=T.MathUtils.clamp(v+(.18*(pavingHash(j,i,seed+17)-.5))/alongCount,.20/alongCount,1-.20/alongCount);}nodes[j][i]=point(u,v);
  }}
  for(let j=0;j<alongCount;j++)for(let i=0;i<acrossCount;i++){
   const outline=[nodes[j][i],nodes[j][i+1],nodes[j+1][i+1],nodes[j+1][i]],idx=j*acrossCount+i,id=`authored-foreground-shoulder-${side}-${row}-${idx}`;
   const record={id,column:side<0?0:2,row:row+9,detailSeed:idx,outline,top:.048+.003*(pavingHash(idx,row,seed+29)-.5),thickness:.12+.055*pavingHash(idx,row,seed+31),jointGap:.010+.006*pavingHash(idx,row,seed+37),edgeBevel:.013,detailSpacing:.035,boundarySpacing:.040,source:'inferred foreground shoulder flagstone between measured curb and photo frame'};
   mesh(tracedSlabGeometry(record),paving[(idx+row+(side>0?2:0))%paving.length],id,subgroups.path);records.stoneSlabs.push({...record,referenceBitmapUsed:false,measurementStatus:'authored shoulder continuation'});
  }
 }
 // Compact damp earth closes the bottom of the joints; colonies occupy only
 // selected lips and interruptions, rather than continuous green ribbons.
 const jointEarth=material('observed-paving-dark-mineral-earth','#2a2a20',{roughness:1}),mossMats=['#263019','#354022','#1d2818'].map((c,i)=>material('observed-joint-moss-'+i,c,{roughness:.98}));
 group.traverse(o=>{if(o.isMesh&&(o.name==='flared-processional-causeway'||o.name.startsWith('dry-low-path-side-bank-')))o.material=jointEarth;});
 const bedLeft=traced.edgePoint(-1,740),bedLeftNear=traced.edgePoint(-1,1350),bedRight=traced.edgePoint(1,740),bedRightNear=traced.edgePoint(1,1350);
 const bedShape=new T.Shape();[bedLeft,bedRight,bedRightNear,bedLeftNear].forEach(([x,z],i)=>i?bedShape.lineTo(x,-z):bedShape.moveTo(x,-z));bedShape.closePath();const bed=new T.ExtrudeGeometry(bedShape,{depth:.828,bevelEnabled:false,steps:1});bed.rotateX(-Math.PI/2);bed.translate(0,-.8,0);mesh(bed,jointEarth,'observed-continuous-mineral-joint-bed',subgroups.path);
 const rearBedShape=new T.Shape();rearOutline.forEach(([x,z],i)=>i?rearBedShape.lineTo(x,-z):rearBedShape.moveTo(x,-z));rearBedShape.closePath();const rearBed=new T.ExtrudeGeometry(rearBedShape,{depth:.828,bevelEnabled:false,steps:1});rearBed.rotateX(-Math.PI/2);rearBed.translate(0,-.8,0);mesh(rearBed,jointEarth,'authored-rear-paving-support-and-seam-bed',subgroups.path);
 const mossG=ownG(new T.IcosahedronGeometry(1,0)),mossMatrices=[[],[],[]],seen=new Set(),h=(a,b)=>{const q=Math.sin(a*127.1+b*311.7)*43758.5453;return q-Math.floor(q);};
 for(const r of traced.records)for(let e=0;e<4;e++){const a=r.outline[e],b=r.outline[(e+1)%4],key=[a,b].map(p=>p.map(q=>q.toFixed(3)).join(':')).sort().join('|');if(seen.has(key))continue;seen.add(key);const len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let k=0;k<len/.017;k++){const t=(k+.5)*.017/len,seed=r.column*97+r.row*31+e*13;if(h(k,seed)>.20+.16*Math.sin(t*14+seed)||Math.sin(t*21+seed)*Math.sin(t*8+seed*.31)<-.15)continue;const o=new T.Object3D();o.position.set(T.MathUtils.lerp(a[0],b[0],t)+.003*(h(k,seed+3)-.5),.043+.003*h(k,seed+7),T.MathUtils.lerp(a[1],b[1],t)+.003*(h(k,seed+11)-.5));const radius=.0035+.0035*h(k,seed+17);o.scale.set(radius,.003+.004*h(k,seed+21),radius*(.65+.8*h(k,seed+27)));o.rotation.y=h(k,seed+33)*TAU;o.updateMatrix();mossMatrices[Math.floor(h(k,seed+41)*3)].push(o.matrix.clone());}}
 for(let j=0;j<3;j++){const mm=mossMatrices[j],o=new T.InstancedMesh(mossG,mossMats[j],mm.length);o.name='observed-discontinuous-moss-colonies-'+j;mm.forEach((mat,i)=>o.setMatrixAt(i,mat));o.castShadow=o.receiveShadow=true;o.computeBoundingBox();o.computeBoundingSphere();subgroups.path.add(o);}
 const edgePebbles=[],edgeStone=ownG(new T.IcosahedronGeometry(1,2));
 for(const side of[-1,1])for(let k=0;k<138;k++){const y=752+k/137*578,a=traced.edgePoint(side,y),b=traced.edgePoint(side,y+.5),dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=side*dz/len,nz=-side*dx/len,off=.24+.22*h(k,side+9),x=a[0]+nx*off,z=a[1]+nz*off;
  if(h(k,side+41)<.60){const o=new T.Object3D();o.position.set(x,.018+.014*h(k,side+13),z);o.scale.set(.033+.064*h(k,side+23),.018+.035*h(k,side+27),.025+.065*h(k,side+31));o.rotation.set(h(k,1)*.8,h(k,2)*TAU,h(k,3)*.8);o.updateMatrix();edgePebbles.push(o.matrix.clone());}
 }
 {const o=new T.InstancedMesh(edgeStone,m.stone,edgePebbles.length);o.name='observed-curb-loose-mineral-fragments';edgePebbles.forEach((q,i)=>o.setMatrixAt(i,q));o.castShadow=o.receiveShadow=true;o.computeBoundingBox();o.computeBoundingSphere();subgroups.path.add(o);}
 group.userData.pavingMaterials=pavingMaterials;
 function rock(x,y,z,sx,sy,sz,name){
  const scan=foregroundScan04(name,sx,sz),shapeSeed=1003+Math.round(Math.abs(x*31+z*47));
  const g=scan?.geometry??createWeatheredBoulderGeometry(T,{scale:[sx,sy,sz],seed:shapeSeed,sectors:Math.max(sx,sz)>.7?64:32,rings:Math.max(sx,sz)>.7?26:14});
  const o=mesh(g,scan?ownM(scan.material):m.stone,name,subgroups.shore,[x,y,z]);
  o.rotation.y=rr(-Math.PI,Math.PI);o.updateMatrixWorld(true);let bounds=new T.Box3().setFromObject(o);
  if(bounds.max.z>0&&bounds.min.z<plan.pathEndZ+.3){const edge=bounds.max.z>plan.stairBottomZ?halfCauseway+.06:2.9;if(x<0&&bounds.max.x>-edge)x-=bounds.max.x+edge;else if(x>0&&bounds.min.x<edge)x+=edge-bounds.min.x;o.position.x=x;o.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(o);}
  const r=.58*plan.lanternHeight/3.34*(plan.lanternWidthFactor??1)+.04;
  if([-1,1].some(side=>bounds.min.x<side*plan.lanternX+r&&bounds.max.x>side*plan.lanternX-r&&bounds.min.z<plan.lanternZ+r&&bounds.max.z>plan.lanternZ-r&&bounds.max.y>plan.soilY)){o.removeFromParent();records.rockBounds.push({name,excludedFor:'actual lantern foot envelope'});return null;}
  if(scan){
   // Bake placement before the existing global flared-bank deformation. Keep
   // scan UVs and its original squat proportions, with no extra moss shell.
   o.updateMatrix();g.applyMatrix4(o.matrix);o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);o.updateMatrix();o.userData.realScan=scan.source;
  }else{
   const mossGeometry=createBoulderMossGeometry(T,g);delete g.userData.boulderData;const mapped=applyMetricUV(g);o.geometry=mapped;ownedG.add(mapped);if(ownedG.delete(g))g.dispose();const moss=mesh(mossGeometry,m.moss,name+'-clipped-colonies',subgroups.shore,[x,y,z]);moss.rotation.copy(o.rotation);
  }
  rockBounds.push(bounds);records.rockBounds.push({name,min:bounds.min.toArray(),max:bounds.max.toArray(),...(scan?{scan:scan.source}:{})});return o;
 }
 for(const side of[-1,1]){for(let i=0;i<24;i++){const z=1.3+i*1.08,x=side*(halfCauseway+.57+.31*Math.sin(i*1.39));rock(x,-.13,z,rr(.36,.67),rr(.25,.48),rr(.39,.70),'inner-shore-rock-'+side+'-'+i);}for(const [cx,cz,rx,rz]of[[side*plan.pineX,plan.pineZ,1.65,3.4],[side*plan.lanternX,plan.lanternZ,1.38,2.05],[side*12.8,15,3,4.2],[side*10.5,1.1,3,2.1]])for(let i=0;i<10;i++){const a=i/10*TAU;rock(cx+Math.cos(a)*rx,-.13,cz+Math.sin(a)*rz,rr(.34,.65),rr(.26,.44),rr(.38,.70),'island-layer-rock-'+side+'-'+cz+'-'+i);}rock(side*(halfCauseway+1.02),.38,16.7,1.28,1.10,1.43,'foreground-heavy-boulder-'+side);rock(side*(halfCauseway+.50),.22,18.4,1.0,.82,1.0,'secondary-front-boulder-'+side);}

 for(const side of[-1,1])for(let i=0;i<36;i++){
  const z=rr(7.5,25.5),x=side*rr(halfCauseway+.7,12.3);
  rock(x,-.12,z,rr(.25,.78),rr(.17,.42),rr(.27,.7),'irregular-pond-bank-stone-'+side+'-'+i);
 }
 const needleMap=texture(256,(x,y)=>{const u=x/255,v=y/255,stem=Math.abs(u-.5)<.010&&v<.94&&v>.06;let a=stem?255:0;for(let k=0;k<23;k++){const t=.05+k*.036,span=.32*(.42+.58*Math.sin(Math.min(1,t/.90)*Math.PI)),yy=.92-t,d=Math.min(Math.abs(v-(yy-(u-.5)*.90)),Math.abs(v-(yy+(u-.5)*.90)));if(Math.abs(u-.5)<span&&d<.012&&v<yy+.025)a=255;}return[102,135,62,a];},true);needleMap.flipY=true;
 m.needleGreen=material('reference4-pine-individual-needles','#e0e5c1',{map:needleMap,alphaTest:.065,alphaToCoverage:true,side:T.DoubleSide,roughness:.85,vertexColors:true});const crownMap=texture(128,(x,y)=>{const q=19*Math.sin(x*.91+y*.32)+rr(-14,14);return[168+q,189+q,135+q];},true);m.crown=material('reference4-thick-layered-pine-crown','#6a8543',{map:crownMap,vertexColors:true,roughness:.92,side:T.DoubleSide});
 const needleGeometry=ownG(new T.PlaneGeometry(1,1));needleGeometry.rotateX(-Math.PI/2);const pines=[];
 for(const side of[-1,1]){const pine=buildRestorationPrunedPine({materials:m,needleGeometry,options:{id:side<0?'west-island-existing-pine':'east-island-existing-pine'}});children.push(pine);const scale=plan.pineHeight/(pine.bounds.max.y-pine.bounds.min.y);pine.group.scale.setScalar(scale);pine.group.position.set(side*plan.pineX,plan.soilY,plan.pineZ);pine.group.rotation.y=side<0?Math.PI+.55:Math.PI-.4;subgroups.trees.add(pine.group);pine.group.updateMatrixWorld(true);
  const matrix=new T.Matrix4(),position=new T.Vector3(),quaternion=new T.Quaternion(),sc=new T.Vector3(),base=new T.Vector3(0,0,470/512-.5);for(let i=0;i<pine.foliageMesh.count;i++){pine.foliageMesh.getMatrixAt(i,matrix);matrix.decompose(position,quaternion,sc);const anchor=base.clone().applyMatrix4(matrix);quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler(.48*Math.sin(i*2.399)+.16,.28*Math.cos(i*.73),.32*Math.sin(i*1.19))));position.copy(anchor).sub(base.clone().multiply(sc).applyQuaternion(quaternion));matrix.compose(position,quaternion,sc);pine.foliageMesh.setMatrixAt(i,matrix);}pine.foliageMesh.instanceMatrix.needsUpdate=true;pine.foliageMesh.computeBoundingBox();pine.foliageMesh.computeBoundingSphere();
  const parts=[];for(const [j,pad]of pine.pads.entries()){const h=side<0?6.5:5.2,anchor=V(pad.anchor),world=anchor.clone().applyMatrix4(pine.group.matrixWorld),rx=h*(.156-.0033*pad.tier),rz=h*(.109-.0025*pad.tier),reserve=world.z>0&&world.z<8.2?T.MathUtils.clamp((Math.abs(world.x)-3.03)/(Math.max(rx,rz)*scale*1.28),.35,1):1,g=createPrunedCrownGeometry(T,{radiusX:rx*reserve,radiusZ:rz*reserve,halfHeight:h*.049,phase:j*.73});g.rotateY(Math.atan2(anchor.x,anchor.z));g.translate(anchor.x,anchor.y+h*.020,anchor.z);parts.push(g);}const crown=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());mesh(crown,m.crown,'thick-overlapping-pruned-crown-'+side,pine.group);pines.push(pine);records.treeRoots.push({kind:'pruned-pine',position:pine.group.position.toArray(),height:plan.pineHeight});}
 const lanternAsset=buildRestorationStoneLanterns({materials:{paper:m.paper},options:{heroWidthFactor:plan.lanternWidthFactor??1,heroInwardYaw:plan.lanternInwardYaw??0,anchors:[[-plan.lanternX,plan.soilY,plan.lanternZ,plan.lanternHeight/3.34],[plan.lanternX,plan.soilY,plan.lanternZ,plan.lanternHeight/3.34],[-8.8,plan.soilY,2.8,.53],[8.8,plan.soilY,2.8,.53]]}});children.push(lanternAsset);subgroups.lanterns.add(lanternAsset.group);
 function instances(g,mat,matrices,name,parent){if(!matrices.length)return null;const o=new T.InstancedMesh(g,mat,matrices.length),color=new T.Color();o.name=name;matrices.forEach((a,i)=>{o.setMatrixAt(i,a);const q=name.includes('maple')?.46+.63*(.5+.5*Math.sin(i*2.399)):.87+.13*(.5+.5*Math.sin(i*2.399));o.setColorAt(i,color.setRGB(q*.97,q,q*.89));});o.instanceMatrix.needsUpdate=true;o.instanceColor.needsUpdate=true;o.castShadow=o.receiveShadow=true;o.computeBoundingBox();o.computeBoundingSphere();parent.add(o);return o;}
 const lotusLeaf=ownG(createRestorationLotusLeaf(7)),lotusPetal=ownG(createRestorationLotusPetal(4)),leafMatrices=[],petalMatrices=[];
 for(const side of[-1,1])for(let i=0;i<168;i++){const z=rr(6.8,26.4),x=side*(i%3===0?rr(7.1,13.5):rr(halfCauseway+.55,halfCauseway+3.6));if(Math.hypot((Math.abs(x)-plan.lanternX)/1.7,(z-plan.lanternZ)/2.4)<1||Math.hypot((Math.abs(x)-(halfCauseway+1.02))/1.5,(z-16.7)/1.8)<1)continue;const height=rr(.04,.50),radius=z>13?rr(.84,1.38):rr(.56,1.0),o=new T.Object3D();o.position.set(x,plan.waterY+height,z);o.rotation.set(rr(-.18,.18),rr(0,TAU),rr(-.14,.14));o.scale.set(radius,1,radius);o.updateMatrix();leafMatrices.push(o.matrix.clone());line([x+.08,-.59,z-.06],[x,plan.waterY+height-.015,z],.013,m.leafDark,'lotus-petiole',subgroups.plants,.009);
  if(i%4===0){const cx=x+.24,cz=z-.1,fy=plan.waterY+height+.36;line([cx,-.59,cz],[cx,fy,cz],.014,m.leafDark,'lotus-flower-stalk',subgroups.plants,.011);for(let l=0;l<3;l++)for(let k=0;k<8;k++){const a=TAU*(k+(l%2)*.5)/8,q=new T.Object3D();q.position.set(cx,fy,cz);q.rotation.set(-.38+l*.29,a,0);q.scale.set(.42-l*.025,.26-l*.025,.31-l*.035);q.updateMatrix();petalMatrices.push(q.matrix.clone());}const c=mesh(new T.SphereGeometry(.072,12,6),m.gold,'lotus-receptacle',subgroups.plants,[cx,fy+.05,cz]);c.scale.y=.43;}}
 const lotusLeaves=instances(lotusLeaf,m.leaf,leafMatrices,'lotus-leaf-instances',subgroups.plants),lotusFlowers=instances(lotusPetal,m.petal,petalMatrices,'lotus-petal-instances',subgroups.plants);
 function leafGeometry(maple=false){if(maple){const outline=[[0,.85],[-.15,.39],[-.42,.55],[-.32,.21],[-.65,.20],[-.36,-.02],[-.50,-.26],[-.19,-.18],[0,-.55],[.19,-.18],[.50,-.26],[.36,-.02],[.65,.20],[.32,.21],[.42,.55],[.15,.39]],p=[0,.07,0],uv=[.5,.5],ids=[];
  outline.forEach(([x,z],j)=>{p.push(x,.022*Math.sin(j*1.9),z);uv.push(x+.5,z+.5);});
  for(let j=0;j<outline.length;j++)ids.push(0,1+(j+1)%outline.length,1+j);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return ownG(g);} const p=[],uv=[],ix=[],rows=14;for(let j=0;j<=rows;j++)for(let k=0;k<3;k++){const t=j/rows,u=k-1;p.push(u*.20*Math.sin(Math.PI*t),.045*Math.sin(Math.PI*t)*(1-Math.abs(u))+.020*t*t,.5-t);uv.push(k/2,t);if(j<rows&&k<2){const a=j*3+k;if(j>0)ix.push(a,a+3,a+1);if(j<rows-1)ix.push(a+1,a+3,a+4);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return ownG(g);}
 const smallLeaf=leafGeometry(),mapleLeaf=leafGeometry(true),blossomGeometry=(()=>{const p=[],uv=[],ix=[];for(let k=0;k<5;k++){const a=k*TAU/5,c=Math.cos(a),s=Math.sin(a),at=p.length/3;p.push(c*.32,s*.32,.10);uv.push(.5,.5);for(let j=0;j<8;j++){const t=j*TAU/8,r=.35+.30*Math.cos(t),w=.27*Math.sin(t),x=c*r-s*w,y=s*r+c*w;p.push(x,y,.025+.06*Math.cos(t));uv.push(.5+x*.6,.5+y*.6);}for(let j=0;j<8;j++)ix.push(at,at+1+j,at+1+(j+1)%8);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return ownG(g);})();
 const lowMatrices=[],mapleMatrices=[],flowerMatrices=[],fernMatrices=[];
 function cluster(center,rx,ry,rz,count,array,scale,flower=false){for(let i=0;i<count;i++){const a=rr(0,TAU),y=rr(-1,1),r=Math.sqrt(1-y*y)*Math.sqrt(random()),o=new T.Object3D();o.position.set(center[0]+Math.cos(a)*rx*r,center[1]+y*ry,center[2]+Math.sin(a)*rz*r);o.rotation.set(flower?rr(-Math.PI,Math.PI):rr(-.85,.85),rr(0,TAU),flower?rr(-Math.PI,Math.PI):rr(-.75,.75));const s=scale*rr(.7,1.25);o.scale.set(s,flower?s*.7:s,s);o.updateMatrix();array.push(o.matrix.clone());}}
 function clearPlantRoot(x,z){const r=.58*plan.lanternHeight/3.34*(plan.lanternWidthFactor??1)+.10;if([-1,1].some(side=>Math.abs(x-side*plan.lanternX)<r&&Math.abs(z-plan.lanternZ)<r))return false;return !rockBounds.some(b=>b.max.y>plan.soilY&&x>b.min.x-.02&&x<b.max.x+.02&&z>b.min.z-.02&&z<b.max.z+.02);}

 for(const side of[-1,1])for(let j=0;j<260;j++){
  const x=side*rr(3.7,15.8),z=rr(-1.4,7.5),y=bankY(x,z),root=[x,y-.05,z];
  for(let k=0;k<4;k++){
   const tip=[x+rr(-.24,.24),y+rr(.12,.66),z+rr(-.24,.24)];
   line(root,tip,.010,m.bark,'living-terrace-shrub-stem',subgroups.plants,.004);
   cluster(tip,.32,.17,.29,18,lowMatrices,.23);
  }
 }
 for(const side of[-1,1]){const root=[side*10.5,plan.soilY,1.1],fork=[side*10.2,2.2,1.0];sweep([root,[side*10.7,1,1.15],fork,[side*10.1,3.9,1.05]],.13,m.bark,'cherry-trunk-'+side,subgroups.trees);for(let j=0;j<8;j++){const a=j*TAU/8,end=[side*10.3+Math.cos(a)*2.1,3.5+rr(-.4,.6),1.15+Math.sin(a)*1.6];sweep([fork,[(fork[0]+end[0])/2,2.85,(fork[2]+end[2])/2],end],.052,m.bark,'cherry-bough',subgroups.trees);for(let k=0;k<4;k++){const tip=[end[0]+rr(-.55,.55),end[1]+rr(.1,.6),end[2]+rr(-.55,.55)];line(end,tip,.017,m.bark,'cherry-twig',subgroups.trees,.007);cluster(tip,.50,.34,.45,95,flowerMatrices,.061,true);}}records.treeRoots.push({kind:'flowering-cherry',position:root});
  for(let i=0;i<380;i++){const z=i%3===0?rr(2,27):rr(plan.stairBottomZ+.1,plan.pathEndZ-.1),x=side*(i%3===0?rr(15.25,16.75):halfCauseway+rr(.08,2.8));if(!clearPlantRoot(x,z))continue;const base=[x,-.29,z];records.plantRoots.push({kind:'low-bank-shrub',position:base});for(let j=0;j<5;j++){const tip=[x+rr(-.17,.17),rr(.20,.60),z+rr(-.16,.16)];line(base,tip,.008,m.leafDark,'low-shrub-stem',subgroups.plants,.004);cluster(tip,.18,.10,.18,7,lowMatrices,.25);}}
  for(let i=0;i<27;i++){const x=side*(halfCauseway+.25),z=plan.stairBottomZ+.35+i*(plan.pathEndZ-plan.stairBottomZ-.7)/27;if(!clearPlantRoot(x,z))continue;const base=[x,-.055,z];records.plantRoots.push({kind:'compound-fern',position:base});for(let f=0;f<5;f++){const a=f*TAU/5+i*.73,len=.44+.13*Math.sin(i*1.33+f),start=V(base),tip=start.clone().add(new T.Vector3(Math.cos(a)*len,.16,Math.sin(a)*len)),mid=start.clone().lerp(tip,.48);mid.y+=.23;const curve=new T.CatmullRomCurve3([start,mid,tip]);sweep([start.toArray(),mid.toArray(),tip.toArray()],.0035,m.leafDark,'fern-rachis',subgroups.plants,12);for(let k=1;k<9;k++)for(const sign of[-1,1]){const t=k/9,point=curve.getPoint(t),angle=a+sign*.95,len=.16-.08*t,o=new T.Object3D();o.position.copy(point).add(new T.Vector3(Math.cos(angle),0,Math.sin(angle)).multiplyScalar(len*.30));o.rotation.set(.1,Math.PI/2-angle,.05*sign);o.scale.set(len*.58,len,len);o.updateMatrix();fernMatrices.push(o.matrix.clone());}}}
 }

 // Curved, tapered fork systems replace the repeated straight framing poles.
 // The third crown is behind/right of the camera and casts actual near-path
 // dappled shadows, from the same geometry used by the directional shadow pass.
 function taperedBranch(points,r,name){
  const curve=new T.CatmullRomCurve3(points.map(V)),N=18,R=7,g=new T.TubeGeometry(curve,N,r,R,false),p=g.attributes.position;
  for(let j=0;j<=N;j++){const t=j/N,c=curve.getPointAt(t),f=.14+.86*Math.pow(1-t,.72);for(let k=0;k<=R;k++){const i=j*(R+1)+k,q=new T.Vector3().fromBufferAttribute(p,i).sub(c).multiplyScalar(f).add(c);p.setXYZ(i,q.x,q.y,q.z);}}
  g.computeVertexNormals();return mesh(g,m.bark,name,subgroups.trees);
 }
 function livingMaple(root,stem,ends,label){
  const base=V(root),fork=V(stem),mid=base.clone().lerp(fork,.52);mid.x+=.48;mid.z-=.35;
  taperedBranch([root,mid.toArray(),stem],.28,'curved-maple-main-trunk-'+label);
  for(const [j,end]of ends.entries()){
   const finish=V(end),middle=fork.clone().lerp(finish,.58);middle.y+=.65;middle.z+=.35*Math.sin(j*2.1);
   taperedBranch([stem,middle.toArray(),end],.115,'tapered-maple-primary-'+label);
   for(let q=0;q<5;q++){
    const t=.45+q*.10,start=new T.CatmullRomCurve3([fork,middle,finish]).getPoint(t),a=j*2.399+q*1.7,tip=finish.clone().add(new T.Vector3(Math.cos(a)*rr(.55,1.55),rr(-.8,.90),Math.sin(a)*rr(.55,1.5))),bend=start.clone().lerp(tip,.57);bend.y+=.27;
    taperedBranch([start.toArray(),bend.toArray(),tip.toArray()],.045,'maple-secondary-fork-'+label);
    for(let k=0;k<7;k++){
     const a1=a+k*.83,origin=bend.clone().lerp(tip,.15+k*.11),bud=tip.clone().add(new T.Vector3(Math.cos(a1)*rr(.18,.64),rr(-.65,.9),Math.sin(a1)*rr(.18,.64))),turn=origin.clone().lerp(bud,.6);turn.y+=.12;
     taperedBranch([origin.toArray(),turn.toArray(),bud.toArray()],.012,'fine-leaf-bearing-maple-twig-'+label);
     cluster(bud.toArray(),.38,.63,.41,label==='near-path-shadow-crown'?8:33,mapleMatrices,.115);
    }
   }
  }
  records.treeRoots.push({kind:'curved-forked-maple',position:root});
 }
 livingMaple([-13,0,18],[-9,6.5,17],[[-4.5,8.6,12],[-3.2,9.7,15],[-7.6,8.1,9.8],[-5.7,9.0,13.4]],'west-frame');
 livingMaple([13,0,22],[9.1,7.2,20.5],[[4.5,8.5,13],[6.5,8.5,16],[3.5,9.0,15],[8.1,7.5,12.2]],'east-frame');
 livingMaple([11,0,37],[7.5,6.6,35],[[3.7,8.2,34],[6.4,7.3,33],[5.6,8.1,36],[9,7.8,32]],'near-path-shadow-crown');
 instances(smallLeaf,m.leafDark,lowMatrices,'curved-bank-leaf-instances',subgroups.plants);instances(smallLeaf,m.leaf,fernMatrices,'compound-fern-leaflets',subgroups.plants);instances(mapleLeaf,m.maple,mapleMatrices,'individual-maple-leaf-instances',subgroups.trees);instances(blossomGeometry,m.blossom,flowerMatrices,'five-petal-cherry-blossoms',subgroups.trees);
 const bridge={center:[-10.8,0,5],span:7.4,width:1.65,rise:.90},left=bridge.center[0]-bridge.span/2,right=bridge.center[0]+bridge.span/2,deckY=t=>.13+bridge.rise*(1-4*(t-.5)*(t-.5));for(const x of[left,right])island(x,5,1.05,1.55,'bridge-dry-abutment-'+x,.02);
 for(let i=0;i<38;i++){const t=(i+.5)/38,o=box([bridge.span/38+.005,.11,bridge.width],[left+t*bridge.span,deckY(t),5],m.bridge,'bridge-deck-board',subgroups.bridge);o.rotation.z=Math.atan(bridge.rise*(-8*(t-.5))/bridge.span);}
 for(const side of[-1,1]){const z=5+side*(bridge.width/2-.09);for(let level=0;level<3;level++){const pts=Array.from({length:31},(_,i)=>{const t=i/30;return[left+t*bridge.span,deckY(t)+(level===0?-.12:.36+(level-1)*.42),z];});sweep(pts,level===0?.10:level===1?.04:.055,m.bridge,'continuous-bridge-arch-'+side+'-'+level,subgroups.bridge,60);}for(let i=0;i<9;i++){const t=i/8;box([.105,.89,.105],[left+t*bridge.span,deckY(t)+.40,z],m.bridge,'bridge-post',subgroups.bridge);}}

 // The approach really narrows toward the eye. The near garden follows its
 // banks, preserving the low eye height while keeping curb/rocks in frame.
 const bankX=(x,z)=>{const weight=1-T.MathUtils.smoothstep(Math.abs(x),10,15);return x+Math.sign(x)*(pathHalf(z)-hw)*weight;};
 function warpBankGeometry(g){const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);if(z<8)continue;const a=(bankX(x+.01,z)-bankX(x-.01,z))/.02,k=(bankX(x,z+.01)-bankX(x,z-.01))/.02,nx=n.getX(i)/a,ny=n.getY(i),nz=n.getZ(i)-k*nx,q=new T.Vector3(nx,ny,nz).normalize();p.setX(i,bankX(x,z));n.setXYZ(i,q.x,q.y,q.z);}p.needsUpdate=n.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();}
 for(const o of subgroups.ground.children)if(o.name.startsWith('dry-low-path-side-bank')){o.updateMatrix();o.geometry.applyMatrix4(o.matrix);o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);o.updateMatrix();warpBankGeometry(o.geometry);}
 // Direct static meshes merge by actual material. Instanced plants and the
 // complete asset groups retain their geometry/material ownership contracts.
 group.updateMatrixWorld(true);for(const parent of Object.values(subgroups)){if(parent===subgroups.water||parent===subgroups.lanterns)continue;const batches=new Map();for(const o of parent.children)if(o.isMesh&&!o.isInstancedMesh){const a=batches.get(o.material)??[];a.push(o);batches.set(o.material,a);}for(const [mat,list]of batches){if(list.length<2)continue;const parts=[],source=[];for(const o of list){const clone=o.geometry.clone().applyMatrix4(o.matrix),g=clone.index?clone.toNonIndexed():clone;if(g!==clone)clone.dispose();if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!g.attributes.color)g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));for(const k of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(k))g.deleteAttribute(k);parts.push(g);const b=new T.Box3().setFromObject(o);source.push({name:o.name,min:b.min.toArray(),max:b.max.toArray()});}const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(!merged)throw Error('Garden static merge failed');const out=mesh(merged,mat,parent.name+'-merged-'+mat.name,parent);out.userData.sourceObjects=source;for(const o of list){o.removeFromParent();if(ownedG.delete(o.geometry))o.geometry.dispose();}}}
 for(const parent of[subgroups.shore,subgroups.plants])for(const o of parent.children)if(o.isMesh){if(o.isInstancedMesh){const matrix=new T.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);const x=matrix.elements[12],z=matrix.elements[14];if(z>=8){matrix.elements[12]=bankX(x,z);o.setMatrixAt(i,matrix);}}o.instanceMatrix.needsUpdate=true;o.computeBoundingBox();o.computeBoundingSphere();}else warpBankGeometry(o.geometry);}
 for(const r of records.plantRoots)if(r.position?.[2]>=8)r.position[0]=bankX(r.position[0],r.position[2]);
 group.updateMatrixWorld(true);pines.forEach(p=>p.syncNormalWorldMatrix());const bounds=new T.Box3().setFromObject(group),sockets={hall:{axisX:0,frontZ:0,platformY:plan.stairTopY,platformHalfWidth:7.6},stairs:{top:[0,plan.stairTopY,0],bottom:[0,0,plan.stairBottomZ],width:options.stairWidth??5.6},towerReserved:plan.towerExclusion,lanterns:lanternAsset.getEmitterMetadata(),pines:pines.map(p=>({root:p.group.position.toArray(),matrixWorld:p.group.matrixWorld.toArray()})),waterMeshes,bridge,cameraPolicy:'The complete enclosing scene owns the camera; no recovered-camera claim.'};
 records.assumptions.push('This is newly reconstructed complete source after a workspace reset, not recovered a22f bytes.','Visible path joints and curb cuts are individually observed numeric contours; hidden shape, metric depth, wear and lamp/tree dimensions remain authored hypotheses.','Broad measured paving joints define single fitted blocks; additional foreground shoulder stones are authored continuation outside the visible curb measurements.','Rock body planes and limited clipped moss replace rounded white bodies with complete green caps.','The broad lobed pine masses are physical foliage aggregates around the original bough anchors; inner fans near the stair reserve are pruned smaller rather than moving the roots.','No light, camera, renderer, background photograph or whole-tree billboard is created.','The bridge remains a subordinate reference3 water element; it is not accepted from any old reference10 point fit.');
 let disposed=false;function dispose(){if(disposed)return;disposed=true;const errors=[];for(const fn of[...children.map(c=>()=>c.dispose()),...Array.from(ownedG,g=>()=>g.dispose()),...Array.from(ownedM,m=>()=>m.dispose()),...Array.from(ownedT,t=>()=>t.dispose()),()=>group.removeFromParent()])try{fn();}catch(e){errors.push(e);}if(errors.length)throw new AggregateError(errors,'Garden cleanup errors');}
 return{group,subgroups,sockets,bounds,materials:m,waterMeshes,lanterns:lanternAsset,pines,lotusLeaves,lotusFlowers,records,plan,dispose};
}
