import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Genuine CC BY peony carving by Diana Liu / Thunk3D. Original crop and
// transforms remain in assets/floral157; this scene uses only rigid alignment,
// uniform bay fitting and a declared gilt finish. No scene image or UV bake.
export async function loadScannedFrieze157({emit,mats}){
 const gltf=await new GLTFLoader().loadAsync(new URL('../assets/floral157/component.gltf',import.meta.url).href);
 gltf.scene.updateMatrixWorld(true);
 // The PCA wrapper rotates primitive bounds. Transforming their AABBs would
 // inflate this shallow carving into a deep box and shrink its mounted face.
 const bounds=new T.Box3().setFromObject(gltf.scene,true),centre=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
 const parts=[];
 gltf.scene.traverse(o=>{
  if(!o.isMesh)return;
  const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.translate(-centre.x,-centre.y,-centre.z);geometry.rotateY(Math.PI);
  const p=geometry.attributes.position,weight=new Float32Array(p.count);
  for(let i=0;i<p.count;i++){const q=(p.getZ(i)+size.z*.5)/size.z,t=Math.max(0,Math.min(1,(q-.42)/.24));weight[i]=t*t*(3-2*t);}
  geometry.setAttribute('carving157Gilt',new T.Float32BufferAttribute(weight,1));
  geometry.computeBoundingBox();geometry.computeBoundingSphere();parts.push(geometry);
 });
 const gilt=new T.MeshPhysicalMaterial({name:'scene07-real-scanned-floral157-authored-gilt',color:0xb0985c,metalness:.84,roughness:.47,clearcoat:.055,clearcoatRoughness:.49});
 gilt.onBeforeCompile=s=>{
  s.vertexShader='attribute float carving157Gilt; varying float vCarving157Gilt;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCarving157Gilt=carving157Gilt;');
  s.fragmentShader='varying float vCarving157Gilt;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat realLeafGilt=clamp(vCarving157Gilt,0.,1.);diffuseColor.rgb=mix(vec3(.065,.026,.009),diffuseColor.rgb,realLeafGilt);')
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.78,.45,realLeafGilt);')
   .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor*=realLeafGilt;');
 };
 gilt.customProgramCacheKey=()=> 'real-scanned-carving157-depth-gilt-over-wood-r02';
 let cassettes=0;const mounts=[];
 return{panel(x,y,z,w,h,{hostY=.88,copies=2,label='main-portal'}={}){
  // Fit complete natural-aspect carvings to the actual host opening. The
  // portal has a compressed parent frame; the veranda has a uniform frame.
  // The source unit conversion is inferred, not a surveyed artifact size.
  const scale=Math.min(h*hostY/size.y,(w-.035-(copies-1)*.012)/(size.x*copies)),span=size.x*scale;
  for(let k=0;k<copies;k++)for(const geometry of parts)emit(geometry,gilt,x+(k-(copies-1)/2)*(span+.012),y,z,scale,scale/hostY,scale);
  cassettes+=copies;mounts.push({label,hostY,copies,scale,opening:[w,h],worldUniformScale:true});
 },info:()=>({revision:'scene07-source-scanned-portal-and-veranda-frieze157-r03',source:'Wood carving by Diana Liu / Thunk3D scanner',license:'CC-BY-4.0',originalNormalsAndTrianglesRetained:true,originalHasUV:false,originalHasAlbedo:false,worldUniformScale:true,mounts,actualVertexBounds:size.toArray(),authorVerifiedMetricDimensions:false,cassettes,authoredGiltFinish:'Source-relief-depth field selects gilt over dark carved timber; original geometry unchanged',visualAccepted:false}),dispose(){gilt.dispose();}};
}
