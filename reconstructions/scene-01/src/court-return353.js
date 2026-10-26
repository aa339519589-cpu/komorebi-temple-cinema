import * as T from 'three';
// Inferred distant courtyard/sky return boundary, not an in-situ measurement.
// The samples light every receiver through the original scene's real shadows.
export function installCourtReturn353(scene){
 const samples=[],color=[1,.74,.40];for(const x of[-36,-30])for(const y of[8,18]){const light=new T.SpotLight(new T.Color().setRGB(...color),3200,0,Math.PI/9,.8,2);light.name='353-finite-warm-courtyard-return-'+samples.length;light.position.set(x,y,64);light.target.position.set(9.4,9,-11);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{near:.25,far:180});light.shadow.camera.updateProjectionMatrix();light.shadow.bias=-.000007;light.shadow.normalBias=.004;light.shadow.radius=3;scene.add(light,light.target);samples.push({name:light.name,position:light.position.toArray(),target:light.target.position.toArray(),intensity:light.intensity,colorLinear:color,decay:2,halfCone:light.angle,penumbra:light.penumbra,shadowSize:2048,allOriginalCastersAndReceivers:true});}
 return{source:'Unseen distant sunlit courtyard/sky return, native finite-source quadrature; original directional fill retired. Source extent/power/spectrum inferred by reference/native review.',samples,worldFixed:true,newUnshadowedFillLights:0,objectOrCameraLightMasks:0,beamCards:0,fullGI:false,photographicAccepted:false};
}
