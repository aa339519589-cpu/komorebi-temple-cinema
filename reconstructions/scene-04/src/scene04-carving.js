import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// A fully rounded carved leaf with a convex midrib and thick curled edges.
function sculptedLeaf(length=.27,width=.1,depth=.05){
 const p=[],uv=[],id=[],rows=14,cols=8,layer=(rows+1)*(cols+1);
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const t=j/rows,u=i/cols*2-1,w=width*Math.pow(Math.sin(Math.PI*t),.75)*(.87+.08*Math.sin(t*30)),x=u*w+.05*width*Math.sin(t*7),y=t*length,z=side?0:depth+.022*Math.sin(Math.PI*t)*(1-u*u)+.012*u*Math.sin(t*8);p.push(x,y,z);uv.push(x*3,y*3);
 }
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;id.push(a,a+1,b,a+1,b+1,b,a+layer,b+layer,a+1+layer,a+1+layer,b+layer,b+1+layer);}
 for(let j=0;j<rows;j++)for(const i of[0,cols]){const a=j*(cols+1)+i,b=a+cols+1;i===0?id.push(a,b,a+layer,b,b+layer,a+layer):id.push(a,a+layer,b,b,a+layer,b+layer);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(id);g.computeVertexNormals();return g;
}
export function buildDeepEntranceCarving(mats,{capitalTop=8.85,canopyAt,front=1.67,columnAxes=[2.86,4.73,6.88]}={}){
 const group=new T.Group();group.name='multiscale-deep-carved-entrance';const batches=new Map();
 const put=(g,m,p=[0,0,0],rot=[0,0,0])=>{g.rotateX(rot[0]);g.rotateY(rot[1]);g.rotateZ(rot[2]);g.translate(...p);let a=batches.get(m)??[];a.push(g);batches.set(m,a);};
 function curve(points,r,mat){put(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(14,points.length*9),r,7,false),mat);}
 function petal(x,y,z,angle,len,w,mat,depth=.047){const g=sculptedLeaf(len,w,depth);put(g,mat,[x,y,z],[0,0,angle]);}
 function scroll(x,y,z,w,h,phase=0){
  for(const sign of[-1,1]){
   const pts=[];for(let k=0;k<40;k++){const t=k/39*6.5,r=1-k/48;pts.push([x+sign*(.13*w+Math.sin(t)*w*.23*r),y+Math.cos(t)*h*.43*r,z+.025*Math.sin(t*1.8)]);}curve(pts,.022,mats.cedar);
   if(phase<.3)curve(pts.map(p=>[p[0],p[1],p[2]+.025]),.005,mats.oldgold);
   for(let k=0;k<11;k++){
    const a=k*.83+phase,xx=x+sign*(.12+k*.041)*w,yy=y+Math.sin(a)*h*.3,ang=-sign*(.45+k*.20),len=h*(.29+.12*Math.sin(k*2.1+phase)),ww=w*(.030+.006*Math.cos(k));
    petal(xx,yy,z+.015,ang,len,ww,mats.cedar,.047);if(k%2===0)petal(xx,yy+len*.12,z+.113,ang,len*.68,ww*.45,mats.oldgold,.012);
   }
  }
  for(let k=0;k<10;k++){const a=k*Math.PI/5+.2;petal(x+Math.sin(a)*.055,y+Math.cos(a)*.055,z+.025,-a,h*.46,w*.038,k%4?mats.cedar:mats.oldgold,.071);}
 }
 function carvedBeam(width,height,y,z,material){
  const s=new T.Shape();s.moveTo(-width/2,-height*.35);s.bezierCurveTo(-width*.35,-height*.32,-width*.30,-height*.78,-width*.17,-height*.51);s.bezierCurveTo(0,-height*.34,width*.2,-height*.76,width*.38,-height*.28);s.lineTo(width/2,-height*.28);s.lineTo(width/2,height*.45);s.bezierCurveTo(width*.2,height*.40,-width*.1,height*.57,-width/2,height*.40);s.closePath();
  put(new T.ExtrudeGeometry(s,{depth:.34,bevelEnabled:true,bevelSize:.019,bevelThickness:.018,bevelSegments:2,curveSegments:12}),material,[0,y,z]);
  // The independent scroll groups below carry the gilt detail. A continuous
  // pair of gold rails flattened them into another horizontal band.
 }
 carvedBeam(6.25,.40,capitalTop+.14,.33,mats.cedar);
 carvedBeam(6.07,.35,capitalTop-.46,.48,mats.red);
 carvedBeam(5.05,.24,capitalTop-.75,-.05,mats.cedar);
 for(const [j,x]of[-1.92,0,1.92].entries())scroll(x,capitalTop+.14,.73,1.15,.32,j*.91);
 for(const [j,x]of[-2.22,-1.12,0,1.12,2.22].entries())scroll(x,capitalTop-.47,.88,.84,.26,j*.72);
 for(const [j,x]of[-1.95,-1.3,-.65,0,.65,1.3,1.95].entries())scroll(x,capitalTop-.76,.34,.55,.16,j*.89);
 for(const sign of[-1,1])for(const [j,x]of[[(columnAxes[0]+columnAxes[1])/2,(columnAxes[1]+columnAxes[2])/2]].flat().entries()){
  scroll(sign*x,capitalTop-1.12,-.385,j?.88:.95,.26,j*.63);
 }
 // Projecting, differently sized wood cloud brackets enrich the side bays.
 for(const sign of[-1,1])for(let j=0;j<4;j++){
  const x=sign*(3.35+j*.77),y=capitalTop-.70-j*.08;
  scroll(x,y,.48,.57,.22,j*1.33);
 }
 // Five raised floral pendants follow the curved bargeboard, replacing its
 // repeated flat square patches. Each lobe has a thick convex carved face.
 for(const [j,x]of[-4.85,-2.65,0,2.65,4.85].entries()){
  const y=canopyAt(x)-.23,s=j===2?1.18:.86,z=front+.035;
  for(const side of[-1,1])curve([[x+side*.28*s,y+.085,z],[x+side*.14*s,y-.02,z+.025],[x+side*.18*s,y-.15,z+.045],[x+side*.07*s,y-.20,z+.05]],.012,mats.oldgold);
  for(let k=0;k<7;k++){const a=(k-3)*.30;petal(x+Math.sin(a)*.085*s,y-.045,z+.055,Math.PI-a,(.16+.045*Math.cos(a))*s,.031*s,mats.oldgold,.045);}
  petal(x,y+.10,z+.04,Math.PI,.18*s,.055*s,mats.gold,.055);
 }
 for(const [j,x]of[-2.15,-1.10,1.10,2.15].entries()){
  const y=canopyAt(x)-1.34;
  scroll(x,y,.80,.72-j%2*.10,.30+j%2*.055,j*.71);
  for(let k=0;k<4;k++)petal(x+(k-1.5)*.06,y+.12,.88,-.7+k*.45,.18,.032,mats.oldgold,.045);
 }
 // Small curved kibana and layered cloud shoulders stay on the existing
 // column axes. Varied depths and carved leaves break the bare timber ends.
 const kneeShape=new T.Shape();kneeShape.moveTo(-.44,.12);kneeShape.lineTo(.44,.12);kneeShape.bezierCurveTo(.56,.06,.49,-.19,.34,-.19);kneeShape.bezierCurveTo(.20,-.18,.23,-.015,.11,-.025);kneeShape.bezierCurveTo(-.04,-.04,-.11,-.17,-.30,-.14);kneeShape.bezierCurveTo(-.43,-.12,-.51,-.035,-.44,.12);kneeShape.closePath();
 for(const side of[-1,1])for(const [j,axis]of columnAxes.entries()){
  const x=side*axis,y=canopyAt(x)-1.03,s=.84-j*.085;
  for(let layer=0;layer<3;layer++){
   const g=new T.ExtrudeGeometry(kneeShape,{depth:.25,bevelEnabled:true,bevelSize:.018,bevelThickness:.016,bevelSegments:2,curveSegments:16});g.scale(s*(1-layer*.13),.82-layer*.13,1);put(g,layer%2?mats.red:mats.cedar,[x+side*.035*layer,y-layer*.17,.56+layer*.18]);
  }
  scroll(x,y-.09,1.13,.61-j*.07,.27-j*.025,j*.73);
  for(let k=0;k<5;k++)petal(x+side*(k-2)*.06,y-.18,1.15,k*.32-1.0,.18,.035,k%2?mats.cedar:mats.oldgold,.055);
 }
 for(const [mat,parts]of batches){const clean=parts.map(g=>{const q=g.index?g.toNonIndexed():g;return q;});const g=mergeGeometries(clean,false);clean.forEach(q=>q.dispose());const mesh=new T.Mesh(g,mat);mesh.name='deep-carved-sculpture-'+mat.name;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
 return group;
}
