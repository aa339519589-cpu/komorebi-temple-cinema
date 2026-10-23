import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Scene06 altar198: actual closed joinery and source-preserving carved wood.
// No photograph is loaded into this scene or used as a material/displacement.
const TAU=Math.PI*2, carvings={};
const assetBase=new URL('../assets/carving176-altar198-CC-BY-4.0/',import.meta.url);
export async function loadAltarCarvings198(){
 const [response,mountResponse,full,floral]=await Promise.all([
  fetch(new URL('cloud-scroll-sc07.bin',assetBase)),
  fetch(new URL('cloud-scroll-mount-loops.json',assetBase)),
  new GLTFLoader().loadAsync(new URL('whole-dragon-frieze.glb',assetBase).href),
  new GLTFLoader().loadAsync(new URL('../assets/floral157-altar198-CC-BY-4.0/component.gltf',import.meta.url).href),
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
 flowers.userData={finalSurfaceNormalsOutward:true,actualSource157:true,license:'CC-BY-4.0',sourceSurfaceUnchanged:true};carvings.floral=flowers;
 return {revision:'altar198-r01',source:'SCANOLOGY_3D Wood Carving of Dragon',license:'CC-BY-4.0',photographicAcceptance:false};
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
function sourceCloud(b,key,x,y,z,s,side=1,parentX=.84){
 if(!carvings.cloud)throw Error('altar198 source was not loaded');
 // Parent table has an old .84 X transform. Compensating it here gives the
 // actual scan equal absolute world scale on X/Y/Z; reflection is an isometry.
 b.add(carvings.cloud,'tableGilt198',x,y,z,side*s/parentX,s,s);
 b.add(carvings.cloudCaps,'tableRecess198',x,y,z,side*s/parentX,s,s);
 b.root.userData.carvingMounts198??=[];b.root.userData.carvingMounts198.push({key,component:'176 cloud-scroll',worldUniformScale:s,mirrorX:side<0,parentXCompensated:parentX,rootCut:'left-x-cut',cap:'five exact planar source-loop endgrain closures',support:'top tenon rail and upright lacquer/gilt cheek',position:[x,y,z]});
}

export function buildOfferingJoinery198(b,layout,z,floorY){
 materials(b);
 // A thin closed tabletop and rebated waist. The overhang follows the photo:
 // the outer red feet almost align with its ends. No broad scalloped fascia.
 rounded(b,'table-top',0,.664,z,3.76,.063,.91,'tableLacquer198',.013);
 rounded(b,'table-top-rolled-gilt-edge',0,.697,z,3.79,.010,.935,'tableGilt198',.004);
 rounded(b,'table-waist',0,.615,z+.017,3.62,.049,.80,'tableLacquer198',.010);
 rounded(b,'table-front-rebated-apron',0,.578,z+.420,3.62,.054,.075,'tableLacquer198',.009);
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
   const fs=.46;b.add(carvings.floral,'tableGilt198',xx,.603,z+.468,fs/.84,fs,fs);
   b.root.userData.carvingMounts198??=[];b.root.userData.carvingMounts198.push({component:'157 original peony/leaf field',worldUniformScale:fs,parentXCompensated:.84,sourceFace:'+Y in original inspection, -Z in157 glTF, rigid Y180 to +Z',position:[xx,.603,z+.468],support:'deep shaped strap backer overlaps relief rear .004; outer boundary sits within chased strap shoulders'});
  }
  for(const sy of[-1,1])rounded(b,'strap-upper-lower-edge',xx,.617+sy*.021,z+.477,.24*s,.005,.008,'tableEdge198',.002);
  if(x!==1.075)flower(b,'strap-flower-'+x+'-'+side,xx,.596,z+.478,.027,'tableGilt198');
  for(const sg of[-1,1]){
   if(x!==1.075)reliefLeaf(b,'strap-scroll-'+x+'-'+side+'-'+sg,[[xx+sg*.023,.591,z+.480],[xx+sg*.055,.580,z+.481],[xx+sg*.088,.596,z+.480],[xx+sg*.068,.614,z+.480],[xx+sg*.047,.602,z+.482]],.011,.004,'tableEdge198');
   b.ball(xx+sg*.105*s,.620,z+.480,.003,.003,.002,'tableRecess198');
  }
 }
 // Thin gold fronds are cut into and rolled over the lacquer edge.
 for(const side of[-1,1])for(const cx of[.47,1.42]){
  const x=side*cx;
  reliefLeaf(b,'front-vine-'+side+'-'+cx,[[x-side*.15,.586,z+.464],[x-side*.06,.578,z+.470],[x+side*.04,.589,z+.470],[x+side*.15,.581,z+.464]],.013,.005);
  for(let j=0;j<5;j++)for(const sg of[-1,1]){
   const xx=x+side*(-.10+j*.048),yy=.585;
   reliefLeaf(b,'front-frond-'+side+'-'+cx+'-'+j+'-'+sg,[[xx,yy,z+.467],[xx+side*.022,yy+sg*.014,z+.471],[xx+side*.050,yy+sg*.020,z+.467]],.012,.004);
  }
 }
 // Four narrow oxblood shafts, closed turned shoulders and chased ovoid sleeves.
 // Every shaft enters both its upper tenon and its individually capped foot.
 for(const side of[-1,1])for(const dz of[-.34,.34]){
  const x=side*1.73,zz=z+dz;
  b.lathe('198-outer-red-tapered-shaft',[[0,.072],[.061,.072],[.057,.16],[.050,.255],[.052,.36],[.053,.48],[.061,.57],[0,.586]],x,0,zz,1,1,'tableRed198',40);
  for(const [yy,r,h]of[[.143,.067,.023],[.273,.057,.017],[.523,.066,.021],[.568,.073,.030]]){
   b.lathe('198-gilt-shaft-collar-'+yy,[[0,-h/2],[r*.90,-h/2],[r,-h*.28],[r,h*.28],[r*.90,h/2],[0,h/2]],x,yy,zz,1,1,'tableGilt198',40);
   b.torus(x,yy+h*.27,zz,r*.97,.0035,'tableEdge198',Math.PI/2);
  }
  b.lathe('198-cast-ovoid-leg-sleeve',[[0,.346],[.051,.346],[.061,.353],[.068,.376],[.073,.402],[.069,.432],[.058,.455],[.051,.463],[0,.463]],x,0,zz,1,1,'tableGilt198',48);
  for(const s of[-1,1])reliefLeaf(b,'sleeve-swept-border-'+side+'-'+dz+'-'+s,[[x,.353,zz+.053],[x+s*.041,.372,zz+.055],[x+s*.044,.410,zz+.058],[x+s*.028,.443,zz+.052],[x,.455,zz+.050]],.009,.005,'tableEdge198');
  reliefLeaf(b,'sleeve-center-leaf-'+side+'-'+dz,[[x,.365,zz+.063],[x-.012,.390,zz+.073],[x+.011,.418,zz+.068],[x,.443,zz+.058]],.019,.007,'tableEdge198');
  // Timber foot with a close fitting brass shoe, shallow chased front and
  // a rolled top rim. Solid material thickness remains visible in oblique view.
  rounded(b,'outer-foot-core',x,(floorY+.093)/2,zz,.218,.093-floorY,.216,'tableGilt198',.012);
  rounded(b,'outer-foot-top-rabbet',x,.095,zz,.179,.024,.177,'tableLacquer198',.006);
  rounded(b,'outer-foot-front-inset',x,.030,zz+.109,.157,.077,.007,'tableRecess198',.003);
  for(const sy of[-1,1])rounded(b,'outer-foot-bead',x,.030+sy*.040,zz+.114,.173,.007,.009,'tableEdge198',.002);
  for(const sx of[-1,1])rounded(b,'outer-foot-corner',x+sx*.083,.030,zz+.114,.007,.076,.009,'tableEdge198',.002);
  flower(b,'foot-chased-rosette-'+side+'-'+dz,x,.030,zz+.118,.031,'tableGilt198');
 }
 // Inner scroll legs are joined solid carvings. Their volutes branch from a
 // narrow shaft and return into the top rail and foot, leaving irregular holes.
 for(const side of[-1,1]){
  const x=side*1.075,zz=z+.34;
  b.lathe('198-inner-red-bearing-core',[[0,.068],[.057,.068],[.052,.17],[.042,.31],[.049,.48],[.064,.558],[0,.575]],x,0,zz,1,1,'tableRed198',36);
  rounded(b,'inner-foot',x,(floorY+.088)/2,zz,.187,.088-floorY,.192,'tableGilt198',.010);
  b.lathe('198-inner-foot-rolled-neck',[[0,0],[.074,0],[.081,.014],[.066,.034],[.052,.061],[0,.061]],x,.080,zz,1,1,'tableLacquer198',36);
  for(const sg of[-1,1]){
   reliefLeaf(b,'inner-carved-spine-'+side+'-'+sg,[[x+sg*.019,.121,zz+.045],[x+sg*.031,.221,zz+.057],[x+sg*.021,.330,zz+.060],[x+sg*.032,.442,zz+.054],[x+sg*.018,.552,zz+.041]],.031,.021,'tableGilt198');
   for(let j=0;j<3;j++){
    const yy=.175+j*.118,sw=sg*(.061+.012*(j%2));
    reliefLeaf(b,'inner-foliate-lobe-'+side+'-'+sg+'-'+j,[[x+sg*.018,yy-.027,zz+.053],[x+sw,yy+.010,zz+.077],[x+sw*1.10,yy+.053,zz+.068],[x+sw*.56,yy+.077,zz+.061],[x+sg*.026,yy+.051,zz+.059]],.042,.023,'tableGilt198');
    reliefLeaf(b,'inner-lobe-ridge-'+side+'-'+sg+'-'+j,[[x+sg*.018,yy-.020,zz+.076],[x+sw*.73,yy+.025,zz+.094],[x+sw*.79,yy+.051,zz+.082]],.009,.006,'tableEdge198');
   }
  }
  for(const yy of[.133,.503])b.torus(x,yy,zz,.062,.008,'tableEdge198',Math.PI/2);
  // Original measured cloud surface, uniformly fitted, capped at its cut
  // sections and routed into a tenon cheek immediately below the upper strap.
  const s=.145,cx=x+side*.083;
  sourceCloud(b,'inner-knee-'+side,cx,.465,z+.408,s,side);
  rounded(b,'cloud-cut-cheek',cx-side*s/.84/2,.531,z+.421,.024,.142,.043,'tableRecess198',.005);
  rounded(b,'cloud-upper-tenon',cx,.588,z+.421,.194,.030,.047,'tableLacquer198',.006);
 }
 b.root.userData.offeringJoinery198={revision:'r01',topWidth:3.76,oldParentX:.84,topY:.697,outerFeetX:1.73,structure:'closed rebated waist, through aprons, oxblood tenoned shafts, chased metal sleeves, deep inner carved returns and exact-source capped cloud knees',visualAccepted:false};
}

export function buildKneelingSeat198(b,layout,floorY){
 materials(b);const cx=0,cy=.325,cz=3.28,rx=.85,ry=.228,rz=.435,px=.60,py=.78,pz=.62;
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
 const parts=[];
 const thread=(points,r=.0014,plane='front')=>{
  const mapper=plane==='front'?front:top,curve=new T.CatmullRomCurve3(points.map(p=>mapper(...p)),false,'centripetal');
  const g=new T.TubeGeometry(curve,Math.max(12,points.length*3),r,5,false);parts.push(g);
 };
 const floral=(x,y,r,plane='front',seed=0)=>{
  // Layered irregular chrysanthemum/peony threads, with small leaf sprigs.
  for(let ring=0;ring<3;ring++)for(let k=0;k<10;k++)for(let fill=0;fill<4;fill++){
   const a=k/10*TAU+ring*.17,rad=r*(1-ring*.25),pts=[];
   for(let j=0;j<=12;j++){
    const t=j/12*TAU,along=rad*(.48+.48*Math.cos(t)),across=rad*(.18-fill*.034)*Math.sin(t)*(1+.13*Math.sin(k*1.8+seed));
    pts.push([x+Math.sin(a)*along+Math.cos(a)*across,y+Math.cos(a)*along-Math.sin(a)*across]);
   }
   thread(pts,.00135,plane);
  }
  for(let k=0;k<8;k++){
   const a=k/8*TAU,rr=r*1.17;
   thread([[x+Math.sin(a)*r*.65,y+Math.cos(a)*r*.65],[x+Math.sin(a+.1)*rr,y+Math.cos(a+.1)*rr],[x+Math.sin(a+.23)*rr*.9,y+Math.cos(a+.23)*rr*.9]],.0015,plane);
  }
 };
 for(const plane of['front','top']){
  const yy=plane==='front'?.326:0;
  for(const [i,x]of[-.55,0,.55].entries())floral(x,yy,plane==='front'?.092:.112,plane,i);
  for(let k=0;k<11;k++){
   const x=-.74+k*.148,y=plane==='front'?.326:0,h=plane==='front'?.092:.22;
   for(const sg of[-1,1]){
    thread([[x-.065,y-sg*h],[x-.034,y-sg*h*.43],[x+.025,y+sg*h*.24],[x+.065,y+sg*h]],.0016,plane);
    for(let j=0;j<4;j++){
     const v=-.70+j*.43,xx=x+v*.05,yy=y+sg*v*h,ss=j%2?-1:1;
     thread([[xx,yy],[xx+ss*.024,yy+sg*.010],[xx+ss*.034,yy+sg*.029],[xx+ss*.010,yy+sg*.026],[xx,yy]],.0013,plane);
    }
   }
  }
  for(const sg of[-1,1])for(let k=0;k<21;k++){
   const x=-.73+k*.073,y=yy+sg*(plane==='front'?.125:.267);
   thread([[x-.019,y],[x,y+sg*.009],[x+.019,y]],.00115,plane);
  }
 }
 // Real piping follows the sewn front shoulder rather than a flat pattern.
 const piping=[];for(let k=0;k<=96;k++){const x=-.79+k/96*1.58;piping.push(front(x,.196+Math.pow(Math.abs(x/.85),3)*.022));}
 parts.push(new T.TubeGeometry(new T.CatmullRomCurve3(piping),192,.0035,6,false));
 const embroidery=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
 embroidery.userData={actualThreadVolumes198:true,mergeUniqueCarving:true};b.add(embroidery,'seatThread198');
 b.root.userData.kneelingSeat198={revision:'r02',closedCloth:true,contactY:contact,indigoBrocade:true,floralMedallionsPerFace:3,realTubeThread:true,baseWidth:2.31,cushionWidth:1.70,visualAccepted:false};
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
 b.root.userData.carvingMounts198??=[];b.root.userData.carvingMounts198.push({component:'176 whole original frieze',worldUniformScale:s,position:[x,y,z],support:'recessed deep timber field with 0.006 overlap; no anisotropic scan scaling',sourceTriangles:2233900});
}
