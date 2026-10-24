import * as T from 'three';
import {isGardenRoute,gardenWalkHeight214} from './garden-terrain.js';
import {garden130BridgeKnots,approach214} from './layout118-data.js';
import {sitePoint214,MIDGROUND_SITE214,BANK_RETURN214} from './site-transform214.js';
import {installLeafScattering214} from './world-radiance214.js';

// Authored azalea / low evergreen structure. Every visible leaf and corolla
// is a folded surface carried by a branching woody plant. No canopy hull,
// alpha card, scene texture, photographic sample or camera input is used.
const TAU=Math.PI*2,UP=new T.Vector3(0,1,0),V=p=>new T.Vector3(...p);
const random=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
function plantForm(seed){
 const R=random(seed),rr=(a,b)=>a+(b-a)*R(),wood=[],leaves=[],flowers=[],leafColors=[],flowerColors=[];
 const tri=(out,a,b,c,colors=null,color=null)=>{out.push(...a.toArray(),...b.toArray(),...c.toArray());if(colors)for(let k=0;k<3;k++)colors.push(...color);};
 function branch(a,b,r){
  const n=b.clone().sub(a).normalize(),u=new T.Vector3(1,0,0).cross(n).normalize(),v=n.clone().cross(u);
  for(let k=0;k<5;k++){
   const q=k*TAU/5,qq=(k+1)*TAU/5,p=a.clone().addScaledVector(u,Math.cos(q)*r).addScaledVector(v,Math.sin(q)*r),p1=a.clone().addScaledVector(u,Math.cos(qq)*r).addScaledVector(v,Math.sin(qq)*r),
    t=b.clone().addScaledVector(u,Math.cos(q)*r*.25).addScaledVector(v,Math.sin(q)*r*.25),t1=b.clone().addScaledVector(u,Math.cos(qq)*r*.25).addScaledVector(v,Math.sin(qq)*r*.25);
   tri(wood,p,p1,t);tri(wood,p1,t1,t);
  }
 }
 function leaf(base,direction,len,tint){
  const n=direction.clone().normalize(),side=new T.Vector3(-n.z,0,n.x).normalize(),tip=base.clone().addScaledVector(n,len),centre=base.clone().lerp(tip,.48).addScaledVector(UP,len*.13),
   left=base.clone().lerp(tip,.48).addScaledVector(side,len*.23),right=base.clone().lerp(tip,.48).addScaledVector(side,-len*.23),c=[tint*.85,tint,tint*.66];
  tri(leaves,base,left,centre,leafColors,c);tri(leaves,left,tip,centre,leafColors,c);tri(leaves,centre,tip,right,leafColors,c);tri(leaves,base,centre,right,leafColors,c);
 }
 function blossom(p,normal,size){
  const n=normal.clone().normalize(),u=new T.Vector3(1,0,0).cross(n);if(u.lengthSq()<.01)u.set(0,0,1).cross(n);u.normalize();const v=n.clone().cross(u),tint=rr(.80,1.06);
  for(let j=0;j<5;j++){
   const a=j*TAU/5+seed*.013,rad=u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v,Math.sin(a)),side=n.clone().cross(rad),base=p.clone().addScaledVector(n,-size*.12),
    middle=p.clone().addScaledVector(rad,size*.49).addScaledVector(n,size*.19),tip=p.clone().addScaledVector(rad,size).addScaledVector(n,size*.07),
    left=middle.clone().addScaledVector(side,size*.36),right=middle.clone().addScaledVector(side,-size*.36),c=[tint,tint*.96,tint*.91];
   tri(flowers,base,left,middle,flowerColors,c);tri(flowers,left,tip,middle,flowerColors,c);tri(flowers,middle,tip,right,flowerColors,c);tri(flowers,base,middle,right,flowerColors,c);
  }
 }
 // Unequal lifted lobes produce the interleaving canopy of a clipped azalea.
 // Separate lateral shoots keep visible openings between adjacent plants.
 for(let cane=0;cane<18;cane++){
  const a=cane*2.399963+rr(-.18,.18),reach=rr(.26,.63),h=rr(.24,.56),root=V([rr(-.07,.07),.015,rr(-.07,.07)]),joint=V([Math.cos(a)*reach*.42,h*.62,Math.sin(a)*reach*.42]),tip=V([Math.cos(a)*reach,h,Math.sin(a)*reach]);
  branch(root,joint,.014);branch(joint,tip,.009);
  for(let station=0;station<4;station++){
   const t=.28+station*.21,b=joint.clone().lerp(tip,t),aa=a+(station%2?1:-1)*rr(.60,1.17),len=rr(.13,.28),end=b.clone().add(V([Math.cos(aa)*len,rr(.045,.14),Math.sin(aa)*len]));
   branch(b,end,.0039);
   for(let k=0;k<6;k++)for(const side of[-1,1]){
    const tt=(k+.35)/6,p=b.clone().lerp(end,tt),la=aa+side*rr(.68,1.12),d=V([Math.cos(la),rr(.10,.55),Math.sin(la)]);
    leaf(p,d,rr(.065,.108),rr(.67,1.12));
   }
   if((station+cane)%3!==0)for(let f=0;f<3;f++){
    const p=end.clone().add(V([rr(-.048,.048),rr(-.018,.035),rr(-.048,.048)])),n=V([Math.cos(aa)*rr(.25,.9),rr(.35,1.0),Math.sin(aa)*rr(.25,.9)]);
    blossom(p,n,rr(.042,.063));
   }
  }
 }
 const geometry=(p,c)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));if(c)g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();g.computeBoundingBox();return g;};
 return{wood:geometry(wood),leaves:geometry(leaves,leafColors),flowers:geometry(flowers,flowerColors)};
}

export function buildLayeredGarden214({emit,mats,scannedStones,height}){
 const forms=[214071,214109,214163].map(plantForm),leaf=new T.MeshStandardMaterial({name:'scene07-rooted-azalea-folded-leaves214',color:0x65783b,roughness:.94,side:T.DoubleSide,vertexColors:true}),
  pink=new T.MeshStandardMaterial({name:'scene07-rooted-azalea-coral-pink-corollas214',color:0xf1b4b1,roughness:.91,side:T.DoubleSide,vertexColors:true}),
  white=pink.clone();white.name='scene07-rooted-azalea-ivory-corollas214';white.color.setHex(0xf5e9cc);
 installLeafScattering214(leaf,{strength:.30,power:1.4});installLeafScattering214(pink,{strength:.15,power:1.1});installLeafScattering214(white,{strength:.15,power:1.1});
 let plants=0,floweringPlants=0,rocks=0,retainingBankPlants=0;const R=random(214218),rr=(a,b)=>a+(b-a)*R();
 const plant=(x,y,z,scale,index,flowering=true)=>{
  if(isGardenRoute(x,z,.24)){
   const walk=gardenWalkHeight214(x,z,scale*.60+.18);if(!Number.isFinite(walk)||y+scale*.84>walk-.15)return;
  }
  const f=forms[index%forms.length],yaw=rr(0,TAU),sx=scale*rr(.86,1.14),sy=scale*rr(.74,1.07),sz=scale*rr(.82,1.15),rot=[rr(-.05,.05),yaw,rr(-.04,.04)];
  emit(f.wood,mats.trunk,x,y,z,sx,sy,sz,rot,.92);emit(f.leaves,leaf,x,y,z,sx,sy,sz,rot,rr(.88,1.12));if(flowering){emit(f.flowers,index%4?pink:white,x,y,z,sx,sy,sz,rot,rr(.94,1.06));floweringPlants++;}plants++;
 };
 // The lantern island has a low crown and two broken rings of flowers.
 // Roots use the same continuous island soil surface as the lantern footing,
 // ferns and scanned periwinkles, including exposed embedded stone at its toe.
 for(let k=0;k<25;k++){
  const a=k*2.399963,r=rr(.65,.98),x=4.876+Math.cos(a)*2.08*r,z=5.52+Math.sin(a)*1.40*r,y=height(x,z)-.025;
  plant(x,y,z,rr(.52,.92),k);
 }
 // Unequal groups step down the east shore. Open intervals expose wet rocks
 // and real reflected water; only actual dry soil receives rooted shrubs.
 const clusters=[[10.30,-2.8,.95],[10.95,-.55,1.0],[11.05,1.45,.90],[11.60,5.25,1.04],[11.30,7.65,1.05],[12.70,9.30,1.15],[-7.65,2.75,.85],[-9.4,4.4,.95],[-8.3,6.6,.88],[-5.9,-1.7,.78]];
 for(let k=0;k<clusters.length;k++){
  const [ox,oz,os]=clusters[k],p=oz<4?sitePoint214([ox,0,oz]):[ox,0,oz],cx=p[0],cz=p[2],size=os*(oz<4?1.4:1);
  for(let j=0;j<5;j++){
   const a=j*2.4+rr(-.3,.3),r=rr(.14,.74)*size,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,y=height(x,z);
   if(y<.08||y>4.8)continue;plant(x,y-.025,z,rr(.66,1.18)*size,k*5+j+26);
  }
 }
 // Woody evergreen crowns root in three unequal rock crevice tiers along
 // the real causeway. Their leaves bridge small joints while exposed stone
 // faces and water remain visible. Flowers occur in selected colonies.
 for(const [segment,pair]of[[garden130BridgeKnots.at(-1),approach214.rightEnd],[approach214.rightEnd,approach214.gardenTurn]].entries()){
  const [aa,bb]=pair,a=V(sitePoint214(aa)),b=V(sitePoint214(bb)),d=b.clone().sub(a);d.y=0;d.normalize();const n=V([-d.z,0,d.x]);
  for(let row=0;row<3;row++)for(let j=0;j<12;j++){
   const t=.035+(j+.35)/12*.91,p=a.clone().lerp(b,t).addScaledVector(n,(1.73+row*.34+rr(-.08,.08))*MIDGROUND_SITE214.scale),y=height(p.x,p.z);if(y<.05)continue;
   let s=rr(1.10,1.55),walk=gardenWalkHeight214(p.x,p.z,s*.65+.2);if(Number.isFinite(walk))s=Math.min(s,(walk-y-.18)/.90);if(s<.38)continue;
   const prior=plants;plant(p.x,y-.025,p.z,s,segment*43+row*12+j+89,j%5===0);retainingBankPlants+=plants-prior;
  }
 }
 // Rooted broad shrub groups on the new low mainland shoulders, with open
 // stone / water intervals. Crown radius stays clear of the actual pavers.
 for(let segment=0;segment<BANK_RETURN214.length-1;segment++){
  const a=V(BANK_RETURN214[segment]),b=V(BANK_RETURN214[segment+1]),d=b.clone().sub(a);d.y=0;const len=d.length();d.normalize();const n=V([-d.z,0,d.x]),count=Math.ceil(len/1.15);
  for(let j=0;j<count;j++)for(const row of[0,1]){
   const t=(j+.30+rr(-.12,.12))/count,p=a.clone().lerp(b,t).addScaledVector(n,2.9+row*.65+rr(-.18,.18)),y=height(p.x,p.z);if(y<.055)continue;
   const prior=plants;plant(p.x,y-.025,p.z,rr(.95,1.48),214+segment*61+j*3+row,j%4===0&&row===0);retainingBankPlants+=plants-prior;
  }
 }
 // Mature woody azaleas grow from the two foundation slopes. Unequal back,
 // middle and toe groups soften the masonry while the stair remains open.
 // This is metre-scale branching plant volume, not a scatter over the wall.
 let hallSlopePlants214=0;
 const hallWorld214=(x,z)=>sitePoint214([4.6+Math.cos(-.25)*x+Math.sin(-.25)*z,0,-9-Math.sin(-.25)*x+Math.cos(-.25)*z]);
 for(const side of[-1,1])for(let tier=0;tier<3;tier++)for(let j=0;j<5;j++){
  const x=side*(3.95+j*.78+rr(-.19,.19)),z=5.45+tier*1.40+rr(-.28,.28),p=hallWorld214(x,z),y=height(p[0],p[2]);
  if(y<.09||isGardenRoute(p[0],p[2],.48))continue;
  const prior=plants,scale=rr(2.0,2.65)*(1-tier*.18);plant(p[0],y-.025,p[2],scale,401+tier*17+j*3+(side+1)*19,(j+tier)%3!==0);hallSlopePlants214+=plants-prior;
 }
 // Larger embedded toe stones define the island / inlet scale, while their
 // original scan proportions and uniformly scaled textures remain intact.
 for(let j=0;j<32;j++){
  const a=j*2.399963,r=rr(.86,1.08),x=4.876+Math.cos(a)*2.08*r,z=5.52+Math.sin(a)*1.40*r,y=.16+1.30*Math.sqrt(Math.max(0,1-r*r)),v=scannedStones.variants[j%6],s=rr(.36,.63);
  emit(v.geometry,y<.55?v.wet:v.dry,x,y-.12,z,s,s,s,[rr(-.12,.12),rr(0,TAU),rr(-.12,.12)],rr(.86,1.10));rocks++;
 }
 // Low companions and embedded toe stones expose the new cherry headland's
 // relationship to pond water. The mature tree is rooted in visible soil.
 let cherryHeadlandPlants214=0;
 for(let j=0;j<18;j++){
  const a=j*2.399963,r=rr(.9,2.65),x=-18+Math.cos(a)*r,z=-14.5+Math.sin(a)*r*.82,y=height(x,z);if(y<.07)continue;
  const before=plants;plant(x,y-.018,z,rr(.9,1.55),613+j,j%3!==0);cherryHeadlandPlants214+=plants-before;
 }
 for(let j=0;j<12;j++){
  const a=j*TAU/12+rr(-.12,.12),r=rr(2.4,3.05),x=-18+Math.cos(a)*r,z=-14.5+Math.sin(a)*r*.83,y=height(x,z);if(y<.015||isGardenRoute(x,z,.45))continue;
  const v=scannedStones.variants[(j*5+2)%6],s=rr(.42,.62);emit(v.geometry,y<.45?v.wet:v.dry,x,y-.25,z,s,s,s,[rr(-.10,.10),rr(0,TAU),rr(-.08,.08)],rr(.88,1.06));rocks++;
 }
 return{info:{revision:'scene07-earth-rooted-cherry-headland-companion-garden214-r17',plants,floweringPlants,retainingBankPlants,hallSlopePlants214,cherryHeadlandPlants214,embeddedIslandStones:rocks,forms:forms.length,photographicPixels:false,canopyHulls:false,cameraFacing:false,floweringGeometry:'Five independently folded petals, attached to woody multi-lobed shrub structure',islandRootSurface:'Same continuous height field as all island plants and the lantern footing',visualAccepted:false},dispose(){for(const f of forms)for(const g of Object.values(f))g.dispose();leaf.dispose();pink.dispose();white.dispose();}};
}
