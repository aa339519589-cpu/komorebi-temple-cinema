import {registerHooks} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=new URL('../../../../',import.meta.url);
registerHooks({resolve(specifier,context,next){if(specifier==='three')return next(new URL('vendor/build/three.module.js',root).href,context);if(specifier.startsWith('three/addons/'))return next(new URL('vendor/examples/jsm/'+specifier.slice(13),root).href,context);return next(specifier,context);}});
const T=await import(new URL('vendor/build/three.module.js',root)),roof=await import(new URL('reconstructions/scene-07/src/foreground-gallery-roof.js',root));
const records=[],rods=[],boxes=[],result=roof.buildForegroundGalleryRoof({emit(g,m,x,y,z,sx=1,sy=1,sz=1,rot=[0,0,0]){records.push({g,material:m.name,position:[x,y,z],scale:[sx,sy,sz],rot});},rod(a,b,r,m){rods.push({a,b,r,m});},box(...args){boxes.push(args);}});
const geometries=[];let finite=true;
for(const g of new Set(records.map(r=>r.g))){
 for(const a of Object.values(g.attributes))for(const x of a.array)if(!Number.isFinite(x))finite=false;
 const indices=g.index?.array??Array.from({length:g.attributes.position.count},(_,i)=>i),p=g.attributes.position,edges=new Map();let volume=0;
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let i=0;i<indices.length;i+=3){
  const ids=[indices[i],indices[i+1],indices[i+2]];a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);volume+=a.dot(b.clone().cross(c))/6;
  if(g.index)for(let j=0;j<3;j++){const n=ids[j],m=ids[(j+1)%3],key=n<m?n+':'+m:m+':'+n;edges.set(key,(edges.get(key)||0)+1);}
 }
 const critical=g.name==='gallery-closed-curved-bedding'||g.name==='foreground-lapped-ceramic-assembly';
 geometries.push({name:g.name,indexed:!!g.index,vertices:p.count,triangles:indices.length/3,signedVolume:volume,criticalRoofAssembly:critical,closedIndexedEdges:!!g.index&&[...edges.values()].every(n=>n===2)});
}
for(const r of records)if(![...r.position,...r.scale,...r.rot].every(Number.isFinite))finite=false;
for(const r of rods)if(![...r.a,...r.b,r.r].every(Number.isFinite))finite=false;
const baseCommit='4ed9eb2d80ccab050e02efb6d9207769ef934047',baseMain=execFileSync('git',['show',baseCommit+':reconstructions/scene-07/src/main.js'],{cwd:new URL('.',root),encoding:'utf8'}),main=await readFile(new URL('reconstructions/scene-07/src/main.js',root),'utf8');
const restored=main.replace('buildForegroundGalleryRoof,FOREGROUND_ROOF_REVISION,FOREGROUND_ROOF_LAYOUT','buildForegroundGalleryRoof,FOREGROUND_ROOF_REVISION').replace('group(...FOREGROUND_ROOF_LAYOUT.position,FOREGROUND_ROOF_LAYOUT.yaw,1,()=>{foregroundRoof=buildForegroundGalleryRoof({emit,box,rod,tube});});','group(2.3,6.4,24.5,-.22,1,()=>{foregroundRoof=buildForegroundGalleryRoof({emit,box,rod,tube});});');
const fit=JSON.parse(await readFile(new URL('./fit-result.json',import.meta.url),'utf8')),layout=roof.FOREGROUND_ROOF_LAYOUT,camera=new T.PerspectiveCamera(47,1,.1,350);camera.position.set(10.7,12.8,36);camera.lookAt(0,7,-2);camera.updateMatrixWorld(true);
const matrix=new T.Matrix4().makeTranslation(...layout.position).multiply(new T.Matrix4().makeRotationY(layout.yaw));
const project=p=>{const v=p.clone().applyMatrix4(matrix).project(camera);return[(v.x+1)*627,(1-v.y)*627];};
const features=fit.observations.map(o=>{
 const u=o.u??o.x/layout.eaveHalf,p=new T.Vector3(...roof.foregroundPoint(o.t,u)),e=.0001,a=Math.max(0,o.t-e),b=Math.min(1,o.t+e),parallel=o.kind==='cap',p0=new T.Vector3(...roof.foregroundPoint(a,parallel?p.x/roof.foregroundSpan(a):u)),p1=new T.Vector3(...roof.foregroundPoint(b,parallel?p.x/roof.foregroundSpan(b):u)),f=p1.sub(p0).normalize(),across=new T.Vector3(0,1,0).cross(f).normalize(),up=f.clone().cross(across).normalize();
 const pixel=project(p.addScaledVector(up,parallel?.24:.35).addScaledVector(f,parallel?.095:0));return{id:o.id,target:o.target,actualPixel:pixel,fitPixel:o.pixel,fitToSourceDeltaPixels:Math.hypot(...pixel.map((v,k)=>v-o.pixel[k])),referenceResidualPixels:Math.hypot(...pixel.map((v,k)=>v-o.target[k]))};
});
const audit={scope:'CPU integrity, projected roof registration and complete main.js isolation; not a photographic-fidelity acceptance.',baseCommit,revision:roof.FOREGROUND_ROOF_REVISION,roof:result.audit,finite,geometries,emissionCount:records.length,supportRods:rods.length,boxes:boxes.length,features,rmsPixels:Math.sqrt(features.reduce((s,f)=>s+f.referenceResidualPixels**2,0)/features.length),mainOutsideTwoAuthorizedLinesExact:restored===baseMain,mainAfterAuthorizedLinesRestoredSHA256:createHash('sha256').update(restored).digest('hex'),baseMainSHA256:createHash('sha256').update(baseMain).digest('hex'),photoRGBOrProjection:false};
audit.passed=finite&&audit.mainOutsideTwoAuthorizedLinesExact&&geometries.filter(g=>g.criticalRoofAssembly).every(g=>g.closedIndexedEdges&&g.signedVolume>0)&&features.every(f=>f.fitToSourceDeltaPixels<.1);
await writeFile(new URL('./geometry-and-isolation-audit.json',import.meta.url),JSON.stringify(audit,null,2));result.dispose();console.log(JSON.stringify({passed:audit.passed,finite,mainOutsideTwoAuthorizedLinesExact:audit.mainOutsideTwoAuthorizedLinesExact,rmsPixels:audit.rmsPixels,criticalAssemblies:geometries.filter(g=>g.criticalRoofAssembly),roof:result.audit},null,2));if(!audit.passed)process.exitCode=1;
