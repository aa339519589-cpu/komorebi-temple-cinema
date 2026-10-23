import * as T from 'three';

// Closed hand-cut granite slab. Millimetre arrises and unequal corner chips
// alter the actual cast silhouette; the walked central top remains planar.
// Dimensions are an inferred construction study, not surveyed photo geometry.
export function handcutStep184(length,width,thickness,seed=1){
 const h=(i)=>{const q=Math.sin(seed*73.17+i*127.1)*43758.5453;return q-Math.floor(q);},hx=length/2,hz=width/2;
 const cuts=Array.from({length:4},(_,i)=>.004+h(i)*.009),rings=[],positions=[],indices=[],uv=[];
 const outline=(inset,y)=>{
  const x=hx-inset,z=hz-inset,c=cuts;
  return[[-x+c[0],y,-z],[x-c[1],y,-z],[x,y,-z+c[1]],[x,y,z-c[2]],[x-c[2],y,z],[-x+c[3],y,z],[-x,y,z-c[3]],[-x,y,-z+c[0]]];
 };
 for(const [inset,y]of[[.002,-thickness/2],[0,-thickness/2+.008],[0,thickness/2-.008],[.006,thickness/2]]){
  const r=outline(inset,y);rings.push(r);for(const p of r)positions.push(...p);
 }
 for(let j=0;j<3;j++)for(let i=0;i<8;i++){const k=(i+1)%8,a=j*8+i,b=j*8+k,c=(j+1)*8+i,d=(j+1)*8+k;indices.push(a,c,b,b,c,d);}
 positions.push(0,-thickness/2,0,0,thickness/2,0);
 for(let i=0;i<8;i++){const k=(i+1)%8;indices.push(32,k,i,33,24+i,24+k);}
 const indexed=new T.BufferGeometry();indexed.setAttribute('position',new T.Float32BufferAttribute(positions,3));indexed.setIndex(indices);
 const g=indexed.toNonIndexed();indexed.dispose();g.computeVertexNormals();
 const p=g.attributes.position,n=g.attributes.normal;
 for(let i=0;i<p.count;i++){const k=Math.abs(n.getY(i))>.5?1:Math.abs(n.getX(i))>.5?0:2;uv.push((k===0?p.getZ(i):p.getX(i))/.317,(k===1?p.getZ(i):p.getY(i))/.317);}
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.userData.member='184-closed-hand-cut-granite-tread';return g;
}
