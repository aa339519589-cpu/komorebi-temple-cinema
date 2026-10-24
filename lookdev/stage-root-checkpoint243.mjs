import {readFile,writeFile,readdir,stat,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {reconstructionSourceIdentity} from '../tools/reconstruction-source-identity.mjs';
const root=resolve(import.meta.dirname,'..'),paths=new Set();
for(const id of['04','06']){
 const source=await reconstructionSourceIdentity(root,id);
 if(id==='04'&&source.hash!=='c648a61193fdffe4ba10c6b914bd5685586f20df857b27f3493704c116708a94')throw Error('Canonical04 changed.');
 for(const name of Object.keys(source.files))paths.add(name);
}
async function include(directory){
 for(const entry of await readdir(resolve(root,directory),{withFileTypes:true})){
  const name=directory+'/'+entry.name;
  if(entry.isDirectory()){await include(name);continue;}
  if(!entry.isFile()||/\.(?:log|blend1?|zst|tmp)$/.test(name)||name.includes('__pycache__')||name.endsWith('/progress.json'))continue;
  if((await stat(resolve(root,name))).size>=95*1048576)throw Error('Unexpected large checkpoint file: '+name);
  paths.add(name);
 }
}
for(const directory of[
 'lookdev/scene06-living233','lookdev/scene06-window234','lookdev/scene04-canonical236','lookdev/film-sol61-232',
 'lookdev/scene04-rebuild212/replay-r25/src','lookdev/scene04-rebuild212/replay-r26-237-readonly/src',
 'lookdev/scene07-rebuild214/runtime-delta-r25',
 'lookdev/export-storage216/closed-film-report-compression233','lookdev/export-storage216/old-worktree-cow235',
 'qa/ten-reference/working-model-review-20261024-k','qa/ten-reference/working-model-review-20261024-l',
 'qa/ten-reference/06/iteration-scene06-living233-r01-personal-nc',
 'qa/ten-reference/06/iteration-scene06-living233-r01b-personal-nc',
 'qa/ten-reference/06/iteration-scene06-living233-r02-personal-nc',
 'qa/ten-reference/06/iteration-scene06-living233-r03-recover242-personal-nc',
 'qa/ten-reference/04/iteration-scene04-rebuild212-r25-facade-native-personal-CC-BY-NC-SA4',
 'qa/ten-reference/04/iteration-scene04-rebuild212-r25-low-personal-CC-BY-NC-SA4',
 'qa/ten-reference/04/iteration-scene04-rebuild212-r26-recover237-facade-native-personal-CC-BY-NC-SA4',
 'qa/ten-reference/04/iteration-scene04-rebuild212-r26-recover237-low-personal-CC-BY-NC-SA4',
 'qa/ten-reference/07/iteration-scene07-rebuild214-r25-recover238',
 'qa/ten-reference/07/iteration-scene07-rebuild214-r25-recover238-near-shore-low',
 'qa/ten-reference/08/iteration-scene08-rebuild213-r20-recover239',
 'qa/ten-reference/08/iteration-scene08-rebuild213-r20-recover239-low3q'
])await include(directory);
for(const name of[
 'film.html','tools/review-and-package-ten-film.py','reconstructions/scene-04/README.md',
 'lookdev/stage-root-checkpoint243.mjs','lookdev/integrate-scene04-r25-236.mjs',
 'lookdev/film232-board-k-selection.json','lookdev/film242-board-l-selection.json',
 'lookdev/export-storage216/closed-film-report-compression233.py','lookdev/export-storage216/old-worktree-cow235.py',
 'lookdev/scene04-rebuild212/r22-wood-chain-audit212.json','lookdev/scene04-rebuild212/r25-handoff212.json',
 'lookdev/scene04-rebuild212/r22-to-r25-source212.patch','lookdev/scene04-rebuild212/r22-to-r25-source212.json',
 'lookdev/scene04-rebuild212/r25-source212.json','lookdev/scene04-rebuild212/r25-actual-review212.json',
 'lookdev/scene04-rebuild212/r25-native-source-verification212.json',
 'lookdev/scene04-rebuild212/r25-to-r26-237-delta.json','lookdev/scene04-rebuild212/r25-to-r26-237.patch',
 'lookdev/scene04-rebuild212/r26-recover237-actual-review.json'
 ,'lookdev/scene07-rebuild214/r25-source-identity.json','lookdev/scene07-rebuild214/r25-review.json'
 ,'lookdev/scene08-rebuild213/handoff-r20.json','lookdev/scene08-rebuild213/r20-source-identity.json'
 ,'lookdev/scene08-rebuild213/r20-source-scripts.tgz','lookdev/scene08-rebuild213/runtime-delta-r17-r20.tgz'
 ,'lookdev/scene08-rebuild213/review-r20.html','lookdev/scene08-rebuild213/review213-r20.json','lookdev/scene08-rebuild213/boundary-r20.json'
]){await access(resolve(root,name));paths.add(name);}
const protectedPaths=['qa/depth-field-film-v02/assets.json','lookdev/scene06-statue-foundation-v2/README.md','reconstructions/scene-08/README.md','qa/ten-reference/07/iteration-scene07-rebuild214-r11/report.json'];
for(const name of protectedPaths)paths.delete(name);
const ordered=[...paths].sort();for(let start=0;start<ordered.length;start+=64)execFileSync('git',['add','--',...ordered.slice(start,start+64)],{cwd:root,stdio:'pipe'});
const staged=execFileSync('git',['diff','--cached','--name-only'],{cwd:root,encoding:'utf8'}).split('\n').filter(Boolean);
if(protectedPaths.some(name=>staged.includes(name)))throw Error('Protected path was staged.');
const sources={};for(const id of['04','06'])sources[id]=(await reconstructionSourceIdentity(root,id)).hash;
const proof={status:'root-working-checkpoint-staged',files:staged.length,sources,filmSourceCommit:'c355c5d49fae5bb3ff9e1918570d378783faea56',filmStatus:'eight-complete-clips-retained-missing09-and10-being-captured-after-reboot',slidingPaper234:'Actual authored geometry; first native image remains queued, not visually accepted.',photographicAccepted:false,protectedPathsRetained:protectedPaths};
await writeFile(resolve(root,'lookdev/root-checkpoint243.json'),JSON.stringify(proof,null,2)+'\n');execFileSync('git',['add','--','lookdev/root-checkpoint243.json'],{cwd:root});console.log(JSON.stringify(proof));
