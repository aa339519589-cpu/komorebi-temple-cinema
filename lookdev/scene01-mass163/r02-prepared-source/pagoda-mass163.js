import {layout124 as L} from './layout124.js';
import {createHallSculpture149} from './hall-sculpture149.js';
import {makeRafterEnd161} from './hall-facade161.js';

// The photographed tower has a narrow timber core inside deep, independently
// carried roofs. Every rail, infill cell, crossed capital and cantilever here
// is a closed solid. No reference pixels are used in the scene.
export function buildPagodaMass163(B,{roof,finialTorus}){
 const S=createHallSculpture149(B);
 B.m.tower163RafterEnd=makeRafterEnd161();
 const eaves=Array.from({length:5},(_,i)=>5.6+i*L.pagoda.tierPitch);
 const widths=Array.from({length:5},(_,i)=>L.pagoda.bottomRoofWidth+(L.pagoda.topRoofWidth-L.pagoda.bottomRoofWidth)*i/4);
 const plaster=B.m.plaster.clone();plaster.name='tower163-recessed-warm-lime';plaster.color.setHex(0xb9ab93);plaster.roughness=.94;B.m.tower163Lime=plaster;
 const shadow=B.m.darkwood.clone();shadow.name='tower163-recessed-vent';shadow.color.multiplyScalar(.57);B.m.tower163Shadow=shadow;
 B.with(...L.pagoda.position,L.pagoda.yaw,()=>{
  B.label('pagoda-plinth',()=>{B.box(0,.05,0,5.1,.8,5.1,'stone');B.box(0,.48,0,5.4,.16,5.4,'stoneLight');});
  for(let tier=0;tier<5;tier++){
   const y=eaves[tier],w=widths[tier],floor=tier?eaves[tier-1]+.66:.60,body=w*.445,half=body/2,shaftTop=y-.92;
   B.label('pagoda163-'+(tier+1)+'-recessed-column-gallery',()=>{
    B.box(0,floor-.08,0,body+.79,.20,body+.79,'red');
    B.box(0,floor-.205,0,body+.48,.08,body+.48,'darkwood');
    for(let face=0;face<4;face++)B.with(0,0,0,face*Math.PI/2,()=>{
     // Recessed infill is broken into framed lime cells; it no longer reads
     // as a continuous bright box wrapped in dense horizontal grilles.
     for(const side of[-1,1]){
      const cx=side*half*.5,cell=half-.24,lo=floor+.21,hi=shaftTop-.10;
      B.box(cx,(lo+hi)/2,half-.11,cell,hi-lo,.13,'tower163Lime');
      if(hi-lo>1.1){
       B.box(cx,lo+.68,half-.015,cell*.72,1.04,.10,'tower163Shadow');
       for(let j=0;j<5;j++)B.box(cx-cell*.31+j*cell*.155,lo+.68,half+.045,.035,.98,.07,'redLight');
       for(const yy of[lo+.25,lo+.69,lo+1.11])B.box(cx,yy,half+.055,cell*.74,.043,.08,'wood');
      }
      for(const xx of[cx-cell/2,cx+cell/2])S.moulding(xx,(lo+hi)/2,half+.015,.09,hi-lo+.08,.19,'red');
     }
     for(const yy of[floor+.16,shaftTop-.08])S.moulding(0,yy,half+.035,body+.21,.15,.25,'redLight');
     for(const x of[-half,0,half]){
      S.column(x,half+.14,floor,shaftTop,.142,{headFittingHeight:.19});
      S.capital(x,shaftTop,half+.14,{scale:.56,depth:1.62,corner:Math.abs(x)===half,headFitting:false});
      // Paired rising cantilevers carry the outer roof purlin from the
      // capital, so a long overhang has weight and a coherent load path.
      for(const xx of[-.145,.145])B.between([x+xx,shaftTop+.36,half+.35],[x+xx,y-.12,w*.432],.12,.18,'wood');
     }
     // Balcony rails sit outside the columns and keep the gallery open.
     for(const yy of[floor+.28,floor+.68])S.moulding(0,yy,half+.52,body+.91,.085,.10,'redLight');
     for(let j=0;j<=10;j++){
      const x=-(body+.76)/2+(body+.76)*j/10;
      B.box(x,floor+.47,half+.52,j%5===0?.115:.055,.59,j%5===0?.115:.055,'red');
     }
     for(const x of[-(body+.76)/2,(body+.76)/2]){
      B.box(x,floor+.49,half+.52,.16,.84,.16,'red');
      S.fitting(x,floor+.70,half+.613,.15,.13,{old:true});
     }
     // Four long purlins form two distinct, shadowed bearing courses.
     for(const [zz,offset]of[[w*.405,-.27],[w*.455,-.11]]){
      for(let j=0;j<16;j++){
       const a=-w*.455+w*.91*j/16,b=-w*.455+w*.91*(j+1)/16;
       const height=x=>y+offset+.43*Math.pow(Math.abs(x)/(w*.455),5);
       B.between([a,height(a),zz],[b,height(b),zz],.14,.19,'wood');
      }
     }
    });
   });
   roof({w,d:w,eave:y,rise:1.13,curl:.57,ridge:0,name:'pagoda163-'+(tier+1)+'-deep-carried-ceramic-roof',tilePitch:.17,tileRadius:.067,edgeCapRadius:.071,ceramicRoof:true});
  }
  // Preserve the measured physical finial and its top landmark.
  B.label('pagoda-finial',()=>{B.with(0,eaves[4]+1.25,0,0,()=>B.with(0,-17.65,0,0,()=>{
   const base=17.65;B.cyl(0,base+.08,0,.34,.18,'goldDark');B.emit(B.coneG,'gold',0,base+.40,0,.30,.55,.30);B.cyl(0,19.65,0,.043,4.1,'goldDark');
   for(let k=0;k<16;k++){const yy=base+.78+k*.22,r=.24*(1-k*.037);B.emit(finialTorus,'gold',0,yy,0,r,r,r,[Math.PI/2,0,0]);B.sphere(0,yy,0,.075,.10,.075,'gold');}
   B.sphere(0,21.95,0,.12,.19,.12,'goldLight');B.cyl(0,22.3,0,.024,.5,'gold');
  }),[1,L.pagoda.finialHeight/4.9,1]);});
 },L.pagoda.scale);
 return{revision:'pagoda163-narrow-core-deep-bearing-roofs',roofWidths:widths,referencePhotographSampled:false};
}
