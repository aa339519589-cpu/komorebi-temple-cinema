import * as T from 'three';
import {isGardenRoute} from './garden-terrain.js';

// Deliberate planted shoulders connect the hall's low retaining course, the
// bridge banks and the pond. Sprigs and supporting twigs are actual geometry.
export function buildGardenAccents({emit,rod,mats,scannedStones,shoots,height}){
 let seed=713031;const R=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296),rr=(a,b)=>a+(b-a)*R(),TAU=Math.PI*2;
 const colonies=[
  [-6.5,-5.5,1.5,1.1,.90],[-5.0,-3.5,1.4,1.0,.70],[-9.2,-3.3,1.8,1.2,1.10],[-12,-4.4,1.9,1.5,1.30],
  [-13.8,-.5,1.7,1.5,.85],[-9.9,.8,1.4,1.1,.80],[-8.8,2.7,1.3,1.2,.65],[-12.2,4.4,1.9,1.4,.90],
  [8.9,-3.0,1.7,1.2,.80],[10.8,-1.4,1.5,1.5,1.10],[12.8,.2,1.7,1.6,1.20],[8.9,.6,1.0,1.3,.70],
  [12.2,3.1,1.6,1.5,.85],[14.7,4.3,1.9,1.4,1.10],[10.2,7.0,1.1,1.3,.70],[14.9,8.2,1.7,1.6,.80],
  [-7.4,6.2,1.5,1.2,.75],[-8.4,8.2,1.4,1.0,.65],[-12.7,9.7,1.8,1.4,.75],[15.5,12.4,2.0,1.7,.95],
  [18.2,-4.4,2.0,1.4,1.15],[-18,-1.7,1.8,1.8,.95],[-16.6,5.2,1.8,1.6,1.1]
 ];
 let leafShoots=0,supportTwigs=0,rockCount=0;
 const embeddedStone=(v,x,z,s,shade=.9)=>{
  const step=.12,y=height(x,z),n=new T.Vector3(-(height(x+step,z)-height(x-step,z))/(2*step),1,-(height(x,z+step)-height(x,z-step))/(2*step)).normalize(),
   q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),n).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),rr(0,TAU))),e=new T.Euler().setFromQuaternion(q),p=new T.Vector3(x,y,z).addScaledVector(n,-.30-s*.12);
  emit(v.geometry,y<.65?v.wet:v.dry,p.x,p.y,p.z,s,s,s,[e.x,e.y,e.z],shade);rockCount++;
 };
 for(let k=0;k<colonies.length;k++){
  const [cx,cz,rx,rz,h]=colonies[k],ground=height(cx,cz),count=Math.ceil(rx*rz*75);
  for(let j=0;j<count;j++){
   const a=rr(0,TAU),r=Math.sqrt(R()),x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r;
   if(isGardenRoute(x,z,.32))continue;
   const
    soil=height(x,z),y=Math.max(soil+.018,ground+h*Math.pow(1-r*r,.7)*rr(.45,.90)),scale=rr(.75,1.15);
   emit(shoots[(j+k)%3],j%5?mats.gardenShrub:mats.gardenShrubLit,x,y,z,scale,rr(.65,1.2),scale,[rr(-.16,.16),rr(0,TAU),rr(-.12,.12)],rr(.74,1.13));leafShoots++;
   if(y>soil+.12&&j%3===0){rod([cx,ground+.05,cz],[x,y+.12,z],.014,'trunk',.004);supportTwigs++;}
  }
  // Irregular embedded shoulders are set into the same terrain, with the
  // lower third buried. They break the bank outline without stone towers.
  for(let j=0;j<4;j++){
   const a=rr(0,TAU),r=rr(.60,.96),x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r,v=scannedStones.variants[(k+j*3)%6],s=rr(.40,.80);
   if(isGardenRoute(x,z,.60))continue;
   embeddedStone(v,x,z,s,rr(.75,1.03));
  }
 }
 // Plant and stone the actual sloping faces below the descending path.
 // The upper coping remains visible; the earth below is an irregular,
 // rooted rock garden instead of a clean vertical stair block.
 const bankSegments=[[[4.4,2.0],[11.5,5.35]],[[11.5,5.35],[17.2,7.0]]];
 for(let segment=0;segment<bankSegments.length;segment++){
  const [a,b]=bankSegments[segment],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
  for(let j=0;j<26;j++)for(const side of[-1,1])for(let row=0;row<3;row++){
   const t=(j+.35+rr(-.18,.18))/26,off=side*(1.56+row*.57+rr(-.12,.12)),x=a[0]+dx*t+nx*off,z=a[1]+dz*t+nz*off,y=height(x,z),v=scannedStones.variants[(j+row*3+segment)%6],scale=rr(.44,.77);
   if(isGardenRoute(x,z,.22))continue;
   embeddedStone(v,x,z,scale,rr(.80,1.08));
   for(let k=0;k<7;k++){
    const xx=x+rr(-.35,.35),zz=z+rr(-.35,.35),yy=height(xx,zz)+rr(.035,.11),s=rr(.65,1.10);
    if(isGardenRoute(xx,zz,.22))continue;
    emit(shoots[(j+k)%3],k%4?mats.gardenShrub:mats.gardenShrubLit,xx,yy,zz,s,rr(.60,1.15),s,[0,rr(0,TAU),0],rr(.70,1.12));leafShoots++;
   }
  }
 }
 // Layered geology and rooted fine planting on the shelf's receding front
 // face. Every stone follows the actual terrain normal and is partly buried.
 for(let j=0;j<40;j++)for(let row=0;row<4;row++){
  const x=-.75+j*.255+rr(-.09,.09),z=1.7+.27*Math.max(0,x-3)+row*.49-.62+rr(-.12,.12);
  if(isGardenRoute(x,z,.30)&&height(x,z)>3.90)continue;
  const v=scannedStones.variants[(j+row*3)%6],s=rr(.42,.69);embeddedStone(v,x,z,s,rr(.78,1.06));
  for(let k=0;k<9;k++){const xx=x+rr(-.28,.28),zz=z+rr(-.27,.27),yy=height(xx,zz)+.015,ss=rr(.70,1.12);if(isGardenRoute(xx,zz,.28)&&yy>3.90)continue;emit(shoots[(j+k)%3],k%4?mats.gardenShrub:mats.gardenShrubLit,xx,yy,zz,ss,rr(.62,1.0),ss,[0,rr(0,TAU),0],rr(.78,1.14));leafShoots++;}
 }
 // A low rocky weir feeds the genuine open water channel below the arch.
 // Water is a set of narrow curved sheets, never a scene/backdrop plane.
 const water=new T.MeshPhysicalMaterial({name:'scene07-falling-stream-water',color:0x9fbfb4,roughness:.12,metalness:.10,transparent:true,opacity:.34,side:T.DoubleSide,depthWrite:false,clearcoat:.50,clearcoatRoughness:.1});
 const foam=new T.MeshStandardMaterial({name:'scene07-weir-aerated-foam',color:0xe3e7d4,roughness:.64,transparent:true,opacity:.72,depthWrite:false});
 for(let j=0;j<6;j++){
  const v=scannedStones.variants[(j+2)%6],x=-4.55+j*.60;
  emit(v.geometry,v.wet,x,.56,-1.60,rr(.48,.66),rr(.84,1.10),rr(.50,.70),[0,rr(-.25,.25),rr(-.09,.09)],.87);
 }
 for(let k=0;k<15;k++){
  const x=-4.22+k*.16+rr(-.03,.03),w=rr(.018,.052),top=.95+rr(-.10,.16),p=[],ix=[];
  for(let j=0;j<=18;j++){
   const t=j/18,y=top*(1-t)+.055,z=-1.32+.28*t+.23*t*t,
    xx=x+.012*Math.sin(t*18+k)+.025*t*t;
   p.push(xx-w*(1+.10*Math.sin(t*19)),y,z,xx+w*(1+.13*Math.cos(t*21)),y+.008*Math.sin(t*16),z+.012);
   if(j<18){const a=j*2;ix.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();emit(g,water,0,0,0);
 }
 const bubble=new T.SphereGeometry(1,6,4);
 for(let j=0;j<85;j++){const x=rr(-4.8,-1.1),z=rr(-1.08,-.30),s=rr(.015,.052);emit(bubble,foam,x,.07+rr(0,.025),z,s,rr(.006,.022),s,[0,rr(0,TAU),0],rr(.75,1.15));}
 return {info:{revision:'garden130',colonies:colonies.length,leafShoots,supportTwigs,embeddedRocks:rockCount,weirSheets:15,construction:'Closed terrain, measured-source stone scans, separate folded leaves and supporting branch geometry; no opaque foliage pads or image replacement',visualAccepted:false},dispose(){water.dispose();foam.dispose();}};
}
