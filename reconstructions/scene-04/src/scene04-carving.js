import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
function leafShape(length=.27,width=.10){const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(-width*.9,length*.14,-width,length*.55,-width*.38,length*.74);s.lineTo(-width*.49,length*.76);s.bezierCurveTo(-width*.27,length*.89,-width*.08,length*.9,0,length);s.bezierCurveTo(width*.15,length*.83,width*.7,length*.72,width*.61,length*.49);s.bezierCurveTo(width*.55,length*.24,width*.21,length*.08,0,0);return s;}
export function buildDeepEntranceCarving(mats,{capitalTop=8.85,canopyAt,front=1.67}={}){
 const group=new T.Group();group.name='multiscale-deep-carved-entrance';const batches=new Map();
 const put=(g,m,p=[0,0,0],rot=[0,0,0])=>{g.rotateX(rot[0]);g.rotateY(rot[1]);g.rotateZ(rot[2]);g.translate(...p);let a=batches.get(m)??[];a.push(g);batches.set(m,a);};
 function curve(points,r,mat){put(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(14,points.length*9),r,7,false),mat);}
 function petal(x,y,z,angle,len,w,mat,depth=.047){const g=new T.ExtrudeGeometry(leafShape(len,w),{depth,bevelEnabled:true,bevelSize:.007,bevelThickness:.007,bevelSegments:2,curveSegments:7,steps:1});put(g,mat,[x,y,z],[0,0,angle]);}
 function scroll(x,y,z,w,h,phase=0){
  for(const sign of[-1,1]){
   const pts=[];for(let k=0;k<40;k++){const t=k/39*6.5,r=1-k/48;pts.push([x+sign*(.13*w+Math.sin(t)*w*.23*r),y+Math.cos(t)*h*.43*r,z+.025*Math.sin(t*1.8)]);}curve(pts,.022,mats.cedar);
   curve(pts.map(p=>[p[0],p[1],p[2]+.025]),.009,mats.gold);
   for(let k=0;k<7;k++){
    const a=k*.83+phase,xx=x+sign*(.15+k*.060)*w,yy=y+Math.sin(a)*h*.3,ang=-sign*(.45+k*.20),len=h*(.40+.18*Math.sin(k*2.1+phase)),ww=w*(.046+.008*Math.cos(k));
    petal(xx,yy,z+.015,ang,len,ww,mats.cedar,.068);petal(xx,yy,z+.088,ang,len*.82,ww*.68,k%3===0?mats.gold:mats.oldgold,.015);
   }
  }
  for(let k=0;k<10;k++){const a=k*Math.PI/5+.2;petal(x+Math.sin(a)*.055,y+Math.cos(a)*.055,z+.025,-a,h*.46,w*.038,k%3?mats.oldgold:mats.gold,.045);}
 }
 function carvedBeam(width,height,y,z,material){
  const s=new T.Shape();s.moveTo(-width/2,-height*.35);s.bezierCurveTo(-width*.35,-height*.32,-width*.30,-height*.78,-width*.17,-height*.51);s.bezierCurveTo(0,-height*.34,width*.2,-height*.76,width*.38,-height*.28);s.lineTo(width/2,-height*.28);s.lineTo(width/2,height*.45);s.bezierCurveTo(width*.2,height*.40,-width*.1,height*.57,-width/2,height*.40);s.closePath();
  put(new T.ExtrudeGeometry(s,{depth:.34,bevelEnabled:true,bevelSize:.019,bevelThickness:.018,bevelSegments:2,curveSegments:12}),material,[0,y,z]);
  for(const sign of[-1,1])curve([[-width/2,y+sign*height*.43,z+.36],[-width*.2,y+sign*height*.48,z+.375],[width*.1,y+sign*height*.46,z+.375],[width/2,y+sign*height*.39,z+.36]],.012,mats.oldgold);
 }
 carvedBeam(6.25,.40,capitalTop+.14,.33,mats.cedar);
 carvedBeam(6.07,.35,capitalTop-.46,.48,mats.red);
 carvedBeam(5.05,.24,capitalTop-1.05,-.05,mats.cedar);
 for(const [j,x]of[-1.92,0,1.92].entries())scroll(x,capitalTop+.14,.73,1.15,.32,j*.91);
 for(const [j,x]of[-2.22,-1.12,0,1.12,2.22].entries())scroll(x,capitalTop-.47,.88,.84,.26,j*.72);
 for(const [j,x]of[-1.95,-1.3,-.65,0,.65,1.3,1.95].entries())scroll(x,capitalTop-1.06,.34,.55,.16,j*.89);
 // Rafter-end bindings have foliate silhouettes and projecting gilded details.
 if(canopyAt)for(const [j,x]of[-5.6,-4.3,-2.9,-1.5,1.5,2.9,4.3,5.6].entries()){
  const y=canopyAt(x)-.30;
  for(const sign of[-1,1]){petal(x,y-.14,front+.008,sign*.58,.29,.085,mats.oldgold,.032);petal(x+sign*.065,y+.04,front+.018,sign*.83,.16,.055,mats.gold,.025);}
  curve([[x-.11,y-.13,front],[x-.12,y+.11,front],[x,y+.17,front+.015],[x+.12,y+.11,front],[x+.11,y-.13,front]],.013,mats.oldgold);
 }
 for(const sign of[-1,1])for(const [j,x]of[3.77,5.83].entries()){
  scroll(sign*x,capitalTop-1.12,-.385,j?.88:.95,.26,j*.63);
 }
 // Projecting, differently sized wood cloud brackets enrich the side bays.
 for(const sign of[-1,1])for(let j=0;j<4;j++){
  const x=sign*(3.35+j*.77),y=capitalTop-.70-j*.08;
  scroll(x,y,.48,.57,.22,j*1.33);
 }
 for(const [mat,parts]of batches){const clean=parts.map(g=>{const q=g.index?g.toNonIndexed():g;return q;});const g=mergeGeometries(clean,false);clean.forEach(q=>q.dispose());const mesh=new T.Mesh(g,mat);mesh.name='deep-carved-sculpture-'+mat.name;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
 return group;
}
