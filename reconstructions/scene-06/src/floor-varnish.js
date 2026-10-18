import * as T from 'three';

// The same bounded world-space varnish slopes perturb the physical clearcoat
// and the room reflection. No illumination or image content is painted here.
const varnishGLSL=`
vec2 scene06VarnishSlope(vec2 p){
 float board=floor((p.x+6.84)/.72);
 float a=p.x*184.0+.55*sin(p.y*3.1)+board*1.73;
 float b=p.x*437.0+.32*sin(p.y*8.0)+board*.91;
 float c=p.y*73.0+1.1*sin(p.x*16.0)+board*2.2;
 float aa=1.0-smoothstep(.45,1.6,fwidth(a));
 float ab=1.0-smoothstep(.45,1.6,fwidth(b));
 float ac=1.0-smoothstep(.45,1.6,fwidth(c));
 return .18*vec2(.0075*cos(a)*aa+.0030*cos(b)*ab+.0016*sin(p.y*6.2+board),
                 .0040*cos(c)*ac+.0018*sin(p.y*18.0+board*.7));
}
float scene06VarnishWear(vec2 p){
 return .5+.5*sin(p.x*2.8+p.y*.91)*sin(p.y*3.7-p.x*1.14);
}`;

export function bindFloorVarnish(material){
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vScene06FloorWorld;').replace('#include <begin_vertex>','#include <begin_vertex>\nvScene06FloorWorld=(modelMatrix*vec4(position,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vScene06FloorWorld;\n'+varnishGLSL);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec3 floorUp=normalize(mat3(viewMatrix)*vec3(0.0,1.0,0.0));
   float floorTop=step(.94,dot(nonPerturbedNormal,floorUp));
   vec2 varnishSlope=scene06VarnishSlope(vScene06FloorWorld.xz);
   vec3 varnishNormal=normalize(mat3(viewMatrix)*normalize(vec3(-varnishSlope.x,1.0,-varnishSlope.y)));
   normal=normalize(mix(normal,varnishNormal,floorTop));`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <clearcoat_normal_fragment_maps>',`#include <clearcoat_normal_fragment_maps>
   #ifdef USE_CLEARCOAT
    clearcoatNormal=normalize(mix(clearcoatNormal,varnishNormal,floorTop));
   #endif`);
 };
 material.customProgramCacheKey=()=> 'scene06-physical-varnish-slopes-v1';
}

export function bindFloorReflection(floor,size){
 floor.updateMatrixWorld(true);
 const m=floor.material;
 m.transparent=true;m.depthWrite=false;
 m.uniforms.scene06FloorInverse={value:new T.Matrix4().copy(floor.matrixWorld).invert()};
 m.uniforms.scene06ReflectionSize={value:size};
 const texture=floor.getRenderTarget().texture;
 texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;
 m.vertexShader=m.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv;varying vec3 vScene06FloorWorld;').replace('vUv = textureMatrix','vScene06FloorWorld=(modelMatrix*vec4(position,1.0)).xyz;vUv = textureMatrix');
 m.fragmentShader=m.fragmentShader.replace('varying vec4 vUv;',`varying vec4 vUv;varying vec3 vScene06FloorWorld;
  uniform mat4 textureMatrix;uniform mat4 scene06FloorInverse;uniform float scene06ReflectionSize;
  ${varnishGLSL}`);
 m.fragmentShader=m.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`
  vec2 p=vScene06FloorWorld.xz,slope=scene06VarnishSlope(p);
  float wear=scene06VarnishWear(p),board=floor((p.x+6.84)/.72);
  vec3 viewRay=normalize(cameraPosition-vScene06FloorWorld);
  vec3 varnishNormal=normalize(vec3(-slope.x,1.0,-slope.y));
  vec3 reflectedRay=reflect(-viewRay,varnishNormal);
  vec4 projected=textureMatrix*scene06FloorInverse*vec4(vScene06FloorWorld+reflectedRay*9.0,1.0);
  vec2 reflectionUV=projected.xy/projected.w;
  float localLod=mix(.30,1.75,smoothstep(.15,.88,wear));
  vec2 footprint=mix(vec2(.35,1.6),vec2(1.0,3.8),wear)/scene06ReflectionSize;
  vec3 reflected=texture2DLodEXT(tDiffuse,reflectionUV,localLod).rgb*.24;
  for(int i=0;i<8;i++){
   float a=6.28318530718*(float(i)+.25)/8.0;
   vec2 d=vec2(cos(a),sin(a))*footprint;
   reflected+=texture2DLodEXT(tDiffuse,reflectionUV+d*.55,localLod).rgb*.065;
   reflected+=texture2DLodEXT(tDiffuse,reflectionUV+d,localLod).rgb*.03;
  }
  vec4 base=vec4(reflected,1.0);`);
 m.fragmentShader=m.fragmentShader.replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`
  float cosine=clamp(viewRay.y,0.0,1.0);
  float fresnel=.045+.955*pow(1.0-cosine,5.0);
  float q=fract((p.x+6.84)/.72),edge=min(q,1.0-q)*.72;
  float joint=mod(p.y+5.9-mod(board,3.0)*.58,1.74);
  float seam=smoothstep(.0002,.0010,edge)*smoothstep(.0002,.0010,min(joint,1.74-joint));
  gl_FragColor=vec4(base.rgb,clamp(fresnel*(.82+.18*(1.0-wear)),0.0,.88)*seam);`);
}
