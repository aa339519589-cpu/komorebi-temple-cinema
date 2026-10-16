import http from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};
export const server = http.createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/') path = '/index.html';
    const target = resolve(root, '.' + path);
    if (!target.startsWith(root + sep)) throw Error('Outside project');
    const info = await stat(target);
    if (!info.isFile()) throw Error('Not a file');
    const headers = {
      'Content-Type': types[extname(target)] || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    };
    const range = req.headers.range;
    let start = 0,
      end = info.size - 1,
      status = 200;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!m) {
        res.writeHead(416, {
          'Content-Range': `bytes */${info.size}`
        });
        return res.end();
      }
      start = m[1] ? Number(m[1]) : Math.max(0, info.size - Number(m[2]));
      end = m[2] && m[1] ? Math.min(info.size - 1, Number(m[2])) : info.size - 1;
      if (start > end || start >= info.size) {
        res.writeHead(416, {
          'Content-Range': `bytes */${info.size}`
        });
        return res.end();
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length'] = end - start + 1;
    res.writeHead(status, headers);
    if (req.method === 'HEAD') return res.end();
    createReadStream(target, {
      start,
      end
    }).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('File not found');
  }
});
const port = Number(process.env.PORT || 4317);
server.listen(port, '127.0.0.1', () => console.log('Temple cinema: http://127.0.0.1:' + port));
