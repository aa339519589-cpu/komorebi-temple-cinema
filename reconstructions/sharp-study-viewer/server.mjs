import http from 'node:http';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const directory=dirname(fileURLToPath(import.meta.url)),root=resolve(directory,'../..');
const studies=resolve(process.env.SHARP_STUDY_ROOT??resolve(root,'output/sharp-study'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.map':'application/json','.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg','.ply':'application/octet-stream','.spz':'application/octet-stream'};
const server=http.createServer(async(req,res)=>{
  try {
    let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(path==='/')path='/reconstructions/sharp-study-viewer/index.html';
    const isModel=path.startsWith('/output/sharp-study/');
    const base=isModel?studies:root;
    const target=isModel?resolve(base,path.slice('/output/sharp-study/'.length)):resolve(base,'.'+path);
    if(!target.startsWith(base+sep))throw Error('Outside configured assets directory.');
    const info=await stat(target);if(!info.isFile())throw Error('Not a file.');
    let start=0,end=info.size-1,status=200;
    const headers={'Content-Type':types[extname(target)]??'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
    if(req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match)throw Error('Invalid range.');
      start=match[1]?Number(match[1]):Math.max(0,info.size-Number(match[2]));
      end=match[1]&&match[2]?Math.min(info.size-1,Number(match[2])):info.size-1;
      if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end();}
      status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length']=end-start+1;res.writeHead(status,headers);
    if(req.method==='HEAD')return res.end();
    createReadStream(target,{start,end}).pipe(res);
  } catch {res.writeHead(404,{'Content-Type':'text/plain'});res.end('Resource not found.');}
});
const port=Number(process.env.PORT??4521);
server.listen(port,'127.0.0.1',()=>console.log(`Sharp study: http://127.0.0.1:${port}/reconstructions/sharp-study-viewer/`));
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.close(()=>process.exit(0)));
