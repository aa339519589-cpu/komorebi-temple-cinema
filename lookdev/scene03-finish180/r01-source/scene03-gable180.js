import {createCurvedEaveRafter} from './scene03-curved-rafter.js';

// A closed, recessed timber gable fitted below the retained ceramic weather
// profile. The former exposed diagonal sticks and pale apron are removed.
export function buildGableTimber180(T,{emit,box,lin,tube,curve,hw,front,foot,peak}){
 const owned=[],keep=g=>{owned.push(g);return g;};
 const curved=(points,w,h,ma)=>emit(keep(createCurvedEaveRafter(points,w,h)),ma);
 const base=foot-.40,topAt=x=>Math.max(base+.02,curve(x)-.39),half=hw-.06;
 // The full panel has a front/rear face and side returns. It is recessed
 // 0.55m from the barge front, including the low shoulder formerly left bare.
 const profile=new T.Shape();profile.moveTo(-half,base);profile.lineTo(half,base);
 for(const x of lin(half,-half,112))profile.lineTo(x,topAt(x));profile.closePath();
 const diaphragm=keep(new T.ExtrudeGeometry(profile,{depth:.38,steps:1,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2}));
 diaphragm.name='scene03-closed-recessed-gable-diaphragm180';emit(diaphragm,'gableRecess',0,0,front-.63);
 // Vertical planks sit within the diaphragm, with narrow real seams and
 // deeply housed rails. No independent open triangular stick truss remains.
 for(let j=-10;j<=10;j++){
  const x=j*.285,low=base+.035,high=topAt(x)-.03;
  if(high>low)box(x,(high+low)/2,front-.255,.277,high-low,.095,'gableRecess');
 }
 const tie=lin(-1.93,1.93,96).map(x=>[x,foot+.17+.18*(1-(x/1.93)**2),front-.06]);
 curved(tie,.80,.49,'red');
 curved(lin(-1.94,1.94,96).map(x=>[x,foot-.06+.16*(1-(x/1.94)**2),front+.095]),.76,.15,'gableCarving');
 // This short, broad king post is housed behind the paired carved shoulders.
 const postTop=peak-.59,postBottom=foot+.36;
 box(0,(postBottom+postTop)/2,front-.10,.53,postTop-postBottom,.71,'red');
 for(const side of[-1,1]){
  const x=side*1.37,y=foot+.35;
  box(x,y,front-.19,.65,.59,.85,'red');
  box(x,foot+.63,front-.18,.84,.17,.91,'gableCarving');
 }
 // One heavy barge, a returned lower moulding and restrained edge gilding
 // follow the exact retained curve. The material is actual scanned timber.
 curved(lin(-hw,hw,112).map(x=>[x,curve(x)-.27,front+.07]),.62,.50,'red');
 curved(lin(-hw+.045,hw-.045,112).map(x=>[x,curve(x)-.57,front+.18]),.42,.21,'gableCarving');
 tube(lin(-hw,hw,112).map(x=>[x,curve(x)-.11,front+.375]),.022,'bearingGilt',144);
 tube(lin(-hw+.05,hw-.05,112).map(x=>[x,curve(x)-.44,front+.387]),.011,'oldgold',144);
 // The two real-scan cloud shoulders are mounted separately by the async
 // loader. Uniform magnitude preserves their actual aspect and relief.
 const sockets=[{position:[-.57,foot+.57,front+.20],scale:1.10,mirrorX:true},{position:[.57,foot+.57,front+.20],scale:1.10,mirrorX:false}];
 return{revision:180,diaphragm:{bottom:base,frontZ:front-.25,backZ:front-.63,thickness:.38},tieSection:[.49,.80],kingPostSection:[.53,.71],sockets,removed:'Exposed diagonal truss, separate synthetic foliate strut, pale broad apron and repeated procedural gold receiver stamps',weatherProfileChanged:false};
}
