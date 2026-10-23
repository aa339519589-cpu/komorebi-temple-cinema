import * as T from 'three';
import {EXRLoader} from 'three/addons/loaders/EXRLoader.js';

// Measured CC0 sky radiance supplies both the environment and the visible sky.
// Full yaw/elevation alignment uses the existing real directional light.
export async function installCourtyardRadiance({renderer,scene,sun}){
 const texture=await new EXRLoader().setDataType(T.FloatType).loadAsync(new URL('../assets/sky-kloofendal48/sky-2k.exr',import.meta.url).href);
 texture.mapping=T.EquirectangularReflectionMapping;
 const {data,width,height}=texture.image;let peak=0,total=0;
 for(let i=0;i<data.length;i+=4){const l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];peak=Math.max(peak,l);total+=l;}
 const source=new T.Vector3();let weights=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2],w=Math.max(0,l-peak*.78)**2;if(!w)continue;
  const lat=((y+.5)/height-.5)*Math.PI,lon=((x+.5)/width-.5)*Math.PI*2,c=Math.cos(lat);source.addScaledVector(new T.Vector3(c*Math.cos(lon),Math.sin(lat),c*Math.sin(lon)),w);weights+=w;
 }
 if(!weights)throw Error('Scene08 measured sky has no finite solar centroid');source.normalize();
 const wanted=sun.position.clone().sub(sun.target.position).normalize(),a=Math.atan2(source.z,source.x),b=Math.atan2(wanted.z,wanted.x);
 const yaw=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a-b),pitch=new T.Quaternion().setFromAxisAngle(new T.Vector3(-Math.sin(b),0,Math.cos(b)),Math.asin(wanted.y)-Math.asin(source.y));
 const rotation=new T.Euler().setFromQuaternion(pitch.multiply(yaw)),inverse=new T.Matrix3().setFromMatrix4(new T.Matrix4().makeRotationFromEuler(rotation).invert());
 // The direct solar key is already a separate shadow-casting light.
 // Remove only the source HDR solar spike from lighting integration to avoid
 // a second broad white solar reflection on timber. Visible HDR is untouched.
 const environmentData=data.slice(),solarLimit=total/(width*height)*12,solarCone=Math.cos(.055);let solarPixelsClamped=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const lat=((y+.5)/height-.5)*Math.PI,lon=((x+.5)/width-.5)*Math.PI*2,c=Math.cos(lat),dot=source.x*c*Math.cos(lon)+source.y*Math.sin(lat)+source.z*c*Math.sin(lon),i=(y*width+x)*4,l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
  if(dot>solarCone&&l>solarLimit){const gain=solarLimit/l;environmentData[i]*=gain;environmentData[i+1]*=gain;environmentData[i+2]*=gain;solarPixelsClamped++;}
 }
 const environmentTexture=new T.DataTexture(environmentData,width,height,T.RGBAFormat,T.FloatType);environmentTexture.mapping=T.EquirectangularReflectionMapping;environmentTexture.minFilter=environmentTexture.magFilter=T.LinearFilter;environmentTexture.needsUpdate=true;
 const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(environmentTexture);pmrem.dispose();scene.environment=target.texture;scene.environmentRotation.copy(rotation);scene.environmentIntensity=.48;
 const gain=1.05,geometry=new T.SphereGeometry(120,48,24),material=new T.ShaderMaterial({
  name:'scene08-measured-sun-aligned-sky148',side:T.BackSide,depthTest:false,depthWrite:false,
  uniforms:{radiance:{value:texture},worldToSky:{value:inverse},gain:{value:gain}},
  vertexShader:'varying vec3 ray;void main(){vec4 w=modelMatrix*vec4(position,1.);ray=w.xyz-cameraPosition;vec4 clip=projectionMatrix*viewMatrix*w;gl_Position=clip.xyww;}',
  fragmentShader:'varying vec3 ray;uniform sampler2D radiance;uniform mat3 worldToSky;uniform float gain;void main(){vec3 d=normalize(worldToSky*normalize(ray));vec2 uv=vec2(atan(d.z,d.x)/6.28318530718+.5,asin(clamp(d.y,-1.,1.))/3.14159265359+.5);gl_FragColor=vec4(texture2D(radiance,uv).rgb*gain,1.);}'
 });
 const mesh=new T.Mesh(geometry,material);mesh.name='scene08-measured-atmosphere148';mesh.frustumCulled=false;mesh.renderOrder=-1000;
 mesh.onBeforeRender=(_r,_s,camera)=>{mesh.position.copy(camera.position);mesh.updateMatrixWorld();};scene.add(mesh);
 return {beginIndirectCapture(){material.uniforms.radiance.value=environmentTexture;material.uniforms.gain.value=scene.environmentIntensity;},endIndirectCapture(){material.uniforms.radiance.value=texture;material.uniforms.gain.value=gain;},info:{provider:'Poly Haven',asset:'Kloofendal48d Partly Cloudy Pure Sky',license:'CC0-1.0',source:'reconstructions/scene-08/assets/sky-kloofendal48/sky-2k.exr',sourceSunDirection:source.toArray(),targetSunDirection:wanted.toArray(),rotation:rotation.toArray(),peakLinearLuminance:peak,meanLinearLuminance:total/(width*height),environmentIntensity:.48,cameraRadianceGain:gain,solarSeparation:{solarPixelsClamped,sourceSolarPeak:peak,environmentSolarLimit:solarLimit,directKeyPreserved:true,visibleSourceHDRPreserved:true,localCapturesUseSameSeparatedRadiance197:true},worldLocked:true,photoProjection:false},dispose(){scene.remove(mesh);geometry.dispose();material.dispose();target.dispose();environmentTexture.dispose();texture.dispose();}};
}
