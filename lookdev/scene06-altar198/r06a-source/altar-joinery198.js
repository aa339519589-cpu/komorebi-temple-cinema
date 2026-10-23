import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {buildRefinedMetalLegs198,installBrocade201} from './altar-metalwork198-r06.js';

// Scene06 altar198: actual closed joinery and source-preserving carved wood.
// No photograph is loaded into this scene or used as a material/displacement.
const TAU=Math.PI*2, carvings={};
const assetBase=new URL('../assets/carving176-altar198-CC-BY-4.0/',import.meta.url);
export async function loadAltarCarvings198(){
 const [response,mountResponse,full,floral,brocade]=await Promise.all([
  fetch(new URL('cloud-scroll-sc07.bin',assetBase)),
  fetch(new URL('cloud-scroll-mount-loops.json',assetBase)),
  new GLTFLoader().loadAsync(new URL('whole-dragon-frieze.glb',assetBase).href),
  new GLTFLoader().loadAsync(new URL('../assets/floral157-altar198-CC-BY-4.0/component.gltf',import.meta.url).href),
  new T.TextureLoader().loadAsync(new URL('../assets/brocade201/brocade-albedo-r01.png',import.meta.url).href),
 ]);
 if(!response.ok||!mountResponse.ok)throw Error('altar198 source carving failed');
 const buffer=await response.arrayBuffer(),header=new DataView(buffer),n=header.getUint32(4,true),ni=header.getUint32(8,true);
 if(header.getUint32(0,true)!==0x37304353||buffer.byteLength!==20+n*32+ni*4)throw Error('altar198 source SC07 invalid');
 const g=new T.BufferGeometry();let offset=20;
 g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,offset,n*3),3));offset+=n*12;
 g.setAttribute('normal',new T.BufferAttribute(new Float32Array(buffer,offset,n*3),3));offset+=n*12;
 g.setAttribute('uv',new T.BufferAttribute(new Float32Array(buffer,offset,n*2),2));offset+=n*8;
 g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,offset,ni),1));
 g.computeBoundingBox();g.computeBoundingSphere();
 g.userData={finalSurfaceNormalsOutward:true,actualSource176:true,license:'CC-BY-4.0',sourceSurfaceUnchanged:true};
 carvings.cloud=g;
 // The original five deliberate X cuts receive exact planar end grain.
 // Ordered scan mount loops cap solid sections; real pierced channels remain open.
 const mounts=await mountResponse.json(),positions=[],normals=[],uv=[],indices=[];
 for(const loop of mounts.loops){
  if(!loop.closed||!loop.mountPlane.endsWith('x-cut'))throw Error('altar198 unsupported source cut');
  const contour=loop.points.map(p=>new T.Vector2(p[1],p[2]));
  const triangles=T.ShapeUtils.triangulateShape(contour,[]),start=positions.length/3,sign=loop.mountPlane.startsWith('left')?-1:1;
  for(const p of loop.points){positions.push(...p.map(Math.fround));normals.push(sign,0,0);uv.push(p[1],p[2]);}
  for(const tri of triangles){
   const a=new T.Vector3(...loop.points[tri[0]]),b=new T.Vector3(...loop.points[tri[1]]),c=new T.Vector3(...loop.points[tri[2]]);
   if(b.sub(a).cross(c.sub(a)).x*sign<0)tri.reverse();
   indices.push(...tri.map(i=>i+start));
  }
 }
 const cap=new T.BufferGeometry();cap.setAttribute('position',new T.Float32BufferAttribute(positions,3));cap.setAttribute('normal',new T.Float32BufferAttribute(normals,3));cap.setAttribute('uv',new T.Float32BufferAttribute(uv,2));cap.setIndex(indices);
 cap.userData={finalSurfaceNormalsOutward:true,authoredMountClosure198:true};carvings.cloudCaps=cap;
 full.scene.updateMatrixWorld(true);const parts=[];
 full.scene.traverse(o=>{if(o.isMesh){const p=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!p.attributes.uv)p.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(p.attributes.position.count*2),2));parts.push(p);}});
 const frieze=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());frieze.computeBoundingBox();frieze.computeBoundingSphere();
 frieze.userData={finalSurfaceNormalsOutward:true,actualSource176:true,license:'CC-BY-4.0',sourceSurfaceUnchanged:true};carvings.frieze=frieze;
 floral.scene.updateMatrixWorld(true);const floralParts=[];
 floral.scene.traverse(o=>{if(o.isMesh){const p=o.geometry.clone().applyMatrix4(o.matrixWorld).rotateY(Math.PI);if(!p.attributes.uv)p.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(p.attributes.position.count*2),2));floralParts.push(p);}});
 const flowers=mergeGeometries(floralParts,false);floralParts.forEach(p=>p.dispose());flowers.computeBoundingBox();const fc=flowers.boundingBox.getCenter(new T.Vector3());
 flowers.translate(-fc.x,-fc.y,-flowers.boundingBox.min.z);flowers.computeBoundingBox();flowers.computeBoundingSphere();
 const peony=cropActualPeony198(flowers);flowers.dispose();
 peony.userData={...peony.userData,finalSurfaceNormalsOutward:true,actualSource157:true,license:'CC-BY-4.0',sourceSurfaceUnchangedExceptDocumentedSpatialCuts:true};carvings.floral=peony;
 carvings.brocade=brocade;
 return {revision:'altar198-r06',source:'SCANOLOGY_3D Wood Carving of Dragon',license:'CC-BY-4.0',photographicAcceptance:false};
}

function cropActualPeony198(source){
 // A spatial component selection from the actual157 sculpture, not a mask,
 // depth image or deformation. Original source corners/normals are kept;
 // only crossings of 48 fixed convex XY planes are linearly interpolated.
 const cx=-.110,cy=.025,rx=.150,ry=.065,segments=48,p=source.attributes.position,n=source.attributes.normal,ix=source.index;
 const planes=Array.from({length:segments},(_,i)=>{
  const a=(i+.5)/segments*TAU;return[Math.cos(a)/rx,Math.sin(a)/ry,Math.cos(Math.PI/segments)];
 });
 const positions=[],normals=[],uv=[],indices=[],vertexMap=new Map(),sideEdges=[];let unchanged=0,clipped=0;
 const add=v=>{
  const key=v.id!==undefined?'v'+v.id:v.p.map(x=>Math.round(x*1e10)).join(',')+':'+v.n.map(x=>Math.round(x*1e8)).join(',');
  if(vertexMap.has(key))return vertexMap.get(key);const i=positions.length/3;vertexMap.set(key,i);
  positions.push(v.p[0]-cx,v.p[1]-cy,v.p[2]);normals.push(...v.n);uv.push(0,0);return i;
 };
 const vertex=i=>({id:i,p:[p.getX(i),p.getY(i),p.getZ(i)],n:[n.getX(i),n.getY(i),n.getZ(i)]});
 for(let t=0;t<ix.count;t+=3){
  const ids=[ix.getX(t),ix.getX(t+1),ix.getX(t+2)],xx=ids.map(i=>p.getX(i)),yy=ids.map(i=>p.getY(i));
  if(Math.max(...xx)<cx-rx||Math.min(...xx)>cx+rx||Math.max(...yy)<cy-ry||Math.min(...yy)>cy+ry)continue;
  let poly=ids.map(vertex),cut=false;
  // An inside triangle needs no clipping work and keeps exact source IDs.
  if(!poly.every(v=>Math.pow((v.p[0]-cx)/rx,2)+Math.pow((v.p[1]-cy)/ry,2)<.994))for(const[a,b,d]of planes){
   const next=[];
   for(let j=0;j<poly.length;j++){
    const v=poly[j],w=poly[(j+1)%poly.length],dv=d-a*(v.p[0]-cx)-b*(v.p[1]-cy),dw=d-a*(w.p[0]-cx)-b*(w.p[1]-cy),iv=dv>=-1e-12,iw=dw>=-1e-12;
    if(iv)next.push(v);
    if(iv!==iw){
     const f=dv/(dv-dw),q={p:v.p.map((z,k)=>z+(w.p[k]-z)*f),n:v.n.map((z,k)=>z+(w.n[k]-z)*f)};
     const l=Math.hypot(...q.n);q.n=q.n.map(z=>z/l);next.push(q);cut=true;
    }
   }
   poly=next;if(poly.length<3)break;
  }
  if(poly.length<3)continue;
  const out=poly.map(add);for(let j=1;j<out.length-1;j++)indices.push(out[0],out[j],out[j+1]);
  if(cut){
   clipped++;
   for(let j=0;j<poly.length;j++){
    const a=poly[j].p,b=poly[(j+1)%poly.length].p;
    if(planes.some(([u,v,d])=>Math.abs(d-u*(a[0]-cx)-v*(a[1]-cy))<1e-8&&Math.abs(d-u*(b[0]-cx)-v*(b[1]-cy))<1e-8)&&Math.max(a[2],b[2])>.0003)sideEdges.push([a,b]);
   }
  }else unchanged++;
 }
 // New cut sides run to an authored rear return .001 inside the metal
 // carrier. Keep the actual cut surface corners exact; do not fill pierced
 // channels or any original interior scan boundary.
 const sourceTriangles=indices.length/3;
 for(const[a,b]of sideEdges){
  const mx=(a[0]+b[0])/2-cx,my=(a[1]+b[1])/2-cy,normal=new T.Vector3(mx/(rx*rx),my/(ry*ry),0).normalize(),q=[[a[0]-cx,a[1]-cy,a[2]],[b[0]-cx,b[1]-cy,b[2]],[b[0]-cx,b[1]-cy,-.001],[a[0]-cx,a[1]-cy,-.001]],start=positions.length/3;
  const face=new T.Vector3(...q[1]).sub(new T.Vector3(...q[0])).cross(new T.Vector3(...q[2]).sub(new T.Vector3(...q[0])));
  for(const v of q){positions.push(...v);normals.push(...normal.toArray());uv.push(0,0);}
  if(face.dot(normal)>0)indices.push(start,start+1,start+2,start,start+2,start+3);else indices.push(start,start+2,start+1,start,start+3,start+2);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeBoundingBox();g.computeBoundingSphere();
 g.userData.peonySpatialSelection198={source:'actual157 peony/leaf field',center:[cx,cy],radii:[rx,ry],fixedXYCutPlanes:segments,unchangedSourceTriangles:unchanged,sourceTrianglesClipped:clipped,retainedSurfaceTriangles:sourceTriangles,authoredSideReturnTriangles:sideEdges.length*2,sourceImages:false,remesh:false,sourceNormalsPreservedExceptBoundaryInterpolation:true,backReturnZ:-.001,claim:'Source-preserving carved component on physical carrier; no welded/watertight-topology assertion.'};
 return g;
}

function materials(b){
 if(b.materials.tableGilt198)return;
 Object.assign(b.materials,{
  tableLacquer198:new T.MeshPhysicalMaterial({name:'altar198-black-urushi-shaped-joinery',color:'#030201',metalness:0,roughness:.34,reflectivity:.20,specularIntensity:.32,envMapIntensity:.38,clearcoat:.18,clearcoatRoughness:.31}),
  tableRed198:new T.MeshPhysicalMaterial({name:'altar198-oxblood-lacquer-shafts',color:'#42130d',roughness:.34,clearcoat:.30,clearcoatRoughness:.30}),
  tableGilt198:new T.MeshStandardMaterial({name:'altar198-aged-gold-leaf-carved-solid',color:'#8f6427',metalness:.95,roughness:.46,envMapIntensity:.73}),
  tableEdge198:new T.MeshStandardMaterial({name:'altar198-worn-chased-gilt-ridges',color:'#b88d3d',metalness:.95,roughness:.36,envMapIntensity:.78}),
  tableRecess198:new T.MeshStandardMaterial({name:'altar198-dark-gilded-undercut-and-end-grain',color:'#493116',metalness:.85,roughness:.57,envMapIntensity:.57}),
  seatTextile198:new T.MeshStandardMaterial({name:'altar198-midnight-indigo-brocade-body',color:'#080a11',roughness:.91}),
  seatThread198:new T.MeshStandardMaterial({name:'altar198-antique-woven-gilt-floral-yarn',color:'#927344',metalness:.12,roughness:.88}),
 });
}
export function installAltarMaterials198(b){materials(b);}
function rounded(b,key,x,y,z,w,h,d,mat='tableLacquer198',r=.015){
 const g=b.geometry('198-rounded-'+key,()=>new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/5,h/5,d/5)));
 b.add(g,mat,x,y,z);
}
function reliefLeaf(b,key,points,width=.012,depth=.005,mat='tableGilt198'){
 b.carvedCurve('198-leaf-'+key,points,width,depth,mat,24);
}
function loop(b,key,center,rx,ry,z,r=.0025,mat='tableEdge198'){
 const points=[];for(let k=0;k<=48;k++){const a=k/48*TAU;points.push([center[0]+rx*Math.sin(a),center[1]+ry*Math.cos(a),z]);}
 b.castCurve('198-closed-oval-'+key,points,r,mat,48);
}
function flower(b,key,x,y,z,size,mat='tableGilt198'){
 for(let k=0;k<8;k++){
  const a=k/8*TAU,c=Math.cos(a),s=Math.sin(a),p=[[0,0],[size*.15,size*.36],[size*.12,size*.72],[0,size],[-size*.12,size*.72],[-size*.15,size*.36],[0,0]].map(([u,v])=>[x+c*u+s*v,y-s*u+c*v,z]);
  reliefLeaf(b,key+'-'+k,p,size*.075,size*.055,mat);
 }
 b.ball(x,y,z+.004,size*.15,size*.15,size*.08,mat);
}
function recordMount(b,definition,x,y,z,sx,sy,sz){
 const m=b.stack.at(-1).clone().multiply(new T.Matrix4().makeScale(sx,sy,sz)),e=m.elements;
 const columns=[new T.Vector3(e[0],e[1],e[2]),new T.Vector3(e[4],e[5],e[6]),new T.Vector3(e[8],e[9],e[10])],lengths=columns.map(c=>c.length());
 if(Math.max(...lengths)-Math.min(...lengths)>1e-10)throw Error('altar198 scan would be stretched in world space');
 b.root.userData.carvingMounts198??=[];b.root.userData.carvingMounts198.push({...definition,position:[x,y,z],actualWorldColumnLengths:lengths,orthogonalWorldAxes:columns.every((a,i)=>columns.every((c,j)=>i===j||Math.abs(a.dot(c))<1e-12)),determinant:m.determinant(),sourceUnstretched:true});
}
function sourceCloud(b,key,x,y,z,s,side=1,tableScale=[.74,.80,.74]){
 if(!carvings.cloud)throw Error('altar198 source was not loaded');
 // The inherited .84 X assembly and full [.74,.80,.74] layout matrix are
 // both compensated. All absolute world column lengths are measured below.
 const worldScale=s*tableScale[2],sx=side*worldScale/(.84*tableScale[0]),sy=worldScale/tableScale[1],sz=worldScale/tableScale[2];
 b.add(carvings.cloud,'tableGilt198',x,y,z,sx,sy,sz);
 b.add(carvings.cloudCaps,'tableRecess198',x,y,z,sx,sy,sz);
 recordMount(b,{key,component:'176 cloud-scroll',worldUniformScale:worldScale,mirrorX:side<0,completeParentScaleCompensated:[.84*tableScale[0],tableScale[1],tableScale[2]],rootCut:'left-x-cut',cap:'five exact planar source-loop endgrain closures',support:'top tenon rail and upright lacquer/gilt cheek'},x,y,z,sx,sy,sz);
}

export function buildOfferingJoinery198(b,layout,z,floorY){
 materials(b);
 // A thin closed tabletop and rebated waist. The overhang follows the photo:
 // the outer red feet almost align with its ends. No broad scalloped fascia.
 rounded(b,'table-top',0,.664,z,3.76,.063,.91,'tableLacquer198',.013);
 rounded(b,'table-top-rolled-gilt-edge',0,.697,z,3.79,.010,.935,'tableGilt198',.004);
 rounded(b,'table-waist',0,.624,z+.017,3.62,.031,.80,'tableLacquer198',.009);
 rounded(b,'table-front-upper-apron-rail',0,.609,z+.420,3.62,.025,.075,'tableLacquer198',.008);
 rounded(b,'table-front-lower-apron-rail',0,.554,z+.420,3.62,.014,.060,'tableLacquer198',.005);
 rounded(b,'table-rear-apron',0,.578,z-.365,3.62,.054,.068,'tableLacquer198',.009);
 rounded(b,'table-lower-front-quirk',0,.550,z+.442,3.60,.009,.014,'tableRecess198',.003);
 // Through aprons and corner blocks enter all four real legs and support the top.
 for(const side of[-1,1]){
  rounded(b,'end-apron',side*1.73,.578,z+.005,.068,.069,.79,'tableLacquer198',.009);
  for(const dz of[-.34,.34])rounded(b,'corner-joinery-block',side*1.73,.582,z+dz,.20,.106,.18,'tableLacquer198',.012);
 }
 // Small, thick chased metal straps wrap the apron at the supports, instead
 // of separate pale hanging badges. Their lower shoulders have real undercuts.
 const strap=b.geometry('198-thick-shaped-strap',()=>{
  const sh=new T.Shape();sh.moveTo(-.15,.053);sh.lineTo(.15,.053);sh.lineTo(.15,-.012);
  sh.bezierCurveTo(.13,-.022,.102,-.018,.088,-.037);sh.bezierCurveTo(.057,-.057,-.057,-.057,-.088,-.037);sh.bezierCurveTo(-.102,-.018,-.13,-.022,-.15,-.012);sh.closePath();
  return new T.ExtrudeGeometry(sh,{depth:.017,bevelEnabled:true,bevelSize:.003,bevelThickness:.002,bevelSegments:2,curveSegments:16});
 });
 for(const side of[-1,1])for(const [x,s]of[[1.73,.73],[1.075,1.03]]){
  const xx=side*x;b.add(strap,'tableRecess198',xx,.603,z+.455,s,1,1);
  if(x===1.075){
   // Actual scanner-captured peony relief, turned to +Z. The original157
   // 0.001 wrapper and every source face remain exact. Equal world scale on
   // X/Y/Z is restored across the .84 table parent, with no field stretch.
   const ts=layout.foregroundTableScale,ws=.44,sx=ws/(.84*ts[0]),sy=ws/ts[1],sz=ws/ts[2];
   b.add(carvings.floral,'tableGilt198',xx,.607,z+.472,sx,sy,sz);
   recordMount(b,{component:'157 actual spatially selected peony/leaf carving',selection:carvings.floral.userData.peonySpatialSelection198,worldUniformScale:ws,completeParentScaleCompensated:[.84*ts[0],ts[1],ts[2]],sourceFace:'+Y in original inspection, -Z in157 glTF, rigid Y180 to +Z',support:'rounded real peony component fits inside shaped strap shoulders; exact cut sides return .001 into the .472 physical backer; rectangular donor backing is absent'},xx,.607,z+.472,sx,sy,sz);
  }
  if(x!==1.075)for(const sy of[-1,1])rounded(b,'strap-upper-lower-edge',xx,.617+sy*.021,z+.477,.24*s,.005,.008,'tableEdge198',.002);
  else rounded(b,'inner-strap-top-edge',xx,.649,z+.474,.267,.004,.006,'tableEdge198',.0015);
  if(x!==1.075)flower(b,'strap-flower-'+x+'-'+side,xx,.596,z+.472,.027,'tableGilt198');
  for(const sg of[-1,1]){
   if(x!==1.075)reliefLeaf(b,'strap-scroll-'+x+'-'+side+'-'+sg,[[xx+sg*.023,.591,z+.474],[xx+sg*.055,.580,z+.475],[xx+sg*.088,.596,z+.474],[xx+sg*.068,.614,z+.474],[xx+sg*.047,.602,z+.476]],.011,.004,'tableEdge198');
   b.ball(xx+sg*.105*s,.620,z+.480,.003,.003,.002,'tableRecess198');
   b.add(b.geometry('198-recessed-strap-rivet-shank',()=>new T.CylinderGeometry(.0025,.0025,.014,10).rotateX(Math.PI/2)),'tableRecess198',xx+sg*.105*s,.620,z+.474);
  }
 }
 // Thin gold fronds are cut into and rolled over the lacquer edge.
 for(const side of[-1,1])for(const cx of[.47,1.42]){
  const x=side*cx;
  reliefLeaf(b,'front-vine-'+side+'-'+cx,[[x-side*.15,.586,z+.464],[x-side*.06,.578,z+.470],[x+side*.04,.589,z+.470],[x+side*.15,.581,z+.464]],.013,.005);
  for(let j=0;j<5;j++)for(const sg of[-1,1]){
   const xx=x+side*(-.10+j*.048),yy=.585;
   reliefLeaf(b,'front-frond-'+side+'-'+cx+'-'+j+'-'+sg,[[xx,yy,z+.467],[xx+side*.022,yy+sg*.014,z+.471],[xx+side*.050,yy+sg*.020,z+.467]],.012,.004);
   if(sg>0)b.add(b.geometry('198-openwork-frond-tenon-pin',()=>new T.CylinderGeometry(.003,.003,.026,10).rotateX(Math.PI/2)),'tableRecess198',xx+side*.050,.603,z+.458);
  }
 }
 buildRefinedMetalLegs198(b,layout,z,floorY,(...args)=>sourceCloud(b,...args));
 b.root.userData.offeringJoinery198={revision:'r06',topWidth:3.76,completeInheritedScale:[.84*layout.foregroundTableScale[0],layout.foregroundTableScale[1],layout.foregroundTableScale[2]],topY:.697,outerFeetX:1.73,structure:'closed rebated waist, open front apron with real upper/lower rails, through end aprons, oxblood tenoned shafts, chased metal sleeves, deep foliate inner returns and exact-source capped cloud knees',authoredContacts:'Small fronds use 26mm Z-axis tenon pins from the real apron face to each upper leaf; strap rivets enter the metal back; outer chased flowers and foot inlays are recessed into their physical carrier faces. The157 peony is spatially cut to a rounded component with actual cut-side returns, not an exposed rectangular donor plaque.',visualAccepted:false};
}

export function buildKneelingSeat198(b,layout,floorY){
 materials(b);installBrocade201(b,carvings.brocade);const cx=0,cy=.325,cz=3.28,rx=.85,ry=.228,rz=.435,px=.60,py=.78,pz=.62;
 const signed=(x,p)=>Math.sign(x)*Math.pow(Math.abs(x),p),contact=.097;
 const cloth=b.geometry('198-closed-shaped-indigo-brocade',()=>{
  const g=new T.SphereGeometry(1,96,48),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
   const x=signed(p.getX(i),px)*rx,y=cy+signed(p.getY(i),py)*ry,z=signed(p.getZ(i),pz)*rz;
   // Broad lower bearing, a slightly depressed crown and sewn edge gathers.
   const topSag=.012*Math.exp(-Math.pow(x/.55,4))*Math.max(0,(y-cy)/ry);
   p.setXYZ(i,x,Math.max(contact,y-topSag),cz+z);
  }
  g.computeVertexNormals();g.userData.closedCarvedShell=true;return g;
 });
 b.add(cloth,'seatTextile198');
 // A restrained lacquer frame has real edge mouldings, short turned posts
 // and inner rebates. Its bearing surface stays on the original floor.
 rounded(b,'seat-base',0,(floorY+.097)/2,cz+.035,2.31,.097-floorY,1.055,'tableLacquer198',.012);
 rounded(b,'seat-front-edge',0,.086,cz+.566,2.34,.026,.033,'tableLacquer198',.008);
 rounded(b,'seat-front-fine-gilt-bead',0,.099,cz+.582,2.32,.005,.009,'tableRecess198',.002);
 const postProfile=[[0,.084],[.064,.084],[.068,.106],[.054,.125],[.049,.151],[.067,.168],[.067,.187],[.048,.201],[.051,.224],[.036,.246],[0,.251]];
 for(const side of[-1,1]){
  const x=side*.985;
  b.lathe('198-seat-front-turned-post',postProfile,x,0,cz+.403,1,1,'tableLacquer198',40);
  b.torus(x,.182,cz+.403,.065,.004,'tableRecess198',Math.PI/2);
  rounded(b,'seat-side-rim',side*1.115,.118,cz+.015,.048,.054,.92,'tableLacquer198',.010);
  loop(b,'seat-corner-inlay-'+side,[side*1.015,.030],.076,.028,cz+.571,.0022,'tableRecess198');
  flower(b,'seat-corner-flower-'+side,side*1.015,.030,cz+.576,.025,'tableGilt198');
 }
 const front=(x,y)=>{
  const shell=Math.max(.00001,1-Math.pow(Math.abs(x/rx),2/px)-Math.pow(Math.abs((y-cy)/ry),2/py));
  return new T.Vector3(x,y,cz+rz*Math.pow(shell,pz/2)+.0022);
 };
 const top=(x,z)=>{
  const shell=Math.max(.00001,1-Math.pow(Math.abs(x/rx),2/px)-Math.pow(Math.abs(z/rz),2/pz)),y=cy+ry*Math.pow(shell,py/2);
  return new T.Vector3(x,y-.012*Math.exp(-Math.pow(x/.55,4))*Math.max(0,(y-cy)/ry)+.0022,cz+z);
 };
 // R05 positions and original SphereGeometry UVs stay exact. The sparse
 // extruded flower-wire layer is removed; real albedo supplies the woven motif.
 const piping=[];for(let k=0;k<=96;k++){const x=-.79+k/96*1.58;piping.push(front(x,.196+Math.pow(Math.abs(x/.85),3)*.022));}
 const seam=new T.TubeGeometry(new T.CatmullRomCurve3(piping),192,.0018,6,false);
 seam.userData.actualSewnPiping198=true;b.add(seam,'seatThread198');
 b.root.userData.kneelingSeat198={revision:'r06',closedCloth:true,contactY:contact,indigoBrocade:true,originalR05ClothPositionsAndUVs:true,extrudedFloralWiresRemoved:true,materialAlbedo:'brocade201/brocade-albedo-r01.png',albedoSha256:'912380812cd2d6577be111674fb99cc7082b129ee5540a6d726bdd5afeccd793',generatedMaterialOnly:true,frontSampler:{repeat:[1.9,.54],offset:[.025,.11],frontURangeWithinTile:[.025,.975],sRGB:true,anisotropy:8,roughness:.72,metalness:0,sheen:.12,bumpScale:.00008},baseWidth:2.31,cushionWidth:1.70,visualAccepted:false};
}

export function chasedBaseRosette198(b,x,y,z,r=.068){
 materials(b);
 // Small thick floral inlay routed into the cupboard face, with curled
 // petals and separate round stamens; replaces the old detached star glyph.
 for(let k=0;k<6;k++){
  const a=k/6*TAU,s=Math.sin(a),c=Math.cos(a),p=[[0,0],[-r*.22,r*.40],[-r*.15,r*.78],[0,r],[r*.22,r*.76],[r*.22,r*.40],[0,0]].map(([u,v])=>[x+c*u+s*v,y-s*u+c*v,z]);
  reliefLeaf(b,'base-chased-petal-'+x+'-'+y+'-'+k,p,.009,.005,'tableGilt198');
  const sx=x+s*r*.54,sy=y+c*r*.54;
  b.ball(sx,sy,z+.004,.007,.007,.003,'tableEdge198');
 }
 for(let k=0;k<6;k++){
  const a=(k+.5)/6*TAU;flower(b,'base-tiny-floret-'+x+'-'+y+'-'+k,x+Math.sin(a)*r*.80,y+Math.cos(a)*r*.80,z,.015,'tableGilt198');
 }
 b.ball(x,y,z+.006,.013,.013,.006,'tableRecess198');
}

export function addCornice198(b,y,front,width,depth){
 materials(b);
 // Continuous rounded lacquer ogee with shadow quirk and a restrained bead.
 // Closed cross-section extruded through X, with real returns on both ends.
 const profile=[[-.065,-.045],[-.018,-.045],[.001,-.031],[.012,-.014],[.045,-.008],[.050,.010],[.039,.025],[.015,.030],[-.065,.030]];
 const g=b.geometry('198-altar-ogee-'+width,()=>{
  const s=new T.Shape();s.moveTo(...profile[0]);for(const p of profile.slice(1))s.lineTo(...p);s.closePath();
  const q=new T.ExtrudeGeometry(s,{depth:width,bevelEnabled:true,bevelSize:.0025,bevelThickness:.003,bevelSegments:2,steps:1});
  // profile x is depth, y is height; extrusion z becomes horizontal X.
  const p=q.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getZ(i)-width/2,p.getY(i),p.getX(i));
  // The X/Z exchange reflects the extrusion frame, so reverse its winding.
  if(q.index){for(let i=0;i<q.index.count;i+=3){const a=q.index.getX(i+1);q.index.setX(i+1,q.index.getX(i+2));q.index.setX(i+2,a);}}
  else for(const attribute of Object.values(q.attributes))for(let i=0;i<attribute.count;i+=3)for(let k=0;k<attribute.itemSize;k++){
   const a=attribute.array[(i+1)*attribute.itemSize+k];attribute.array[(i+1)*attribute.itemSize+k]=attribute.array[(i+2)*attribute.itemSize+k];attribute.array[(i+2)*attribute.itemSize+k]=a;
  }
  q.computeVertexNormals();return q;
 });
 b.add(g,'tableLacquer198',0,y,front);
 rounded(b,'altar-cornice-gilt-bead-'+width,0,y+.017,front+.048,width+.016,.007,.010,'tableGilt198',.002);
 // Returns run into the deep shelf instead of ending as detached bars.
 for(const side of[-1,1])rounded(b,'altar-cornice-return-'+width,side*(width/2-.016),y+.009,front-depth/2,.047,.041,depth,'tableLacquer198',.009);
}

export function sourceLongDragon198(b,x,y,z,w,h){
 materials(b);if(!carvings.frieze)throw Error('altar198 whole source not loaded');
 const bounds=carvings.frieze.boundingBox,size=bounds.getSize(new T.Vector3()),s=Math.min(w*.92/size.x,h*.89/size.y),center=bounds.getCenter(new T.Vector3());
 b.add(carvings.frieze,'tableGilt198',x-center.x*s,y-center.y*s,z-bounds.min.z*s,s,s,s);
 recordMount(b,{component:'176 whole original frieze',worldUniformScale:s,support:'recessed deep timber field with 0.006 overlap; no anisotropic scan scaling',sourceTriangles:2233900},x,y,z,s,s,s);
}
