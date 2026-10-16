import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const exec = promisify(execFile),
  reports = [];
for (const duration of [60, 70]) {
  const path = `output/komorebi-${duration}s.mp4`;
  const {
    stdout
  } = await exec('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', path], {
    maxBuffer: 4 * 1024 * 1024
  });
  const meta = JSON.parse(stdout),
    v = meta.streams.find(s => s.codec_type === 'video'),
    a = meta.streams.find(s => s.codec_type === 'audio');
  assert.equal(v.width, 1920);
  assert.equal(v.height, 1080);
  assert.equal(v.codec_name, 'h264');
  assert.equal(v.r_frame_rate, '30/1');
  assert.equal(+v.nb_read_frames, duration * 30);
  assert.equal(a.codec_name, 'aac');
  assert.equal(+a.sample_rate, 48000);
  assert.equal(a.channels, 2);
  assert(Math.abs(+meta.format.duration - duration) < .05);
  assert.equal(v.color_space, 'bt709');
  const {
    stdout: frameTimes
  } = await exec('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time', '-of', 'json', path], {
    maxBuffer: 4 * 1024 * 1024
  });
  const times = JSON.parse(frameTimes).frames;
  assert.equal(times.length, duration * 30);
  for (let i = 0; i < times.length; i++) assert(Math.abs(Number(times[i].best_effort_timestamp_time) - i / 30) < .00001, 'Irregular frame timestamp at ' + i);
  const decode = await exec('ffmpeg', ['-v', 'error', '-i', path, '-f', 'null', '-'], {
    maxBuffer: 4 * 1024 * 1024
  });
  assert.equal(decode.stderr, '');
  const {
    stderr: black
  } = await exec('ffmpeg', ['-hide_banner', '-i', path, '-vf', 'blackdetect=d=0.15:pix_th=0.015', '-an', '-f', 'null', '-'], {
    maxBuffer: 4 * 1024 * 1024
  });
  const blackFrames = black.split('\n').filter(s => s.includes('black_start:'));
  assert.equal(blackFrames.length, 0);
  reports.push({
    file: path,
    duration: +meta.format.duration,
    frames: +v.nb_read_frames,
    fps: 30,
    width: v.width,
    height: v.height,
    codec: v.codec_name,
    audio: {
      codec: a.codec_name,
      sampleRate: +a.sample_rate,
      channels: a.channels
    },
    colorSpace: v.color_space,
    frameTimestampsContinuous: true,
    decodeErrors: 0,
    blackSegments: 0,
    bytes: +meta.format.size,
    sha256: createHash('sha256').update(await readFile(path)).digest('hex'),
    passed: true
  });
}
const audit = JSON.parse(await readFile('qa/browser-audit.json', 'utf8'));
assert(audit.passed);
const report = {
  verifiedAt: new Date().toISOString(),
  nativeFrameSampling: 'Both versions separately sampled at 30 fps from the continuous 70 s timeline',
  sceneAuditPassed: audit.passed,
  videos: reports,
  passed: true
};
await writeFile('qa/video-verification.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
