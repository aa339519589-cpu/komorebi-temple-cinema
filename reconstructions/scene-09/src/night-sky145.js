import * as T from 'three';
import {EXRLoader} from 'three/addons/loaders/EXRLoader.js';

// Independent CC0 pure-sky radiance, remapped to inferred blue-hour tones.
// No temple, pond, architecture or reference-scene pixels enter this texture.
export async function createNightSky145(ownedTextures){
 const texture=await new EXRLoader().setDataType(T.FloatType).loadAsync(new URL('../assets/night-sky145/sky-2k.exr',import.meta.url).href);
 texture.mapping=T.EquirectangularReflectionMapping;texture.wrapS=T.RepeatWrapping;ownedTextures.push(texture);
 const material=new T.ShaderMaterial({name:'scene09-CC0-cloud-cobalt-twilight145',side:T.BackSide,depthWrite:false,
 uniforms:{radiance:{value:texture},yaw:{value:-.71}},
 vertexShader:'varying vec3 ray;void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D radiance;uniform float yaw;varying vec3 ray;void main(){
  vec3 d=normalize(ray);float a=atan(d.z,d.x)+yaw;vec2 uv=vec2(a/6.28318530718+.5,asin(clamp(d.y,-1.,1.))/3.14159265359+.5);
  vec3 measured=texture2D(radiance,uv).rgb;float chroma=measured.r/max(.00001,measured.b);float cloud=smoothstep(.22,.87,chroma);
  float altitude=smoothstep(.0,.75,d.y);vec3 clear=mix(vec3(.027,.094,.245),vec3(.013,.041,.137),altitude);
  vec3 c=mix(clear,clear*vec3(.25,.33,.48),cloud*.90);gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 const mesh=new T.Mesh(new T.SphereGeometry(150,48,24),material);mesh.name='scene09-world-locked-CC0-twilight-cloud-sky145';
 return{mesh,material,info:{source:'Poly Haven Kloofendal38d Partly Cloudy Pure Sky',license:'CC0-1.0',mode:'Source chromatic cloud structure remapped to inferred cobalt twilight, not measured night radiometry',sourcePhotoUse:'Independent pure sky only; no supplied scene reference sampled or projected',worldLocked:true}};
}
