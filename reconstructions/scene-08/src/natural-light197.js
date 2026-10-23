import * as T from 'three';
export const NATURAL197_REVISION='scene08-natural-sun-carved-court197-r04';

export function installSun197(scene){
 const sun=new T.DirectionalLight(0xffffff,4.5);sun.name='scene08-197-single-shadow-casting-sun';sun.color.setRGB(1,.88,.70);sun.position.set(-31,25,20);sun.target.position.set(0,5,-7);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);sun.shadow.radius=3.0;Object.assign(sun.shadow.camera,{left:-27,right:27,top:33,bottom:-18,near:1,far:100});sun.shadow.bias=-.00010;sun.shadow.normalBias=.024;scene.add(sun,sun.target);
 return{sun,info:{revision:NATURAL197_REVISION,sun:{position:sun.position.toArray(),target:sun.target.position.toArray(),linearRGB:sun.color.toArray(),intensity:sun.intensity,shadowMap:4096,shadowRadius:3},additionalDirectionalFills:0,ambientLights:0,hemisphereLights:0,cameraFollowingLights:0,parallelProjectionLighting:false,referencePixelsUsed:false,visualAccepted:false}};
}

// Native first-bounce court radiance. The probe is fixed in the actual room,
// and its blocked sky / warm timber are supplied by real scene geometry.
// This is an approximate local environment, not a path-traced GI claim.
export function captureHallCourt197({renderer,scene,materials,stream,grandFrame}){
 const c=Math.cos(grandFrame.yaw),s=Math.sin(grandFrame.yaw),local=[.15,grandFrame.floor+1.70,3.90],position=[grandFrame.x+c*local[0]+s*local[2],local[1],grandFrame.z-s*local[0]+c*local[2]],target=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType,generateMipmaps:false}),camera=new T.CubeCamera(.10,120,target);camera.name='scene08-197-fixed-open-porch-court-probe';camera.position.fromArray(position);scene.add(camera);
 const mirror=stream.visible,auto=renderer.shadowMap.autoUpdate,pmrem=new T.PMREMGenerator(renderer);let environment;stream.visible=false;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 try{scene.updateMatrixWorld(true);camera.update(renderer,scene);environment=pmrem.fromCubemap(target.texture);}
 finally{stream.visible=mirror;renderer.shadowMap.autoUpdate=auto;camera.removeFromParent();target.dispose();pmrem.dispose();}
 const assigned=[];for(const m of materials)if(m.name.startsWith('grand-hall-')){m.envMap=environment.texture;m.envMapRotation.set(0,0,0);m.envMapIntensity=1;m.needsUpdate=true;assigned.push(m.name);}
 return{info:{position,resolution:128,materials:assigned,linearNativeSceneCapture:true,worldLocked:true,photographSampled:false,unoccludedFillLightsAdded:0,scope:'Approximate one-bounce room irradiance/reflection from actual modeled timber, openings, held sky and true sun',visualAccepted:false},dispose(){environment.dispose();}};
}
