import {readFile,writeFile,mkdir,readdir,stat,realpath,symlink,copyFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
const lane=import.meta.dirname,repo=resolve(lane,'../..'),out=resolve(lane,'candidate-r01'),prefix='reconstructions/scene-06';
const source=await reconstructionSourceIdentity(repo,'06');
if(source.hash!=='c85f7579e790a6103e8ad0372dff2c7f74d12467fb878cecaf04cfba96438f7e')throw Error('Current canonical daylight284 differs');
try{await access(out);throw Error('Preserve existing candidate');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(resolve(out,'reconstructions'),{recursive:true});execFileSync('/bin/cp',['-cR',resolve(repo,prefix),resolve(out,prefix)]);
await mkdir(resolve(out,'tools'),{recursive:true});await copyFile(resolve(repo,'tools/server.mjs'),resolve(out,'tools/server.mjs'));
for(const n of['assets','vendor'])await symlink(await realpath(resolve(repo,n)),resolve(out,n));
for(const n of await readdir(resolve(repo,'reconstructions'))){const p=resolve(repo,'reconstructions',n);if((await stat(p)).isFile())await symlink(await realpath(p),resolve(out,'reconstructions',n));}
const deps=JSON.parse(await readFile(resolve(out,prefix,'asset-dependencies.json')));for(const name of deps.files){try{await access(resolve(out,name));}catch(e){if(e.code!=='ENOENT')throw e;await mkdir(dirname(resolve(out,name)),{recursive:true});await symlink(await realpath(resolve(repo,name)),resolve(out,name));}}
if((await reconstructionSourceIdentity(out,'06')).hash!==source.hash)throw Error('Independent APFS clone differs');
await writeFile(resolve(lane,'parent309.json'),JSON.stringify({baseSource:source,candidateRoot:out,cloneMode:'APFS COW minimal runtime, 12a4 includes Root integrated283 pendants and284 daylight; no old QA/export/Blend copied',photographicAccepted:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,base:source.hash}));
