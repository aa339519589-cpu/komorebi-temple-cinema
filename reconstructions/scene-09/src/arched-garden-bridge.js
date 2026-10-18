import * as T from 'three';

// Scene09's fixed bridge span. The deck crown and two landing anchors retain
// their earlier positions; every bearing member is a closed timber volume.
export function buildArchedGardenBridge({emit,box,between,lantern,materials:M}){
  const height=x=>1.25+1.36*Math.pow(Math.max(0,1-(x/8)**2),1.15);
  const slope=x=>(height(Math.min(8,x+.01))-height(Math.max(-8,x-.01)))/.02;
  const finial=new T.SphereGeometry(1,12,8),peg=new T.CylinderGeometry(1,1,1,8);
  function curvedMember(z,width,offset,depth,material,bevel=.008){
    const shape=new T.Shape();
    for(let i=0;i<=80;i++){const x=-8+i*.2,y=height(x)+offset;i?shape.lineTo(x,y):shape.moveTo(x,y);}
    for(let i=80;i>=0;i--){const x=-8+i*.2;shape.lineTo(x,height(x)+offset-depth);}
    shape.closePath();
    const g=new T.ExtrudeGeometry(shape,{depth:width,steps:1,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,curveSegments:1});
    g.translate(0,0,z-width/2);emit(g,material);
  }

  // Thin transverse decking bears on two exposed side girders and two inner
  // stringers. Open air remains below; there is no masonry band across it.
  for(const z of[.14,3.06])curvedMember(z,.30,-.09,.38,M.bridgeTimber,.012);
  for(const z of[1.02,2.18])curvedMember(z,.17,-.12,.26,M.bridgeTimber);
  const count=58,step=16/count;
  for(let i=0;i<count;i++){
    const x=-8+(i+.5)*step,angle=Math.atan(slope(x));
    box(x,height(x)-.045,1.60,step-.009,.12,3.18,M.bridgeDeck,[0,0,angle],.86+.12*Math.sin(i*1.71)**2);
  }
  for(let i=0;i<=10;i++){
    const x=-7.6+i*1.52,angle=Math.atan(slope(x));
    box(x,height(x)-.35,1.60,.24,.22,3.65,M.bridgeTimber,[0,0,angle]);
    for(const z of[-.21,3.41])box(x,height(x)-.35,z,.27,.25,.10,M.dark,[0,0,angle]);
  }

  // Three curved rectangular rails pass through actual spaces in the posts.
  // Narrow outer cheeks enclose each through-mortise instead of drawing rods
  // over an uninterrupted solid post.
  for(const z of[.17,3.03]){
    curvedMember(z,.19,1.00,.13,M.red,.012);
    curvedMember(z,.145,.61,.095,M.red);
    curvedMember(z,.16,.28,.10,M.red);
    curvedMember(z,.205,.867,.028,M.bridgeTimber,.003);
    const bays=12;
    for(let i=0;i<=bays;i++){
      const x=-8+i*16/bays,y=height(x);
      for(const [lo,hi]of[[-.045,.18],[.28,.515],[.61,.867],[1.00,1.105]])box(x,y+(lo+hi)/2,z,.22,hi-lo,.235,M.red);
      for(const side of[-1,1])box(x,y+.53,z+side*.105,.22,1.15,.025,M.red);
      box(x,y+.04,z,.285,.115,.285,M.bridgeTimber);
      box(x,y+1.14,z,.28,.09,.29,M.bridgeTimber);
      box(x,y+1.198,z,.20,.025,.22,M.bronze);
      emit(finial,M.gold,x,y+1.30,z,.085,.115,.085);
      // Flush straps and transverse pegs on the real side-girder faces.
      const face=z>1?3.225:-.025;
      box(x,y-.275,face,.115,.28,.018,M.bronze);
      for(const yy of[-.18,-.36])emit(peg,M.black,x,y+yy,face+(z>1?.014:-.014),.025,.018,.025,[Math.PI/2,0,0]);
      if(i<bays)for(const t of[1/3,2/3]){
        const xx=x+16/bays*t;
        box(xx,height(xx)+.577,z,.058,.585,.075,M.red);
      }
    }
  }
  // The small lamp is hung from a real transverse beam in the open under-gap.
  lantern(0,1.35,1.60,.40);
  between([0,1.78,1.60],[0,height(0)-.37,1.60],.014,.014,M.bronze,true);
}
