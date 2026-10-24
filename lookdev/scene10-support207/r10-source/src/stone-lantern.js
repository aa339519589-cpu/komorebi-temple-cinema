// Physical stone lantern geometry for reconstruction 10. Geometry remains local to
// the lantern anchor; the surrounding garden, camera and illumination stay authored
// by main.js.
import {installSurfaceDetail} from './surface-detail.js';
const lanternTemplates = new WeakMap();

function chamferedSquare(r, cut) {
  const c = Math.min(cut, r * 0.45);
  return [
    [-r + c, -r], [r - c, -r], [r, -r + c], [r, r - c],
    [r - c, r], [-r + c, r], [-r, r - c], [-r, -r + c]
  ];
}

function profileGeometry(T, levels, sides = 8) {
  const positions = [], uvs = [];
  for (let j = 0; j < levels.length - 1; j++) {
    const low = levels[j], high = levels[j + 1];
    const a = chamferedSquare(low.r, low.cut ?? low.r * 0.22);
    const b = chamferedSquare(high.r, high.cut ?? high.r * 0.22);
    for (let i = 0; i < sides; i++) {
      const k = (i + 1) % sides;
      const jitter0 = 1 + 0.006 * Math.sin(i * 2.37 + j * 1.81);
      const jitter1 = 1 + 0.006 * Math.sin(k * 2.37 + j * 1.81);
      const p0 = [a[i][0] * jitter0, low.y, a[i][1] * jitter0];
      const p1 = [a[k][0] * jitter1, low.y, a[k][1] * jitter1];
      const hi0=1+0.006*Math.sin(i*2.37+(j+1)*1.81),hi1=1+0.006*Math.sin(k*2.37+(j+1)*1.81);
      const p2 = [b[k][0] * hi1, high.y, b[k][1] * hi1];
      const p3 = [b[i][0] * hi0, high.y, b[i][1] * hi0];
      for (const [p, u, v] of [[p0, i / sides, low.y], [p3, i / sides, high.y],
                                [p2, (i + 1) / sides, high.y], [p0, i / sides, low.y],
                                [p2, (i + 1) / sides, high.y], [p1, (i + 1) / sides, low.y]]) {
        positions.push(...p); uvs.push(u * 3.4, v * 1.8);
      }
    }
  }
  for(const [index,top]of[[0,false],[levels.length-1,true]]){const level=levels[index],ring=chamferedSquare(level.r,level.cut??level.r*.22).map(([x,z],i)=>{const j=1+.006*Math.sin(i*2.37+index*1.81);return[x*j,level.y,z*j];});for(let i=0;i<sides;i++){const order=top?[ring[(i+1)%sides],ring[i]]:[ring[i],ring[(i+1)%sides]];for(const p of[[0,level.y,0],...order]){positions.push(...p);uvs.push(p[0]*1.8,p[2]*1.8);}}}
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  g.name='210-closed-shared-ring-lantern-profile';
  return g;
}

function bandGeometry(T, radius, height, bevel = 0.018) {
  const r = radius, inner = Math.max(0.01, r - bevel);
  return profileGeometry(T, [
    { y: -height / 2, r: inner, cut: inner * 0.20 },
    { y: -height / 2 + bevel * 0.55, r, cut: r * 0.20 },
    { y: height / 2 - bevel * 0.55, r, cut: r * 0.20 },
    { y: height / 2, r: inner, cut: inner * 0.20 }
  ]);
}

function facetedTurnedStone(T, profile, segments = 12) {
  const positions = [], uvs = [];
  for (let j = 0; j < profile.length - 1; j++) {
    const a = profile[j], b = profile[j + 1];
    for (let i = 0; i < segments; i++) {
      const a0 = i * Math.PI * 2 / segments, a1 = (i + 1) * Math.PI * 2 / segments;
      const pa = [Math.cos(a0) * a.r, a.y, Math.sin(a0) * a.r];
      const pb = [Math.cos(a1) * a.r, a.y, Math.sin(a1) * a.r];
      const pc = [Math.cos(a1) * b.r, b.y, Math.sin(a1) * b.r];
      const pd = [Math.cos(a0) * b.r, b.y, Math.sin(a0) * b.r];
      for (const [p, u, v] of [[pa, i / segments, a.y], [pd, i / segments, b.y],
                                [pc, (i + 1) / segments, b.y], [pa, i / segments, a.y],
                                [pc, (i + 1) / segments, b.y], [pb, (i + 1) / segments, a.y]]) {
        positions.push(...p); uvs.push(u * 3, v * 2.2);
      }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  return g;
}

function roofPoint(x, z, drop = 0) {
  const t = Math.max(Math.abs(x), Math.abs(z));
  const inner = Math.max(0, (t - 0.08) / 0.92);
  const tip = Math.min(Math.abs(x), Math.abs(z));
  const smooth = v => { const q = Math.max(0, Math.min(1, (v - 0.58) / 0.40)); return q * q * (3 - 2 * q); };
  const curl = 0.11 * smooth(t) * smooth(tip);
  const weather = 0.004 * Math.sin(x * 13.7 + z * 9.1) * Math.sin(z * 8.3 - x * 4.2);
  return [x * 1.02, 3.28 - 0.42 * Math.pow(inner, 1.08) + curl + weather - drop, z * 1.02];
}

function roofSurface(T, n, drop, upward) {
  const positions = [], uvs = [], indices = [];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const x = -1 + 2 * i / n, z = -1 + 2 * j / n;
    positions.push(...roofPoint(x, z, drop)); uvs.push((x + 1) * 2, (z + 1) * 2);
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1;
    if (upward) indices.push(a, c, b, b, c, d);
    else indices.push(a, b, c, b, d, c);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}

function roofSides(T, n, drop) {
  const positions = [], uvs = [];
  const edge = [];
  for (let i = 0; i <= n; i++) edge.push([-1 + 2 * i / n, -1]);
  for (let i = 1; i <= n; i++) edge.push([1, -1 + 2 * i / n]);
  for (let i = 1; i <= n; i++) edge.push([1 - 2 * i / n, 1]);
  for (let i = 1; i < n; i++) edge.push([-1, 1 - 2 * i / n]);
  for (let i = 0; i < edge.length; i++) {
    const p = edge[i], q = edge[(i + 1) % edge.length], a = roofPoint(p[0], p[1]), b = roofPoint(q[0], q[1]);
    const c = roofPoint(q[0], q[1], drop), d = roofPoint(p[0], p[1], drop);
    for (const v of [a, b, c, a, c, d]) { positions.push(...v); uvs.push(v[0] * 2.2, v[2] * 2.2); }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  return g;
}

function mossRoof(T, n = 64) {
  const positions = [], uvs = [];
  const field = (x, z) => {
    const ell = (cx, cz, rx, rz) => Math.exp(-(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2) * 1.7);
    const broad = Math.max(ell(-0.16, 0.08, 0.78, 0.63), ell(0.48, -0.38, 0.39, 0.34), ell(-0.52, -0.38, 0.34, 0.38));
    const noise = 0.13 * Math.sin(x * 17 + z * 9) + 0.10 * Math.sin(z * 21 - x * 12) + 0.07 * Math.cos(x * 31 + z * 27);
    return broad + noise;
  };
  const push = (x, z) => {
    const p = roofPoint(x, z, -0.014 - 0.004 * Math.sin(x * 16 - z * 12));
    positions.push(...p); uvs.push((x + 1) * 2, (z + 1) * 2);
  };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x0 = -0.94 + 1.88 * i / n, x1 = -0.94 + 1.88 * (i + 1) / n;
    const z0 = -0.94 + 1.88 * j / n, z1 = -0.94 + 1.88 * (j + 1) / n;
    if (field((x0 + x1) * 0.5, (z0 + z1) * 0.5) < 0.49) continue;
    // Moss grows as a thin connected surface on the roof, rather than as separate stones.
    // The reversed winding follows the upward-facing roof surface.
    push(x0, z0); push(x0, z1); push(x1, z0);
    push(x1, z0); push(x0, z1); push(x1, z1);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  return g;
}

function createTemplates(T, m) {
  const existing = lanternTemplates.get(m);
  if (existing) return existing;
  const joint = new T.MeshStandardMaterial({
    name: 'lantern-weathered-granite-incised-joints', color: '#575b54', roughness: 0.93,
    map: m.granite.map, normalMap: m.granite.normalMap, roughnessMap: m.granite.roughnessMap,
    normalScale: new T.Vector2(0.48, 0.48)
  });
  const blackstone = new T.MeshStandardMaterial({
    name: 'lantern-black-granite-giboshi', color: '#282b26', roughness: 0.90,
    map: m.granite.map, normalMap: m.granite.normalMap, roughnessMap: m.granite.roughnessMap,
    normalScale: new T.Vector2(0.62, 0.62)
  });
  const stone=new T.MeshPhysicalMaterial({name:'210-pitted-rain-wet-lantern-granite',map:m.granite.map,normalMap:m.granite.normalMap,normalScale:new T.Vector2(.82,.82),roughnessMap:m.granite.roughnessMap,color:'#7e8878',roughness:.62,clearcoat:.34,clearcoatRoughness:.22});installSurfaceDetail(stone,'stone');
  const shaft = profileGeometry(T, [
    { y: 0.22, r: 0.46, cut: 0.09 }, { y: 0.28, r: 0.48, cut: 0.09 },
    { y: 0.34, r: 0.41, cut: 0.08 }, { y: 0.41, r: 0.35, cut: 0.07 },
    { y: 0.47, r: 0.32, cut: 0.065 }, { y: 0.54, r: 0.29, cut: 0.06 },
    { y: 0.62, r: 0.335, cut: 0.08 }, { y: 1.04, r: 0.33, cut: 0.08 },
    { y: 1.12, r: 0.35, cut: 0.08 }, { y: 1.19, r: 0.40, cut: 0.09 },
    { y: 1.27, r: 0.46, cut: 0.10 }, { y: 1.35, r: 0.49, cut: 0.10 },
    { y: 1.46, r: 0.48, cut: 0.10 }, { y: 1.55, r: 0.43, cut: 0.09 },
    { y: 1.64, r: 0.40, cut: 0.08 }, { y: 1.72, r: 0.46, cut: 0.09 }
  ]);
  const lowerBand = bandGeometry(T, 0.355, 0.075, 0.018);
  const upperBand = bandGeometry(T, 0.445, 0.070, 0.017);
  const lowerGroove = bandGeometry(T, 0.342, 0.014, 0.006);
  const upperGroove = bandGeometry(T, 0.420, 0.014, 0.006);
  const roofN = 36, roofDrop = 0.14;
  const finial = facetedTurnedStone(T, [
    { y: 3.22, r: 0.17 }, { y: 3.27, r: 0.23 }, { y: 3.33, r: 0.22 },
    { y: 3.38, r: 0.15 }, { y: 3.43, r: 0.11 }, { y: 3.49, r: 0.17 },
    { y: 3.57, r: 0.225 }, { y: 3.66, r: 0.22 }, { y: 3.73, r: 0.16 },
    { y: 3.79, r: 0.09 }, { y: 3.84, r: 0.045 }, { y: 3.88, r: 0.085 },
    { y: 3.93, r: 0.074 }, { y: 3.97, r: 0.025 }
  ], 12);
  const templates = {
    joint, blackstone, stone, shaft, lowerBand, upperBand, lowerGroove, upperGroove,
    roofTop: roofSurface(T, roofN, 0, true),
    roofBottom: roofSurface(T, roofN, roofDrop, false),
    roofSides: roofSides(T, roofN, roofDrop),
    roofMoss: mossRoof(T), finial
  };
  lanternTemplates.set(m, templates);
  return templates;
}

export function buildStoneLantern({ T, emit, box, group, R, scene, materials: m, layout: L, x, z, s = 1, isNear = false }) {
  const t = createTemplates(T, m), baseY = isNear ? L.heroStoneLantern.position[1] : 0;
  const scale = isNear ? L.heroStoneLantern.scale : s;
  group(x, baseY, z, R(-0.12, 0.12), () => {
    // The plinth and capital land on the established anchor; the shaft is a chipped,
    // chamfered granite stack with two raised moldings and incised bed joints.
    box(0, 0.12, 0, 1.08, 0.24, 1.08, t.stone);
    emit(t.shaft, t.stone);
    emit(t.lowerBand, t.stone, 0, 0.54, 0, 1, 1, 1, 0, 0.98);
    emit(t.lowerGroove, t.joint, 0, 0.59, 0);
    emit(t.upperBand, t.stone, 0, 1.29, 0, 1, 1, 1, 0, 0.98);
    emit(t.upperGroove, t.joint, 0, 1.335, 0);
    box(0, 1.80, 0, 1.02, 0.18, 1.02, t.stone);

    // Four substantial corner piers frame real, recessed openings. Paper sits behind
    // the stone reveals, leaving depth around each aperture rather than a surface box.
    for (const a of [-1, 1]) for (const b of [-1, 1]) {
      box(a * 0.370, 2.28, b * 0.370, 0.17, 0.90, 0.17, t.stone);
      box(a * 0.370, 1.87, b * 0.370, 0.205, 0.10, 0.205, t.stone);
      box(a * 0.370, 2.72, b * 0.370, 0.205, 0.10, 0.205, t.stone);
    }
    for (let face = 0; face < 4; face++) group(0, 0, 0, face * Math.PI / 2, () => {
      // A deep stone window well with a warm inner paper plane and restrained lattice.
      box(0, 1.875, 0.38, 0.63, 0.105, 0.17, t.stone);
      box(0, 2.705, 0.38, 0.65, 0.115, 0.17, t.stone);
      for (const side of [-1, 1]) box(side * 0.285, 2.28, 0.29, 0.11, 0.69, 0.18, t.stone);
      box(0, 2.28, 0.20, 0.48, 0.65, 0.018, 'stonePaper');
      for (const xx of [-0.14, 0.14]) box(xx, 2.28, 0.39, 0.014, 0.66, 0.014, 'darkwood');
      for (const yy of [2.08, 2.48]) box(0, yy, 0.39, 0.51, 0.014, 0.014, 'darkwood');
    });
    // Roof shell: square hip planes, a real thick underside, and curled eave tips.
    emit(t.roofTop, t.stone,0,0,0,.78,1,.78);
    emit(t.roofSides, t.joint, 0, 0, 0, .78, 1, .78, 0, 0.86);
    emit(t.roofBottom, t.joint, 0, 0, 0, .78, 1, .78, 0, 0.90);
    emit(t.roofMoss, 'moss',0,0,0,.78,1,.78);
    emit(t.finial, t.blackstone);

    // Preserve the prior fixture's random stream so downstream garden placement is stable.
    for (let i = 0; i < 102; i++) R(0, 1);
  }, scale);
  const light = new T.PointLight('#ffbd64', 15 * (isNear ? L.heroStoneLantern.scale[1] ** 2 : s ** 2), 0, 2);
  light.name = 'scene10-inverse-square-existing-stone-fixture';
  if (isNear) {light.castShadow = true;light.shadow.mapSize.set(512,512);light.shadow.camera.near=.10;light.shadow.camera.far=50;light.shadow.bias=-.00003;light.shadow.normalBias=.010;}
  light.position.set(x, 2.28 * (isNear ? L.heroStoneLantern.scale[1] : s) + baseY, z);
  scene.add(light);
}
