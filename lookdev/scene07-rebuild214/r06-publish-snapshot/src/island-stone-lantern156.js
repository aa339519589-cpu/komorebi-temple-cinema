import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// API-compatible geometry asset adapter. It changes no scene anchors, camera,
// lighting, terrain or shared materials. Geometry provenance is in asset156.json.
// Captured source: Japanese Toro by 3dlunatic, CC BY 4.0, with declared hybrid edits.
const METRES_PER_TILE=.3173828125,DEFAULT_CONTRACT=new URL('../assets/toro156/asset156.json',import.meta.url),cache=new Map();
const sha=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(n=>n.toString(16).padStart(2,'0')).join('');
async function geometryLibrary(contractUrl){
 const key=String(contractUrl);if(cache.has(key))return cache.get(key);
 const promise=(async()=>{
  const response=await fetch(contractUrl);if(!response.ok)throw Error('Toro156 contract failed '+response.status);const contract=await response.json(),url=new URL(contract.glb.file,contractUrl),data=await fetch(url);if(!data.ok)throw Error('Toro156 geometry failed '+data.status);const bytes=await data.arrayBuffer();if(await sha(bytes)!==contract.glb.sha256)throw Error('Toro156 GLB byte identity differs');
  const asset=await new GLTFLoader().parseAsync(bytes,new URL('.',url).href);asset.scene.updateMatrixWorld(true);const sourceBounds=new T.Box3().setFromObject(asset.scene),maxRadius=Math.max(Math.abs(sourceBounds.min.x),Math.abs(sourceBounds.max.x),Math.abs(sourceBounds.min.z),Math.abs(sourceBounds.max.z)),height=sourceBounds.max.y-sourceBounds.min.y,scaleXZ=1.06/maxRadius,scaleY=4.05/height,normalize=new T.Matrix4().makeScale(scaleXZ,scaleY,scaleXZ).multiply(new T.Matrix4().makeTranslation(0,-sourceBounds.min.y,0)),bins=new Map();
  asset.scene.traverse(o=>{
   if(!o.isMesh)return;const role=o.userData.toroRole??o.material.userData.toroRole??o.material.name.replace(/^GLB\s+/,''),g=o.geometry.clone().applyMatrix4(normalize.clone().multiply(o.matrixWorld));if(!['stone','cap','bronze','paper'].includes(role))throw Error('Unknown Toro156 material role '+role);
   if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));const colors=new Float32Array(g.attributes.position.count*3),c=g.attributes.color;
   for(let i=0;i<g.attributes.position.count;i++)for(let k=0;k<3;k++){const q=c?c.getComponent(i,k):1;colors[i*3+k]=role==='stone'||role==='cap'?.72+.28*q:q;}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
   for(const name of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(name))g.deleteAttribute(name);if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!bins.has(role))bins.set(role,[]);bins.get(role).push(g);
  });
  const geometry=new Map();for(const[role,parts]of bins){const g=mergeGeometries(parts,false);if(!g)throw Error('Toro156 material batch failed');parts.forEach(p=>p.dispose());g.computeBoundingBox();g.computeBoundingSphere();geometry.set(role,g);}
  return{geometry,contract,sourceBounds:{min:sourceBounds.min.toArray(),max:sourceBounds.max.toArray()},normalization:{xzScale:scaleXZ,yScale:scaleY,sourceFootY:sourceBounds.min.y},fireBagCentreY:(2.84-sourceBounds.min.y)*scaleY};
 })();cache.set(key,promise);return promise;
}
export async function loadIslandLanternStone({contractUrl=DEFAULT_CONTRACT,mapBaseUrl=new URL('../assets/island-lantern-granite/',import.meta.url)}={}){
 const loader=new T.TextureLoader(),[library,...maps]=await Promise.all([geometryLibrary(contractUrl),...['diff','nor_gl','rough'].map(n=>loader.loadAsync(new URL('granite-face-'+n+'.png',mapBaseUrl)))]);maps.forEach((m,i)=>{m.wrapS=m.wrapT=T.MirroredRepeatWrapping;m.anisotropy=8;if(i===0)m.colorSpace=T.SRGBColorSpace;});return{map:maps[0],normalMap:maps[1],roughnessMap:maps[2],textures:maps,assetLibrary:library};
}
function stone(name,color,maps){
 const m=new T.MeshStandardMaterial({name,color,roughness:.90,metalness:0,map:maps.map??null,normalMap:maps.normalMap??null,roughnessMap:maps.roughnessMap??null,vertexColors:true});m.normalScale.set(.28,.28);
 m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 vec3 aggregateTexel=texture2D(map,vMapUv).rgb;
 float aggregateY=dot(aggregateTexel,vec3(.2126,.7152,.0722));
 float relativeAggregate=clamp(pow(max(aggregateY,.0001)/.153180782734,.55),.68,1.36);
 diffuseColor.rgb*=relativeAggregate;
 #endif`).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 roughnessFactor=clamp(.76+.20*roughnessFactor,.78,.95);`);};m.customProgramCacheKey=()=>name+':metric-original-granite156-v1';return m;
}
export function buildIslandStoneLantern({parentMatrix=new T.Matrix4(),maps=null,glowMaterial=null,anchor=[4.8,.2,14.2],uniformScale=5.8/3.7}={}){
 if(!maps?.assetLibrary)throw Error('Call and await Toro156 loadIslandLanternStone before building.');const library=maps.assetLibrary,group=new T.Group();group.name='scene07-toro156-captured-and-sculpted-stone-lantern';group.matrixAutoUpdate=false;group.matrix.copy(parentMatrix).multiply(new T.Matrix4().makeTranslation(...anchor)).multiply(new T.Matrix4().makeScale(uniformScale,uniformScale,uniformScale));const metres=new T.Vector3().setFromMatrixScale(group.matrix),materials={stone:stone('scene07-toro156-weathered-mineral-stone','#989486',maps),cap:stone('scene07-toro156-damp-weathered-kasa','#64685d',maps),bronze:new T.MeshStandardMaterial({name:'scene07-toro156-fine-dark-cast-grille',color:'#332c21',metalness:.5,roughness:.55}),paper:glowMaterial??new T.MeshStandardMaterial({name:'scene07-toro156-recessed-emitting-paper',color:'#ba914e',emissive:'#ffb45a',emissiveIntensity:2.5,roughness:.85,side:T.DoubleSide})},prototypes=[],ownedMaterials=new Set(Object.values(materials).filter(m=>m!==glowMaterial));let triangles=0;
 for(const[role,source]of library.geometry){
  const g=source.clone();if(role==='stone'||role==='cap'){
   const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);
   for(let i=0;i<p.count;i++){const x=p.getX(i)*metres.x,y=p.getY(i)*metres.y,z=p.getZ(i)*metres.z,ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));uv[i*2]=(ax>ay&&ax>az?z:x)/METRES_PER_TILE;uv[i*2+1]=(ay>=Math.max(ax,az)?z:y)/METRES_PER_TILE;}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  }
  const mesh=new T.Mesh(g,materials[role]);mesh.name='toro156-'+role;mesh.castShadow=role!=='paper';mesh.receiveShadow=role!=='paper';group.add(mesh);prototypes.push(g);triangles+=g.index?g.index.count/3:g.attributes.position.count/3;
 }
 group.updateMatrixWorld(true);const localBounds=new T.Box3();for(const g of prototypes){g.computeBoundingBox();localBounds.union(g.boundingBox);}const centreY=library.fireBagCentreY;
 const info={revision:'scene07-captured-and-sculpted-toro156',anchorLocal:anchor,uniformLocalScale:uniformScale,worldAnchor:new T.Vector3(...anchor).applyMatrix4(parentMatrix).toArray(),localBounds:{min:localBounds.min.toArray(),max:localBounds.max.toArray()},worldBounds:new T.Box3().setFromObject(group),fireBagCentreY:centreY,fireBagClearHeight:.53*library.normalization.yScale,practicalCentreWorld:new T.Vector3(0,centreY,0).applyMatrix4(group.matrix).toArray(),roofMaximumHalfWidth:1.06,sixSidedChamber:true,trueRecessedPanes:true,closedThickCurvedRoof:true,closedCurvedRoof:true,verticalBarsPerFace:3,horizontalBarsPerFace:3,mossPatches:0,mossFibreSolids:0,geometryMaterialBatches:group.children.length,triangles,lightsAdded:0,originalGlowMaterialRetained:!!glowMaterial,source:library.contract.source,sourceGLBSha256:library.contract.glb.sha256,sourceMapPixelsUnchanged:true,textureMetres:METRES_PER_TILE,normalization:library.normalization,visualAccepted:false};
 return{group,prototypes,info,dispose(){prototypes.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());maps.textures?.forEach(t=>t.dispose());group.removeFromParent();}};
}

// Geometry-only preparation is exposed for bounded CPU contract verification.
export const loadToro156Geometry=geometryLibrary;
