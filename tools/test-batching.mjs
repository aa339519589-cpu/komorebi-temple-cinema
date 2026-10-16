import assert from 'node:assert/strict';
import { spatialBatches } from '../src/batching.js';
const transforms = Array.from({ length: 2000 }, (_, i) => {
  const elements = new Float32Array(16); elements[0] = elements[5] = elements[10] = elements[15] = 1;
  elements[12] = i % 100 - 50; elements[13] = i % 17; elements[14] = Math.floor(i / 100) - 10;
  return { elements, uniqueId: i };
});
const colors = transforms.map((_, i) => ({ uniqueId: i }));
const original = { transforms, colors, name: 'foliageGreen', material: {}, geometry: {} };
const cells = spatialBatches([original]);
assert(cells.length > 1);
assert.equal(cells.reduce((n, c) => n + c.transforms.length, 0), 2000);
const seen = new Set();
for (const cell of cells) {
  assert.equal(cell.material, original.material); assert.equal(cell.geometry, original.geometry);
  for (let i = 0; i < cell.transforms.length; i++) {
    const transform = cell.transforms[i], id = transform.uniqueId;
    assert.equal(transform, transforms[id]); assert.equal(cell.colors[i], colors[id]);
    assert(!seen.has(id)); seen.add(id);
  }
}
assert.equal(seen.size, 2000); assert.equal(original.transforms.length, 2000);
const small = { ...original, transforms: transforms.slice(0, 20), colors: colors.slice(0, 20) };
assert.equal(spatialBatches([small])[0], small);
console.log(JSON.stringify({ passed: true, originalInstances: 2000, preservedInstances: seen.size, spatialCells: cells.length, removedGeometry: 0 }));
