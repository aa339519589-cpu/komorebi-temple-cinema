import * as T from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';

// A finite, world-fixed low courtyard radiance source supplies the missing
// broad underside illumination in this forward-rendered scene. This is an
// authored indirect-light approximation, not a measured or solved GI bounce.
// The original direct sun, HDR environment, exposure and fixed shadows remain.
export function addCourtyardBounce167(scene){
 RectAreaLightUniformsLib.init();
 const light=new T.RectAreaLight(0xffd1a4,1.65,18,10);
 light.name='scene07-finite-warm-courtyard-indirect-radiance167';
 light.position.set(-2,2.8,7);light.lookAt(3.5,9,-9);scene.add(light);
 const practicals=[];
 scene.traverse(o=>{if(o.isPointLight){practicals.push({name:o.name,position:o.position.toArray(),before:o.intensity});o.intensity*=.58;}});
 return{info:{revision:'scene07-finite-courtyard-radiance167-r01',
  light:{type:'RectAreaLight',position:light.position.toArray(),target:[3.5,9,-9],width:18,height:10,intensity:1.65,color:0xffd1a4},
  practicalIntensityMultiplier:.58,practicals,
  scope:'Finite low courtyard source approximates missing warm indirect radiance on downward soffits. Existing lamp intensities reduced to suppress isolated column hot spots. Direct sun, exposure and HDR pixels unchanged. All sources world-fixed; no temporal noise or camera-following lights. This is an authored native lighting approximation, not calibrated full global illumination.',
  visualAccepted:false},dispose(){scene.remove(light);}};
}
