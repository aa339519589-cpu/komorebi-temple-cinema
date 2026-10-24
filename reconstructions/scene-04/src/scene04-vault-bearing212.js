import * as T from 'three';
import {createPrecisionTimberFactory04,setTimberEndGrainAttributes212} from './scene04-timber-precision134.js';

// The broad curved receiving frames spring from the beam ends. Real knees
// meet their underside; fore-aft ties reveal the depth of all three frames.
// This is an authored single-view structural interpretation, not measured joinery.
export function buildVaultBearing212({profile,C,wood,darkwood,upperBeamY=C.capitalTop+.43,upperBeamHeight=.45}){
 const group=new T.Group();group.name='scene04-237-curved-vault-bearing-with-joined-springers';const timber=createPrecisionTimberFactory04(),contacts=[];
 const mesh=(g,m,name)=>{const o=new T.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;group.add(o);return o;};
 const box=(x,y,z,w,h,d,m=wood)=>{const g=timber.box(w,h,d).clone();g.translate(x,y,z);return mesh(g,m,'scene04-237-closed-vault-bearing-block');};
 function extrude(shape,depth,z,name,{follow=false,vertical=false,material=wood,bevel=.010}={}){
  const g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel*.75,bevelSegments:4,curveSegments:34});g.translate(0,0,z-depth/2);const p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++){if(follow)p.setY(i,p.getY(i)+profile.canopy(p.getX(i),p.getZ(i))-profile.canopy(p.getX(i),z));uv.setXY(i,(vertical?p.getY(i):p.getX(i))/1.45,(vertical?p.getX(i):p.getY(i))/.38);}g.computeVertexNormals();setTimberEndGrainAttributes212(g,vertical?1:0);return mesh(g,material,name);
 }
 const beamTop=upperBeamY+upperBeamHeight*.48+.024,ribs=[{z:.38,half:3.03,h:.30,d:.32},{z:-.75,half:2.96,h:.235,d:.27},{z:-1.78,half:2.84,h:.205,d:.23}],ribTop=(x,z)=>profile.canopy(x,z)-.818,ribThickness=(x,r)=>r.h+.035*Math.max(0,1-Math.pow(x/r.half,2)),ribBottom=(x,r)=>ribTop(x,r.z)-ribThickness(x,r);
 for(const [i,r]of ribs.entries()){
  const shape=new T.Shape(),N=116;for(let j=0;j<=N;j++){const x=-r.half+2*r.half*j/N;j?shape.lineTo(x,ribTop(x,r.z)):shape.moveTo(x,ribTop(x,r.z));}for(let j=N;j>=0;j--){const x=-r.half+2*r.half*j/N;shape.lineTo(x,ribBottom(x,r));}shape.closePath();
  extrude(shape,r.d,r.z,'scene04-237-deep-curved-receiving-arch-'+i,{follow:true});
  // A narrow returned arris belongs to the front receiving frame. It is
  // ordinary timber, with real section depth and shadow under the main rib.
  if(i<2){const z=r.z+r.d/2+.012,trim=new T.Shape();for(let j=0;j<=N;j++){const x=-r.half+2*r.half*j/N,y=ribBottom(x,r)+.066;j?trim.lineTo(x,y):trim.moveTo(x,y);}for(let j=N;j>=0;j--){const x=-r.half+2*r.half*j/N;trim.lineTo(x,ribBottom(x,r)+.030);}trim.closePath();extrude(trim,.040,z,'scene04-237-curved-receiver-returned-timber-arris-'+i,{follow:true,bevel:.004});}
 }
 function receivingArm(x,y,z,w=.68,h=.16,d=.38,yaw=0){
  const s=new T.Shape();s.moveTo(-w/2,h*.42);s.lineTo(w/2,h*.42);s.bezierCurveTo(w*.55,-h*.12,w*.35,-h*.26,w*.26,-h*.18);s.quadraticCurveTo(w*.15,-h*.50,0,-h*.45);s.quadraticCurveTo(-w*.15,-h*.50,-w*.26,-h*.18);s.bezierCurveTo(-w*.35,-h*.26,-w*.55,-h*.12,-w/2,h*.42);s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth:d,steps:1,bevelEnabled:true,bevelSize:.010,bevelThickness:.008,bevelSegments:4,curveSegments:26});g.translate(0,0,-d/2);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/1.45,p.getY(i)/.38);setTimberEndGrainAttributes212(g,0);g.rotateY(yaw);g.translate(x,y,z);return mesh(g,wood,'scene04-237-interlocked-curved-springer-arm');
 }
 function knee(side,r,z,baseY,xa=2.62,xb=1.23,depth=.34,label='front'){
  const a=side*xa,b=side*xb,y0=baseY-.055,y1=ribBottom(b,r)+.028,s=new T.Shape();
  s.moveTo(side*(xa+.14),y0);s.lineTo(side*(xa-.14),y0);s.bezierCurveTo(side*(xa-.40),y0+.035,side*(xb+.49),y1-.17,b,y1);s.lineTo(b-side*.12,y1+.17);s.bezierCurveTo(side*(xb+.43),y1+.19,side*(xa-.31),y0+.29,a+side*.11,y0+.23);s.lineTo(side*(xa+.14),y0);s.closePath();
  extrude(s,depth,z,'scene04-237-curved-'+label+'-load-knee-'+side,{vertical:true});contacts.push({member:label+'-knee-'+side,foot:[a,y0,z],footBuriedBelowBeamTop:baseY-y0,flatSoleWidthMetres:.28,head:[b,y1,z],ribBottomAtHead:ribBottom(b,r),headEntersRibMetres:y1+.17-ribBottom(b,r),jointDepthOverlap:[Math.max(z-depth/2,r.z-r.d/2),Math.min(z+depth/2,r.z+r.d/2)],closedSolid:true});
 }
 // Two broad knees replace four tall T-shaped front props. Their open
 // middle belongs to the shrine and the true arched boards behind it.
 for(const side of[-1,1]){
  knee(side,ribs[0],.16,beamTop);
  receivingArm(side*2.63,beamTop+.025,.17,.68,.16,.49);
  receivingArm(side*2.63,beamTop+.035,.14,.64,.145,.29,Math.PI/2);
  box(side*2.63,beamTop-.025,.16,.40,.12,.58);
 }
 // A rear header receives its own two curved knees and centre post. It is
 // a full timber storey behind the front one, not extra front decoration.
 const rearTop=beamTop+.014,rearHeader=box(0,rearTop-.09,-.75,5.76,.18,.32);rearHeader.name='scene04-237-rear-vault-header';
 for(const x of[-2.62,2.62]){const tie=box(x,beamTop-.070,-.29,.18,.16,1.15);tie.name='scene04-237-depth-tie-between-front-and-rear-headers';}
 for(const side of[-1,1])knee(side,ribs[1],-.75,rearTop,2.56,1.03,.28,'rear');
 const crown=ribBottom(0,ribs[1])+.04;box(0,(rearTop+crown)/2,-.75,.185,crown-rearTop+.035,.27,darkwood);
 // Fore-aft ties pass through all three actual arch frames at the same
 // canopy level. A viewer moving below sees the receiving pockets/parallax.
 for(const x of[-2.62,-1.23,1.23,2.62]){
  const a=new T.Vector3(x,profile.canopy(x,ribs[0].z)-.988,ribs[0].z),b=new T.Vector3(x,profile.canopy(x,ribs[2].z)-.988,ribs[2].z),d=b.clone().sub(a),g=timber.box(.17,d.length()+.06,.19).clone();g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());mesh(g,wood,'scene04-237-fore-aft-purlin-through-three-arches');
 }
 group.userData.vault212={revision:'r28-237-deep-curved-arches-and-joined-knees',receivingRibs:3,frontFullHeightTProps:0,frontCurvedKnees:2,rearCurvedKnees:2,interlockedFrontSpringerArms:4,foreAftPurlins:4,lowerHeaderTies:2,kingPost:1,beamTop,contacts,nominalRoofAndColumnLayoutRetained:true,visualAccepted:false};return{group,stats:group.userData.vault212};
}
