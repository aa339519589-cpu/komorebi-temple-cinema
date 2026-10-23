import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {loadLicensedCloud188} from './licensed-cloud188.js';
import {loadOriginalAmida188} from './original-amida188.js';

let assets=null,pending=null;
export function getSpatial188Assets(){if(!assets)throw Error('Load source-preserved spatial188 sculpture first');return assets;}
export async function loadSpatial188Assets(){
 if(assets)return assets;if(pending)return pending;
 pending=(async()=>{
  const [gltf,cloud,amida]=await Promise.all([new GLTFLoader().loadAsync(new URL('../assets/spatial188/floral157-component.gltf',import.meta.url).href),loadLicensedCloud188(),loadOriginalAmida188()]);
  gltf.scene.updateMatrixWorld(true);const b=new T.Box3().setFromObject(gltf.scene,true),centre=b.getCenter(new T.Vector3()),size=b.getSize(new T.Vector3()),parts=[];
  let triangles=0;
  gltf.scene.traverse(o=>{if(o.isMesh){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.translate(-centre.x,-centre.y,-centre.z);g.rotateY(Math.PI);const p=g.attributes.position,raised=new Float32Array(p.count);for(let i=0;i<p.count;i++){const t=T.MathUtils.clamp(((p.getZ(i)+size.z*.5)/size.z-.34)/.38,0,1);raised[i]=t*t*(3-2*t);}g.setAttribute('sourceCarving188Raised',new T.Float32BufferAttribute(raised,1));g.computeBoundingBox();g.computeBoundingSphere();parts.push(g);triangles+=g.index.count/3;}});
  if(triangles!==1633989)throw Error('Source157 triangle identity changed');
  const gilded=new T.MeshPhysicalMaterial({name:'spatial188-real-carved-floral-worn-gilt-on-wood',color:'#b18e51',metalness:.75,roughness:.51,clearcoat:.025,clearcoatRoughness:.55});
  gilded.onBeforeCompile=s=>{
   s.vertexShader='attribute float sourceCarving188Raised;varying float vCarving188Raised;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCarving188Raised=sourceCarving188Raised;');
   s.fragmentShader='varying float vCarving188Raised;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat raisedWood=clamp(vCarving188Raised,0.,1.);diffuseColor.rgb=mix(vec3(.075,.032,.012),diffuseColor.rgb,raisedWood);').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.83,.51,raisedWood);').replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor*=raisedWood;');
  };gilded.customProgramCacheKey=()=> 'source157-unchanged-depth-worn-gilt188-r01';
  const cloudMetal=new T.MeshPhysicalMaterial({name:'spatial188-real-carved-cloud-aged-bronze',color:'#987542',metalness:.67,roughness:.53,clearcoat:.025,clearcoatRoughness:.50});
  const mounts=[],carrierCube=new T.BoxGeometry(1,1,1),carrierWood=new T.MeshPhysicalMaterial({name:'spatial188-closed-carrier-oiled-cedar',color:'#58351f',roughness:.77,metalness:0,clearcoat:.06,clearcoatRoughness:.42}),cloudWood=new T.MeshPhysicalMaterial({name:'spatial188-actual-cloud-carved-aged-timber',color:'#64402a',roughness:.76,metalness:0,clearcoat:.045,clearcoatRoughness:.46});

  function panel(emit,{x=0,y=0,z=0,width,height,vertical=false,rotation=null,label,material=gilded,frame=true,backing=true}){
   const scale=Math.min(width/(vertical?size.y:size.x),height/(vertical?size.x:size.y)),rot=rotation??[0,0,vertical?Math.PI/2:0];
   const q=new T.Quaternion().setFromEuler(new T.Euler(...rot)),w=size.x*scale,h=size.y*scale,d=size.z*scale;
   const carrier=(dx,dy,dz,w,h,d,ma)=>{const p=new T.Vector3(dx,dy,dz).applyQuaternion(q);emit(carrierCube,ma,x+p.x,y+p.y,z+p.z,w,h,d,rot);};
   // The closed backing reaches into the original beam/returned stile. A
   // shallow returned rim buries the intentional scan crop boundary; source
   // positions, normals, undercuts and sculptural depth are unchanged.
   const wood=assets?.carrierMaterial??carrierWood,dark=assets?.carrierDarkMaterial??carrierWood;
   if(backing)carrier(0,0,-d*.5-.046,w+.055,h+.055,.10,wood);
   if(frame){for(const sign of[-1,1]){carrier(sign*(w/2+.008),0,-.001,.022,h+.052,d+.024,dark);carrier(0,sign*(h/2+.008),-.001,w+.052,.022,d+.024,dark);}}
   for(const g of parts)emit(g,material,x,y,z,scale,scale,scale,rot);
   mounts.push({kind:'actual-source157-floral',label,position:[x,y,z],uniformScale:scale,rotation:rot,sourceWidth:size.x*scale,sourceHeight:size.y*scale,sourceDepth:size.z*scale,closedTimberCarrier:backing,existingArchitecturalTimberCarrier:!backing,returnedCropBoundaryRim:frame,carrierOpening:[width,height],vertical});
   return{width:(vertical?size.y:size.x)*scale,height:(vertical?size.x:size.y)*scale,depth:size.z*scale};
  }
  function cloudPair(emit,{x=0,y=0,z=0,scale=.48,rotation=0,label,material=cloudMetal}){
   for(const sign of[-1,1]){const g=sign<0?cloud.reflectedSurface:cloud.surface,caps=sign<0?cloud.reflectedCaps:cloud.caps,e=Array.isArray(rotation)?new T.Euler(...rotation):new T.Euler(0,rotation||0,0),off=new T.Vector3(sign*scale/2,0,0).applyEuler(e);emit(g,material,x+off.x,y+off.y,z+off.z,scale,scale,scale,rotation);emit(caps,material,x+off.x,y+off.y,z+off.z,scale,scale,scale,rotation);}
   mounts.push({kind:'actual-source176-cloud-pair',label,position:[x,y,z],uniformScale:scale,width:scale*2,height:.8682248*scale,depth:.2828688*scale,mountCaps:true});
  }
  function cloudOne(emit,{x=0,y=0,z=0,scale=.52,side=1,label,material=cloudWood}){
   const g=side<0?cloud.reflectedSurface:cloud.surface,caps=side<0?cloud.reflectedCaps:cloud.caps,xx=x+side*scale/2;emit(g,material,xx,y,z,scale,scale,scale);emit(caps,material,xx,y,z,scale,scale,scale);mounts.push({kind:'actual-source176-single-carved-shoulder',label,position:[x,y,z],uniformScale:scale,sourceMountPlaneOnPostAxis:true,material:material.name});
  }
  assets={parts,cloud,amida,panel,cloudPair,cloudOne,cloudWood,gilded,materials:[gilded,cloudMetal,carrierWood,cloudWood],info(){return{revision:'spatial188-source-preserving-fitted-carving-r01',floral:{triangles,sourceVertices:1124928,nativeBounds:size.toArray(),sourceHasImages:false,sourceNormalsAndTrianglesRetained:true},cloud:cloud.info,amida:amida.info(),mounts,unitStatement:'Source157 uniform0.001 wrapper is an unverified conversion; all additional fitting is uniform. No physical measurement or exact reference motif is asserted.',visualAccepted:false};}};
  return assets;
 })();return pending;
}
