import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { copyFile, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const exec = promisify(execFile),
  run = args => exec('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], {
    maxBuffer: 1024 * 1024 * 4
  });
for (const duration of [70, 60]) {
  const raw = `output/komorebi-picture-${duration}s.mp4`,
    original = `qa/original-picture-${duration}s.mp4`;
  try {
    await access(original);
  } catch {
    await copyFile(raw, original);
  }
  const B = `qa/retained-${duration}-B.mp4`,
    D = `qa/retained-${duration}-D.mp4`;
  await run(['-ss', String(duration / 10), '-i', original, '-frames:v', String(duration * 15), '-an', '-c:v', 'copy', B]);
  await run(['-ss', String(duration * .7), '-i', original, '-frames:v', String(duration * 6), '-an', '-c:v', 'copy', D]);
  const files = [`output/patch-${duration}s-shot-01.mp4`, B, `output/patch-${duration}s-shot-07.mp4`, D, `output/patch-${duration}s-shot-10.mp4`];
  const list = `qa/concat-${duration}.txt`;
  await writeFile(list, files.map(f => `file '${resolve(f)}'`).join('\n') + '\n');
  const result = `qa/corrected-picture-${duration}s.mp4`;
  await run(['-f', 'concat', '-safe', '0', '-i', list, '-an', '-c:v', 'copy', '-movflags', '+faststart', result]);
  const {
    stdout
  } = await exec('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v', '-show_entries', 'stream=nb_read_frames:format=duration', '-of', 'json', result]);
  const m = JSON.parse(stdout);
  assert.equal(+m.streams[0].nb_read_frames, duration * 30);
  assert(Math.abs(+m.format.duration - duration) < .001);
  await run(['-i', result, '-f', 'null', '-']);
  await copyFile(result, raw);
  console.log(`Applied revised shots 1, 7 and 10 to ${duration}s version with stream copying; ${duration * 30} frames verified.`);
}
