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
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setIndex(ix);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.name='scene03-211-closed-coved-kasa-with-lifted-corners-r08';geometry.userData={closedStoneSolid:true,authoredWear:true,referenceRGB:false,workingChamberSeatY:-.095,wallThicknessMetres:.08};return{geometry,heightAt};
}
