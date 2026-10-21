// Closed radial corner carpentry fitted after native23 exposed the missing
// diagonal receiver hierarchy. The original R22 column/hip seats remain fixed.
import {T,V} from './kernel.js';
export function buildCornerReceiver158({b,carved,roof,axes}){
 const arm=carved.prototypes.find(g=>g.name==='scene02-closed-sculpted-cloud-lever157'),nose=carved.prototypes.find(g=>g.name==='scene02-closed-carved-cloud-nose157'),noseLeft=carved.prototypes.find(g=>g.name==='scene02-closed-carved-cloud-nose-left157');if(!arm||!nose||!noseLeft)throw Error('Carved157 vocabulary required.');
 const result=[];
 for(const sign of[-1,1]){
  const columnX=sign<0?axes[0]:axes.at(-1),innerX=roof.gableCenterX+sign*roof.gableWidth/2,frontZ=4.7,yaw=Math.atan2(innerX-columnX,roof.gableFront-frontZ),root=[columnX,7.45,frontZ],contactDistance=2.52;
  b.at(root,yaw,()=>{
   // Six radial diagonal lever seats share the existing column abacus and
   // climb toward the fixed inner hip bearing; no duplicate capital is added.
   for(let k=0;k<6;k++){
    const y=.25+k*.40,out=.12+k*.40,span=.42+k*.025;
    b.put(arm,k%2?'hallBearing':'hallOxide',[0,y,out],[span,1,.80],[0,Math.PI/2,0]);
    b.put(arm,'hallBearing',[0,y+.10,out+.13],[.35+k*.025,.86,.76]);
    carved.bearing(0,y+.34,out+.42,.36,.39,'hallBearing',true);
    for(const side of[-1,1]){
     b.put(side<0?noseLeft:nose,'hallBearing',[side*(.35+k*.025),y+.11,out+.28],[.36,.43,.64]);
     carved.leaf([side*.14,y-.10,out+.30],.40,.45,0,side*.44,'carvingGold157',.50);
     carved.scroll([side*.20,y+.09,out+.35],.42,0,side<0?Math.PI:0,'carvingBronze157');
    }
   }
   // The fitted upper nose contacts the closed R22 diagonal hip timber.
   carved.bearing(0,2.54,contactDistance,.46,.52,'hallBearing',true);
   b.box(0,2.64,contactDistance,.41,.16,.57,'hallOxide');
  });
  const m=new T.Matrix4().compose(V(root),new T.Quaternion().setFromAxisAngle(V([0,1,0]),yaw),V([1,1,1]));result.push({columnLocal:root,yaw,upperSeatLocal:V([0,2.72,contactDistance]).applyMatrix4(m).toArray(),sharedCapital:true,roofReference:'Unchanged R22 inner hip edge and diagonal underside bearing'});
 }
 return{visualAccepted:false,cornerReceivers:result};
}
