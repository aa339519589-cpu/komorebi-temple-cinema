import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
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
 const xs=lin(x0,x1,160),p=[],id=[],m=section.length;
 for(const x of xs){const slope=(fn(x+.001)-fn(x-.001))/.002,n=1/Math.hypot(1,slope);for(const [dy,z]of section)p.push(x-dy*slope*n,fn(x)+dy*n,z);}
 for(let j=0;j<xs.length-1;j++)for(let i=0;i<m;i++){const k=(i+1)%m,a=j*m+i,b=j*m+k,c=(j+1)*m+i,d=(j+1)*m+k;id.push(a,c,b,b,c,d);}
 const cap=T.ShapeUtils.triangulateShape(section.map(q=>new T.Vector2(...q)),[]);
 for(const [a,b,c]of cap){id.push(a,b,c);const off=(xs.length-1)*m;id.push(a+off,c+off,b+off);}
 return closedGeometry(p,id,tag);
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
function reliefSolid135({width,height,nx,ny,depth=.10,back=.045,uRepeat=1,uPhase=0,u0=0,u1=1,v0=0,v1=1,warp=null,limit=null,skin=false}){
 const count=(nx+1)*(ny+1),q=new Float32Array(count),active=new Uint8Array(nx*ny),front=[],rear=[],uv=[],index=[],vf=new Int32Array(count).fill(-1),vr=new Int32Array(count).fill(-1);
 const xy=(i,j)=>[(i/nx-.5)*width,(j/ny-.5)*height];
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const [x,y]=xy(i,j);let u=i/nx*uRepeat+uPhase;u=uRepeat===1&&uPhase===0?u:u-Math.floor(Math.min(u,uRepeat+uPhase-1e-9));
  q[j*(nx+1)+i]=heightSample(u0+(u1-u0)*u,v0+(v1-v0)*j/ny);
  if(limit&&!limit(x,y))q[j*(nx+1)+i]=0;
 }
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const a=j*(nx+1)+i,mean=(q[a]+q[a+1]+q[a+nx+1]+q[a+nx+2])/4;
  active[j*nx+i]=mean>(skin?.46:.21)?1:0;
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
 const materials=[],batches=new Map(),stats={revision:'scene04-mass164-coupled-bearing-r02',pairedHafu:2,hafuVisibleNormalDepthMetres:.585,hafuForeAftRetreatMetres:.54,carvedPanels:0,reliefTriangles:0,deepCorbelSets:0,shaftBearingSets:0,closedRafterBoards:0,visualAccepted:false};
 const finish=(source,name,color,roughness)=>{const m=source.clone();m.name=name;m.color.setHex(color);m.roughness=roughness;m.clearcoat=.12;m.clearcoatRoughness=.37;materials.push(m);return m;};
 const wood=finish(mats.cedar,'scene04-135-carved-aged-cedar',0x643016,.70),red=finish(mats.red,'scene04-135-carved-vermilion-timber',0x743b22,.68),dark=finish(mats.darkwood,'scene04-135-deep-carving-recess',0x241107,.78),gilt=finish(mats.gold,'scene04-135-worn-gilded-carving',0xac8338,.47),oldgilt=finish(mats.oldgold,'scene04-135-recessed-aged-gold',0x9b732e,.47);gilt.metalness=.88;oldgilt.metalness=.85;
 const vaultWood=finish(mats.darkwood,'scene04-135-dark-curved-vault-timber',0x4a220f,.78);
 function put(g,m,x=0,y=0,z=0,rotY=0){if(rotY)g.rotateY(rotY);g.translate(x,y,z);let list=batches.get(m);if(!list){list=[];batches.set(m,list);}list.push(g);}
 function mesh(g,m,name){const o=new T.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;group.add(o);return o;}
 const box=(w,h,d,x,y,z,m=wood)=>put(new RoundedBoxGeometry(w,h,d,1,Math.min(.0045,Math.min(w,h,d)*.065)),m,x,y,z);
 function relief({name,width,height,x=0,y=0,z=0,depth=.10,back=.045,nx=380,ny=96,uRepeat=1,uPhase=0,u0=0,u1=1,v0=0,v1=1,warp=null,limit=null,gold=true,bodyMaterial=wood}){
  const replaced=spatial188&&/separated-hafu-strap|central-hafu-carved-pendant|heavy-carved-hafu-end|separated-upper-transfer|separated-lower-nuki|pierced-dense-ranma|occupied-recessed-gold-tympanum|sculpted-transfer-end|gilded-carved-column-nose|real-door-lintel-relief/.test(name);
  if(replaced)return;
  // The surviving small field-built details are carved wood. Restrained
  // worn metal now occurs on measured source-carving peaks and real fittings.
  if(spatial188&&/side-bay-structural-carving|small-vault-lotus-shrine/.test(name))gold=false;
  const transform=(xx,yy,zz)=>{const p=warp?warp(xx,yy,zz):[xx,yy,zz];return[p[0]+x,p[1]+y,p[2]+z];};
  const args={width,height,nx,ny,depth,back,uRepeat,uPhase,u0,u1,v0,v1,warp:transform,limit};
  for(const skin of gold?[false,true]:[false]){const g=reliefSolid135({...args,skin});stats.reliefTriangles+=g.index.count/3;mesh(g,skin?gilt:bodyMaterial,name+(skin?'-real-gilt-skin':'-closed-wood-body'));}
  stats.carvedPanels++;
 }
 function extrude(shape,depth,m,x,y,z,rotY=0,bevel=.012){const g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel*.70,bevelSegments:3,curveSegments:22});put(g,m,x,y,z,rotY);}
 const front=profile.front,at=x=>profile.canopy(x,front);
 // Deep coupled hafu sections; the weather skin is only the outermost layer.
 // The lower swept body retreats 0.54m, creating true depth and end returns.
 const outer=[[-.025,front-.12],[-.025,front+.045],[-.070,front+.095],[-.100,front+.115],[-.245,front+.105],[-.295,front+.055],[-.325,front-.030],[-.300,front-.16],[-.270,front-.19],[-.105,front-.16]];
 const fascia=sweepSection(at,-profile.half,profile.half,outer,'entrance-saddled-bargeboard');mesh(fascia,wood,'scene04-135-main-flowing-hafu-actual-lamp-support');
 const innerAt=x=>at(x)-.35,innerSection=[[-.06,front-.50],[-.06,front-.35],[-.11,front-.315],[-.180,front-.33],[-.235,front-.39],[-.230,front-.54],[-.160,front-.58],[-.08,front-.56]];
 mesh(sweepSection(innerAt,-5.92,5.92,innerSection,'135-inner-coupled-hafu'),wood,'scene04-135-recessed-second-flowing-hafu');
 for(const side of[-1,1]){
  const end=new T.Shape(),x=side*6.05,y=at(x);
  end.moveTo(-1.66,y-.11);end.lineTo(-1.66,y-.28);end.bezierCurveTo(-1.45,y-.39,-1.20,y-.53,-.96,y-.585);end.lineTo(-.96,y-.38);end.bezierCurveTo(-1.20,y-.35,-1.42,y-.20,-1.66,y-.11);end.closePath();
  extrude(end,.32,wood,x-.16,0,0,Math.PI/2,.014);
 }
 const webSection=[[-.230,front-.080],[-.300,front+.040],[-.360,front-.110],[-.440,front-.350],[-.450,front-.510],[-.350,front-.550],[-.310,front-.370],[-.240,front-.170]];
 mesh(sweepSection(at,-6.10,6.10,webSection,'135-continuous-coupled-hafu-underweb'),wood,'scene04-135-real-continuous-hafu-underweb');
 // Metal fillets remain thin applied volumes along the two solid timber faces.
 for(const [fn,drop,zz]of[[at,-.075,front+.116],[at,-.275,front+.086],[innerAt,-.115,front-.31],[innerAt,-.205,front-.36]]){
  const section=lin(0,Math.PI*2,8).slice(0,-1).map(a=>[drop+.006*Math.cos(a),zz+.003*Math.sin(a)]);
  mesh(sweepSection(fn,-5.96,5.96,section,'135-fine-seated-hafu-metal-fillet'),oldgilt,'scene04-135-continuous-thin-hafu-gilding');
 }
 // Real carved pattern follows the curved bargeboard body. Six independent
 // relief modules have different mirrored pattern phases and actual shadow.
 for(const [i,cx]of[-5.25,-2.95,0,2.95,5.25].entries()){
  if(cx===0)continue;
  const width=i===2?.84:.72;
  relief({name:'scene04-135-separated-hafu-strap-'+i,width,height:.400,x:cx,y:0,z:front+.108,depth:.038,back:.020,nx:180,ny:64,u0:cx<0?.02:.66,u1:cx<0?.34:.98,warp:(x,y,z)=>{const xx=x+cx,slope=(at(xx+.002)-at(xx-.002))/.004,n=1/Math.hypot(1,slope);return[x-y*slope*n,at(xx)-.175+y*n,z];}});
 }
 // Broad crown pendant and heavy carved hafu ends replace little toy flowers.
 relief({name:'scene04-135-central-hafu-carved-pendant',width:1.14,height:.75,y:at(0)-.33,z:front+.13,depth:.085,back:.06,nx:280,ny:150,u0:.36,u1:.64,v0:0,v1:1});
 for(const side of[-1,1]){
  relief({name:'scene04-135-heavy-carved-hafu-end-'+side,width:.88,height:.75,x:side*5.86,y:at(side*5.86)-.28,z:front+.10,depth:.095,back:.075,nx:200,ny:120,u0:side<0?.01:.68,u1:side<0?.32:.99});
 }
 const beamBulge=x=>.075*Math.max(0,1-Math.pow(x/3.45,2));
 function shapedBeam(width,height,y,z,bow=.10,m=wood,pockets=[]){
  const xs=lin(-width/2,width/2,180),p=[],id=[],sections=[];
  for(const x of xs){
   const u=2*x/width,top=y+height*.47+bow*(1-u*u)+.035*Math.exp(-Math.pow((Math.abs(u)-.79)/.11,2)),bottom=y-height*.46+.09*Math.pow(Math.abs(u),4)-.045*Math.exp(-Math.pow(u/.45,2))+.020*Math.cos(2*Math.PI*u),zf=z+beamBulge(x);
   const ring=[[top,z-.80],[top,zf-.018],[top-.018,zf+.004]];
   for(let row=1;row<24;row++){
    const t=row/24,yy=(top-.018)*(1-t)+(bottom+.018)*t,original=zf+.004+.031*(1-Math.abs(2*t-1));let recess=0;
    for(const pocket of pockets){const fx=Math.max(0,Math.min(1,(pocket.w/2-Math.abs(x-pocket.x))/.045)),fy=Math.max(0,Math.min(1,(pocket.h/2-Math.abs(yy-pocket.y))/.035));recess=Math.max(recess,.030*fx*fx*(3-2*fx)*fy*fy*(3-2*fy));}
    ring.push([yy,original-recess]);
   }
   ring.push([bottom+.018,zf+.004],[bottom,zf-.018],[bottom,z-.80]);
   sections.push(ring);for(const [yy,zz]of ring)p.push(x,yy,zz);
  }
  const n=sections[0].length;
  for(let j=0;j<xs.length-1;j++)for(let i=0;i<n;i++){const k=(i+1)%n,a=j*n+i,b=j*n+k,c=(j+1)*n+i,d=(j+1)*n+k;id.push(a,c,b,b,c,d);}
  for(const at of[0,xs.length-1]){
   const tris=T.ShapeUtils.triangulateShape(sections[at].map(q=>new T.Vector2(...q)),[]);
   for(const [a,b,c]of tris)id.push(at*n+a,at*n+b,at*n+c);
  }
  put(closedGeometry(p,id,'135-convex-cloud-ended-rainbow-transfer-beam'),m);
 }
 const upperY=C.capitalTop+.39,lowerY=C.capitalTop-.51,upperZ=.83,lowerZ=.22;
 const sourceRatio=spatial188?spatial188.info().floral.nativeBounds[0]/spatial188.info().floral.nativeBounds[1]:1;
 const pocket=(x,y,w,h)=>({x,y,w:Math.min(w,h*sourceRatio)+.075,h:Math.min(h,w/sourceRatio)+.075});
 shapedBeam(6.90,.62,upperY,upperZ,.11,wood,spatial188?[-2.45,0,2.45].map(x=>pocket(x,upperY+.018,x===0?1.28:.86,.42)):[]);
 shapedBeam(6.90,.57,lowerY,lowerZ,.09,red,spatial188?[pocket(0,lowerY+.015,1.28,.36)]:[]);
 // Dense carved wood/gold occupies both transfer faces and the pierced gap.
 for(const [i,x]of[-2.45,-1.23,0,1.23,2.45].entries()){
  const width=i===2?1.22:.78,h=i===2?.45:.38,u0=i===2?.34:i<2?.02:.66,u1=i===2?.66:i<2?.34:.98;
  relief({name:'scene04-135-separated-upper-transfer-carving-'+i,width,height:h,x,y:upperY+.018,z:upperZ+.006,depth:.065,back:.022,nx:i===2?280:190,ny:72,u0,u1,limit:(xx,yy)=>(xx/(width*.50))**2+(yy/(h*.49))**2<1,warp:(xx,yy,zz)=>[xx,yy,zz+beamBulge(x+xx)+.025]});
  relief({name:'scene04-135-separated-lower-nuki-carving-'+i,width:width*.94,height:h*.87,x,y:lowerY+.015,z:lowerZ+.006,depth:.055,back:.022,nx:i===2?270:180,ny:66,u0,u1,limit:(xx,yy)=>(xx/(width*.47))**2+(yy/(h*.43))**2<1,warp:(xx,yy,zz)=>[xx,yy,zz+beamBulge(x+xx)+.025]});
 }
 relief({name:'scene04-135-pierced-dense-ranma',width:4.60,height:.72,y:(upperY+lowerY)/2+.015,z:.10,depth:.24,back:.075,nx:1140,ny:148,uRepeat:2,uPhase:.5,v0:0,v1:1,limit:(x,y)=>Math.pow(x/2.30,2)+Math.pow(y/.41,2)<1});
 // A carved arched tympanum lives deep behind the paired hafu, with real
 // pierced black interstices and 155mm variable depth rather than blank wood.
 const tymY=upperY+.80;
 relief({name:'scene04-135-occupied-recessed-gold-tympanum',width:4.98,height:1.60,y:tymY,z:-.22,depth:.155,back:.080,nx:900,ny:260,uRepeat:1,v0:0,v1:1,limit:(x,y)=>y+tymY<at(x)-.93});
 // Carved heavy noses at transfer ends rest directly over the column clusters.
 for(const side of[-1,1])for(const [yy,zz]of[[upperY,upperZ],[lowerY,lowerZ]]){
  relief({name:'scene04-135-sculpted-transfer-end-'+side+'-'+yy,width:.70,height:.60,x:side*3.06,y:yy,z:zz+.015,depth:.105,back:.050,nx:145,ny:88,u0:side<0?0:.69,u1:side<0?.31:1,warp:(xx,yy,zzz)=>[xx,yy,zzz+beamBulge(side*3.06+xx)+.025]});
 }
 // A small actual carved tabernacle / lotus at the dark vault crown.
 box(.46,.82,.18,0,upperY+1.02,.40,dark);
 for(const sx of[-1,1])box(.025,.88,.025,sx*.25,upperY+1.02,.505,oldgilt);
 relief({name:'scene04-135-small-vault-lotus-shrine',width:.48,height:.86,y:upperY+1.02,z:.51,depth:.065,back:.025,nx:150,ny:195,u0:.385,u1:.615,v0:0,v1:1});
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
 for(let i=0;i<32;i++){const x0=-3.20+i*.20;shell(x0+.007,x0+.193,-2.15,.95,.058,.655,'scene04-135-real-curved-vault-board-'+i);stats.closedRafterBoards++;}
 for(const z of[.94,-.39,-1.73]){
  const section=[[-.02,z-.080],[-.02,z+.080],[-.14,z+.080],[-.16,z+.035],[-.16,z-.035],[-.14,z-.080]];
  mesh(sweepSection(x=>profile.canopy(x,z)-.68,-3.20,3.20,section,'135-deep-vault-arch-trimmer'),red,'scene04-135-seated-vault-structural-arch-'+z);
 }
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
  corbels(x,cap+.40,.03,.88,true);
  relief({name:'scene04-135-gilded-carved-column-nose-'+x,width:.63,height:.52,x,y:cap-.54,z:.37,depth:.14,back:.095,nx:150,ny:84,u0:.02,u1:.98});
 }
 // Dense lower and upper eave corbel clusters replace the two plain ladders.
 for(const side of[-1,1]){
  for(let i=0;i<6;i++){const x=side*(3.45+i*.49);corbels(x,profile.canopy(x,.50)-.26,-.16,.56);}
  for(let i=0;i<9;i++){const x=side*(3.22+i*.54);corbels(x,profile.upperRaw(x,C.ridgeZ+4.5)-.24,C.ridgeZ+4.5-.18,.47);}
 }
 // Short side beams and carved fascia connect the ornament to actual bay axes.
 for(const side of[-1,1])for(const [a,b,drop]of[[C.columnAxes[3],C.columnAxes[4],.72],[C.columnAxes[4],C.columnAxes[5],1.0]]){
  const x=side*(a+b)/2,w=b-a-.12,y=C.capitalTop-drop+.09;
  relief({name:'scene04-135-side-bay-structural-carving-'+x,width:w*.91,height:.38,x,y,z:.285,depth:.045,back:.025,nx:240,ny:52});
 }
 relief({name:'scene04-135-real-door-lintel-relief',width:4.64,height:.40,y:C.stairTopY+4.61,z:-.352,depth:.047,back:.025,nx:720,ny:62,uRepeat:2});
 if(spatial188){
  const sourceEmit=(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0)=>{const o=mesh(g,m,'spatial188-actual-source-carving');o.position.set(x,y,z);o.scale.set(sx,sy,sz);if(Array.isArray(rot))o.rotation.set(...rot);else o.rotation.y=rot||0;};
  for(const x of[-2.45,0,2.45])spatial188.panel(sourceEmit,{x,y:upperY+.018,z:upperZ+beamBulge(x)+.010,width:x===0?1.28:.86,height:.42,frame:false,backing:false,label:'upper-structural-transfer-'+x});
  spatial188.panel(sourceEmit,{x:0,y:lowerY+.015,z:lowerZ+beamBulge(0)+.010,width:1.28,height:.36,frame:false,backing:false,label:'lower-structural-transfer-centre'});
  // Real pierced cloud sections bridge the ranma gap. Their five cut loops
  // are capped independently; no natural source channel is filled or warped.
  const ranmaCentre=(lowerY+.57*.47+.09+upperY-.31)/2;
  for(const x of[-1.60,-.53,.53,1.60])spatial188.panel(sourceEmit,{x,y:ranmaCentre,z:.11,width:.75,height:.19,frame:false,label:'fitted-real-ranma-field-'+x});
  for(const side of[-1,1]){
   for(const [yy,zz]of[[upperY,upperZ],[lowerY,lowerZ]]){
    for(const dx of[-.15,.15])box(.024,.34,.019,side*3.06+dx,yy,zz+beamBulge(side*3.06)+.037,oldgilt);
    for(const dy of[-.17,.17])box(.32,.024,.019,side*3.06,yy+dy,zz+beamBulge(side*3.06)+.037,oldgilt);
   }
   spatial188.panel(sourceEmit,{x:side*1.22,y:upperY+.79,z:-.19,width:1.70,height:.49,frame:false,backing:false,label:'deep-gable-panel-'+side});
   box(1.44,.58,.12,side*1.22,upperY+.79,-.25,dark);
  }
  spatial188.cloudPair(sourceEmit,{x:0,y:at(0)-.64,z:front+.13,scale:.52,label:'main-hafu-carved-crown-pendant'});
  for(const x of[-5.25,-2.95,2.95,5.25]){
   const angle=Math.atan((at(x+.002)-at(x-.002))/.004);
   spatial188.panel(sourceEmit,{x,y:at(x)-.18,z:front+.12,width:.66,height:.24,rotation:[0,0,angle],frame:false,backing:false,label:'rigid-seated-hafu-clamp-'+x});
  }
  for(const x of C.columnAxes){const cap=Math.abs(x)<3.2?C.capitalTop+.26:Math.abs(x)<5.5?C.capitalTop-.62:C.capitalTop-.94;spatial188.cloudOne(sourceEmit,{x,y:cap-.53,z:.37,scale:.53,side:Math.sign(x),material:Math.abs(x)<3.2?spatial188.materials[1]:spatial188.cloudWood,label:'single-seated-main-column-shoulder-'+x});}
  spatial188.panel(sourceEmit,{x:0,y:C.stairTopY+4.61,z:-.318,width:1.40,height:.34,label:'front-real-door-lintel'});
  for(const side of[-1,1])spatial188.cloudPair(sourceEmit,{x:side*1.70,y:C.stairTopY+4.44,z:-.318,scale:.23,label:'front-door-lintel-end-'+side});
  stats.spatial188={sourcePreserved:true,uniformFittingOnly:true,legacyGoldReliefReplaced:true,deepBearingsRetained:true,routedStructuralCarvingSeats:4,sourceSurfaceNonrigidDelta:0};
 }
 for(const [m,parts]of batches){const all=parts.map(g=>g.index?g.toNonIndexed():g),g=mergeGeometries(all,false);if(!g)throw Error('135 structural batch failed');mesh(g,m,'scene04-135-deep-structural-'+m.name);for(const q of parts)q.dispose();for(const q of all)q.dispose();}
 group.userData.porch135=stats;return{group,materials,stats};
}

// A reusable physical relief volume for the occupied sanctuary. The scalar
// guide deforms real closed geometry and never supplies rendered RGB.
export function createSanctuaryCarving164(options){
 const g=reliefSolid135(options);g.userData.architectureMember=options.skin?'164-sanctuary-real-gilt-volume':'164-sanctuary-closed-carved-substance';return g;
}
