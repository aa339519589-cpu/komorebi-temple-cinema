// CPU-only conforming local subdivision and actual connected curl relief.
// Every new midpoint keeps its parent edge; first-row roots are source-surface
// vertices, and the material coverage follows their real 3D footprints.
export const hairLine199=(phi)=>2.78-.09*(1-Math.cos(phi))+.025*Math.sin(phi)**2;
const smooth=(x,a,b)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const unit=a=>{const l=Math.hypot(...a);return a.map(v=>v/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function surfaceNormals199(P,I){const N=new Float64Array(P.length);for(let q=0;q<I.length;q+=3){const a=I[q]*3,b=I[q+1]*3,c=I[q+2]*3,u=[P[b]-P[a],P[b+1]-P[a+1],P[b+2]-P[a+2]],v=[P[c]-P[a],P[c+1]-P[a+1],P[c+2]-P[a+2]],no=cross(u,v);for(const k of[a,b,c])for(let j=0;j<3;j++)N[k+j]+=no[j];}for(let k=0;k<N.length;k+=3){const l=Math.hypot(N[k],N[k+1],N[k+2]);if(!l)throw Error('Zero surface normal');for(let j=0;j<3;j++)N[k+j]/=l;}return N;}
export function refineScalp199(mesh){
 const P=mesh.P,I=mesh.I,n0=P.length/3,edges=new Map(),key=(a,b)=>Math.min(a,b)*n0+Math.max(a,b);let selected=0;
 for(let q=0;q<I.length;q+=3){const ids=I.slice(q,q+3),x=ids.reduce((s,id)=>s+P[id*3],0)/3,y=ids.reduce((s,id)=>s+P[id*3+1],0)/3,z=ids.reduce((s,id)=>s+P[id*3+2],0)/3,phi=Math.atan2(x,z+.29);if(y<hairLine199(phi)-.024||ids.some(id=>P[id*3+1]<2.54))continue;selected++;for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],k=key(a,b);if(Math.hypot(...[0,1,2].map(c=>P[a*3+c]-P[b*3+c]))>.0004&&!edges.has(k))edges.set(k,{a,b});}}
 for(const e of edges.values()){e.id=P.length/3;P.push(...[0,1,2].map(j=>(P[e.a*3+j]+P[e.b*3+j])/2));mesh.records.push({type:4,parent:e.a,aux:e.b,w:[.5,.5,0]});mesh.normalHints.push(unit(mesh.normalHints[e.a].map((v,j)=>v+mesh.normalHints[e.b][j])));}
 const out=[],types=[],parents=[];const emit=(a,b,c,type,parent)=>{out.push(a,b,c);types.push(type);parents.push(parent);};
 for(let f=0;f<I.length/3;f++){const ids=I.slice(f*3,f*3+3),m=ids.map((a,j)=>edges.get(key(a,ids[(j+1)%3]))?.id),count=m.filter(x=>x!==undefined).length,type=count?4:mesh.triangleClasses[f],parent=mesh.triangleParents[f],a=ids[0],b=ids[1],c=ids[2];
  if(count===0)emit(a,b,c,type,parent);
  else if(count===1){const r=m.findIndex(x=>x!==undefined),x=ids[r],y=ids[(r+1)%3],z=ids[(r+2)%3];emit(x,m[r],z,type,parent);emit(m[r],y,z,type,parent);}
  else if(count===2){const r=m.findIndex((x,j)=>x!==undefined&&m[(j+1)%3]!==undefined),x=ids[r],y=ids[(r+1)%3],z=ids[(r+2)%3],u=m[r],v=m[(r+1)%3];emit(y,v,u,type,parent);emit(x,u,z,type,parent);emit(u,v,z,type,parent);}
  else{emit(a,m[0],m[2],type,parent);emit(m[0],b,m[1],type,parent);emit(m[2],m[1],c,type,parent);emit(m[0],m[1],m[2],type,parent);}
 }
 mesh.I=out;mesh.triangleClasses=types;mesh.triangleParents=parents;return{selectedScalpTriangles:selected,addedMidpoints:edges.size,conformingRedGreenSubdivision:true,vertices:P.length/3,triangles:out.length/3};
}
export function turnActualEars199(mesh){
 const P=mesh.P,angle=.15,changedIds=[];let maxDelta=0,changed=0;
 for(let v=0;v<P.length/3;v++){const k=v*3,x=P[k],y=P[k+1],z=P[k+2];if(y<=2.15)continue;const side=Math.sign(x),cz=side>0?-.393:-.360,r=Math.hypot((y-2.46)/.225,(z-cz)/.120),w=(1-smooth(r,.68,1.40))*smooth(Math.abs(x),.205,.285)*smooth(y,2.15,2.23)*(1-smooth(z,-.255,-.18));if(!w)continue;const a=-side*angle*w,dx=x-side*.270,dz=z+.315,nx=side*.270+Math.cos(a)*dx+Math.sin(a)*dz,nz=-.315-Math.sin(a)*dx+Math.cos(a)*dz;P[k]=nx;P[k+2]=nz;maxDelta=Math.max(maxDelta,Math.hypot(nx-x,nz-z));changed++;changedIds.push(v);}
 return{vertices:changedIds,audit:{method:'Small continuous rotation of the actual inherited NC ear volume toward the front, with broad root/lobe blend; no sharpening or relief amplification.',angleRadians:angle,changedVertices:changed,maximumDelta:maxDelta}};
}
function random(i){let x=(i^0x6a23fe91)>>>0;x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return((x^(x>>>16))>>>0)/4294967295;}
export function sculptRootedCurls199(mesh){
 const P=mesh.P,N=surfaceNormals199(P,mesh.I),n=P.length/3,CELL=.024,SEP=.0162,RADIUS=.0108,BASE=.00095,RIDGE=.0025,WIDTH=.00165,roots=[],grid=new Map(),rim=[],interior=[];
 const cellOf=p=>p.map(v=>Math.floor(v/CELL));
 for(let v=0;v<n;v++){const k=v*3,x=P[k],y=P[k+1],z=P[k+2],phi=Math.atan2(x,z+.29),line=hairLine199(phi),radial=[x,y-2.63,z+.29],length=Math.hypot(...radial);if(y<line-.012||radial.reduce((s,a,j)=>s+a*N[k+j],0)/length<.55)continue;const wobble=.0035*Math.sin(phi*17+.4)+.0022*Math.sin(phi*31+1.7),d=Math.abs(y-(line+.004+wobble));if(d<.011)rim.push({v,score:d+.0003*random(v)});else if(y>line+.008)interior.push(v);}
 rim.sort((a,b)=>a.score-b.score);interior.sort((a,b)=>random(a)-random(b));
 function add(v,firstRow){const k=v*3,p=[P[k],P[k+1],P[k+2]],cell=cellOf(p);for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)for(const id of grid.get([cell[0]+x,cell[1]+y,cell[2]+z].join(','))??[])if(Math.hypot(...p.map((a,j)=>a-roots[id].p[j]))<SEP)return;const normal=[N[k],N[k+1],N[k+2]],up=Math.abs(normal[1])>.92?[1,0,0]:[0,1,0],u=unit(cross(up,normal)),r={vertex:v,p,normal,u,v:cross(normal,u),radius:RADIUS*(.94+.12*random(v+4)),phase:random(v+12)*Math.PI*2,firstRow};const id=roots.length;roots.push(r);const key=cell.join(',');if(!grid.has(key))grid.set(key,[]);grid.get(key).push(id);}
 for(const q of rim)add(q.v,true);for(const v of interior)add(v,false);
 const mask=new Float32Array(n);let maxRelief=0,minRelief=0,changed=0,transitionVertices=0;
 for(let v=0;v<n;v++){const k=v*3,p=[P[k],P[k+1],P[k+2]],phi=Math.atan2(p[0],p[2]+.29),line=hairLine199(phi);if(p[1]<line-.027)continue;const cell=cellOf(p);let relief=0,coverage=0;
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)for(const id of grid.get([cell[0]+x,cell[1]+y,cell[2]+z].join(','))??[]){const root=roots[id],d=p.map((a,j)=>a-root.p[j]),dot=a=>d.reduce((s,x,j)=>s+x*a[j],0),u=dot(root.u),vv=dot(root.v),r=Math.hypot(u,vv)/root.radius;if(r>1.14||Math.abs(dot(root.normal))>.009)continue;const angle=Math.atan2(vv,u)-root.phase+7.5*(1-r),wrapped=Math.atan2(Math.sin(angle),Math.cos(angle)),distance=wrapped*r*root.radius/Math.sqrt(1+(7.5*r)**2),fade=1-smooth(r,.86,1.14),coil=RIDGE*Math.exp(-((distance/WIDTH)**2))*smooth(r,.10,.23)*fade,base=BASE*Math.max(0,1-r*r)**2;relief+=base+coil;coverage=Math.max(coverage,1-smooth(r,.84,1.13));}
  const interiorCoverage=smooth(p[1],line+.013,line+.040);mask[v]=Math.max(coverage,interiorCoverage);if(mask[v]>0&&mask[v]<1)transitionVertices++;
  maxRelief=Math.max(maxRelief,relief);minRelief=Math.min(minRelief,relief);if(relief>1e-9){changed++;for(let j=0;j<3;j++)P[k+j]+=N[k+j]*relief;}
 }
 if(maxRelief>.009)throw Error('Coil displacement bound '+maxRelief);
 return{mask,roots,audit:{method:'Raised one-turn coil ridges and rounded rooted volumes on the same source scalp. First-row roots use actual source-surface vertices with irregular height/spacing; material coverage follows their 3D footprints. No cut spiral pits or straight analytic cap edge.',roots:roots.length,firstRowRoots:roots.filter(r=>r.firstRow).length,nominalRadius:RADIUS,minimumSeparation:SEP,baseHeight:BASE,ridgeHeight:RIDGE,ridgeWidth:WIDTH,maximumRelief:maxRelief,minimumRelief:minRelief,changedVertices:changed,transitionVertices}};
}
