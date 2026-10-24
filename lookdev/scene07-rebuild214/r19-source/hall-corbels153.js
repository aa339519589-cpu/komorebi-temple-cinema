import * as T from 'three';

export const HALL_CORBEL_REVISION153='scene07-crossed-timber-eave-bearings153-r01';

// Closed, rounded carved arms. Their underside rises at each end; shoulders
// seat into the splayed bearing blocks. This is structural volume rather than
// a gold line drawn across a broad, otherwise empty fascia.
export function createHallCorbels153({emit,box,group,mats}){
 const shape=new T.Shape();shape.moveTo(-.62,.045);shape.bezierCurveTo(-.55,-.005,-.39,-.10,-.25,-.115);shape.lineTo(.25,-.115);shape.bezierCurveTo(.39,-.10,.55,-.005,.62,.045);shape.lineTo(.65,.145);shape.bezierCurveTo(.43,.125,.24,.085,0,.085);shape.bezierCurveTo(-.24,.085,-.43,.125,-.65,.145);shape.closePath();
 const arm=new T.ExtrudeGeometry(shape,{depth:.18,steps:1,bevelEnabled:true,bevelSize:.010,bevelThickness:.010,bevelSegments:2,curveSegments:12});arm.translate(0,0,-.09);
 const block=new T.CylinderGeometry(.25,.16,.18,4,1,false,Math.PI/4);
 const endPlate=new T.CylinderGeometry(.055,.055,.008,12).rotateX(Math.PI/2);
 let count=0,sectionScaleY=1;
 const bearing=(x,y,z,scale=1)=>emit(block,mats.wood,x,y*sectionScaleY,z,scale,scale*sectionScaleY,scale);
 const armAt=(x,y,z,length=1,angle=0)=>emit(arm,mats.red,x,y*sectionScaleY,z,length,sectionScaleY,1,[0,angle,0]);
 const member=(x,y,z,w,h,d,m)=>box(x,y*sectionScaleY,z,w,h*sectionScaleY,d,m);
 function build(x,head,z,{front=1,roofBottom=head+1.0,scale=1}={}){
  const height=roofBottom-head,sy=height/(1.055*scale);sectionScaleY=sy;
  if(!(height>.12))throw Error('Corbel needs an actual bearing interval below the roof.');
  group(x,head,z,front<0?Math.PI:0,scale,()=>{
   member(0,.035,0,.49,.15,.48,'wood');bearing(0,.17,0);
   armAt(0,.26,0,1.02);for(const xx of[-.37,.37])bearing(xx,.40,0,.76);
   for(const xx of[-.37,.37])armAt(xx,.49,.30,.98,Math.PI/2);
   for(const xx of[-.37,.37])for(const zz of[-.16,.77])bearing(xx,.64,zz,.72);
   armAt(0,.73,-.16,1.38);armAt(0,.73,.77,1.38);
   for(const xx of[-.62,0,.62])for(const zz of[-.16,.77]){
    bearing(xx,.87,zz,.61);member(xx,.98,zz,.17,.15,.25,'wood');
   }
   // Restrained real brass cast-end bosses, kept separate from red endgrain.
   for(const xx of[-.37,.37])emit(endPlate,mats.gold,xx,.50*sectionScaleY,.947);
  });
  count++;return{head,roofBottom,availableHeight:height,sectionScaleY:sy};
 }
 return{build,info:()=>({revision:HALL_CORBEL_REVISION153,columnClusters:count,geometry:'Closed carved crossed arms and splayed bearing blocks, two outward cantilever seats and separate end bosses',photoEquivalent:false})};
}
