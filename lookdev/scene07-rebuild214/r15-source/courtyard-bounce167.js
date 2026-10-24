import * as T from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';

// A finite, world-fixed low courtyard radiance source supplies the missing
// broad underside illumination in this forward-rendered scene. This is an
// authored indirect-light approximation, not a measured or solved GI bounce.
// The original direct sun, HDR environment, exposure and fixed shadows remain.
export function addCourtyardBounce167(scene){
 RectAreaLightUniformsLib.init();
 const light=new T.RectAreaLight(0xffd1a4,.85,9,6);
 light.name='scene07-finite-warm-courtyard-indirect-radiance167';
 light.position.set(3,5.3,1);light.lookAt(4.6,11,-9);scene.add(light);
 const practicals=[];
 scene.traverse(o=>{if(o.isPointLight){practicals.push({name:o.name,position:o.position.toArray(),before:o.intensity});o.intensity*=.58;}});
 return{info:{revision:'scene07-finite-courtyard-radiance167-r02',
  light:{type:'RectAreaLight',position:light.position.toArray(),target:[4.6,11,-9],width:9,height:6,intensity:.85,color:0xffd1a4},
  practicalIntensityMultiplier:.58,practicals,
  scope:'Finite low courtyard source approximates missing warm indirect radiance on downward soffits. Existing lamp intensities reduced to suppress isolated column hot spots. Direct sun, exposure and HDR pixels unchanged. All sources world-fixed; no temporal noise or camera-following lights. This is an authored native lighting approximation, not calibrated full global illumination.',
  visualAccepted:false},dispose(){scene.remove(light);}};
}
