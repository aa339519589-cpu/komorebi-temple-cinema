import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
if(sha(await readFile('references/hd/0-照片-1.jpg'))!=='988668375f41c19386115b7514ccead940e2f89a6bf5f6b8c71fa6c6df02835d')throw Error('Canonical left-lantern reference has not been restored');
function swap(source,a,b,label){
 if(source.includes(a.old)&&source.includes(b.old)){
  if(source.split(a.old).length!==2||source.split(b.old).length!==2)throw Error('Ambiguous '+label);
  return source.replace(a.old,a.next).replace(b.old,b.next);
 }
 if(source.includes(a.next)&&source.includes(b.next))return source;
 throw Error('Concurrent '+label+' changed: review instead of guessing');
}
let page=await readFile('compare-live.html','utf8');
page=swap(page,
 {old:"{source:2,path:'/references/hd/1-照片-2.jpg',name:'池塘与塔殿'}",next:"{source:1,path:'/references/hd/0-照片-1.jpg',name:'左侧吊灯与池塘塔殿'}"},
 {old:"{source:1,path:'/references/hd/0-照片-1.jpg',name:'落日廊道塔殿'}",next:"{source:2,path:'/references/hd/1-照片-2.jpg',name:'右侧廊道与落日塔殿'}"},'live reference rows');
await writeFile('compare-live.html',page);
let runner=await readFile('tools/render-current.mjs','utf8');
const prefix=runner.indexOf('const references'),end=runner.indexOf('];',prefix);
// The two objects need positions, not just global text substitution: use a
// temporary marker so the first replacement cannot be swapped back again.
const oldA="{canonical:2,file:'references/hd/1-照片-2.jpg',scene:'shared'}",oldB="{canonical:1,file:'references/hd/0-照片-1.jpg',scene:'shared'}";
const ia=runner.indexOf(oldA),ib=runner.indexOf(oldB);
if(ia<0||ib<0||runner.split(oldA).length!==2||runner.split(oldB).length!==2)throw Error('Runner reference entries changed');
if(ia<ib)runner=runner.replace(oldA,'__KOMOREBI_REFERENCE_ORDER_TEMP__').replace(oldB,oldA).replace('__KOMOREBI_REFERENCE_ORDER_TEMP__',oldB);
await writeFile('tools/render-current.mjs',runner);
const fileNames=['0-照片-1.jpg','1-照片-2.jpg','2-照片-3.jpg','3-照片-4.jpg','5-照片-6.jpg','4-照片-5.jpg','6-照片-7.jpg','7-照片-8.jpg','8-照片-9.jpg','9-照片-10.jpg'];
const order=[10,9,7,8,4,6,5,1,3,2],records=[];
for(let i=0;i<10;i++){const path='references/hd/'+fileNames[i],bytes=await readFile(path);records.push({canonicalReference:i+1,userDisplayOrder:order.indexOf(i+1)+1,path,bytes:bytes.length,sha256:sha(bytes)});}
if(new Set(records.map(r=>r.sha256)).size!==10)throw Error('Duplicate reference file bytes detected');
await writeFile('references/hd/correspondence.json',JSON.stringify({userDisplayOrderToCanonical:order,canonical1:'Left hanging lantern and left near column',canonical2:'Right veranda and right near column',scope:'Reference-to-scene identity mapping, not a reconstruction similarity score',records},null,2)+'\n');
const docs='docs/LIVE_CONTINUATION.md';let text=await readFile(docs,'utf8');text=text.replaceAll('10,9,7,8,4,6,5,2,3,1','10,9,7,8,4,6,5,1,3,2');await writeFile(docs,text);
console.log(JSON.stringify({updated:['compare-live.html','tools/render-current.mjs','references/hd/correspondence.json',docs],userDisplayOrderToCanonical:order}));
