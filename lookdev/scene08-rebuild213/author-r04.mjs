import {readFile,writeFile} from 'node:fs/promises';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';

// Run only after both r03 native captures have completed and been reviewed.
// The source guard prevents modifying a queued/held candidate accidentally.
for(const iteration of['scene08-rebuild213-r03','scene08-rebuild213-r03-low3q']){
 const report=JSON.parse(await readFile(`qa/ten-reference/08/iteration-${iteration}/report.json`,'utf8'));
 if(report.status!=='rendered-review'||report.source.hash!=='ca61f18635894d3e62e089ab11cb742e805b7568ae6876f7bee1a5b60757929f')throw Error('R03 actual native evidence is incomplete or source identity changed.');
}
const identity=await reconstructionSourceIdentity(process.cwd(),'08');
if(identity.hash!=='ca61f18635894d3e62e089ab11cb742e805b7568ae6876f7bee1a5b60757929f')throw Error('R03 source guard failed.');
function sub(s,a,b){if(!s.includes(a))throw Error('Missing exact R03 source: '+a);return s.replace(a,b);}
let p='reconstructions/scene-08/src/weathered-toro213.js',s=await readFile(p,'utf8');
s=sub(s,"export const REBUILD213_REVISION='scene08-chipped-toro-terraced-rock-banks213-r03';","export const REBUILD213_REVISION='scene08-solid-bearing-kasa-terraced-banks213-r04';");
s=sub(s,'for(let layer=0;layer<2;layer++)for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=-W+2*W*i/N,z=-D+2*D*j/N;add(x*(layer?.94:1),at(x,z)-(layer?.145:0),z*(layer?.94:1));}',`// Granite kasa has a solid hipped body and a level bearing soffit above
 // the chamber. A constant-thickness curved sheet left a real 48mm gap.
 for(let layer=0;layer<2;layer++)for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=-W+2*W*i/N,z=-D+2*D*j/N,t=Math.max(Math.abs(x/W),Math.abs(z/D)),corner=Math.min(Math.abs(x/W),Math.abs(z/D)),bottom=2.468-.073*T.MathUtils.smoothstep(t,.68,1)+.10*Math.pow(t,8)*(.13+.87*Math.pow(corner,6));add(x*(layer?.94:1),layer?bottom:at(x,z),z*(layer?.94:1));}`);
s=sub(s,"revision:'scene08-worn-moulded-kasa-patch-moss213-r03'","revision:'scene08-solid-granite-bearing-kasa213-r04'");
s=sub(s,'capThickness:.145,chamberClearHeight:.52','capEdgeThickness:.145,solidCrownThickness:.532,levelBearingSoffitY:2.468,chamberClearHeight:.52');
s=sub(s,'top=a.v.clone().addScaledVector(nn,.005+.010*noise(a.v.x*31,a.v.y*31,a.v.z*31))','top=a.v.clone().addScaledVector(nn,.0018+(.008+.024*noise(a.v.x*31,a.v.y*31,a.v.z*31))*T.MathUtils.smoothstep(a.f,0,.065))');
await writeFile(p,s);
p='reconstructions/scene-08/src/layered-banks213.js';s=await readFile(p,'utf8');
s=sub(s,"[2.05,-1.18,1.55,3]])","[2.05,-1.18,1.55,3],[-1.20,4.05,1.25,0],[.35,4.04,1.35,3],[2.70,3.65,1.20,5],[2.90,2.15,1.25,2],[2.92,.65,1.35,3],[2.85,-.85,1.20,4]])");
s=sub(s,'const x=grandFrame.x+c*lx+s*lz,z=grandFrame.z-s*lx+c*lz,feet=[[-.52,0],[.52,0],[0,-.52],[0,.52]].map(([dx,dz])=>height(x+dx*width,z+dz*width)),y=Math.min(...feet)-.16;','const x=grandFrame.x+c*lx+s*lz,z=grandFrame.z-s*lx+c*lz,variant=scannedStones.info.variants[index%scannedStones.info.variants.length],bodyHeight=Math.min(width*variant.height/variant.width,1.70),y=height(x,z)-bodyHeight*.45;');
s=sub(s,'slopeAtCentre:height(x,z),index,embeddedInTriangularTerrain','slopeAtCentre:height(x,z),bodyHeight,index,embeddedInTriangularTerrain');
s=sub(s,"revision:'scene08-embedded-retaining-granite-understory213-r03'","revision:'scene08-exposed-two-course-rock-bank213-r04'");
await writeFile(p,s);
p='reconstructions/scene-08/src/main.js';s=await readFile(p,'utf8');await writeFile(p,sub(s,'scene08-chipped-toro-terraced-rock-banks213-r03','scene08-solid-bearing-kasa-terraced-banks213-r04'));
p='reconstructions/scene-08/assets/rebuild213-provenance.json';const j=JSON.parse(await readFile(p,'utf8'));j.revision='scene08-solid-bearing-kasa-terraced-banks213-r04';j.r03Source=identity.hash;j.r04Changes=['Replace the constant-thickness pitched lower shell with a solid granite cap: level 2.468m bearing soffit over the chamber, .532m central crown thickness, and moulded .145m edge thickness. The actual cap now intersects its original stone lintel instead of floating 35.6–48.0mm above it.','Feather each actual closed moss colony from a thin boundary into irregular deeper cushions; coverage stays about28percent rather than broad green sheeting.','R03 native low view exposed over-buried retaining stones. Embed each original scan by45percent of its real uniformly scaled height, instead of using the lowest distant terrain sample; six additional low apron solids create a second bank course. Exact terrain contact and all191 occupied portals/rooms stay held.'];await writeFile(p,JSON.stringify(j,null,2)+'\n');
p='reconstructions/scene-08/asset-dependencies.json';const d=JSON.parse(await readFile(p,'utf8'));d.rebuild213.revision=j.revision;await writeFile(p,JSON.stringify(d,null,2)+'\n');
console.log('Authored actual solid-bearing R04 after R03 native evidence source guard.');
