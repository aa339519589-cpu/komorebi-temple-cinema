import * as T from 'three';

// A bounded native-light diagnostic: the measured sky supplies cool diffuse
// and reflection radiance; direct sun and the finite courtyard patch cast
// actual geometry shadows. This is not recovered or path-traced GI.
export function installDaylight196(scene){
 const hemi=new T.HemisphereLight('#a8c9ef','#8a7762',.055);scene.add(hemi);
 const sun=new T.DirectionalLight('#fff0d8',8.0);sun.name='scene05-direct-sun196';
 sun.position.set(-18,36,30);sun.target.position.set(0,9,0);sun.castShadow=true;
 sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-17,right:17,top:24,bottom:-12,near:1,far:85});sun.shadow.bias=-.000012;sun.shadow.normalBias=.002;sun.shadow.radius=1.2;sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;scene.add(sun,sun.target);
 // Finite unequal patches represent the adjacent court returns. Inverse
 // square attenuation varies naturally with tier height and receiver angle;
 // all intervening timber and ceramics cast actual shadows. The original
 // front patch location stays fixed; the weaker side patch carries the
 // cooler stone/sky return around the corner, without a uniform fill lift.
 function patch(name,color,power,position,mapSize){
  const light=new T.SpotLight(color,power,55,.92,.70,2);light.name=name;light.position.fromArray(position);light.target.position.set(0,12,0);light.castShadow=true;
  light.shadow.mapSize.set(mapSize,mapSize);light.shadow.camera.near=4;light.shadow.camera.far=45;light.shadow.bias=-.00006;light.shadow.normalBias=.006;light.shadow.focus=1;light.shadow.radius=.75;light.shadow.autoUpdate=false;light.shadow.needsUpdate=true;scene.add(light,light.target);return light;
 }
 const groundBounce=patch('scene05-finite-front-courtyard196','#ead5bb',320,[2,.35,15],4096),sideBounce=patch('scene05-finite-side-courtyard196','#cbd4df',110,[15,.35,2],2048);
 const describe=light=>({type:'SpotLight',position:light.position.toArray(),target:light.target.position.toArray(),intensity:light.intensity,color:light.color.getHexString(),decay:2,cone:.92,penumbra:.70,castsShadows:true,shadowNear:4,shadowFar:45,normalBias:.006,shadowBias:-.00006,shadowRadius:.75,shadowMap:light.shadow.mapSize.toArray()});
 return{sun,hemi,groundBounce,sideBounce,info:{revision:196,sun:{position:sun.position.toArray(),target:sun.target.position.toArray(),intensity:sun.intensity,color:'#fff0d8'},sky:{measuredSunlessEnvironmentIntensity:.22,hemisphereResidual:.055},courtyard:describe(groundBounce),adjacentCourtyard:describe(sideBounce),limits:'Measured sky with bounded native direct/finite unequal bounce proxies, not recovered scene irradiance or physical GI'}};
}
