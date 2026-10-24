import {ShaderChunk} from 'three';

// Wood and opaque vermilion lacquer have different grain/varnish roles.
// End rings are a metric material hypothesis on actual transverse faces,
// independent of the photograph and of the longitudinal CC0 scan.
export function installTimberEndGrain212(material){
 if(!material?.userData.timberFinish212||material.userData.timberEndGrain212)return;
 const prior=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material),lacquer=material.userData.timberFinish212.role==='opaque-vermilion-lacquer';
 material.defaultAttributeValues={...material.defaultAttributeValues,timber212End:[0],timber212EndUv:[0,0]};
 material.onBeforeCompile=(s,r)=>{
  prior.call(material,s,r);
  s.vertexShader='attribute float timber212End;attribute vec2 timber212EndUv;varying float vTimber212End;varying vec2 vTimber212EndUv;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTimber212End=timber212End;vTimber212EndUv=timber212EndUv;');
  s.fragmentShader='varying float vTimber212End;varying vec2 vTimber212EndUv;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec3 timber212BaseColor=diffuseColor.rgb;
#include <map_fragment>
float timber212EndWeight=clamp(vTimber212End,0.0,1.0)*${lacquer?'0.0':'1.0'};
vec2 timber212RingPoint=vTimber212EndUv+vec2(.173,-.091);
float timber212Radial=length(timber212RingPoint)+.0012*sin(timber212RingPoint.x*39.0+timber212RingPoint.y*21.0);
float timber212Phase=timber212Radial/.0048;
float timber212RingAA=1.0-smoothstep(.38,1.15,fwidth(timber212Phase));
float timber212EndAlbedo=.76+.065*cos(timber212Phase*6.2831853)*timber212RingAA;
diffuseColor.rgb=mix(diffuseColor.rgb,timber212BaseColor*timber212EndAlbedo,timber212EndWeight);`);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,min(1.0,roughnessFactor*1.14),timber212EndWeight);');
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','vec3 timber212UnperturbedNormal=normal;\n#include <normal_fragment_maps>\nnormal=normalize(mix(normal,timber212UnperturbedNormal,timber212EndWeight));');
 };
 material.customProgramCacheKey=()=>key()+':timber212-transverse-endgrain-r23:'+lacquer;
 material.userData.timberEndGrain212={metricRingPitchMetres:.0048,longitudinalScanRemovedOnEnd:true,opaqueLacquerCoversEndGrain:lacquer,referenceImageUsed:false};material.needsUpdate=true;
}

export function timberMaterialAudit212(materials){
 return[...materials].filter(m=>m.userData.timberFinish212||m.userData.carvedBearing212||m.userData.sculpt212||m.metalness>.4).map(m=>({name:m.name,colorLinear:m.color.toArray(),roughness:m.roughness,metalness:m.metalness,clearcoat:m.clearcoat??0,clearcoatRoughness:m.clearcoatRoughness??null,normalScale:m.normalScale?.toArray()??null,map:m.map?.name??null,roughnessMap:m.roughnessMap?.name??null,environmentIntensity:m.envMapIntensity,actualLocalReflection:!!m.userData.porchGiltReflection212,role:m.userData.timberFinish212?.role??(m.userData.sculpt212||m.userData.carvedBearing212?'mixed-carved-gilt':'solid-aged-gilt'),endGrain:!!m.userData.timberEndGrain212}));
}

// Capture receivers are metal fittings and the metallic regions of the two
// genuinely sculpted mixed materials. Bare exterior timber never gets this map.
export function installPorchGiltReflection212(material,texture,{intensity=.32,priorSkyIntensity=.09,originalSky=null}={}){
 const mask=material.userData.carvedBearing212?'vBeam212Gilt':material.userData.sculpt212?'vSculpt212Gilt':null;
 if(mask){
  const image=originalSky?.image;if(!image?.width||!image?.height)throw Error('Original sky PMREM required for mixed gilded wood');
  // The two real PMREM atlases may have different sizes. Namespace Three's
  // actual sampler and give the original sky its own atlas metrics; sampling
  // it with the local cube's compile-time dimensions would be incorrect.
  const cube=ShaderChunk.cube_uv_reflection_fragment.replace(/\bcubeUV_\w+\b/g,t=>'wood212_'+t).replace(/\b(?:getFace|getUV|bilinearCubeUV|roughnessToMip|textureCubeUV)\b/g,t=>'wood212_'+t).replace(/\bCUBEUV_TEXEL_WIDTH\b/g,'wood212SkyTexelWidth').replace(/\bCUBEUV_TEXEL_HEIGHT\b/g,'wood212SkyTexelHeight').replace(/\bCUBEUV_MAX_MIP\b/g,'wood212SkyMaxMip');
  const skyIbl=ShaderChunk.envmap_physical_pars_fragment.replace(/\bgetIBL\w+\b/g,t=>'wood212_'+t).replace(/\benvMap\b/g,'wood212OriginalSky').replace(/\benvMapIntensity\b/g,'wood212OriginalSkyIntensity').replace(/\btextureCubeUV\b/g,'wood212_textureCubeUV');
  const maps=ShaderChunk.lights_fragment_maps.replace(/\b(getIBL\w+)\(\s*([^()]*)\)/g,(_,fn,args)=>`mix(wood212_${fn}(${args}),${fn}(${args}),clamp(${mask},0.0,1.0))`);
  const prior=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
  material.onBeforeCompile=(s,r)=>{
   prior.call(material,s,r);Object.assign(s.uniforms,{wood212OriginalSky:{value:originalSky},wood212OriginalSkyIntensity:{value:priorSkyIntensity},wood212SkyTexelWidth:{value:1/image.width},wood212SkyTexelHeight:{value:1/image.height},wood212SkyMaxMip:{value:Math.log2(image.height)-2}});
   s.fragmentShader='uniform sampler2D wood212OriginalSky;uniform float wood212OriginalSkyIntensity;uniform float wood212SkyTexelWidth;uniform float wood212SkyTexelHeight;uniform float wood212SkyMaxMip;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <envmap_physical_pars_fragment>','#include <envmap_physical_pars_fragment>\n'+cube+'\n'+skyIbl).replace('#include <lights_fragment_maps>',maps);
  };
  material.customProgramCacheKey=()=>key()+':porch212-exact-sky-metal-split-r25';
 }
 material.envMap=texture;material.envMapIntensity=intensity;material.userData.porchGiltReflection212={actualSceneCapture:true,capturedIblScope:mask?'Metallic scalar regions only':'Solid gilt material',woodUsesOriginalSky:!!mask,nonIblLightingPostMultiplied:false,originalSkyAtlas:mask?[originalSky.image.width,originalSky.image.height]:null,originalSkyIntensity:mask?priorSkyIntensity:null,scope:'Separate real sky and local scene PMREM sampling by metal mask; single local approximation, not full GI.'};material.needsUpdate=true;
}
