import {readFile,readdir} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
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
 for(const file of new Set(files)){
  const name=relative(root,file),fileHash=createHash('sha256');h.update(name+'\0');
  // Keep exact byte ordering and delimiters without retaining whole mesh
  // buffers while a complete high-detail scene is about to be constructed.
  for await(const chunk of createReadStream(file,{highWaterMark:1024*1024})){fileHash.update(chunk);h.update(chunk);}
  hashes[name]=fileHash.digest('hex');h.update('\0');
 }
 return {hash:h.digest('hex'),files:hashes};
}
