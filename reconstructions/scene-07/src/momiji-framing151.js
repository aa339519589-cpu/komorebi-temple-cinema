import * as T from 'three';

export const MOMIJI_REVISION151 = 'scene07-mature-cupped-momiji151-r02';
const TAU = Math.PI * 2;
const UP = new T.Vector3(0, 1, 0);
const V = p => new T.Vector3(...p);
const mix = (a, b, t) => a + (b - a) * t;
const randomFor = initial => {
  let state = initial >>> 0;
  return () => ((state = Math.imul(state, 1664525) + 1013904223 >>> 0) / 4294967296);
};

export const MOMIJI_SURVEY151 = Object.freeze({
  reference: 'references/hd/6-照片-7.jpg',
  imageSize: [1254, 1254],
  camera: [10.7, 12.8, 36], target: [0, 7, -2], fov: 47,
  observedCanopy: 'top/left frame; upper tips to about x520/y110, left fringe to about y470; clear central sky and pagoda finial',
  observedIndividualLeafSpanPx: [20, 45],
  inferredBranchDepthMetres: [4.3, 7.3],
  authoredBladeWidthMetres: [.060, .122],
  filmCameraPolyline: [[8.2, 8.55, 29.3], [8.7, 9.1, 30.6], [10.1, 11.7, 34.7], [10.7, 12.8, 36]],
  note: 'One fixed 3D survey from the reference camera. Depths, hidden woody support and pigments are inferred, not a calibrated site measurement. No camera-following or per-frame orientation.'
});

// Optional integration aid: the retired maple loop consumed exactly eight
// shared random draws for each of its 1,000 flat shapes. This pure replay
// preserves the existing downstream forest placement when it is removed.
export function advanceLegacyMomijiRandom151(initialSeed) {
  let state = initialSeed >>> 0;
  for (let i = 0; i < 8000; i++) state = Math.imul(state, 1664525) + 1013904223 >>> 0;
  return state;
}

function surveyFrame() {
  const camera = new T.PerspectiveCamera(MOMIJI_SURVEY151.fov, 1, .1, 350);
  camera.position.fromArray(MOMIJI_SURVEY151.camera);
  camera.lookAt(V(MOMIJI_SURVEY151.target)); camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
  const right = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), up = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 1), forward = camera.getWorldDirection(new T.Vector3());
  const tan = Math.tan(T.MathUtils.degToRad(MOMIJI_SURVEY151.fov * .5));
  return {
    camera, right, up, forward,
    world([px, py, depth]) {
      return camera.position.clone().addScaledVector(forward, depth).addScaledVector(right, (px / 1254 * 2 - 1) * depth * tan).addScaledVector(up, (1 - py / 1254 * 2) * depth * tan);
    },
    pixel(point) { const q = point.clone().project(camera); return [(q.x + 1) * 627, (1 - q.y) * 627]; }
  };
}

class SurfaceMesh151 {
  constructor() { this.p = []; this.c = []; this.uv = []; this.ix = []; this.members = 0; this.curves = []; }
  vertex(point, color, uv = [0, 0]) {
    const i = this.p.length / 3; this.p.push(point.x, point.y, point.z); this.c.push(color.r, color.g, color.b); this.uv.push(...uv); return i;
  }
  tube(points, radius, tipRadius, color, seed, {sides = 7, steps, flare = 0} = {}) {
    const curve = new T.CatmullRomCurve3(points.map(p => p.isVector3 ? p.clone() : V(p)), false, 'centripetal', .5);
    const length = curve.getLength(), N = steps || Math.max(4, Math.ceil(length / Math.max(.035, radius * 2))), M = sides, base = this.p.length / 3;
    const frames = curve.computeFrenetFrames(N, false), pigment = new T.Color(color);
    for (let j = 0; j <= N; j++) {
      const t = j / N, centre = curve.getPointAt(t), r = mix(radius, tipRadius, Math.pow(t, .84)) + flare * Math.exp(-t * 10);
      for (let k = 0; k <= M; k++) {
        const a = k / M * TAU, rough = 1 + .045 * Math.sin(a * 7 + t * 13 + seed) + .018 * Math.cos(a * 11 - t * 39 + seed * .31);
        const point = centre.clone().addScaledVector(frames.normals[j], Math.cos(a) * r * rough).addScaledVector(frames.binormals[j], Math.sin(a) * r * rough);
        const tint = .88 + .10 * Math.sin(a * 9 - t * 17 + seed) + .025 * Math.cos(a * 19 + t * 47);
        this.vertex(point, pigment.clone().multiplyScalar(tint), [k / M, t * length]);
        if (j < N && k < M) { const n = base + j * (M + 1) + k; this.ix.push(n, n + 1, n + M + 1, n + 1, n + M + 2, n + M + 1); }
      }
    }
    for (const [ring, reverse] of [[0, true], [N, false]]) {
      const centre = this.vertex(curve.getPointAt(ring / N), pigment.clone().multiplyScalar(.83));
      for (let k = 0; k < M; k++) { const a = base + ring * (M + 1) + k; this.ix.push(...(reverse ? [centre, a + 1, a] : [centre, a, a + 1])); }
    }
    this.curves.push({curve, radius, tipRadius}); this.members++; return curve;
  }
  finish(name) {
    const g = new T.BufferGeometry();
    g.name = name; g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new T.Float32BufferAttribute(this.c, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.ix); g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere(); return g;
  }
}

const PIGMENTS151 = Object.freeze([
  {name: 'mature-olive', upper: 0x687735, lower: 0x919b4b, vein: 0x879446},
  {name: 'fresh-green', upper: 0x7d8d43, lower: 0xa3ac5c, vein: 0x97a454},
  {name: 'shade-green', upper: 0x506631, lower: 0x7b8b48, vein: 0x7a8947},
  {name: 'turning-ochre', upper: 0x9b8d3c, lower: 0xbca553, vein: 0xa69c4d}
]);

function makeLeaf151(lobes, seed, pigmentIndex) {
  const random = randomFor(seed), range = (a, b) => mix(a, b, random()), centre = new T.Vector2(0, .075);
  const angles = (lobes === 7 ? [-108, -73, -37, 0, 37, 73, 108] : [-80, -40, 0, 40, 80]).map(T.MathUtils.degToRad);
  const radii = lobes === 7 ? [.30, .48, .61, .67, .61, .48, .30] : [.44, .61, .67, .61, .44];
  const tips = angles.map((a, i) => new T.Vector2(Math.sin(a) * radii[i] * range(.95, 1.035), centre.y + Math.cos(a) * radii[i] * range(.96, 1.035)));
  const valleys = [new T.Vector2(-.052, -.006)];
  // Fuller palms and broad lance-ovate lobes match the large foreground
  // blades in the photograph. r01's much deeper cut made cannabis-like
  // narrow fingers even before its near-edge-on poses reduced face area.
  for (let j = 0; j < lobes - 1; j++) { const a = (angles[j] + angles[j + 1]) * .5, r = Math.min(radii[j], radii[j + 1]) * range(.46, .55); valleys.push(new T.Vector2(Math.sin(a) * r, centre.y + Math.cos(a) * r)); }
  valleys.push(new T.Vector2(.052, -.006));
  const boundary = [new T.Vector2(0, 0), valleys[0].clone()];
  function toothedSide(a, b, teeth, sign) {
    const d = b.clone().sub(a), outward = new T.Vector2(-d.y, d.x).normalize(), bulge = d.length() * range(.105, .155);
    const edgeAt = t => a.clone().lerp(b, t).addScaledVector(outward, Math.sin(Math.PI * t) * bulge);
    for (let tooth = 0; tooth < teeth; tooth++) {
      const t0 = (tooth + .10) / teeth, tp = (tooth + .52) / teeth, t1 = (tooth + .81) / teeth;
      const strength = Math.sin(Math.PI * tp) ** .42;
      boundary.push(edgeAt(t0), edgeAt(tp).addScaledVector(outward, range(.0035, .008) * strength), edgeAt(t1));
      // A few smaller secondary teeth make a doubly serrate margin without
      // changing a lobe into the smooth arms of a geometric star.
      if ((tooth + seed + sign) % 3 === 0) boundary.push(edgeAt((tooth + .93) / teeth).addScaledVector(outward, .0028 * strength));
    }
    boundary.push(b.clone());
  }
  for (let j = 0; j < lobes; j++) {
    const teeth = Math.round(4 + radii[j] * 4);
    toothedSide(valleys[j], tips[j], teeth, j); toothedSide(tips[j], valleys[j + 1], teeth, j + 1);
  }
  // Base remains a real petiole attachment, with a small cordate indentation.
  boundary.push(new T.Vector2(.018, -.003));
  let signedArea = 0; for (let j = 0; j < boundary.length; j++) { const a = boundary[j], b = boundary[(j + 1) % boundary.length]; signedArea += a.x * b.y - b.x * a.y; }
  if (signedArea < 0) boundary.reverse();
  const minX = Math.min(...boundary.map(p => p.x)), maxX = Math.max(...boundary.map(p => p.x)), normalization = 1 / (maxX - minX), planAreaUnits = Math.abs(signedArea) * .5 * normalization * normalization;
  for (const p of [...boundary, ...tips, ...valleys, centre]) p.multiplyScalar(normalization);
  const phase = range(0, TAU), curl = range(-.022, .027), torsion = range(-.012, .012), halfThickness = .0012;
  const rawZ = (x, y) => {
    const dx = x - centre.x, dy = y - centre.y, r = Math.hypot(dx, dy), theta = Math.atan2(dx, dy);
    let fold = 0;
    for (let j = 0; j < lobes; j++) {
      const a = angles[j], along = dx * Math.sin(a) + dy * Math.cos(a), across = dx * Math.cos(a) - dy * Math.sin(a);
      if (along > 0) fold += .0065 * Math.exp(-((across / .036) ** 2)) * Math.min(1, along / .4);
    }
    return .016 * (r / .65) ** 2 + curl * (y / .85) ** 2 + torsion * x * y + .005 * Math.sin(theta * lobes + phase) * (r / .65) ** 3 + fold;
  };
  const baseZ = rawZ(0, 0), zAt = (x, y) => rawZ(x, y) - baseZ;
  const pigment = PIGMENTS151[pigmentIndex], upper = new T.Color(pigment.upper), lower = new T.Color(pigment.lower), dry = new T.Color(0x9a6f2e);
  const mesh = new SurfaceMesh151(), rings = 5, count = boundary.length, upperRings = [], lowerRings = [];
  const addSide = (front, indexRings) => {
    const base = mesh.vertex(new T.Vector3(centre.x, centre.y, zAt(centre.x, centre.y) + (front ? halfThickness : -halfThickness)), front ? upper : lower, [.5, .12]);
    for (let ring = 1; ring <= rings; ring++) {
      const ids = [], t = ring / rings;
      for (let j = 0; j < count; j++) {
        const p = centre.clone().lerp(boundary[j], t), r = p.distanceTo(centre);
        const tint = .93 + .045 * Math.sin(p.x * 29 + p.y * 37 + phase) + .035 * r;
        const color = (front ? upper : lower).clone().multiplyScalar(tint);
        if (r > .46 && (pigmentIndex === 3 || (j + seed) % 19 === 0)) color.lerp(dry, Math.min(.23, (r - .46) * .65));
        ids.push(mesh.vertex(new T.Vector3(p.x, p.y, zAt(p.x, p.y) + (front ? halfThickness : -halfThickness)), color, [p.x + .5, p.y]));
      }
      indexRings.push(ids);
    }
    const tri = (a, b, c) => mesh.ix.push(...(front ? [a, b, c] : [a, c, b]));
    for (let j = 0; j < count; j++) tri(base, indexRings[0][j], indexRings[0][(j + 1) % count]);
    for (let ring = 0; ring < rings - 1; ring++) for (let j = 0; j < count; j++) {
      const next = (j + 1) % count, a = indexRings[ring][j], b = indexRings[ring + 1][j], c = indexRings[ring][next], d = indexRings[ring + 1][next];
      tri(a, b, c); tri(b, d, c);
    }
  };
  addSide(true, upperRings); addSide(false, lowerRings);
  for (let j = 0; j < count; j++) {
    const next = (j + 1) % count, a = upperRings.at(-1)[j], b = upperRings.at(-1)[next], c = lowerRings.at(-1)[j], d = lowerRings.at(-1)[next];
    mesh.ix.push(a, b, c, b, d, c);
  }
  const lamina = mesh.finish(`momiji151-${lobes}-lobed-cupped-serrated-lamina-${seed}`);
  const veinMesh = new SurfaceMesh151(), veinColor = pigment.vein;
  const surfacePoint = (p, side, offset = .0016) => new T.Vector3(p.x, p.y, zAt(p.x, p.y) + side * offset);
  for (const side of [1, -1]) {
    veinMesh.tube([[0, 0, side * .0018], surfacePoint(centre, side), surfacePoint(tips[Math.floor(lobes / 2)].clone().lerp(centre, .12), side)], .0028, .0006, veinColor, seed, {sides: 4, steps: 7});
    for (let j = 0; j < lobes; j++) {
      const tip = tips[j], start = centre.clone().lerp(new T.Vector2(0, 0), .12), end = centre.clone().lerp(tip, .91);
      const points = Array.from({length: 7}, (_, k) => surfacePoint(start.clone().lerp(end, k / 6), side, .00145));
      veinMesh.tube(points, .0021, .00045, veinColor, seed + j * 7 + side, {sides: 4, steps: 6});
      for (const t of [.34, .56, .76]) for (const flank of [-1, 1]) {
        const base = centre.clone().lerp(tip, t), valley = valleys[j + (flank > 0 ? 1 : 0)];
        const edge = valley.clone().lerp(tip, Math.min(.96, t + .15)), target = base.clone().lerp(edge, .78);
        veinMesh.tube([surfacePoint(base, side, .0016), surfacePoint(base.clone().lerp(target, .52), side, .0016), surfacePoint(target, side, .0016)], .00115 * (1 - t * .4), .00032, veinColor, seed + j * 37 + flank, {sides: 3, steps: 2});
      }
    }
  }
  const veins = veinMesh.finish(`momiji151-palmar-and-minor-veins-${seed}`), petioleMesh = new SurfaceMesh151();
  const petioleStart = new T.Vector3(0, -.26, -.045);
  const petioleCurve = petioleMesh.tube([petioleStart, new T.Vector3(.006, -.115, -.017), new T.Vector3(0, 0, 0)], .0058, .0037, 0x79573b, seed + 193, {sides: 6, steps: 7});
  const petiole = petioleMesh.finish(`momiji151-curved-petiole-${seed}`);
  const assemblyBounds = lamina.boundingBox.clone().union(veins.boundingBox).union(petiole.boundingBox), assemblySphere = assemblyBounds.getBoundingSphere(new T.Sphere());
  return {lamina, veins, petiole, petioleStart, petioleLengthUnits: petioleCurve.getLength(), assemblySphere, lobes, pigment: pigment.name, planAreaUnits, bladeWidthUnits: 1, boundaryVertices: count};
}

function materialSet151(sunDirection, sunColor) {
  const lightDirection = V(sunDirection).normalize(), solarColor = new T.Color(sunColor);
  const leaf = new T.MeshPhysicalMaterial({name: 'momiji151-opaque-thin-cupped-lamina', color: 0xffffff, roughness: .68, metalness: 0, clearcoat: .035, clearcoatRoughness: .53, side: T.DoubleSide, vertexColors: true});
  leaf.forceSinglePass = true;
  leaf.onBeforeCompile = shader => {
    shader.uniforms.momijiSunDirection151 = {value: lightDirection}; shader.uniforms.momijiSunColor151 = {value: solarColor};
    shader.fragmentShader = 'uniform vec3 momijiSunDirection151; uniform vec3 momijiSunColor151;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n vec3 ms151=normalize((viewMatrix*vec4(momijiSunDirection151,0.)).xyz); float mt151=pow(max(dot(-normal,ms151),0.),1.35); reflectedLight.indirectDiffuse+=diffuseColor.rgb*momijiSunColor151*mt151*.64;');
  };
  leaf.customProgramCacheKey = () => 'momiji151-thin-pigment-under-actual-sun-r02';
  const wood = new T.MeshStandardMaterial({name: 'momiji151-mature-branch-and-twig', color: 0xffffff, roughness: .93, vertexColors: true});
  const vein = new T.MeshStandardMaterial({name: 'momiji151-palmar-minor-veins', color: 0xffffff, roughness: .82, vertexColors: true, side: T.DoubleSide});
  return {leaf, wood, vein};
}

const CLUSTERS151 = Object.freeze([
  [-15, 25, 6.8, 8], [35, 15, 6.5, 9], [77, 34, 6.3, 9], [120, 12, 6.2, 8], [160, 28, 6.3, 7], [205, 8, 6.6, 7], [245, 22, 6.5, 7], [286, -10, 6.7, 5], [328, 8, 6.6, 7], [370, 25, 6.5, 6], [413, 10, 6.7, 7], [458, 18, 7.0, 5], [500, -5, 7.3, 4],
  [-15, 92, 6.4, 9], [32, 76, 6.1, 9], [67, 93, 5.4, 8], [110, 78, 5.5, 6], [139, 115, 4.9, 7], [97, 144, 4.6, 6], [54, 158, 4.9, 8], [22, 191, 5.2, 9], [-7, 230, 5.3, 7], [30, 243, 5.1, 6], [9, 298, 5.4, 5], [-12, 332, 5.7, 5], [17, 377, 5.5, 5], [-10, 422, 5.8, 4], [-5, 438, 6.2, 2],
  [183, 69, 5.3, 6], [236, 52, 5.8, 5], [275, 80, 5.6, 6], [291, 91, 5.2, 6], [310, 82, 5.2, 4], [367, 68, 5.7, 5], [405, 55, 5.9, 5], [449, 66, 6.4, 4]
]);

function nearestOnCurves151(point, curves) {
  let best = null;
  for (const record of curves) for (let j = 0; j <= 48; j++) {
    const t = j / 48, p = record.curve.getPointAt(t), distance = p.distanceToSquared(point);
    if (!best || distance < best.distance) best = {point: p, t, distance, record};
  }
  let lo = Math.max(0, best.t - 1 / 48), hi = Math.min(1, best.t + 1 / 48);
  for (let i = 0; i < 10; i++) {
    const t1 = mix(lo, hi, 1 / 3), t2 = mix(lo, hi, 2 / 3);
    if (best.record.curve.getPointAt(t1).distanceToSquared(point) < best.record.curve.getPointAt(t2).distanceToSquared(point)) hi = t2; else lo = t1;
  }
  best.t = (lo + hi) * .5; best.point = best.record.curve.getPointAt(best.t); return best;
}

function distanceToRoute151(point, route) {
  let minimum = Infinity;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1], d = route[i].clone().sub(a), t = T.MathUtils.clamp(point.clone().sub(a).dot(d) / d.lengthSq(), 0, 1);
    minimum = Math.min(minimum, point.distanceTo(a.clone().addScaledVector(d, t)));
  }
  return minimum;
}

/**
 * Build once in world coordinates. Default returns {group, info, dispose};
 * root may scene.add(group) after removing the old branch/1,000 flat shapes.
 * Optional emit(g,material,x,y,z,sx,sy,sz,[rx,ry,rz],tint) uses the existing
 * Scene07 batching API instead; call it under the identity world transform.
 * No texture assets, lights, cameras or scene globals are installed/edited.
 */
export function buildMomijiFraming151({emit = null, seed = 1510731, sunDirection = [-.58, .035, -.81], sunColor = 0xffbf77} = {}) {
  const random = randomFor(seed), range = (a, b) => mix(a, b, random()), frame = surveyFrame();
  const group = new T.Group(); group.name = MOMIJI_REVISION151;
  const materials = materialSet151(sunDirection, sunColor), wood = new SurfaceMesh151(), twig = new SurfaceMesh151(), records = [], batches = new Map();
  const route = MOMIJI_SURVEY151.filmCameraPolyline.map(V), leafRecords = [], geometries = new Set();
  const add = (geometry, material, matrix, tint = 1) => {
    geometries.add(geometry); const key = geometry.uuid + material.uuid;
    if (!batches.has(key)) batches.set(key, {geometry, material, items: []}); batches.get(key).items.push({matrix, tint});
  };
  const matureSurvey = [[-130, -65, 7.4], [-35, -5, 7.0], [85, 25, 6.4], [230, 20, 6.6], [370, -3, 6.9], [510, -28, 7.3]];
  const main = wood.tube(matureSurvey.map(frame.world), .040, .004, 0x6b573d, seed, {sides: 13, steps: 66, flare: .006});
  records.push({id: 'mature-main-limb', curve: main, radius: .040, tipRadius: .004});
  const forks = [
    {id: 'left-descending-fork', attach: [30, 5, 6.7], radius: .014, points: [[10, 105, 6.0], [15, 200, 5.3], [-5, 285, 5.5], [-25, 390, 5.9], [-45, 485, 6.4]]},
    {id: 'inner-pendant-fork', attach: [145, 22, 6.4], radius: .0108, points: [[174, 62, 5.6], [145, 110, 4.9], [115, 157, 4.8], [55, 199, 5.0]]},
    {id: 'upper-inner-fork', attach: [287, 15, 6.7], radius: .0085, points: [[300, 55, 6.1], [309, 84, 5.4], [315, 105, 5.0]]},
    {id: 'upper-right-fork', attach: [380, -2, 6.9], radius: .0075, points: [[402, 26, 6.4], [430, 58, 6.3], [461, 73, 6.6]]}
  ];
  for (let j = 0; j < forks.length; j++) {
    const spec = forks[j], attached = nearestOnCurves151(frame.world(spec.attach), records.slice(0, 1));
    const points = [attached.point, ...spec.points.map(frame.world)], curve = wood.tube(points, spec.radius, .0017, 0x6c593f, seed + j * 151, {sides: 10, steps: 48, flare: spec.radius * .16});
    records.push({id: spec.id, curve, radius: spec.radius, tipRadius: .0017});
  }
  const templates = Array.from({length: 16}, (_, i) => makeLeaf151(i % 4 === 3 ? 7 : 5, 151301 + i * 31, i % 8 === 7 ? 3 : i % 3));
  const leafColors = PIGMENTS151.map(p => p.name), projection = {min: [Infinity, Infinity], max: [-Infinity, -Infinity]}, projectedSpans = [], bladeWidths = [], cupDepths = [], petioleLengths = [], projectedAreas = [], bladeFacing = [];
  const focalPixels = 627 / Math.tan(T.MathUtils.degToRad(MOMIJI_SURVEY151.fov * .5));
  let minimumClearance = Infinity, minimumClearanceFeature = '', leafPairs = 0;
  const woodSupportInfo = records.map(r => ({id: r.id, radiusMetres: r.radius, tipRadiusMetres: r.tipRadius, worldPoints: r.curve.points.map(p => p.toArray())}));
  for (let cluster = 0; cluster < CLUSTERS151.length; cluster++) {
    const [px, py, depth, pairs] = CLUSTERS151[cluster], centre = frame.world([px, py, depth]), attached = nearestOnCurves151(centre, records);
    const carryDirection = centre.clone().sub(attached.point);
    const axis = carryDirection.length() > .065 ? carryDirection.normalize() : frame.right.clone().multiplyScalar(range(-1, 1)).addScaledVector(frame.up, -.8).normalize();
    axis.addScaledVector(frame.forward, range(-.12, .13)).normalize();
    const shootLength = range(.23, .37), start = centre.clone().addScaledVector(axis, -shootLength * .46), end = centre.clone().addScaledVector(axis, shootLength * .54);
    const parentRadius = mix(attached.record.radius, attached.record.tipRadius, Math.pow(attached.t, .84)), carryRadius = Math.max(.0018, Math.min(.0085, parentRadius * .56));
    const elbow = attached.point.clone().lerp(start, .56); elbow.y += range(-.022, .014);
    wood.tube([attached.point, elbow, start], carryRadius, .00155, 0x735a3e, seed + cluster * 43, {sides: 7, steps: 9, flare: carryRadius * .11});
    const middle = centre.clone(); middle.y -= range(.004, .017);
    const shoot = twig.tube([start, middle, end], .00165, .00065, cluster % 5 === 0 ? 0x7b5b3c : 0x687042, seed + cluster * 97, {sides: 6, steps: 12});
    for (let node = 0; node < pairs; node++) {
      const t = .12 + node * (.76 / Math.max(1, pairs - 1)), point = shoot.getPointAt(t), tangent = shoot.getTangentAt(t).normalize();
      let sideVector = tangent.clone().cross(UP); if (sideVector.lengthSq() < .01) sideVector = frame.right.clone(); sideVector.normalize();
      for (const side of [-1, 1]) {
        if (node > 0 && (node + cluster + (side > 0 ? 7 : 0)) % 29 === 0) continue;
        const template = templates[Math.floor(random() * templates.length)], width = range(.068, .117) * (node === pairs - 1 ? range(.82, 1) : 1);
        const outgoing = sideVector.clone().multiplyScalar(side).addScaledVector(tangent, range(.16, .35)).add(new T.Vector3(0, range(-.60, -.25), 0)).normalize();
        // Outer maple foliage hangs into the open veranda side (+world Z).
        // These are fixed botanical poses, never camera-facing updates.
        // r01 biased normals upward and accidentally made most blades read
        // as narrow edges from the actual below-canopy viewpoint.
        const posture = random();
        const normal = posture < .74 ? new T.Vector3(range(-.22, .18), range(.18, .48), range(.82, 1.05)) : posture < .92 ? new T.Vector3(range(-.25, .20), range(.50, .78), range(.46, .78)) : new T.Vector3(range(-.32, .27), range(.83, 1.0), range(.05, .40));
        normal.addScaledVector(sideVector, range(-.15, .15)).normalize();
        const yAxis = outgoing.clone().addScaledVector(normal, -outgoing.dot(normal)).normalize(), xAxis = yAxis.clone().cross(normal).normalize();
        const zAxis = xAxis.clone().cross(yAxis).normalize(), rotation = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(xAxis, yAxis, zAxis));
        rotation.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), range(-.27, .27)));
        const attachment = point.clone().addScaledVector(sideVector, side * .0012), translation = attachment.clone().sub(template.petioleStart.clone().multiplyScalar(width).applyQuaternion(rotation));
        const matrix = new T.Matrix4().compose(translation, rotation, new T.Vector3(width, width, width)), tint = range(.91, 1.055);
        add(template.lamina, materials.leaf, matrix, tint); add(template.veins, materials.vein, matrix, tint); add(template.petiole, materials.wood, matrix, 1);
        const sphere = template.assemblySphere.clone().applyMatrix4(matrix), clearance = distanceToRoute151(sphere.center, route) - sphere.radius;
        if (clearance < minimumClearance) { minimumClearance = clearance; minimumClearanceFeature = `leaf cluster ${cluster}, node ${node}, side ${side}`; }
        const min = [Infinity, Infinity], max = [-Infinity, -Infinity], bounds = template.lamina.boundingBox;
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
          const p = frame.pixel(new T.Vector3(x, y, z).applyMatrix4(matrix));
          for (let a = 0; a < 2; a++) { min[a] = Math.min(min[a], p[a]); max[a] = Math.max(max[a], p[a]); projection.min[a] = Math.min(projection.min[a], p[a]); projection.max[a] = Math.max(projection.max[a], p[a]); }
        }
        const leafCentre = template.lamina.boundingSphere.center.clone().applyMatrix4(matrix), view = frame.camera.position.clone().sub(leafCentre).normalize(), worldNormal = new T.Vector3(0, 0, 1).applyQuaternion(rotation), facing = Math.abs(worldNormal.dot(view)), viewDepth = leafCentre.clone().sub(frame.camera.position).dot(frame.forward);
        const estimatedArea = template.planAreaUnits * width * width * facing * (focalPixels / viewDepth) ** 2;
        projectedAreas.push(estimatedArea); bladeFacing.push(facing);
        projectedSpans.push(Math.max(max[0] - min[0], max[1] - min[1])); bladeWidths.push(width);
        cupDepths.push((bounds.max.z - bounds.min.z) * width); petioleLengths.push(template.petioleLengthUnits * width);
        leafRecords.push({cluster, node, side, lobes: template.lobes, bladeWidthMetres: width, pigment: template.pigment, worldAttachment: attachment.toArray(), matrix: matrix.toArray(), projectedBoundsPx: {min, max}, bladeFacingToSurveyView: facing, estimatedProjectedLaminaAreaPx2: estimatedArea});
      }
      leafPairs++;
    }
    // The visible terminal twig ends in a small actual, tapered bud.
    const budTip = end.clone().addScaledVector(shoot.getTangentAt(1), .007);
    twig.tube([end, end.clone().lerp(budTip, .5), budTip], .0017, .0003, 0x855937, seed + cluster * 149, {sides: 6, steps: 3});
  }
  const matureGeometry = wood.finish('momiji151-continuous-mature-limb-forks-bearing-twigs'), liveGeometry = twig.finish('momiji151-opposite-node-live-shoots-buds');
  add(matureGeometry, materials.wood, new T.Matrix4()); add(liveGeometry, materials.wood, new T.Matrix4());
  const allWoodCurves = [...wood.curves, ...twig.curves];
  for (let member = 0; member < allWoodCurves.length; member++) for (let j = 0; j <= 64; j++) {
    const record = allWoodCurves[member];
    const t = j / 64, p = record.curve.getPointAt(t), r = mix(record.radius, record.tipRadius, Math.pow(t, .84)), clearance = distanceToRoute151(p, route) - r;
    if (clearance < minimumClearance) { minimumClearance = clearance; minimumClearanceFeature = `woody member ${member}`; }
  }
  let triangles = 0, instances = 0;
  for (const batch of batches.values()) {
    const {geometry, material, items} = batch; instances += items.length; triangles += geometry.index.count / 3 * items.length;
    if (emit) {
      const p = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3();
      for (const item of items) { item.matrix.decompose(p, q, s); const e = new T.Euler().setFromQuaternion(q); emit(geometry, material, p.x, p.y, p.z, s.x, s.y, s.z, [e.x, e.y, e.z], item.tint); }
    } else {
      const object = new T.InstancedMesh(geometry, material, items.length); object.name = geometry.name;
      for (let i = 0; i < items.length; i++) { object.setMatrixAt(i, items[i].matrix); object.setColorAt(i, new T.Color().setScalar(items[i].tint)); }
      object.castShadow = object.receiveShadow = true; object.instanceMatrix.needsUpdate = true; object.instanceColor.needsUpdate = true; group.add(object);
    }
  }
  const summary = values => { const sorted = [...values].sort((a, b) => a - b); return {min: sorted[0], median: sorted[Math.floor(sorted.length / 2)], max: sorted.at(-1)}; };
  const info = {
    revision: MOMIJI_REVISION151, visualAccepted: false, integrationMode: emit ? 'existing Scene07 emit under identity transform' : 'fixed world Group', leafCount: leafRecords.length, leafPairs, clusters: CLUSTERS151.length,
    templates: templates.length, lobes: [5, 7], bladeWidthsMetres: summary(bladeWidths), authoredBladeCupDepthsMetres: summary(cupDepths), authoredPetioleLengthsMetres: summary(petioleLengths), projectedLeafSpansAt1254Px: summary(projectedSpans), estimatedProjectedLaminaAreasPx2: summary(projectedAreas), bladeFacingToSurveyView: summary(bladeFacing), projectedEnvelopePx: projection,
    instances, triangles, matureWoodMembers: wood.members, liveShootMembers: twig.members, woodSupport: woodSupportInfo,
    minimumConservativeCameraPolylineClearanceMetres: minimumClearance, minimumClearanceFeature, cameraRouteAudit: 'world branch capsules and transformed leaf spheres versus supplied four-point film-camera polyline; parent native motion inspection still required',
    material: {pigments: leafColors, response: 'authored upper/lower chlorophyll albedo, small ochre edge variation; thin-sheet backscatter under the supplied actual sun; no painted lighting', sunDirection: [...sunDirection], sunColor},
    geometry: 'continuous fluted bearing limbs/forks > connected fine twig > opposite paired-node petioles > closed thin serrated cupped 5/7-lobed lamina > raised palmar/secondary/minor veins on both sides',
    survey: MOMIJI_SURVEY151, leaves: leafRecords, externalAssets: [], provenance: 'lookdev/scene07-momiji151/provenance.json'
  };
  return {group, info, dispose() { for (const geometry of geometries) geometry.dispose(); for (const material of Object.values(materials)) material.dispose(); }};
}
