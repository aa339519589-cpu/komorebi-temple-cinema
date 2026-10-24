import * as T from 'three';

// Diffuse fibre paper. The thin variant transmits the shadowed incoming
// backside light and the actual reverse local-IBL lobe. It never emits light
// and invokes no screen-transmission/refraction capture or extra sampler.
let paperTextureCache238=null;
function textures238(){
 if(paperTextureCache238)return paperTextureCache238;
 const n=256,color=new Uint8Array(n*n*4),data=new Uint8Array(n*n*4),hash=(x,y)=>{const a=Math.sin(x*127.1+y*311.7+238.17)*43758.5453;return a-Math.floor(a);};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=(y*n+x)*4,broad=.5+.25*Math.sin(x*.025+y*.013)+.25*Math.sin(x*.011-y*.031),fibre=.5+.30*Math.sin(x*.73+Math.sin(y*.075)*.8)+.20*hash(x,y),q=.86+.075*broad+.035*fibre;
  color[i]=color[i+1]=color[i+2]=Math.round(q*255);color[i+3]=255;
  data[i]=Math.round((.46+.08*fibre)*255);data[i+1]=Math.round((.82+.10*broad+.035*fibre)*255);data[i+2]=0;data[i+3]=255;
 }
 const albedo=new T.DataTexture(color,n,n),surface=new T.DataTexture(data,n,n);
 albedo.colorSpace=T.SRGBColorSpace;
 for(const t of[albedo,surface]){t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=8;t.needsUpdate=true;}
 return paperTextureCache238={albedo,surface};
}
export function createHallPaper238({thin=false}={}){
 const {albedo,surface}=textures238();
 const material=new T.MeshStandardMaterial({name:'scene07-'+(thin?'thin-diffuse-transmitting':'opaque-fibrous')+'-paper238-r28',map:albedo,roughness:.96,roughnessMap:surface,bumpMap:surface,bumpScale:.0006,metalness:0,emissiveIntensity:0});material.color.setRGB(.54,.49,.39);
 material.onBeforeCompile=s=>{
  s.vertexShader=s.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
   vec2 paperOffset238=vec2(0.);
   #ifdef USE_INSTANCING
    paperOffset238=vec2(fract(sin(dot(instanceMatrix[3].xyz,vec3(7.113,3.61,9.37)))*43758.5453),fract(sin(dot(instanceMatrix[3].xyz,vec3(13.77,2.17,6.31)))*12741.173));
   #endif
   #ifdef USE_MAP
    vMapUv+=paperOffset238;
   #endif
   #ifdef USE_ROUGHNESSMAP
    vRoughnessMapUv+=paperOffset238;
   #endif
   #ifdef USE_BUMPMAP
    vBumpMapUv+=paperOffset238;
   #endif`);
  if(thin){
   const call='RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );';
   const chunk=T.ShaderChunk.lights_fragment_begin.replaceAll(call,`${call}
    if(directLight.visible){float paperBack238=max(dot(-geometryNormal,directLight.direction),0.);float fibre238=clamp(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))/.37,.80,1.08);reflectedLight.directDiffuse+=directLight.color*vec3(.18,.15,.09)*(paperBack238*fibre238/3.14159265359);}`);
   s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_begin>',chunk);
   const indirect=T.ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );','iblIrradiance += getIBLIrradiance( geometryNormal );\niblIrradiance += getIBLIrradiance( -geometryNormal )*.35;');
   s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_maps>',indirect);
  }
 };
 material.customProgramCacheKey=()=> 'scene07-actual-paper-reflection-and-diffuse-sheet-transmission238-r28:'+thin;
 material.userData={hallFinish214:true,emitsLight:false,sourceImageSampled:false,fibreBumpModelMetres:.0006,thinDiffuseSheet238:thin,...(thin?{sheetThicknessModelMetres:.0012,backsideDiffuseTransmittanceRGB:[.18,.15,.09],reverseLocalIrradianceWeight:.35}:{} )};return material;
}
