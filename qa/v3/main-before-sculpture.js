import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { buildWorld } from './world.js';
import {shots,cameraPose} from './cinematography.js';
const params = new URLSearchParams(location.search),
  renderMode = params.has('render');
if (renderMode) document.body.classList.add('render');
const width = +(params.get('w') || innerWidth),
  height = +(params.get('h') || innerHeight);
const renderer = new T.WebGLRenderer({
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance'
});
renderer.setSize(width, height);
renderer.setPixelRatio(renderMode ? 1 : Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFShadowMap;
renderer.toneMapping = params.get('tone')==='agx'?T.AgXToneMapping:T.ACESFilmicToneMapping;
renderer.toneMappingExposure=Number(params.get('exposure')||1.12);
renderer.outputColorSpace = T.SRGBColorSpace;
document.body.prepend(renderer.domElement);
const world = buildWorld(renderer),
  {
    scene
  } = world;
const camera = new T.PerspectiveCamera(44, width / height, .12, 550);
const composer = new EffectComposer(renderer);
composer.renderTarget1.samples = 4;
composer.renderTarget2.samples = 4;
const rt = composer.renderTarget1;
const pass = new RenderPass(scene, camera);
composer.addPass(pass);
const previousRandom = Math.random;
let noiseSeed = 9071;
Math.random = () => {
  noiseSeed = 1664525 * noiseSeed + 1013904223 >>> 0;
  return noiseSeed / 4294967296;
};
const gtao = new GTAOPass(scene, camera, width, height);
Math.random = previousRandom;
gtao.output = GTAOPass.OUTPUT.Default;
gtao.blendIntensity = .65;
gtao.updateGtaoMaterial({
  radius: .65,
  distanceExponent: 1.4,
  thickness: 1.2,
  distanceFallOff: 1.0,
  scale: 1,
  samples: 16
});
gtao.updatePdMaterial({
  lumaPhi: 10,
  depthPhi: 2,
  normalPhi: 3,
  radius: 6,
  rings: 2,
  samples: 16
});
if (!params.has('noao')) composer.addPass(gtao);
const previousBefore = gtao._renderOverride.bind(gtao);
gtao._renderOverride = (...args) => {
  world.water.visible = false;
  world.puddles.visible = false;
  world.foliageMeshes.forEach(o=>o.visible=false);
  previousBefore(...args);
  world.foliageMeshes.forEach(o=>o.visible=true);
  const clear=renderer.autoClear;renderer.autoClear=false;renderer.setRenderTarget(gtao.normalRenderTarget);renderer.render(world.foliageNormalScene,camera);renderer.autoClear=clear;
  world.water.visible = true;
  world.puddles.visible = true;
};
const dof = new ShaderPass({
  uniforms: {
    tDiffuse: {
      value: null
    },
    tDepth: {
      value: gtao.normalRenderTarget.depthTexture
    },
    focus: {
      value: 30
    },
    aperture: {
      value: .0015
    },
    aspect: {
      value: width / height
    },
    nearClip: {
      value: camera.near
    },
    farClip: {
      value: camera.far
    }
  },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: `uniform sampler2D tDiffuse;uniform sampler2D tDepth;uniform float focus,aperture,aspect,nearClip,farClip;varying vec2 vUv;
float distanceAt(vec2 uv){float z=texture2D(tDepth,uv).x;return nearClip*farClip/(farClip-z*(farClip-nearClip));}
void main(){float z=distanceAt(vUv),blur=min(.0075,aperture*abs(z-focus)/max(1.0,z));vec4 c=texture2D(tDiffuse,vUv)*4.0;float w=4.0;for(int i=0;i<24;i++){float a=float(i)*2.3999632,r=sqrt((float(i)+.5)/24.0);vec2 uv=vUv+vec2(cos(a)/aspect,sin(a))*r*blur;float zz=distanceAt(uv);float weight=zz<z*.72?.15:1.0;c+=texture2D(tDiffuse,uv)*weight;w+=weight;}gl_FragColor=c/w;}`
});
dof.uniforms.tDepth.value = gtao.normalRenderTarget.depthTexture;
composer.addPass(dof);
const grade = new ShaderPass({
  uniforms: {
    tDiffuse: {
      value: null
    }
  },
  vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: `uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 p=(vUv-.5)*vec2(1.05,1.0);float vig=1.0-.16*dot(p,p);c.rgb*=vec3(1.035,1.005,.965)*vig;gl_FragColor=c;}`
});
composer.addPass(grade);
composer.addPass(new OutputPass());
let last=-1;
function renderAt(time){const p=cameraPose(time);camera.position.copy(p.position);camera.lookAt(p.target);camera.fov=p.fov;camera.updateProjectionMatrix();dof.uniforms.focus.value=p.position.distanceTo(p.target);dof.uniforms.aperture.value=(p.index===5?.0020:.005)*(1-p.u)+.00065;world.update(time);composer.render();renderer.shadowMap.autoUpdate=false;last=time;return{shot:p.index,position:p.position.toArray(),target:p.target.toArray()};}
function info() {
  let tris = 0,
    instances = 0,
    meshes = 0;
  scene.traverse(o => {
    if (o.isMesh) {
      meshes++;
      let n = o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3;
      tris += n * (o.isInstancedMesh ? o.count : 1);
      if (o.isInstancedMesh) instances += o.count;
    }
  });
  const gl = renderer.getContext(),
    ext = gl.getExtension('WEBGL_debug_renderer_info');
  return {
    triangles: tris,
    instances,
    meshes,
    materials: world.stats,
    gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown',
    resolution: [width, height],
    shadows: 'fixed 8192 × 8192 PCF map',
    reflectors: 2,
    procedural: true,
    scaleReference:world.scaleReference,
    cameraPolicy:"low viewpoints; sanctuary 0.65 m above floor",
    roofAudit:{rafters:world.roofAudit.length,priorWorstPenetration:Math.max(...world.roofAudit.map(x=>x.oldPenetration)),correctedMaxTopOffset:Math.max(...world.roofAudit.map(x=>x.newMaximumTopOffset))},
    shots: shots.map(s => s.name)
  };
}
renderAt(5.8);
document.getElementById('loading').remove();
window.temple = {
  ready: true,
  renderAt,
  info,
  shots,
  renderer,
  scene,
  camera,
  composer,
  gtao,
  dof
};
if (!renderMode) {
  let playing = true,
    t = 0,
    previous = performance.now();
  const input = document.getElementById('scrub'),
    label = document.getElementById('label'),
    play = document.getElementById('play');
  const audio = new Audio('/music/PerituneMaterial_Oboro.mp3');
  audio.volume = .56;
  input.addEventListener('input', () => {
    t = +input.value;
    audio.currentTime = t + 25;
    renderAt(t);
  });
  play.onclick = () => {
    playing = !playing;
    play.textContent = playing ? '暂停' : '播放';
    if (!playing) audio.pause();
  };
  document.getElementById('music').onclick = () => {
    if (audio.paused) {
      audio.currentTime = t + 25;
      audio.play();
    } else audio.pause();
  };
  function animate(now) {
    const dt = Math.min(.1, (now - previous) / 1000);
    previous = now;
    if (playing) t = (t + dt) % 70;
    renderAt(t);
    input.value = t;
    label.textContent = shots[Math.min(9,Math.floor(t / 7))].name;
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });
}
