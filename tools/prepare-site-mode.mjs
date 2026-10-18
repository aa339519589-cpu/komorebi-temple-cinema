import {readFile,writeFile} from 'node:fs/promises';
function one(s,a,b){if(s.split(a).length!==2)throw Error('Changed source anchor: '+a.slice(0,100));return s.replace(a,b);}
let world=await readFile('src/world.js','utf8');
world=one(world,"const initialMode=reference10Porch?'rain':'sanctuary';","const initialMode=reference10Porch?'rain':(options.initialMode??'sanctuary');");
world=one(world,"for(const shot of shots)if(referenceModes[shot.reference]!==shot.lightingMode)","if(!Object.hasOwn(lightingProfiles,initialMode))throw Error('Unknown initial lighting mode');\n  for(const shot of shots)if(referenceModes[shot.reference]!==shot.lightingMode)");
// Preview-only GPU-memory budget for scene-matched reference studies.
// Actual original geometry, material parameters and cameras are preserved.
const shadow=process.env.SITE_PREVIEW_SHADOW_SIZE;
if(shadow!==undefined){
 const value=Number(shadow);
 if(![1024,2048,4096].includes(value))throw Error('Preview shadow size must be 1024, 2048 or 4096');
 world=one(world,'sun.shadow.mapSize.set(8192, 8192);','sun.shadow.mapSize.set('+value+', '+value+');');
 world=one(world,'textureWidth: 2048,\n    textureHeight: 1024,','textureWidth: 1024,\n    textureHeight: 512,');
 world=one(world,'textureWidth: 1600,\n    textureHeight: 900,','textureWidth: 800,\n    textureHeight: 450,');
 world=one(world,'new T.WebGLRenderTarget(1920,1080,{type:T.HalfFloatType,samples:4})','new T.WebGLRenderTarget(960,540,{type:T.HalfFloatType,samples:0})');
 console.log('MEMORY_BOUNDED_PREVIEW',JSON.stringify({shadow:value,water:[1024,512],puddle:[800,450],refraction:[960,540],geometry:'unchanged',scope:'QA only'}));
}

await writeFile('src/world-site-start.js',world);
let production=await readFile('src/sanctuary-production.js','utf8');
production=one(production,"import {buildWorld} from './world.js';","import {buildWorld} from './world-site-start.js';\nimport {lightingModeForTime} from './cinematography.js';");
production=one(production,"buildWorld(renderer,{sceneVariant:params.get('scene')||'shared'})","buildWorld(renderer,{sceneVariant:params.get('scene')||'shared',initialMode:lightingModeForTime(getReferenceView(Number(params.get('reference')||3),{sceneVariant:params.get('scene')||'shared'}).time)})");
await writeFile('src/site-production.js',production);
let html=await readFile('sanctuary-production.html','utf8');html=one(html,'/src/sanctuary-production.js','/src/site-production.js');await writeFile('site-production.html',html);
let worker=await readFile('tools/diagnose-site-pipeline.mjs','utf8');
worker=one(worker,'/sanctuary-production.html?w=${size}&h=${size}&scope=site&scene=${variant}','/site-production.html?w=${size}&h=${size}&scope=site&scene=${variant}&reference=${ref}');
worker=one(worker,"const out='output/site-pipeline-'+ref","const out='output/site-start-'+ref");
await writeFile('tools/render-site-start.mjs',worker);console.log('Prepared explicit reference-mode startup; original scene/default source unchanged');
