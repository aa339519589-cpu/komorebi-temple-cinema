import * as T from 'three';
import {EXRLoader} from 'three/addons/loaders/EXRLoader.js';
import {sitePoint214,HALL_DATUM_OFFSET214} from './site-transform214.js';

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
 const material=new T.ShaderMaterial({
  name:'scene07-shared-sky-and-indirect-radiance214',side:T.BackSide,depthWrite:false,depthTest:false,
  uniforms:{solarDirection:{value:wanted},solarColor214:{value:sun.color.clone()},solarPower214:{value:sun.intensity},clouds:{value:clouds},measured:{value:measured},worldToSky:{value:inverse},cap:{value:new T.Vector4(capCenter,T.MathUtils.degToRad(70),T.MathUtils.degToRad(-5),T.MathUtils.degToRad(35))},solarDisk:{value:0}},
  vertexShader:'varying vec3 ray;void main(){vec4 w=modelMatrix*vec4(position,1.);ray=w.xyz-cameraPosition;vec4 p=projectionMatrix*viewMatrix*w;gl_Position=p.xyww;}',
  fragmentShader:`varying vec3 ray;uniform sampler2D clouds;uniform sampler2D measured;uniform mat3 worldToSky;uniform vec4 cap;uniform vec3 solarDirection;uniform vec3 solarColor214;uniform float solarPower214;uniform float solarDisk;
   float phase214(float cosine,float g){float g2=g*g;return(1.-g2)/(12.56637061436*pow(max(1.-2.*g*cosine+g2,.0001),1.5));}
   void main(){vec3 w=normalize(ray),d=normalize(worldToSky*w);
    vec2 baseUV=vec2(atan(d.z,d.x)/6.28318530718+.5,asin(clamp(d.y,-1.,1.))/3.14159265359+.5);
    vec3 base=texture2D(measured,baseUV).rgb*.80;
    float lon=mod(atan(w.z,w.x)-cap.x+3.14159265359,6.28318530718)-3.14159265359;
    vec2 uv=vec2(lon/cap.y+.5,(asin(clamp(w.y,-1.,1.))-cap.z)/cap.w),edge=min(uv,1.-uv);
    float blend=smoothstep(0.,.18,edge.x)*smoothstep(0.,.18,edge.y);
    float cosine=clamp(dot(w,solarDirection),-1.,1.),angle=acos(cosine);
    // Directional atmospheric scattering from the actual sun. The normalized
    // Henyey-Greenstein phase follows the local Three Sky implementation.
    vec3 mie=solarColor214*solarPower214*.035*phase214(cosine,.88)*exp(-max(w.y,0.)*2.6);
    // The measured sunset has broad bright cloud radiance in this bearing.
    // A clear gap must instead expose short-wave atmospheric scattering,
    // not that unrelated cloud luminance. This angular field is identical
    // for camera, reflected sky and every native indirect capture.
    float rayleighPhase=.75*(1.+cosine*cosine),heightFactor=.55+.45*sqrt(max(w.y,0.));
    vec3 rayleigh=vec3(.00857143,.01714286,.03285714)*solarPower214*heightFactor*rayleighPhase;
    vec3 clearCap=rayleigh+base*.06+mie;
    // A world-fixed upper cloud bank also exists outside the observed cap.
    // Relight its optical structure from the same solar illuminant instead
    // of retaining unrelated cool cloud radiance from the measured sunset.
    // It is part of this single complete sky field, seen by every camera and
    // actual scene capture, with no independent directional fill lights.
    vec2 domeUV=vec2(atan(w.z,w.x)/6.28318530718+.5,clamp(.18+asin(clamp(w.y,0.,1.))/.75,0.,1.));
    vec3 domeOptical=texture2D(clouds,domeUV).rgb;
    float domeDensity=smoothstep(.78,1.10,domeOptical.r/max(domeOptical.b,.035));
    float domeCover=domeDensity*.72*smoothstep(.02,.18,w.y);
    vec3 solarCloudDome=base*.35+solarColor214*solarPower214*.12+rayleigh*.35;
    vec3 outsideCap=mix(base+mie,solarCloudDome,domeCover);
    vec3 sky=mix(outsideCap,clearCap,blend);
    // The declared sky-only image supplies macro cloud optical structure;
    // actual solar color and clear-sky radiance illuminate that structure.
    vec3 optical=texture2D(clouds,clamp(uv,0.,1.)).rgb;
    float density=smoothstep(.78,1.10,optical.r/max(optical.b,.035)),lum=dot(optical,vec3(.2126,.7152,.0722));
    float opacity=density*blend*.94;
    vec3 cloudRadiance=clearCap*.30+solarColor214*solarPower214*.14*pow(max(lum,.001),1.45);
    sky=mix(sky,cloudRadiance,opacity);
    sky*=mix(.06,1.,smoothstep(-.08,.02,w.y));
    sky+=solarDisk*solarColor214*35.*smoothstep(.999987,.999990,cosine);
    gl_FragColor=vec4(sky,1.);}`
 });
 const geometry=new T.SphereGeometry(250,48,24),mesh=new T.Mesh(geometry,material);
 mesh.name='scene07-world-atmosphere214';mesh.frustumCulled=false;mesh.renderOrder=-1000;
 mesh.onBeforeRender=(_r,_s,camera)=>{mesh.position.copy(camera.position);mesh.updateMatrixWorld();};
 const skyScene=new T.Scene(),captureMesh=new T.Mesh(geometry,material);captureMesh.frustumCulled=false;skyScene.add(captureMesh);
 const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromScene(skyScene,0,.1,600,{size:256});pmrem.dispose();
 scene.environment=target.texture;scene.environmentIntensity=1;scene.environmentRotation.set(0,0,0);
 material.uniforms.solarDisk.value=1;scene.add(mesh);
 return{beginIndirectCapture(){material.uniforms.solarDisk.value=0;},endIndirectCapture(){material.uniforms.solarDisk.value=1;},info:{
  revision:'scene07-world-cloud-field-broad-angular-transition214-r18',skyAsset:SKY_ASSET,skyAssetProvenance:'reconstructions/scene-07/assets/sky145/provenance.json',measuredAtmosphere:'Poly Haven Qwantani Sunset Pure Sky, CC0',sourceSunCentroid:source.toArray(),targetSunDirection:wanted.toArray(),sun:{intensity:sun.intensity,linearColor:sun.color.toArray(),shadowMap:sun.shadow.mapSize.toArray(),shadowNear:sun.shadow.camera.near,shadowFar:sun.shadow.camera.far,shadowBias:sun.shadow.bias,shadowBiasWorldMetres:Math.abs(sun.shadow.bias)*(sun.shadow.camera.far-sun.shadow.camera.near)},sourceSolarPeak:peak,measuredDomeRadianceGain:.80,cloudCapRadianceGain:null,capAngularTransitionFraction:.18,unobservedUpperCloudBank:{sameWorldRadiance:true,worldAngularUV:true,opticalStructure:SKY_ASSET,coverageLimit:.72,measuredRetention:.35,actualSolarScatterGain:.12,extraLights:0},cloudUse:'Chroma-separated cloud optical structure and retained macro luminance illuminated by actual sun, with angular Rayleigh clear-air radiance in gaps. Same field in camera, water and indirect lighting.',clearAirCap:{rayleighSolarCoefficients:[.00857143,.01714286,.03285714],phase:'.75*(1+cosineSquared)',retainedMeasuredRadiance:.06,cloudAmbientGain:.30},atmosphericForwardScatter:{normalizedHenyeyGreensteinG:.88,opticalGain:.035,elevationFalloff:2.6},lowerSkyHemisphereGain:.06,solarPixelsClamped,solarRadianceLimit:limit,pmrem:{source:'Actual same world-oriented atmosphere shader with analytic solar disk removed',resolution:256,intensity:1,rotation:[0,0,0]},hemisphereLights:0,unshadowedDirectionalFills:0,constantFoliageScatter:false,referencePixelsSampled:false,visualAccepted:false
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
 const positions=Object.fromEntries(Object.entries({'lower-room':[3.561,8.872,-4.931],'lower-porch':[2.94,8.95,-2.35],'upper-room':[3.561,13.404,-4.931],'upper-porch':[2.94,13.40,-2.35]}).map(([key,p])=>[key,sitePoint214([p[0],p[1]+HALL_DATUM_OFFSET214,p[2]])]));positions['ground-near-bank']=[7,1.6,5.5];positions['ground-far-bank']=[6.5,2.3,-9];positions['canopy-near-bank']=[5,8.6,6];positions['canopy-far-bank']=[1,8.4,-13];const captures=[],pmrem=new T.PMREMGenerator(renderer),oldWater=water.visible,oldAuto=renderer.shadowMap.autoUpdate;
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
 return{info:{revision:'scene07-eight-captures-at-reseated-hall-datum214-r18',resolution:128,assignments,source:'Eight actual same-scene 3D cube captures; low vegetation and open crowns in near/far banks, exterior gallery and interior room have separate spatial radiance. Shared solar-separated sky, fixed practicals and shadow-casting sun.',constantFillLights:0,cameraFollowing:false,approximateSingleBounce:true,visualAccepted:false},dispose(){for(const c of captures)c.environment.dispose();}};
}
