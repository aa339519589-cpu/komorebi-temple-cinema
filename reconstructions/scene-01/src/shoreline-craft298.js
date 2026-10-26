import * as T from 'three';
import {layout124 as L} from './layout124.js';
import {noise,rng} from './kernel.js';
import {bridgeBearingTerrain360} from './structure360.js';
import {routeClearance208,routeHeight208,routeDistance298} from './bridge-court208.js';
const TAU=Math.PI*2;
export const shoreZone298=(x,z)=>x>-9.6&&x<8.4&&z>-4.8&&z<3.3;
export const shoreEdge298=x=>-.70+.34*Math.sin(x*.72)+.18*Math.sin(x*2.1)-1.08*Math.exp(-(((x+4.35)/1.45)**2))+.11*(noise(x*1.9,.31,298)-.5);
export function shoreHeight298(x,z,original,raised){
 if(!shoreZone298(x,z))return raised;
 // Keep the surveyed/authored cascade run and route-bearing cores. The
 // bank between them is now a terraced water edge with a bridge inlet.
 if(Math.abs(x-L.waterfall.x)<.71&&z>L.waterfall.z[0]-.30&&z<L.waterfall.z[1]+.83)return raised;
 const routeDistance=routeDistance298(x,z);
 const d=shoreEdge298(x)-z,step=(a,b)=>T.MathUtils.smoothstep(d,a,b);
 const bed=-.19+.035*noise(x*3.1,z*3.6,2981);
 const terraces=bed+.29*step(-.20,.06)+.25*step(.25,.56)+.30*step(.90,1.25)+.30*step(1.65,2.04)+.42*step(2.35,3.10);
 const granular=(noise(x*4.4,z*3.8,2982)-.5)*.075+(noise(x*12.1,z*11.7,2983)-.5)*.024;
 const transition=T.MathUtils.smoothstep(z,-4.8,-4.1)*(1-T.MathUtils.smoothstep(z,2.5,3.3))*(1-T.MathUtils.smoothstep(Math.abs(x+.6),7.7,9.0));
 let natural=terraces+granular;
 for(const [cx,cz,rx,rz,h]of[[5.65,-.65,2.25,1.80,1.04],[-6.6,.45,1.55,1.6,.62],[.35,-2.40,1.30,1.15,1.16]]){
  const r=Math.hypot((x-cx)/rx,(z-cz)/rz)*(1+.11*(noise(x*2.1,z*2.7,2989)-.5));
  const shelf=bed+(h-bed)*(.40*(1-T.MathUtils.smoothstep(r,.70,1.0))+.34*(1-T.MathUtils.smoothstep(r,.38,.67))+.26*(1-T.MathUtils.smoothstep(r,.10,.34)));
  natural=Math.max(natural,shelf+granular);
 }
 // A continuous receiving shoulder carries the actual court retaining
 // edge; no abrupt route-core-to-river cliff is cut into the soil mesh.
 const shoulder=1-T.MathUtils.smoothstep(routeDistance,.10,1.15);natural=T.MathUtils.lerp(natural,Math.max(natural,raised),shoulder);
 return bridgeBearingTerrain360(x,z,T.MathUtils.lerp(raised,natural,transition));
}
const fieldGLSL=`float sh(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}float sn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(sh(i),sh(i+vec3(1,0,0)),f.x),mix(sh(i+vec3(0,1,0)),sh(i+vec3(1,1,0)),f.x),f.y),mix(mix(sh(i+vec3(0,0,1)),sh(i+vec3(1,0,1)),f.x),mix(sh(i+vec3(0,1,1)),sh(i+vec3(1,1,1)),f.x),f.y),f.z);}`;
export function installShoreMaterials298(m){
 // Moist mineral soil: the old dark color multiplied by a dark map yielded
 // <1-percent reflectance. Retain the physical map but restore earth albedo.
 const soil=m.earth;soil.name='shore298-mineral-soil-fine-gravel-and-root-mat';soil.color.setHex(0x665d46);soil.roughness=.98;soil.bumpScale=.018;
 soil.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vShoreWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvShoreWorld=worldPosition.xyz;');
  shader.fragmentShader='varying vec3 vShoreWorld;\n'+fieldGLSL+'\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float clast=sn(vShoreWorld*vec3(32.,43.,31.));float grit=sn(vShoreWorld*141.);float roots=sn(vShoreWorld*vec3(7.,23.,7.));
   diffuseColor.rgb*=.66+.42*grit;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.095,.090,.074),smoothstep(.70,.86,clast)*.40);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.028,.023,.014),smoothstep(.72,.88,roots)*.45);
   float wet=1.-smoothstep(.11,.31,vShoreWorld.y);diffuseColor.rgb*=1.-wet*.32;`);
 };
 soil.customProgramCacheKey=()=> 'shore298-world-mineral-soil-v1';
 const rock=m.rock.clone();rock.name='shore298-fractured-pier-bearing-granite';rock.color.setHex(0x8b8b80);rock.roughness=.87;rock.bumpScale=.012;rock.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vBearingWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvBearingWorld=worldPosition.xyz;');shader.fragmentShader='varying vec3 vBearingWorld;\n'+fieldGLSL+'\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat mineral=sn(vBearingWorld*32.);diffuseColor.rgb*=.78+.27*mineral;');
 };rock.customProgramCacheKey=()=> 'shore298-footing-granite-v1';m.shore298Rock=rock;
 const sedge=m.leafDark.clone();sedge.name='shore298-creased-reed-and-sedge-blades';sedge.color.setHex(0x4b5529);sedge.roughness=.9;sedge.side=T.DoubleSide;m.shore298Sedge=sedge;
 const dead=m.bark.clone();dead.name='shore298-dry-root-and-dead-sedge';dead.color.setHex(0x76613d);m.shore298Dead=dead;
}
function blade298(length,width,bend,seed){
 const p=[],uv=[],ix=[],N=9;
 for(let j=0;j<=N;j++){const t=j/N,w=width*Math.sin(Math.PI*(.08+.92*t))*(1-.72*t),z=bend*t*t,y=length*(t-.16*t*t);
  for(const side of[-1,0,1]){p.push(side*w,y+(side===0?.010:0)*Math.sin(t*Math.PI),z+Math.abs(side)*.010*Math.sin(t*Math.PI));uv.push((side+1)/2,t);}
  if(j<N)for(let k=0;k<2;k++){const a=j*3+k;ix.push(a,a+3,a+1,a+1,a+3,a+4);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.name='shore298-continuous-creased-sedge-blade';return g;
}
function bevelBlock298(w,h,d){const s=new T.Shape(),b=.025;s.moveTo(-w/2+b,-h/2);s.lineTo(w/2-b,-h/2);s.lineTo(w/2,-h/2+b);s.lineTo(w/2,h/2-b);s.lineTo(w/2-b,h/2);s.lineTo(-w/2+b,h/2);s.lineTo(-w/2,h/2-b);s.lineTo(-w/2,-h/2+b);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:d-.018,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:2,steps:1});g.translate(0,0,-d/2+.009);g.name='shore298-closed-cut-granite-pier-bearing-stone';return g;}
export function buildRockBank298(B,{site}){
 const random=rng(298810),rr=(a,b)=>a+(b-a)*random(),stones=[],plants=[],foundations=[];
 const variants=B.scannedStones.variants;
 function stone(x,z,sx,sy,sz,yaw,top,variant=0){
  const scan=variants[(variant+variants.length)%variants.length],rot=new T.Quaternion().setFromEuler(new T.Euler(rr(-.07,.07),yaw,rr(-.09,.09))),matrix=new T.Matrix4().compose(new T.Vector3(x,0,z),rot,new T.Vector3(sx,sy,sz));scan.geometry.computeBoundingBox();const bounds=scan.geometry.boundingBox.clone().applyMatrix4(matrix),limit=routeHeight208(x,z,Math.max(sx,sz)*.48),cap=Math.min(top,limit-.10),y=cap-bounds.max.y;
  B.emit(scan.geometry,cap<.55?scan.wet:scan.dry,x,y,z,sx,sy,sz,[new T.Euler().setFromQuaternion(rot).x,yaw,new T.Euler().setFromQuaternion(rot).z],rr(.94,1.10));
  if(scan.mossGeometry&&cap>.30&&random()<.42)B.emit(scan.mossGeometry,'moss',x,y,z,sx,sy,sz,[new T.Euler().setFromQuaternion(rot).x,yaw,new T.Euler().setFromQuaternion(rot).z]);
  stones.push({x,z,top:cap,bottom:y+bounds.min.y,width:sx*2});
 }
 B.label('shore298-interlocked-waterline-toe-and-layered-rock-banks',()=>{
  const centers=[-8.65,-7.36,-6.18,-5.05,-3.91,-2.68,-1.41,-.18,3.32,4.56,5.95,7.27];
  for(let i=0;i<centers.length;i++){
   const x=centers[i],edge=shoreEdge298(x),yaw=-.26+rr(-.23,.23);
   // Each geological group has a water-buried toe, a readable dry face and
   // an inset upper ledge. Open gaps between groups stay as actual water.
   stone(x,edge+.18,rr(.58,.88),rr(.42,.62),rr(.38,.58),yaw,rr(.23,.39),i);
   stone(x+rr(-.25,.22),edge-.35,rr(.60,.88),rr(.58,.82),rr(.43,.67),yaw+rr(-.18,.18),rr(.55,.79),i+2);
   if(i%3!==1)stone(x+rr(-.28,.31),edge-.95,rr(.56,.82),rr(.53,.76),rr(.40,.63),yaw,rr(.82,1.10),i+4);
   if(i%3===0)stone(x+rr(.50,.72),edge+.32,rr(.23,.39),rr(.22,.37),rr(.26,.43),yaw+.4,rr(.13,.22),i+1);
  }
  // Exposed faces in the former black bank behind the bridge continue
  // inland in short overlapping strata instead of a smooth earthen wall.
  for(const [i,x,z,top,sx,sy,sz]of[[0,-5.10,-2.45,.94,.82,.65,.59],[1,-4.04,-2.85,1.11,.87,.64,.67],[2,-3.00,-3.07,1.16,.79,.70,.67],[3,-2.03,-2.62,.96,.68,.60,.59],[4,-.83,-2.48,1.18,.78,.72,.63],[5,.29,-2.73,1.43,.78,.74,.62],[6,1.02,-3.13,1.60,.66,.77,.64],[7,3.11,-3.35,1.76,.66,.78,.65]])stone(x,z,sx,sy,sz,-.26+rr(-.12,.12),Math.max(top,site(x,z).height+.26),i);
  // Three rising, interlocked courses receive the stair forecourt face.
  // They cover the former blank retaining wall while remaining below the
  // authored walking surface and joining the lower drowned toe stones.
  for(const [i,x,z]of[[0,2.93,-2.70],[1,3.62,-2.58],[2,4.35,-2.45],[3,5.12,-2.31],[4,5.78,-2.20],[5,.55,-2.96],[6,-1.38,-2.92]]){
   stone(x,z,.72+rr(-.08,.08),.92+rr(-.08,.12),.58+rr(-.06,.08),-.25+rr(-.15,.15),Math.min(2.02,site(x,z).height+.40),i+1);
   stone(x+rr(-.18,.18),z+.49,.76+rr(-.10,.12),.70+rr(-.06,.10),.54+rr(-.05,.10),-.2,Math.min(1.34,site(x,z+.49).height+.34),i+3);
   if(i<5)stone(x+.15,z+.93,.63,.58,.48,-.19,Math.min(.74,site(x,z+.93).height+.28),i+5);
  }
 });
 B.label('shore298-sparse-rooted-sedge-crevice-plants-and-dry-root-runs',()=>{
  const geometries=Array.from({length:8},(_,i)=>blade298(.18+i*.035,.007+(i%3)*.003,.07+i*.017,i));
  for(let k=0;k<48;k++){
   const x=rr(-8.9,7.8),edge=shoreEdge298(x),z=edge-rr(.12,1.22);if(Math.abs(x-2.05)<.85||routeClearance208(x,z,.21)||noise(x*.71,z*.9,2987)<.40)continue;
   const y=site(x,z).height;if(y<.15)continue;const count=5+k%5;
   for(let n=0;n<count;n++){const a=n*2.39996+rr(-.20,.20),r=rr(.009,.048);B.emit(geometries[(k+n)%8],n%7?'shore298Sedge':'shore298Dead',x+Math.sin(a)*r,y-.012,z+Math.cos(a)*r,1,rr(.68,1.13),1,[rr(-.12,.12),a,rr(-.15,.15)],rr(.81,1.12));}
   plants.push({x,y,z,blades:count});
   if(k%4===0)for(let r=0;r<3;r++){const a=r*1.4+k;B.between([x,y+.008,z],[x+Math.cos(a)*.22,y-.035,z+Math.sin(a)*.21],.009,.008,'shore298Dead',true);}
  }
 });
 // Existing bridge piers start at world Y-.01. These genuinely buried,
 // stepped cut-stone shoes extend them into the newly lowered inlet bed.
 B.label('shore298-central-bridge-pier-shoes-buried-in-the-actual-inlet-bed',()=>{
  const G=L.bridge,matrix=new T.Matrix4().compose(new T.Vector3(...G.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),G.yaw),new T.Vector3(...G.scale));
  for(const side of[-1,1]){
   const c=new T.Vector3(-.50,0,side*.55).applyMatrix4(matrix),ground=site(c.x,c.z).height,bottom=Math.min(ground-.12,-.18),top=.12;
   B.with(c.x,(bottom+top)/2,c.z,G.yaw,()=>B.emit(bevelBlock298(.80,top-bottom,.75),'shore298Rock'));
   B.with(c.x,.105,c.z,G.yaw,()=>B.emit(bevelBlock298(.66,.09,.63),'shore298Rock'));
   foundations.push({center:[c.x,c.z],terrainY:ground,bottomY:bottom,oldPierBottomY:-.01,shoeTopY:.15,burial:ground-bottom,oldPierOverlap:.16});
  }
 });
 B.layout124??={};B.layout124.shore298={revision:'shore298-r15-terraced-water-edge-and-buried-pier-shoes',stones:stones.length,rootedCrevicePlants:plants.length,sedgesAreNewCreasedBlades:true,referencePixelsUsed:false,bridgePierFoundations:foundations,blackBankDiagnosticWorldPoints:[[-4.1238,1.0711,-3.2127],[.9662,1.5793,.3587]],waterLevel:.13,terrain:'Closed terraced bank and local bridge inlet, with inset soil shoulders and water-buried interlocked stone toes',photographicAccepted:false};
}
