import {readdir,readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname);process.chdir(root);
const revision=process.env.REVISION||'v3';if(!/^v[0-9]+(?:-[a-z0-9]+)*$/.test(revision))throw Error('Invalid revision');
const dest=`qa/${revision}/frozen-src`,hashes={},contents={};
for(const name of (await readdir('src')).filter(x=>x.endsWith('.js')).sort()){
 const bytes=await readFile('src/'+name);hashes[name]=createHash('sha256').update(bytes).digest('hex');contents[name]=bytes;
}
const sourceHash=createHash('sha256').update(JSON.stringify(hashes)).digest('hex');
let previous;try{previous=JSON.parse(await readFile(`qa/${revision}/frozen-manifest.json`,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
if(previous&&previous.sourceHash!==sourceHash)throw Error(`Snapshot ${revision} is immutable. Choose a new REVISION instead of changing files used by an existing render.`);
if(!previous){
 await mkdir(dest,{recursive:true});for(const [name,bytes] of Object.entries(contents))await writeFile(dest+'/'+name,bytes);
 await writeFile(`render-${revision}.html`,(await readFile('index.html','utf8')).replace('/src/main.js','/'+dest+'/main.js'));
 await writeFile(`qa/${revision}/frozen-manifest.json`,JSON.stringify({revision,createdAt:new Date().toISOString(),status:'work-in-progress review snapshot; not a final release',sourceHash,hashes},null,2));
}
console.log(sourceHash);
