import * as T from 'three';
import {SUN_AXIS108} from './scene03-daylight108.js';

// A world-fixed, finite-height3D cumulus field and pale atmospheric radiance.
// This is a native scene shader, not a new HDR or a replacement temple image.
export function installAtmosphere109({scene,skyDome}){
 const prior=skyDome.material;
 skyDome.material=new T.ShaderMaterial({name:'scene03-world-cloud-scattering109',side:T.BackSide,depthWrite:false,uniforms:{sunDirection109:{value:SUN_AXIS108}},vertexShader:`varying vec3 worldSky109;void main(){vec4 p=modelMatrix*vec4(position,1.);worldSky109=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,fragmentShader:`
 varying vec3 worldSky109;uniform vec3 sunDirection109;
 float hash109(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,73.9)))*43758.5453);}
 float noise109(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash109(i),hash109(i+vec3(1,0,0)),f.x),mix(hash109(i+vec3(0,1,0)),hash109(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash109(i+vec3(0,0,1)),hash109(i+vec3(1,0,1)),f.x),mix(hash109(i+vec3(0,1,1)),hash109(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float cloud109(vec3 p){
  float h=(p.y-43.)/13.,shape=smoothstep(0.,.22,h)*(1.-smoothstep(.57,1.,h));
  float plan=.65*noise109(vec3(p.x*.031,2.3,p.z*.031))+.35*noise109(vec3(p.x*.068,1.1,p.z*.068));
  float lobes=.67*noise109(p*.155+vec3(7.2,1.4,3.7))+.33*noise109(p*.36+vec3(2.1,4.7,1.3));
  float cover=smoothstep(.45,.61,plan);return smoothstep(.32,.67,lobes+cover*.31-.18)*shape*cover;
 }
 void main(){
  vec3 d=normalize(worldSky109-cameraPosition),sun=normalize(sunDirection109);float h=max(0.,d.y),air=pow(h,.40);
  vec3 sky=mix(vec3(.31,.48,.70),vec3(.115,.265,.52),air);
  float toward=max(0.,dot(d,sun));sky+=vec3(.34,.28,.18)*pow(toward,28.)*.22;
  vec3 col=sky;float trans=1.;
  if(d.y>.025){
   float start=max(0.,(43.-cameraPosition.y)/d.y),end=(56.-cameraPosition.y)/d.y,stepLen=(end-start)/14.;vec3 scatter=vec3(0.);
   for(int i=0;i<14;i++){
    vec3 p=cameraPosition+d*(start+(float(i)+.5)*stepLen);float density=cloud109(p);
    // The key direction remains visible through a clear solar corridor.
    density*=1.-smoothstep(.92,.985,toward);float shadow=exp(-2.8*(cloud109(p+sun*3.)+cloud109(p+sun*7.)));
    vec3 light=mix(vec3(.34,.46,.65),vec3(2.45,2.32,2.08),shadow);
    float opacity=1.-exp(-density*stepLen*.74);scatter+=trans*opacity*light;trans*=1.-opacity;
   }
   col=sky*trans+scatter;
  }
  gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 prior.dispose();skyDome.visible=true;
 // Preserve the licensed IBL and its measured solar direction, with a
 // declared cool-daylight white balance rather than a second sky asset.
 const map=scene.environment,data=map?.image?.data;if(data)for(let k=0;k<data.length;k+=4){data[k]*=.94;data[k+1]*=1.08;data[k+2]*=1.03;}if(map)map.needsUpdate=true;
 return{revision:109,worldCloudLayerY:[43,56],worldLocked:true,scattering:'14-step density integration and two sun-direction self-shadow samples',nativeDiffuseGI:false,newHdrAsset:false,referenceImageUsed:false};
}
