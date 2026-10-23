import {registerHooks} from 'node:module';
import {writeFile} from 'node:fs/promises';
registerHooks({resolve(s,c,next){if(s==='three')return{url:new URL('../../vendor/build/three.module.js',import.meta.url).href,shortCircuit:true};if(s.startsWith('three/addons/'))return{url:new URL('../../vendor/examples/jsm/'+s.slice(13),import.meta.url).href,shortCircuit:true};return next(s,c);}});
const {createSculptedJoinery}=await import('../../reconstructions/scene-05/src/sculpted-joinery.js');
const {createRafterEndCopper}=await import('../../reconstructions/scene-05/src/rafter-end-copper.js');
const {createAgedPier05}=await import('../../reconstructions/scene-05/src/aged-pier.js');
const kit=createSculptedJoinery(),copper=createRafterEndCopper(),small=createRafterEndCopper({detail:'small'}),records=[];
for(const [assembly,parts]of Object.entries({intermediate:kit.bracket,corner:kit.cornerFan,waist:kit.waistBearing,copper:copper.parts,smallCopper:small.parts,collar:[{geometry:kit.relief}],pier:[{geometry:createAgedPier05(.47,3.2,.47)}]}))for(const [at,part]of parts.entries()){
 if(['intermediate','corner','waist'].includes(assembly)&&part.material!=='kit_cedar')continue;
 const g=part.geometry,p=g.attributes.position,ix=g.index?.array??Uint32Array.from({length:p.count},(_,i)=>i),point=i=>[p.getX(i),p.getY(i),p.getZ(i)],key=a=>a.map(v=>Math.round(v*1e7)).join(','),edges=new Map();let volume=0,degenerate=0;
 for(let j=0;j<ix.length;j+=3){const a=point(ix[j]),b=point(ix[j+1]),c=point(ix[j+2]),ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]),cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
  if(Math.hypot(...cross)<1e-12){degenerate++;continue;}volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
  for(const [u,v]of[[a,b],[b,c],[c,a]]){const k=[key(u),key(v)].sort().join('/');edges.set(k,(edges.get(k)??0)+1);}
 }
 g.computeBoundingBox();records.push({assembly,part:at,role:part.role??g.userData.architectureJoint??part.material,triangles:ix.length/3,finite:Array.from(p.array).every(Number.isFinite),boundary:[...edges.values()].filter(v=>v===1).length,nonmanifold:[...edges.values()].filter(v=>v>2).length,degenerate,signedVolume:volume,bounds:[g.boundingBox.min.toArray(),g.boundingBox.max.toArray()]});
}
const report={status:'CPU-template-construction-check-only',records,allFinite:records.every(r=>r.finite),allClosed:records.every(r=>!r.boundary&&!r.nonmanifold),positiveVolumes:records.every(r=>r.signedVolume>0),contacts:{daitoTop:.020,firstArmUnderside:.0848-.090*.72,firstArmTop:.0848+.100*.72,secondArmUnderside:.370-.090*.72,secondArmTop:.370+.100*.72,thirdArmUnderside:.650-.090*.72,thirdArmTop:.650+.100*.72,purlinSeat:.820,waistHeadToPurlin:.3868},visualAccepted:false};
await writeFile(new URL('./'+(process.env.RECEIPT??'templates-r01.json'),import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({allFinite:report.allFinite,allClosed:report.allClosed,positiveVolumes:report.positiveVolumes,parts:records.length,failures:records.filter(r=>!r.finite||r.boundary||r.nonmanifold||r.signedVolume<=0)}));kit.dispose();copper.dispose();small.dispose();
