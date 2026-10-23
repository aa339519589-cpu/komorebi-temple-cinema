import {readFile,readdir} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';

export async function reconstructionSourceIdentity(worktree,id){
 const root=resolve(worktree),scene=resolve(root,'reconstructions/scene-'+id),files=[];
 async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,e.name);if(e.isDirectory())await walk(p);else if(/\.(?:m?js|html|json|glb|gltf|bin|png|jpe?g|webp)$/.test(e.name))files.push(p);}}
 await walk(scene);
 let dependencies;
 try{dependencies=JSON.parse(await readFile(resolve(scene,'asset-dependencies.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 for(const name of dependencies?.files??[]){
  if(typeof name!=='string')throw Error('Invalid asset dependency');
  const path=resolve(root,name);if(!path.startsWith(root+sep))throw Error('Asset dependency escapes worktree');
  files.push(path);
 }
 files.sort();const h=createHash('sha256'),hashes={};
 for(const file of new Set(files)){const name=relative(root,file),bytes=await readFile(file);hashes[name]=createHash('sha256').update(bytes).digest('hex');h.update(name+'\0');h.update(bytes);h.update('\0');}
 return {hash:h.digest('hex'),files:hashes};
}
