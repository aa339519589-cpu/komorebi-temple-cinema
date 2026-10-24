import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,relative} from 'node:path';
import {reconstructionSourceIdentity} from '../tools/reconstruction-source-identity.mjs';

const root=resolve(import.meta.dirname,'..'),paths=new Set();
const expected={
 '01':'3edd3edb412597b8dc4f6394e9db04c3984cc371dacd90b72ab7e529bc48fbf6',
 '02':'dc68c596e79e406e4a47015f901aee2f07c5a43ac66fd187c0ad559ba3b4c8a6',
 '03':'5d8c529c74df128c1859e6b7bf325a4c6715d828898d9d910963b9183e7862d3',
 '04':'da07ab60fa0208997ac9e94522a3b51dccbef640853d4549b9cf412cd374c86f',
 '05':'8af62a28a99dba8f9513999e0424925d7775673611b42e924a63f0d2ea2135e5',
 '06':'bc7476cb7a26058d916744ed6b56a3e04349160a6668ddc090eae462aeb495e9',
 '07':'0b1009b11684d16eeb731adcfef3e94323037440db5ca80e206c56c8a18d104e',
 '08':'3438b5bc01ee0df1fc5ce31c7431bee601425592820dc43702af82acfaf693f3',
 '09':'4757862cf5799582aefaef4e6fe8d88b20945ce0cfcabc7bff38a5b3c8f2590f',
 '10':'08f35b88f2ca8176d21c1edbb54834f08791b5481964bcfa2f2064c74c864d5c'
};
const identities={};
for(const[id,hash]of Object.entries(expected)){
 const actual=await reconstructionSourceIdentity(root,id);if(actual.hash!==hash)throw Error('Selected source changed: '+id+' '+actual.hash);
 identities[id]=actual;
 if(['01','04','06','07','08'].includes(id))for(const name of Object.keys(actual.files))paths.add(name);
 const dep=JSON.parse(await readFile(resolve(root,`reconstructions/scene-${id}/asset-dependencies.json`),'utf8'));
 for(const name of dep.files||[])paths.add(name);
}
async function include(directory){
 for(const entry of await readdir(resolve(root,directory),{withFileTypes:true})){
  const name=directory+'/'+entry.name;
  if(entry.isDirectory()){await include(name);continue;}
  if(!entry.isFile()||/\.(?:log|blend1?|zst)$/.test(name)||name.includes('__pycache__'))continue;
  if((await stat(resolve(root,name))).size>=95*1048576)throw Error('Unexpected large publication file: '+name);
  paths.add(name);
 }
}
for(const directory of[
 'lookdev/scene06-ceiling228','lookdev/scene04-canonical230',
 'lookdev/scene07-rebuild214','lookdev/scene08-rebuild213',
 'lookdev/export-storage216/native-report-compression231',
 'qa/ten-reference/04/iteration-scene04-rebuild212-r22-facade-native-personal-CC-BY-NC-SA4',
 'qa/ten-reference/04/iteration-scene04-rebuild212-r22-low-personal-CC-BY-NC-SA4',
 'qa/ten-reference/06/iteration-scene06-ceiling228-r01-personal-nc',
 'qa/ten-reference/06/iteration-scene06-ceiling228-r02-personal-nc',
 'qa/ten-reference/06/iteration-scene06-ceiling228-r03-personal-nc',
 'qa/ten-reference/06/iteration-scene06-ceiling228-r04-personal-nc',
 'qa/ten-reference/06/iteration-scene06-ceiling228-motion-r01-personal-nc',
 'qa/ten-reference/07/iteration-scene07-rebuild214-r22',
 'qa/ten-reference/07/iteration-scene07-rebuild214-r22-near-shore-low',
 'qa/ten-reference/08/iteration-scene08-rebuild213-r17',
 'qa/ten-reference/08/iteration-scene08-rebuild213-r17-low3q',
])await include(directory);
for(const name of execFileSync('git',['ls-files','--others','--exclude-standard','--','lookdev/scene01-rebuild219'],{cwd:root,encoding:'utf8'}).split('\n').filter(Boolean)){
 if(!/\.(?:log|blend1?)$/.test(name))paths.add(name);
}
for(const iteration of ['r12-full','r12-low','r13-full','r13-low','r14-full','r14-low','r15-full','r15-low']){
 const dir='qa/ten-reference/01/iteration-scene01-rebuild219-'+iteration;
 try{await include(dir);}catch(e){if(e.code!=='ENOENT')throw e;}
}
for(const name of[
 'lookdev/integrate-scene04-r22-230.mjs','lookdev/stage-ten-source-film232.mjs',
 'lookdev/export-storage216/compress-closed-native-reports-losslessly.py',
 'lookdev/scene04-rebuild212/root-r22-vs-canonical-delta230.json',
 'lookdev/scene04-rebuild212/r22-exact-delta212.json',
 'lookdev/scene04-rebuild212/r22-actual-review212.json',
 'lookdev/scene04-rebuild212/r22-native-source-verification212.json',
 'lookdev/scene04-rebuild212/r08-to-r22-source212.json',
 'reconstructions/scene-01/README.md','reconstructions/scene-04/README.md',
 'reconstructions/scene-06/ATTRIBUTION-AND-ASSET-LICENSES.md',
 'reconstructions/scene-04/assets/sculpture212-r11/prompt.txt',
 'tools/render-ten-scene-film.mjs'
])paths.add(name);
const protectedPaths=['qa/depth-field-film-v02/assets.json','lookdev/scene06-statue-foundation-v2/README.md','reconstructions/scene-08/README.md','qa/ten-reference/07/iteration-scene07-rebuild214-r11/report.json'];
for(const name of protectedPaths)paths.delete(name);
const ordered=[...paths].sort();for(let start=0;start<ordered.length;start+=64)execFileSync('git',['add','--',...ordered.slice(start,start+64)],{cwd:root,stdio:'pipe'});
const staged=execFileSync('git',['diff','--cached','--name-only'],{cwd:root,encoding:'utf8'}).split('\n');if(protectedPaths.some(name=>staged.includes(name)))throw Error('Protected user/legacy path unexpectedly staged.');
const selection={status:'ten-current-working-sources-ready-for-public-cow-film-snapshot',sources:Object.fromEntries(Object.entries(identities).map(([id,value])=>[id,value.hash])),photographicAccepted:false,fullNewFilmRendered:false,scope:'All ten genuinely modeled scene namespaces. New full film remains pending; the complete new scene06 seven-second shot is retained separately.',preservedUserPaths:protectedPaths};
await writeFile(resolve(root,'lookdev/ten-source-film232-selection.json'),JSON.stringify(selection,null,2)+'\n');execFileSync('git',['add','--','lookdev/ten-source-film232-selection.json'],{cwd:root});console.log(JSON.stringify({status:selection.status,staged:staged.filter(Boolean).length,sources:selection.sources}));
