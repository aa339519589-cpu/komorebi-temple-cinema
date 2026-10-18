import {spawn} from 'node:child_process';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {homedir} from 'node:os';
import {readFile} from 'node:fs/promises';

// Each image independently enters the common queue; viewer jobs can interleave.
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(process.env.TEMPLE_ROOT || '/Users/mima1234/temple-cinema-live-sync');
const python = process.env.SHARP_PYTHON || join(homedir(), '.cache/sharp-study/venv/bin/python');
const requested = process.argv.slice(2).length ? process.argv.slice(2) : ['02','03','04','05','06','07','08','09','10'];
const inputs = ['0-照片-1.jpg','1-照片-2.jpg','2-照片-3.jpg','3-照片-4.jpg','4-照片-5.jpg','5-照片-6.jpg','6-照片-7.jpg','7-照片-8.jpg','8-照片-9.jpg','9-照片-10.jpg'];
for (const id of requested) {
  const index = Number(id) - 1;
  if (!/^\d\d$/.test(id) || index < 0 || index >= inputs.length) throw Error('Use IDs 01 through 10.');
  const output = join(root, 'output/sharp-study', id);
  const args = [join(here, 'run-queued.mjs'), python, join(here, 'infer.py'), '--image', join(root, 'references/hd', inputs[index]), '--output', output, '--id', id, '--device', 'mps'];
  const code = await new Promise((accept, reject) => {
    const child = spawn(process.execPath, args, {stdio:'inherit', env:process.env});
    const stop = () => child.kill('SIGTERM');
    process.once('SIGINT', stop); process.once('SIGTERM', stop);
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
      accept(code ?? (signal ? 1 : 0));
    });
  });
  if (code) throw Error(`SHARP ${id} failed (${code}); inspect inference output before continuing.`);
  const metadata = JSON.parse(await readFile(join(output, 'viewer.json'), 'utf8'));
  console.log(JSON.stringify({event:'sharp-image-ready', id, output, count:metadata.model.gaussianCount, plySha256:metadata.model.sha256}));
}
