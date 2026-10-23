import {createCurvedEaveRafter} from './scene03-curved-rafter.js';

// New small-section, carved timber kit. Cross sections are lofted with flat
// working seats, rounded arrises, canted cheeks and actual incised channels.
// The R09 rectangular copper end plates and their repeated crests are absent.
export function createKumimono211(T,{emit,grouped,keep=g=>g}){
 const prototypes=[],seats=[];let instances=0;
 const V=a=>new T.Vector3(...a),smooth=T.MathUtils.smoothstep;
 function own(g,name){
  const p=g.attributes.position;if(!Array.from(p.array).every(Number.isFinite))throw Error('Nonfinite carved timber');
  const ix=g.index?.array??Uint32Array.from({length:p.count},(_,i)=>i);let volume=0;for(let i=0;i<ix.length;i+=3)volume+=new T.Vector3().fromBufferAttribute(p,ix[i]).dot(new T.Vector3().fromBufferAttribute(p,ix[i+1]).cross(new T.Vector3().fromBufferAttribute(p,ix[i+2])))/6;
  if(volume<0){if(g.index){for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];g.index.needsUpdate=true;}else throw Error('Expected indexed timber');}
  g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();g.name=name;g.userData={closedTimberSolid:true,workingSeatsFlat:true,carvedCheeks:true,referenceRGB:false};prototypes.push(g);return keep(g);
 }
 function roundedSection(top,bottom,depth){
  const r=Math.min(.012,(top-bottom)*.16,depth*.08),a=[],add=(z,y)=>a.push([z,y]);
  for(let i=0;i<7;i++)add(depth/2-r-(depth-2*r)*i/7,top);
  for(let i=0;i<5;i++){const t=i/5*Math.PI/2;add(-depth/2+r-r*Math.sin(t),top-r+r*Math.cos(t));}
  for(let i=0;i<15;i++)add(-depth/2,top-r-(top-bottom-2*r)*i/15);
  for(let i=0;i<5;i++){const t=i/5*Math.PI/2;add(-depth/2+r-r*Math.cos(t),bottom+r-r*Math.sin(t));}
  for(let i=0;i<7;i++)add(-depth/2+r+(depth-2*r)*i/7,bottom);
  for(let i=0;i<5;i++){const t=i/5*Math.PI/2;add(depth/2-r+r*Math.sin(t),bottom+r-r*Math.cos(t));}
  for(let i=0;i<15;i++)add(depth/2,bottom+r+(top-bottom-2*r)*i/15);
  for(let i=0;i<5;i++){const t=i/5*Math.PI/2;add(depth/2-r+r*Math.cos(t),top-r+r*Math.sin(t));}return a;
 }
 function hijiki(length,depth,lap,slots=[0],seatWidth=depth){
  const half=length/2,rows=[];for(let j=0;j<=56;j++)rows.push({x:-half+length*j/56});
  const boundaries=slots.flatMap(s=>[s-seatWidth/2,s+seatWidth/2]).filter(x=>x>-half&&x<half);
  const inside=x=>slots.some(s=>Math.abs(x-s)<seatWidth/2-1e-9);
  for(const x of boundaries)rows.push({x,side:-1},{x,side:1});
  rows.sort((a,b)=>a.x-b.x||(a.side??0)-(b.side??0));
  const p=[],uv=[],ids=[];let N;
  for(const row of rows){
   const x=row.x,e=Math.abs(x)/half,test=x+(row.side??0)*1e-6,notch=inside(test),seat=slots.length?smooth(Math.min(...slots.map(s=>Math.abs(x-s)-seatWidth/2)),0,.055):1;
   let top=.100+.023*smooth(e,.83,1),bottom=-.100+(-.075*smooth(e,.45,.74)+.155*smooth(e,.78,1))*seat;
   if(lap==='top'&&notch)top=0;if(lap==='bottom'&&notch)bottom=0;
   const section=roundedSection(top,bottom,depth);N=section.length;
   for(const[z0,y]of section){
    const t=(y-bottom)/(top-bottom),cheek=Math.max(0,1-((t-.43)/.53)**2),waist=.17*Math.exp(-(((e-.74)/.17)**2))*(1-t),ripple=.0075*Math.sin(e*13.5+t*5.6)*Math.sin(Math.PI*t)**2;
    const a=(e-.58)*Math.PI*2.6,cy=.40+.20*Math.sin(a),channel=.011*Math.exp(-(((t-cy)/.060)**2))*smooth(e,.25,.45)*(1-smooth(e,.83,1));
    const z=Math.sign(z0)*(Math.abs(z0)*(1-waist)-(channel+ripple)*cheek*Math.min(1,Math.abs(z0)/(depth*.36)));
    p.push(x,y,z);uv.push(x,y);
   }
  }
  for(let j=0;j<rows.length-1;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N,c=a+N,d=b+N;ids.push(a,b,c,b,d,c);}
  const n=p.length/3;p.push(-half,.025,0,half,.025,0);uv.push(0,0,1,0);for(let k=0;k<N;k++)ids.push(n,(k+1)%N,k,n+1,(rows.length-1)*N+k,(rows.length-1)*N+(k+1)%N);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);return own(g,'scene03-r11-incised-lofted-curved-hijiki-'+length+'-'+lap);
 }
 function dou(width,height){
  const profile=[[.78,0],[.78,.12],[.66,.25],[.64,.35],[.69,.46],[.84,.68],[.98,.81],[1,.90],[1,1]],p=[],uv=[],ids=[],N=32;
  for(const[w,t]of profile)for(let k=0;k<N;k++){const a=k/N*Math.PI*2,c=Math.cos(a),s=Math.sin(a),x=width*w/2*Math.sign(c)*Math.abs(c)**.20,z=width*w/2*Math.sign(s)*Math.abs(s)**.20;p.push(x,t*height,z);uv.push(x,z);}
  for(let j=0;j<profile.length-1;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N;ids.push(a,b,a+N,b,b+N,a+N);}
  const n=p.length/3;p.push(0,0,0,0,height,0);uv.push(0,0,0,0);for(let k=0;k<N;k++)ids.push(n,k,(k+1)%N,n+1,(profile.length-1)*N+(k+1)%N,(profile.length-1)*N+k);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);return own(g,'scene03-r11-rounded-neck-dou-'+width);
 }
 const arms={a0:hijiki(.95,.205,'top'),b0:hijiki(.95,.205,'bottom'),a1:hijiki(1.24,.190,'top',[-.28,.28],.180),b1:hijiki(1.08,.180,'bottom'),a2:hijiki(1.50,.185,'top',[-.36,.36],.170),b2:hijiki(1.12,.170,'bottom'),b3:hijiki(.64,.155,'',[-.03],.17)};
 const cups=[dou(.58,.18),dou(.265,.13),dou(.245,.13),dou(.230,.14)];
 const receiver=keep(createCurvedEaveRafter([[-.80,1.46,1.10],[0,1.46,1.10],[.80,1.46,1.10]],.22,.16)),tail=keep(createCurvedEaveRafter([[0,.28,-.12],[0,.52,.20],[0,.87,.61],[0,1.20,1.02]],.095,.12));
 function cluster(x,base,z,top,scale=1,major=true,depthScale=scale){
  const sy=(top-base)/1.54;if(!(sy>0))throw Error('Positive kumimono bearing gap required');
  const beam=(g,p,yaw=0,ma='cedar')=>emit(g,ma,p[0]*scale,p[1]*sy,p[2]*depthScale,yaw?depthScale:scale,sy,yaw?scale:depthScale,yaw);
  grouped(x,base,z,0,()=>{
   beam(cups[0],[0,0,0]);beam(arms.a0,[0,.28,0]);beam(arms.b0,[0,.28,0],Math.PI/2);
   for(const sign of[-1,1])beam(cups[1],[sign*.28,.38,0]);
   beam(arms.a1,[0,.61,.12]);for(const sign of[-1,1])beam(arms.b1,[sign*.28,.61,.12],Math.PI/2);
   for(const sign of[-1,1])beam(cups[2],[sign*.36,.71,.48]);
   beam(arms.a2,[0,.94,.48]);for(const sign of[-1,1])beam(arms.b2,[sign*.36,.94,.48],Math.PI/2);
   for(const sign of[-1,1]){beam(cups[3],[sign*.36,1.04,.87]);beam(arms.b3,[sign*.36,1.28,.90],Math.PI/2);if(major)beam(tail,[sign*.18,0,0]);}
   beam(receiver,[0,0,0]);
  });
  instances++;seats.push({column:[x,base,z],roofReceiverY:top,sectionScale:[scale,sy,depthScale],major,cutEndMetalPlates:false,normalizedSeats:[[0,.18],[.38,.51],[.71,.84],[1.04,1.18],[1.38,1.54]]});
 }
 return{cluster,prototypes,seats,get instances(){return instances;},construction:'R11 new lofted small-section incised curved hijiki, rounded dou, complementary half laps, flat working seats, slim raking tails, continuous roof sill; no repeated gold end plates'};
}
