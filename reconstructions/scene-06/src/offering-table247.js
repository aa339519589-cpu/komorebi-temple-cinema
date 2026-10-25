import {attachAuthoredCapital254} from './capital-authored254.mjs';
import {buildApronFoliage248} from './table-apron248.js';
let CAPITAL254=null;
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {TABLE247_REFERENCE_TRACES as TRACE} from './table247-reference-traces.js';

const TAU=Math.PI*2;
export const TABLE247=Object.freeze({revision:'table247-r09c-248-soft-rolled-apron',topY:.733,topWidth:3.72,topDepth:.96,outerX:1.73,innerX:1.075,legDepth:.34,photographicAcceptance:false});
function mats(b){
 if(b.materials.table247Gold)return;
 Object.assign(b.materials,{
  table247Black:new T.MeshPhysicalMaterial({name:'table247-r06-black-urushi-deep-joints',color:'#030202',roughness:.31,clearcoat:.30,clearcoatRoughness:.28,specularIntensity:.38,envMapIntensity:.40}),
  table247Red:new T.MeshPhysicalMaterial({name:'table247-r06-dark-crimson-turned-wood',color:'#260604',roughness:.35,clearcoat:.26,clearcoatRoughness:.30,specularIntensity:.32,envMapIntensity:.27}),
  table247Gold:new T.MeshStandardMaterial({name:'table247-r06-aged-gilt-carved-volume',color:'#967138',metalness:.93,roughness:.44,envMapIntensity:.65}),
  table247Chased:new T.MeshStandardMaterial({name:'table247-r06-gilt-with-actual-incised-cavities',color:'#aa8b51',vertexColors:true,metalness:.94,roughness:.39,envMapIntensity:.68}),
  table247Recess:new T.MeshStandardMaterial({name:'table247-r06-dark-gilt-undercuts',color:'#523916',metalness:.88,roughness:.57,envMapIntensity:.48}),
  table247Edge:new T.MeshStandardMaterial({name:'table247-r06-soft-worn-arris',color:'#ad8b48',metalness:.93,roughness:.40,envMapIntensity:.65}),
 });
}
function box(b,key,x,y,z,w,h,d,mat='table247Black',r=.005){b.add(b.geometry('247r06-'+key,()=>new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/6,h/6,d/6))),mat,x,y,z);}
function profileAt(profile,y){let i=0;while(i<profile.length-2&&y>profile[i+1][0])i++;const a=profile[i],c=profile[i+1],f=T.MathUtils.smoothstep((y-a[0])/(c[0]-a[0]),0,1);return a[1]+(c[1]-a[1])*f;}
function finishColorNormals247(g){
 const p=g.attributes.position,n=g.attributes.normal,ix=g.index,fix=[];
 for(let t=0;t<ix.count;t+=3){const ids=[ix.getX(t),ix.getX(t+1),ix.getX(t+2)],v=ids.map(i=>new T.Vector3().fromBufferAttribute(p,i)),face=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));if(face.lengthSq()<1e-22)continue;face.normalize();for(let k=0;k<3;k++)if(face.dot(new T.Vector3().fromBufferAttribute(n,ids[k]))<=1e-6)fix.push({corner:t+k,vertex:ids[k],normal:face.toArray()});}
 const arrays=Object.fromEntries(Object.entries(g.attributes).map(([k,a])=>[k,Array.from(a.array)])),indices=Array.from(ix.array);
 for(const f of fix){const next=arrays.position.length/3;indices[f.corner]=next;for(const [name,a]of Object.entries(g.attributes)){if(name==='normal')arrays[name].push(...f.normal);else for(let j=0;j<a.itemSize;j++)arrays[name].push(a.array[f.vertex*a.itemSize+j]);}}
 for(const [name,a]of Object.entries(g.attributes))g.setAttribute(name,new T.Float32BufferAttribute(arrays[name],a.itemSize));g.setIndex(indices);
 // Intentionally retain split hard cap/engraving normals. The inherited
 // builder may not average them again or append uncoloured seam vertices.
 g.userData={...g.userData,closedCarvedShell:true,finalSurfaceNormalsOutward:true,coincidentNormalsSmoothed:true,colorNormalCornersFinished:true,allAttributesExtendedTogether:true,normalCornerSplits:fix.length};return g;
}
// Closed complete radial solids. Depth is authored independently of the photo.
// Physical flutes and fan-cut recesses continue around the whole object.
function turnedGeometry(profile,{rows=96,cols=192,lobes=0,amplitude=0,chased=false}={}){
 const lo=profile[0][0],hi=profile.at(-1)[0],p=[],uv=[],ix=[],color=[];
 for(let j=0;j<=rows;j++)for(let k=0;k<cols;k++){
  const t=j/rows,y=lo+(hi-lo)*t,a=k/cols*TAU,envelope=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.8),base=profileAt(profile,y);
  const flute=amplitude*envelope*(.5+.5*Math.cos(lobes*a+.20*Math.sin(t*Math.PI)));
  const local=Math.atan2(Math.sin(a*4),Math.cos(a*4))/4;let fan=0;
  if(chased)for(let q=-4;q<=4;q++)fan=Math.max(fan,Math.exp(-Math.pow((local-q*(.044+.040*t))/.012,2)));
  const cut=chased?.0032*envelope*fan:0,r=Math.max(.001,base-flute-cut);
  p.push(Math.sin(a)*r,y,Math.cos(a)*r);uv.push(k/cols,t);
  const patina=chased?Math.max(.20,1-.72*fan*envelope-.22*flute/(amplitude||1)):.95;color.push(patina,patina*.96,patina*.86);
  if(j<rows){const n=j*cols+(k+1)%cols,c=j*cols+k;ix.push(c,n,c+cols,n,n+cols,c+cols);}
 }
 for(const j of[0,rows]){const c=p.length/3;p.push(0,lo+(hi-lo)*j/rows,0);uv.push(.5,.5);color.push(.65,.62,.55);for(let k=0;k<cols;k++){const a=j*cols+k,n=j*cols+(k+1)%cols;j===0?ix.push(c,n,a):ix.push(c,a,n);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.setIndex(ix);g.computeVertexNormals();g.userData={closedCarvedShell:true,table247:true,construction:'full closed radial support, chased geometry recesses, real solid end caps'};return finishColorNormals247(g);
}
function turned(b,key,profile,x,z,mat='table247Gold',opts={}){b.add(b.geometry('247r07-shared-turned-'+JSON.stringify([profile,opts]),()=>turnedGeometry(profile,opts)),mat,x,0,z);}
function cuff(b,key,x,y,z,r,h=.012,mat='table247Gold'){
 turned(b,'cuff-'+key,[[y-h/2,r-.003],[y-h*.25,r],[y+h*.25,r],[y+h/2,r-.003]],x,z,mat,{rows:12,cols:96,lobes:24,amplitude:.0009});
}
function shapeFrom(points){const s=new T.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();return s;}
function roundRect(w,h,r){const s=new T.Shape(),x=w/2,y=h/2;s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);s.lineTo(-x+r,y);s.quadraticCurveTo(-x,y,-x,y-r);s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);return s;}
function reliefGeometry(points,depth=.025,bulge=.004,holes=[]){
 const outer=points.map(p=>new T.Vector2(...p));if(!T.ShapeUtils.isClockWise(outer))outer.reverse();const s=shapeFrom(outer.map(p=>p.toArray()));
 for(const h of holes){let contour=h.map(p=>new T.Vector2(...p));if(T.ShapeUtils.isClockWise(contour))contour.reverse();const sample=contour.length===4?contour:new T.SplineCurve([...contour,contour[0]]).getPoints(contour.length*8);if(T.ShapeUtils.isClockWise(sample))sample.reverse();const p=new T.Path();p.moveTo(sample[0].x,sample[0].y);for(const v of sample.slice(1))p.lineTo(v.x,v.y);p.closePath();s.holes.push(p);}
 const g=new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:3,curveSegments:24}),p=g.attributes.position;g.computeBoundingBox();const bb=g.boundingBox,cx=(bb.min.x+bb.max.x)/2,rx=(bb.max.x-bb.min.x)/2||1,cy=(bb.min.y+bb.max.y)/2,ry=(bb.max.y-bb.min.y)/2||1;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),u=(x-cx)/rx,v=(y-cy)/ry;p.setZ(i,z+T.MathUtils.smoothstep(z,0,depth)*bulge*Math.max(0,1-u*u)*Math.max(0,1-v*v));}
 g.computeVertexNormals();g.userData={closedCarvedShell:true,table247:true,construction:'manual contour -> curved thick solid with rear and side returns; depth independently authored'};return g;
}
function relief(b,key,points,depth,x,y,z,mat='table247Gold',ry=0,bulge=.004,holes=[]){b.add(b.geometry('247r07-relief-'+key,()=>reliefGeometry(points,depth,bulge,holes)),mat,x,y,z,1,1,1,0,ry,0);}
// Broad rolled carved strokes with capped ends, changing leaf-like section.
function scrollGeometry(points,width=.016,depth=.015){
 const c=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),rows=72,cols=16,p=[],uv=[],ix=[];
 for(let j=0;j<=rows;j++){
  const t=j/rows,v=c.getPoint(t),d=c.getTangent(t),l=Math.hypot(d.x,d.y)||1,nx=-d.y/l,ny=d.x/l,env=.35+.65*Math.pow(Math.sin(Math.PI*t),.8),shoulder=1+.45*Math.exp(-Math.pow((t-.28)/.12,2));
  for(let k=0;k<cols;k++){const a=k/cols*TAU,u=Math.cos(a),vZ=Math.sin(a),w=width*env*shoulder*(1+.10*Math.sin(7*Math.PI*t)),ridge=Math.max(0,vZ)*.0020*(1-Math.abs(u))*Math.sin(Math.PI*t);p.push(v.x+nx*u*w/2,v.y+ny*u*w/2,v.z+vZ*depth/2*env+ridge);uv.push(k/cols,t);if(j<rows){const q=j*cols+k,n=j*cols+(k+1)%cols;ix.push(q,n,q+cols,n,n+cols,q+cols);}}
 }
 for(const j of[0,rows]){const v=c.getPoint(j/rows),ci=p.length/3;p.push(v.x,v.y,v.z);uv.push(.5,.5);for(let k=0;k<cols;k++){const a=j*cols+k,n=j*cols+(k+1)%cols;j===0?ix.push(ci,n,a):ix.push(ci,a,n);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.userData={closedCarvedShell:true,mergeUniqueCarving:true,table247:true,construction:'capped rolled nonround carving, traced route, curved across its actual depth'};return g;
}
function scroll(b,key,points,w=.016,d=.015,mat='table247Gold'){b.add(b.geometry('247r06-scroll-'+key,()=>scrollGeometry(points,w,d)),mat);}
function carvedLeaf(b,key,x,y,z,len=.044,w=.022,angle=0,hand=1,mat='table247Gold',face=1){
 const pts=[[0,0],[-w*.25,len*.10],[-w*.50,len*.33],[-w*.22,len*.47],[-w*.43,len*.66],[-w*.18,len*.77],[0,len],[w*.18,len*.77],[w*.43,len*.66],[w*.22,len*.47],[w*.50,len*.33],[w*.25,len*.10]].map(([u,v])=>[hand*u,v]);
 const g=b.geometry('247r07-leaf-'+len+'-'+w+'-'+hand,()=>{const g=reliefGeometry(pts,.009,.004),p=g.attributes.position;for(let i=0;i<p.count;i++){const xx=p.getX(i),yy=p.getY(i),zz=p.getZ(i);p.setZ(i,zz-T.MathUtils.smoothstep(zz,0,.009)*.0016*Math.exp(-Math.pow(xx/(w*.09),2))*Math.sin(Math.max(0,Math.min(1,yy/len))*Math.PI));}g.computeVertexNormals();return g;});b.add(g,mat,x,y,z,1,1,1,0,face<0?Math.PI:0,angle);
}
function capital(b,key,x,z,inner){
 // Original R08 real rear bearing/rebate retained exactly. Only old gold
 // shell and its three-void/leaf ornament are replaced by source254.
 box(b,'capital-real-timber-bearing-'+key,x,inner?.649:.678,z-.004,inner?.185:.177,inner?.135:.060,.148,'table247Black',.007);
 box(b,'capital-upper-black-rebate-'+key,x,.715,z+.027,inner?.428:.231,.014,.122,'table247Black',.003);
 if(!CAPITAL254)throw Error('254 authored source not loaded');
 const mount=attachAuthoredCapital254(b,CAPITAL254,{variant:inner?'inner':'outer',x,postLocalZ:z,hand:x<0?-1:1,materialKeys:{'authored-gilt-carved-wood':'table247Gold','authored-rear-cut-and-mount-wood':'table247Black'}});
 b.root.userData.capital254Mounts??=[];b.root.userData.capital254Mounts.push({key,...mount});
}
function foot(b,key,x,z,floorY,inner=false){
 const w=inner?.222:.236,d=inner?.210:.222;
 box(b,'sole-'+key,x,floorY+.010,z,w+.012,.020,d+.012,'table247Recess',.004);
 box(b,'sole-lip-'+key,x,floorY+.021,z,w+.012,.006,d+.012,'table247Edge',.002);
 box(b,'closed-lower-cove-'+key,x,-.009,z,w-.004,.034,d-.004,'table247Gold',.008);
 // Curved reduced plinth -> real recessed framed face -> top moulding.
 const lower=[[floorY+.024,w/2],[floorY+.031,w/2],[floorY+.038,w/2-.010],[.005,w/2-.013]];
 // Four-sided body has complete thickness; front panels and side returns
 // are mounted on its real walls, not floating squares.
 box(b,'foot-dark-core-'+key,x,.0575,z,w-.022,.105,d-.020,'table247Recess',.010);
 for(const face of[-1,1]){
  const sh=roundRect(w-.022,.120,.012),h=new T.Path();h.absellipse(0,0,.075,.056,0,TAU,true);sh.holes.push(h);
  const g=b.geometry('247r07-foot-front-frame-'+(inner?'inner':'outer'),()=>{const g=new T.ExtrudeGeometry(sh,{depth:.013,steps:1,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:3,curveSegments:40});g.userData={closedCarvedShell:true,table247:true};return g;});
  b.add(g,'table247Gold',x,.0575,z+face*(d/2-.014),1,1,1,0,face<0?Math.PI:0,0);
  const disc=b.geometry('247r06-foot-closed-round-chased-medallion',()=>{
   const profile=[[0,.053],[.004,.055],[.008,.051],[.013,.034],[.015,.001]];
   const g=turnedGeometry(profile,{rows:48,cols:128,lobes:12,amplitude:.0014,chased:true});g.rotateX(Math.PI/2);g.userData.closedCarvedShell=true;return g;
  });
  b.add(disc,'table247Chased',x,.0575,z+face*(d/2-.012),.8/(.84*.74),1,1,0,face<0?Math.PI:0,0);
 }
 box(b,'foot-bottom-ogee-'+key,x,-.002,z,w,.018,d,'table247Gold',.006);
 box(b,'foot-top-ogee-'+key,x,.112,z,w-.006,.019,d-.006,'table247Gold',.005);
 cuff(b,'foot-lower-gilt-bead-'+key,x,.124,z,.061,.010,'table247Edge');
 turned(b,'foot-layered-neck-'+key,TRACE.foot.neckProfile,x,z,inner?'table247Black':'table247Chased',{rows:72,cols:128,lobes:24,amplitude:.0014,chased:!inner});
 for(const yy of[.142,.165,.181,.202])cuff(b,'foot-layer-'+key+'-'+yy,x,yy,z,yy===.165?.060:.054,.007,'table247Gold');
}
function innerLeg(b,key,x,z,floorY,side){
 foot(b,key,x,z,floorY,true);
 turned(b,'inner-dark-red-turned-core-'+key,TRACE.innerLeg.profile,x,z,'table247Red',{rows:144,cols:128,lobes:8,amplitude:.0007});
 for(const [y,r,h,mat]of[[.219,.058,.011,'table247Gold'],[.300,.050,.013,'table247Black'],[.321,.047,.009,'table247Gold'],[.357,.049,.010,'table247Gold'],[.409,.047,.009,'table247Gold'],[.493,.043,.011,'table247Gold'],[.531,.048,.014,'table247Chased'],[.571,.050,.012,'table247Gold']])cuff(b,'inner-tier-'+key+'-'+y,x,y,z,r,h,mat);
 // Photo-traced open C-scrolls, front and back, with independent rounded
 // section and true ends embedded in the turned wood. No wave-shaped pole.
 for(const face of[-1,1])for(const [name,pts,w]of[['lower',TRACE.innerLeg.lowerScroll,.017],['upper',TRACE.innerLeg.upperScroll,.018],['stem',TRACE.innerLeg.stem,.012]]){
  const traced=pts.map(([u,y],j)=>{const r=profileAt(TRACE.innerLeg.profile,y),surface=Math.sqrt(Math.max(.0002,r*r-u*u))-.001,embed=name==='stem'||j===0||j===pts.length-1;return[x-side*u,y,z+face*(embed?surface:.049+.009*Math.sin(j/(pts.length-1)*Math.PI))];});scroll(b,'inner-'+key+'-'+face+'-'+name,traced,w,.014);
 }
 for(const [j,y,u]of[[0,.235,-.054],[1,.369,-.080],[2,.425,-.076],[3,.482,-.015]])carvedLeaf(b,'inner-attached-fan-'+key+'-'+j,x-side*u,y,z+(j===3?.038:.058),.039,.025,side*.70,side);
 capital(b,key,x,z,true);
}
function outerLeg(b,key,x,z,floorY,front=true){
 foot(b,key,x,z,floorY,false);
 turned(b,'outer-red-shaft-'+key,front?[[.210,.045],[.248,.045],[.300,.043],[.350,.043],[.370,.044]]:[[.210,.045],[.30,.043],[.44,.043],[.53,.047],[.60,.052],[.655,.055]],x,z,'table247Red',{rows:112,cols:128,lobes:12,amplitude:.0006});
 // The reference head is a solid chased/fluted weight-bearing bulb. The
 // rejected pierced pair of coffee-bean plates is completely absent.
 if(front){turned(b,'solid-sculpted-head-'+key,TRACE.outerHead.radialProfile,x,z,'table247Chased',{rows:128,cols:384,lobes:8,amplitude:.0048,chased:true});turned(b,'sculpted-neck-'+key,TRACE.outerNeck.radialProfile,x,z,'table247Gold',{rows:112,cols:192,lobes:6,amplitude:.0030,chased:true});}
 for(const yy of[.354,.507,.543,.623])cuff(b,'outer-neck-cuff-'+key+'-'+yy,x,yy,z,yy<.52?.043:.051,.008,'table247Edge');
 if(front)for(let j=0;j<3;j++)carvedLeaf(b,'neck-carved-fan-'+key+'-'+j,x+(j-1)*.021,.551,z+.026,.058,.023,(j-1)*.28,j===0?-1:1);
 capital(b,key,x,z,false);
}
function apron(b,z,side=1){
 const front=z+side*.405;
 box(b,'upper-through-rail-'+side,0,.688,front,3.57,.041,.105,'table247Black',.007);
 box(b,'under-apron-rail-'+side,0,.605,front,3.51,.024,.080,'table247Black',.005);
 box(b,'apron-fine-top-bead-'+side,0,.712,front+side*.056,3.60,.004,.007,'table247Gold',.001);
 box(b,'apron-fine-bottom-bead-'+side,0,.595,front+side*.044,3.51,.004,.007,'table247Recess',.001);
 buildApronFoliage248(b,z,side);
 // Solid curving angle braces enter both the post and the real end aprons.
 for(const hand of[-1,1]){
  const outline=[[0,.685],[-hand*.16,.685],[-hand*.15,.646],[-hand*.115,.623],[-hand*.081,.578],[-hand*.055,.548],[0,.548]];
  relief(b,'outer-structural-knee-'+side+'-'+hand,outline,.060,hand*1.73,0,z+side*.355,'table247Black',side<0?Math.PI:0,.005);
 }
}
export function buildOfferingJoinery247(b,layout,z,floorY,sources){
 mats(b);CAPITAL254=sources.capital254;
 // Thinner actual rim exposes the deep carved apron instead of a wide plain
 // fascia. The6.6mm lower top is table-only; no retained ritual axis moves.
 box(b,'closed-lid',0,.715,z,3.72,.028,.958,'table247Black',.007);
 box(b,'lid-rolled-edge',0,.730,z,3.735,.006,.966,'table247Gold',.002);
 box(b,'rebated-underside',0,.697,z+.005,3.60,.020,.866,'table247Black',.005);
 box(b,'inset-waist',0,.677,z+.005,3.51,.026,.776,'table247Black',.004);
 apron(b,z,1);apron(b,z,-1);
 for(const side of[-1,1]){
  box(b,'end-apron-'+side,side*1.73,.655,z,.102,.098,.78,'table247Black',.008);
  for(const dz of[-.34,.34])outerLeg(b,'outer-'+side+'-'+dz,side*1.73,z+dz,floorY,dz>0);
  innerLeg(b,'inner-'+side,side*1.075,z+.34,floorY,side);
  box(b,'low-end-stretcher-'+side,side*1.73,.140,z,.061,.045,.69,'table247Red',.005);
  box(b,'low-front-side-stretcher-'+side,side*1.40,.142,z+.34,.65,.045,.056,'table247Red',.005);
 }
 box(b,'rear-lower-brace',0,.180,z-.34,3.46,.052,.067,'table247Black',.006);
 b.root.userData.offeringTable247={...TABLE247,traceSource:TRACE.source,depthAuthoring:TRACE.uncertainty,localFloor:floorY,structure:'closed thin lid, inset waist, sparse curved foliate groups with rolled edges and closed actual chased surfaces; retained 254 capitals and true timber bearings, two visible full chased bulb heads, four real outer posts, tiered dark-red turned inner cores, returned carved scrolls and six floor-bearing feet',apronRefinement248:b.root.userData.apron248,headIsSolid:true,rearHeadInference:TRACE.outerHead.scope,coffeeBeanRingsRemoved:true,compressedDragonFriezeRemoved:true,footCentersUnchanged:true,ritualGeometryAndAnchorsUnchanged:true,cushion:'255R06 unchanged to isolate apron carving; generated textile remains approximate',closedAuthoredGeometry:true,photographicAcceptance:false};
 b.root.userData.offeringJoinery198=b.root.userData.offeringTable247;
}
