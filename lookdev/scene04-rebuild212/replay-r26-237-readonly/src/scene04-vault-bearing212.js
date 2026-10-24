import * as T from 'three';
import {createPrecisionTimberFactory04,setTimberEndGrainAttributes212} from './scene04-timber-precision134.js';

// Two depth-separated receiving frames carry the boarded compound canopy.
// Curved knees spring inward/upward from the main bearing, with visible
// pockets between the members. Dimensions remain a single-view hypothesis.
export function buildVaultBearing212({profile,C,wood,darkwood,upperBeamY=C.capitalTop+.43,upperBeamHeight=.45}){
 const group=new T.Group();group.name='scene04-212-consolidated-vault-bearing';const timber=createPrecisionTimberFactory04();
 const mesh=(g,m,name)=>{const o=new T.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;group.add(o);return o;};
 const box=(x,y,z,w,h,d,m=wood)=>{const g=timber.box(w,h,d).clone();g.translate(x,y,z);return mesh(g,m,'scene04-212-vault-receiver');};
 function extrude(shape,depth,z,name,{follow=false,vertical=false}={}){
  const g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.009,bevelSegments:4,curveSegments:30});g.translate(0,0,z-depth/2);const p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++){if(follow)p.setY(i,p.getY(i)+profile.canopy(p.getX(i),p.getZ(i))-profile.canopy(p.getX(i),z));uv.setXY(i,(vertical?p.getY(i):p.getX(i))/1.45,(vertical?p.getX(i):p.getY(i))/.38);}g.computeVertexNormals();setTimberEndGrainAttributes212(g,vertical?1:0);return mesh(g,wood,name);
 }
 function receivingArm(x,y,z,w,h,d,yaw=0){
  const s=new T.Shape();s.moveTo(-w/2,h*.43);s.lineTo(w/2,h*.43);s.quadraticCurveTo(w*.54,-h*.05,w*.38,-h*.26);s.quadraticCurveTo(w*.24,-h*.12,w*.13,-h*.48);s.lineTo(-w*.13,-h*.48);s.quadraticCurveTo(-w*.24,-h*.12,-w*.38,-h*.26);s.quadraticCurveTo(-w*.54,-h*.05,-w/2,h*.43);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:d,steps:1,bevelEnabled:true,bevelSize:.011,bevelThickness:.008,bevelSegments:4,curveSegments:22});g.translate(0,0,-d/2);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/1.45,p.getY(i)/.38);g.rotateY(yaw);g.translate(x,y,z);return mesh(g,wood,'scene04-212-interlocked-curved-receiving-arm');
 }
 const ribs=[{z:.52,half:3.03,h:.22,d:.30},{z:-.64,half:2.96,h:.17,d:.24},{z:-1.78,half:2.84,h:.14,d:.21}];
 for(const [i,r]of ribs.entries()){
  const shape=new T.Shape(),N=100,top=x=>profile.canopy(x,r.z)-.818;
  for(let j=0;j<=N;j++){const x=-r.half+2*r.half*j/N;j?shape.lineTo(x,top(x)):shape.moveTo(x,top(x));}
  for(let j=N;j>=0;j--){const x=-r.half+2*r.half*j/N;shape.lineTo(x,top(x)-r.h);}shape.closePath();extrude(shape,r.d,r.z,'scene04-212-separated-receiving-arch-'+i,{follow:true});
 }
 const beamTop=upperBeamY+upperBeamHeight*.48+.024,z=.40,frontXs=[-2.55,-1.40,1.40,2.55];
 for(const x of frontXs){
  const top=profile.canopy(x,z)-.85,h=top-beamTop;if(h<=.04)continue;
  const w=.27,s=new T.Shape();s.moveTo(x-w*.72,beamTop);s.quadraticCurveTo(x-w*.72,beamTop+.13,x-w*.40,beamTop+h*.34);s.quadraticCurveTo(x-w*.31,top-.11,x-w*.61,top);s.lineTo(x+w*.61,top);s.quadraticCurveTo(x+w*.31,top-.11,x+w*.40,beamTop+h*.34);s.quadraticCurveTo(x+w*.72,beamTop+.13,x+w*.72,beamTop);s.closePath();extrude(s,.33,z,'scene04-212-curved-waisted-front-bearing',{vertical:true});
  for(let k=0;k<2;k++)receivingArm(x,beamTop+.07+k*.125,z+(k%2?.075:0),.50+k*.24,.14,.39);
  receivingArm(x,beamTop+.13,z,.74,.14,.23,Math.PI/2);
  box(x,top-.045,z,.43,.11,.40);
 }
 // Back frame and fore-aft ties visibly overlap the same bearing storey.
 box(0,beamTop+.10,-.70,5.56,.18,.34);
 for(const x of[-2.25,-.77,.77,2.25]){
  const bottom=beamTop+.19,top=profile.canopy(x,-.70)-.87;
  if(top>bottom)box(x,(top+bottom)/2,-.70,.23,top-bottom+.025,.30);
  for(let k=0;k<2;k++)receivingArm(x,bottom+.055+k*.13,-.70,.50+k*.23,.14,.35);
 }
 for(const x of frontXs)box(x,beamTop+.09,-.17,.20,.18,1.30);
 // Real inward-rising knees support the arch instead of a flat triangular grid.
 for(const side of[-1,1]){
  const xa=side*2.58,xb=side*1.18,y0=beamTop+.035,y1=profile.canopy(xb,.20)-1.00,s=new T.Shape();
  s.moveTo(xa,y0);s.bezierCurveTo(side*2.17,y0+.045,side*1.61,y1-.14,xb,y1);s.lineTo(xb-side*.14,y1+.16);s.bezierCurveTo(side*1.57,y1+.17,side*2.18,y0+.30,xa+side*.09,y0+.22);s.closePath();extrude(s,.32,.20,'scene04-212-inward-rising-main-load-knee-'+side);
 }
 const crown=profile.canopy(0,-.45)-.84;box(0,(beamTop+crown)/2,-.45,.20,crown-beamTop+.035,.27,darkwood);
 group.userData.vault212={revision:'r26-curved-two-depth-bearing-system',receivingRibs:3,frontWaistedReceivers:4,rearStrutsOnHeader:4,foreAftBearingTies:4,kingPost:1,inwardRisingMainKnees:2,beamTop,nominalLayoutRetained:true,visualAccepted:false};return{group,stats:group.userData.vault212};
}
