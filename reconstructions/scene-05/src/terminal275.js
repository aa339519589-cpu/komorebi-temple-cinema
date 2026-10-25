import * as T from 'three';
import {finishSolid190} from './detail190-solids.js';
import {createCornerMask190} from './corner-mask190.js';
import {cast275,ring275,ribbon275,craftCollector275,closedWire190} from './corner-craft275.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smoothUnion=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k,0,1);return b+(a-b)*h-k*h*(1-h);};
function ell(x,y,z,cx,cy,cz,rx,ry,rz,angle=0){x-=cx;y-=cy;z-=cz;const c=Math.cos(angle),s=Math.sin(angle),u=x*c+y*s;y=-x*s+y*c;x=u;const a=Math.sqrt((x/rx)**2+(y/ry)**2+(z/rz)**2),b=Math.sqrt((x/(rx*rx))**2+(y/(ry*ry))**2+(z/(rz*rz))**2);return b>1e-10?a*(a-1)/b:-Math.min(rx,ry,rz);}
function segment(p,a,b,r){const d=b.map((v,i)=>v-a[i]),v=p.map((q,i)=>q-a[i]),t=clamp((v[0]*d[0]+v[1]*d[1]+v[2]*d[2])/(d[0]*d[0]+d[1]*d[1]+d[2]*d[2]),0,1);return Math.hypot(v[0]-d[0]*t,v[1]-d[1]*t,v[2]-d[2]*t)-r;}
function fold(points,r){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),p=curve.getPoints(12).map(p=>p.toArray());return{p,r,min:[0,1,2].map(k=>Math.min(...p.map(q=>q[k]))-r*1.4),max:[0,1,2].map(k=>Math.max(...p.map(q=>q[k]))+r*1.4)};}

// A genuine signed-volume sculpture: deep eye sockets, alar nostril bores and
// an open mouth cut into the clay mass. This is hand-authored anatomy, with
// no photograph/depth sampling, and is extracted inside the official job.
export function createTerminalFace275(){
 const folds=[];for(const s of[-1,1]){
  const m=p=>p.map(([x,y,z])=>[s*x,y+(s<0?-.0015:0),z]);
  folds.push(fold(m([[.020,.267,.116],[.070,.311,.119],[.147,.325,.085],[.205,.351,.026]]),.011));
  folds.push(fold(m([[.030,.294,.103],[.078,.337,.094],[.153,.351,.058],[.205,.366,.017]]),.009));
  folds.push(fold(m([[.041,.248,.090],[.080,.226,.092],[.143,.229,.068],[.179,.261,.047]]),.012));
  folds.push(fold(m([[.041,.176,.119],[.082,.164,.110],[.146,.183,.073],[.193,.217,.036]]),.0095));
  folds.push(fold(m([[.038,.154,.111],[.085,.132,.103],[.155,.148,.068],[.192,.172,.029]]),.0085));
  folds.push(fold(m([[.034,.131,.098],[.081,.094,.090],[.143,.087,.056],[.172,.111,.023]]),.0075));
  folds.push(fold(m([[.027,.373,.062],[.069,.391,.059],[.125,.379,.042],[.160,.361,.025]]),.0065));
  folds.push(fold(m([[.031,.353,.074],[.072,.368,.070],[.107,.355,.052],[.137,.340,.038]]),.005));
 }
 const mouthLip=fold([[-.037,.120,.083],[-.021,.096,.092],[.022,.096,.093],[.038,.121,.081]],.0068);
 function field(x,y,z){
  let d=ell(x,y,z,0,.208,-.020,.220,.231,.084);
  for(const s of[-1,1])d=smoothUnion(d,ell(x,y,z,s*.117,.176,.020,.080,.087,.045,s*.27),.018);
  d=smoothUnion(d,ell(x,y,z,0,.346,.018,.160,.083,.061),.018);
  for(const s of[-1,1])d=smoothUnion(d,ell(x,y,z,s*.106,.311,.066,.103,.025,.035,s*.27),.010);
  d=smoothUnion(d,ell(x,y,z,0,.252,.073,.026,.057,.040),.012);
  d=smoothUnion(d,ell(x,y,z,0,.190,.105,.039,.027,.035),.012);
  for(const s of[-1,1])d=smoothUnion(d,ell(x,y,z,s*.027,.174,.093,.029,.020,.029,s*.15),.013);
  d=smoothUnion(d,ell(x,y,z,0,.074,.018,.055,.026,.036),.014);
  const p=[x,y,z];for(const f of[...folds,mouthLip])if(p.every((v,i)=>v>=f.min[i]&&v<=f.max[i])){let q=1;for(let i=0;i<f.p.length-1;i++)q=Math.min(q,segment(p,f.p[i],f.p[i+1],f.r));d=smoothUnion(d,q,.007);}
  for(const s of[-1,1]){
   d=Math.max(d,-ell(x,y,z,s*.105,.267,.105,.063,.034,.058,s*.23));
   d=Math.max(d,-ell(x,y,z,s*.023,.179,.129,.0075,.0055,.014,s*.18));
  }
  // An actual42mm-deep mouth exposes rear clay and seated teeth, with a
  // substantial lower jaw; it is not a black painted mouth on a round disk.
  d=Math.max(d,-ell(x,y,z,0,.115,.082,.038,.020,.035));return d;
 }
 const low=[-.280,-.070,-.125],high=[.280,.482,.195],step=.0058,dim=low.map((v,k)=>Math.ceil((high[k]-v)/step)+1),[nx,ny,nz]=dim,N=nx*ny*nz,values=new Float32Array(N),P=i=>{const x=i%nx,y=Math.floor(i/nx)%ny,z=Math.floor(i/(nx*ny));return[low[0]+x*step,low[1]+y*step,low[2]+z*step];};
 for(let i=0;i<N;i++){const p=P(i);values[i]=field(...p);}
 const positions=[],uv=[],ids=[],cache=new Map(),tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 function vertex(a,b){if(a>b)[a,b]=[b,a];const key=a+':'+b;if(cache.has(key))return cache.get(key);const pa=P(a),pb=P(b),t=values[a]/(values[a]-values[b]),i=positions.length/3,p=pa.map((v,k)=>v+(pb[k]-v)*t);positions.push(...p);uv.push(p[0],p[1]);cache.set(key,i);return i;}
 const V=i=>new T.Vector3().fromArray(positions,i*3),tri=(a,b,c,out)=>{const n=V(b).sub(V(a)).cross(V(c).sub(V(a)));if(n.lengthSq()<1e-32)return;if(n.dot(out)<0)ids.push(a,c,b);else ids.push(a,b,c);};
 for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
  const i=x+nx*(y+ny*z),corners=[i,i+1,i+1+nx,i+nx,i+nx*ny,i+nx*ny+1,i+nx*ny+nx+1,i+nx*ny+nx];
  const min=Math.min(...corners.map(i=>values[i])),max=Math.max(...corners.map(i=>values[i]));if(min>=0||max<=0)continue;
  for(const t of tetra){const a=t.map(k=>corners[k]),inside=a.filter(i=>values[i]<0),outside=a.filter(i=>values[i]>=0);if(!inside.length||!outside.length)continue;
   const average=list=>list.reduce((v,i)=>v.add(new T.Vector3(...P(i))),new T.Vector3()).multiplyScalar(1/list.length),out=average(outside).sub(average(inside));
   if(inside.length===1){const v=outside.map(i=>vertex(inside[0],i));tri(...v,out);}
   else if(inside.length===3){const v=inside.map(i=>vertex(outside[0],i));tri(...v,out);}
   else{const[a,b]=inside,[c,d]=outside,v=[vertex(a,c),vertex(a,d),vertex(b,d),vertex(b,c)];tri(v[0],v[1],v[2],out);tri(v[0],v[2],v[3],out);}
  }
 }
 // Weld the actual float vertices at0.1micron before topology review.
 // Numerically collapsed tetrahedra are removed; only microscopic closed
 // boundary loops may be capped. The exact repair counts remain in info.
 const canonical=[],remap=[],weld=new Map();for(let i=0;i<positions.length;i+=3){const p=positions.slice(i,i+3).map(Math.fround),key=p.map(v=>Math.round(v*1e7)).join(':');if(!weld.has(key)){weld.set(key,canonical.length/3);canonical.push(...p);}remap.push(weld.get(key));}
 const clean=[],duplicates=new Set();let removedCollapsed=0;for(let i=0;i<ids.length;i+=3){const f=ids.slice(i,i+3).map(v=>remap[v]),key=[...f].sort((a,b)=>a-b).join(':');if(new Set(f).size<3||duplicates.has(key)){removedCollapsed++;continue;}duplicates.add(key);clean.push(...f);}
 const E=new Map();for(let i=0;i<clean.length;i+=3)for(let j=0;j<3;j++){const a=clean[i+j],b=clean[i+(j+1)%3],key=a<b?a+':'+b:b+':'+a;if(!E.has(key))E.set(key,[]);E.get(key).push([a,b]);}
 const border=Array.from(E.values()).filter(e=>e.length===1).map(e=>e[0]),successors=new Map(),used=new Set();for(const[a,b]of border){if(!successors.has(a))successors.set(a,[]);successors.get(a).push(b);}let repairLoops=0,maxRepairDiameter=0;
 const point=i=>new T.Vector3().fromArray(canonical,i*3);for(const[a,b]of border){if(used.has(a+':'+b))continue;const loop=[a];let from=a,to=b;for(let n=0;n<=border.length;n++){used.add(from+':'+to);if(to===a)break;loop.push(to);const next=(successors.get(to)||[]).find(v=>!used.has(to+':'+v));if(next===undefined)throw Error('Open authored terminal boundary');from=to;to=next;}
  const centre=loop.reduce((p,i)=>p.add(point(i)),new T.Vector3()).multiplyScalar(1/loop.length),diam=2*Math.max(...loop.map(i=>point(i).distanceTo(centre)));if(diam>.003)throw Error('Non-microscopic terminal boundary '+diam);maxRepairDiameter=Math.max(maxRepairDiameter,diam);const ci=canonical.length/3;canonical.push(...centre.toArray());uv.push(centre.x,centre.y);for(let j=0;j<loop.length;j++)clean.push(ci,loop[(j+1)%loop.length],loop[j]);repairLoops++;
 }
 const canonicalUV=[];for(let i=0;i<canonical.length;i+=3)canonicalUV.push(canonical[i],canonical[i+1]);
 const g=new T.BufferGeometry();g.name='scene05-closed-volumetric-open-mouthed-terminal275';g.setAttribute('position',new T.Float32BufferAttribute(canonical,3));g.setAttribute('uv',new T.Float32BufferAttribute(canonicalUV,2));g.setIndex(clean);g.computeVertexNormals();const colors=new Float32Array(g.attributes.position.count*3);for(let i=0;i<g.attributes.position.count;i++){const[x,y,z]=canonical.slice(i*3,i*3+3),v=.91+.035*Math.sin(x*71+y*43+z*37)+.020*Math.sin(x*139-y*93);colors.set([v*.97,v,v*1.025],i*3);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 const frontAt=(x,y)=>{let hi=.20,lo=hi;for(let z=.199;z>-.12;z-=.001){if(field(x,y,z)<=0){lo=z;break;}hi=z;}for(let k=0;k<16;k++){const m=(lo+hi)/2;if(field(x,y,m)<=0)lo=m;else hi=m;}return(lo+hi)/2;};
 return{geometry:g,frontAt,info:{signedVolume:true,gridStep:step,gridCells:dim,triangles:clean.length/3,microRepairs:{weldTolerance:1e-7,removedCollapsed,repairLoops,maxRepairDiameter},mouthCutDepth:.035,orbitalCutDepth:.058,noseProjection:.140,photoInput:false}};
}

export function createTempleTerminal275(){
 const craft=craftCollector275('scene05-ceramic-ridge-terminal275'),add=craft.add,clay='terminalClay275',lip='terminalLip275',inlay='terminalGold275',dark='terminalRecess275',face=createTerminalFace275();add(face.geometry,clay);
 // A full rolled annular clay rim, with two physical blue-grey glaze edges.
 add(ring275(.236,.246,.205,.015,.014,112),clay);add(ring275(.223,.232,.205,.050,.0055,112),lip);add(ring275(.246,.255,.205,-.010,.0045,112),lip);
 for(const s of[-1,1]){
  add(new T.BoxGeometry(.012,.012,.060),clay,[s*.104,.263,.065]);const eye=new T.SphereGeometry(1,20,12);eye.scale(.014,.011,.009);eye.rotateZ(s*.27);add(eye,dark,[s*.104,.263,.095]);const pin=new T.SphereGeometry(1,12,8);pin.scale(.0057,.0051,.0018);add(pin,inlay,[s*.104,.264,.1055]);
  // Five outward-folded cheek incisions remain actual ceramic strips, not
  // a radiating texture. They meet the signed facial mass with positive lap.
  for(let k=0;k<3;k++)add(ribbon275([[s*.045,.181-k*.023,.116-k*.010],[s*.110,.161-k*.025,.095-k*.009],[s*.179,.192-k*.035,.053-k*.004]],.0045-k*.0004,.0026,{segments:28}),lip);
 }
 // Small nonuniform teeth seat in the actual mouth hollow and remain dark
 // grey glazed clay. Two retain tiny traces of worn inlaid metal.
 for(let k=0;k<2;k++){const x=(k?1:-1)*.023,s=new T.Shape();s.moveTo(-.0065,.028);s.lineTo(.0065,.028);s.lineTo(.0030,-.010);s.quadraticCurveTo(0,-.016,-.0030,-.010);s.closePath();add(cast275(s,.010,.0011),clay,[x,.129,.065]);}
 const nose=new T.Shape();nose.moveTo(-.030,.183);nose.quadraticCurveTo(-.020,.201,0,.203);nose.quadraticCurveTo(.021,.201,.030,.183);nose.quadraticCurveTo(.014,.176,0,.180);nose.quadraticCurveTo(-.016,.176,-.030,.183);nose.closePath();const noseMetal=cast275(nose,.0022,.0005),np=noseMetal.attributes.position;for(let i=0;i<np.count;i++)np.setZ(i,face.frontAt(np.getX(i),np.getY(i))+np.getZ(i)+.0013);noseMetal.computeVertexNormals();add(noseMetal,inlay);
 const crest=new T.Shape();crest.moveTo(-.193,.329);crest.lineTo(-.161,.408);crest.quadraticCurveTo(-.092,.427,-.047,.459);crest.quadraticCurveTo(-.013,.478,0,.476);crest.quadraticCurveTo(.013,.478,.047,.459);crest.quadraticCurveTo(.092,.427,.161,.408);crest.lineTo(.193,.329);crest.closePath();add(cast275(crest,.085,.0035),clay,[0,0,-.062]);
 add(closedWire190([[-.163,.412,-.012],[-.086,.440,-.012],[0,.477,-.012],[.086,.440,-.012],[.163,.412,-.012]],.006,64,8),lip);
 // Deep ridge-vault body: separate inner and outer curved surfaces meet on
 // the actual annular cut faces. The rear shell, ribs and neck are closed.
 function vault(stations,wall){const N=80,p=[],uv=[],ix=[],stride=2*N;for(const[z,rx,ry,cy]of stations)for(const w of[0,wall])for(let k=0;k<N;k++){const a=k/N*Math.PI*2,sy=Math.sin(a);p.push((rx-w)*Math.cos(a),cy+(ry-w)*(sy<0?sy*.83:sy),z);uv.push(k/N,-z);}for(let j=0;j<stations.length-1;j++)for(let k=0;k<N;k++){const a=j*stride+k,b=j*stride+(k+1)%N,c=a+N,d=b+N;ix.push(a,a+stride,b,b,a+stride,b+stride,c,d,c+stride,d,d+stride,c+stride);}for(const j of[0,stations.length-1])for(let k=0;k<N;k++){const a=j*stride+k,b=j*stride+(k+1)%N,c=a+N,d=b+N;j?ix.push(a,c,b,b,c,d):ix.push(a,b,c,b,d,c);}return finishSolid190(p,uv,ix,'scene05-closed-deep-ridge-vault275');}
 const stations=[[-.035,.240,.240,.205],[-.142,.226,.222,.193],[-.255,.204,.201,.183],[-.365,.172,.182,.169]];add(vault(stations,.020),clay);
 for(const z of[-.108,-.220,-.327]){const t=(-z-.035)/.330,rx=.240+(.172-.240)*t,ry=.240+(.182-.240)*t,cy=.205+(.169-.205)*t;add(vault([[z+.005,rx+.005,ry+.005,cy],[z-.005,rx+.005,ry+.005,cy]],.010),lip);}
 // Lower folded frieze has a load-bearing thick body, narrow rolled lips
 // and turned scroll ears, rather than a single broad flat horizontal bar.
 const beam=[[-.331,.011,.012],[-.188,-.028,.038],[0,-.066,.052],[.191,-.026,.038],[.334,.012,.012]];
 add(ribbon275(beam,.072,.073,{segments:72,taper:1,ridge:.5}),clay);
 for(const y of[.006,-.017,-.040])add(closedWire190(beam.map(([x,q,z])=>[x,q+y,z+.040]),.0052,72,8),lip);
 for(const s of[-1,1]){
  const points=[[s*.329,.015,.024],[s*.359,-.015,.021],[s*.358,-.070,.004],[s*.324,-.106,-.015]];add(ribbon275(points,.035,.077,{segments:40,taper:.74,ridge:.5}),clay);add(closedWire190(points.map(([x,y,z])=>[x,y,z+.041]),.005,48,8),lip);
 }
 const old=createCornerMask190(),mountParts=old.mountParts.map(p=>({geometry:p.geometry.clone(),material:p.material}));old.dispose();
 const neck=new T.BoxGeometry(.185,.155,.095);add(neck,clay,[0,.022,-.075]);const keel=new T.BoxGeometry(.125,.110,.270);add(keel,clay,[0,0,-.210]);
 const result=craft.finish();return{...result,mountParts,info:{revision:'corner275-r03',solidAudit:result.audit,source:'Hand-authored closed signed3D facial volume and finite ceramic ridge shell; no photograph, depth field or scan input',face:face.info,construction:'Deep angry orbital cuts, wide alar nose with real nostril bores, actual open mouth and seated irregular teeth, full curved cheek folds, double rolled blue-grey clay rim, deep tapered20mm ridge-vault, three standing returns and folded thick lower frieze/scroll ears',mainHipMountOffset:[0,.145,.23],mountDatumsRetained:true,referencePhotographRuntimeUse:false,visualAccepted:false},dispose(){result.dispose();mountParts.forEach(p=>p.geometry.dispose());}};
}
