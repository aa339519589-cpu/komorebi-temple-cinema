import * as T from 'three';

// The thin rear of each flying rafter laps on the main rafter, then gains
// depth toward the eave. The deck sits on the same real wedge upper plane.
export function flyingThickness272(t){
 const q=T.MathUtils.clamp((t-.68)/.16,0,1);
 return .090*q*q*(3-2*q);
}

// Closed, finite-thickness eave pans. Their descending concave front, turned
// lip and corner mitres are actual ceramic geometry. No photograph is sampled.
export function createDripPan272(sample,face,left,right,{variant=0,cornerSign=0,frontRadial=1.028,rearRadial=.974,cornerStart=1.006,cornerSeat=.985,bellyDrop=.090}={}){
 const R=12,K=20,thickness=.0185+(cornerSign?0:.0008*Math.sin(variant*1.71)),start=cornerSign?cornerStart:Math.max(rearRadial,Math.abs(left),Math.abs(right)),end=frontRadial;
 const gain=.90+.085*Math.sin(variant*2.31),phase=.0013*Math.sin(variant*1.13);
 const across=(t,v)=>cornerSign>0?T.MathUtils.lerp(cornerSeat,t,v):cornerSign<0?T.MathUtils.lerp(-t,-cornerSeat,v):T.MathUtils.lerp(left,right,v);
 const top=(s,v,edge=false)=>{
  const t=T.MathUtils.lerp(start,end,s),u=across(t,v),a=v*2-1;
  const blend=T.MathUtils.smoothstep(s,.32,1),rear=.010+.026*a*a,
   belly=-bellyDrop+(bellyDrop+.023)*a*a,turn=.010*Math.exp(-Math.pow((s-.955)/.067,2)),pressed=phase*Math.sin(Math.PI*v)*Math.sin(Math.PI*s);
  const p=sample(face,t,u/t);p.y+=T.MathUtils.lerp(rear,belly,blend)+turn+pressed+(edge?.005:0);
  return p;
 };
 function solid(point,rows,cols,depth,name){
  const positions=[],uv=[],colors=[],ids=[],stride=(rows+1)*(cols+1);
  for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let k=0;k<=cols;k++){
   const p=point(j/rows,k/cols);if(side)p.y-=depth;
   positions.push(...p.toArray());uv.push(k/cols*.31,j/rows*.48);
   const wear=.025*Math.abs(k/cols*2-1)**5,shade=gain+wear;
   colors.push(shade*.98,shade,shade*1.015);
  }
  const P=i=>new T.Vector3().fromArray(positions,i*3);
  const tri=(a,b,c,out)=>{
   const n=P(b).sub(P(a)).cross(P(c).sub(P(a)));
   if(n.lengthSq()<1e-22)throw Error('Degenerate closed eave-pan triangle');
   if(n.dot(out)<0)ids.push(a,c,b);else ids.push(a,b,c);
  };
  for(let side=0;side<2;side++)for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){
   const a=side*stride+j*(cols+1)+k,b=a+1,c=a+cols+1,d=c+1,out=new T.Vector3(0,side?-1:1,0);
   tri(a,b,c,out);tri(b,d,c,out);
  }
  const boundaries=[
   {vertices:Array.from({length:cols+1},(_,k)=>k),inside:i=>i+cols+1},
   {vertices:Array.from({length:cols+1},(_,k)=>rows*(cols+1)+k),inside:i=>i-cols-1},
   {vertices:Array.from({length:rows+1},(_,j)=>j*(cols+1)),inside:i=>i+1},
   {vertices:Array.from({length:rows+1},(_,j)=>j*(cols+1)+cols),inside:i=>i-1}
  ];
  // Separate side vertices retain the fired lip's actual edge normals.
  for(const boundary of boundaries)for(let k=0;k<boundary.vertices.length-1;k++){
   const a=boundary.vertices[k],b=boundary.vertices[k+1],out=P(a).sub(P(boundary.inside(a)));out.y=0;
   const base=positions.length/3;
   for(const i of[a,b,a+stride,b+stride]){positions.push(...P(i).toArray());uv.push(uv[i*2],uv[i*2+1]);colors.push(...colors.slice(i*3,i*3+3));}
   tri(base,base+1,base+2,out);tri(base+1,base+3,base+2,out);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ids);g.computeVertexNormals();
  g.name=name;g.userData={closedCeramic:true,kind:name,clayThickness:depth,cornerMiter:cornerSign,referencePhotographRuntimeUse:false};return g;
 }
 const body=solid(top,R,K,thickness,'scene05-concave-hanging-eave-pan272');
 // A narrow raised fired edge follows the front belly, with a closed back.
 const lip=solid((s,v)=>top(.985+s*.015,v,true),2,K,.0075,'scene05-turned-finite-eave-lip272');
 return{body,lip,info:{rearRadial:start,frontRadial:end,thickness,frontBellyDrop:bellyDrop,frontShoulderRise:.023,cornerSign}};
}
