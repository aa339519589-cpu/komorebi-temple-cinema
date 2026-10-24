import * as T from 'three';
// Poly Haven CC0 lacquered_cherry_wood scan. Provenance accompanies the maps.
// Instanced member dimensions drive UVs in the shader, preserving one draw per
// existing geometry/material bucket instead of cloning every timber member.
export async function installScannedTimber(mats){
 const directory=new URL('../../../assets/polyhaven/lacquered-cherry-wood/',import.meta.url).href,loader=new T.TextureLoader();
 const [albedo,normal,rough]=await Promise.all(['diffuse-2k.jpg','normal-gl-2k.png','roughness-2k.jpg'].map(x=>loader.loadAsync(directory+x)));
 albedo.colorSpace=T.SRGBColorSpace;
 for(const tex of[albedo,normal,rough]){tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=8;}
 // Reflectance tint of aged vermilion/cedar; the former blue-heavy gains
 // neutralised the red lacquer and made the occupied facade read grey-brown.
 const gains={red:[5.2,2.15,1.35],wood:[2.8,1.8,1.05],dark:[.70,.55,.38]};
 for(const [key,color] of Object.entries(gains)){
  const m=mats[key];m.map=albedo;m.normalMap=normal;m.normalScale.set(.24,.24);m.bumpMap=null;m.roughnessMap=rough;m.roughness=.9;m.metalness=0;m.color.setRGB(...color);m.userData.scannedTimber=true;if(m.isMeshPhysicalMaterial){m.clearcoat=.10;m.clearcoatRoughness=.60;}
  if(key==='red'){
   // Opaque vermilion pigment is not dark brown wood multiplied by an
   // above-one gain. Retain measured grain/normal, but use bounded actual
   // pigment reflectance and a physically separate clear lacquer lobe.
   m.color.setRGB(.38,.072,.030);m.normalScale.set(.10,.10);m.roughness=.58;m.clearcoat=.24;m.clearcoatRoughness=.34;m.userData.pigmentedLacquer214=true;
  }
  m.onBeforeCompile=shader=>{
   shader.vertexShader='attribute vec3 timberExtent;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
    vec3 memberScale=vec3(1.);float memberOffset=0.;
    #ifdef USE_INSTANCING
     memberScale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
     memberOffset=fract(sin(dot(instanceMatrix[3].xyz,vec3(12.713,4.13,5.71)))*43758.5453);
    #endif
    vec3 p=position*memberScale,spans=timberExtent*memberScale,nn=abs(normal);
    vec2 metricUV;
    if(spans.y>=spans.x&&spans.y>=spans.z)metricUV=vec2(p.y,nn.x>nn.z?p.z:p.x);
    else if(spans.x>=spans.z)metricUV=vec2(p.x,nn.y>nn.z?p.z:p.y);
    else metricUV=vec2(p.z,nn.y>nn.x?p.x:p.y);
    metricUV+=vec2(memberOffset,memberOffset*.37);
    #ifdef USE_MAP
     vMapUv=metricUV;
    #endif
    #ifdef USE_NORMALMAP
     vNormalMapUv=metricUV;
    #endif
    #ifdef USE_ROUGHNESSMAP
     vRoughnessMapUv=metricUV;
    #endif`);
   if(key==='red')shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
    vec3 measuredWood214=texture2D(map,vMapUv).rgb;
    float grain214=clamp(pow(max(dot(measuredWood214,vec3(.2126,.7152,.0722)),.001)/.028,.30),.72,1.18);
    vec3 wornCedar214=clamp(measuredWood214*vec3(4.0,2.4,1.5),vec3(.008),vec3(.62));
    float wear214=clamp(.12+.18*(1.-grain214),.07,.23);
    diffuseColor.rgb=mix(diffuseColor.rgb*grain214,wornCedar214,wear214);
    #endif`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',key==='red'?`#include <roughnessmap_fragment>
    roughnessFactor=clamp(.30+roughnessFactor*.35,.32,.68);`:`#include <roughnessmap_fragment>
    roughnessFactor=clamp(.36+roughnessFactor*.72,.42,.94);`);
   if(key==='red')shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
    #ifdef USE_MAP
    material.clearcoat*=mix(.40,1.,smoothstep(.72,1.12,grain214));
    material.clearcoatRoughness=mix(.46,.28,smoothstep(.72,1.12,grain214));
    #endif`);
  };
  m.customProgramCacheKey=()=> 'scene07-cc0-member-timber-'+key+'-worn-lacquer214-r13';m.needsUpdate=true;
 }
 return {dispose(){for(const t of[albedo,normal,rough])t.dispose();}};
}
export function addTimberExtent(g){
 if(g.hasAttribute('timberExtent'))return;
 g.computeBoundingBox();const size=g.boundingBox.getSize(new T.Vector3()),a=new Float32Array(g.attributes.position.count*3);
 for(let i=0;i<g.attributes.position.count;i++)a.set([size.x,size.y,size.z],i*3);
 g.setAttribute('timberExtent',new T.Float32BufferAttribute(a,3));
}
