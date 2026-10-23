import * as T from 'three';

// A physical arclength chart for the raked hip timber. Its material fibres
// follow the authored 3D member rather than its largest world bounding axis.
export function assignTimberPathUV05(geometry,path){
 const N=96,centres=Array.from({length:N+1},(_,i)=>path.getPoint(i/N)),lengths=[0];
 for(let i=1;i<=N;i++)lengths.push(lengths.at(-1)+centres[i].distanceTo(centres[i-1]));
 const pos=geometry.attributes.position,norm=geometry.attributes.normal,uv=new Float32Array(pos.count*2),p=new T.Vector3(),n=new T.Vector3();
 for(let i=0;i<pos.count;i++){
  p.fromBufferAttribute(pos,i);n.fromBufferAttribute(norm,i);let best=Infinity,at=0,t=0,centre;
  for(let k=0;k<N;k++){
   const a=centres[k],edge=centres[k+1].clone().sub(a),u=T.MathUtils.clamp(p.clone().sub(a).dot(edge)/edge.lengthSq(),0,1),q=a.clone().addScaledVector(edge,u),distance=q.distanceToSquared(p);
   if(distance<best){best=distance;at=k;t=u;centre=q;}
  }
  const tangent=centres[at+1].clone().sub(centres[at]).normalize(),side=new T.Vector3(tangent.z,0,-tangent.x).normalize(),up=tangent.clone().cross(side).normalize(),delta=p.clone().sub(centre);
  if(Math.abs(n.dot(tangent))>.82){uv[i*2]=delta.dot(side);uv[i*2+1]=delta.dot(up);}
  else{uv[i*2]=T.MathUtils.lerp(lengths[at],lengths[at+1],t);uv[i*2+1]=Math.abs(n.dot(side))>.70?delta.dot(up):delta.dot(side);}
 }
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.userData.metricPathUV={units:'canonical-metres',centrelineLength:lengths.at(-1),samples:N};return geometry;
}
