import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
const root=resolve(process.env.TEMPLE_ROOT||'/Users/mima1234/temple-cinema-live-sync');
const {acquireGpuRenderSlot}=await import(pathToFileURL(join(root,'tools/gpu-render-slot.mjs')));
const [python,...args]=process.argv.slice(2);
if(!python||!args.length)throw Error('Pass Python and the depth-field entry arguments.');
const release=await acquireGpuRenderSlot('depth-anything-v2-small');
let child;const stop=()=>child?.kill('SIGTERM');
try{
 child=spawn(python,args,{stdio:'inherit',env:{...process.env,PYTHONUNBUFFERED:'1',PYTORCH_ENABLE_MPS_FALLBACK:'1'}});
 process.once('SIGINT',stop);process.once('SIGTERM',stop);
 const code=await new Promise((yes,no)=>{child.once('error',no);child.once('exit',(c,s)=>yes(c??(s?1:0)));});
 process.exitCode=code;
}finally{process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);release();}
