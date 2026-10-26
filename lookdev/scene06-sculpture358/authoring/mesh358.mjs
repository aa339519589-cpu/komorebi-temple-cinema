// Ordinary single-threaded JavaScript mesh authoring/analysis only. No renderer,
// browser, Blender, scene export, image read, GPU compute, or external resource.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {gunzipSync,gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
export const ROOT=resolve(import.meta.dirname,'../../..'),LANE=resolve(import.meta.dirname,'..');
export const sha=b=>createHash('sha256').update(b).digest('hex');
export async function loadMesh(folder){
 const m=JSON.parse(await readFile(resolve(folder,'manifest.json'))),d=m.variants.central[0];
 const packed=await readFile(resolve(folder,d.file));if(sha(packed)!==d.sha256)throw Error('Packed identity mismatch');
 const raw=d.compression==='gzip'?gunzipSync(packed):packed;
 const n=raw.readUInt32LE(4),ni=raw.readUInt32LE(8);
 if(raw.readUInt32LE(0)!==0x37304353||raw.length!==20+n*32+ni*4)throw Error('SC07 layout');
 if(d.uncompressedSha256&&sha(raw)!==d.uncompressedSha256)throw Error('Raw identity mismatch');
 return {folder,m,d,raw,n,P:new Float32Array(raw.buffer,raw.byteOffset+20,n*3),N:new Float32Array(raw.buffer,raw.byteOffset+20+n*12,n*3),I:new Uint32Array(raw.buffer,raw.byteOffset+20+n*32,ni)};
}
export async function loadInputs(){
 const original=await loadMesh(resolve(ROOT,'reconstructions/scene-06/assets/sculpture199-r08a-continuous-source-fit-mixed-licenses'));
 const posed=await loadMesh(resolve(ROOT,'reconstructions/scene-06/assets/centralpose295-r06-CC-BY-NC-SA-4.0'));
 if(sha(original.raw)!=='630fb859eba6d9d7f8adfa671ad458fe2d8e4a08585ec58e91d9acc461485c47'||sha(posed.raw)!=='5eb011e234c0ad0e08ca6eb121f39019c9467ab8b994943692cde293b6250154')throw Error('Frozen R08a/R06 identities changed');
 if(original.n!==posed.n||!Buffer.from(original.I.buffer,original.I.byteOffset,original.I.byteLength).equals(Buffer.from(posed.I.buffer,posed.I.byteOffset,posed.I.byteLength)))throw Error('Original topology identity changed');
 return {original,posed};
}
export function makeLocalGraph(mesh,original){
 const {n,I}=mesh,P0=original.P,ids=[],map=new Int32Array(n).fill(-1);
 for(let v=0;v<n;v++){const k=v*3;if(P0[k]>.2&&P0[k+1]>.7&&P0[k+1]<2.1){map[v]=ids.length;ids.push(v);}}
 const degree=new Uint32Array(ids.length);
 for(let k=0;k<I.length;k+=3)for(let j=0;j<3;j++){const v=map[I[k+j]];if(v>=0)degree[v]+=2;}
 const offsets=new Uint32Array(ids.length+1);for(let j=0;j<ids.length;j++)offsets[j+1]=offsets[j]+degree[j];
 const cursor=offsets.slice(0,-1),neighbors=new Uint32Array(offsets[ids.length]);
 for(let k=0;k<I.length;k+=3)for(let j=0;j<3;j++){const v=map[I[k+j]];if(v<0)continue;neighbors[cursor[v]++]=I[k+(j+1)%3];neighbors[cursor[v]++]=I[k+(j+2)%3];}
 return {ids:Uint32Array.from(ids),map,offsets,neighbors};
}
export const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function fair(P,graph,weights,steps,lambda=.42){
 const {ids,offsets,neighbors}=graph,next=new Float32Array(ids.length*3),active=[];
 for(let i=0;i<ids.length;i++)if(weights[i]>0)active.push(i);
 for(let step=0;step<steps;step++){
  for(const i of active){const v=ids[i],k=v*3,start=offsets[i],end=offsets[i+1],w=weights[i]*lambda;let x=0,y=0,z=0;
   for(let q=start;q<end;q++){const a=neighbors[q]*3;x+=P[a];y+=P[a+1];z+=P[a+2];}
   const count=end-start;next[i*3]=P[k]+w*(x/count-P[k]);next[i*3+1]=P[k+1]+w*(y/count-P[k+1]);next[i*3+2]=P[k+2]+w*(z/count-P[k+2]);
  }
  for(const i of active){const k=ids[i]*3;P[k]=next[i*3];P[k+1]=next[i*3+1];P[k+2]=next[i*3+2];}
 }
 return active.length;
}
export function updateNormals(P,base){
 const {n,I}=base,changed=new Uint8Array(n),affected=new Uint8Array(n),sum=new Float64Array(n*3),N=new Float32Array(base.N);
 for(let v=0;v<n;v++){const k=v*3;if(P[k]!==base.P[k]||P[k+1]!==base.P[k+1]||P[k+2]!==base.P[k+2])changed[v]=1;}
 for(let k=0;k<I.length;k+=3)if(changed[I[k]]||changed[I[k+1]]||changed[I[k+2]])for(let j=0;j<3;j++)affected[I[k+j]]=1;
 let degenerate=0,minTwiceArea=Infinity,trianglesTouched=0;
 for(let k=0;k<I.length;k+=3){const ids=[I[k],I[k+1],I[k+2]];if(!ids.some(v=>affected[v]))continue;
  const a=ids[0]*3,b=ids[1]*3,c=ids[2]*3,ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,area=Math.hypot(nx,ny,nz);minTwiceArea=Math.min(minTwiceArea,area);trianglesTouched++;if(area<1e-18)degenerate++;
  for(const v of ids)if(affected[v]){const q=v*3;sum[q]+=nx;sum[q+1]+=ny;sum[q+2]+=nz;}
 }
 for(let v=0;v<n;v++)if(affected[v]){const k=v*3,len=Math.hypot(sum[k],sum[k+1],sum[k+2]);if(len>1e-20){N[k]=sum[k]/len;N[k+1]=sum[k+1]/len;N[k+2]=sum[k+2]/len;}}
 return {N,changed,affected,degenerate,minTwiceArea,trianglesTouched};
}
const sub=(a,b)=>a.map((x,j)=>x-b[j]),dot=(a,b)=>a.reduce((s,x,j)=>s+x*b[j],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function segmentHits(a,b,tri){const u=sub(tri[1],tri[0]),v=sub(tri[2],tri[0]),no=cross(u,v),d0=dot(no,sub(a,tri[0])),d1=dot(no,sub(b,tri[0]));if(d0*d1>=-1e-24)return false;const t=d0/(d0-d1);if(t<1e-7||t>1-1e-7)return false;const p=a.map((x,j)=>x+(b[j]-x)*t),w=sub(p,tri[0]),uu=dot(u,u),uv=dot(u,v),vv=dot(v,v),wu=dot(w,u),wv=dot(w,v),den=uu*vv-uv*uv;if(den<1e-24)return false;const s=(wu*vv-wv*uv)/den,r=(wv*uu-wu*uv)/den;return s>1e-7&&r>1e-7&&s+r<1-1e-7;}
const hits=(a,b)=>[0,1,2].some(j=>segmentHits(a[j],a[(j+1)%3],b)||segmentHits(b[j],b[(j+1)%3],a));
export function probe(P,original,{fullPairs=false}={}){
 // Same strict thresholds and original-source classification as POSE295.
 const {P:P0,n,I}=original,changed=new Uint8Array(n),lo=[9,9,9],hi=[-9,-9,-9];
 for(let v=0;v<n;v++){const k=v*3;if(P[k]!==P0[k]||P[k+1]!==P0[k+1]||P[k+2]!==P0[k+2]){changed[v]=1;for(let j=0;j<3;j++){lo[j]=Math.min(lo[j],P[k+j]-.015);hi[j]=Math.max(hi[j],P[k+j]+.015);}}}
 const CELL=.025,grid=new Map(),tris=[];let movedTriangles=0;
 for(let t=0;t<I.length/3;t++){
  const ia=I[t*3]*3,ib=I[t*3+1]*3,ic=I[t*3+2]*3,a=[0,1,2].map(j=>Math.min(P[ia+j],P[ib+j],P[ic+j])),z=[0,1,2].map(j=>Math.max(P[ia+j],P[ib+j],P[ic+j]));
  if(a.some((x,j)=>x>hi[j])||z.some((x,j)=>x<lo[j]))continue;
  const ids=[I[t*3],I[t*3+1],I[t*3+2]],p=ids.map(v=>Array.from(P.subarray(v*3,v*3+3))),moved=ids.some(v=>changed[v]);movedTriangles+=moved;
  const id=tris.length;tris.push({triangle:t,ids,p,min:a,max:z,moved});const lower=a.map((x,j)=>Math.max(0,Math.floor((x-lo[j])/CELL))),upper=z.map((x,j)=>Math.floor((Math.min(x,hi[j])-lo[j])/CELL));
  for(let x=lower[0];x<=upper[0];x++)for(let y=lower[1];y<=upper[1];y++)for(let zz=lower[2];zz<=upper[2];zz++){const k=x+y*128+zz*16384;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(id);}
 }
 const seen=new Set(),newPairs=[],inherited=[];let narrowPairs=0;
 for(const cell of grid.values())for(let j=0;j<cell.length;j++)for(let k=j+1;k<cell.length;k++){
  let ia=cell[j],ib=cell[k];if(ia>ib)[ia,ib]=[ib,ia];const a=tris[ia],b=tris[ib];
  if(!a.moved&&!b.moved)continue;if(a.min.some((x,j)=>x>b.max[j]+1e-9)||b.min.some((x,j)=>x>a.max[j]+1e-9)||a.ids.some(v=>b.ids.includes(v)))continue;
  const pair=ia*tris.length+ib;if(seen.has(pair))continue;seen.add(pair);narrowPairs++;if(!hits(a.p,b.p))continue;
  const oldA=a.ids.map(v=>Array.from(P0.subarray(v*3,v*3+3))),oldB=b.ids.map(v=>Array.from(P0.subarray(v*3,v*3+3))),entry={triangles:[a.triangle,b.triangle],vertices:[a.ids,b.ids]};
  (hits(oldA,oldB)?inherited:newPairs).push(entry);
 }
 const categoryCounts={},sourceBounds={min:[9,9,9],max:[-9,-9,-9]},posedBounds={min:[9,9,9],max:[-9,-9,-9]};
 for(const entry of newPairs){const low=entry.vertices.some(ids=>ids.every(v=>P0[v*3+1]<=.70)),moving=entry.vertices.every(ids=>ids.some(v=>changed[v])),category=low?'posed-arm-vs-fixed-leg':moving?'posed-arm-self':'posed-arm-vs-fixed-torso';categoryCounts[category]=(categoryCounts[category]??0)+1;
  for(const ids of entry.vertices)for(const v of ids)for(let j=0;j<3;j++){sourceBounds.min[j]=Math.min(sourceBounds.min[j],P0[v*3+j]);sourceBounds.max[j]=Math.max(sourceBounds.max[j],P0[v*3+j]);posedBounds.min[j]=Math.min(posedBounds.min[j],P[v*3+j]);posedBounds.max[j]=Math.max(posedBounds.max[j],P[v*3+j]);}
 }
 return {scope:'Strict noncoplanar crossings in changed-arm bounds against all adjacent source surfaces, same POSE295 thresholds. Shared vertices, coplanar/tangential contacts and remote unchanged source areas omitted; not a global intersection-free proof.',categoryCounts,region:{min:lo,max:hi},candidateTriangles:tris.length,positionChangedTriangles:movedTriangles,gridCells:grid.size,narrowTrianglePairs:narrowPairs,newStrictCrossingPairs:newPairs.length,inheritedStrictCrossingPairs:inherited.length,sourceBounds,posedBounds,newPairs:fullPairs?newPairs:newPairs.slice(0,10),inheritedExamples:inherited.slice(0,5)};
}
export async function writeMesh(path,P,N,base){
 const raw=Buffer.from(base.raw);Buffer.from(P.buffer,P.byteOffset,P.byteLength).copy(raw,20);Buffer.from(N.buffer,N.byteOffset,N.byteLength).copy(raw,20+base.n*12);
 const packed=gzipSync(raw,{level:9});await writeFile(path,packed,{flag:'wx'});
 return {sha256:sha(packed),uncompressedSha256:sha(raw),bytes:packed.length,uncompressedBytes:raw.length};
}
