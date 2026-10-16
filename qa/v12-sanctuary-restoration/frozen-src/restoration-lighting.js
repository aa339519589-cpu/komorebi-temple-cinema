import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Reference-driven, opt-in lighting. No global ShaderChunk or normal changes.
// Interior reference 6: left-window sun, dark timber, selective gold glints,
// and a varnished (not metallic) floor. References 1/9/10 define other modes.
export const RESTORATION_LIGHTING_PROFILES = Object.freeze({
  sanctuary: Object.freeze({ sun: 5.0, direction: [-.87, .42, .24], color: '#ffe6c0', environment: .15, hemisphere: .18, exposure: 1.10, mist: .010, practical: .65, wet: 0 }),
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
  const m = floor.material;
  m.name = 'restoration-floor-varnish';
  m.transparent = true; m.depthWrite = false; m.depthTest = true;
  m.uniforms.floorTexel = { value: new T.Vector2(1 / textureSize, 1 / textureSize) };
  m.uniforms.floorStrength = { value: .88 };
  m.uniforms.floorOrigin = { value: new T.Vector2(floorCenter.x - 9 * scale.x, floorCenter.z) };
  m.uniforms.plankPitch = { value: .28 * scale.x };
  m.vertexShader = m.vertexShader.replace('varying vec4 vUv;', 'varying vec4 vUv; varying vec3 vFloorWorld;');
  m.vertexShader = m.vertexShader.replace('vUv = textureMatrix', 'vFloorWorld = (modelMatrix * vec4(position, 1.0)).xyz;\n vUv = textureMatrix');
  m.fragmentShader = m.fragmentShader.replace('varying vec4 vUv;', `varying vec4 vUv; varying vec3 vFloorWorld;
    uniform vec2 floorTexel, floorOrigin; uniform float floorStrength, plankPitch;`);
  m.fragmentShader = checkReplace(m.fragmentShader, 'vec4 base = texture2DProj( tDiffuse, vUv );', `
    vec2 projected = vUv.xy / max(vUv.w, .00001);
    // Small stationary grain distortion, less than a texel at the target size.
    float grain = sin(vFloorWorld.x * 61.0 + sin(vFloorWorld.z * .9) * .6);
    projected += vec2(grain * .12, sin(vFloorWorld.z * 31.0) * .035) * floorTexel;
    vec3 reflection = texture2D(tDiffuse, projected).rgb * .40;
    reflection += texture2D(tDiffuse, projected + floorTexel * vec2(.85, .28)).rgb * .15;
    reflection += texture2D(tDiffuse, projected - floorTexel * vec2(.85, .28)).rgb * .15;
    reflection += texture2D(tDiffuse, projected + floorTexel * vec2(.24, 1.15)).rgb * .15;
    reflection += texture2D(tDiffuse, projected - floorTexel * vec2(.24, 1.15)).rgb * .15;
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
    sun.intensity=profile.sun;sun.color.set(profile.color);
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
    }else{scene.environment=savedScene.environment;scene.fog=savedScene.fog?.clone() || null;}
    if(originalSky?.material?.uniforms?.sunPosition)originalSky.material.uniforms.sunPosition.value.copy(direction);
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
