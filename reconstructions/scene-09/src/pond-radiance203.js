// A genuine planar scene capture with small nonparallel gravity-wave slopes.
// No regular luminance stripes, warm-pixel gain or painted reflection streaks.
export const pondFragment203=`uniform sampler2D tDiffuse;uniform vec3 color;uniform float time;varying vec4 vUv;varying vec3 vWorld;
float hash203(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise203(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(hash203(i),hash203(i+vec2(1,0)),f.x),mix(hash203(i+vec2(0,1)),hash203(i+vec2(1,1)),f.x),f.y);}
// Independent travelling packets have a continuous multiscale height field.
// Small capillary normals break the reflected scene, with no luminance mask.
float height203(vec2 p){p*=vec2(.55,1.55);vec2 q=mat2(.79,-.61,.61,.79)*p;return .0022*(noise203(p*.71+vec2(time*.08,0.))-.5)+.0011*(noise203(q*2.43-vec2(0.,time*.12))-.5)+.00065*(noise203(p*7.31+vec2(7.,time*.19))-.5)+.00030*(noise203(q*22.7+vec2(time*.32,13.))-.5)+.00004*(noise203(p*58.3-vec2(17.,time*.45))-.5);}
void main(){vec2 uv=vUv.xy/vUv.w,p=vWorld.xz;float eps=.004;vec2 gradient=vec2(height203(p+vec2(eps,0))-height203(p-vec2(eps,0)),height203(p+vec2(0,eps))-height203(p-vec2(0,eps)))/(2.*eps);vec2 slope=gradient*.28;uv+=slope;
vec3 r=texture2D(tDiffuse,uv).rgb*.36;vec2 a=vec2(.00058,.00024),b=vec2(-.00024,.00058);r+=texture2D(tDiffuse,uv+a).rgb*.16;r+=texture2D(tDiffuse,uv-a).rgb*.16;r+=texture2D(tDiffuse,uv+b).rgb*.16;r+=texture2D(tDiffuse,uv-b).rgb*.16;
vec3 waveNormal=normalize(vec3(-gradient.x,1.,-gradient.y));float nDotV=clamp(abs(dot(normalize(cameraPosition-vWorld),waveNormal)),0.,1.);float fresnel=.02037+.97963*pow(1.-nDotV,5.);vec3 water=color*(1.-fresnel)*.35+r*fresnel;gl_FragColor=vec4(water,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

export const wetVerandaFragment203=`uniform sampler2D tDiffuse;uniform sampler2D roughMap;uniform sampler2D normalMap203;uniform vec3 color;varying vec4 rUv;varying vec2 pUv;varying vec3 wPos;
void main(){vec2 u=rUv.xy/rUv.w;float rough=texture2D(roughMap,pUv*.80).g;vec2 relief=texture2D(normalMap203,pUv*.80).xy*2.-1.;vec2 offset=relief*.0038;vec3 r=texture2D(tDiffuse,u+offset).rgb*.60;r+=texture2D(tDiffuse,u+offset+vec2(.00030,.00020)).rgb*.20;r+=texture2D(tDiffuse,u+offset-vec2(.00030,.00020)).rgb*.20;
float wet=clamp(.40+.68*(1.-rough),.28,.98);vec3 filmNormal=normalize(vec3(-relief.x*.16,1.,-relief.y*.16));float cosView=clamp(abs(dot(normalize(cameraPosition-wPos),filmNormal)),0.,1.);float fresnel=.02037+.97963*pow(1.-cosView,5.);gl_FragColor=vec4(r,clamp(fresnel*wet,.020,.90));
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
