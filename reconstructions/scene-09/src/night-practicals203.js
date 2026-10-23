import * as T from 'three';
import{HALL_ENVELOPE143}from'./hall-envelope143.js';
import{PAGODA_FRAME143}from'./pagoda-frame143.js';
import{integrateNativeCell203,installSpatialIrradiance203}from'./spatial-radiance203.js';
import{installFinitePracticals203}from'./finite-practicals203.js';
export const NIGHT203_REVISION='scene09-matte-cedar-practical-pools-night203-r14';
const transformed=(pose,p)=>new T.Vector3(...p).applyMatrix4(new T.Matrix4().compose(new T.Vector3(...pose.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),pose.yaw),new T.Vector3(...pose.scale)));
const hardwareResources203=new WeakMap();
export function disposePracticalHardware203(scene){const r=hardwareResources203.get(scene);if(!r)return;for(const o of r.objects)o.removeFromParent();for(const g of r.geometry)g.dispose();for(const m of r.materials)m.dispose();hardwareResources203.delete(scene);}

function addDownlights203(scene){
 const body=new T.CylinderGeometry(.13,.15,.10,24),stem=new T.CylinderGeometry(.016,.016,.30,12),opal=new T.CylinderGeometry(.104,.104,.012,24),metal=new T.MeshStandardMaterial({name:'scene09-203-hooded-downlight-bronze',color:0x241d14,roughness:.64,metalness:.78}),emitter=new T.MeshBasicMaterial({name:'scene09-203-opal-aperture-exitance',color:new T.Color().setRGB(1.45,.82,.31)}),objects=[],records=[];
 function fixture(pose,label,local,target,cd,reach,angle,mountLocal=null,shadow=true){
  const p=transformed(pose,local),q=transformed(pose,target),direction=q.clone().sub(p).normalize(),g=new T.Group();g.name=label;g.position.copy(p);g.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),direction);
  const hood=new T.Mesh(body,metal);hood.castShadow=true;hood.receiveShadow=true;hood.position.y=.035;const disk=new T.Mesh(opal,emitter);disk.position.y=-.021;g.add(hood,disk);scene.add(g);objects.push(g);
  const rod=new T.Mesh(stem,metal),head=p.clone().addScaledVector(direction,-.07),anchor=mountLocal?transformed(pose,mountLocal):p.clone().add(new T.Vector3(0,.31,0)),delta=anchor.clone().sub(head);rod.name=label+'-mount-stem';rod.castShadow=true;rod.receiveShadow=true;rod.position.copy(anchor).add(head).multiplyScalar(.5);rod.scale.y=delta.length()/.30;rod.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());scene.add(rod);objects.push(rod);
  const light=new T.SpotLight(0xffffff,cd,reach,angle,.72,2);light.color.setRGB(1,.62,.28);light.name=label+'-finite-cone';light.position.copy(p).addScaledVector(direction,.055);light.target.position.copy(q);light.castShadow=shadow;light.shadow.mapSize.set(768,768);light.shadow.camera.near=.08;light.shadow.camera.far=reach;light.shadow.bias=-.000035;light.shadow.normalBias=.012;light.shadow.radius=4;scene.add(light,light.target);objects.push(light,light.target);
  records.push({label,position:p.toArray(),target:q.toArray(),mountAnchor:anchor.toArray(),candela:cd,reach,coneAngle:angle,geometryShadow:shadow,mount:'Closed bronze arm from actual181 joist/post/beam anchor to hood body and closed opal aperture',inferredPhotographicPlacement:true});
 }
 fixture(HALL_ENVELOPE143,'scene09-203-west-entry-hooded-practical',[-5.5,7.30,4.50],[-4.7,4.8,1.55],180,9,.70,[-4.8,7.465,4.50]);
 fixture(HALL_ENVELOPE143,'scene09-203-east-entry-hooded-practical',[5.3,7.30,4.45],[4.6,4.9,1.65],145,8.5,.67,[4.8,7.465,4.45]);
 fixture(HALL_ENVELOPE143,'scene09-203-west-upper-post-practical',[-5.07,9.55,5.38],[-4.10,9.15,3.45],65,3.8,.85,[-5.40,9.72,5.20],false);
 fixture(HALL_ENVELOPE143,'scene09-203-east-upper-post-practical',[5.07,9.55,5.38],[4.25,9.08,3.45],48,3.6,.83,[5.40,9.72,5.20],false);
 for(const[k,cd]of[[0,140],[2,110],[4,85]]){const floor=PAGODA_FRAME143.floor+k*PAGODA_FRAME143.pitch,half=[4.92,4.52,4.12,3.75,3.40][k]/2;fixture(PAGODA_FRAME143,'scene09-203-tier-'+(k+1)+'-gallery-practical',[0,floor+1.42,half+.24],[0,floor+.82,half-.48],cd,2.6,.76,[0,floor+1.56,half+.24],false);}
 hardwareResources203.set(scene,{objects,geometry:[body,stem,opal],materials:[metal,emitter]});return records;
}

export function withNightVolume203(M,materials,label,fn){const held={};for(const k of['red','wood','dark','eaveDark','carvedTimber','ivory','gold','bronze','darkGilt','sanctuaryGilt','buddha','altarGold']){const old=M[k];if(!old)continue;held[k]=old;const m=old.clone();m.name='scene09-203-'+label+'-'+k;m.onBeforeCompile=old.onBeforeCompile;m.customProgramCacheKey=old.customProgramCacheKey;m.userData={...old.userData,nightVolume203:label};materials.push(m);M[k]=m;}try{return fn();}finally{Object.assign(M,held);}}

export function calibrateWetGranite203(materials,ownedTextures){
 const source=materials[0].map,canvas=document.createElement('canvas');canvas.width=canvas.height=512;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(source.image,0,0,512,512);const input=context.getImageData(0,0,512,512),linear=v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4,srgb=v=>v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055,luminance=new Float32Array(512*512);let mean=0;
 for(let i=0;i<luminance.length;i++){const j=i*4,l=.2126*linear(input.data[j])+.7152*linear(input.data[j+1])+.0722*linear(input.data[j+2]);luminance[i]=l;mean+=l/luminance.length;}
 const targets=[[.032,.036,.040],[.027,.031,.034],[.043,.047,.050],[.033,.037,.040]],records=[];
 materials.forEach((m,k)=>{const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),data=ctx.createImageData(512,512),target=targets[k],oldColor=m.color.toArray();for(let i=0;i<luminance.length;i++){const grain=T.MathUtils.clamp((luminance[i]/mean)**.50,.55,1.55);for(let a=0;a<3;a++)data.data[i*4+a]=Math.round(srgb(target[a]*grain)*255);data.data[i*4+3]=255;}ctx.putImageData(data,0,0);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=source.wrapS;map.wrapT=source.wrapT;map.repeat.copy(source.repeat);map.offset.copy(source.offset);map.center.copy(source.center);map.rotation=source.rotation;map.anisotropy=source.anisotropy;ownedTextures.push(map);m.map=map;m.color.setRGB(1,1,1);m.clearcoat=1;m.clearcoatRoughness=.28;m.clearcoatNormalMap=m.normalMap;m.clearcoatNormalScale.set(1.2,1.2);m.needsUpdate=true;records.push({name:m.name,sourceMeanLinearLuminance:mean,oldMultiplyColor:oldColor,authoredWetBodyLinearRGB:target,formula:'targetRGB * clamp((sourceLinearLuminance / sourceMean)^0.5,0.55,1.55)',normalAndRoughnessMapsRetained:true});});
 return{revision:'scene09-source-grain-wet-granite203-r05',source:'Existing CC0 Granite Tile04 face albedo, independently declared in the project',records,sourcePixelsChanged:false,scenePhotographSampled:false,scope:'Only four near wet-veranda slab albedos; regular portable PBR maps, unchanged metric UV transform',authoredReflectanceNotSurveyed:true,visualAccepted:false};
}

export function configurePracticals203({scene,fixtures,moon,fill,warmKey,materials,M,courtCalibration=null}){
 // Existing fixture positions and physical assemblies are untouched. Small
 // secondary lamps have local smooth cutoffs; primary pools receive actual
 // geometry shadows within the native sampler budget.
 scene.remove(fill);for(const o of[...scene.children])if(o.isHemisphereLight||o.isRectAreaLight)scene.remove(o);
 moon.intensity=1.75;moon.castShadow=true;moon.name='scene09-203-cool-twilight-shadow-key';warmKey.castShadow=false;
 for(const o of[...scene.children])if(o.isPointLight&&!fixtures.includes(o)){
  if(o.distance>3.9||!o.distance)scene.remove(o);else{o.intensity*=.7;o.castShadow=false;}
 }
 for(const o of[...scene.children])if(o.isSpotLight&&o!==warmKey&&!o.name.includes('finial')){scene.remove(o);if(o.target)scene.remove(o.target);}
 for(const m of materials){if(m.name.startsWith('scene09-203-dark-cedar-')){const finish=m.onBeforeCompile,key=m.customProgramCacheKey.bind(m);m.roughness=1;m.onBeforeCompile=s=>{finish.call(m,s);s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=.90+.08*roughnessFactor;');};m.customProgramCacheKey=()=>key()+'-matte-fascia203-r14';m.userData.matteFascia203=true;}if(m.name==='scene09-203-hall-wood')m.color.setRGB(2.40,1.65,.95);if(m.name==='scene09-hero-aged-cast-bronze')m.color.setHex(0x48351e);if(m.name==='scene09-hero-rubbed-fine-brass-moulding')m.color.setHex(0x75582d);if(m.name==='scene09-203-hall-ivory')m.color.setHex(0xb3aa96);if(m.name==='scene09-203-hall-sanctuaryGilt'){m.color.setHex(0xb08842);m.roughness=.44;}if(m.name==='scene09-203-hall-buddha')m.color.setHex(0x654d2e);}
 const records=[],chosen=new Set();
 function closest(p,label,filter=()=>true){const q=fixtures.filter(l=>!chosen.has(l)&&filter(l)).sort((a,b)=>a.position.distanceToSquared(p)-b.position.distanceToSquared(p))[0];if(q){chosen.add(q);q.userData.pool203=label;}}
 closest(new T.Vector3(1,7.2,23.7),'near-west-modeled-lantern');closest(new T.Vector3(7.7,7.3,21.6),'near-east-modeled-lantern');
 closest(new T.Vector3(4.6,7,34.4),'near-behind-modeled-lantern',l=>l.position.z>32);
 const stone=fixtures.find(l=>l.userData.stoneHero158);if(stone){chosen.add(stone);stone.userData.pool203='hero158-stone-chamber';}
 closest(new T.Vector3(12.2,2.86,8),'east158-stone-chamber',l=>l.position.y<4);
 for(const x of[-4.8,4.8])closest(transformed(HALL_ENVELOPE143,[x,6.1,5.4]),'main-hall-portal-'+x,l=>l.position.z<0&&l.position.y>4);
 closest(transformed(PAGODA_FRAME143,[0,5.4,3.7]),'pagoda-occupied-gallery',l=>l.position.x< -5);
 for(const l of fixtures){const source=l.userData.source203||{},near=l.position.z>15&&l.position.y>6,ground=l.position.y<4&&source.requestedIntensity===7.2,primary=chosen.has(l),hero=!!l.userData.stoneHero158,east=l.userData.pool203==='east158-stone-chamber',chamberAnchor=l.position.toArray();
  if(primary){const role=l.userData.pool203,pose=role.startsWith('main-hall')?HALL_ENVELOPE143:role.startsWith('pagoda')?PAGODA_FRAME143:null,front=pose?new T.Vector3(Math.sin(pose.yaw),0,Math.cos(pose.yaw)).multiplyScalar(-1):new T.Vector3(...(source.worldFront||[0,0,1])),size=source.assemblyScale||1,r=hero||east?.49*size:source.requestedIntensity>=38?.48*size:.36*Math.sqrt((source.requestedIntensity||1)/24.5)*size;l.position.addScaledVector(front,r*1.05);l.intensity*=near?1.35:hero||east?4.0:pose===PAGODA_FRAME143?2.8:2.3;}
  if(near&&primary){l.position.fromArray(chamberAnchor);if(l.userData.pool203==='near-behind-modeled-lantern'){l.position.addScaledVector(new T.Vector3(...(source.worldFront||[0,0,1])),-.50*(source.assemblyScale||1));l.intensity=145;}}
  l.color.setRGB(1,.62,.28);
  const requested=source.worldReach||5,reach=primary?(near?16:hero||east?12:10):near?9:ground?Math.min(9,Math.max(5.8,requested*2.6)):Math.min(7.8,Math.max(3.8,requested*1.6));l.distance=reach;l.decay=2;
  if(!primary&&!near)l.intensity*=ground?2.5:1.2;
  if(source.kind==='sanctuary-votive203'){l.intensity=source.requestedIntensity;l.distance=4.8;}
  if(source.kind==='bridge-post203'){l.intensity=source.requestedIntensity;l.distance=4.5;}
  l.castShadow=primary;if(primary){l.shadow.mapSize.set(hero?768:512,hero?768:512);l.shadow.camera.near=hero?.06:.10;l.shadow.camera.far=reach;l.shadow.bias=-.000025;l.shadow.normalBias=hero?.008:.012;l.shadow.radius=12.0;}
  if(l.userData.pool203?.startsWith('main-hall')||l.userData.pool203?.startsWith('pagoda')){l.castShadow=false;l.distance=3.8;}
  records.push({chamberAnchor,position:l.position.toArray(),intensity:l.intensity,reach:l.distance,decay:l.decay,geometryShadow:l.castShadow,role:l.userData.pool203||'secondary-modeled-local-lantern',sourceApproximation:near?'Visible near cases retain centre bulbs; the existing behind-observer fixture has a backward paper-exit proxy for the paving':primary?'Aggregate radiance exiting the modeled paper face':'Local secondary fixture',originalRequested:source});
 }
 // Preserve every original paper texture, but keep room transoms below the
 // visible lantern chambers in radiance. No architectural skin emits light.
 M.paper.emissiveIntensity=4.5;M.windowPaper.emissiveIntensity=.95;M.pagodaPaper.emissiveIntensity=1.25;M.stonePaper.emissiveIntensity=3.8;
 for(const m of materials)if(m.emissive){if(m.emissiveMap===M.paper.emissiveMap||/paper|washi/i.test(m.name)){m.emissive.setRGB(1,.46,.105);const old=m.onBeforeCompile;m.onBeforeCompile=s=>{old.call(m,s);s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nreflectedLight.directDiffuse=vec3(0.);reflectedLight.indirectDiffuse=vec3(0.);reflectedLight.directSpecular=vec3(0.);reflectedLight.indirectSpecular=vec3(0.);');};m.customProgramCacheKey=()=> 'scene09-203-defined-paper-exitance-r03';m.needsUpdate=true;}else if(m!==M.glow&&!m.userData.physicalEmitter203)m.emissiveIntensity=0;}
 M.glow.emissiveIntensity=.65;
 const downlights=addDownlights203(scene);
 // This original .40-scale hanging lamp had visible paper geometry but no
 // source (the legacy helper omitted all cases below .45). It now emits from
 // its fixed chamber, with actual bent/deck shadows. No new placement.
 const bridgeLamp=new T.PointLight(0xffffff,28,7,2);bridgeLamp.color.setRGB(1,.62,.28);bridgeLamp.name='scene09-203-original-underbridge-case-source';bridgeLamp.position.set(-.6,1.35,1.60);bridgeLamp.castShadow=true;bridgeLamp.shadow.mapSize.set(512,512);bridgeLamp.shadow.camera.near=.06;bridgeLamp.shadow.camera.far=7;bridgeLamp.shadow.bias=-.000025;bridgeLamp.shadow.normalBias=.008;bridgeLamp.shadow.radius=8;scene.add(bridgeLamp);hardwareResources203.get(scene).objects.push(bridgeLamp);
 records.push({chamberAnchor:bridgeLamp.position.toArray(),position:bridgeLamp.position.toArray(),intensity:28,reach:7,decay:2,geometryShadow:true,role:'original-underbridge-case-source',sourceApproximation:'Previously unlit real .40-scale modeled case, now centre bulb with actual deck/bent occlusion'});
 const court221=courtCalibration?.({scene,materials,fixtures,night203:{practicals:records,downlights}})??null;
 if(court221)for(let i=0;i<fixtures.length;i++){const l=fixtures[i];Object.assign(records[i],{position:l.position.toArray(),intensity:l.intensity,reach:l.distance,geometryShadow:l.castShadow,calibrated221:true});}
 const finiteFootprint=installFinitePracticals203(scene,materials);
 return{revision:NIGHT203_REVISION,practicals:records,downlights,court221,finiteFootprint,matteFascia:{count:materials.filter(m=>m.userData.matteFascia203).length,roughnessFormula:'.90+.08*originalEffectiveScanRoughness',sourceMapsRetained:true},removedFacadeAreaWash:true,removedWarmDirectionalFill:true,removedUnmodeledGardenGrazes:true,paper:{lantern:M.paper.emissiveIntensity,room:M.windowPaper.emissiveIntensity,pagoda:M.pagodaPaper.emissiveIntensity,stone:M.stonePaper.emissiveIntensity,definedExitanceSuppressesProxySelfIllumination:true},shadowScope:court221?'221 calibration supersedes primary source allocation; see court221.sources and finiteFootprint.fixtures.':'Cool key, three near lanterns, two158 chambers, original underbridge case, two lower gallery cones and finial have actual geometry shadows; small upper/secondary sources remain finite local approximations',exactAreaEmitterOrPathTracedGI:false,referenceImageSampled:false,visualAccepted:false};
}

// Native radiance cells replace the single near-black diffuse environment.
// Their SH fields interpolate through world space; true geometry blocks the
// captured sky and practical radiance. There is no camera-following fill.
export function captureNight203({renderer,scene,sky,water,wetVeranda,materials}){
 const pmrem=new T.PMREMGenerator(renderer),skyScene=new T.Scene(),skyCopy=new T.Mesh(sky.geometry,sky.material);
 // Inferred radiometric calibration of the existing independent cloud sky.
 // The same gain is visible in the background and every actual field capture.
 sky.material.fragmentShader=sky.material.fragmentShader.replace('gl_FragColor=vec4(c,1.);','gl_FragColor=vec4(c*2.0,1.);');sky.material.needsUpdate=true;skyScene.add(skyCopy);
 let skyEnvironment,courtEnvironment,shadowsReady=false;const environments=[],cells=[],targets=[];
 function capture(world,position,{sh=false,resolution=64}={}){const target=new T.WebGLCubeRenderTarget(resolution,{type:T.HalfFloatType,generateMipmaps:false}),probe=new T.CubeCamera(.12,220,target);probe.position.fromArray(position);world.add(probe);try{world.updateMatrixWorld(true);if(world===scene&&!shadowsReady)renderer.shadowMap.needsUpdate=true;probe.update(renderer,world);if(world===scene)shadowsReady=true;const field=sh?integrateNativeCell203(renderer,target,probe):null,environment=pmrem.fromCubemap(target.texture);return{field,environment};}finally{probe.removeFromParent();target.dispose();}}
 const w=water.visible,v=wetVeranda.visible;water.visible=wetVeranda.visible=false;
 try{skyEnvironment=capture(skyScene,[0,0,0],{resolution:128}).environment;scene.environment=skyEnvironment.texture;scene.environmentIntensity=3.2;
  // All cells see the same direct field before any cell is assigned, avoiding
  // capture-order feedback. Positions are fixed architectural/landscape space.
  const definitions=[['bank-west',[-7,2.4,7],'outside'],['bridge',[0,3.2,2],'outside'],['bank-east',[9,2.5,7],'outside'],['veranda',[4.6,3.1,29.5],'outside'],['hall-lower',transformed(HALL_ENVELOPE143,[0,5.8,6.8]).toArray(),'hall'],['hall-upper',transformed(HALL_ENVELOPE143,[0,9.35,5.65]).toArray(),'hall'],['pagoda',transformed(PAGODA_FRAME143,[0,7.86,2.60]).toArray(),'pagoda']];
  for(const[label,position,family]of definitions){const {field,environment}=capture(scene,position,{sh:true});environments.push(environment);cells.push({label,position,family,coefficients:field.coefficients,meanRadiance:field.meanRadiance,resolution:64,environment});}
  courtEnvironment=cells.find(c=>c.label==='bridge').environment;
  for(const m of materials){if(/ceramic145|^-clear-glaze$/.test(m.name)){m.userData.exteriorCeramic203=true;m.envMap=skyEnvironment.texture;m.envMapIntensity=3.2;m.needsUpdate=true;continue;}const volume=m.userData.nightVolume203,cell=cells.find(c=>c.label===(volume==='hall'?'hall-lower':volume==='pagoda'?'pagoda':volume==='veranda'?'veranda':'bridge'));if(m.isMeshStandardMaterial&&!m.emissiveIntensity){m.envMap=cell.environment.texture;m.envMapRotation.set(0,0,0);m.envMapIntensity=m.metalness>.30?1.2:1.0;m.needsUpdate=true;targets.push(m.name);}}
  installSpatialIrradiance203(materials,cells,2.2);
 }finally{water.visible=w;wetVeranda.visible=v;pmrem.dispose();renderer.shadowMap.needsUpdate=true;}
 return{info:{resolution:64,actualSkyAndCourtCaptures:true,exteriorSkyGain:2,exteriorIrradianceGain:3.2,cellDiffuseGain:2.2,scope:'Seven fixed actual world-space SH radiance cells with smooth spatial interpolation replace diffuse PMREM; specular remains actual local PMREM',localBuildingRadiance:cells.map(({environment,coefficients,...c})=>({...c,coefficients})),restrainedCourtMaterials:targets,approximateOneBounce:true,exactVisibilityOrPathTracedGI:false,photoSampled:false,visualAccepted:false},dispose(){skyEnvironment.dispose();for(const e of environments)e.dispose();}};
}
