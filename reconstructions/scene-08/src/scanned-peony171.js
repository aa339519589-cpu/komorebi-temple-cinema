import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
// Frozen CC BY 4.0 scan: wood carving by Diana Liu / Thunk3D scanner.
// The immutable component in scene07 preserves the source triangles/normals
// and unit wrapper. This scene applies only rigid alignment, uniform fitting
// and a declared aged-bronze/wood finish. It is not an exact reference motif.
export async function loadScannedPeony171(){
 const url=new URL('../../scene-07/assets/floral157/component.gltf',import.meta.url);
 const gltf=await new GLTFLoader().loadAsync(url.href);gltf.scene.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(gltf.scene,true),centre=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),parts=[];
 gltf.scene.traverse(o=>{
  if(!o.isMesh)return;
  const g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.translate(-centre.x,-centre.y,-centre.z);g.rotateY(Math.PI);
  const p=g.attributes.position,weights=new Float32Array(p.count);
  for(let i=0;i<p.count;i++){const q=(p.getZ(i)+size.z*.5)/size.z,t=T.MathUtils.clamp((q-.40)/.30,0,1);weights[i]=t*t*(3-2*t);}
  g.setAttribute('peony171Raised',new T.Float32BufferAttribute(weights,1));g.computeBoundingBox();g.computeBoundingSphere();parts.push(g);
 });
 const material=new T.MeshPhysicalMaterial({name:'scene08-171-real-peony-aged-copper-gilt',color:'#ae8441',metalness:.78,roughness:.47,clearcoat:.045,clearcoatRoughness:.54});
 material.onBeforeCompile=s=>{
  s.vertexShader='attribute float peony171Raised;varying float vPeony171Raised;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPeony171Raised=peony171Raised;');
  s.fragmentShader='varying float vPeony171Raised;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat raisedCarving=clamp(vPeony171Raised,0.,1.);diffuseColor.rgb=mix(vec3(.055,.022,.008),diffuseColor.rgb,raisedCarving);').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.79,.47,raisedCarving);').replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor*=raisedCarving;');
 };
 material.customProgramCacheKey=()=> 'scene08-171-source-peony-depth-copper-v1';
 const mounts=[];
 return{parts,material,panel({emit,x,y,z,width,height,copies=2,label}){
  const s=Math.min(height/size.y,(width-(copies-1)*.018)/(size.x*copies)),span=size.x*s;
  for(let k=0;k<copies;k++)for(const geometry of parts)emit(geometry,material,x+(k-(copies-1)/2)*(span+.018),y,z,s,s,s);
  mounts.push({label,copies,uniformScale:s,sourceNativeMetricVerified:false,opening:[width,height]});
 },info(){return{source:'wood carving by Diana Liu / Thunk3D scanner',license:'CC-BY-4.0',sourceURL:'https://sketchfab.com/3d-models/wood-carving-93766a4c12eb4c278d23294582034e8c',component:'reconstructions/scene-07/assets/floral157/component.gltf',sourceTriangleCount:1633989,actualComponentBounds:size.toArray(),sourceNormalsAndTrianglesRetained:true,sourceHasUV:false,sourceHasImages:false,mounts,unitStatement:'Uniform 0.001 scanner-native conversion is an unverified proposal; author does not give surveyed dimensions. Added scene fitting is uniform.',exactReferenceOrnament:false,visualAccepted:false};},dispose(){for(const g of parts)g.dispose();material.dispose();}};
}
