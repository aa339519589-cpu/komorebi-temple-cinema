import * as T from 'three';

// The ceramic's base/coating lobes already use the exact same normal image
// and roughness image. Share only those identical sampler bindings; retain
// both lobes, both UV varyings, their independent scales, full texture bits
// and all existing surface callbacks. This is not texture removal or resize.
export function shareCoatingSamplers238(material){
 const normal=!!material.normalMap&&material.clearcoatNormalMap===material.normalMap,
       roughness=!!material.roughnessMap&&material.clearcoatRoughnessMap===material.roughnessMap;
 if(!normal&&!roughness)return;
 const before=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=s=>{
  before.call(material,s);
  for(const name of['clearcoat_pars_fragment','clearcoat_normal_fragment_maps','lights_physical_fragment'])s.fragmentShader=s.fragmentShader.replace('#include <'+name+'>',T.ShaderChunk[name]);
  if(normal)s.fragmentShader=s.fragmentShader.replace(/uniform\s+sampler2D\s+clearcoatNormalMap\s*;/g,'').replace(/\bclearcoatNormalMap\b/g,'normalMap');
  if(roughness)s.fragmentShader=s.fragmentShader.replace(/uniform\s+sampler2D\s+clearcoatRoughnessMap\s*;/g,'').replace(/\bclearcoatRoughnessMap\b/g,'roughnessMap');
 };
 material.customProgramCacheKey=()=>key()+':identical-image-coating-bindings238-r27:'+normal+':'+roughness;
 material.userData.sharedCoatingSamplers238={normal,roughness,independentLobeScalesRetained:true,uvVaryingsRetained:true,originalTexturesUnchanged:true};material.needsUpdate=true;
}
