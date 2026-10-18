import {spawn} from 'node:child_process';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {homedir} from 'node:os';
import {readFile} from 'node:fs/promises';
const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(process.env.TEMPLE_ROOT||'/Users/mima1234/temple-cinema-live-sync');
const python=process.env.DEPTH_PYTHON||join(homedir(),'.cache/depth-field/venv/bin/python');
const ids=process.argv.slice(2).length?process.argv.slice(2):['02','03','04','05','06','07','08','09','10'];
const images=['0-照片-1.jpg','1-照片-2.jpg','2-照片-3.jpg','3-照片-4.jpg','4-照片-5.jpg','5-照片-6.jpg','6-照片-7.jpg','7-照片-8.jpg','8-照片-9.jpg','9-照片-10.jpg'];
for(const id of ids){
 const i=Number(id)-1;if(!/^\d\d$/.test(id)||i<0||i>=10)throw Error('Use IDs01–10.');
 const out=join(root,'output/depth-field',id);
 const args=[join(here,'run-queued.mjs'),python,join(here,'infer.py'),'--image',join(root,'references/hd',images[i]),'--output',out,'--id',id];
 const code=await new Promise((yes,no)=>{
  const child=spawn(process.execPath,args,{stdio:'inherit',env:process.env});
  const stop=()=>child.kill('SIGTERM');process.once('SIGINT',stop);process.once('SIGTERM',stop);
  child.once('error',no);child.once('exit',(c,s)=>{process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);yes(c??(s?1:0));});
 });
 if(code)throw Error(`Depth-field ${id} failed (${code}).`);
 const meta=JSON.parse(await readFile(join(out,'viewer.json'),'utf8'));
 console.log(JSON.stringify({event:'depth-field-ready',id,output:out,gaussianCount:meta.model.gaussianCount,plySha256:meta.model.sha256}));
}
