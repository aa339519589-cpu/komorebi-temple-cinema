import * as T from 'three';
import {EXRLoader} from 'three/addons/loaders/EXRLoader.js';

const SKY_ASSET='/reconstructions/scene-07/assets/sky145/sky-cloud-cap-generated-r04.png';
const TAU=Math.PI*2;

function alignSun(source,wanted){
 const a=Math.atan2(source.z,source.x),b=Math.atan2(wanted.z,wanted.x);
 const yaw=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a-b);
 const pitch=new T.Quaternion().setFromAxisAngle(new T.Vector3(-Math.sin(b),0,Math.cos(b)),Math.asin(wanted.y)-Math.asin(source.y));
 return new T.Euler().setFromQuaternion(pitch.multiply(yaw));
}

// Retain the measured CC0 HDR lighting, including its complete solar-centroid
// alignment. A separate, declared generated SKY-ONLY panorama supplies clouds
// visible to the actual camera and the physical planar reflection camera.
export async function installMeasuredSky({renderer,scene,sun}){
 const [texture,clouds]=await Promise.all([
  new EXRLoader().setDataType(T.FloatType).loadAsync('/assets/polyhaven/qwantani-sunset-puresky/sky-2k.exr'),
  new T.TextureLoader().loadAsync(SKY_ASSET)
 ]);
 texture.mapping=T.EquirectangularReflectionMapping;
 clouds.colorSpace=T.SRGBColorSpace;
 clouds.wrapS=T.ClampToEdgeWrapping;
 clouds.wrapT=T.ClampToEdgeWrapping;
 clouds.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const {width,height,data}=texture.image;let peak=0;
 for(let i=0;i<data.length;i+=4)peak=Math.max(peak,.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]);
 const source=new T.Vector3();let weightSum=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,luma=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2],w=Math.max(0,luma-peak*.78)**2;if(!w)continue;
  const lat=((y+.5)/height-.5)*Math.PI,lon=((x+.5)/width-.5)*TAU,c=Math.cos(lat);
  source.addScaledVector(new T.Vector3(c*Math.cos(lon),Math.sin(lat),c*Math.sin(lon)),w);weightSum+=w;
 }
 if(!weightSum)throw Error('Sky radiance has no finite solar centroid');
 source.normalize();
 const wanted=sun.position.clone().sub(sun.target.position).normalize();
 const environmentRotation=alignSun(source,wanted);
 const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(texture);
 pmrem.dispose();scene.environment=target.texture;scene.environmentIntensity=.38;scene.environmentRotation.copy(environmentRotation);

 // This independent asset covers one70x35-degree spherical cap, rather than
 // stretching1774pixels around360degrees. Its requested sun lies8degrees past
 // the left edge at13.5degrees altitude, consistent with the actual sun. The
 // center is43degrees clockwise from that sun; it is never camera-attached.
 const capCenter=Math.atan2(wanted.z,wanted.x)+T.MathUtils.degToRad(43);
 const capWidth=T.MathUtils.degToRad(70),capMin=T.MathUtils.degToRad(-5),capHeight=T.MathUtils.degToRad(35);
 const inverseEnvironment=new T.Matrix3().setFromMatrix4(new T.Matrix4().makeRotationFromEuler(environmentRotation).invert());
 const gain=1.1;
 const material=new T.ShaderMaterial({
  name:'scene07-worldlocked-golden-cloud-radiance145',side:T.BackSide,depthWrite:false,depthTest:false,
  uniforms:{radiance:{value:clouds},measured:{value:texture},worldToEnvironment:{value:inverseEnvironment},gain:{value:gain},cap:{value:new T.Vector4(capCenter,capWidth,capMin,capHeight)}},
  vertexShader:`varying vec3 ray;
   void main(){vec4 w=modelMatrix*vec4(position,1.);ray=w.xyz-cameraPosition;
    vec4 clip=projectionMatrix*viewMatrix*w;gl_Position=clip.xyww;}`,
  fragmentShader:`varying vec3 ray;uniform sampler2D radiance;uniform sampler2D measured;uniform mat3 worldToEnvironment;uniform float gain;uniform vec4 cap;
   void main(){vec3 world=normalize(ray),d=normalize(worldToEnvironment*world);
    vec2 baseUV=vec2(atan(d.z,d.x)/6.28318530718+.5,asin(clamp(d.y,-1.,1.))/3.14159265359+.5);
    vec3 base=texture2D(measured,baseUV).rgb*.08;
    float longitude=mod(atan(world.z,world.x)-cap.x+3.14159265359,6.28318530718)-3.14159265359;
    vec2 uv=vec2(longitude/cap.y+.5,(asin(clamp(world.y,-1.,1.))-cap.z)/cap.w);
    vec2 edge=min(uv,1.-uv);float blend=smoothstep(0.,.08,edge.x)*smoothstep(0.,.08,edge.y);
    gl_FragColor=vec4(mix(base,texture2D(radiance,clamp(uv,0.,1.)).rgb*gain,blend),1.);}`
 });
 const mesh=new T.Mesh(new T.SphereGeometry(250,64,32),material);
 mesh.name='scene07-sky145-cloud-sphere';mesh.renderOrder=-1000;mesh.frustumCulled=false;
 // Re-centering removes translation parallax, while the lookup remains world
 // oriented. The same callback works for the existing Reflector virtual camera.
 mesh.onBeforeRender=(_renderer,_scene,camera)=>{mesh.position.copy(camera.position);mesh.updateMatrixWorld();};
 scene.add(mesh);
 return {info:{
  revision:'scene07-golden-cloud-sky145-r04',
  environment:{asset:'Qwantani Sunset Pure Sky',provider:'Poly Haven',license:'CC0-1.0',sourceSunCentroid:source.toArray(),rotation:environmentRotation.toArray(),intensity:.38},
  cameraSky:{asset:SKY_ASSET,provider:'OpenAI built-in imagegen',provenance:'reconstructions/scene-07/assets/sky145/provenance.json',projection:'world-fixed spherical cap with measured HDR outside and8percent boundary blend',azimuthCenterRadians:capCenter,horizontalSpanDegrees:70,elevationRangeDegrees:[-5,30],centerAzimuthRelativeToActualSunDegrees:43,solarAzimuthOutsideLeftEdgeDegrees:8,linearRadianceGain:gain,measuredHDR:false,worldLocked:true,cameraTranslationParallax:false},
  targetSunDirection:wanted.toArray(),
  scope:'Measured CC0 HDR lighting retained. Independent generated atmosphere/cloud-only spherical cap decoded to linear and world-oriented relative to the existing physical sun. No reference photo projection, architecture, garden, or scene replacement plate.',
  visualAccepted:false
 },dispose(){scene.remove(mesh);mesh.geometry.dispose();material.dispose();target.dispose();texture.dispose();clouds.dispose();}};
}
