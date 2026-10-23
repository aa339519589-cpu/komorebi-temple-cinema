import{readFile,writeFile}from'node:fs/promises';
import{resolve}from'node:path';
import{pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
import{SCENE09_REFERENCE144 as reference,SCENE09_SHOT144 as shot}from'../../reconstructions/scene-09/src/site-shot144.js';
const root=resolve(import.meta.dirname,'../..'),sourcePath=resolve(root,'reconstructions/scene-09/src/site-shot144.js'),source=await readFile(sourcePath,'utf8');
const code=(await readFile(resolve(root,'reconstructions/camera-dolly.js'),'utf8')).replace("from 'three'",`from '${pathToFileURL(resolve(root,'vendor/build/three.module.js')).href}'`);
const{createDollyPath}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const path=createDollyPath({...shot,farTarget:reference.target,fov:reference.fov});
const deck=x=>1.25+1.36*Math.pow(Math.max(0,1-(x/8)**2),1.15),postWorldX=Array.from({length:13},(_,i)=>-.6+.72*(-8+i*16/12));
let lo=0,hi=7;for(let k=0;k<64;k++){const mid=(lo+hi)/2;if(path(mid).position[2]<3.03)lo=mid;else hi=mid;}
const time=(lo+hi)/2,camera=path(time).position,post=postWorldX.map(x=>({x,dx:Math.abs(x-camera[0])})).sort((a,b)=>a.dx-b.dx)[0],postDeck=deck((post.x+.6)/.72),railTop=deck((camera[0]+.6)/.72)+1.039,cap={xHalfWidth:.31*.72/2,zHalfWidth:.31/2,loY:postDeck+1.11,hiY:postDeck+1.21};
const capCollision=post.dx<cap.xHalfWidth&&camera[1]>=cap.loY&&camera[1]<=cap.hiY;
const result={scope:'Pure CPU evaluation of the exact source dolly and actual bridge rail/cap dimensions. Not a full scene collision test or native motion acceptance.',revision:shot.revision,sourceSha256:createHash('sha256').update(source).digest('hex'),opening:{position:shot.points[0],bridgeTread:deck((shot.points[0][0]+.6)/.72),eyeAboveBridgeTread:shot.points[0][1]-deck((shot.points[0][0]+.6)/.72)},nearRailCrossing:{time,camera,nearestPostX:post.x,postXDistance:post.dx,cap,capCollision,railTop,eyeAboveRail:camera[1]-railTop},samplePoses:[0,1.5,3.5,7].map(time=>({time,...path(time)})),nativeReviewRequired:true,visualAccepted:false};
result.bridgeRailClearancePassed=!capCollision&&result.nearRailCrossing.eyeAboveRail>.07;
await writeFile(resolve(import.meta.dirname,(process.argv[2]||'r03')+'-shot-clearance.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
