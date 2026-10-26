import * as T from 'three';
import {PIGMENT353} from './surface-response353.js';

const directory='/assets/polyhaven/lacquered-cherry-wood/';
export async function installScannedTimber(mats){
 const loader=new T.TextureLoader();
 const [albedo,normal,rawRoughness]=await Promise.all([
  loader.loadAsync(directory+'diffuse-2k.jpg'),loader.loadAsync(directory+'normal-gl-2k.png'),loader.loadAsync(directory+'roughness-2k.jpg')
 ]);
 // Original CC0 roughness pixels remain unremapped; pigment is separated
 // from the dark furniture scan's chroma by linear luminance grain below.
 const roughness=rawRoughness;
 albedo.colorSpace=T.SRGBColorSpace;
 for(const tex of [normal,roughness])tex.colorSpace=T.NoColorSpace;
 for(const tex of [albedo,normal,roughness]){
  tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.minFilter=T.LinearMipmapLinearFilter;
  tex.magFilter=T.LinearFilter;tex.generateMipmaps=true;tex.anisotropy=8;tex.needsUpdate=true;
 }
 const keys=['red','redLight','wood','endwood','darkwood'];
 // Separate inferred paint reflectance from original linear scan luminance.
 // The modern polished-table roughness mean is about.2475; the shader gives
 // aged architectural paint its own roughness range while keeping variation.
 const colors=PIGMENT353;
 for(const key of keys){
  const mat=mats[key];if(!mat)continue;
  const kind=key.includes('darkwood')?'darkwood':key.includes('endwood')?'endwood':key.includes('cedar')?'cedar':'red';
  mat.map=albedo;mat.normalMap=normal;mat.normalScale.set(.08,.08);mat.bumpMap=null;mat.roughnessMap=roughness;mat.roughness=key==='endwood'?.90:key==='wood'||key==='darkwood'?.78:.66;
  mat.color.setRGB(...colors[key]);mat.metalness=0;
  if(mat.isMeshPhysicalMaterial){mat.clearcoat=['red','redLight'].includes(key)?.18:key==='endwood'?.025:key==='darkwood'?.08:.12;mat.clearcoatRoughness=key==='endwood'?.50:key==='darkwood'?.34:['red','redLight'].includes(key)?.22:.28;mat.clearcoatNormalMap=normal;mat.clearcoatNormalScale.set(.06,.06);mat.specularIntensity=.55;}
  // Keep the world-space weathering installed by scene.js. Replacing the
  // image maps must not silently erase the physical member's ageing hook.
  const previous=mat.onBeforeCompile,cacheKey=mat.customProgramCacheKey.bind(mat);mat.onBeforeCompile=shader=>{previous.call(mat,shader);shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 vec4 timber353=texture2D(map,vMapUv);float woodLuma353=dot(timber353.rgb,vec3(.2126,.7152,.0722));
 diffuseColor.rgb*=clamp(pow(max(woodLuma353,.00005)/.01505120736,.40),.58,1.42);
 #endif`);shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nroughnessFactor=${key==='endwood'?'clamp(.62+.35*roughnessFactor,.64,.94)':'clamp(.33+.56*roughnessFactor,.38,.86)'};`);};mat.customProgramCacheKey=()=>cacheKey()+':353-linear-pigment-with-original-scan-luminance';
  mat.userData.metricTimberGrain=true;mat.userData.timberPaletteRole353=key;mat.userData.surface353={pigmentLinear:colors[key],rawRoughnessPixelsHeld:true,sourceLinearMeanY:.01505120736,inferredNotMeasured:true};mat.envMapIntensity=.7;mat.needsUpdate=true;
 }
 return {info:{provider:'Poly Haven',asset:'lacquered_cherry_wood',license:'CC0-1.0',physicalTileMetres:1,grain:'Member-aligned metric UV, original scan luminance/normal/roughness pixels; inferred linear paint pigment and varnish, not measured temple albedo'},
  dispose(){for(const tex of[albedo,normal,roughness])tex.dispose();}};
}

export function assignMetricTimberUV(geometry,matrix){
 geometry.computeBoundingBox();const size=geometry.boundingBox.getSize(new T.Vector3()),scale=new T.Vector3().setFromMatrixScale(matrix);
 const lengths=[size.x*scale.x,size.y*scale.y,size.z*scale.z],long=lengths.indexOf(Math.max(...lengths)),s=[scale.x,scale.y,scale.z];
 const position=geometry.attributes.position,normal=geometry.attributes.normal,uv=new Float32Array(position.count*2);
 const seed=Math.sin(matrix.elements[12]*12.713+matrix.elements[13]*4.13+matrix.elements[14]*5.71)*43758.5453,offset=seed-Math.floor(seed);
 for(let i=0;i<position.count;i++){
  const p=[position.getX(i),position.getY(i),position.getZ(i)],n=[Math.abs(normal.getX(i)),Math.abs(normal.getY(i)),Math.abs(normal.getZ(i))];
  const perpendicular=[0,1,2].filter(a=>a!==long);
  const cross=perpendicular[0]===n.indexOf(Math.max(...n))?perpendicular[1]:perpendicular[0];
  if(n[long]>.85){uv[i*2]=p[perpendicular[0]]*s[perpendicular[0]]+offset;uv[i*2+1]=p[perpendicular[1]]*s[perpendicular[1]]+offset*.37;}
  else{uv[i*2]=p[long]*s[long]+offset;uv[i*2+1]=p[cross]*s[cross]+offset*.37;}
 }
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
}
