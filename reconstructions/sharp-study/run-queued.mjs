import {spawn} from 'node:child_process';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {existsSync} from 'node:fs';

// Use the same hardware ownership as all native/Cycles reconstruction jobs.
const root = resolve(process.env.TEMPLE_ROOT || '/Users/mima1234/temple-cinema-live-sync');
const {acquireGpuRenderSlot} = await import(pathToFileURL(join(root, 'tools/gpu-render-slot.mjs')));
const [executable, ...args] = process.argv.slice(2);
if (!executable || !existsSync(executable)) throw Error('Pass the inference Python executable and arguments.');
const release = await acquireGpuRenderSlot('sharp-research-inference');
let child;
const stop = () => child?.kill('SIGTERM');
try {
  child = spawn(executable, args, {stdio: 'inherit', env: {...process.env, PYTORCH_ENABLE_MPS_FALLBACK: '1', PYTHONUNBUFFERED: '1'}});
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  const code = await new Promise((accept, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => accept(code ?? (signal ? 1 : 0)));
  });
  process.exitCode = code;
} finally {
  process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
  release();
}
