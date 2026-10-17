import {readFile,writeFile} from 'node:fs/promises';
function one(s,a,b){if(s.split(a).length!==2)throw Error('Changed source anchor: '+a.slice(0,100));return s.replace(a,b);}
let world=await readFile('src/world.js','utf8');
world=one(world,"const initialMode=reference10Porch?'rain':'sanctuary';","const initialMode=reference10Porch?'rain':(options.initialMode??'sanctuary');");
world=one(world,"for(const shot of shots)if(referenceModes[shot.reference]!==shot.lightingMode)","if(!Object.hasOwn(lightingProfiles,initialMode))throw Error('Unknown initial lighting mode');\n  for(const shot of shots)if(referenceModes[shot.reference]!==shot.lightingMode)");
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
