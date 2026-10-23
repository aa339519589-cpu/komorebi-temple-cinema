import * as T from 'three';
import {finishSolid190} from './detail190-solids.js';
import {createCornerMask190} from './corner-mask190.js';
import {terminalDistance204} from './terminal-volume204.js';

// A sculpted ceramic terminal with real face volume, orbital/nostril
// cavities and forward/rear returns. The former190 part is used only to
// retain its exact established mounting solid and attachment datums.
export async function createTempleTerminal204(){
 const parts=[],owned=[];
 const add=(g,material='slate')=>{owned.push(g);parts.push({geometry:g,material});return g;};
 const raw=await (await fetch('/reconstructions/scene-05/assets/terminal204-authored/face204.bin')).arrayBuffer(),header=new DataView(raw);
 if(header.getUint32(0,true)!==0x34303254||header.getUint32(4,true)!==1)throw Error('Invalid terminal204 volume');
 const count=header.getUint32(8,true),indexCount=header.getUint32(12,true),start=header.getUint32(16,true),g=new T.BufferGeometry();
 if(raw.byteLength!==start+count*24+indexCount*4)throw Error('Truncated terminal204 volume');
 g.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(raw,start,count*3),3));g.setAttribute('normal',new T.Float32BufferAttribute(new Float32Array(raw,start+count*12,count*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(raw,start+count*24,indexCount),1));g.userData.terminal204Shared=true;
 const uv=new Float32Array(count*2);for(let i=0;i<count;i++){uv[i*2]=g.attributes.position.getX(i);uv[i*2+1]=g.attributes.position.getY(i);}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));const colors=new Float32Array(count*3);for(let i=0;i<count;i++){const x=g.attributes.position.getX(i),y=g.attributes.position.getY(i),z=g.attributes.position.getZ(i),v=.94+.035*Math.sin(x*47+y*31+z*17)+.024*Math.sin(x*121-y*73);colors.set([v*.98,v,v*1.018],i*3);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.name='scene05-authored-closed-sculpted-ceramic-face204';add(g);
 function cast(shape,depth,z,bevel=.003){const geom=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:24,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3});geom.translate(0,0,z-depth/2);return geom;}
 function solidSweep(points,height,depth,arris=.0025){
  const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),R=80,N=8,p=[],uv=[],ix=[];
  const hy=height/2,hz=depth/2,a=Math.min(arris,hy*.3,hz*.3),section=[[-hy+a,-hz],[hy-a,-hz],[hy,-hz+a],[hy,hz-a],[hy-a,hz],[-hy+a,hz],[-hy,hz-a],[-hy,-hz+a]];
  for(let j=0;j<=R;j++){const t=j/R,c=path.getPoint(t),tangent=path.getTangent(t).normalize(),up=new T.Vector3(0,1,0).addScaledVector(tangent,-tangent.y).normalize(),front=tangent.clone().cross(up).normalize();for(const[y,z]of section){p.push(...c.clone().addScaledVector(up,y).addScaledVector(front,z).toArray());uv.push(t*path.getLength(),y);}}
  for(let j=0;j<R;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N;ix.push(a,b,a+N,b,b+N,a+N);}
  const ci=p.length/3;p.push(...path.getPoint(0).toArray(),...path.getPoint(1).toArray());uv.push(.5,0,.5,1);for(let k=0;k<N;k++)ix.push(ci,(k+1)%N,k,ci+1,R*N+k,R*N+(k+1)%N);
  return finishSolid190(p,uv,ix,'scene05-closed-rolled-ceramic-return204');
 }
 function conformedInlay(shape,centre){
  const outline=shape.getSpacedPoints(96).slice(0,-1),N=outline.length,R=12,p=[],uv=[],ix=[],front=[];
  function frontZ(x,y){let hi=.17,lo=hi;for(let z=.169;z>-.08;z-=.001){if(terminalDistance204(x,y,z)<=0){lo=z;break;}hi=z;}for(let j=0;j<17;j++){const m=(lo+hi)/2;if(terminalDistance204(x,y,m)<=0)lo=m;else hi=m;}return(lo+hi)/2;}
  front.push([centre[0],centre[1],frontZ(...centre)]);
  for(let j=1;j<=R;j++)for(const q of outline){const t=j/R,x=centre[0]+(q.x-centre[0])*t,y=centre[1]+(q.y-centre[1])*t;front.push([x,y,frontZ(x,y)]);}
  const stride=front.length;for(const side of[0,1])for(const[x,y,z]of front){p.push(x,y,z+(side?-.0015:.0015));uv.push(x,y);}
  const tri=(a,b,c)=>{ix.push(a,b,c,a+stride,c+stride,b+stride);};
  for(let k=0;k<N;k++)tri(0,1+k,1+(k+1)%N);
  for(let j=0;j<R-1;j++)for(let k=0;k<N;k++){const a=1+j*N+k,b=1+j*N+(k+1)%N,c=a+N,d=b+N;tri(a,c,b);tri(b,c,d);}
  for(let k=0;k<N;k++){const a=1+(R-1)*N+k,b=1+(R-1)*N+(k+1)%N;ix.push(a,b,a+stride,b,b+stride,a+stride);}
  const g=finishSolid190(p,uv,ix,'scene05-thin-curved-seated-nose-inlay204');g.userData={seatedOnAuthoredCeramic:true,normalOffsetM:.0015,thicknessM:.003};return g;
 }
 const base=[[-.342,.009,0],[-.200,-.026,.020],[0,-.062,.034],[.202,-.025,.020],[.344,.010,0]];
 add(solidSweep(base.map(([x,y,z])=>[x,y-.016,z]),.075,.085,.0025));
 for(const off of[0,-.024,-.048])add(solidSweep(base.map(([x,y,z])=>[x,y+off,z+.034]),.0095,.024,.0015));
 for(const s of[-1,1]){
  add(solidSweep([[s*.340,.011,.011],[s*.365,-.023,.001],[s*.355,-.072,-.018],[s*.322,-.111,-.034]],.031,.088,.004));
  add(solidSweep([[s*.342,.011,.070],[s*.353,-.025,.058],[s*.345,-.071,.036],[s*.322,-.105,.011]],.0075,.018,.0018));
 }
 const crest=new T.Shape();crest.moveTo(-.200,.326);crest.lineTo(-.152,.423);crest.quadraticCurveTo(-.068,.451,-.003,.476);crest.quadraticCurveTo(.074,.452,.150,.424);crest.lineTo(.200,.326);crest.closePath();add(cast(crest,.104,-.059,.004));
 add(solidSweep([[-.166,.415,-.008],[-.075,.451,-.006],[-.003,.477,-.006],[.077,.453,-.006],[.166,.416,-.008]],.012,.032,.002));
 function ellipsoid(position,scale,material='slate',rotation=0){const q=new T.SphereGeometry(1,32,20);q.scale(...scale);q.rotateZ(rotation);q.translate(...position);return add(q,material);}
 ellipsoid([-.105,.264,.032],[.028,.014,.017],'slate',-.24);ellipsoid([.108,.267,.032],[.026,.013,.017],'slate',.23);
 ellipsoid([-.106,.263,.048],[.0068,.0062,.0028],'terminalInlay204');ellipsoid([.107,.266,.047],[.0057,.0055,.0024],'terminalInlay204');
 const nose=new T.Shape();nose.moveTo(-.035,.181);nose.bezierCurveTo(-.028,.194,-.014,.206,0,.209);nose.bezierCurveTo(.014,.205,.028,.194,.035,.180);nose.quadraticCurveTo(.016,.171,0,.175);nose.quadraticCurveTo(-.020,.171,-.035,.181);nose.closePath();const inlay=conformedInlay(nose,[0,.190]);inlay.name='scene05-thin-lobed-nose-inlay204';add(inlay,'terminalInlay204');ellipsoid([-.002,.368,.050],[.016,.009,.0024],'terminalInlay204',.10);ellipsoid([.001,-.084,.082],[.020,.012,.0028],'terminalInlay204');
 // A finite rear ceramic neck seats the new face on the exact old mount.
 // It overlaps the retained carrier in+.Z and the thick facial ground in
 // its upper forward half; the mask/site/hip attachment matrices do not move.
 const neck=new T.Shape();neck.moveTo(-.091,-.030);neck.lineTo(.091,-.030);neck.lineTo(.095,-.026);neck.lineTo(.095,.096);neck.lineTo(.091,.100);neck.lineTo(-.091,.100);neck.lineTo(-.095,.096);neck.lineTo(-.095,-.026);neck.closePath();const receiver=cast(neck,.060,-.064,.0025);receiver.name='scene05-seated-rear-ceramic-neck204';add(receiver);
 // The photographed front is the end of a deep ridge tile, not a separate
 // round badge. A finite20mm shell tapers back over the original ridge seat.
 // Both annular end cuts are capped: the ceramic is a closed solid wall.
 const hoodStations=[[-.032,.242,.239,.205],[-.125,.235,.229,.198],[-.235,.211,.211,.185],[-.340,.175,.185,.169]];
 function hollowLoft(stations,wall,name){
  const N=96,p=[],uv=[],ix=[],stride=N*2;
  for(const[z,rx,ry,cy]of stations)for(const inset of[0,wall])for(let k=0;k<N;k++){const a=k/N*Math.PI*2;p.push((rx-inset)*Math.cos(a),cy+(ry-inset)*(Math.sin(a)>=0?Math.sin(a):Math.max(-.76,Math.sin(a)*.84)),z);uv.push(k/N,-z);}
  for(let j=0;j<stations.length-1;j++)for(let k=0;k<N;k++){const a=j*stride+k,b=j*stride+(k+1)%N,c=a+N,d=b+N;ix.push(a,a+stride,b,b,a+stride,b+stride,c,d,c+stride,d,d+stride,c+stride);}
  for(const j of[0,stations.length-1])for(let k=0;k<N;k++){const a=j*stride+k,b=j*stride+(k+1)%N,c=a+N,d=b+N;if(!j)ix.push(a,b,c,b,d,c);else ix.push(a,c,b,b,c,d);}
  return finishSolid190(p,uv,ix,name);
 }
 add(hollowLoft(hoodStations,.020,'scene05-closed-tapered-ridge-vault204'));
 const hoodAt=z=>{let i=0;while(i<hoodStations.length-2&&z<hoodStations[i+1][0])i++;const a=hoodStations[i],b=hoodStations[i+1],t=(z-a[0])/(b[0]-a[0]);return[z,...[1,2,3].map(k=>a[k]+(b[k]-a[k])*t)];};
 for(const z of[-.104,-.208,-.306]){const sections=[z+.008,z-.008].map(q=>{const a=hoodAt(q);a[1]+=.006;a[2]+=.006;return a;});add(hollowLoft(sections,.010,'scene05-fitted-ridge-vault-return204'));}
 // This hidden keel positively seats the shell on the exact old neck. It
 // is beneath the ridge casing, without moving the original mount datum.
 const keel=new T.Shape();keel.moveTo(-.062,-.060);keel.lineTo(.062,-.060);keel.lineTo(.065,-.057);keel.lineTo(.065,.052);keel.lineTo(.062,.055);keel.lineTo(-.062,.055);keel.lineTo(-.065,.052);keel.lineTo(-.065,-.057);keel.closePath();const k=cast(keel,.260,-.185,.0025);k.name='scene05-seated-ridge-vault-keel204';add(k);
 const old=createCornerMask190(),mountParts=old.mountParts.map(p=>({geometry:p.geometry.clone(),material:p.material}));old.dispose();for(const p of mountParts)owned.push(p.geometry);
 return{parts,mountParts,info:{revision:204,source:'Explicit authored3D ceramic sculpture from visible HD05 features; no external scan or photograph pixels in geometry',construction:'One closed volumetric face with descending bent-wedge brows, orbital hollows, small nostril bores, shallow domed nose inlay, bevelled mouth and integral fan planes; finite-depth rim/stepped returns; a closed20mm tapered ridge-vault shell with three fitted transverse returns seats through a closed keel onto the exact original neck/mount',mainHipMountOffset:[0,.145,.23],geometryRevision:'astra-r11-conforming-nasal-inlay-and-positive-shell-bearing',changedMounts:[{member:'lower ceramic frieze',localYShift:.008,reason:'Increase face/rim overlap after sculpted lower rim became shallower'},{member:'hidden ridge keel',upperBearingYBefore:.030,upperBearingYAfter:.055,reason:'Positive bearing into the new flatter arched vault floor'}],finish:'Thin lobed nasal inlay, recessed unequal pupils, shallow cast folds and charcoal kiln mottling',mountReason:'Exact retained190 closed mounting solid/offset plus a new hidden ceramic neck and keel connecting positively into face and rear ridge-vault shell',externalScanUsed:false,referencePhotographRuntimeUse:false,historicalArtifactIdentityClaimed:false,visualAccepted:false},dispose(){for(const q of owned)q.dispose();}};
}
