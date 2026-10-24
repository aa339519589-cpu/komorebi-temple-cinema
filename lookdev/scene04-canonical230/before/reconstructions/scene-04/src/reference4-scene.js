import * as T from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {buildReference4Architecture} from './reference4-architecture.js';
import {buildReference4Garden} from './reference4-garden.js';
import {buildReference4Sanctuary} from './reference4-sanctuary.js';
import {buildReference4DistantForest} from './reference4-distant-forest.js';
import {buildReference4Atmosphere} from './reference4-atmosphere.js';
import {reference4Config as C} from './reference4-config.js';
import {createPavingCanopy04} from './paving-canopy04.js';
import {buildScene04Understory131} from './scene04-understory131.js';
import {createReference4StairPlan} from './reference4-stair-plan.js';
import {getSpatial188Assets} from './licensed-carving188.js';
import {installRoomSkyVisibility188} from './room-light188.js';

function describe(value,seen=new WeakSet()){
 if(value==null||typeof value==='string'||typeof value==='boolean'||typeof value==='number')return value;
 if(typeof value==='function')return undefined;
 if(value.isObject3D)return {name:value.name,type:value.type};
 if(value.isVector3)return value.toArray();
 if(value.isBox3)return{min:value.min.toArray(),max:value.max.toArray()};
 if(typeof value==='object'){if(seen.has(value))return '[shared]';seen.add(value);if(Array.isArray(value))return value.map(v=>describe(v,seen));return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,describe(v,seen)]).filter(a=>a[1]!==undefined));}
 return String(value);
}
function sceneCounts(scene){let meshes=0,instances=0,triangles=0,lights=0;const geometries=new Set();scene.traverse(o=>{if(o.isLight)lights++;if(o.isMesh){meshes++;geometries.add(o.geometry);const n=o.isInstancedMesh?o.count:1;instances+=n;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*n;}});return{meshes,mixedInstances:instances,triangles,uniqueGeometries:geometries.size,lights};}
function addSuspendedLamps(scene,architecture,materials){
 architecture.group.updateMatrixWorld(true);const members=[];
 architecture.group.traverse(o=>{if(o.isMesh&&o.geometry?.userData?.architectureMember==='entrance-saddled-bargeboard')members.push(o);});
 if(!members.length)throw Error('Actual entrance bargeboard is required for lamp suspension.');
 const paper=new T.MeshStandardMaterial({name:'reference4-warm-paper',color:'#d2bb83',emissive:'#ffb248',emissiveIntensity:.30,roughness:.84,side:T.DoubleSide});
 const rows=[],axis=new T.Vector3(0,1,0),latticeMatrices=[],latticeRing=new T.TorusGeometry(.027,.0045,5,16);
 function mesh(g,m,p){const o=new T.Mesh(g,m);o.position.fromArray(p);o.castShadow=o.receiveShadow=true;scene.add(o);return o;}
 const origin=C.architecture.hallOrigin??[0,0,0];
 for(const localX of [-5.55,5.55]){
  const x=localX+origin[0],y=5.95+(C.architecture.stairTopY-1.8),z=1.7+origin[2];const hits=new T.Raycaster(new T.Vector3(x,y+.66,1.5+origin[2]),axis,0,3).intersectObjects(members,false);
  if(!hits.length)throw Error('No actual curved eave underface above the intended suspended lantern.');
  const lampScale=.80,body=(g,m,p)=>{const o=mesh(g,m,[x+p[0]*lampScale,y+p[1]*lampScale,z+p[2]*lampScale]);o.scale.setScalar(lampScale);return o;};
  const contactY=hits[0].point.y,armTop=contactY+.010,armBottom=armTop-.075,rodBottom=y+.64*lampScale;
  if(armBottom<=rodBottom)throw Error('Suspended lantern overlaps the measured support.');
  mesh(new T.BoxGeometry(.14,.075,.35),materials.oldgold,[x,(armTop+armBottom)/2,1.615+origin[2]]);
  mesh(new T.CylinderGeometry(.016,.016,armBottom-rodBottom,10),materials.oldgold,[x,(armBottom+rodBottom)/2,z]);
  for(const sign of [-1,1]){
   body(new T.CylinderGeometry(.34,.34,.075,6),materials.gold,[0,sign*.46,0]);
   body(new T.CylinderGeometry(sign>0?.27:.36,sign>0?.36:.27,.16,6),materials.oldgold,[0,sign*.54,0]);
  }
  for(let j=0;j<6;j++){
   const a=j*Math.PI/3;body(new T.CylinderGeometry(.018,.018,.9,8),materials.gold,[Math.sin(a)*.305,0,Math.cos(a)*.305]);
   const pane=body(new T.PlaneGeometry(.275,.82),paper,[Math.sin(a+Math.PI/6)*.247,0,Math.cos(a+Math.PI/6)*.247]);pane.rotation.y=a+Math.PI/6;
   const phi=a+Math.PI/6;
   for(const yy of[-.32,.32])for(let k=-2;k<=2;k++){
    const xx=k*.046,position=new T.Vector3(x+(Math.sin(phi)*.255+Math.cos(phi)*xx)*lampScale,y+yy*lampScale,z+(Math.cos(phi)*.255-Math.sin(phi)*xx)*lampScale),q=new T.Quaternion().setFromAxisAngle(axis,phi);
    latticeMatrices.push(new T.Matrix4().compose(position,q,new T.Vector3(lampScale,lampScale,lampScale)));
   }

  }
  body(new T.SphereGeometry(.07,12,8),materials.gold,[0,-.70,0]);
  const light=new T.PointLight('#ffcf86',8,5,2);light.position.set(x,y,z);light.name='reference4-eave-lantern-light';scene.add(light);
  rows.push({body:[x,y,z],lampScale,realPiercedMetalLatticeRings:60,supportContact:hits[0].point.toArray(),supportObject:hits[0].object.name,armTop,armBottom,rodBottom});
 }
 const lattice=new T.InstancedMesh(latticeRing,materials.oldgold,latticeMatrices.length);lattice.name='spatial188-actual-pierced-lantern-metal-lattice';latticeMatrices.forEach((m,i)=>lattice.setMatrixAt(i,m));lattice.castShadow=lattice.receiveShadow=true;scene.add(lattice);
 return rows;
}
function createWaterReflection(scene,garden){
 if(garden.waterMeshes?.length!==2)throw Error('Two actual garden pond surfaces are required.');
 const waterY=garden.plan?.waterY??C.garden.waterY;
 const sources=garden.waterMeshes.map(o=>{
  if(o.position.lengthSq()!==0||o.rotation.x!==0||o.rotation.y!==0||o.rotation.z!==0||o.scale.x!==1||o.scale.y!==1||o.scale.z!==1)throw Error('Reflection source pond transform changed.');
  const g=o.geometry.clone();g.translate(0,-waterY,0);g.rotateX(Math.PI/2);return g;
 });
 const geometry=mergeGeometries(sources,false);sources.forEach(g=>g.dispose());
 const reflection=new Reflector(geometry,{textureWidth:768,textureHeight:768,clipBias:.002,color:0x808080,multisample:0});
 reflection.name='reference4-both-ponds-actual-planar-reflection';reflection.rotation.x=-Math.PI/2;reflection.position.y=waterY+.003;reflection.renderOrder=3;
 reflection.material.transparent=true;reflection.material.depthWrite=false;
 let vs=reflection.material.vertexShader,fs=reflection.material.fragmentShader;
 if(!vs.includes('varying vec4 vUv;')||!fs.includes('vec4 base = texture2DProj( tDiffuse, vUv );'))throw Error('Pinned reflector shader boundary changed.');
 vs=vs.replace('varying vec4 vUv;','varying vec4 vUv;\nvarying vec3 vWaterWorld;').replace('void main() {','void main() {\nvWaterWorld=(modelMatrix*vec4(position,1.0)).xyz;');
 fs=fs.replace('varying vec4 vUv;','varying vec4 vUv;\nvarying vec3 vWaterWorld;').replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec4 rippleUv=vUv; rippleUv.xy+=vec2(sin(vWaterWorld.x*5.7+vWaterWorld.z*3.4),cos(vWaterWorld.z*4.9-vWaterWorld.x*2.1))*.0011*vUv.w; vec4 base=texture2DProj(tDiffuse,rippleUv);`);
 fs=fs.replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`float viewY=abs(normalize(cameraPosition-vWaterWorld).y); gl_FragColor=vec4(base.rgb,.020+.78*pow(1.0-viewY,5.0));`);
 reflection.material.vertexShader=vs;reflection.material.fragmentShader=fs;
 const original=reflection.onBeforeRender;
 reflection.onBeforeRender=function(...args){const visible=garden.waterMeshes.map(o=>o.visible);garden.waterMeshes.forEach(o=>o.visible=false);try{return original.apply(this,args);}finally{garden.waterMeshes.forEach((o,i)=>o.visible=visible[i]);}};
 scene.add(reflection);return reflection;
}
export function buildReference4Scene(){
 const scene=new T.Scene();scene.name='reference4-complete-exterior-v4';scene.fog=new T.FogExp2('#9eafb5',.0015);
 const architecture=buildReference4Architecture(T,{...C.architecture,spatial188:getSpatial188Assets()}),garden=buildReference4Garden(T,{...C.garden,stairDimensions:C.architecture});scene.add(architecture.group,garden.group);
 const understory=buildScene04Understory131(garden,createReference4StairPlan(C.architecture));scene.add(understory.group);
 const waterReflection=createWaterReflection(scene,garden);
 const sunDirection=new T.Vector3(...C.lighting.sunDirection).normalize();
 // Reposition the real supported boughs for the current physical sun so
 // the canopy shadows remain on the observed processional stone regions.
 const shadowCanopyDirection=sunDirection.clone();
 const pavingCanopy=createPavingCanopy04(shadowCanopyDirection);scene.add(pavingCanopy);
 const sky=buildReference4Atmosphere(T,{sunDirection,displayRadiance:C.lighting.skyDisplayRadiance});scene.add(sky);
 const sun=new T.DirectionalLight(C.lighting.sunColor??'#ffd092',C.lighting.sunIntensity);sun.name='reference4-left-golden-hour-sun';sun.target.position.set(0,5,0);sun.position.copy(sun.target.position).addScaledVector(sunDirection,55);sun.castShadow=true;
 sun.shadow.mapSize.setScalar(C.lighting.shadowSize);Object.assign(sun.shadow.camera,{left:-25,right:25,top:28,bottom:-28,near:5,far:100});sun.shadow.camera.updateProjectionMatrix();Object.assign(sun.shadow,{bias:-.00008,normalBias:.002,radius:.75,intensity:1,needsUpdate:true});scene.add(sun,sun.target);
 const hemi=new T.HemisphereLight(C.lighting.skyColor??'#dae5ee',C.lighting.groundColor??'#7b644b',C.lighting.skyIntensity);hemi.name='reference4-cool-sky-fill';scene.add(hemi);
 const sanctuary=buildReference4Sanctuary(T,{floorY:C.architecture.stairTopY,spatial188:getSpatial188Assets()});sanctuary.group.position.add(new T.Vector3(...(C.architecture.hallOrigin??[0,0,0])));scene.add(sanctuary.group);
 const suspensions=addSuspendedLamps(scene,architecture,architecture.materials);
 for(const p of architecture.portalDepth.lights){const light=new T.PointLight('#ffd18a',4.2,4,2);light.position.fromArray(p);light.name='scene04-visible-portal-oil-lantern';scene.add(light);}
 // Warm direct radiance now comes from modeled portal paper lanterns and
 // the two actual oil flames. Their real positions and shadows are retained.
 const roomMaterials=new Set();
 for(const group of[architecture.group,sanctuary.group])group.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material]))roomMaterials.add(m);});
 for(const m of roomMaterials)installRoomSkyVisibility188(m,{origin:C.architecture.hallOrigin,floorY:C.architecture.stairTopY});
 const distantForest=buildReference4DistantForest(T);scene.add(distantForest.group);
 let environmentTarget=null,pavingEnvironmentTarget=null,roomEnvironmentTarget=null;
 function initializeEnvironment(renderer){
  if(environmentTarget)return;
  const envScene=new T.Scene(),envSky=sky.clone();envSky.material=sky.material.clone();envSky.material.uniforms.showSunDisc.value=0;envSky.material.uniforms.reference4SkyRadiance.value=1;envScene.add(envSky);
  const pmrem=new T.PMREMGenerator(renderer);try{
   environmentTarget=pmrem.fromScene(envScene,.05,.1,300);scene.environment=environmentTarget.texture;scene.environmentIntensity=C.lighting.environmentIntensity;
   // Reflections in a damp processional floor see actual trees and timber,
   // rather than an isolated blue sky dome. Paving hides itself for the probe.
   const cube=new T.WebGLCubeRenderTarget(256,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter}),probe=new T.CubeCamera(.08,150,cube);probe.position.set(0,.28,18.2);scene.add(probe);
   const pathVisible=garden.subgroups.path.visible,reflectionVisible=waterReflection.visible;garden.subgroups.path.visible=false;waterReflection.visible=false;
   try{scene.updateMatrixWorld(true);probe.update(renderer,scene);pavingEnvironmentTarget=pmrem.fromCubemap(cube.texture);for(const material of garden.group.userData.pavingMaterials??[]){material.envMap=pavingEnvironmentTarget.texture;material.needsUpdate=true;}}finally{garden.subgroups.path.visible=pathVisible;waterReflection.visible=reflectionVisible;probe.removeFromParent();cube.dispose();}
   // A separate real scene capture supplies the shrine metal's reflected
   // room and doorway radiance. The indirect sky mask is skipped for this
   // map because the actual captured room already supplies its occlusion.
   const roomCube=new T.WebGLCubeRenderTarget(256,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter}),roomProbe=new T.CubeCamera(.06,80,roomCube);
   roomProbe.position.set((C.architecture.hallOrigin?.[0]??0),C.architecture.stairTopY+2.10,-3.40+(C.architecture.hallOrigin?.[2]??0));scene.add(roomProbe);
   const shadowAuto=renderer.shadowMap.autoUpdate,shadowNeeds=renderer.shadowMap.needsUpdate;
   renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
   try{
    scene.updateMatrixWorld(true);roomProbe.update(renderer,scene);roomEnvironmentTarget=pmrem.fromCubemap(roomCube.texture);
    for(const material of Object.values(sanctuary.materials)){material.envMap=roomEnvironmentTarget.texture;material.envMapIntensity=material.metalness>.4?.85:.40;material.userData.localRoomEnvironment188=true;material.needsUpdate=true;}
    if(architecture.materials.portal188Carving){const material=architecture.materials.portal188Carving;material.envMap=roomEnvironmentTarget.texture;material.envMapIntensity=.65;material.userData.localRoomEnvironment188=true;material.needsUpdate=true;}
   }finally{roomProbe.removeFromParent();roomCube.dispose();renderer.shadowMap.autoUpdate=shadowAuto;renderer.shadowMap.needsUpdate=shadowNeeds;}
  }finally{pmrem.dispose();envSky.material.dispose();}
 }
 function info(){return{revision:C.revision,counts:sceneCounts(scene),architecture:describe({...architecture.sockets,portalDepth:architecture.portalDepth,hallBearing:architecture.hallBearing,massFrame:architecture.massFrame,spatial188:getSpatial188Assets().info(),porchJoinery:architecture.porchJoinery,sanctuarySpatial188:sanctuary.spatial188,roomLight188:{finiteDoorwaySkyVisibility:true,actualShadowedOilLamps:2,visibleOilFlames:6,indirectOnly:true,bakedImage:false,actualLocalRoomEnvironment:!!roomEnvironmentTarget,roomProbe:[C.architecture.hallOrigin?.[0]??0,C.architecture.stairTopY+2.10,-3.40+(C.architecture.hallOrigin?.[2]??0)],probePixels:256,scope:'Real one-bounce scene environment approximation, not full GI'},hallProfile:{origin:architecture.hallProfile.origin,neckPower:architecture.hallProfile.neckPower,pitchPower:architecture.hallProfile.pitchPower,karahafuContour:architecture.hallProfile.contour}}),garden:describe(garden.sockets),understory:understory.info,suspensions,forest:{trees:distantForest.treeCount,crowns:distantForest.crownCount},lighting:{sunDirection:sunDirection.toArray(),shadowCanopyDirection:shadowCanopyDirection.toArray(),sunIntensity:C.lighting.sunIntensity,skyIntensity:C.lighting.skyIntensity},environmentInitialized:!!environmentTarget,pavingReflection:{actualSceneCapture:!!pavingEnvironmentTarget,position:[0,.28,18.2],resolution:256,scope:'Local reflection approximation; not ray-traced per-pixel reflections.'},lightBudget:{directionalShadows:1,pointShadows:2,rectAreaLights:0},limits:[...C.limitations,sanctuary.limits,distantForest.limits],visualAcceptance:false};}
 scene.updateMatrixWorld(true);
 return{scene,architecture,garden,sky,sun,focal:sanctuary.group,sanctuary,distantForest,understory,waterReflection,initializeEnvironment,info};
}
