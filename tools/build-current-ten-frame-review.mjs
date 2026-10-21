import {readFile,readdir,mkdir,writeFile,access} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {homedir} from 'node:os';
import {existsSync} from 'node:fs';
import {reconstructionSourceIdentity} from './reconstruction-source-identity.mjs';

// Only genuine reference-camera framebuffers whose source content still matches
// the working scene enter this board. A rendering pass is not visual acceptance.
const root=resolve(process.cwd()),frozenFile=process.env.FILM_BUILD;
const frozen=frozenFile?JSON.parse(await readFile(resolve(root,frozenFile),'utf8')):null;
if(frozen&&(frozen.status!=='ten-scene-draft-rendered'||frozen.shots?.length!==10))throw Error('A complete captured-film source manifest is required.');
const out=resolve(root,process.env.REVIEW_OUTPUT||'qa/ten-reference/current-repair-review-20261020');
const config=JSON.parse(await readFile(resolve(root,'reconstructions/ten-scenes.json'),'utf8'));
const frames=[];
for(const scene of config.scenes){
 const id=String(scene.reference).padStart(2,'0'),identity=frozen?frozen.shots.find(s=>s.reference===scene.reference)?.source:await reconstructionSourceIdentity(root,id);
 if(!identity?.hash)throw Error('Missing captured source for scene '+id);
 const dir=resolve(root,'qa/ten-reference',id),candidates=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  const folder=resolve(dir,entry.name);
  try{
   const report=JSON.parse(await readFile(resolve(folder,'report.json'),'utf8'));
   if(report.status!=='rendered-review'||report.source?.hash!==identity.hash||report.errors?.length||report.inspectionView)continue;
   let frame=report.frames?.find(f=>f.name==='reference'&&f.localTime===null&&f.valid&&f.pngSaved);
   if(!frame){
    // A recorded byte-identical alias may name the canonical camera frame
    // produced by a shadow-cache profiling call. No inspection camera qualifies.
    try{const alias=JSON.parse(await readFile(resolve(folder,'reference-frame-alias.json'),'utf8'));
     const candidate=report.frames?.find(f=>f.name+'.png'===alias.source&&f.valid&&f.pngSaved&&f.pose?.reference===scene.reference&&JSON.stringify(f.info?.camera?.position)===JSON.stringify(f.info?.camera?.reference?.position));
     if(candidate&&alias.sourceHash===report.source.hash&&alias.sameBytes&&(await readFile(resolve(folder,alias.source))).equals(await readFile(resolve(folder,'reference.png'))))frame=candidate;
    }catch(e){if(e.code!=='ENOENT')throw e;}
   }
   if(!frame)continue;
   await access(resolve(folder,'reference.png'));
   candidates.push({report,frame,folder});
  }catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}
 }
 candidates.sort((a,b)=>String(b.report.completedAt).localeCompare(String(a.report.completedAt)));
 if(!candidates.length)throw Error(`Scene ${id} has no current-source native reference frame; render it before packaging.`);
 const {report,frame,folder}=candidates[0];
 frames.push({reference:scene.reference,name:scene.shortName,referenceFile:scene.referenceFile.replace(/^\//,''),nativeFile:relative(root,resolve(folder,'reference.png')),receipt:relative(root,resolve(folder,'report.json')),sourceCommit:frozen?.shots.find(s=>s.reference===scene.reference)?.sourceCommit||report.sourceCommit,sourceHash:identity.hash,rgbaSha256:frame.rgbaSha256,renderedAt:report.completedAt,size:[frame.width,frame.height],visualAccepted:false});
}
await mkdir(out,{recursive:true});
const manifest={status:'ongoing-reconstruction-review',createdAt:new Date().toISOString(),sourceCommit:frozen?.sourceCommit||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...(frozen?{capturedFilmBuild:frozenFile,scope:'Canonical native stills matching the recorded immutable film sources; ongoing working scenes may be newer.'}:{}),photoOnLeft:true,nativeOnRight:true,visualAccepted:false,frames};
await writeFile(resolve(out,'frames.json'),JSON.stringify(manifest,null,2)+'\n');
const bundledPython=resolve(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3');
const python=process.env.PYTHON_BIN||(existsSync(bundledPython)?bundledPython:'python3');
execFileSync(python,['-c',`
import json,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
root=Path(sys.argv[1]);out=Path(sys.argv[2]);m=json.loads((out/'frames.json').read_text())
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',18)
small=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',15)
tile=320;pad=14;label=34;cellw=tile*2+pad;cellh=tile+label+pad
canvas=Image.new('RGB',(pad+cellw*2,pad+cellh*5),(20,23,27));d=ImageDraw.Draw(canvas)
for i,f in enumerate(m['frames']):
 x=pad+(i%2)*cellw;y=pad+(i//2)*cellh
 d.text((x,y),f"{f['reference']:02d}   REFERENCE / NATIVE 3D   (in progress)",font=font,fill=(229,207,161))
 for j,key in enumerate(['referenceFile','nativeFile']):
  im=Image.open(root/f[key]).convert('RGB');im=ImageOps.fit(im,(tile,tile),method=Image.Resampling.LANCZOS)
  canvas.paste(im,(x+j*tile,y+label))
canvas.save(out/'all-ten-reference-left-native-right.jpg',quality=95,subsampling=0)
` ,root,out],{stdio:'inherit'});
if(!frozen)for(const f of frames){if((await reconstructionSourceIdentity(root,String(f.reference).padStart(2,'0'))).hash!==f.sourceHash)throw Error(`Source changed while assembling scene ${f.reference}; rerun after its current render.`);}
console.log(JSON.stringify({status:manifest.status,scenes:frames.length,board:relative(root,resolve(out,'all-ten-reference-left-native-right.jpg')),visualAccepted:false}));
