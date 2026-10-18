import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// A fully rounded carved leaf with a convex midrib and thick curled edges.
function sculptedLeaf(length=.27,width=.1,depth=.05){
 const p=[],uv=[],id=[],rows=14,cols=8,layer=(rows+1)*(cols+1);
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const t=j/rows,u=i/cols*2-1,w=width*Math.pow(Math.sin(Math.PI*t),.75)*(.87+.08*Math.sin(t*30)),x=u*w+.05*width*Math.sin(t*7),y=t*length,z=side?0:depth+.040*Math.sin(Math.PI*t)*(1-u*u)+.012*u*Math.sin(t*8);p.push(x,y,z);uv.push(x*3,y*3);
 }
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;id.push(a,a+1,b,a+1,b+1,b,a+layer,b+layer,a+1+layer,a+1+layer,b+layer,b+1+layer);}
 for(let j=0;j<rows;j++)for(const i of[0,cols]){const a=j*(cols+1)+i,b=a+cols+1;i===0?id.push(a,b,a+layer,b,b+layer,a+layer):id.push(a,a+layer,b,b,a+layer,b+layer);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(id);g.computeVertexNormals();return g;
}
export function buildDeepEntranceCarving(mats,{capitalTop=8.85,canopyAt,front=1.67}={}){
 const group=new T.Group();group.name='multiscale-deep-carved-entrance';const batches=new Map();
 const put=(g,m,p=[0,0,0],rot=[0,0,0])=>{g.rotateX(rot[0]);g.rotateY(rot[1]);g.rotateZ(rot[2]);g.translate(...p);let a=batches.get(m)??[];a.push(g);batches.set(m,a);};
 function curve(points,r,mat){put(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(14,points.length*9),r,7,false),mat);}
 function petal(x,y,z,angle,len,w,mat,depth=.047){const g=sculptedLeaf(len,w,depth);put(g,mat,[x,y,z],[0,0,angle]);}
 function scroll(x,y,z,w,h,phase=0){
  for(const sign of[-1,1]){
   const pts=[];for(let k=0;k<40;k++){const t=k/39*6.5,r=1-k/48;pts.push([x+sign*(.13*w+Math.sin(t)*w*.23*r),y+Math.cos(t)*h*.43*r,z+.025*Math.sin(t*1.8)]);}curve(pts,.022,mats.cedar);
   if(phase<.3)curve(pts.map(p=>[p[0],p[1],p[2]+.025]),.005,mats.oldgold);
   for(let k=0;k<7;k++){
    const a=k*.83+phase,xx=x+sign*(.15+k*.060)*w,yy=y+Math.sin(a)*h*.3,ang=-sign*(.45+k*.20),len=h*(.40+.18*Math.sin(k*2.1+phase)),ww=w*(.046+.008*Math.cos(k));
    petal(xx,yy,z+.015,ang,len,ww,mats.cedar,.085);if(k%3===0)petal(xx,yy+len*.12,z+.113,ang,len*.57,ww*.31,mats.oldgold,.012);
   }
  }
  for(let k=0;k<10;k++){const a=k*Math.PI/5+.2;petal(x+Math.sin(a)*.055,y+Math.cos(a)*.055,z+.025,-a,h*.46,w*.038,k%4?mats.cedar:mats.oldgold,.071);}
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
