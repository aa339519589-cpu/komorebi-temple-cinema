from pathlib import Path
p=Path('reconstructions/scene-02/carved-timber157.js');s=p.read_text();s=s.replace("revision:'scene02-surface-fitted-sculpted-carpentry159'","revision:'scene02-monumental-layered-ensemble160'")
a=s.index('   const curve=t=>',s.index(' function gable(roof)'))
z=s.index('   // Closed ridge-end cloud boss',a)
s=s[:a]+'''   const curve=t=>[w/2*t,e+r*Math.pow(1-t,1.28)+.38*Math.pow(t,8)-.10,z+.125];
   for(const sign of[-1,1]){
    const points=Array.from({length:65},(_,j)=>{const p=curve(j/64);p[0]*=sign;return p;});
    // Deep continuous timber rake, narrow metal edge, and four fitted plate
    // groups. The solid wood remains visible between those applied castings.
    b.put(sweep(points,.40,.34,'scene02-closed-thick-timber-bargeboard160-'+sign),'hallOxide');
    b.put(sweep(points.map(p=>[p[0],p[1]+.08,p[2]+.18]),.060,.048,'scene02-closed-bargeboard-bead160-'+sign),'carvingGold157');
    for(const t of[.10,.34,.64,.89]){
     const p=curve(t),a=curve(t-.006),c=curve(t+.006);p[0]*=sign;const roll=Math.atan2(-(c[0]-a[0])*sign,c[1]-a[1]);
     b.at([p[0],p[1]-.12,z+.33],0,()=>{
      // A small closed geometric metal field follows the timber tangent.
      b.put(shield,'carvingBronze157',[0,0,0],[.49,.72,.30],[0,0,roll]);
      for(let i=0;i<7;i++){const q=i/6;leafAt([Math.sin(roll)*(.13+q*.29),-Math.cos(roll)*(.13+q*.29),.022],.28,.34,0,roll+(i%2?.67:-.67),'carvingGold157',.32);}
      for(const side of[-1,1])scrollAt([side*.13,-.05,.028],.35,0,roll+side*.28,'carvingGold157');
     });
    }
    // Twin curved struts have real seated ends at the collar and king post.
    b.put(sweep([[0,e+r-1.07,z+.05],[sign*w*.09,e+r*.64,z+.045],[sign*w*.20,e+1.55,z+.04],[sign*w*.34,e+.55,z+.04]],.22,.29,'scene02-closed-curved-loft-strut160-'+sign),'hallBearing');
   }
   b.box(0,e+.62,z+.02,w*.78,.22,.35,'hallOxide');b.box(0,e+1.72,z+.015,w*.48,.20,.30,'hallBearing');
   // Dense small raised stems and foliage occupy recessed coffer fields.
   // Every branch and leaf is seated on the same opaque backing panel.
   function floralField(x,py,pw,ph,seed){
    const face=z+.17;b.box(x,py,z+.03,pw,ph,.15,'carvingRecess157');
    for(const sign of[-1,1]){b.box(x+sign*pw/2,py,z+.13,.10,ph+.16,.25,'hallOxide');b.box(x,py+sign*ph/2,z+.13,pw+.08,.085,.25,'hallBearing');}
    b.tube([[x-pw*.42,py-.07,face],[x-pw*.19,py+.06,face+.01],[x,py-.03,face+.01],[x+pw*.20,py+.07,face],[x+pw*.42,py-.04,face]],.018,'carvingBronze157',40);
    for(const sign of[-1,1])for(let j=0;j<5;j++){
     const xx=x+sign*(.15+j*pw*.075),yy=py+.08*Math.sin(j*1.7+seed),dy=(j%2?1:-1)*ph*.30;
     b.tube([[xx,yy,face],[xx+sign*.08,yy+dy*.5,face+.016],[xx+sign*.15,yy+dy,face+.012]],.013,'carvingGold157',16);
     leafAt([xx+sign*.06,yy,face+.016],ph*.37,.34,0,sign*(j%2?.62:2.3),'carvingGold157',.30);
     leafAt([xx+sign*.13,yy+dy*.44,face+.016],ph*.25,.28,0,-sign*.7,'carvingBronze157',.26);
     if(j%2===0)scrollAt([xx,yy+dy*.50,face+.025],.24,0,sign<0?Math.PI:0,'carvingGold157');
    }
    for(let j=0;j<8;j++){const a=j*Math.PI/4;leafAt([x+Math.cos(a)*.11,py+Math.sin(a)*.11,face+.035],.24,.30,0,a-Math.PI/2,'carvingGold157',.28);}
    b.ball(x,py,face+.052,.043,.043,.018,'carvingBronze157');
   }
   for(const [i,x]of[-w*.22,0,w*.22].entries())floralField(x,e+1.02,w*.180,.64,i);
   // Upper paired fields sit well below the rake. Fine slats continue behind
   // the raised botanical carving, so the attic reads as an enclosed volume.
   for(const sign of[-1,1]){
    const px=sign*w*.112,py=e+r*.452,pw=w*.137,ph=r*.305;
    for(let j=0;j<9;j++)b.box(px+(j-4)*pw/9,py,z-.005,.035,ph,.12,'hallBearing');
    floralField(px,py,pw,ph,sign+4);
    b.put(shield,'carvingBronze157',[px,py-ph*.50-.12,z+.27],[.42,.33,.28]);
   }
   b.box(0,e+r*.49,z+.04,.20,r*.98,.28,'hallOxide');
   for(const yy of[e+.80,e+r*.47,e+r*.80]){
    b.box(0,yy,z+.215,.23,.26,.032,'carvingBronze157');
    for(const sign of[-1,1])leafAt([sign*.06,yy-.08,z+.235],.18,.24,0,-sign*.55,'carvingGold157',.22);
   }
   // Small plaques form a connected lower frieze rather than free curls.
   for(let j=0;j<31;j++){const x=-w*.36+j*w*.72/30;facePlate(x,e+.57,z+.22,.16,.12);}
''' +s[z:]
p.write_text(s)
