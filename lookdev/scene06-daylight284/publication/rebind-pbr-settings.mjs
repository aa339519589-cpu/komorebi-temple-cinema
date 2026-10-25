import{readFile,writeFile}from'node:fs/promises';
import{resolve,dirname}from'node:path';
const [packageArg,settingsArg,outputArg,frameArg]=process.argv.slice(2);
if(!packageArg||!settingsArg||!outputArg||!frameArg)throw Error('Use PACKAGE INPUT_SETTINGS NEW_SETTINGS NEW_FRAME_DIRECTORY');
const packageRoot=resolve(packageArg),scene=JSON.parse(await readFile(resolve(packageRoot,'scene.json'))),report=JSON.parse(await readFile(resolve(packageRoot,'export-report.json'))),settings=JSON.parse(await readFile(resolve(settingsArg)));
if(report.status!=='exported-existing-geometry'||report.errors.length||report.sourceHash!==settings.expectedSourceHash)throw Error('Complete same-source package required');
if(settings.pbrStudy284){const spec=settings.pbrStudy284.central,matches=scene.materials.filter(m=>m.name===spec.exactName);if(matches.length!==1)throw Error('One central material expected');const consumers=scene.meshes.filter(m=>m.materials.includes(matches[0].id));if(consumers.length!==1||consumers[0].instances!==1||JSON.stringify(consumers[0].ancestry)!==JSON.stringify(spec.exactAncestry))throw Error('Central ancestry differs');spec.exactId=matches[0].id;}
settings.exportDirectory=packageRoot;settings.outputDirectory=resolve(frameArg);settings.reproductionBinding={sourceHash:report.sourceHash,reason:'Runtime UUIDs can change across exact-source reconstruction. Only the uniquely named and ancestry-verified material ID and local paths are rebound; original candidate values held.'};
await writeFile(resolve(outputArg),JSON.stringify(settings,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({settings:resolve(outputArg),source:report.sourceHash,photographicAccepted:false}));
