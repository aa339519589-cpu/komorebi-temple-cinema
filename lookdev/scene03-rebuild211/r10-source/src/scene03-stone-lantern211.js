// A fully closed worn stone kasa: curved hips, lifted corner lips, a thick
// coved underside and chipped arrises. The weathering is metric geometry.
export function createToroStoneRoof211(T){
 const n=64,half=.72,p=[],ix=[],stride=(n+1)*(n+1);
 function plan(x,z){const t=Math.max(Math.abs(x),Math.abs(z))/half,corner=Math.pow(Math.abs(x*z)/(half*half),5),q=1-.025*corner;return[x*q+.004*Math.sin(z*37+x*13)*t**12,z*q+.004*Math.sin(x*31-z*17)*t**12];}
 function heightAt(x,z,bottom=false){
  const t=Math.min(1,Math.max(Math.abs(x),Math.abs(z))/half),corner=Math.pow(Math.abs(x*z)/(half*half),2),wear=.007*Math.sin(x*31+z*27)+.004*Math.sin(x*67-z*53);
  let chip=0;for(const[cx,cz,r,d]of[[.38,.72,.065,.020],[-.72,-.26,.055,.016],[.72,.47,.080,.018],[-.20,-.72,.060,.017]])chip+=d*Math.exp(-(((x-cx)**2+(z-cz)**2)/(r*r)));
  return bottom?-.095+.028*t*t+.050*corner*t**8+wear*.25*t**8:.365*Math.max(0,1-t)**1.65+(.060+.125*corner)*t**9+wear*t**3-chip;
 }
 for(let side=0;side<2;side++)for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const x=-half+2*half*i/n,z=-half+2*half*j/n,[xx,zz]=plan(x,z);p.push(xx,heightAt(x,z,side===1),zz);}
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+1,c=a+n+1,d=c+1;ix.push(a,c,b,b,c,d,a+stride,b+stride,c+stride,b+stride,d+stride,c+stride);}
 const rim=[...Array.from({length:n+1},(_,i)=>i),...Array.from({length:n},(_,j)=>(j+1)*(n+1)+n),...Array.from({length:n},(_,i)=>n*(n+1)+n-1-i),...Array.from({length:n-1},(_,j)=>(n-1-j)*(n+1))];
 for(let i=0;i<rim.length;i++){const a=rim[i],b=rim[(i+1)%rim.length];ix.push(a,b,a+stride,b,b+stride,a+stride);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setIndex(ix);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.name='scene03-211-closed-coved-kasa-with-lifted-corners-r08';geometry.userData={closedStoneSolid:true,authoredWear:true,referenceRGB:false,workingChamberSeatY:-.095,wallThicknessMetres:.08};return{geometry,heightAt,planAt:plan};
}

// Opaque clinging tissue under the separate fine fronds. Both faces follow
// the same stone surface; a buried lower face and joined rim make each
// irregular cushion a true closed solid rather than a leaf ribbon.
export function createClingingMoss211(T,{patches=[[0,0,.056]],heightAt=()=>0,planAt=(x,z)=>[x,z],seed=9}={}){
 const sectors=40,rings=10,p=[],uv=[],colors=[],ids=[],stride=1+rings*sectors;
 for(let patch=0;patch<patches.length;patch++){
  const[cx,cz,radius]=patches[patch],start=p.length/3,phase=seed*.31+patch*1.73;
  for(let side=0;side<2;side++){
   const height=(r,a)=>side?-.012:.006+.024*Math.max(0,1-r*r)**.60+.003*Math.sin(a*7+phase)*r+.002*Math.sin(a*11+r*9+phase)*r;
   const center=heightAt(cx,cz)+height(0,0),[xx,zz]=planAt(cx,cz);p.push(xx,center,zz);uv.push(.5,.5);colors.push(...(side?[.50,.62,.35]:[.83,1,.60]));
   for(let j=1;j<=rings;j++)for(let k=0;k<sectors;k++){
    const r=j/rings,a=k/sectors*Math.PI*2,edge=1+.075*Math.sin(a*5+phase)+.045*Math.sin(a*9-phase),x=cx+Math.cos(a)*radius*r*edge,z=cz+Math.sin(a)*radius*r*edge*.86,[xx,zz]=planAt(x,z),v=.74+.16*Math.sin(a*3+r*5+phase)+.08*Math.sin(a*13-r*7);
    p.push(xx,heightAt(x,z)+height(r,a),zz);uv.push(.5+Math.cos(a)*r*.49,.5+Math.sin(a)*r*.49);colors.push(...(side?[v*.61,v*.72,v*.42]:[v*.86,v*1.08,v*.64]));
   }
  }
  const tri=(a,b,c)=>ids.push(start+a,start+b,start+c,start+c+stride,start+b+stride,start+a+stride);
  for(let k=0;k<sectors;k++)tri(0,1+(k+1)%sectors,1+k);
  for(let j=0;j<rings-1;j++)for(let k=0;k<sectors;k++){const a=1+j*sectors+k,b=1+j*sectors+(k+1)%sectors,c=a+sectors,d=1+(j+1)*sectors+(k+1)%sectors;tri(a,d,c);tri(a,b,d);}
  const edge=1+(rings-1)*sectors;for(let k=0;k<sectors;k++){const a=start+edge+k,b=start+edge+(k+1)%sectors;ids.push(a,b,a+stride,b,b+stride,a+stride);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ids);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();g.name='scene03-211-closed-surface-conforming-moss-cushions-r10';g.userData={closedBiologicalSolids:true,patches:patches.length,embeddedDepthMetres:.012,cushionHeightMetres:.030,referenceRGB:false};return g;
}
