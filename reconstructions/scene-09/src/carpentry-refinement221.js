import * as T from 'three';
import {makeClosedCarvedLeaf} from './carved-joinery.js';

export const CARPENTRY221_REVISION='scene09-slender-cedar-and-open-carved-relief221-r06';
const hash=(x,y=0)=>{const v=Math.sin(x*127.1+y*311.7+221)*43758.5453;return v-Math.floor(v);};

// Complete thin-section hijiki, dou seats and carved rebates. The silhouette
// and its depth come from solid wood, including the returned faces and ends.
export function createCarpentry221(api){
 const{emit,box,between,group,materials:M}=api,leaf=makeClosedCarvedLeaf({length:.38,width:.082,relief:.026,turn:.17,segments:18,radial:8}),boss=new T.SphereGeometry(1,10,7);
 const extrude=(shape,depth=.16,bevel=.006)=>{const g=new T.ExtrudeGeometry(shape,{depth:depth-2*bevel,steps:1,curveSegments:18,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2});g.translate(0,0,-depth/2+bevel);return g;};
 function arm(length){const h=length/2,s=new T.Shape();s.moveTo(-h,.085);s.lineTo(h,.085);s.lineTo(h,-.018);s.bezierCurveTo(h-.11,-.026,h-.16,-.10,h-.29,-.12);s.bezierCurveTo(h*.38,-.145,h*.18,-.105,0,-.095);s.bezierCurveTo(-h*.18,-.105,-h*.38,-.145,-h+.29,-.12);s.bezierCurveTo(-h+.16,-.10,-h+.11,-.026,-h,-.018);s.closePath();return extrude(s,.18);}
 const arms=[arm(1.10),arm(1.34),arm(1.58)],douShape=new T.Shape([new T.Vector2(-.17,0),new T.Vector2(.17,0),new T.Vector2(.23,.13),new T.Vector2(.22,.18),new T.Vector2(-.22,.18),new T.Vector2(-.23,.13)]),dou=extrude(douShape,.37);
 function flower(x,y,z,r=.12,mat=M.darkGilt||M.bronze){
  const phase=hash(x*3.1,y*2.3)*Math.PI*2,n=hash(x+z,y)>.58?5:7;
  for(let k=0;k<n;k++){const a=phase+k*Math.PI*2/n,t=.86+.20*hash(k+x,y);emit(leaf,mat,x,y,z,r*2.35*t,r*2.35*t,.28,[0,0,a]);}
  emit(boss,mat,x,y,z+.012,r*.17,r*.17,.013);
 }
 function fitting(x,y,z,w=.20,h=.24){
  box(x,y,z,w,h,.012,M.bronze);
  for(const dx of[-w*.46,w*.46])box(x+dx,y,z+.009,.008,h-.014,.009,M.darkGilt);
  for(const dy of[-h*.46,h*.46])box(x,y+dy,z+.010,w-.014,.008,.010,M.darkGilt);
  for(const dx of[-w*.32,w*.32])for(const dy of[-h*.33,h*.33])emit(boss,M.gold,x+dx,y+dy,z+.015,.0065,.0065,.004);
  flower(x,y,z+.013,Math.min(w,h)*.18,M.darkGilt);
 }
 function capital(x,y,z,scale=1,depth=1,vertical=scale){group(x,y,z,0,()=>{
  box(0,.065,0,.46,.13,.46,M.carvedTimber);emit(dou,M.wood,0,.08,0);
  emit(arms[0],M.wood,0,.35,0);emit(arms[0],M.wood,0,.35,0,1,1,1,Math.PI/2);
  for(const side of[-1,1]){emit(dou,M.red,side*.33,.42,0,.65,.80,.65);emit(dou,M.wood,0,.42,side*.33,.65,.80,.65,Math.PI/2);}
  for(const side of[-1,1]){emit(arms[1],M.wood,side*.33,.65,.05,1,1,1,Math.PI/2);emit(arms[1],M.wood,0,.65,side*.33);}
  for(const sx of[-1,1])for(const sz of[-1,1])emit(dou,M.carvedTimber,sx*.33,.72,sz*.33,.65,.94,.65);
  emit(arms[2],M.wood,0,1.00,.34);
  for(const side of[-1,1]){emit(arms[2],M.wood,side*.33,1.00,.32,1,1,1,Math.PI/2);emit(dou,M.red,side*.63,1.08,.32,.52,.83,.55);emit(dou,M.wood,side*.33,1.08,.64,.52,.83,.55);between([side*.14,.27,.05],[side*.14,.91,.89],.09,.12,M.wood);}
  box(0,1.31,.34,1.58,.12,.23,M.wood);for(const side of[-1,1])box(side*.33,1.31,.25,.21,.12,1.39,M.wood);
  fitting(0,.33,.54,.11,.15);fitting(0,.65,.98,.12,.15);
 },[scale,vertical,scale*depth]);}
 function ribbon(points,width,depth,z,material){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],p[1],0))),ps=curve.getPoints(32),left=[],right=[];
  for(let i=0;i<ps.length;i++){const d=ps[Math.min(ps.length-1,i+1)].clone().sub(ps[Math.max(0,i-1)]).normalize(),w=width*(.68+.32*Math.sin(Math.PI*i/(ps.length-1)));left.push([ps[i].x-d.y*w/2,ps[i].y+d.x*w/2]);right.push([ps[i].x+d.y*w/2,ps[i].y-d.x*w/2]);}
  const s=new T.Shape();s.moveTo(...left[0]);left.slice(1).forEach(p=>s.lineTo(...p));right.reverse().forEach(p=>s.lineTo(...p));s.closePath();emit(extrude(s,depth,.003),material,0,0,z);
 }
 function reliefPanel(a,b,lo,hi,z,style=0){
  const w=b-a,h=hi-lo,cx=(a+b)/2;
  // Distinct vertical stems, off-axis leaves and recessed frames replace the
  // old identical flowers applied to a rectangular wall grid.
  for(const xx of[a,b])box(xx,(lo+hi)/2,z-.018,.030,h+.03,.080,M.wood);
  for(const yy of[lo,hi])box(cx,yy,z-.018,w+.045,.033,.080,M.wood);
  const n=w>.8?3:1;
  for(let j=0;j<n;j++){
   const x=cx+(j-(n-1)/2)*w*.27,phase=hash(style+j,a)*6.28,pts=Array.from({length:7},(_,k)=>{const t=k/6;return[x+Math.sin(t*5.4+phase)*w*.11,lo+.10+t*(h-.20)];});
   ribbon(pts,.026,.035,z+.008,M.carvedTimber);
   for(let k=0;k<7;k++){
    const t=.09+k*.125,yy=lo+t*h,xx=x+Math.sin(t*5.4+phase)*w*.11,side=(k+j)%2?1:-1,scale=Math.min(.78,w*.84)*(1+.12*Math.sin(k*2.7+phase));
    emit(leaf,k===3&&j===1?M.darkGilt:M.carvedTimber,xx+side*w*.065,yy,z+.033,scale,scale*.86,.34,[0,0,side*(.75+.18*Math.sin(k))]);
    if(k===2||k===5)ribbon([[xx,yy],[xx+side*w*.17,yy+.06],[xx+side*w*.22,yy+.17]],.015,.025,z+.027,M.carvedTimber);
   }
   if(w>.5)flower(x,lo+h*(.35+.23*j),z+.049,Math.min(.077,w*.065),j===1?M.darkGilt:M.carvedTimber);
  }
 }
 function frieze(a,b,y,z,height=.23,mat=M.wood){
  const w=b-a,cx=(a+b)/2;box(cx,y,z,w,height,.045,mat);
  const n=Math.max(2,Math.ceil(w/.85));for(let j=0;j<n;j++){const x=a+(j+.5)*w/n,phase=hash(j+a,y);ribbon([[x-w/n*.43,y-height*.14],[x-w/n*.18,y+height*.17],[x+w/n*.17,y-height*.16],[x+w/n*.43,y+height*.10]],.033,.045,z+.035,M.wood);for(const side of[-1,1])emit(leaf,M.wood,x+side*.11,y-height*.18,z+.061,.60,.62,.53,[side*.18,0,side*(.6+phase*.5)]);if(j===Math.floor(n/2))flower(x,y,z+.089,height*.14,M.carvedTimber);}
 }
 function bayArch(a,b,y,z){
  const w=b-a-.18,cx=(a+b)/2,s=new T.Shape();s.moveTo(-w/2,.11);s.lineTo(w/2,.11);s.lineTo(w/2,.015);s.bezierCurveTo(w*.37,.006,w*.33,-.135,w*.22,-.125);s.bezierCurveTo(w*.11,-.11,w*.12,-.028,0,-.028);s.bezierCurveTo(-w*.12,-.028,-w*.11,-.11,-w*.22,-.125);s.bezierCurveTo(-w*.33,-.135,-w*.37,.006,-w/2,.015);s.closePath();emit(extrude(s,.15),M.wood,cx,y,z);
  for(const side of[-1,1])emit(leaf,M.carvedTimber,cx+side*w*.28,y-.065,z+.087,.55,.57,.25,[0,0,side*.92]);
 }
 return{capital,flower,fitting,frieze,bayArch,reliefPanel,revision:CARPENTRY221_REVISION};
}

// Portable PBR maps use the existing CC0 timber's measured grain. Recalibrate
// body reflectance and roughness separately rather than bleaching the wood
// under high local lantern irradiance or changing global camera exposure.
export function calibrateCedar221(materials,ownedTextures){
 const candidates=materials.filter(m=>m.userData.metricTimberGrain&&m.map&&!/bridge-|lantern/i.test(m.name)),source=candidates[0]?.map;if(!source)return{revision:CARPENTRY221_REVISION,changed:[]};
 const n=512,c=document.createElement('canvas');c.width=c.height=n;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source.image,0,0,n,n);const bytes=ctx.getImageData(0,0,n,n).data,linear=v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4,srgb=v=>v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055,mean=[0,0,0],values=new Float32Array(n*n*3);
 for(let i=0;i<n*n;i++)for(let k=0;k<3;k++){const v=linear(bytes[i*4+k]);values[i*3+k]=v;mean[k]+=v/(n*n);}
 const palettes={wood:[.095,.044,.018],red:[.125,.028,.012],dark:[.045,.020,.007],carved:[.067,.028,.010]},maps={};
 for(const[k,target]of Object.entries(palettes)){const d=new Uint8Array(n*n*4);for(let i=0;i<n*n;i++){for(let a=0;a<3;a++)d[i*4+a]=Math.round(srgb(target[a]*T.MathUtils.clamp(values[i*3+a]/Math.max(.00001,mean[a]),.32,2.1))*255);d[i*4+3]=255;}const t=new T.DataTexture(d,n,n);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=8;t.needsUpdate=true;maps[k]=t;ownedTextures.push(t);}
 const roughData=new Uint8Array(256*256*4);for(let y=0;y<256;y++)for(let x=0;x<256;x++){const v=Math.round(255*(.84+.075*hash(x,y)+.035*Math.sin(x*.03+y*.08)**2)),i=(y*256+x)*4;roughData[i]=roughData[i+1]=roughData[i+2]=v;roughData[i+3]=255;}const rough=new T.DataTexture(roughData,256,256);rough.wrapS=rough.wrapT=T.RepeatWrapping;rough.generateMipmaps=true;rough.minFilter=T.LinearMipmapLinearFilter;rough.needsUpdate=true;ownedTextures.push(rough);
 const changed=[];for(const m of candidates){const name=m.name,k=m.userData.cedarClass221||(/dark-cedar|eave|dark$/.test(name)?'dark':/carved/i.test(name)?'carved':/red$|porch/i.test(name)?'red':'wood');m.map=maps[k];m.color.setRGB(1,1,1);m.roughnessMap=rough;m.roughness=1;if(m.isMeshPhysicalMaterial){m.clearcoat=.025;m.clearcoatRoughness=.85;m.clearcoatRoughnessMap=null;m.specularIntensity=.48;}m.normalScale?.set(.16,.16);m.userData.cedar221={palette:k,targetLinearReflectance:palettes[k],roughnessRange:[.84,.95]};m.needsUpdate=true;changed.push({name,palette:k});}
 return{revision:CARPENTRY221_REVISION,sourceMeanLinearRGB:mean,source:'Existing declared CC0 lacquered-cherry diffuse grain; original normal maps retained',palettes,roughnessRange:[.84,.95],changed,referencePixelsSampled:false,exposureChanged:false,visualAccepted:false};
}
