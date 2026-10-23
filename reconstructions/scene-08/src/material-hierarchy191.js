import * as T from 'three';

// Authored bounded linear reflectances. These are ordinary non-emissive PBR
// finishes on existing construction, not image light or brighter paper.
export function installMaterialHierarchy191(mats,materials,peony){
 const metal={gold:{rgb:[1,.766,.336],metalness:.91,roughness:.38},oldgold:{rgb:[.55,.34,.12],metalness:.82,roughness:.53},joinerygilt:{rgb:[.78,.52,.18],metalness:.78,roughness:.50},hardwarebrass:{rgb:[.72,.49,.17],metalness:.86,roughness:.47}};
 for(const [name,s]of Object.entries(metal)){const m=mats[name];m.color.setRGB(...s.rgb);m.metalness=s.metalness;m.roughness=s.roughness;m.emissive.setRGB(0,0,0);m.emissiveIntensity=0;}
 const lacquer=[];
 for(const [name,coat,coatRough]of[['red',.18,.38],['redlight',.12,.42],['wood',.10,.46]]){
  const old=mats[name],m=new T.MeshPhysicalMaterial({name:old.name+'-satin191',color:old.color.clone(),map:old.map,normalMap:old.normalMap,normalScale:old.normalScale.clone(),roughnessMap:old.roughnessMap,roughness:old.roughness,metalness:0,clearcoat:coat,clearcoatRoughness:coatRough,envMapIntensity:old.envMapIntensity});
  m.onBeforeCompile=old.onBeforeCompile;m.customProgramCacheKey=old.customProgramCacheKey;materials.push(m);mats[name]=m;lacquer.push({name,clearcoat:coat,clearcoatRoughness:coatRough,existingPortablePigmentAndNormalRoughnessRetained:true});
 }
 peony.material.color.setRGB(.65,.43,.14);peony.material.emissive.setRGB(0,0,0);peony.material.emissiveIntensity=0;
 // Cast bronze with a worn gold finish is more saturated and smoother than
 // the old shoe material. Only the new actual-profile end skins use it.
 const castEndMetal191={rgb:[.83,.45,.08],metalness:.94,roughness:.34},cast=new T.MeshStandardMaterial({name:'scene08-191-profile-fitted-worn-cast-gilt',metalness:castEndMetal191.metalness,roughness:castEndMetal191.roughness});cast.color.setRGB(...castEndMetal191.rgb);mats.castgilt191=cast;materials.push(cast);
 const nearNames=[];for(const name of['gold','oldgold','hardwarebrass','hardwareRecess','joinerygilt']){const old=mats[name],m=old.clone();m.name='scene08-entry-court-reflection191-'+name;m.onBeforeCompile=old.onBeforeCompile;m.customProgramCacheKey=old.customProgramCacheKey;materials.push(m);mats['entry191_'+name]=m;nearNames.push('entry191_'+name);}
 // The held171 finial already has the stronger warm cast-alloy response.
 // Restore that precise source finish after native comparison exposed the
 // paler R02 trial. Other entry fittings retain their actual court probe.
 mats.entry191_gold.color.set('#c99943');mats.entry191_gold.metalness=.86;mats.entry191_gold.roughness=.38;mats.entry191_gold.envMapIntensity=1;
 return{revision:'scene08-nonemissive-metal-lacquer-hierarchy191-r06',metal,castEndMetal191,lacquer,nearNames,nearFinialHeld171Finish:{sRGB:'#c99943',metalness:.86,roughness:.38,outdoorEnvironmentRetained:true},peonyRaisedLinearReflectance:[.65,.43,.14],geometryChanged:false,paperEmissionChanged:false,architectureEmissionAdded:false,reflectanceBounds:[0,1],visualAccepted:false};
}

// Actual native linear scene capture, invoked only by the official renderer
// while it owns the FIFO. This is neither a painted environment nor a bake
// from the comparison photograph. Only entry-court metal receives this probe.
export function captureEntryCourt191({renderer,scene,mats,stream}){
 const target=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType,generateMipmaps:false}),probe=new T.CubeCamera(.12,120,target);probe.position.set(-.65,3.0,7.05);probe.name='scene08-191-actual-entry-court-radiance';scene.add(probe);
 const mirrorVisible=stream.visible,auto=renderer.shadowMap.autoUpdate;stream.visible=false;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 const pmrem=new T.PMREMGenerator(renderer);let env;
 try{scene.updateMatrixWorld(true);probe.update(renderer,scene);env=pmrem.fromCubemap(target.texture);}
 finally{stream.visible=mirrorVisible;renderer.shadowMap.autoUpdate=auto;probe.removeFromParent();target.dispose();pmrem.dispose();}
 const names=[];for(const key of Object.keys(mats).filter(k=>k.startsWith('entry191_')&&k!=='entry191_gold')){const m=mats[key];m.envMap=env.texture;m.envMapRotation.set(0,0,0);m.envMapIntensity=.82;m.needsUpdate=true;names.push(key);}
 return{info:{revision:'scene08-actual-entry-court-probe191-r06',position:probe.position.toArray(),resolution:128,targets:names,linearNativeSceneCapture:true,referenceImageSampled:false,architectureAndSkyAndExistingLightsCaptured:true,mirrorHiddenOnlyDuringCapture:true,exposedTowerUsesOriginalOutdoorSky:true,nearFinialUsesHeld171FinishAndOutdoorSky:true,envGain:.82,visualAccepted:false},dispose(){env.dispose();}};
}
