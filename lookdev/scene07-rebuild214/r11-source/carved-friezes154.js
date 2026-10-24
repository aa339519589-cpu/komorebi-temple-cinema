import * as T from 'three';
export const CARVING_REVISION154='scene07-closed-hosoge-frieze154-r02';

export async function loadCarvedFriezes154({emit,mats}){
 const response=await fetch(new URL('../assets/carving154/hosoge-field.gray8.bin',import.meta.url));
 if(!response.ok)throw Error('Missing carving154 scalar source');
 const field=new Uint8Array(await response.arrayBuffer()),width=1536,height=512;
 if(field.length!==width*height)throw Error('Invalid carving154 scalar size');
 const material=mats.gold.clone();material.name='scene07-worn-gilt-carved-wood154';material.roughness=.51;material.metalness=.81;material.color.setHex(0x9e854e);
 const cache=new Map();let panels=0,triangles=0;
 function sample(u,v){const x=Math.min(width-1,Math.max(0,u*(width-1))),y=Math.min(height-1,Math.max(0,(1-v)*(height-1))),a=Math.floor(x),b=Math.floor(y),fx=x-a,fy=y-b;
  const q=(i,j)=>field[Math.min(height-1,j)*width+Math.min(width-1,i)]/255;
  return(q(a,b)*(1-fx)+q(a+1,b)*fx)*(1-fy)+(q(a,b+1)*(1-fx)+q(a+1,b+1)*fx)*fy;
 }
 function build(w,h,mirror){
  const nx=320,ny=72,N=(nx+1)*(ny+1),p=new Float32Array(N*2*3),uv=new Float32Array(N*2*2),heights=new Float32Array(N),active=new Uint8Array(nx*ny),indices=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
   const id=j*(nx+1)+i,u=i/nx,v=.16+j/ny*.68,q=sample(mirror?1-u:u,v);heights[id]=q;
   for(let layer=0;layer<2;layer++){
    const k=id+layer*N;p.set([(u-.5)*w,(j/ny-.5)*h,layer?-.018:.008+Math.pow(q,1.25)*.040],k*3);uv.set([u,j/ny],k*2);
   }
  }
  const quad=(a,b,c,d)=>indices.push(a,b,c,a,c,d);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
   const a=j*(nx+1)+i,b=a+1,d=a+nx+1,c=d+1;
   if((heights[a]+heights[b]+heights[c]+heights[d])*.25>.21)active[j*nx+i]=1;
  }
  const on=(i,j)=>i>=0&&i<nx&&j>=0&&j<ny&&active[j*nx+i];
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)if(on(i,j)){
   const a=j*(nx+1)+i,b=a+1,d=a+nx+1,c=d+1;
   quad(a,b,c,d);quad(a+N,d+N,c+N,b+N);
   if(!on(i,j-1))quad(a,a+N,b+N,b);if(!on(i+1,j))quad(b,b+N,c+N,c);
   if(!on(i,j+1))quad(c,c+N,d+N,d);if(!on(i-1,j))quad(d,d+N,a+N,a);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.userData.architectureMember=CARVING_REVISION154;return g;
 }
 return{panel(x,y,z,w,h){const mirror=panels%2,key=[w,h,mirror].join(':');if(!cache.has(key))cache.set(key,build(w,h,mirror));const g=cache.get(key);emit(g,material,x,y,z);panels++;triangles+=g.index.count/3;},info:()=>({revision:CARVING_REVISION154,panels,triangles,scalarGuideIsNotMetricRecoveredCarving:true,visibleImageTextures:false,construction:'Closed actual displaced front, back and walls around pierced cell regions; separate physically lit metal/wood materials',visualAccepted:false}),dispose(){material.dispose();}};
}
