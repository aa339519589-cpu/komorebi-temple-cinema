import * as T from 'three';

// Inferred native transport boundary, never a measured sky or complete GI.
// Window sheets retain their actual geometry/lattice. Their emitted radiance
// approximates transmitted exterior illumination; full-room cube iterations
// return that light through the existing surfaces with real captured occlusion.
export function buildLightReturn315({scene,renderer,sun,floor,roomCubeSize,upperMaterials,reference,apertures}){
 const info={revision:'lightreturn315-r14-window-return-consolidated',inferredNotMeasured:true,fullGI:false,photographicAccepted:false,newAreaSpotHemisphereLights:0,sky:'Authored linear zenith/horizon/courtyard radiance; no solar disc, source DirectionalLight is the sole direct Sun',paperDiffuseTransmission:.42,capturePositions:[[.4,1.45,2.4],[0,4.40,.5],[0,5.7,4.7]],rounds:[],paper:[],directSun:{intensity:sun.intensity,color:sun.color.toArray()},materialBindings:[]};
 const obsolete=[];scene.traverse(o=>{if(o.isSpotLight&&o.intensity===0&&o.name==='reference6-shadowed-front-window-field')obsolete.push(o);});
 for(const old of obsolete){old.removeFromParent();old.target.removeFromParent();}
 const aperture=apertures.find(a=>a.side===-1&&Math.abs(a.z-5.1)<1e-5);if(!aperture)throw Error('Actual left-front high window required for315 key');
 info.detachedInactiveFrontSamples=obsolete.map(l=>({name:l.name,intensity:l.intensity,originalIntensity:l.userData.daylight284OriginalIntensity}));
 info.windowQuadrature315={source:'Inferred diffuse courtyard return through actual left window bay4 clear opening; native finite-area quadrature, not SI measurement',aperture:{...aperture},allReceiversUseOriginalGeometryShadows:true,noObjectLightMasks:true,noAddedVolumetricBeamCones:true,colorLinear:[1,.90,.70],sampleIntensity:95,samples:[]};
 for(const fy of[.72,.92])for(const fz of[-.24,-.06]){
  const l=new T.SpotLight(new T.Color().setRGB(1,.90,.70),95,0,Math.PI/3,.90,2);l.name='native315-left-window-courtyard-sample-'+info.windowQuadrature315.samples.length;
  l.position.set(aperture.x-.14,aperture.bottom+fy*(aperture.top-aperture.bottom),aperture.z+fz*aperture.width);l.target.position.set(0,4.2,-2.3);
  l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.camera.near=.01;l.shadow.camera.far=30;l.shadow.bias=-.0000005;l.shadow.normalBias=.003;l.shadow.radius=3;l.shadow.camera.updateProjectionMatrix();
  l.userData.nativeWindowBoundary315=true;scene.add(l,l.target);info.windowQuadrature315.samples.push({name:l.name,position:l.position.toArray(),target:l.target.position.toArray(),intensity:l.intensity,decay:l.decay,angle:l.angle,penumbra:l.penumbra,shadow:{near:.01,far:30,map:1024,bias:-.0000005,normalBias:.003,radius:3}});
 }
 // The lower opening receives an inferred upward exterior-ground return.
 // Two broad samples remain OUTSIDE the real clear slot; original geometry
 // shadows every receiver. Native intensity is a film-lighting hypothesis,
 // not a measured courtyard reflectance or a receiver-specific fill.
 info.windowQuadrature315.primarySampleCount=4;
 info.windowQuadrature315.lowerCourtyardReturn={source:'Inferred upward diffuse return from unseen sunlit courtyard through the actual lower clear slot',colorLinear:[1,.65,.30],sampleIntensity:120,notMeasured:true};
 for(const[fy,fz]of[[.25,-.20],[.50,-.10]]){
  const l=new T.SpotLight(new T.Color().setRGB(1,.65,.30),120,0,Math.PI/2.4,.65,2);l.name='native315-left-window-upward-courtyard-return-'+(info.windowQuadrature315.samples.length-4);
  l.position.set(aperture.x-.14,aperture.bottom+fy*(aperture.top-aperture.bottom),aperture.z+fz*aperture.width);l.target.position.set(0,6.9,2.5);
  l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.camera.near=.01;l.shadow.camera.far=30;l.shadow.bias=-.0000005;l.shadow.normalBias=.003;l.shadow.radius=3;l.shadow.camera.updateProjectionMatrix();
  l.userData.nativeWindowBoundary315=true;scene.add(l,l.target);info.windowQuadrature315.samples.push({name:l.name,kind:'upward-courtyard-return',position:l.position.toArray(),target:l.target.position.toArray(),colorLinear:l.color.toArray(),intensity:l.intensity,decay:l.decay,angle:l.angle,penumbra:l.penumbra,shadow:{near:.01,far:30,map:1024,bias:-.0000005,normalBias:.003,radius:3}});
 }
 info.newAreaSpotHemisphereLights=6;info.newUnshadowedFillLights=0;
 const sourceDirection=sun.position.clone().sub(sun.target.position).normalize(),sunHorizontal=sourceDirection.clone().setY(0).normalize();
 const skyColor=d=>{
  const y=d.y,t=y<0?Math.min(1,-y*5):Math.pow(Math.min(1,y),.40),c=y<0?new T.Color().setRGB(T.MathUtils.lerp(1.8,.38,t),T.MathUtils.lerp(1.7,.26,t),T.MathUtils.lerp(1.45,.13,t)):new T.Color().setRGB(T.MathUtils.lerp(1.8,1.6,t),T.MathUtils.lerp(1.7,2.0,t),T.MathUtils.lerp(1.45,2.8,t));
  const length=Math.hypot(d.x,d.z),alignment=length?Math.max(0,(d.x*sunHorizontal.x+d.z*sunHorizontal.z)/length):0;
  const wideDiffuseLeftField=Math.pow(alignment,4)*Math.exp(-Math.pow((y-sourceDirection.y)/.55,2))*T.MathUtils.smoothstep(y,-.03,.08);
  return c.add(new T.Color().setRGB(12,9.5,5.1).multiplyScalar(wideDiffuseLeftField));
 };
 info.sky='Inferred world-fixed directional daylight: neutral base sky/dim courtyard plus a broad left-side diffuse aureole, NO solar disc; actual source Sun owns direct shadows.';
 info.inferredExteriorAngularField={horizonRGB:[1.8,1.7,1.45],zenithRGB:[1.6,2,2.8],groundRGB:[.38,.26,.13],leftDiffuseMaximumAddedRGB:[12,9.5,5.1],diffuseCenterY:sourceDirection.y,azimuthPower:4,verticalWidth:.55,worldFixed:true,notAViewOrObjectMask:true};
 info.goldResponse315={sourceBodyLinear:[.5647115111351013,.3613067865371704,.08865558356046677],historicalHandAuthoredSRGB:'#c6a254',notMeasuredReflectance:true,reference:'https://google.github.io/filament/Filament.md.html',referenceGoldSRGB:'#ffd891',referenceGoldLinearSRGB:[1,.6866853124353135,.2831487404299921],referenceIsGenericConductorF0NotThisStatueMeasurement:true,candidateAgedBodyLinear:[.88,.60,.25],candidateMetalness:.94,candidateRoughness:.42,originalRelative3DVertexFootprintHeld:true,effectiveScalpLinear:[.88*.18/.5647115111351013,.60*.103/.3613067865371704,.25*.031/.08865558356046677],blackLacquerAlbedoAndTexturesHeld:true,inferredNotMeasured:true};
 const w=128,h=64,pixels=new Float32Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const latitude=((y+.5)/h-.5)*Math.PI,longitude=((x+.5)/w-.5)*Math.PI*2,d=new T.Vector3(Math.cos(latitude)*Math.cos(longitude),Math.sin(latitude),Math.cos(latitude)*Math.sin(longitude)),c=skyColor(d),at=(y*w+x)*4;pixels.set([c.r,c.g,c.b,1],at);}
 const sky=new T.DataTexture(pixels,w,h,T.RGBAFormat,T.FloatType);sky.name='lightreturn315-authored-exterior-radiance-not-a-scene-frame';sky.colorSpace=T.LinearSRGBColorSpace;sky.mapping=T.EquirectangularReflectionMapping;sky.minFilter=sky.magFilter=T.LinearFilter;sky.generateMipmaps=false;sky.needsUpdate=true;
 const pmrem=new T.PMREMGenerator(renderer),skyFiltered=pmrem.fromEquirectangular(sky),old={background:scene.background,environment:scene.environment,floor:floor.visible,shadowAuto:renderer.shadowMap.autoUpdate,shadowNeeds:renderer.shadowMap.needsUpdate,toneMapping:renderer.toneMapping,exposure:renderer.toneMappingExposure};
 const all=new Set(),outside=new Set(),objects=[],sheets=[];scene.updateMatrixWorld(true);
 scene.traverseVisible(o=>{if(!o.isMesh)return;const ms=Array.isArray(o.material)?o.material:[o.material];let exterior=false;for(let n=o;n;n=n.parent)if(n.name==='scene06-exterior-maple-solar-occluder195')exterior=true;for(const m of ms)if(m.isMeshStandardMaterial){all.add(m);if(exterior)outside.add(m);}if(o.castShadow&&!o.isReflector&&!ms.some(m=>m.isShaderMaterial))objects.push(o);if(o.userData.paper234)sheets.push(o);});
 const direction=sun.position.clone().sub(sun.target.position).normalize(),ray=new T.Raycaster(),out=new T.Vector3(),point=new T.Vector3();
 function transmission(origin,d,ignore){ray.set(origin,d);ray.near=.0001;ray.far=45;const seen=new Set();let value=1;for(const hit of ray.intersectObjects(objects,false)){const o=hit.object;if(o===ignore||seen.has(o))continue;seen.add(o);if(o.userData.paper234){value*=info.paperDiffuseTransmission;continue;}const m=(Array.isArray(o.material)?o.material:[o.material])[hit.face?.materialIndex??0];if(m.transparent||m.transmission>0)continue;return 0;}return value;}
 for(const sheet of sheets){const original=sheet.material,side=sheet.userData.paper234.side,bb=new T.Box3().setFromObject(sheet),center=bb.getCenter(new T.Vector3());out.set(side,0,0);let sunVisibility=0;for(const fy of[.23,.77])for(const fz of[.23,.77]){point.set(side<0?bb.min.x-.003:bb.max.x+.003,T.MathUtils.lerp(bb.min.y,bb.max.y,fy),T.MathUtils.lerp(bb.min.z,bb.max.z,fz));sunVisibility+=direction.dot(out)>0?transmission(point,direction,sheet)/4:0;}
  const skyMean=new T.Color(0,0,0);point.copy(center);point.x=side<0?bb.min.x-.003:bb.max.x+.003;for(let i=0;i<8;i++){const r=Math.sqrt((i+.5)/8),angle=i*2.3999632297,d=new T.Vector3(side*Math.sqrt(1-r*r),r*Math.cos(angle),r*Math.sin(angle));skyMean.add(skyColor(d).multiplyScalar(transmission(point,d,sheet)/8));}
  const radiance=skyMean.multiplyScalar(info.paperDiffuseTransmission).add(sun.color.clone().multiplyScalar(sun.intensity*Math.max(0,direction.dot(out))*sunVisibility*info.paperDiffuseTransmission/Math.PI));
  const m=original.clone();m.name=original.name+'-return315-b'+sheet.userData.paper234.bay+'-p'+sheet.userData.paper234.panel;m.emissive.copy(radiance);m.emissiveIntensity=1;m.needsUpdate=true;sheet.material=m;all.add(m);
  info.paper.push({side,bay:sheet.userData.paper234.bay,panel:sheet.userData.paper234.panel,center:center.toArray(),sunVisibilityIncludingActualOpaqueAndOtherPaper: sunVisibility,sourceGeometryHeld:true,sourceAlbedoAndFiberMapsHeld:true,originalEmissionRGB:original.emissive.toArray(),originalEmissionIntensity:original.emissiveIntensity,candidateRadianceRGB:radiance.toArray()});
 }
 const central=objects.find(o=>(Array.isArray(o.material)?o.material:[o.material]).some(m=>m.name.endsWith(':central-ordinary-PBR')));
 if(!central)throw Error('Actual central surface is required for the local reflection probe');
 const from=new T.Vector3(...reference.position),landmark=new T.Vector3(.077323146,5.399013914,-2.285690482),faceRay=new T.Raycaster(from,landmark.clone().sub(from).normalize()),faceHit=faceRay.intersectObject(central,false)[0];
 if(!faceHit)throw Error('Actual central face surface was not hit');
 const normal=faceHit.face.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(central.matrixWorld));
 info.capturePositions[1]=faceHit.point.clone().addScaledVector(normal,.38).toArray();
 info.localFaceProbe={actualSurfacePoint:faceHit.point.toArray(),actualSurfaceNormal:normal.toArray(),offsetMetres:.38,position:info.capturePositions[1],source:'Actual current geometry hit, no actor displacement or light attachment'};
 // Narrow geometric witnesses only: they do not certify every room light path.
 const referenceCamera=new T.PerspectiveCamera(reference.fov,1,.06,60);referenceCamera.position.fromArray(reference.position);referenceCamera.lookAt(new T.Vector3(...reference.target));referenceCamera.updateMatrixWorld(true);
 const witnessRows=[{name:'actual-central-face',hit:faceHit}];
 for(const[name,x,y]of[['left-attendant-lower-leg',420,510],['upper-left-beam',360,215]]){const q=new T.Raycaster();q.setFromCamera(new T.Vector2(x/1254*2-1,1-y/1254*2),referenceCamera);const hit=q.intersectObjects(objects,false)[0];if(hit)witnessRows.push({name,hit});}
 info.actualOpeningWitnessRays315=witnessRows.map(({name,hit})=>{
  const world=hit.object.matrixWorld.clone();if(hit.instanceId!==undefined){const instance=new T.Matrix4();hit.object.getMatrixAt(hit.instanceId,instance);world.multiply(instance);}const n=hit.face.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(world)),origin=hit.point.clone().addScaledVector(n,.004);
  return{name,mesh:hit.object.name,material:(Array.isArray(hit.object.material)?hit.object.material[hit.face.materialIndex??0]:hit.object.material).name,instanceId:hit.instanceId??null,triangle:hit.faceIndex,point:hit.point.toArray(),normal:n.toArray(),scope:'Local exact-geometry witness, not complete transport validation',sources:info.windowQuadrature315.samples.map(source=>{const direction=new T.Vector3(...source.position).sub(origin),distance=direction.length();direction.normalize();const q=new T.Raycaster(origin,direction,.0001,distance-.001),first=q.intersectObjects(objects,false)[0];return{name:source.name,normalDotToSource:n.dot(direction),unoccludedToSource:!first,firstOpaqueShadowCaster:first?{name:first.object.name,distance:first.distance,paper:Boolean(first.object.userData.paper234),point:first.point.toArray()}:null};})};
 });

 const originalBindings=new Map([...all].map(m=>[m,{envMap:m.envMap,intensity:m.envMapIntensity}]));let current=null;floor.visible=true;
 const originalFloorHook=floor.onBeforeRender,forward=new T.Vector3();
 info.planarReturn315={actualUnchangedThreeRoom:true,referenceImageUsed:false,sourceFloorMaterialAndMirrorProjectionHeld:true,activeCubeFaceMipViewportScissorDepthRestored:true,linearHDR:true,mirrorUpdates:0};
 floor.onBeforeRender=function(render,world,camera,...rest){
  if(camera.getWorldDirection(forward).y>.7)return;
  const gl=render.getContext(),saved={target:render.getRenderTarget(),face:render.getActiveCubeFace(),mip:render.getActiveMipmapLevel(),baseViewport:render.getViewport(new T.Vector4()),baseScissor:render.getScissor(new T.Vector4()),baseScissorTest:render.getScissorTest(),viewport:new T.Vector4().fromArray(gl.getParameter(gl.VIEWPORT)),scissor:new T.Vector4().fromArray(gl.getParameter(gl.SCISSOR_BOX)),scissorTest:gl.isEnabled(gl.SCISSOR_TEST),depthTest:gl.isEnabled(gl.DEPTH_TEST),depthMask:gl.getParameter(gl.DEPTH_WRITEMASK),depthFunc:gl.getParameter(gl.DEPTH_FUNC),depthRange:gl.getParameter(gl.DEPTH_RANGE),depthClear:gl.getParameter(gl.DEPTH_CLEAR_VALUE)};
  try{originalFloorHook.call(this,render,world,camera,...rest);info.planarReturn315.mirrorUpdates++;}
  finally{
   render.setViewport(saved.baseViewport);render.setScissor(saved.baseScissor);render.setScissorTest(saved.baseScissorTest);
   render.setRenderTarget(saved.target,saved.face,saved.mip);render.state.viewport(saved.viewport);render.state.scissor(saved.scissor);render.state.setScissorTest(saved.scissorTest);
   const depth=render.state.buffers.depth,functions=new Map([[gl.NEVER,T.NeverDepth],[gl.ALWAYS,T.AlwaysDepth],[gl.LESS,T.LessDepth],[gl.LEQUAL,T.LessEqualDepth],[gl.EQUAL,T.EqualDepth],[gl.GEQUAL,T.GreaterEqualDepth],[gl.GREATER,T.GreaterDepth],[gl.NOTEQUAL,T.NotEqualDepth]]);
   depth.setTest(saved.depthTest);depth.setMask(saved.depthMask);depth.setFunc(functions.get(saved.depthFunc));depth.setClear(saved.depthClear);gl.depthRange(saved.depthRange[0],saved.depthRange[1]);
   if(render.getRenderTarget()!==saved.target||render.getActiveCubeFace()!==saved.face||render.getActiveMipmapLevel()!==saved.mip||!render.getCurrentViewport(new T.Vector4()).equals(saved.viewport)||gl.getParameter(gl.DEPTH_WRITEMASK)!==saved.depthMask)throw Error('Planar return render state was not restored');
  }
 };
 const capture=position=>{const rt=new T.WebGLCubeRenderTarget(roomCubeSize,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});try{const camera=new T.CubeCamera(.08,60,rt);camera.position.fromArray(position);camera.update(renderer,scene);return pmrem.fromCubemap(rt.texture);}finally{rt.dispose();}};
 const probeFor=m=>outside.has(m)?'exterior':upperMaterials.has(m)?'upper':(['beam','beamUnderside','ceilingWood'].includes(m.userData.timber228?.role)||/coffer|ceiling/.test(m.name))?'nave':'lower';
 const bind=pair=>{for(const m of all){const probe=probeFor(m),texture=probe==='exterior'?skyFiltered.texture:pair[probe].texture;m.envMap=texture;m.envMapIntensity=1;m.needsUpdate=true;}scene.environment=pair.lower.texture;scene.environmentIntensity=1;};
 try{
  scene.background=sky;scene.environment=null;renderer.toneMapping=T.NoToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  for(const m of all){m.envMap=outside.has(m)?skyFiltered.texture:null;m.envMapIntensity=1;m.needsUpdate=true;}
  for(let round=1;round<=3;round++){
   // All three new probes read the SAME previous round. Commit atomically only
   // after all captures; never feed a new probe into a capture in its own round.
   const next={lower:capture(info.capturePositions[0]),upper:capture(info.capturePositions[1]),nave:capture(info.capturePositions[2])};bind(next);if(current){current.lower.dispose();current.upper.dispose();current.nave.dispose();}current=next;
   info.rounds.push({round,fullUnchangedRoomGeometry:true,readPreviousRound:round-1,synchronousTriple:true,floorCaptureUtilityHidden:false,actualPlanarSceneReturn:true,mainViewScreenAOInstalledAfterTheseCaptures:true});
  }
  for(const m of all)info.materialBindings.push({name:m.name,probe:probeFor(m),ownEnvMapActuallyBound:Boolean(m.envMap),actualEnvMapIntensity:m.envMapIntensity,originalEnvMapIntensity:originalBindings.get(m).intensity});
  info.scope='Finite three-location, three-round captured-radiance approximation. Geometry occludes every room capture and window irradiance ray; local off-probe visibility and full multiple scattering are not reconstructed. No screen color mask or parallel beam cards.';
  const snapshot=()=>{
   const material=(Array.isArray(central.material)?central.material:[central.material]).find(m=>m.name.endsWith(':central-ordinary-PBR')),uniforms=renderer.properties.get(material).uniforms??{},color=central.geometry.getAttribute('color'),ids=[faceHit.face.a,faceHit.face.b,faceHit.face.c],vertex=ids.map(id=>color?[color.getX(id),color.getY(id),color.getZ(id)]:[1,1,1]);
   info.actualActorShader315={materialName:material.name,materialLinearColor:material.color.toArray(),shaderDiffuseLinear:uniforms.diffuse?.value?.toArray?.()??null,materialMetalness:material.metalness,shaderMetalness:uniforms.metalness?.value??null,materialRoughness:material.roughness,shaderRoughness:uniforms.roughness?.value??null,materialEnvMapUUID:material.envMap?.uuid??null,shaderEnvMapUUID:uniforms.envMap?.value?.uuid??null,actualOwnEnvSamplerMatches:uniforms.envMap?.value===material.envMap,materialEnvIntensity:material.envMapIntensity,shaderEnvIntensity:uniforms.envMapIntensity?.value??null,hasBaseColorMap:Boolean(material.map),faceVertexIDs:ids,actualFaceVertexColors:vertex,workingColorSpace:T.ColorManagement.workingColorSpace,outputColorSpace:renderer.outputColorSpace};
   return info;
  };
  return{lower:current.lower,upper:current.upper,info,snapshot,dispose(){current.lower.dispose();current.upper.dispose();current.nave.dispose();skyFiltered.dispose();sky.dispose();}};
 }catch(e){scene.background=old.background;scene.environment=old.environment;for(const[m,v]of originalBindings){m.envMap=v.envMap;m.envMapIntensity=v.intensity;m.needsUpdate=true;}current?.lower.dispose();current?.upper.dispose();current?.nave.dispose();skyFiltered.dispose();sky.dispose();renderer.shadowMap.autoUpdate=old.shadowAuto;renderer.shadowMap.needsUpdate=old.shadowNeeds;throw e;}
 finally{floor.onBeforeRender=originalFloorHook;floor.visible=old.floor;renderer.toneMapping=old.toneMapping;renderer.toneMappingExposure=old.exposure;pmrem.dispose();}
}
