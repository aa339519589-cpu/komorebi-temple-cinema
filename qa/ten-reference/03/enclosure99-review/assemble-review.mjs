import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out='qa/ten-reference/03/enclosure99-review',files=['/Users/mima1234/temple-cinema-live-sync/references/hd/2-照片-3.jpg','qa/ten-reference/03/iteration-leaf97/reference.png','qa/ten-reference/03/iteration-enclosure99/reference.png'];
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...files.flatMap(p=>['-i',p]),'-filter_complex','[0:v]setsar=1[a];[1:v]setsar=1[b];[2:v]setsar=1[c];[a][b][c]hstack=inputs=3[out]','-map','[out]','-frames:v','1',out+'/comparison-original97-99-full.png']);
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...files.flatMap(p=>['-i',p]),'-filter_complex','[0:v]crop=650:280:485:245,setsar=1[a];[1:v]crop=650:280:485:245,setsar=1[b];[2:v]crop=650:280:485:245,setsar=1[c];[a][b][c]hstack=inputs=3[out]','-map','[out]','-frames:v','1',out+'/comparison-original97-99-upper.png']);
await writeFile(out+'/comparison-receipt.json',JSON.stringify({panels:await Promise.all(files.map(async(p,i)=>({order:i+1,role:['original photograph','actual source-matched native97','actual native enclosure99'][i],file:p,sha256:await hash(p)}))),fullSize:[1254,1254],cpuCrop:{pixels:[485,245,650,280],scale:1,nativeSubfrustum:false},actualNewNativeDetail:{file:'../iteration-enclosure99/detail-native.png',crop:[650,310,350,1254],sha256:await hash('qa/ten-reference/03/iteration-enclosure99/detail-native.png'),genuine3DSubfrustum:true},photoAsSceneTexture:false,colorAdjustment:false,photographicAcceptance:false},null,2)+'\n');
console.log('Scene03 actual comparison assembled');
