import{T}from'./kernel.js';
import{RoundedBoxGeometry}from'three/addons/geometries/RoundedBoxGeometry.js';
// Authored metric joinery/stone interfaces. Every addition is real opaque mesh;
// wear is millimetres of continuous displacement, not a photographed decal.
const stats={revision:'scene02-craft342-r06-correct-veranda-timber-environment',stoneSlabs:0,stoneGuardPiers:0,canopyRafterEndCaps:0,canopyBeamSeatPlates:0,canopyPurlins:0,canopyUndersideWraps:0,canopyPurlinSeatPlates:0,closedOpaqueGeometry:true,photographicAccepted:false};
export const craftStats342=()=>({...stats});
function averageNormals(g){g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,groups=new Map();for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e7)).join(','),a=groups.get(key)??{ids:[],n:new T.Vector3()};a.ids.push(i);a.n.add(new T.Vector3().fromBufferAttribute(n,i));groups.set(key,a);}for(const a of groups.values()){a.n.normalize();for(const i of a.ids)n.setXYZ(i,a.n.x,a.n.y,a.n.z);}return g;}
export function placeStoneSlab342({b,center,size,seed=0,material='terraceTread',tint=1,wear=true}){
 const[w,h,d]=size,radius=Math.min(.014,h*.16,d*.08),g=new RoundedBoxGeometry(w,h,d,2,radius),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),top=T.MathUtils.smoothstep(y,-h*.08,h*.35),front=Math.exp(-Math.pow((z+d*.5)/.075,2)),path=Math.exp(-Math.pow((x+.09*Math.sin(seed*1.73))/(w*.44),4)),settled=wear?(.0015+.0020*(.5+.5*Math.sin(seed*2.19)))*path*(.35+.65*front):0,rim=wear?.0018*front*Math.sin(x*13+seed*.73)*top:0;p.setY(i,y-top*settled+rim);}
 averageNormals(g);g.name='scene02-metric-dressed-worn-granite-slab342';g.userData.craft342={sizeMetres:size,wearDepthMaximumMetres:.0053,closedBeforeAndAfterContinuousDeformation:true};b.put(g,material,center,[1,1,1],[0,0,0],tint);stats.stoneSlabs++;return g;
}
export function buildStairGuardPiers342({b,top,bottom,width,yaw}){
 const direction=top.clone().sub(bottom);direction.y=0;direction.normalize();
 b.at(top.toArray(),yaw,()=>{for(const sign of[-1,1]){const x=sign*(width/2+.20),z=.10;placeStoneSlab342({b,center:[x,.045,z],size:[.50,.13,.53],seed:sign,material:'terraceCheek',wear:false});b.put(new T.CylinderGeometry(.16,.21,.53,8),'terraceCheek',[x,.37,z]);placeStoneSlab342({b,center:[x,.66,z],size:[.43,.105,.44],seed:sign+11,material:'terraceTread',wear:false});b.put(new T.CylinderGeometry(.11,.16,.07,8),'oldgold',[x,.745,z]);b.ball(x,.82,z,.07,.09,.07,'oldgold');stats.stoneGuardPiers++;}});
}
export function buildCanopyCraft342({b,mats,canopy,edgeX}){
 const face=new RoundedBoxGeometry(.225,.385,.022,2,.007),inset=new RoundedBoxGeometry(.179,.332,.006,1,.0018),leafShape=new T.Shape();leafShape.moveTo(0,-.050);leafShape.bezierCurveTo(-.047,-.027,-.044,.026,0,.086);leafShape.bezierCurveTo(.043,.026,.043,-.027,0,-.050);leafShape.closePath();const leaf=new T.ExtrudeGeometry(leafShape,{depth:.005,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0012,bevelSegments:2,curveSegments:6});leaf.translate(0,0,-.002);
 const metal=mats.gold.clone();metal.name='scene02-eave-fitted-aged-gilt342';metal.color.setRGB(.74,.50,.18);metal.metalness=.95;metal.roughness=.34;mats.eaveGilt342=metal;
 const recess=mats.black.clone();recess.name='scene02-eave-casting-recess342';recess.color.setHex(0x21170c);recess.roughness=.52;recess.metalness=.55;mats.eaveRecess342=recess;
 function plate(x,y,z,w=1,h=1,yaw=0,tilt=0){b.at([x,y,z],yaw,()=>{b.stack.push(b.stack.at(-1).clone().multiply(new T.Matrix4().makeRotationX(tilt)));try{b.put(face,'eaveGilt342',[0,0,0],[w,h,1]);b.put(inset,'eaveRecess342',[0,0,.014],[w,h,1]);for(const sign of[-1,1])for(const row of[-1,1])b.put(leaf,'eaveGilt342',[sign*.044*w,row*.070*h,.019],[.62*w,.72*h,1],[0,0,-sign*row*.65]);b.ball(0,0,.024,.018*w,.024*h,.008,'eaveGilt342');for(const xx of[-.092,.092])for(const yy of[-.164,.164])b.ball(xx*w,yy*h,.014,.005,.005,.004,'eaveGilt342');}finally{b.stack.pop();}});}
 // Real L-like cut-end wraps continue onto the visible timber underside.
 // Cut faces alone face away from the retained inside-veranda camera.
 for(let z=-2;z<41;z+=.46){plate(edgeX(z)-.008,9.30,z,.91,1.12,-Math.PI/2);stats.canopyRafterEndCaps++;plate(edgeX(z)+.15,9.078,z,1.44,.56,0,Math.PI/2);stats.canopyUndersideWraps++;}
 // Inboard eave purlin connects the retained long rafter tails to the six
 // cross-beam/column stations. Its top houses20mm into the original rafters.
 const za=-2,zb=41,xa=edgeX(za)+2.15,xb=edgeX(zb)+2.15,run=Math.hypot(xb-xa,zb-za),yaw=Math.atan2(xb-xa,zb-za);b.box((xa+xb)/2,8.94,(za+zb)/2,.28,.32,run,'cedar',yaw);stats.canopyPurlins++;
 for(const z of[2,10,18,26,34,40]){plate(edgeX(z)+2.15,8.774,z,1.45,.65,0,Math.PI/2);stats.canopyPurlinSeatPlates++;}
 for(const z of[2,10,18,26,34,40]){plate(canopy.columnX,9.0,z+.269,1.8,1.08,0);stats.canopyBeamSeatPlates++;}
 return{...craftStats342(),source:'Dimensions inferred from HD visible cut-end and cast-wrap hierarchy; original canopy envelope/column/rafter positions held',material:{linearGilt:[.74,.50,.18],metalness:.95,roughness:.34,inferredNotMeasured:true},noSourcePhotographPixels:true};
}
