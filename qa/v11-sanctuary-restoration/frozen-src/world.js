import * as T from 'three';
import {spatialBatches} from './batching.js';
import {auditHalfFloatTarget} from './render-audit.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {createBotany,foliageNormalMaterial} from './botany.js';
import {carvedBracket,carvedLeaf,archHeight,flowerCrest} from './ornaments.js';
import {seatedFigure,reliefPetal} from './sculpture.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {granite,grassTuft,flagstone,timberSweep} from './natural-forms.js';
import {emitRestoredBuddha} from './restoration-buddha.js';
import {createRestorationLighting} from './restoration-lighting.js';
import {createRestorationArchitecture} from './restoration-architecture.js';
import {buildRestorationAltar,buildRestorationHangingOrnaments} from './restoration-altar.js';

// Every visible surface, texture, plant and ornament in this world is generated here.
export function buildWorld(renderer,options={}) {
  const buildStarted=performance.now();
  const stage=name=>console.info(JSON.stringify({stage:name,seconds:(performance.now()-buildStarted)/1000}));
  const scene = new T.Scene();
  scene.background = new T.Color('#b9cccf');
  scene.fog = new T.FogExp2('#b9bcad', .0028);
  let seed = 237148;
  const random = () => {
      seed = 1664525 * seed + 1013904223 >>> 0;
      return seed / 4294967296;
    },
    rand = (a, b) => a + (b - a) * random();
  const materials = {},
    buckets = new Map(),
    geometries = new Map(),
    stack = [new T.Matrix4()],
    stats = {};
  const roofAudit=[],columns=[];
  const mat = (name, color, roughness = .7, metalness = 0, extra = {}) => materials[name] = new T.MeshStandardMaterial({
    name,
    color,
    roughness,
    metalness,
    ...extra
  });
  const canvasMap = kind => {
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    const ctx = c.getContext('2d');
    let im = ctx.createImageData(1024, 1024);
    for (let y = 0; y < 1024; y++) for (let x = 0; x < 1024; x++) {
      let a = kind === 'wood' ? Math.sin(x * .09 + Math.sin(y * .006) * 2 + Math.sin(y * .025) * .4) * .05 + Math.sin(x * .48 + Math.sin(y * .01) * 3) * .025 : Math.sin(x * .048 + Math.sin(y * .021) * 2) * .035 + Math.cos(y * .037 + x * .015) * .04;
      let v = kind === 'wood' ? 228 : 221;
      v += a * 255 + (random() - .5) * 17;
      let j = (y * 1024 + x) * 4;
      im.data[j] = v;
      im.data[j + 1] = v;
      im.data[j + 2] = v;
      im.data[j + 3] = 255;
    }
    ctx.putImageData(im, 0, 0);
    if (kind === 'wood') {
      ctx.globalAlpha = .15;
      ctx.strokeStyle = '#372413';
      for (let n = 0; n < 1000; n++) {
        let x = random() * 1024;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        for (let y = 0; y <= 1024; y += 16) ctx.lineTo(x + Math.sin(y * .008 + n) * 1.8, y);
        ctx.lineWidth = rand(.25, 1.3);
        ctx.stroke();
      }
    }
    const tx = new T.CanvasTexture(c);
    tx.wrapS = tx.wrapT = T.RepeatWrapping;
    tx.anisotropy = 16;
    tx.colorSpace = T.SRGBColorSpace;
    return tx;
  };
  const woodTex = canvasMap('wood'),
    stoneTex = canvasMap('stone');
  woodTex.repeat.set(4, 1);
  mat('cedar', '#51351f', .62, 0, {
    map: woodTex,
    bumpMap: woodTex,
    bumpScale: .008
  });
  mat('red', '#6d3826', .58, 0, {
    map: woodTex,
    bumpMap: woodTex,
    bumpScale: .006
  });
  mat('darkwood', '#2a2118', .69, 0, {
    map: woodTex,
    bumpMap: woodTex,
    bumpScale: .007
  });
  mat('endwood', '#57402a', .64, 0, {
    map: woodTex
  });
  mat('gold','#c5a567',.40,.96);
  mat('oldgold', '#88632e', .43, .7);
  mat('black', '#1d2320', .47, .28);
  mat('slate', '#414d51', .69, .045);
  mat('tileEdge', '#6c7779', .5, .2);
  mat('plaster', '#b0a582', .87, 0, {
    map: stoneTex
  });
  mat('stone', '#82867b', .87, 0, {
    map: stoneTex,
    bumpMap: stoneTex,
    bumpScale: .09
  });
  mat('paving', '#90897b', .67, 0, {
    map: stoneTex,
    bumpMap: stoneTex,
    bumpScale: .04
  });
  mat('wetStone', '#6a7066', .3, .1, {
    map: stoneTex,
    bumpMap: stoneTex,
    bumpScale: .027
  });
  mat('earth', '#3d5935', .99);
  mat('moss', '#395a26', 1);
  mat('lichen', '#7a8051', .99);
  mat('leaf', '#487438', .79, 0, {
    side: T.DoubleSide
  });
  mat('leafDark', '#2c5330', .84, 0, {
    side: T.DoubleSide
  });
  mat('leafGold', '#b49132', .78, 0, {
    side: T.DoubleSide
  });
  mat('leafRed', '#9a3922', .8, 0, {
    side: T.DoubleSide
  });
  mat('lily', '#4b722a', .45, 0, {
    side: T.DoubleSide
  });
  mat('petal', '#dc9fa8', .45, 0, {
    side: T.DoubleSide
  });
  const petalCanvas=document.createElement('canvas');petalCanvas.width=256;petalCanvas.height=512;
  const pc=petalCanvas.getContext('2d'),pg=pc.createLinearGradient(0,0,0,512);
  pg.addColorStop(0,'#cf7794');pg.addColorStop(.24,'#e6acb7');pg.addColorStop(.64,'#f2d7cf');pg.addColorStop(1,'#f0e6bd');pc.fillStyle=pg;pc.fillRect(0,0,256,512);
  for(let i=0;i<22;i++){pc.strokeStyle='rgba(142,56,84,.085)';pc.lineWidth=.6;pc.beginPath();pc.moveTo(128+(i-11)*2,512);pc.quadraticCurveTo(128+(i-11)*11,250,i*12,0);pc.stroke();}
  const petalTexture=new T.CanvasTexture(petalCanvas);petalTexture.colorSpace=T.SRGBColorSpace;petalTexture.anisotropy=16;materials.petal.map=petalTexture;materials.petal.color.set('#ffffff');materials.petal.roughness=.62;
  mat('petalWhite', '#e3d8b5', .5, 0, {
    side: T.DoubleSide
  });
  mat('pollen', '#edbb51', .4);
  mat('paper', '#edbc65', .85, 0, {
    emissive: '#ffab37',
    emissiveIntensity: .65,
    side: T.DoubleSide
  });
  mat('flame', '#ffde95', .2, 0, {
    emissive: '#ffab42',
    emissiveIntensity: 3
  });
  mat('waterbed', '#2b4130', .85);
  mat('koiWhite', '#d3c6a8', .4);
  mat('koiRed', '#bd5026', .4);
  mat('buddha','#c9aa70',.42,.96);
  const procNoise = `
varying vec3 vProc;
float phash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453123);}
float pnoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(phash(i),phash(i+vec3(1,0,0)),f.x),mix(phash(i+vec3(0,1,0)),phash(i+vec3(1,1,0)),f.x),f.y),mix(mix(phash(i+vec3(0,0,1)),phash(i+vec3(1,0,1)),f.x),mix(phash(i+vec3(0,1,1)),phash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float pfbm(vec3 p){return .57*pnoise(p)+.28*pnoise(p*2.03)+.15*pnoise(p*4.07);}`;
  for (const name of ['stone', 'paving', 'wetStone', 'cedar', 'red', 'endwood', 'darkwood', 'gold', 'oldgold', 'buddha', 'slate','moss','lichen','earth','waterbed']) {
    const ma = materials[name];
    if (name === 'slate'||name==='waterbed') {
      ma.bumpMap = stoneTex;
      ma.bumpScale = .006;
    }
    const isStone = ['stone', 'paving', 'wetStone', 'slate','waterbed'].includes(name),
      isMetal = ['gold', 'oldgold', 'buddha'].includes(name);
    if (isMetal) {
      ma.bumpMap = stoneTex;
      ma.bumpScale = .004;
      ma.roughness = name === 'oldgold' ? .49 : name==='buddha'?.40:.39;
    }
    ma.onBeforeCompile = shader => {
      shader.vertexShader = 'varying vec3 vProc;varying vec3 vLocalStone;varying vec3 vStoneOrigin;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
 vec4 pp=vec4(position,1.0);vLocalStone=position;vec4 stoneOrigin=vec4(0.0,0.0,0.0,1.0);
 #ifdef USE_INSTANCING
 pp=instanceMatrix*pp;stoneOrigin=instanceMatrix*stoneOrigin;
 #endif
 vProc=(modelMatrix*pp).xyz;vStoneOrigin=(modelMatrix*stoneOrigin).xyz;`);
      shader.fragmentShader = 'varying vec3 vLocalStone;varying vec3 vStoneOrigin;\n'+procNoise + '\n' + shader.fragmentShader;
      let surface = name==='earth'?`float gpat=pfbm(vProc*.42),soil=pfbm(vProc*5.0);diffuseColor.rgb*=mix(vec3(.34,.51,.29),vec3(1.05,1.0,.69),gpat)*mix(.78,1.15,soil);`:isStone ? `float pat=pfbm(vProc*3.0);float footprint=max(length(dFdx(vProc)),length(dFdy(vProc)))*90.0;float fine=mix(pnoise(vProc*90.0),.5,smoothstep(.35,1.3,footprint));diffuseColor.rgb*=mix(.53,1.18,pat)*mix(.81,1.16,fine);float age=smoothstep(.6,.78,pfbm(vProc*5.3));diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.77,.91,.54),age*.38);` : name==='moss'||name==='lichen'?`float mossPat=pfbm(vProc*9.0);diffuseColor.rgb*=mix(vec3(.44,.57,.26),vec3(1.08,1.04,.68),mossPat);` : isMetal ? `float pat=pfbm(vProc*17.0);diffuseColor.rgb*=mix(.66,1.09,pat);` : `float grain=pfbm(vProc*vec3(18.0,.7,18.0));float phase=(vProc.x+vProc.z*.17)*100.0+grain*11.0;float grain2=sin(phase)*(1.0-smoothstep(.7,2.7,fwidth(phase)));diffuseColor.rgb*=mix(.63,1.08,grain)*(1.0+grain2*.018);`;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + surface);
      if(name==='paving'||name==='wetStone')shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
float stoneSeed=phash(vStoneOrigin*1.91),crackDistance=vLocalStone.z-sin(stoneSeed*6.283)*vLocalStone.x*.62-(stoneSeed-.5)*.63+.019*sin(vLocalStone.x*31.0+stoneSeed*27.0);
float crackAa=max(fwidth(crackDistance),.0001),crack=clamp((.0009-abs(crackDistance))/crackAa+.5,0.0,1.0)*min(1.0,.0018/crackAa)*step(.82,stoneSeed);
diffuseColor.rgb*=1.0-crack*.54;roughnessFactor=min(1.0,roughnessFactor+crack*.10);`);
      // The outdoor sky is occluded by the hall enclosure. Attenuate only
      // indirect illumination, preserving the actual direct-light shadows.
      shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
float roomX=1.0-smoothstep(10.6,13.1,abs(vProc.x-6.0));
float roomZ=smoothstep(-22.0,-19.5,vProc.z)*(1.0-smoothstep(-2.2,1.5,vProc.z));
float roomY=smoothstep(4.8,6.1,vProc.y)*(1.0-smoothstep(17.5,18.9,vProc.y));
float roomMask=roomX*roomZ*roomY;
float portalLight=mix(.22,.65,smoothstep(-17.0,-1.5,vProc.z));
float skyVisibility=mix(1.0,portalLight,roomMask);
reflectedLight.indirectDiffuse*=skyVisibility;
reflectedLight.indirectSpecular*=mix(1.0,sqrt(skyVisibility),roomMask);`);
      if (isStone) shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
 float bumpFootprint=max(length(dFdx(vProc)),length(dFdy(vProc)))*52.0;
 float bumpFilter=1.0-smoothstep(.25,1.2,bumpFootprint);
 float bh=pfbm(vProc*13.0);normal=perturbNormalArb(-vViewPosition,normal,vec2(dFdx(bh),dFdy(bh))*${name==='slate'?'.0015':name==='stone'?'.025':'.004'}*bumpFilter,faceDirection);`);
    };
    ma.customProgramCacheKey = () => name;
  }
  const botany=createBotany();Object.assign(materials,botany.materials);const foliageMeshes=[],foliageNormalScene=new T.Scene();
  const unit = {
    box: new T.BoxGeometry(1, 1, 1),
    leafCard:botany.card,
    carvedBracket:carvedBracket(),
    carvedLeaf:carvedLeaf(),
    reliefPetal:reliefPetal(),
    flowerCrest:flowerCrest(),
    tileEnd:new T.CylinderGeometry(1,1,.30,20,1,false).rotateX(Math.PI/2),
    cylinder: new T.CylinderGeometry(.97, 1, 1, 32),
    thinCylinder: new T.CylinderGeometry(1, 1, 1, 8),
    cone: new T.ConeGeometry(1, 1, 12),
    sphere: new T.SphereGeometry(1, 32, 24),
    sphereLow: new T.SphereGeometry(1, 12, 8),
    sphereMedium: new T.SphereGeometry(1, 20, 14),
    paver: new RoundedBoxGeometry(1, 1, 1, 2, .055),
    rock: granite(1),rock1:granite(2),rock2:granite(3),rock3:granite(4),
    grass:grassTuft(),
    flagstone0:flagstone(1),flagstone1:flagstone(2),flagstone2:flagstone(3),flagstone3:flagstone(4),flagstone4:flagstone(5),flagstone5:flagstone(6),
    leaf: (() => {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, -.28, .055, .38, 0, .12, .52, .28, .055, .38, 0, 0, 1], 3));
      g.setIndex([0, 1, 2, 0, 2, 3, 1, 4, 2, 2, 4, 3]);
      g.computeVertexNormals();
      return g;
    })()
  };
  const v = (x, y, z) => new T.Vector3(x, y, z),
    dummy = new T.Object3D(),
    q = new T.Quaternion(),
    up = v(0, 1, 0),
    m = new T.Matrix4(),
    color = new T.Color();
  function instance(geo, material, x, y, z, sx, sy, sz, rotation = null, tint = 1) {
    const g = typeof geo === 'string' ? unit[geo] : geo;
    const key = g.uuid + material;
    let b = buckets.get(key);
    if (!b) {
      b = {
        geometry: g,
        material: materials[material],
        transforms: [],
        colors: [],
        name: material
      };
      buckets.set(key, b);
    }
    dummy.position.set(x, y, z);
    dummy.scale.set(sx, sy, sz);
    if (rotation?.isQuaternion) dummy.quaternion.copy(rotation);else dummy.rotation.set(rotation?.[0] || 0, rotation?.[1] || 0, rotation?.[2] || 0);
    dummy.updateMatrix();
    m.multiplyMatrices(stack[stack.length - 1], dummy.matrix);
    b.transforms.push(m.clone());
    color.setRGB(tint, tint, tint);
    b.colors.push(color.clone());
  }
  function group(x, y, z, rot, fn) {
    let transform = new T.Matrix4().makeRotationY(rot);
    transform.setPosition(x, y, z);
    transform.premultiply(stack[stack.length - 1]);
    stack.push(transform);
    fn();
    stack.pop();
  }
  const hallMatrix=new T.Matrix4().makeTranslation(6,0,-11).scale(v(1.35,1.75,1.28)).multiply(new T.Matrix4().makeTranslation(-6,0,11));
  const towerMatrix=new T.Matrix4().makeTranslation(-21.5,0,-25).scale(v(1.30,1.75,1.30)).multiply(new T.Matrix4().makeTranslation(12.8,0,14.5));
  const hallPoint=a=>v(...a).applyMatrix4(hallMatrix);
  function transformed(matrix,fn){stack.push(stack[stack.length-1].clone().multiply(matrix));fn();stack.pop();}
  const box = (x, y, z, w, h, d, ma = 'cedar', rot = 0, tint = 1) => {
    const stone=ma==='paving'||ma==='wetStone'||ma==='stone'&&h<.55;
    const variant=Math.floor(Math.abs(Math.sin(x*17.3+z*31.7+y*4.1)*791.3))%6;
    instance(stone?(w<1.8&&d<1.8?'flagstone'+variant:'paver'):'box',ma,x,y,z,w,h,d,[0,rot,0],tint);
  };
  const cylinder = (x, y, z, r, h, ma = 'cedar', tint = 1) => instance('cylinder', ma, x, y, z, r, h, r, null, tint);
  const sphere = (x, y, z, sx, sy, sz, ma = 'gold', tint = 1, rot = null) => instance(ma === 'buddha' ? 'sphere' : ['moss', 'lichen', 'petalWhite', 'pollen'].includes(ma) || Math.max(sx, sy, sz) < .075 ? 'sphereLow' : Math.max(sx, sy, sz) < .25 ? 'sphereMedium' : 'sphere', ma, x, y, z, sx, sy, sz, rot, tint);
  function beam(a, b, r, ma = 'cedar', square = false, width = null) {
    let dir = b.clone().sub(a),
      len = dir.length();
    q.setFromUnitVectors(up, dir.normalize());
    let mid = a.clone().add(b).multiplyScalar(.5);
    instance(square ? 'box' : ma === 'buddha' ? 'cylinder' : 'thinCylinder', ma, mid.x, mid.y, mid.z, width || (square ? r * 2 : r), len, square ? r * 2 : r, q);
    if (ma === 'buddha') {
      sphere(a.x, a.y, a.z, r, r, r, ma);
      sphere(b.x, b.y, b.z, r, r, r, ma);
    }
  }
  function line(points, r, ma = 'gold', segments = 40, taper = false) {
    const path = new T.CatmullRomCurve3(points.map(p => v(...p)));
    const g = new T.TubeGeometry(path, segments, r, 8, false);
    if (taper) {
      const p = g.attributes.position;
      for (let j = 0; j <= segments; j++) {
        const c = path.getPointAt(j / segments),
          f = .12 + .88 * Math.pow(1 - j / segments, .8);
        for (let k = 0; k <= 8; k++) {
          let i = j * 9 + k;
          p.setXYZ(i, c.x + (p.getX(i) - c.x) * f, c.y + (p.getY(i) - c.y) * f, c.z + (p.getZ(i) - c.z) * f);
        }
      }
      g.computeVertexNormals();
    }
    instance(g, ma, 0, 0, 0, 1, 1, 1);
  }
  function torus(x, y, z, r, tube, ma = 'gold', rot = null) {
    let key = `torus${(tube / r).toFixed(4)}`;
    let g = geometries.get(key);
    if (!g) {
      g = new T.TorusGeometry(1, tube / r, 8, 64);
      geometries.set(key, g);
    }
    instance(g, ma, x, y, z, r, r, r, rot);
  }
  function floralMedallion(x,y,z,r,ma='oldgold'){
    sphere(x,y,z,r*.22,r*.22,r*.075,ma);
    for(let k=0;k<10;k++){
      const a=k*Math.PI/5;
      instance('reliefPetal',ma,x+Math.sin(a)*r*.48,y+Math.cos(a)*r*.48,z,r*.21,r*.48,r*.32,[0,0,-a]);
    }
    for(let k=0;k<5;k++){
      const a=k*Math.PI*.4+.28;
      instance('reliefPetal',ma,x+Math.sin(a)*r*.28,y+Math.cos(a)*r*.28,z+r*.04,r*.14,r*.28,r*.27,[0,0,-a]);
    }
  }
  function rock(x, y, z, s = 1) {
    const t = rand(.68, 1.15);
    const variant=Math.floor(Math.abs(Math.sin(x*71.3+z*47.7+y)*657.2))%4;
    instance(['rock','rock1','rock2','rock3'][variant], 'stone', x, y, z, s * rand(.75, 1.3), s * rand(.55, 1), s * rand(.65, 1.3), [random() * .45, random() * 6, random() * .45], t);
    for (let k = 0; k < 5; k++) instance('rock', 'moss', x + rand(-.5, .5) * s, y + s * rand(.3, .65), z + rand(-.5, .5) * s, s * rand(.15, .4), s * .07, s * rand(.15, .38), null, rand(.8, 1.15));
  }
  function plaque(x, y, z, w, h) {
    box(x, y, z, w + .15, h + .15, .15, 'darkwood');
    box(x, y, z + .09, w, h, .07, 'oldgold');
    box(x, y, z + .14, w - .14, h - .14, .06, 'black');
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 320;
    const cx = c.getContext('2d');
    cx.fillStyle = '#cfa85b';
    cx.font = '220px "Songti SC",serif';
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.fillText('寂 光 院', 512, 173);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    const ma = new T.MeshStandardMaterial({
      map: tex,
      transparent: true,
      roughness: .42,
      metalness: .6
    });
    const mesh = new T.Mesh(new T.PlaneGeometry(w * .9, h * .82), ma);
    mesh.position.set(x, y, z + .188);
    mesh.updateMatrix();
    mesh.applyMatrix4(stack[stack.length - 1]);
    scene.add(mesh);
  }
  function footColumn(x,z,bottom,h,r=.28){architecture.footColumn(x,z,bottom,h,r);}
  function brackets(x,y,z,s=1){architecture.brackets(x,y,z,s);}
  function railing(a, b, y, h = .95) {
    const d = b.clone().sub(a),
      len = d.length(),
      n = Math.ceil(len / .88);
    for (let i = 0; i <= n; i++) {
      let p = a.clone().addScaledVector(d, i / n);
      box(p.x, y + h * .52, p.z, .12, h, .12, 'red');
      cylinder(p.x, y + h + .04, p.z, .1, .1, 'black');
      sphere(p.x, y + h + .15, p.z, .12, .14, .12, 'oldgold');
    }
    for (let k = 0; k < 2; k++) beam(v(a.x, y + h * (k ? .84 : .28), a.z), v(b.x, y + h * (k ? .84 : .28), b.z), .065, 'red', true, .14);
  }

  // Curved hip roofs, including every overlapping ceramic tile as actual geometry.
  function hipRoof(x, y, z, w, d, rise, detail = 1) {
    group(x, y, z, 0, () => {
      const ridge = w * .245,
        curl = .48;
      const positions = [],
        normals = [],
        colors = [],
        indices = [];
      let idx = 0;
      const evalP = (face, t, u, extra = 0) => {
        let px, pz;
        if (face < 2) {
          px = u * (ridge + (w / 2 - ridge) * t);
          pz = (face === 0 ? 1 : -1) * d / 2 * t;
        } else {
          px = (face === 2 ? 1 : -1) * (ridge + (w / 2 - ridge) * t);
          pz = u * d / 2 * t;
        }
        const yy = rise * Math.pow(Math.max(0, 1 - t), 1.43) + curl * Math.pow(t, 9) * (.25 + Math.pow(Math.abs(u), 7)) + extra;
        return v(px, yy, pz);
      };
      for (let face = 0; face < 4; face++) {
        const rows = Math.max(10, Math.round((face < 2 ? d / 2 : w / 2 - ridge) / .28));
        for (let row = 0; row < rows; row++) {
          const t0 = Math.max(.001, (row+.006) / rows),
            t1 = Math.min(1.001, (row + .994) / rows),
            tm = (t0 + t1) / 2,
            span = face < 2 ? 2 * (ridge + (w / 2 - ridge) * tm) : d * tm;
          const cols = Math.max(2, Math.round(span / .255));
          for (let col = 0; col < cols; col++) {
            const u0 = -1 + (col+.006) * 2 / cols,
              u1 = -1 + (col + .994) * 2 / cols,
              shade = rand(.89, 1.11);
            for (let tv = 0; tv < 3; tv++) for (let uv = 0; uv < 5; uv++) {
              let t = t0 + (t1 - t0) * tv / 2,
                u = u0 + (u1 - u0) * uv / 4,
                p = evalP(face, t, u, .012 + Math.sin(uv / 4 * Math.PI) * .045 + (tv === 2 ? .025 : 0));
              positions.push(...p.toArray());
              colors.push(shade, shade * 1.015, shade * 1.045);
            }
            for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) {
              const a = idx + j * 5 + i;
              indices.push(a, a + 5, a + 1, a + 1, a + 5, a + 6);
            }
            idx += 15;
          }
        }
      }
      let g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
      g.setIndex(indices);
      g.computeVertexNormals();
      const roofMat = materials.slate.clone();
      roofMat.onBeforeCompile = materials.slate.onBeforeCompile;
      roofMat.customProgramCacheKey = materials.slate.customProgramCacheKey;
      roofMat.vertexColors = true;
      roofMat.side = T.DoubleSide;
      const mesh = new T.Mesh(g, roofMat);
      mesh.applyMatrix4(stack[stack.length - 1]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      // Continuous ceramic backing and a sealed timber soffit below the individually modeled tiles.
      for (let face = 0; face < 4; face++) {
        for (const [offset, ma] of [[-.035, 'slate'], [-.18, 'darkwood']]) {
          const pos = [],
            ids = [];
          for (let j = 0; j <= 20; j++) for (let i = 0; i <= 40; i++) {
            pos.push(...evalP(face, Math.max(.001, j / 20), -1 + i / 20, offset).toArray());
            if (j < 20 && i < 40) {
              const a = j * 41 + i;
              ids.push(a, a + 41, a + 1, a + 1, a + 41, a + 42);
            }
          }
          const gg = new T.BufferGeometry();
          gg.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
          gg.setIndex(ids);
          gg.computeVertexNormals();
          const mm = materials[ma].clone();
          mm.onBeforeCompile = materials[ma].onBeforeCompile;
          mm.customProgramCacheKey = materials[ma].customProgramCacheKey;
          mm.side = T.DoubleSide;
          const roofBacking = new T.Mesh(gg, mm);
          roofBacking.applyMatrix4(stack[stack.length - 1]);
          roofBacking.castShadow = true;
          roofBacking.receiveShadow = true;
          scene.add(roofBacking);
        }
      }
      // True wooden soffit follows the same broad sweep, with rafters at 23 cm centres.
      for (let face = 0; face < 4; face++) {
        let count = Math.round((face < 2 ? w : d) / .28);
        for (let i = 0; i <= count; i++) {
          let u = -1 + 2 * i / count,
            p1 = evalP(face, .35, u),
            p2 = evalP(face, 1.02, u);
          p1.y -= .21;
          p2.y -= .21;
          const curvePoints=[];
          let oldIntersection=-Infinity;
          for(let n=0;n<=16;n++){
            const t=.35+(1.02-.35)*n/16, surface=evalP(face,t,u), chordY=p1.y+(p2.y-p1.y)*n/16;
            oldIntersection=Math.max(oldIntersection,chordY+.055-surface.y);
            curvePoints.push([surface.x,surface.y-.235,surface.z]);
          }
          instance(timberSweep(curvePoints),'endwood',0,0,0,1,1,1);
          roofAudit.push({roof:[x,y,z],face,u,oldPenetration:oldIntersection,newMaximumTopOffset:-.18});
          let pe = evalP(face, 1.02, u);
          const last=v(...curvePoints.at(-1)),tangent=last.clone().sub(v(...curvePoints.at(-2))).normalize();
          const endRotation=new T.Quaternion().setFromUnitVectors(v(0,0,1),tangent);
          const cap=last.clone().addScaledVector(tangent,.012);
          instance('box','oldgold',cap.x,cap.y,cap.z,.112,.112,.022,endRotation);
          const crest=cap.clone().addScaledVector(tangent,.014);
          instance('flowerCrest','gold',crest.x,crest.y,crest.z,.040,.040,.030,endRotation);
          const angle=face===0?0:face===1?Math.PI:face===2?Math.PI/2:-Math.PI/2;
          instance('tileEnd','tileEdge',pe.x,pe.y-.015,pe.z,.078,.078,.078,[0,angle,0]);
          const outward=v(Math.sin(angle),0,Math.cos(angle));
          instance('flowerCrest','oldgold',pe.x+outward.x*.015,pe.y-.015,pe.z+outward.z*.015,.044,.044,.024,[0,angle,0]);
        }
        const pts = [];
        for (let j = 0; j <= 24; j++) {
          const p = evalP(face, 1.015, -1 + 2 * j / 24, -.075);
          pts.push(p.toArray());
        }
        line(pts, .11, 'red', 36);
        const pts2 = pts.map(p => [p[0], p[1] + .12, p[2]]);
        line(pts2, .035, 'gold', 36);
      }
      line([[-ridge, rise + .12, 0], [0, rise + .19, 0], [ridge, rise + .12, 0]], .15, 'tileEdge', 30);
      line([[-ridge, rise + .3, 0], [0, rise + .37, 0], [ridge, rise + .3, 0]], .028, 'gold', 30);
      for (let sx of [-1, 1]) for (let sz of [-1, 1]) {
        const pts = [];
        for (let j = 0; j <= 20; j++) pts.push(evalP(sz > 0 ? 0 : 1, j / 20, sx, .07).toArray());
        line(pts, .11, 'tileEdge', 30);
        line(pts.map(p => [p[0], p[1] + .11, p[2]]), .024, 'gold', 30);
        const p = evalP(sz > 0 ? 0 : 1, 1, sx);
        sphere(p.x, p.y + .18, p.z, .12, .2, .12, 'gold');
      }
      for (const s of [-1, 1]) {
        const end = ridge * s;
        line([[end - s * .4, rise + .25, 0], [end + s * .18, rise + .4, 0], [end + s * .45, rise + .95, 0]], .085, 'tileEdge');
        sphere(end + s * .45, rise + .94, 0, .11, .15, .09, 'oldgold');
      }
    });
  }
  function gableRoof(x,y,z,w,d,rise){
    group(x,y,z,0,()=>{
      const profile=[];for(let i=0;i<=72;i++){const xx=-w/2+w*i/72;profile.push([xx,archHeight(xx/(w/2),rise),d/2]);}
      line(profile,.18,'darkwood',72);line(profile.map(p=>[p[0],p[1]+.09,p[2]+.05]),.115,'cedar',72);line(profile.map(p=>[p[0],p[1]+.20,p[2]+.09]),.027,'gold',72);line(profile.map(p=>[p[0],p[1]-.20,p[2]+.035]),.055,'oldgold',72);
      const pos=[],ids=[];
      for(let j=0;j<=24;j++)for(let i=0;i<=72;i++){const [xx,yy]=profile[i];pos.push(xx,yy+.09,-d/2+d*j/24);if(j<24&&i<72){const a=j*73+i;ids.push(a,a+73,a+1,a+1,a+73,a+74);}}
      const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute(pos,3));roof.setIndex(ids);roof.computeVertexNormals();instance(roof,'slate',0,0,0,1,1,1);
      for(let j=0;j<=Math.ceil(d/.24);j++){const zz=-d/2+d*j/Math.ceil(d/.24);line(profile.map(p=>[p[0],p[1]+.13,zz]),.042,'tileEdge',56);}
      // Closed, heavy pediment carved in relief, with a central lotus crest.
      const sh=new T.Shape();sh.moveTo(-w/2,.03);sh.lineTo(w/2,.03);for(let i=72;i>=0;i--)sh.lineTo(profile[i][0],Math.max(.03,profile[i][1]-.24));sh.closePath();
      const back=new T.ExtrudeGeometry(sh,{depth:.20,bevelEnabled:true,bevelThickness:.018,bevelSize:.018,bevelSegments:2,curveSegments:8});instance(back,'darkwood',0,0,d/2-.24,1,1,1);
      box(0,.04,d/2,w,.20,.30,'red');box(0,-.11,d/2+.02,w*.96,.05,.36,'oldgold');
      const crest=Math.min(.55,w*.068),centerY=rise*.57;
      torus(0,centerY,d/2+.08,crest,.038,'oldgold');sphere(0,centerY,d/2+.09,crest*.25,crest*.25,.05,'gold');
      for(let k=0;k<12;k++){const a=k/12*Math.PI*2;instance('carvedLeaf','gold',Math.sin(a)*crest*.48,centerY+Math.cos(a)*crest*.48,d/2+.1,crest*.42,crest*.82,.50,[0,0,-a]);}
      for(const side of [-1,1]){
        const scroll=[];for(let j=0;j<=64;j++){const t=j/64,aa=t*Math.PI*3.8,r=(1-t)*crest*.6;scroll.push([side*(crest*.82+t*w*.30+Math.sin(aa)*r),rise*.16+Math.cos(aa)*r*.62,d/2+.085]);}
        line(scroll,.035,'endwood',60);line(scroll.map(p=>[p[0],p[1]+.025,p[2]+.045]),.012,'oldgold',60);
        for(let k=0;k<12;k++){const t=(k+.5)/12,xx=side*(crest+t*w*.30),yy=rise*.16+Math.sin(t*6.28)*crest*.20,available=archHeight(xx/(w/2),rise)-.32;if(available>yy+.12){instance('carvedLeaf',k%3?'endwood':'oldgold',xx,yy+.10,d/2+.07,.24,.31,.45,[0,0,side*(.7+Math.sin(k)*.4)]);}}
      }
      for(const side of [-1,1])for(let i=0;i<5;i++){const xx=side*w*(.12+i*.061),yy=archHeight(xx/(w/2),rise)-.38;if(yy>.2)instance('carvedLeaf','oldgold',xx,yy,d/2+.02,.15,.24,.30,[0,0,side*.9]);}
      // Deep, overlapping timber cloud and lotus carvings fill the pediment.
      for(const side of [-1,1])for(let j=0;j<8;j++){
        const xx=side*w*(.10+j*.040),top=archHeight(xx/(w/2),rise)-.31;
        for(let row=0;row<3;row++){
          const yy=.28+row*.45;if(yy+.28>top||Math.hypot(xx,(yy-centerY)*1.1)<crest*1.4)continue;
          floralMedallion(xx,yy,d/2+.045,Math.min(.25,top-yy),'endwood');
          for(const sg of [-1,1])instance('carvedLeaf','cedar',xx+sg*.22,yy+.15,d/2+.025,.26,.41,.45,[0,0,sg*.90]);
        }
      }
      for(let side of [-1,1])line(profile.filter((p,i)=>i>8&&i<64).map(p=>[p[0]*.95,p[1]-.39,d/2-.04+side*.025]),.055,'endwood',60);
      sphere(0,rise+.21,0,.12,.19,.12,'oldgold');
    });
  }
  const architecture=createRestorationArchitecture({instance,group,box,stack,columns,roofAudit});
  // Terrain, irregular pond, and a continuous hand-laid stone surface.
  box(0, -1.15, 0, 200, 1.5, 200, 'earth');
  const pondRadius = a => 1+.115*Math.sin(a*3)+.055*Math.cos(a*7)+.026*Math.sin(a*11);
  const inPond=(x,z,margin=1)=>Math.hypot(x/22.3,(z-4.8)/14.2)<pondRadius(Math.atan2((z-4.8)/14.2,x/22.3))*margin;
  const terrain = new T.PlaneGeometry(160, 160, 120, 120);
  terrain.rotateX(-Math.PI / 2);
  const tp = terrain.attributes.position;
  for (let i = 0; i < tp.count; i++) {
    let x = tp.getX(i),
      z = tp.getZ(i);
    const r=Math.hypot(x/22.3,(z-4.8)/14.2),edge=r-pondRadius(Math.atan2((z-4.8)/14.2,x/22.3)),q=T.MathUtils.smoothstep(edge,-.04,.005);tp.setY(i,T.MathUtils.lerp(-.80,-.08,q)+(Math.sin(x*.11)*Math.cos(z*.09)*.015+Math.sin(x*.35+z*.2)*.008)*q);
  }
  terrain.computeVertexNormals();
  instance(terrain, 'earth', 0, 0, 0, 1, 1, 1);
  const pondShape = new T.Shape();
  for (let i = 0; i <= 180; i++) {
    let a = i / 180 * Math.PI * 2,
      r = pondRadius(a),
      x = Math.cos(a) * 22.3 * r,
      z = Math.sin(a) * 14.2 * r + 4.8;
    if (!i) pondShape.moveTo(x, -z);else pondShape.lineTo(x, -z);
  }
  const waterGeo = new T.ShapeGeometry(pondShape, 180);
  const water = new Reflector(waterGeo, {
    color: 0x56674f,
    textureWidth: 2048,
    textureHeight: 1024,
    clipBias: .015,
    multisample: 4
  });
  water.position.y = -.12;
  water.rotation.x = -Math.PI / 2;
  water.material.transparent = false;
  water.material.uniforms.time = {
    value: 0
  };
  const refractionTarget=new T.WebGLRenderTarget(1920,1080,{type:T.HalfFloatType,samples:4});
  water.material.uniforms.tRefraction={value:refractionTarget.texture};
  water.material.vertexShader = water.material.vertexShader.replace('void main()', 'varying vec3 vWaterWorld; varying vec4 vRefractClip; void main()').replace('gl_Position =', 'vWaterWorld = ( modelMatrix * vec4(position,1.0) ).xyz; vRefractClip=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position =');
  water.material.fragmentShader = water.material.fragmentShader.replace('void main()', 'uniform float time; uniform sampler2D tRefraction; varying vec3 vWaterWorld; varying vec4 vRefractClip; void main()').replace('vec4 base = texture2DProj( tDiffuse, vUv );', `vec4 uv = vUv;
 float a=sin(vWaterWorld.x*2.1+vWaterWorld.z*.7+time*.55), b=sin(vWaterWorld.z*3.3-vWaterWorld.x*.8-time*.42);
 uv.x += (a+b*.45)*0.00044*uv.w; uv.y += (b+a*.3)*0.00031*uv.w;
 vec4 base=texture2DProj(tDiffuse,uv);`).replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );', `
float ca=cos(vWaterWorld.x*2.1+vWaterWorld.z*.7+time*.55),cb=cos(vWaterWorld.z*3.3-vWaterWorld.x*.8-time*.42);
vec3 waterNormal=normalize(vec3(-.012*(2.1*ca-.8*cb),1.0,-.012*(.7*ca+3.3*cb)));
float cosV=max(.0,dot(waterNormal,normalize(cameraPosition-vWaterWorld)));
float fresnel=.0204+.9796*pow(1.0-cosV,5.0);
vec2 screenUv=vRefractClip.xy/vRefractClip.w*.5+.5+vec2(a,b)*.00055;
vec3 bed=texture2D(tRefraction,screenUv).rgb;
vec3 transmitted=mix(bed,vec3(.025,.052,.025),.48);
gl_FragColor=vec4(mix(transmitted,base.rgb*.96,fresnel),1.0);`);
  scene.add(water);
  box(0, -.7, 5, 46, .2, 31, 'waterbed');
  const bedRandom=botany.rng(38217),br=(a,b)=>a+(b-a)*bedRandom();
  for(let i=0;i<1100;i++){
    const x=br(-22,22),z=br(-8,18);if(!inPond(x,z,.90)||(x>2.7&&x<9.3))continue;
    const s=br(.045,.17);instance('rock','stone',x,-.57,z,s,s*.55,s*1.15,[0,br(0,6.28),0],br(.65,1.03));
  }
  for (let i = 0; i < 235; i++) {
    let a = i / 235 * Math.PI * 2,
      r = pondRadius(a),
      x = Math.cos(a) * 22.4 * r,
      z = Math.sin(a) * 14.3 * r + 4.8;
    rock(x, -.18, z, rand(.35, .88));
  }
  // Stone approach and temple courtyard: individual joints remain visible in overhead shots.
  for (let ix = -33; ix <= 33; ix++) for (let iz = -28; iz <= 25; iz++) {
    let x = ix * 1.04 + iz % 2 * .5,
      z = iz * .91;
    let pond=inPond(x,z,1.025);
    const path=(x>3.4&&x<8.6)||(z>18&&Math.abs(x)<25)||(z<-20&&z>-28&&x>-24&&x<24)||(z<-7.8&&z>-10.5)||(x>20.8&&x<26.6)||(x<-24&&x>-29);
    if (path && (!pond || x>3.4&&x<8.6&&z<20)) {
      let top = z > 17.5 ? .08 : .04;
      box(x, top - .15, z, rand(.94, 1.01), .24, rand(.8, .87), z > 17 ? 'wetStone' : 'paving', rand(-.014, .014), rand(.78, 1.18));
    }
  }
  // The processional approach continues beyond the camera; it has no exposed display-base edge.
  for(let iz=26;iz<=54;iz++)for(let ix=1;ix<=10;ix++){const xx=ix*1.04+(iz%2)*.5,zz=iz*.91;box(xx,-.07,zz,.98,.24,.86,'paving',rand(-.006,.006),rand(.86,1.10));}
  // Real masonry below the procession path, plus landings at both ends of the red bridge.
  box(6,-.33,12.0,5.0,.74,16.0,'stone');
  box(2.55,.15,11,2.15,.70,3.75,'stone');
  for(let i=0;i<3;i++)box(2.15+i*.48,.46-i*.13,11,.50,.18,3.1,'paving');
  for(let i=0;i<28;i++){const zz=5.8+i*.48;for(const side of [-1,1]){box(6+side*2.52,-.06,zz,.08,.28,.46,'stone',0,rand(.75,1.05));if(i%4===0)fern(6+side*2.7,.06,zz,.40);}}
  // Approach inset pavers, curbs and moss seams.
  for (let i = 0; i < 22; i++) {
    box(3, .14, 17.8 - i * 1.07, .2, .25, .98, 'stone');
    box(9, .14, 17.8 - i * 1.07, .2, .25, .98, 'stone');
  }
  for (let i = 0; i < 2500; i++) {
    let x = rand(-34, 34),
      z = rand(-29, 25),
      pond = x * x / 484 + (z - 4.8) * (z - 4.8) / 199 < 1;
    if (!pond && !(x > 2.5 && x < 9.5) && z < 17.8) {
      sphere(x, -.27, z, rand(.08, .35), rand(.035, .1), rand(.08, .3), 'moss', rand(.7, 1.2));
    }
  }
  function platform(x, z, w, d, y = 1.5) {
    box(x, y * .5 - .1, z, w, y, d, 'stone');
    for (let j = 0; j < 3; j++) {
      box(x, y + .06 + j * .1, z, w + .5 - j * .16, .13, d + .5 - j * .16, 'stone', 0, 1 - j * .07);
    }
    for(let row=0;row<Math.ceil(y/.33);row++){
      const yy=.03+row*.33,hh=Math.min(.30,y-yy);
      if(hh<=0)continue;
      for(const side of [-1,1]){
        for(let xx=-w/2+.45;xx<w/2;xx+=.95){const shifted=xx+(row%2)*.24;if(shifted<w/2-.12)box(x+shifted,yy+hh/2,z+side*(d/2+.028),.91,hh,.085,'stone',0,rand(.78,1.13));}
        for(let zz=-d/2+.45;zz<d/2;zz+=.95){const shifted=zz+(row%2)*.25;if(shifted<d/2-.12)box(x+side*(w/2+.028),yy+hh/2,z+shifted,.085,hh,.91,'stone',0,rand(.78,1.13));}
      }
    }
    for (let ix = -w / 2 + .5; ix < w / 2; ix += .98) for (let iz = -d / 2 + .5; iz < d / 2; iz += .92) box(x + ix, y + .36, z + iz, .94, .15, .88, 'paving', 0, rand(.87, 1.13));
  }
  function stairs(x, z, w, count, height, depth) {
    const pieces=Math.max(2,Math.ceil(w/1.15)),pieceWidth=(w+.04)/pieces;
    for (let i = 0; i < count; i++){
      const baseTint=rand(.85,1.1),capTint=rand(.91,1.06);box(x,(i+1)*height/2,z-i*depth,w,(i+1)*height,depth+.06,'stone',0,baseTint);
      for(let k=-1;k<pieces;k++){
        const a=Math.max(-w/2-.02,-w/2-.02+(k+(i%2)*.5)*pieceWidth),b=Math.min(w/2+.02,-w/2-.02+(k+1+(i%2)*.5)*pieceWidth);
        if(b-a>.06)box(x+(a+b)/2,(i+1)*height+.018,z-i*depth,b-a-.009,.035,depth+.075,'paving',0,capTint*(.98+.035*Math.sin(i*4+k*7)));
      }
    }
    const total=count*depth, ys=new T.Vector3().setFromMatrixColumn(stack.at(-1),1).length(), hh=1/ys;
    for (let s of [-1, 1]) {
      beam(v(x + s * (w / 2 + .08), .35, z + .35), v(x + s * (w / 2 + .08), count * height + .35, z - total + .45), .18, 'stone', true, .29);
      beam(v(x + s * (w / 2 + .22), 1.2*hh, z + .35), v(x + s * (w / 2 + .22), count * height + 1.2*hh, z - total + .45), .065, 'red', true, .15);
      for (let i = 0; i <= count; i += 2) {
        box(x + s * (w / 2 + .22), i * height + .65*hh, z - i * depth, .13,1.25*hh,.13, 'red');
        sphere(x + s * (w / 2 + .22), i * height + 1.33*hh, z - i * depth, .12, .15, .12, 'oldgold');
      }
    }
  }

  transformed(hallMatrix,()=>{
  // Main hall: six bays, patterned shutters, carved brackets, gold hardware and ceramic roof.
  // A raised main terrace gives the hall a commanding mass above the garden.
  platform(6,-11,20,16,2.7);
  const mainDeckHeight=3.1+.3+.035,mainStepHeight=(mainDeckHeight-.018-.035/2)/32;
  stairs(6,5.2,4.6,32,mainStepHeight,.275);
  group(6, 3.1, -11, 0, () => {
    box(0, .15, 0, 18.8, .24, 14.6, 'darkwood');
    for (let x = -9; x < 9; x += .28) box(x, .3, 0, .268, .07, 14.2, 'cedar', 0, rand(.85, 1.07));
    for (let x of [-8.6, -5.15, -1.72, 1.72, 5.15, 8.6]) for (let z of [-6.8, 0, 6.8]) {
      // Keep a clear central sanctuary nave, as in reference 6. The two
      // central interior posts are replaced by a deep transfer beam; facade
      // and rear columns remain, and the side aisles carry the roof load.
      if(z===0&&Math.abs(x)<2)continue;
      footColumn(x, z, .3, 5.9, .43);
      brackets(x, 6.45, z, 1.35);
    }
    architecture.sanctuaryTransferBeam();
    for (let z of [-6.8, 6.8]) {
      for (let j = 0; j < 4; j++) box(0, 5.2 + j * .4, z, 18.5, .17, .38, j % 2 ? 'red' : 'darkwood');
      box(0, 6.95, z, 19.5, .25, .45, 'red');
      box(0, 7.17, z, 19.9, .08, .54, 'gold');
      for (let i = -30; i <= 30; i++) {
        box(i * .3, 5.8, z + .23, .1, .64, .1, 'endwood');
        box(i * .3, 6.5, z + .25, .13, .15, .12, 'gold');
      }
    }
    for (let x of [-8.6, 8.6]) {
      // Real openings, not black panels placed over a solid wall: sunlight
      // reaches the sanctuary through the timber lattice.
      box(x,5.86,0,.3,1.48,13.5,'plaster');
      box(x,.53,0,.3,.50,13.5,'darkwood');
      for (let z = -6.6; z < 6.7; z += 1.1) {
        box(x, 1.22, z, .34, 1.8, 1.04, 'darkwood');
        const bay=Math.round((z+6.6)/1.1);
        if(![4,7,10].includes(bay))box(x,3.70,z,.28,2.82,1.00,'darkwood');
        for(const yy of [2.25,5.14])box(x,yy,z,.36,.14,1.10,'darkwood');
        for(const zz of [-.53,.53])box(x,3.70,z+zz,.36,2.90,.10,'darkwood');
        for (let a = 0; a < 7; a++) box(x + Math.sign(x) * .2, 3.7, z - .48 + a * .16, .075, 2.75, .035, 'endwood');
        for (let a = 0; a < 9; a++) box(x + Math.sign(x) * .21, 2.35 + a * .33, z, .07, .04, 1.04, 'endwood');
      }
    }
    // Rear wall, embroidered-looking geometric panels generated entirely as timber and metal.
    box(0, 3.45, -7.03, 17.4, 6.4, .23, 'darkwood');
    for (let x = -7.8; x <= 8; x += 1.3) {
      box(x, 3.5, -6.85, 1.2, 4.8, .06, 'black');
      box(x, 3.5, -6.79, 1.12, 4.7, .035, 'oldgold');
      box(x, 3.5, -6.75, .97, 4.55, .025, 'darkwood');
      for (let j = 0; j < 6; j++) {
        const yy=1.55+j*.72;floralMedallion(x,yy,-6.70,.25,'oldgold');
        for(const side of [-1,1])line([[x,yy-.30,-6.70],[x+side*.36,yy-.12,-6.72],[x+side*.42,yy+.18,-6.70],[x+side*.2,yy+.34,-6.70]],.018,'gold',20);
      }
    }
    // Lattice doors flank a clear central view to the altar.
    for (let s of [-1, 1]) for (let k = 0; k < 2; k++) {
      let x = s * (4.15 + k * 2);
      box(x, 2.7, 6.73, 1.8, 4.8, .13, 'darkwood');
      box(x, 3.0, 6.83, 1.62, 3.7, .04, 'black');
      for (let i = 0; i < 10; i++) box(x - .72 + i * .16, 3.0, 6.9, .045, 3.7, .05, 'oldgold');
      for (let j = 0; j < 19; j++) box(x, 1.2 + j * .195, 6.91, 1.6, .035, .05, 'oldgold');
      box(x, .83, 6.85, 1.65, .7, .04, 'red');
      torus(x, .83, 6.91, .24, .016);
    }
    plaque(0, 6.08, 7.1, 2.6, .8);
    architecture.sanctuaryCeiling();
    for (let x of [-9.4, 9.4]) railing(v(x, 0, -7.5), v(x, 0, 7.4), .3, 1);
    railing(v(-9.4, 0, 7.4), v(-2.5, 0, 7.4), .3, 1);
    railing(v(2.5, 0, 7.4), v(9.4, 0, 7.4), .3, 1);
  });
  // Deep carved transoms, floral scrolls and joinery pins along all six bays.
  for (let bx of [-.88, 2.55, 6, 9.45, 12.9]) group(bx, 8.9, -3.88, 0, () => {
    box(0, 0, 0, 3.1, .55, .13, 'darkwood');
    for (let side of [-1, 1]) {
      const pp = [];
      for (let j = 0; j <= 35; j++) {
        let a = j / 35 * Math.PI * 3.4,
          r = .22 * (1 - j / 42);
        pp.push([side * (.35 + j / 35 * .8 + Math.cos(a) * r), Math.sin(a) * r, .09]);
      }
      line(pp, .018, 'oldgold', 42);
    }
    for(let k=-3;k<=3;k++)floralMedallion(k*.42,Math.sin(k*.7)*.035,.11,k===0?.21:.15,k===0?'oldgold':'endwood');
    for(let k=-6;k<=6;k++)for(const side of [-1,1])instance('carvedLeaf','endwood',k*.21,side*.14,.08,.14,.20,.40,[0,0,side*(.8+k*.11)]);
  });
  // Two distinct eave lines and an inhabited upper gallery, derived from the
  // full-resolution garden views. The monumental columns remain full-height.
  hipRoof(6,10.65,-11,24.8,19.9,1.8);
  group(6,11.12,-11,0,()=>{
    box(0,.04,0,18.3,.16,13.0,'darkwood');
    for(const x of [-8.6,-5.15,-1.72,1.72,5.15,8.6])for(const z of [-5.7,5.7]){
      footColumn(x,z,.08,2.50,.19);brackets(x,2.78,z,.72);
    }
    for(const z of [-5.7,5.7]){
      box(0,1.28,z-.10*Math.sign(z),17.4,1.85,.17,'plaster');
      for(let x=-7.8;x<8.0;x+=1.30){
        box(x,1.24,z,1.13,1.32,.12,'darkwood');
        for(let k=0;k<7;k++)box(x-.48+k*.16,1.24,z+.09*Math.sign(z),.043,1.26,.045,'endwood');
        for(let k=0;k<6;k++)box(x,.69+k*.22,z+.11*Math.sign(z),1.08,.033,.045,'endwood');
      }
      for(const yy of [.34,1.98,2.19,2.63,2.88])box(0,yy,z,18.6,.10,.24,yy>1?'red':'darkwood');
      box(0,2.55,z,18.3,.56,.18,'darkwood');
      for(let x=-8.1;x<=8.2;x+=.9)floralMedallion(x,2.55,z+Math.sign(z)*.13,.19,'oldgold');
    }
    for(const side of [-1,1]){
      box(side*8.65,1.24,0,.18,1.85,11.4,'plaster');
      for(let z=-5.3;z<5.4;z+=1.3){box(side*8.76,1.24,z,.08,1.30,1.12,'darkwood');for(let k=0;k<7;k++)box(side*8.82,1.24,z-.47+k*.156,.06,1.25,.04,'endwood');}
      railing(v(side*9.25,0,-6.3),v(side*9.25,0,6.3),.10,.58);
    }
    railing(v(-9.25,0,6.3),v(9.25,0,6.3),.10,.58);
    railing(v(-9.25,0,-6.3),v(9.25,0,-6.3),.10,.58);
  });
  hipRoof(6,13.4,-11,21.2,16.4,6.3);
  gableRoof(6, 10.1, -2.9, 8.2, 5.8, 2.8);
  });
  // Suspended corner wind chimes, flame pendants and chains.
  function pendant(x, y, z, s = .65) {
    cylinder(x, y, z, .02, 1.2 * s, 'oldgold');
    sphere(x, y - .8 * s, z, .19 * s, .23 * s, .19 * s, 'gold');
    cylinder(x, y - 1 * s, z, .1 * s, .19 * s, 'gold');
    box(x, y - 1.35 * s, z, .04, .42 * s, .08, 'oldgold');
  }
  transformed(hallMatrix,()=>{for (let x of [-5.5, 17.5]) for (let z of [-20.5, -1.5]) pendant(x, 10.2, z, .8);});

  transformed(towerMatrix,()=>{
  // Five-storey pagoda with steadily diminishing eaves and a nine-ring bronze finial.
  platform(-12.8, -14.5, 11, 11, 1.05);
  stairs(-12.8, -7.7, 3.7, 6, .23, .5);
  group(-12.8, 1.43, -14.5, 0, () => {
    for (let level = 0; level < 5; level++) {
      const scale = 1 - level * .115,
        w = 7.8 * scale,
        d = w,
        h = 3.55,
        y = level * 4.12;
      box(0, y + .17, 0, w + .5, .3, d + .5, 'darkwood');
      for (let x = -w / 2 + .45; x < w / 2; x += 1.15) for (let z of [-d / 2, d / 2]) {
        footColumn(x, z, y + .2, 2.55, .19 * scale);
        brackets(x, y + 2.87, z, .72 * scale);
      }
      for (let x of [-w / 2, w / 2]) for (let z = -d / 2 + .65; z < d / 2; z += 1.15) {
        footColumn(x, z, y + .2, 2.55, .19 * scale);
        brackets(x, y + 2.87, z, .72 * scale);
      }
      box(0, y + 1.57, 0, w - .45, 2.7, d - .45, 'plaster');
      for (let s of [-1, 1]) {
        for (let i = -2; i <= 2; i++) {
          let xx = i * w * .16;
          box(xx, y + 1.5, s * (d / 2 - .15), w * .12, 1.85, .11, 'darkwood');
          for (let k = 0; k < 5; k++) box(xx - w * .05 + k * w * .025, y + 1.5, s * (d / 2 - .08), .035, 1.7, .03, 'endwood');
          for (let k = 0; k < 4; k++) box(xx, y + .85 + k * .4, s * (d / 2 - .06), w * .115, .03, .035, 'oldgold');
        }
        for (let j = 0; j < 3; j++) box(0, y + 2.6 + j * .22, s * (d / 2 + .03), w + .7, .12, .2, j % 2 ? 'oldgold' : 'red');
      }
      if (level > 0) {
        for (let s of [-1, 1]) {
          railing(v(-w / 2 - .35, 0, s * (d / 2 + .4)), v(w / 2 + .35, 0, s * (d / 2 + .4)), y + .3, .73);
          railing(v(s * (w / 2 + .4), 0, -d / 2 - .3), v(s * (w / 2 + .4), 0, d / 2 + .3), y + .3, .73);
        }
      }
      hipRoof(0, y + 3.55, 0, w + 3.3 * scale, d + 3.3 * scale, 2.18 * scale);
      for (let s of [-1, 1]) for (let t of [-1, 1]) pendant(s * (w / 2 + 1.35 * scale), y + 3.7, t * (d / 2 + 1.35 * scale), .4 * scale);
    }
    let sy = 22.05;
    cylinder(0, sy + .95, 0, .075, 3.8, 'oldgold');
    for (let i = 0; i < 9; i++) {
      torus(0, sy + i * .25, 0, .46 - i * .027, .045, 'oldgold', [Math.PI / 2, 0, 0]);
    }
    sphere(0, sy + 2.5, 0, .26, .33, .26, 'gold');
    instance('cone', 'gold', 0, sy + 3.05, 0, .15, .8, .15);
    for (let s of [-1, 1]) line([[0, sy + 2.3, 0], [s * 1.05, sy - .8, s * 1.05], [s * 1.6, sy - 2.1, s * 1.6]], .018, 'black');
  });

  });
  // The red arched bridge is a real curved deck, down to plank seams and bronze post caps.
  group(-6, 0, 11, .08, () => {
    const L = 15.6,
      W = 3.25,
      arch = x => .55 + 1.85 * Math.cos(x / L * Math.PI);
    for (let i = 0; i < 90; i++) {
      let x = -L / 2 + (i + .5) * L / 90,
        yy = arch(x);
      box(x, yy, 0, L / 90 - .018, .18, W, 'darkwood');
      box(x, yy + .1, 0, L / 90 - .022, .055, W - .12, 'red', 0, rand(.72, 1.08));
    }
    for (let s of [-1, 1]) {
      let pts = [];
      for (let i = 0; i <= 80; i++) {
        let x = -L / 2 + L * i / 80;
        pts.push([x, arch(x) - .25, s * W * .47]);
      }
      line(pts, .2, 'darkwood', 80);
      for (let h of [.43, 1.05]) line(pts.map(p => [p[0], p[1] + h + .25, p[2] + s * .15]), .09, 'red', 80);
      line(pts.map(p => [p[0], p[1] + 1.38, p[2] + s * .15]), .025, 'gold', 80);
      for (let i = 0; i <= 18; i++) {
        let x = -L / 2 + L * i / 18,
          y = arch(x);
        box(x, y + .68, s * (W / 2 + .02), .17, 1.38, .18, 'red');
        box(x, y + .13, s * (W / 2 + .02), .29, .16, .3, 'black');
        cylinder(x, y + 1.43, s * (W / 2 + .02), .13, .12, 'black');
        sphere(x, y + 1.6, s * (W / 2 + .02), .11, .15, .11, 'oldgold');
        for (let a = 0; a < 4; a++) sphere(x + Math.sin(a * 1.57) * .08, y + 1.56, s * (W / 2 + .02) + Math.cos(a * 1.57) * .08, .025, .07, .025, 'gold');
      }
    }
    for (let x of [-L / 2, L / 2]) for (let s of [-1, 1]) {
      cylinder(x, .1, s * 1.35, .42, 1.6, 'stone');
      rock(x, -.05, s * 1.6, .75);
    }
  });
  function lantern(x, y, z, s = 1) {
    group(x, y, z, 0, () => {
      box(0, .08, 0, .9 * s, .16 * s, .9 * s, 'stone');
      box(0, .23 * s, 0, .69 * s, .19 * s, .69 * s, 'stone');
      cylinder(0, 1.03 * s, 0, .21 * s, 1.45 * s, 'stone');
      for (let a = 0; a < 4; a++) box(Math.sin(a * 1.57) * .195 * s, 1.05 * s, Math.cos(a * 1.57) * .195 * s, .08 * s, .66 * s, .025 * s, 'lichen', a * 1.57);
      box(0, 1.8 * s, 0, .7 * s, .18 * s, .7 * s, 'stone');
      box(0, 2.2 * s, 0, .66 * s, .65 * s, .66 * s, 'black');
      for (let a = 0; a < 4; a++) group(0, 0, 0, a * Math.PI / 2, () => {
        box(0, 2.2 * s, .34 * s, .5 * s, .48 * s, .018 * s, 'paper');
        for (let xx of [-.25, .25]) box(xx * s, 2.2 * s, .36 * s, .045 * s, .6 * s, .04 * s, 'oldgold');
        for (let i = -1; i <= 1; i++) box(i * .13 * s, 2.2 * s, .36 * s, .027 * s, .48 * s, .028 * s, 'darkwood');
        box(0, 2.2 * s, .37 * s, .5 * s, .025 * s, .02 * s, 'darkwood');
      });
      instance('cone', 'stone', 0, 2.72 * s, 0, .71 * s, .62 * s, .71 * s, [0, Math.PI / 4, 0]);
      box(0, 2.5 * s, 0, 1.05 * s, .12 * s, 1.05 * s, 'stone');
      sphere(0, 3.1 * s, 0, .16 * s, .24 * s, .16 * s, 'stone');
      for (let i = 0; i < 9; i++) {
        let a = rand(0, 6.28),
          r = rand(.2, .5);
        sphere(Math.cos(a) * r * s, (3.03 - .62 * r / .71 + .018) * s, Math.sin(a) * r * s, .065 * s, .015 * s, .075 * s, 'moss');
      }
    });
  }
  for (let p of [[-17, 10, 1.25], [15, 7, 1.2], [1.1,16,1.1],[10.9,16,1.1], [-19, -1, 1.05], [18, -7, 1.15], [-6, -7, .9], [22, 14, 1.2]]) lantern(p[0], 0, p[1], p[2]);
  function hangingLantern(x, y, z, s = 1) {
    group(x, y, z, 0, () => {
      cylinder(0, 0, 0, .018, 1.2 * s, 'black');
      cylinder(0, -.75 * s, 0, .12 * s, .15 * s, 'gold');
      box(0, -1.1 * s, 0, .53 * s, .65 * s, .53 * s, 'paper');
      for (let a = 0; a < 4; a++) {
        let angle = a * 1.57;
        group(0, 0, 0, angle, () => {
          for (let i = -2; i <= 2; i++) box(i * .1 * s, -1.1 * s, .277 * s, .022 * s, .64 * s, .022 * s, 'black');
          for (let yy of [-1.4, -1.1, -.8]) box(0, yy * s, .28 * s, .56 * s, .03 * s, .025 * s, 'oldgold');
        });
      }
      instance('cone', 'black', 0, -.65 * s, 0, .48 * s, .28 * s, .48 * s, [0, Math.PI / 4, 0]);
      box(0, -1.48 * s, 0, .66 * s, .1 * s, .66 * s, 'black');
      sphere(0, -1.63 * s, 0, .1 * s, .14 * s, .1 * s, 'gold');
    });
  }
  // Verandas framing the views without enclosing the camera routes.
  group(24, 0, 0, 0, () => {
    box(0, .25, 0, 5, .5, 43, 'stone');
    for (let z = -21; z < 21; z += .31) box(0, .55, z, 4.8, .08, .29, 'cedar', 0, rand(.75, 1.12));
    for (let z = -20; z <= 20; z += 4) for (let x of [-2, 2]) {
      footColumn(x, z, .55, 5, .27);
      brackets(x, 5.85, z, .9);
    }
    for (let x of [-2, 2]) box(x, 5.72, 0, .3, .4, 44, 'red');
    for (let z of [-18, -10, -2, 6, 14]) hangingLantern(-1.8, 5.5, z, .78);
    hipRoof(0, 6.4, 0, 7.4, 46, 1.9);
  });
  group(-30, 0, 20, 0, () => {
    box(0, .12, 0, 7.5, .3, 5, 'stone');
    for (let x of [-3, 3]) {
      footColumn(x, 0, .3, 5.7, .36);
      brackets(x, 6.25, 0, 1.3);
    }
    box(0, 6.4, 0, 8, .4, .5, 'red');
    hipRoof(0, 7, 0, 10, 7, 2.6);
    hangingLantern(1.9, 5.9, 0, .95);
    railing(v(-3, 0, 2), v(3, 0, 2), .3, 1.1);
  });

  // Smaller shrines fill the alley and the distant courtyard.
  // Foreground covered threshold used by the final pullback. The central
  // eleven-metre bay stays clear along the complete camera path.
  group(-14.5,0,38.5,0,()=>{
    for(let x=-12;x<12;x+=.28)box(x,.13,0,.265,.10,5.6,'cedar',0,.88+.10*Math.sin(x*3));
    for(const x of [-11.5,-5.5,5.5,11.5])for(const z of [-2,2]){
      footColumn(x,z,.12,6.2,.32);brackets(x,6.7,z,1.05);
    }
    for(const z of [-2,2]){box(0,6.55,z,24,.32,.40,'darkwood');box(0,6.78,z,24,.06,.48,'oldgold');}
    for(const x of [-9,9])for(const z of [-1.8,1.8])hangingLantern(x,6.15,z,.9);
    hipRoof(0,7.1,0,27,6.2,3.1);
    railing(v(5.7,0,2.5),v(11.8,0,2.5),.12,1.05);
  });
  function smallShrine(x, z, s, rot = 0) {
    group(x, 0, z, rot, () => {
      platform(0, 0, 7 * s, 6 * s, .55 * s);
      for (let a of [-1, 1]) for (let b of [-1, 1]) {
        footColumn(a * 2.6 * s, b * 2.1 * s, .8 * s, 3.4 * s, .18 * s);
        brackets(a * 2.6 * s, 4.4 * s, b * 2.1 * s, .65 * s);
      }
      box(0, 2.6 * s, -2.1 * s, 5.6 * s, 3.4 * s, .22 * s, 'darkwood');
      box(0, 2.7 * s, -1.95 * s, 3.2 * s, 2.2 * s, .1 * s, 'oldgold');
      for (let a = -5; a <= 5; a++) box(a * .24 * s, 2.7 * s, -1.8 * s, .045 * s, 2.2 * s, .05 * s, 'darkwood');
      hipRoof(0, 4.9 * s, 0, 8.1 * s, 7.1 * s, 2.4 * s);
      gableRoof(0, 4.7 * s, 2 * s, 3.5 * s, 2.1 * s, 1.6 * s);
      stairs(0, 4.3 * s, 2 * s, 5, .15 * s, .38 * s);
    });
  }
  smallShrine(-26, -6, 1.25, -.1);
  smallShrine(25, -25, .9, .15);
  smallShrine(1, -31, 1.1, 0);

  // Reference 6 reconstruction: sculpture and furnishing own distinct geometry.
  // Bodies are seated on the altar module's lotus contact planes, not floating
  // giant knees on a thin repeated terrace. Old v10 remains frozen unchanged.
  transformed(hallMatrix,()=>group(6,3.48,-14.5,0,()=>{
    emitRestoredBuddha(instance,{x:0,y:3.00,z:0,scale:2.1/3.26});
    for(const side of [-1,1])emitRestoredBuddha(instance,{x:side*2.78,y:2.85,z:-.08,scale:1.45/3.26});
  }));
  const furnishingTransform=hallMatrix.clone().multiply(new T.Matrix4().makeTranslation(6,3.48,-14.5));
  for(const furnishing of [buildRestorationAltar({materials}),buildRestorationHangingOrnaments({materials})]){
    furnishing.applyMatrix4(furnishingTransform);scene.add(furnishing);
  }
  transformed(hallMatrix,()=>{
    for (const x of [1.3,10.7])for(const z of [-14,-8])hangingLantern(x,8.5,z,.65);
  });
  const altarLight = new T.SpotLight('#ffdeb0',180,25,.62,.72,2);
  altarLight.position.copy(hallPoint([3.6,8.6,-9.5]));
  altarLight.target.position.copy(hallPoint([6,6.2,-14.5]));
  altarLight.castShadow=true;altarLight.shadow.mapSize.set(2048,2048);altarLight.shadow.bias=-.00012;altarLight.shadow.normalBias=.015;
  scene.add(altarLight,altarLight.target);
  RectAreaLightUniformsLib.init();
  const altarBounce=new T.RectAreaLight('#ffe1b2',6.0,7,5);
  altarBounce.position.set(6,13.8,-7);altarBounce.lookAt(6,11.6,-15.4);scene.add(altarBounce);
  const fillLight = new T.PointLight('#e6a75f', 55, 12, 2);
  fillLight.position.copy(hallPoint([6,5,-5]));
  scene.add(fillLight);

  // Botanical geometry: lobed maple leaves, curved lotus leaves and open petals.
  const mapleGeo = (() => {
    let p = [0, .025, 0],
      id = [];
    const n = 20;
    for (let i = 0; i < n; i++) {
      let a = i / n * Math.PI * 2,
        rr = i % 4 === 0 ? .52 : i % 2 === 0 ? .32 : .22;
      p.push(Math.cos(a) * rr, Math.abs(Math.sin(a)) * .035, Math.sin(a) * rr);
    }
    for (let i = 0; i < n; i++) id.push(0, i + 1, (i + 1) % n + 1);
    let g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    g.setIndex(id);
    g.computeVertexNormals();
    return g;
  })();
  function tree(x, z, height=9, style='maple', hue='leaf', lean=0){
    const leafRandom=botany.rng((Math.round((x+120)*937+(z+120)*9731+height*331))>>>0),lr=(a,b)=>a+(b-a)*leafRandom();
    const foliageName=style==='pine'?'needleGreen':({leaf:'foliageGreen',leafDark:'foliageDark',leafGold:'foliageGold',leafRed:'foliageRed'}[hue]);
    group(x,-.2,z,rand(0,6.28),()=>{
      const trunkH=height*.57,spread=height*.43;
      line([[0,0,0],[lean*.4,height*.23,.1],[lean,trunkH,-.2],[lean+height*.09,height*.91,.1]],height*.032,'bark',22,true);
      const branches=style==='pine'?10:12;
      for(let b=0;b<branches;b++){
        const a=b*2.39996,by=height*(.29+b*.042),extent=spread*Math.sqrt(1-b/16)*lr(.65,1.0),ex=Math.cos(a)*extent,ez=Math.sin(a)*extent,ey=Math.min(height*1.02,by+height*lr(.12,.29));
        line([[lean*.6,by,0],[ex*.48+lean,by+(ey-by)*.7,ez*.48],[ex+lean,ey,ez]],height*lr(.007,.014),'bark',16,true);
        for(let twig=0;twig<3;twig++){
          const tx=ex+lr(-1,1)*height*.10,tz=ez+lr(-1,1)*height*.1,ty=ey+lr(-.55,.65)*height*.075,rad=height*(style==='pine'?.105:.105);
          beam(v(ex*.66+lean,by+(ey-by)*.8,ez*.66),v(tx+lean,ty,tz),height*.003,'bark');
          const count=style==='pine'?190:610;
          for(let k=0;k<count;k++){
            const aa=lr(0,Math.PI*2),rr=Math.sqrt(leafRandom())*rad,lx=tx+lean+Math.cos(aa)*rr,lz=tz+Math.sin(aa)*rr,ly=ty+lr(-1,1)*rad*(style==='pine'?.19:.61)*Math.sqrt(1-rr*rr/(rad*rad));
            const size=style==='pine'?lr(.20,.36):lr(.10,.22);
            instance('leafCard',foliageName,lx,ly,lz,size,1,size,[lr(-.9,.9),lr(0,6.283),lr(-.9,.9)],lr(.74,1.25));
          }
        }
      }
      for(let i=0;i<5;i++)rock(rand(-.6,.6),-.05,rand(-.6,.6),rand(.2,.45));
    });
  }
  // Foreground crown and flank trees are deliberately asymmetrical, as in the reference.
  tree(-25, 15, 12, 'maple', 'leafGold', 1.1);
  tree(19, 12, 9.4, 'maple', 'leafRed', -.6);
  tree(-24, 1, 10.5, 'maple', 'leaf', 1.2);
  tree(18, -2, 8, 'maple', 'leafGold', .3);
  tree(-7, -4, 5.5, 'pine', 'leafDark', .7);
  tree(12, 3, 5.2, 'pine', 'leafDark', -.4);
  tree(-18, 5, 6.5, 'pine', 'leafDark', 1.2);
  tree(20, -14, 7.1, 'maple', 'leafRed');
  tree(22.5,16,17,'maple','leafGold',-1.2);
  for (let i = 0; i < 42; i++) {
    let x = rand(-55, 55),
      z = rand(-60, -28);
    if ((x + 13) * (x + 13) + (z + 14) * (z + 14) > 60) tree(x, z, rand(7, 15), i % 3 ? 'maple' : 'pine', i % 7 === 0 ? 'leafGold' : 'leafDark', rand(-1, 1));
  }
  for (const [i,p] of [[-39,18],[-37,12],[-32,17],[-31,-29],[-38,-32],[-44,-18],[-43,4]].entries())tree(p[0],p[1],rand(7,12),'maple',i%4===0?'leafRed':'leaf',rand(-.5,1));
  // Rock garden islands, surface ground cover, fern fronds and fine grasses.
  for (let p of [[-17, 1, 3.3], [-10, -2, 2.4], [14, 4, 3], [17, -1, 2.5], [-19, 12, 2.1]]) {
    let [x, z, s] = p;
    for (let j = 0; j < 16; j++) {
      const a = rand(0, 6.28),
        rr = rand(0, s);
      rock(x + Math.cos(a) * rr, rand(-.3, .05), z + Math.sin(a) * rr, rand(.28, .8));
    }
  }
  function fern(x, y, z, s = 1) {
    for (let k = 0; k < 6; k++) {
      let a = k * 2.4;
      for (let j = 0; j < 8; j++) {
        let t = j / 8,
          xx = x + Math.sin(a) * t * s,
          zz = z + Math.cos(a) * t * s,
          yy = y + Math.sin(t * Math.PI * .8) * .55 * s;
        for (let side of [-1, 1]) instance('leaf', 'leafDark', xx, yy, zz, .25 * s * (1 - t), .6, .45 * s * (1 - t), [-.15, a + side * 1.1, side * .25], rand(.8, 1.2));
      }
    }
  }
  // Foreground garden beds: the approach is embedded in planting, not a bare plaza.
  for(let side of [-1,1])for(let j=0;j<155;j++){
    const x=side<0?rand(-1.8,2.8):rand(10.3,15.4),z=rand(24,48);
    if(j%3===0)rock(x,-.07,z,rand(.18,.52));
    if(j%2===0)fern(x,.05,z,rand(.38,.85));
    for(let k=0;k<3;k++)sphere(x+rand(-.35,.35),.015,z+rand(-.3,.3),rand(.08,.25),.035,rand(.08,.24),'moss',rand(.75,1.15));
  }
  for (let i = 0; i < 550; i++) {
    let a = rand(0, 6.28),
      r = pondRadius(a),
      offset = rand(.6, 2.2),
      x = Math.cos(a) * (22.5 * r + offset),
      z = Math.sin(a) * (14.4 * r + offset) + 4.8;
    if (!(x > 2 && x < 10)) {
      if (i % 7 === 0) fern(x, .12, z, rand(.5, 1.1));
      for (let k = 0; k < 7; k++) {
        let h = rand(.17, .48),
          a = rand(0, 6.28);
        beam(v(x, .05, z), v(x + Math.sin(a) * h * .3, h, z + Math.cos(a) * h * .3), .008, 'leaf');
      }
    }
  }
  for (const [ix, iz, rx, rz] of [[-8,-3,3.4,2.2],[13,3,3.4,2.4],[-18,5,5.6,3.5],[1.1,16,2.0,2.7],[10.9,16,2.1,3.4],[-17.4,10.8,6,4.4]]) {
    const p = [ix, .5, iz],
      ids = [];
    for (let k = 0; k <= 64; k++) {
      let a = k / 64 * Math.PI * 2,
        r = 1 + .1 * Math.sin(a * 5);
      p.push(ix + Math.cos(a) * rx * r, -.13, iz + Math.sin(a) * rz * r);
      if (k < 64) ids.push(0, k + 2, k + 1);
    }
    let g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    g.setIndex(ids);
    g.computeVertexNormals();
    instance(g, 'moss', 0, 0, 0, 1, 1, 1);
    for (let k = 0; k < 35; k++) {
      let a = k / 35 * Math.PI * 2;
      rock(ix + Math.cos(a) * rx, 0, iz + Math.sin(a) * rz, rand(.23, .55));
    }
    for (let k = 0; k < 100; k++) {
      let a = rand(0, 6.28),
        r = Math.sqrt(random()) * .9,
        xx = ix + Math.cos(a) * rx * r,
        zz = iz + Math.sin(a) * rz * r,
        yy = .46 * (1 - r) + .08;
      instance('leaf', 'leafDark', xx, yy, zz, rand(.25, .45), .6, rand(.3, .7), [0, rand(0, 6.28), rand(-.2, .2)]);
      if (k % 7 === 0) {
        fern(xx, yy, zz, .65);
        let h = rand(.24, .45);
        beam(v(xx, yy, zz), v(xx, yy + h, zz), .009, 'leaf');
        for (let n = 0; n < 5; n++) {
          let aa = n / 5 * 6.28;
          sphere(xx + Math.cos(aa) * .055, yy + h, zz + Math.sin(aa) * .055, .045, .018, .045, 'petalWhite');
        }
        sphere(xx, yy + h + .02, zz, .021, .02, .021, 'pollen');
      }
    }
  }
  function lilyGeo() {
    let p = [0, .03, 0],
      idx = [],
      n = 40;
    for (let i = 0; i <= n; i++) {
      let a = .13 + i / n * (Math.PI * 2 - .26),
        r = .65 * (1 - .12 * Math.cos(a));
      p.push(Math.cos(a) * r, .03 * Math.sin(a * 6) + .065 * Math.pow(r, 2), Math.sin(a) * r);
    }
    for (let i = 0; i < n; i++) idx.push(0, i + 1, i + 2);
    let g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  const lily = lilyGeo();
  function lotus(x, z, size = 1, flower = false) {
    let y = -.04;
    instance(lily, 'lily', x, y, z, size*.70, 1, size*.70, [rand(-.05, .05), rand(0, 6.28), rand(-.05, .05)], rand(.65, 1.1));
    if (flower) {
      let fy = rand(.25, .7) * size;
      beam(v(x, -.2, z), v(x + .12, fy, z - .14), .018, 'leafDark');
      const xx = x + .12,
        zz = z - .14;
      for (let row = 0; row < 3; row++) for (let i = 0; i < (row === 2 ? 10 : 16); i++) {
        const a = i / (row === 2 ? 10 : 16) * Math.PI * 2 + row * .3;
        instance(petalGeo, random() > .15 ? 'petal' : 'petalWhite', xx, fy + row * .02, zz, size * (.48 - row * .08)*.65, size * (.30 + row * .2)*.70, size * (.48 - row * .08)*.65, [.65 - row * .38, a, 0], rand(.85, 1.12));
      }
      sphere(xx, fy + .12, zz, .08 * size, .06 * size, .08 * size, 'pollen');
    }
  }
  for (let i = 0; i < 270; i++) {
    let x = rand(-20, 20),
      z = rand(-7, 17),
      rr = x * x / 484 + (z - 4.8) * (z - 4.8) / 199;
    const avoidBridge = x > -14 && x < 3 && z > 8.7 && z < 13.4;
    const path = x > 2.5 && x < 9.5 && z < 6;
    if(inPond(x,z,.86)&&!avoidBridge&&!path&&!(x>2.7&&x<9.3)) {
      lotus(x, z, rand(.38, 1.05), random() < .37);
      if (random() < .5) lotus(x + rand(-.5, .5), z + rand(-.5, .5), rand(.4, .85), false);
    }
  }
  // Large foreground flowers provide a low camera subject and clean parallax.
  for (let p of [[-3, 14], [0, 16], [-1.5, 16], [14.5,16], [-14, 15]]) lotus(p[0], p[1], 1.5, true);
  // Fallen leaves, moss between pavers, gravel and tiny flowers are modeled from above too.
  for (let i = 0; i < 1400; i++) {
    let x = rand(-29, 28),
      z = rand(-22, 24);
    if (x * x / 484 + (z - 4.8) * (z - 4.8) / 199 > 1.08 || z > 18) {
      instance(mapleGeo, i % 3 ? 'leafGold' : 'leafRed', x, .18, z, rand(.08, .2), .15, rand(.09, .24), [0, rand(0, 6.28), 0], rand(.7, 1.1));
    }
  }
  for (let i = 0; i < 2500; i++) {
    let a = rand(0, 6.28),
      offset = rand(.4, 1.4),
      x = Math.cos(a) * (23 + offset),
      z = Math.sin(a) * (15 + offset) + 4.8;
    if (!(x > 2 && x < 10)) sphere(x, .02, z, rand(.025, .085), rand(.02, .045), rand(.025, .07), 'stone', rand(.6, 1.1));
  }
  const grassRandom=botany.rng(914731),gr=(a,b)=>a+(b-a)*grassRandom();
  for(let i=0;i<105000;i++){
    const x=gr(-57,57),z=gr(-54,52);
    const paved=(x>1.0&&x<11.4&&z>24)||(x>3.0&&x<9.1)||(z>17.4&&z<24.1&&Math.abs(x)<26)||(z<-20&&z>-28&&x>-24&&x<24)||(z<-7.8&&z>-10.5)||(x>20.8&&x<27.0&&z<23)||(x<-24&&x>-29);
    const building=(x>-9&&x<21&&z>-23&&z<.2)||(x>-30&&x<-13&&z>-34&&z<-16)||(x>-33&&x<-19&&z>-13&&z<1.5)||(x>-29&&x<.5&&z>34&&z<43);
    if(inPond(x,z,1.025)||paved||building)continue;
    const s=gr(.36,.92);instance('grass',grassRandom()>.65?'leaf':'leafDark',x,-.075,z,s,s,s,[0,gr(0,6.28),0],gr(.6,1.2));
  }
  box(0, -10, 0, 1400, 2, 1400, 'earth');
  // Three terraced banks behind the hall: planted retaining walls, rather than an empty flat apron.
  for(let course=0;course<3;course++)for(let i=0;i<66;i++){const xx=-33+i*1.02,zz=-23-course*.76+.5*Math.sin(xx*.17);rock(xx,course*.43,zz,rand(.42,.72));}
  box(0,.15,-31,65,1.8,15,'earth');
  for(let i=0;i<170;i++){const xx=rand(-32,32),zz=rand(-22,-36);sphere(xx,1.1,zz,rand(.4,1),.12,rand(.4,1),'moss',rand(.75,1.1));if(i%2===0)fern(xx,1.25,zz,rand(.65,1.4));}
  // Roof layers and a continuous enclosing wall make the garden read as a temple compound.
  group(0,1.10,0,0,()=>{smallShrine(17,-32,1.1,-.05);smallShrine(-18,-33,1.0,.05);});
  for(let i=0;i<24;i++){const xx=-34+i*3.0;box(xx,2.35,-40,2.94,2.7,.55,'plaster');box(xx,3.78,-40,3.0,.16,.74,'slate');footColumn(xx-1.5,-40,1,2.9,.12);}
  // Layered distant hills, generated with coherent trigonometric terrain, never an image.
  for (let layer = 0; layer < 3; layer++) {
    let geo = new T.PlaneGeometry(480, 280, 160, 70);
    geo.rotateX(-Math.PI / 2);
    let p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i),
        z = p.getZ(i),
        fade = Math.min(1, Math.max(0, (140 - z) / 40)) * Math.min(1, (240 - Math.abs(x)) / 40);
      p.setY(i, -8 + Math.max(0, 15 + Math.sin(x * .033 + layer * 3) * 10 + Math.cos(x * .067 - z * .032) * 6 + Math.sin(z * .05) * 6) * (1 + layer * .3) * fade);
    }
    geo.computeVertexNormals();
    const hillmat = new T.MeshStandardMaterial({
      color: new T.Color(['#697963', '#7d8a76', '#99a393'][layer]),
      roughness: 1
    });
    let mesh = new T.Mesh(geo, hillmat);
    mesh.position.set(0, -2 - layer * 1.2, -210 - layer * 150);
    scene.add(mesh);
  }

  // Stable physical illumination. The sky is a generated scattering shader, used as an HDR environment too.
  const sunDir = v(...(options.sunDirection||[-.72,.17,.51])).normalize();
  const sky = new Sky();
  sky.material.uniforms.uAerialHaze = {
    value: 0
  };
  sky.material.uniforms.uHorizonTint = {
    value: scene.fog.color.clone()
  };
  sky.material.fragmentShader = 'uniform float uAerialHaze; uniform vec3 uHorizonTint;\n' + sky.material.fragmentShader.replace('#include <tonemapping_fragment>', `float hf=1.0-smoothstep(.015,.13,normalize(vWorldPosition-cameraPosition).y);gl_FragColor.rgb=mix(gl_FragColor.rgb,uHorizonTint,uAerialHaze*hf);
#include <tonemapping_fragment>`);
  sky.scale.setScalar(4000);
  sky.material.uniforms.turbidity.value = 5.2;
  sky.material.uniforms.rayleigh.value = 1.9;
  sky.material.uniforms.mieCoefficient.value = .004;
  sky.material.uniforms.mieDirectionalG.value = .84;
  sky.material.uniforms.sunPosition.value.copy(sunDir);
  sky.material.uniforms.cloudCoverage.value = .28;
  sky.material.uniforms.cloudDensity.value = .33;
  scene.add(sky);
  const envScene = new T.Scene();
  const envSky = sky.clone();
  envScene.add(envSky);
  const pmrem = new T.PMREMGenerator(renderer);
  const env = pmrem.fromScene(envScene, .03, .1, 6000);
  scene.environment = env.texture;
  scene.environmentIntensity = .20;
  pmrem.dispose();
  const sun = new T.DirectionalLight('#ffe0ae', 4.1);
  sun.target.position.set(0,12,-10);
  sun.position.copy(sun.target.position).addScaledVector(sunDir,120);
  sun.castShadow = true;
  sun.shadow.mapSize.set(8192, 8192);
  sun.shadow.camera.left = -70;
  sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 66;
  sun.shadow.camera.bottom = -66;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 260;
  sun.shadow.normalBias = .042;
  sun.shadow.bias = -.00008;
  sun.shadow.radius = 2;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target);
  const hemi = new T.HemisphereLight('#c0d6e0', '#57472a', .24);
  scene.add(hemi);
  if(options.daylightFill){
    const daylight=new T.RectAreaLight('#d5e1e7',1.6,27,16);daylight.position.set(3,11,24);daylight.lookAt(3,12,-10);scene.add(daylight);
  }
  const puddleParts = [];
  for (const [px, pz, rx, rz] of [[-7, 20, 2.3, 1.25], [-1, 22, 2, 1.6], [6, 20.4, 1.7, .9], [11, 23, 2.8, 1.5], [-12, 23, 1.2, .7], [3, 24, 1.2, .8]]) {
    const sh = new T.Shape();
    for (let i = 0; i <= 60; i++) {
      let a = i / 60 * 6.283185,
        r = 1 + .16 * Math.sin(a * 4 + .7) + .08 * Math.cos(a * 7),
        xx = px + Math.cos(a) * rx * r,
        zz = pz + Math.sin(a) * rz * r;
      if (i === 0) sh.moveTo(xx, -zz);else sh.lineTo(xx, -zz);
    }
    puddleParts.push(new T.ShapeGeometry(sh));
  }
  const puddles = new Reflector(mergeGeometries(puddleParts), {
    textureWidth: 1600,
    textureHeight: 900,
    clipBias: .01,
    multisample: 4,
    color: 0x7a8073
  });
  puddles.rotation.x = -Math.PI / 2;
  puddles.position.y = .054;
  puddles.material.transparent = true;
  puddles.material.vertexShader=puddles.material.vertexShader.replace('void main()','varying vec3 vPuddleWorld;void main()').replace('gl_Position =','vPuddleWorld=(modelMatrix*vec4(position,1.0)).xyz;gl_Position =');
  puddles.material.fragmentShader = puddles.material.fragmentShader.replace('void main()','varying vec3 vPuddleWorld;void main()').replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );', 'float f=.0204+.9796*pow(1.0-max(0.0,normalize(cameraPosition-vPuddleWorld).y),5.0);gl_FragColor = vec4(base.rgb*.91,.025+f*.70);');
  scene.add(puddles);
  const reflectors = [water, puddles];
  for (const r of reflectors) {
    const original = r.onBeforeRender;
    r.onBeforeRender = function (...args) {
      const other = reflectors.filter(o => o !== r),
        previous = other.map(o => o.visible);
      other.forEach(o => o.visible = false);
      original.apply(this, args);
      other.forEach((o, i) => o.visible = previous[i]);
      if(r===water){
        const [rr,ss,cc]=args,oldTarget=rr.getRenderTarget(),oldXR=rr.xr.enabled,oldAuto=rr.shadowMap.autoUpdate,oldClear=rr.autoClear;
        const visibles=reflectors.map(o=>o.visible);reflectors.forEach(o=>o.visible=false);
        rr.xr.enabled=false;rr.shadowMap.autoUpdate=false;rr.autoClear=true;
        rr.setRenderTarget(refractionTarget);rr.render(ss,cc);
        rr.setRenderTarget(oldTarget);rr.xr.enabled=oldXR;rr.shadowMap.autoUpdate=oldAuto;rr.autoClear=oldClear;
        reflectors.forEach((o,i)=>o.visible=visibles[i]);
      }
    };
  }
  // Commit geometry to a small number of instanced draw calls.
  const unique = new Map();
  for (const [key, b] of [...buckets]) {
    if (b.transforms.length === 1) {
      let g = b.geometry.clone().applyMatrix4(b.transforms[0]);
      if (g.index) g = g.toNonIndexed();
      if (!g.attributes.uv) g.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.deleteAttribute('color');
      let list = unique.get(b.name) || [];
      list.push(g);
      unique.set(b.name, list);
      buckets.delete(key);
      stats[b.name] = (stats[b.name] || 0) + 1;
    }
  }
  for (const [name, list] of unique) {
    let g = mergeGeometries(list);
    let mesh = new T.Mesh(g, materials[name]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  for (const b of spatialBatches(buckets.values())) {
    let mesh = new T.InstancedMesh(b.geometry, b.material, b.transforms.length);
    for (let i = 0; i < b.transforms.length; i++) {
      mesh.setMatrixAt(i, b.transforms[i]);
      mesh.setColorAt(i, b.colors[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = !['flame', 'paper', 'waterbed'].includes(b.name);
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
    if(b.name.startsWith('foliage')||b.name==='needleGreen'){
      foliageMeshes.push(mesh);
      const normalMesh=new T.InstancedMesh(b.geometry,foliageNormalMaterial(b.material),mesh.count);normalMesh.instanceMatrix=mesh.instanceMatrix;normalMesh.instanceColor=mesh.instanceColor;normalMesh.boundingSphere=mesh.boundingSphere;normalMesh.castShadow=false;foliageNormalScene.add(normalMesh);
    }
    stats[b.name] = (stats[b.name] || 0) + b.transforms.length;
  }
  const restorationLighting=createRestorationLighting({scene,sun,renderer,materials,hallMatrix,water,puddles,sky,altarLight,altarBounce,fillLight,hemisphere:hemi},{mode:'sanctuary',reflectionSize:1536,waterResponse:false});
  scene.updateMatrixWorld(true);stage('geometry-built');
  // Bake a local reflection from the built sanctuary itself. No downloaded
  // environment map: the sculpture reflects its wooden room and fixtures.
  const reflectionCube=new T.WebGLCubeRenderTarget(512,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});
  const probe=new T.CubeCamera(.12,140,reflectionCube);probe.position.set(6,12.6,-13.9);
  const previousTarget=renderer.getRenderTarget(),previousShadowUpdate=renderer.shadowMap.autoUpdate;
  const reflectedSculpture=[];scene.traverse(o=>{if(o.isMesh&&o.material===materials.buddha)reflectedSculpture.push(o)});
  const bootstrap=new T.WebGLRenderTarget(8,8),bootstrapCamera=new T.PerspectiveCamera(60,1,.1,160);bootstrapCamera.position.set(6,10,8);bootstrapCamera.lookAt(6,12,-15);
  restorationLighting.withReflectionsHidden(()=>{
    renderer.setRenderTarget(bootstrap);renderer.render(scene,bootstrapCamera);stage('shadow-bootstrap-complete');renderer.shadowMap.autoUpdate=false;
    reflectedSculpture.forEach(o=>o.visible=false);
    try{probe.update(renderer,scene);stage('sanctuary-cubemap-complete');}finally{reflectedSculpture.forEach(o=>o.visible=true)}
  });
  const localPmrem=new T.PMREMGenerator(renderer),sanctuaryReflection=localPmrem.fromCubemap(reflectionCube.texture);
  const reflectionAudit=options.reflectionAudit?{rawCube:auditHalfFloatTarget(renderer,reflectionCube,[0,1,2,3,4,5]),filtered:auditHalfFloatTarget(renderer,sanctuaryReflection)}:null;
  if(reflectionAudit){
    const ray=new T.Raycaster(),ndc=new T.Vector2(),candidates=[];
    scene.traverse(o=>{if(o.isMesh&&o.visible&&o.material!==materials.buddha)candidates.push(o)});
    reflectionAudit.sourceHits=[];
    for(const face of reflectionAudit.rawCube)for(const pixel of face.invalidPixels){
      ndc.set((pixel.x+.5)/face.width*2-1,(pixel.y+.5)/face.height*2-1);
      ray.setFromCamera(ndc,probe.children[face.face]);
      const hits=ray.intersectObjects(candidates,false).slice(0,2).map(h=>({material:h.object.material?.name,geometry:h.object.geometry.type,instanceId:h.instanceId??null,distance:h.distance,point:h.point.toArray(),normal:h.face?.normal?.toArray()}));
      reflectionAudit.sourceHits.push({face:face.face,pixel,hits});
    }
    console.info(JSON.stringify({stage:'reflection-audit',...reflectionAudit}));
  }
  materials.buddha.envMap=sanctuaryReflection.texture;materials.buddha.envMapIntensity=1.02;materials.buddha.needsUpdate=true;
  renderer.setRenderTarget(previousTarget);renderer.shadowMap.autoUpdate=previousShadowUpdate;bootstrap.dispose();localPmrem.dispose();reflectionCube.dispose();
  stage('world-ready');
  return {
    scene,
    water,
    puddles,
    sun,
    stats,
    roofAudit,
    reflectionAudit,
    restorationLighting,
    columns,
    scaleReference:{mainHallHeight:34.475,pagodaHeight:47.21,hallColumnHeight:10.33,eyeHeight:1.7},
    foliageMeshes,foliageNormalScene,
    update(t) {
      restorationLighting.update(t);
      water.material.uniforms.time.value = t;
      sky.material.uniforms.uAerialHaze.value = Math.floor(t / 7) === 6 ? 1 : 0;
    }
  };
}
