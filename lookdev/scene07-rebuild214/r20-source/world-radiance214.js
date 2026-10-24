import * as T from 'three';
import {EXRLoader} from 'three/addons/loaders/EXRLoader.js';
import {WORLD_ATMOSPHERE_GLSL214,installAerialPerspective214,RADIANCE_SCALE214} from './solar-atmosphere214.js';
import {sitePoint214,hallLocalPoint214} from './site-transform214.js';

const TAU=Math.PI*2;
const SKY_ASSET='/reconstructions/scene-07/assets/sky145/sky-cloud-cap-generated-r04.png';

// Scene07-local thin-leaf model. The added transmitted lobe uses the actual
// direct-light record AFTER Three has applied its shadow map. It is neither
// emission nor a constant warm contribution to unoccluded indirect lighting.
export function installLeafScattering214(material,{strength=.26,power=1.5,indirectTransmission=.46}={}){
 const call='RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );';
 const lobe=`${call}\n if(directLight.visible){float leafThrough214=pow(max(dot(-geometryNormal,directLight.direction),0.0),${power.toFixed(3)});reflectedLight.directDiffuse+=diffuseColor.rgb*directLight.color*leafThrough214*${(strength/Math.PI).toFixed(8)};}`;
 const chunk=T.ShaderChunk.lights_fragment_begin.replaceAll(call,lobe);
 // Chlorophyll-bearing tissue transmits some irradiance incident on its
 // reverse surface as well. Sample the opposite lobe of the SAME actual
 // spatial capture, rather than adding a constant or a second light source.
 const indirect=T.ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );',`iblIrradiance += getIBLIrradiance( geometryNormal );\n iblIrradiance += getIBLIrradiance( -geometryNormal )*${indirectTransmission.toFixed(4)};`);
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',chunk).replace('#include <lights_fragment_maps>',indirect);};
 material.customProgramCacheKey=()=>`scene07-shadowed-and-spatial-indirect-thin-leaf214-r14:${strength}:${power}:${indirectTransmission}`;
 material.userData.foliageRadiance214={shadowed:true,strength,power,indirectTransmission,indirectSource:'Opposite hemisphere of the actual same spatial radiance capture',constantIndirectScatter:false};
 material.needsUpdate=true;
}

// One world radiance field supplies visible atmosphere, water reflection and
// PMREM. The previous independent measured-HDR illumination and warm fill
// lights are replaced. The existing declared generated image contains SKY
// ONLY; every building, tree, bridge and water surface is scene geometry.
export async function installWorldRadiance214({renderer,scene,sun}){
 const [measured,clouds]=await Promise.all([
  new EXRLoader().setDataType(T.FloatType).loadAsync('/assets/polyhaven/qwantani-sunset-puresky/sky-2k.exr'),
  new T.TextureLoader().loadAsync(SKY_ASSET)
 ]);
 clouds.colorSpace=T.SRGBColorSpace;clouds.wrapS=clouds.wrapT=T.ClampToEdgeWrapping;
 clouds.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const {width,height,data}=measured.image;let peak=0,total=0;
 for(let i=0;i<data.length;i+=4){const l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];peak=Math.max(peak,l);total+=l;}
 const source=new T.Vector3();let weights=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2],w=Math.max(0,l-peak*.78)**2;
  if(!w)continue;const lat=((y+.5)/height-.5)*Math.PI,lon=((x+.5)/width-.5)*TAU,c=Math.cos(lat);
  source.addScaledVector(new T.Vector3(c*Math.cos(lon),Math.sin(lat),c*Math.sin(lon)),w);weights+=w;
 }
 if(!weights)throw Error('214 sky has no finite solar centroid');source.normalize();
 // Remove the measured source's concentrated solar spike. The broad sunset
 // atmosphere remains in the shared sky; the only direct key casts shadows.
 const limit=total/(width*height)*9,cone=Math.cos(.065);let solarPixelsClamped=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const lat=((y+.5)/height-.5)*Math.PI,lon=((x+.5)/width-.5)*TAU,c=Math.cos(lat),dot=source.x*c*Math.cos(lon)+source.y*Math.sin(lat)+source.z*c*Math.sin(lon),i=(y*width+x)*4,l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
  if(dot>cone&&l>limit){const g=limit/l;data[i]*=g;data[i+1]*=g;data[i+2]*=g;solarPixelsClamped++;}
 }
 measured.needsUpdate=true;
 const wanted=sun.position.clone().sub(sun.target.position).normalize(),a=Math.atan2(source.z,source.x),b=Math.atan2(wanted.z,wanted.x);
 const yaw=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a-b),pitch=new T.Quaternion().setFromAxisAngle(new T.Vector3(-Math.sin(b),0,Math.cos(b)),Math.asin(wanted.y)-Math.asin(source.y));
 const rotation=new T.Euler().setFromQuaternion(pitch.multiply(yaw)),inverse=new T.Matrix3().setFromMatrix4(new T.Matrix4().makeRotationFromEuler(rotation).invert());
 const formerSun=new T.Vector3(-68,19,-41).normalize(),capCenter=Math.atan2(formerSun.z,formerSun.x)+T.MathUtils.degToRad(43);
 const solar=sun.userData.solarDisk214,power=solar?.totalIntensity??sun.intensity,angularRadius=solar?.angularRadius??T.MathUtils.degToRad(.265),solidAngle=2*Math.PI*(1-Math.cos(angularRadius));
 const material=new T.ShaderMaterial({
  name:'scene07-shared-sky-and-indirect-radiance214',side:T.BackSide,depthWrite:false,depthTest:false,
  uniforms:{solarDirection:{value:wanted},solarColor214:{value:sun.color.clone()},solarPower214:{value:power},solarRadius214:{value:angularRadius},solarRadiance214:{value:power/solidAngle*RADIANCE_SCALE214},clouds:{value:clouds},measured:{value:measured},worldToSky:{value:inverse},cap:{value:new T.Vector4(capCenter,T.MathUtils.degToRad(70),T.MathUtils.degToRad(-5),T.MathUtils.degToRad(35))},solarDisk:{value:0}},
  vertexShader:'varying vec3 ray;void main(){vec4 w=modelMatrix*vec4(position,1.);ray=w.xyz-cameraPosition;vec4 p=projectionMatrix*viewMatrix*w;gl_Position=p.xyww;}',
  fragmentShader:`${WORLD_ATMOSPHERE_GLSL214}
   varying vec3 ray;uniform float solarDisk;uniform float solarRadius214;uniform float solarRadiance214;
   void main(){vec3 w=normalize(ray),sky=worldSky214(w)*radianceScale214;float cosine=clamp(dot(w,solarDirection),-1.,1.);
    sky+=solarDisk*solarColor214*solarRadiance214*smoothstep(cos(solarRadius214*1.05),cos(solarRadius214*.95),cosine);
    gl_FragColor=vec4(sky,1.);}`
 });
 const geometry=new T.SphereGeometry(250,48,24),mesh=new T.Mesh(geometry,material);
 mesh.name='scene07-world-atmosphere214';mesh.frustumCulled=false;mesh.renderOrder=-1000;
 mesh.onBeforeRender=(_r,_s,camera)=>{mesh.position.copy(camera.position);mesh.updateMatrixWorld();};
 const skyScene=new T.Scene(),captureMesh=new T.Mesh(geometry,material);captureMesh.frustumCulled=false;skyScene.add(captureMesh);
 const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromScene(skyScene,0,.1,600,{size:256});pmrem.dispose();
 scene.environment=target.texture;scene.environmentIntensity=1;scene.environmentRotation.set(0,0,0);
 material.uniforms.solarDisk.value=1;scene.add(mesh);
 return{installAerialPerspective(material){installAerialPerspective214(material,this.uniforms);},uniforms:material.uniforms,beginIndirectCapture(){material.uniforms.solarDisk.value=0;},endIndirectCapture(){material.uniforms.solarDisk.value=1;},info:{
  revision:'scene07-disk-integrated-world-radiance-and-height-air214-r19',skyAsset:SKY_ASSET,skyAssetProvenance:'reconstructions/scene-07/assets/sky145/provenance.json',measuredAtmosphere:'Poly Haven Qwantani Sunset Pure Sky, CC0',sourceSunCentroid:source.toArray(),targetSunDirection:wanted.toArray(),sun:{intensity:power,renderedIntensity:sun.intensity,finiteSolarDisk:solar,linearColor:sun.color.toArray(),shadowMap:sun.shadow.mapSize.toArray(),shadowNear:sun.shadow.camera.near,shadowFar:sun.shadow.camera.far,shadowBias:sun.shadow.bias,shadowBiasWorldMetres:Math.abs(sun.shadow.bias)*(sun.shadow.camera.far-sun.shadow.camera.near)},sourceSolarPeak:peak,measuredDomeRadianceGain:.55,radianceScale:RADIANCE_SCALE214,exposureUnitCompensation:1/RADIANCE_SCALE214,cloudCapRadianceGain:null,capAngularTransitionFraction:.18,unobservedUpperCloudBank:{sameWorldRadiance:true,worldAngularUV:true,opticalStructure:SKY_ASSET,coverageLimit:.72,measuredRetention:.35,actualSolarScatterGain:.085,extraLights:0},cloudUse:'Chroma-separated cloud optical structure and retained macro luminance illuminated by actual sun, with angular Rayleigh clear-air radiance in gaps. Same field in camera, water and indirect lighting.',clearAirCap:{rayleighSolarCoefficients:[.00531429,.01062857,.02037143],phase:'.75*(1+cosineSquared)',retainedMeasuredRadiance:.06,cloudAmbientGain:.30},atmosphericForwardScatter:{normalizedHenyeyGreensteinG:.84,opticalGain:.022,elevationFalloff:2.2},lowerSkyHemisphereGain:.06,solarPixelsClamped,solarRadianceLimit:limit,pmrem:{source:'Actual same world-oriented atmosphere shader with analytic solar disk removed',resolution:256,intensity:1,rotation:[0,0,0]},hemisphereLights:0,unshadowedDirectionalFills:0,constantFoliageScatter:false,referencePixelsSampled:false,visualAccepted:false
 },dispose(){scene.remove(mesh);geometry.dispose();material.dispose();target.dispose();measured.dispose();clouds.dispose();}};
}

// Actual first-bounce native captures at the lower porch and upper gallery.
// Copies of hall timber/plaster and spatially split foliage receive these
// maps. Tiled roofs and the veranda keep the common outdoor sky environment.
// This is a fixed local radiance approximation, not solved multi-bounce GI.
export function captureHallRadiance214({renderer,scene,water,sky,materials,landscapeMaterials=new Map()}){
 // Exterior bearings and rails see the actual open forecourt hemisphere;
 // shutters and inner ties see the deep room capture. A single dark capture
 // was previously assigned to both, erasing their different spatial lighting.
 const localCapturePoints214={'lower-room':[-3,4.4,-1.0],'lower-porch':[0,4.4,2.15],'upper-room':[-2.3,9.5,1.2],'upper-porch':[1.1,9.6,3.55]};
 const positions=Object.fromEntries(Object.entries(localCapturePoints214).map(([key,p])=>[key,sitePoint214(hallLocalPoint214(p,{upper:key.startsWith('upper')}))]));positions['ground-near-bank']=[7,1.6,5.5];positions['ground-far-bank']=[6.5,2.3,-9];positions['canopy-near-bank']=[5,8.6,6];positions['canopy-far-bank']=[1,8.4,-13];const captures=[],pmrem=new T.PMREMGenerator(renderer),oldWater=water.visible,oldAuto=renderer.shadowMap.autoUpdate;
 water.visible=false;sky.beginIndirectCapture();renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 try{
  for(const [region,position]of Object.entries(positions)){
   const target=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType,generateMipmaps:false}),camera=new T.CubeCamera(.08,1800,target);camera.position.fromArray(position);scene.add(camera);scene.updateMatrixWorld(true);
   camera.update(renderer,scene);const environment=pmrem.fromCubemap(target.texture);camera.removeFromParent();target.dispose();captures.push({region,position,environment});
  }
 }finally{water.visible=oldWater;sky.endIndirectCapture();renderer.shadowMap.autoUpdate=oldAuto;pmrem.dispose();}
 const assignments=[];
 for(const {region,position,environment}of captures){
  const names=[];for(const material of [...materials.values(),...landscapeMaterials.values()])if((material.userData.hallRegion214||material.userData.landscapeRegion214)===region){material.envMap=environment.texture;material.envMapRotation.set(0,0,0);material.envMapIntensity=1;material.needsUpdate=true;names.push(material.name);}assignments.push({region,position,materials:names});
 }
 return{info:{revision:'scene07-room-versus-porch-capture-locations-repaired214-r20',resolution:128,assignments,hallLocalCapturePoints:localCapturePoints214,source:'Eight actual same-scene 3D cube captures. Hall probes now occupy the enclosed side aisle, sheltered porch, upper room and upper gallery rather than two outside-courtyard locations. Same solar-separated sky and shadowed finite sun.',solarDiskExcludedFromAllCaptures:true,constantFillLights:0,cameraFollowing:false,approximateSingleBounce:true,visualAccepted:false},dispose(){for(const c of captures)c.environment.dispose();}};
}
