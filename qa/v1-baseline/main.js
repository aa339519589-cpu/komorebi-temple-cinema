import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { buildWorld } from './world.js';
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
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
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
  previousBefore(...args);
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
const shots = [{
  name: '灯下初见 · Lantern threshold',
  from: [-17.3, 3.6, 13.4],
  to: [-18.5, 6.8, 29],
  look0: [-17, 3.0, 10],
  look1: [-.7, 10.5, -9],
  fov: 44
}, {
  name: '廊下夕照 · The veranda',
  from: [20.6, 3.8, 7],
  to: [20.2, 6.5, 23],
  look0: [22.2, 4.65, 6],
  look1: [-.2, 8, -10],
  fov: 48
}, {
  name: '莲上清光 · Lotus water',
  from: [-1.4, 1.25, 15.9],
  to: [-9.5, 4.8, 28],
  look0: [-1, 1.1, 12],
  look1: [1.8, 8.4, -7],
  fov: 46
}, {
  name: '入殿 · The approach',
  from: [6, 2.65, 7.1],
  to: [6, 5.2, 23],
  look0: [6, 1.25, 3.2],
  look1: [6, 6.9, -10],
  fov: 43
}, {
  name: '檐间千重 · Under the eaves',
  from: [-8.6, 16.2, -10.1],
  to: [-.8, 12.5, 14],
  look0: [-12.8, 16.2, -14.5],
  look1: [-12.8, 15.5, -14.5],
  fov: 43
}, {
  name: '金色寂静 · The sanctuary',
  from: [6.75, 5.6, -7.8],
  to: [6, 5.7, -1.5],
  look0: [6, 5.85, -14.2],
  look1: [6, 5.95, -13.6],
  fov: 44
}, {
  name: '浮庭 · The floating garden',
  from: [19.6, 9.3, 1],
  to: [31, 25, 31],
  look0: [17.5, 8.56, -1.5],
  look1: [0, 6.5, -8.5],
  fov: 46
}, {
  name: '回廊深处 · Garden passage',
  from: [-22.5, 4.3, -1],
  to: [-21.5, 6.2, 21.5],
  look0: [-24, 4.9, -6],
  look1: [-3.4, 8, -12],
  fov: 47
}, {
  name: '水映伽蓝 · Reflections',
  from: [12.5, 2.1, 12.5],
  to: [21, 5.5, 28],
  look0: [10, 0.7, 12],
  look1: [-1.2, 7.2, -10],
  fov: 45
}, {
  name: '雨后余晖 · After the rain',
  from: [-5.2, 1.35, 20.5],
  to: [-13.5, 6.1, 32],
  look0: [-4.6, .1, 17.3],
  look1: [.5, 9.5, -9],
  fov: 44
}];
const vec = a => new T.Vector3(...a);
let last = -1;
function renderAt(time) {
  const t = Math.min(69.999999, Math.max(0, time)),
    idx = Math.floor(t / 7),
    s = shots[idx],
    u = (t - idx * 7) / 7;
  // A minimum-jerk dolly, with continuous acceleration and zero velocity at either cut.
  const ease = u * u * u * (u * (u * 6 - 15) + 10),
    targetEase = u * u * (3 - 2 * u);
  camera.position.lerpVectors(vec(s.from), vec(s.to), ease);
  const target = vec(s.look0).lerp(vec(s.look1), targetEase);
  camera.lookAt(target);
  camera.fov = s.fov;
  camera.updateProjectionMatrix();
  dof.uniforms.focus.value = camera.position.distanceTo(target);
  dof.uniforms.aperture.value = (idx === 5 ? .005 : .009) * (1 - targetEase) + .001;
  world.update(t);
  composer.render();
  renderer.shadowMap.autoUpdate = false;
  last = t;
  return {
    shot: idx,
    position: camera.position.toArray(),
    target: target.toArray()
  };
}
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
  const audio = new Audio('/music/sb_hiraeth.mp3');
  audio.volume = .56;
  input.addEventListener('input', () => {
    t = +input.value;
    audio.currentTime = t + 70;
    renderAt(t);
  });
  play.onclick = () => {
    playing = !playing;
    play.textContent = playing ? '暂停' : '播放';
    if (!playing) audio.pause();
  };
  document.getElementById('music').onclick = () => {
    if (audio.paused) {
      audio.currentTime = t + 70;
      audio.play();
    } else audio.pause();
  };
  function animate(now) {
    const dt = Math.min(.1, (now - previous) / 1000);
    previous = now;
    if (playing) t = (t + dt) % 70;
    renderAt(t);
    input.value = t;
    label.textContent = shots[Math.floor(t / 7)].name;
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
