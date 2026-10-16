import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { rm, mkdir } from 'node:fs/promises';
const exec = promisify(execFile);
await mkdir('output', {
  recursive: true
});
await rm('output/komorebi-source.zip', {
  force: true
});
await exec('zip', ['-qr', 'output/komorebi-source.zip', 'src', 'vendor', 'tools', 'music', 'index.html', 'film.html', 'package.json', 'README.md', 'CREDITS.txt', 'qa/browser-audit.json', 'qa/scene-manifest.json', 'qa/source-hashes.json', 'qa/video-verification.json', 'qa/player-audit.json', 'qa/iterations.md']);
console.log('Created output/komorebi-source.zip: source code, vendored library code, music and validation reports.');
