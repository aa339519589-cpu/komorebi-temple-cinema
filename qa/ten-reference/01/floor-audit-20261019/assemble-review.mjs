import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {reconstructionSourceIdentity} from '../../../../tools/reconstruction-source-identity.mjs';

const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../../..');
const photograph=resolve(process.env.REFERENCE_ROOT??'/Users/mima1234/temple-cinema-live-sync','references/hd/0-照片-1.jpg');
const frames=[0,3.5,7].map(t=>resolve(root,'qa/ten-reference/01/iteration-cinema67/shot-'+String(t).replace('.','p')+'.png'));
const report=JSON.parse(await readFile(resolve(root,'qa/ten-reference/01/iteration-cinema67/report.json'),'utf8'));
const source=await reconstructionSourceIdentity(root,'01');
if(source.hash!==report.source.hash)throw Error('Existing native frames do not identify the current scene01 source.');
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
await mkdir(here,{recursive:true});
// Deliberately retain the original 1:1 pixels. This is a CPU comparison crop,
// not a new render, and is not labelled as a native subfrustum detail.
const crop={x:0,y:950,width:304,height:304};
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',photograph,'-i',frames[2],'-filter_complex',`[0:v]crop=${crop.width}:${crop.height}:${crop.x}:${crop.y},setsar=1[a];[1:v]crop=${crop.width}:${crop.height}:${crop.x}:${crop.y},setsar=1[b];[a][b]hstack=inputs=2[out]`,'-map','[out]','-frames:v','1',resolve(here,'floor-crop-original-left-native67-right.png')]);
let boardCount=0;for(let z=8;z<23;z+=.35)boardCount++;
const audit={
  status:'reviewed-no-scene-edit',scene:1,baseCommit:'cedb249ff37cc5a3a0f9380e4094c0ad79739fd1',sourceHash:source.hash,
  evidence:{photograph:{path:photograph,sha256:await sha(photograph)},nativeReport:'../iteration-cinema67/report.json',nativeSourceHash:report.source.hash,frames:await Promise.all(frames.map(async(p,i)=>({path:p,time:[0,3.5,7][i],sha256:await sha(p),size:[1254,1254],viewed:true}))),comparison:{file:'floor-crop-original-left-native67-right.png',panels:['original photograph','actual native shot7 from current source'],crop,scale:1,newNativeSubfrustum:false}},
  sourceFindings:{
    boards:{file:'reconstructions/scene-01/src/architecture.js',role:'foreground-veranda-real-deck',count:boardCount,geometry:'Separate closed BoxGeometry instances, long axis X',pitchZMetres:.35,widthZMetres:.337,openJointMetres:.013,thicknessMetres:.14,topYMetres:1.8,bottomYMetres:1.66,roundedArris:false,intermediateEndJoints:false},
    reflection:{file:'reconstructions/scene-01/src/scene.js',count:1,role:'real-reflected-garden-pond-ripple-surface',planeYMetres:.13,floorSpanningMirror:false},
    timber:{file:'reconstructions/scene-01/src/scanned-timber.js',source:'Existing Poly Haven lacquered_cherry_wood CC0 scan',uv:'Metric, aligned to each board long axis; one texture tile per metre',colorSpace:'Albedo sRGB; normal and roughness numeric',newAssets:false}
  },
  visualFinding:'The existing native frames show separate plank seams and no planar mirror covering the veranda. In the photograph, the near floor is almost entirely hidden by the left post, foreground balustrade and vegetation. Its tiny visible strip does not resolve intermediate board ends, arris radii or wood-grain scale.',
  decision:'Preserve the existing floor. There is a factual lack of rounded arrises and intermediate end joints in code, but the supplied image does not establish a specific correction. No invented end pattern, bevel, material, lighting, camera or layout change is made.',
  limits:['This is a bounded floor review, not visual acceptance of the scene.','Metric UV and separate boxes do not prove faithful wood appearance.','The CPU crop contains no extra geometric detail; the current source-matched 1254 native frames are the actual image evidence.'],
  changes:{sceneSource:false,publicRenderer:false,otherScenes:false,newGpuJobs:0,tests:0,movies:0,push:false}
};
await writeFile(resolve(here,'review.json'),JSON.stringify(audit,null,2)+'\n');
process.stdout.write(JSON.stringify({status:audit.status,sourceHash:source.hash,boards:boardCount,comparison:audit.evidence.comparison.file})+'\n');
