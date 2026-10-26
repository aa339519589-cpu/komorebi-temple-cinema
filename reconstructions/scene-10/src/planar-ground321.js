import * as T from 'three';

// Current-camera, clipped3D planar radiance. Targets are sampled only by the
// actual closed water and stone PBR materials; no reflection overlay is drawn.
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i])<1e-8);
function snapshot(renderer){
 const gl=renderer.getContext();return{target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),viewport:renderer.getCurrentViewport(new T.Vector4()),logicalViewport:renderer.getViewport(new T.Vector4()),scissor:renderer.getScissor(new T.Vector4()),logicalScissorTest:renderer.getScissorTest(),gpuScissor:Array.from(gl.getParameter(gl.SCISSOR_BOX)),gpuScissorTest:gl.isEnabled(gl.SCISSOR_TEST),depthMask:gl.getParameter(gl.DEPTH_WRITEMASK),xr:renderer.xr.enabled,shadowAuto:renderer.shadowMap.autoUpdate,shadowNeeds:renderer.shadowMap.needsUpdate,autoClear:renderer.autoClear,toneMapping:renderer.toneMapping,clearColor:renderer.getClearColor(new T.Color()),clearAlpha:renderer.getClearAlpha()};
}
function restore(renderer,s){
 renderer.xr.enabled=s.xr;renderer.shadowMap.autoUpdate=s.shadowAuto;renderer.shadowMap.needsUpdate=s.shadowNeeds;renderer.autoClear=s.autoClear;renderer.toneMapping=s.toneMapping;renderer.setClearColor(s.clearColor,s.clearAlpha);
 renderer.setViewport(s.logicalViewport);renderer.setScissor(s.scissor);renderer.setScissorTest(s.logicalScissorTest);
 // setRenderTarget restores its own viewport, not necessarily the caller's
 // current one. Temporary target properties restore both public definitions.
 if(s.target){const viewport=s.target.viewport.clone(),scissor=s.target.scissor.clone(),test=s.target.scissorTest;s.target.viewport.copy(s.viewport);s.target.scissor.fromArray(s.gpuScissor);s.target.scissorTest=s.gpuScissorTest;try{renderer.setRenderTarget(s.target,s.face,s.mip);}finally{s.target.viewport.copy(viewport);s.target.scissor.copy(scissor);s.target.scissorTest=test;}}
 else renderer.setRenderTarget(null,s.face,s.mip);
 renderer.state.buffers.depth.setMask(s.depthMask);
}
function stateMatch(renderer,s){const gl=renderer.getContext();return{target:renderer.getRenderTarget()===s.target,face:renderer.getActiveCubeFace()===s.face,mip:renderer.getActiveMipmapLevel()===s.mip,viewport:same(renderer.getCurrentViewport(new T.Vector4()).toArray(),s.viewport.toArray()),gpuViewport:same(Array.from(gl.getParameter(gl.VIEWPORT)),s.viewport.toArray()),logicalViewport:same(renderer.getViewport(new T.Vector4()).toArray(),s.logicalViewport.toArray()),scissor:same(Array.from(gl.getParameter(gl.SCISSOR_BOX)),s.gpuScissor),scissorTest:gl.isEnabled(gl.SCISSOR_TEST)===s.gpuScissorTest,depthMask:gl.getParameter(gl.DEPTH_WRITEMASK)===s.depthMask};}
const allTrue=o=>Object.values(o).every(Boolean);

const samplingGLSL=`
uniform sampler2D groundPlanarAtlas321;
uniform mat4 groundPlanarHighMatrix321,groundPlanarLowMatrix321,groundPlanarDrainMatrix321;
uniform vec4 groundPlanarHighRect321,groundPlanarLowRect321,groundPlanarDrainRect321;
uniform float groundPlanarEnabled321,groundPlanarFocalScale321,groundPlanarHighSize321,groundPlanarLowSize321,groundPlanarDrainSize321;
varying vec3 vGroundPlanarWorld321;
vec3 groundSlopeNormal321(vec3 surfacePosition,vec3 surfaceNormal,vec2 slope,float faceDirection){
 vec3 dx=dFdx(surfacePosition),dy=dFdy(surfacePosition),r1=cross(dy,surfaceNormal),r2=cross(surfaceNormal,dx);
 float determinant=dot(dx,r1)*faceDirection;vec3 gradient=sign(determinant)*(slope.x*r1+slope.y*r2);
 return normalize(abs(determinant)*surfaceNormal-gradient);
}
vec3 sampleGroundPlanar321(mat4 transform,vec4 rect,float size,vec3 world,float roughness,out float valid){
 vec4 q=transform*vec4(world,1.0);vec2 uv=q.xy/max(q.w,.000001);
 valid=step(.000001,q.w)*step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
 float angularRadius=max(.8,size*groundPlanarFocalScale321*roughness*roughness);float lod=clamp(log2(angularRadius),0.,6.0);vec2 border=vec2(max(1.5,exp2(lod)*1.2)/size);uv=clamp(uv,border,1.-border);
 vec2 footprint=(.20+roughness*roughness*2.0)*vec2(1.0,1.35)/size,base=rect.xy+uv*rect.zw;footprint*=rect.zw;
 vec3 radiance=textureLod(groundPlanarAtlas321,base,lod).rgb*.40;
 radiance+=textureLod(groundPlanarAtlas321,base+vec2(footprint.x,0.),lod).rgb*.15;
 radiance+=textureLod(groundPlanarAtlas321,base-vec2(footprint.x,0.),lod).rgb*.15;
 radiance+=textureLod(groundPlanarAtlas321,base+vec2(0.,footprint.y),lod).rgb*.15;
 radiance+=textureLod(groundPlanarAtlas321,base-vec2(0.,footprint.y),lod).rgb*.15;return radiance;
}
vec3 groundPlanarRadiance321(vec3 world,float roughness,out float valid){
 if(world.y<0.)return sampleGroundPlanar321(groundPlanarDrainMatrix321,groundPlanarDrainRect321,groundPlanarDrainSize321,world,roughness,valid);
 if(world.y<.0445)return sampleGroundPlanar321(groundPlanarLowMatrix321,groundPlanarLowRect321,groundPlanarLowSize321,world,roughness,valid);
 return sampleGroundPlanar321(groundPlanarHighMatrix321,groundPlanarHighRect321,groundPlanarHighSize321,world,roughness,valid);
}
`;

export function createGroundPlanarReflection321({renderer,scene,legacyMirror,creek,waterMaterials,wetMaterials,poolLevels,collarLevel=.040,jointLevel=.0405,drainLevel=-.052,landmarks=[]}){
 const sorted=[...poolLevels].sort((a,b)=>a-b),highLevel=sorted[Math.floor(sorted.length/2)],fallback=new T.DataTexture(new Uint8Array([0,0,0,255]),1,1);fallback.needsUpdate=true;fallback.colorSpace=T.LinearSRGBColorSpace;
 const atlas=legacyMirror.getRenderTarget();atlas.samples=0;atlas.setSize(2048,1536);
 const atlasTexture={value:fallback},planes=[{name:'pool',level:highLevel,target:atlas,rect:new T.Vector4(0,0,1024,1024),owned:false},{name:'joint-and-collar',level:jointLevel,target:atlas,rect:new T.Vector4(1088,0,768,768),owned:false},{name:'drain',level:drainLevel,target:atlas,rect:new T.Vector4(1088,832,512,512),owned:false}];
 const enabled={value:0},lodBias={value:0},focalScale={value:1.3163586},bindings=[],virtual=new T.PerspectiveCamera(),bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),up=new T.Vector3(0,1,0);
 for(const p of planes){p.target.texture.generateMipmaps=true;p.target.texture.minFilter=T.LinearMipmapLinearFilter;p.target.texture.colorSpace=T.LinearSRGBColorSpace;p.texture=atlasTexture;p.matrix={value:new T.Matrix4()};p.size={value:p.rect.z};p.uvRect={value:new T.Vector4(p.rect.x/2048,p.rect.y/1536,p.rect.z/2048,p.rect.w/1536)};}
 const stats={kind:'Actual current-camera clipped3D planar capture sampled on existing PBR solids',version:'ground321-r08f-positioned-planar-bounded-proxy',atlas:{resolution:[2048,1536],gutterPixels:64,fragmentSamplers:1,projectionOverscan:.76},planes:planes.map(p=>({name:p.name,level:p.level,size:p.rect.z,tile:p.rect.toArray(),linearHDR:true})),actualPoolLevelRange:[sorted[0],sorted.at(-1)],maximumPoolPlaneError:Math.max(...sorted.map(v=>Math.abs(v-highLevel))),collarPlaneError:Math.abs(collarLevel-jointLevel),captureCalls:0,renderedPlanes:0,legacyOverlayVisible:false,stateRestores:0,stateRestoreFailures:0,offAxisCaptures:0,alignment:[],roundTripTest:null,materialNames:[],limits:['Three horizontal bases approximate the actual shallow levels: median pool, joint/collar and drain. Curved waves/stone highs retain real geometry and normals; exact wave-ray parallax is not traced.','Mipmapped planar radiance approximates rough microfacet filtering. No scalar brightness gain, photographic reflection image, emissive patch or screen overlay is added.','One reflection bounce; receiver water and peer reflectors are excluded from captures to avoid feedback. Public-state restoration cannot repair a lost GL context/private renderer failure: a failed native frame is discarded.']};
 legacyMirror.visible=false;legacyMirror.material.colorWrite=false;legacyMirror.material.depthWrite=false;
 const uniforms={groundPlanarAtlas321:atlasTexture,groundPlanarHighRect321:planes[0].uvRect,groundPlanarLowRect321:planes[1].uvRect,groundPlanarDrainRect321:planes[2].uvRect,groundPlanarHighMatrix321:planes[0].matrix,groundPlanarLowMatrix321:planes[1].matrix,groundPlanarDrainMatrix321:planes[2].matrix,groundPlanarHighSize321:planes[0].size,groundPlanarLowSize321:planes[1].size,groundPlanarDrainSize321:planes[2].size,groundPlanarEnabled321:enabled,groundPlanarFocalScale321:focalScale};
 function bind(material,role,{underActualWater=false}={}){
  if(role==='wet'){material.bumpMap=null;material.clearcoatNormalMap=null;}
  const before=material.onBeforeCompile,key=material.customProgramCacheKey?.bind(material);
  const patch=shader=>{before?.(shader);shader.fragmentShader=shader.fragmentShader.replaceAll('perturbNormalArb(', 'groundSlopeNormal321(');Object.assign(shader.uniforms,uniforms);
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGroundPlanarWorld321;').replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
    vec4 groundPoint321=vec4(transformed,1.0);
    #ifdef USE_INSTANCING
     groundPoint321=instanceMatrix*groundPoint321;
    #endif
    vGroundPlanarWorld321=(modelMatrix*groundPoint321).xyz;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+samplingGLSL);
   if(role==='wet')shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',`
    #ifdef USE_CLEARCOAT
     float mineralPool321=clamp(stoneWetSample.a,0.,1.);
     material.clearcoatRoughness=max(material.clearcoatRoughness,mix(.19,.095,mineralPool321)+geometryRoughness);
     material.clearcoat*=${underActualWater?'mix(.62,.12,mineralPool321)':'mix(.62,.92,mineralPool321)'};
    #endif
    #include <lights_fragment_begin>`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
    vec3 groundUp321=normalize(mat3(viewMatrix)*vec3(0.,1.,0.));
    float groundTop321=smoothstep(.50,.92,dot(nonPerturbedNormal,groundUp321));
    if(groundPlanarEnabled321>.5&&groundTop321>.001){
     float groundValid321;vec3 groundRadiance321=groundPlanarRadiance321(vGroundPlanarWorld321,material.roughness,groundValid321);
     vec3 groundBrdf321=EnvironmentBRDF(geometryNormal,geometryViewDir,material.specularColorBlended,material.specularF90,material.roughness);
     reflectedLight.indirectSpecular=mix(reflectedLight.indirectSpecular,groundRadiance321*groundBrdf321,groundTop321*groundValid321);
     // The captured visible emitter already carries this specular path.
     // Keep only a bounded unresolved-flux residual from its analytical
     // proxy; the scene emitter/proxy photometry is not calibrated.
     // Direct diffuse illumination and the captured-radiance BRDF stay held.
     float capturedSpecular321=groundTop321*groundValid321;
     reflectedLight.directSpecular*=1.0-capturedSpecular321*${role==='water'?'.92':'.82'};
     #ifdef USE_CLEARCOAT
      clearcoatSpecularDirect*=1.0-capturedSpecular321*.82;
     #endif
     ${role==='wet'?`#ifdef USE_CLEARCOAT
      float coatValid321;vec3 coatRadiance321=groundPlanarRadiance321(vGroundPlanarWorld321,material.clearcoatRoughness,coatValid321);
      vec3 coatBrdf321=EnvironmentBRDF(geometryClearcoatNormal,geometryViewDir,material.clearcoatF0,material.clearcoatF90,material.clearcoatRoughness);
      clearcoatSpecularIndirect=mix(clearcoatSpecularIndirect,coatRadiance321*coatBrdf321,groundTop321*coatValid321);
     #endif`:''}
    }else if(groundPlanarEnabled321<.5){
     // Secondary receiver specular is omitted in the one-bounce capture.
     reflectedLight.indirectSpecular*=.18;
     #ifdef USE_CLEARCOAT
      clearcoatSpecularIndirect=vec3(0.);
     #endif
    }`);
  };
  material.onBeforeCompile=patch;material.customProgramCacheKey=()=>`${key?.()||material.type}:scene10-atlased-solid-planar321-${role}-${underActualWater}`;material.userData.currentCameraGroundPlanar321=true;material.needsUpdate=true;bindings.push({material,before,key,patch});stats.materialNames.push({name:material.name,role,underActualWater});
 }
 for(const m of waterMaterials)bind(m,'water');for(const e of wetMaterials)bind(e.material,'wet',e);
 const waters=new Set(waterMaterials),receivers=[];scene.traverse(o=>{if(o.isMesh&&(Array.isArray(o.material)?o.material:[o.material]).some(m=>waters.has(m)))receivers.push(o);});
 function projection(camera,p){
  lodBias.value=Math.log2(Math.max(.000001,camera.projectionMatrix.elements[0])/1.7320508075688772);stats.materialFilterLodBias=lodBias.value;focalScale.value=Math.abs(camera.projectionMatrix.elements[0])*.76;stats.angularFilterFocalScale=focalScale.value;stats.roughnessFilter='GGX alpha=roughness squared, projected angular radius to mip, cappedLOD6';stats.proxySpecularDeduplicated=true;stats.analyticalProxyResidual={water:.08,wetMineral:.18,scope:'Bounded unresolved source-flux proxy; source light intensities/diffuse lighting remain unchanged. Main positioned radiance is captured3D.'};
  camera.updateMatrixWorld(true);const C=camera.getWorldPosition(new T.Vector3()),forward=camera.getWorldDirection(new T.Vector3()),cameraUp=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,1);virtual.copy(camera,false);virtual.viewport=undefined;virtual.position.set(C.x,2*p.level-C.y,C.z);virtual.up.set(cameraUp.x,-cameraUp.y,cameraUp.z);virtual.lookAt(virtual.position.clone().add(new T.Vector3(forward.x,-forward.y,forward.z)));virtual.updateMatrixWorld(true);virtual.projectionMatrix.copy(camera.projectionMatrix);virtual.projectionMatrix.elements[8]*=-1;for(const i of[0,4,8,12,1,5,9,13])virtual.projectionMatrix.elements[i]*=.76;
  const plane=new T.Plane(up,-p.level).applyMatrix4(virtual.matrixWorldInverse),clip=new T.Vector4(plane.normal.x,plane.normal.y,plane.normal.z,plane.constant),M=virtual.projectionMatrix.elements,q=new T.Vector4((Math.sign(clip.x)+M[8])/M[0],(Math.sign(clip.y)+M[9])/M[5],-1,(1+M[10])/M[14]);clip.multiplyScalar(2/clip.dot(q));M[2]=clip.x;M[6]=clip.y;M[10]=clip.z+1-.0005;M[14]=clip.w;virtual.projectionMatrixInverse.copy(virtual.projectionMatrix).invert();p.matrix.value.copy(bias).multiply(virtual.projectionMatrix).multiply(virtual.matrixWorldInverse);
  const alignment=[];for(const landmark of landmarks){const S=new T.Vector3(...landmark.point),t=(p.level-virtual.position.y)/(S.y-virtual.position.y),R=virtual.position.clone().lerp(S,t),a=new T.Vector4(...S.toArray(),1).applyMatrix4(p.matrix.value),b=new T.Vector4(...R.toArray(),1).applyMatrix4(p.matrix.value),pixel=R.clone().project(camera);alignment.push({name:landmark.name,point:S.toArray(),specularContact:R.toArray(),mainPixel:[(pixel.x+1)/2,(1-pixel.y)/2],captureProjectionError:Math.hypot(a.x/a.w-b.x/b.w,a.y/a.w-b.y/b.w)});}
  return alignment;
 }
 let active=false,disposed=false,tested=false;
 function capture(camera,{fault=null}={}){
  if(active||disposed)throw Error('Invalid/recursive ground planar capture');const saved=snapshot(renderer),hidden=[legacyMirror,creek,...receivers].map(object=>({object,visible:object.visible})),oldEnabled=enabled.value,oldTextures=planes.map(p=>p.texture.value),oldAlignment=stats.alignment;let completed=false;active=true;enabled.value=0;for(const p of planes)p.texture.value=fallback;for(const h of hidden)h.object.visible=false;stats.captureCalls++;
  try{
   renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;renderer.autoClear=true;renderer.toneMapping=T.NoToneMapping;
   stats.alignment=[];for(const p of planes){const alignment=projection(camera,p);stats.alignment.push({plane:p.name,level:p.level,landmarks:alignment});p.target.viewport.copy(p.rect);p.target.scissor.copy(p.rect);p.target.scissorTest=true;renderer.setRenderTarget(p.target,0,0);renderer.state.buffers.depth.setMask(true);if(fault)throw fault;renderer.clear();renderer.render(scene,virtual);const tileOk=renderer.getRenderTarget()===p.target&&renderer.getActiveCubeFace()===0&&renderer.getActiveMipmapLevel()===0&&same(renderer.getCurrentViewport(new T.Vector4()).toArray(),p.rect.toArray())&&same(Array.from(renderer.getContext().getParameter(renderer.getContext().VIEWPORT)),p.rect.toArray());if(!tileOk)throw Error('Planar atlas tile state changed during3D draw '+p.name);stats.renderedPlanes++;}
   if(Math.abs(camera.projectionMatrix.elements[8])>1e-10)stats.offAxisCaptures++;enabled.value=1;completed=true;
  }finally{
   for(const h of hidden)h.object.visible=h.visible;for(let i=0;i<planes.length;i++)planes[i].texture.value=completed?planes[i].target.texture:oldTextures[i];if(!completed){enabled.value=oldEnabled;stats.alignment=oldAlignment;}restore(renderer,saved);const checks=stateMatch(renderer,saved);stats.stateRestores++;if(!allTrue(checks)){stats.stateRestoreFailures++;active=false;throw Error('Ground planar renderer-state restore failed '+JSON.stringify(checks));}active=false;
  }
 }
 // Also guard the existing creek Reflector. No new camera/frame is sampled
 // from its view; its old projection code remains scoped to that capture.
 const creekBefore=creek.onBeforeRender;
 creek.onBeforeRender=function(...args){const saved=snapshot(renderer),old=enabled.value,hidden=receivers.map(object=>({object,visible:object.visible})),textures=planes.map(p=>p.texture.value);enabled.value=0;for(const p of planes)p.texture.value=fallback;for(const h of hidden)h.object.visible=false;try{return creekBefore.apply(this,args);}finally{for(const h of hidden)h.object.visible=h.visible;enabled.value=old;for(let i=0;i<planes.length;i++)planes[i].texture.value=textures[i];restore(renderer,saved);const checks=stateMatch(renderer,saved);stats.stateRestores++;if(!allTrue(checks)){stats.stateRestoreFailures++;throw Error('Creek renderer-state restore failed '+JSON.stringify(checks));}}};
 function captureWithRoundTrip(camera){
  if(tested){capture(camera);return;}tested=true;const caller=snapshot(renderer),probe=new T.WebGLCubeRenderTarget(16,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter,depthBuffer:false}),sentinel=new Error('Controlled pre-draw reflection fault');
  try{renderer.initRenderTarget(probe);probe.viewport.set(1,1,5,6);probe.scissor.set(2,1,3,4);probe.scissorTest=true;renderer.setRenderTarget(probe,3,1);renderer.state.buffers.depth.setMask(false);const expected=snapshot(renderer);capture(camera);const success=stateMatch(renderer,expected);let caught=false;try{capture(camera,{fault:sentinel});}catch(e){if(e!==sentinel)throw e;caught=true;}const failure=stateMatch(renderer,expected);stats.roundTripTest={actualGpu:true,target:'16px cube target',face:3,mip:1,viewport:[1,1,5,6],scissor:[2,1,3,4],depthWriteBefore:false,success,failure,intentionalFaultCaught:caught,passed:caught&&allTrue(success)&&allTrue(failure)};if(!stats.roundTripTest.passed)throw Error('Ground planar roundtrip probe failed');}
  finally{restore(renderer,caller);probe.dispose();}
 }
 function samplerAudit(){const gl=renderer.getContext(),types=new Set([gl.SAMPLER_2D,gl.SAMPLER_CUBE,gl.SAMPLER_3D,gl.SAMPLER_2D_SHADOW,gl.SAMPLER_2D_ARRAY,gl.SAMPLER_2D_ARRAY_SHADOW,gl.INT_SAMPLER_2D,gl.UNSIGNED_INT_SAMPLER_2D]),programs=renderer.info.programs.map(p=>{let n=0;for(let i=0;i<gl.getProgramParameter(p.program,gl.ACTIVE_UNIFORMS);i++){const u=gl.getActiveUniform(p.program,i);if(types.has(u.type))n+=u.size;}return{name:p.name,samplers:n};});return{limit:gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),maximum:Math.max(...programs.map(p=>p.samplers)),programs};}
 return{capture:captureWithRoundTrip,info(){return{...stats,legacyOverlayVisible:legacyMirror.visible,worldMetricSlope:true,waterIOR:1.333,waterF0:((1.333-1)/(1.333+1))**2,receivingWaterMeshes:receivers.length,samplerBudget:samplerAudit()};},dispose(){disposed=true;creek.onBeforeRender=creekBefore;for(const b of bindings){if(b.material.onBeforeCompile===b.patch)b.material.onBeforeCompile=b.before;}for(const p of planes)if(p.owned)p.target.dispose();fallback.dispose();}};
}
