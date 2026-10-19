// Bounded single-view rigid pose/dimension fit, not an image warp or survey.
import {model,prior} from './project-points.mjs';
import {writeFile} from 'node:fs/promises';
const observations=[
 {id:'backR5',label:'5 rear-right visible eave end',reference:[284,266],actual:null,uncertainty:5,fit:true,occlusion:'Baseline actual rear corner covered by main hall; photo target is visible'},
 {id:'tip',label:'Finial tip',reference:[190,75],actual:[233,129],uncertainty:2,fit:true},
 {id:'L5',label:'5 front-left raised eave end',reference:[56,215],actual:[79,250],uncertainty:8,fit:true,occlusion:'Baseline corner partly hidden by maple; manual visible fragment only'},
 {id:'R5',label:'5 front-right raised eave end',reference:[234,210],actual:[297,250],uncertainty:5,fit:true,occlusion:'Baseline tip partly hidden by main hall'},
 {id:'L4',label:'4 front-left raised eave end',reference:[50,279],actual:[65,303],uncertainty:5,fit:true},
 {id:'R4',label:'4 front-right raised eave end',reference:[234,272],actual:[298,310],uncertainty:5,fit:true},
 {id:'L3',label:'3 front-left raised eave end',reference:[50,339],actual:[56,351],uncertainty:5,fit:true},
 {id:'R3',label:'3 front-right raised eave end',reference:[234,333],actual:null,uncertainty:5,fit:false,occlusion:'Baseline hall overlaps tip'},
 {id:'L2',label:'2 front-left eave end',reference:null,actual:[53,413],uncertainty:5,fit:false,occlusion:'Photograph lower gallery/flowers hide actual corner; roof fragment does not identify corner'},
 {id:'R2',label:'2 front-right eave end',reference:null,actual:null,fit:false,occlusion:'Gallery and main hall'},
 {id:'L1',label:'1 front-left eave end',reference:null,actual:null,fit:false,occlusion:'Lower gallery and planting'},
 {id:'R1',label:'1 front-right eave end',reference:null,actual:null,fit:false,occlusion:'Lower gallery and planting'},
 {id:'ridgeL5',label:'5 visible ridge-seat left end',reference:[170,190],actual:null,uncertainty:4,fit:true,occlusion:'Baseline long ridge screened by near eave and maple. Original seat remains a target-outline constraint, not an invented actual point'},
 {id:'ridgeR5',label:'5 visible ridge-seat right end',reference:[202,191],actual:null,uncertainty:4,fit:true,occlusion:'Baseline long ridge screened by near eave and maple'},
 ...[4,3,2,1].flatMap(i=>['L','R'].map(side=>({id:'ridge'+side+i,label:i+' ridge '+side,reference:null,actual:null,fit:false,occlusion:'Next storey, upper eave and/or gallery prevent reliable ridge-end observation'})))
];
const lo=[-18,.65,4.3,1.6,-.4,.8,.04,16.2,.65],hi=[-14,.95,6,2.4,.4,2.6,.25,20,1.05];
function configuration(p){return{...prior,position:[p[0],2,-12.0044],widthScale:p[1],eaves:Array.from({length:5},(_,i)=>p[2]+p[3]*i),yaw:p[4],rise:p[5],ridgeRatio:p[6],top:p[7],depthRatio:p[8]};}
function residual(p){const m=model(configuration(p));return observations.filter(x=>x.fit).flatMap(o=>o.reference.map((v,k)=>(m[o.id][k]-v)/(o.uncertainty||5)));}
const cost=p=>residual(p).reduce((s,v)=>s+v*v,0);
let p=[-15.9,.82,4.8,1.9,-.08,1.75,.1,18,.85],steps=[.2,.02,.12,.05,.025,.12,.02,.12,.015];
for(let sweep=0;sweep<600;sweep++){
 let improved=false;for(let k=0;k<p.length;k++){let best=p,bestCost=cost(p);for(const s of[-1,1]){const q=p.slice();q[k]=Math.max(lo[k],Math.min(hi[k],q[k]+steps[k]*s));const c=cost(q);if(c<bestCost){best=q;bestCost=c;}}if(best!==p){p=best;improved=true;}}
 if(!improved)steps=steps.map(v=>v*.65);if(Math.max(...steps)<1e-5)break;
}
// Correlated height/plan parameters are then refined by damped least squares.
function solve(a,b){const n=b.length,A=a.map((r,i)=>[...r,b[i]]);for(let k=0;k<n;k++){let q=k;for(let j=k+1;j<n;j++)if(Math.abs(A[j][k])>Math.abs(A[q][k]))q=j;[A[k],A[q]]=[A[q],A[k]];const d=A[k][k];if(Math.abs(d)<1e-14)return null;for(let j=k;j<=n;j++)A[k][j]/=d;for(let i=0;i<n;i++)if(i!==k){const d=A[i][k];for(let j=k;j<=n;j++)A[i][j]-=d*A[k][j];}}return A.map(r=>r[n]);}
let damping=.01;
for(let iter=0;iter<180;iter++){
 const r=residual(p),J=Array.from({length:r.length},()=>[]);
 for(let k=0;k<p.length;k++){const q=p.slice(),eps=1e-5;q[k]+=eps;const d=residual(q);for(let j=0;j<r.length;j++)J[j][k]=(d[j]-r[j])/eps;}
 const A=p.map((_,i)=>p.map((_,j)=>J.reduce((s,row)=>s+row[i]*row[j],0))),b=p.map((_,i)=>-J.reduce((s,row,k)=>s+row[i]*r[k],0));for(let i=0;i<p.length;i++)A[i][i]+=damping*(A[i][i]+1);
 const d=solve(A,b);if(!d)break;const q=p.map((v,k)=>Math.max(lo[k],Math.min(hi[k],v+d[k])));
 if(cost(q)<cost(p)){p=q;damping=Math.max(1e-9,damping*.4);if(Math.max(...d.map(Math.abs))<1e-8)break;}else damping*=8;
 if(damping>1e12)break;
}

const c=configuration(p),prediction=model(c),used=observations.filter(o=>o.fit),rmse=Math.sqrt(used.reduce((s,o)=>s+o.reference.reduce((a,v,k)=>a+(prediction[o.id][k]-v)**2,0),0)/(used.length*2));
const result={status:'2d-observation-and-bounded-pinhole-fit-before-render',sourceImageSize:[1254,1254],coordinateSystem:'Top-left origin, x right, y down. Native pixels; no image registration or warp.',observations,prior,priorProjection:model(prior),fittedParameters:c,parameterNames:['x','plan width factor','first eave','storey pitch','yaw','roof rise','ridge half-width ratio','top','roof/frame depth/width ratio'],parameterVector:p,parameterBounds:{lo,hi},predictedPoints:prediction,predictedCoordinateRMSEPixels:rmse,assumptions:['Camera/depth/vertical base anchor and original uniform assembly scale held fixed. A single image does not determine absolute depth.','Eave end centreline projections fitted within manual-point uncertainty. Actual geometry/raster silhouettes require fresh native review.','Original top ridge seat is a visible short outline constraint, not evidence of exact hidden framing.'],materialsChanged:false,gardenSeedChanged:false,visualAccepted:false};
await writeFile(new URL('./observations-and-fit.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify({fitted:c,rmse,predicted:used.map(o=>({id:o.id,target:o.reference,xy:prediction[o.id]}))},null,2));
