import {Sky} from 'three/addons/objects/Sky.js';

// The analytic atmosphere is retained. Clouds are a deterministic finite 3D
// density volume, integrated along the actual eye ray, not a painted sky plane.
const volumeFunctions=`
float r4hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float r4noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(mix(r4hash(i),r4hash(i+vec3(1,0,0)),f.x),mix(r4hash(i+vec3(0,1,0)),r4hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(r4hash(i+vec3(0,0,1)),r4hash(i+vec3(1,0,1)),f.x),mix(r4hash(i+vec3(0,1,1)),r4hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float r4ellipsoid(vec3 p,vec3 c,vec3 r){vec3 q=(p-c)/r;return 1.0-dot(q,q);}
float r4density(vec3 p){
 float s=max(r4ellipsoid(p,vec3(.65,.68,-1.55),vec3(.48,.14,.28)),r4ellipsoid(p,vec3(.99,.70,-1.65),vec3(.39,.20,.33)));
 s=max(s,r4ellipsoid(p,vec3(1.28,.62,-1.78),vec3(.45,.13,.28)));
 s=max(s,r4ellipsoid(p,vec3(.43,.75,-1.68),vec3(.24,.16,.22)));
 float n=r4noise(p*20.0)*.60+r4noise(p*43.0)*.28+r4noise(p*91.0)*.12;
 return smoothstep(-.05,.47,s+(n-.52)*1.05);
}
vec3 r4CloudVolume(vec3 origin,vec3 direction,vec3 clearSky,vec3 sunlight,vec3 ambient){
 vec3 safeDirection=vec3(direction.x<0.0?min(direction.x,-.00001):max(direction.x,.00001),direction.y<0.0?min(direction.y,-.00001):max(direction.y,.00001),direction.z<0.0?min(direction.z,-.00001):max(direction.z,.00001));
 vec3 inv=1.0/safeDirection;
 vec3 ta=(vec3(.08,.44,-2.2)-origin)*inv,tb=(vec3(1.82,.98,-1.10)-origin)*inv;
 vec3 nearT=min(ta,tb),farT=max(ta,tb);float lo=max(0.0,max(nearT.x,max(nearT.y,nearT.z))),hi=min(farT.x,min(farT.y,farT.z));
 if(hi<=lo)return clearSky;
 float stepLength=(hi-lo)/36.0,transmission=1.0;vec3 integrated=vec3(0);
 for(int j=0;j<36;j++){
  vec3 p=origin+direction*(lo+(float(j)+.5)*stepLength);float density=r4density(p);
  if(density>.001){float shadow=exp(-1.25*r4density(p+vSunDirection*.12)-.65*r4density(p+vSunDirection*.25));
   vec3 daylight=mix(sunlight,vec3(dot(sunlight,vec3(.2126,.7152,.0722))),.72);vec3 scattering=ambient*.32+daylight*(.60+.40*shadow)*1.45;
   float opacity=1.0-exp(-density*stepLength*28.0);integrated+=transmission*opacity*scattering;transmission*=1.0-opacity;}
  if(transmission<.012)break;
 }
 return clearSky*transmission+integrated;
}
`;

export function buildReference4Atmosphere(T,{sunDirection,displayRadiance=.18}={}){
 const sky=new Sky();sky.name='reference4-atmosphere-with-real-density-clouds';sky.scale.setScalar(180);
 const u=sky.material.uniforms;u.turbidity.value=1.5;u.rayleigh.value=2.2;u.cloudCoverage.value=0;u.mieCoefficient.value=.0015;u.mieDirectionalG.value=.79;u.sunPosition.value.copy(sunDirection);u.reference4SkyRadiance={value:displayRadiance};
 let shader=sky.material.fragmentShader;
 const start=shader.indexOf('\t\t\t// Clouds'),end=shader.indexOf('\n\t\t\tgl_FragColor',start);
 if(start<0||end<0)throw Error('Pinned sky cloud insertion boundary changed.');
 shader=shader.slice(0,start)+`\n texColor=r4CloudVolume(cameraPosition*.001,direction,texColor,vSunE*Fex*.22*.04,Lin*.04);\n`+shader.slice(end);
 shader=shader.replace('uniform float time;','uniform float time; uniform float reference4SkyRadiance;\n'+volumeFunctions).replace('vec4( texColor, 1.0 )','vec4( texColor * reference4SkyRadiance, 1.0 )');
 sky.material.fragmentShader=shader;sky.userData.cloudModel='Finite irregular density bank in 3D; 36-step view integration and two directional self-shadow samples, deterministic visual hypothesis.';
 return sky;
}
