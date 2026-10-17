/** Reference-led appearance edits on the existing physical scene, never generated imagery. */
import * as T from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
const installed=new WeakMap();
function createThresholdWater(world,renderer){
 const threshold=world.thresholdSurface;if(!threshold)return null;
 const {plan,slabs}=threshold,center=[(plan.bounds.minX+plan.bounds.maxX)/2,(plan.bounds.minZ+plan.bounds.maxZ)/2],positions=[];
 for(const slab of slabs){const g=slab.geometry,p=g.attributes.position,n=g.attributes.normal,index=g.index;
  for(let i=0;i<(index?.count??p.count);i+=3){const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);if(ids.some(id=>n.getY(id)<.9))continue;for(const id of ids)positions.push(p.getX(id),-p.getZ(id),0);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const size=Math.min(1024,Math.max(256,renderer.domElement.width));
 const film=new Reflector(geometry,{textureWidth:size,textureHeight:size,multisample:0,clipBias:.001,color:0xffffff});
 film.name='reference10-actual-threshold-rain-film';film.position.set(center[0],plan.stoneTop+.0007,center[1]);film.rotation.x=-Math.PI/2;film.renderOrder=4;
 film.userData.excludeFromGTAO=true;film.userData.excludeFromEnvironmentBake=true;film.userData.surfaceEvidence='Wet film over the existing cut stone tops; original column holes and slab extents retained.';
 const material=film.material;material.transparent=true;material.depthWrite=false;material.uniforms.rainTime={value:66.5};material.uniforms.reflectionGain={value:1};
 material.vertexShader=material.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec3 vWetWorld;').replace('vUv = textureMatrix','vWetWorld=(modelMatrix*vec4(position,1.0)).xyz;\n vUv = textureMatrix');
 material.fragmentShader=material.fragmentShader.replace('varying vec4 vUv;',`varying vec4 vUv; varying vec3 vWetWorld; uniform float rainTime,reflectionGain;
 float rh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 vec2 drops(vec2 p){vec2 cell=floor(p*4.0),local=fract(p*4.0),grad=vec2(0.0);for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 k=vec2(float(x),float(y)),seed=cell+k,origin=vec2(rh(seed),rh(seed+19.2));float age=fract(rainTime*.64+rh(seed+31.8)),r=length(local-k-origin),wave=r-age*.85;float ring=exp(-wave*wave*190.0)*(1.0-age)*(1.0-age)*cos(wave*80.0);grad+=normalize(local-k-origin+vec2(.0001))*ring;}return grad;}
 `);
 material.fragmentShader=material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec2 ripple=drops(vWetWorld.xz);vec4 project=vUv;project.xy+=ripple*.0008*project.w;vec4 base=texture2DProj(tDiffuse,project);`);
 const original='gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );';
 if(!material.fragmentShader.includes(original))throw Error('Pinned threshold reflection shader changed');
 material.fragmentShader=material.fragmentShader.replace(original,`vec3 view=normalize(cameraPosition-vWetWorld);float grazing=pow(1.0-clamp(view.y,0.0,1.0),5.0);float coverage=.58+.13*sin(vWetWorld.x*3.1+sin(vWetWorld.z*2.7));float alpha=clamp((.025+.975*grazing)*coverage,.025,.78);gl_FragColor=vec4(base.rgb*reflectionGain,alpha);`);
 material.needsUpdate=true;
 const peers=[world.water,world.puddles,world.restorationLighting.floorReflector].filter(Boolean),wrappers=[];
 const hide=(objects,fn)=>{const visible=objects.map(o=>o.visible);objects.forEach(o=>o.visible=false);try{return fn();}finally{objects.forEach((o,i)=>o.visible=visible[i]);}};
 const native=film.onBeforeRender;film.onBeforeRender=function(...args){return hide(peers,()=>native.apply(this,args));};
 for(const peer of peers){const original=peer.onBeforeRender,replacement=function(...args){return hide([film],()=>original.apply(this,args));};peer.onBeforeRender=replacement;wrappers.push({peer,original,replacement});}
 world.scene.add(film);world.transparentNormalExclusions.push(film);world.restorationLighting.reflectionExclusions.push(film);
 return{film,report:{surfaceY:film.position.y,triangles:positions.length/9,reflectionSize:size,geometry:'Original slab top triangles, same holes and boundaries',rainfall:'Procedural impact normals, no photograph or stock texture'},dispose(){for(const {peer,original,replacement}of wrappers)if(peer.onBeforeRender===replacement)peer.onBeforeRender=original;for(const list of[world.transparentNormalExclusions,world.restorationLighting.reflectionExclusions]){const i=list.indexOf(film);if(i>=0)list.splice(i,1);}film.removeFromParent();film.dispose();geometry.dispose();}};
}
export function installVisualRestoration(temple){
 if(installed.has(temple))return installed.get(temple);
 const world=temple.world;if(!world)throw Error('Visual restoration requires the existing world handle.');
 const materials=new Set();world.scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
 const originalMaterials=new Map([...materials].map(m=>[m,{color:m.color?.clone(),roughness:m.roughness,emissiveIntensity:m.emissiveIntensity,envMapIntensity:m.envMapIntensity}]));
 const water=temple.sceneVariant==='reference10-porch'?createThresholdWater(world,temple.renderer):null;
 const nativeUpdate=world.update;let lastMode=null,baseline=null;
 const report={version:'reference-visual-r1',accepted:false,wetThreshold:water?.report??null,edits:[]};
 function update(t){
  nativeUpdate.call(world,t);const mode=world.restorationLighting.mode;
  if(mode!==lastMode){baseline={exposure:temple.renderer.toneMappingExposure,environment:world.scene.environmentIntensity,lights:new Map()};world.scene.traverse(o=>{if(o.isLight)baseline.lights.set(o,o.intensity);});lastMode=mode;}
  const room=mode==='sanctuary',rain=mode==='rain';
  if(!room&&!rain){if(water)water.film.visible=false;return;}
  temple.renderer.toneMappingExposure=room?1.52:1.38;
  world.scene.environmentIntensity=baseline.environment*(room?1.2:1.5);
  for(const [light,value]of baseline.lights){let gain=1;if(light.isHemisphereLight)gain=room?1.15:1.30;else if(light.isRectAreaLight)gain=room?1.6:1.4;else if(light.isPointLight||light.isSpotLight)gain=room?1.5:3.6;light.intensity=value*gain;}
  for(const rig of [world.windowLighting,world.lanternLighting,world.porchLanternLighting].filter(Boolean)){
   const original=originalMaterials.get(rig.material);if(original)rig.material.emissiveIntensity=original.emissiveIntensity*(room?1.8:3.6);
   for(const source of rig.sources){source.light.distance=Math.max(source.light.distance,Math.sqrt(source.light.intensity/.015));source.light.shadow.camera.far=Math.max(source.light.shadow.camera.near+.01,source.light.distance);source.light.shadow.camera.updateProjectionMatrix();}
  }
  for(const [material,original]of originalMaterials){
   if(rain&&/^(red|architecture_red)$/.test(material.name)){material.color.set('#a23e27');material.roughness=.30;}
   if(rain&&/^reference10-threshold-granite-/.test(material.name)){material.roughness=.16;material.bumpScale=.002;}
   if(room&&(material.name==='buddha'||material.name==='restoration-private-room-gold'))material.envMapIntensity=(original.envMapIntensity??1)*(material.name==='buddha'?1.45:1.3);
  }
  if(water){water.film.visible=rain;water.film.material.uniforms.rainTime.value=t;}
  if(room&&world.restorationLighting.floorReflector){const u=world.restorationLighting.floorReflector.material.uniforms;if(u.floorReflectionLod)u.floorReflectionLod.value=1.2;}
 }
 world.update=update;
 report.edits=['Source-aware brighter warm practicals, not emissive whole buildings','Rain-film reflection on the actual raised stone threshold','Rain-only wet red lacquer response','Sanctuary gold/reflection/exposure balance'];
 const api={info:()=>({...report,mode:lastMode,gpuSubmission:temple.renderer.gpuSubmissionInfo?.()??null}),dispose(){if(world.update===update)world.update=nativeUpdate;water?.dispose();for(const [m,s]of originalMaterials){if(s.color)m.color.copy(s.color);if(s.roughness!==undefined)m.roughness=s.roughness;if(s.emissiveIntensity!==undefined)m.emissiveIntensity=s.emissiveIntensity;if(s.envMapIntensity!==undefined)m.envMapIntensity=s.envMapIntensity;}}};
 temple.visualRestorationInfo=api.info;installed.set(temple,api);return api;
}
