import {readFile,writeFile,rename} from 'node:fs/promises';
const source='/Users/mima1234/temple-cinema-film-f-sol61-232/output/sol61-rebuild-20261024-f-resume1/film-build.json';
const destination=new URL('./progress.json',import.meta.url);
for(;;){
 let report;
 try{report=JSON.parse(await readFile(source,'utf8'));}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}
 if(report){
  const progress={status:report.status,completedShots:report.shots.length,sourceCommit:report.sourceCommit,iteration:'sol61-rebuild-20261024-f-resume1',updatedAt:new Date().toISOString(),photographicAccepted:false};
  const temporary=new URL('./progress.json.tmp',import.meta.url);await writeFile(temporary,JSON.stringify(progress,null,2)+'\n');await rename(temporary,destination);
  if(['failed','ten-scene-draft-rendered'].includes(report.status))break;
 }
 await new Promise(resolve=>setTimeout(resolve,10000));
}
