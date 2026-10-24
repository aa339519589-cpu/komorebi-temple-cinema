import * as T from 'three';

// Authored, inferred cast inserts over the existing timber construction.
// Piercing, thickness and relief are geometry; no scene-image surface,
// lighting adjustment or new texture/material is introduced here.
export function createGiltJoinery238({emit,box,group,mats}){
 const stats={piercedArmInserts:0,columnNeckCollars:0,collarStuds:0};
 const shapes=[];
 for(const side of[-1,1]){
  const p=new T.Shape();
  p.moveTo(-.49,-.18);p.bezierCurveTo(-.29,-.08,-.25,.17,-.05,.19);
  p.bezierCurveTo(.08,.39,.40,.31,.49,.10);
  p.bezierCurveTo(.30,.18,.30,-.03,.13,-.03);
  p.bezierCurveTo(.21,-.17,.02,-.34,-.11,-.23);
  p.bezierCurveTo(-.25,-.30,-.35,-.19,-.49,-.18);
  p.closePath();
  const hole=new T.Path();hole.absellipse(.125,.125,.095,.057,-.15,Math.PI*2-.15,true);p.holes.push(hole);
  const hole2=new T.Path();hole2.absellipse(-.095,-.102,.054,.040,0,Math.PI*2,true);p.holes.push(hole2);
  const g=new T.ExtrudeGeometry(p,{depth:.009,bevelEnabled:true,bevelSize:.0018,bevelThickness:.0018,bevelSegments:2,curveSegments:20});
  if(side<0){const pos=g.attributes.position;for(let i=0;i<pos.count;i++)pos.setX(i,-pos.getX(i));if(g.index){const ix=g.index.array;for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];}else{for(const attr of Object.values(g.attributes)){for(let i=0;i<attr.count;i+=3)for(let k=0;k<attr.itemSize;k++){const a=attr.getComponent(i+1,k),b=attr.getComponent(i+2,k);attr.setComponent(i+1,k,b);attr.setComponent(i+2,k,a);}}}g.computeVertexNormals();}
  g.userData={architectureMember:'closed-pierced-cast-leaf-insert238-r26',revision238:true};shapes.push(g);
 }
 const collars=new Map(),stud=new T.SphereGeometry(1,10,6);
 function armFace(x,y,z,length,depth,scaleY,angle=0){
  if(length<.58)return;
  group(x,y,z,angle,1,()=>{
   for(let i=0;i<2;i++){
    const sign=i?1:-1;emit(shapes[i],mats.gold,sign*(length/2-.17),-.040*scaleY,depth/2+.009,.265,.29*scaleY,1);stats.piercedArmInserts++;
   }
  });
 }
 function neckCollar(x,y,z,radius,metricX=1,metricZ=1){
  const key=radius.toFixed(4);
  if(!collars.has(key)){
   const inner=radius*.96-.0015,outer=inner+.011,points=[[inner,-.045],[outer,-.045],[outer,.045],[inner,.045],[inner,-.045]];
   const g=new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),48);g.userData={architectureMember:'closed-fitted-column-neck-collar238-r26',revision238:true};collars.set(key,g);
  }
  emit(collars.get(key),mats.gold,x,y,z,metricX,1,metricZ);stats.columnNeckCollars++;
  for(let i=0;i<4;i++){
   const a=Math.PI/4+i*Math.PI/2,r=radius*.96+.0175;
   emit(stud,mats.gold,x+Math.sin(a)*r*metricX,y,z+Math.cos(a)*r*metricZ,.017*metricX,.017,.017*metricZ);stats.collarStuds++;
  }
 }
 return{armFace,neckCollar,info:()=>({...stats,closedMetalGeometry:true,sourceImageSampled:false,newMaterials:0,newLights:0,visualAccepted:false})};
}
