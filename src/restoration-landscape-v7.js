import * as T from 'three';
import {createRestorationLotusLeaf} from './restoration-lotus-leaf.js';
import {createRestorationLotusPetal} from './restoration-lotus-petal.js';
import {createRestorationUnderstoryLeaf,createRestorationLanceLeaf} from './restoration-thin-leaf.js';
export {createRestorationUnderstoryLeaf} from './restoration-thin-leaf.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { granite, flagstone, timberSweep } from './natural-forms.js';
import { foliageNormalMaterial } from './botany.js';
import { flowerCrest, carvedLeaf } from './ornaments.js';
import {referenceExteriorPlan,createReferenceExteriorMatrix,mapReferenceExteriorPoint} from './restoration-landscape-layout.js';

/** Reference reconstruction, 16 October 2026.
 * World units are metres. This module owns no water, lights or render targets.
 * It replaces the old bridge and lotus blocks; shore/garden are independent.
 * Sources viewed: refs 1, 2, 3, 4, 7, 8, 9, 10 (actual supplied pixels).
 * V7: opt-in reference10 six-primary topology. Default refs2/3 geometry is unchanged.
 * Reference10 uniform fractions are an explicit initial model, not fitted photo spacing.
 */
export const landscapePlacement = Object.freeze({
  waterY: -.12, pondCenter: [0, 4.8], pondRadii: [22.3, 14.2],
  bridge: { position: [-6, 0, 11], yaw: .08, span: 15.6, width: 3.25 },
  path: { centerX: 6, width: 5.02, nearZ: 18.2, farZ: 43, stoneTop: .05 },
});
const TAU = Math.PI * 2;
const rng = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const v = (x, y, z) => new T.Vector3(x, y, z);
const clamp = T.MathUtils.clamp;
// Closed lathe with unique poles and wrapped rings. No collapsed pole quads.
function closedTurnedProfile(profile,segments=32){
  const p=[],uv=[],ids=[],rings=[];
  for(let j=0;j<profile.length;j++){
    const[r,y]=profile[j],indices=[];
    if(r===0){indices.push(p.length/3);p.push(0,y,0);uv.push(.5,j/(profile.length-1));}
    else for(let i=0;i<segments;i++){const a=i/segments*TAU;indices.push(p.length/3);p.push(Math.cos(a)*r,y,Math.sin(a)*r);uv.push(i/segments,j/(profile.length-1));}
    rings.push(indices);
  }
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){
    const a=rings[j],b=rings[j+1],n=(i+1)%segments;
    if(a.length===1)ids.push(a[0],b[i],b[n]);
    else if(b.length===1)ids.push(a[i],b[0],a[n]);
    else ids.push(a[i],b[i],b[n],a[i],b[n],a[n]);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}
export function createRestorationBridgeFinial(thick=.36){
  const cap=closedTurnedProfile([[0,0],[thick*.48,0],[thick*.60,.025],[thick*.60,.055],[thick*.43,.082],[thick*.46,.12],[thick*.72,.165],[thick*.82,.225],[thick*.72,.285],[thick*.48,.335],[thick*.23,.38],[thick*.075,.43],[0,.45]],32);
  cap.name='bridge-principal-giboshi-single-poles';return cap;
}
function stableLeafNormals(g) {
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) if (n.getX(i) ** 2 + n.getY(i) ** 2 + n.getZ(i) ** 2 < 1e-12) n.setXYZ(i, 0, 1, 0);
  return g;
}
const pondRadius = a => 1 + .115 * Math.sin(a * 3) + .055 * Math.cos(a * 7) + .026 * Math.sin(a * 11);
function inPond(x, z, margin = 1) {
  const a = Math.atan2((z - 4.8) / 14.2, x / 22.3);
  return Math.hypot(x / 22.3, (z - 4.8) / 14.2) < pondRadius(a) * margin;
}
const existingIslands = [
  [-8,-3,3.4,2.2], [13,3,3.4,2.4], [-18,5,5.6,3.5],
  [1.1,16,2.0,2.7], [10.9,16,2.1,3.4], [-17.4,10.8,6.0,4.4]
];
function onPlantedIsland(x, z, layout=false) {
  return existingIslands.some(([cx,cz,rx,rz]) => {
    if(layout){const p=mapReferenceExteriorPoint([cx,0,cz]);cx=p[0];cz=p[2];rx*=referenceExteriorPlan.scale;rz*=referenceExteriorPlan.scale;}
    const dx=(x-cx)/rx, dz=(z-cz)/rz, a=Math.atan2(dz,dx);
    return Math.hypot(dx,dz) < 1 + .1*Math.sin(a*5);
  });
}
function dataMap(size, pixel) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const c = pixel(x / (size - 1), y / (size - 1));
    for (let k = 0; k < 3; k++) data[(y * size + x) * 4 + k] = clamp(Math.round(c[k]), 0, 255);
    data[(y * size + x) * 4 + 3] = c[3] ?? 255;
  }
  const t = new T.DataTexture(data, size, size, T.RGBAFormat);
  t.colorSpace = T.SRGBColorSpace;
  t.magFilter = T.LinearFilter; t.minFilter = T.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}
function lotusLeafGeometry(seed=1){return createRestorationLotusLeaf(seed);}
function petalGeometry(seed=1){return createRestorationLotusPetal(seed);}
// Direct replacement for legacy world.unit.leaf. Same local origin and unit
// length, but a real shallow lamina instead of the old five-vertex raised tent.
function lanceLeafGeometry(){return createRestorationLanceLeaf();}
function mapleLeafGeometry() {
  // Seven unequal narrow lobes, not a regular star; petiole is the local origin.
  const contour = [[0, -.41],[-.10,-.23],[-.25,-.25],[-.21,-.12],[-.43,-.09],[-.28,.03],[-.46,.20],[-.24,.17],[-.29,.42],[-.10,.24],[0,.56],[.10,.24],[.29,.42],[.24,.17],[.46,.20],[.28,.03],[.43,-.09],[.21,-.12],[.25,-.25],[.10,-.23]];
  const p = [0, .025, 0], uv = [.5, .5], ids = [];
  const rim = [];
  for (let i = 0; i < contour.length; i++) {
    const a = contour[i], b = contour[(i + 1) % contour.length];
    for (let j = 0; j < 3; j++) { const t = j / 3, d = j === 1 ? .008 : 0; rim.push([T.MathUtils.lerp(a[0], b[0], t) - (b[1] - a[1]) * d, T.MathUtils.lerp(a[1], b[1], t) + (b[0] - a[0]) * d]); }
  }
  for (const [x, z] of rim) { p.push(x, .016 * Math.sin(z * 8) + Math.abs(x) * .025, z); uv.push(x + .5, z + .43); }
  for (let i = 0; i < rim.length; i++) ids.push(0, i + 1, (i + 1) % rim.length + 1);
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(ids); return stableLeafNormals(g);
}
function stoneVariant(seed) {
  const g = granite(seed), p = g.attributes.position, n = g.attributes.normal, colors = [];
  const mossPos = [], mossCol = [];
  const mask = (x, y, z, ny) => ny > .18 && y > -.03 && Math.sin(x * 7.1 + seed) + Math.cos(z * 8.3 - seed) + Math.sin(x * 3.2 + z * 6.8) > .35;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), fleck = .75 + .14 * Math.sin(x * 23 + z * 31 + seed) * Math.cos(y * 37 - z * 12);
    colors.push(fleck * .93, fleck, fleck * .92);
  }
  // Actual surface-conforming patches, rather than detached moss balls.
  const ix = g.index;
  const count = ix ? ix.count : p.count;
  for (let k = 0; k < count; k += 3) {
    const ids = [0, 1, 2].map(j => ix ? ix.getX(k + j) : k + j);
    const c = ids.reduce((s, i) => s.add(v(p.getX(i), p.getY(i), p.getZ(i))), new T.Vector3()).multiplyScalar(1 / 3);
    const ny = ids.reduce((s, i) => s + n.getY(i), 0) / 3;
    if (!mask(c.x, c.y, c.z, ny)) continue;
    for (const i of ids) {
      mossPos.push(p.getX(i) + n.getX(i) * .006, p.getY(i) + n.getY(i) * .006, p.getZ(i) + n.getZ(i) * .006);
      const f = .69 + .24 * Math.sin(p.getX(i) * 17 + p.getZ(i) * 23 + seed);
      mossCol.push(f * .72, f, f * .53);
    }
  }
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  const moss = new T.BufferGeometry(); moss.setAttribute('position', new T.Float32BufferAttribute(mossPos, 3));
  moss.setAttribute('color', new T.Float32BufferAttribute(mossCol, 3)); moss.computeVertexNormals();
  return { rock: g, moss };
}

export function buildRestorationLandscape({ materials: source = {}, options = {} } = {}) {
  const started = performance.now();
  const reference10Bridge = options.referenceMode === 'reference10';
  if (options.bridgePrimaryFractions !== undefined && !reference10Bridge) throw new Error('bridgePrimaryFractions requires referenceMode: reference10');
  const primaryFractions = reference10Bridge ? [...(options.bridgePrimaryFractions ?? [0, .2, .4, .6, .8, 1])] : [0, .25, .5, .75, 1];
  if (reference10Bridge && (primaryFractions.length !== 6 || primaryFractions.some(f => !Number.isFinite(f)) || primaryFractions[0] !== 0 || primaryFractions[5] !== 1 || primaryFractions.slice(1).some((f,i) => (f-primaryFractions[i])*15.6 < .62))) throw new Error('Reference10 bridge fractions require six finite ordered values, endpoints 0/1, and at least .62m local separation');
  const secondaryPerBay = reference10Bridge ? 1 : 2;
  const primaryWidths = primaryFractions.map((_,i) => i === 0 || i === primaryFractions.length-1 || !reference10Bridge && i === 2 ? .36 : .34);
  let random = rng(options.seed ?? 610163);
  const rr = (a, b) => a + (b - a) * random();
  const root = new T.Group(); root.name = 'reference-restoration-landscape';
  const layout=!!options.layout,layoutMatrix=layout?createReferenceExteriorMatrix():new T.Matrix4(),layoutInverse=layoutMatrix.clone().invert();
  const onIsland=(x,z)=>onPlantedIsland(x,z,layout);
  function pathBlocked(x,z){const p=v(x,0,z).applyMatrix4(layoutInverse);return p.x>2.6&&p.x<9.4;}
  function bridgeBlocked(x,z){
    const p=v(x,0,z).applyMatrix4(layoutInverse);p.sub(v(-6,0,11)).applyAxisAngle(v(0,1,0),-.08);
    return Math.abs(p.x)<8.15&&Math.abs(p.z)<1.92;
  }
  function lensBlocked(x,z,diameter){if(!layout)return false;const c=referenceExteriorPlan.camera.position;return Math.hypot(x-c[0],z-c[2])<Math.max(options.cameraClearance??1.45,diameter*1.6);}

  const groups = Object.fromEntries(['bridge', 'lotus', 'shore', 'garden', 'path', 'islandPlanting'].map(name => {
    const group = new T.Group(); group.name = `restored-${name}`; root.add(group); return [name, group];
  }));
  const materials = {}, ownedMaterials = [], textures = [];
  function material(name, color, roughness, extra = {}, inherit = null) {
    const m = inherit && source[inherit] ? source[inherit].clone() : new T.MeshStandardMaterial();
    m.name = `restoration-${name}`; m.color.set(color); m.roughness = roughness; m.metalness = 0;
    Object.assign(m, extra); materials[name] = m; ownedMaterials.push(m); return m;
  }
  const leafMap = dataMap(256, (u, w) => {
    const x = (u - .5) * 2, z = (w - .5) * 2, a = Math.atan2(z, x), r = Math.hypot(x, z);
    const vein = Math.pow(Math.max(0, Math.cos(a * 26 + Math.sin(r * 3) * .1)), 30) * (.09 + .09 * r);
    const f = 1 + vein + .035 * Math.sin(u * 219 + w * 37) - .09 * r;
    return [89 * f, 124 * f, 49 * f];
  }); textures.push(leafMap);
  const petalMap = dataMap(128, (u, t) => {
    const pink = Math.pow(t, 2.05), vein = .98 + .018 * Math.cos((u - .5) * (34 + t * 18));
    return [(228 - 32 * pink) * vein, (205 - 100 * pink) * vein, (191 - 42 * pink) * vein];
  }); textures.push(petalMap);
  material('bridgeRed', '#8b3d28', .42, {}, 'red');
  material('bridgeDark', '#3e2b21', .58, {}, 'darkwood');
  material('bronze', '#a38b4e', .34, { metalness: .84 });
  material('capDark', '#262b24', .35, { metalness: .55 });
  material('stone', '#777f75', .62, { vertexColors: true }, 'stone');
  material('moss', '#6a793b', .96, { vertexColors: true });
  material('wetStone', '#69716b', .26, { metalness: .015 }, 'wetStone');
  if (materials.wetStone.bumpMap) materials.wetStone.bumpScale = .012;
  material('leaf', '#ffffff', .66, { map: leafMap, side: T.DoubleSide });
  material('stalk', '#57713b', .66);
  material('petal', '#ffffff', .76, { map: petalMap, side: T.DoubleSide });
  material('pollen', '#b99e41', .68);
  material('fern', '#466342', .76, { side: T.DoubleSide });
  material('azaleaLeaf', '#354f31', .62, { side: T.DoubleSide });
  material('flowerPink', '#dca9b7', .72, { side: T.DoubleSide });
  material('flowerPale', '#ded7bf', .73, { side: T.DoubleSide });
  material('bark', '#686454', .92, {}, 'bark');
  material('mapleGreen', '#617348', .73, { side: T.DoubleSide });
  material('mapleRed', '#863f31', .69, { side: T.DoubleSide });
  material('mapleGold', '#9a8849', .73, { side: T.DoubleSide });
  material('joint', '#35462b', .97);
  const boxGeo = new RoundedBoxGeometry(1, 1, 1, 1, .025), sphereGeo = new T.SphereGeometry(1, 12, 8);
  const cylinderGeo = new T.CylinderGeometry(1, 1, 1, 12), leafGeo = createRestorationUnderstoryLeaf(), petalGeo = petalGeometry();
  const flowerPetals=Array.from({length:5},(_,i)=>petalGeometry(i+1));
  const lotusLeaves = [lotusLeafGeometry(1), lotusLeafGeometry(2), lotusLeafGeometry(3)];
  const rockVariants = Array.from({ length: 6 }, (_, i) => stoneVariant(i + 17));
  const mapGeo = mapleLeafGeometry(), crestGeo = flowerCrest(), reliefGeo = carvedLeaf(), stones = Array.from({ length: 6 }, (_, i) => flagstone(20 + i));
  const buckets = new Map(), dummy = new T.Object3D(), tint = new T.Color(), foliageMeshes = [], normalMeshes = [];
  let section = 'bridge', localMatrix = new T.Matrix4();
  function beginSection(name) {
    section = name;
    // Stable per-feature seeds: disabling the bridge never moves the lotus beds.
    random = rng(((options.seed ?? 610163) + ({bridge:101,lotus:2003,shore:30011,garden:400009,path:5000011,islandPlanting:6000019}[name])) >>> 0);
  }
  function emit(g, name, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], shade = 1) {
    dummy.position.fromArray(position); dummy.scale.fromArray(scale); dummy.rotation.set(...rotation); dummy.updateMatrix();
    const matrix = localMatrix.clone().multiply(dummy.matrix), e = matrix.elements;
    const cell = `${Math.floor(e[12] / 10)},${Math.floor(e[14] / 10)}`;
    const key = `${section}/${name}/${g.uuid}/${cell}`;
    let b = buckets.get(key); if (!b) { b = { section, name, geometry: g, transforms: [], shades: [] }; buckets.set(key, b); }
    b.transforms.push(matrix); b.shades.push(shade);
  }
  const box = (x, y, z, w, h, d, name, rot = 0, shade = 1) => emit(boxGeo, name, [x, y, z], [w, h, d], [0, rot, 0], shade);
  const ball = (x, y, z, sx, sy, sz, name, shade = 1) => emit(sphereGeo, name, [x, y, z], [sx, sy, sz], [0, 0, 0], shade);
  function beam(a, b, radius, name) {
    const av = v(...a), bv = v(...b), d = bv.clone().sub(av), q = new T.Quaternion().setFromUnitVectors(v(0, 1, 0), d.clone().normalize());
    const e = new T.Euler().setFromQuaternion(q); emit(cylinderGeo, name, av.add(bv).multiplyScalar(.5).toArray(), [radius, d.length(), radius], [e.x, e.y, e.z]);
  }
  function tube(points, radius, name, segments = 10, taper = false) {
    const path = new T.CatmullRomCurve3(points.map(p => v(...p)));
    const g = new T.TubeGeometry(path, segments, radius, 5, false);
    if (taper) { const p = g.attributes.position; for (let j = 0; j <= segments; j++) { const c = path.getPointAt(j / segments), f = 1 - .88 * j / segments; for (let k = 0; k <= 5; k++) { const i = j * 6 + k; p.setXYZ(i, c.x + (p.getX(i) - c.x) * f, c.y + (p.getY(i) - c.y) * f, c.z + (p.getZ(i) - c.z) * f); } } g.computeVertexNormals(); }
    emit(g, name);
  }
  function rock(x, y, z, size, aspect = [1, 1, 1], yaw = 0) {
    const variant = rockVariants[Math.floor(random() * rockVariants.length)], s = aspect.map(a => a * size), r = [.06 * Math.sin(x), yaw, .06 * Math.sin(z)];
    emit(variant.rock, 'stone', [x, y, z], s, r, rr(.72, 1.12));
    if (variant.moss.attributes.position.count) emit(variant.moss, 'moss', [x, y, z], s, r, rr(.78, 1.15));
  }
  function fern(x, y, z, size, yaw = 0) {
    for (let k = 0; k < 7; k++) {
      const a = yaw + k * 2.39996, length = size * (.60 + .35 * random());
      for (let j = 1; j <= 9; j++) {
        const t = j / 10, reach = t * length, cy = y + Math.sin(t * Math.PI * .83) * size * .42;
        for (const side of [-1, 1]) emit(leafGeo, 'fern', [x + Math.sin(a) * reach, cy, z + Math.cos(a) * reach],
          [size * (.27 - .21 * t), size * .44, size * (.26 - .21 * t)], [-.15, a + side * 1.04, side * .09], rr(.78, 1.18));
      }
    }
  }
  function shrub(x, y, z, radius, blossoms = false) {
    // Discontinuous branch sprays retain air between branches, unlike a sphere.
    for (let b = 0; b < 9; b++) {
      const a = b * 2.39996, reach = radius * rr(.45, 1), end = [x + Math.sin(a) * reach, y + radius * rr(.33, .78), z + Math.cos(a) * reach];
      beam([x, y, z], end, radius * .013, 'bark');
      for (let k = 0; k < 14; k++) {
        const lx = end[0] + rr(-.30, .30) * radius, ly = end[1] + rr(-.11, .20) * radius, lz = end[2] + rr(-.30, .30) * radius;
        emit(leafGeo, 'azaleaLeaf', [lx, ly, lz], [.30 * radius, .32 * radius, .14 * radius], [rr(-.3, .8), rr(0, TAU), rr(-.4, .4)], rr(.76, 1.19));
        if (blossoms && k % 5 === 0) for (let p = 0; p < 5; p++) {
          const pa = p / 5 * TAU; emit(petalGeo, b % 3 ? 'flowerPink' : 'flowerPale', [lx, ly + .025, lz], [.13 * radius, .035 * radius, .10 * radius], [.9, pa, 0], rr(.9, 1.1));
        }
      }
    }
  }

  if (options.bridge !== false) {
    beginSection('bridge'); localMatrix.makeRotationY(.08); localMatrix.setPosition(-6, 0, 11);
    const L = 15.6, W = 3.25, arch = x => .55 + 1.85 * Math.cos(x / L * Math.PI);
    // Eighty fitted crosswise planks, with the slope following the arch.
    for (let i = 0; i < 80; i++) {
      const x = -L / 2 + (i + .5) * L / 80, slope = -1.85 * Math.PI / L * Math.sin(x / L * Math.PI);
      emit(boxGeo, 'bridgeDark', [x, arch(x), 0], [L / 80 - .011, .18, W], [0, 0, Math.atan(slope)], rr(.86, 1.09));
      emit(boxGeo, 'bridgeRed', [x, arch(x) + .105, 0], [L / 80 - .017, .035, W - .14], [0, 0, Math.atan(slope)], rr(.83, 1.06));
      if (i % 5 === 0) box(x, arch(x) - .23, 0, .12, .23, W + .19, 'bridgeDark');
    }
    for (const side of [-1, 1]) {
      // Deep curved timber fascia; narrow gold line is on the fascia, not a neon handrail.
      const profile = new T.Shape();
      for (let i = 0; i <= 64; i++) { const x = -L / 2 + L * i / 64; i ? profile.lineTo(x, arch(x) - .10) : profile.moveTo(x, arch(x) - .10); }
      for (let i = 64; i >= 0; i--) { const x = -L / 2 + L * i / 64; profile.lineTo(x, arch(x) - .82); } profile.closePath();
      const fascia = new T.ExtrudeGeometry(profile, { depth: .17, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 1, steps: 1 });
      fascia.translate(0, 0, side * (W / 2 + .005) - .085); emit(fascia, 'bridgeRed');
      for (const [h, width, height] of [[.43, .14, .13], [.83, .13, .13], [1.26, .19, .16]]) {
        const points = Array.from({ length: 41 }, (_, i) => { const x = -L / 2 + L * i / 40; return [x, arch(x) + h, side * (W / 2 + .035)]; });
        emit(timberSweep(points, width, height), 'bridgeRed');
      }
      // Default refs2/3: five primaries and two fine uprights per bay.
      // Opt-in ref10: six primaries and one fine upright per bay; no coarse crown post.
      for (let i = 0; i < primaryFractions.length; i++) {
        const x = reference10Bridge ? -L / 2 + L * primaryFractions[i] : -L / 2 + L * i / 4, y = arch(x), z = side * (W / 2 + .035), thick = primaryWidths[i];
        box(x, y + .73, z, thick, 1.49, thick, 'bridgeRed');
        box(x, y + .15, z, thick + .07, .12, thick + .07, 'capDark');
        box(x, y + 1.48, z, thick + .04, .055, thick + .04, 'bronze');
        const cap=createRestorationBridgeFinial(thick);
        emit(cap,'bronze',[x,y+1.49,z]);
        for (const h of [.37, 1.02]) { box(x, y + h, z + side * (thick / 2 + .009), .11, .16, .018, 'bronze'); }
        const faceZ = z + side * (thick / 2 + .023);
        emit(reliefGeo, 'bronze', [x, y + .71, faceZ], [.46, .49, .31], [0, side < 0 ? Math.PI : 0, 0]);
        emit(crestGeo, 'bronze', [x, y + .71, faceZ + side * .035], [.085, .085, .044], [0, side < 0 ? Math.PI : 0, 0]);
        if(i<primaryFractions.length-1)for(let j=1;j<=secondaryPerBay;j++){
          const xx=reference10Bridge?x+(L*(primaryFractions[i+1]-primaryFractions[i]))*(j/(secondaryPerBay+1)):x+(L/4)*(j/3);
          box(xx,arch(xx)+.72,z,.095,1.02,.105,'bridgeRed');
        }
        const plateZ = side * (W / 2 + .108);
        box(x, y - .44, plateZ, .39, .43, .026, 'capDark');
        emit(crestGeo, 'bronze', [x, y - .44, plateZ + side * .02], [.145, .145, .065], [0, side < 0 ? Math.PI : 0, 0]);
        ball(x, y - .44, plateZ + side * .032, .030, .030, .010, 'bronze');
      }
      for (const x of [-L / 2 + .6, L / 2 - .6]) {
        box(x, .12, side * 1.18, .41, 1.25, .42, 'bridgeDark');
        rock(x + (x > 0 ? .22 : -.22), -.18, side * 1.26, .54, [1.2, .65, 1.2], x);
        box(x, -.08, side * 1.18, .62, .36, .64, 'wetStone');
        beam([x - .7, .02, side * 1.18], [x + .7, arch(x) - .15, side * 1.18], .075, 'bridgeDark');
      }
    }
    localMatrix.identity();
  }
  if (options.lotus !== false) {
    beginSection('lotus');
    function lotus(x,z,diameter,raised,flowering,seed,hero=false){
      const y=raised?rr(.16,.65):-.064,lx=x+(raised?rr(-.10,.10):0),lz=z+(raised?rr(-.10,.10):0);
      if(raised)tube([[x,-.23,z],[x+.035,y*.42,z-.03],[lx,y-.018,lz]],.0045+diameter*.003,'stalk',10);
      emit(lotusLeaves[seed%3],'leaf',[lx,y,lz],[diameter,diameter,diameter],[raised?rr(-.27,.27):rr(-.045,.045),rr(0,TAU),raised?rr(-.24,.24):rr(-.025,.025)],rr(.80,1.14));
      if(!flowering)return;
      const fx=x+rr(-.20,.20),fz=z+rr(-.20,.20),fy=hero?rr(.39,.59):rr(.29,.69),size=hero?.225:rr(.15,.215);
      tube([[fx-.06,-.22,fz+.025],[fx-.04,fy*.5,fz],[fx,fy,fz]],.0065,'stalk',12);
      if(seed%7===0){
        // A closed bud is several overlapping pointed sepals, not a pink sphere.
        for(let k=0;k<5;k++)emit(flowerPetals[k],'petal',[fx,fy,fz],[.105,.24,.045],[-.20,k/5*TAU,0],rr(.88,1.02));
        return;
      }
      const rings=[{n:8,scale:1,pitch:.73},{n:7,scale:.81,pitch:.35},{n:6,scale:.60,pitch:.04}];
      for(let row=0;row<rings.length;row++){
        const ring=rings[row];for(let k=0;k<ring.n;k++){
          const yaw=k/ring.n*TAU+row*.37+rr(-.035,.035),s=size*ring.scale*rr(.92,1.08);
          emit(flowerPetals[(seed+k+row)%5],'petal',[fx,fy+row*.007,fz],[s*rr(.92,1.09),s*(.80+row*.08),s],[ring.pitch+rr(-.065,.065),yaw,rr(-.025,.025)],rr(.92,1.05));
        }
      }
      // Exposed central receptacle and short irregular stamens, not a hidden ball.
      ball(fx,fy+.037,fz,size*.185,size*.075,size*.185,'pollen');
      for(let k=0;k<20;k++){
        const a=k/20*TAU,r=size*rr(.21,.29),ex=fx+Math.sin(a)*r,ez=fz+Math.cos(a)*r,ey=fy+size*rr(.25,.40);
        beam([fx+Math.sin(a)*r*.82,fy+.025,fz+Math.cos(a)*r*.82],[ex,ey,ez],.0018,'pollen');
        ball(ex,ey,ez,.004,.006,.004,'pollen');
      }
    }
    // Beds follow banks and islands. The central mirror remains open, as refs 1/2/9.
    const beds = [[-15.3, 14.7, 2.8, 1.8, 30], [-4.3, 16.3, 3.2, 1.45, 36], [.1, 16.9, 1.5, 1.2, 19], [14.5, 14.6, 2.7, 2.3, 34], [17.2, 5.8, 2.8, 2.4, 25], [-14.8, 3.4, 2.8, 2.1, 24], [-3.3, 1.1, 2.0, 1.1, 14]];
    let index = 0;
    for (const [bx, bz, rx, rz, n] of beds) for (let i = 0; i < n; i++) {
      const a = rr(0, TAU), rad = Math.sqrt(random()), x = bx + Math.cos(a) * rx * rad, z = bz + Math.sin(a) * rz * rad;
      if (!inPond(x,z,.94)||onIsland(x,z)||pathBlocked(x,z)||bridgeBlocked(x,z))continue;
      const diameter=rr(.40,.88);if(lensBlocked(x,z,diameter))continue;
      lotus(x,z,diameter,random()<.46,i%8===0,index++);
    }
    // Actual reference3 close subjects. They remain 0.6–0.92 m leaves; the
    // camera is inside the existing pond, not behind the paved southern bank.
    if(options.reference3Foreground){
      const subjects=[[-4.85,17.65,.92,true,false],[-4.35,16.30,.78,true,true],[-3.38,17.14,.86,false,false],[-5.15,16.55,.69,true,false],[-2.85,15.85,.67,true,true],[-4.65,15.70,.58,false,false]];
      subjects.forEach((p,i)=>{if(inPond(p[0],p[1],.995)&&!onIsland(p[0],p[1])&&!pathBlocked(p[0],p[1])&&!bridgeBlocked(p[0],p[1])&&!lensBlocked(p[0],p[1],p[2]??.86))lotus(p[0],p[1],p[2],p[3],p[4],73+i,true);});
    }else if(!layout)for(const[i,p]of[[-2.4,17.15],[-1.5,17.4],[-14.7,16.0],[14.4,16.4]].entries())if(inPond(p[0],p[1],.995)&&!onIsland(p[0],p[1])&&!pathBlocked(p[0],p[1])&&!bridgeBlocked(p[0],p[1])&&!lensBlocked(p[0],p[1],p[2]??.86))lotus(p[0],p[1],.86,true,true,70+i);
  }
  if (options.shore !== false) {
    beginSection('shore');
    // Unequal interrupted banks: neither a pebble necklace nor a uniform rock wall.
    for (let i = 0; i < 108; i++) {
      const a = i / 108 * TAU + rr(-.014, .014), r = pondRadius(a), x = Math.cos(a) * 22.4 * r, z = 4.8 + Math.sin(a) * 14.3 * r;
      if (pathBlocked(x,z) || z < -4.5 && x > -5 && x < 17) continue;
      const size = rr(.25, .63) * (i % 11 === 0 ? 1.7 : 1);
      rock(x, -.10, z, size, [rr(.85, 1.5), rr(.58, 1.12), rr(.75, 1.3)], rr(0, TAU));
      if (i % 3 === 0) rock(x + rr(-.7,.7), -.14, z + rr(-.7,.7), size * .38, [1,.6,1.2], rr(0,TAU));
    }
    for (const [x,z,s] of [[-17.4,10.8,2.1],[-17,1,1.6],[-10,-2,1.3],[14,4,2.0],[17,-1,1.4],[1.1,16,1.2],[10.9,16,1.5]]) {
      for (let k = 0; k < 15; k++) {
        const a = rr(0,TAU), rad = Math.sqrt(random())*s;
        const p=[x+Math.cos(a)*rad,rr(-.10,.16),z+Math.sin(a)*rad],size=rr(.24,.65),aspect=[rr(.85,1.35),rr(.6,1.3),rr(.8,1.5)],yaw=rr(0,TAU);
        const q=layout?mapReferenceExteriorPoint(p):p;rock(...q,size*(layout?referenceExteriorPlan.scale:1),aspect,yaw);
      }
    }
  }
  if(options.islandPlanting===true){
    beginSection('islandPlanting');
    // Replaces the six old island loops of 100 tent leaves plus repeated ferns.
    // Keep their earth mound, perimeter rocks and existing trees, not double plants.
    for(const[ix,iz,rx,rz]of existingIslands){
      for(let k=0;k<4;k++){
        const a=k*2.39996+.4,r=.38+(.12*(k%2)),x=ix+Math.cos(a)*rx*r,z=iz+Math.sin(a)*rz*r,y=.46*(1-r)+.08;
        if(k%2===0)shrub(x,y,z,Math.min(rx,rz)*rr(.19,.27),true);
        else fern(x,y,z,rr(.35,.55),a);
      }
    }
  }
  if (options.garden !== false) {
    beginSection('garden');
    const beds = [[-17.4,10.8,2.8],[-17,1,2.0],[-10,-2,1.3],[14,4,2.2],[17,-1,1.7],[1.1,16,1.4],[10.9,16,1.6],[-20,15,1.6],[18,14,1.5]];
    for (const [x,z,s] of beds) {
      shrub(x,.33,z,s*.64,true);
      for(let k=0;k<10;k++){const a=rr(0,TAU), r=rr(.5,1)*s;fern(x+Math.sin(a)*r,.12,z+Math.cos(a)*r,rr(.30,.63),a);}
    }
    for (const side of [-1,1]) for(let j=0;j<17;j++) {
      const x=side<0?rr(1.8,3.1):rr(9.1,10.6),z=19+j*1.3;
      fern(x,.08,z,rr(.34,.66),rr(0,TAU));
      if(j%4===0)shrub(x+side*.2,.08,z,.57,j%8===0);
    }
    function maple(x,z,h,lean,hue,seed){
      const r = rng(seed), rand=(a,b)=>a+(b-a)*r();
      tube([[x,-.02,z],[x+lean*.25,h*.28,z+.12],[x+lean*.72,h*.56,z-.12],[x+lean,h*.87,z+.14]],h*.021,'bark',18,true);
      for(let b=0;b<10;b++){
        const a=b*2.39996, by=h*(.31+b*.043),reach=h*rand(.22,.37)*(1-b*.031),ex=x+lean*.6+Math.sin(a)*reach,ez=z+Math.cos(a)*reach,ey=by+h*rand(.10,.21);
        tube([[x+lean*.45,by,z],[x+lean*.65+Math.sin(a)*reach*.55,by+(ey-by)*.6,z+Math.cos(a)*reach*.55],[ex,ey,ez]],h*.007,'bark',10,true);
        for(let tw=0;tw<4;tw++){
          const tx=ex+rand(-.11,.11)*h,tz=ez+rand(-.11,.11)*h,ty=ey+rand(-.035,.065)*h;
          beam([ex,ey,ez],[tx,ty,tz],h*.0019,'bark');
          for(let k=0;k<38;k++){
            const aa=rand(0,TAU),rad=Math.sqrt(r())*h*.085,sz=rand(.095,.18);
            emit(mapGeo,hue,[tx+Math.sin(aa)*rad,ty+rand(-.025,.025)*h,tz+Math.cos(aa)*rad],[sz,sz,sz],[rand(-.5,.5),rand(0,TAU),rand(-.4,.4)],rand(.77,1.20));
          }
        }
      }
    }
    // These replace only the close maple crowns; distant trees remain with world.js.
    if(options.maples !== false){maple(19,12,9.4,-.6,'mapleRed',671);maple(-25,15,12,1.1,'mapleGold',768);}
  }
  if (options.path !== false) {
    beginSection('path');
    // Four to five broad slabs across, staggered courses and uneven worn corners.
    // Top=.05 matches the existing broken-puddle reflector at y=.054.
    let row=0;
    for(let z=18.2;z<43;z+=.94,row++){
      const widths=row%3===0?[1.12,1.29,1.05,1.56]:row%3===1?[1.65,1.03,1.35,.99]:[.92,1.46,1.28,1.36];
      let x=3.49;
      for(let col=0;col<widths.length;col++){
        const w=widths[col], geo=stones[(row*3+col)%stones.length];
        emit(geo,'wetStone',[x+w/2,-.070,z],[w-.028,.24,.90],[0,rr(-.007,.007),0],rr(.76,1.13));
        if(col>0&&random()<.68)box(x,-.013,z+rr(-.27,.27),.017,.024,rr(.14,.45),'joint',0,rr(.75,1.2));
        x+=w;
      }
      for(const side of [-1,1]){
        box(6+side*2.64,.016,z,.22,.17,.90,'wetStone',rr(-.02,.02),rr(.8,1.1));
        if(row%3===0)rock(6+side*2.94,-.05,z,.22,[1.3,.5,1],rr(0,TAU));
      }
    }
    // Deliberate sparse fallen leaves; five-lobed forms have real curled surfaces.
    for(let i=0;i<95;i++){
      const x=rr(3.6,8.4),z=rr(18.5,42.8),size=rr(.08,.16);
      emit(mapGeo,i%3?'mapleRed':'mapleGold',[x,.059,z],[size,.35*size,size],[0,rr(0,TAU),rr(-.02,.02)],rr(.75,1.1));
    }
  }
  // Single-use curves are merged by material; repeated leaves/stones stay instanced.
  const single = new Map();
  for(const b of buckets.values()){
    if(b.transforms.length===1){
      let g=b.geometry.clone().applyMatrix4(b.transforms[0]); if(g.index)g=g.toNonIndexed();
      if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
      const colors=[];for(let i=0;i<g.attributes.position.count;i++){const c=g.attributes.color; colors.push((c?c.getX(i):1)*b.shades[0],(c?c.getY(i):1)*b.shades[0],(c?c.getZ(i):1)*b.shades[0]);}
      g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
      const key=`${b.section}/${b.name}`; if(!single.has(key))single.set(key,{section:b.section,name:b.name,geometries:[]});single.get(key).geometries.push(g);continue;
    }
    const mesh=new T.InstancedMesh(b.geometry,materials[b.name],b.transforms.length); mesh.name=`${b.section}-${b.name}`;
    b.transforms.forEach((matrix,i)=>{mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,tint.setRGB(b.shades[i],b.shades[i],b.shades[i]));});
    mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();groups[b.section].add(mesh);
  }
  for(const b of single.values()){
    const mat=materials[b.name].clone();mat.vertexColors=true;ownedMaterials.push(mat);
    const mesh=new T.Mesh(mergeGeometries(b.geometries),mat);mesh.name=`${b.section}-${b.name}-merged`;mesh.castShadow=true;mesh.receiveShadow=true;groups[b.section].add(mesh);
    b.geometries.forEach(g=>g.dispose());
  }
  if(layout)groups.bridge.applyMatrix4(layoutMatrix);
  root.updateMatrixWorld(true);
  const stats={version:'landscape-ref-v7-conditional-reference10-bridge-topology',buildMilliseconds:performance.now()-started,meshes:0,instances:0,triangles:0,sections:{}};
  root.traverse(o=>{if(!o.isMesh)return;stats.meshes++;const count=o.count??1,tri=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;stats.instances+=count;stats.triangles+=tri*count;const key=o.parent.name;stats.sections[key]=(stats.sections[key]??0)+count;
    if(o.material.alphaTest>0||o.material.side===T.DoubleSide){foliageMeshes.push(o);const normal=o.isInstancedMesh?new T.InstancedMesh(o.geometry,foliageNormalMaterial(o.material),o.count):new T.Mesh(o.geometry,foliageNormalMaterial(o.material));if(o.isInstancedMesh){normal.instanceMatrix=o.instanceMatrix;normal.instanceColor=o.instanceColor;}normal.matrix.copy(o.matrixWorld);normal.matrixAutoUpdate=false;normalMeshes.push(normal);}
  });
  groups.bridge.userData.referenceStructure={referenceMode:reference10Bridge?'reference10':'reference2-3',mainPostsPerRail:primaryFractions.length,secondaryPostsPerRail:(primaryFractions.length-1)*secondaryPerBay,primaryFractions:[...primaryFractions],secondaryFractions:primaryFractions.slice(0,-1).flatMap((f,i)=>Array.from({length:secondaryPerBay},(_,j)=>f+(primaryFractions[i+1]-f)*(j+1)/(secondaryPerBay+1))),localSpan:15.6,localWidth:3.25,localFasciaDepth:.72,localMainPostWidths:[...primaryWidths],layoutScale:layout?referenceExteriorPlan.scale:1,randomStream:'unchanged from v6; modified bridge components consume no random draws',spacingEvidence:reference10Bridge?'Six visible near support axes and an open crown bay. Uniform initial spacing or caller-supplied fractions are model hypotheses, not measured world spacing. Opposite-side symmetry is not independently recovered.':'Preserved refs2/3 five-primary source geometry'};
  root.userData.restorationStats=stats;
  return {group:root,groups,materials,stats,foliageMeshes,normalMeshes,placement:layout?{...landscapePlacement,exteriorPlan:referenceExteriorPlan}:landscapePlacement,
    dispose(){const geometries=new Set();root.traverse(o=>{if(o.isMesh)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());root.removeFromParent();}};
}
