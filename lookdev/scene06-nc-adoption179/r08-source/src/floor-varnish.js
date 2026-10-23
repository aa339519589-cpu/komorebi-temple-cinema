import * as T from 'three';
// Actual room radiance is sampled on opaque wood solids, never a visible overlay.
const varnishGLSL=`
vec2 scene06VarnishSlope(vec2 p,float board){
 float a=p.x*184.0+.55*sin(p.y*3.1)+board*1.73;
 float b=p.x*437.0+.32*sin(p.y*8.0)+board*.91;
 float c=p.y*73.0+1.1*sin(p.x*16.0)+board*2.2;
 float aa=1.0-smoothstep(.45,1.6,fwidth(a)),ab=1.0-smoothstep(.45,1.6,fwidth(b)),ac=1.0-smoothstep(.45,1.6,fwidth(c));
 return .18*vec2(.0075*cos(a)*aa+.0030*cos(b)*ab+.0016*sin(p.y*6.2+board),.0040*cos(c)*ac+.0018*sin(p.y*18.0+board*.7));
}
float scene06VarnishWear(vec2 p){return .5+.5*sin(p.x*2.8+p.y*.91)*sin(p.y*3.7-p.x*1.14);}
`;
export function createFloorReflectionState(){
 const fallback=new T.DataTexture(new Uint8Array([0,0,0,255]),1,1);fallback.needsUpdate=true;
 return{fallback,texture:{value:fallback},enabled:{value:0},matrix:{value:new T.Matrix4()},inverse:{value:new T.Matrix4()},size:{value:768},captures:0,offAxisCaptures:0};
}
export function bindFloorVarnish(material,state,phase=0){
 // Top normals already use metric varnish slopes. Avoid a redundant bump sampler.
 material.bumpMap=null;
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{scene06FloorCapture:state.texture,scene06FloorCaptureEnabled:state.enabled,scene06FloorCaptureMatrix:state.matrix,scene06FloorCaptureInverse:state.inverse,scene06FloorCaptureSize:state.size,scene06FloorPanelPhase:{value:phase}});
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vScene06FloorWorld;').replace('#include <begin_vertex>','#include <begin_vertex>\nvScene06FloorWorld=(modelMatrix*vec4(position,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
 varying vec3 vScene06FloorWorld;
 uniform sampler2D scene06FloorCapture;
 uniform float scene06FloorCaptureEnabled,scene06FloorCaptureSize,scene06FloorPanelPhase;
 uniform mat4 scene06FloorCaptureMatrix,scene06FloorCaptureInverse;
 ${varnishGLSL}`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 vec3 floorUp=normalize(mat3(viewMatrix)*vec3(0.0,1.0,0.0));
 float floorTop=step(.94,dot(nonPerturbedNormal,floorUp));
 vec2 varnishSlope=scene06VarnishSlope(vScene06FloorWorld.xz,scene06FloorPanelPhase);
 vec3 varnishNormal=normalize(mat3(viewMatrix)*normalize(vec3(-varnishSlope.x,1.0,-varnishSlope.y)));
 normal=normalize(mix(normal,varnishNormal,floorTop));`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <clearcoat_normal_fragment_maps>',`#include <clearcoat_normal_fragment_maps>
 #ifdef USE_CLEARCOAT
 clearcoatNormal=normalize(mix(clearcoatNormal,varnishNormal,floorTop));
 #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
 #ifdef USE_CLEARCOAT
 if(scene06FloorCaptureEnabled>.5&&floorTop>.5){
  vec3 toEye=normalize(cameraPosition-vScene06FloorWorld);
  vec3 coatWorld=inverseTransformDirection(geometryClearcoatNormal,viewMatrix);
  vec3 ray=reflect(-toEye,coatWorld);
  vec4 projected=scene06FloorCaptureMatrix*scene06FloorCaptureInverse*vec4(vScene06FloorWorld+ray*9.0,1.0);
  vec2 uv=projected.xy/projected.w;
  float wear=scene06VarnishWear(vScene06FloorWorld.xz),lod=mix(.04,.92,smoothstep(.15,.88,wear));
  vec2 footprint=mix(vec2(.12,.42),vec2(.32,1.10),wear)/scene06FloorCaptureSize;
  vec3 radiance=textureLod(scene06FloorCapture,uv,lod).rgb*.38;
  for(int i=0;i<8;i++){
   float a=6.28318530718*(float(i)+.25)/8.0;vec2 d=vec2(cos(a),sin(a))*footprint;
   radiance+=textureLod(scene06FloorCapture,uv+d*.55,lod).rgb*.055;
   radiance+=textureLod(scene06FloorCapture,uv+d,lod).rgb*.022;
  }
  vec3 brdf=EnvironmentBRDF(geometryClearcoatNormal,geometryViewDir,material.clearcoatF0,material.clearcoatF90,material.clearcoatRoughness);
  clearcoatSpecularIndirect=mix(clearcoatSpecularIndirect,radiance*brdf,.96);
 }
 #endif`);
 };
 material.customProgramCacheKey=()=> 'scene06-opaque-board-room-clearcoat-100b';material.userData.actualFloorSolidReflection=true;
}
export function bindFloorReflection(floor,size,state){
 floor.updateMatrixWorld(true);state.size.value=size;state.inverse.value.copy(floor.matrixWorld).invert();state.matrix.value=floor.material.uniforms.textureMatrix.value;
 const texture=floor.getRenderTarget().texture;texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;
 floor.name='reference6-room-reflection-capture-only';floor.renderOrder=-1000;floor.frustumCulled=false;
 floor.material.transparent=false;floor.material.colorWrite=false;floor.material.depthWrite=false;floor.material.floorCaptureFallback=state.fallback; // owned by existing material-texture disposal
 const capture=floor.onBeforeRender;
 floor.onBeforeRender=function(renderer,scene,camera,geometry,material,group){
  const p=camera.projectionMatrix.elements,offset=p[8];
  // Local scene03-derived off-axis reflection fix; centered movie P[8] is zero.
  p[8]=-offset;state.enabled.value=0;state.texture.value=state.fallback;
  try{capture.call(this,renderer,scene,camera,geometry,material,group);state.captures++;if(offset!==0)state.offAxisCaptures++;}
  finally{p[8]=offset;state.texture.value=texture;state.enabled.value=1;}
 };
 floor.userData.actualFloorCapture=state;
}
