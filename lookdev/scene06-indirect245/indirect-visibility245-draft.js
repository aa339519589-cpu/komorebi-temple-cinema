import * as T from 'three';

// Pending native review. This is a material-lighting change, not an image
// grade: screen visibility attenuates indirect diffuse/specular components.
// Direct lamp/sun terms and emissive radiance are deliberately untouched.
// Pinned GTAOPass.output=Off still computes its denoised public gtaoMap.
export function installIndirectVisibility245({scene,aoPass,width,height,reflectors=[],strength=.65}){
 if(!aoPass?.gtaoMap)throw Error('A native denoised GTAO visibility map is required.');
 const uniforms={map:{value:aoPass.gtaoMap},size:{value:new T.Vector2(width,height)},enabled:{value:0},strength:{value:strength}};
 const materials=new Set(),restore=[];
 scene.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m?.isMeshStandardMaterial&&!m.transparent&&!(m.transmission>0))materials.add(m);});
 for(const m of materials){
  const previousHook=m.onBeforeCompile,previousKey=m.customProgramCacheKey(),previousKeyFunction=m.customProgramCacheKey;
  m.onBeforeCompile=function(shader,renderer){
   previousHook.call(this,shader,renderer);
   const anchor='#include <aomap_fragment>';
   if(shader.fragmentShader.split(anchor).length!==2)throw Error('Expected one pinned standard indirect-occlusion insertion.');
   Object.assign(shader.uniforms,{tVisibility245:uniforms.map,visibilityImageSize245:uniforms.size,visibilityEnabled245:uniforms.enabled,visibilityStrength245:uniforms.strength});
   shader.fragmentShader='uniform sampler2D tVisibility245;\nuniform vec2 visibilityImageSize245;\nuniform float visibilityEnabled245,visibilityStrength245;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace(anchor,anchor+`
    float screenVisibility245=1.0;
    if(visibilityEnabled245>.5){
     float visibility245=texture2D(tVisibility245,gl_FragCoord.xy/visibilityImageSize245).r;
     screenVisibility245=mix(1.0,clamp(visibility245,0.0,1.0),visibilityStrength245);
    }
    reflectedLight.indirectDiffuse*=screenVisibility245;
    #ifdef USE_CLEARCOAT
     clearcoatSpecularIndirect*=screenVisibility245;
    #endif
    #ifdef USE_SHEEN
     sheenSpecularIndirect*=screenVisibility245;
    #endif
    #if defined(USE_ENVMAP)&&defined(STANDARD)
     float viewCos245=saturate(dot(geometryNormal,geometryViewDir));
     reflectedLight.indirectSpecular*=computeSpecularOcclusion(viewCos245,screenVisibility245,material.roughness);
    #endif
   `);
  };
  m.customProgramCacheKey=()=>previousKey+':indirect-screen-visibility245-r01';m.needsUpdate=true;
  restore.push(()=>{m.onBeforeCompile=previousHook;m.customProgramCacheKey=previousKeyFunction;m.needsUpdate=true;});
 }
 // The planar mirror uses another camera/viewport. Main-camera AO must never
 // be projected onto that reflected view. Initial room cube captures must be
 // complete before this installation; dynamic extra captures require guards.
 for(const reflector of reflectors){
  const previous=reflector.onBeforeRender;
  reflector.onBeforeRender=function(...args){const enabled=uniforms.enabled.value;uniforms.enabled.value=0;try{return previous.apply(this,args);}finally{uniforms.enabled.value=enabled;}};
  restore.push(()=>{reflector.onBeforeRender=previous;});
 }
 return{
  beginMainView(){uniforms.enabled.value=1;},
  endMainView(){uniforms.enabled.value=0;},
  info:{revision:'245-r01-draft',materialCount:materials.size,oneAdditionalSamplerPerAffectedProgram:true,strength,scope:'Screen-space indirect visibility approximation; actual geometry remains the source of direct shadows. Not full GI, offscreen visibility, physical multiple scattering or a photographic acceptance.',requiresBeforeBeautyAO:true,requiresAOPassOutputOff:true,requiresCompletedInitialEnvironmentCaptures:true,photographicAccepted:false,nativeReviewed:false},
  dispose(){for(const undo of restore.reverse())undo();}
 };
}
