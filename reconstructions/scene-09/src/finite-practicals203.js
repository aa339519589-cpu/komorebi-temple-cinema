import * as T from 'three';

// The old aggregate paper-exit point produced a near-field singularity on
// its own case. Keep its far-field inverse-square flux, but integrate a
// finite emitting footprint instead of treating paper as a dimensionless
// bulb. This is a bounded native approximation, not an exact area emitter.
export function installFinitePracticals203(scene,materials){
 const lights=[];scene.traverseVisible(o=>{if(o.isPointLight)lights.push(o);});
 // This is the stable ordering used by the pinned local WebGLLights runtime.
 lights.sort((a,b)=>(b.castShadow?2:0)-(a.castShadow?2:0)+(b.map?1:0)-(a.map?1:0));
 const radii=lights.map(l=>{
  const s=l.userData.source203;if(!s)return l.name.includes('underbridge')?.13:.06;
  if(s.kind==='sanctuary-votive203')return .035;
  if(s.kind==='sanctuary-hanging221')return .18;
  const scale=s.assemblyScale||1;
  return s.requestedIntensity===7.2?.44*scale:s.requestedIntensity>=38?.47*scale:.32*Math.sqrt(s.requestedIntensity/24.5)*scale;
 });
 const source='getPointLightInfo( pointLight, geometryPosition, directLight );';
 const fragment=T.ShaderChunk.lights_fragment_begin.replace(source,source+`
  directLight.color*=finiteFalloff203(pointLight.position-geometryPosition,finiteRadius203[i]);`);
 if(fragment===T.ShaderChunk.lights_fragment_begin)throw Error('Pinned point-light integration no longer matches');
 for(const m of materials){if(!m.isMeshStandardMaterial)continue;
  const old=m.onBeforeCompile,oldKey=m.customProgramCacheKey.bind(m);
  m.onBeforeCompile=s=>{old.call(m,s);s.uniforms.finiteRadius203={value:radii};s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\n#if NUM_POINT_LIGHTS > 0\nuniform float finiteRadius203[NUM_POINT_LIGHTS];\nfloat finiteFalloff203(vec3 delta,float radius){float d=dot(delta,delta);return d/(d+radius*radius);}\n#endif').replace('#include <lights_fragment_begin>',fragment);};
  m.customProgramCacheKey=()=>oldKey()+'-finite-paper-footprint203-r08';m.needsUpdate=true;
 }
 return{revision:'scene09-finite-paper-footprint203-r08',approximation:'Point irradiance multiplied by d²/(d²+r²), preserving far-field flux and finite local response; same light/shadow ordering as pinned runtime',fixtures:lights.map((l,i)=>({name:l.name,position:l.position.toArray(),radius:radii[i],geometryShadow:l.castShadow})),exactAreaTransport:false};
}
