export function applyReferenceRainAtmosphere(world,renderer,{fogDensity=world.restorationLighting.profile.mist,exposure=1.28}={}){
 if(world.restorationLighting.mode!=='rain'||!Number.isFinite(fogDensity)||fogDensity<0||fogDensity>.02||!Number.isFinite(exposure)||exposure<.5||exposure>2)throw Error('Invalid rain reference atmosphere');
 const saved={fog:world.scene.fog?.density,exposure:renderer.toneMappingExposure,materials:[],lights:[]},seen=new Set();
 if(world.scene.fog)world.scene.fog.density=fogDensity;renderer.toneMappingExposure=exposure;
 world.scene.traverse(o=>{
  if((o.isPointLight||o.isSpotLight)&&o.intensity>0&&/lantern|window/.test(o.name)){saved.lights.push({o,color:o.color.clone()});o.color.set('#ffbf75');}
  if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m||seen.has(m))continue;seen.add(m);
   if(m.isMeshStandardMaterial&&['red','architecture_red'].includes(m.name)){saved.materials.push({m,color:m.color.clone(),roughness:m.roughness});m.color.set('#8d3424');m.roughness=.27;}
   if(m.isMeshStandardMaterial&&m.emissive?.getHex()>0&&/paper/i.test(m.name)){saved.materials.push({m,emissive:m.emissive.clone()});m.emissive.set('#ffbd70');}
  }
 });
 const report={version:'rain-atmosphere-r1',fogDensityBefore:saved.fog,fogDensity,profileMist:world.restorationLighting.profile.mist,exposure,changedMaterialCount:saved.materials.length,changedPracticalColors:saved.lights.length,geometryChanged:false,environmentSourceChanged:false,scope:'Reversible profile haze and wet lacquer/practical color calibration; not reference acceptance'};
 return{report,dispose(){if(world.scene.fog&&saved.fog!==undefined)world.scene.fog.density=saved.fog;renderer.toneMappingExposure=saved.exposure;saved.materials.forEach(s=>{if(s.color)s.m.color.copy(s.color);if(s.roughness!==undefined)s.m.roughness=s.roughness;if(s.emissive)s.m.emissive.copy(s.emissive)});saved.lights.forEach(s=>s.o.color.copy(s.color));}};
}
