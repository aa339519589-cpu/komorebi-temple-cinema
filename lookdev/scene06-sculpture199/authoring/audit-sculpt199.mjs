import {readFile,writeFile} from 'node:fs/promises';
const revision=process.argv[2];if(!/^r\d\d$/.test(revision))throw Error('Use rNN');
const dir=new URL('../authored-'+revision+'/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',dir))),out=await readFile(new URL(manifest.variants.central[0].file,dir));
const n=out.readUInt32LE(4),ni=out.readUInt32LE(8),P=new Float32Array(out.buffer,out.byteOffset+20,n*3),I=new Uint32Array(out.buffer,out.byteOffset+20+n*32,ni);
const raw=await readFile(new URL('../../../reconstructions/scene-06/assets/nc-sainsbury-amida179-CC-BY-NC-SA-4.0/central-sainsbury-r09-CC-BY-NC-SA-4.0-3e33b700a894f466.bin',import.meta.url)),sn=raw.readUInt32LE(4),si=raw.readUInt32LE(8),SP=new Float32Array(raw.buffer,raw.byteOffset+20,sn*3),SI=new Uint32Array(raw.buffer,raw.byteOffset+20+sn*32,si);
const parentBuffer=await readFile(new URL('midpoint-parent-pairs199-'+revision+'.bin',dir)),parents=new Uint32Array(parentBuffer.buffer,parentBuffer.byteOffset,parentBuffer.length/4),base=new Float64Array(n*3);base.set(SP);
for(let v=sn;v<n;v++)for(let k=0;k<3;k++)base[v*3+k]=(base[parents[(v-sn)*2]*3+k]+base[parents[(v-sn)*2+1]*3+k])/2;
function edgeTopology(ix,vertices){
 const a=new Float64Array(ix.length);for(let i=0;i<ix.length;i+=3)for(let j=0;j<3;j++){const x=ix[i+j],y=ix[i+(j+1)%3];a[i+j]=Math.min(x,y)*vertices+Math.max(x,y);}a.sort();let edges=0,open=0,nonmanifold=0;
 for(let i=0;i<a.length;){let j=i+1;while(j<a.length&&a[j]===a[i])j++;edges++;if(j-i===1)open++;if(j-i>2)nonmanifold++;i=j;}
 return{vertices,faces:ix.length/3,edges,open,nonmanifold,euler:vertices-edges+ix.length/3};
}
function normal(a,b,c,p){const ux=p[b*3]-p[a*3],uy=p[b*3+1]-p[a*3+1],uz=p[b*3+2]-p[a*3+2],vx=p[c*3]-p[a*3],vy=p[c*3+1]-p[a*3+1],vz=p[c*3+2]-p[a*3+2];return[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];}
let degenerate=0,turnedPast90=0,seatChanged=0,minCos=1;const turnedBins={},frontProjectionReversals={robe:0,face:0};
for(let i=0;i<I.length;i+=3){const a=normal(I[i],I[i+1],I[i+2],base),b=normal(I[i],I[i+1],I[i+2],P),la=Math.hypot(...a),lb=Math.hypot(...b);if(lb<1e-13)degenerate++;
 if(la>1e-13&&lb>1e-13){const cos=a.reduce((s,v,k)=>s+v*b[k],0)/la/lb;minCos=Math.min(minCos,cos);const y=(base[I[i]*3+1]+base[I[i+1]*3+1]+base[I[i+2]*3+1])/3;
  if(cos<0){turnedPast90++;const bin=(Math.floor(y*10)/10).toFixed(1);turnedBins[bin]=(turnedBins[bin]??0)+1;}
  if(a[2]/la>.15&&b[2]/lb<-.15){if(y>.5&&y<2)frontProjectionReversals.robe++;if(y>2.15&&y<2.78)frontProjectionReversals.face++;}
 }
}
for(let v=0;v<sn;v++)if(SP[v*3+1]<=.13)for(let j=0;j<3;j++)if(SP[v*3+j]!==P[v*3+j])seatChanged++;
const audit={source:edgeTopology(SI,sn),derivative:edgeTopology(I,n),degenerate,turnedPast90,minCos,turnedBins,frontProjectionReversals,originalSeatBandChangedComponents:seatChanged,status:'geometry-integrity-only-not-visual-acceptance',visualAccepted:false};
await writeFile(new URL('../'+revision+'-geometry-integrity.json',import.meta.url),JSON.stringify(audit,null,2)+'\n');console.log(JSON.stringify(audit,null,2));
