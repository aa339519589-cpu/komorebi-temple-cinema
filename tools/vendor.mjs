import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
const upstream = resolve(dirname(createRequire(import.meta.url).resolve('three')), '..'),
  dest = resolve('vendor'),
  visited = new Set();
async function copy(rel) {
  if (visited.has(rel)) return;
  visited.add(rel);
  const file = resolve(upstream, rel),
    out = resolve(dest, rel),
    source = await readFile(file, 'utf8');
  await mkdir(dirname(out), {
    recursive: true
  });
  await writeFile(out, source);
  for (const m of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
    const spec = m[1];
    if (spec.startsWith('.')) await copy(relative(upstream, resolve(dirname(file), spec)));else if (spec === 'three') await copy('build/three.module.js');
  }
}
for (const src of ['src/world.js', 'src/main.js']) {
  const s = await readFile(src, 'utf8');
  for (const m of s.matchAll(/from\s*['"]three\/addons\/([^'"]+)['"]/g)) await copy('examples/jsm/' + m[1]);
}
await copy('build/three.module.js');
await copy('LICENSE');
console.log('Vendored ' + visited.size + ' JavaScript and license files.');
