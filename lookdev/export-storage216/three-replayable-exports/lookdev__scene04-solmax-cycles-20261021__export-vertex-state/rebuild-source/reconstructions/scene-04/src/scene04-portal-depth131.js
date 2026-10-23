import * as T from 'three';

// Closed side reveals and a coffered soffit retain their real parallax along
// the low camera path. Carved lining and small supported lamps fill the
// opening's formerly empty upper depth without a background image panel.
export function buildPortalDepth131({emit,box,tube,rosette,mats,materials,floorY=3.5}){
 const top=4.38,TAU=Math.PI*2,chainRing=new T.TorusGeometry(.018,.005,6,14),drop=new T.SphereGeometry(1,12,8);
 for(const [depth,half,h]of[[-.80,2.08,top],[-1.24,1.99,top-.10],[-1.75,1.91,top-.20]]){
  for(const side of[-1,1]){
   box(side*(half+.04),floorY+h/2,depth,.105,h,.14,'darkwood');
   box(side*(half+.04),floorY+h/2,depth+.08,.022,h,.025,'oldgold');
   for(let j=0;j<12;j++)rosette(side*(half+.04),floorY+.18+j*(h-.34)/11,depth+.10,.039,'oldgold');
  }
  box(0,floorY+h+.065,depth,half*2+.15,.13,.17,'cedar');
  box(0,floorY+h+.075,depth+.10,half*2+.10,.025,.025,'gold');
 }
 for(const side of[-1,1])box(side*2.18,floorY+2.17,-1.49,.18,4.34,1.75,'cedar');
 box(0,floorY+4.51,-1.52,4.19,.17,1.78,'darkwood');
 const petal=new T.Shape();petal.moveTo(0,0);petal.bezierCurveTo(-.045,.06,-.050,.17,0,.23);petal.bezierCurveTo(.055,.16,.05,.055,0,0);petal.closePath();
 const carvedLeaf=new T.ExtrudeGeometry(petal,{depth:.025,steps:1,bevelEnabled:true,bevelSize:.006,bevelThickness:.005,bevelSegments:2,curveSegments:9}),ring=new T.TorusGeometry(.072,.009,7,24);
 for(const side of[-1,1])for(let row=0;row<14;row++)for(let depth=0;depth<4;depth++){
  const y=floorY+.23+row*.285,z=-.86-depth*.33;
  emit(carvedLeaf,(row+depth)%4?'oldgold':'gold',side*2.090,y,z,1,1,1,[0,-side*Math.PI/2,side*((row%2?1:-1)*.53)]);
 }
 for(const z of[-.96,-1.49,-2.02])for(const x of[-1.54,-.77,0,.77,1.54]){
  box(x,floorY+4.395,z,.66,.075,.46,'cedar');
  for(const xx of[-.32,.32])box(x+xx,floorY+4.35,z,.026,.045,.46,'oldgold');
  for(const zz of[-.22,.22])box(x,floorY+4.35,z+zz,.66,.045,.026,'oldgold');
  emit(ring,'gold',x,floorY+4.34,z,1,1,1,[Math.PI/2,0,0]);
 }
 for(let j=0;j<13;j++){
  const x=-1.74+j*.29,len=.18+.13*(.5+.5*Math.sin(j*1.71)),anchor=floorY+4.35,z=-1.04;
  for(let k=0;k<5;k++)emit(chainRing,'oldgold',x,anchor-.028-k*len/5,z,1,1,1,[0,k%2*Math.PI/2,0]);
  emit(drop,'gold',x,anchor-len-.025,z,.026,.061,.026);
 }
 const paper=new T.MeshStandardMaterial({name:'scene04-portal-oil-lantern-paper',color:0xe0bd78,emissive:0xffb84d,emissiveIntensity:.32,roughness:.75});materials.push(paper);mats.portalOilPaper=paper;
 const lights=[];
 for(const side of[-1,1]){
  const x=side*1.55,y=floorY+3.46,z=-1.63;
  box(x,floorY+4.38,z,.11,.055,.11,'oldgold');
  tube([[x,floorY+4.36,z],[x,y+.23,z]],.008,'oldgold',8);
  emit(new T.CylinderGeometry(.093,.093,.30,8),paper,x,y,z);
  for(const yy of[y-.17,y+.17])emit(new T.CylinderGeometry(.13,.13,.045,8),'gold',x,yy,z);
  for(let j=0;j<8;j++){const a=j*TAU/8;box(x+Math.cos(a)*.103,y,z+Math.sin(a)*.103,.012,.33,.012,'oldgold');}
  lights.push([x,y,z]);
 }
 return{revision:'scene04-deep-coffered-portal131',clearHeight:top,revealDepth:1.75,carvedSideLeaves:112,coffers:15,hangingDrops:13,lights,visualAccepted:false};
}
