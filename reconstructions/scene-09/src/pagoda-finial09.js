import * as T from 'three';

// Authored solid reconstruction of the visible silhouette, not an identified
// historic sōrin type. The photograph resolves nine main rims; the small upper
// support count and the concealed roof light are explicitly inferred.
export const PAGODA_FINIAL_REVISION = 'scene09-slender-eleven-rim-finial143';
export const GOLD_PBR_SOURCE = 'https://dev.epicgames.com/documentation/en-us/unreal-engine/physically-based-materials-in-unreal-engine';

// A closed radial profile with shared angular vertices and single axis poles.
// Unlike an uncapped tube, every profile transition has a real back/inner face.
function turned(profile, name, segments = 64) {
  const positions = [], indices = [], rings = [];
  for (const [r, y] of profile) {
    if (r === 0) {
      const id = positions.length / 3;
      positions.push(0, y, 0);
      rings.push(Array(segments).fill(id));
    } else {
      const ids = [];
      for (let k = 0; k < segments; k++) {
        const a = k * Math.PI * 2 / segments;
        ids.push(positions.length / 3);
        positions.push(r * Math.sin(a), y, r * Math.cos(a));
      }
      rings.push(ids);
    }
  }
  for (let j = 0; j < rings.length; j++) {
    const row = rings[j], next = rings[(j + 1) % rings.length];
    for (let k = 0; k < segments; k++) {
      const kk = (k + 1) % segments, a = row[k], d = row[kk], b = next[k], c = next[kk];
      if (a !== d) indices.push(a, d, b);
      if (b !== c) indices.push(d, c, b);
    }
  }
  const g = new T.BufferGeometry();
  g.name = name;
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  g.computeBoundingBox();
  return g;
}

export function installPagodaFinial09({emit, materials, scene, transform, base}) {
  const metal = new T.MeshStandardMaterial({metalness: 1, roughness: .36});
  // Linear measured metal reflectance, written without a second sRGB decode.
  metal.color.setRGB(1, .766, .336, T.LinearSRGBColorSpace);
  metal.emissive.setRGB(0, 0, 0);
  metal.emissiveIntensity = 0;
  metal.name = 'scene09-finial-gilded-metal';
  metal.userData = {
    source: GOLD_PBR_SOURCE,
    baseColorEncoding: 'linear-sRGB measured gold reference',
    roughness: 'authored .36, retained from the previous local gold roughness',
    scope: 'This finial only; no photograph sampled and no emission'
  };
  materials.push(metal);
  const parts = [], bounds = new T.Box3();
  const fittedHeight=h=>h<1.57?h*.54:h<4.5?.85+(h-1.57)*1.075:4.00+(h-4.50)*(1.45/1.82);
  function place(g, y = base) {
    const disc=g.name.startsWith('closed-cast-annular-wheel-'),p=g.attributes.position;
    for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)*.72,fittedHeight(p.getY(i)*(disc?.35:1)+y-base),p.getZ(i)*.72);
    g.computeVertexNormals();g.computeBoundingBox();
    emit(g, metal, 0, base, 0);
    const box = g.boundingBox.clone().translate(new T.Vector3(0, base, 0));
    bounds.union(box);
    parts.push({name: g.name, geometry: g, y:base, originalPlacementY:y});
  }
  function sleeve(y, radius, h, name, bore = .106) {
    place(turned([
      [bore, -h / 2], [Math.max(bore + .004, radius * .88), -h / 2],
      [radius, -h * .24], [radius, h * .24],
      [Math.max(bore + .004, radius * .88), h / 2], [bore, h / 2]
    ], name), y);
  }

  place(turned([
    [0, -.035], [.245, -.035], [.27, .025], [.27, .09],
    [.23, .15], [.20, .25], [.17, .30], [.16, .42],
    [.13, .45], [.13, .61], [.108, .65], [.105, 1.10],
    [.15, 1.16], [.15, 1.20], [.09, 1.28], [0, 1.28]
  ], 'closed-roof-seat-and-tapered-sleeve'));
  place(turned([
    [0, .06], [.105, .06], [.105, 1.60], [.105, 4.50],
    [.050, 4.60], [.046, 5.40], [.030, 5.75],
    [.018, 6.20], [.009, 6.29], [0, 6.32]
  ], 'closed-continuous-tapered-spindle'));

  const wheels = [];
  for (let i = 0; i < 11; i++) {
    const radius = .43 - i * .012, y = base + 1.57 + i * .2925;
    // Annular cast disc: bored hub, sloping web, rounded outer lip, underside.
    // The central bore is occupied by the continuous shaft, not an empty ring.
    place(turned([
      [.106, -.100], [.135, -.100], [.168, -.076], [.185, -.028],
      [radius * .58, -.006], [radius * .82, .022],
      [radius * .96, .045], [radius + .008, .067],
      [radius + .012, .092], [radius * .99, .118],
      [radius * .92, .128], [radius * .70, .148],
      [.20, .176], [.145, .19], [.106, .19]
    ], 'closed-cast-annular-wheel-' + (i + 1)), y);
    wheels.push({localY:base+fittedHeight(y-base),outerRadius:(radius+.012)*.72,profileHeight:fittedHeight(y-base+.19*.35)-fittedHeight(y-base-.10*.35),airGapBetweenRims:true});
    sleeve(y + .215, .121, .070, 'closed-wheel-shaft-collar-' + (i + 1));
  }

  sleeve(base + 4.50, .185, .085, 'upper-support-lower-band', .058);
  sleeve(base + 5.12, .145, .070, 'upper-support-upper-band', .058);
  // Four simple closed support rods interpret only the visible upper cage.
  // No unseen carving, pendants or temple-specific ornamental scheme is added.
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2, r = .15;
    const start = new T.Vector3(Math.sin(a) * r, 4.53, Math.cos(a) * r);
    const end = new T.Vector3(Math.sin(a) * .115, 5.10, Math.cos(a) * .115);
    const d = end.clone().sub(start);
    const g = new T.CylinderGeometry(.018, .022, d.length(), 12, 1, false);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()));
    g.translate(...start.add(end).multiplyScalar(.5).toArray());
    g.name = 'closed-upper-support-rod-' + (k + 1);
    g.computeBoundingBox();
    place(g);
  }
  for (const [y, radius, h, name] of [
    [5.35, .078, .18, 'lower-turned-crown-bead'],
    [5.64, .064, .15, 'upper-turned-crown-bead']
  ]) place(turned([
    [0, -h / 2], [.034, -h / 2], [radius * .78, -h * .30],
    [radius, 0], [radius * .78, h * .30], [.027, h / 2], [0, h / 2]
  ], name), base + y);

  // Inferred compact roof uplight: a finite upward cone from behind the front
  // ridge, not a global wash or a luminous gold surface. All existing lamps stay.
  // The second candidate moves the inferred lamp along the same top roof to
  // give the wheel undersides an oblique real light path instead of near-axial
  // mutual shadowing. It also halves lamp intensity after the first real frame
  // showed broad near-white highlights. No fill or emissive compensation.
  const sourceLocal = [1.55, base - .20, 2.10], targetLocal = [0, base + 3.00, 0];
  const light = new T.SpotLight(0xffd29a, 90, 8.8, .41, .55, 2);
  light.name = 'scene09-finial-inferred-roof-uplight';
  light.position.fromArray(sourceLocal).applyMatrix4(transform);
  light.target.position.fromArray(targetLocal).applyMatrix4(transform);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.near = .15;
  light.shadow.camera.far = 8.8;
  light.shadow.bias = -.00003;
  light.shadow.normalBias = .006;
  light.userData = {inferredPlacement: true, scope: 'Only the upward finial cone; inverse-square attenuation'};
  scene.add(light, light.target);

  return {
    revision: PAGODA_FINIAL_REVISION,
    authoredGeometry: true, photoSampled: false, visualAccepted: false,
    mainWheelCount: wheels.length, wheelCountConfidence: 'Eleven closely spaced modeled rims fit the slender stack; concealed fittings remain inferred',
    wheels, closedComponents: parts.length,
    triangles: parts.reduce((n, p) => n + (p.geometry.index?.count ?? p.geometry.attributes.position.count) / 3, 0),
    localBounds: {min: bounds.min.toArray(), max: bounds.max.toArray()},
    metal: {linearBaseColor: metal.color.toArray(), metalness: metal.metalness, roughness: metal.roughness, emissiveIntensity: 0, source: GOLD_PBR_SOURCE},
    uplight: {inferred: true, sourceLocal, targetLocal, worldPosition: light.position.toArray(),
      worldTarget: light.target.position.toArray(), intensity: light.intensity, distance: light.distance,
      halfConeAngleRadians: light.angle, penumbra: light.penumbra, decay: light.decay, colorHex: light.color.getHex()},
    uncertainty: 'Roof landing and whole pagoda alignment retained; upper support rod count and concealed lamp are inferred'
  };
}
