import * as T from 'three';
import {createClayTile05} from './handlaid-ceramic319.js';
const hash=x=>{const a=Math.sin(x*127.17+17.13)*43758.5453;return a-Math.floor(a);};
function eaveParts319(){
 const profile=[[0,-.019],[.074,-.019],[.090,-.010],[.094,.003],[.090,.016],[.079,.020],[.072,.010],[0,.010]],cap=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),36);cap.rotateX(Math.PI/2);cap.name='scene07-319-closed-moulded-ceramic-eave-disc';
 const flower=new T.Shape();for(let j=0;j<=80;j++){const a=j/80*Math.PI*2,r=.032+.010*Math.pow(.5+.5*Math.cos(a*8),.75),x=Math.cos(a)*r,y=Math.sin(a)*r;j?flower.lineTo(x,y):flower.moveTo(x,y);}flower.closePath();const crest=new T.ExtrudeGeometry(flower,{depth:.007,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:2,steps:1});crest.translate(0,0,.020);crest.name='scene07-319-closed-raised-clay-end-flower';
 const w=.208,s=new T.Shape();s.moveTo(-w/2,.018);s.lineTo(w/2,.018);s.lineTo(w*.48,-.025);s.quadraticCurveTo(w*.20,-.053,0,-.056);s.quadraticCurveTo(-w*.20,-.053,-w*.48,-.025);s.closePath();const drip=new T.ExtrudeGeometry(s,{depth:.022,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1,steps:1});drip.translate(0,0,-.005);drip.name='scene07-319-closed-rain-pan-drip-mouth';return{cap,crest,drip};
}
const ends=eaveParts319();
export const eavePrototypes319=()=>Object.values(ends);
export function buildHandlaidFace319({face,w,d,ridge,cut,P,frame,draw,ceramic,worn}){
 const hw=w/2,hd=d/2,width=face%2?d:w,lanes=Math.max(12,Math.round(width/.255)),pitch=width/lanes,coverWidth=Math.min(.178,pitch*.72),counts={cover:0,pan:0,eaveDisc:0,dripMouth:0};
 const parallel=face%2===0,baseT=face%2?cut:.008,hipStart=x=>Math.abs(x)<=ridge?.008:cut+(1-cut)*(Math.abs(x)-ridge)/(hw-ridge);
 const point=(t,q)=>P(face,t,parallel?q/(ridge+(hw-ridge)*Math.max(0,(t-cut)/(1-cut))):q);
 const cuts=(lo,hi,n,phase)=>{const step=(hi-lo)/n,ts=[lo];for(let t=lo+phase*step;t<hi-.00001;t+=step)if(t>lo+step*.06)ts.push(t);ts.push(hi);return ts.slice(0,-1).map((a,i)=>[a,Math.min(hi,ts[i+1]+step*.065)]);};
 function tileRun(q,lo,hi,width,cover,lane,phase){if(!(lo<hi-.0001))return;const a=new T.Vector3(...point(lo,q)),b=new T.Vector3(...point(hi,q)),courses=Math.max(3,Math.ceil(a.distanceTo(b)/.36));for(const[j,[ta,tb]]of cuts(lo,hi,courses,phase).entries()){
  const pts=Array.from({length:5},(_,k)=>point(ta+(tb-ta)*k/4,q)),g=createClayTile05(pts,width,{cover,variant:face*19+lane*1.37+j*.71});g.name=cover?'scene07-319-closed-staggered-cover-tile':'scene07-319-closed-staggered-concave-pan';draw(g,ceramic);counts[cover?'cover':'pan']++;
 }}
 function endAt(q,pan=false){const t=pan?1.004:1.014,u=parallel?q/(ridge+(hw-ridge)*(t-cut)/(1-cut)):q,f=frame(face,t,u),basis=new T.Matrix4().makeBasis(f.across,f.up,f.tangent),p=f.c.clone().addScaledVector(f.up,pan?.006:.025).addScaledVector(f.tangent,.015);basis.setPosition(p);if(pan){draw(ends.drip.clone().applyMatrix4(basis),worn);counts.dripMouth++;}else{draw(ends.cap.clone().applyMatrix4(basis),worn);draw(ends.crest.clone().applyMatrix4(basis),worn);counts.eaveDisc++;}}
 for(let i=0;i<=lanes;i++){
  const q=parallel?-hw+i*pitch:-1+2*i/lanes,lo=parallel?Math.max(baseT,hipStart(Math.abs(q)+coverWidth/2)):baseT,phase=.08+.39*hash(i+face*17);
  tileRun(q,lo,1.014,coverWidth,true,i,phase);endAt(q,false);
  if(i<lanes){const mid=parallel?q+pitch/2:q+1/lanes,edge=parallel?Math.abs(mid)+pitch*.46:0,pl=parallel?Math.max(baseT,hipStart(edge)):baseT;tileRun(mid,pl,1.004,pitch*.88,false,i,(phase+.48)%1);endAt(mid,true);}
 }
 return counts;
}
export function ridgeTile319(x0,x1,y,variant=0){const g=createClayTile05([[x0,y,0],[(x0+x1)/2,y,0],[x1,y,0]],.34,{cover:true,variant});const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,y+(p.getY(i)-y)*1.8);g.computeVertexNormals();g.name='scene07-319-closed-crowned-ridge-cover';return g;}
