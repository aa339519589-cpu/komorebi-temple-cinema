import * as T from 'three';
import {SUN_AXIS108} from './scene03-daylight108.js';

// A world-fixed, finite-height3D cumulus field and pale atmospheric radiance.
// This is a native scene shader, not a new HDR or a replacement temple image.
export function installAtmosphere109({scene,skyDome}){
 const prior=skyDome.material;
 skyDome.material=new T.ShaderMaterial({name:'scene03-isolated-daylight-cumulus174',side:T.BackSide,depthWrite:false,uniforms:{sunDirection109:{value:SUN_AXIS108}},vertexShader:`varying vec3 worldSky109;void main(){vec4 p=modelMatrix*vec4(position,1.);worldSky109=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,fragmentShader:`
 varying vec3 worldSky109;uniform vec3 sunDirection109;
 float hash109(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,73.9)))*43758.5453);}
 float noise109(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash109(i),hash109(i+vec3(1,0,0)),f.x),mix(hash109(i+vec3(0,1,0)),hash109(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash109(i+vec3(0,0,1)),hash109(i+vec3(1,0,1)),f.x),mix(hash109(i+vec3(0,1,1)),hash109(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float cloud109(vec3 p){
  vec2 cell=floor(p.xz/42.);float density=0.;
  for(int iz=-1;iz<=1;iz++)for(int ix=-1;ix<=1;ix++){
   vec2 c=cell+vec2(float(ix),float(iz));float seed=hash109(vec3(c.x,5.7,c.y));
   if(seed>.33){
    vec3 centre=vec3((c.x+.22+.56*hash109(vec3(c,7.1)))*42.,48.5+seed*2.3,(c.y+.22+.56*hash109(vec3(c,2.8)))*42.);
    vec3 size=vec3(12.+7.*seed,4.4+1.1*seed,10.+5.*hash109(vec3(c,9.4)));
    vec3 q=(p-centre)/size;
    float d=min(length(q),min(length((p-centre-vec3(size.x*.63,-.7,1.4))/(size*.79)),length((p-centre+vec3(size.x*.51,.6,1.9))/(size*.74))));
    if(d<1.20){float erosion=.18*noise109(p*.38)+.075*noise109(p*.91);density=max(density,1.-smoothstep(.56,1.13,d+erosion));}
   }
  }
  return density*smoothstep(43.,46.,p.y)*(1.-smoothstep(52.5,56.,p.y));
 }
 void main(){
  vec3 d=normalize(worldSky109-cameraPosition),sun=normalize(sunDirection109);float h=max(0.,d.y),air=pow(h,.40);
  vec3 sky=mix(vec3(.42,.68,1.10),vec3(.16,.40,.83),air);
  float toward=max(0.,dot(d,sun));sky+=vec3(.34,.28,.18)*pow(toward,28.)*.22;
  vec3 col=sky;float trans=1.;
  if(d.y>.025){
   float start=max(0.,(43.-cameraPosition.y)/d.y),end=(56.-cameraPosition.y)/d.y,stepLen=(end-start)/14.;vec3 scatter=vec3(0.);
   for(int i=0;i<14;i++){
    vec3 p=cameraPosition+d*(start+(float(i)+.5)*stepLen);float density=cloud109(p);
    // The key direction remains visible through a clear solar corridor.
    density*=1.-smoothstep(.92,.985,toward);float shadow=exp(-1.65*(cloud109(p+sun*3.)+cloud109(p+sun*7.)));
    vec3 light=mix(vec3(.64,.78,1.0),vec3(3.30,3.20,3.02),shadow);
    float opacity=1.-exp(-density*stepLen*.54);scatter+=trans*opacity*light;trans*=1.-opacity;
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
 return{revision:174,coverage:'Separated world-space cumulus clusters with finite ellipsoid lobes and3D edge erosion; blue openings compared with HD03',worldCloudLayerY:[43,56],worldLocked:true,scattering:'14-step density integration and two sun-direction self-shadow samples',nativeDiffuseGI:false,newHdrAsset:false,referenceImageUsed:false};
}
