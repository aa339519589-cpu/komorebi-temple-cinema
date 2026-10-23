import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const TAU=2*Math.PI;
const smooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function measuredContour(profile,depthAspect){
 if(!profile?.outlineXYZ?.length)throw Error('Lotus222 requires actual source hem');
 const scale=profile.scale,points=profile.outlineXYZ.map(([x,y,z])=>[x*scale[0]*.985,y*scale[1]+.004,z*scale[2]*.985/depthAspect]);
 return angle=>{
  const dx=Math.sin(angle),dz=Math.cos(angle);let hit;
  for(let i=0;i<points.length;i++){
   const a=points[i],c=points[(i+1)%points.length],ex=c[0]-a[0],ez=c[2]-a[2],den=dx*ez-dz*ex;
   if(Math.abs(den)<1e-10)continue;
   const u=(a[0]*dz-a[2]*dx)/den;if(u<-.00001||u>1.00001)continue;
   const x=a[0]+u*ex,z=a[2]+u*ez,r=x*dx+z*dz;
   if(r>0&&(!hit||r>hit.r))hit={r,y:a[1]+u*(c[1]-a[1])};
  }
  if(!hit)throw Error('Lotus222 hem ray missed');return hit;
 };
}
function geometry(p,uv,index){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
}
function coreSurface(radius,height,contact){
 return(angle,t)=>{
  const hem=contact(angle),blend=smooth(.79,1,t);
  const hidden=radius*(.505+.225*Math.sin(Math.PI*t*.84));
  return{r:T.MathUtils.lerp(hidden,hem.r,blend),y:t*height+hem.y*Math.pow(t,5)};
 };
}
function coreGeometry(field,height){
 const rows=72,cols=192,p=[],uv=[],index=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const a=i/cols*TAU,s=field(a,j/rows);p.push(Math.sin(a)*s.r,s.y,Math.cos(a)*s.r);uv.push(i/cols,j/rows);
  if(j<rows&&i<cols){const q=j*(cols+1)+i;index.push(q,q+1,q+cols+1,q+1,q+cols+2,q+cols+1);}
 }
 const bottom=p.length/3;p.push(0,0,0);uv.push(.5,.5);const top=p.length/3;p.push(0,height+.004,0);uv.push(.5,.5);
 for(let i=0;i<cols;i++){index.push(bottom,i+1,i);const q=rows*(cols+1)+i;index.push(top,q,q+1);}
 return geometry(p,uv,index);
}
function petalGeometry(field,radius,ring,k,row){
 const rows=60,cols=36,stride=(rows+1)*(cols+1),p=[],uv=[],index=[];
 const phase=(k+ring.phase)/ring.n*TAU,variant=Math.sin(k*1.91+row*.73),lean=.020*variant;
 for(let skin=0;skin<2;skin++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const v=j/rows,u=i/cols*2-1,w=Math.max(0,Math.sin(Math.PI*v));
  // Finite returned tip/root sections retain physical thickness instead of
  // collapsing whole rows into duplicate vertices and degenerate triangles.
  const width=.035+.965*Math.pow(w,.70)*(1+.09*variant*v);
  const angle=phase+u*Math.PI/ring.n*1.14*width+lean*w;
  const t=T.MathUtils.lerp(ring.base,ring.top,v),s=field(angle,t);
  const shoulder=.174*Math.pow(w,1.1);
  const cup=-.045*Math.pow(w,.70)*Math.pow(Math.max(0,1-u*u),.68);
  const rolled=.037*Math.pow(w,.80)*Math.pow(Math.abs(u),4);
  const keel=.017*w*Math.exp(-Math.pow(u/.20,2));
  const chase=-.009*w*(Math.exp(-Math.pow((u-.56)/.075,2))+Math.exp(-Math.pow((u+.56)/.075,2)));
  const turn=-.026*smooth(.77,1,v),root=-.018*(1-smooth(0,.20,v));
  const thickness=.0028+.0040*w;
  const relief=radius*(shoulder+cup+rolled+keel+chase+turn+root+(skin===0?thickness:-thickness));
  const r=s.r+relief,y=s.y+radius*(.009*w*u*u+.005*variant*u*w);
  p.push(Math.sin(angle)*r,y,Math.cos(angle)*r);uv.push(i/cols,v);
  if(j<rows&&i<cols){const q=skin*stride+j*(cols+1)+i;skin===0?index.push(q,q+1,q+cols+1,q+1,q+cols+2,q+cols+1):index.push(q,q+cols+1,q+1,q+1,q+cols+1,q+cols+2);}
 }
 const edge=[];for(let i=0;i<cols;i++)edge.push(i);for(let j=0;j<rows;j++)edge.push(j*(cols+1)+cols);for(let i=cols;i>0;i--)edge.push(rows*(cols+1)+i);for(let j=rows;j>0;j--)edge.push(j*(cols+1));
 for(let i=0;i<edge.length;i++){const a=edge[i],c=edge[(i+1)%edge.length];index.push(a,c+stride,c,a,a+stride,c+stride);}
 const g=geometry(p,uv,index);g.userData.closedCarvedShell=true;g.userData.lotus222={row,k,physicalThicknessRangeInRadius:[.0056,.0136],rolledMargins:true,pairedChasedGrooves:true};return g;
}
export function buildLayeredLotus222(b,{radius,height,depthAspect,sourceBearing}){
 const contact=measuredContour(sourceBearing,depthAspect),field=coreSurface(radius,height,contact),tag='lotus222-r01-'+sourceBearing.sourceBufferSha256.slice(0,16);
 b.add(b.geometry(tag+'-hidden-contact-core',()=>coreGeometry(field,height)),'lotusShadow');
 const rings=[{n:12,base:.035,top:.67,phase:.13},{n:14,base:.30,top:.92,phase:.66},{n:16,base:.63,top:.995,phase:.18}];
 for(const [row,ring]of rings.entries()){
  const parts=Array.from({length:ring.n},(_,k)=>petalGeometry(field,radius,ring,k,row));
  const g=b.geometry(tag+'-cast-layer-'+row,()=>mergeGeometries(parts,false));b.add(g,row===1?'lotusGiltSoft':'lotusGold');for(const part of parts)part.dispose();
 }
 b.lathe(tag+'-lower-bearing-foot',[[.44,0],[.52,0],[.565,.016],[.565,.036],[.53,.052],[.45,.052],[.44,0]],0,0,0,radius,1,'lotusShadow',96);
 b.torus(0,.034,0,radius*.545,.007,'lotusEdge',Math.PI/2);
 b.root.userData.sourceLotus222??=[];b.root.userData.sourceLotus222.push({revision:'r01',rows:3,petals:42,sourceContactSha256:sourceBearing.sourceBufferSha256,actualHemContourRetained:true,sourceSculptureEdited:false,construction:'Recessed continuous structural seat plus three individually closed overlapping metal-petal layers, rolled margins, double chased grooves and returned tips; inferred reference anatomy, not a scan of the supplied seat.',visualAccepted:false});
}
