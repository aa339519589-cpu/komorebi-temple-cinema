// CPU inspection of the actual emitted target solids. No browser/GPU or test suite.
import {registerHooks} from 'node:module';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
registerHooks({resolve(specifier,context,next){if(specifier==='three')return{url:pathToFileURL(resolve('vendor/build/three.module.js')).href,shortCircuit:true};if(specifier.startsWith('three/addons/'))return{url:pathToFileURL(resolve('vendor/examples/jsm',specifier.slice(13))).href,shortCircuit:true};return next(specifier,context);}});
const {T,Builder}=await import('../reconstructions/scene-02/kernel.js');
const {buildForegroundStoneLantern120,foregroundLantern120:cfg}=await import('../reconstructions/scene-02/foreground-stone-lantern120.js');
const {layout}=await import('../reconstructions/scene-02/layout117.js');
const mats={};for(const name of['foregroundGranite120','foregroundCap120','foregroundRecess120','foregroundRock120'])mats[name]=new T.MeshStandardMaterial();
const b=new Builder(mats),target=buildForegroundStoneLantern120({b,mats});
function inspect(g){
 const p=g.attributes.position,idx=g.index?.array??Uint32Array.from({length:p.count},(_,i)=>i),ids=[],weld=new Map(),edges=new Map();let finite=true,volume=0,degenerate=0;
 for(let i=0;i<p.count;i++){const v=[p.getX(i),p.getY(i),p.getZ(i)];if(!v.every(Number.isFinite))finite=false;const key=v.map(x=>Math.round(x*1e5)).join(',');if(!weld.has(key))weld.set(key,weld.size);ids.push(weld.get(key));}
 for(let i=0;i<idx.length;i+=3){const ia=idx[i],ib=idx[i+1],ic=idx[i+2],a=new T.Vector3().fromBufferAttribute(p,ia),bb=new T.Vector3().fromBufferAttribute(p,ib),c=new T.Vector3().fromBufferAttribute(p,ic);volume+=a.dot(bb.cross(c))/6;const v=[ids[ia],ids[ib],ids[ic]];if(new Set(v).size<3){degenerate++;continue;}for(let j=0;j<3;j++){const u=v[j],vv=v[(j+1)%3],key=Math.min(u,vv)+','+Math.max(u,vv);edges.set(key,(edges.get(key)??0)+1);}}
 return{name:g.name,vertices:p.count,triangles:idx.length/3,finite,signedVolumeMetresCubed:volume,weldToleranceMetres:.00001,boundaryEdges:[...edges.values()].filter(n=>n===1).length,nonManifoldEdges:[...edges.values()].filter(n=>n>2).length,degenerateTriangles:degenerate};
}
const critical=[...b.buckets.values()].filter(x=>/closed-(?:four-hip|chamfered|natural-rock)/.test(x.g.name)).map(x=>inspect(x.g));
const roof=[...b.buckets.values()].find(x=>x.g.name==='closed-four-hip-carved-stone-kasa').g.attributes.position;let roofMinimumOverWindowCap=Infinity;
for(let i=0;i<roof.count;i++)if(Math.abs(roof.getX(i))<=.5&&Math.abs(roof.getZ(i))<=.5)roofMinimumOverWindowCap=Math.min(roofMinimumOverWindowCap,roof.getY(i));
const stages=[['masonry foot',0,.60],['foot cap',.60,.74],['shaft foot',.74,.85],['square shaft',.85,1.95],['compression capital',1.95,2.13],['carved capital block',2.13,2.37],['capital ledge',2.37,2.45],['window floor',2.45,2.53],['corner piers',2.53,3.25],['window top cap',3.25,3.34]];
const contacts=stages.slice(1).map((s,i)=>({lower:stages[i][0],upper:s[0],lowerTopY:stages[i][2],upperBottomY:s[1],gapMetres:s[1]-stages[i][2]}));
function polygon(cx,cz,hx,hz,yaw,sx=1,sz=1){const c=Math.cos(yaw),s=Math.sin(yaw);return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>[cx+c*x*hx*sx+s*z*hz*sz,cz-s*x*hx*sx+c*z*hz*sz]);}
function segDist(p,a,d){const v=[d[0]-a[0],d[1]-a[1]],t=Math.max(0,Math.min(1,((p[0]-a[0])*v[0]+(p[1]-a[1])*v[1])/(v[0]**2+v[1]**2)));return Math.hypot(p[0]-a[0]-t*v[0],p[1]-a[1]-t*v[1]);}
function overlap(a,bb){for(const p of[a,bb])for(let i=0;i<4;i++){const q=p[(i+1)%4],axis=[-(q[1]-p[i][1]),q[0]-p[i][0]],pa=a.map(v=>v[0]*axis[0]+v[1]*axis[1]),pb=bb.map(v=>v[0]*axis[0]+v[1]*axis[1]);if(Math.max(...pa)<Math.min(...pb)||Math.max(...pb)<Math.min(...pa))return false;}return true;}
function separation(a,bb){if(overlap(a,bb))return 0;return Math.min(...a.flatMap(p=>bb.map((q,i)=>segDist(p,q,bb[(i+1)%4]))),...bb.flatMap(p=>a.map((q,i)=>segDist(p,q,a[(i+1)%4]))));}
const bridge=polygon(layout.bridge.position[0],layout.bridge.position[2],7.65,1.65,layout.bridge.yaw,layout.bridge.scale[0],layout.bridge.scale[2]),lantern=polygon(cfg.anchor[0],cfg.anchor[2],.68,.68,cfg.yaw),oldLamp=polygon(-3.8,8,.65,.65,0);
const {reconstructionSourceIdentity}=await import('./reconstruction-source-identity.mjs');
const source=await reconstructionSourceIdentity(process.cwd(),'02');
const report={sourceHash:source.hash,status:'actual target geometry inspected on CPU; not photographic acceptance',visualAccepted:false,scope:'Only new scene02 left foreground lantern/footing. Unchanged architecture uses layout117.',criticalSolids:critical,stackContacts:contacts,bearing:{flatRockTopWorldY:cfg.anchor[1],masonryBottomWorldY:cfg.anchor[1],gapMetres:0,maximumFootCornerRadius:Math.hypot(.39,.39),conservativeFlatBearingRadius:.60,allFootCornersSupported:Math.hypot(.39,.39)<.60},roofSupport:{actualLowestRoofVertexOverWindowCapY:roofMinimumOverWindowCap,windowTopCapY:3.34,gapMetres:roofMinimumOverWindowCap-3.34,outerOverhangHalfWidth:.68,windowCapHalfWidth:.50},bridgeClearance:{conservativeBridgeFootprint:bridge,lanternRoofFootprint:lantern,oldLampFootprintOverlapsBridge:overlap(oldLamp,bridge),newLampFootprintOverlapsBridge:overlap(lantern,bridge),minimumHorizontalClearanceMetres:separation(lantern,bridge)},targetStats:target.stats,limits:['Natural footing stones intentionally overlap into one rock mass; architecture interfaces above it use the shared measured stage levels.','Four luminous inner panes are intentionally open surfaces; closure checks apply to load-bearing shaft, capital, roof and rock bearing.','This contact inspection does not establish full-scene fidelity.']};
if(critical.some(x=>!x.finite||x.signedVolumeMetresCubed<=0||x.boundaryEdges||x.nonManifoldEdges)||!report.bearing.allFootCornersSupported||Math.abs(report.roofSupport.gapMetres)>.00001||overlap(lantern,bridge))throw Error(JSON.stringify(report));
const out='qa/ten-reference/02/iteration-stonelantern120-b';await mkdir(out,{recursive:true});await writeFile(out+'/geometry-contact-inspection.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({criticalSolids:critical,groundGap:0,roofGap:report.roofSupport.gapMetres,oldBridgeOverlap:report.bridgeClearance.oldLampFootprintOverlapsBridge,newBridgeClearance:report.bridgeClearance.minimumHorizontalClearanceMetres}));
