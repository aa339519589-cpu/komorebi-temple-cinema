import * as T from 'three';
import {EXRLoader} from 'three/addons/loaders/EXRLoader.js';

// A CC0 radiance measurement illuminates independent model geometry. It is
// neither a temple photograph nor a camera-projected color field.
export async function loadMeasuredSky(sunDirection){
 const texture=await new EXRLoader().setDataType(T.FloatType).loadAsync('/assets/polyhaven/kloppenheim-06-puresky/sky-2k.exr');
 texture.mapping=T.EquirectangularReflectionMapping;
 texture.minFilter=T.LinearFilter;texture.magFilter=T.LinearFilter;
 const {data,width,height}=texture.image,channels=data.length/(width*height);
 let peak=-Infinity,peakIndex=0,sum=0;
 for(let i=0;i<width*height;i++){
  const p=i*channels,lum=.2126*data[p]+.7152*data[p+1]+.0722*data[p+2];sum+=lum;
  if(lum>peak){peak=lum;peakIndex=i;}
 }
 const u=(peakIndex%width+.5)/width,v=(Math.floor(peakIndex/width)+.5)/height;
 const longitude=(u-.5)*Math.PI*2,latitude=(v-.5)*Math.PI;
 const measured=new T.Vector3(Math.cos(latitude)*Math.cos(longitude),Math.sin(latitude),Math.cos(latitude)*Math.sin(longitude));
 // Yaw first, then make only the small elevation adjustment. A shortest-arc
 // vector-to-vector quaternion can overturn the horizon when the azimuths
 // are nearly opposite, even though it places the solar pixel correctly.
 const wantedLongitude=Math.atan2(sunDirection.z,sunDirection.x),wantedLatitude=Math.asin(sunDirection.y);
 const yaw=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),longitude-wantedLongitude);
 const pitch=new T.Quaternion().setFromAxisAngle(new T.Vector3(-Math.sin(wantedLongitude),0,Math.cos(wantedLongitude)),wantedLatitude-latitude);
 const orientation=pitch.multiply(yaw),inverse=new T.Matrix3().setFromMatrix4(new T.Matrix4().makeRotationFromQuaternion(orientation).invert());
 const material=new T.ShaderMaterial({name:'measured-clear-sunset-radiance',side:T.BackSide,depthWrite:false,
  uniforms:{radiance:{value:texture},worldToSky:{value:inverse},sunDirection:{value:sunDirection},skyIntensity:{value:.28}},
  vertexShader:`varying vec3 vRay;void main(){vec4 world=modelMatrix*vec4(position,1.);vRay=world.xyz-cameraPosition;gl_Position=projectionMatrix*viewMatrix*world;}`,
  fragmentShader:`varying vec3 vRay;uniform sampler2D radiance;uniform mat3 worldToSky;uniform vec3 sunDirection;uniform float skyIntensity;
  void main(){vec3 ray=normalize(vRay),d=normalize(worldToSky*ray);vec2 uv=vec2(atan(d.z,d.x)/6.28318530718+.5,asin(clamp(d.y,-1.,1.))/3.14159265359+.5);vec3 color=texture2D(radiance,uv).rgb*skyIntensity;
  float horizon=1.-smoothstep(-.055,.40,ray.y),upperSky=smoothstep(.10,.66,ray.y);
  float cloudLayer=smoothstep(-.015,.20,ray.y)*(1.-smoothstep(.48,.73,ray.y));
  float cloudContrast=1.04+.19*cloudLayer+.08*upperSky;
  color=max(vec3(0.),(color-vec3(.18))*cloudContrast+vec3(.18));
  color*=mix(vec3(1.10,1.02,.91),vec3(.87,.93,1.08),upperSky);
  float warmHorizon=horizon*smoothstep(-.16,.015,ray.y);
  color=mix(color,color*vec3(1.46,1.04,.70)+vec3(.16,.045,.006),warmHorizon*.72);
  float cloudLuma=dot(color,vec3(.2126,.7152,.0722));
  float cloudRim=smoothstep(.22,.56,cloudLuma)*(1.-smoothstep(.68,.94,cloudLuma))*cloudLayer;
  color+=vec3(.026,.020,.012)*cloudRim;
  float nearSun=pow(max(0.,dot(ray,sunDirection)),24.);color*=mix(vec3(1.13,1.,.88),vec3(1.45,1.02,.68),nearSun);color+=vec3(1.2,.37,.025)*pow(max(0.,dot(ray,sunDirection)),80.);color+=vec3(40.,23.,8.)*smoothstep(.999960,.999972,dot(ray,sunDirection));gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
 const mesh=new T.Mesh(new T.SphereGeometry(180,48,28),material);mesh.name='measured-cc0-sky-environment';mesh.renderOrder=-100;
 return{mesh,texture,rotation:new T.Euler().setFromQuaternion(orientation),
  info:{provider:'Poly Haven',asset:'kloppenheim_06_puresky',license:'CC0-1.0',measuredSunDirection:measured.toArray(),targetSunDirection:sunDirection.toArray(),peakRadiance:peak,meanRadiance:sum/(width*height),authoredAppearance:'Background-only warm white balance and solar disc; environment uses the measured radiance.',scope:'Sky radiance and reflections; all temple and garden pixels come from independently lit meshes.'},
  dispose(){texture.dispose();material.dispose();mesh.geometry.dispose();}};
}
