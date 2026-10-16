// Preserve every transform, colour and triangle while giving the renderer
// useful spatial bounds. One garden-wide foliage batch defeats frustum culling
// for close sanctuary cameras and all six reflection-probe faces.
export function spatialBatches(buckets, cellSize = 12, minimumInstances = 512) {
  const output = [];
  for (const bucket of buckets) {
    if (bucket.transforms.length < minimumInstances) { output.push(bucket); continue; }
    const cells = new Map();
    for (let i = 0; i < bucket.transforms.length; i++) {
      const matrix = bucket.transforms[i], e = matrix.elements;
      const key = `${Math.floor(e[12] / cellSize)},${Math.floor(e[13] / cellSize)},${Math.floor(e[14] / cellSize)}`;
      let cell = cells.get(key);
      if (!cell) { cell = { ...bucket, transforms: [], colors: [] }; cells.set(key, cell); }
      cell.transforms.push(matrix); cell.colors.push(bucket.colors[i]);
    }
    output.push(...cells.values());
  }
  return output;
}
