import * as T from 'three';
import {TAU} from './kernel.js';

// Real nested door reveals and partially opened, framed leaves occupy the
// entrance. They continue into a shallower visible sanctuary; no flat set.
export function buildHallSanctuary219(B,S,center=.6){
 B.label('hall219-housed-inner-portal-and-open-carved-door-leaves',()=>{
  for(const side of[-1,1]){
   const x=center+side*1.67;
   S.moulding(x,3.40,2.02,.18,4.10,.24,'redLight');
   S.moulding(x-side*.103,3.40,2.17,.032,4.02,.065,'hall149OldGilt');
   S.moulding(x,1.46,2.17,.22,.15,.07,'hall149OldGilt');
   B.with(center+side*1.87,0,4.59,-side*.95,()=>{
    const w=.83,cx=-side*w*.5;
    S.moulding(cx,3.40,0,w,3.87,.145,'red');
    S.moulding(cx,3.40,.082,w-.13,3.69,.035,'hall185Recess');
    for(const dx of[-w*.5+.045,w*.5-.045])S.moulding(cx+dx,3.40,.124,.045,3.87,.050,'hall149OldGilt');
    for(const y of[1.50,2.54,4.20,5.30])S.moulding(cx,y,.128,w-.06,.055,.055,'hall149OldGilt');
    for(const yy of[2.06,4.73]){
     S.moulding(cx,yy,.114,.66,.221,.018,'hall185Recess');
     B.carvedSources185.mountFloralPanel219(B,{x:cx,y:yy,z:.151,scale:1.08});
    }
    for(const yy of[1.83,2.29,4.50,4.96])S.frieze(cx-w*.39,cx+w*.39,yy,.114,.205,{rich:false,wooden:true,phase:yy});
    // Square pierced upper fields are made of separate turned timber bars.
    for(let col=0;col<5;col++)for(let row=0;row<8;row++){
     const xx=cx-w*.32+col*w*.16,yy=2.72+row*.18;
     S.moulding(xx,yy,.121,.018,.15,.047,'hall149OldGilt');
     if((col+row)%2)S.moulding(xx+.033,yy+.065,.121,.083,.018,.047,'hall149OldGilt');
    }
    for(const y of[1.88,3.45,4.98])B.cyl(0,y,.012,.024,.14,'goldDark');
    B.emit(new T.TorusGeometry(.045,.009,6,20),'goldDark',cx-side*.23,3.20,.174,1,1,1,[Math.PI/2,0,0]);
   });
  }
  S.moulding(center,5.47,2.02,3.56,.23,.25,'wood');
  S.moulding(center,5.34,2.17,3.31,.045,.07,'hall149OldGilt');
  S.frieze(center-1.59,center+1.59,5.47,2.18,.16,{rich:true,wooden:false,phase:.3});
  // Gilt bosses and the beams that carry them are independent physical
  // surfaces. The old blank ceiling rectangle becomes a layered coffer.
  const boss=new T.CylinderGeometry(.048,.048,.016,20);B.resources.add(boss);
  for(const dx of[-1.2,-.4,.4,1.2])for(const zz of[2.0,3.2,4.4]){
   B.emit(boss,'hall149OldGilt',center+dx,5.405,zz);
   for(let pet=0;pet<6;pet++){const a=pet*TAU/6;B.sphere(center+dx+Math.cos(a)*.050,5.407,zz+Math.sin(a)*.050,.026,.006,.015,'hall149OldGilt',a);}
  }
  for(const side of[-1,1]){
   const x=center+side*1.15,z=1.43;
   B.cyl(x,1.45,z,.20,.12,'goldDark');B.cyl(x,1.74,z,.045,.50,'goldDark');B.cyl(x,2.02,z,.14,.09,'gold');B.cyl(x,2.20,z,.055,.32,'flowerCream');B.sphere(x,2.39,z,.018,.052,.018,'glow');
  }
 });
 return{revision:219,doorLeaves:2,doorOpeningRadians:.95,innerRevealZ:2.02,altarForwardShiftMetres:2.10,doorRelief:{instances:4,source:'Existing Diana Liu / Thunk3D CC BY4.0 peony-and-leaf source surface',uniformScale:1.08,sourceAttributesChanged:false},photographicAcceptance:false};
}
