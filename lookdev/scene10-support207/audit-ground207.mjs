import fs from 'node:fs/promises';
import * as T from 'three';
import * as layout from '../../reconstructions/scene-10/src/layout125.js';
import * as support from '../../reconstructions/scene-10/src/support-route207.js';
import * as oldLayout from './r06-source/src/layout125.js';
import * as oldSupport from './r06-source/src/support-route207.js';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
import {towerBenchHeight210,bankBedHeight210} from '../../reconstructions/scene-10/src/rain-banks210.js';

// Evaluate the exact authored height recipe and the rendered .25m triangle
// convention. No browser, scene capture, GPU work or approximate hill proxy.
async function heightRecipe(directory,L,lo,su){
 const main=await fs.readFile(directory+'/src/main.js','utf8'),natural=await fs.readFile(directory+'/src/natural193.js','utf8');
 const part=(text,start,end)=>{const a=text.indexOf(start),b=text.indexOf(end,a);if(a<0||b<0)throw Error('Height recipe boundary changed: '+start);return text.slice(a,b);};
 const helpers=part(natural,'const smooth=','export async function loadShrubs193');
 const hill=part(main,'function hillHeight(','const terrainPos');
 const forest=main.match(/function forestHeight141\(x,z\)\{[^\n]+\}/)?.[0];
 const channel=main.match(/function bridgeWaterChannel125\(x,z\)\{[^\n]+\}/)?.[0];
 const reserved=part(main,'function circulationReserved125(','// Porous wet mineral support');
 const raw=part(natural,' const rawHeight=',' const x0=');
 const names=['T','L','routeReserved207','bridgeHallPlan','bridgeApproach207','leftPathEdge125','rightPathEdge125','pondContains207','pondShoreDistance207','nearIslandHeight207','nearRouteGround207','hallShoreHeight207','towerBenchHeight210','bankBedHeight210'];
 const values=[T,L,su.routeReserved207,lo.createBridgeHallStairPlan125(),su.createApproachPlan207(L),lo.leftPathEdge125,lo.rightPathEdge125,su.pondContains207,su.pondShoreDistance207,su.nearIslandHeight207,su.nearRouteGround207,su.hallShoreHeight207,towerBenchHeight210,bankBedHeight210];
 const fn=new Function(...names,helpers+hill+forest+channel+reserved+'const layout=L,approach207=bridgeApproach207,stairEmbankment={ownedBy207:true},forestHeight=forestHeight141,reserved=circulationReserved125,channel=bridgeWaterChannel125;'+raw+'return rawHeight;')(...values);
 return (x,z)=>{const step=.25,x0=-58,z0=-86,i=Math.floor((x-x0)/step),j=Math.floor((z-z0)/step),xx=x0+i*step,zz=z0+j*step,u=(x-xx)/step,v=(z-zz)/step,A=fn(xx,zz),B=fn(xx+step,zz),C=fn(xx,zz+step),D=fn(xx+step,zz+step);return u+v<=1?A+(B-A)*u+(C-A)*v:D+(C-D)*(1-u)+(B-D)*(1-v);};
}
const revision=process.argv[2]||'r08',old=await heightRecipe('lookdev/scene10-support207/r06-source',oldLayout.scene10Layout125,oldLayout,oldSupport),now=await heightRecipe('reconstructions/scene-10',layout.scene10Layout125,layout,support),held=JSON.parse(await fs.readFile('reconstructions/scene-10/ecology193-held207.json','utf8')),approach=support.createApproachPlan207(layout.scene10Layout125);
const forest=held.forest.map((p,i)=>({index:i,root:p.root,oldTriangleY:old(p.root[0],p.root[2]),newTriangleY:now(p.root[0],p.root[2])}));
const paths=[approach.route,approach.rearRoute].flatMap((r,route)=>r.samples.map((p,i)=>({route,index:i,center:p,triangleY:now(p[0],p[2]),nominalFlagBottom:p[1]-.136,nominalFlagTop:p[1]})));
const result={source:await reconstructionSourceIdentity(process.cwd(),'10'),scope:'Exact CPU evaluation of the authored height recipes followed by the rendered .25m indexed triangle interpolation; excludes physical rock ray hits, complete collision checking, engineering certification and photographic acceptance.',lantern:{position:layout.scene10Layout125.heroStoneLantern.position,r06TriangleAtPreviousAnchor:old(-2.8,-3),currentTriangleAtCurrentAnchor:now(layout.scene10Layout125.heroStoneLantern.position[0],layout.scene10Layout125.heroStoneLantern.position[2]),actualStoneSupportTop:layout.scene10Layout125.heroStoneLantern.supportTop,actualLanternBase:layout.scene10Layout125.heroStoneLantern.position[1]},forest,paths,summary:{forestRoots:forest.length,maxForestTriangleYChange:Math.max(...forest.map(p=>Math.abs(p.oldTriangleY-p.newTriangleY))),routeCenterSamples:paths.length,soilCrossingNominalFlagTop:paths.filter(p=>p.triangleY>p.nominalFlagTop+.002).length,nonfinite:paths.filter(p=>!Number.isFinite(p.triangleY)).length},visualAccepted:false};
await fs.writeFile(`lookdev/scene10-support207/ground-audit-${revision}.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({lantern:result.lantern,...result.summary}));
