import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

const hash=(x,y,z,s)=>{const q=Math.sin(x*127.1+y*311.7+z*74.7+s*17.13)*43758.5453;return q-Math.floor(q);};
function noise(x,y,z,s){const i=Math.floor(x),j=Math.floor(y),k=Math.floor(z),f=[x-i,y-j,z-k].map(v=>v*v*(3-2*v)),l=T.MathUtils.lerp;return l(l(l(hash(i,j,k,s),hash(i+1,j,k,s),f[0]),l(hash(i,j+1,k,s),hash(i+1,j+1,k,s),f[0]),f[1]),l(l(hash(i,j,k+1,s),hash(i+1,j,k+1,s),f[0]),l(hash(i,j+1,k+1,s),hash(i+1,j+1,k+1,s),f[0]),f[1]),f[2]);}

// A complete six-sided stone. Millimetre erosion is a surface field; it is
// not a jagged top-outline extruded into vertical corrugations on the riser.
export function createGraniteStairBlock131({leftBack,rightBack,leftFront,rightFront,back,front,top,thickness,seed=1}){
 const seam=.004,lb=leftBack+seam,rb=rightBack-seam,lf=leftFront+seam,rf=rightFront-seam,
  w=((rb-lb)+(rf-lf))/2,d=front-back-.004,h=thickness,r=.018,
  source=new T.BoxGeometry(w,h,d,Math.max(8,Math.ceil(w/.032)),Math.max(6,Math.ceil(h/.025)),Math.max(8,Math.ceil(d/.030))),p=source.attributes.position,
  half=new T.Vector3(w,h,d).multiplyScalar(.5),inner=half.clone().addScalar(-r),point=new T.Vector3(),closest=new T.Vector3();
 for(let i=0;i<p.count;i++){
  point.fromBufferAttribute(p,i);closest.copy(point).clamp(inner.clone().negate(),inner);point.sub(closest).normalize().multiplyScalar(r).add(closest);
  const u=point.x/w+.5,v=point.z/d+.5,t=point.y/h+.5,left=T.MathUtils.lerp(lb,lf,v),right=T.MathUtils.lerp(rb,rf,v),x=T.MathUtils.lerp(left,right,u),z=back+.002+v*d,y=top-h/2+point.y,
   edgeX=Math.min(u,1-u),edgeZ=Math.min(v,1-v),fade=T.MathUtils.smoothstep(Math.min(edgeX*w,edgeZ*d),.008,.050),
   grain=.0015*(noise(x*28,y*28,z*28,seed)-.5)+.0007*(noise(x*71,y*71,z*71,seed+17)-.5),
   topWear=(.006*(noise(x*3.2,0,z*3.2,seed+37)-.5)+grain-.0045*Math.exp(-Math.pow((u-.5)/.32,2))*Math.sin(Math.PI*v)**2)*fade*T.MathUtils.smoothstep(t,.73,.97),
   frontWear=(.007*(noise(x*19,y*19,0,seed+53)-.5)+grain-.004*Math.pow(noise(x*7,y*11,0,seed+79),4))*T.MathUtils.smoothstep(v,.85,.99)*T.MathUtils.smoothstep(edgeX*w,.008,.055)*Math.sin(Math.PI*t);
  p.setXYZ(i,x,y+topWear,z+frontWear);
 }
 // Welding by position gives the small worn arris continuous normals while
 // retaining the planar riser and individually jointed closed stone volume.
 source.deleteAttribute('normal');source.deleteAttribute('uv');const g=mergeVertices(source,.000001);source.dispose();g.computeVertexNormals();
 const q=g.attributes.position,uv=[];for(let i=0;i<q.count;i++)uv.push(q.getX(i)*4,q.getZ(i)*4);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.userData.stoneConstruction={closed:true,bevelMetres:r,fullRiserStoneThickness:thickness,surfaceReliefMetres:[-.009,.005],roundedNose212:true,referenceRGBUsed:false};return g;
}
