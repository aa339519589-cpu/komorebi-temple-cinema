import * as T from 'three';

/** Retained original CC0 cloth surfaces; no caps or automatic bbox centering. */
export async function loadTangClothDonors169(material, {baseURL = new URL('./r03/', import.meta.url)} = {}) {
  const fetchJSON = async file => {
    const response = await fetch(new URL(file, baseURL));
    if (!response.ok) throw new Error(`CC0 Tang donor169 ${file}: ${response.status}`);
    return response.json();
  };
  const [manifest, anchors] = await Promise.all([
    fetchJSON('native-manifest.json'), fetchJSON('surface-anchors.json'),
  ]);
  if (manifest.revision !== 'cc0-tang-cloth169-r03') throw new Error('Unexpected Tang donor169 revision');
  const group = new T.Group();
  group.name = 'cc0-tang-cloth169-source-preserved-components';
  group.userData = {sourceSha256: manifest.sourceSha256, sourceAttribution: manifest.sourceAttribution, visualAccepted: false};
  const components = {};
  const parts = await Promise.all(manifest.variants.central.map(async part => {
    const response = await fetch(new URL(part.file, baseURL));
    if (!response.ok) throw new Error(`CC0 Tang donor169 mesh: ${response.status}`);
    const buffer = await response.arrayBuffer(), header = new DataView(buffer);
    const n = header.getUint32(4, true), ni = header.getUint32(8, true);
    if (header.getUint32(0, true) !== 0x37304353 || n !== part.vertices || ni !== part.triangles * 3 || buffer.byteLength !== 20 + n * 32 + ni * 4) {
      throw new Error('CC0 Tang donor169 SC07 identity/length mismatch');
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(buffer, 20, n * 3), 3));
    geometry.setAttribute('normal', new T.BufferAttribute(new Float32Array(buffer, 20 + n * 12, n * 3), 3));
    geometry.setAttribute('uv', new T.BufferAttribute(new Float32Array(buffer, 20 + n * 24, n * 2), 2));
    geometry.setIndex(new T.BufferAttribute(new Uint32Array(buffer, 20 + n * 32, ni), 1));
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const name = part.file.split('-source-surface.')[0];
    const mesh = new T.Mesh(geometry, material || new T.MeshStandardMaterial({color: '#a29a89', roughness: .7}));
    mesh.name = name; mesh.userData = {sourceLicense: 'CC0-1.0', sourceAuthor: 'Daniel Pett', sourceSha256: manifest.sourceSha256, donorFile: part.file, visualAccepted: false};
    return {name, mesh};
  }));
  for (const {name, mesh} of parts) {group.add(mesh); components[name] = mesh;}
  const [kneeLoops, torsoLoops] = await Promise.all([
    fetchJSON('crossed-knees-hips-mount-loops.json'), fetchJSON('torso-cloak-core-mount-loops.json'),
  ]);
  return {group, components, anchors, kneeLoops, torsoLoops, manifest};
}
