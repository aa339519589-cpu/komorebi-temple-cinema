import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Reference-driven, opt-in lighting. No global ShaderChunk or normal changes.
// Interior reference 6: left-window sun, dark timber, selective gold glints,
// and a varnished (not metallic) floor. References 1/9/10 define other modes.
export const RESTORATION_LIGHTING_PROFILES = Object.freeze({
  sanctuary: Object.freeze({ sun: 5.0, direction: [-.87, .42, .24], color: '#ffe6c0', environment: .15, hemisphere: .18, exposure: 1.10, mist: .010, practical: .65, wet: 0, rainfall: 0 }),
  lotusDay: Object.freeze({ sun: 3.8, direction: [-.54, .73, .42], color: '#fff0da', skyRadiance: .18, environment: .34, hemisphere: .38, exposure: 1.05, mist: .0015, practical: .30, wet: 0, rainfall: 0 }),
  day: Object.freeze({ sun: 4.3, direction: [-.78, .21, .54], color: '#ffe2b8', environment: .24, hemisphere: .29, exposure: 1.08, mist: .0035, practical: .75, wet: .1, rainfall: 0 }),
  night: Object.freeze({ sun: .23, direction: [-.48, .72, .50], color: '#9db7e8', environment: .38, hemisphere: .20, exposure: 1.18, mist: .0018, practical: 1.75, wet: .55, rainfall: 0 }),
  rain: Object.freeze({ sun: .72, direction: [-.58, .72, .38], color: '#d7e2e9', environment: .55, hemisphere: .48, exposure: 1.12, mist: .004, practical: 1.0, wet: 1, rainfall: 1 })
});

// Snapshot opt-in per-reference profiles. A distinct key is a distinct immutable
// source/cache identity, not a frame-following light. Legacy callers are exact.
function resolveLightingProfiles(options={}) {
  if(options.profiles==null)return RESTORATION_LIGHTING_PROFILES;
  if(typeof options.profiles!=='object'||Array.isArray(options.profiles))throw new Error('Lighting profiles must be a keyed object.');
  const table={...RESTORATION_LIGHTING_PROFILES};
  const families=new Set(['warm-low-sun','clear-day','window-day','blue-hour','overcast-rain']);
  for(const [key,record] of Object.entries(options.profiles)){
    if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(key)||['constructor','prototype','__proto__'].includes(key)||!record||typeof record!=='object')throw new Error('Invalid lighting profile key or record.');
    const baseMode=record.baseMode || (Object.hasOwn(RESTORATION_LIGHTING_PROFILES,key)?key:null);
    if(!Object.hasOwn(RESTORATION_LIGHTING_PROFILES,baseMode))throw new Error('Custom profile needs an explicit known baseMode.');
    const value={...RESTORATION_LIGHTING_PROFILES[baseMode],...record,baseMode};
    if(value.skyFamily!=null&&!families.has(value.skyFamily))throw new Error('Unknown lighting source family.');
    if(value.skyFamily!=null&&({'warm-low-sun':'day','clear-day':'lotusDay','window-day':'sanctuary','blue-hour':'night','overcast-rain':'rain'})[value.skyFamily]!==baseMode)throw new Error('Source family must agree with its physical baseMode.');
    if(!Array.isArray(value.direction)||value.direction.length!==3||!value.direction.every(Number.isFinite)||Math.hypot(...value.direction)<1e-8)throw new Error('Profile direction must be a finite nonzero vector.');
    for(const [name,max] of Object.entries({sun:100,environment:4,hemisphere:4,exposure:4,mist:1,practical:8,wet:1,rainfall:1}))if(!Number.isFinite(value[name])||value[name]<0||value[name]>max)throw new Error('Profile '+name+' is outside its explicit physical-control bounds.');
    if(value.exposure===0||!/^#[0-9a-f]{6}$/i.test(value.color))throw new Error('Profile requires positive exposure and an explicit RGB source color.');
    if(value.skyRadiance!=null&&(!Number.isFinite(value.skyRadiance)||value.skyRadiance<.01||value.skyRadiance>4))throw new Error('Profile sky radiance must be within [.01,4].');
    value.direction=Object.freeze([...value.direction]);if(value.sourceDiscUV)value.sourceDiscUV=Object.freeze([...value.sourceDiscUV]);
    table[key]=Object.freeze(value);
  }
  return Object.freeze(table);
}
function cacheLimit(value,fallback){const n=value ?? fallback;if(!Number.isInteger(n)||n<1||n>32)throw new Error('Environment cache capacity must be an integer from1 to32.');return n;}

export const RESTORATION_MATERIAL_RESPONSE = Object.freeze({
  gold: Object.freeze({ roughness: .28, metalness: .96, bumpScale: .0018, envMapIntensity: .90 }),
  oldgold: Object.freeze({ roughness: .38, metalness: .87, bumpScale: .0025, envMapIntensity: .78 }),
  buddha: Object.freeze({ roughness: .31, metalness: .96, bumpScale: .0017, envMapIntensity: 1.02 }),
  wetStone: Object.freeze({ roughness: .22, metalness: .025, bumpScale: .012 }),
  black: Object.freeze({ roughness: .30, metalness: .12 })
});

const finite = (v, fallback) => Number.isFinite(v) ? v : fallback;
const clamp = T.MathUtils.clamp;
const vec = a => new T.Vector3(...a);
const portalVisibilityMaterials = new WeakSet();
const registeredWindowMaterials = new WeakSet();
const roomEnvironmentMaterials = new WeakSet();
function hiddenDuring(objects, callback) {
  const unique = [...new Set(objects.filter(Boolean))];
  const visible = unique.map(o => o.visible);
  unique.forEach(o => { o.visible = false; });
  try { return callback(); }
  finally { unique.forEach((o, i) => { o.visible = visible[i]; }); }
}
function checkReplace(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Restoration ${label}: pinned shader marker changed. Original material was not replaced.`);
  return source.replace(from, to);
}

// A transparent clear-varnish reflection over the existing real floorboards.
// The base wood remains visible; plank gaps and Fresnel are not painted gold.
export function createSanctuaryFloorReflection({ hallMatrix, textureSize = 1536, reflectors = [], floorOffset = .006 } = {}) {
  const transform = hallMatrix || new T.Matrix4().makeTranslation(6, 0, -11).scale(vec([1.35, 1.75, 1.28])).multiply(new T.Matrix4().makeTranslation(-6, 0, 11));
  // Reflector expects its local plane to be XY, with local normal +Z.
  // Rotate/scale the mesh, not its underlying plane geometry.
  const floor = new Reflector(new T.PlaneGeometry(18.0, 14.2), {
    textureWidth: textureSize, textureHeight: textureSize,
    clipBias: .002, multisample: 0, color: 0xffffff
  });
  floor.name = 'restoration-sanctuary-floor-clearcoat';
  const floorCenter = vec([6, 3.435, -11]).applyMatrix4(transform);
  // The existing hall matrix has scale + translation, with its floor horizontal.
  const scale = new T.Vector3().setFromMatrixScale(transform);
  floor.position.copy(floorCenter); floor.position.y += floorOffset;
  floor.rotation.x = -Math.PI / 2;
  floor.scale.set(scale.x, scale.z, 1);
  floor.userData.reflectionPlane = true;
  floor.userData.excludeFromGTAO = true;
  floor.userData.excludeFromEnvironmentBake = true;
  floor.renderOrder = 2;
  // The v13 matched frame exposed that subpixel taps alone are still a hard
  // mirror. Prefilter this reflection target, not the scene or underlying wood.
  // r186 regenerates render-target mipmaps after each reflection render.
  const reflectionTexture = floor.getRenderTarget().texture;
  reflectionTexture.generateMipmaps = true;
  reflectionTexture.minFilter = T.LinearMipmapLinearFilter;
  const m = floor.material;
  m.name = 'restoration-floor-varnish';
  m.transparent = true; m.depthWrite = false; m.depthTest = true;
  m.uniforms.floorTexel = { value: new T.Vector2(1 / textureSize, 1 / textureSize) };
  m.uniforms.floorStrength = { value: .88 };
  m.uniforms.floorReflectionLod = { value: 2.4 };
  m.uniforms.floorOrigin = { value: new T.Vector2(floorCenter.x - 9 * scale.x, floorCenter.z) };
  m.uniforms.plankPitch = { value: .28 * scale.x };
  m.vertexShader = m.vertexShader.replace('varying vec4 vUv;', 'varying vec4 vUv; varying vec3 vFloorWorld;');
  m.vertexShader = m.vertexShader.replace('vUv = textureMatrix', 'vFloorWorld = (modelMatrix * vec4(position, 1.0)).xyz;\n vUv = textureMatrix');
  m.fragmentShader = m.fragmentShader.replace('varying vec4 vUv;', `varying vec4 vUv; varying vec3 vFloorWorld;
    uniform vec2 floorTexel, floorOrigin; uniform float floorStrength, plankPitch, floorReflectionLod;`);
  m.fragmentShader = checkReplace(m.fragmentShader, 'vec4 base = texture2DProj( tDiffuse, vUv );', `
    vec2 projected = vUv.xy / max(vUv.w, .00001);
    // Small stationary grain distortion, less than a texel at the target size.
    float grain = sin(vFloorWorld.x * 61.0 + sin(vFloorWorld.z * .9) * .6);
    projected += vec2(grain * .12, sin(vFloorWorld.z * 31.0) * .035) * floorTexel;
    // texture2DLodEXT is mapped to native textureLod by Three's WebGL2 prefix.
    // Fixed LOD represents the varnish's micro-roughness, not screen-space DOF.
    vec3 reflection = texture2DLodEXT(tDiffuse, projected, floorReflectionLod).rgb * .40;
    reflection += texture2DLodEXT(tDiffuse, projected + floorTexel * vec2(.85, .28), floorReflectionLod).rgb * .15;
    reflection += texture2DLodEXT(tDiffuse, projected - floorTexel * vec2(.85, .28), floorReflectionLod).rgb * .15;
    reflection += texture2DLodEXT(tDiffuse, projected + floorTexel * vec2(.24, 1.15), floorReflectionLod).rgb * .15;
    reflection += texture2DLodEXT(tDiffuse, projected - floorTexel * vec2(.24, 1.15), floorReflectionLod).rgb * .15;
    vec4 base = vec4(reflection, 1.0);`, 'floor sampling');
  m.fragmentShader = checkReplace(m.fragmentShader, 'gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );', `
    vec3 viewDelta = cameraPosition - vFloorWorld;
    float cosV = clamp(viewDelta.y / max(length(viewDelta), .0001), 0.0, 1.0);
    float fresnel = .037 + .963 * pow(1.0 - cosV, 5.0);
    float board = fract((vFloorWorld.x - floorOrigin.x + plankPitch * .5) / plankPitch);
    float seamDistance = min(board, 1.0 - board) * plankPitch;
    float aa = max(fwidth(seamDistance), .0003);
    float seam = smoothstep(.004 - aa, .008 + aa, seamDistance);
    float alpha = clamp(fresnel * floorStrength, 0.0, .78) * seam;
    gl_FragColor = vec4(base.rgb * vec3(.93, .89, .82), alpha);`, 'floor output');
  const original = floor.onBeforeRender;
  floor.onBeforeRender = function (...args) {
    return hiddenDuring(reflectors, () => original.apply(this, args));
  };
  return floor;
}

// Patch only the known v10 water shader. Existing normal stability and the
// reflection/refraction targets are untouched. Return an exact undo function.
export function applyRestorationWater(water) {
  if (!water?.material?.uniforms?.tRefraction) return null;
  const m = water.material;
  if (m.userData.restorationWater) return m.userData.restorationWater;
  const before = m.fragmentShader;
  let shader = before;
  shader = checkReplace(shader, 'uniform float time;', `uniform float restorationWetness, restorationWaveScale;
    uniform float time;
    float restorationHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    vec2 restorationRain(vec2 p, float t) {
      vec2 cell = floor(p * 1.35), local = fract(p * 1.35), grad = vec2(0.0);
      for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++) {
        vec2 neighbor=vec2(float(i),float(j)), key=cell+neighbor;
        vec2 center=vec2(restorationHash(key),restorationHash(key+13.7));
        float age=fract(t*.53+restorationHash(key+31.4));
        vec2 delta=local-neighbor-center; float radius=max(length(delta),.0001);
        float wave=radius-age*.64;
        float envelope=exp(-wave*wave*155.0)*(1.0-age)*(1.0-age);
        grad+=delta/radius*cos(wave*49.0)*envelope*.12;
      }
      return grad;
    }`, 'water declarations');
  shader = checkReplace(shader, 'uv.x += (a+b*.45)*0.00044*uv.w; uv.y += (b+a*.3)*0.00031*uv.w;', `
    vec2 rainGradient = restorationRain(vWaterWorld.xz, time) * restorationWetness;
    uv.x += ((a+b*.45)*.00044*restorationWaveScale + rainGradient.x*.0009)*uv.w;
    uv.y += ((b+a*.3)*.00031*restorationWaveScale + rainGradient.y*.0009)*uv.w;`, 'water wave');
  shader = checkReplace(shader, 'vec3 waterNormal=normalize(vec3(-.012*(2.1*ca-.8*cb),1.0,-.012*(.7*ca+3.3*cb)));', 'vec3 waterNormal=normalize(vec3(-.012*(2.1*ca-.8*cb)*restorationWaveScale-rainGradient.x,1.0,-.012*(.7*ca+3.3*cb)*restorationWaveScale-rainGradient.y));', 'water normal');
  shader = checkReplace(shader, 'vec3 transmitted=mix(bed,vec3(.025,.052,.025),.48);', 'vec3 transmitted=mix(bed,vec3(.014,.031,.023),.40);', 'water transmission');
  m.fragmentShader = shader;
  m.uniforms.restorationWetness = { value: 0 };
  m.uniforms.restorationWaveScale = { value: .75 };
  m.needsUpdate = true;
  const api = {
    // Wet surfaces can remain wet after precipitation stops. Only rainfall
    // creates impact rings; night wetness must not invent continuing rain.
    setMode(profile) { const rain=clamp(finite(profile.rainfall,0),0,1);m.uniforms.restorationWetness.value=rain;m.uniforms.restorationWaveScale.value=rain > .9 ? .56 : .75; },
    dispose() { m.fragmentShader=before; delete m.uniforms.restorationWetness; delete m.uniforms.restorationWaveScale; delete m.userData.restorationWater; m.needsUpdate=true; }
  };
  m.userData.restorationWater = api;
  return api;
}

// Calibrate incident sky radiance before both display and environment capture.
// The pinned analytical Sky is HDR, not a display-blue background. At the high
// reference-3 sun its unscaled diffuse sky clips through ACES and washes every
// environment-lit surface. This is deliberately separate from camera exposure.
export function applyRestorationSkyRadiance(sky) {
  const m=sky?.material;
  if(!m?.uniforms || typeof m.fragmentShader!=='string')throw new Error('Restoration sky needs the pinned Sky material.');
  if(m.uniforms.restorationSkyRadiance)throw new Error('Restoration sky radiance is already installed.');
  const before=m.fragmentShader;
  const shader=checkReplace(before,'gl_FragColor = vec4( texColor, 1.0 );',
    'gl_FragColor = vec4( texColor * restorationSkyRadiance, 1.0 );','sky radiance');
  m.fragmentShader='uniform float restorationSkyRadiance;\n'+shader;
  m.uniforms.restorationSkyRadiance={value:1};m.needsUpdate=true;
  let disposed=false;
  return {
    setGain(value=1){if(disposed)throw new Error('Restoration sky radiance was disposed.');m.uniforms.restorationSkyRadiance.value=clamp(finite(value,1),.01,4);},
    dispose(){if(disposed)return;disposed=true;m.fragmentShader=before;delete m.uniforms.restorationSkyRadiance;m.needsUpdate=true;}
  };
}

// Source-matched upper-hemisphere quadrature of the pinned Sky, without its
// solar disc. This is only a distant ground-boundary estimate for exterior IBL,
// not a scene-GI solver. Clouds use the same deterministic field and uniforms.
export function measureRestorationSkyIrradiance(sky, samples=2048) {
  const u=sky?.material?.uniforms;
  if(!u?.sunPosition || !sky.material.fragmentShader.includes('float zenithAngle = acos( max( 0.0, direction.y ) );'))throw new Error('Sky irradiance requires the pinned analytical Sky.');
  if(!Number.isInteger(samples)||samples<64||samples>16384)throw new Error('Sky quadrature samples must be an integer in [64, 16384].');
  const value=(key,fallback)=>u[key]?.value ?? fallback;
  const sun=value('sunPosition').clone().normalize(),pi=Math.PI;
  if(!sun.toArray().every(Number.isFinite)||sun.lengthSq()<.99||sun.y<=0)throw new Error('Ground reflection requires a finite above-horizon sun.');
  const turbidity=value('turbidity',2.6),rayleigh=value('rayleigh',2.1),mie=value('mieCoefficient',.0035),g=value('mieDirectionalG',.82);
  const coverage=value('cloudCoverage',0),density=value('cloudDensity',.3),scale=value('cloudScale',.002),elevation=value('cloudElevation',.5),time=value('time',0),speed=value('cloudSpeed',.00002),gain=value('restorationSkyRadiance',1);
  if(![turbidity,rayleigh,mie,g,coverage,density,scale,elevation,time,speed,gain].every(Number.isFinite)||turbidity<=0||rayleigh<=0||mie<0||g<0||g>=1||coverage<0||coverage>1||density<0||gain<=0)throw new Error('Invalid pinned Sky parameters for ground integration.');
  const fract=x=>x-Math.floor(x),mix=(a,b,t)=>a+(b-a)*t,smooth=(a,b,x)=>{x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x);};
  function gradient(x,y){let p=[fract(x*.1031),fract(y*.1030),fract(x*.0973)];const d=p.reduce((sum,v,i)=>sum+v*(p[(i+1)%3]+33.33),0);p=p.map(v=>v+d);return[fract((p[0]+p[1])*p[2])*2-1,fract((p[0]+p[2])*p[1])*2-1];}
  function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=fract(x),fy=fract(y),ux=fx**3*(fx*(fx*6-15)+10),uy=fy**3*(fy*(fy*6-15)+10),dot=(a,b,c)=>a[0]*b+a[1]*c;return mix(mix(dot(gradient(ix,iy),fx,fy),dot(gradient(ix+1,iy),fx-1,fy),ux),mix(dot(gradient(ix,iy+1),fx,fy-1),dot(gradient(ix+1,iy+1),fx-1,fy-1),ux),uy)*1.6;}
  function fbm(x,y){let sum=0,amplitude=1;for(let i=0;i<4;i++){sum+=amplitude*noise(x,y);amplitude*=.5;x=x*2+time*speed*300;y=y*2+time*speed*300;}return sum;}
  const E=1000*Math.max(0,1-Math.exp(-(1.6110731556870734-Math.acos(sun.y))/1.5));
  const betaR=[5.804542996261093e-6,1.3562911419845635e-5,3.0265902468824876e-5].map(x=>x*rayleigh);
  const betaM=[1.8399918514433978e14,2.7798023919660528e14,4.0790479543861094e14].map(x=>.434*(.2*turbidity)*1e-17*x*mie),result=[0,0,0];
  for(let i=0;i<samples;i++){
    const y=(i+.5)/samples,r=Math.sqrt(1-y*y),angle=i*pi*(3-Math.sqrt(5)),x=r*Math.cos(angle),z=r*Math.sin(angle);
    const zenith=Math.acos(y),inverse=1/(y+.15*Math.pow(93.885-zenith*180/pi,-1.253)),cosTheta=x*sun.x+y*sun.y+z*sun.z;
    const rayPhase=3/(16*pi)*(1+(cosTheta*.5+.5)**2),miePhase=(1-g*g)/(4*pi*Math.pow(1+g*g-2*g*cosTheta,1.5));
    const extinction=betaR.map((b,c)=>Math.exp(-(b*8400+betaM[c]*1250)*inverse));
    const scattered=betaR.map((b,c)=>{const phase=(b*rayPhase+betaM[c]*miePhase)/(b+betaM[c]),base=Math.pow(E*phase*(1-extinction[c]),1.5);return base*mix(1,Math.sqrt(E*phase*extinction[c]),Math.pow(1-sun.y,5));});
    let rgb=scattered.map((v,c)=>(v+.1*extinction[c])*.04+[0,.0003,.00075][c]);
    if(coverage>0){
      const cloudX=x/(y*mix(1,.1,elevation))*scale+time*speed,cloudZ=z/(y*mix(1,.1,elevation))*scale+time*speed;
      const cloudNoise=clamp(fbm(cloudX*1000,cloudZ*1000)*.7+.5,0,1),region=noise(cloudX*300,cloudZ*300)*.37+.5;
      const threshold=1-clamp(coverage+(region-.5)*.6,0,1),fade=smooth(0,.03+.06*elevation,y),mask=smooth(threshold,threshold+.3,cloudNoise)*fade,depth=Math.max(0,cloudNoise-threshold);
      const beer=Math.exp(-depth*4),shade=mix(.45,1,clamp(beer*(1-beer*beer)*2.6,0,1)),silver=clamp(.51/Math.pow(1.49-cosTheta*1.4,1.5),0,3),edge=mask*(1-mask)*4;
      const alpha=(1-Math.exp(-depth*density*12))*fade,day=Math.max(smooth(-.08,.3,sun.y),.03);
      rgb=rgb.map((v,c)=>{const solar=E*extinction[c]*.22*.04,ambient=scattered[c]*.04+[0,.0003,.00075][c],cloud=(ambient+solar*shade+solar*silver*edge*.6)*day,base=v-.1*extinction[c]*.04*alpha;return mix(base,mix(base,cloud,extinction[c]),alpha);});
    }
    for(let c=0;c<3;c++)result[c]+=rgb[c]*gain*y*2*pi/samples;
  }
  if(!result.every(v=>Number.isFinite(v)&&v>=0))throw new Error('Nonfinite Sky ground-boundary integral.');
  return result;
}

// Install ONLY on an environment-capture clone. The lower hemisphere of Sky
// is not sky seen through the earth. Replace it with a finite distant diffuse
// ground boundary, lit by this same sky and the actual shadowed-sun source.
// This cannot describe nearby occluders or multiply bounced interior light.
export function applyRestorationGroundEnvironment(sky,{skyIrradiance,environmentIntensity,sun,albedo=.12}={}) {
  const material=sky?.material;
  if(!material?.uniforms || material.uniforms.restorationGroundRadiance)throw new Error('Ground environment needs an unpatched Sky clone.');
  const rho=Array.isArray(albedo)?[...albedo]:[albedo,albedo,albedo];
  if(rho.length!==3||!rho.every(v=>Number.isFinite(v)&&v>=0&&v<=.35))throw new Error('Distant ground albedo must stay within [0, .35] per linear channel.');
  if(!Array.isArray(skyIrradiance)||skyIrradiance.length!==3||!skyIrradiance.every(v=>Number.isFinite(v)&&v>=0)||!Number.isFinite(environmentIntensity)||environmentIntensity<=0||!sun?.isDirectionalLight)throw new Error('Ground environment requires finite sky/source energy.');
  const direction=sun.position.clone().sub(sun.target.position).normalize(),cosine=Math.max(0,direction.y),sunRGB=sun.color.toArray();
  if(!direction.toArray().every(Number.isFinite)||!Number.isFinite(sun.intensity)||sun.intensity<0)throw new Error('Invalid ground-boundary sun source.');
  const incident=skyIrradiance.map((v,c)=>v*environmentIntensity+sunRGB[c]*sun.intensity*cosine);
  const radiance=incident.map((v,c)=>v*rho[c]/(Math.PI*environmentIntensity));
  const before=material.fragmentShader;
  const marker=before.includes('gl_FragColor = vec4( texColor * restorationSkyRadiance, 1.0 );')?'gl_FragColor = vec4( texColor * restorationSkyRadiance, 1.0 );':'gl_FragColor = vec4( texColor, 1.0 );';
  const shader=checkReplace(before,marker,marker+'\nif ( direction.y < 0.0 ) gl_FragColor.rgb = restorationGroundRadiance;','ground hemisphere');
  material.fragmentShader='uniform vec3 restorationGroundRadiance;\n'+shader;
  material.uniforms.restorationGroundRadiance={value:new T.Vector3(...radiance)};material.needsUpdate=true;
  let disposed=false;
  return {skyIrradiance:[...skyIrradiance],incidentIrradiance:incident,albedo:rho,radiance,dispose(){if(disposed)return;disposed=true;material.fragmentShader=before;delete material.uniforms.restorationGroundRadiance;material.needsUpdate=true;}};
}

// Run independent public-state/resource cleanup even when a previous restore
// itself throws. A completed capture whose cleanup failed has no caller-owned
// result: release it rather than leaking a target behind the thrown error.
// This cannot repair renderer-private stacks or a lost graphics context.
function completeRestorationCaptureCleanup(failure, steps, result, succeeded, label) {
  const errors=[];
  for(const step of steps)try{step();}catch(error){errors.push(error);}
  if(!succeeded||errors.length)try{result?.dispose?.();}catch(error){errors.push(error);}
  if(errors.length)throw new AggregateError(failure?[failure.error,...errors]:errors,label+' cleanup failed; discard this capture.',{cause:failure?failure.error:errors[0]});
}

// PMREM's pinned fromScene path restores renderer state only on success.
// Protect caller state and our generator on failure as well. The vendor may
// allocate an output before throwing without returning it; that internal
// target is not part of this public wrapper's ownership contract.
function captureSkyEnvironment(renderer, scene, sigma, near, far) {
  const saved={target:renderer.getRenderTarget?.(),face:renderer.getActiveCubeFace?.() ?? 0,mip:renderer.getActiveMipmapLevel?.() ?? 0,
    autoClear:renderer.autoClear,toneMapping:renderer.toneMapping,xr:renderer.xr?.enabled,
    viewport:renderer.getViewport?.(new T.Vector4()),scissor:renderer.getScissor?.(new T.Vector4()),scissorTest:renderer.getScissorTest?.(),
    clearColor:renderer.getClearColor?.(new T.Color()),clearAlpha:renderer.getClearAlpha?.()};
  let pmrem=null,target=null,success=false,failure=null;
  try {
    pmrem=new T.PMREMGenerator(renderer);target=pmrem.fromScene(scene,sigma,near,far);
    if(!target?.texture?.isTexture||typeof target.dispose!=='function')throw new Error('Sky filtering did not return an owned texture target.');
    success=true;return target;
  } catch(error) {failure={error};throw error;}
  finally {
    completeRestorationCaptureCleanup(failure,[
      ()=>{if(renderer.getRenderTarget)renderer.setRenderTarget(saved.target,saved.face,saved.mip);},
      ()=>{renderer.autoClear=saved.autoClear;},()=>{renderer.toneMapping=saved.toneMapping;},
      ()=>{if(renderer.xr)renderer.xr.enabled=saved.xr;},
      ()=>{if(saved.clearColor)renderer.setClearColor?.(saved.clearColor,saved.clearAlpha);},
      ()=>{if(saved.viewport)renderer.setViewport?.(saved.viewport);},
      ()=>{if(saved.scissor)renderer.setScissor?.(saved.scissor);},
      ()=>{if(saved.scissorTest!==undefined)renderer.setScissorTest?.(saved.scissorTest);},
      ()=>pmrem?.dispose()
    ],target,success,'Sky capture');
  }
}

function weatherBackdrop() {
  return new T.Mesh(new T.SphereGeometry(3800, 24, 12), new T.ShaderMaterial({
    name: 'restoration-weather-sky', side:T.BackSide, depthWrite:false,
    uniforms: { zenith:{value:new T.Color('#0b2353')}, horizon:{value:new T.Color('#36516f')}, cloud:{value:new T.Color('#162e52')}, coverage:{value:.5} },
    vertexShader:'varying vec3 vSky; void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position.z=gl_Position.w;}',
    fragmentShader:`varying vec3 vSky;uniform vec3 zenith,horizon,cloud;uniform float coverage;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){vec3 d=normalize(vSky);float h=clamp(d.y,0.0,1.0);vec3 c=mix(horizon,zenith,pow(h,.48));
        vec2 p=d.xz/max(.16,d.y+.24);float n=.57*noise(p*3.1)+.28*noise(p*6.4)+.15*noise(p*13.0);
        float mask=smoothstep(1.0-coverage-.12,1.0-coverage+.19,n)*smoothstep(.01,.18,h);
        gl_FragColor=vec4(mix(c,cloud,mask*.68),1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  }));
}

// Construct before sanctuary cubemap baking. Call withReflectionsHidden during
// cubemap baking and AO normal rendering, then update(time) before each frame.
export function createRestorationLighting({ scene, sun, renderer, materials = {}, hallMatrix, water, puddles, sky, altarLight, altarBounce, fillLight, hemisphere } = {}, options = {}) {
  if (!scene || !sun || !renderer) throw new Error('Restoration lighting needs scene, sun, and renderer.');
  const profiles=resolveLightingProfiles(options),maxSkyEnvironments=cacheLimit(options.maxSkyEnvironments,Object.keys(profiles).length);
  const weatherGroundReflection=options.weatherGroundReflection===true;
  // With per-reference keys, snapshot controls so later caller mutation cannot
  // pair a changed direct source with an old cached environment.
  if(options.profiles)options={...options,sunDirectionByMode:Object.fromEntries(Object.entries(options.sunDirectionByMode || {}).map(([k,v])=>[k,Array.isArray(v)?[...v]:v])),sunIntensityScale:{...options.sunIntensityScale},cloudScaleByMode:{...options.cloudScaleByMode},skyRadianceByMode:{...options.skyRadianceByMode}};
  const sceneScale=options.sceneScale ?? 1;
  if(!Number.isFinite(sceneScale)||sceneScale<=0||sceneScale>20)throw new Error('Restoration scene scale must be finite and in (0, 20].');
  const baselineHall=new T.Matrix4().makeTranslation(6,0,-11).scale(vec([1.35,1.75,1.28])).multiply(new T.Matrix4().makeTranslation(-6,0,11));
  if(hallMatrix && (!hallMatrix.isMatrix4||!hallMatrix.elements.every(Number.isFinite)||Math.abs(hallMatrix.determinant())<1e-12))throw new Error('Lighting hall transform must be a finite invertible Matrix4.');
  const actualHall=hallMatrix?.clone() || baselineHall;
  // Directional radiance is scale-independent, but the shadow-camera focus
  // must follow the same physical hall. Map the original world anchor through
  // baseline hall-local coordinates rather than multiplying it about the origin.
  const shadowTarget=hallMatrix?vec([6,10,-10]).applyMatrix4(baselineHall.clone().invert()).applyMatrix4(actualHall):vec([6,10,-10]);
  const localSourceScale=sceneScale*sceneScale;
  const localIntensity=(light,value)=>(light?.isPointLight||light?.isSpotLight)?value*localSourceScale:value;
  const group = new T.Group(); group.name = 'restoration-lighting'; scene.add(group);
  const originalSky = sky || scene.children.find(o => o.isSky);
  const originalHemi = hemisphere || scene.children.find(o => o.isHemisphereLight);
  const savedScene = { environment:scene.environment, environmentIntensity:scene.environmentIntensity, fog:scene.fog?.clone(), background:scene.background, exposure:renderer.toneMappingExposure };
  const savedSun = { position:sun.position.clone(), target:sun.target.position.clone(), color:sun.color.clone(), intensity:sun.intensity, normalBias:sun.shadow.normalBias, bias:sun.shadow.bias, radius:sun.shadow.radius };
  const savedLights = [originalHemi, altarLight, altarBounce, fillLight].filter(Boolean).map(light => ({light,intensity:light.intensity,color:light.color.clone(),distance:light.distance}));
  // Similarity scaling preserves E=I/r²: local point/spot candela scales by
  // S² and cutoff distance by S. Area-light luminance and distant sources do
  // not scale. Positions/targets and actual area dimensions belong to world.
  for(const {light,distance} of savedLights)if(light.isPointLight||light.isSpotLight)light.distance=distance*sceneScale;
  const savedMaterials = [];
  for (const [name, values] of Object.entries(RESTORATION_MATERIAL_RESPONSE)) {
    const material = materials[name]; if (!material) continue;
    const before = {}; for(const key of Object.keys(values)) before[key]=material[key];
    savedMaterials.push({material,before}); Object.assign(material,values);
  }
  // Cedar is shared by floor/columns/roof: deliberately do NOT lower its global
  // roughness. The separate clearcoat is constrained to the actual floor only.
  const peers = [water,puddles].filter(Boolean);
  const floorReflector = options.floorReflection === false ? null : createSanctuaryFloorReflection({hallMatrix,textureSize:options.reflectionSize || 1536,reflectors:peers});
  if(floorReflector)scene.add(floorReflector);
  const reflectionExclusions = [floorReflector,...peers].filter(Boolean);
  const peerCallbacks = peers.map(reflector => {
    const original = reflector.onBeforeRender;
    const replacement = function(...args){return hiddenDuring([floorReflector],()=>original.apply(this,args));};
    reflector.onBeforeRender=replacement; return {reflector,original,replacement};
  });
  const waterResponse = options.waterResponse === false ? null : applyRestorationWater(water);
  const backdrop=weatherBackdrop();backdrop.name='restoration-night-rain-backdrop';backdrop.visible=false;group.add(backdrop);
  const originalSkyVisible = originalSky?.visible;
  const originalSkySun = originalSky?.material?.uniforms?.sunPosition?.value.clone();
  const skyValues={};
  for(const key of ['turbidity','rayleigh','mieCoefficient','mieDirectionalG','cloudCoverage','cloudDensity','cloudScale'])if(originalSky?.material?.uniforms?.[key])skyValues[key]=originalSky.material.uniforms[key].value;
  const weatherEnvironments = new Map();
  const practicals = (options.practicalPositions || []).map(position => {
    const light = new T.PointLight('#ffd29a',30*localSourceScale,9*sceneScale,2);light.position.fromArray(position);light.castShadow=false;group.add(light);return light;
  });
  let mode=null, profile=null, disposed=false, skyRadianceResponse=null;
  function setMode(next='sanctuary') {
    if(disposed)throw new Error('Restoration lighting was disposed.');
    if(!Object.hasOwn(profiles,next))throw new Error(`Unknown restoration lighting mode: ${next}`);
    if(mode===next)return;
    const nextProfile=profiles[next],baseMode=nextProfile.baseMode || next;
    const clearDay=nextProfile.skyFamily==='clear-day'||next==='lotusDay',warmSun=nextProfile.skyFamily==='warm-low-sun';
    if(options.syncSanctuaryEnvironment!=null && typeof options.syncSanctuaryEnvironment!=='boolean')throw new Error('Sanctuary environment synchronization must be an explicit boolean.');
    const directionInput=options.sunDirectionByMode?.[next] ?? nextProfile.direction;
    if(!Array.isArray(directionInput)||directionInput.length!==3||!directionInput.every(Number.isFinite)||Math.hypot(...directionInput)<1e-8)throw new Error('Restoration sun direction must be a finite nonzero three-vector.');
    const direction=vec(directionInput).normalize();
    // Keep cloud morphology independently reproducible during a solar-angle
    // A/B. The old exterior snapshots used .0002; the clear-bank candidate is
    // .002. Direct-sun strength, exposure and material controls are untouched;
    // visible clouds and their sky-only environment remain mutually consistent.
    const lotusCloudScale=options.cloudScaleByMode?.[next] ?? options.lotusDayCloudScale ?? .002;
    if(clearDay && (!Number.isFinite(lotusCloudScale)||lotusCloudScale<=0||lotusCloudScale>.05))throw new Error('Lotus-day cloud scale must be finite and in (0, .05].');
    const lotusRadiance=options.skyRadianceByMode?.[next] ?? options.lotusDaySkyRadiance ?? nextProfile.skyRadiance ?? 1;
    if(clearDay && (!Number.isFinite(lotusRadiance)||lotusRadiance<.01||lotusRadiance>4))throw new Error('Lotus-day sky radiance must be in [.01, 4].');
    if(options.lotusDayGroundReflection!=null && typeof options.lotusDayGroundReflection!=='boolean')throw new Error('Lotus-day ground reflection must be an explicit boolean.');
    // Stage a complete mode transition. A failed first Sky capture must not
    // label the mode as finished, suppress retries, or leave half-new lighting.
    const previous={mode,profile,environment:scene.environment,environmentIntensity:scene.environmentIntensity,fog:scene.fog,
      exposure:renderer.toneMappingExposure,shadowNeeds:renderer.shadowMap.needsUpdate,sunPosition:sun.position.clone(),sunTarget:sun.target.position.clone(),
      shadow:{normalBias:sun.shadow.normalBias,bias:sun.shadow.bias,radius:sun.shadow.radius,needsUpdate:sun.shadow.needsUpdate},
      lights:[...new Set([sun,...savedLights.map(record=>record.light),...practicals])].map(light=>({light,intensity:light.intensity,color:light.color.clone()})),
      skyVisible:originalSky?.visible,skyUniforms:originalSky?.material?.uniforms?T.UniformsUtils.clone(originalSky.material.uniforms):null,
      hadSkyRadiance:!!skyRadianceResponse,backdropVisible:backdrop.visible,backdropUniforms:T.UniformsUtils.clone(backdrop.material.uniforms),
      paperIntensity:materials.paper?.emissiveIntensity,stoneRoughness:materials.wetStone?.roughness,cacheKeys:new Set(weatherEnvironments.keys())};
    mode=next;profile=nextProfile;
    try {
    // Per-mode direct-light A/B only. No exposure or fill compensation is
    // hidden in this control. Set before the sanctuary environment capture.
    const sunScale=clamp(finite(options.sunIntensityScale?.[next] ?? options.sunIntensityScale?.[baseMode],1),.1,4);
    sun.intensity=profile.sun*sunScale;sun.color.set(profile.color);
    sun.target.position.copy(shadowTarget);sun.position.copy(sun.target.position).addScaledVector(direction,120);
    sun.shadow.normalBias=.025;sun.shadow.bias=-.000065;sun.shadow.radius=baseMode==='rain'?4:1.6;
    sun.shadow.needsUpdate=true;renderer.shadowMap.needsUpdate=true;
    if(originalHemi)originalHemi.intensity=profile.hemisphere;
    // Reduce frontal wash rather than adding a stronger fill to hide missing detail.
    if(altarLight)altarLight.intensity=localIntensity(altarLight,baseMode==='sanctuary'?108:baseMode==='night'?155:95);
    if(altarBounce)altarBounce.intensity=localIntensity(altarBounce,baseMode==='sanctuary'?2.4:baseMode==='night'?3.2:2.2);
    if(fillLight)fillLight.intensity=localIntensity(fillLight,baseMode==='sanctuary'?24:baseMode==='night'?40:22);
    for(const light of practicals)light.intensity=30*profile.practical*localSourceScale;
    if(materials.paper){if(!savedMaterials.some(s=>s.material===materials.paper))savedMaterials.push({material:materials.paper,before:{emissiveIntensity:materials.paper.emissiveIntensity}});materials.paper.emissiveIntensity=.65*profile.practical;}
    if(options.exposure!==false)renderer.toneMappingExposure=profile.exposure;
    scene.environmentIntensity=profile.environment;
    if(originalSky?.material?.uniforms){
      for(const [key,value] of Object.entries(skyValues))originalSky.material.uniforms[key].value=value;
      originalSky.material.uniforms.sunPosition?.value.copy(direction);
    }
    // Lazy installation leaves sanctuary-only sky source byte-for-byte intact.
    if(clearDay && originalSky && !skyRadianceResponse)skyRadianceResponse=applyRestorationSkyRadiance(originalSky);
    skyRadianceResponse?.setGain(clearDay?lotusRadiance:profile.skyRadiance ?? 1);
    const weather=baseMode==='night'||baseMode==='rain';
    backdrop.visible=weather;if(originalSky)originalSky.visible=weather?false:originalSkyVisible;
    if(weather){
      const u=backdrop.material.uniforms;
      u.zenith.value.set(baseMode==='night'?'#0b2353':'#8495a2');u.horizon.value.set(baseMode==='night'?'#36516f':'#bec8ca');
      u.cloud.value.set(baseMode==='night'?'#102641':'#657681');u.coverage.value=baseMode==='night'?.51:.82;
      scene.fog=new T.FogExp2(baseMode==='night'?'#152a43':'#9eafb2',baseMode==='night'?.0045:.012);
      // Backdrop-only environment capture cannot contain reflection recursion.
      if(options.weatherEnvironment!==false){
        if(!weatherEnvironments.has(next)){
          const envScene=new T.Scene(),copy=backdrop.clone();copy.visible=true;copy.material=backdrop.material.clone();envScene.add(copy);
          let ground=null;
          try {
            if(weatherGroundReflection)ground=applyRestorationWeatherGroundEnvironment(copy,{skyIrradiance:measureRestorationWeatherIrradiance(backdrop),environmentIntensity:profile.environment,sun,albedo:.12});
            const target=captureSkyEnvironment(renderer,envScene,.08,.1,6000);
            if(ground)target.texture.userData.restorationWeatherSource={mode:next,skyIrradiance:[...ground.skyIrradiance],incidentIrradiance:[...ground.incidentIrradiance],groundAlbedo:[...ground.albedo],groundRadiance:[...ground.radiance],environmentIntensity:profile.environment,sourceLimit:'Distant single-bounce diffuse boundary; no terrain occlusion, practical emission or specular ground term.'};
            weatherEnvironments.set(next,target);
          } finally {ground?.dispose();copy.material.dispose();}
        }
        scene.environment=weatherEnvironments.get(next).texture;
      }
    }else{
      scene.environment=savedScene.environment;scene.fog=savedScene.fog?.clone() || null;
      // Opt-in input-consistency A/B: the original world captured its sky before
      // this rig selected the sanctuary sun. Rebuild from the NOW-visible Sky,
      // before shadow bootstrap and the local room cube, with no gain, portal,
      // exposure, source-strength or solar-disc policy change. The latter is
      // deliberately preserved for a genuine direction-only environment test.
      if(((baseMode==='sanctuary' && options.syncSanctuaryEnvironment===true)||warmSun) && originalSky && options.weatherEnvironment!==false){
        if(!weatherEnvironments.has(next)){
          const envScene=new T.Scene(),copy=originalSky.clone();copy.visible=true;copy.material=originalSky.material.clone();envScene.add(copy);
          // Warm reference modes use their selected visible Sky. Exclude only
          // the solar disc in the environment because direct sun is shadowed.
          if(warmSun&&copy.material.uniforms.showSunDisc)copy.material.uniforms.showSunDisc.value=0;
          try{
            const target=captureSkyEnvironment(renderer,envScene,.03,.1,6000);
            target.texture.name=warmSun?`restoration-${next}-current-sky`:'restoration-sanctuary-current-sky';
            target.texture.userData.restorationSkySource={mode:next,direction:direction.toArray(),sunDisc:copy.material.uniforms.showSunDisc?.value ?? null,radiance:copy.material.uniforms.restorationSkyRadiance?.value ?? 1};
            weatherEnvironments.set(next,target);
          }finally{copy.material.dispose();}
        }
        scene.environment=weatherEnvironments.get(next).texture;
      }
      if(clearDay){
        scene.fog=new T.FogExp2('#b5c7d0',.0018);
        if(originalSky){
          const clear={turbidity:2.6,rayleigh:2.1,mieCoefficient:.0035,mieDirectionalG:.82,cloudCoverage:.23,cloudDensity:.30,cloudScale:lotusCloudScale};
          for(const [key,value] of Object.entries(clear))if(originalSky.material.uniforms[key])originalSky.material.uniforms[key].value=value;
          if(options.weatherEnvironment!==false){
            if(!weatherEnvironments.has(next)){
              const envScene=new T.Scene(),copy=originalSky.clone();copy.visible=true;copy.material=originalSky.material.clone();envScene.add(copy);
              // The separate shadowed DirectionalLight already represents the
              // sun. Do not bake its high-energy disc into unshadowed ambient
              // lighting a second time. Keep atmospheric solar scattering and
              // the visible original disc; only this environment clone omits it.
              if(copy.material.uniforms.showSunDisc)copy.material.uniforms.showSunDisc.value=0;
              const ground=options.lotusDayGroundReflection===true?applyRestorationGroundEnvironment(copy,{skyIrradiance:measureRestorationSkyIrradiance(originalSky),environmentIntensity:profile.environment,sun,albedo:.12}):null;
              try{
                const target=captureSkyEnvironment(renderer,envScene,.03,.1,6000);
                target.texture.name=next==='lotusDay'?'restoration-lotus-day-current-sky':`restoration-${next}-current-sky`;
                target.texture.userData.restorationSkySource={mode:next,direction:direction.toArray(),sunDisc:0,radiance:lotusRadiance,ground:ground?{albedo:ground.albedo,skyIrradiance:ground.skyIrradiance,incidentIrradiance:ground.incidentIrradiance,radiance:ground.radiance}:null};
                weatherEnvironments.set(next,target);
              }finally{ground?.dispose();copy.material.dispose();}
            }
            scene.environment=weatherEnvironments.get(next).texture;
          }
        }
      }
    }
    waterResponse?.setMode(profile);
    if(materials.wetStone)materials.wetStone.roughness=baseMode==='rain'?.14:.22;
    } catch(error) {
      for(const [key,target] of weatherEnvironments)if(!previous.cacheKeys.has(key)){target.dispose();weatherEnvironments.delete(key);}
      if(!previous.hadSkyRadiance&&skyRadianceResponse){skyRadianceResponse.dispose();skyRadianceResponse=null;}
      const restoreUniforms=(material,uniforms)=>{if(!uniforms)return;for(const [key,uniform] of Object.entries(uniforms)){const current=material.uniforms[key];if(!current)continue;if(current.value?.copy&&uniform.value)current.value.copy(uniform.value);else current.value=uniform.value;}};
      if(originalSky){originalSky.visible=previous.skyVisible;restoreUniforms(originalSky.material,previous.skyUniforms);}
      backdrop.visible=previous.backdropVisible;restoreUniforms(backdrop.material,previous.backdropUniforms);
      for(const {light,intensity,color} of previous.lights){light.intensity=intensity;light.color.copy(color);}
      sun.position.copy(previous.sunPosition);sun.target.position.copy(previous.sunTarget);Object.assign(sun.shadow,previous.shadow);
      scene.environment=previous.environment;scene.environmentIntensity=previous.environmentIntensity;scene.fog=previous.fog;
      renderer.toneMappingExposure=previous.exposure;renderer.shadowMap.needsUpdate=previous.shadowNeeds;
      if(materials.paper)materials.paper.emissiveIntensity=previous.paperIntensity;
      if(materials.wetStone)materials.wetStone.roughness=previous.stoneRoughness;
      mode=previous.mode;profile=previous.profile;throw error;
    }
    if(weatherEnvironments.has(next)){const target=weatherEnvironments.get(next);weatherEnvironments.delete(next);weatherEnvironments.set(next,target);}
    while(weatherEnvironments.size>maxSkyEnvironments){const oldest=weatherEnvironments.keys().next().value;const target=weatherEnvironments.get(oldest);weatherEnvironments.delete(oldest);target.dispose();}
  }
  function update(time=0) {
    if(water?.material.uniforms.time)water.material.uniforms.time.value=finite(time,0);
  }
  function dispose() {
    if(disposed)return;disposed=true;
    peerCallbacks.forEach(({reflector,original,replacement})=>{if(reflector.onBeforeRender===replacement)reflector.onBeforeRender=original;});
    waterResponse?.dispose();skyRadianceResponse?.dispose();
    savedMaterials.forEach(({material,before})=>Object.assign(material,before));
    savedLights.forEach(({light,intensity,color,distance})=>{light.intensity=intensity;light.color.copy(color);if(light.isPointLight||light.isSpotLight)light.distance=distance;});
    sun.position.copy(savedSun.position);sun.target.position.copy(savedSun.target);sun.color.copy(savedSun.color);sun.intensity=savedSun.intensity;
    sun.shadow.normalBias=savedSun.normalBias;sun.shadow.bias=savedSun.bias;sun.shadow.radius=savedSun.radius;sun.shadow.needsUpdate=true;
    if(originalSky)originalSky.visible=originalSkyVisible;
    if(originalSkySun)originalSky.material.uniforms.sunPosition.value.copy(originalSkySun);
    if(originalSky)for(const [key,value] of Object.entries(skyValues))originalSky.material.uniforms[key].value=value;
    renderer.shadowMap.needsUpdate=true;
    scene.environment=savedScene.environment;scene.environmentIntensity=savedScene.environmentIntensity;scene.fog=savedScene.fog;scene.background=savedScene.background;renderer.toneMappingExposure=savedScene.exposure;
    if(floorReflector){scene.remove(floorReflector);floorReflector.dispose();floorReflector.geometry.dispose();}
    group.removeFromParent();backdrop.geometry.dispose();backdrop.material.dispose();weatherEnvironments.forEach(target=>target.dispose());
  }
  try {setMode(options.mode || 'sanctuary');} catch(error) {dispose();throw error;}
  return {group,floorReflector,reflectionExclusions,update,setMode,dispose,hallMatrix:actualHall.clone(),withReflectionsHidden:callback=>hiddenDuring(reflectionExclusions,callback),get mode(){return mode;},get profile(){return profile;}};
}

// Optional substitute for atmospherePass, never stacked on top of it. Uses the
// existing sun shadow map: beams stop at real rafters, columns and lattice bars.
export function createRestorationScatteringPass(camera, sun, depth, options={}) {
  const pass=new ShaderPass({
    defines:{RESTORATION_SHADOW_PCF:1},
    uniforms:{tDiffuse:{value:null},tDepth:{value:depth},tShadow:{value:null},inverseProjection:{value:camera.projectionMatrixInverse},cameraWorld:{value:camera.matrixWorld},sunShadowMatrix:{value:sun.shadow.matrix},sunDirection:{value:new T.Vector3()},sunColor:{value:new T.Color()},density:{value:finite(options.density,.010)},shadowTexel:{value:new T.Vector2(1/8192,1/8192)},shadowReady:{value:0}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`#include <packing>
      uniform sampler2D tDiffuse,tDepth;
      #if RESTORATION_SHADOW_PCF == 1
        uniform highp sampler2DShadow tShadow;
      #else
        uniform sampler2D tShadow;
      #endif
      uniform mat4 inverseProjection,cameraWorld,sunShadowMatrix;
      uniform vec3 sunDirection,sunColor;uniform vec2 shadowTexel;uniform float density,shadowReady;varying vec2 vUv;
      float visibility(vec3 p){vec4 q=sunShadowMatrix*vec4(p,1.0);q.xyz/=max(q.w,.00001);
        if(any(lessThan(q.xyz,vec3(0)))||any(greaterThan(q.xyz,vec3(1))))return 0.0;
        float s=0.0;for(int j=0;j<2;j++)for(int i=0;i<2;i++){
          vec2 d=(vec2(float(i),float(j))-.5)*shadowTexel;
          #if RESTORATION_SHADOW_PCF == 1
            s+=texture(tShadow,vec3(q.xy+d,q.z-.00012));
          #else
            s+=step(q.z-.00012,texture2D(tShadow,q.xy+d).r);
          #endif
        }return s*.25;}
      void main(){vec4 base=texture2D(tDiffuse,vUv);if(shadowReady<.5){gl_FragColor=base;return;}
        float z=texture2D(tDepth,vUv).r;vec4 v=inverseProjection*vec4(vUv*2.0-1.0,z*2.0-1.0,1.0);v/=(v.w<0.0?-1.0:1.0)*max(abs(v.w),.00001);
        vec3 origin=cameraWorld[3].xyz,end=(cameraWorld*v).xyz,delta=end-origin;float rayLength=max(length(delta),.0001);
        vec3 ray=delta/rayLength;float stepLength=min(rayLength,90.0)/72.0,transmission=1.0,scatter=0.0;
        for(int i=0;i<72;i++){vec3 p=origin+ray*(float(i)+.5)*stepLength;
          float room=(1.0-smoothstep(11.0,12.2,abs(p.x-6.0)))*smoothstep(-20.5,-19.6,p.z)*(1.0-smoothstep(-2.2,-1.6,p.z));
          room*=smoothstep(6.03,6.32,p.y)*(1.0-smoothstep(16.8,17.8,p.y));
          float extinction=exp(-density*room*stepLength);
          if(room>.001)scatter+=transmission*(1.0-extinction)*visibility(p);transmission*=extinction;
        }
        float g=.24,c=dot(ray,sunDirection),phase=(1.0-g*g)/pow(max(.05,1.0+g*g-2.0*g*c),1.5);
        gl_FragColor=vec4(base.rgb*transmission+sunColor*scatter*phase*.07957747,base.a);
      }`
  });
  // ShaderPass clones uniforms, so restore these live identities explicitly.
  pass.uniforms.tDepth.value=depth;pass.uniforms.inverseProjection.value=camera.projectionMatrixInverse;pass.uniforms.cameraWorld.value=camera.matrixWorld;pass.uniforms.sunShadowMatrix.value=sun.shadow.matrix;
  pass.sync=(profile)=>{
    // r186 PCF shadows use a native comparison DepthTexture. The color
    // attachment is NOT packed shadow depth (the legacy atmosphere assumed it).
    const shadowDepth=sun.shadow.map?.depthTexture || null;
    pass.uniforms.tShadow.value=shadowDepth;pass.uniforms.shadowReady.value=shadowDepth?1:0;
    const hardwarePCF=shadowDepth?.compareFunction!=null?1:0;
    if(shadowDepth && pass.material.defines.RESTORATION_SHADOW_PCF!==hardwarePCF){
      pass.material.defines.RESTORATION_SHADOW_PCF=hardwarePCF;pass.material.needsUpdate=true;
    }
    pass.uniforms.sunDirection.value.copy(sun.position).sub(sun.target.position).normalize();pass.uniforms.sunColor.value.copy(sun.color).multiplyScalar(sun.intensity);
    pass.uniforms.shadowTexel.value.set(1/sun.shadow.mapSize.x,1/sun.shadow.mapSize.y);
    if(profile)pass.uniforms.density.value=profile.mist;
  };
  pass.sync();
  if(options.hallMatrix)pass.roomTransform=applyRestorationScatteringRoomTransform(pass,options.hallMatrix);
  return pass;
}

// Map only the bounded room mask into the actual hall/site placement. World
// depth, sun shadow coordinates and optical path length remain unchanged.
export function applyRestorationScatteringRoomTransform(pass,hallMatrix){
  const material=pass?.material,uniforms=pass?.uniforms;
  if(!material||material.uniforms!==uniforms||typeof material.fragmentShader!=='string')throw new Error('Expected restoration scattering ShaderPass.');
  if(uniforms.restorationRoomInverse)throw new Error('Room transform already installed.');
  const before=material.fragmentShader;
  const declaration='uniform mat4 inverseProjection,cameraWorld,sunShadowMatrix;';
  const mask='float room=(1.0-smoothstep(11.0,12.2,abs(p.x-6.0)))*smoothstep(-20.5,-19.6,p.z)*(1.0-smoothstep(-2.2,-1.6,p.z));\n          room*=smoothstep(6.03,6.32,p.y)*(1.0-smoothstep(16.8,17.8,p.y));';
  if(!before.includes(declaration)||!before.includes(mask))throw new Error('Pinned scattering room-mask source changed.');
  function inverseOf(actual){
    if(!actual?.isMatrix4||!actual.elements.every(Number.isFinite)||Math.abs(actual.determinant())<1e-10)throw new Error('Hall transform must be finite and invertible.');
    const e=actual.elements;if(Math.abs(e[3])+Math.abs(e[7])+Math.abs(e[11])+Math.abs(e[15]-1)>1e-10)throw new Error('Hall transform must be affine.');
    const baseline=new T.Matrix4().makeTranslation(6,0,-11).scale(new T.Vector3(1.35,1.75,1.28)).multiply(new T.Matrix4().makeTranslation(-6,0,11));
    return baseline.multiply(actual.clone().invert());
  }
  const value=inverseOf(hallMatrix);
  const after=before.replace(declaration,declaration+'uniform mat4 restorationRoomInverse;').replace(mask,'vec3 roomP=(restorationRoomInverse*vec4(p,1.0)).xyz;\n          '+mask.replaceAll('p.x','roomP.x').replaceAll('p.y','roomP.y').replaceAll('p.z','roomP.z'));
  material.fragmentShader=after;uniforms.restorationRoomInverse={value};material.needsUpdate=true;
  let disposed=false;
  return{setHallMatrix(actual){if(disposed)throw new Error('Room transform disposed.');value.copy(inverseOf(actual));},dispose(){if(disposed)return;if(material.fragmentShader!==after)throw new Error('Dispose later shader patches before the room transform.');disposed=true;material.fragmentShader=before;delete uniforms.restorationRoomInverse;material.needsUpdate=true;}};
}

// Optional, NOT applied by the rig. The legacy room shader only admits sky
// through the front portal, even after real side windows have been opened.
// This bounded solid-angle approximation admits existing indirect illumination
// through registered openings; it creates no lights and never touches direct
// sunlight, exposure, normal chunks or the original procedural material work.
export function applySanctuaryPortalVisibility(materials, apertures, options={}) {
  const transmission=clamp(finite(options.latticeTransmission,.65),0,1);
  const maximum=clamp(finite(options.maxSideVisibility,.55),0,1);
  const localEnvironments=new Set(options.localEnvironmentMaterials || []);
  const unmaskLocalDiffuse=options.unmaskLocalDiffuse ?? false;
  if(typeof unmaskLocalDiffuse!=='boolean')throw new Error('Local environment diffuse separation must be an explicit boolean.');
  // In pinned r186, RE_IndirectSpecular adds both environment specular AND
  // environment diffuse. Isolate that exact source in a separate accumulator, not a rebuilt BRDF.
  // Ambient/hemi/lightMap diffuse from the preceding call remains separate.
  const localDiffuseCall='RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );';
  let separatedLightingEnd=null;
  if(unmaskLocalDiffuse){
    const end=T.ShaderChunk.lights_fragment_end;
    if(typeof end!=='string'||end.split(localDiffuseCall).length!==2||!end.includes('RE_IndirectDiffuse( irradiance,'))throw new Error('Pinned indirect-light source separation changed.');
    const ao=T.ShaderChunk.aomap_fragment;
    if(typeof ao!=='string'||!ao.includes('float ambientOcclusion =')||!ao.includes('reflectedLight.indirectDiffuse *= ambientOcclusion;'))throw new Error('Pinned ambient-occlusion component changed.');
    separatedLightingEnd='vec3 restorationLocalEnvironmentDiffuse=vec3(0.0);\n'+end.replace(localDiffuseCall,
      'ReflectedLight restorationLocalEnvironmentLight=ReflectedLight(vec3(0.0),vec3(0.0),vec3(0.0),vec3(0.0));\n'+
      localDiffuseCall.replace('material, reflectedLight','material, restorationLocalEnvironmentLight')+
      '\nreflectedLight.indirectSpecular+=restorationLocalEnvironmentLight.indirectSpecular;\nreflectedLight.indirectDiffuse+=restorationLocalEnvironmentLight.indirectDiffuse;\nrestorationLocalEnvironmentDiffuse=restorationLocalEnvironmentLight.indirectDiffuse;');
  }
  const regions=[];
  for(const aperture of apertures || []){
    const c=aperture.worldCenter,n=aperture.worldNormal;
    const width=aperture.worldWidth,bottom=aperture.worldBottom,top=aperture.worldTop;
    if(c?.length!==3 || n?.length!==3 || ![...c,...n,width,bottom,top].every(Number.isFinite) || !(width>0 && top>bottom))throw new Error('Portal visibility requires finite actual world aperture dimensions.');
    if(Math.abs(n[0])<.999 || Math.abs(n[1])>.001 || Math.abs(n[2])>.001)throw new Error('This sanctuary portal approximation requires the registered axis-aligned side walls.');
    regions.push({x:c[0],minZ:c[2]-width*.5,maxZ:c[2]+width*.5,bottom,top,openWidth:width});
  }
  if(!regions.length)throw new Error('Portal visibility requires actual side-window openings.');
  regions.sort((a,b)=>a.x-b.x || a.bottom-b.bottom || a.top-b.top || a.minZ-b.minZ);
  const strips=[];
  for(const r of regions){
    const last=strips.at(-1);
    if(last && Math.abs(last.x-r.x)<.001 && Math.abs(last.bottom-r.bottom)<.001 && Math.abs(last.top-r.top)<.001 && r.minZ>=last.maxZ-.001 && r.minZ-last.maxZ<.25){
      last.maxZ=r.maxZ;last.openWidth+=r.openWidth;
    }else strips.push({...r});
  }
  if(strips.length>8)throw new Error('Too many separated side-window strips for this bounded sanctuary approximation.');
  const rectangles=strips.map(r=>new T.Vector4(r.x,(r.minZ+r.maxZ)*.5,r.bottom,r.top));
  const widths=strips.map(r=>new T.Vector2(r.maxZ-r.minZ,Math.min(1,r.openWidth/(r.maxZ-r.minZ))));
  const declarations=`
uniform vec4 restorationPortalRects[${strips.length}];
uniform vec2 restorationPortalWidths[${strips.length}];
uniform float restorationPortalTransmission, restorationPortalMaximum;
float restorationPortalCorner(float u,float v,float d){return atan(u*v,d*sqrt(d*d+u*u+v*v));}
float restorationSideVisibility(vec3 p,vec3 worldNormal){
  float projected=0.0;
  for(int i=0;i<${strips.length};i++){
    vec4 r=restorationPortalRects[i];vec2 extent=restorationPortalWidths[i];
    float d=max(abs(p.x-r.x),.035),u0=r.y-extent.x*.5-p.z,u1=r.y+extent.x*.5-p.z;
    float v0=r.z-p.y,v1=r.w-p.y;
    float omega=abs(restorationPortalCorner(u1,v1,d)-restorationPortalCorner(u0,v1,d)-restorationPortalCorner(u1,v0,d)+restorationPortalCorner(u0,v0,d));
    vec3 delta=vec3(r.x,(r.z+r.w)*.5,r.y)-p;
    float cosine=max(0.0,dot(worldNormal,delta/max(length(delta),.035)));
    projected+=omega*cosine*extent.y*.318309886;
  }
  return clamp(projected*restorationPortalTransmission,0.0,restorationPortalMaximum);
}
`;
  const marker='float skyVisibility=mix(1.0,portalLight,roomMask);';
  const replacement=`
vec3 restorationWorldNormal=inverseTransformDirection(normal,viewMatrix);
float restorationSideSky=restorationSideVisibility(vProc,restorationWorldNormal);
portalLight=1.0-(1.0-portalLight)*(1.0-restorationSideSky);
${marker}`;
  const inputs=Array.isArray(materials)?materials:Object.values(materials || {}),records=[];
  const uniqueMaterials=[...new Set(inputs.filter(Boolean))];
  // Validate every input before installing any callback, so rejection is atomic.
  for(const material of uniqueMaterials){
    if(!material.isMeshStandardMaterial)throw new Error('Portal visibility only accepts explicit standard/physical materials.');
    if(portalVisibilityMaterials.has(material))throw new Error('This material already has a sanctuary portal response; dispose it before replacing.');
  }
  for(const material of localEnvironments)if(!uniqueMaterials.includes(material))throw new Error('Local environment materials must be explicitly included in the portal material list.');
  const signature=JSON.stringify({strips,transmission,maximum,...(unmaskLocalDiffuse?{separateLocalDiffuse:true}:{})});
  for(const material of uniqueMaterials){
    const original=material.onBeforeCompile,originalKey=material.customProgramCacheKey;
    const record={material,original,originalKey,patched:false,localEnvironmentUnmasked:false,localDiffuseUnmasked:false};
    const callback=function(shader,renderer){
      original.call(this,shader,renderer);
      // Materials without the legacy front-portal attenuation remain unchanged.
      // New altar paper/lacquer must not be given a second occlusion multiplier.
      if(!shader.fragmentShader.includes(marker)){record.patched=false;record.localEnvironmentUnmasked=false;record.localDiffuseUnmasked=false;return;}
      shader.uniforms.restorationPortalRects={value:rectangles};
      shader.uniforms.restorationPortalWidths={value:widths};
      shader.uniforms.restorationPortalTransmission={value:transmission};
      shader.uniforms.restorationPortalMaximum={value:maximum};
      shader.fragmentShader=declarations+shader.fragmentShader.replace(marker,replacement);
      // A room capture already includes its real enclosure/occlusion. The
      // legacy outside-sky mask must not darken that specular capture again.
      // Explicit identity avoids guessing whether another envMap is local.
      record.localEnvironmentUnmasked=localEnvironments.has(material) && !!material.envMap;
      if(record.localEnvironmentUnmasked)shader.fragmentShader=checkReplace(shader.fragmentShader,
        'reflectedLight.indirectSpecular*=mix(1.0,sqrt(skyVisibility),roomMask);',
        '// Registered local environment already includes room occlusion.',
        'local environment occlusion');
      record.localDiffuseUnmasked=unmaskLocalDiffuse && record.localEnvironmentUnmasked;
      if(record.localDiffuseUnmasked){
        shader.fragmentShader=checkReplace(shader.fragmentShader,'#include <lights_fragment_end>',separatedLightingEnd,'local diffuse separation');
        // AO remains applied exactly once. Only the captured-enclosure IBL
        // component avoids the old outside-sky portal mask a second time.
        shader.fragmentShader=checkReplace(shader.fragmentShader,
          'reflectedLight.indirectDiffuse*=skyVisibility;',
          `vec3 restorationLocalDiffuseAfterAO=restorationLocalEnvironmentDiffuse;
#ifdef USE_AOMAP
restorationLocalDiffuseAfterAO*=ambientOcclusion;
#endif
reflectedLight.indirectDiffuse=reflectedLight.indirectDiffuse*skyVisibility+restorationLocalDiffuseAfterAO*(1.0-skyVisibility);`,
          'local diffuse visibility');
      }
      record.patched=true;
    };
    // The initial shadow-bootstrap compile precedes envMap assignment. Key the
    // later room-map binding independently so it cannot reuse that old program.
    const cacheKey=function(){return `${originalKey.call(this)}|restoration-portals:${signature}|local:${localEnvironments.has(material)&&!!material.envMap?1:0}`;};
    Object.assign(record,{callback,cacheKey});records.push(record);
    portalVisibilityMaterials.add(material);
    material.onBeforeCompile=callback;material.customProgramCacheKey=cacheKey;material.needsUpdate=true;
  }
  let disposed=false;
  return {strips: strips.map(r=>({...r})), records,
    dispose(){if(disposed)return;disposed=true;for(const r of records){if(r.material.onBeforeCompile===r.callback)r.material.onBeforeCompile=r.original;if(r.material.customProgramCacheKey===r.cacheKey)r.material.customProgramCacheKey=r.originalKey;portalVisibilityMaterials.delete(r.material);r.material.needsUpdate=true;}}
  };
}
export function applyRestorationPuddleResponse(puddles, { worldGeometry = null, reflectorGeometry = null } = {}) {
  if(!puddles?.isReflector)throw new Error('Puddle response needs the existing Reflector.');
  if(worldGeometry && reflectorGeometry)throw new Error('Choose worldGeometry or reflectorGeometry, not both.');
  if(reflectorGeometry){puddles.updateMatrixWorld(true);worldGeometry=reflectorGeometry.clone().applyMatrix4(puddles.matrixWorld);}
  const m=puddles.material, originalGeometry=puddles.geometry;
  const shaderBefore=m.fragmentShader;
  const marker='vec4 base = texture2DProj( tDiffuse, vUv );';
  const fresnelMarker='float f=.0204+.9796*pow(1.0-max(0.0,normalize(cameraPosition-vPuddleWorld).y),5.0);';
  if(!shaderBefore.includes(marker)||!shaderBefore.includes('vPuddleWorld')||!shaderBefore.includes(fresnelMarker))throw new Error('Pinned v10 puddle shader changed.');
  let adaptedGeometry=null;
  if(worldGeometry){
    const p=worldGeometry.attributes.position;let minY=Infinity,maxY=-Infinity;
    for(let i=0;i<p.count;i++){if(![p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite))throw new Error('Non-finite puddle vertex.');minY=Math.min(minY,p.getY(i));maxY=Math.max(maxY,p.getY(i));}
    if(!Number.isFinite(minY)||maxY-minY>.0005)throw new Error('Puddle geometry must be finite and coplanar in world XZ.');
    puddles.updateMatrixWorld(true);
    const planeY=puddles.getWorldPosition(puddles.position.clone()).y;
    if(Math.abs((minY+maxY)*.5-planeY)>.0005)throw new Error('Puddle geometry is not on the existing reflection plane.');
    adaptedGeometry=worldGeometry.clone().applyMatrix4(puddles.matrixWorld.clone().invert());
    adaptedGeometry.computeBoundingSphere();
    if(reflectorGeometry)worldGeometry.dispose();
  }
  let shader=shaderBefore.replace('varying vec3 vPuddleWorld;',`varying vec3 vPuddleWorld;
    uniform float restorationPuddleTime, restorationPuddleWetness;
    float puddleHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    vec2 puddleRipple(vec2 p){
      vec2 cell=floor(p*1.7),local=fract(p*1.7),gradient=vec2(0.0);
      for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
        vec2 n=vec2(float(i),float(j)),key=cell+n,center=vec2(puddleHash(key),puddleHash(key+17.3));
        float age=fract(restorationPuddleTime*.49+puddleHash(key+39.1));
        vec2 d=local-n-center;float r=max(length(d),.0001),wave=r-age*.68;
        float envelope=exp(-wave*wave*175.0)*(1.0-age)*(1.0-age);
        gradient+=d/r*cos(wave*51.0)*envelope*.11;
      }return gradient;
    }`);
  shader=shader.replace(marker,`vec4 rippleUv=vUv;
    vec2 ripple=puddleRipple(vPuddleWorld.xz)*restorationPuddleWetness;
    rippleUv.xy+=ripple*vec2(.0012,.0009)*rippleUv.w;
    vec4 base=texture2DProj(tDiffuse,rippleUv);`);
  // Reference 10's rings remain readable even where the reflected overcast sky
  // is nearly uniform. UV distortion alone cannot do that: the water normal
  // must also change its Fresnel response. Dry mode remains exactly flat, with
  // the existing water F0 and blend weights, not painted/emissive ring outlines.
  shader=checkReplace(shader,
    fresnelMarker,
    'vec3 puddleNormal=normalize(vec3(-ripple.x,1.0,-ripple.y));float f=.0204+.9796*pow(1.0-clamp(dot(normalize(cameraPosition-vPuddleWorld),puddleNormal),0.0,1.0),5.0);',
    'puddle Fresnel normal');
  m.fragmentShader=shader;m.uniforms.restorationPuddleTime={value:0};m.uniforms.restorationPuddleWetness={value:0};m.needsUpdate=true;
  if(adaptedGeometry)puddles.geometry=adaptedGeometry;
  let disposed=false;
  return {
    update(time,wetness=1){m.uniforms.restorationPuddleTime.value=Number.isFinite(time)?time:0;m.uniforms.restorationPuddleWetness.value=Math.max(0,Math.min(1,Number.isFinite(wetness)?wetness:0));},
    dispose(){if(disposed)return;disposed=true;m.fragmentShader=shaderBefore;delete m.uniforms.restorationPuddleTime;delete m.uniforms.restorationPuddleWetness;m.needsUpdate=true;if(adaptedGeometry){puddles.geometry=originalGeometry;adaptedGeometry.dispose();}}
  };
}

// Centers of actual luminous fixtures in the current v12 world geometry.
// Opt-in: pass the relevant subset as practicalPositions; do not enable every
// lamp for every shot. Pagoda windows come from architecture's registered hook.
export const RESTORATION_PRACTICAL_POSITIONS = Object.freeze({
  stone: Object.freeze([[-17,2.75,10],[15,2.64,7],[1.1,2.42,16],[10.9,2.42,16],[-19,2.31,-1],[18,2.53,-7],[-6,1.98,-7],[22,2.64,14]]),
  rightVeranda: Object.freeze([[22.2,4.642,-18],[22.2,4.642,-10],[22.2,4.642,-2],[22.2,4.642,6],[22.2,4.642,14]]),
  westPorch: Object.freeze([[-28.1,4.855,20]]),
  threshold: Object.freeze([[-23.5,5.16,36.7],[-23.5,5.16,40.3],[-5.5,5.16,36.7],[-5.5,5.16,40.3]]),
  sanctuary: Object.freeze([[-.345,13.62375,-14.84],[-.345,13.62375,-7.16],[12.345,13.62375,-14.84],[12.345,13.62375,-7.16]])
});

// Combine a landscape path candidate with the original puddle surface without
// deleting water patches outside that path. The path supplies local XY input
// for Reflector (world x/-z), plus its rotated rectangular replacementBounds.
// Triangle subtraction retains partial patches crossing the path boundary.
export function mergeRestorationPuddleGeometry(puddles, path) {
  if(!puddles?.isReflector || !path?.puddleGeometry?.attributes?.position || !path.replacementBounds)throw new Error('Puddle merge needs existing reflector and registered path geometry/bounds.');
  puddles.updateMatrixWorld(true);
  const planeY=puddles.getWorldPosition(new T.Vector3()).y;
  if(Math.abs(planeY-path.puddlePlaneY)>.0005)throw new Error('Path puddles are on a different reflection plane.');
  const bounds=path.replacementBounds,origin=bounds.origin,yaw=finite(bounds.yaw,0),c=Math.cos(yaw),s=Math.sin(yaw);
  const xRange=bounds.localX || [-bounds.width/2,bounds.width/2],zRange=bounds.localZ || [-bounds.length/2,bounds.length/2];
  if(![...origin,...xRange,...zRange].every(Number.isFinite) || xRange[1]<=xRange[0] || zRange[1]<=zRange[0])throw new Error('Invalid puddle replacement bounds.');
  const toWorld=puddles.matrixWorld,toLocal=toWorld.clone().invert(),result=[];
  const signed=[p=>p.x-xRange[0],p=>xRange[1]-p.x,p=>p.z-zRange[0],p=>zRange[1]-p.z];
  function vertex(position){const world=position.clone().applyMatrix4(toWorld),dx=world.x-origin[0],dz=world.z-origin[2];return{position,x:c*dx-s*dz,z:s*dx+c*dz};}
  function clip(poly, distance, keepInside){
    if(!poly.length)return[];const out=[];let previous=poly.at(-1),pd=distance(previous),pi=keepInside?pd>=0:pd<=0;
    for(const current of poly){const cd=distance(current),ci=keepInside?cd>=0:cd<=0;
      if(pi!==ci){const t=pd/(pd-cd);out.push({position:previous.position.clone().lerp(current.position,t),x:T.MathUtils.lerp(previous.x,current.x,t),z:T.MathUtils.lerp(previous.z,current.z,t)});}
      if(ci)out.push(current);previous=current;pd=cd;pi=ci;
    }return out;
  }
  function emit(poly){for(let j=1;j<poly.length-1;j++){
    const a=poly[0].position,b=poly[j].position,d=poly[j+1].position;
    if(b.clone().sub(a).cross(d.clone().sub(a)).lengthSq()<1e-16)continue;
    for(const item of [poly[0],poly[j],poly[j+1]])result.push(...item.position.toArray());
  }}
  const old=puddles.geometry,positions=old.attributes.position,oldIndices=old.index?.array,oldCount=oldIndices?.length || positions.count;
  for(let i=0;i<oldCount;i+=3){
    let remaining=[0,1,2].map(k=>vertex(new T.Vector3().fromBufferAttribute(positions,oldIndices?oldIndices[i+k]:i+k)));
    for(const distance of signed){if(!remaining.length)break;emit(clip(remaining,distance,false));remaining=clip(remaining,distance,true);}
  }
  const added=path.puddleGeometry,p=added.attributes.position,indices=added.index?.array,count=indices?.length || p.count;
  for(let i=0;i<count;i++){
    const index=indices?indices[i]:i,world=new T.Vector3(p.getX(index),path.puddlePlaneY,-p.getY(index));
    if(!world.toArray().every(Number.isFinite))throw new Error('Non-finite candidate puddle position.');
    result.push(...world.applyMatrix4(toLocal).toArray());
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(result,3));
  geometry.computeVertexNormals();geometry.computeBoundingSphere();
  geometry.userData.restorationPuddleMerge={originalTriangles:oldCount/3,candidateTriangles:count/3,resultTriangles:result.length/9,keptOutsidePath:true};
  return geometry;
}

const leafTranslucencyMaterials=new WeakSet();
const leafSrgb=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
function leafFiniteRgb(rgb){if(!Array.isArray(rgb)||rgb.length!==3||!rgb.every(v=>Number.isFinite(v)&&v>=0&&v<=.35))throw new Error('Leaf transmittance must be three finite linear coefficients in [0,.35].');return new T.Vector3(...rgb);}
function leafMeanGreen(material){const img=material.map?.image,data=img?.data;let sum=0,count=0;if(data&&data.length===img.width*img.height*4)for(let i=0;i<data.length;i+=4){if(data[i+3]<128)continue;const g=data[i+1]/255;sum+=material.map.colorSpace===T.SRGBColorSpace?leafSrgb(g):g;count++;}return Math.max(.0001,(count?sum/count:.12)*material.color.g);}
// Explicit thin-leaf transmission only, never applied to all DoubleSide surfaces.
// Preserves the existing BRDF and uses its already-shadowed source radiance.
export function applyRestorationLeafTranslucency(material,{transmittance=[.035,.12,.008],referenceGreen=null}={}){
 if(!material?.isMeshStandardMaterial||material.isMeshPhysicalMaterial||material.name!=='restoration-leaf'||material.side!==T.DoubleSide||material.metalness>.001||material.transmission>0)throw new Error('Leaf translucency accepts only explicit nonmetallic restoration-leaf materials.');
 if(leafTranslucencyMaterials.has(material))throw new Error('Leaf translucency already installed.');
 const value=leafFiniteRgb(transmittance);referenceGreen=referenceGreen??leafMeanGreen(material);if(!Number.isFinite(referenceGreen)||referenceGreen<=0||referenceGreen>1)throw new Error('Leaf reference green must be finite in (0,1].');
 const uniform={value},greenUniform={value:referenceGreen},before=material.onBeforeCompile,beforeKey=material.customProgramCacheKey;
 const marker='#include <lights_physical_pars_fragment>';
 const code=`
uniform vec3 restorationLeafTransmittance;
uniform float restorationLeafReferenceGreen;
void restorationLeafDirect(const in IncidentLight directLight,const in vec3 geometryPosition,const in vec3 geometryNormal,const in vec3 geometryViewDir,const in vec3 geometryClearcoatNormal,const in PhysicalMaterial material,inout ReflectedLight reflectedLight){
 RE_Direct_Physical(directLight,geometryPosition,geometryNormal,geometryViewDir,geometryClearcoatNormal,material,reflectedLight);
 float backCos=max(0.0,-dot(geometryNormal,directLight.direction));
 // Light color has already passed the existing directional/spot/point shadow
 // test in lights_fragment_begin. No unshadowed source is synthesized here.
 float frontFresnel=.04+.96*pow(1.0-backCos,5.0);
 vec3 albedo=clamp(material.diffuseColor,0.0,1.0);
 vec3 budget=(vec3(1.0)-albedo)*(1.0-frontFresnel);
 float vein=clamp(albedo.g/max(restorationLeafReferenceGreen,.0001),.25,1.25);
 vec3 transmitted=min(restorationLeafTransmittance*vein,budget);
 reflectedLight.directDiffuse+=directLight.color*backCos*transmitted*RECIPROCAL_PI;
}
#undef RE_Direct
#define RE_Direct restorationLeafDirect
`;
 const callback=function(shader,...args){before.call(this,shader,...args);if(!shader.fragmentShader.includes(marker))throw new Error('Pinned physical-light shader marker changed.');shader.fragmentShader=shader.fragmentShader.replace(marker,marker+code);shader.uniforms.restorationLeafTransmittance=uniform;shader.uniforms.restorationLeafReferenceGreen=greenUniform;};
 const key=function(){return beforeKey.call(this)+'|restoration-leaf-translucency-v1';};
 material.onBeforeCompile=callback;material.customProgramCacheKey=key;material.needsUpdate=true;leafTranslucencyMaterials.add(material);let disposed=false;
 return{referenceGreen,get transmittance(){return value.toArray();},setTransmittance(rgb){if(disposed)throw new Error('Leaf translucency disposed.');value.copy(leafFiniteRgb(rgb));},dispose(){if(disposed)return;disposed=true;if(material.onBeforeCompile===callback)material.onBeforeCompile=before;if(material.customProgramCacheKey===key)material.customProgramCacheKey=beforeKey;leafTranslucencyMaterials.delete(material);material.needsUpdate=true;}};
}

// A separate, explicitly assigned window material. Never make shared darkwood,
// the whole tower or every existing paper fixture emissive to imitate reference9.
export function createRestorationWindowPaper() {
  return new T.MeshStandardMaterial({name:'restoration-pagoda-window-paper',color:'#b7a080',roughness:.9,metalness:0,emissive:'#ffb354',emissiveIntensity:0,side:T.DoubleSide});
}

// Registered window exitance, not camera-attached fill. All paper panels may
// emit, but only the caller's explicit subset gets a finite shadowed source.
// A point cone is a bounded far-field proxy for a diffuse rectangular aperture;
// it does NOT claim area-source soft shadows or exact near-field irradiance.
export function createRestorationWindowLighting({scene,material,windows=[],litWindows=[]}={},options={}) {
  if(!scene?.isScene||!material?.isMeshStandardMaterial||material.name!=='restoration-pagoda-window-paper')throw new Error('Window lighting needs the dedicated registered paper material.');
  if(registeredWindowMaterials.has(material))throw new Error('Window material already has a registered lighting response.');
  if(!Array.isArray(windows)||!windows.length||!Array.isArray(litWindows)||litWindows.length>12)throw new Error('Supply actual windows and at most12 explicitly selected light apertures.');
  const profiles=resolveLightingProfiles(options),defaults={sanctuary:0,lotusDay:0,day:0,rain:.65,night:3.2};
  const radiance={...Object.fromEntries(Object.entries(profiles).map(([mode,p])=>[mode,defaults[p.baseMode || mode]])),...options.radianceByMode};
  for(const [mode,value] of Object.entries(radiance))if(!Object.hasOwn(profiles,mode)||!Number.isFinite(value)||value<0||value>8)throw new Error('Window radiance must be finite, mode-specific and in [0, 8].');
  const initialMode=options.mode || 'day';
  if(!Object.hasOwn(radiance,initialMode))throw new Error('Unknown registered window-light mode.');
  const mapSize=options.shadowMapSize ?? 512;
  if(![256,512,1024].includes(mapSize))throw new Error('Window shadow size must be256,512 or1024.');
  const records=new Map();
  for(const window of windows){
    const center=window.worldCenter,normal=window.worldNormal,width=window.worldWidth,height=window.worldHeight;
    if(center?.length!==3||normal?.length!==3||![...center,...normal,width,height].every(Number.isFinite)||width<=0||height<=0||Math.abs(Math.hypot(...normal)-1)>.001)throw new Error('Window source needs finite actual-world center, unit normal and positive dimensions.');
    if(records.has(window))throw new Error('Repeated registered window.');
    records.set(window,{window,center:vec(center),normal:vec(normal),area:width*height});
  }
  if(new Set(litWindows).size!==litWindows.length||litWindows.some(window=>!records.has(window)))throw new Error('Light apertures must be unique members of the supplied actual window array.');
  const oldIntensity=material.emissiveIntensity,group=new T.Group();group.name='restoration-registered-window-lighting';
  const sources=litWindows.map(window=>{
    const record=records.get(window),scale=Math.sqrt(record.area);
    // Geometry supplies a real exterior-side ray origin, just outside the paper
    // but behind its lattice. Do not move this light in front of wooden bars.
    const light=new T.SpotLight(material.emissive.clone(),0,1,Math.PI/3,1,2);
    light.name=`restoration-window-${window.level ?? 'x'}-${window.face ?? 'x'}-${window.bay ?? 'x'}`;
    light.position.copy(record.center);light.target.position.copy(record.center).add(record.normal);
    light.castShadow=true;light.shadow.mapSize.set(mapSize,mapSize);light.shadow.camera.near=Math.max(.002,.015*scale);
    light.shadow.bias=-.00002;light.shadow.normalBias=.002*scale;
    group.add(light,light.target);return {...record,light};
  });
  scene.add(group);registeredWindowMaterials.add(material);let mode=null,disposed=false;
  function setMode(next='day'){
    if(disposed)throw new Error('Window lighting was disposed.');
    if(!Object.hasOwn(radiance,next))throw new Error('Unknown registered window-light mode.');
    if(next===mode)return;mode=next;
    const L=radiance[next];material.emissiveIntensity=L;group.visible=L>0;
    for(const source of sources){
      // With a60-degree cone, .5*L*A never exceeds the cosine-window intensity
      // L*A*cos(theta). Its integrated flux is also below the Lambert pi*L*A.
      const intensity=.5*L*source.area;
      source.light.intensity=intensity;
      source.light.distance=L>0?Math.sqrt(intensity/.025):1;
      source.light.shadow.camera.far=Math.max(source.light.shadow.camera.near+.01,source.light.distance);
      source.light.shadow.camera.updateProjectionMatrix();source.light.shadow.needsUpdate=true;
    }
  }
  setMode(initialMode);
  return {group,sources,material,setMode,get mode(){return mode;},dispose(){if(disposed)return;disposed=true;material.emissiveIntensity=oldIntensity;for(const source of sources)source.light.dispose();registeredWindowMaterials.delete(material);group.removeFromParent();}};
}

// Synchronous HDR capture from the CURRENT fully configured physical scene.
// Call after all mode-dependent lights, paper and Sky have been selected.
// The bootstrap retains sculpture shadow casters; only the subsequent cube
// omits their surfaces. All reflection planes are hidden throughout both.
// A transmissive physical material makes pinned WebGLRenderer retain a private
// transmission target per camera ID and render depth. Keep the six probe faces
// and optional bootstrap camera stable across mode captures, independently of
// the bounded filtered-map LRU. No render target or GPU resource is created here.
const roomCaptureCameraOwners=new WeakMap();
const roomCaptureCameraStates=new WeakMap();
export function createRestorationRoomCaptureCameras({scene,renderer,bootstrapCamera=null}={}) {
  if(!scene?.isScene||!renderer?.render||!renderer?.shadowMap)throw new Error('Room camera owner requires its actual scene and renderer.');
  if(bootstrapCamera!==null&&!bootstrapCamera?.isCamera)throw new Error('Bootstrap camera must be an actual fixed camera.');
  let owners=roomCaptureCameraOwners.get(scene);
  if(!owners){owners=new WeakMap();roomCaptureCameraOwners.set(scene,owners);}
  if(owners.has(renderer))throw new Error('Reuse the existing room camera owner for this scene and renderer.');
  const probe=new T.CubeCamera(.12,140,null),bootstrap=bootstrapCamera || new T.PerspectiveCamera(60,1,.12,140);
  const ids=Object.freeze([...probe.children.map(camera=>camera.id),bootstrap.id]);
  const state={scene,renderer,probe,bootstrap,externalBootstrap:bootstrapCamera,active:false,disposed:false};
  const owner=Object.freeze({
    get cameraIds(){return ids;},get disposed(){return state.disposed;},
    dispose(){
      if(state.disposed)return;
      if(state.active)throw new Error('Cannot dispose room cameras during a capture.');
      owners.delete(state.renderer);state.probe.renderTarget=null;
      state.probe=null;state.bootstrap=null;state.externalBootstrap=null;state.scene=null;state.renderer=null;state.disposed=true;
    }
  });
  roomCaptureCameraStates.set(owner,state);owners.set(renderer,owner);return owner;
}

export function captureRestorationRoomEnvironment({scene,renderer,position,excludedObjects=[],reflectionExclusions=[],bootstrapCamera=null,captureCameras=null}={},options={}) {
  if(!scene?.isScene||!renderer?.render||!renderer?.shadowMap)throw new Error('Room capture requires a scene and renderer.');
  if(scene.overrideMaterial)throw new Error('Room capture cannot run during a material-override pass.');
  const p=position?.isVector3?position.clone():Array.isArray(position)&&position.length===3?vec(position):null;
  if(!p||!p.toArray().every(Number.isFinite))throw new Error('Room capture requires its actual-world probe position.');
  const resolution=options.resolution ?? 512,near=options.near ?? .12,far=options.far ?? 140;
  if(![128,256,512,1024].includes(resolution)||!Number.isFinite(near)||!Number.isFinite(far)||near<=0||far<=near)throw new Error('Invalid room-capture resolution or clipping interval.');
  for(const name of ['onStage','onAudit'])if(options[name]!=null&&typeof options[name]!=='function')throw new Error('Room-capture hooks must be synchronous functions.');
  const invoke=(callback,...args)=>{if(!callback)return;const value=callback(...args);if(value&&typeof value.then==='function')throw new Error('Room-capture hooks must not return promises.');};
  const reportStage=name=>invoke(options.onStage,name,{mode:options.mode || null,position:p.toArray(),resolution,near,far});
  const excluded=[...new Set(excludedObjects)],reflections=[...new Set(reflectionExclusions)];
  if([...excluded,...reflections].some(object=>!object?.isObject3D))throw new Error('Room capture exclusions must be explicit scene objects.');
  const cameraState=captureCameras===null?null:roomCaptureCameraStates.get(captureCameras);
  if(captureCameras!==null&&(!cameraState||cameraState.disposed||cameraState.scene!==scene||cameraState.renderer!==renderer))throw new Error('Room cameras must belong to this scene and renderer and remain live.');
  if(cameraState&&bootstrapCamera!==null&&bootstrapCamera!==cameraState.bootstrap)throw new Error('Reuse the fixed bootstrap camera registered with the room camera owner.');
  if(cameraState?.active)throw new Error('Recursive use of the room camera owner is not supported.');
  const saved={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace?.() ?? 0,mip:renderer.getActiveMipmapLevel?.() ?? 0,
    shadowAuto:renderer.shadowMap.autoUpdate,shadowNeeds:renderer.shadowMap.needsUpdate,autoClear:renderer.autoClear,toneMapping:renderer.toneMapping,
    xr:renderer.xr?.enabled,viewport:renderer.getViewport?.(new T.Vector4()),scissor:renderer.getScissor?.(new T.Vector4()),scissorTest:renderer.getScissorTest?.(),
    clearColor:renderer.getClearColor?.(new T.Color()),clearAlpha:renderer.getClearAlpha?.()};
  let raw=null,bootstrap=null,pmrem=null,result=null,succeeded=false,failure=null,leasedCameras=false;
  try{
    raw=new T.WebGLCubeRenderTarget(resolution,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});
    if(cameraState){cameraState.active=true;leasedCameras=true;}
    const probe=cameraState?.probe || new T.CubeCamera(near,far,raw);
    if(cameraState){
      probe.renderTarget=raw;probe.activeMipmapLevel=0;
      for(const face of probe.children){face.near=near;face.far=far;face.updateProjectionMatrix();}
    }
    probe.position.copy(p);
    bootstrap=new T.WebGLRenderTarget(8,8);
    const camera=bootstrapCamera || cameraState?.bootstrap || new T.PerspectiveCamera(60,1,near,far);
    if(cameraState&&!cameraState.externalBootstrap){camera.near=near;camera.far=far;camera.updateProjectionMatrix();}
    if(!bootstrapCamera&&!cameraState?.externalBootstrap){camera.position.copy(p).add(new T.Vector3(0,0,Math.min(8,far*.15)));camera.lookAt(p);camera.updateMatrixWorld(true);}
    scene.updateMatrixWorld(true);
    hiddenDuring(reflections,()=>{
      renderer.shadowMap.autoUpdate=true;renderer.shadowMap.needsUpdate=true;
      renderer.setRenderTarget(bootstrap);renderer.render(scene,camera);reportStage('shadow-bootstrap-complete');
      renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
      hiddenDuring(excluded,()=>{probe.update(renderer,scene);reportStage(options.mode==='sanctuary'?'sanctuary-cubemap-complete':'room-cubemap-complete');});
    });
    pmrem=new T.PMREMGenerator(renderer);result=pmrem.fromCubemap(raw.texture);
    if(!result?.texture?.isTexture||typeof result.dispose!=='function')throw new Error('Room filtering did not produce an owned texture target.');
    result.texture.name=`restoration-room-${options.mode || 'current'}`;
    result.texture.userData.restorationRoomSource={mode:options.mode || null,position:p.toArray(),resolution,near,far};
    // Borrow these live targets/cameras only during this synchronous callback.
    // The caller can retain numeric audit results, never the disposed raw cube.
    // An audit failure still restores caller state and releases the filtered map.
    invoke(options.onAudit,{scene,renderer,rawCube:raw,filtered:result,probe,mode:options.mode || null});
    succeeded=true;return result;
  }catch(error){failure={error};throw error;}
  finally{
    // Target restoration includes cube face/mip, not just its target identity.
    // Continue restoring independent fields and disposing all owned temporaries
    // if one public setter/disposal itself fails. Never return a partial result.
    completeRestorationCaptureCleanup(failure,[
      ()=>renderer.setRenderTarget(saved.target,saved.face,saved.mip),
      ()=>{renderer.shadowMap.autoUpdate=saved.shadowAuto;},()=>{renderer.shadowMap.needsUpdate=saved.shadowNeeds;},
      ()=>{renderer.autoClear=saved.autoClear;},()=>{renderer.toneMapping=saved.toneMapping;},
      ()=>{if(renderer.xr)renderer.xr.enabled=saved.xr;},
      ()=>{if(saved.clearColor)renderer.setClearColor?.(saved.clearColor,saved.clearAlpha);},
      ()=>{if(saved.viewport)renderer.setViewport?.(saved.viewport);},
      ()=>{if(saved.scissor)renderer.setScissor?.(saved.scissor);},
      ()=>{if(saved.scissorTest!==undefined)renderer.setScissorTest?.(saved.scissorTest);},
      ()=>{if(leasedCameras){cameraState.probe.renderTarget=null;cameraState.active=false;}},
      ()=>raw?.dispose(),()=>bootstrap?.dispose(),()=>pmrem?.dispose()
    ],result,succeeded,'Room capture');
  }
}

// Cache only one correctly configured local room map per immutable mode. An
// existing initial sanctuary target can be adopted, avoiding a second startup
// capture. The callback is synchronous and owns its temporary render cleanup.
export function createRestorationRoomEnvironmentCache({materials=[],capture,initial=null}={},options={}) {
  const profiles=resolveLightingProfiles(options),maxEntries=cacheLimit(options.maxEntries,Object.keys(profiles).length);
  const list=[...new Set(materials)],intensity=options.intensity ?? 1.02;
  if(!list.length||list.some(material=>!material?.isMeshStandardMaterial)||typeof capture!=='function'||!Number.isFinite(intensity)||intensity<0||intensity>4)throw new Error('Room cache needs explicit standard materials, a synchronous capture callback and bounded intensity.');
  const validate=(mode,target)=>{if(!Object.hasOwn(profiles,mode)||!target?.texture?.isTexture||typeof target.dispose!=='function')throw new Error('Room cache entries require a known mode and owned texture target.');};
  if(initial)validate(initial.mode,initial.target);
  if(list.some(material=>roomEnvironmentMaterials.has(material)))throw new Error('Material already belongs to a room environment cache.');
  // Optional identity-keyed scalar overrides preserve each private material's
  // final source response. Snapshot the caller's Map; never follow live edits.
  if(options.intensityByMaterial!=null&&!(options.intensityByMaterial instanceof Map))throw new Error('Room environment intensityByMaterial must be an explicit Map.');
  const intensityOverrides=new Map(options.intensityByMaterial || []);
  for(const [material,value] of intensityOverrides)if(!list.includes(material)||!Number.isFinite(value)||value<0||value>4)throw new Error('Room environment intensity overrides need registered material identities and finite values within [0,4].');
  const intensityFor=material=>intensityOverrides.has(material)?intensityOverrides.get(material):intensity;
  const saved=list.map(material=>({material,envMap:material.envMap,intensity:material.envMapIntensity})),cache=new Map(),ownedTextures=new Set();
  list.forEach(material=>roomEnvironmentMaterials.add(material));
  if(initial){cache.set(initial.mode,{target:initial.target,owned:initial.owned!==false});if(initial.owned!==false&&saved.some(r=>r.envMap===initial.target.texture))ownedTextures.add(initial.target.texture);}
  let mode=null,disposed=false;
  function setMode(next='sanctuary'){
    if(disposed)throw new Error('Room environment cache was disposed.');
    if(!Object.hasOwn(profiles,next))throw new Error('Unknown room environment mode.');
    if(next===mode)return cache.get(next).target;
    let entry=cache.get(next);
    if(!entry){
      const target=capture(next);
      try{validate(next,target);}catch(error){target?.dispose?.();throw error;}
      entry={target,owned:true};cache.set(next,entry);if(saved.some(r=>r.envMap===target.texture))ownedTextures.add(target.texture);
    }
    // Bind only after successful capture/filtering, so failure retains the
    // previous coherent material map, intensity and active mode.
    for(const material of list){material.envMap=entry.target.texture;material.envMapIntensity=intensityFor(material);material.needsUpdate=true;}
    mode=next;
    if(options.maxEntries!=null){cache.delete(next);cache.set(next,entry);}
    while(cache.size>maxEntries){const oldest=cache.keys().next().value,retired=cache.get(oldest);cache.delete(oldest);if(retired.owned&&![...cache.values()].some(v=>v.target===retired.target))retired.target.dispose();}
    return entry.target;
  }
  if(initial)setMode(initial.mode);
  return {setMode,get mode(){return mode;},get cachedModes(){return [...cache.keys()];},dispose(){
    if(disposed)return;disposed=true;
    const owned=new Set([...cache.values()].filter(entry=>entry.owned).map(entry=>entry.target));
    for(const record of saved){record.material.envMap=ownedTextures.has(record.envMap)?null:record.envMap;record.material.envMapIntensity=record.intensity;record.material.needsUpdate=true;roomEnvironmentMaterials.delete(record.material);}
    for(const target of owned)target.dispose();cache.clear();mode=null;
  }};
}

export function createRestorationLanternPaper() {
  return new T.MeshStandardMaterial({name:'restoration-stone-lantern-paper',color:'#c2ad89',roughness:.9,metalness:0,emissive:'#ffb354',emissiveIntensity:0,side:T.DoubleSide});
}

// One real internal point source per proven hollow chamber, never one full
// power source per face. Paper transmission is represented by the explicitly
// non-shadow-casting paper mesh; every stone/metal/wood part keeps its shadow.
// Only the two explicitly owned practical point groups use this cleanup.
// Renderer/event hooks can throw. Complete independent releases before reporting
// the original error; papers remain borrowed and are never disposed here.
function releasePracticalLanternSources(group,material,oldIntensity,sources,registered,primaryError) {
  const hasPrimary=arguments.length>=6,errors=hasPrimary?[primaryError]:[],attempt=callback=>{try{callback();}catch(error){errors.push(error);}};
  attempt(()=>{material.emissiveIntensity=oldIntensity;});
  for(const source of sources)attempt(()=>source.light.dispose());
  if(registered)attempt(()=>registeredWindowMaterials.delete(material));
  attempt(()=>group.removeFromParent());
  if(errors.length===1)throw errors[0];
  if(errors.length>1)throw new AggregateError(errors,'Practical-lantern ownership failed and cleanup reported errors.',{cause:hasPrimary?primaryError:errors[0]});
}

export function createRestorationLanternLighting({scene,material,emitters=[],litEmitters=[]}={},options={}) {
  if(!scene?.isScene||!material?.isMeshStandardMaterial||material.name!=='restoration-stone-lantern-paper')throw new Error('Stone-lantern lighting requires its dedicated paper material.');
  if(registeredWindowMaterials.has(material))throw new Error('This luminous paper already has a registered lighting response.');
  if(!Array.isArray(emitters)||!emitters.length||!Array.isArray(litEmitters)||litEmitters.length>4)throw new Error('Supply actual lantern emitters and at most4 explicitly selected point sources.');
  const asVector=value=>value?.isVector3?value.clone():Array.isArray(value)&&value.length===3?vec(value):null;
  const profiles=resolveLightingProfiles(options),defaults={sanctuary:0,day:0,lotusDay:0,rain:1,night:3.2};
  const radiance={...Object.fromEntries(Object.entries(profiles).map(([mode,p])=>[mode,defaults[p.baseMode || mode]])),...options.radianceByMode},initialMode=options.mode || 'day',mapSize=options.shadowMapSize ?? 256;
  for(const [mode,value] of Object.entries(radiance))if(!Object.hasOwn(profiles,mode)||!Number.isFinite(value)||value<0||value>8)throw new Error('Lantern radiance must be a known mode and finite within [0,8].');
  if(!Object.hasOwn(radiance,initialMode)||![128,256,512].includes(mapSize))throw new Error('Invalid lantern mode or point-shadow resolution.');
  const records=new Map();
  for(const emitter of emitters){
    const center=asVector(emitter.worldCenter);
    if(!center||!center.toArray().every(Number.isFinite)||emitter.material!==material||emitter.sourceCount!==1||!Array.isArray(emitter.windows)||emitter.windows.length!==4||records.has(emitter))throw new Error('Lantern source requires unique actual chamber metadata and exact paper identity.');
    let area=0,minimumWindowDistance=Infinity;
    for(const window of emitter.windows){
      const p=asVector(window.worldCenter),n=asVector(window.worldNormal),w=window.worldWidth,h=window.worldHeight;
      if(!p||!n||![...p,...n,w,h].every(Number.isFinite)||Math.abs(n.length()-1)>.001||w<=0||h<=0||window.paperMesh?.material!==material||window.paperMesh.castShadow!==false)throw new Error('Lantern window metadata must describe the actual transmitting paper panels.');
      const delta=p.clone().sub(center),distance=delta.dot(n);
      if(distance<=.005)throw new Error('Lantern emitter must lie inside its outward-facing window planes.');
      minimumWindowDistance=Math.min(minimumWindowDistance,distance);area+=w*h;
    }
    records.set(emitter,{emitter,center,area,minimumWindowDistance});
  }
  if(new Set(litEmitters).size!==litEmitters.length||litEmitters.some(emitter=>!records.has(emitter)))throw new Error('Selected point sources must be unique actual emitters.');
  const oldIntensity=material.emissiveIntensity,group=new T.Group();group.name='restoration-registered-stone-lantern-lighting';
  const sources=[];let mode=null,disposed=false,registered=false;
  function setMode(next='day'){
    if(disposed)throw new Error('Lantern lighting was disposed.');
    if(!Object.hasOwn(radiance,next))throw new Error('Unknown lantern-light mode.');
    if(next===mode)return;mode=next;const L=radiance[next];material.emissiveIntensity=L;group.visible=L>0;
    for(const source of sources){
      // Before the real shell/lattice blocks any rays, total point flux4*pi*I
      // is exactly the four panels' Lambert exitance pi*L*sum(area). Occlusion
      // and distance cutoff only reduce it. Area is already final-world/S².
      const intensity=.25*L*source.area;source.light.intensity=intensity;
      source.light.distance=L>0?Math.sqrt(intensity/.015):1;
      source.light.shadow.camera.far=Math.max(source.light.shadow.camera.near+.01,source.light.distance);
      source.light.shadow.camera.updateProjectionMatrix();source.light.shadow.needsUpdate=true;
    }
  }
  try{
    for(const emitter of litEmitters){
      const record=records.get(emitter),light=new T.PointLight(material.emissive.clone(),0,1,2);
      sources.push({...record,light});
      light.name=`restoration-stone-lantern-${emitter.index ?? 'registered'}`;light.position.copy(record.center);light.castShadow=true;
      light.shadow.mapSize.set(mapSize,mapSize);light.shadow.camera.near=Math.max(.001,record.minimumWindowDistance*.08);
      light.shadow.bias=-.00002;light.shadow.normalBias=record.minimumWindowDistance*.003;
      group.add(light);
    }
    scene.add(group);registeredWindowMaterials.add(material);registered=true;setMode(initialMode);
  }catch(error){disposed=true;releasePracticalLanternSources(group,material,oldIntensity,sources,registered,error);}
  return {group,sources,material,setMode,get mode(){return mode;},dispose(){if(disposed)return;disposed=true;releasePracticalLanternSources(group,material,oldIntensity,sources,registered);}};
}


// Original-reference classification, not recovered geographic sun coordinates.
// Do not call this per frame: freeze each direction from its matched still camera
// once before building Sky/PMREM/room caches. No renderer or scene mutation.
export const REFERENCE_LIGHTING_PLAN=Object.freeze([
 {reference:1,mode:'thresholdSunset',baseMode:'day',skyFamily:'warm-low-sun',sunDiscUV:[.151,.389],confidence:'high weather/visible disc; conditional world vector',evidence:'Visible left sun, warm cloud edges, backlit leaves, warm water glints; lamps visibly lit.',altitudePriorDegrees:[6,18],altitudePriorIsMeasured:false,practicals:'on',rainfall:0},
 {reference:2,mode:'verandaSunset',baseMode:'day',skyFamily:'warm-low-sun',sunDiscUV:[.101,.334],confidence:'high weather/visible disc; conditional world vector',evidence:'Visible low-left sun, fine warm cloud field, long polished-floor reflections; not uniformly orange diffuse fill.',altitudePriorDegrees:[6,18],altitudePriorIsMeasured:false,practicals:'on',rainfall:0},
 {reference:3,mode:'lotusDay',baseMode:'lotusDay',skyFamily:'clear-day',direction:[-.30,.65,.70],confidence:'high clear-day classification; current model direction, not unique photo recovery',evidence:'Blue sky and white cloud, directional warm-white illumination on bridge/front elevation, leaf translucency.',altitudePriorDegrees:[35,55],altitudePriorIsMeasured:false,practicals:'on',rainfall:0},
 {reference:4,mode:'processionDay',baseMode:'lotusDay',skyFamily:'clear-day',direction:[.48,.64,.60],confidence:'high clear-day; medium image-right incidence; provisional world azimuth',evidence:'Blue sky, sharp leaf/stair shadows, exposed front columns and right-side highlight pattern; retained wet patches without rainfall.',altitudePriorDegrees:[30,55],altitudePriorIsMeasured:false,practicals:'on',rainfall:0},
 {reference:5,mode:'pagodaDay',baseMode:'lotusDay',skyFamily:'clear-day',direction:[-.78,.60,.18],confidence:'high clear-day/one-sided facade; provisional compass direction',evidence:'Strongly lit broad facade and darker adjacent face, hard eave shadow edges, blue sky; underside stays occluded.',altitudePriorDegrees:[30,55],altitudePriorIsMeasured:false,practicals:'on',rainfall:0},
 {reference:6,mode:'sanctuary',baseMode:'sanctuary',skyFamily:'window-day',direction:[-.87,.42,-.24],confidence:'high left-window direction and physical aperture constraints; angle is the current bounded model choice',evidence:'Left apertures, diagonal shaft occlusion and floor light bands; warm reflected gold/practicals rather than frontal global fill.',altitudePriorDegrees:[20,35],altitudePriorIsMeasured:false,practicals:'on',rainfall:0},
 {reference:7,mode:'courtyardDay',baseMode:'lotusDay',skyFamily:'clear-day',direction:[.80,.60,.04],confidence:'high sunny/dry weather; medium upper-right incident light; provisional world azimuth',evidence:'Blue sky, bright right-facing tower and segmented pillar/tree illumination; no rain streaks or overcast blanket.',altitudePriorDegrees:[30,50],altitudePriorIsMeasured:false,practicals:'on',rainfall:0},
 {reference:8,mode:'overviewSunset',baseMode:'day',skyFamily:'warm-low-sun',sunDiscUV:[.080,.277],confidence:'high warm visible sun; elevated camera is essential and not represented by the legacy ground-level route',evidence:'Visible left sun over mountain silhouette, warm cloud rims, grazing roof/rail reflections from an elevated porch.',altitudePriorDegrees:[6,18],altitudePriorIsMeasured:false,practicals:'on',rainfall:0},
 {reference:9,mode:'night',baseMode:'night',skyFamily:'blue-hour',confidence:'high diffuse blue-hour and practical-dominated illumination; no photographed moon/directional solar azimuth',evidence:'Deep blue clouded sky, localized warm windows/lanterns and wet reflections; do not invent a visible moon or turn the whole building emissive.',practicals:'on',rainfall:0},
 {reference:10,mode:'rain',baseMode:'rain',skyFamily:'overcast-rain',confidence:'high active rain/overcast; solar azimuth unidentifiable from this diffuse scene',evidence:'Gray diffuse sky, rain streaks/impact rings, soaked stone/wood and bright warm practical reflections; not a golden-hour sun.',practicals:'on',rainfall:1}
].map(record=>Object.freeze({...record,...(record.direction?{direction:Object.freeze([...record.direction])}:{}),...(record.sunDiscUV?{sunDiscUV:Object.freeze([...record.sunDiscUV])}:{}),...(record.altitudePriorDegrees?{altitudePriorDegrees:Object.freeze([...record.altitudePriorDegrees])}:{})})));

export function referenceSunDirection(reference,camera=null) {
 const record=REFERENCE_LIGHTING_PLAN.find(r=>r.reference===reference);
 if(!record)throw new Error('Reference must be an integer from1 to10.');
 if(record.direction)return new T.Vector3(...record.direction).normalize();
 if(!record.sunDiscUV)return null; // No invented direct-light direction in9/10.
 if(!camera?.isPerspectiveCamera){
   const record=camera,xyz=v=>v?.isVector3?v.toArray():v;
   const p=xyz(record?.position),target=xyz(record?.target),fov=record?.fov,aspect=record?.aspect ?? 1;
   if(!Array.isArray(p)||!Array.isArray(target)||p.length!==3||target.length!==3||![...p,...target,fov,aspect].every(Number.isFinite)||fov<=0||fov>=179||aspect<=0||new T.Vector3(...p).distanceTo(new T.Vector3(...target))<1e-8)throw new Error('Visible solar disc requires a fixed PerspectiveCamera or registered position/target/fov pose.');
   camera=new T.PerspectiveCamera(fov,aspect,.1,10000);camera.position.fromArray(p);camera.lookAt(new T.Vector3(...target));
 }
 
 camera.updateWorldMatrix(true,false);
 const copy=camera.clone();copy.position.setFromMatrixPosition(camera.matrixWorld);copy.quaternion.setFromRotationMatrix(new T.Matrix4().extractRotation(camera.matrixWorld));copy.scale.set(1,1,1);copy.updateProjectionMatrix();copy.updateMatrixWorld(true);
 const [u,v]=record.sunDiscUV;
 const direction=new T.Vector3(2*u-1,1-2*v,.5).unproject(copy).sub(copy.position).normalize();
 if(!direction.toArray().every(Number.isFinite)||direction.y<=0)throw new Error('Chosen camera places photographed sun below the horizon; fix the camera/UV constraint rather than clamping solar height.');
 return direction;
}

export function buildReferenceProfileProposal(baseProfiles=RESTORATION_LIGHTING_PROFILES, cameras={}) {
 if(Array.isArray(cameras)){
  if(cameras.some(v=>!Number.isInteger(v?.reference)||v.reference<1||v.reference>10)||new Set(cameras.map(v=>v.reference)).size!==cameras.length)throw new Error('Reference view registry requires unique reference numbers from1 to10.');
  cameras=Object.fromEntries(cameras.map(view=>[view.reference,view]));
 }
 const profiles={},referenceModes={};
 for(const record of REFERENCE_LIGHTING_PLAN){
  const base=baseProfiles[record.baseMode];if(!base)throw new Error('Missing base profile: '+record.baseMode);
  const direction=referenceSunDirection(record.reference,cameras[record.reference]);
  // Existing radiometric strengths/exposure are deliberately inherited. The
  // new modes separate climate and source direction, not hide errors with gain.
  profiles[record.mode]={...base,baseMode:record.baseMode,direction:direction?direction.toArray():[...base.direction],reference:record.reference,
    skyFamily:record.skyFamily,referenceCameraSource:typeof cameras[record.reference]?.source==='string'?cameras[record.reference].source:null,referenceCameraStatus:typeof cameras[record.reference]?.status==='string'?cameras[record.reference].status:(cameras[record.reference]?.userData?.calibrationStatus ?? null),sourceDiscUV:record.sunDiscUV?[...record.sunDiscUV]:null,rainfall:record.rainfall};
  referenceModes[record.reference]=record.mode;
 }
 return {profiles,referenceModes,
  requiredIntegration:['Pass the same returned profiles table to rig, both registered paper helpers and room cache; use referenceModes with the same fixed view registry.',
   'Clear-day profiles use the calibrated analytical source/gain.42 and bounded ground, not a string-only lotusDay branch.',
   'Warm-sun profiles also capture their actual selected Sky once; never reuse an unrelated old day environment.',
   'Each immutable profile has its own source/cache identity. Do not alias reference modes back to day or update directions from the moving animation camera.',
   'Set rig.maxSkyEnvironments=3 and roomCache.maxEntries=2 explicitly; successful transitions evict least-recently-used maps, revisits recapture, failures retain current maps. These are steady-state retained-map limits, not a claim about temporary capture allocations.',
   'The visible lamps are on in sunny references too. Configure dedicated lamp radiance independently of rainfall; current daylight0 is only the old cost-control default.'],
  unchangedControls:'No proposed exposure/sun-intensity increase; no global fill or material-albedo compensation.',
  evidenceLimit:'Classification and conditional source constraints only; not pixel acceptance, exact Kelvin, geographic north, real clock time or uniquely recovered irradiance.'};
}

const registeredFlowMaterials=new WeakSet();
// Small, metric-UV surface-normal motion on explicitly registered short flows.
// This changes BRDF orientation only: no new reflection target, color, emission,
// opacity, shadow flag, geometry or background-refraction claim.
export function applyRestorationFlowNormals(flowSurfaces,options={}) {
  if(!Array.isArray(flowSurfaces)||!flowSurfaces.length)throw new Error('Flow normals require explicit actual flowSurfaces.');
  const speed=options.phaseSpeed ?? .18,maxSlope=options.maxSlope ?? .10;
  const amplitudes=options.amplitudes ?? [.0007,.0003];
  if(!Number.isFinite(speed)||speed<0||speed>1||!Number.isFinite(maxSlope)||maxSlope<0||maxSlope>Math.tan(Math.PI/30)||!Array.isArray(amplitudes)||amplitudes.length!==2||amplitudes.some(v=>!Number.isFinite(v)||v<0||v>.003))throw new Error('Flow motion needs bounded finite speed, submillimeter defaults and at most6 degrees slope.');
  const materials=[...new Set(flowSurfaces.map(surface=>surface?.material))];
  for(const surface of flowSurfaces){
    const {mesh,material}=surface||{},uv=mesh?.geometry?.getAttribute('uv'),metric=surface?.uvMetersPerUnit;
    if(!mesh?.isMesh||mesh.material!==material||!material?.isMeshPhysicalMaterial||material.name!=='restoration-short-flow-water'||material.metalness!==0||material.emissive.getHex()!==0||material.clearcoat!==0||Math.abs(material.ior-1.333)>.005||![material.roughness,material.opacity,material.ior].every(Number.isFinite)||material.roughness<0||material.roughness>1||material.opacity<0||material.opacity>1||!uv||uv.itemSize!==2||!metric?.isVector2||Math.abs(metric.x-1)>1e-6||Math.abs(metric.y-1)>1e-6)throw new Error('Flow normals require the actual named dielectric, non-emissive, uncoated metric-UV water mesh.');
    if(!uv.array.every(Number.isFinite))throw new Error('Flow UV must be finite.');
    if(registeredFlowMaterials.has(material))throw new Error('Flow material already has a registered normal response.');
  }
  const uniforms={restorationFlowOffset:{value:0},restorationFlowMaxSlope:{value:maxSlope},restorationFlowAmplitude:{value:new T.Vector2(...amplitudes)}};
  const fragment=`
vec2 restorationFlowP0=vec2(34.9065850399,44.8798950513);
vec2 restorationFlowP1=vec2(-57.1198664289,96.6643893412);
vec2 restorationFlowUv=vRestorationFlowUv-vec2(0.0,restorationFlowOffset);
float restorationFlowA=dot(restorationFlowP0,restorationFlowUv);
float restorationFlowB=dot(restorationFlowP1,restorationFlowUv);
float restorationFlowFilterA=1.0-smoothstep(.8,2.5,fwidth(restorationFlowA));
float restorationFlowFilterB=1.0-smoothstep(.8,2.5,fwidth(restorationFlowB));
vec2 restorationFlowGradient=restorationFlowAmplitude.x*cos(restorationFlowA)*restorationFlowP0*restorationFlowFilterA+restorationFlowAmplitude.y*cos(restorationFlowB)*restorationFlowP1*restorationFlowFilterB;
vec3 restorationFlowDpX=dFdx(-vViewPosition),restorationFlowDpY=dFdy(-vViewPosition);
vec2 restorationFlowUvX=dFdx(vRestorationFlowUv),restorationFlowUvY=dFdy(vRestorationFlowUv);
float restorationFlowDet=restorationFlowUvX.x*restorationFlowUvY.y-restorationFlowUvX.y*restorationFlowUvY.x;
if(abs(restorationFlowDet)>1e-10){
 vec3 restorationFlowTu=(restorationFlowDpX*restorationFlowUvY.y-restorationFlowDpY*restorationFlowUvX.y)/restorationFlowDet;
 vec3 restorationFlowTv=(-restorationFlowDpX*restorationFlowUvY.x+restorationFlowDpY*restorationFlowUvX.x)/restorationFlowDet;
 restorationFlowTu-=normal*dot(normal,restorationFlowTu);
 restorationFlowTv-=normal*dot(normal,restorationFlowTv);
 float restorationFlowGuu=dot(restorationFlowTu,restorationFlowTu),restorationFlowGuv=dot(restorationFlowTu,restorationFlowTv),restorationFlowGvv=dot(restorationFlowTv,restorationFlowTv);
 float restorationFlowMetricDet=restorationFlowGuu*restorationFlowGvv-restorationFlowGuv*restorationFlowGuv;
 if(restorationFlowMetricDet>1e-12){
  vec3 restorationFlowSurfaceGradient=(restorationFlowGradient.x*(restorationFlowGvv*restorationFlowTu-restorationFlowGuv*restorationFlowTv)+restorationFlowGradient.y*(restorationFlowGuu*restorationFlowTv-restorationFlowGuv*restorationFlowTu))/restorationFlowMetricDet;
  restorationFlowSurfaceGradient*=min(1.0,restorationFlowMaxSlope/max(length(restorationFlowSurfaceGradient),1e-6));
  normal=normalize(normal-(gl_FrontFacing?1.0:-1.0)*restorationFlowSurfaceGradient);
 }
}
`;
  const records=materials.map(material=>{
    const before=material.onBeforeCompile,beforeKey=material.customProgramCacheKey;
    const callback=function(shader,...args){
      before.call(this,shader,...args);
      shader.vertexShader='varying vec2 vRestorationFlowUv;\n'+checkReplace(shader.vertexShader,'#include <uv_vertex>','#include <uv_vertex>\nvRestorationFlowUv=uv;','flow UV');
      shader.fragmentShader='varying vec2 vRestorationFlowUv;uniform float restorationFlowOffset,restorationFlowMaxSlope;uniform vec2 restorationFlowAmplitude;\n'+checkReplace(shader.fragmentShader,'#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+fragment,'flow normal');
      Object.assign(shader.uniforms,uniforms);
    };
    const key=function(){return beforeKey.call(this)+'|restoration-metric-flow-normal-v1';};
    material.onBeforeCompile=callback;material.customProgramCacheKey=key;material.needsUpdate=true;registeredFlowMaterials.add(material);
    return{material,before,beforeKey,callback,key};
  });
  let disposed=false;
  return{materials,parameters:Object.freeze({phaseSpeed:speed,maxSlope,amplitudes:Object.freeze([...amplitudes]),wavelengthsV:Object.freeze([.14,.065]),evidence:'Metric phase-motion prior; no measured discharge or real background refraction.'}),
    // Both downstream wavelengths divide1.82m exactly (13 and28 cycles).
    // Reduce the phase on CPU, avoiding unbounded float-uniform clock drift.
    update(time=0){if(disposed)throw new Error('Flow normal response was disposed.');if(!Number.isFinite(time))throw new Error('Flow time must be finite.');uniforms.restorationFlowOffset.value=((time*speed)%1.82+1.82)%1.82;},
    dispose(){if(disposed)return;disposed=true;for(const r of records){if(r.material.onBeforeCompile===r.callback)r.material.onBeforeCompile=r.before;if(r.material.customProgramCacheKey===r.key)r.material.customProgramCacheKey=r.beforeKey;registeredFlowMaterials.delete(r.material);r.material.needsUpdate=true;}}
  };
}

// Private ownership for the two explicitly supplied altar/hanging metal keys.
// No scene traversal by name, global-gold replacement or iterative local GI.
const privateRoomMetalMaterials=new WeakSet();
export function createRestorationPrivateRoomMetals(materials) {
  const keys=['gold','oldgold'];
  if(!materials||typeof materials!=='object'||Array.isArray(materials))throw new Error('Private room metals require the explicit supplied material table.');
  for(const key of keys){
    const material=materials[key];
    if(!material?.isMeshStandardMaterial||typeof material.clone!=='function'||material.envMap!==null)throw new Error('Private '+key+' requires the original global-environment standard material.');
    if(portalVisibilityMaterials.has(material)||roomEnvironmentMaterials.has(material)||privateRoomMetalMaterials.has(material))throw new Error('Create private room metals before portal/cache registration, from original shared materials.');
  }
  if(materials.gold===materials.oldgold)throw new Error('Gold and oldgold must have distinct original ownership.');
  const records=keys.map(key=>{
    const source=materials[key],material=source.clone(),compile=source.onBeforeCompile,cacheKey=source.customProgramCacheKey;
    const callback=function(shader,renderer){compile.call(this,shader,renderer);};
    const programKey=function(){return `${cacheKey.call(this)}|restoration-private-room-metal:${key}`;};
    material.name='restoration-private-room-'+key;material.envMap=null;material.onBeforeCompile=callback;material.customProgramCacheKey=programKey;
    privateRoomMetalMaterials.add(material);
    return {key,source,material,compile,cacheKey,callback,programKey};
  });
  const localMaterials=Object.freeze(records.map(record=>record.material));
  const table=Object.freeze({...materials,...Object.fromEntries(records.map(record=>[record.key,record.material]))});
  let disposed=false,capturing=false,ownership=null;
  const active=()=>{if(disposed)throw new Error('Private room metals were disposed.');};
  const inside=(object,ancestor)=>{for(let p=object;p;p=p.parent)if(p===ancestor)return true;return false;};
  function audit(scene,roots){
    if(!scene?.isScene||!Array.isArray(roots)||!roots.length||new Set(roots).size!==roots.length||roots.some(root=>!root?.isObject3D||root===scene||!inside(root,scene)))throw new Error('Register explicit attached furnishing roots, not the whole scene.');
    for(let a=0;a<roots.length;a++)for(let b=a+1;b<roots.length;b++)if(inside(roots[a],roots[b])||inside(roots[b],roots[a]))throw new Error('Private metal owner roots must not overlap.');
    const counts=records.map(record=>({key:record.key,meshes:0,instances:0}));
    scene.traverse(object=>{
      if(!object.material)return;
      const used=Array.isArray(object.material)?object.material:[object.material],owned=roots.some(root=>inside(object,root));
      for(let i=0;i<records.length;i++){
        const record=records[i];
        if(used.includes(record.material)){
          if(!owned)throw new Error('Private room metal escaped its explicitly registered furnishing roots.');
          counts[i].meshes++;counts[i].instances+=object.isInstancedMesh?object.count:1;
        }
        if(owned&&used.includes(record.source))throw new Error('Furnishing root still uses shared '+record.key+'; pass the private material table to its builder.');
      }
    });
    if(counts.some(count=>count.meshes===0))throw new Error('Each private room metal must be used by its explicit furnishing roots.');
    return Object.freeze({rootCount:roots.length,materials:Object.freeze(counts.map(count=>Object.freeze(count)))});
  }
  function syncSurfaceParameters(){
    active();if(capturing)throw new Error('Cannot synchronize private metals during a capture.');
    for(const record of records){
      if(portalVisibilityMaterials.has(record.source)||portalVisibilityMaterials.has(record.material)||roomEnvironmentMaterials.has(record.source)||roomEnvironmentMaterials.has(record.material)||record.material.envMap!==null)throw new Error('Synchronize final surface response before portal/cache registration or local-map binding.');
      if(record.source.onBeforeCompile!==record.compile||record.source.customProgramCacheKey!==record.cacheKey)throw new Error('The original metal shader changed after private ownership was created.');
      if(record.source.envMap!==null)throw new Error('The original shared metal must retain the global scene environment.');
      if(!Number.isFinite(record.source.envMapIntensity)||record.source.envMapIntensity<0||record.source.envMapIntensity>4)throw new Error('Private metal environment intensity must remain finite within [0,4].');
    }
    for(const record of records){
      record.material.copy(record.source);
      record.material.name='restoration-private-room-'+record.key;record.material.envMap=null;
      record.material.onBeforeCompile=record.callback;record.material.customProgramCacheKey=record.programKey;record.material.needsUpdate=true;
    }
    return localMaterials;
  }
  return {
    materials:table,localMaterials,syncSurfaceParameters,
    get intensityByMaterial(){active();return new Map(localMaterials.map(material=>[material,material.envMapIntensity]));},
    registerOwners(scene,roots){active();if(capturing||ownership)throw new Error('Private metal owners are registered once, outside capture.');const result=audit(scene,roots);ownership={scene,roots:[...roots]};return result;},
    auditOwnership(){active();if(!ownership)throw new Error('Register explicit private metal owner roots first.');return audit(ownership.scene,ownership.roots);},
    withCurrentGlobalEnvironment(callback){
      active();if(capturing)throw new Error('Private room capture cannot recurse.');
      if(typeof callback!=='function'||callback.constructor?.name==='AsyncFunction')throw new Error('Private room capture requires a synchronous callback.');
      if(!ownership)throw new Error('Register explicit private metal owner roots before capture.');
      audit(ownership.scene,ownership.roots);
      const saved=localMaterials.map(material=>({material,envMap:material.envMap,intensity:material.envMapIntensity}));
      capturing=true;
      try{
        // envMap=null uses CURRENT scene.environment and scene.environmentIntensity.
        // The existing portal shader key changes local:1 -> local:0, restoring
        // outside-sky visibility only while this single room capture is made.
        for(const {material} of saved){if(material.envMap!==null){material.envMap=null;material.needsUpdate=true;}}
        const result=callback();
        if(result&&typeof result.then==='function')throw new Error('Private room capture must not return a promise.');
        return result;
      }finally{
        for(const {material,envMap,intensity} of saved){const changed=material.envMap!==envMap;material.envMap=envMap;material.envMapIntensity=intensity;if(changed)material.needsUpdate=true;}
        capturing=false;
      }
    },
    dispose(){
      if(disposed)return;if(capturing)throw new Error('Cannot dispose private metals during capture.');
      if(localMaterials.some(material=>portalVisibilityMaterials.has(material)||roomEnvironmentMaterials.has(material)))throw new Error('Dispose the room cache and portal response before their private metal materials.');
      disposed=true;ownership=null;
      for(const material of localMaterials){privateRoomMetalMaterials.delete(material);material.dispose();}
    }
  };
}

const guardedRestorationReflectors = new WeakSet();
// Optional failure boundary around the already-installed reflection/refraction
// callbacks. No extra target, render, visibility policy or successful-frame
// state change. An exception remains fatal to this frame: these public-state
// restorations do not repair private renderer stacks, context loss or a partly
// written texture. The caller must discard that frame and rebuild if necessary.
export function guardRestorationReflectionCallbacks(reflectors) {
  if(!Array.isArray(reflectors)||!reflectors.length)throw new Error('Reflection failure guard needs an explicit nonempty reflector array.');
  const list=[...new Set(reflectors)];
  if(list.some(o=>!o?.isReflector||typeof o.getRenderTarget!=='function'||typeof o.onBeforeRender!=='function'||o.onBeforeRender.constructor?.name==='AsyncFunction'))throw new Error('Reflection failure guard accepts only synchronous existing Reflectors.');
  if(list.some(o=>guardedRestorationReflectors.has(o)))throw new Error('Reflector already belongs to a failure guard.');
  let active=false,disposed=false;
  const records=list.map(reflector=>({reflector,original:reflector.onBeforeRender,replacement:null}));
  for(const record of records){
    record.replacement=function(...args){
      if(disposed)throw new Error('Reflection failure guard was disposed.');
      if(active)throw new Error('Recursive reflection callback rejected; retain the existing peer exclusions.');
      const renderer=args[0];
      if(!renderer?.xr||!renderer.shadowMap||typeof renderer.getRenderTarget!=='function'||typeof renderer.setRenderTarget!=='function'||typeof renderer.getActiveCubeFace!=='function'||typeof renderer.getActiveMipmapLevel!=='function'||typeof renderer.getCurrentViewport!=='function'||typeof renderer.state?.viewport!=='function')throw new Error('Reflection failure guard needs the pinned renderer state interface.');
      const saved={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),viewport:renderer.getCurrentViewport(new T.Vector4()),xr:renderer.xr.enabled,shadowAuto:renderer.shadowMap.autoUpdate,shadowNeeds:renderer.shadowMap.needsUpdate,autoClear:renderer.autoClear,objects:list.map(object=>({object,visible:object.visible,forceUpdate:object.forceUpdate}))};
      active=true;
      try{
        const result=record.original.apply(this,args);
        if(result&&typeof result.then==='function')throw new Error('Reflection callbacks must finish synchronously.');
        return result;
      }catch(error){
        const recoveryErrors=[],attempt=fn=>{try{fn();}catch(recoveryError){recoveryErrors.push(recoveryError);}};
        // Complete independent restorations even if a lost/invalid GL target
        // makes setRenderTarget itself throw. Never hide the primary error.
        for(const state of saved.objects){attempt(()=>{state.object.visible=state.visible;});attempt(()=>{state.object.forceUpdate=state.forceUpdate;});}
        attempt(()=>{renderer.xr.enabled=saved.xr;});
        attempt(()=>{renderer.shadowMap.autoUpdate=saved.shadowAuto;});
        attempt(()=>{renderer.shadowMap.needsUpdate=saved.shadowNeeds;});
        attempt(()=>{renderer.autoClear=saved.autoClear;});
        attempt(()=>renderer.setRenderTarget(saved.target,saved.face,saved.mip));
        attempt(()=>renderer.state.viewport(saved.viewport));
        if(recoveryErrors.length)throw new AggregateError([error,...recoveryErrors],'Reflection failed and public-state recovery was incomplete.',{cause:error});
        throw error;
      }finally{active=false;}
    };
  }
  for(const record of records){record.reflector.onBeforeRender=record.replacement;guardedRestorationReflectors.add(record.reflector);}
  return {reflectors:Object.freeze([...list]),dispose(){
    if(disposed)return;
    if(active)throw new Error('Cannot dispose a running reflection failure guard.');
    if(records.some(r=>r.reflector.onBeforeRender!==r.replacement))throw new Error('Dispose newer reflection wrappers before this failure guard.');
    for(const record of records){record.reflector.onBeforeRender=record.original;guardedRestorationReflectors.delete(record.reflector);}
    disposed=true;
  }};
}

// Cosine-weighted irradiance of this module's finite weather-source shader.
// This is a deterministic CPU transcription, not a PMREM texel read or a
// measured photographic luminance. No terrain or practical-light energy is
// silently added to the sky integral.
export function measureRestorationWeatherIrradiance(backdrop,{samples=4096}={}) {
  const material=backdrop?.material,u=material?.uniforms;
  if(material?.name!=='restoration-weather-sky'||!u||!Number.isInteger(samples)||samples<256||samples>65536)throw new Error('Weather irradiance needs the explicit weather backdrop and256–65536 samples.');
  const colors=['zenith','horizon','cloud'].map(name=>u[name]?.value?.isColor?u[name].value.toArray():null),coverage=u.coverage?.value;
  if(colors.some(c=>!c||!c.every(v=>Number.isFinite(v)&&v>=0))||!Number.isFinite(coverage)||coverage<0||coverage>1)throw new Error('Invalid weather-source radiance or coverage.');
  const fract=x=>x-Math.floor(x),hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453),mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=fract(x),fy=fract(y),sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);return mix(mix(hash(ix,iy),hash(ix+1,iy),sx),mix(hash(ix,iy+1),hash(ix+1,iy+1),sx),sy);};
  const result=[0,0,0],goldenAngle=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<samples;i++){
    const y=(i+.5)/samples,r=Math.sqrt(1-y*y),phi=i*goldenAngle,x=r*Math.cos(phi),z=r*Math.sin(phi),px=x/Math.max(.16,y+.24),pz=z/Math.max(.16,y+.24);
    const n=.57*noise(px*3.1,pz*3.1)+.28*noise(px*6.4,pz*6.4)+.15*noise(px*13,pz*13),mask=smooth(1-coverage-.12,1-coverage+.19,n)*smooth(.01,.18,y),h=Math.pow(y,.48);
    for(let c=0;c<3;c++){const base=mix(colors[1][c],colors[0][c],h),radiance=mix(base,colors[2][c],mask*.68);result[c]+=radiance*y*2*Math.PI/samples;}
  }
  return result;
}

// Environment-clone-only ground boundary for rain/blue hour. The visible sky
// remains untouched. It is a distant Lambert boundary, not local GI, wet-ground
// specular transport or an additional lamp. Its source energy is finite and
// uses the same sky and directional source that the scene currently owns.
export function applyRestorationWeatherGroundEnvironment(backdrop,{skyIrradiance,environmentIntensity,sun,albedo=.12}={}) {
  const material=backdrop?.material;
  if(material?.name!=='restoration-weather-sky'||!material.uniforms||material.uniforms.restorationGroundRadiance)throw new Error('Weather ground boundary needs an unpatched weather capture clone.');
  const rho=Array.isArray(albedo)?[...albedo]:[albedo,albedo,albedo];
  if(rho.length!==3||!rho.every(v=>Number.isFinite(v)&&v>=0&&v<=.35))throw new Error('Weather ground albedo must stay within [0, .35] per linear channel.');
  if(!Array.isArray(skyIrradiance)||skyIrradiance.length!==3||!skyIrradiance.every(v=>Number.isFinite(v)&&v>=0)||!Number.isFinite(environmentIntensity)||environmentIntensity<=0||!sun?.isDirectionalLight)throw new Error('Weather ground requires finite sky/source energy.');
  const offset=sun.position.clone().sub(sun.target.position),sunRGB=sun.color.toArray();
  if(!offset.toArray().every(Number.isFinite)||offset.lengthSq()<1e-16||!sunRGB.every(v=>Number.isFinite(v)&&v>=0)||!Number.isFinite(sun.intensity)||sun.intensity<0)throw new Error('Invalid weather ground directional source.');
  const cosine=Math.max(0,offset.normalize().y),incident=skyIrradiance.map((v,c)=>v*environmentIntensity+sunRGB[c]*sun.intensity*cosine),radiance=incident.map((v,c)=>v*rho[c]/(Math.PI*environmentIntensity));
  const before=material.fragmentShader,marker='gl_FragColor=vec4(mix(c,cloud,mask*.68),1.0);';
  const shader=checkReplace(before,marker,marker+'\nif ( d.y < 0.0 ) gl_FragColor.rgb = restorationGroundRadiance;','weather ground hemisphere');
  material.fragmentShader='uniform vec3 restorationGroundRadiance;\n'+shader;material.uniforms.restorationGroundRadiance={value:new T.Vector3(...radiance)};material.needsUpdate=true;
  let disposed=false;
  return {skyIrradiance:[...skyIrradiance],incidentIrradiance:incident,albedo:rho,radiance,dispose(){if(disposed)return;disposed=true;material.fragmentShader=before;delete material.uniforms.restorationGroundRadiance;material.needsUpdate=true;}};
}

export function createRestorationHangingLanternPaper() {
  return new T.MeshStandardMaterial({name:'restoration-hanging-lantern-paper',color:'#c2ad89',roughness:.9,metalness:0,emissive:'#ffb354',emissiveIntensity:0,side:T.DoubleSide});
}

// A bounded one-source proxy for each actual hanging-lantern cavity. This is
// not automatically installed. New selected sources must fit the scene's
// existing FOUR shadowed-point-light budget, including the stone lanterns.
// Flux equality is not directional/near-field equality: this proxy does not
// reproduce paper diffusion or area-source soft shadows.
export function createRestorationHangingLanternLighting({scene,material,emitters=[],litEmitters=[],paperMeshes=[]}={},options={}) {
  if(!scene?.isScene||!material?.isMeshStandardMaterial||material.name!=='restoration-hanging-lantern-paper'||material.side!==T.DoubleSide)throw new Error('Hanging-lantern lighting requires its dedicated double-sided paper.');
  if(!material.emissive?.isColor||!material.emissive.toArray().every(v=>Number.isFinite(v)&&v>=0)||!Number.isFinite(material.emissiveIntensity)||material.emissiveIntensity<0)throw new Error('Hanging-paper emission must be finite and nonnegative.');
  if(registeredWindowMaterials.has(material))throw new Error('This luminous paper already has registered lighting.');
  if(!Array.isArray(emitters)||!emitters.length||!Array.isArray(litEmitters)||litEmitters.length>4||!Array.isArray(paperMeshes)||!paperMeshes.length||new Set(paperMeshes).size!==paperMeshes.length)throw new Error('Supply actual chambers, selected emitters and the final committed paper meshes.');
  const allPaper=[],existingPoints=[];
  scene.traverse(o=>{if(o.isMesh&&o.material===material)allPaper.push(o);if(o.isPointLight&&o.castShadow)existingPoints.push(o);});
  if(allPaper.length!==paperMeshes.length||paperMeshes.some(o=>!allPaper.includes(o)||o.castShadow!==false))throw new Error('Only the exact committed paper surfaces must transmit the cavity source; retain shell/lattice shadows.');
  if(existingPoints.length+litEmitters.length>4)throw new Error('Hanging lanterns must replace part of the existing four shadow-point budget, not add to it.');
  const profiles=resolveLightingProfiles(options),radiance={...Object.fromEntries(Object.entries(profiles).map(([key,p])=>[key,(p.baseMode||key)==='night'?3.2:(p.baseMode||key)==='rain'?1:p.practical])),...options.radianceByMode},mode0=options.mode||'rain',mapSize=options.shadowMapSize??256;
  for(const [key,value]of Object.entries(radiance))if(!Object.hasOwn(profiles,key)||!Number.isFinite(value)||value<0||value>8)throw new Error('Hanging-paper radiance must be a known mode and within[0,8].');
  if(!Object.hasOwn(radiance,mode0)||![128,256,512].includes(mapSize))throw new Error('Invalid hanging-lantern mode or point-shadow resolution.');
  const vector=value=>value?.isVector3?value.clone():Array.isArray(value)&&value.length===3?vec(value):null,records=new Map();
  for(const emitter of emitters){
    const center=vector(emitter.chamberWorldCenter);
    if(!center||!center.toArray().every(Number.isFinite)||emitter.material!==material||emitter.sourceCount!==1||!Array.isArray(emitter.windows)||emitter.windows.length<3||emitter.windows.length>12||records.has(emitter))throw new Error('Hanging source needs one actual cavity centre and3–12 explicit paper faces.');
    let area=0,minimumWindowDistance=Infinity;
    for(const window of emitter.windows){
      const point=vector(window.surfaceWorldCenter),normal=vector(window.worldNormal),corners=Array.isArray(window.worldCorners)?window.worldCorners.map(vector):null;
      if(window.material!==material||!point||!normal||![...point,...normal].every(Number.isFinite)||Math.abs(normal.length()-1)>.001||!corners||corners.length<3||corners.length>8||corners.some(v=>!v||!v.toArray().every(Number.isFinite))||!Number.isFinite(window.worldArea)||window.worldArea<=0)throw new Error('Hanging paper needs exact material, ordered world corners, outward unit normal and real area.');
      const vectorArea=new T.Vector3();for(let i=1;i<corners.length-1;i++)vectorArea.add(corners[i].clone().sub(corners[0]).cross(corners[i+1].clone().sub(corners[0])).multiplyScalar(.5));
      const measuredArea=vectorArea.length(),scale=Math.max(Math.sqrt(measuredArea),.001),tolerance=scale*1e-5;
      if(measuredArea<=1e-10||vectorArea.clone().normalize().dot(normal)<.9999||Math.abs(measuredArea-window.worldArea)>Math.max(1e-9,measuredArea*1e-5)||corners.some(p=>Math.abs(p.clone().sub(point).dot(normal))>tolerance))throw new Error('Hanging paper area/plane/winding disagrees with its actual corners.');
      for(let i=0;i<corners.length;i++){const a=corners[(i+1)%corners.length].clone().sub(corners[i]),b=corners[(i+2)%corners.length].clone().sub(corners[(i+1)%corners.length]);if(a.cross(b).dot(normal)<-tolerance*tolerance)throw new Error('Hanging paper faces must be convex.');}
      const distance=point.clone().sub(center).dot(normal);
      if(distance<=.005)throw new Error('Hanging source must remain inside every outward paper plane.');
      area+=measuredArea;minimumWindowDistance=Math.min(minimumWindowDistance,distance);
    }
    records.set(emitter,{emitter,center,area,minimumWindowDistance});
  }
  if(new Set(litEmitters).size!==litEmitters.length||litEmitters.some(e=>!records.has(e)))throw new Error('Selected hanging emitters must be unique actual chambers.');
  const oldIntensity=material.emissiveIntensity,group=new T.Group();group.name='restoration-registered-hanging-lantern-lighting';
  const sources=[];let mode=null,disposed=false,registered=false;
  function setMode(next='rain'){
    if(disposed)throw new Error('Hanging-lantern lighting was disposed.');if(!Object.hasOwn(radiance,next))throw new Error('Unknown hanging-lantern mode.');if(next===mode)return;
    mode=next;const L=radiance[next];material.emissiveIntensity=L;group.visible=L>0;
    for(const source of sources){const I=.25*L*source.area;source.light.intensity=I;source.light.distance=L>0?Math.sqrt(I/.015):1;source.light.shadow.camera.far=Math.max(source.light.shadow.camera.near+.01,source.light.distance);source.light.shadow.camera.updateProjectionMatrix();source.light.shadow.needsUpdate=true;}
  }
  try{
    for(const emitter of litEmitters){
      const record=records.get(emitter),light=new T.PointLight(material.emissive.clone(),0,1,2);sources.push({...record,light});
      light.name=`restoration-hanging-lantern-${emitter.index??'registered'}`;light.position.copy(record.center);light.castShadow=true;light.shadow.mapSize.set(mapSize,mapSize);light.shadow.camera.near=Math.max(.001,record.minimumWindowDistance*.08);light.shadow.bias=-.00002;light.shadow.normalBias=record.minimumWindowDistance*.003;group.add(light);
    }
    scene.add(group);registeredWindowMaterials.add(material);registered=true;setMode(mode0);
  }catch(error){disposed=true;releasePracticalLanternSources(group,material,oldIntensity,sources,registered,error);}
  return{group,sources,material,setMode,get mode(){return mode;},dispose(){if(disposed)return;disposed=true;releasePracticalLanternSources(group,material,oldIntensity,sources,registered);}};
}

// Exact, borrowed clear-glass ownership for the existing room environment.
// No clones, optical adjustments, targets or lights. The altar remains the
// owner of its material; this helper only controls its local/global source.
const roomGlassMaterialOwners=new WeakSet();
export function createRestorationRoomGlassOwnership({scene,meshes=[]}={}) {
  if(!scene?.isScene||!Array.isArray(meshes)||!meshes.length||meshes.length>16||new Set(meshes).size!==meshes.length)throw new Error('Room glass needs explicit, unique attached meshes (1..16).');
  const inside=object=>{for(let p=object;p;p=p.parent)if(p===scene)return true;return false;};
  const meshRecords=meshes.map(mesh=>({mesh,material:mesh?.material}));
  const materials=[...new Set(meshRecords.map(r=>r.material))];
  const audit=()=>{
    for(const {mesh,material} of meshRecords){
      if(!mesh?.isMesh||mesh.material!==material||!inside(mesh)||mesh.castShadow!==false||mesh.receiveShadow!==true||mesh.userData.excludeFromOpaqueDepth!==true)throw new Error('Room glass requires its attached material identity, opaque-depth exclusion and receive-only shadow flags.');
      if(!material?.isMeshPhysicalMaterial||!(material.transmission>0&&material.transmission<=1)||material.metalness!==0||material.opacity!==1||material.transparent!==false||material.thickness!==0||material.side!==T.FrontSide||!material.depthTest||!material.depthWrite||material.emissive.getHex()!==0)throw new Error('Room glass ownership accepts only explicit nonemissive thin-wall physical glass.');
    }
    const known=new Set(meshes),counts=new Map(materials.map(material=>[material,0]));
    scene.traverse(object=>{
      const used=Array.isArray(object.material)?object.material:[object.material];
      for(const material of materials)if(used.includes(material)){
        if(!known.has(object))throw new Error('Room glass material escaped its explicitly registered mesh owners.');
        counts.set(material,counts.get(material)+1);
      }
    });
    return Object.freeze({meshCount:meshes.length,materialCount:materials.length,materialUses:Object.freeze(materials.map(material=>counts.get(material)))});
  };
  audit();
  for(const material of materials)if(roomGlassMaterialOwners.has(material)||roomEnvironmentMaterials.has(material)||portalVisibilityMaterials.has(material)||material.envMap!==null||!Number.isFinite(material.envMapIntensity)||material.envMapIntensity<0||material.envMapIntensity>4)throw new Error('Register unbound room glass once, before portal and environment cache binding.');
  const response=new Map(materials.map(material=>[material,material.envMapIntensity]));
  materials.forEach(material=>roomGlassMaterialOwners.add(material));
  const frozenMaterials=Object.freeze([...materials]),frozenMeshes=Object.freeze([...meshes]);
  let disposed=false,capturing=false;
  const active=()=>{if(disposed)throw new Error('Room glass ownership was disposed.');};
  return {
    materials:frozenMaterials,meshes:frozenMeshes,
    get intensityByMaterial(){active();return new Map(response);},
    auditOwnership(){active();return audit();},
    withCurrentGlobalEnvironment(callback){
      active();if(capturing)throw new Error('Room glass source boundary cannot recurse.');
      if(typeof callback!=='function'||callback.constructor?.name==='AsyncFunction')throw new Error('Room glass capture requires a synchronous callback.');
      audit();const saved=materials.map(material=>({material,envMap:material.envMap,intensity:material.envMapIntensity}));capturing=true;
      try{
        for(const {material} of saved)if(material.envMap!==null){material.envMap=null;material.needsUpdate=true;}
        const result=callback();if(result&&typeof result.then==='function')throw new Error('Room glass capture must not return a promise.');return result;
      }finally{
        for(const {material,envMap,intensity} of saved){const changed=material.envMap!==envMap;material.envMap=envMap;material.envMapIntensity=intensity;if(changed)material.needsUpdate=true;}
        capturing=false;
      }
    },
    dispose(){
      if(disposed)return;if(capturing)throw new Error('Cannot dispose room glass ownership during capture.');
      if(materials.some(material=>roomEnvironmentMaterials.has(material)||portalVisibilityMaterials.has(material)))throw new Error('Dispose room cache and portal bindings before glass ownership.');
      for(const material of materials)roomGlassMaterialOwners.delete(material);disposed=true;
      // Materials and geometry are borrowed, not disposed here.
    }
  };
}


// Explicit reference6 dark hair-category candidate, not a recovered pigment or
// uniquely identified coating. Only the sculpture emitter's oldgold key may be
// routed here. Altar/outer-scene oldgold remains unchanged. A separate optional
// factory is necessary because the old shared key conflated unlike surfaces.
export function createRestorationSculptureHairFinish(options={}) {
  if(!options||typeof options!=='object'||Array.isArray(options)||options.hypothesis!=='dark-dielectric-coating')throw new Error('Explicitly select the dark-dielectric-coating hypothesis; a photograph does not uniquely identify the finish.');
  if(Object.keys(options).some(key=>!['hypothesis','color','roughness','hallMatrix'].includes(key)))throw new Error('Hair finish only accepts the explicit hypothesis, color, roughness and actual hallMatrix.');
  const value=options.color??0x282623;
  if(!(Number.isInteger(value)&&value>=0&&value<=0xffffff)&&!value?.isColor)throw new Error('Hair color must be an sRGB integer or explicit linear Color.');
  const color=value?.isColor?value.clone():new T.Color(value),roughness=options.roughness??.58;
  if(color.toArray().some(c=>!Number.isFinite(c)||c<.002||c>.08)||!Number.isFinite(roughness)||roughness<.4||roughness>1)throw new Error('Dark hair reflectance must be linear [0.002,0.08] and roughness [0.4,1].');
  let roomInverse=null;
  if(Object.hasOwn(options,'hallMatrix')){
    const actual=options.hallMatrix;
    if(!actual?.isMatrix4||!actual.elements.every(Number.isFinite)||Math.abs(actual.determinant())<1e-10)throw new Error('Hair room source boundary needs its finite invertible actual hallMatrix.');
    const e=actual.elements;if(Math.abs(e[3])+Math.abs(e[7])+Math.abs(e[11])+Math.abs(e[15]-1)>1e-10)throw new Error('Hair hallMatrix must be affine.');
    roomInverse=new T.Matrix4().makeTranslation(6,0,-11).scale(new T.Vector3(1.35,1.75,1.28)).multiply(new T.Matrix4().makeTranslation(-6,0,11)).multiply(actual.clone().invert());
  }
  const material=new T.MeshStandardMaterial({name:'restoration-sculpture-dark-hair',color,metalness:0,roughness,emissive:0,side:T.FrontSide,transparent:false,opacity:1,depthTest:true,depthWrite:true});
  material.envMapIntensity=1;
  if(roomInverse){
    // Match only the existing hall's external-indirect source boundary. Never
    // inherit the old gold's procedural color, texture, bump, or metal BRDF.
    // applySanctuaryPortalVisibility subsequently augments this exact marker
    // and separates already-occluded local IBL from external ambient/hemi.
    const before=material.onBeforeCompile,beforeKey=material.customProgramCacheKey;
    material.onBeforeCompile=function(shader,renderer){
      before.call(this,shader,renderer);
      const vertex=checkReplace(shader.vertexShader,'#include <worldpos_vertex>',`#include <worldpos_vertex>
vec4 restorationHairWorld=vec4(transformed,1.0);
#ifdef USE_BATCHING
restorationHairWorld=batchingMatrix*restorationHairWorld;
#endif
#ifdef USE_INSTANCING
restorationHairWorld=instanceMatrix*restorationHairWorld;
#endif
vProc=(modelMatrix*restorationHairWorld).xyz;`,'hair world position');
      const fragment=checkReplace(shader.fragmentShader,'#include <aomap_fragment>',`#include <aomap_fragment>
vec3 roomProc=(restorationRoomInverse*vec4(vProc,1.0)).xyz;
float roomX=1.0-smoothstep(10.6,13.1,abs(roomProc.x-6.0));
float roomZ=smoothstep(-22.0,-19.5,roomProc.z)*(1.0-smoothstep(-2.2,1.5,roomProc.z));
float roomY=smoothstep(4.8,6.1,roomProc.y)*(1.0-smoothstep(17.5,18.9,roomProc.y));
float roomMask=roomX*roomZ*roomY;
float portalLight=mix(.22,.65,smoothstep(-17.0,-1.5,roomProc.z));
float skyVisibility=mix(1.0,portalLight,roomMask);
reflectedLight.indirectDiffuse*=skyVisibility;
reflectedLight.indirectSpecular*=mix(1.0,sqrt(skyVisibility),roomMask);`,'hair external indirect boundary');
      shader.vertexShader='varying vec3 vProc;\n'+vertex;
      shader.fragmentShader='varying vec3 vProc;uniform mat4 restorationRoomInverse;\n'+fragment;
      shader.uniforms.restorationRoomInverse={value:roomInverse};
    };
    material.customProgramCacheKey=function(){return beforeKey.call(this)+'|restoration-hair-room-source-v1';};
  }
  const initialColor=color.clone(),initialRoughness=roughness;
  const materials=Object.freeze([material]);
  let disposed=false,capturing=false,ownership=null;
  const active=()=>{if(disposed)throw new Error('Sculpture hair finish was disposed.');};
  const inside=(object,scene)=>{for(let p=object;p;p=p.parent)if(p===scene)return true;return false;};
  const surface=()=>{
    if(!material.color.equals(initialColor)||material.roughness!==initialRoughness||material.metalness!==0||material.emissive.toArray().some(c=>c!==0)||material.side!==T.FrontSide||material.transparent!==false||material.opacity!==1||!material.depthTest||!material.depthWrite||material.alphaTest!==0||material.envMapIntensity!==1||material.alphaMap!==null||material.displacementMap!==null||material.map!==null||material.normalMap!==null||material.bumpMap!==null||material.roughnessMap!==null||material.metalnessMap!==null||material.aoMap!==null||material.lightMap!==null||material.emissiveMap!==null)throw new Error('The explicit hair finish cannot silently inherit metal textures, emission or different optical parameters.');
  };
  function audit(scene,meshes){
    surface();
    if(!scene?.isScene||!Array.isArray(meshes)||!meshes.length||meshes.length>16||new Set(meshes).size!==meshes.length)throw new Error('Register 1..16 explicit sculpture hair mesh batches.');
    const known=new Set(meshes);let instances=0;
    for(const mesh of meshes){
      if(!mesh?.isMesh||mesh.material!==material||!inside(mesh,scene)||mesh.castShadow!==true||mesh.receiveShadow!==true||mesh.userData.excludeFromOpaqueDepth===true)throw new Error('Hair must remain an attached, opaque, casting and receiving exact material batch.');
      instances+=mesh.isInstancedMesh?mesh.count:1;
    }
    scene.traverse(object=>{const used=Array.isArray(object.material)?object.material:[object.material];if(used.includes(material)&&!known.has(object))throw new Error('Hair material escaped its explicit sculpture batches.');});
    return Object.freeze({meshCount:meshes.length,instances});
  }
  return {
    material,materials,
    parameters:Object.freeze({hypothesis:options.hypothesis,sourceBoundary:roomInverse?'actual-hall-external-indirect':null,colorLinear:Object.freeze(color.toArray()),roughness,metalness:0,normalIncidenceF0:.04,environmentIntensity:1,evidence:'Dark hair is a distinct visible category; coating, pigment and roughness are bounded reconstruction priors, not photometric measurements.'}),
    get intensityByMaterial(){active();return new Map([[material,1]]);},
    registerOwners(scene,meshes){
      active();if(capturing||ownership||material.envMap!==null||portalVisibilityMaterials.has(material)||roomEnvironmentMaterials.has(material))throw new Error('Register hair once before portal/cache binding.');
      const result=audit(scene,meshes);ownership={scene,meshes:[...meshes]};return result;
    },
    auditOwnership(){active();if(!ownership)throw new Error('Register explicit hair batches first.');return audit(ownership.scene,ownership.meshes);},
    withCurrentGlobalEnvironment(callback){
      active();if(capturing)throw new Error('Hair source boundary cannot recurse.');
      if(typeof callback!=='function'||callback.constructor?.name==='AsyncFunction')throw new Error('Hair capture requires a synchronous callback.');
      if(!ownership)throw new Error('Register explicit hair batches before capture.');audit(ownership.scene,ownership.meshes);
      const map=material.envMap,intensity=material.envMapIntensity;capturing=true;
      try{
        if(material.envMap!==null){material.envMap=null;material.needsUpdate=true;}
        const result=callback();if(result&&typeof result.then==='function')throw new Error('Hair capture must not return a promise.');return result;
      }finally{
        const changed=material.envMap!==map;material.envMap=map;material.envMapIntensity=intensity;if(changed)material.needsUpdate=true;capturing=false;
      }
    },
    dispose(){
      if(disposed)return;if(capturing)throw new Error('Cannot dispose hair during capture.');
      if(portalVisibilityMaterials.has(material)||roomEnvironmentMaterials.has(material))throw new Error('Dispose room cache and portal bindings before the owned hair material.');
      disposed=true;ownership=null;material.dispose();
    }
  };
}
