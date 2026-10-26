import * as T from 'three';
import {porchFloorHeight352} from './porch-ground352.js';

// Scene08 entry only. Dimensions are authored metres. The floral front is
// independently licensed source sculpture, not the comparison photograph.
const TAU=Math.PI*2,clamp=T.MathUtils.clamp;
const hash=(x,y=0)=>{const n=Math.sin(x*127.1+y*311.7+352)*43758.5453;return n-Math.floor(n);};

function rounded(w,h,r){
 const s=new T.Shape(),x=w/2,y=h/2;r=Math.min(r,x*.8,y*.8);
 s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);s.lineTo(-x+r,y);s.quadraticCurveTo(-x,y,-x,y-r);s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);s.closePath();return s;
}
function cast(shape,depth,bevel=.002){
 const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:18,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3});g.translate(0,0,-depth/2);return g;
}
function ring(w,h,t,depth,r=.02){const s=rounded(w,h,r),p=rounded(w-2*t,h-2*t,Math.max(.002,r-t));s.holes.push(new T.Path(p.getPoints(18).reverse()));return cast(s,depth,Math.min(.002,t*.2));}

// Position-preserving spatial source selection. Front-facing source faces
// inside a fixed ellipse are kept; their original normals are retained.
// Every selected component gets a reversed offset back and boundary walls.
// A greedy manifold guard omits source duplicates rather than filling the
// source's pierced channels. All output edges are audited, not inferred from
// the fact that Three can draw the mesh. The jagged submillimetre crop edge
// remains behind the physical perimeter moulding.
export function sourceFlower352(source){
 const cx=-.110,cy=.025,rx=.150,ry=.065,thickness=.0015;
 const vertices=[],normal=[],faceList=[],vertexMap=new Map(),edges=new Map();let duplicates=0;
 for(const part of source.parts){
  const p=part.attributes.position,n=part.attributes.normal,ix=part.index,local=new Map();
  const vertex=id=>{if(local.has(id))return local.get(id);const q=[p.getX(id)-cx,p.getY(id)-cy,p.getZ(id)].map(Math.fround),key=q.map(v=>Math.round(v*1e8)).join(',');if(!vertexMap.has(key)){vertexMap.set(key,vertices.length);vertices.push(q);normal.push([n.getX(id),n.getY(id),n.getZ(id)]);}const i=vertexMap.get(key);local.set(id,i);return i;};
  for(let t=0;t<ix.count;t+=3){
   const ids=[ix.getX(t),ix.getX(t+1),ix.getX(t+2)],a=ids.map(i=>[p.getX(i),p.getY(i),p.getZ(i)]),x=(a[0][0]+a[1][0]+a[2][0])/3,y=(a[0][1]+a[1][1]+a[2][1])/3;
   if(((x-cx)/rx)**2+((y-cy)/ry)**2>1)continue;
   const cross=new T.Vector3(...a[1]).sub(new T.Vector3(...a[0])).cross(new T.Vector3(...a[2]).sub(new T.Vector3(...a[0])));
   if(cross.z<=0||cross.z/Math.max(1e-20,cross.length())<.06)continue;
   const f=ids.map(vertex);if(new Set(f).size!==3)continue;
   let valid=true;for(let k=0;k<3;k++){const u=f[k],v=f[(k+1)%3],key=u<v?u+','+v:v+','+u,old=edges.get(key);if(old&&(old.count>=2||(old.a===u&&old.b===v))){valid=false;break;}}
   if(!valid){duplicates++;continue;}faceList.push(f);
   for(let k=0;k<3;k++){const u=f[k],v=f[(k+1)%3],key=u<v?u+','+v:v+','+u,old=edges.get(key);if(old)old.count++;else edges.set(key,{a:u,b:v,count:1});}
  }
 }
 let filtered=faceList,bowtieCuts=0;
 for(let pass=0;pass<16;pass++){
  edges.clear();for(const f of filtered)for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3],key=a<b?a+','+b:b+','+a,old=edges.get(key);if(old)old.count++;else edges.set(key,{a,b,count:1});}
  const degree=new Map();for(const e of edges.values())if(e.count===1){degree.set(e.a,(degree.get(e.a)??0)+1);degree.set(e.b,(degree.get(e.b)??0)+1);}
  const bad=new Set([...degree].filter(([,n])=>n!==2).map(([i])=>i));if(!bad.size)break;
  const next=filtered.filter(f=>!f.some(i=>bad.has(i)));bowtieCuts+=filtered.length-next.length;filtered=next;
 }
 const pp=[],nn=[],ww=[],ii=[],N=vertices.length;let minZ=Infinity,maxZ=-Infinity,boundaries=0;
 for(const p of vertices){minZ=Math.min(minZ,p[2]);maxZ=Math.max(maxZ,p[2]);}
 for(let i=0;i<N;i++){pp.push(...vertices[i]);nn.push(...normal[i]);ww.push(clamp((vertices[i][2]+.008)/.018,0,1));}
 for(let i=0;i<N;i++){pp.push(vertices[i][0],vertices[i][1],vertices[i][2]-thickness);nn.push(...normal[i].map(v=>-v));ww.push(0);}
 for(const f of filtered){ii.push(...f);ii.push(f[2]+N,f[1]+N,f[0]+N);}
 for(const {a,b,count}of edges.values())if(count===1){
  const pa=vertices[a],pb=vertices[b],side=new T.Vector3(pb[1]-pa[1],pa[0]-pb[0],0).normalize(),start=pp.length/3;
  for(const id of[b,a,a+N,b+N]){pp.push(...pp.slice(id*3,id*3+3));nn.push(side.x,side.y,0);ww.push(0);}
  ii.push(start,start+1,start+2,start,start+2,start+3);boundaries++;
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('normal',new T.Float32BufferAttribute(nn,3));g.setAttribute('raised352',new T.Float32BufferAttribute(ww,1));g.setIndex(ii);g.translate(0,0,thickness-minZ);g.computeBoundingBox();g.computeBoundingSphere();
 const audit=closedAudit352(g);if(audit.badEdges)throw Error('352 source shell has unclosed edges: '+audit.badEdges);
 g.userData.source352={selection:{center:[cx,cy],radii:[rx,ry],rule:'Source front-face centroid inside ellipse; position-weld 1e-8m; original corners/normals retained except coincident source seams; rigid/uniform fitting'},retainedSourceTriangles:filtered.length,omittedBowtieNeighborhoodFaces:bowtieCuts,rejectedDuplicateOrNonmanifoldFaces:duplicates,authoredBackTriangles:filtered.length,boundaryWallTriangles:boundaries*2,authoredShellThickness:thickness,originalZBounds:[minZ,maxZ],closedShellAudit:audit,sourceURL:'https://sketchfab.com/3d-models/wood-carving-93766a4c12eb4c278d23294582034e8c',author:'Diana Liu / Thunk3D scanner',license:'CC-BY-4.0',exactReferenceMotif:false,referenceImageUsed:false};
 return g;
}
export function closedAudit352(g){
 const p=g.attributes.position,ix=g.index,edges=new Map(),weld=new Map(),ids=[];
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e8)).join(',');if(!weld.has(key))weld.set(key,weld.size);ids.push(weld.get(key));}
 for(let i=0;i<ix.count;i+=3){const f=[ids[ix.getX(i)],ids[ix.getX(i+1)],ids[ix.getX(i+2)]];if(new Set(f).size<3)continue;for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3];const key=a<b?a+','+b:b+','+a,old=edges.get(key)??{count:0,balance:0};old.count++;old.balance+=a<b?1:-1;edges.set(key,old);}}
 const distribution={};for(const e of edges.values()){const k=e.count+':'+e.balance;distribution[k]=(distribution[k]??0)+1;}
 return{distribution,weldToleranceMetres:1e-8,triangles:ix.count/3,edges:edges.size,badEdges:[...edges.values()].filter(e=>e.count!==2||e.balance!==0).length};
}

// Sweep a closed cross-section along an actual member axis. Side/cap UVs
// are metres; the source lacquer grain does not stretch once per whole post.
function member(profile,a,b,{edgeWear=0,seed=0}={}){
 const axis=new T.Vector3(...b).sub(new T.Vector3(...a)),length=axis.length();axis.normalize();
 const side=new T.Vector3().crossVectors(axis,new T.Vector3(0,1,0));if(side.length()<.1)side.set(1,0,0);side.normalize();const up=new T.Vector3().crossVectors(side,axis).normalize();
 const p=[],uv=[],idx=[],count=profile.length,steps=Math.max(1,Math.ceil(length/.12));
 let perimeter=0;const sums=[0];for(let i=0;i<count;i++){perimeter+=Math.hypot(profile[(i+1)%count][0]-profile[i][0],profile[(i+1)%count][1]-profile[i][1]);sums.push(perimeter);}
 for(let j=0;j<=steps;j++)for(let i=0;i<=count;i++){
  const t=j/steps,[x,y]=profile[i%count],wear=edgeWear*(.18+.82*hash(i%count+seed,j))*(.5+.5*Math.sin(t*length*19+seed)**2),q=new T.Vector3(...a).addScaledVector(axis,t*length).addScaledVector(side,x-Math.sign(x)*wear).addScaledVector(up,y-Math.sign(y)*wear*.35);p.push(...q.toArray());uv.push(t*length,sums[i]);
 }
 for(let j=0;j<steps;j++)for(let i=0;i<count;i++){const a=j*(count+1)+i,b=a+count+1;idx.push(a,b,a+1,a+1,b,b+1);}
 const cap=T.ShapeUtils.triangulateShape(profile.map(p=>new T.Vector2(...p)),[]);
 for(const f of cap){idx.push(f[2],f[1],f[0]);const q=steps*(count+1);idx.push(q+f[0],q+f[1],q+f[2]);}
 // The side/up frame has determinant -1 relative to the member axis.
 // Reverse the complete closed shell, including both caps, before normals.
 for(let i=0;i<idx.length;i+=3)[idx[i+1],idx[i+2]]=[idx[i+2],idx[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function octagon(w,h,r=.008){const x=w/2,y=h/2;return[[-x+r,-y],[-x,-y+r],[-x,y-r],[-x+r,y],[x-r,y],[x,y-r],[x,-y+r],[x-r,-y]];}

// A genuinely modelled, curled cast petal, not a bevelled flat decal.
// Its upper skin cups into a concave throat, folds over a median ridge and
// rises at the tip. A separate underside and all perimeter walls close it.
function curledPetal352(length,width,curl,seed){
 const rows=14,cols=8,p=[],uv=[],idx=[],raised=[],stride=cols+1,count=(rows+1)*stride;
 for(let layer=0;layer<2;layer++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const t=j/rows,u=i/cols*2-1,ww=width*(.045+.955*Math.pow(Math.sin(t*Math.PI),.62)),x=u*ww+Math.sin(t*Math.PI)*length*.08*Math.sin(seed),y=length*t,z=curl*(.26*Math.sin(t*Math.PI)+.74*t*t)+width*.24*u*u*Math.sin(t*Math.PI)-width*.08*(1-u*u)*Math.sin(t*Math.PI*2);
  p.push(x,y,z-(layer?.0045:0));uv.push(i/cols,t);raised.push(layer?.15:.55+.40*Math.sin(t*Math.PI*.85));
 }
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const a=j*stride+i,b=a+stride;idx.push(a,a+1,b,a+1,b+1,b);idx.push(a+count,b+count,a+1+count,a+1+count,b+count,b+1+count);
 }
 const loop=[];for(let i=0;i<=cols;i++)loop.push(i);for(let j=1;j<=rows;j++)loop.push(j*stride+cols);for(let i=cols-1;i>=0;i--)loop.push(rows*stride+i);for(let j=rows-1;j>0;j--)loop.push(j*stride);
 for(let k=0;k<loop.length;k++){const a=loop[k],b=loop[(k+1)%loop.length];idx.push(b,a,a+count,b,a+count,b+count);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('raised352',new T.Float32BufferAttribute(raised,1));g.setIndex(idx);g.computeVertexNormals();return g;
}
function steppedPlate352(w,h){
 const s=new T.Shape(),x=w/2,y=h/2,k=w*.12,j=h*.065;
 s.moveTo(-x,-y);s.lineTo(-k,-y);s.lineTo(-k,-y+j);s.quadraticCurveTo(0,-y+j*1.5,k,-y+j);s.lineTo(k,-y);s.lineTo(x,-y);s.lineTo(x,-h*.22);s.quadraticCurveTo(x-k*.55,0,x,h*.22);s.lineTo(x,y);s.lineTo(k,y);s.lineTo(k,y-j);s.quadraticCurveTo(0,y-j*1.5,-k,y-j);s.lineTo(-k,y);s.lineTo(-x,y);s.lineTo(-x,h*.22);s.quadraticCurveTo(-x+k*.55,0,-x,-h*.22);s.closePath();return s;
}

export function buildForeground352({emit,box,group,materials,mats,peony}){
 const info={revision:'scene08-foreground352-r05',photographicMatch:false,scope:'Near doorway timber and actual mounted cast carving; near railing and rooted porch interface',referenceImageRuntime:false,sharedRNGUsed:false,carving:null,postEnvelopeHeld:true,leadingFinialHeld171:true,joinery:{rebateGap:.0035,carrierThickness:.009,perimeterReturnDepth:.022,sourceReliefDepth:null,solidSculptedFlower:true,memberFacesOutward:true,mainFasciaAboveOldDatum:-.02,mainFasciaBelowR04:.26,railUpperAxisHeld:true,portalEndRetractedAlongSameAxis:.12,leadingPostShaftStartsAtActualFloor:true}};
 function register(name,mat){mat.name='scene08-entry352-'+name;mats['entry191_'+name]=mat;materials.push(mat);return mat;}
 const timber=register('timber352',mats.red.clone());timber.onBeforeCompile=mats.red.onBeforeCompile;timber.customProgramCacheKey=mats.red.customProgramCacheKey;timber.normalScale.set(.10,.10);timber.clearcoat=.11;timber.clearcoatRoughness=.48;
 const end=register('end352',mats.wood.clone());end.normalScale.set(.11,.11);end.clearcoat=.045;
 const bronze=register('bronze352',new T.MeshStandardMaterial({color:'#8e622d',roughness:.54,metalness:.84}));
 const edge=register('edge352',new T.MeshStandardMaterial({color:'#bd8c3e',roughness:.39,metalness:.88}));
 const recess=register('recess352',new T.MeshStandardMaterial({color:'#4f391f',roughness:.69,metalness:.66}));
 const gild=register('floral352',new T.MeshPhysicalMaterial({color:'#c3974c',roughness:.42,metalness:.88,clearcoat:.025,clearcoatRoughness:.55}));
 gild.onBeforeCompile=s=>{s.vertexShader='attribute float raised352;varying float vRaised352;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRaised352=raised352;');s.fragmentShader='varying float vRaised352;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat r352=smoothstep(.08,.80,vRaised352);diffuseColor.rgb*=mix(.32,1.,r352);').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.70,.41,r352);');};gild.customProgramCacheKey=()=> 'entry352-actual-source-relief-depth-patina-r01';
 const flower=sourceFlower352(peony);info.carving=flower.userData.source352;const size=flower.boundingBox.getSize(new T.Vector3());info.joinery.sourceReliefDepth=size.z;
 const rivetG=new T.SphereGeometry(1,20,12),washerG=new T.CylinderGeometry(1,1,.003,32);washerG.rotateX(Math.PI/2);
 const pins=(x,y,z,r=.009)=>{emit(washerG,recess,x,y,z,r*1.3,r*1.3,1);emit(rivetG,edge,x,y,z+.003,r,r,.005);};
 function sculpture(w,h,z,vertical=true){const turn=vertical?Math.PI/2:0,s=Math.min((w-.008)/(vertical?size.y:size.x),(h-.025)/(vertical?size.x:size.y));emit(flower,gild,0,0,z,s,s,s,[0,0,turn]);return s;}
 const flowerBodies=new Map();
 function flowerHead(r,z){
  // Different depth, overlap and phyllotaxis in each physical petal whorl.
  const key=r.toFixed(6);if(!flowerBodies.has(key)){
   const parts=[];for(let row=0;row<3;row++){
    const count=[18,14,10][row],length=r*[.78,.58,.35][row],width=r*[.115,.125,.115][row];
    for(let k=0;k<count;k++){
     const a=TAU*k/count+row*.31+.035*Math.sin(k*2.13),g=curledPetal352(length,width,r*(.20+row*.035),k+row*31),base=r*[.17,.14,.10][row];g.rotateZ(a);g.translate(-Math.sin(a)*base,Math.cos(a)*base,row*r*.115);parts.push(g);
    }
   }flowerBodies.set(key,parts);
  }
  const seat=new T.CylinderGeometry(r*.98,r*.93,.009,64);seat.rotateX(Math.PI/2);emit(seat,bronze,0,0,z-.004);
  for(const g of flowerBodies.get(key))emit(g,gild,0,0,z);
  const centre=new T.SphereGeometry(1,32,16);centre.scale(r*.19,r*.19,r*.13);emit(centre,edge,0,0,z+r*.40);
  for(let k=0;k<13;k++){const a=k*2.39996,rr=r*.14*Math.sqrt((k+.5)/13);emit(rivetG,edge,Math.cos(a)*rr,Math.sin(a)*rr,z+r*.49,r*.025,r*.025,r*.018);}
 }
 function plaque(w,h,{oval=false}={}){
  const outer=oval?(()=>{const s=new T.Shape();s.absellipse(0,0,w/2,h/2,0,TAU,false,0);return s;})():steppedPlate352(w,h);
  emit(cast(outer,.009,.002),bronze,0,0,.0045);
  if(oval){const rim=new T.TorusGeometry(1,.025,10,64);rim.scale(w*.48,h*.48,.09);emit(rim,edge,0,0,.013);}
  else{
   // Closed outer wall follows the stepped mounting lugs and waist; the
   // inner chamfer is a separate rolled seat, recessed behind the sculpture.
   const wall=steppedPlate352(w*.98,h*.99),hole=steppedPlate352(w*.85,h*.94);wall.holes.push(new T.Path(hole.getPoints(18).reverse()));emit(cast(wall,.018,.0015),bronze,0,0,.010);
   emit(ring(w*.83,h*.91,.0028,.004,.009),edge,0,0,.016);
  }
  sculpture(w*.86,h*.94,.012,true);flowerHead(w*(oval?.34:.35),.020);
  for(const s of[-1,1])pins(0,s*h*(oval?.40:.435),.017,.008);
  if(!oval)for(const sx of[-1,1])for(const sy of[-1,1]){pins(sx*w*.37,sy*h*.37,.018,.0065);}
 }
 // A core, front facing board and inner return board meet at real rebates.
 // Width/depth/top/bottom of each old post are preserved.
 for(const [x,w,d]of[[-2.30,.61,.64],[2.25,.32,.42]]){
  const z=7.9,f=x<0?1:-1,y0=-.30,y1=5.50,front=z+d/2;
  emit(member(octagon(w-.010,d-.010,.008),[x,y0,z],[x,y1,z],{edgeWear:.0015,seed:x<0?18:29}),timber);
  // The sweeper's vertical cross plane is x/z. Face boards sit inside the
  // held envelope, with a visible open rebate along the inner member.
  const faceW=w*.73,fx=x-f*w*.095;
  box(fx,2.60,front-.013,faceW,5.8,.026,timber);
  box(x+f*(w/2-.015),2.60,z-.021,.030,5.8,d*.78,timber);
  const inner=x+f*w/2;
  for(const y of[.18,1.90,x<0?5.70:4.40])group(fx,y,front+.001,0,()=>plaque(Math.min(w*.78,.47),y===1.90?(x<0?1.35:1.05):.85));
  const mounts=x<0?[[2.63,.28,.61,true]]:[[4.27,.30,.68,false],[1.92,.30,.78,false]];
  for(const [y,pw,ph,oval]of mounts)group(inner+f*.001,y,z,f*Math.PI/2,()=>plaque(pw,ph,{oval}));
  // Corner foot jacket: four separate folded faces, recessed seam, returns,
  // actual fasteners. It has no floating photo-facing rectangular sticker.
  for(const [xx,zz,yaw,ww]of[[x,front+.003,0,w],[x,z-d/2-.003,Math.PI,w],[x+w/2+.003,z,Math.PI/2,d],[x-w/2-.003,z,-Math.PI/2,d]])group(xx,.27,zz,yaw,()=>{
   emit(cast(rounded(ww+.010,.24,.016),.010,.002),bronze,0,0,.005);emit(ring(ww+.008,.235,.009,.008,.014),edge,0,0,.014);for(const sx of[-1,1])pins(sx*(ww*.34),0,.015,.009);
  });
  // Actual scarf joint below the head; inset end-grain plugs keep the
  // structural gap separate from the decorative metal surface.
  for(const sy of[5.05]){box(fx,sy,front-.008,faceW,.004,.020,end);for(const q of[-1,1])box(fx+q*faceW*.25,sy-.09,front+.001,.019,.027,.005,end);}
 }
 // Turned balusters: full round shoulders, torus/cove neck and square tenons,
 // same bay count, no extra pickets. Member axes meet the actual portal.
 const lathe=new T.LatheGeometry([[0,0],[.055,0],[.058,.026],[.058,.052],[.047,.068],[.040,.095],[.040,.13],[.058,.18],[.066,.21],[.065,.25],[.053,.28],[.043,.31],[.043,.36],[.052,.39],[.060,.42],[.060,.45],[0,.45]].map(p=>new T.Vector2(...p)),48);
 const capProfile=[[-.080,-.067],[-.080,.010],[-.073,.027],[-.065,.034],[-.065,.055],[-.054,.069],[.054,.069],[.065,.055],[.065,.034],[.073,.027],[.080,.010],[.080,-.067]];
 const lowerProfile=octagon(.115,.19,.007);
 function rail(a,b,y,{ret=false}={}){
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length/1.45),point=(t,dy=0)=>[a[0]+(b[0]-a[0])*t,y(t)+dy,a[1]+(b[1]-a[1])*t];
  // The hidden tenon stops inside the jamb. Its axis is unchanged, while
  // its former diagonal cross-section no longer exits through the near face.
  const end=ret?1:1-.12/length;
  emit(member(capProfile,point(0,ret?.66:.76),point(end,ret?.66:.76),{edgeWear:.0014,seed:ret?27:15}),timber);
  const lower=ret?.12:.10,bottom=lower+.095,top=(ret?.66:.76)-.067,turnedScale=(top-bottom)/.45;
  emit(member(lowerProfile,point(0,lower),point(end,lower),{edgeWear:.0008,seed:ret?52:64}),timber);
  for(let i=0;i<n;i++){
   const t=(i+.52)/n,p=point(t,bottom-.002);emit(lathe,timber,...p,1,turnedScale+.009,1);
   for(const dy of[bottom,top]){const q=point(t,dy);box(...q,.079,.037,.079,timber);}
  }
  // A real central mounted floral medallion on the broad lower fascia.
  const p=point(.5,lower),axis=new T.Vector3(b[0]-a[0],0,b[1]-a[1]).normalize(),normal=new T.Vector3(-axis.z,0,axis.x),yaw=Math.atan2(normal.x,normal.z);
  group(p[0]+normal.x*.062,p[1],p[2]+normal.z*.062,yaw,()=>{
   const seat=new T.CylinderGeometry(.071,.071,.008,48);seat.rotateX(Math.PI/2);emit(seat,bronze,0,0,.003);
   flowerHead(.062,.008);for(const x of[-.058,.058])pins(x,0,.008,.003);
  });
 }
 rail([-2.20,5.70],[2.30,8.07],t=>.54-.27*t);
 rail([-2.15,7.59],[-1.05,6.72],t=>1.18-.12*t,{ret:true});
 // Leading post holds its reviewed hoju. Only the two proper timber
 // shoulders replace the prior second post/ball inserted inside that hoju.
 emit(member(octagon(.18,.18,.009),[-1.05,porchFloorHeight352(-1.05,6.72),6.72],[-1.05,1.78,6.72],{edgeWear:.0012,seed:35}),timber);
 for(const y of[.72,1.69])box(-1.05,y,6.818,.095,.022,.013,end);
 return info;
}
