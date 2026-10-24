import * as T from 'three';
// A relative radiance unit conversion keeps the real solar disk below the
// native half-float ceiling. Camera exposure uses the reciprocal; albedo and
// all light ratios remain invariant under this unit conversion.
export const RADIANCE_SCALE214=1/6;

// One finite source, quadrature-sampled over its physical 0.53-degree disk.
// Every sample casts a real shadow; there are no auxiliary fill directions.
export function createSolarDisk214(scene){
 const totalIntensity=24,angularRadius=T.MathUtils.degToRad(.265),solidAngle=2*Math.PI*(1-Math.cos(angularRadius)),direction=new T.Vector3(-.58,.045,-.81).normalize(),target=new T.Vector3(0,3,3),u=new T.Vector3(0,1,0).cross(direction).normalize(),v=direction.clone().cross(u).normalize(),samples=[{weight:.25,direction:direction.clone()}];
 for(let i=0;i<4;i++){const a=(i+.173)*Math.PI/2,r=angularRadius*Math.sqrt(2/3),d=direction.clone().multiplyScalar(Math.cos(r)).addScaledVector(u,Math.cos(a)*Math.sin(r)).addScaledVector(v,Math.sin(a)*Math.sin(r)).normalize();samples.push({weight:.1875,direction:d});}
 const lights=samples.map((sample,i)=>{
  const light=new T.DirectionalLight(0xffffff,totalIntensity*sample.weight*RADIANCE_SCALE214);light.color.setRGB(1,.47,.14);light.name='scene07-shadowed-finite-solar-disk214-r19-'+i;light.target.position.copy(target);light.position.copy(sample.direction).multiplyScalar(1200).add(target);light.castShadow=true;light.shadow.mapSize.set(i?2048:4096,i?2048:4096);Object.assign(light.shadow.camera,{left:-38,right:38,top:34,bottom:-25,near:1,far:2400});light.shadow.bias=-.0000025;light.shadow.normalBias=.004;light.shadow.radius=i?1.5:2;scene.add(light,light.target);return light;
 });
 const info={revision:'scene07-finite-shadowed-solar-quadrature214-r19',totalIntensity,renderedTotalIntensity:totalIntensity*RADIANCE_SCALE214,radianceScale:RADIANCE_SCALE214,angularDiameterDegrees:.53,angularRadius,solidAngle,diskRadiance:totalIntensity/solidAngle,renderedDiskRadiance:totalIntensity/solidAngle*RADIANCE_SCALE214,linearColor:[1,.47,.14],centralDirection:direction.toArray(),samples:samples.map((s,i)=>({weight:s.weight,direction:s.direction.toArray(),intensity:lights[i].intensity,shadowSize:lights[i].shadow.mapSize.toArray()})),unshadowedFillLights:0,cameraInput:false,photometricCalibration:'Authored relative radiance units, internally disk-integrated; not measured site photometry',visualAccepted:false};
 lights[0].userData.solarDisk214=info;return{sun:lights[0],lights,info,dispose(){for(const light of lights){scene.remove(light,light.target);light.dispose();}}};
}

// Shared by the visible sky and geometry's participating-air transport.
// The camera, planar reflection, PMREM and local native captures all see
// exactly this world-oriented radiance, using the same texture/uniform data.
export const WORLD_ATMOSPHERE_GLSL214=`
 const float radianceScale214=.166666666667;
 uniform sampler2D clouds;uniform sampler2D measured;uniform mat3 worldToSky;uniform vec4 cap;
 uniform vec3 solarDirection;uniform vec3 solarColor214;uniform float solarPower214;
 float phase214(float cosine,float g){float g2=g*g;return(1.-g2)/(12.56637061436*pow(max(1.-2.*g*cosine+g2,.0001),1.5));}
 vec3 measuredSky214(vec3 w){vec3 d=normalize(worldToSky*w);vec2 uv=vec2(atan(d.z,d.x)/6.28318530718+.5,asin(clamp(d.y,-1.,1.))/3.14159265359+.5);return texture2D(measured,uv).rgb*.55;}
 vec3 clearAir214(vec3 w){
  float cosine=clamp(dot(w,solarDirection),-1.,1.),rayleighPhase=.75*(1.+cosine*cosine),heightFactor=.55+.45*sqrt(max(w.y,0.));
  vec3 rayleigh=vec3(.00531429,.01062857,.02037143)*solarPower214*heightFactor*rayleighPhase;
  vec3 mie=solarColor214*solarPower214*.022*phase214(cosine,.84)*exp(-max(w.y,0.)*2.2);
  return rayleigh+measuredSky214(w)*.06+mie;
 }
 vec3 worldSky214(vec3 w){
  vec3 base=measuredSky214(w),clear=clearAir214(w);
  float lon=mod(atan(w.z,w.x)-cap.x+3.14159265359,6.28318530718)-3.14159265359;
  vec2 uv=vec2(lon/cap.y+.5,(asin(clamp(w.y,-1.,1.))-cap.z)/cap.w),edge=min(uv,1.-uv);
  float blend=smoothstep(0.,.18,edge.x)*smoothstep(0.,.18,edge.y);
  vec2 domeUV=vec2(atan(w.z,w.x)/6.28318530718+.5,clamp(.18+asin(clamp(w.y,0.,1.))/.75,0.,1.));
  vec3 domeOptical=texture2D(clouds,domeUV).rgb;
  float domeDensity=smoothstep(.78,1.10,domeOptical.r/max(domeOptical.b,.035)),domeCover=domeDensity*.72*smoothstep(.02,.18,w.y);
  vec3 solarCloudDome=base*.35+solarColor214*solarPower214*.085+clear*.22;
  vec3 outsideCap=mix(base+clear*.28,solarCloudDome,domeCover),sky=mix(outsideCap,clear,blend);
  vec3 optical=texture2D(clouds,clamp(uv,0.,1.)).rgb;float density=smoothstep(.78,1.10,optical.r/max(optical.b,.035)),lum=dot(optical,vec3(.2126,.7152,.0722));
  vec3 cloudRadiance=clear*.30+solarColor214*solarPower214*.115*pow(max(lum,.001),1.95);
  sky=mix(sky,cloudRadiance,density*blend*.94);
  return sky*mix(.06,1.,smoothstep(-.08,.02,w.y));
 }
`;

// Beer-Lambert extinction integrated along the actual 3D segment through an
// exponential-height aerosol layer. In-scatter follows the same clear-air
// solar/Rayleigh phase field as the sky. This is geometry transport before
// tone mapping, not an image tint, screen ray or unshadowed surface light.
export function installAerialPerspective214(material,uniforms){
 if(!material||material.isShaderMaterial||material.fog===false||material.userData.aerialPerspective214)return;
 const before=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=shader=>{
  before.call(material,shader);for(const [name,u]of Object.entries(uniforms))if(['clouds','measured','worldToSky','cap','solarDirection','solarColor214','solarPower214'].includes(name))shader.uniforms[name]=u;
  // Some authored material callbacks delegate to a parent callback. The
  // parent may already carry this exact world transport; install it once.
  if(shader.vertexShader.includes('varying vec3 vAirPoint214;'))return;
  shader.vertexShader='varying vec3 vAirPoint214;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 airWorld214=vec4(transformed,1.);
   #ifdef USE_INSTANCING
    airWorld214=instanceMatrix*airWorld214;
   #endif
   vAirPoint214=(modelMatrix*airWorld214).xyz;`);
  shader.fragmentShader='varying vec3 vAirPoint214;\n'+WORLD_ATMOSPHERE_GLSL214+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>','').replace('#include <tonemapping_fragment>',`
   vec3 airSegment214=vAirPoint214-cameraPosition;float airDistance214=length(airSegment214),heightDelta214=(vAirPoint214.y-cameraPosition.y)/180.;
   float airDensity214=exp(-cameraPosition.y/180.)*(abs(heightDelta214)<.001?1.:(1.-exp(-heightDelta214))/heightDelta214);
   vec3 airT214=exp(-vec3(.00110,.00114,.00123)*max(airDistance214-10.,0.)*airDensity214);
   vec3 airSource214=clearAir214(airSegment214/max(airDistance214,.001))*radianceScale214;
   gl_FragColor.rgb=gl_FragColor.rgb*airT214+airSource214*(1.-airT214);
   #include <tonemapping_fragment>`);
 };
 material.customProgramCacheKey=()=>key()+':shared-height-air-transport214-r19';material.userData.aerialPerspective214={heightScaleMetres:180,extinctionRGB:[.00110,.00114,.00123],linearTransportBeforeToneMapping:true,sameSolarAndClearSky:true,screenSpaceFilter:false};material.needsUpdate=true;
}
