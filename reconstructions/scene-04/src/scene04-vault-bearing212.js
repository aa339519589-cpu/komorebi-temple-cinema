import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// One visible receiving frame replaces three overlapping inherited arch sets.
// Every rib, strut and brace is a real timber solid; hidden dimensions are an
// authored single-view hypothesis, not recovered measurements or a facade map.
export function buildVaultBearing212({profile,C,wood,darkwood}){
 const group=new T.Group();group.name='scene04-212-consolidated-vault-bearing';
 const mesh=(g,m,name)=>{const o=new T.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;group.add(o);return o;};
 const box=(x,y,z,w,h,d,m=wood)=>{const g=new RoundedBoxGeometry(w,h,d,2,.006);g.translate(x,y,z);return mesh(g,m,'scene04-212-vault-receiver');};
 function extrude(shape,depth,z,name){const g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.009,bevelThickness:.006,bevelSegments:3,curveSegments:24});g.translate(0,0,z-depth/2);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/1.45,p.getY(i)/.38);return mesh(g,wood,name);}
 function receivingArm(x,y,z,w,h,d,yaw=0){
  const s=new T.Shape();s.moveTo(-w/2,h*.43);s.lineTo(w/2,h*.43);s.quadraticCurveTo(w*.54,-h*.05,w*.38,-h*.26);s.quadraticCurveTo(w*.24,-h*.12,w*.13,-h*.48);s.lineTo(-w*.13,-h*.48);s.quadraticCurveTo(-w*.24,-h*.12,-w*.38,-h*.26);s.quadraticCurveTo(-w*.54,-h*.05,-w/2,h*.43);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:d,steps:1,bevelEnabled:true,bevelSize:.010,bevelThickness:.007,bevelSegments:3,curveSegments:18});g.translate(0,0,-d/2);g.rotateY(yaw);g.translate(x,y,z);return mesh(g,wood,'scene04-212-interlocked-curved-receiving-arm');
 }
 const ribs=[{z:.62,half:3.26,h:.15,d:.26},{z:-.65,half:3.16,h:.115,d:.19},{z:-1.88,half:3.05,h:.105,d:.18}];
 for(const [i,r]of ribs.entries()){
  const shape=new T.Shape(),N=96,top=x=>profile.canopy(x,r.z)-.885;
  for(let j=0;j<=N;j++){const x=-r.half+2*r.half*j/N;j?shape.lineTo(x,top(x)):shape.moveTo(x,top(x));}
  for(let j=N;j>=0;j--){const x=-r.half+2*r.half*j/N;shape.lineTo(x,top(x)-r.h);}shape.closePath();extrude(shape,r.d,r.z,'scene04-212-separated-receiving-arch-'+i);
 }
 const beamTop=C.capitalTop+.29+.18,z=.34;
 for(const x of[-2.56,-1.47,1.47,2.56]){
  const top=profile.canopy(x,z)-.90,h=top-beamTop;if(h<=.05)continue;
  box(x,beamTop+h/2,z,.27,h,.32,wood);
  for(let k=0;k<3;k++)receivingArm(x,beamTop+.055+k*.105,z+(k%2?.075:0),.43+.17*k,.13,.35);
  receivingArm(x,beamTop+.16,z,.62,.13,.20,Math.PI/2);
  for(const y of[beamTop+.025,top-.055])box(x,y,z,.40,.10,.39);
 }
 // A second receiving tier sits on a real rear header and retained longitudinal
 // column returns. Its staggered arms expose pockets between front/back frames.
 box(0,beamTop+.10,-.65,5.55,.15,.30,wood);
 for(const x of[-2.12,-.82,.82,2.12]){
  const bottom=beamTop+.175,top=profile.canopy(x,-.65)-.90;
  if(top>bottom)box(x,(top+bottom)/2,-.65,.23,top-bottom+.025,.28,wood);
  for(let k=0;k<2;k++)receivingArm(x,bottom+.04+k*.11,-.65,.48+.21*k,.14,.33);
 }
 // The dark king post sits behind the carved crown shrine; no bright red pole
 // crosses in front of its face. End tenons bury into beam and receiving arch.
 const crown=profile.canopy(0,-.50)-.90;box(0,(beamTop+crown)/2,-.50,.21,crown-beamTop+.04,.27,darkwood);
 for(const side of[-1,1]){
  const x0=side*.91,y0=beamTop+.02,x1=side*2.42,y1=profile.canopy(x1,.25)-1.02,s=new T.Shape();
  s.moveTo(x0,y0);s.quadraticCurveTo(side*1.54,y0+.03,x1,y1);s.lineTo(x1-side*.15,y1+.17);s.quadraticCurveTo(side*1.50,y0+.34,x0-side*.08,y0+.24);s.closePath();extrude(s,.29,.25,'scene04-212-curved-crown-load-brace-'+side);
 }
 group.userData.vault212={receivingRibs:3,frontCollaredStruts:4,rearStrutsOnHeader:4,interlockedCurvedArms:24,kingPost:1,curvedBraces:2,duplicatedLegacyArchSystemsRemoved:true,visualAccepted:false};return{group,stats:group.userData.vault212};
}
