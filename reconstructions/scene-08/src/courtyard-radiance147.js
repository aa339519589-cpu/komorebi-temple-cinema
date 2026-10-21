import * as T from 'three';
import {EXRLoader} from 'three/addons/loaders/EXRLoader.js';

// Measured CC0 sky radiance supplies both the environment and the visible sky.
// Full yaw/elevation alignment uses the existing real directional light.
export async function installCourtyardRadiance({renderer,scene,sun}){
 const texture=await new EXRLoader().setDataType(T.FloatType).loadAsync('/assets/polyhaven/kloppenheim-06-puresky/sky-2k.exr');
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
 const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(texture);pmrem.dispose();scene.environment=target.texture;scene.environmentRotation.copy(rotation);scene.environmentIntensity=.32;
 const gain=.55,geometry=new T.SphereGeometry(120,48,24),material=new T.ShaderMaterial({
  name:'scene08-measured-sun-aligned-sky147',side:T.BackSide,depthTest:false,depthWrite:false,
  uniforms:{radiance:{value:texture},worldToSky:{value:inverse},gain:{value:gain}},
  vertexShader:'varying vec3 ray;void main(){vec4 w=modelMatrix*vec4(position,1.);ray=w.xyz-cameraPosition;vec4 clip=projectionMatrix*viewMatrix*w;gl_Position=clip.xyww;}',
  fragmentShader:'varying vec3 ray;uniform sampler2D radiance;uniform mat3 worldToSky;uniform float gain;void main(){vec3 d=normalize(worldToSky*normalize(ray));vec2 uv=vec2(atan(d.z,d.x)/6.28318530718+.5,asin(clamp(d.y,-1.,1.))/3.14159265359+.5);gl_FragColor=vec4(texture2D(radiance,uv).rgb*gain,1.);}'
 });
 const mesh=new T.Mesh(geometry,material);mesh.name='scene08-measured-atmosphere147';mesh.frustumCulled=false;mesh.renderOrder=-1000;
 mesh.onBeforeRender=(_r,_s,camera)=>{mesh.position.copy(camera.position);mesh.updateMatrixWorld();};scene.add(mesh);
 return {info:{provider:'Poly Haven',asset:'Kloppenheim06 Pure Sky',license:'CC0-1.0',source:'assets/polyhaven/kloppenheim-06-puresky/sky-2k.exr',sourceSunDirection:source.toArray(),targetSunDirection:wanted.toArray(),rotation:rotation.toArray(),peakLinearLuminance:peak,meanLinearLuminance:total/(width*height),environmentIntensity:.32,cameraRadianceGain:gain,worldLocked:true,photoProjection:false},dispose(){scene.remove(mesh);geometry.dispose();material.dispose();target.dispose();texture.dispose();}};
}
