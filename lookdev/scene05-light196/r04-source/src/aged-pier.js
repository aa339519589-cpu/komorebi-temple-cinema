import * as T from 'three';

// A square structural pier with millimetre chamfers and real shallow drying
// checks. Every check is a concavity in one closed timber solid; the original
// post axis, seat, foot and external section bounds remain unchanged.
export function createAgedPier05(width,height,depth){
 const halfX=width/2,halfZ=depth/2,arris=Math.min(.005,width*.018,depth*.018),p=[],uv=[],ix=[];
 const levels=[0,.06,.16,.27,.39,.52,.65,.77,.88,.96,1],outline=t=>{
  const points=[];
  for(let side=0;side<4;side++){
   const half=side%2?halfZ:halfX,other=side%2?halfX:halfZ,c=arris;
   const local=[[-half+c,other]];
   for(const [fraction,index]of[[-.27,0],[.31,1]]){
    const x=fraction*half,w=.0014+.0004*index,
      envelope=Math.sin(Math.PI*T.MathUtils.clamp((t-.055-index*.11)/(.88-index*.12),0,1))**2,
      inset=(.0018+.0012*(side%2))*(.75+.25*Math.sin(t*17+side))*envelope;
    local.push([x-w,other],[x,other-inset],[x+w,other]);
   }
   local.push([half-c,other]);
   for(const [x,z]of local){const a=side*Math.PI/2;points.push([Math.cos(a)*x+Math.sin(a)*z,-Math.sin(a)*x+Math.cos(a)*z]);}
  }
  return points;
 };
 const N=outline(.5).length;
 for(const t of levels)for(const [x,z]of outline(t)){p.push(x,(t-.5)*height,z);uv.push(x,z);}
 for(let j=0;j<levels.length-1;j++)for(let i=0;i<N;i++){const a=j*N+i,b=j*N+(i+1)%N,c=a+N,d=b+N;ix.push(a,b,c,b,d,c);}
 p.push(0,-height/2,0,0,height/2,0);uv.push(0,0,0,0);const lo=p.length/3-2,hi=lo+1;
 for(let i=0;i<N;i++){ix.push(lo,(i+1)%N,i);const a=(levels.length-1)*N+i,b=(levels.length-1)*N+(i+1)%N;ix.push(hi,a,b);}
 const indexed=new T.BufferGeometry();indexed.setAttribute('position',new T.Float32BufferAttribute(p,3));indexed.setAttribute('uv',new T.Float32BufferAttribute(uv,2));indexed.setIndex(ix);
 const g=indexed.toNonIndexed();indexed.dispose();g.computeVertexNormals();g.userData={kind:'closed-square-aged-pier',actualCheckDepthMetres:[.0018,.0030],arrisMetres:arris,retainsSection:[width,height,depth]};return g;
}
