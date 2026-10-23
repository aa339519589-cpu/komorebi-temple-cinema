import * as T from 'three';
import {finishSolid190} from './detail190-solids.js';
import {createCornerMask190} from './corner-mask190.js';

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
 const uv=new Float32Array(count*2);for(let i=0;i<count;i++){uv[i*2]=g.attributes.position.getX(i);uv[i*2+1]=g.attributes.position.getY(i);}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(count*3).fill(1),3));g.name='scene05-authored-closed-sculpted-ceramic-face204';add(g);
 function cast(shape,depth,z,bevel=.003){const geom=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:24,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3});geom.translate(0,0,z-depth/2);return geom;}
 function solidSweep(points,height,depth,arris=.0025){
  const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),R=80,N=8,p=[],uv=[],ix=[];
  const hy=height/2,hz=depth/2,a=Math.min(arris,hy*.3,hz*.3),section=[[-hy+a,-hz],[hy-a,-hz],[hy,-hz+a],[hy,hz-a],[hy-a,hz],[-hy+a,hz],[-hy,hz-a],[-hy,-hz+a]];
  for(let j=0;j<=R;j++){const t=j/R,c=path.getPoint(t),tangent=path.getTangent(t).normalize(),up=new T.Vector3(0,1,0).addScaledVector(tangent,-tangent.y).normalize(),front=tangent.clone().cross(up).normalize();for(const[y,z]of section){p.push(...c.clone().addScaledVector(up,y).addScaledVector(front,z).toArray());uv.push(t*path.getLength(),y);}}
  for(let j=0;j<R;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N;ix.push(a,b,a+N,b,b+N,a+N);}
  const ci=p.length/3;p.push(...path.getPoint(0).toArray(),...path.getPoint(1).toArray());uv.push(.5,0,.5,1);for(let k=0;k<N;k++)ix.push(ci,(k+1)%N,k,ci+1,R*N+k,R*N+(k+1)%N);
  return finishSolid190(p,uv,ix,'scene05-closed-rolled-ceramic-return204');
 }
 const base=[[-.342,.009,0],[-.200,-.026,.020],[0,-.062,.034],[.202,-.025,.020],[.344,.010,0]];
 add(solidSweep(base.map(([x,y,z])=>[x,y-.024,z]),.075,.085,.0025));
 for(const off of[0,-.024,-.048])add(solidSweep(base.map(([x,y,z])=>[x,y+off,z+.034]),.0095,.024,.0015));
 for(const s of[-1,1]){
  add(solidSweep([[s*.340,.011,.011],[s*(s<0?.381:.375),-.023,.001],[s*.369,-.089,-.025],[s*.321,-.146,-.050]],.034,.110,.003));
  add(solidSweep([[s*.342,.011,.070],[s*.368,-.030,.061],[s*.356,-.090,.028],[s*.321,-.138,.005]],.009,.022,.0014));
 }
 const crest=new T.Shape();crest.moveTo(-.200,.326);crest.lineTo(-.152,.423);crest.quadraticCurveTo(-.068,.451,-.003,.476);crest.quadraticCurveTo(.074,.452,.150,.424);crest.lineTo(.200,.326);crest.closePath();add(cast(crest,.104,-.059,.004));
 add(solidSweep([[-.166,.415,-.008],[-.075,.451,-.006],[-.003,.477,-.006],[.077,.453,-.006],[.166,.416,-.008]],.012,.032,.002));
 function ellipsoid(position,scale,material='slate',rotation=0){const q=new T.SphereGeometry(1,32,20);q.scale(...scale);q.rotateZ(rotation);q.translate(...position);return add(q,material);}
 ellipsoid([-.105,.260,.015],[.020,.014,.018],'slate',-.27);ellipsoid([.106,.266,.014],[.020,.014,.018],'slate',.22);
 ellipsoid([-.106,.258,.033],[.005,.0055,.002],'oldgold');ellipsoid([.105,.265,.032],[.005,.0055,.002],'oldgold');
 ellipsoid([.001,.195,.134],[.015,.009,.003],'oldgold',-.08);ellipsoid([-.002,.362,.073],[.011,.013,.0028],'oldgold',.10);ellipsoid([.001,-.084,.082],[.020,.013,.005],'oldgold');
 // A finite rear ceramic neck seats the new face on the exact old mount.
 // It overlaps the retained carrier in+.Z and the thick facial ground in
 // its upper forward half; the mask/site/hip attachment matrices do not move.
 const neck=new T.Shape();neck.moveTo(-.091,-.030);neck.lineTo(.091,-.030);neck.lineTo(.095,-.026);neck.lineTo(.095,.096);neck.lineTo(.091,.100);neck.lineTo(-.091,.100);neck.lineTo(-.095,.096);neck.lineTo(-.095,-.026);neck.closePath();const receiver=cast(neck,.060,-.064,.0025);receiver.name='scene05-seated-rear-ceramic-neck204';add(receiver);
 const old=createCornerMask190(),mountParts=old.mountParts.map(p=>({geometry:p.geometry.clone(),material:p.material}));old.dispose();for(const p of mountParts)owned.push(p.geometry);
 return{parts,mountParts,info:{revision:204,source:'Explicit authored3D ceramic sculpture from visible HD05 features; no external scan or photograph pixels in geometry',construction:'One closed volumetric carved face with asymmetric brow roots, deep orbital pockets, two real nostril bores, projecting bridge/nose and carved mandibular/whisker folds; finite-depth rim and three thin dished/rolled returns with a seated rear receiver neck',mainHipMountOffset:[0,.145,.23],mountReason:'Exact retained190 closed mounting solid/offset plus a new hidden ceramic neck connecting positively into the new facial volume',externalScanUsed:false,referencePhotographRuntimeUse:false,historicalArtifactIdentityClaimed:false,visualAccepted:false},dispose(){for(const q of owned)q.dispose();}};
}
