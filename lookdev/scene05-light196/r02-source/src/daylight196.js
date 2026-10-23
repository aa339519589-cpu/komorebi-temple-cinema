import * as T from 'three';

// A bounded native-light diagnostic: the measured sky supplies cool diffuse
// and reflection radiance; direct sun and the finite courtyard patch cast
// actual geometry shadows. This is not recovered or path-traced GI.
export function installDaylight196(scene){
 const hemi=new T.HemisphereLight('#a8c9ef','#8a7762',.055);scene.add(hemi);
 const sun=new T.DirectionalLight('#fff0d8',8.0);sun.name='scene05-direct-sun196';
 sun.position.set(-18,36,30);sun.target.position.set(0,9,0);sun.castShadow=true;
 sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-17,right:17,top:24,bottom:-12,near:1,far:85});sun.shadow.bias=-.000012;sun.shadow.normalBias=.002;sun.shadow.radius=1.2;sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;scene.add(sun,sun.target);
 // One finite sunlit-courtyard patch replaces the uniform parallel upward
 // light. Inverse-square attenuation makes its influence fall naturally
 // through the storeys; all intervening timber and ceramics cast shadows.
 const groundBounce=new T.SpotLight('#ead5bb',600,55,1.18,.85,2);groundBounce.name='scene05-finite-courtyard-bounce196';
 groundBounce.position.set(2,.35,15);groundBounce.target.position.set(0,12,0);groundBounce.castShadow=true;
 groundBounce.shadow.mapSize.set(2048,2048);groundBounce.shadow.camera.near=.5;groundBounce.shadow.camera.far=55;groundBounce.shadow.bias=-.000012;groundBounce.shadow.normalBias=.0015;groundBounce.shadow.focus=1;groundBounce.shadow.radius=3.5;groundBounce.shadow.autoUpdate=false;groundBounce.shadow.needsUpdate=true;scene.add(groundBounce,groundBounce.target);
 return{sun,hemi,groundBounce,info:{revision:196,sun:{position:sun.position.toArray(),target:sun.target.position.toArray(),intensity:sun.intensity,color:'#fff0d8'},sky:{measuredSunlessEnvironmentIntensity:.22,hemisphereResidual:.055},courtyard:{type:'SpotLight',position:groundBounce.position.toArray(),target:groundBounce.target.position.toArray(),intensity:groundBounce.intensity,decay:2,cone:1.18,penumbra:.85,castsShadows:true},limits:'Measured sky with bounded native direct/finite bounce proxies, not recovered scene irradiance or physical GI'}};
}
