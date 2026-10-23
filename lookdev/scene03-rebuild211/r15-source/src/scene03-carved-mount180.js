import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Deliberate planar cut closures. Nested boundary loops stay holes. Original
// scan POSITION/NORMAL/index arrays are never modified by this function.
export function createCloudCutClosure180(T,record){
 const loops=record.loops.map(loop=>({points:loop.points,area:Math.abs(T.ShapeUtils.area(loop.points.map(p=>new T.Vector2(p[1],p[2]))))}));
 function inside(p,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[2]>p[2])!==(b[2]>p[2])&&p[1]<(b[1]-a[1])*(p[2]-a[2])/(b[2]-a[2])+a[1])yes=!yes;}return yes;}
 for(const loop of loops){const containers=loops.filter(other=>other!==loop&&other.area>loop.area&&inside(loop.points[0],other.points));loop.parent=containers.sort((a,b)=>a.area-b.area)[0]??null;}
 const depth=loop=>loop.parent?1+depth(loop.parent):0,pp=[];let closedPatches=0,holeLoops=0;
 for(const loop of loops){
  if(depth(loop)%2)continue;
  const holes=loops.filter(other=>other.parent===loop),flat=[loop,...holes].flatMap(l=>l.points),faces=T.ShapeUtils.triangulateShape(loop.points.map(p=>new T.Vector2(p[1],p[2])),holes.map(h=>h.points.map(p=>new T.Vector2(p[1],p[2]))));
  for(const face of faces){const [a,b,c]=face.map(i=>flat[i]),normal=new T.Vector3(...b).sub(new T.Vector3(...a)).cross(new T.Vector3(...c).sub(new T.Vector3(...a)));for(const p of(normal.x<0?[a,b,c]:[a,c,b]))pp.push(...p);}
  closedPatches++;holeLoops+=holes.length;
 }
 const g=new T.BufferGeometry();g.name='scene03-authored-cloud-cut-closures-preserving-pierced-channels180';g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.computeVertexNormals();
 return{geometry:g,info:{sourceLoops:loops.length,closedPatches,holeLoops,capTriangles:pp.length/9,sourcePositionNormalIndexUnchanged:true,method:'Planar polygon closure at the measured source X cut; nesting retains the existing pierced channel'}};
}

export async function installCarvedMount180(T,architecture){
 const directory=new URL('../assets/carved-cloud176/',import.meta.url),[asset,record]=await Promise.all([new GLTFLoader().loadAsync(new URL('component-y-up-z-front.glb',directory).href),fetch(new URL('measured-mount-loops.json',directory)).then(r=>{if(!r.ok)throw Error('Missing176 mount loops');return r.json();})]);
 const originalMaterials=new Set(),geometries=new Set();let triangles=0;
 const finish=new T.MeshStandardMaterial({name:'scene03-declared-worn-gilt-on-real-carved-cloud176',color:'#ac803a',roughness:.43,metalness:.78});
 asset.scene.traverse(o=>{if(!o.isMesh)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>originalMaterials.add(m));o.material=finish;o.castShadow=o.receiveShadow=true;o.name='scene03-actual-CCBY-scanned-cloud176';o.userData.source='SCANOLOGY_3D, Wood Carving of Dragon, CC BY4.0';geometries.add(o.geometry);triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
 const closure=createCloudCutClosure180(T,record);geometries.add(closure.geometry);
 const group=new T.Group();group.name='scene03-two-fitted-real-carved-gable-shoulders180';group.matrixAutoUpdate=false;
 group.matrix.makeTranslation(0,0,-4).multiply(new T.Matrix4().makeRotationY(architecture.config.hallYaw??.12)).multiply(new T.Matrix4().makeTranslation(0,0,4));
 const sockets=architecture.gable180.sockets;
 for(const socket of sockets){
  const mount=new T.Group();mount.name='scene03-housed-real-cloud-shoulder180';mount.position.fromArray(socket.position);mount.position.x+=architecture.config.gableCenter;mount.scale.set(socket.mirrorX?-socket.scale:socket.scale,socket.scale,socket.scale);
  mount.add(asset.scene.clone(true));const cap=new T.Mesh(closure.geometry,finish);cap.name='scene03-authored-measured-cut-closure180';cap.castShadow=cap.receiveShadow=true;mount.add(cap);group.add(mount);
 }
 architecture.group.add(group);group.updateMatrixWorld(true);
 const info={revision:180,instances:sockets.length,source:'Wood Carving of Dragon / SCANOLOGY_3D',license:'CC BY4.0',asset:'assets/carved-cloud176/component-y-up-z-front.glb',sourceComponentSha256:'0c693ba1108d00c08a8b76113998cfd498fef6cdd09ff4767d92b3a42825feee',originalSourceSha256:'5c0dc99da821e7248d095eb37fa0af348f24c14460f28d83770facc48131f255',prototypeTriangles:triangles,sourceAspect:[1,.8682247996330261,.28286880254745483],uniformMagnitudeScale:1.10,oneReflectedXInstance:true,closure:closure.info,sourcePositionNormalIndexUnchanged:true,finish:'Declared uniform worn-gilt PBR material; no scan/reference RGB, texture or procedural relief',mount:'Paired gable shoulders seated onto the deep cambered tie and against housed timber post; no structural certification',cultureAndOriginalUse:'Unspecified by creator; different artifact from the reference',visualAccepted:false};
 return{info,dispose(){architecture.group.remove(group);for(const g of geometries)g.dispose();finish.dispose();for(const m of originalMaterials)m.dispose();}};
}
