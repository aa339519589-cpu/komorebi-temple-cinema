import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';import {dirname,join} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url)),root=join(here,'cycles-r06-export');
const s=JSON.parse(readFileSync(join(root,'scene.json'),'utf8')),exp=JSON.parse(readFileSync(join(root,'export-report.json'),'utf8'));
if(exp.status!=='exported-existing-geometry'||exp.sourceHash!=='d4ebd5c9b2855de36771c9b4f24821594cde9d78230c39843869773f04d5cad6')throw Error('Unexpected frozen export');
let verifiedBuffers=0,uniqueVertices=0,uniqueTriangles=0,nonfinite=0,unitOutliers=0,zeroNormals=0,degenerate=0,opposed=0;
const records=[],problems=[];const consumers=new Map();s.meshes.forEach((m,i)=>{const a=consumers.get(m.geometry)||[];a.push(m.name||'source-object-'+i);consumers.set(m.geometry,a)});
function array(rec){const b=readFileSync(join(root,'assets',rec.file));const sha=createHash('sha256').update(b).digest('hex');if(sha!==exp.exportedAssets[rec.file].sha256)throw Error('Changed buffer '+rec.file);verifiedBuffers++;const c=rec.type==='Float32Array'?Float32Array:rec.type==='Uint32Array'?Uint32Array:rec.type==='Uint16Array'?Uint16Array:null;if(!c)throw Error(rec.type);const a=new c(b.buffer,b.byteOffset,b.byteLength/c.BYTES_PER_ELEMENT);if(a.length!==rec.count)throw Error('Buffer count '+rec.file);return a;}
for(const g of s.geometries){const attrs={};for(const [k,v]of Object.entries(g.attributes))attrs[k]=array(v);const p=attrs.position,n=attrs.normal,uv=attrs.uv,ind=array(g.index),v=p.length/3,f=ind.length/3;uniqueVertices+=v;uniqueTriangles+=f;
 const r={id:g.id,consumers:consumers.get(g.id),vertices:v,triangles:f,normalMinLength:null,normalMaxLength:null,nonfiniteAttributes:0,unitNormalOutliers:0,zeroNormals:0,degenerateTriangles:0,opposedAverageVertexNormals:0,minFaceNormalCosine:1};
 for(const [k,a]of Object.entries(attrs)){if(a.length/g.attributes[k].itemSize!==v)throw Error('Vertex attribute count '+g.id+'/'+k);for(const x of a)if(!Number.isFinite(x))r.nonfiniteAttributes++;}
 let min=Infinity,max=0;
 if(n)for(let i=0;i<n.length;i+=3){const l=Math.hypot(n[i],n[i+1],n[i+2]);min=Math.min(min,l);max=Math.max(max,l);if(l<1e-12)r.zeroNormals++;if(Math.abs(l-1)>1e-4)r.unitNormalOutliers++;}
 r.normalMinLength=n?min:null;r.normalMaxLength=n?max:null;
 for(let i=0;i<ind.length;i+=3){const a=ind[i]*3,b=ind[i+1]*3,c=ind[i+2]*3;if(a>=p.length||b>=p.length||c>=p.length)throw Error('Out-of-range source index '+g.id);
  const ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2];const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,area2=Math.hypot(nx,ny,nz);
  if(area2<1e-14){r.degenerateTriangles++;continue;}
  if(n){const ax=n[a]+n[b]+n[c],ay=n[a+1]+n[b+1]+n[c+1],az=n[a+2]+n[b+2]+n[c+2];const q=Math.hypot(ax,ay,az);if(q>1e-12){const dot=(nx*ax+ny*ay+nz*az)/(area2*q);r.minFaceNormalCosine=Math.min(r.minFaceNormalCosine,dot);if(dot<-.01)r.opposedAverageVertexNormals++;}}
 }
 nonfinite+=r.nonfiniteAttributes;unitOutliers+=r.unitNormalOutliers;zeroNormals+=r.zeroNormals;degenerate+=r.degenerateTriangles;opposed+=r.opposedAverageVertexNormals;records.push(r);
 if(r.nonfiniteAttributes||r.unitNormalOutliers||r.zeroNormals||r.opposedAverageVertexNormals)problems.push(r);
}
const indexed=new Map(records.map(r=>[r.id,r]));const weightedDegenerate=s.meshes.reduce((sum,m)=>sum+indexed.get(m.geometry).degenerateTriangles*m.instances,0);
const core=records.filter(r=>[210766].includes(r.vertices));
const report={status:'exported-attribute-audit',sourceCommit:exp.sourceCommit,sourceHash:exp.sourceHash,geometryCount:records.length,verifiedBufferHashes:verifiedBuffers,uniqueVertices,uniqueTriangles,renderedSourceTriangleCount:s.statistics.triangles,nonfiniteAttributeValues:nonfinite,unitNormalOutliersTolerance1e4:unitOutliers,zeroNormals,sourceDegenerateTrianglesBelowDoubledArea1e14:degenerate,sourceDegenerateTrianglesIncludingInstances:weightedDegenerate,opposedAverageVertexNormals:opposed,coreAnatomicalSurfaces:core,sourceNormalProblemGeometryCount:problems.length,sourceNormalProblems:problems.sort((a,b)=>b.opposedAverageVertexNormals-a.opposedAverageVertexNormals),limits:['Checks exported positions, normals, UV/color counts, finite values, index range and immutable buffer hashes.','Normal/winding angular agreement is a diagnostic on supplied source data; curved folds, repeated poles and separate back faces can need interpretation.','Source buffer triangle counts retain generated pole/degenerate faces; they are not a claim that every source index triple has positive area.',
'This is not a manifold, self-intersection, anatomy or photographic likeness proof.','Imported shears use inverse-transpose normal transformation and winding correction as declared in the actual render reports.'],visualAccepted:false};
writeFileSync(join(here,'cycles-r06-export-attribute-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,sourceNormalProblems:problems.slice(0,8)},null,2));
