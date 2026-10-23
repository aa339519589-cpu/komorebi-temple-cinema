import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const TAU=Math.PI*2;
const smooth=(a,b,t)=>{t=T.MathUtils.clamp((t-a)/(b-a),0,1);return t*t*(3-2*t);};
function contourField(profile,depthAspect,radius){
 if(!profile?.outlineXYZ?.length)throw Error('Measured sculpture contact contour missing.');
 const fit=profile.scale,poly=profile.outlineXYZ.map(([x,y,z])=>[x*fit[0]*.985,y*fit[1]+.004,z*fit[2]*.985/depthAspect]);
 return angle=>{
  const dx=Math.sin(angle),dz=Math.cos(angle);let found=null;
  for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],ex=b[0]-a[0],ez=b[2]-a[2],den=dx*ez-dz*ex;
   if(Math.abs(den)<1e-10)continue;
   const s=(a[0]*dz-a[2]*dx)/den;
   if(s<-.00001||s>1.00001)continue;
   const x=a[0]+s*ex,z=a[2]+s*ez,r=x*dx+z*dz;
   if(r>0&&(!found||r>found.r))found={r,y:a[1]+s*(b[1]-a[1])};
  }
  if(!found)throw Error('Source hem ray missed convex contact footprint.');
  return found;
 };
}
function bowlField(radius,height,contact){
 const sections=[[0,.53],[.10,.65],[.30,.84],[.53,.91],[.70,.90],[.84,.84],[1,.78]];
 return(angle,t)=>{
  const top=contact(angle);let k=0;while(k<sections.length-2&&t>sections[k+1][0])k++;
  const a=sections[k],c=sections[k+1],q=smooth(a[0],c[0],t),basic=T.MathUtils.lerp(a[1],c[1],q)*radius;
  const weight=smooth(.72,1,t),wave=Math.pow(Math.sin(Math.PI*t),2);
  const lobing=radius*wave*(.012*Math.cos(angle*16+.24)+.004*Math.sin(angle*7-.71));
  return{r:T.MathUtils.lerp(basic,top.r,weight)+lobing,y:t*height+top.y*Math.pow(t,5)};
 };
}
function closePerimeter(ids,rows,cols,stride){
 const edge=[];for(let i=0;i<cols;i++)edge.push(i);for(let j=0;j<rows;j++)edge.push(j*(cols+1)+cols);for(let i=cols;i>0;i--)edge.push(rows*(cols+1)+i);for(let j=rows;j>0;j--)edge.push(j*(cols+1));
 for(let k=0;k<edge.length;k++){const a=edge[k],c=edge[(k+1)%edge.length];ids.push(a,c+stride,c,a,a+stride,c+stride);}
}
function makeGeometry(p,uv,ids){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.userData.closedCarvedShell=true;return g;}
function continuousBowl(field,height){
 const rows=64,cols=192,p=[],uv=[],ids=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const a=i/cols*TAU,t=j/rows,s=field(a,t);p.push(Math.sin(a)*s.r,s.y,Math.cos(a)*s.r);uv.push(i/cols,t);
  if(j<rows&&i<cols){const q=j*(cols+1)+i;ids.push(q,q+1,q+cols+1,q+1,q+cols+2,q+cols+1);}
 }
 const bottom=p.length/3;p.push(0,0,0);uv.push(.5,.5);const top=p.length/3;p.push(0,height+.004,0);uv.push(.5,.5);
 for(let i=0;i<cols;i++){ids.push(bottom,i+1,i);const q=rows*(cols+1)+i;ids.push(top,q,q+1);}
 const g=makeGeometry(p,uv,ids);g.userData.contact179='Closed continuous lobed bowl, top lofted directly to measured source hem contour; no flat front shelf and no black spaces between independent leaves.';return g;
}
function carvedPatch(field,radius,ring,k,row){
 const rows=40,cols=24,stride=(rows+1)*(cols+1),p=[],uv=[],ids=[];
 const phase=(k+ring.phase)/ring.n*TAU,kind=(k+row)%3;
 const lean=.025*Math.sin(k*1.91+row),end=ring.top+.010*Math.sin(k*2.23-row*.4);
 for(let skin=0;skin<2;skin++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const v=j/rows,u=i/cols*2-1,w=Math.max(0,Math.sin(Math.PI*v));
  const width=Math.pow(w,.70)*(.96+.12*v),a=phase+u*(Math.PI/ring.n)*1.18*width+lean*w;
  const t=T.MathUtils.lerp(ring.base,end,v),s=field(a,t);
  const convex=.010*Math.pow(w,.8)*Math.pow(Math.max(0,1-u*u),.70);
  const rib=.006*w*Math.exp(-Math.pow(u/.16,2));
  const returned=.010*w*Math.pow(Math.abs(u),6);
  const root=-.003*Math.exp(-Math.pow((v-.17)/.15,2))*Math.pow(Math.max(0,1-u*u),.5);
  const chase=-.0025*w*(Math.exp(-Math.pow((u-.57)/.07,2))+Math.exp(-Math.pow((u+.57)/.07,2)));
  const relief=skin===0?radius*(.0035+convex+rib+returned+root+chase):-radius*.007;
  const r=s.r+relief,y=s.y+(skin===0?.003:0)*w*Math.pow(Math.abs(u),4);
  p.push(Math.sin(a)*r,y,Math.cos(a)*r);uv.push(i/cols,v);
  if(j<rows&&i<cols){const q=skin*stride+j*(cols+1)+i;skin===0?ids.push(q,q+1,q+cols+1,q+1,q+cols+2,q+cols+1):ids.push(q,q+cols+1,q+1,q+1,q+cols+1,q+cols+2);}
 }
 closePerimeter(ids,rows,cols,stride);return makeGeometry(p,uv,ids);
}
export function buildLayeredSourceLotus179(b,{radius,height,depthAspect,sourceBearing}){
 const contact=contourField(sourceBearing,depthAspect,radius),field=bowlField(radius,height,contact),tag='adoption179-r07-bowl-'+sourceBearing.sourceBufferSha256.slice(0,16);
 b.add(b.geometry(tag+'-continuous-core',()=>continuousBowl(field,height)),'lotusCore');
 const rings=[{n:16,base:.025,top:.72,phase:.12},{n:17,base:.29,top:.965,phase:.61},{n:18,base:.65,top:.995,phase:.24}],sets=[[],[]];
 for(const [row,ring]of rings.entries())for(let k=0;k<ring.n;k++)sets[(k+row)%5===0?1:0].push(carvedPatch(field,radius,ring,k,row));
 for(let j=0;j<sets.length;j++){
  const geometry=b.geometry(tag+'-overlapping-carved-petals-'+j,()=>{const g=mergeGeometries(sets[j],false);g.userData.closedCarvedShell=true;return g;});
  b.add(geometry,j?'lotusGiltSoft':'lotusGold');for(const p of sets[j])p.dispose();
 }
 b.lathe(tag+'-lower-cast-foot',[[.48,0],[.55,0],[.58,.014],[.58,.035],[.55,.049],[.49,.049],[.48,0]],0,0,0,radius,1,'lotusShadow',64);
 b.torus(0,.035,0,radius*.56,.008,'lotusEdge',Math.PI/2);
 b.root.userData.sourceLotus179??=[];b.root.userData.sourceLotus179.push({revision:'r07',rows:3,petals:51,height,radius,sourceSculptureEdited:false,sourceContactSha256:sourceBearing.sourceBufferSha256,construction:'Continuous concave/convex lobed bowl lofted to actual3D hem contour, carrying overlapping shallow closed solid petal carvings; tips restrained within bowl envelope, with no independent leaf crown or front flat ledge.',visualAccepted:false});
}
