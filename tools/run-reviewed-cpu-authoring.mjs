// Exact, root-reviewed CPU mesh authoring only. All graphics use the GPU FIFO.
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,open,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
const root=process.cwd(),recipe=process.argv[2];
const reviewed={
 'scene06-sculpture165-r01':{
  script:'reconstructions/scene-06/modeling/sculpture165/build.py',
  files:{
   'reconstructions/scene-06/modeling/sculpture165/build.py':'4b323f51b16397b7b1ddf79d2eff4654e5b54a743550b5b6cdf31e1aef62be32',
   'reconstructions/scene-06/modeling/sculpture165/geometry.py':'78a5cb8690534ead007accf6478d316440c6aa0ae6abced23a473827b2517db3'
  },
  receipt:'lookdev/scene06-sculpture165/r01-cpu-authoring-receipt.json',
  scope:'Root inspected complete scripts. Reachable Blender operators: empty startup, select/join, CPU voxel remesh/smooth/subdivision, CC BY GLB import. Only authored SC07 buffers and JSON/text are written. No render, scene export, viewport, UV bake or GPU compute.'
 }
};
if(!Object.hasOwn(reviewed,recipe))throw Error('An exact root-reviewed CPU authoring recipe is required.');
const spec=reviewed[recipe],digest=b=>createHash('sha256').update(b).digest('hex');
async function verify(){for(const [name,expected]of Object.entries(spec.files))if(digest(await readFile(resolve(root,name)))!==expected)throw Error('Reviewed CPU source changed: '+name);}
await verify();
const lock=resolve(tmpdir(),'komorebi-reviewed-cpu-authoring.lock');
try{const file=await open(lock,'wx');await file.writeFile(JSON.stringify({pid:process.pid,recipe,startedAt:new Date().toISOString()}));await file.close();}
catch(error){if(error.code!=='EEXIST')throw error;throw Error('A reviewed CPU author is already active; do not overlap mesh builds.');}
const receipt={recipe,startedAt:new Date().toISOString(),status:'cpu-authoring-active',files:spec.files,threads:4,scope:spec.scope,gpuFifoAcquired:false,visualAccepted:false};
const path=resolve(root,spec.receipt);await mkdir(dirname(path),{recursive:true});
let child;
try{
 child=spawn('/Applications/Blender.app/Contents/MacOS/Blender',['-b','--factory-startup','--disable-autoexec','-t','4','--python-exit-code','1','--python',resolve(root,spec.script)],{cwd:root,stdio:'inherit',env:{...process.env,S165_REV:'r01'}});
 const stop=()=>child?.kill('SIGTERM');process.once('SIGINT',stop);process.once('SIGTERM',stop);
 receipt.childPid=child.pid;await writeFile(path,JSON.stringify(receipt,null,2)+'\n');
 const code=await new Promise((yes,no)=>{child.on('error',no);child.on('exit',(code,signal)=>yes(code??(signal?1:0)));});
 process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);await verify();
 receipt.exitCode=code;receipt.status=code===0?'cpu-authored-mesh-written-awaiting-native-review':'cpu-authoring-failed';if(code)process.exitCode=code;
}catch(error){receipt.status='cpu-authoring-failed';receipt.error=String(error.stack||error);process.exitCode=1;}
finally{receipt.completedAt=new Date().toISOString();await writeFile(path,JSON.stringify(receipt,null,2)+'\n');await unlink(lock);}
