import {T} from './kernel.js';

// A real recessed gable loft, held to the recovered ridge and rake contour.
// Strong curved timbers stand in front of an opaque boarded volume. Motifs
// are closed sculpted meshes from the existing authored157 vocabulary.
export function buildMonumentalGable170({b,mats,carved:C,roof}){
 const {gableWidth:w,gableEave:e,gableRise:r,gableFront:z,gableBack:back,gableCenterX:cx}=roof;
 const stats={revision:'scene02-deep-carried-gable170-r05',closedLoft:true,curvedTrusses:4,bargeboardDepth:.58,referencePixelsSampled:false};
 const profile=t=>e+r*Math.pow(Math.max(0,1-t),1.28)+.38*Math.pow(t,8);
 const sweep=(p,width,depth,name,ma)=>b.put(C.sweep(p,width,depth,name),ma);
 b.at([cx,0,0],0,()=>{
  // Front reveals are almost a metre deep; the rear loft is enclosed too.
  for(const [plane,ma]of[[z-.68,'carvingRecess157'],[back+.10,'hallBearing']]){
   for(let x=-w*.48;x<=w*.481;x+=.29){const top=profile(Math.abs(x)/(w/2))-.17,base=e+.31;if(top>base)b.box(x,(top+base)/2,plane,.288,top-base,.16,ma,0,.92+.06*Math.sin(x*5.1)**2);}
  }
  // A king post and two independent deep transfer beams carry the upper
  // truss. They are not the former flat applied grid on a triangle panel.
  b.box(0,e+r*.48,z-.12,.38,r*.98,.72,'hallOxide');
  b.box(0,e+.55,z-.10,w*.86,.36,.70,'hallOxide');
  b.box(0,e+1.66,z-.08,w*.49,.29,.60,'hallBearing');
  for(const sign of[-1,1]){
   const rake=Array.from({length:57},(_,j)=>{const t=j/56;return[sign*w*.5*t,profile(t)-.24,z+.10];});
   sweep(rake,.64,.58,'scene02-170-deep-continuous-rake-'+sign,'hallOxide');
   // A second timber arris gives the rake a carved shoulder and a shadow
   // reveal behind restrained fitted metal rather than a flat gold stripe.
   sweep(rake.map(p=>[p[0],p[1]-.12,p[2]+.28]),.17,.16,'scene02-170-rake-carved-shoulder-'+sign,'hallBearing');
   const truss=[[0,e+r-.66,z-.02],[sign*w*.075,e+r*.66,z+.02],[sign*w*.21,e+1.47,z+.045],[sign*w*.34,e+.64,z+.06]];
   sweep(truss,.42,.62,'scene02-170-main-curved-raking-truss-'+sign,'hallBearing');
   sweep([[sign*w*.075,e+.72,z+.045],[sign*w*.14,e+1.12,z+.06],[sign*w*.21,e+1.72,z+.07],[sign*w*.27,profile(.54)-.42,z+.06]],.25,.43,'scene02-170-curved-transfer-knee-'+sign,'hallOxide');
   // An actual raised branching frieze follows the deep rake. Its stem and
   // paired fluted leaves are individually closed solids seated on timber.
   const vine=[];
   for(let j=0;j<=96;j++){
    const t=.035+.91*j/96,dy=(profile(t+.001)-profile(t-.001))/.002,dx=sign*w*.5,L=Math.hypot(dx,dy),wave=.055*Math.sin(t*Math.PI*18);
    vine.push([sign*w*.5*t-dy/L*wave,profile(t)-.24+dx/L*wave,z+.438]);
   }
   sweep(vine,.075,.070,'scene02-170-closed-rake-foliage-stem-'+sign,'hallBearing');
   for(const [j,t]of[.065,.112,.191,.265,.315,.412,.474,.548,.647,.715,.81,.87,.94].entries()){
    const dy=(profile(t+.001)-profile(t-.001))/.002,dx=sign*w*.5,L=Math.hypot(dx,dy),theta=Math.atan2(dy,dx)-Math.PI/2;
    for(const side of[-1,1])C.leaf([sign*w*.5*t-dy/L*side*.025,profile(t)-.24+dx/L*side*.025,z+.454],.28+(j%3)*.025,.50,0,theta+side*.78,j===2||j===7||j===11?'carvingBronze157':'hallBearing',.85);
   }
   for(const [boss,t]of[.16,.39,.66,.87].entries()){
    const x=sign*w*.5*t,y=profile(t)-.24,dt=.003,dy=profile(t+dt)-profile(t-dt),roll=Math.atan2(-sign*w*dt,dy);
    b.at([x,y-.10,z+.425],0,()=>{
     b.stack.push(b.stack.at(-1).clone().multiply(new T.Matrix4().makeRotationZ(roll)));
     C.rosette([0,-.035,-.07],boss%2?.68:.60);
     b.stack.pop();
    });
   }
  }
  // Three deeply framed lower coffers occupy the collar beam. Different
  // recessed fields keep the loft readable as a volume from the low view.
  for(const [i,x]of[-w*.245,0,w*.245].entries()){
   const pw=w*.19,py=e+1.20,ph=.70;
   b.box(x,py,z-.34,pw,ph,.16,'carvingRecess157');
   for(const side of[-1,1]){b.box(x+side*pw/2,py,z-.10,.15,ph+.17,.46,'hallOxide');b.box(x,py+side*ph/2,z-.10,pw+.14,.12,.46,'hallBearing');}
   for(const side of[-1,1]){
    C.scroll([x+side*pw*.20,py,z+.15],.70,0,side<0?Math.PI:0,'carvingBronze157');
    C.leaf([x+side*pw*.28,py-.12,z+.16],.41,.66,0,-side*.74,'carvingGold157',.60);
    C.leaf([x+side*pw*.07,py-.20,z+.18],.46,.62,0,side*.55,'hallBearing',.72);
   }
   C.rosette([x,py,z+.11],.44);
  }
  // Paired upper vent bays are real slats and recessed lime cells between
  // the curved truss and king post, not embossed floral stickers.
  for(const sign of[-1,1]){
   const x=sign*w*.103,py=e+r*.435,pw=w*.115,ph=r*.24;
   b.box(x,py,z-.43,pw,ph,.13,'hallPlaster');
   for(const side of[-1,1]){b.box(x+side*pw/2,py,z-.06,.14,ph+.12,.45,'hallBearing');b.box(x,py+side*ph/2,z-.06,pw+.12,.12,.45,'hallOxide');}
   for(let j=0;j<9;j++)b.box(x+(j-4)*pw/9,py,z-.18,.041,ph,.19,'hallBearing');
   C.rosette([x,py-ph*.47,z+.05],.40);
  }
  C.rosette([0,e+r-.93,z+.15],.86);
  const crest=C.prototypes.find(g=>g.name==='scene02-closed-carved-cloud-nose157');
  if(!crest)throw new Error('Closed ceramic crest vocabulary missing');
  b.put(crest,'hallTile1542',[0,e+r+.18,z+.22],[.9,1,1],[0,0,-.26]);
  C.scroll([0,e+r+.20,z+.43],.78,0,-.25,'carvingBronze157');
  // Cast pendants bear on the heavy king-post joints; wood stays visible.
  for(const y of[e+.62,e+r*.55]){
   C.facePlate(0,y,z+.31,.44,.43);
   C.leaf([0,y-.17,z+.34],.43,.62,0,Math.PI,'carvingBronze157',.64);
  }
 });
 // These closed ceramic crest calls belonged to the former gable builder;
 // retain their original roof-seat coordinates with the rebuilt deep loft.
 const nose=C.prototypes.find(g=>g.name==='scene02-closed-carved-cloud-nose157'),left=C.prototypes.find(g=>g.name==='scene02-closed-carved-cloud-nose-left157');
 for(const sign of[-1,1]){
  const p=[cx+sign*roof.roofWidth/2,roof.roofEave+roof.roofCurl,roof.roofFront];
  b.at(p,0,()=>{b.put(sign<0?left:nose,'hallTile1542',[0,.30,0],[.80,1.25,1.25],[0,0,sign*.12]);b.put(sign<0?left:nose,'hallTile1542',[-sign*.12,.64,-.15],[.44,.74,.80],[0,0,-sign*.35]);C.scroll([-sign*.03,.29,.20],.70,0,sign<0?Math.PI:0,'carvingBronze157');C.leaf([-sign*.21,.09,.25],.45,.61,0,-sign*.35,'carvingBronze157',.7);});
 }
 C.stats.gableBuilt=true;return stats;
}
