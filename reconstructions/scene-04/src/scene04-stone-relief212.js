import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// Independently authored weathered karakusa-like stone relief. These inferred
// scrolls are real, sealed displaced solids; no photographic colour or text.
const clamp=T.MathUtils.clamp;
const hash=(x,y,s)=>{const q=Math.sin(x*127.1+y*311.7+s*17.13)*43758.5453;return q-Math.floor(q);};
function noise(x,y,s){const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,U=u*u*(3-2*u),V=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b,s),hash(a+1,b,s),U),T.MathUtils.lerp(hash(a,b+1,s),hash(a+1,b+1,s),U),V);}
const distance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy),0,1);return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);};
function scrolls(width,height){
 const lines=[],hw=width/2,hy=height/2;
 for(const side of[-1,1]){
  let prior=null;
  for(let i=0;i<=76;i++){
   const t=i/76,angle=-Math.PI*.7+t*Math.PI*3.7,r=(1-t)*.82+.16;
   const q=[side*(hw*.56+Math.cos(angle)*hy*.88*r),Math.sin(angle)*hy*.79*r];
   if(prior)lines.push([prior,q]);prior=q;
  }
  prior=null;
  for(let i=0;i<=40;i++){
   const t=i/40,q=[side*(hw*.08+t*hw*.82),hy*(-.48*Math.sin(t*Math.PI*1.3)+.16)];
   if(prior)lines.push([prior,q]);prior=q;
  }
 }
 return lines;
}
export function carvedStoneBand212({width,height,y,z,seed=1,depth=.034}){
 const nx=Math.ceil(width/.009),ny=Math.ceil(height/.007),lines=scrolls(width,height),g=new T.BoxGeometry(width,height,.052,nx,ny,1),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),v=p.getY(i),front=p.getZ(i)>.0,edge=Math.min(width/2-Math.abs(x),height/2-Math.abs(v)),fade=T.MathUtils.smoothstep(edge,.0,.018);
  let d=10;for(const[a,b]of lines)d=Math.min(d,distance(x,v,a,b));
  const diamond=Math.abs(x)/(height*.51)+Math.abs(v)/(height*.36),cartouche=Math.exp(-Math.pow((diamond-.80)/.13,2)),centrePetal=.5+.5*Math.cos(4*Math.atan2(v,x)),r=Math.hypot(x/(height*.34),v/(height*.34)),petal=Math.exp(-Math.pow((r-(.57+.16*centrePetal))/.14,2));
  const scroll=Math.exp(-d*d/.000031),border=Math.exp(-Math.pow((edge-.018)/.007,2)),weather=.50+.50*noise(x*39,v*51,seed),relief=depth*Math.max(scroll*.88,cartouche*.85,petal*.58,border*.56)*weather;
  // The plane is seated inside the supporting square face, including its
  // returned margin. Small pocks remove real stone from crest and background.
  const pores=.0045*Math.pow(noise(x*123,v*127,seed+19),4)+.002*(noise(x*73,v*81,seed+29)-.5);
  p.setXYZ(i,x,v+y,p.getZ(i)+z+(front?fade*(relief-pores):0));
 }
 g.deleteAttribute('normal');g.deleteAttribute('uv');const welded=mergeVertices(g,1e-6);g.dispose();welded.computeVertexNormals();welded.userData.carvedStoneBand212={closed:true,width,height,reliefMetres:depth,seatBackZ:z-.026,source:'Independent inferred eroded cloud/diamond scroll relief',referenceImageNotTexture:true};return welded;
}
