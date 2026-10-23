import * as T from '../../../vendor/build/three.module.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

// CPU mesh authoring only. This reads an actual indexed sculpture, refines its
// existing triangles, and continuously sculpts the connected source surface.
// No renderer, Blender, image/depth input, face replacement, texture or projection.
const ROOT=resolve(import.meta.dirname,'../../..');
const OUT=resolve(import.meta.dirname,'../authored-r05');
const INPUT=resolve(ROOT,'reconstructions/scene-06/assets/nc-sainsbury-amida179-CC-BY-NC-SA-4.0/central-sainsbury-r09-CC-BY-NC-SA-4.0-3e33b700a894f466.bin');
const sha=b=>createHash('sha256').update(b).digest('hex');
const raw=await readFile(INPUT),inputSha=sha(raw);
if(inputSha!=='3e33b700a894f46600ed4ca1a036fcd4f94a3f4773c67b49826eb5d6700190ba')throw Error('Exact SC07 source required');
const sourceCount=raw.readUInt32LE(4),sourceIndexCount=raw.readUInt32LE(8);
if(raw.readUInt32LE(0)!==0x37304353||raw.length!==20+sourceCount*32+sourceIndexCount*4)throw Error('SC07 layout');
const sourceP=new Float32Array(raw.buffer,raw.byteOffset+20,sourceCount*3);
const sourceUV=new Float32Array(raw.buffer,raw.byteOffset+20+sourceCount*24,sourceCount*2);
const sourceI=new Uint32Array(raw.buffer,raw.byteOffset+20+sourceCount*32,sourceIndexCount);
let P=Array.from(sourceP),UV=Array.from(sourceUV),I=Array.from(sourceI);
const parents=[],subdivisionPasses=[];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(x,a,b)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const G=(x,s)=>Math.exp(-((x/s)**2));
const edgeKey=(a,b)=>a<b?a+':'+b:b+':'+a;
function targetEdge(x,y,z){
 if(y>2.13&&Math.abs(x-.065)<.63)return .0045;
 if(y>.51&&y<2.18&&Math.abs(x)<.66&&z>-.53&&z<.17)return .0105;
 if(y>.16&&y<.51&&z>.02)return .014;
 return Infinity;
}
// A shared-edge split also splits every incident triangle, so there are no
// T-junctions or disconnected overlay surfaces at the authoring boundary.
for(let pass=0;pass<3;pass++){
 const split=new Map(),before=P.length/3;
 for(let q=0;q<I.length;q+=3){const a=I[q],b=I[q+1],c=I[q+2];for(const [v,w]of[[a,b],[b,c],[c,a]]){
  const x=(P[v*3]+P[w*3])/2,y=(P[v*3+1]+P[w*3+1])/2,z=(P[v*3+2]+P[w*3+2])/2;
  const limit=targetEdge(x,y,z),length=Math.hypot(P[v*3]-P[w*3],P[v*3+1]-P[w*3+1],P[v*3+2]-P[w*3+2]);
  if(length<=limit||split.has(edgeKey(v,w)))continue;
  const id=P.length/3;split.set(edgeKey(v,w),id);parents.push(v,w);
  P.push(x,y,z);UV.push((UV[v*2]+UV[w*2])/2,(UV[v*2+1]+UV[w*2+1])/2);
 }}
 const next=[];
 for(let q=0;q<I.length;q+=3){const a=I[q],b=I[q+1],c=I[q+2],ab=split.get(edgeKey(a,b)),bc=split.get(edgeKey(b,c)),ca=split.get(edgeKey(c,a));
  const mask=(ab===undefined?0:1)+(bc===undefined?0:2)+(ca===undefined?0:4);
  if(mask===0)next.push(a,b,c);
  if(mask===1)next.push(a,ab,c,ab,b,c);
  if(mask===2)next.push(a,b,bc,a,bc,c);
  if(mask===4)next.push(a,b,ca,b,c,ca);
  if(mask===3)next.push(ab,b,bc,a,ab,c,ab,bc,c);
  if(mask===5)next.push(a,ab,ca,ab,b,c,ab,c,ca);
  if(mask===6)next.push(c,ca,bc,a,b,ca,b,bc,ca);
  if(mask===7)next.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);
 }
 I=next;subdivisionPasses.push({pass,addedVertices:P.length/3-before,vertices:P.length/3,triangles:I.length/3});
 if(I.length/3>2500000)throw Error('Refinement bound exceeded');
}
const baseP=new Float64Array(P),count=P.length/3;
P=new Float64Array(P);I=new Uint32Array(I);UV=new Float32Array(UV);
function normals(points){
 const result=new Float64Array(count*3);
 for(let q=0;q<I.length;q+=3){const a=I[q]*3,b=I[q+1]*3,c=I[q+2]*3;
  const ux=points[b]-points[a],uy=points[b+1]-points[a+1],uz=points[b+2]-points[a+2],vx=points[c]-points[a],vy=points[c+1]-points[a+1],vz=points[c+2]-points[a+2];
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  for(const k of[a,b,c]){result[k]+=nx;result[k+1]+=ny;result[k+2]+=nz;}
 }
 for(let k=0;k<result.length;k+=3){const l=Math.hypot(result[k],result[k+1],result[k+2]);if(l>0){result[k]/=l;result[k+1]/=l;result[k+2]/=l;}}
 return result;
}
const preN=normals(P);
const clothSamples=new Map(),SAMPLE=.020;
// These are samples of the genuine robe surface, not a replacement torso.
// Bounded local surface averaging blends the old U-fold relief into the new
// cloth layer. X/Y coordinates and all source joints stay in place here.
for(let v=0;v<sourceCount;v++){
 const k=v*3,x=baseP[k],y=baseP[k+1],z=baseP[k+2];
 if(y<.49||y>2.14||Math.abs(x)>.65||z<-.51||z>.16||preN[k+2]<.15)continue;
 const key=Math.floor(x/SAMPLE)+','+Math.floor(y/SAMPLE),old=clothSamples.get(key);
 if(!old||z>old[2])clothSamples.set(key,[x,y,z]);
}
function robeAverage(x,y,z){
 const gx=Math.floor(x/SAMPLE),gy=Math.floor(y/SAMPLE);let sum=0,weight=0;
 for(let a=-6;a<=6;a++)for(let b=-6;b<=6;b++){
  const p=clothSamples.get((gx+a)+','+(gy+b));if(!p)continue;
  const w=Math.exp(-((x-p[0])**2+(y-p[1])**2)/(.065**2));sum+=p[2]*w;weight+=w;
 }
 return weight?clamp((sum/weight-z)*.88,-.045,.045):0;
}
const faceSamples=new Map(),FACE_SAMPLE=.008;
for(let v=0;v<sourceCount;v++){
 const k=v*3,x=baseP[k],y=baseP[k+1],z=baseP[k+2];
 if(y<2.25||y>2.73||Math.abs(x-.065)>.29||z<-.19||preN[k+2]<.18)continue;
 const key=Math.floor(x/FACE_SAMPLE)+','+Math.floor(y/FACE_SAMPLE),old=faceSamples.get(key);
 if(!old||z>old[2])faceSamples.set(key,[x,y,z]);
}
function faceAverage(x,y,z,radius,maximum){
 const gx=Math.floor(x/FACE_SAMPLE),gy=Math.floor(y/FACE_SAMPLE);let sum=0,weight=0;
 for(let a=-8;a<=8;a++)for(let b=-8;b<=8;b++){
  const p=faceSamples.get((gx+a)+','+(gy+b));if(!p)continue;
  const w=Math.exp(-((x-p[0])**2+(y-p[1])**2)/(radius*radius));sum+=p[2]*w;weight+=w;
 }
 return weight?clamp((sum/weight-z)*.85,-maximum,maximum):0;
}
// Individually drawn drapery paths follow the photographed fan: variable
// spacing, a short branch, and a tucked lower layer. They are sculpt guides,
// not floating spline tubes or equally spaced parametric crease overlays.
const foldCurves=[
 {name:'upper-shoulder-return',p:[[-.39,1.68],[-.22,1.62],[.04,1.67],[.28,1.82],[.43,1.92]],amp:.010,width:.026},
 {name:'upper-chest-fan',p:[[-.42,1.44],[-.24,1.40],[.02,1.50],[.26,1.68],[.43,1.82]],amp:.016,width:.030},
 {name:'chest-layer-return',p:[[-.43,1.25],[-.24,1.23],[.04,1.33],[.27,1.50],[.44,1.70]],amp:.022,width:.032},
 {name:'middle-main-drape',p:[[-.43,1.05],[-.22,1.05],[.05,1.17],[.26,1.36],[.44,1.58]],amp:.020,width:.028},
 {name:'middle-short-branch',p:[[-.32,1.16],[-.17,1.16],[.02,1.26],[.16,1.40]],amp:.009,width:.023},
 {name:'waist-fan-upper',p:[[-.41,.89],[-.18,.92],[.08,1.05],[.28,1.25],[.43,1.46]],amp:.017,width:.030},
 {name:'waist-fan-deep',p:[[-.37,.75],[-.15,.81],[.10,.93],[.30,1.15],[.44,1.37]],amp:.023,width:.035},
 {name:'lower-layer-wide',p:[[-.42,.63],[-.18,.67],[.10,.81],[.30,1.02],[.44,1.25]],amp:.018,width:.028},
 {name:'lower-layer-return',p:[[-.38,.55],[-.12,.58],[.13,.69],[.31,.88],[.44,1.10]],amp:.013,width:.027},
 {name:'right-waist-tuck',p:[[.10,.54],[.26,.67],[.40,.86],[.47,1.07]],amp:.015,width:.026}
];
function curveAt(points,x){
 let j=0;while(j<points.length-2&&x>points[j+1][0])j++;
 const a=points[j],b=points[j+1],p=points[Math.max(0,j-1)],q=points[Math.min(points.length-1,j+2)],h=b[0]-a[0],t=clamp((x-a[0])/h),m0=(b[1]-p[1])/(b[0]-p[0]),m1=(q[1]-a[1])/(q[0]-a[0]);
 return{y:(2*t*t*t-3*t*t+1)*a[1]+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*b[1]+(t*t*t-t*t)*h*m1,slope:((6*t*t-6*t)*a[1]+(3*t*t-4*t+1)*h*m0+(-6*t*t+6*t)*b[1]+(3*t*t-2*t)*h*m1)/h,fade:smooth(x,points[0][0],points[0][0]+.055)*(1-smooth(x,points.at(-1)[0]-.045,points.at(-1)[0]))};
}
const sleeveGuides=[
 {p:[[.64,.93],[.86,.86],[1.10,.76],[1.36,.68],[1.66,.55]],amp:.011,width:.016},
 {p:[[.68,.97],[.90,.90],[1.15,.80],[1.42,.72],[1.72,.58]],amp:.009,width:.013},
 {p:[[.75,.99],[.97,.94],[1.23,.85],[1.51,.75]],amp:.012,width:.015},
 {p:[[.66,.87],[.86,.80],[1.06,.71],[1.24,.62]],amp:.008,width:.012},
 {p:[[.78,.85],[.96,.79],[1.12,.70],[1.31,.61]],amp:.008,width:.011}
];
for(let v=0;v<count;v++){
 const k=v*3,x=baseP[k],y=baseP[k+1],z=baseP[k+2],u=x-.065,nz=preN[k+2];
 let dx=0,dy=0,dz=0,relief=0;
 const head=smooth(y,2.04,2.31),front=smooth(z,-.31,-.12);
 dx+=(-.09*u-.065)*head;
 dx-=.035*u*front*G(y-2.275,.10);
 dx-=.08*u*smooth(y,2.79,2.91);
 const face=smooth(y,2.12,2.26)*(1-smooth(y,2.78,2.90));
 dy+=.12*(y-2.50)*face;
 dy-=.20*Math.max(0,y-2.82)*smooth(y,2.82,2.98);
 dz-=.078*G(y-2.870,.110)*smooth(z,-.12,.035);
 for(const side of[-1,1]){
  const ex=u-side*.132;
  // Raise and round the existing lids; the actual eyelid triangles remain.
  dy+=front*.016*G(ex,.058)*G(y-2.550,.050);
  // Integrate the original upper-orbit creases before adding one soft lid
  // volume. R03's extra narrow ridges are deliberately not retained.
  const orbitalRelax=front*(1-smooth(Math.abs(ex),.102,.145))*smooth(y,2.564,2.583)*(1-smooth(y,2.659,2.687));
  if(orbitalRelax>.001)dz+=orbitalRelax*.25*faceAverage(x,y,z,.027,.012);
  dz+=front*(.006*G(ex,.085)*G(y-2.585,.035)+.007*G(ex,.108)*G(y-2.625,.038)+.005*G(ex,.085)*G(y-2.607,.031)+.004*G(ex,.108)*G(y-2.649,.027));
  dz-=front*.003*G(ex,.083)*G(y-2.562,.009);
  dz-=front*.009*G(u-side*.176,.078)*G(y-2.365,.11);
  dy+=front*.0035*G(u-side*.090,.026)*G(y-2.352,.036);
 }
 dz+=front*(.020*G(u,.034)*G(y-2.557,.105)+.008*G(u,.060)*G(y-2.670,.049));
 const mouth=front*G(y-2.352,.040)*Math.exp(-((u/.145)**4));
 const mouthRelax=front*(1-smooth(Math.abs(u),.09,.135))*smooth(y,2.302,2.320)*(1-smooth(y,2.386,2.405));
 if(mouthRelax>.001)dz+=mouthRelax*.18*faceAverage(x,y,z,.025,.012);
 dx+=u*.10*mouth;dy-=.16*(y-2.355)*mouth;dz-=.007*mouth;
 dz-=front*(.003*G(u,.026)*G(y-2.374,.020)+.004*G(u,.060)*G(y-2.329,.022));
 dz+=front*.006*G(u,.10)*G(y-2.245,.062);
 // Ridges and adjacent valleys are displacement of the robe's own surface.
 const cloth=smooth(y,.53,.63)*(1-smooth(y,1.88,2.00))*(1-smooth(Math.abs(x),.43,.61))*smooth(z,-.46,-.32)*(1-smooth(z,.025,.15))*smooth(nz,.05,.36);
 if(cloth>.001)dz+=cloth*robeAverage(x,y,z);
 for(const guide of foldCurves){
  const curve=curveAt(guide.p,x),d=(y-curve.y)/Math.sqrt(1+curve.slope**2);
  relief+=cloth*curve.fade*(guide.amp*G(d,guide.width)-guide.amp*.34*G(d-.037,guide.width*.55));
 }
 // A narrow, chased edge follows the source shoulder-to-waist cloth. Its
 // small pattern is cut in relief, with no detached jewelry or gold sheet.
 const borderMask=smooth(y,.62,.72)*(1-smooth(y,1.83,1.96))*smooth(z,-.49,-.33)*(1-smooth(z,.03,.16))*smooth(nz,-.15,.35);
 const borderX=.425+.023*Math.sin((y-.68)*2.8),b=x-borderX;
 relief+=borderMask*(.008*G(b-.021,.013)+.008*G(b+.021,.013)-.004*G(b,.015));
 for(let j=0;j<16;j++){
  const cy=.70+j*.073,dyc=y-cy;
  relief+=borderMask*.007*(G(b-.011-Math.sin(j)*dyc*.24,.012)*G(dyc,.024)+G(b+.011+dyc*.24,.010)*G(dyc-.022,.019));
 }
 const leftEdge=x+.435-.036*(y-1.15);
 relief+=borderMask*.008*G(leftEdge,.013);
 // Three annular throat folds are carved into the actual continuous neck.
 const throat=smooth(y,1.96,2.00)*(1-smooth(y,2.16,2.20))*(1-smooth(Math.abs(u),.19,.29))*smooth(z,-.39,-.26)*smooth(nz,-.1,.3);
 for(const cy of[2.017,2.076,2.135])relief+=throat*(.0065*G(y-cy,.016)-.0030*G(y-cy-.024,.010));
 // Garment tension fans along the original continuous arms, stopping before
 // the projecting palm/finger surfaces. No sleeve sheets or arm replacement.
 const arm=smooth(Math.abs(x),.50,.65)*(1-smooth(Math.abs(x),.98,1.10))*smooth(y,.58,.70)*(1-smooth(y,1.70,1.87))*(1-smooth(z,.17,.29))*smooth(nz,-.05,.30);
 for(let j=0;j<sleeveGuides.length;j++){
  const guide=sleeveGuides[j],sample=curveAt(guide.p,y),d=(Math.abs(x)-sample.y)/Math.sqrt(1+sample.slope**2),asym=x<0?.93:1.07;
  relief+=arm*sample.fade*asym*(guide.amp*G(d,guide.width)-guide.amp*.40*G(d-.020,guide.width*.60));
 }
 // Smaller leg folds retain all original knee/foot volume and the seat band.
 const lap=smooth(y,.13,.20)*(1-smooth(y,.48,.54))*smooth(z,.06,.20)*smooth(nz,-.10,.45)*(1-smooth(Math.abs(x),1.10,1.19));
 for(let j=0;j<4;j++){const yy=.135+j*.057+.15*(1-Math.abs(x))+.055*(Math.abs(x)-.58)**2;relief+=lap*.0085*G(y-yy,.013);}
 relief=clamp(relief,-.040,.057);
 P[k]+=dx;P[k+1]+=dy;P[k+2]+=dz+relief;
}
let N=normals(P);
const preHair=new Float64Array(P),rootGrid=new Map(),roots=[],CELL=.030,SEP=.024;
function gridKey(x,y,z){return Math.floor(x/CELL)+','+Math.floor(y/CELL)+','+Math.floor(z/CELL);}
function hairWeight(v){const k=v*3,x=baseP[k],y=baseP[k+1],z=baseP[k+2],phi=Math.atan2(x-.065,z+.25),line=2.765-.08*(1-Math.cos(phi))+.045*Math.sin(phi)**2;return smooth(y,line,line+.022);}
function hashInt(i){let x=(i^0x571aaec7)>>>0;x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return(x^(x>>>16))>>>0;}
const candidates=[];
for(let v=0;v<count;v++)if(hairWeight(v)>.98)candidates.push(v);
candidates.sort((a,b)=>hashInt(a)-hashInt(b));
for(const v of candidates){const k=v*3,x=P[k],y=P[k+1],z=P[k+2],gx=Math.floor(x/CELL),gy=Math.floor(y/CELL),gz=Math.floor(z/CELL);let valid=true;
 for(let a=-1;a<=1&&valid;a++)for(let b=-1;b<=1&&valid;b++)for(let c=-1;c<=1&&valid;c++)for(const id of rootGrid.get((gx+a)+','+(gy+b)+','+(gz+c))??[]){const r=roots[id];if(Math.hypot(x-r.p[0],y-r.p[1],z-r.p[2])<SEP){valid=false;break;}}
 if(!valid)continue;
 const no=new T.Vector3(N[k],N[k+1],N[k+2]),up=new T.Vector3(0,1,0);if(Math.abs(no.dot(up))>.93)up.set(1,0,0);
 const U=up.cross(no).normalize(),V=no.clone().cross(U).normalize();
 const r={p:[x,y,z],normal:no.toArray(),U:U.toArray(),V:V.toArray(),vertex:v,radius:.0170,height:.0072*(.94+.12*(hashInt(v+9)/4294967295)),phase:hashInt(v+27)/4294967295*Math.PI*2};
 const id=roots.length;roots.push(r);const key=gridKey(x,y,z);if(!rootGrid.has(key))rootGrid.set(key,[]);rootGrid.get(key).push(id);
}
for(let v=0;v<count;v++){
 const weight=hairWeight(v);if(!weight)continue;const k=v*3,x=P[k],y=P[k+1],z=P[k+2],gx=Math.floor(x/CELL),gy=Math.floor(y/CELL),gz=Math.floor(z/CELL);let depth=0;
 for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++)for(const id of rootGrid.get((gx+a)+','+(gy+b)+','+(gz+c))??[]){
  const root=roots[id],d=[x-root.p[0],y-root.p[1],z-root.p[2]],dot=a=>d[0]*a[0]+d[1]*a[1]+d[2]*a[2],u=dot(root.U),w=dot(root.V),r=Math.hypot(u,w)/root.radius;
  if(r>1.65||Math.abs(dot(root.normal))>.014)continue;
  const phase=Math.atan2(w,u)-root.phase+6.2*(1-r),wrapped=Math.atan2(Math.sin(phase),Math.cos(phase));
  const mound=root.height*Math.pow(Math.max(0,1-r*r),1.20),spiral=.0042*G(wrapped,.42)*smooth(r,.17,.32)*(1-smooth(r,.83,1.0));
  depth+=mound-spiral;
 }
 const radial=new T.Vector3(x,y-2.78,z+.25).normalize();depth*=weight;
 P[k]+=radial.x*depth;P[k+1]+=radial.y*depth;P[k+2]+=radial.z*depth;
}
N=normals(P);
const out=Buffer.alloc(20+count*32+I.length*4);out.writeUInt32LE(0x37304353,0);out.writeUInt32LE(count,4);out.writeUInt32LE(I.length,8);out.writeUInt32LE(1,12);out.writeUInt32LE(0,16);
let at=20;for(const values of[P,N,UV]){new Float32Array(out.buffer,out.byteOffset+at,values.length).set(values);at+=values.length*4;}new Uint32Array(out.buffer,out.byteOffset+at,I.length).set(I);
const outputSha=sha(out),file='continuous-sculpt199-r05-'+outputSha.slice(0,16)+'.bin';
const delta=Buffer.alloc(20+count*12);delta.write('SD19',0,'ascii');delta.writeUInt32LE(count,4);delta.writeUInt32LE(sourceCount,8);delta.writeUInt32LE(parents.length/2,12);delta.writeUInt32LE(1,16);
const deltaValues=new Float32Array(delta.buffer,delta.byteOffset+20,count*3),stats={all:0,face:0,robe:0,scalp:0,seat:0};let changed=0;
const bounds=[[Infinity,Infinity,Infinity],[-Infinity,-Infinity,-Infinity]];
for(let v=0;v<count;v++){const k=v*3;for(let j=0;j<3;j++){deltaValues[k+j]=P[k+j]-baseP[k+j];bounds[0][j]=Math.min(bounds[0][j],P[k+j]);bounds[1][j]=Math.max(bounds[1][j],P[k+j]);}
 const d=Math.hypot(...deltaValues.slice(k,k+3));if(d>1e-8)changed++;stats.all=Math.max(stats.all,d);if(baseP[k+1]>2.15&&baseP[k+1]<2.8)stats.face=Math.max(stats.face,d);if(baseP[k+1]>.5&&baseP[k+1]<2)stats.robe=Math.max(stats.robe,d);if(hairWeight(v))stats.scalp=Math.max(stats.scalp,d);if(baseP[k+1]<=.13)stats.seat=Math.max(stats.seat,d);
}
if(stats.all>.16||stats.seat!==0)throw Error('Bounded sculpt or seat-contact invariant failed');
const parentBytes=Buffer.from(new Uint32Array(parents).buffer);
const material={baseColorLinear:[.5647115111351013,.3613067865371704,.08865558356046677,1],metalness:.88,roughness:.47};
const attribution='Scan-the-World, Seated Amida, the Buddha of the Western Paradise at the Sainsbury Centre for Visual Arts, Norwich. Zenodo 21353739, https://doi.org/10.5281/zenodo.21353739 . CC BY-NC-SA 4.0. Sculpture199 is a declared nonrigid sculpted derivative: shared-edge refinement, bounded local averaging of the actual robe surface, narrower elongated source face, rounded existing lids with locally integrated upper-orbit source relief and soft single lid/brow volumes, quieter original lips and nasal-ridge sculpt, continuous neck rings, oblique robe folds, chased cloth edge and source-arm sleeve folds, smaller scalp silhouette and fine shallow carved curls. Original SC07 and source GLBs retained unchanged. No endorsement implied.';
const provenance={revision:'scene06-sculpture199-r05',status:'isolated-native-review-required',visualAccepted:false,license:'CC-BY-NC-SA-4.0',licenseUrl:'https://creativecommons.org/licenses/by-nc-sa/4.0/',personalNoncommercialUseOnly:true,attribution,input:{file:INPUT,sha256:inputSha,vertices:sourceCount,triangles:sourceIndexCount/3},method:'Bounded continuous displacement of the actual source mesh with conforming shared-edge refinement. Existing neck/ears/arms and original manifold connectivity retained. No replacement face/head, photo projection, depth cards, floating cloth or separate hair sweeps.',originalRawAssetUnchanged:sha(await readFile(INPUT))===inputSha,sourceFacePreservedUnchanged:false,sourceNormalsPreservedUnchanged:false,sourceIndicesPreservedUnchanged:false,sourceTopologyDerivation:{subdivisionPasses,parentFile:'midpoint-parent-pairs199-r05.bin',parentSha256:sha(parentBytes),parentRecord:'Each new vertex, in increasing ID order after original source vertices, is the arithmetic midpoint of this pair of already-existing vertex IDs. Source triangles are subdivided conformingly. UVs interpolate by the same map.'},sculptDelta:{file:'continuous-displacement199-r05.bin',sha256:sha(delta),format:'SD19 header 20 bytes: ASCII SD19, uint32 allVertexCount, originalSourceCount, parentPairCount, version1; then little-endian float32 XYZ displacement from original vertices plus recursively constructed source-edge midpoint vertices.',changedVertices:changed,maxDisplacementSourceUnits:stats},geometry:{file,sha256:outputSha,vertices:count,triangles:I.length/3,bytes:out.length,bounds},compactCurls:{count:roots.length,separation:SEP,maximumReliefPerCurl:.0077,spiralGrooveDepth:.0042,method:'Poisson selected actual scalp surface vertices; smooth summed compact curl relief and shallow grooves are sculpted into the same continuous high-resolution scalp, along a smooth radial field. No nearest-cell discontinuities or added worms/pins.'},sculptGuides:{faceCenterX:.065,headWidthScale:.91,headCenterCorrection:-.065,faceLengthDeltaScale:.12,capHeightScale:.80,lidRoundLift:.016,nasalRidgeForward:.020,orbitalSourceAverage:{radius:.027,maximumRawDelta:.012,strength:.25,maximumEffectiveDelta:.003},mouthSourceAverage:{radius:.025,maximumRawDelta:.012,strength:.18,maximumEffectiveDelta:.00216},upperLidVolume:{centerY:2.607,widthX:.085,widthY:.031,relief:.005},browVolume:{centerY:2.649,widthX:.108,widthY:.027,relief:.004},capAdditionalWidthScale:.92,mouthVerticalDeltaScale:-.16,clothFoldPaths:foldCurves,sleeveFoldPaths:sleeveGuides,robeSourceAverageRadius:.065,robeSourceAverageMaximumDelta:.045,robeReliefDirection:"+Z with original XY retained",foldRidgeHeightRange:[.009,.023],neckRingCenters:[2.017,2.076,2.135],seatBandMaximumY:.13},goldMaterial:material,builder:{file:import.meta.filename,sha256:sha(await readFile(import.meta.filename))},limits:['This is a hand-sculpted reconstruction derivative of a different surviving artifact, not exact photogrammetry of the reference.','No face or garment likeness is accepted by authoring metrics.','Actual front, true three-quarter, profile, body and published-view comparison must be inspected before any adoption.','No renderer/light/material/camera changes, physical export, Blend or movie.']};
const originalManifest=JSON.parse(await readFile(resolve(INPUT,'../manifest.json'),'utf8'));
const manifest={...originalManifest,revision:provenance.revision,productionIntegrated:false,visualAccepted:false,attribution,derivativeOf:provenance.input,variants:{central:[{material:'central',file,vertices:count,triangles:I.length/3,bytes:out.length,sha256:outputSha,topology:{sourceMeshDerivative:true,nonrigidDeformation:true,sourceFacePreservedUnchanged:false,conformingSubdivision:true,originalContactBandPreserved:true}}]},materials:{central:material},sourceContactBearing:{...originalManifest.sourceContactBearing,sourceBodyChanged:true,originalContactBandPreserved:true,contactBandPositionsUnchanged:true},nativeMaterialStudyChange:'Sculpture199: unchanged source gold PBR on a declared sculpted source derivative; original SC07 kept unchanged.'};
await mkdir(OUT,{recursive:true});await writeFile(resolve(OUT,file),out);await writeFile(resolve(OUT,'continuous-displacement199-r05.bin'),delta);await writeFile(resolve(OUT,'midpoint-parent-pairs199-r05.bin'),parentBytes);await writeFile(resolve(OUT,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');await writeFile(resolve(OUT,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
console.log(JSON.stringify({revision:provenance.revision,file,vertices:count,triangles:I.length/3,bytes:out.length,compactCurls:roots.length,maxDisplacement:stats,sourceRawUnchanged:provenance.originalRawAssetUnchanged,visualAccepted:false},null,2));
