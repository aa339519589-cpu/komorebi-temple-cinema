import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Inferred relief of the photographed black/gilt timber-column cuffs. Curves
// wrap the real cylindrical support, not a camera-facing texture or decal.
export function createReference6ColumnCollar(){
 const radius=.432,parts=[];
 const wrap=(u,v)=>new T.Vector3(radius*Math.sin(u/radius),v,radius*Math.cos(u/radius));
 function vine(points,r=.006){const curve=new T.CatmullRomCurve3(points.map(([u,v])=>wrap(u,v)));parts.push(new T.TubeGeometry(curve,24,r,6,false));}
 for(let q=0;q<8;q++){
  const centre=q*2*Math.PI*radius/8;
  for(const sx of[-1,1])for(const sy of[-1,1]){
   vine([[0,-.01],[.057,.035],[.117,.085],[.119,.150],[.064,.173],[.031,.133],[.067,.102]].map(([u,v])=>[centre+sx*u,sy*v]),.007);
   vine([[.049,.036],[.089,.012],[.132,.034],[.149,.073]].map(([u,v])=>[centre+sx*u,sy*v]),.004);
   for(const [u,v,a]of[[.059,.055,-.4],[.110,.089,.55],[.070,.148,-.65]]){
    const shape=new T.Shape();shape.moveTo(0,0);shape.bezierCurveTo(-.018,.014,-.021,.041,.006,.061);shape.bezierCurveTo(.022,.031,.019,.012,0,0);
    const g=new T.ExtrudeGeometry(shape,{depth:.004,bevelEnabled:true,bevelSegments:1,bevelSize:.0015,bevelThickness:.0015,curveSegments:5});
    const pos=g.attributes.position;for(let i=0;i<pos.count;i++){const xx=pos.getX(i),yy=pos.getY(i),zz=pos.getZ(i);const U=centre+sx*(u+xx*Math.cos(a)-yy*Math.sin(a)),V=sy*(v+xx*Math.sin(a)+yy*Math.cos(a)),A=U/radius;pos.setXYZ(i,(radius+zz)*Math.sin(A),V,(radius+zz)*Math.cos(A));}g.computeVertexNormals();parts.push(g);
   }
  }
 }
 const expanded=parts.map(g=>g.index?g.toNonIndexed():g),relief=mergeGeometries(expanded,false);
 for(const g of new Set([...parts,...expanded]))g.dispose();
 const body=new T.CylinderGeometry(.429,.429,.46,64,1,false);
 relief.userData.reference6ColumnCollar='wrapped-carved-scroll-relief';
 return{body,relief};
}
