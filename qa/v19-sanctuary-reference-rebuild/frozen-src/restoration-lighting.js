import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Reference-driven, opt-in lighting. No global ShaderChunk or normal changes.
// Interior reference 6: left-window sun, dark timber, selective gold glints,
// and a varnished (not metallic) floor. References 1/9/10 define other modes.
export const RESTORATION_LIGHTING_PROFILES = Object.freeze({
  sanctuary: Object.freeze({ sun: 5.0, direction: [-.87, .42, .24], color: '#ffe6c0', environment: .15, hemisphere: .18, exposure: 1.10, mist: .010, practical: .65, wet: 0 }),
  lotusDay: Object.freeze({ sun: 3.8, direction: [-.54, .73, .42], color: '#fff0da', environment: .34, hemisphere: .38, exposure: 1.05, mist: .0015, practical: .30, wet: 0 }),
  day: Object.freeze({ sun: 4.3, direction: [-.78, .21, .54], color: '#ffe2b8', environment: .24, hemisphere: .29, exposure: 1.08, mist: .0035, practical: .75, wet: .1 }),
  night: Object.freeze({ sun: .23, direction: [-.48, .72, .50], color: '#9db7e8', environment: .38, hemisphere: .20, exposure: 1.18, mist: .0018, practical: 1.75, wet: .55 }),
  rain: Object.freeze({ sun: .72, direction: [-.58, .72, .38], color: '#d7e2e9', environment: .55, hemisphere: .48, exposure: 1.12, mist: .004, practical: 1.0, wet: 1 })
});

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
    setMode(profile) { m.uniforms.restorationWetness.value=profile.wet; m.uniforms.restorationWaveScale.value=profile.wet > .9 ? .56 : .75; },
    dispose() { m.fragmentShader=before; delete m.uniforms.restorationWetness; delete m.uniforms.restorationWaveScale; delete m.userData.restorationWater; m.needsUpdate=true; }
  };
  m.userData.restorationWater = api;
  return api;
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
  const group = new T.Group(); group.name = 'restoration-lighting'; scene.add(group);
  const originalSky = sky || scene.children.find(o => o.isSky);
  const originalHemi = hemisphere || scene.children.find(o => o.isHemisphereLight);
  const savedScene = { environment:scene.environment, environmentIntensity:scene.environmentIntensity, fog:scene.fog?.clone(), background:scene.background, exposure:renderer.toneMappingExposure };
  const savedSun = { position:sun.position.clone(), target:sun.target.position.clone(), color:sun.color.clone(), intensity:sun.intensity, normalBias:sun.shadow.normalBias, bias:sun.shadow.bias, radius:sun.shadow.radius };
  const savedLights = [originalHemi, altarLight, altarBounce, fillLight].filter(Boolean).map(light => ({light,intensity:light.intensity,color:light.color.clone()}));
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
  for(const key of ['turbidity','rayleigh','mieCoefficient','mieDirectionalG','cloudCoverage','cloudDensity'])if(originalSky?.material?.uniforms?.[key])skyValues[key]=originalSky.material.uniforms[key].value;
  const weatherEnvironments = new Map();
  const practicals = (options.practicalPositions || []).map(position => {
    const light = new T.PointLight('#ffd29a',30,9,2);light.position.fromArray(position);light.castShadow=false;group.add(light);return light;
  });
  let mode=null, profile=null, disposed=false;
  function setMode(next='sanctuary') {
    if(disposed)throw new Error('Restoration lighting was disposed.');
    if(!RESTORATION_LIGHTING_PROFILES[next])throw new Error(`Unknown restoration lighting mode: ${next}`);
    if(mode===next)return;
    mode=next;profile=RESTORATION_LIGHTING_PROFILES[next];
    const direction=vec(profile.direction).normalize();
    // Per-mode direct-light A/B only. No exposure or fill compensation is
    // hidden in this control. Set before the sanctuary environment capture.
    const sunScale=clamp(finite(options.sunIntensityScale?.[next],1),.1,4);
    sun.intensity=profile.sun*sunScale;sun.color.set(profile.color);
    sun.target.position.set(6,10,-10);sun.position.copy(sun.target.position).addScaledVector(direction,120);
    sun.shadow.normalBias=.025;sun.shadow.bias=-.000065;sun.shadow.radius=next==='rain'?4:1.6;
    sun.shadow.needsUpdate=true;renderer.shadowMap.needsUpdate=true;
    if(originalHemi)originalHemi.intensity=profile.hemisphere;
    // Reduce frontal wash rather than adding a stronger fill to hide missing detail.
    if(altarLight)altarLight.intensity=next==='sanctuary'?108:next==='night'?155:95;
    if(altarBounce)altarBounce.intensity=next==='sanctuary'?2.4:next==='night'?3.2:2.2;
    if(fillLight)fillLight.intensity=next==='sanctuary'?24:next==='night'?40:22;
    for(const light of practicals)light.intensity=30*profile.practical;
    if(materials.paper){if(!savedMaterials.some(s=>s.material===materials.paper))savedMaterials.push({material:materials.paper,before:{emissiveIntensity:materials.paper.emissiveIntensity}});materials.paper.emissiveIntensity=.65*profile.practical;}
    if(options.exposure!==false)renderer.toneMappingExposure=profile.exposure;
    scene.environmentIntensity=profile.environment;
    if(originalSky?.material?.uniforms){
      for(const [key,value] of Object.entries(skyValues))originalSky.material.uniforms[key].value=value;
      originalSky.material.uniforms.sunPosition?.value.copy(direction);
    }
    const weather=next==='night'||next==='rain';
    backdrop.visible=weather;if(originalSky)originalSky.visible=weather?false:originalSkyVisible;
    if(weather){
      const u=backdrop.material.uniforms;
      u.zenith.value.set(next==='night'?'#0b2353':'#8495a2');u.horizon.value.set(next==='night'?'#36516f':'#bec8ca');
      u.cloud.value.set(next==='night'?'#102641':'#657681');u.coverage.value=next==='night'?.51:.82;
      scene.fog=new T.FogExp2(next==='night'?'#152a43':'#9eafb2',next==='night'?.0045:.012);
      // Backdrop-only environment capture cannot contain reflection recursion.
      if(options.weatherEnvironment!==false){
        if(!weatherEnvironments.has(next)){
          const envScene=new T.Scene(),copy=backdrop.clone();copy.visible=true;copy.material=backdrop.material.clone();envScene.add(copy);
          const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromScene(envScene,.08,.1,6000);
          weatherEnvironments.set(next,target);copy.material.dispose();pmrem.dispose();
        }
        scene.environment=weatherEnvironments.get(next).texture;
      }
    }else{
      scene.environment=savedScene.environment;scene.fog=savedScene.fog?.clone() || null;
      if(next==='lotusDay'){
        scene.fog=new T.FogExp2('#b5c7d0',.0018);
        if(originalSky){
          const clear={turbidity:2.6,rayleigh:2.1,mieCoefficient:.0035,mieDirectionalG:.82,cloudCoverage:.23,cloudDensity:.30};
          for(const [key,value] of Object.entries(clear))if(originalSky.material.uniforms[key])originalSky.material.uniforms[key].value=value;
          if(options.weatherEnvironment!==false){
            if(!weatherEnvironments.has(next)){
              const envScene=new T.Scene(),copy=originalSky.clone();copy.visible=true;copy.material=originalSky.material.clone();envScene.add(copy);
              const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromScene(envScene,.03,.1,6000);
              weatherEnvironments.set(next,target);copy.material.dispose();pmrem.dispose();
            }
            scene.environment=weatherEnvironments.get(next).texture;
          }
        }
      }
    }
    waterResponse?.setMode(profile);
    if(materials.wetStone)materials.wetStone.roughness=next==='rain'?.14:.22;
  }
  function update(time=0) {
    if(water?.material.uniforms.time)water.material.uniforms.time.value=finite(time,0);
  }
  function dispose() {
    if(disposed)return;disposed=true;
    peerCallbacks.forEach(({reflector,original,replacement})=>{if(reflector.onBeforeRender===replacement)reflector.onBeforeRender=original;});
    waterResponse?.dispose();
    savedMaterials.forEach(({material,before})=>Object.assign(material,before));
    savedLights.forEach(({light,intensity,color})=>{light.intensity=intensity;light.color.copy(color);});
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
  setMode(options.mode || 'sanctuary');
  return {group,floorReflector,reflectionExclusions,update,setMode,dispose,withReflectionsHidden:callback=>hiddenDuring(reflectionExclusions,callback),get mode(){return mode;},get profile(){return profile;}};
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
  pass.sync();return pass;
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
  const signature=JSON.stringify({strips,transmission,maximum});
  for(const material of uniqueMaterials){
    const original=material.onBeforeCompile,originalKey=material.customProgramCacheKey;
    const record={material,original,originalKey,patched:false,localEnvironmentUnmasked:false};
    const callback=function(shader,renderer){
      original.call(this,shader,renderer);
      // Materials without the legacy front-portal attenuation remain unchanged.
      // New altar paper/lacquer must not be given a second occlusion multiplier.
      if(!shader.fragmentShader.includes(marker)){record.patched=false;record.localEnvironmentUnmasked=false;return;}
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
