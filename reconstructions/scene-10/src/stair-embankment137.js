import * as T from 'three';

// The backed granite flight rises from a planted shore, not from a bare
// two-metre riser standing in the pond. This is a closed physical landform.
export function createStairEmbankment137(plan){
 const [cx,,cz]=plan.bridgeEnd,[ux,uz]=plan.unit,distance=plan.run+1.55;
 // Continue below the hall paving as buried fill. Ending at the last tread
 // left the recessed foundation exposed directly behind the bridge arch.
 const ground=-.13,front=-1.85,back=distance+5.0,width=3.55;
 const smooth=(x,a,b)=>T.MathUtils.smoothstep(x,a,b);
 const noise=(u,v)=>Math.sin(u*2.31+v*.71)*Math.cos(v*3.73-u*.43)*.035+Math.sin(u*5.27-v*4.17)*.018;
 const ridge=u=>{
  const approach=smooth(u,front,0),rise=T.MathUtils.clamp((u-1.55)/plan.run,0,1);
  return ground+(plan.bridgeEnd[1]+plan.rise*rise-.16-ground)*approach;
 };
 const at=(u,v)=>{
  const toe=3.35+.13*Math.sin(u*2.1),side=1-smooth(Math.abs(v),1.43,toe);
  const y=ground+(ridge(u)-ground)*Math.pow(side,1.28)+noise(u,v)*side*(1+1.5*smooth(Math.abs(v),1.43,2.20));
  return[cx+ux*u-uz*v,y,cz+uz*u+ux*v];
 };
 const p=[],uv=[],ix=[],N=66,M=48;
 for(let j=0;j<=N;j++)for(let i=0;i<=M;i++){
  const u=front+(back-front)*j/N,v=-width+2*width*i/M;
  p.push(...at(u,v));uv.push(u*.7,v*.7);
 }
 for(let j=0;j<N;j++)for(let i=0;i<M;i++){
  const a=j*(M+1)+i,b=a+1,c=a+M+1,d=c+1;
  const A=new T.Vector3().fromArray(p,a*3),B=new T.Vector3().fromArray(p,b*3),C=new T.Vector3().fromArray(p,c*3);
  if(B.sub(A).cross(C.sub(A)).y>0)ix.push(a,b,c,b,d,c);else ix.push(a,c,b,b,c,d);
 }
 const perimeter=[];
 for(let i=0;i<=M;i++)perimeter.push(i);
 for(let j=1;j<=N;j++)perimeter.push(j*(M+1)+M);
 for(let i=M-1;i>=0;i--)perimeter.push(N*(M+1)+i);
 for(let j=N-1;j>0;j--)perimeter.push(j*(M+1));
 const base=[];for(const a of perimeter){base.push(p.length/3);p.push(p[a*3],-.38,p[a*3+2]);uv.push(0,0);}
 for(let i=0;i<perimeter.length;i++){
  const j=(i+1)%perimeter.length,a=perimeter[i],b=perimeter[j],c=base[i],d=base[j];ix.push(a,c,b,b,c,d);
 }
 const center=p.length/3;p.push(cx,-.38,cz);uv.push(0,0);
 for(let i=0;i<base.length;i++)ix.push(center,base[(i+1)%base.length],base[i]);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(ix);geometry.computeVertexNormals();
 geometry.name='scene10-closed-shore-embankment-under-backed-granite-stair';
 return{geometry,at,info:{kind:'closed-soil-and-stone-battered-shore',ridgeClearanceUnderTreads:.16,topHalfWidth:1.43,toeHalfWidth:3.35,frontAlong:front,backAlong:back,waterline:ground,source:'Modeled bank supporting existing backed stair and turning landing; no photographic surface or depth field'}};
}
