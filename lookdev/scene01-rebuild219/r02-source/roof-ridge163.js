import * as T from 'three';

// A closed formed-clay ridge with a flat bearing bed and an arched crown.
// Unlike a pipe sweep, it has no hollow cut ends. The last few courses
// narrow into a small formed termination instead of a long oversized tube.
export function createClosedRidge163(points,radius,segments=48){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),R=12,positions=[],uv=[],indices=[];
 const up=new T.Vector3(0,1,0),side=new T.Vector3(),normal=new T.Vector3();
 for(let j=0;j<=segments;j++){
  const t=j/segments,centre=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
  side.crossVectors(up,tangent);if(side.lengthSq()<.00001)side.set(1,0,0);side.normalize();normal.crossVectors(tangent,side).normalize();
  const taper=1-.28*T.MathUtils.smoothstep(t,.90,1),r=radius*taper;
  for(let k=0;k<=R;k++){
   const angle=Math.PI*(1-k/R),p=centre.clone().addScaledVector(side,Math.cos(angle)*r).addScaledVector(normal,Math.sin(angle)*r*.86);
   positions.push(...p.toArray());uv.push(t*curve.getLength(),k/R);
  }
 }
 for(let j=0;j<segments;j++)for(let k=0;k<=R;k++){
  const next=(k+1)%(R+1),a=j*(R+1)+k,b=j*(R+1)+next,c=a+R+1,d=b+R+1;
  indices.push(a,c,b,b,c,d);
 }
 for(const end of[0,1]){
  const offset=end?segments*(R+1):0,centre=new T.Vector3();
  for(let k=0;k<=R;k++)centre.add(new T.Vector3(...positions.slice((offset+k)*3,(offset+k)*3+3)));centre.multiplyScalar(1/(R+1));
  const ci=positions.length/3;positions.push(...centre.toArray());uv.push(end*curve.getLength(),.5);
  const desired=curve.getTangent(end).multiplyScalar(end?1:-1);
  for(let k=0;k<=R;k++){
   const a=offset+k,b=offset+(k+1)%(R+1),va=new T.Vector3(...positions.slice(a*3,a*3+3)).sub(centre),vb=new T.Vector3(...positions.slice(b*3,b*3+3)).sub(centre);
   if(va.cross(vb).dot(desired)>0)indices.push(ci,a,b);else indices.push(ci,b,a);
  }
 }
 const g=new T.BufferGeometry();g.name='scene01-163-closed-formed-clay-hip-ridge';g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.userData.closedEndCaps=true;return g;
}
