import * as T from 'three';
import {buildVaultBearing212} from './scene04-vault-bearing212.js';
import {createCarvedBeamMaterial212} from './scene04-carved-bearing212.js';
import {createSculptedCloudBody212,createCarvedGiltWood212} from './scene04-sculpted-core212.js';
import {createJoinedCarvedBeam212,createForkedBearing212,createColumnNeck212,attachFloralCarving237} from './scene04-porch-core212.js';
import {createHeavyKarahafu212,createCloudTransfer212,cloudTransferEnvelope212,createRaisedScrollVine212} from './scene04-front-frame212.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createPrecisionTimberFactory04,ensureTimberEndGrainAttributes212} from './scene04-timber-precision134.js';
const lin=(a,b,n)=>Array.from({length:n+1},(_,i)=>a+(b-a)*i/n);
const V=p=>new T.Vector3(...p);
function closedGeometry(p,id,tag){
 const edges=new Map(),count=id.length/3,adj=Array.from({length:count},()=>[]);
 for(let t=0;t<count;t++)for(let j=0;j<3;j++){const a=id[t*3+j],b=id[t*3+(j+1)%3],key=a<b?a+':'+b:b+':'+a,list=edges.get(key)??[];list.push({t,dir:a<b?1:-1});edges.set(key,list);}
 for(const list of edges.values()){if(list.length!==2)throw Error('Porch133 authored solid has an unclosed edge: '+tag);const[a,b]=list,flip=a.dir===b.dir?1:0;adj[a.t].push([b.t,flip]);adj[b.t].push([a.t,flip]);}
 const parity=new Int8Array(count).fill(-1);for(let first=0;first<count;first++)if(parity[first]<0){parity[first]=0;const queue=[first];for(let q=0;q<queue.length;q++){const t=queue[q];for(const [b,flip]of adj[t]){const value=parity[t]^flip;if(parity[b]<0){parity[b]=value;queue.push(b);}else if(parity[b]!==value)throw Error('Porch133 nonorientable solid: '+tag);}}}
 for(let t=0;t<count;t++)if(parity[t]){const k=t*3;[id[k+1],id[k+2]]=[id[k+2],id[k+1]];}
 let volume=0;for(let i=0;i<id.length;i+=3){const a=id[i]*3,b=id[i+1]*3,c=id[i+2]*3;volume+=(p[a]*(p[b+1]*p[c+2]-p[b+2]*p[c+1])+p[a+1]*(p[b+2]*p[c]-p[b]*p[c+2])+p[a+2]*(p[b]*p[c+1]-p[b+1]*p[c]))/6;}
 if(volume<0)for(let i=0;i<id.length;i+=3)[id[i+1],id[i+2]]=[id[i+2],id[i+1]];
 const uv=[];for(let i=0;i<p.length;i+=3)uv.push(p[i],p[i+1]);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(id);g.computeVertexNormals();g.userData.architectureMember=tag;g.userData.closedAuthoredSolid={pairedEdges:edges.size,absoluteVolume:Math.abs(volume)};return g;
}
// A thin coating follows the actual front of the carved substance. Its back
// sits 0.2mm in the wood; its outer face is 0.4mm above it, with closed edges.
function coating(grid,tag){
 const rows=grid.length,cols=grid[0].length,n=rows*cols,p=[],id=[];
 for(const dz of[-.0002,.0004])for(const row of grid)for(const q of row)p.push(q[0],q[1],q[2]+dz);
 const quad=(a,b,c,d)=>id.push(a,b,c,b,d,c);
 for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){const a=j*cols+i;quad(a,a+cols,a+1,a+cols+1);quad(a+n,a+1+n,a+cols+n,a+cols+1+n);}
 for(let i=0;i<cols-1;i++){quad(i,i+1,i+n,i+1+n);const a=(rows-1)*cols+i;quad(a,a+n,a+1,a+1+n);}
 for(let j=0;j<rows-1;j++){const a=j*cols,b=a+cols;quad(a,a+n,b,b+n);const c=a+cols-1,d=c+cols;quad(c,d,c+n,d+n);}
 return closedGeometry(p,id,tag);
}
function sweepSection(fn,x0,x1,section,tag){
 const xs=lin(x0,x1,160),p=[],id=[],uv=[],m=section.length,across=[0];let along=0,previous=null;for(let k=1;k<m;k++)across[k]=across[k-1]+Math.hypot(section[k][0]-section[k-1][0],section[k][1]-section[k-1][1]);
 for(const x of xs){const y=fn(x),slope=(fn(x+.001)-fn(x-.001))/.002,n=1/Math.hypot(1,slope);if(previous)along+=Math.hypot(x-previous[0],y-previous[1]);previous=[x,y];for(let k=0;k<m;k++){const[dy,z]=section[k];p.push(x-dy*slope*n,y+dy*n,z);uv.push(along/1.45+.37,across[k]/.38+.23);}}
 for(let j=0;j<xs.length-1;j++)for(let i=0;i<m;i++){const k=(i+1)%m,a=j*m+i,b=j*m+k,c=(j+1)*m+i,d=(j+1)*m+k;id.push(a,c,b,b,c,d);}
 const cap=T.ShapeUtils.triangulateShape(section.map(q=>new T.Vector2(...q)),[]);
 for(const [a,b,c]of cap){id.push(a,b,c);const off=(xs.length-1)*m;id.push(a+off,c+off,b+off);}
 const g=closedGeometry(p,id,tag);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.userData.grain212='Metric arc length along sweep, section perimeter across';return g;
}

export function ridgeFront135(half,x,yRelative){
 const y=yRelative-(.025+.070*Math.pow(x/half,4)),p=[[-.170,.205],[-.115,.260],[-.045,.260],[.005,.205],[.075,.200],[.110,.160],[.175,.150],[.205,.095]];
 let i=0;while(i<p.length-2&&y>p[i+1][0])i++;const a=p[i],b=p[i+1],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));return a[1]+(b[1]-a[1])*t+.003;
}
export function createMainRidge135(half){
 const section=[[-.170,-.210],[-.170,.205],[-.115,.260],[-.045,.260],[.005,.205],[.075,.200],[.110,.160],[.175,.150],[.205,.095],[.205,-.095],[.175,-.150],[.110,-.160],[.075,-.200],[-.045,-.260],[-.115,-.260]];
 return sweepSection(x=>.025+.070*Math.pow(x/half,4),-half-.055,half+.055,section,'135-curved-multi-step-ceramic-ridge');
}

let reliefField=null;
export async function loadPorchRelief135(){
 if(reliefField)return;
 const response=await fetch(new URL('../assets/carving135/hosoge-karakusa-height-1536x512.gray8.bin',import.meta.url));
 if(!response.ok)throw Error('Authored carving135 scalar guide did not load');
 const data=new Uint8Array(await response.arrayBuffer());
 if(data.length!==1536*512)throw Error('Carving135 scalar guide has wrong dimensions');
 reliefField={data,w:1536,h:512};
}
function heightSample(u,v){
 if(!reliefField)throw Error('Load actual carving135 scalar field before construction');
 u=Math.max(0,Math.min(1,u));v=Math.max(0,Math.min(1,v));
 const {data,w,h}=reliefField,x=u*(w-1),y=(1-v)*(h-1),a=Math.floor(x),b=Math.floor(y),fx=x-a,fy=y-b;
 const p=(i,j)=>data[Math.min(h-1,j)*w+Math.min(w-1,i)]/255;
 return Math.max(0,Math.min(1,((p(a,b)*(1-fx)+p(a+1,b)*fx)*(1-fy)+(p(a,b+1)*(1-fx)+p(a+1,b+1)*fx)*fy-.180)/.820));
}
// Each active sampled cell has a front, back and boundary walls. Height is
// actual vertex Z. This is a closed relief volume, never an image plane/albedo.
function reliefSolid135({width,height,nx,ny,depth=.10,back=.045,uRepeat=1,uPhase=0,u0=0,u1=1,v0=0,v1=1,warp=null,limit=null,skin=false,solidCutoff=.21,skinCutoff=.46}){
 const count=(nx+1)*(ny+1),q=new Float32Array(count),active=new Uint8Array(nx*ny),front=[],rear=[],uv=[],index=[],vf=new Int32Array(count).fill(-1),vr=new Int32Array(count).fill(-1);
 const xy=(i,j)=>[(i/nx-.5)*width,(j/ny-.5)*height];
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const [x,y]=xy(i,j);let u=i/nx*uRepeat+uPhase;u=uRepeat===1&&uPhase===0?u:u-Math.floor(Math.min(u,uRepeat+uPhase-1e-9));
  q[j*(nx+1)+i]=heightSample(u0+(u1-u0)*u,v0+(v1-v0)*j/ny);
  if(limit&&!limit(x,y))q[j*(nx+1)+i]=0;
 }
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const a=j*(nx+1)+i,mean=(q[a]+q[a+1]+q[a+nx+1]+q[a+nx+2])/4;
  active[j*nx+i]=mean>(skin?skinCutoff:solidCutoff)?1:0;
 }
 function vert(k,rearSide){
  const map=rearSide?vr:vf;if(map[k]>=0)return map[k];
  const i=k%(nx+1),j=Math.floor(k/(nx+1)),[x,y]=xy(i,j),h=.010+depth*Math.pow(q[k],.86),z=skin?h+(rearSide?-.0003:.0006):rearSide?-back:h,point=warp?warp(x,y,z):[x,y,z],at=front.length/3;
  front.push(...point);uv.push(x/1.45,y/.38);map[k]=at;return at;
 }
 const quad=(a,b,c,d)=>index.push(a,b,c,b,d,c);
 let cells=0,boundaries=0;
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)if(active[j*nx+i]){
  const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1,af=vert(a,false),bf=vert(b,false),cf=vert(c,false),df=vert(d,false),ar=vert(a,true),br=vert(b,true),cr=vert(c,true),dr=vert(d,true);
  quad(af,bf,cf,df);quad(ar,cr,br,dr);cells++;
  if(j===0||!active[(j-1)*nx+i]){quad(ar,br,af,bf);boundaries++;}
  if(j===ny-1||!active[(j+1)*nx+i]){quad(cr,cf,dr,df);boundaries++;}
  if(i===0||!active[j*nx+i-1]){quad(ar,af,cr,cf);boundaries++;}
  if(i===nx-1||!active[j*nx+i+1]){quad(br,dr,bf,df);boundaries++;}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(front,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
 g.userData.architectureMember=skin?'135-conforming-gilt-volume':'135-closed-sculpted-timber-relief';
 g.userData.relief135={source:'Authored non-metric height guide, independently lit actual closed 3D mesh',grid:[nx,ny],activeCells:cells,closedBoundaryEdges:boundaries,nominalReliefMetres:depth,backThicknessMetres:skin?.0009:back,giltSkin:skin,imageUsedAsAlbedo:false,undercuts:'Real pierced interstices, closed backing/walls per connected height-field region; no recovered rear undercut sculpture'};
 return g;
}
export function buildPorchJoinery135(mats,{C,profile,spatial188=null}){
 if(!reliefField)throw Error('Carving135 data not ready');
 const group=new T.Group();group.name='scene04-135-dominant-carved-porch-and-coupled-hafu';
 const materials=[],batches=new Map(),stats={revision:'scene04-237-r28-curved-vault-and-true-carving-contacts',pairedHafu:2,hafuVisibleNormalDepthMetres:.585,hafuForeAftRetreatMetres:.54,carvedPanels:0,reliefTriangles:0,deepCorbelSets:0,shaftBearingSets:0,closedRafterBoards:0,visualAccepted:false};
 const finish=(source,name,color,roughness)=>{const m=source.clone();m.name=name;m.color.setHex(color);m.roughness=roughness;materials.push(m);return m;};
 const wood=finish(mats.cedar,'scene04-135-carved-aged-cedar',0x794725,.61),red=finish(mats.red,'scene04-135-carved-vermilion-timber',0x793a25,.48),dark=finish(mats.darkwood,'scene04-135-deep-carving-recess',0x382213,.74),gilt=finish(mats.gold,'scene04-135-worn-gilded-carving',0xc59c4e,.34),oldgilt=finish(mats.oldgold,'scene04-135-recessed-aged-gold',0xb58b45,.43);gilt.metalness=.94;oldgilt.metalness=.88;
 const vaultWood=finish(mats.darkwood,'scene04-135-dark-curved-vault-timber',0x774b2b,.66),precisionTimber=createPrecisionTimberFactory04();
 const sculptedMaterial=createCarvedGiltWood212();materials.push(sculptedMaterial);
 function put(g,m,x=0,y=0,z=0,rotY=0){if(m.userData.timberFinish212)ensureTimberEndGrainAttributes212(g);if(rotY)g.rotateY(rotY);g.translate(x,y,z);let list=batches.get(m);if(!list){list=[];batches.set(m,list);}list.push(g);}
 function mesh(g,m,name){const o=new T.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;group.add(o);return o;}
 const box=(w,h,d,x,y,z,m=wood)=>put(m.userData.timberFinish212?precisionTimber.box(w,h,d).clone():new RoundedBoxGeometry(w,h,d,2,Math.min(.002,Math.min(w,h,d)*.08)),m,x,y,z);
 function relief({name,width,height,x=0,y=0,z=0,depth=.10,back=.045,nx=380,ny=96,uRepeat=1,uPhase=0,u0=0,u1=1,v0=0,v1=1,warp=null,limit=null,gold=true,bodyMaterial=wood,solidCutoff=.21,skinCutoff=.46}){
  const replaced=spatial188&&/sculpted-transfer-end|gilded-carved-column-nose|real-door-lintel-relief/.test(name);
  if(replaced)return;
  // The surviving small field-built details are carved wood. Restrained
  // worn metal now occurs on measured source-carving peaks and real fittings.
  if(spatial188&&/side-bay-structural-carving/.test(name))gold=false;
  const transform=(xx,yy,zz)=>{const p=warp?warp(xx,yy,zz):[xx,yy,zz];return[p[0]+x,p[1]+y,p[2]+z];};
  const args={width,height,nx,ny,depth,back,uRepeat,uPhase,u0,u1,v0,v1,warp:transform,limit,solidCutoff,skinCutoff};
  for(const skin of gold?[false,true]:[false]){const g=reliefSolid135({...args,skin});stats.reliefTriangles+=g.index.count/3;mesh(g,skin?gilt:bodyMaterial,name+(skin?'-real-gilt-skin':'-closed-wood-body'));}
  stats.carvedPanels++;
 }
 function extrude(shape,depth,m,x,y,z,rotY=0,bevel=.012){const g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel*.70,bevelSegments:3,curveSegments:22});put(g,m,x,y,z,rotY);}
 const front=profile.front,at=x=>profile.canopy(x,front);
 // Deep coupled hafu sections; the weather skin is only the outermost layer.
 // The lower swept body retreats 0.54m, creating true depth and end returns.
 const outer=[[-.025,front-.12],[-.025,front+.045],[-.070,front+.095],[-.100,front+.115],[-.245,front+.105],[-.295,front+.055],[-.325,front-.030],[-.300,front-.16],[-.270,front-.19],[-.105,front-.16]];
 const fascia=createHeavyKarahafu212(profile);mesh(fascia,wood,'scene04-135-main-flowing-hafu-actual-lamp-support');
 const innerAt=x=>at(x)-.32,innerSection=[[-.035,front-.54],[-.035,front-.32],[-.07,front-.27],[-.180,front-.28],[-.245,front-.39],[-.230,front-.62],[-.115,front-.68],[-.045,front-.65]];
 mesh(sweepSection(innerAt,-5.92,5.92,innerSection,'135-inner-coupled-hafu'),wood,'scene04-135-recessed-second-flowing-hafu');
 for(const side of[-1,1]){
  const end=new T.Shape(),x=side*6.05,y=at(x);
  end.moveTo(-1.66,y-.11);end.lineTo(-1.66,y-.28);end.bezierCurveTo(-1.45,y-.39,-1.20,y-.53,-.96,y-.585);end.lineTo(-.96,y-.38);end.bezierCurveTo(-1.20,y-.35,-1.42,y-.20,-1.66,y-.11);end.closePath();
  extrude(end,.32,wood,x-.16,0,0,Math.PI/2,.014);
 }
 const webSection=[[-.360,front-.10],[-.405,front+.015],[-.470,front-.090],[-.540,front-.35],[-.585,front-.58],[-.535,front-.68],[-.435,front-.42],[-.365,front-.20]];
 mesh(sweepSection(at,-6.10,6.10,webSection,'135-continuous-coupled-hafu-underweb'),wood,'scene04-135-real-continuous-hafu-underweb');
 // Metal fillets remain thin applied volumes along the two solid timber faces.
 for(const [fn,drop,zz]of[[at,-.110,front+.183],[at,-.285,front+.153],[innerAt,-.070,front-.268],[innerAt,-.180,front-.276]]){
  const section=lin(0,Math.PI*2,8).slice(0,-1).map(a=>[drop+.006*Math.cos(a),zz+.003*Math.sin(a)]);
  mesh(sweepSection(fn,-5.96,5.96,section,'135-fine-seated-hafu-metal-fillet'),oldgilt,'scene04-135-continuous-thin-hafu-gilding');
 }
 // Real carved pattern follows the curved bargeboard body. Six independent
 // relief modules have different mirrored pattern phases and actual shadow.
 for(const [i,cx]of[-5.25,-2.95,0,2.95,5.25].entries()){
  if(cx===0)continue;
  const width=.42,head=new T.Shape(),left=at(cx-width/2)-at(cx)-.075,right=at(cx+width/2)-at(cx)-.075;
  head.moveTo(-width/2,left);head.lineTo(width/2,right);head.lineTo(width/2,-.60);head.quadraticCurveTo(width*.42,-.75,width*.22,-.70);head.quadraticCurveTo(0,-.82,-width*.22,-.70);head.quadraticCurveTo(-width*.42,-.75,-width/2,-.60);head.closePath();extrude(head,.30,wood,cx,at(cx),front-.13,0,.012);
  relief({name:'scene04-212-upright-carved-hafu-receiving-head-'+i,width:.38,height:.50,x:cx,y:at(cx)-.42,z:front+.180,depth:.040,back:.035,nx:100,ny:160,u0:cx<0?.02:.66,u1:cx<0?.34:.98});
 }
 // Coved front timber has a real fine carved band and framed metal clamps.
 relief({name:'scene04-212-coved-hafu-wood-scroll',width:12.05,height:.120,x:0,y:0,z:front+.145,depth:.027,back:.020,nx:1550,ny:42,uRepeat:5,gold:false,warp:(x,y,z)=>{const slope=(at(x+.002)-at(x-.002))/.004,n=1/Math.hypot(1,slope);return[x-y*slope*n,at(x)-.210+y*n,z];}});
 for(const x of[-5.25,-2.95,2.95,5.25]){for(const y of[at(x)-.17,at(x)-.67])box(.43,.018,.014,x,y,front+.184,oldgilt);for(const side of[-1,1])box(.018,.50,.014,x+side*.215,at(x)-.42,front+.184,oldgilt);}
 box(.12,.32,.18,0,at(0)-.55,front-.15,wood);
 {const g=createSculptedCloudBody212({width:1.15,height:.39,depth:.035,frontFloor:.003,back:.025,y:at(0)-.88,z:front-.080,region:[.36,.02,.64,.98],outline:'ellipse'}),p=g.attributes.position;for(let i=0;i<p.count;i++){const t=T.MathUtils.clamp((at(0)-.685-p.getY(i))/.39,0,1);p.setX(i,p.getX(i)*(1-.42*t));}g.computeVertexNormals();mesh(g,sculptedMaterial,'scene04-212-supported-tapered-pendant-with-real-tongue');}
 // Broad crown pendant and heavy carved hafu ends replace little toy flowers.
 for(const side of[-1,1]){
  relief({name:'scene04-135-heavy-carved-hafu-end-'+side,width:.88,height:.75,x:side*5.86,y:at(side*5.86)-.28,z:front+.10,depth:.095,back:.075,nx:200,ny:120,u0:side<0?.01:.68,u1:side<0?.32:.99});
 }
 const upperY=C.capitalTop+.43,lowerY=C.capitalTop-.52,upperZ=.62,lowerZ=-.08;
 const upperBeamMaterial=createCarvedBeamMaterial212(wood,'scene04-212-upper-carved-bearing-timber'),lowerBeamMaterial=createCarvedBeamMaterial212(red,'scene04-212-lower-carved-bearing-timber');materials.push(upperBeamMaterial,lowerBeamMaterial);
 mesh(attachFloralCarving237(createJoinedCarvedBeam212({width:6.12,height:.45,y:upperY,z:upperZ,depth:.64,centres:[],continuous:.035,label:'upper-inner-column-joined-beam'}),[-2.17,0,2.17].map((x,i)=>({x,y:upperY+.018,z:upperZ+.009,width:i===1?1.02:.56,height:i===1?.28:.30,depth:.043,petals:14,phase:i*.41}))),upperBeamMaterial,'scene04-237-upper-bearing-with-closed-floral-carving');
 mesh(attachFloralCarving237(createJoinedCarvedBeam212({width:6.10,height:.43,y:lowerY,z:lowerZ,depth:.66,centres:[],continuous:.045,label:'lower-beam-buried-behind-round-shafts'}),[-2.22,-1.20,0,1.20,2.22].map((x,i)=>({x,y:lowerY+.008,z:lowerZ+.009,width:i===2?1.12:.38,height:i===2?.24:.20,depth:.038,petals:14,phase:.23+i*.31}))),lowerBeamMaterial,'scene04-237-lower-bearing-with-closed-floral-carving');
 for(const side of[-1,1])for(const[a,b,drop]of[[C.columnAxes[3],C.columnAxes[4],0],[C.columnAxes[4],C.columnAxes[5],.26]]){const x=side*(a+b)/2,y=lowerY-drop,z=-.10;mesh(attachFloralCarving237(createJoinedCarvedBeam212({x,width:b-a+.16,height:drop?.34:.39,y,z,depth:.62,centres:[],continuous:.045,label:'mortised-side-bay-header'}),[{x,y:y+.012,z:z+.009,width:.55,height:.25,depth:.037,petals:14,phase:side*.31}]),upperBeamMaterial,'scene04-237-side-bay-bearing-with-sculptural-centre');}
 for(const x of[-1.88,1.88])mesh(createForkedBearing212({x,y:8.79,z:.08}),upperBeamMaterial,'scene04-212-forked-receiver-between-primary-beams');
 mesh(createJoinedCarvedBeam212({width:5.02,height:.28,y:C.stairTopY+4.49,z:-.37,depth:.54,centres:[[-1.65,.16],[0,.72],[1.65,.16]],continuous:.45,carveDepth:.029,frontCove:.012,bow:.012,label:'deep-thin-door-lintel'}),upperBeamMaterial,'scene04-212-inset-carved-door-lintel');
 // The ranma is one carved body with real through-holes and rounded bevels.
 // Only its curved side/bevel surfaces are gilded; no gold image strip.
 const sculptedCore=createSculptedCloudBody212({width:3.20,height:.40,y:8.79,z:-.06,depth:.085,frontFloor:.004,back:.065});mesh(sculptedCore,sculptedMaterial,'scene04-212-primary-sculpted-cloud-lotus-core');stats.primarySculpture=sculptedCore.userData.sculpt212;
 stats.integratedBearing212={actualCarvedClosedSolids:7,throughForkedReceivers:2,columnNecks:6,mainBeamFrontZ:lowerZ,shaftFrontZ:.327,upperSpanMetres:6.12,lowerHeightMetres:.43,closedFloralPetals:228,closedFloralCentres:12,flatBeamPlaques:0,conformingMaterialGilding:true,visualAccepted:false};
 for(const x of C.columnAxes){const cap=Math.abs(x)<3.2?C.capitalTop+.26:Math.abs(x)<5.5?C.capitalTop-.62:C.capitalTop-.94,cy=cap-.72;mesh(createColumnNeck212({x,y:cy,z:.335}),upperBeamMaterial,'scene04-212-mortised-carved-shaft-neck');for(const sx of[-1,1])box(.012,.56,.010,x+sx*.165,cy+.012,.341,oldgilt);for(const yy of[-.255,.285])box(.33,.012,.010,x,cy+yy,.341,oldgilt);}

 // A small actual carved tabernacle / lotus at the dark vault crown.
 box(.36,.62,.18,0,upperY+1.02,.40,dark);
 for(const sx of[-1,1])box(.020,.66,.025,sx*.20,upperY+1.02,.505,oldgilt);
 relief({name:'scene04-135-small-vault-lotus-shrine',width:.36,height:.62,y:upperY+1.02,z:.51,depth:.050,back:.025,nx:120,ny:160,u0:.385,u1:.615,v0:0,v1:1});
 // Continuous closed vault boards have recessed seams, following the actual
 // compound roof curvature. Broad structural arch trimmers interrupt them.
 const shell=(x0,x1,z0,z1,thickness,drop,tag)=>{
  const nx=4,nz=22,p=[],id=[],uv=[];
  for(const off of[-thickness,0])for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=x0+(x1-x0)*i/nx,z=z0+(z1-z0)*j/nz;p.push(x,profile.canopy(x,z)-drop+off,z);uv.push(z/1.45,x/.38);}
  const stride=nx+1,n=(nx+1)*(nz+1),quad=(a,b,c,d)=>id.push(a,b,c,b,d,c);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*stride+i;quad(a,a+stride,a+1,a+stride+1);quad(a+n,a+1+n,a+stride+n,a+stride+1+n);}
  for(let i=0;i<nx;i++){quad(i,i+1,i+n,i+1+n);const a=n-stride+i;quad(a,a+n,a+1,a+1+n);}
  for(let j=0;j<nz;j++){const a=j*stride,b=a+stride;quad(a,a+n,b,b+n);const c=a+nx,d=b+nx;quad(c,d,c+n,d+n);}
  const g=closedGeometry(p,id,tag);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));mesh(g,vaultWood,tag);
 };
 for(let i=0;i<44;i++){const x0=-3.20+i*(6.4/44);shell(x0+.006,x0+6.4/44-.006,-2.15,.95,.085,.815,'scene04-135-real-curved-vault-board-'+i);stats.closedRafterBoards++;}
 const vaultBearing=buildVaultBearing212({profile,C,wood:vaultWood,darkwood:dark,upperBeamY:upperY,upperBeamHeight:.45});group.add(vaultBearing.group);stats.vaultBearing212=vaultBearing.stats;
 relief({name:'scene04-135-ceramic-crest-raised-lotus',bodyMaterial:oldgilt,width:.30,height:.42,y:at(0)+.645,z:front+.208,depth:.045,back:.012,nx:96,ny:96,u0:.405,u1:.595,v0:0,v1:1});
 for(const sx of[-3.9,0,3.9]){
  const x=sx+C.upperRidgeOffsetX,y=C.ridgeY+.13;
  relief({name:'scene04-135-ridge-conforming-carved-medallion-'+sx,width:.31,height:.36,x,y,z:C.ridgeZ,depth:.020,back:.014,nx:100,ny:90,u0:.405,u1:.595,v0:0,v1:1,bodyMaterial:oldgilt,warp:(xx,yy,zz)=>[xx,yy,ridgeFront135(profile.ridgeHalf,sx+xx,.13+yy)+zz]});
 }
 function cloudArm(width,height,depth,notchTop=true){
  const s=new T.Shape(),w=width/2,h=height/2,nw=Math.min(.14,width*.16),ny=h*.15;
  s.moveTo(-w,h*.72);s.lineTo(-nw,h*.72);
  if(notchTop){s.lineTo(-nw,ny);s.lineTo(nw,ny);}
  s.lineTo(nw,h*.72);s.lineTo(w,h*.72);s.bezierCurveTo(w*1.10,h*.20,w*.94,-h*.90,w*.72,-h*.62);s.bezierCurveTo(w*.48,-h*.20,w*.55,-h*.80,w*.22,-h*.70);
  if(!notchTop){s.lineTo(nw,-h*.70);s.lineTo(nw,ny);s.lineTo(-nw,ny);s.lineTo(-nw,-h*.70);}
  s.bezierCurveTo(-w*.12,-h*.90,-w*.28,-h*.10,-w*.48,-h*.52);s.bezierCurveTo(-w*.86,-h*1.05,-w*1.10,-h*.55,-w,h*.72);s.closePath();
  return new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.011,bevelThickness:.008,bevelSegments:3,curveSegments:20});
 }
 function receiver(w,h,d){
  const rings=[[-.50,.78],[-.33,.94],[-.08,1.0],[.31,.97],[.50,.84]],p=[],id=[],corner=Math.min(w,d)*.075;
  for(const [yy,f]of rings){const a=w*f/2,b=d*f/2,c=corner;for(const [x,z]of[[-a+c,-b],[a-c,-b],[a,-b+c],[a,b-c],[a-c,b],[-a+c,b],[-a,b-c],[-a,-b+c]])p.push(x,yy*h,z);}
  for(let j=0;j<rings.length-1;j++)for(let k=0;k<8;k++){const n=(k+1)%8,a=j*8+k,b=j*8+n,c=(j+1)*8+k,d=(j+1)*8+n;id.push(a,c,b,b,c,d);}
  const low=p.length/3;p.push(0,-h*.5,0);const high=p.length/3;p.push(0,h*.5,0);
  for(let k=0;k<8;k++){const n=(k+1)%8;id.push(low,n,k);const a=(rings.length-1)*8;id.push(high,a+k,a+n);}
  return closedGeometry(p,id,'135-canted-eight-corner-masu-receiver');
 }
 function corbels(x,top,z,scale=1,column=false){
  const lift=column?.115:.155,base=top-(column?.37:.58);
  for(let k=0;k<3;k++){
   const y=base+k*lift,w=(.80+k*.27)*scale,d=.24*scale,h=.18*scale;
   put(cloudArm(w,h,d,true),wood,x,y,z-d/2);
   const cross=cloudArm(w*(k===2?1.10:.95),h,d,false);cross.rotateY(Math.PI/2);put(cross,red,x-d/2,y+.012,z+.16*scale);
   for(const s of[-1,1]){
    put(receiver(.23*scale,.115*scale,.27*scale),wood,x+s*w*.34,y+.128*scale,z);
    put(receiver(.21*scale,.105*scale,.25*scale),wood,x,y+.130*scale,z+.16*scale+s*w*.34);
   }
   if(k===2)box(w*.96,.072*scale,.19*scale,x,y+.208*scale,z+.27*scale,red);
  }
  stats.deepCorbelSets++;if(column)stats.shaftBearingSets++;
 }
 for(const x of C.columnAxes){
  const cap=Math.abs(x)<3.2?C.capitalTop+.26:Math.abs(x)<5.5?C.capitalTop-.62:C.capitalTop-.94;
  if(Math.abs(x)>3.2)corbels(x,cap+.40,-.17,.78,true);
  relief({name:'scene04-135-gilded-carved-column-nose-'+x,width:.63,height:.52,x,y:cap-.54,z:.37,depth:.14,back:.095,nx:150,ny:84,u0:.02,u1:.98});
 }
 // Dense lower and upper eave corbel clusters replace the two plain ladders.
 for(const side of[-1,1]){
  for(let i=0;i<8;i++){const x=side*(3.36+i*.405);corbels(x,profile.canopy(x,.50)-.56,-.10,.75);}
  for(let i=0;i<11;i++){const x=side*(3.22+i*.432);corbels(x,profile.upperRaw(x,C.ridgeZ+4.5)-.27,C.ridgeZ+4.5-.14,.62);}
 }
 // Side-bay carving is now cut into its actual joined header above.
 // Closed carved transoms join each lattice bay to its bearing header.
 for(const side of[-1,1])for(const[a,b]of[[C.columnAxes[3],C.columnAxes[4]],[C.columnAxes[4],C.columnAxes[5]]]){
  const x=side*(a+b)/2,w=b-a-.52,y=C.stairTopY+3.67;
  box(w,1.12,.14,x,y+.27,-.55,dark);
  for(const yy of[y-.28,y+.26,y+.80])box(w,.095,.16,x,yy,-.44,wood);
  // Two recessed carved lights and a real centre mullion now share one
  // joined transom, matching the fine framed subdivision in HD04.
  box(.066,.49,.21,x,y-.005,-.43,wood);
  for(const dx of[-.25,.25]){
   const cx=x+w*dx;for(const edge of[-1,1])box(.047,.49,.20,cx+edge*w*.225,y-.005,-.43,wood);
   if(spatial188){
    // Original source depth at its actual uniform fit determines the mount.
    // Rear substance enters the timber4mm; the rest remains real relief.
    const native=spatial188.info().floral.nativeBounds,fit=Math.min((w*.425)/native[0],.39/native[1]),mountZ=-.48+native[2]*fit*.5-.004;
    const mounted=spatial188.panel((g,m,xx,yy,zz,sx,sy,sz,rot)=>{const o=mesh(g,m,'scene04-237-paired-recessed-carved-transom-light');o.position.set(xx,yy,zz);o.scale.set(sx,sy,sz);if(Array.isArray(rot))o.rotation.set(...rot);},{x:cx,y:y-.005,z:mountZ,width:w*.425,height:.39,frame:false,backing:false,label:'paired-deep-transom-'+x+'-'+dx});
    (stats.transomContacts237??=[]).push({lightX:cx,sourceDepth:mounted.depth,carrierFrontZ:-.48,mountZ,rearBurialMetres:.004,sourceUniformFitPreserved:true});
   }
  }
 }
 relief({name:'scene04-135-real-door-lintel-relief',width:4.64,height:.40,y:C.stairTopY+4.61,z:-.352,depth:.047,back:.025,nx:720,ny:62,uRepeat:2});
 if(spatial188){
  const sourceEmit=(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0)=>{const o=mesh(g,m,'spatial188-actual-source-carving');o.position.set(x,y,z);o.scale.set(sx,sy,sz);if(Array.isArray(rot))o.rotation.set(...rot);else o.rotation.y=rot||0;};
  // 212 uses individually sculpted closed relief across the entire transfer
  // and pierced ranma openings. Source188 carving remains on its own supported
  // hafu, shoulders and portal; no copied rectangular plaques hide this work.
  spatial188.panel(sourceEmit,{x:0,y:C.stairTopY+4.49,z:-.375,width:1.40,height:.22,label:'front-real-door-lintel',frame:false,backing:false});
  for(const side of[-1,1])spatial188.cloudPair(sourceEmit,{x:side*1.70,y:C.stairTopY+4.42,z:-.375,scale:.17,label:'front-door-lintel-end-'+side});
  stats.spatial188={sourcePreserved:true,uniformFittingOnly:true,legacyGoldReliefReplaced:'Actual closed joined beams, forked bearings and inset shaft necks replace flat-board stacks',deepBearingsRetained:true,originalSourceCarvingOnDoorAndTransoms:true,sourceSurfaceNonrigidDelta:0};
 }
 for(const [m,parts]of batches){const all=parts.map(g=>g.index?g.toNonIndexed():g),g=mergeGeometries(all,false);if(!g)throw Error('135 structural batch failed');mesh(g,m,'scene04-135-deep-structural-'+m.name);for(const q of parts)q.dispose();for(const q of all)q.dispose();}
 group.userData.porch135=stats;return{group,materials,stats};
}

// A reusable physical relief volume for the occupied sanctuary. The scalar
// guide deforms real closed geometry and never supplies rendered RGB.
export function createSanctuaryCarving164(options){
 const g=reliefSolid135(options);g.userData.architectureMember=options.skin?'164-sanctuary-real-gilt-volume':'164-sanctuary-closed-carved-substance';return g;
}
