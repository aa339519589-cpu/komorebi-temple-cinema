// Materialize a small, immutable runtime from public Git bytes without copying
// the large historical output trees. APFS clonefile is required for matching
// live files; mutable hardlinks and symlinks are deliberately prohibited.
import {constants} from 'node:fs';
import {access,chmod,copyFile,lstat,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname,relative,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';

const sourceRoot=resolve(process.env.FILM_LIVE_ROOT||process.cwd());
const requested=process.env.FILM_SOURCE_COMMIT||'f538de7f43141c8ce4a6d8eb3e48d09dea9fd5d6';
if(!/^[a-f0-9]{7,40}$/i.test(requested))throw Error('FILM_SOURCE_COMMIT requires a public Git hexadecimal revision.');
const git=(args,options={})=>execFileSync('git',args,{cwd:sourceRoot,maxBuffer:512*1024*1024,...options});
const commit=git(['rev-parse',requested+'^{commit}'],{encoding:'utf8'}).trim();
const target=resolve(process.env.FILM_SNAPSHOT_ROOT||resolve(sourceRoot,'..','temple-cinema-film-f-'+commit.slice(0,7)));
const proofDirectory=resolve(process.env.FILM_SNAPSHOT_PROOF||resolve(sourceRoot,'lookdev/film-f-20261022'));
if(target===sourceRoot||target.startsWith(sourceRoot+sep))throw Error('Snapshot must be a new, separate directory.');
try{await access(target);throw Error('Snapshot target already exists; preserve it and use a new destination.');}catch(error){if(error.code!=='ENOENT')throw error;}
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const objectFormat=git(['rev-parse','--show-object-format'],{encoding:'utf8'}).trim();
const objectHash=bytes=>createHash(objectFormat).update('blob '+bytes.length+'\0').update(bytes).digest('hex');
let cloneBackend='node-COPYFILE_FICLONE_FORCE';
async function cloneFile(live,destination){
 if(cloneBackend==='node-COPYFILE_FICLONE_FORCE'){
  try{await copyFile(live,destination,constants.COPYFILE_FICLONE_FORCE|constants.COPYFILE_EXCL);return;}
  catch(error){if(error.code!=='ENOSYS')throw error;await rm(destination,{force:true});cloneBackend='libSystem-clonefile(2)-via-python-ctypes';}
 }
 // Some installed Node runtimes return ENOSYS for FORCE on macOS. Call the
 // native API directly; unlike cp -c this cannot silently copy ordinary data.
 execFileSync('python3',['-c',
  "import ctypes,os,sys; lib=ctypes.CDLL(None,use_errno=True); fn=lib.clonefile; fn.argtypes=[ctypes.c_char_p,ctypes.c_char_p,ctypes.c_uint]; fn.restype=ctypes.c_int; result=fn(os.fsencode(sys.argv[1]),os.fsencode(sys.argv[2]),0); error=ctypes.get_errno(); assert result==0, (error,os.strerror(error))",
  live,destination]);
}
const tree=new Map(git(['ls-tree','-r','-z',commit]).toString().split('\0').filter(Boolean).map(line=>{
 const [metadata,name]=line.split('\t'),[mode,type,oid]=metadata.split(' ');
 if(type!=='blob')throw Error('Non-blob Git runtime entry: '+name);
 return[name,{mode,oid}];
}));
const isRuntime=name=>!name.includes('/')||/^(?:assets|vendor|tools|src|music|references)\//.test(name)||/^reconstructions\/(?:scene-(?:0[1-9]|10)\/|[^/]+$)/.test(name);
const files=new Set([...tree.keys()].filter(isRuntime));
for(let reference=1;reference<=10;reference++){
 const name=`reconstructions/scene-${String(reference).padStart(2,'0')}/asset-dependencies.json`;
 const entry=tree.get(name);if(!entry)throw Error('Missing public dependency manifest '+name);
 const dependencies=JSON.parse(git(['cat-file','blob',entry.oid]).toString());
 for(const name of dependencies.files||[]){
  if(typeof name!=='string'||name.startsWith('/')||name.split('/').includes('..')||!tree.has(name))throw Error('Dependency is not a public file: '+name);
  files.add(name);
 }
}
await mkdir(proofDirectory,{recursive:true});
const proofFile=resolve(proofDirectory,'snapshot-proof.json');
try{await access(proofFile);throw Error('Snapshot proof already exists; preserve it and select a new FILM_SNAPSHOT_PROOF directory.');}catch(error){if(error.code!=='ENOENT')throw error;}
const proof={status:'materializing',startedAt:new Date().toISOString(),sourceRoot,target,commit,objectFormat,
 method:'APFS COPYFILE_FICLONE_FORCE or direct clonefile(2) for identical live Git blobs; git cat-file fallback only for changed/missing files; no hardlinks or symlinks',
 scope:'Canonical scene namespaces in full, root runtime files, source, tools, assets, vendor, references, music and every declared dependency. Historical QA/output/lookdev excluded except explicit dependencies.',
 visualAccepted:false,filmStatus:'in-progress-not-photographically-accepted',files:{},sourceIdentities:[],counts:{cloned:0,gitBlobFallback:0,totalBytes:0,fallbackBytes:0}};
const save=()=>writeFile(proofFile,JSON.stringify(proof,null,2)+'\n');
await save();
git(['worktree','add','--detach','--no-checkout',target,commit]);
execFileSync('git',['read-tree',commit],{cwd:target});
try{
 for(const name of [...files].sort()){
  const entry=tree.get(name),live=resolve(sourceRoot,name),destination=resolve(target,name);
  if(entry.mode==='120000')throw Error('Runtime symlinks are prohibited: '+name);
  await mkdir(dirname(destination),{recursive:true});
  let liveStat,liveMatches=false;
  try{liveStat=await lstat(live);if(liveStat.isFile()&&!liveStat.isSymbolicLink())liveMatches=objectHash(await readFile(live))===entry.oid;}catch(error){if(error.code!=='ENOENT')throw error;}
  let method='git-blob-fallback';
  if(liveMatches){
   // FORCE fails on filesystems that cannot provide an actual independent CoW
   // clone; there is intentionally no ordinary-copy fallback here.
   await cloneFile(live,destination);
   if(objectHash(await readFile(destination))===entry.oid)method='apfs-clone';
   else await rm(destination); // A concurrent live edit occurred before cloning.
  }
  if(method==='git-blob-fallback')await writeFile(destination,git(['cat-file','blob',entry.oid]),{flag:'wx'});
  const bytes=await readFile(destination),targetStat=await lstat(destination);
  if(!targetStat.isFile()||targetStat.isSymbolicLink()||objectHash(bytes)!==entry.oid)throw Error('Materialized public Git bytes differ: '+name);
  if(liveStat&&targetStat.dev===liveStat.dev&&targetStat.ino===liveStat.ino)throw Error('Mutable hardlink detected: '+name);
  await chmod(destination,entry.mode==='100755'?0o555:0o444);
  proof.files[name]={gitBlob:entry.oid,sha256:digest(bytes),bytes:bytes.length,method,...(method==='apfs-clone'?{cloneBackend}:{}),device:targetStat.dev,inode:targetStat.ino,
   liveDevice:liveStat?.dev??null,liveInode:liveStat?.ino??null,independentInode:!liveStat||targetStat.dev!==liveStat.dev||targetStat.ino!==liveStat.ino};
  proof.counts[method==='apfs-clone'?'cloned':'gitBlobFallback']++;proof.counts.totalBytes+=bytes.length;
  if(method!=='apfs-clone')proof.counts.fallbackBytes+=bytes.length;
 }
 const actual=[];
 async function walk(directory){for(const entry of await readdir(directory,{withFileTypes:true})){
  if(directory===target&&entry.name==='.git')continue;
  const file=resolve(directory,entry.name);if(entry.isSymbolicLink())throw Error('Snapshot contains a symlink: '+file);
  if(entry.isDirectory())await walk(file);else actual.push(relative(target,file));
 }}
 await walk(target);
 if(JSON.stringify(actual.sort())!==JSON.stringify([...files].sort()))throw Error('Materialized runtime file-set mismatch.');
 const {reconstructionSourceIdentity}=await import(pathToFileURL(resolve(target,'tools/reconstruction-source-identity.mjs')).href);
 for(let reference=1;reference<=10;reference++){
  const id=String(reference).padStart(2,'0'),prefix=`reconstructions/scene-${id}/`;
  const names=[...tree.keys()].filter(name=>name.startsWith(prefix)&&/\.(?:m?js|html|json|glb|gltf|bin|png|jpe?g|webp)$/.test(name));
  const dependencies=JSON.parse(await readFile(resolve(target,prefix+'asset-dependencies.json'),'utf8'));
  const expectedFiles=[...new Set([...names,...dependencies.files])].sort(),aggregate=createHash('sha256'),hashes={};
  for(const name of expectedFiles){const bytes=await readFile(resolve(target,name));if(objectHash(bytes)!==tree.get(name).oid)throw Error('Source no longer equals Git: '+name);hashes[name]=digest(bytes);aggregate.update(name+'\0');aggregate.update(bytes);aggregate.update('\0');}
  const expected={hash:aggregate.digest('hex'),files:hashes},actual=await reconstructionSourceIdentity(target,id);
  if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Public source identity/file set differs in scene '+id);
  proof.sourceIdentities.push({reference,commit,expectedPublicGit:expected,actualSnapshot:actual,match:true});
 }
 // Freeze source directories while leaving the snapshot root/QA writable for
 // new, separately identified render receipts and output products.
 async function freeze(directory){for(const entry of await readdir(directory,{withFileTypes:true}))if(entry.isDirectory())await freeze(resolve(directory,entry.name));await chmod(directory,0o555);}
 for(const name of ['assets','vendor','tools','src','music','references'])await freeze(resolve(target,name));
 for(let reference=1;reference<=10;reference++)await freeze(resolve(target,`reconstructions/scene-${String(reference).padStart(2,'0')}`));
 proof.status='snapshot-materialized-source-verified';proof.completedAt=new Date().toISOString();
 proof.detachedHead=execFileSync('git',['rev-parse','HEAD'],{cwd:target,encoding:'utf8'}).trim();
 proof.indexTree=execFileSync('git',['write-tree'],{cwd:target,encoding:'utf8'}).trim();
 proof.expectedIndexTree=git(['rev-parse',commit+'^{tree}'],{encoding:'utf8'}).trim();
 if(proof.detachedHead!==commit||proof.indexTree!==proof.expectedIndexTree)throw Error('Detached snapshot HEAD/index mismatch.');
 await save();console.log(JSON.stringify({status:proof.status,target,commit,proofFile,counts:proof.counts,sourceHashes:proof.sourceIdentities.map(row=>({reference:row.reference,hash:row.actualSnapshot.hash}))}));
}catch(error){proof.status='failed-preserved';proof.error=String(error.stack||error);await save();throw error;}
