// One closed, irregular granite footstone with a circular blind socket.
// The floor of the socket is the actual black column shoe's y=0 datum.
export function createVerandaFootstone142(T,{socketRadius=.4358}={}){
 const outer=[],inner=[],N=28,M=48,positions=[],uv=[];
 for(let i=0;i<N;i++){const a=2*Math.PI*i/N,c=Math.cos(a),s=Math.sin(a),j=1+.025*Math.sin(i*2.37)+.018*Math.cos(i*1.13);outer.push([Math.sign(c)*Math.pow(Math.abs(c),.44)*.77*j,Math.sign(s)*Math.pow(Math.abs(s),.44)*.70*j]);}
 for(let i=0;i<M;i++){const a=-2*Math.PI*i/M;inner.push([Math.cos(a)*socketRadius,Math.sin(a)*socketRadius]);}
 const top=(x,z)=>.23+.010*Math.sin(x*11+z*5)*Math.sin(z*9-x*3),at=(p,y)=>[p[0],typeof y==='function'?y(...p):y,p[1]];
 const tri=(a,b,c,want)=>{
  const v=new T.Vector3(...b).sub(new T.Vector3(...a)).cross(new T.Vector3(...c).sub(new T.Vector3(...a)));
  if(want&&v.dot(new T.Vector3(...want))<0)[b,c]=[c,b];
  for(const p of[a,b,c]){positions.push(...p);uv.push(p[0],-p[2]);}
 };
 const quad=(a,b,c,d,want)=>{tri(a,b,c,want);tri(a,c,d,want);};
 const flat=[...outer,...inner],faces=T.ShapeUtils.triangulateShape(outer.map(p=>new T.Vector2(...p)),[inner.map(p=>new T.Vector2(...p))]);
 for(const ids of faces)tri(...ids.map(i=>at(flat[i],top)),[0,1,0]);
 for(let i=0;i<N;i++){const a=outer[i],b=outer[(i+1)%N],n=[(a[0]+b[0])/2,0,(a[1]+b[1])/2];quad(at(a,-.17),at(b,-.17),at(b,top),at(a,top),n);}
 for(let i=0;i<M;i++){const a=inner[i],b=inner[(i+1)%M],n=[-(a[0]+b[0])/2,0,-(a[1]+b[1])/2];quad(at(a,0),at(a,top),at(b,top),at(b,0),n);tri([0,0,0],at(a,0),at(b,0),[0,1,0]);}
 for(const ids of T.ShapeUtils.triangulateShape(outer.map(p=>new T.Vector2(...p)),[]))tri(...ids.map(i=>at(outer[i],-.17)),[0,-1,0]);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.computeBoundingBox();g.userData.verandaFootstone142={construction:'Single closed granite volume with an actual blind circular receiver; column shoe bottoms at y=0 on the socket floor.',socketRadius,socketBottomY:0,outerBottomY:-.17,outerTopY:.23,photographSampled:false};return g;
}
