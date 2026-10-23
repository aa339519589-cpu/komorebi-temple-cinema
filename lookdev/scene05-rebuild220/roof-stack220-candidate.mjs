import * as T from 'three';

// CPU-authored section planes for the proposed third pass. The main rafter
// retains its inherited centre; flying rafters and boarding meet that real
// section in the local roof-normal direction instead of overlapping sheets.
export function roofFrame220(sample,face,t,fixedU){
 const point=q=>sample(face,q,T.MathUtils.clamp(fixedU/q,-1,1)),surface=point(t),tangent=point(t+.0001).sub(point(t-.0001)).normalize(),
  side=new T.Vector3(tangent.z,0,-tangent.x).normalize(),up=new T.Vector3().crossVectors(tangent,side).normalize(),main=surface.clone();main.y-=.340;
 return{surface,tangent,side,up,main,flying:main.clone().addScaledVector(up,.130),boardBottom:main.clone().addScaledVector(up,.175),boardTop:main.clone().addScaledVector(up,.202)};
}

export function createSoffitBoard220(sample,face,lo,hi,width,index=0){
 const N=32,pos=[],uv=[],ids=[],phase=.137*Math.sin(index*7.17+face*1.13),stride=(N+1)*2;
 for(let level=0;level<2;level++)for(const t of[lo,hi])for(let k=0;k<=N;k++){
  const u=-1+2*k/N,f=roofFrame220(sample,face,t,u*t),p=level?f.boardTop:f.boardBottom;
  pos.push(...p.toArray());uv.push(u*width*.5*t,t*width*.5+phase);
 }
 const vertex=i=>new T.Vector3(pos[i*3],pos[i*3+1],pos[i*3+2]);
 function tri(a,b,c,out){const n=vertex(b).sub(vertex(a)).cross(vertex(c).sub(vertex(a)));if(n.lengthSq()<1e-20)return;if(n.dot(out)<0)ids.push(a,c,b);else ids.push(a,b,c);}
 for(let level=0;level<2;level++)for(let k=0;k<N;k++){
  const a=level*stride+k,b=a+1,c=a+N+1,d=c+1,out=new T.Vector3(0,level?1:-1,0);tri(a,b,c,out);tri(b,d,c,out);
 }
 const perimeter=[...Array.from({length:N+1},(_,k)=>k),...Array.from({length:N+1},(_,k)=>2*N+1-k)];
 for(let e=0;e<perimeter.length;e++){
  const a=perimeter[e],b=perimeter[(e+1)%perimeter.length],k=(a%(N+1)+b%(N+1))/2,u=-1+2*k/N,
   f=roofFrame220(sample,face,e<=N?lo:hi,u*(e<=N?lo:hi));let out;
  if(e<N)out=f.tangent.clone().negate();else if(e===N)out=face<2?new T.Vector3(1,0,0):new T.Vector3(0,0,1);
  else if(e<2*N+1)out=f.tangent.clone();else out=face<2?new T.Vector3(-1,0,0):new T.Vector3(0,0,-1);
  tri(a,a+stride,b,out);tri(b,a+stride,b+stride,out);
 }
 const indexed=new T.BufferGeometry();indexed.setAttribute('position',new T.Float32BufferAttribute(pos,3));indexed.setAttribute('uv',new T.Float32BufferAttribute(uv,2));indexed.setIndex(ids);
 const g=indexed.toNonIndexed();indexed.dispose();g.computeVertexNormals();g.userData={metricPathUV:true,architectureMember:'closed-soffit-plank220',radialInterval:[lo,hi],nominalNormalThickness:.027,actualBoardingSeat:'main-rafter upper plane + flying-rafter full depth',referencePhotographRuntimeUse:false};return g;
}
