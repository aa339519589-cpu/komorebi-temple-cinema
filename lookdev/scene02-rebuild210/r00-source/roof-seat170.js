import {T} from './kernel.js';

// A closed flared bronze boot skirt follows the true top-roof surface. Its
// turned shoulder replaces the block-like ceramic support exposed in R06.
export function createSorinRoofSeat170({eave,rise,halfWidth,curl}){
 const pos=[],uv=[],ix=[],N=48,top=eave+rise+.025,rings=[[.66,0],[.654,.12],[.61,.48],[.56,1]];
 const roofY=(x,z)=>{const a=Math.abs(x),b=Math.abs(z),t=Math.max(a,b)/halfWidth,u=Math.min(a,b)/Math.max(a,b,1e-8);return eave+rise*Math.pow(1-t,1.46)+curl*Math.pow(t,7)*(.18+.82*Math.pow(u,8));};
 for(const [r,h]of rings)for(let k=0;k<N;k++){
  const a=k*Math.PI*2/N,x=Math.cos(a)*r,z=Math.sin(a)*r,bottom=roofY(Math.cos(a)*.66,Math.sin(a)*.66)+.010;
  pos.push(x,bottom+(top-bottom)*h,z);uv.push(k/N,h);
 }
 const tc=pos.length/3;pos.push(0,top,0);uv.push(0,0);const bc=pos.length/3;pos.push(0,eave+rise-.020,0);uv.push(0,0);
 for(let j=0;j<rings.length-1;j++)for(let k=0;k<N;k++){const n=(k+1)%N,a=j*N+k,c=j*N+n;ix.push(a,a+N,c,c,a+N,c+N);}
 const last=(rings.length-1)*N;for(let k=0;k<N;k++){const n=(k+1)%N;ix.push(tc,last+n,last+k,bc,k,n);}
 const g=new T.BufferGeometry();g.name='scene02-170-closed-roof-fitted-flared-bronze-boot-skirt';g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.userData.closedRoofFittedSeat=true;return g;
}
