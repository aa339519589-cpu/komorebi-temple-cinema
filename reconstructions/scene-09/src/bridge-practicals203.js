import * as T from 'three';

// The reference has small luminous cases at the bridge landings. The old
// bridge retained only finials there. Both cases are carried from bronze
// saddles around those unchanged finials; the nearer west case hangs beside
// its post, while the east landing case stands on four closed supports.
export function buildBridgePracticals203(api){
 const{emit,box,between,group,light,materials:M}=api;
 const ring=new T.Shape([new T.Vector2(-.17,-.17),new T.Vector2(.17,-.17),new T.Vector2(.17,.17),new T.Vector2(-.17,.17)]),hole=new T.Path([new T.Vector2(-.104,-.104),new T.Vector2(-.104,.104),new T.Vector2(.104,.104),new T.Vector2(.104,-.104)]);ring.holes.push(hole);
 const saddle=new T.ExtrudeGeometry(ring,{depth:.035,bevelEnabled:true,bevelSize:.004,bevelThickness:.003,bevelSegments:1,steps:1});saddle.rotateX(-Math.PI/2);
 const cap=new T.CylinderGeometry(.105,.32,.14,4,1,false),crown=new T.LatheGeometry([[0,0],[.046,0],[.058,.025],[.043,.055],[.059,.085],[.039,.13],[0,.19]].map(p=>new T.Vector2(...p)),20),records=[];
 group(-.6,0,0,0,()=>{
  for(const[x,cd]of[[-8,8],[8,20]]){
   const deck=1.25,z=3.03,drop=x<0?-.34:0,outboard=x<0?.35:0;
   group(x,deck,z,0,()=>{
    emit(saddle,M.lanternMetal,0,1.18,0);
    for(const a of[-1,1])for(const b of[-1,1]){
     if(x<0)between([a*.146,1.215,b*.146],[a*.146,1.14,.35+b*.146],.024,.024,M.lanternMetal);
     else box(a*.146,1.38,b*.146,.024,.41,.024,M.lanternMetal);
    }
    group(0,drop,outboard,0,()=>{
    box(0,1.59,0,.39,.045,.39,M.lanternMetal);box(0,1.62,0,.35,.018,.35,M.lanternEdge);
    for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     box(0,1.845,.163,.326,.414,.008,M.paper);
     for(const xx of[-.174,.174])box(xx,1.845,.179,.025,.47,.029,M.lanternMetal);
     for(const yy of[1.625,2.065])box(0,yy,.182,.373,.024,.030,M.lanternEdge);
     for(const xx of[-.081,0,.081])box(xx,1.845,.183,.010,.408,.013,M.lanternMetal);
     for(const yy of[1.755,1.935])box(0,yy,.184,.325,.010,.013,M.lanternMetal);
    });
    box(0,2.096,0,.42,.04,.42,M.lanternMetal);emit(cap,M.lanternMetal,0,2.18,0,1,1,1,Math.PI/4);emit(crown,M.lanternEdge,0,2.25,0);
    light(0,1.845,0,cd,4.5,{kind:'bridge-post203'});
    });
   });
   records.push({originalPost:[x,deck,z],worldPost:[-.6+x*.72,deck,z],chamberLocalHeight:deck+1.845+drop,outboardOffset:outboard,candela:cd,reach:4.5,physicalMount:x<0?'Side-hung case carried by four closed inclined straps from original finial saddle':'Standing case carried by four closed supports from original finial saddle',inferredReferencePlacement:true});
  }
 },[.72,1,1]);
 return{revision:'scene09-asymmetric-mounted-bridge-practicals203-r13',fixtures:records,closedSolidPartsPerFixture:50,legacyBridgeGeometryHeld:true,referencePixelsSampled:false,visualAccepted:false};
}
