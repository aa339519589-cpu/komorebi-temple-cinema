import * as T from 'three';

// One finite scene reflection capture. The measured sky plus the actual
// shadowed timber and newly modeled stone court supply its radiance. This
// is a native raster reflection probe, not traced GI or an image plate.
export function installCourtyardReflection220(scene,renderer,mats){
 const groundMaterial=new T.MeshStandardMaterial({name:'scene05-finite-weathered-stone-court220',color:'#a49a82',roughness:.91,metalness:0});
 const floor=new T.Mesh(new T.BoxGeometry(44,.10,44),groundMaterial);floor.name='scene05-finite-courtyard-reflection-surface220';floor.position.set(0,-.27,6);floor.receiveShadow=true;floor.castShadow=false;scene.add(floor);scene.updateMatrixWorld(true);
 const info={method:'One actual CubeCamera capture of existing3D temple/foliage and a finite sun/shadow-lit matte stone court',position:[5.5,6.4,7.2],cubeFaceSize:128,faces:6,scope:'Native local reflection approximation; not measured GI, per-pixel ray tracing or Cycles equivalence',floor:{centre:[0,-.27,6],size:[44,.10,44],albedo:'#a49a82',roughness:.91,emissive:false},status:'renderer absent; CPU geometry only'};
 if(!renderer?.isWebGLRenderer)return{info,dispose(){groundMaterial.dispose();}};
 // Filter both environments explicitly outside the material draw. The
 // renderer's nested lazy filtering otherwise temporarily retains earlier
 // shadow sampler allocations even though the final program has only11.
 const skyBackground=scene.environment,pmrem=new T.PMREMGenerator(renderer),skyFiltered=pmrem.fromEquirectangular(skyBackground);scene.environment=skyFiltered.texture;
 const target=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});target.texture.colorSpace=T.LinearSRGBColorSpace;
 const camera=new T.CubeCamera(.20,90,target);camera.position.fromArray(info.position);camera.name='scene05-actual-local-reflection220';
 const saved={background:scene.background,intensity:scene.backgroundIntensity,rotation:scene.backgroundRotation.clone(),toneMapping:renderer.toneMapping};
 try{
  // Use the sunless calibrated environment for the sky portion, so the
  // existing direct solar key is not duplicated as a second sky disk.
  scene.background=skyBackground;scene.backgroundIntensity=scene.environmentIntensity;scene.backgroundRotation.copy(scene.environmentRotation);renderer.toneMapping=T.NoToneMapping;camera.update(renderer,scene);
 }finally{scene.background=saved.background;scene.backgroundIntensity=saved.intensity;scene.backgroundRotation.copy(saved.rotation);renderer.toneMapping=saved.toneMapping;}
 const probeFiltered=pmrem.fromCubemap(target.texture);pmrem.dispose();
 const names=['bearingGround361','bearingGold361','bearingCopper361','bearingRecess361','tileEndCeramic361','tileEndLip361','tileEndRelief361','gold','oldgold','architecture_gold','architecture_oldgold','kit_gilt','fittingCopper','fittingEdge','fittingPatina','rafterCopper220','rafterEdge220','rafterPatina220','lanternBronze','terminalInlay204','scannedGilt220','lanternGilt275','lanternEdge275','lanternFrame275','lanternRecess275','terminalClay275','terminalLip275','terminalRecess275','terminalGold275'];
 for(const name of names){const m=mats[name];if(!m)continue;m.envMap=probeFiltered.texture;m.envMapRotation?.set(0,0,0);m.envMapIntensity=name.includes('Patina')?.38:name.startsWith('rafter')?.46:.66;m.needsUpdate=true;}
 // Diffuse wood also sees the actual finite court/temple/sky radiance. Use
 // the same restrained .22 gain as the former scene-wide IBL, with local
 // geometry in the capture and separately occluded low-sky directions.
 const timberNames=[];for(const[name,m]of Object.entries(mats))if(m.userData.metricTimberGrain){m.envMap=probeFiltered.texture;m.envMapRotation?.set(0,0,0);m.envMapIntensity=.22;m.needsUpdate=true;timberNames.push(name);}
 info.status='captured actual6-face linear HDR scene radiance inside the official render job';info.explicitMaterialEnvironment=true;info.assignedMaterials=names;info.skyCaptureIntensity=scene.environmentIntensity;
 info.timberDiffuse={materials:timberNames,intensity:.22,scope:'Same bounded local raster radiance probe; not per-surface traced occlusion or GI'};
 info.prefiltering='Explicit PMREM of measured sunless sky before scene capture, and actual local cube before material assignment; no lazy nested environment conversion during a material draw';
 return{info,dispose(){target.dispose();skyFiltered.dispose();probeFiltered.dispose();groundMaterial.dispose();}};
}
