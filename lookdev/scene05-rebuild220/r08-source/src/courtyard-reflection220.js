import * as T from 'three';

// One finite scene reflection capture. The measured sky plus the actual
// shadowed timber and newly modeled stone court supply its radiance. This
// is a native raster reflection probe, not traced GI or an image plate.
export function installCourtyardReflection220(scene,renderer,mats){
 const groundMaterial=new T.MeshStandardMaterial({name:'scene05-finite-weathered-stone-court220',color:'#a49a82',roughness:.91,metalness:0});
 const floor=new T.Mesh(new T.BoxGeometry(44,.10,44),groundMaterial);floor.name='scene05-finite-courtyard-reflection-surface220';floor.position.set(0,-.27,6);floor.receiveShadow=true;floor.castShadow=false;scene.add(floor);scene.updateMatrixWorld(true);
 const info={method:'One actual CubeCamera capture of existing3D temple/foliage and a finite sun/shadow-lit matte stone court',position:[5.5,6.4,7.2],cubeFaceSize:128,faces:6,scope:'Native local reflection approximation; not measured GI, per-pixel ray tracing or Cycles equivalence',floor:{centre:[0,-.27,6],size:[44,.10,44],albedo:'#a49a82',roughness:.91,emissive:false},status:'renderer absent; CPU geometry only'};
 if(!renderer?.isWebGLRenderer)return{info,dispose(){groundMaterial.dispose();}};
 const target=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});target.texture.colorSpace=T.LinearSRGBColorSpace;
 const camera=new T.CubeCamera(.20,90,target);camera.position.fromArray(info.position);camera.name='scene05-actual-local-reflection220';
 const saved={background:scene.background,intensity:scene.backgroundIntensity,rotation:scene.backgroundRotation.clone(),toneMapping:renderer.toneMapping};
 try{
  // Use the sunless calibrated environment for the sky portion, so the
  // existing direct solar key is not duplicated as a second sky disk.
  scene.background=scene.environment;scene.backgroundIntensity=scene.environmentIntensity;scene.backgroundRotation.copy(scene.environmentRotation);renderer.toneMapping=T.NoToneMapping;camera.update(renderer,scene);
 }finally{scene.background=saved.background;scene.backgroundIntensity=saved.intensity;scene.backgroundRotation.copy(saved.rotation);renderer.toneMapping=saved.toneMapping;}
 const names=['gold','oldgold','architecture_gold','architecture_oldgold','kit_gilt','fittingCopper','fittingEdge','fittingPatina','rafterCopper220','rafterEdge220','rafterPatina220','lanternBronze','terminalInlay204','scannedGilt220'];
 for(const name of names){const m=mats[name];if(!m)continue;m.envMap=target.texture;m.envMapRotation?.set(0,0,0);m.envMapIntensity=name.includes('Patina')?.38:name.startsWith('rafter')?.46:.66;m.needsUpdate=true;}
 info.status='captured actual6-face linear HDR scene radiance inside the official render job';info.explicitMaterialEnvironment=true;info.assignedMaterials=names;info.skyCaptureIntensity=scene.environmentIntensity;
 return{info,dispose(){target.dispose();groundMaterial.dispose();}};
}
