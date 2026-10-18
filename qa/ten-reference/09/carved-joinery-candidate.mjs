import * as T from '../../../vendor/build/three.module.js';

// Solid relief leaf and pierced wood-fret candidate, prepared after photo-09
// hall crops showed that wire rosettes cannot supply carved timber depth.
export function makeClosedCarvedLeaf({length=.42,width=.105,relief=.045,turn=.22,segments=28,radial=10}={}){
  const points=[],uv=[],indices=[],centres=[];
  const centre=t=>new T.Vector3(turn*Math.sin(t*Math.PI)*t,length*t,.012+relief*.55*Math.sin(t*Math.PI));
  points.push(...centre(0).toArray());uv.push(.5,0);
  for(let j=1;j<segments;j++){
    const t=j/segments,c=centre(t),a=centre(Math.max(0,t-.001)),b=centre(Math.min(1,t+.001)),axis=b.sub(a).normalize(),cross=new T.Vector3(axis.y,-axis.x,0).normalize();centres.push(c);
    const w=width*Math.sin(t*Math.PI)**.75*(1+.12*Math.sin(t*7*Math.PI)),depth=relief*Math.sin(t*Math.PI)**.65;
    for(let k=0;k<radial;k++){
      const angle=k/radial*Math.PI*2,p=c.clone().addScaledVector(cross,Math.cos(angle)*w);p.z+=Math.sin(angle)*depth;
      points.push(...p.toArray());uv.push(k/radial,t);
    }
  }
  const tip=points.length/3;points.push(...centre(1).toArray());uv.push(.5,1);
  for(let k=0;k<radial;k++){const n=(k+1)%radial;indices.push(0,1+n,1+k);for(let j=0;j<segments-2;j++){const a=1+j*radial+k,b=1+j*radial+n,c=a+radial,d=b+radial;indices.push(a,b,c,b,d,c);}const last=1+(segments-2)*radial;indices.push(last+k,last+n,tip);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];g.setIndex(indices);g.computeVertexNormals();return g;
}
export function makePiercedWoodFret({width=1.15,height=.40,depth=.10}={}){
  const shape=new T.Shape();shape.moveTo(-width/2,-height/2);shape.lineTo(width/2,-height/2);shape.lineTo(width/2,height/2);shape.lineTo(-width/2,height/2);shape.closePath();
  for(const sign of[-1,1]){
    const h=new T.Path();h.moveTo(sign*.055,-.025);h.bezierCurveTo(sign*.13,-.16,sign*.40,-.16,sign*.49,-.025);h.bezierCurveTo(sign*.38,.13,sign*.20,.13,sign*.055,-.025);h.closePath();shape.holes.push(h);
  }
  const g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:18});g.translate(0,0,-depth/2);return g;
}
function audit(g){
  const p=g.attributes.position;for(const q of p.array)if(!Number.isFinite(q))throw Error('Nonfinite carving');
  g.computeBoundingBox();const ix=g.index;let zeroArea=0,volume=0;const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),u=new T.Vector3(),v=new T.Vector3();
  for(let i=0;i<(ix?.count??p.count);i+=3){const ids=[0,1,2].map(j=>ix?ix.getX(i+j):i+j);a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);u.subVectors(b,a);v.subVectors(c,a);if(u.cross(v).lengthSq()<1e-20)zeroArea++;volume+=a.dot(b.clone().cross(c))/6;}
  return{vertices:p.count,triangles:(ix?.count??p.count)/3,zeroArea,signedVolume:volume,bounds:{min:g.boundingBox.min.toArray(),max:g.boundingBox.max.toArray()}};
}
const leaf=makeClosedCarvedLeaf(),fret=makePiercedWoodFret();console.log(JSON.stringify({leaf:audit(leaf),fret:audit(fret)},null,2));
