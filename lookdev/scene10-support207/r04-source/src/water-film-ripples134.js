// Authored water-film differential geometry. There is no white ring colour,
// emissive material, billboard, replacement photo, or new floating water lid.
export const WATER_RIPPLE134_REVISION='scene10-ripple134-a-water-depth-and-reflection-response';

export function createWaterFilmRipples134(T,{impacts,floorWetMap,nearSurface,wetMaterial,nearMaterial,mirror}){
  const time={value:0},events=impacts.map(q=>new T.Vector4(q.x,q.z,q.phase,Math.max(0,Math.min(1,(q.radius-.035)/.05))));
  const functions=`
uniform float r134Time;
uniform vec4 r134Impacts[${events.length}];
// XY is the metric height gradient in world XZ. Z is the sub-millimetre
// displacement. Each impulse is a short damped capillary wave packet, not a
// pair of permanently complete concentric torus outlines.
vec3 r134WaterWave(vec2 world,float footprint){
  vec2 slope=vec2(0.0);float height=0.0;
  for(int i=0;i<${events.length};i++){
    vec4 q=r134Impacts[i];float variant=fract(q.z*.731+float(i)*.618033989);
    float age=fract(q.z+r134Time/(.52+1.12*variant));
    float maximumRadius=.022+.170*pow(q.w,1.7);
    vec2 delta=world-q.xy;
    if(dot(delta,delta)>pow(maximumRadius+.045,2.0))continue;
    float orientation=q.z*6.283185307,co=cos(orientation),si=sin(orientation);
    mat2 rotation=mat2(co,si,-si,co);
    float aspect=.84+.27*variant;vec2 axis=vec2(aspect,1.0/aspect);
    vec2 local=(rotation*delta)/axis;
    float distance=max(length(local),.00001),angle=atan(local.y,local.x+.0000001);
    float warp=1.0+.025*sin(angle*3.0+q.z*8.0)+.012*sin(angle*7.0+float(i));
    float front=.003+maximumRadius*pow(age,.72);
    float band=.0025+.0055*variant+.0035*age;
    float filteredBand=sqrt(band*band+footprint*footprint*.16);
    float x=(distance*warp-front)/filteredBand;
    float envelope=exp(-1.4*x*x),oscillation=sin(x*3.2);
    float amplitude=(.00005+.00030*q.w)*smoothstep(0.0,.045,age);
    amplitude*=(1.0-smoothstep(.18,1.0,age))*exp(-1.1*age);
    amplitude*=min(1.0,band/max(footprint,.00001));
    float derivative=amplitude*envelope*(3.2*cos(x*3.2)-2.8*x*oscillation)/filteredBand;
    // Transpose of the stretch/rotation maps the metric derivative back to
    // world space. Small angular warping represents uneven shallow flow.
    float warpAngle=.075*cos(angle*3.0+q.z*8.0)+.084*cos(angle*7.0+float(i));
    vec2 outward=local/distance;
    vec2 radial=(outward*warp+vec2(-outward.y,outward.x)*warpAngle)/axis;
    vec2 direction=vec2(co*radial.x+si*radial.y,-si*radial.x+co*radial.y);
    slope+=direction*derivative;height+=amplitude*envelope*oscillation;
  }
  return vec3(clamp(slope,vec2(-.11),vec2(.11)),height);
}
`;
  const install=(material,near)=>{
    const inherited=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
    material.onBeforeCompile=shader=>{
      inherited(shader);shader.uniforms.r134Time=time;shader.uniforms.r134Impacts={value:events};
      shader.fragmentShader=functions+shader.fragmentShader;
      const waterGate=near
        ?'poreWater*r134Wet.r*r134Wet.b*(.25+.75*r134Wet.g)'
        :'r134Wet.r*r134Wet.b*smoothstep(.72,.94,r134Wet.g)*smoothstep(.44,.66,sdFbm(vSurfacePosition*2.7))';
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',`
// Only the optical water coat receives a wave. The existing mineral albedo,
// stone normal, dry highs and real slab geometry are left alone.
vec4 r134Wet=texture2D(floorWetMap,vec2((vSurfacePosition.x+4.6)/9.2,(vSurfacePosition.z+2.0)/21.4));
float r134Water=(${waterGate});
vec3 r134Up=normalize(mat3(viewMatrix)*vec3(0.0,1.0,0.0));
r134Water*=smoothstep(.70,.98,dot(nonPerturbedNormal,r134Up));
vec2 r134Dx=dFdx(vSurfacePosition.xz),r134Dy=dFdy(vSurfacePosition.xz);
vec3 r134Wave=r134WaterWave(vSurfacePosition.xz,max(length(r134Dx),length(r134Dy)));
#ifdef USE_CLEARCOAT
vec2 r134ScreenSlope=vec2(dot(r134Wave.xy,r134Dx),dot(r134Wave.xy,r134Dy));
vec3 r134Normal=perturbNormalArb(-vViewPosition,clearcoatNormal,r134ScreenSlope,faceDirection);
clearcoatNormal=normalize(mix(clearcoatNormal,r134Normal,r134Water));
#endif
// Fresnel, actual lights and the actual scene probe determine colour and
// view-dependent glints. No ripple diffuse/alpha/emissive term is added.
#include <lights_fragment_begin>`);
    };
    material.customProgramCacheKey=()=>key()+'|ripple134-water-normal-'+(near?'real-basin':'wet-film');material.needsUpdate=true;
  };
  install(wetMaterial,false);install(nearMaterial,true);

  // The existing bounded rain-film reflector remains the same physical
  // plane and keeps its real-stone camera-ray exclusion. A wave only bends
  // its existing scene reflection where the wetness mask contains water.
  mirror.updateMatrixWorld(true);
  mirror.material.uniforms.r134Time=time;mirror.material.uniforms.r134Impacts={value:events};
  mirror.material.uniforms.r134FilmWorldToLocal={value:mirror.matrixWorld.clone().invert()};
  mirror.material.fragmentShader='uniform mat4 textureMatrix;uniform mat4 r134FilmWorldToLocal;\n'+functions+mirror.material.fragmentShader;
  const anchor='uv.xy+=rip*vec2(.0022,.0048)*uv.w;';
  if(!mirror.material.fragmentShader.includes(anchor))throw Error('Rain-film reflection hook is missing.');
  mirror.material.fragmentShader=mirror.material.fragmentShader.replace(anchor,anchor+`
vec4 r134FilmWet=texture2D(floorWetMap,vec2((sp.x+4.6)/9.2,(sp.z+2.0)/21.4));
float r134FilmWater=r134FilmWet.r*r134FilmWet.b*smoothstep(.72,.94,r134FilmWet.g)*smoothstep(.44,.66,film);
vec3 r134FilmWave=r134WaterWave(sp.xz,max(length(dFdx(sp.xz)),length(dFdy(sp.xz))));
float r134Lever=clamp(length(cameraPosition-sp)*.25,.25,2.5);
vec3 r134ReflectedPoint=sp+vec3(-r134FilmWave.x,0.0,-r134FilmWave.y)*r134Lever*r134FilmWater;
vec4 r134Projected=textureMatrix*r134FilmWorldToLocal*vec4(r134ReflectedPoint,1.0);
uv.xy+=(r134Projected.xy/max(r134Projected.w,.00001)-vUv.xy/vUv.w)*uv.w;
`);
  const mirrorKey=mirror.material.customProgramCacheKey.bind(mirror.material);
  mirror.material.customProgramCacheKey=()=>mirrorKey()+'|ripple134-water-reflection';mirror.material.needsUpdate=true;
  return{
    update(value){time.value=value;},
    info:{revision:WATER_RIPPLE134_REVISION,impacts:events.length,removedUnlitTorusOutlines:impacts.length*2,newGeometry:0,oldImpactDrawsRetained:impacts.length*4,initialMaximumRadiusMetres:[.022,.192],unattenuatedAmplitudeMetres:[.00005,.00035],lifetimeSeconds:[.52,1.64],nearWaterGate:'Actual authored stone-basin depth and existing coverage/edge/wetness atlas.',farWaterGate:'Existing water-film plane, paving presence, contact edge and high wetness; unchanged real-stone plane exclusion.',optics:'Water-coat normals and actual reflected scene only; no ripple colour, alpha or emission. Fresnel and existing light/view direction control visible arcs.',surfaceAtlas:nearSurface.info.dimensions,wetMaskDimensions:[floorWetMap.image.width,floorWetMap.image.height],rng:'The unchanged 55x4 original global RNG calls supply all impacts; no new random draws or RNG state writes.'}
  };
}
