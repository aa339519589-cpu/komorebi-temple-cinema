import{readFile,writeFile}from'node:fs/promises';
import{execFileSync}from'node:child_process';
import{createHash}from'node:crypto';
import{reconstructionSourceIdentity}from'../../tools/reconstruction-source-identity.mjs';
const root=new URL('../../',import.meta.url).pathname,base='qa/ten-reference/08/iteration-scene08-spatial191-r06/report.json',full='qa/ten-reference/08/iteration-scene08-natural197-r04/report.json',low='qa/ten-reference/08/iteration-scene08-natural197-r04-low3q/report.json';
const read=async p=>JSON.parse(await readFile(new URL('../../'+p,import.meta.url))),baseline=await read(base),held=await read(full),lowReport=await read(low),b=baseline.frames[0].info,h=held.frames[0].info,equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b),sha=s=>createHash('sha256').update(s).digest('hex');
const archive=new URL('baseline-source-scripts.tgz',import.meta.url).pathname,oldScene=execFileSync('tar',['-xOf',archive,'reconstructions/scene-08/src/scene.js'],{encoding:'utf8'}),newScene=await readFile(new URL('../../reconstructions/scene-08/src/scene.js',import.meta.url),'utf8');
function block(text,start,end){const a=text.indexOf(start),z=text.indexOf(end,a+start.length);if(a<0||z<0)throw Error('Protected marker missing: '+start);return text.slice(a,z);}
const protectedSourceBlocks=[];
for(const[name,start,end]of[
 ['held roof surface/tile/rafter construction calls',"function roof(","// A curved tiled gable"],
 ['foreground gate/column/rail geometry',"role='foreground-veranda';","role='arched-stream-bridge';"],
 ['bridge and its landing',"role='arched-stream-bridge';","role='gallery-stone-stair';"],
 ['right-hall host transforms/bays/shrine calls (arm profiles intentionally changed)' ,"const rightHallFrame171=","role='five-tier-pagoda';"],
 ['pagoda host frame/roof calls (arm profiles intentionally changed)' ,"role='five-tier-pagoda';","role='foreground-veranda';"],
 ['garden geometry and complete RNG placement',"role='branching-garden-trees';","const skyG="],
 ['actual terrain/stream/stone contacts',"role='gallery-stone-stair';","let pine171Stats="]
 ]){const a=block(oldScene,start,end),c=block(newScene,start,end);protectedSourceBlocks.push({name,unchanged:a===c,baselineSha256:sha(a),heldSha256:sha(c)});}
const oldMain=execFileSync('tar',['-xOf',archive,'reconstructions/scene-08/src/main.js'],{encoding:'utf8'}),newMain=await readFile(new URL('../../reconstructions/scene-08/src/main.js',import.meta.url),'utf8'),normalizeMain=s=>s.replace(/revision:'[^']*'/g,"revision:'IDENTITY-LABEL'");
const nativeRetained={};for(const key of['camera','grandFrame','grandMass171','scannedPeony','rightHall171','pine171','rngFinalState','scannedStones'])nativeRetained[key]=equal(b[key],h[key]);
for(const key of['foreground-veranda','arched-stream-bridge','five-tier-pagoda','right-court-hall171','branching-garden-trees','dense-layered-shrubs','scanned-bank-understory'])nativeRetained['role:'+key]=b.roles[key]===h.roles[key];
for(const key of['portals','caps','receivers','skippedReceivers'])nativeRetained['spatial191:'+key]=equal(b.spatial191[key],h.spatial191[key]);
for(const key of['shrubs','groundcover','scannedBlades','bladeVariants','bladeLengths','bladeAttributes','variants'])nativeRetained['botany:'+key]=equal(b.botany[key],h.botany[key]);
const identity=await reconstructionSourceIdentity(root,'08'),pin=await read('lookdev/scene08-natural197/r04-source-identity.json'),frames=[...held.frames,...lowReport.frames],renderChecks={sourceMatchesPinAndBothJobs:identity.hash===pin.hash&&held.source.hash===pin.hash&&lowReport.source.hash===pin.hash,native1254:frames.every(f=>f.width===1254&&f.height===1254),validPixelsAndShaders:frames.every(f=>f.valid&&!f.contextLost&&f.glError===0&&f.programs.every(p=>p.linked)),emptyErrorLists:!held.errors.length&&!lowReport.errors.length,cameraSourceExceptRevisionUnchanged:normalizeMain(oldMain)===normalizeMain(newMain)};
const out={revision:'scene08-natural197-r04',sourceHash:identity.hash,scope:'Source/anchor/native evidence verification only; no GPU render or scene export',renderChecks,protectedSourceBlocks,nativeRetained,spatial:{portals:h.spatial191.portals.length,retiredRepeatedCladdingKits:h.spatial191.claddingMounts.length,retiredCantileverEndSkins:h.spatial191.cantileverCladding.length,newGalleryReceivers:h.spatial191.receivers,skipped:h.spatial191.skippedReceivers},visualAccepted:false};out.pass=Object.values(renderChecks).every(Boolean)&&protectedSourceBlocks.every(b=>b.unchanged)&&Object.values(nativeRetained).every(Boolean);await writeFile(new URL('protected-native-proof-r04.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));if(!out.pass)process.exitCode=1;
