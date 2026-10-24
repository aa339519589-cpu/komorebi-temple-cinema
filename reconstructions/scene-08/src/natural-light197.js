import * as T from 'three';
export const NATURAL197_REVISION='scene08-lower-sun-warm-finish-chain213-r22';

export function installSun197(scene){
 const sun=new T.DirectionalLight(0xffffff,5.1);sun.name='scene08-197-single-shadow-casting-sun';sun.color.setRGB(1,.79,.52);sun.position.set(-31,18,20);sun.target.position.set(0,5,-7);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);sun.shadow.radius=3.0;Object.assign(sun.shadow.camera,{left:-27,right:27,top:33,bottom:-18,near:1,far:100});sun.shadow.bias=-.00010;sun.shadow.normalBias=.024;scene.add(sun,sun.target);
 return{sun,info:{revision:NATURAL197_REVISION,sun:{position:sun.position.toArray(),target:sun.target.position.toArray(),linearRGB:sun.color.toArray(),intensity:sun.intensity,shadowMap:4096,shadowRadius:3},additionalDirectionalFills:0,ambientLights:0,hemisphereLights:0,cameraFollowingLights:0,parallelProjectionLighting:false,referencePixelsUsed:false,visualAccepted:false}};
}

// Native first-bounce court radiance at the actual porch and eave heights.
// Both captures see the same real geometry, measured sky and single Sun.
// No light is introduced and neither capture is multiplied above unit gain.
// This remains a local-environment approximation, not path-traced GI.
export function captureHallCourt197({renderer,scene,materials,stream,grandFrame}){
 const c=Math.cos(grandFrame.yaw),s=Math.sin(grandFrame.yaw),captures=[];
 const mirror=stream.visible,auto=renderer.shadowMap.autoUpdate,pmrem=new T.PMREMGenerator(renderer);
 stream.visible=false;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 try{
  // Capture both before assigning either, so this is one reflected bounce.
  for(const[label,local]of[['porch',[.15,grandFrame.floor+1.70,3.90]],['eave',[.40,8.90,3.95]]]){
   const position=[grandFrame.x+c*local[0]+s*local[2],local[1],grandFrame.z-s*local[0]+c*local[2]],target=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType,generateMipmaps:false}),camera=new T.CubeCamera(.10,120,target);
   camera.name='scene08-213-fixed-'+label+'-court-probe';camera.position.fromArray(position);scene.add(camera);
   try{scene.updateMatrixWorld(true);camera.update(renderer,scene);captures.push({label,local,position,environment:pmrem.fromCubemap(target.texture),materials:[]});}
   finally{camera.removeFromParent();target.dispose();}
  }
 }finally{stream.visible=mirror;renderer.shadowMap.autoUpdate=auto;pmrem.dispose();}
 const eaveRoles=new Set(['hallArm213','hallReceiver213','hallRafter213','hallCut213','hallSoffit213','hallFascia213','hallInlay213']);
 for(const m of materials)if(m.name.startsWith('grand-hall-')){
  const high=eaveRoles.has(m.userData.hallTimber213?.role),capture=captures[high?1:0];
  m.envMap=capture.environment.texture;m.envMapRotation.set(0,0,0);m.envMapIntensity=1;m.userData.actualCourtCapture213=capture.label;m.needsUpdate=true;capture.materials.push(m.name);
 }
 return{info:{revision:'scene08-two-height-actual-court-capture213-r16',position:captures[0].position,resolution:128,captures:captures.map(({label,local,position,materials})=>({label,local,position,materials,gain:1})),materials:captures.flatMap(p=>p.materials),bothCapturedBeforeAssignment:true,linearNativeSceneCapture:true,worldLocked:true,photographSampled:false,unoccludedFillLightsAdded:0,scope:'Approximate single-bounce irradiance/reflection captured at actual porch/eave heights from modeled timber, openings, held measured sky and one Sun',visualAccepted:false},dispose(){for(const p of captures)p.environment.dispose();}};
}
