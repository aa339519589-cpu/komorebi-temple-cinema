import * as T from 'three';

// Authored from the branching and crown silhouettes in HD reference 07.
// No scene photographs, impostors, alpha cards or crown shells. The bark
// material is an independent declared CC0 surface scan, never scene imagery.
export const HERO_PINES_REVISION = 'scene07-aged-shelf-pines148-r02';

const TAU = Math.PI * 2;
const UP = new T.Vector3(0, 1, 0);
const vec = p => new T.Vector3(...p);
const rng = initial => {
  let state = initial >>> 0;
  return () => ((state = Math.imul(state, 1664525) + 1013904223 >>> 0) / 4294967296);
};
const lerp = (a, b, t) => a + (b - a) * t;
const positionAt = (curve, t) => curve.getPoint(T.MathUtils.clamp(t, 0, 1));

// Optional integration aid. The retired pines consumed the scene's shared
// random stream before the cherries/grass were placed. Advancing that stream
// by exactly the former draws preserves their layout when the eight calls are
// replaced. This function has no geometry, materials, global state or I/O.
export function advanceLegacyPineRandom148(initialSeed) {
  let state = initialSeed >>> 0;
  const next = () => ((state = Math.imul(state, 1664525) + 1013904223 >>> 0) / 4294967296);
  const oldPad = () => {
    const boughs = 3 + Math.floor(next() * 3);
    for (let b = 0; b < boughs; b++) {
      for (let j = 0; j < 8; j++) next();
      for (let station = 0; station < 4; station++) for (let side = 0; side < 2; side++) {
        if (next() < .10) continue;
        for (let j = 0; j < 13; j++) next();
      }
    }
  };
  for (let tree = 0; tree < 8; tree++) {
    if (tree) next(); // The right hero had an explicit .15 bend.
    for (let bough = 0; bough < 11; bough++) {
      next(); next(); oldPad();
      if (bough % 3 === 1) oldPad();
    }
    oldPad();
  }
  return state;
}

// These are the existing eight garden origins. Coordinates remain in the
// established garden frame: worldZ = gardenZ * .6 - 3. All dimensions below
// are metres before that existing transform; the helper does not alter it.
export const HERO_PINE_ORIGINS = Object.freeze([
  {id: 'right-hero', x: 12.6, z: 18, h: 10, spread: 1, yaw: -.08, seed: 148031,
    trunk: [[0, 0, 0], [.018, .10, -.008], [-.018, .23, .012], [.046, .395, .012], [.139, .555, -.012], [.188, .695, .009], [.176, .82, -.005], [.147, .89, -.012]],
    fork: {at: .445, points: [[.036, .57, .018], [-.053, .675, .01], [-.11, .775, .018], [-.105, .855, .008]], radius: .52},
    // [height, azimuth, bare reach / h, tip lift / h, shelf reach / h,
    //  shelf half width / h, parent leader (0 main, 1 fork)]
    boughs: [[.25, 3.40, .12, .042, .105, .105], [.365, 3.16, .205, .034, .163, .112], [.43, .20, .19, .025, .142, .11], [.535, 3.30, .225, .026, .174, .13], [.61, -.27, .175, .027, .152, .105], [.69, 3.08, .177, .022, .157, .119, 1], [.765, .31, .146, .016, .151, .109], [.79, 3.28, .115, .02, .144, .116, 1], [.855, 2.90, .112, .014, .142, .103]],
    caps: [[.875, .23, .118, .109, 0], [.85, 2.75, .115, .104, 1]]},
  {id: 'foreground-wide', x: -4.8, z: 20, h: 4.9, spread: 1.40, yaw: .08, seed: 148079,
    trunk: [[0, 0, 0], [-.027, .14, .012], [.028, .31, .025], [.132, .49, .009], [.188, .64, -.018], [.154, .78, -.008], [.165, .86, 0]],
    fork: {at: .365, points: [[-.039, .49, -.017], [-.141, .63, -.032], [-.18, .76, -.015], [-.16, .825, -.025]], radius: .64},
    boughs: [[.385, 3.02, .205, .025, .18, .124], [.47, .08, .24, .032, .174, .116], [.56, 3.48, .245, .025, .185, .135, 1], [.62, -.32, .235, .027, .17, .118], [.70, 2.91, .18, .023, .18, .13, 1], [.74, .36, .162, .02, .156, .115], [.815, 3.31, .125, .013, .145, .116]],
    caps: [[.85, .03, .141, .122, 0], [.811, 2.85, .145, .118, 1]]},
  {id: 'left-middle', x: -10, z: 11, h: 5.7, spread: .9, yaw: -.19, seed: 148119,
    trunk: [[0, 0, 0], [.035, .19, .013], [-.075, .39, -.012], [-.142, .60, .019], [-.125, .75, .024], [-.151, .875, .004]],
    fork: {at: .43, points: [[.008, .585, -.019], [.083, .71, -.027], [.061, .82, -.005]], radius: .48},
    boughs: [[.32, 3.32, .17, .034, .164, .119], [.46, -.18, .22, .034, .172, .12], [.58, 2.96, .235, .028, .183, .125], [.68, .15, .19, .026, .16, .117, 1], [.765, 3.26, .17, .022, .163, .113]],
    caps: [[.86, 3.01, .147, .117, 0], [.808, .08, .133, .111, 1]]},
  {id: 'right-stair', x: 11.5, z: 3.1, h: 5.3, spread: .8, yaw: .12, seed: 148151,
    trunk: [[0, 0, 0], [-.022, .20, .005], [.04, .39, -.021], [.11, .59, .008], [.086, .75, .014], [.111, .87, 0]],
    fork: {at: .40, points: [[-.075, .565, .024], [-.11, .72, .031], [-.092, .81, .014]], radius: .51},
    boughs: [[.33, 3.05, .205, .033, .173, .12], [.45, .18, .225, .032, .183, .126], [.60, 3.38, .225, .025, .177, .13, 1], [.69, -.10, .188, .024, .166, .116], [.785, 3.01, .137, .018, .148, .121]],
    caps: [[.856, .1, .144, .12, 0], [.80, 3.20, .132, .108, 1]]},
  {id: 'left-stair', x: -5, z: 1.4, h: 4.2, spread: .8, yaw: -.26, seed: 148181,
    trunk: [[0, 0, 0], [.025, .20, .013], [-.025, .39, .025], [-.099, .62, -.007], [-.083, .78, -.013], [-.11, .86, 0]],
    boughs: [[.365, .15, .22, .034, .20, .145], [.52, 3.18, .23, .03, .19, .14], [.64, -.24, .19, .027, .177, .124], [.745, 3.34, .16, .022, .163, .124]],
    caps: [[.845, 2.92, .157, .14, 0]]},
  {id: 'back-right', x: 18, z: -4, h: 8.5, spread: 1, yaw: .31, seed: 148223,
    trunk: [[0, 0, 0], [-.018, .20, -.01], [.025, .39, .019], [.097, .58, .028], [.075, .74, -.008], [.103, .89, 0]],
    fork: {at: .46, points: [[-.046, .61, -.02], [-.096, .76, -.025], [-.064, .85, -.009]], radius: .48},
    boughs: [[.30, 3.33, .18, .036, .17, .119], [.445, .19, .22, .035, .186, .13], [.56, 2.98, .23, .027, .177, .13], [.675, -.26, .20, .029, .163, .118], [.735, 3.34, .15, .024, .169, .126, 1], [.81, .32, .128, .018, .14, .115]],
    caps: [[.88, .18, .141, .117, 0], [.84, 3.05, .14, .111, 1]]},
  {id: 'far-left', x: -19, z: 1, h: 6.5, spread: .8, yaw: -.11, seed: 148259,
    trunk: [[0, 0, 0], [.033, .19, -.008], [.085, .37, .017], [.015, .58, .014], [-.043, .74, -.018], [-.016, .88, -.004]],
    fork: {at: .44, points: [[.155, .58, -.011], [.184, .72, -.021], [.145, .81, -.005]], radius: .47},
    boughs: [[.335, 3.27, .205, .032, .178, .128], [.48, .09, .235, .032, .174, .123], [.605, 3.05, .23, .027, .184, .135], [.70, -.23, .18, .024, .169, .12, 1], [.78, 3.31, .159, .022, .161, .124]],
    caps: [[.866, 3.0, .15, .123, 0], [.798, .13, .145, .117, 1]]},
  {id: 'left-island-small', x: -8.8, z: 2.5, h: 3.2, spread: .85, yaw: .25, seed: 148291,
    trunk: [[0, 0, 0], [-.04, .23, .015], [.022, .43, .021], [.08, .63, -.007], [.05, .79, -.011], [.074, .86, 0]],
    boughs: [[.40, 3.13, .22, .03, .216, .154], [.555, .14, .235, .032, .20, .149], [.70, 3.40, .18, .026, .188, .134]],
    caps: [[.845, .15, .18, .15, 0]]}
]);

class WoodMesh {
  constructor() { this.positions = []; this.uvs = []; this.colors = []; this.indices = []; this.branches = 0; }
  tube(points, radius, endRadius, seed, {segments, sides, cap = true, rootFlare = 0} = {}) {
    const curve = new T.CatmullRomCurve3(points.map(p => p.isVector3 ? p.clone() : vec(p)), false, 'centripetal', .5);
    const length = curve.getLength();
    const N = segments || Math.max(5, Math.ceil(length / Math.max(.055, radius * 1.2)));
    const M = sides || (radius > .18 ? 20 : radius > .045 ? 12 : 7);
    const frames = curve.computeFrenetFrames(N, false), offset = this.positions.length / 3;
    for (let j = 0; j <= N; j++) {
      const t = j / N, c = curve.getPointAt(t);
      const nominal = lerp(radius, endRadius, Math.pow(t, .82));
      const flare = rootFlare * Math.exp(-t * length / Math.max(radius * 1.25, .1));
      for (let k = 0; k <= M; k++) {
        const a = k / M * TAU;
        const bark = 1 + .085 * Math.sin(a * 7 + t * 4.7 + seed) + .035 * Math.sin(a * 13 - t * 21 + seed * .7);
        const q = c.clone().addScaledVector(frames.normals[j], Math.cos(a) * (nominal * bark + flare * (1 + .20 * Math.sin(a * 5)))).addScaledVector(frames.binormals[j], Math.sin(a) * (nominal * bark + flare * (1 + .20 * Math.sin(a * 5))));
        this.positions.push(q.x, q.y, q.z);
        // The independent Poly Haven bark scan covers a true 2m square.
        this.uvs.push(k / M * TAU * radius / 2, t * length / 2);
        const shade = .90 + .09 * Math.sin(a * 11 + t * 13 + seed) + .035 * Math.cos(a * 23 - t * 71);
        this.colors.push(shade, shade, shade);
        if (j < N && k < M) {
          const a0 = offset + j * (M + 1) + k;
          this.indices.push(a0, a0 + 1, a0 + M + 1, a0 + 1, a0 + M + 2, a0 + M + 1);
        }
      }
    }
    if (cap) {
      for (const [ring, reverse] of [[0, true], [N, false]]) {
        const c = curve.getPointAt(ring / N), centre = this.positions.length / 3;
        this.positions.push(c.x, c.y, c.z); this.uvs.push(.5, .5); this.colors.push(.86, .86, .86);
        for (let k = 0; k < M; k++) {
          const a = offset + ring * (M + 1) + k;
          this.indices.push(...(reverse ? [centre, a + 1, a] : [centre, a, a + 1]));
        }
      }
    }
    this.branches++;
    return curve;
  }
  disc(centre, normal, radius, seed) {
    const n = normal.clone().normalize(), x = new T.Vector3(1, 0, 0).cross(n);
    if (x.lengthSq() < .01) x.set(0, 0, 1).cross(n);
    x.normalize(); const z = n.clone().cross(x).normalize();
    const start = this.positions.length / 3, sides = 15;
    this.positions.push(...centre.toArray()); this.uvs.push(.5, .5); this.colors.push(.78, .78, .78);
    for (let k = 0; k <= sides; k++) {
      const a = k / sides * TAU, r = radius * (1 + .045 * Math.sin(a * 5 + seed));
      const q = centre.clone().addScaledVector(x, Math.cos(a) * r).addScaledVector(z, Math.sin(a) * r);
      this.positions.push(...q.toArray()); this.uvs.push(.5 + Math.cos(a) * .5, .5 + Math.sin(a) * .5); this.colors.push(.96, .96, .96);
      if (k < sides) this.indices.push(start, start + k + 1, start + k + 2);
    }
  }
  finish() {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(this.uvs, 2));
    geometry.setAttribute('color', new T.Float32BufferAttribute(this.colors, 3));
    geometry.setIndex(this.indices); geometry.computeVertexNormals(); geometry.computeBoundingBox();
    return geometry;
  }
}

async function installMaterials(mats) {
  const loader = new T.TextureLoader();
  const paths = ['pine_bark_diff_1k.jpg', 'pine_bark_nor_gl_1k.jpg', 'pine_bark_rough_1k.jpg'];
  const [map, normalMap, roughnessMap] = await Promise.all(paths.map(path => loader.loadAsync(new URL(`../assets/hero-pines148/pine-bark/${path}`, import.meta.url).href)));
  for (const texture of [map, normalMap, roughnessMap]) {
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.anisotropy = 8;
  }
  map.colorSpace = T.SRGBColorSpace;
  mats.heroPineBark148 = new T.MeshStandardMaterial({name: 'scene07-aged-pine-bark148', color: 0xd9c1a7, roughness: .96, map, normalMap, normalScale: new T.Vector2(.50, .50), roughnessMap, vertexColors: true});
  mats.heroPineTwig148 = new T.MeshStandardMaterial({name: 'scene07-living-pine-twigs148', color: 0x6c5d40, roughness: .92, vertexColors: true});
  mats.heroPineCut148 = new T.MeshStandardMaterial({name: 'scene07-old-pruning-wounds148', color: 0x998362, roughness: .97, vertexColors: true});
  mats.heroPineNeedle148 = new T.MeshPhysicalMaterial({name: 'scene07-deep-pine-needles148', color: 0x5b7136, roughness: .76, clearcoat: .025, clearcoatRoughness: .60, metalness: 0, side: T.DoubleSide, vertexColors: true});
  mats.heroPineNeedleTip148 = mats.heroPineNeedle148.clone();
  mats.heroPineNeedleTip148.name = 'scene07-olive-pine-needle-tips148';
  mats.heroPineNeedleTip148.color.setHex(0x829848);
  for (const m of [mats.heroPineNeedle148, mats.heroPineNeedleTip148]) {
    // Only thin-needle backscatter, under the scene's actual r146 sun vector.
    // Geometry remains fully opaque and casts actual needle/twig shadows.
    m.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n vec3 pineSun148=normalize((viewMatrix*vec4(-.58,.035,-.81,0.0)).xyz); float needleThrough148=pow(max(dot(-normal,pineSun148),0.0),2.5); reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(1.0,.74,.41)*needleThrough148*.28;');
    };
    m.customProgramCacheKey = () => 'scene07-pine148-aligned-thin-needle-r02';
    m.forceSinglePass = true;
  }
  return ['heroPineBark148', 'heroPineTwig148', 'heroPineCut148', 'heroPineNeedle148', 'heroPineNeedleTip148'];
}

// A small woody shoot with dense needle sheaves and paired edge needles.
// The closed sheaf interiors represent tightly overlapping live needles at
// the 960px delivery scale; each is only .10-.14m long and .04-.06m wide.
// They sit under longer individual edge needles, never form a whole crown,
// and have a ridged, irregular 3D cross-section rather than flat leaf cards.
// The same shoot count/placement is retained from r01. Its occupancy changes
// in geometry, without filling the negative spaces between shelf fingers.
function needleShoot(seed) {
  const random = rng(seed), positions = [], colors = [], wood = new WoodMesh();
  const stemLength = .12 + random() * .065;
  const stem = wood.tube([[0, 0, 0], [.008, stemLength * .48, -.003], [0, stemLength, .005]], .0045, .0018, seed, {segments: 4, sides: 5});
  const triangle = (a, b, c, sa, sb, sc) => {
    positions.push(...a.toArray(), ...b.toArray(), ...c.toArray());
    for (const s of [sa, sb, sc]) colors.push(s, s, s);
  };
  const sheaf = (base, direction, length, phase, shade) => {
    const axis = direction.clone().normalize();
    const x = new T.Vector3(-Math.sin(phase), .08, Math.cos(phase)).normalize();
    const z = axis.clone().cross(x).normalize(); x.copy(z.clone().cross(axis).normalize());
    const width = .020 + random() * .010, thickness = width * rangeLocal(.49, .68);
    const profiles = [[0, .075], [.27, .83], [.66, 1], [.89, .58], [1, .018]], sides = 5, rings = [];
    for (let j = 0; j < profiles.length; j++) {
      const [t, r] = profiles[j], centre = base.clone().addScaledVector(axis, length * t);
      centre.y += Math.sin(t * Math.PI) * .009;
      const ring = [];
      for (let k = 0; k < sides; k++) {
        const a = k / sides * TAU + phase * .37, lobe = 1 + .13 * Math.sin(k * 2.8 + j * 1.3 + seed);
        ring.push(centre.clone().addScaledVector(x, Math.cos(a) * width * r * lobe).addScaledVector(z, Math.sin(a) * thickness * r * lobe));
      }
      rings.push(ring);
    }
    for (let j = 0; j < profiles.length - 1; j++) for (let k = 0; k < sides; k++) {
      const next = (k + 1) % sides, s = shade * (.79 + j * .075), sn = shade * (.79 + (j + 1) * .075);
      triangle(rings[j][k], rings[j][next], rings[j + 1][k], s, s * .96, sn);
      triangle(rings[j][next], rings[j + 1][next], rings[j + 1][k], s * .96, sn * .96, sn);
    }
    for (let k = 0; k < sides; k++) {
      const next = (k + 1) % sides;
      triangle(base, rings[0][next], rings[0][k], shade * .76, shade * .76, shade * .76);
      const tip = base.clone().addScaledVector(axis, length);
      triangle(tip, rings.at(-1)[k], rings.at(-1)[next], shade * 1.10, shade * 1.07, shade * 1.07);
    }
  };
  const rangeLocal = (a, b) => lerp(a, b, random());
  for (let node = 0; node < 5; node++) {
    const t = .14 + node * .165, base = positionAt(stem, t);
    for (let fascicle = 0; fascicle < 3; fascicle++) {
      const phase = node * 1.72 + fascicle * TAU / 3 + (random() - .5) * .35;
      if (node === 1 || node === 2 || node === 4) {
        const lift = rangeLocal(.37, .65), radial = Math.sqrt(1 - lift * lift);
        const direction = new T.Vector3(Math.cos(phase) * radial, lift, Math.sin(phase) * radial);
        sheaf(base, direction, rangeLocal(.104, .139), phase, rangeLocal(.90, 1.08));
      }
      for (const pair of [-1, 1]) {
        const a = phase + pair * (.06 + random() * .055), length = .095 + random() * .075;
        const lift = .25 + random() * .49, radial = Math.sqrt(1 - lift * lift);
        const direction = new T.Vector3(Math.cos(a) * radial, lift, Math.sin(a) * radial);
        const side = new T.Vector3(-Math.sin(a), .05, Math.cos(a)).normalize();
        const root = base.clone().addScaledVector(side, pair * .0015);
        const mid = root.clone().addScaledVector(direction, length * .53); mid.y += .006;
        const tip = root.clone().addScaledVector(direction, length); tip.y -= .009;
        const width = .0032 + random() * .0025, ridge = mid.clone().addScaledVector(direction.clone().cross(side).normalize(), .0017);
        const left = mid.clone().addScaledVector(side, width), right = mid.clone().addScaledVector(side, -width);
        const shade = .80 + random() * .23;
        triangle(root, left, ridge, shade * .82, shade, shade * 1.035);
        triangle(left, tip, ridge, shade, shade * 1.12, shade * 1.035);
        triangle(root, ridge, right, shade * .82, shade * 1.035, shade * .97);
        triangle(right, ridge, tip, shade * .97, shade * 1.035, shade * 1.12);
      }
    }
  }
  const needle = new T.BufferGeometry();
  needle.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  needle.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  needle.computeVertexNormals(); needle.computeBoundingBox();
  return {needle, twig: wood.finish()};
}

function atHeight(curve, height) {
  let lo = 0, hi = 1;
  for (let j = 0; j < 18; j++) { const t = (lo + hi) * .5; if (curve.getPoint(t).y < height) lo = t; else hi = t; }
  return curve.getPoint((lo + hi) * .5);
}

/**
 * Call once in main.js at the old eight pine(...) calls, while its existing
 * gardenTransform is active. root owns that integration. No scene, light,
 * camera, random-stream or other existing material is changed here.
 *
 * group has the existing Scene07 signature group(x,y,z,yaw,scale,callback).
 * emit has the existing Scene07 signature emit(geometry,materialKey,x,y,z,
 * sx,sy,sz,[rx,ry,rz],tint). rod and box may be passed but are not required.
 * The return value is a serializable source/geometry audit for sceneInfo.
 */
export async function buildHeroPines({emit, mats, hillHeight, group}) {
  const materialKeys = await installMaterials(mats);
  const shoots = Array.from({length: 10}, (_, i) => needleShoot(148701 + i * 73));
  const stats = {revision: HERO_PINES_REVISION, visualAccepted: false, treeCount: 0, boughs: 0, shelfFans: 0, terminalShoots: 0, needleTriangles: 0, woodTriangles: 0, materialKeys, assets: [{name: 'Pine Bark', author: 'Dimitrios Savva', license: 'CC0 1.0', source: 'https://polyhaven.com/a/pine_bark', provenance: 'reconstructions/scene-07/assets/hero-pines148/pine-bark/provenance.json', originalBytes: 2522778}], trees: [], construction: 'root flare > aged curved trunk/fork > load-bearing curved bough > shallow asymmetric fan > alternating branchlet > closed fine needle-sheaf interiors with longer paired edge needles; real opaque geometry throughout'};

  for (const spec of HERO_PINE_ORIGINS) {
    const random = rng(spec.seed), range = (a, b) => lerp(a, b, random());
    const wood = new WoodMesh(), scars = new WoodMesh();
    const h = spec.h, spread = spec.spread;
    const rootY = Math.max(0, hillHeight(spec.x, spec.z * .6 - 3));
    const toPoint = p => [p[0] * h, p[1] * h - .045, p[2] * h];
    const trunkRadius = h * (spec.id === 'right-hero' ? .039 : spec.id === 'foreground-wide' ? .045 : .038);
    const trunk = wood.tube(spec.trunk.map(toPoint), trunkRadius, h * .007, spec.seed, {sides: 22, segments: 66, rootFlare: trunkRadius * .25});
    const leaders = [trunk];
    if (spec.fork) {
      const forkRoot = atHeight(trunk, h * spec.fork.at - .045);
      leaders.push(wood.tube([forkRoot, ...spec.fork.points.map(toPoint)], trunkRadius * spec.fork.radius, h * .005, spec.seed + 71, {sides: 16, segments: 38}));
    }
    // Buttress roots overlap the trunk and taper beneath the terrain datum.
    for (let j = 0; j < 6; j++) {
      const a = j * TAU / 6 + range(-.27, .27), reach = h * range(.067, .105);
      wood.tube([[0, h * .025, 0], [Math.cos(a) * reach * .46, .04, Math.sin(a) * reach * .46], [Math.cos(a) * reach, -.065, Math.sin(a) * reach]], trunkRadius * range(.33, .46), .009, spec.seed + j * 13, {segments: 8, sides: 10});
    }

    let treeFans = 0, treeShoots = 0, treeBoughs = 0;
    const pending = [];
    const placeShoot = (point, direction, scale, greenTip = false) => {
      const q = new T.Quaternion().setFromUnitVectors(UP, direction.clone().normalize());
      q.multiply(new T.Quaternion().setFromAxisAngle(UP, range(-Math.PI, Math.PI)));
      const e = new T.Euler().setFromQuaternion(q), variant = Math.floor(random() * shoots.length);
      pending.push({variant, material: greenTip ? 'heroPineNeedleTip148' : 'heroPineNeedle148', p: point.toArray(), scale, rotation: [e.x, e.y, e.z], tint: range(.91, 1.06)});
      treeShoots++;
    };
    const shelf = (root, heading, reach, halfWidth, seedOffset, cap = false) => {
      // The shelf consists of distinct feathered fingers. Nothing fills the
      // gaps between fingers or the empty spaces between whole crown tiers.
      const count = cap ? 7 : h > 6 || spread > 1.2 ? 6 : 5;
      for (let arm = 0; arm < count; arm++) {
        const f = arm / (count - 1), a = heading + (f - .5) * (cap ? 4.9 : 3.30) + range(-.16, .16);
        const central = Math.sin(f * Math.PI), length = reach * range(.69, 1.04) * (.72 + central * .28);
        const lateral = halfWidth / Math.max(reach, .1);
        const dx = Math.cos(a) * length, dz = Math.sin(a) * length * lateral;
        const end = root.clone().add(new T.Vector3(dx, range(.065, .15) * length, dz));
        const mid = root.clone().add(new T.Vector3(dx * .53, -.025 * length, dz * .49));
        const fan = wood.tube([root, mid, end], Math.min(.046, .018 + h * .0023) * range(.83, 1.10), .0045, seedOffset + arm * 19, {segments: 8, sides: 8});
        const stations = length > 1.05 ? 5 : 4;
        for (let station = 0; station < stations; station++) {
          const t = .17 + station * (.72 / (stations - 1));
          const base = positionAt(fan, t), tangent = fan.getTangent(t).normalize();
          for (const side of [-1, 1]) {
            // Unequal missing branchlets make lobed outlines and reveal the
            // fan's actual woody connections rather than an oval shrub mass.
            if ((arm + station + seedOffset) % 11 === 0 || random() < .085) continue;
            const ta = Math.atan2(tangent.z, tangent.x) + side * range(.77, 1.22);
            const twigLength = Math.max(.16, halfWidth * range(.18, .37)) * (1 - .20 * t);
            const tip = base.clone().add(new T.Vector3(Math.cos(ta) * twigLength, range(.10, .25) * twigLength + range(.025, .075), Math.sin(ta) * twigLength));
            const elbow = base.clone().lerp(tip, .57); elbow.y -= twigLength * .08;
            const twig = wood.tube([base, elbow, tip], range(.007, .011), .0025, seedOffset + arm * 31 + station * 3 + side, {segments: 4, sides: 6});
            const shootsOnTwig = Math.max(2, Math.min(4, Math.ceil(twigLength / .13)));
            for (let s = 0; s < shootsOnTwig; s++) {
              const st = .42 + s * (.57 / Math.max(1, shootsOnTwig - 1)), p = positionAt(twig, st);
              const outward = twig.getTangent(st).normalize();
              const direction = outward.multiplyScalar(range(.24, .45)).add(new T.Vector3(range(-.15, .15), 1, range(-.14, .14))).normalize();
              const scale = range(.84, 1.19) * (h < 4 ? .87 : 1);
              placeShoot(p, direction, scale, random() < .20 && (station > 1 || cap));
            }
            // Occasional short bifurcations add a second lobe, with every
            // fascicle still starting on a real woody member.
            if (station > 0 && random() < .25) {
              const split = positionAt(twig, .57), sa = ta + side * range(.66, 1.04), sl = twigLength * range(.40, .61);
              const st = split.clone().add(new T.Vector3(Math.cos(sa) * sl, sl * .25, Math.sin(sa) * sl));
              wood.tube([split, split.clone().lerp(st, .56), st], .0042, .0018, seedOffset + station * 73 + arm, {segments: 3, sides: 5});
              placeShoot(st, new T.Vector3(Math.cos(sa) * .35, 1, Math.sin(sa) * .35), range(.83, 1.10), random() < .22);
            }
          }
        }
        placeShoot(end, new T.Vector3(Math.cos(a) * .27, 1, Math.sin(a) * .27), range(.91, 1.17), random() < .24);
        treeFans++;
      }
    };

    for (let j = 0; j < spec.boughs.length; j++) {
      const [height, heading, reachFactor, lift, shelfReach, shelfWidth, parent = 0] = spec.boughs[j];
      const leader = leaders[parent] || trunk, root = atHeight(leader, height * h - .045);
      const reach = reachFactor * h * spread, a = heading + range(-.055, .055);
      const end = root.clone().add(new T.Vector3(Math.cos(a) * reach, lift * h, Math.sin(a) * reach * .83));
      const shoulder = root.clone().add(new T.Vector3(Math.cos(a) * reach * .28, -h * .013, Math.sin(a) * reach * .23));
      const elbow = root.clone().add(new T.Vector3(Math.cos(a) * reach * .70, -h * .018 + lift * h * .21, Math.sin(a) * reach * .64));
      const radius = h * (.020 - height * .010) * (parent ? .78 : 1);
      const bough = wood.tube([root, shoulder, elbow, end], radius, Math.max(.014, h * .0028), spec.seed + j * 97, {segments: 24, sides: 13});
      // Only the outer part bears foliage; the substantial lower bough stays
      // visible in the negative spaces below and beside each crown shelf.
      const tip = positionAt(bough, .96);
      shelf(tip, a, shelfReach * h * spread, shelfWidth * h * spread, spec.seed + j * 101);
      if (j % 3 === 1) {
        const joint = positionAt(bough, .68), fa = a + (j % 2 ? 1 : -1) * .86, fl = shelfReach * h * spread * .43;
        const forkEnd = joint.clone().add(new T.Vector3(Math.cos(fa) * fl, h * .017, Math.sin(fa) * fl));
        wood.tube([joint, joint.clone().lerp(forkEnd, .52).add(new T.Vector3(0, -h * .012, 0)), forkEnd], radius * .43, .006, spec.seed + j * 53, {segments: 9, sides: 8});
        shelf(forkEnd, fa, shelfReach * h * spread * .53, shelfWidth * h * spread * .66, spec.seed + j * 503);
      }
      treeBoughs++;
    }
    for (let j = 0; j < spec.caps.length; j++) {
      const [height, heading, reach, width, parent] = spec.caps[j];
      const leader = leaders[parent] || trunk, root = atHeight(leader, height * h - .045);
      shelf(root, heading, reach * h * spread, width * h * spread, spec.seed + 9001 + j * 73, true);
    }
    // Old, short pruning stubs keep the lower trunk from becoming a smooth
    // bent pole. Their exposed cut faces are actual transverse wood discs.
    for (let j = 0; j < (h > 6 ? 4 : 2); j++) {
      const y = h * (.185 + j * .125), root = atHeight(trunk, y), a = j * 2.35 + spec.seed * .01;
      const length = h * range(.024, .046), tip = root.clone().add(new T.Vector3(Math.cos(a) * length, length * .38, Math.sin(a) * length));
      const r = trunkRadius * range(.20, .31), endR = r * .68;
      wood.tube([root, root.clone().lerp(tip, .47), tip], r, endR, spec.seed + 1101 + j, {segments: 6, sides: 12});
      scars.disc(tip.clone().addScaledVector(tip.clone().sub(root).normalize(), .002), tip.clone().sub(root), endR * .82, j);
    }
    const bark = wood.finish(), cuts = scars.finish();
    bark.name = `${spec.id}-connected-aged-wood148`;
    cuts.name = `${spec.id}-old-pruning-cuts148`;
    group(spec.x, rootY, spec.z, spec.yaw, 1, () => {
      emit(bark, 'heroPineBark148', 0, 0, 0);
      emit(cuts, 'heroPineCut148', 0, 0, 0);
      for (const item of pending) {
        const geometry = shoots[item.variant], [x, y, z] = item.p, s = item.scale;
        emit(geometry.twig, 'heroPineTwig148', x, y, z, s, s, s, item.rotation, item.tint);
        emit(geometry.needle, item.material, x, y, z, s, s, s, item.rotation, item.tint);
        stats.needleTriangles += geometry.needle.attributes.position.count / 3;
        stats.woodTriangles += geometry.twig.index.count / 3;
      }
    });
    stats.treeCount++; stats.boughs += treeBoughs; stats.shelfFans += treeFans; stats.terminalShoots += treeShoots;
    stats.woodTriangles += (bark.index.count + cuts.index.count) / 3;
    stats.trees.push({id: spec.id, originGarden: [spec.x, rootY, spec.z], originWorld: [spec.x, rootY, spec.z * .6 - 3], nominalHeight: h, spread, yaw: spec.yaw, primaryBoughs: treeBoughs, shelfFans: treeFans, terminalShoots: treeShoots, connectedWoodMembers: wood.branches, localWoodBounds: {min: bark.boundingBox.min.toArray(), max: bark.boundingBox.max.toArray()}});
  }
  return stats;
}
