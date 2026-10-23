// Actual three-dimensional sprays of needles. Every pad has a porous silhouette,
// self-shadowing interior and twiglets, rather than a smooth closed ellipsoid.
export function createPrunedCrownGeometry(T,{radiusX=.75,radiusZ=.53,halfHeight=.23,phase=0}={}){
 let seed=(19317+Math.round(phase*7193))>>>0;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const p=[],c=[],uv=[];
 function tri(a,b,d,col){for(const v of[a,b,d]){p.push(...v);c.push(...col);uv.push(v[0]*2,v[2]*2);}}
 for(let j=0;j<330;j++){
  const a=rand()*Math.PI*2,r=Math.sqrt(rand()),lobe=1+.10*Math.sin(a*5+phase)+.06*Math.sin(a*13),x=Math.cos(a)*radiusX*r*lobe,z=Math.sin(a)*radiusZ*r*lobe,y=(rand()-.35)*halfHeight*(.3+.7*Math.sqrt(1-r*r)),b=[x,y,z];
  const shade=.42+rand()*.52,col=[shade*.79,shade,shade*.57];
  for(let k=0;k<11;k++){
   const az=k*2.399+rand()*.3,el=.1+rand()*.9,len=.06+rand()*.105,dx=Math.cos(az)*Math.cos(el)*len,dz=Math.sin(az)*Math.cos(el)*len,dy=Math.sin(el)*len,w=.004+rand()*.004;
   tri([x+Math.sin(az)*w,y,z-Math.cos(az)*w],[x-Math.sin(az)*w,y,z+Math.cos(az)*w],[x+dx,y+dy,z+dz],col);
   tri([x,y-w,z],[x,y+w,z],[x+dx,y+dy,z+dz],col);
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
export function buildPrunedCrownData(options={}){throw Error('Use the true needle geometry generator.');}
