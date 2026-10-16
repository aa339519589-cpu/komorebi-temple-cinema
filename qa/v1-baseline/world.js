import * as T from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Every visible surface, texture, plant and ornament in this world is generated here.
export function buildWorld(renderer) {
  const scene = new T.Scene();
  scene.background = new T.Color('#b9cccf');
  scene.fog = new T.FogExp2('#c8c6ac', .0055);
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
  const mat = (name, color, roughness = .7, metalness = 0, extra = {}) => materials[name] = new T.MeshStandardMaterial({
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
      let v = kind === 'wood' ? 165 : 195;
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
  mat('cedar', '#7d351c', .54, 0, {
    map: woodTex,
    bumpMap: woodTex,
    bumpScale: .035
  });
  mat('red', '#a64527', .5, 0, {
    map: woodTex,
    bumpMap: woodTex,
    bumpScale: .018
  });
  mat('darkwood', '#38251c', .69, 0, {
    map: woodTex,
    bumpMap: woodTex,
    bumpScale: .025
  });
  mat('endwood', '#89542b', .57, 0, {
    map: woodTex
  });
  mat('gold', '#c69845', .31, .78);
  mat('oldgold', '#88632e', .43, .7);
  mat('black', '#1d2320', .47, .28);
  mat('slate', '#414d51', .57, .14);
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
  mat('earth', '#3b4230', .99);
  mat('moss', '#525e25', 1);
  mat('lichen', '#7a8051', .99);
  mat('leaf', '#61752d', .79, 0, {
    side: T.DoubleSide
  });
  mat('leafDark', '#314524', .84, 0, {
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
    emissive: '#3f0e12',
    emissiveIntensity: .15,
    side: T.DoubleSide
  });
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
  mat('buddha', '#cd9f4f', .29, .78);
  const procNoise = `
varying vec3 vProc;
float phash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453123);}
float pnoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(phash(i),phash(i+vec3(1,0,0)),f.x),mix(phash(i+vec3(0,1,0)),phash(i+vec3(1,1,0)),f.x),f.y),mix(mix(phash(i+vec3(0,0,1)),phash(i+vec3(1,0,1)),f.x),mix(phash(i+vec3(0,1,1)),phash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float pfbm(vec3 p){return .57*pnoise(p)+.28*pnoise(p*2.03)+.15*pnoise(p*4.07);}`;
  for (const name of ['stone', 'paving', 'wetStone', 'cedar', 'red', 'endwood', 'darkwood', 'gold', 'oldgold', 'buddha', 'slate']) {
    const ma = materials[name];
    if (name === 'slate') {
      ma.bumpMap = stoneTex;
      ma.bumpScale = .006;
    }
    const isStone = ['stone', 'paving', 'wetStone', 'slate'].includes(name),
      isMetal = ['gold', 'oldgold', 'buddha'].includes(name);
    if (isMetal) {
      ma.bumpMap = stoneTex;
      ma.bumpScale = .004;
      ma.roughness = name === 'oldgold' ? .48 : .34;
    }
    ma.onBeforeCompile = shader => {
      shader.vertexShader = 'varying vec3 vProc;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
 vec4 pp=vec4(position,1.0);
 #ifdef USE_INSTANCING
 pp=instanceMatrix*pp;
 #endif
 vProc=(modelMatrix*pp).xyz;`);
      shader.fragmentShader = procNoise + '\n' + shader.fragmentShader;
      let surface = isStone ? `float pat=pfbm(vProc*3.0);float fine=pnoise(vProc*90.0);diffuseColor.rgb*=mix(.61,1.17,pat)*mix(.92,1.05,fine);float age=smoothstep(.6,.78,pfbm(vProc*5.3));diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.77,.91,.54),age*.38);` : isMetal ? `float pat=pfbm(vProc*17.0);diffuseColor.rgb*=mix(.66,1.09,pat);` : `float grain=pfbm(vProc*vec3(18.0,.7,18.0));float grain2=sin((vProc.x+vProc.z*.17)*100.0+grain*11.0);diffuseColor.rgb*=mix(.71,1.1,grain)*(1.0+grain2*.025);`;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + surface);
      if (isStone) shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
 float bh=pfbm(vProc*13.0);normal=perturbNormalArb(-vViewPosition,normal,vec2(dFdx(bh),dFdy(bh))*.13,faceDirection);`);
    };
    ma.customProgramCacheKey = () => name;
  }
  const unit = {
    box: new T.BoxGeometry(1, 1, 1),
    cylinder: new T.CylinderGeometry(.97, 1, 1, 32),
    thinCylinder: new T.CylinderGeometry(1, 1, 1, 8),
    cone: new T.ConeGeometry(1, 1, 12),
    sphere: new T.SphereGeometry(1, 32, 24),
    sphereLow: new T.SphereGeometry(1, 12, 8),
    sphereMedium: new T.SphereGeometry(1, 20, 14),
    paver: new RoundedBoxGeometry(1, 1, 1, 2, .055),
    rock: new T.IcosahedronGeometry(1, 2),
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
  const box = (x, y, z, w, h, d, ma = 'cedar', rot = 0, tint = 1) => instance(ma === 'paving' || ma === 'wetStone' ? 'paver' : 'box', ma, x, y, z, w, h, d, [0, rot, 0], tint);
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
  function rock(x, y, z, s = 1) {
    const t = rand(.68, 1.15);
    instance('rock', 'stone', x, y, z, s * rand(.75, 1.3), s * rand(.55, 1), s * rand(.65, 1.3), [random() * 2, random() * 6, random() * 2], t);
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
  function footColumn(x, z, bottom, h, r = .28) {
    cylinder(x, bottom + .14, z, r * 1.7, .28, 'stone');
    cylinder(x, bottom + .35, z, r * 1.17, .15, 'black');
    cylinder(x, bottom + h / 2 + .3, z, r, h, 'cedar');
    cylinder(x, bottom + h + .27, z, r * 1.18, .18, 'gold');
    for (let a = 0; a < 4; a++) {
      const angle = a * Math.PI / 2;
      box(x + Math.sin(angle) * r * .98, bottom + .53, z + Math.cos(angle) * r * .98, .1, .28, .03, 'gold', angle);
    }
  }
  function brackets(x, y, z, s = 1) {
    group(x, y, z, 0, () => {
      for (let axis = 0; axis < 2; axis++) group(0, 0, 0, axis * Math.PI / 2, () => {
        for (let level = 0; level < 3; level++) {
          let extent = (.45 + level * .18) * s;
          box(0, level * .23 * s, 0, extent * 2, .16 * s, .23 * s, 'red');
          for (let side of [-1, 1]) {
            box(side * extent, level * .23 * s + .13 * s, 0, .19 * s, .26 * s, .34 * s, 'endwood');
            box(side * extent, level * .23 * s + .28 * s, 0, .32 * s, .09 * s, .34 * s, 'gold');
            beam(v(side * extent * .3, level * .23 * s - .17 * s, 0), v(side * extent * .91, level * .23 * s + .09 * s, 0), .07 * s, 'cedar', true);
          }
        }
      });
    });
  }
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
          const t0 = Math.max(.003, row / rows - .012),
            t1 = Math.min(1.015, (row + 1) / rows + .014),
            tm = (t0 + t1) / 2,
            span = face < 2 ? 2 * (ridge + (w / 2 - ridge) * tm) : d * tm;
          const cols = Math.max(2, Math.round(span / .255));
          for (let col = 0; col < cols; col++) {
            const u0 = -1 + col * 2 / cols,
              u1 = -1 + (col + 1) * 2 / cols,
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
          beam(p1, p2, .055, 'endwood', true, .11);
          let pe = evalP(face, 1.02, u);
          sphere(pe.x, pe.y - .02, pe.z, .066, .066, .066, 'oldgold');
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
  function gableRoof(x, y, z, w, d, rise) {
    group(x, y, z, 0, () => {
      let pts = [];
      for (let i = 0; i <= 40; i++) {
        let xx = -w / 2 + w * i / 40;
        let yy = rise * Math.pow(1 - Math.abs(xx) / (w / 2), 1.4) + .3 * Math.pow(Math.abs(xx) / (w / 2), 10);
        pts.push([xx, yy, d / 2]);
      }
      line(pts, .17, 'endwood');
      line(pts.map(p => [p[0], p[1] + .16, p[2] + .03]), .045, 'gold');
      line(pts.map(p => [p[0], p[1] - .24, p[2] - .06]), .1, 'red');
      const p = [],
        id = [];
      for (let j = 0; j <= 20; j++) for (let i = 0; i <= 40; i++) {
        const [xx, yy] = pts[i];
        p.push(xx, yy + .07, -d / 2 + d * j / 20);
        if (j < 20 && i < 40) {
          let a = j * 41 + i;
          id.push(a, a + 41, a + 1, a + 1, a + 41, a + 42);
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
      g.setIndex(id);
      g.computeVertexNormals();
      instance(g, 'slate', 0, 0, 0, 1, 1, 1);
      for (let j = 0; j <= Math.round(d / .28); j++) {
        let zz = -d / 2 + d * j / Math.round(d / .28);
        line(pts.map(p => [p[0], p[1] + .1, zz]), .045, 'tileEdge');
      }
      for (let k = -8; k <= 8; k++) {
        let xx = k * w / 20,
          yy = rise * Math.pow(1 - Math.abs(xx) / (w / 2), 1.4);
        box(xx, yy * .47, d / 2 - .08, .075, yy * .83, .12, 'red');
      }
      torus(0, rise * .53, d / 2 + .11, .48, .07);
      for (let a = 0; a < 12; a++) {
        const ang = a * Math.PI / 6;
        beam(v(Math.cos(ang) * .1, rise * .53 + Math.sin(ang) * .1, d / 2 + .12), v(Math.cos(ang) * .4, rise * .53 + Math.sin(ang) * .4, d / 2 + .12), .025, 'gold');
      }
      sphere(0, rise + .2, 0, .13, .2, .14, 'gold');
    });
  }

  // Terrain, irregular pond, and a continuous hand-laid stone surface.
  box(0, -1.15, 0, 200, 1.5, 200, 'earth');
  const terrain = new T.PlaneGeometry(160, 160, 120, 120);
  terrain.rotateX(-Math.PI / 2);
  const tp = terrain.attributes.position;
  for (let i = 0; i < tp.count; i++) {
    let x = tp.getX(i),
      z = tp.getZ(i);
    tp.setY(i, -.6 + Math.sin(x * .11) * Math.cos(z * .09) * .28 + Math.sin(x * .35 + z * .2) * .1);
  }
  terrain.computeVertexNormals();
  instance(terrain, 'earth', 0, 0, 0, 1, 1, 1);
  const pondRadius = a => 1 + .055 * Math.sin(a * 5) + .04 * Math.cos(a * 7);
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
  water.material.vertexShader = water.material.vertexShader.replace('void main()', 'varying vec3 vWaterWorld; void main()').replace('gl_Position =', 'vWaterWorld = ( modelMatrix * vec4(position,1.0) ).xyz; gl_Position =');
  water.material.fragmentShader = water.material.fragmentShader.replace('void main()', 'uniform float time; varying vec3 vWaterWorld; void main()').replace('vec4 base = texture2DProj( tDiffuse, vUv );', `vec4 uv = vUv;
 float a=sin(vWaterWorld.x*2.1+vWaterWorld.z*.7+time*.55), b=sin(vWaterWorld.z*3.3-vWaterWorld.x*.8-time*.42);
 uv.x += (a+b*.45)*0.00044*uv.w; uv.y += (b+a*.3)*0.00031*uv.w;
 vec4 base=texture2DProj(tDiffuse,uv);`).replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );', 'float glint = pow(max(0.0, sin(vWaterWorld.x*6.4+vWaterWorld.z*9.2+time*.6)*sin(vWaterWorld.z*3.7-time*.3)), 12.0); gl_FragColor = vec4(mix(base.rgb,vec3(.10,.16,.085),.18) + glint*.018,1.0);');
  scene.add(water);
  box(0, -.7, 5, 46, .2, 31, 'waterbed');
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
    let pond = x * x / (22 * 22) + (z - 4.8) * (z - 4.8) / (14.1 * 14.1) < 1.02;
    const path = x > 2.1 && x < 9.7 || z > 17.5 || z < -7.8 || x > 21 || x < -23;
    if (path && (!pond || x > 3.3 && x < 8.4 && z < 4.6)) {
      let top = z > 17.5 ? .08 : .04;
      box(x, top - .15, z, rand(.94, 1.01), .24, rand(.8, .87), z > 17 ? 'wetStone' : 'paving', rand(-.014, .014), rand(.78, 1.18));
    }
  }
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
    for (let side of [-1, 1]) for (let i = 0; i < Math.round(w / 1.15); i++) box(x - w / 2 + .6 + i * 1.15, y * .5, z + side * (d / 2 + .012), 1.1, y - .23, .055, 'stone', 0, rand(.75, 1.1));
    for (let ix = -w / 2 + .5; ix < w / 2; ix += .98) for (let iz = -d / 2 + .5; iz < d / 2; iz += .92) box(x + ix, y + .36, z + iz, .94, .15, .88, 'paving', 0, rand(.87, 1.13));
  }
  function stairs(x, z, w, count, height, depth) {
    for (let i = 0; i < count; i++) box(x, (i + 1) * height / 2, z - i * depth, w, (i + 1) * height, depth + .06, 'stone', 0, rand(.85, 1.1));
    const total = count * depth;
    for (let s of [-1, 1]) {
      beam(v(x + s * (w / 2 + .08), .35, z + .35), v(x + s * (w / 2 + .08), count * height + .35, z - total + .45), .18, 'stone', true, .29);
      beam(v(x + s * (w / 2 + .22), 1.2, z + .35), v(x + s * (w / 2 + .22), count * height + 1.2, z - total + .45), .065, 'red', true, .15);
      for (let i = 0; i <= count; i += 2) {
        box(x + s * (w / 2 + .22), i * height + .65, z - i * depth, .13, 1.25, .13, 'red');
        sphere(x + s * (w / 2 + .22), i * height + 1.33, z - i * depth, .12, .15, .12, 'oldgold');
      }
    }
  }

  // Main hall: six bays, patterned shutters, carved brackets, gold hardware and ceramic roof.
  platform(6, -11, 20, 16, 1.7);
  stairs(6, 5.2, 4.6, 11, .185, .67);
  group(6, 2.1, -11, 0, () => {
    box(0, .15, 0, 18.8, .24, 14.6, 'darkwood');
    for (let x = -9; x < 9; x += .28) box(x, .3, 0, .268, .07, 14.2, 'cedar', 0, rand(.85, 1.07));
    for (let x of [-8.6, -5.15, -1.72, 1.72, 5.15, 8.6]) for (let z of [-6.8, 0, 6.8]) {
      footColumn(x, z, .3, 5.9, .28);
      brackets(x, 6.45, z, 1.18);
    }
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
      box(x, 3.25, 0, .3, 5.7, 13.5, 'plaster');
      for (let z = -6.6; z < 6.7; z += 1.1) {
        box(x, 1.22, z, .34, 1.8, 1.04, 'darkwood');
        box(x, 3.7, z, .35, 2.8, 1.04, 'black');
        for (let a = 0; a < 7; a++) box(x + Math.sign(x) * .2, 3.7, z - .48 + a * .16, .075, 2.75, .035, 'endwood');
        for (let a = 0; a < 9; a++) box(x + Math.sign(x) * .21, 2.35 + a * .33, z, .07, .04, 1.04, 'endwood');
      }
    }
    // Rear wall, embroidered-looking geometric panels generated entirely as timber and metal.
    box(0, 3.15, -7.03, 17.4, 5.8, .23, 'darkwood');
    for (let x = -7.8; x <= 8; x += 1.3) {
      box(x, 3.5, -6.85, 1.2, 4.8, .06, 'black');
      box(x, 3.5, -6.79, 1.12, 4.7, .035, 'oldgold');
      box(x, 3.5, -6.75, .97, 4.55, .025, 'darkwood');
      for (let j = 0; j < 6; j++) {
        torus(x, 1.55 + j * .72, -6.71, .28, .018, 'gold');
        for (let a = 0; a < 4; a++) box(x + Math.cos(a * 1.57) * .2, 1.55 + j * .72 + Math.sin(a * 1.57) * .2, -6.7, .13, .02, .03, 'oldgold', a * .78);
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
    // Coffered ceiling with rosettes and gold corner fasteners.
    for (let ix = -8; ix <= 8; ix += 1.05) for (let iz = -6.4; iz <= 6.4; iz += 1.05) {
      box(ix, 6.6, iz, .95, .1, .95, 'darkwood');
      box(ix, 6.53, iz, .76, .06, .76, 'red');
      sphere(ix, 6.47, iz, .19, .03, .19, 'gold');
      for (let a = 0; a < 4; a++) sphere(ix + Math.cos(a * 1.57) * .22, 6.47, iz + Math.sin(a * 1.57) * .22, .05, .025, .05, 'gold');
    }
    for (let x = -8.5; x <= 8.5; x += 1.05) box(x, 6.45, 0, .065, .18, 13.8, 'oldgold');
    for (let z = -6.8; z <= 6.8; z += 1.05) box(0, 6.45, z, 17.4, .18, .065, 'oldgold');
    for (let x of [-9.4, 9.4]) railing(v(x, 0, -7.5), v(x, 0, 7.4), .3, 1);
    railing(v(-9.4, 0, 7.4), v(-2.5, 0, 7.4), .3, 1);
    railing(v(2.5, 0, 7.4), v(9.4, 0, 7.4), .3, 1);
  });
  // Deep carved transoms, floral scrolls and joinery pins along all six bays.
  for (let bx of [-.88, 2.55, 6, 9.45, 12.9]) group(bx, 7.9, -3.88, 0, () => {
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
    sphere(0, 0, .12, .17, .12, .035, 'oldgold');
    for (let k = 0; k < 8; k++) {
      let a = k * Math.PI / 4;
      line([[0, 0, .14], [Math.cos(a) * .28, Math.sin(a) * .14, .17], [Math.cos(a) * .42, Math.sin(a) * .2, .12]], .015, 'gold', 8);
    }
  });
  hipRoof(6, 9.65, -11, 23, 19, 4.7);
  gableRoof(6, 9.1, -2.9, 8.2, 5.8, 2.8);
  // Suspended corner wind chimes, flame pendants and chains.
  function pendant(x, y, z, s = .65) {
    cylinder(x, y, z, .02, 1.2 * s, 'oldgold');
    sphere(x, y - .8 * s, z, .19 * s, .23 * s, .19 * s, 'gold');
    cylinder(x, y - 1 * s, z, .1 * s, .19 * s, 'gold');
    box(x, y - 1.35 * s, z, .04, .42 * s, .08, 'oldgold');
  }
  for (let x of [-5.5, 17.5]) for (let z of [-20.5, -1.5]) pendant(x, 9.2, z, .8);

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

  // The red arched bridge is a real curved deck, down to plank seams and bronze post caps.
  group(-6, 0, 4.6, .08, () => {
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
  for (let p of [[-17, 10, 1.25], [15, 7, 1.2], [1.1, 10.5, 1.1], [10.9, 10.5, 1.1], [-19, -1, 1.05], [18, -7, 1.15], [-6, -7, .9], [22, 14, 1.2]]) lantern(p[0], 0, p[1], p[2]);
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

  // A sculpted seated Buddha, lotus throne, aureole and a densely ornamented altar.
  function lotusPetalGeometry() {
    const p = [],
      ids = [];
    for (let j = 0; j <= 8; j++) for (let i = 0; i <= 6; i++) {
      const t = j / 8,
        u = i / 6 * 2 - 1,
        width = Math.pow(Math.sin(t * Math.PI), .72) * .38;
      p.push(u * width, Math.pow(t, 2) * .7 + u * u * .09, t * .85);
      if (j < 8 && i < 6) {
        let a = j * 7 + i;
        ids.push(a, a + 7, a + 1, a + 1, a + 7, a + 8);
      }
    }
    let g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    g.setIndex(ids);
    g.computeVertexNormals();
    return g;
  }
  const petalGeo = lotusPetalGeometry();
  group(6, 2.48, -14.5, 0, () => {
    for (let j = 0; j < 5; j++) {
      box(0, .15 + j * .2, 0, 7 - j * .36, .24, 3.4 - j * .17, j % 2 ? 'black' : 'gold');
      for (let x = -3 + j * .18; x <= 3 - j * .18; x += .31) {
        sphere(x, .2 + j * .2, 1.72 - j * .085, .09, .055, .04, 'oldgold');
      }
    }
    box(0, 1.1, 0, 5.8, .2, 2.9, 'gold');
    box(0, 1.3, 0, 5.4, .25, 2.65, 'black');
    for (let j = 0; j < 2; j++) for (let i = 0; i < 24; i++) {
      let a = i / 24 * Math.PI * 2;
      instance(petalGeo, 'gold', Math.sin(a) * 1.07, 1.38 + j * .15, Math.cos(a) * .65, .63, .49, .63, [-.4, a, 0]);
    }
    sphere(0, 1.75, .05, 1.42, .29, .78, 'buddha');
    // Folded knees, overlapping robe, torso and shoulder anatomy.
    sphere(-.68, 1.95, .5, .95, .36, .59, 'buddha', 1, [0, .17, -.09]);
    sphere(.67, 1.96, .52, .98, .36, .59, 'buddha', .96, [0, -.17, .09]);
    sphere(0, 2.17, .16, 1.05, .41, .61, 'buddha');
    sphere(0, 2.87, -.02, .76, 1.02, .48, 'buddha');
    sphere(-.44, 3.37, -.01, .55, .38, .4, 'buddha');
    sphere(.44, 3.37, -.01, .55, .38, .4, 'buddha');
    cylinder(0, 3.74, 0, .24, .52, 'buddha');
    // A continuous sculpted face: cheeks, eye sockets, brow, nose and lips are relief in one mesh.
    const head = new T.SphereGeometry(1, 128, 96),
      hp = head.attributes.position;
    for (let i = 0; i < hp.count; i++) {
      let nx = hp.getX(i),
        ny = hp.getY(i),
        nz = hp.getZ(i),
        xx = nx * .43,
        yy = ny * .58,
        zz = nz * .39;
      const gauss = (x, y, sx, sy) => Math.exp(-Math.pow((xx - x) / sx, 2) - Math.pow((yy - y) / sy, 2));
      if (nz > 0) {
        let relief = .057 * gauss(0, .035, .065, .20) + .093 * gauss(0, -.105, .083, .066) + .022 * gauss(-.19, -.09, .14, .15) + .022 * gauss(.19, -.09, .14, .15) - .019 * gauss(-.18, .07, .12, .055) - .019 * gauss(.18, .07, .12, .055) + .021 * gauss(0, -.235, .135, .035) + .019 * gauss(0, -.33, .17, .09);
        zz += relief * Math.pow(nz, .5);
      }
      hp.setXYZ(i, xx, yy + 4.2, zz);
    }
    head.computeVertexNormals();
    instance(head, 'buddha', 0, 0, 0, 1, 1, 1);
    sphere(0, 4.76, -.025, .20, .22, .20, 'oldgold');
    sphere(0, 4.96, -.025, .075, .12, .075, 'buddha');
    for (let side of [-1, 1]) {
      sphere(side * .43, 4.09, -.015, .075, .24, .09, 'buddha');
      line([[side * .45, 4.28, .035], [side * .49, 4.16, .065], [side * .47, 3.94, .055], [side * .42, 3.92, .055]], .018, 'oldgold', 20);
      line([[side * .075, 4.28, .362], [side * .18, 4.255, .365], [side * .275, 4.275, .32]], .007, 'oldgold', 16);
      line([[side * .065, 4.37, .365], [side * .18, 4.39, .356], [side * .29, 4.35, .31]], .008, 'oldgold', 16);
    }
    line([[-.11, 3.965, .368], [0, 3.953, .397], [.11, 3.965, .368]], .006, 'oldgold', 22);
    sphere(0, 4.44, .358, .023, .023, .013, 'gold');
    // Tight curls are confined to the crown, keeping the face free of separate beads.
    for (let row = 0; row < 6; row++) {
      let yy = 4.53 + row * .047,
        rr = .439 * Math.sqrt(Math.max(.01, 1 - Math.pow((yy - 4.2) / .59, 2))),
        count = Math.round(rr * 95);
      for (let k = 0; k < count; k++) {
        let a = k / count * Math.PI * 2 + row * .12;
        sphere(Math.sin(a) * rr, yy, Math.cos(a) * rr - .014, .031, .027, .031, 'oldgold', rand(.8, 1.15));
      }
    }
    for (const [xx, yy, zz, rr] of [[-.62, 3.4, .08, .19], [-.95, 2.65, .35, .16], [.66, 3.4, .02, .19], [.92, 2.75, .33, .16]]) sphere(xx, yy, zz, rr, rr, rr, 'buddha');
    // Resting left hand, raised right hand and individually articulated fingers.
    beam(v(-.62, 3.4, .08), v(-.95, 2.65, .35), .18, 'buddha');
    beam(v(-.95, 2.65, .35), v(-.28, 2.3, .69), .15, 'buddha');
    sphere(-.19, 2.3, .71, .29, .08, .17, 'buddha');
    beam(v(.66, 3.4, .02), v(.92, 2.75, .33), .17, 'buddha');
    beam(v(.92, 2.75, .33), v(.73, 3.45, .6), .13, 'buddha');
    sphere(.73, 3.54, .62, .145, .2, .085, 'buddha');
    for (let i = 0; i < 4; i++) beam(v(.64 + i * .057, 3.57, .63), v(.63 + i * .064, 3.9 - Math.abs(i - 1.3) * .035, .63), .027, 'buddha');
    beam(v(.63, 3.48, .65), v(.53, 3.62, .67), .035, 'buddha');
    for (let i = 0; i < 14; i++) {
      let y = 2.17 + i * .09;
      line([[-.7 - i * .012, y, -.1], [-.48, y - .08, .47], [.03, y - .19, .49], [.6, y - .1, .31]], .005, 'oldgold', 24);
    }
    for (let i = 0; i < 7; i++) line([[-1.35 + i * .11, 1.98, .68], [-.65, 2.06 + i * .015, .95], [.3 + i * .12, 2.06, .88]], .006, 'oldgold', 30);
    // Filigree aureole: concentric rings, beaded rims and 48 raised flame tongues.
    for (let r of [1.72, 1.86, 2.04]) torus(0, 3.1, -.72, r, .035, 'gold');
    for (let i = 0; i < 72; i++) {
      const a = i / 72 * Math.PI * 2;
      sphere(Math.cos(a) * 1.92, 3.1 + Math.sin(a) * 1.92, -.71, .047, .047, .035, 'gold');
    }
    for (let i = 0; i < 48; i++) {
      let a = i / 48 * Math.PI * 2;
      group(Math.cos(a) * 2.06, 3.1 + Math.sin(a) * 2.06, -.72, -a, () => {});
      const dx = Math.cos(a),
        dy = Math.sin(a);
      line([[dx * 2.02, 3.1 + dy * 2.02, -.72], [dx * 2.26 - dy * .08, 3.1 + dy * 2.26 + dx * .08, -.72], [dx * 2.45, 3.1 + dy * 2.45, -.72]], .034, 'gold', 12);
    }
    // Side shrines and altar vessels.
    for (let s of [-1, 1]) {
      for (let j = 0; j < 3; j++) {
        const xx = s * (2.5 + j * .65);
        cylinder(xx, 1.4, .15, .22, .35, 'gold');
        sphere(xx, 1.89, .12, .17, .35, .13, 'gold');
        sphere(xx, 2.31, .12, .105, .14, .1, 'gold');
        torus(xx, 2.05, -.09, .37, .025);
      }
      for (let x of [s * 2.2, s * 3.1]) {
        cylinder(x, 1.7, 1.2, .075, 1.1, 'gold');
        cylinder(x, 2.25, 1.2, .18, .08, 'gold');
        cylinder(x, 2.44, 1.2, .06, .32, 'paper');
        sphere(x, 2.67, 1.2, .035, .1, .035, 'flame');
      }
    }
    box(0, 1.22, 2.0, 6.8, .23, 1.1, 'black');
    box(0, 1.35, 2.0, 6.9, .06, 1.16, 'gold');
    for (let x of [-2.9, 2.9]) box(x, .65, 2.0, .3, 1.1, .5, 'black');
    sphere(0, 1.65, 2.1, .4, .3, .27, 'oldgold');
    cylinder(0, 1.9, 2.1, .27, .12, 'gold');
    for (let a = 0; a < 6; a++) cylinder(Math.sin(a) * .11, 2.13, 2.1 + Math.cos(a) * .08, .008, .4, 'darkwood');
  });
  // Hanging gold garlands and sanctuary lights, all static to eliminate temporal sparkle.
  for (let sx of [-1, 1]) for (let j = 0; j < 8; j++) {
    const x = 6 + sx * (.7 + j * .25),
      z = -13 + Math.sin(j) * .3;
    for (let k = 0; k < 8; k++) {
      let yy = 8.32 - k * .22 - j * .04;
      sphere(x, yy, z, .035, .07, .035, 'gold');
      if (k % 2 === 0) torus(x, yy - .09, z, .065, .012);
    }
  }
  for (let x of [1.3, 10.7]) for (let z of [-14, -8]) hangingLantern(x, 7.5, z, .65);
  const altarLight = new T.PointLight('#ffd28b', 40, 17, 2);
  altarLight.position.set(6, 7.5, -11.5);
  scene.add(altarLight);
  const fillLight = new T.PointLight('#e6a75f', 8, 12, 2);
  fillLight.position.set(6, 4, -5);
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
  function tree(x, z, height = 9, style = 'maple', hue = 'leaf', lean = 0) {
    group(x, -.2, z, rand(0, 6.28), () => {
      const trunkH = height * .57,
        spread = height * .46;
      line([[0, 0, 0], [lean * .4, height * .23, .1], [lean, trunkH, -.2], [lean + height * .09, height * .84, .1]], height * .032, 'darkwood', 15, true);
      for (let b = 0; b < 9; b++) {
        let a = b * 2.4,
          by = height * (.35 + b * .04),
          ex = Math.cos(a) * spread * rand(.55, 1),
          ez = Math.sin(a) * spread * rand(.55, 1),
          ey = height * rand(.64, 1.0);
        const start = [lean * .6, by, 0],
          mid = [ex * .48 + lean, by + (ey - by) * .67, ez * .48],
          end = [ex + lean, ey, ez];
        line([start, mid, end], height * rand(.006, .013), 'darkwood', 10, true);
        for (let twig = 0; twig < 3; twig++) {
          let tx = ex + rand(-1.2, 1.2) * height * .13,
            tz = ez + rand(-1.2, 1.2) * height * .13,
            ty = ey + rand(-.7, .7) * height * .1;
          beam(v(ex * .65 + lean, by + (ey - by) * .8, ez * .65), v(tx + lean, ty, tz), height * .003, 'darkwood');
          const count = style === 'pine' ? 70 : 105;
          for (let k = 0; k < count; k++) {
            let aa = rand(0, Math.PI * 2),
              rr = Math.sqrt(random()) * height * (style === 'pine' ? .14 : .16),
              lx = tx + lean + Math.cos(aa) * rr,
              lz = tz + Math.sin(aa) * rr,
              ly = ty + rand(-.55, .65) * height * .14;
            let size = rand(.28, .58) * (height / 8);
            instance(style === 'maple' ? mapleGeo : 'leaf', hue, lx, ly, lz, size, 1, size, [rand(-.55, .55), rand(0, 6.28), rand(-.45, .45)], rand(.57, 1.22));
          }
        }
      }
      for (let i = 0; i < 5; i++) rock(rand(-.6, .6), -.05, rand(-.6, .6), rand(.2, .45));
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
  for (let i = 0; i < 42; i++) {
    let x = rand(-55, 55),
      z = rand(-60, -28);
    if ((x + 13) * (x + 13) + (z + 14) * (z + 14) > 60) tree(x, z, rand(7, 15), i % 3 ? 'maple' : 'pine', i % 7 === 0 ? 'leafGold' : 'leafDark', rand(-1, 1));
  }
  for (let i = 0; i < 9; i++) tree(-rand(27, 39), rand(-25, 21), rand(7, 12), 'maple', i % 4 === 0 ? 'leafRed' : 'leaf', rand(-.5, 1));
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
  for (const [ix, iz, rx, rz] of [[-8, -3, 3.4, 2.2], [13, 3, 3.4, 2.4], [-18, 5, 2.8, 3]]) {
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
    instance(lily, 'lily', x, y, z, size, 1, size, [rand(-.05, .05), rand(0, 6.28), rand(-.05, .05)], rand(.65, 1.1));
    if (flower) {
      let fy = rand(.25, .7) * size;
      beam(v(x, -.2, z), v(x + .12, fy, z - .14), .018, 'leafDark');
      const xx = x + .12,
        zz = z - .14;
      for (let row = 0; row < 3; row++) for (let i = 0; i < (row === 2 ? 10 : 16); i++) {
        const a = i / (row === 2 ? 10 : 16) * Math.PI * 2 + row * .3;
        instance(petalGeo, random() > .15 ? 'petal' : 'petalWhite', xx, fy + row * .02, zz, size * (.48 - row * .08), size * (.30 + row * .2), size * (.48 - row * .08), [.65 - row * .38, a, 0], rand(.85, 1.12));
      }
      sphere(xx, fy + .12, zz, .08 * size, .06 * size, .08 * size, 'pollen');
    }
  }
  for (let i = 0; i < 270; i++) {
    let x = rand(-20, 20),
      z = rand(-7, 17),
      rr = x * x / 484 + (z - 4.8) * (z - 4.8) / 199;
    const avoidBridge = x > -14 && x < 3 && z > 2 && z < 7;
    const path = x > 2.5 && x < 9.5 && z < 6;
    if (rr < .85 && !avoidBridge && !path) {
      lotus(x, z, rand(.38, 1.05), random() < .37);
      if (random() < .5) lotus(x + rand(-.5, .5), z + rand(-.5, .5), rand(.4, .85), false);
    }
  }
  // Large foreground flowers provide a low camera subject and clean parallax.
  for (let p of [[-3, 14], [0, 13], [-1.5, 16], [10, 12], [-14, 15]]) lotus(p[0], p[1], 1.5, true);
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
  box(0, -10, 0, 1400, 2, 1400, 'earth');
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
  const sunDir = v(-.72, .17, .51).normalize();
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
  scene.environmentIntensity = .125;
  pmrem.dispose();
  const sun = new T.DirectionalLight('#ffcf8a', 4.1);
  sun.position.copy(sunDir).multiplyScalar(80);
  sun.target.position.set(0, 2, -5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(8192, 8192);
  sun.shadow.camera.left = -48;
  sun.shadow.camera.right = 48;
  sun.shadow.camera.top = 43;
  sun.shadow.camera.bottom = -43;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 190;
  sun.shadow.normalBias = .042;
  sun.shadow.bias = -.00008;
  sun.shadow.radius = 2;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target);
  const hemi = new T.HemisphereLight('#c0d6e0', '#57472a', .24);
  scene.add(hemi);
  // Translucent, static shafts of warm air in the sanctuary; deterministic and noise-free.
  const shaftMat = new T.MeshBasicMaterial({
    color: '#ffe5a3',
    transparent: true,
    opacity: .022,
    depthWrite: false,
    side: T.DoubleSide,
    blending: T.AdditiveBlending
  });
  for (let i = 0; i < 4; i++) {
    let geo = new T.CylinderGeometry(.15, .6, 7, 12, 1, true);
    let mesh = new T.Mesh(geo, shaftMat);
    mesh.position.set(1 + i * 1.4, 5.2, -7 - i * .8);
    mesh.rotation.z = -.47;
    scene.add(mesh);
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
  puddles.position.y = .065;
  puddles.material.transparent = true;
  puddles.material.fragmentShader = puddles.material.fragmentShader.replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );', 'gl_FragColor = vec4(base.rgb*.79, .57);');
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
  for (const b of buckets.values()) {
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
    stats[b.name] = (stats[b.name] || 0) + b.transforms.length;
  }
  scene.updateMatrixWorld(true);
  return {
    scene,
    water,
    puddles,
    sun,
    stats,
    update(t) {
      water.material.uniforms.time.value = t;
      sky.material.uniforms.uAerialHaze.value = Math.floor(t / 7) === 6 ? 1 : 0;
    }
  };
}
