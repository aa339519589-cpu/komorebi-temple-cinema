import * as T from 'three';
// Poly Haven CC0 lacquered_cherry_wood scan. Provenance accompanies the maps.
// Instanced member dimensions drive UVs in the shader, preserving one draw per
// existing geometry/material bucket instead of cloning every timber member.
export async function installScannedTimber(mats,scene){
 const directory=new URL('../../assets/polyhaven/lacquered-cherry-wood/',import.meta.url).href,loader=new T.TextureLoader();
 const [albedo,normal,rough]=await Promise.all(['diffuse-2k.jpg','normal-gl-2k.png','roughness-2k.jpg'].map(x=>loader.loadAsync(directory+x)));
 albedo.colorSpace=T.SRGBColorSpace;
 for(const tex of[albedo,normal,rough]){tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=8;}
 // The source is a very dark brown table: mean decoded linear Y=.0150512.
 // Vermilion paint takes its pigment from the material, and only the measured
 // scan's relative luminance becomes grain. Normal/roughness stay untouched.
 const pigment=new Map([[mats.red,'#bb4b29'],[mats.cedar,'#9c4928'],[mats.floor,'#925034'],[mats.hallBearing,'#5d321b'],[mats.hallOxide,'#762f1b'],[mats.hallColumnRed,'#8c3726'],[mats.verandaRed,'#9b4028']]);
 const targets=new Map([[mats.red,[4.8,2.5,2.3]],[mats.cedar,[2.5,1.6,1.3]],[mats.darkwood,[.95,.80,.75]],[mats.floor,[1.8,1.35,1.1]],[mats.hallBearing,[1,1,1]],[mats.hallOxide,[1,1,1]],[mats.hallColumnRed,[1,1,1]],[mats.verandaRed,[1,1,1]]]);
 scene.traverse(o=>{const m=o.material;if(!m||targets.has(m))return;if(m.name==='scene02-darkwood')targets.set(m,[.95,.80,.75]);});
 for(const [m,color] of targets){
  const previousCompile=m.onBeforeCompile,previousKey=m.customProgramCacheKey.bind(m);
  m.map=albedo;m.normalMap=normal;m.normalScale.set(.18,.18);m.bumpMap=null;m.roughnessMap=rough;m.roughness=.85;m.metalness=0;m.color.setRGB(...color);if(pigment.has(m))m.color.set(pigment.get(m));
  m.onBeforeCompile=shader=>{
   previousCompile.call(m,shader);
   if(pigment.has(m))shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
    vec4 timberTexel=texture2D(map,vMapUv);
    float timberY=dot(timberTexel.rgb,vec3(.2126,.7152,.0722));
    float paintedGrain=clamp(pow(max(timberY,.00005)/.01505120736,.55),.52,1.46);
    diffuseColor.rgb*=paintedGrain;
   #endif`);
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
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    roughnessFactor=clamp(.36+roughnessFactor*.72,.42,.94);`);
   if(m===mats.floor){
    shader.vertexShader='varying vec2 vVerandaXZ;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
     vec4 verandaPoint=vec4(position,1.);
     #ifdef USE_INSTANCING
      verandaPoint=instanceMatrix*verandaPoint;
     #endif
     vVerandaXZ=(modelMatrix*verandaPoint).xz;`);
    shader.fragmentShader='varying vec2 vVerandaXZ;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('roughnessFactor=clamp(.36+roughnessFactor*.72,.42,.94);',`
     float verandaWear=exp(-pow((vVerandaXZ.x-15.55)/.58,4.));
     float verandaWet=clamp(.55+.20*sin(vVerandaXZ.x*2.1+vVerandaXZ.y*.37)+.14*sin(vVerandaXZ.y*.83),.18,.89);
     roughnessFactor=clamp(.25+.23*roughnessFactor+.14*verandaWear-.07*verandaWet,.24,.58);`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
     #ifdef USE_CLEARCOAT
      material.clearcoat=clamp(.62+.35*verandaWet-.12*verandaWear,.35,.96);
      material.clearcoatRoughness=mix(.22,.075,verandaWet)+.020*verandaWear;
     #endif`);
   }
  };
  if(m===mats.floor){m.clearcoat=.82;m.clearcoatRoughness=.16;}
  m.customProgramCacheKey=()=>previousKey()+':scene02-cc0-member-timber-v2-'+(pigment.has(m)?'painted':'raw')+(m===mats.floor?':veranda73':'');m.userData.timberFinish={role:pigment.has(m)?'pigment with normalised scan grain':'retained original dark scan',pigment:pigment.get(m)??null,sourceLinearMeanY:.01505120736,normalStrength:.18,photoRGB:false};m.needsUpdate=true;
 }
 return {textures:[albedo,normal,rough],info:{revision:'scene02-linear-grain-painted-timber-73-veranda',sourceLinearMeanY:.01505120736,normalMapPreserved:true,roughnessMapPreserved:true,floorReflection:'Actual board clearcoat/PBR roughness and the existing captured scene probe; no spanning mirror plane',targets:[...targets.keys()].map(m=>({name:m.name,...m.userData.timberFinish}))}};
}
export function addTimberExtent(g){
 if(g.hasAttribute('timberExtent'))return;
 g.computeBoundingBox();const size=g.boundingBox.getSize(new T.Vector3()),a=new Float32Array(g.attributes.position.count*3);
 for(let i=0;i<g.attributes.position.count;i++)a.set([size.x,size.y,size.z],i*3);
 g.setAttribute('timberExtent',new T.Float32BufferAttribute(a,3));
}
