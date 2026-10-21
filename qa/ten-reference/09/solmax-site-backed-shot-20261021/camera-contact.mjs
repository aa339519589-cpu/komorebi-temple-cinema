import * as T from '../../../../vendor/build/three.module.js';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {SCENE09_SHOT144 as S,SCENE09_REFERENCE144 as R} from '../../../../reconstructions/scene-09/src/site-shot144.js';
import {VERANDA_POLYGON139 as polygon} from '../../../../reconstructions/scene-09/src/veranda-apron139.js';
// Execute the actual shared camera function with only its Node import spelling
// changed; no renderer, browser or substitute camera interpolation is created.
const repo=resolve(new URL('../../../../',import.meta.url).pathname);
const src=(await readFile(resolve(repo,'reconstructions/camera-dolly.js'),'utf8')).replace("from 'three'",`from '${pathToFileURL(resolve(repo,'vendor/build/three.module.js')).href}'`);
const {createDollyPath}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const path=createDollyPath({...S,farTarget:R.target,fov:R.fov}),c=Math.cos(.13864),s=Math.sin(.13864);
function inside(x,z){let q=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])q=!q;}return q;}
let minimumFinialBoxClearance=Infinity,allPositionsOverOccupiedFloor=true;const samples=[];
for(let i=0;i<=168;i++){
 const time=7*i/168,pose=path(time),p=new T.Vector3(...pose.position),dx=p.x-6,dz=p.z-33,local=[c*dx-s*dz,s*dx+c*dz],overFloor=inside(...local);allPositionsOverOccupiedFloor&&=overFloor;
 const distances=[28.7,30.5,32.2].map(z=>new T.Box3(new T.Vector3(6.88,2.12,z-.17),new T.Vector3(7.22,2.66,z+.17)).distanceToPoint(p));minimumFinialBoxClearance=Math.min(minimumFinialBoxClearance,...distances);
 if(i%42===0)samples.push({time,...pose,deckLocal:local,overOccupiedDeck:overFloor,eyeHeightAboveDeck:p.y-1.45,finialBoxDistances:distances});
}
const record={revision:S.revision,method:'Actual source camera path,169 evenly spaced time samples; conservative finite finial boxes and actual source granite footprint','minimumFinialBoxClearanceMetres':minimumFinialBoxClearance,'allPositionsOverOccupiedFloor':allPositionsOverOccupiedFloor,endpointPositionPreserved:path(7).position.every((v,i)=>Math.abs(v-R.position[i])<1e-9),endpointTargetPreserved:path(7).target.every((v,i)=>Math.abs(v-R.target[i])<1e-9),samples,'scope':'Geometric preflight only; actual native five-pose and motion evidence still decides framing/contacts','visualAccepted':false};
await writeFile(new URL('camera-contact-r16.json',import.meta.url),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record));
