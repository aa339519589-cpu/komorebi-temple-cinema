import {T} from './kernel.js';

// Reproducible wood/old-gilt flower carving. Every curled petal is a closed
// solid with an underside and edge thickness, not an image or flat cutout.
export function createCarvedRosette170({b}){
 const stats={prototype:'three-ring-closed-curled-petal-rosette170',petals:30,instances:0,referencePixelsSampled:false};
 function petal(inner,outer,width,z0,angle,phase){
  const N=13,M=10,pos=[],uv=[],ix=[],co=Math.cos(angle),si=Math.sin(angle);
  for(const back of[false,true])for(let j=0;j<=N;j++)for(let k=0;k<=M;k++){
   const t=j/N,q=-1+2*k/M,w=.010+width*Math.pow(Math.sin(Math.PI*t),.76)*(.88+.12*Math.cos(t*Math.PI*3+phase)),x=q*w,y=inner+(outer-inner)*t;
   const z=z0+.10*Math.sin(Math.PI*t)*(1-.62*q*q)+.052*q*q*(.4+.6*t)+.080*t*t*t+.013*Math.sin(q*Math.PI*2+phase)*Math.sin(Math.PI*t)-(back?.018:0);
   pos.push(x*co-y*si,x*si+y*co,z);uv.push((q+1)/2,t);
  }
  const L=(N+1)*(M+1);
  for(let j=0;j<N;j++)for(let k=0;k<M;k++){
   const a=j*(M+1)+k,c=a+M+1;ix.push(a,a+1,c,a+1,c+1,c,L+a,L+c,L+a+1,L+a+1,L+c,L+c+1);
  }
  const ring=[];for(let k=0;k<=M;k++)ring.push(k);for(let j=1;j<=N;j++)ring.push(j*(M+1)+M);for(let k=M-1;k>=0;k--)ring.push(N*(M+1)+k);for(let j=N-1;j>0;j--)ring.push(j*(M+1));
  for(let i=0;i<ring.length;i++){const a=ring[i],c=ring[(i+1)%ring.length];ix.push(a,a+L,c,c,a+L,c+L);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
 }
 function combine(parts,name){
  const p=[],n=[],uv=[],ix=[];for(const g of parts){const off=p.length/3;p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);uv.push(...g.attributes.uv.array);for(const i of g.index.array)ix.push(i+off);g.dispose();}
  const g=new T.BufferGeometry();g.name=name;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.userData.closedIndividualPetals=true;return g;
 }
 const rings=[];
 for(const [row,count,inner,outer,width,z]of[[0,12,.15,.65,.175,.012],[1,10,.065,.48,.145,.073],[2,8,.012,.31,.115,.132]]){
  const parts=[];for(let k=0;k<count;k++)parts.push(petal(inner,outer,width,z,k*Math.PI*2/count+row*.31,k*.71));
  if(row===2){
   const centre=new T.SphereGeometry(.085,18,10);centre.scale(1,1,.52);centre.translate(0,0,.272);parts.push(centre);
   for(let k=0;k<16;k++){const a=k*Math.PI/8,g=new T.SphereGeometry(.026,7,5);g.scale(.8,1.2,.65);g.translate(Math.cos(a)*.115,Math.sin(a)*.115,.249);parts.push(g);}
  }
  rings.push(combine(parts,'scene02-170-closed-curled-rosette-ring-'+row));
 }
 function stamp(p,s=1,yaw=0,roll=0){
  for(let i=0;i<rings.length;i++)b.put(rings[i],['hallBearing','carvingBronze157','carvingGold157'][i],p,[s,s,s],[0,yaw,roll]);stats.instances++;
 }
 return{stamp,stats,prototypes:rings};
}
