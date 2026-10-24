import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {configureLotusGilt222} from './lotus-gilt222.js';

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
function petalGeometry(field,radius,height,ring,k,row){
 const rows=60,cols=36,p=[],uv=[],index=[],skins=[];
 const phase=(k+ring.phase)/ring.n*TAU,variant=Math.sin(k*1.91+row*.73),lean=.020*variant;
 function vertex(skin,j,i){
  const v=j/rows,u=j===0||j===rows?0:i/cols*2-1,w=Math.max(0,Math.sin(Math.PI*v));
  const kind=(k+row)%3,cap=Math.pow(w,.62);
  const outline=kind===0?Math.pow(v,.57)*Math.pow(1-v,.86)*2.63:kind===1?Math.pow(v,.78)*Math.pow(1-v,.94)*3.05:Math.pow(v,.74)*Math.pow(1-v,.65)*2.62;
  const width=[.455,.415,.435][kind]*outline*.72;
  // R01 study: short convex cast leaves return toward a narrower pointed
  // crown. Separate vertically staggered tiers expose the return instead of
  // hiding every upper tier behind one long outer tulip cup.
  const meridian=(.30+.012*kind)*v+(.55-.012*kind)*Math.sin(Math.PI*.84*v);
  const cup=-(kind===2?.025:.034)*Math.sin(Math.PI*v*.92)*Math.pow(Math.max(0,1-u*u),.70);
  const rib=.017*Math.exp(-Math.pow(u/.17,2))*w;
  const rolled=.016*Math.pow(Math.abs(u),5)*w*(.52+.48*v);
  const chased=-.004*w*(Math.exp(-Math.pow((u-.79)/.075,2))+Math.exp(-Math.pow((u+.79)/.075,2)));
  const tangent=radius*ring.scale*(u*width*(1+.045*(kind-1)*w*u)+(kind-1)*.032*v*v*w);
  const thickness=radius*(.0028+.0030*w);
  const r=radius*(ring.rr+ring.scale*(meridian+cap*(cup+rib+rolled+chased)))+(skin===0?thickness:-thickness);
  const y=height*(ring.base+ring.span*(v+.032*w*u*u-.018*(kind-1)*u*w));
  const angle=phase+lean*w,id=p.length/3;
  p.push(Math.sin(angle)*r+Math.cos(angle)*tangent,y,Math.cos(angle)*r-Math.sin(angle)*tangent);uv.push((u+1)/2,v);return id;
 }
 for(let skin=0;skin<2;skin++){
  const lines=[];
  for(let j=0;j<=rows;j++)lines.push(j===0||j===rows?[vertex(skin,j,0)]:Array.from({length:cols+1},(_,i)=>vertex(skin,j,i)));
  skins.push(lines);
  const tri=(a,c,d)=>skin===0?index.push(a,c,d):index.push(a,d,c);
  // Real triangle fans make a single pointed apex. No coincident tip row,
  // rectangular tab, perforated slit or zero-area tip triangles.
  for(let i=0;i<cols;i++)tri(lines[0][0],lines[1][i+1],lines[1][i]);
  for(let j=1;j<rows-1;j++)for(let i=0;i<cols;i++){
   const a=lines[j],c=lines[j+1];tri(a[i],a[i+1],c[i]);tri(a[i+1],c[i+1],c[i]);
  }
  for(let i=0;i<cols;i++)tri(lines[rows-1][i],lines[rows-1][i+1],lines[rows][0]);
 }
 const perimeter=lines=>[lines[0][0],...lines.slice(1,rows).map(r=>r[cols]),lines[rows][0],...lines.slice(1,rows).reverse().map(r=>r[0])];
 const front=perimeter(skins[0]),back=perimeter(skins[1]);
 for(let i=0;i<front.length;i++){const j=(i+1)%front.length;index.push(front[i],back[j],front[j],front[i],back[i],back[j]);}
 const g=geometry(p,uv,index);g.userData.closedCarvedShell=true;g.userData.lotus222={row,k,physicalThicknessRangeInRadius:[.0056,.0136],pointedTipFans:true,rolledMargins:true,pairedChasedGrooves:true};return g;
}
export function buildLayeredLotus222(b,{radius,height,depthAspect,sourceBearing}){
 configureLotusGilt222(b.materials);
 const contact=measuredContour(sourceBearing,depthAspect),field=coreSurface(radius,height,contact),tag='lotus258-r01-'+sourceBearing.sourceBufferSha256.slice(0,16);
 b.add(b.geometry(tag+'-hidden-contact-core',()=>coreGeometry(field,height)),'lotusShadow');
 const rings=[{n:22,base:.015,span:.64,rr:.61,scale:.50,phase:.13},{n:21,base:.23,span:.69,rr:.54,scale:.50,phase:.66},{n:20,base:.59,span:.40,rr:.46,scale:.51,phase:.18}];
 for(const [row,ring]of rings.entries()){
  const parts=Array.from({length:ring.n},(_,k)=>petalGeometry(field,radius,height,ring,k,row));
  const g=b.geometry(tag+'-cast-layer-'+row,()=>mergeGeometries(parts,false));b.add(g,row===1?'lotusGiltSoft':'lotusGold');for(const part of parts)part.dispose();
 }
 b.lathe(tag+'-lower-bearing-foot',[[.44,0],[.56,0],[.605,.012],[.605,.038],[.55,.058],[.45,.058],[.44,0]],0,0,0,radius,1,'lotusShadow',96);
 b.torus(0,.034,0,radius*.545,.007,'lotusEdge',Math.PI/2);
 b.root.userData.sourceLotus222??=[];b.root.userData.sourceLotus222.push({revision:'root258-r01',rows:3,petals:63,sourceContactSha256:sourceBearing.sourceBufferSha256,actualHemContourRetained:true,sourceSculptureEdited:false,construction:'Recessed continuous structural seat plus individually closed overlapping leaves with shorter convex bodies, returned pointed apexes and staggered visible tiers, shallow cupped faces, narrow raised midribs and chased margins; seeded scalar height/roughness masks on ordinary metallic PBR. Inferred reference anatomy and metal finish, not a scan of the supplied seat.',visualAccepted:false});
}
