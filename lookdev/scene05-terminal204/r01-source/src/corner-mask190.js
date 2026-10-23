import * as T from 'three';
import {closedWire190,finishSolid190} from './detail190-solids.js';

// Visible-section study from reference05: a rimmed ceramic medallion with
// angular brows and radiating whiskers, carried by a layered curved tile.
// This is authored geometry, not a recovered historic artifact or photo map.
export function createCornerMask190(){
 const parts=[],owned=[];
 const add=(g,material='slate',p=[0,0,0])=>{g.translate(...p);owned.push(g);parts.push({geometry:g,material});};
 const cast=(s,d=.04,b=.003)=>{const contours=s.extractPoints(24),outer=contours.shape;if(!T.ShapeUtils.isClockWise(outer))outer.reverse();const normalized=new T.Shape(outer);for(const loop of contours.holes){if(T.ShapeUtils.isClockWise(loop))loop.reverse();const h=new T.Path(loop);h.closePath();normalized.holes.push(h);}const g=new T.ExtrudeGeometry(normalized,{depth:d,steps:1,curveSegments:24,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:3});g.translate(0,0,-d/2);return g;};
 const wire=(pts,r=.007,ma='slate')=>add(closedWire190(pts,r,Math.max(24,pts.length*7),10),ma);
 const oval=(rx,ry,cy,z,r)=>{const pts=Array.from({length:96},(_,i)=>{const a=i/96*Math.PI*2;return new T.Vector3(Math.sin(a)*rx,cy+Math.cos(a)*ry,z);});add(new T.TubeGeometry(new T.CatmullRomCurve3(pts,true),120,r,10,true));};
 const gauss=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2)-(((y-cy)/sy)**2));
 // A single closed height-field surface carries the nose, orbital hollows,
 // brow roots and muzzle. The relief grows continuously from the ceramic
 // ground instead of stacking detached spherical cheek/chin ornaments.
 const height=(x,y)=>{
  let h=.020+.014*Math.max(0,1-(x/.23)**2-((y-.205)/.232)**2);
  h+=.067*gauss(x,y,0,.194,.038,.085)+.035*gauss(x,y,0,.153,.066,.031);
  h+=.012*gauss(x,y,0,.340,.12,.065);
  for(const s of[-1,1]){h-=.020*gauss(x,y,s*.103,.259,.052,.027);h+=.015*gauss(x,y,s*.114,.180,.082,.042);}
  return h;
 };
 const faceWire=(pts,r=.0065)=>wire(pts.map(([x,y])=>[x,y,height(x,y)+r*.40]),r);
 const N=128,R=44,p=[0,.205,height(0,.205)],uv=[.5,.5],ids=[];
 for(let j=1;j<=R;j++)for(let k=0;k<N;k++){
  const a=k/N*Math.PI*2,t=j/R,x=Math.sin(a)*.227*t,y=.205+Math.cos(a)*.232*t;
  p.push(x,y,height(x,y));uv.push(.5+x,.5+y);
 }
 for(let k=0;k<N;k++)ids.push(0,1+(k+1)%N,1+k);
 for(let j=1;j<R;j++)for(let k=0;k<N;k++){
  const a=1+(j-1)*N+k,b=1+(j-1)*N+(k+1)%N,c=a+N,d=b+N;ids.push(a,b,c,b,d,c);
 }
 const backCentre=p.length/3;p.push(0,.205,-.055);uv.push(.5,.5);
 const backStart=p.length/3;
 for(let k=0;k<N;k++){const a=k/N*Math.PI*2;p.push(Math.sin(a)*.227,.205+Math.cos(a)*.232,-.055);uv.push(.5,.5);}
 for(let k=0;k<N;k++){const a=1+(R-1)*N+k,b=1+(R-1)*N+(k+1)%N,c=backStart+k,d=backStart+(k+1)%N;ids.push(a,b,c,b,d,c,backCentre,c,d);}
 add(finishSolid190(p,uv,ids,'scene05-integrated-rimmed-ceramic-medallion190'));
 // Peak of the ridge cap lies behind the round rim, as in the photographed
 // tile. Its top is compact rather than a free-standing horn.
 const peak=new T.Shape();peak.moveTo(-.204,.270);peak.lineTo(-.160,.403);peak.lineTo(0,.478);peak.lineTo(.160,.403);peak.lineTo(.204,.270);peak.closePath();add(cast(peak,.085,.005),'slate',[0,0,-.025]);
 oval(.239,.245,.205,.026,.012);oval(.217,.222,.205,.043,.006);
 for(const s of[-1,1]){
  const brow=new T.Shape();brow.moveTo(s*.018,.278);brow.lineTo(s*.053,.315);brow.quadraticCurveTo(s*.131,.301,s*.190,.333);brow.lineTo(s*.186,.292);brow.quadraticCurveTo(s*.122,.277,s*.065,.261);brow.closePath();add(cast(brow,.026,.003),'slate',[0,0,.042]);
  wire([[s*.020,.281,.057],[s*.067,.305,.059],[s*.133,.298,.055],[s*.185,.316,.052]],.006);
  const eye=new T.SphereGeometry(1,24,16);eye.scale(.011,.012,.004);add(eye,'oldgold',[s*.105,.260,.023]);
  for(const [a,b,c]of[
   [[s*.045,.186,.080],[s*.110,.186,.060],[s*.190,.208,.044]],
   [[s*.048,.170,.077],[s*.122,.146,.058],[s*.180,.151,.043]],
   [[s*.044,.152,.070],[s*.100,.104,.055],[s*.144,.075,.043]]
  ])faceWire([a,b,c],.0065);
  faceWire([[s*.024,.136],[s*.049,.085],[s*.047,.022]],.007);
  faceWire([[s*.160,.394],[s*.188,.361],[s*.197,.326]],.006);
 }
 const nose=new T.SphereGeometry(1,28,18);nose.scale(.030,.022,.014);add(nose,'oldgold',[0,.191,.110]);
 const noseRim=[];for(let i=0;i<48;i++){const a=i/48*Math.PI*2,x=Math.sin(a)*.036,y=.191+Math.cos(a)*.028;noseRim.push(new T.Vector3(x,y,height(x,y)+.004));}add(new T.TubeGeometry(new T.CatmullRomCurve3(noseRim,true),64,.004,8,true));
 const forehead=new T.Shape();forehead.moveTo(-.028,.363);forehead.lineTo(0,.388);forehead.lineTo(.028,.363);forehead.lineTo(.022,.342);forehead.quadraticCurveTo(0,.327,-.022,.342);forehead.closePath();add(cast(forehead,.007,.0015),'oldgold',[0,0,.048]);
 const ledge=new T.Shape();ledge.moveTo(-.326,.012);ledge.quadraticCurveTo(0,-.050,.326,.012);ledge.lineTo(.328,-.063);ledge.quadraticCurveTo(0,-.155,-.328,-.063);ledge.closePath();add(cast(ledge,.115,.005),'slate',[0,0,-.010]);
 for(const yy of[.003,-.027,-.057])wire([[-.326,yy,.062],[-.19,yy-.036,.077],[0,yy-.054,.093],[.19,yy-.036,.077],[.326,yy,.062]],.009);
 for(const s of[-1,1]){
  const roll=new T.Shape();roll.moveTo(s*.289,.003);roll.quadraticCurveTo(s*.380,-.005,s*.375,-.085);roll.quadraticCurveTo(s*.367,-.151,s*.304,-.158);roll.lineTo(s*.282,-.130);roll.quadraticCurveTo(s*.346,-.128,s*.342,-.077);roll.quadraticCurveTo(s*.339,-.036,s*.294,-.041);roll.closePath();add(cast(roll,.115,.005),'slate',[0,0,-.010]);
  wire([[s*.299,-.010,.060],[s*.348,-.028,.067],[s*.352,-.087,.061],[s*.318,-.126,.059]],.008);
 }
 const boss=new T.SphereGeometry(1,20,12);boss.scale(.021,.016,.011);add(boss,'oldgold',[0,-.048,.100]);
 const support=new T.Shape();support.moveTo(-.17,-.08);support.lineTo(.17,-.08);support.lineTo(.13,.20);support.quadraticCurveTo(0,.25,-.13,.20);support.closePath();const mount=cast(support,.24,.004);mount.translate(0,0,.09);owned.push(mount);
 return{parts,mountParts:[{geometry:mount,material:'slate'}],info:{revision:190,construction:'Continuous closed low-relief ceramic face ground with recessed orbital hollows, angular brows, radiating whisker ridges, round gilded nose, two narrow round rims and layered curved tile ledges with turned side rolls',mainHipMountOffset:[0,.145,.23],mountReason:'A closed ceramic seat carries the face ahead/above the retained1.03 terminal row',historicalArtifactIdentityClaimed:false,photoTexture:false},dispose(){for(const g of owned)g.dispose();}};
}
