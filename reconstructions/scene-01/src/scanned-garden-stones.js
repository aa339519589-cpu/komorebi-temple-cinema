import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Keep the scan's albedo and UVs, but turn its warm earth palette into the
// charcoal stone and sparse olive lichen seen around the reference pond. The
// small world-space noise adds mineral breakup without projecting an image.
function addStoneSurfaceBreakup(material){
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace(
   '#include <common>',
   '#include <common>\nvarying vec3 vStoneFieldPosition;'
  ).replace(
   '#include <worldpos_vertex>',
   '#include <worldpos_vertex>\nvStoneFieldPosition = worldPosition.xyz;'
  );
  shader.fragmentShader=shader.fragmentShader.replace(
   '#include <common>',
   `#include <common>
    varying vec3 vStoneFieldPosition;
    float stoneHash(vec3 p){
     p=fract(p*0.1031);
     p+=dot(p,p.yzx+33.33);
     return fract((p.x+p.y)*p.z);
    }
    float stoneValueNoise(vec3 p){
     vec3 cell=floor(p),f=fract(p);
     f=f*f*(3.0-2.0*f);
     float c000=stoneHash(cell+vec3(0.0,0.0,0.0));
     float c100=stoneHash(cell+vec3(1.0,0.0,0.0));
     float c010=stoneHash(cell+vec3(0.0,1.0,0.0));
     float c110=stoneHash(cell+vec3(1.0,1.0,0.0));
     float c001=stoneHash(cell+vec3(0.0,0.0,1.0));
     float c101=stoneHash(cell+vec3(1.0,0.0,1.0));
     float c011=stoneHash(cell+vec3(0.0,1.0,1.0));
     float c111=stoneHash(cell+vec3(1.0,1.0,1.0));
     float z0=mix(mix(c000,c100,f.x),mix(c010,c110,f.x),f.y);
     float z1=mix(mix(c001,c101,f.x),mix(c011,c111,f.x),f.y);
     return mix(z0,z1,f.z);
    }`
  ).replace(
   '#include <color_fragment>',
   `#include <color_fragment>
    vec3 scannedStone=diffuseColor.rgb;
    float stoneLuma=dot(scannedStone,vec3(0.2126,0.7152,0.0722));
    float greenExcess=scannedStone.g-max(scannedStone.r,scannedStone.b);
    float scanMoss=smoothstep(0.006,0.040,greenExcess);
    float broad=stoneValueNoise(vStoneFieldPosition*5.0+vec3(7.0,3.0,11.0));
    float strata=stoneValueNoise(vStoneFieldPosition*14.0+vec3(2.7,6.1,0.9));
    float flecks=smoothstep(0.72,0.91,stoneValueNoise(vStoneFieldPosition*31.0+vec3(4.0,8.0,2.0)));
    float proceduralMoss=smoothstep(0.70,0.83,broad)*(0.5+0.5*strata);
    float mossMask=clamp(max(scanMoss*0.62,proceduralMoss*0.18),0.0,0.62);
    vec3 charcoal=vec3(stoneLuma*0.78,stoneLuma*0.83,stoneLuma*0.89);
    vec3 oliveMoss=vec3(stoneLuma*0.62,stoneLuma*0.75,stoneLuma*0.43);
    float facetValue=0.82+broad*0.22+(strata-0.5)*0.08;
    diffuseColor.rgb=mix(charcoal,oliveMoss,mossMask)*facetValue;
    diffuseColor.rgb+=flecks*vec3(0.007,0.009,0.011);`
  );
 };
 material.customProgramCacheKey=()=> 'scanned-garden-stone-breakup-v1';
}

// The scan supplies each stone's eroded outline and surface. Placement, size,
// banks and waterfalls remain three-dimensional scene construction.
export async function loadScannedGardenStones(){
 const asset=await new GLTFLoader().loadAsync('/assets/polyhaven/rock-moss-set-01/rock_moss_set_01_4k.gltf');
 asset.scene.updateMatrixWorld(true);
 const variants=[],textures=new Set();
 asset.scene.traverse(o=>{
  if(!o.isMesh)return;
  const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);
  geometry.computeBoundingBox();
  const center=geometry.boundingBox.getCenter(new T.Vector3()),size=geometry.boundingBox.getSize(new T.Vector3());
  geometry.translate(-center.x,-center.y,-center.z);
  // Keep the scan's squat geological proportions. Stretching every axis to
  // the old unit sphere would turn flat weathered stones into tall pinnacles.
  const scale=2/Math.max(size.x,size.z);geometry.scale(scale,scale,scale);
  const dry=o.material.clone();dry.name='scanned-weathered-moss-stone-'+variants.length;dry.metalness=0;dry.roughness=.96;dry.color.setRGB(.76,.77,.77);
  if(dry.normalScale)dry.normalScale.set(.85,.85);
  addStoneSurfaceBreakup(dry);
  const wet=new T.MeshPhysicalMaterial({
   name:dry.name+'-wet',color:dry.color,map:dry.map,normalMap:dry.normalMap,
   normalScale:dry.normalScale,roughnessMap:dry.roughnessMap,aoMap:dry.aoMap,
   aoMapIntensity:dry.aoMapIntensity,roughness:.78,
   metalness:0,clearcoat:.10,clearcoatRoughness:.48
  });
  wet.color.multiplyScalar(.72);
  addStoneSurfaceBreakup(wet);
  for(const key of ['map','normalMap','roughnessMap','aoMap'])if(dry[key])textures.add(dry[key]);
  variants.push({geometry,dry,wet});
 });
 if(variants.length!==6)throw Error('Expected six separate scanned garden stones, got '+variants.length);
 return {variants,info:{asset:'rock_moss_set_01',author:'Kless Gyzen',license:'CC0-1.0',pieces:variants.length,source:'https://polyhaven.com/a/rock_moss_set_01'},
  dispose(){for(const t of textures)t.dispose();}};
}
