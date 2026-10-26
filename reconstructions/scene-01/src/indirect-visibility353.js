import * as T from 'three';
// Adapted from the repository's reviewed245 insertion. This scene has ample
// sampler budget; preserve its existing LTC tables and add one visibility map.
export function installIndirectVisibility353({scene,aoPass,width,height,reflectors=[],strength=.58}){
 const uniforms={map:{value:aoPass.gtaoMap},size:{value:new T.Vector2(width,height)},on:{value:0},strength:{value:strength}},restore=[],materials=new Set();scene.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m?.isMeshStandardMaterial&&!m.transparent&&!(m.transmission>0))materials.add(m);});
 for(const m of materials){const hook=m.onBeforeCompile,key=m.customProgramCacheKey(),keyFn=m.customProgramCacheKey;m.onBeforeCompile=function(s,r){hook.call(this,s,r);if(s.fragmentShader.includes('uniform sampler2D tVisibility353;'))return;const anchor='#include <aomap_fragment>';if(s.fragmentShader.split(anchor).length!==2)throw Error('353 expected one standard indirect AO anchor');Object.assign(s.uniforms,{tVisibility353:uniforms.map,visibilitySize353:uniforms.size,visibilityOn353:uniforms.on,visibilityStrength353:uniforms.strength});s.fragmentShader='uniform sampler2D tVisibility353;uniform vec2 visibilitySize353;uniform float visibilityOn353,visibilityStrength353;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace(anchor,anchor+`
 float visibility353=1.0;if(visibilityOn353>.5)visibility353=mix(1.0,clamp(texture2D(tVisibility353,gl_FragCoord.xy/visibilitySize353).r,0.0,1.0),visibilityStrength353);
 reflectedLight.indirectDiffuse*=visibility353;
 #ifdef USE_CLEARCOAT
 clearcoatSpecularIndirect*=visibility353;
 #endif
 #ifdef USE_SHEEN
 sheenSpecularIndirect*=visibility353;
 #endif
 #if defined(USE_ENVMAP)&&defined(STANDARD)
 reflectedLight.indirectSpecular*=computeSpecularOcclusion(saturate(dot(geometryNormal,geometryViewDir)),visibility353,material.roughness);
 #endif
 `);};m.customProgramCacheKey=()=>key+':353-indirect-visibility-only';m.needsUpdate=true;restore.push(()=>{m.onBeforeCompile=hook;m.customProgramCacheKey=keyFn;m.needsUpdate=true;});}
 for(const o of reflectors){const hook=o.onBeforeRender;o.onBeforeRender=function(...args){const previous=uniforms.on.value;uniforms.on.value=0;try{return hook.apply(this,args);}finally{uniforms.on.value=previous;}};restore.push(()=>o.onBeforeRender=hook);}
 return{begin(){uniforms.on.value=1;},end(){uniforms.on.value=0;},info:{source:'Reviewed245 indirect-component insertion adapted without LTC packing',materialCount:materials.size,strength,directAndEmissiveUntouched:true,reflectionCamerasBypassMainViewAO:true,fullGI:false},dispose(){for(const undo of restore.reverse())undo();}};
}
