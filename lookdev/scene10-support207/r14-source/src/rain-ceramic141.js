import * as T from 'three';

// Individual, closed ceramic covers laid on the same analytic roof surface
// as its rafters and bearing seats. No scene photograph is used as a texture.
export function createRainCeramicField141({point,w,d,rows=30,pitch=.235}){
 const positions=[],indices=[],uv=[],colors=[];let tileCount=0;
 const N=10,M=3,thickness=.018;
 const P=(face,t,u)=>new T.Vector3(...point(face,t,u));
 const roofNormal=(face,t,u)=>{
  const a=P(face,Math.max(.001,t-.0004),u),b=P(face,Math.min(1.001,t+.0004),u),
   c=P(face,t,Math.max(-1,u-.0004)),e=P(face,t,Math.min(1,u+.0004));
  const n=e.sub(c).cross(b.sub(a)).normalize();if(n.y<0)n.negate();return n;
 };
 for(let face=0;face<4;face++)for(let row=0;row<rows;row++){
  const t0=Math.max(.004,(row+.006)/rows),t1=(row+.994)/rows,tm=(t0+t1)/2;
  const span=P(face,tm,-1).distanceTo(P(face,tm,1)),lanes=Math.max(2,Math.round(span/pitch));
  for(let lane=0;lane<lanes;lane++){
   const u0=-1+(lane+.004)*2/lanes,u1=-1+(lane+.996)*2/lanes,start=positions.length/3;
   const tint=.94+.035*Math.sin(lane*2.37+row*1.71+face*.83);
   for(let shell=0;shell<2;shell++)for(let j=0;j<=M;j++)for(let k=0;k<=N;k++){
    const t=t0+(t1-t0)*j/M,u=u0+(u1-u0)*k/N,n=roofNormal(face,t,u),p=P(face,t,u);
    const across=(k/N-.5)/.205,arch=.044*Math.sqrt(Math.max(0,1-across*across)),head=.007*Math.pow(1-j/M,5)*(arch/.044);
    p.addScaledVector(n,.018+arch+head-shell*thickness);
    positions.push(...p.toArray());uv.push(p.x,p.z);colors.push(tint,tint,tint);
   }
   const ring=(M+1)*(N+1),id=(s,j,k)=>start+s*ring+j*(N+1)+k;
   const tri=(a,b,c)=>indices.push(a,b,c);
   const quad=(a,b,c,e)=>{tri(a,b,c);tri(a,c,e);};
   const wall=(a,b,c,e,toward)=>{
    const A=new T.Vector3().fromArray(positions,a*3),B=new T.Vector3().fromArray(positions,b*3),C=new T.Vector3().fromArray(positions,c*3);
    if(B.sub(A).cross(C.sub(A)).dot(toward)>0)quad(a,b,c,e);else quad(a,e,c,b);
   };
   for(let j=0;j<M;j++)for(let k=0;k<N;k++){
    const a=id(0,j,k),b=id(0,j,k+1),c=id(0,j+1,k+1),e=id(0,j+1,k),
     A=new T.Vector3().fromArray(positions,a*3),B=new T.Vector3().fromArray(positions,b*3),C=new T.Vector3().fromArray(positions,c*3);
    const outward=B.sub(A).cross(C.sub(A)).dot(roofNormal(face,tm,(u0+u1)/2))>0;
    if(outward){quad(a,b,c,e);quad(a+ring,e+ring,c+ring,b+ring);}
    else{quad(a,e,c,b);quad(a+ring,b+ring,c+ring,e+ring);}
   }
   for(const j of[0,M])for(let k=0;k<N;k++){
    const a=id(0,j,k),b=id(0,j,k+1),t=j===0?t0:t1,u=u0+(u1-u0)*(k+.5)/N,
     toward=P(face,t+(j===0?-.0005:.0005),u).sub(P(face,t,u));wall(a,a+ring,b+ring,b,toward);
   }
   for(const k of[0,N])for(let j=0;j<M;j++){
    const a=id(0,j,k),b=id(0,j+1,k),t=t0+(t1-t0)*(j+.5)/M,u=k===0?u0:u1,
     toward=P(face,t,u+(k===0?-.0005:.0005)).sub(P(face,t,u));wall(a,b,b+ring,a+ring,toward);
   }
   tileCount++;
  }
 }
 // Surface normals follow the curved ceramic. Cut walls keep separate flat
 // normals, so each head joint cannot pull the entire cover into a pillow.
 const ring=(M+1)*(N+1),tileVertices=ring*2,cache=new Float32Array(positions.length),done=new Uint8Array(positions.length/3);
 const normalAt=id=>{
  if(done[id])return[cache[id*3],cache[id*3+1],cache[id*3+2]];
  const tile=Math.floor(id/tileVertices)*tileVertices,local=id-tile,shell=local>=ring?1:0,q=local-shell*ring,j=Math.floor(q/(N+1)),k=q%(N+1),base=tile+shell*ring,
   a=base+j*(N+1)+Math.max(0,k-1),b=base+j*(N+1)+Math.min(N,k+1),c=base+Math.max(0,j-1)*(N+1)+k,e=base+Math.min(M,j+1)*(N+1)+k,
   du=new T.Vector3().fromArray(positions,b*3).sub(new T.Vector3().fromArray(positions,a*3)),dt=new T.Vector3().fromArray(positions,e*3).sub(new T.Vector3().fromArray(positions,c*3)),n=du.cross(dt).normalize();
  if(n.y<0)n.negate();if(shell)n.negate();cache.set(n.toArray(),id*3);done[id]=1;return n.toArray();
 };
 const outP=[],outN=[],outUV=[],outC=[];
 for(let i=0;i<indices.length;i+=3){
  const ids=indices.slice(i,i+3),shells=ids.map(id=>(id%tileVertices)>=ring),surface=shells.every(v=>v===shells[0]),
   a=new T.Vector3().fromArray(positions,ids[0]*3),b=new T.Vector3().fromArray(positions,ids[1]*3),c=new T.Vector3().fromArray(positions,ids[2]*3),flat=b.sub(a).cross(c.sub(a)).normalize().toArray();
  for(const id of ids){outP.push(...positions.slice(id*3,id*3+3));outN.push(...(surface?normalAt(id):flat));outUV.push(...uv.slice(id*2,id*2+2));outC.push(...colors.slice(id*3,id*3+3));}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(outP,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(outN,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(outUV,2));geometry.setAttribute('color',new T.Float32BufferAttribute(outC,3));
 geometry.userData.rainCeramic141={tileCount,rows,nominalPitch:pixelSafe(pitch),wallThickness:thickness,construction:'Closed top/inner ceramic shells with sealed cut ends and a raised overlapping head; supported by existing roof underlay.'};
 return geometry;
}
function pixelSafe(value){return Math.round(value*10000)/10000;}
