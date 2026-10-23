import * as T from 'three';
// Poly Haven CC0 lacquered_cherry_wood scan. Provenance accompanies the maps.
// Instanced member dimensions drive UVs in the shader, preserving one draw per
// existing geometry/material bucket instead of cloning every timber member.
export async function installScannedTimber(mats){
 const directory=new URL('../assets/timber/',import.meta.url).href,loader=new T.TextureLoader();
 const [albedo,normal,rough]=await Promise.all(['diffuse-2k.jpg','normal-gl-2k.png','roughness-2k.jpg'].map(x=>loader.loadAsync(directory+x)));
 albedo.colorSpace=T.SRGBColorSpace;
 for(const tex of[albedo,normal,rough]){tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=8;}
 const gains={red:[4.15,2.46,1.55],cedar:[3.85,2.60,1.72],endwood:[4.25,3.05,1.95],gableTimber180:[.54,.22,.075],gableCarving:[.45,.18,.060],gableRecess:[.55,.28,.12],darkwood:[1.5,1.05,.73],bridge:[6.65,2.15,1.72],bridgeDark:[2.7,1.6,1.1],ceiling:[1.8,1.3,1.0]};
 for(const [key,color] of Object.entries(gains)){
  const m=mats[key];if(!m)continue;m.map=albedo;m.normalMap=normal;m.normalScale.set(.18,.18);m.bumpMap=null;m.roughnessMap=rough;m.roughness=.9;m.metalness=0;m.color.setRGB(...color);
  m.onBeforeCompile=shader=>{
   shader.vertexShader='attribute vec3 timberExtent;varying vec2 timberEndUv174;varying float timberEnd174;\n'+shader.vertexShader;
   shader.fragmentShader='varying vec2 timberEndUv174;varying float timberEnd174;\n'+shader.fragmentShader;
   shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
    vec3 memberScale=vec3(1.);float memberOffset=0.;
    #ifdef USE_INSTANCING
     memberScale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
     memberOffset=fract(sin(dot(instanceMatrix[3].xyz,vec3(12.713,4.13,5.71)))*43758.5453);
    #else
     memberScale=vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),length(modelMatrix[2].xyz));
    #endif
    vec3 p=position*memberScale,spans=timberExtent*memberScale,nn=abs(normal);
    vec2 metricUV;
    if(spans.y>=spans.x&&spans.y>=spans.z){timberEnd174=nn.y;timberEndUv174=p.xz;metricUV=nn.y>.7?p.xz:vec2(p.y,nn.x>nn.z?p.z:p.x);}
    else if(spans.x>=spans.z){timberEnd174=nn.x;timberEndUv174=p.zy;metricUV=nn.x>.7?p.zy:vec2(p.x,nn.y>nn.z?p.z:p.y);}
    else{timberEnd174=nn.z;timberEndUv174=p.xy;metricUV=nn.z>.7?p.xy:vec2(p.z,nn.y>nn.x?p.x:p.y);}
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
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    float cut174=smoothstep(.70,.96,timberEnd174);
    float growth174=.5+.5*cos(length(timberEndUv174*vec2(.93,1.)+vec2(.026,-.009))*490.+.4*sin(timberEndUv174.x*160.));
    diffuseColor.rgb*=mix(vec3(1.),vec3(.68,.72,.80)*(.96+.04*growth174),cut174);`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    roughnessFactor=clamp(.36+roughnessFactor*.72,.42,.94);`);
  };
  m.customProgramCacheKey=()=> 'scene03-cc0-member-timber-endgrain174-r02';m.needsUpdate=true;
 }
 return {materials:new Set(Object.values(mats)),dispose(){for(const t of[albedo,normal,rough])t.dispose();}};
}
export function addTimberExtent(g){
 if(g.hasAttribute('timberExtent'))return;
 g.computeBoundingBox();const size=g.boundingBox.getSize(new T.Vector3()),a=new Float32Array(g.attributes.position.count*3);
 for(let i=0;i<g.attributes.position.count;i++)a.set([size.x,size.y,size.z],i*3);
 g.setAttribute('timberExtent',new T.Float32BufferAttribute(a,3));
}
