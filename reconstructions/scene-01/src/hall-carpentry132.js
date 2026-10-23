import * as T from 'three';
import {V,TAU} from './kernel.js';
import {layout124 as L} from './layout124.js';
import {mainHallUnderside148} from './hall-envelope148.js';
import {createHallSculpture149} from './hall-sculpture149.js';
import {buildOccupiedHallEave150} from './hall-eave150.js';
import {emitUpperBay161,makeRafterEnd161} from './hall-facade161.js';
import {createHallStructure185} from './hall-structure185.js';

// Recovered visible construction of HD01. All relief, infill and bearing
// members below are closed solids. The photo is only a measurement input.
export function buildHallCarpentry132(B,{column,carvedFitting,rosette}){
 const own=new Set(),keep=g=>{own.add(g);B.resources.add(g);return g;};
 const cream=B.m.plaster.clone();cream.name='hall132-lime-infill';cream.color.setHex(0x9f8b6a);cream.roughness=.96;
 const sap=makeRafterEnd161();
 const gild=B.m.gold.clone();gild.name='hall132-aged-gold-leaf';gild.color.setHex(0xd8ae58);gild.metalness=.58;gild.roughness=.43;B.m.hallInfill132=cream;B.m.hallSap132=sap;B.m.hallGilt132=gild;
 const sculpture=createHallSculpture149(B);B.hallSculpture149=sculpture;
 const structure185=createHallStructure185(B);B.hallStructure185=structure185;
 const bracket=(x,y,z,options)=>{if(z===5.15)structure185.front(x,y,z,false);else if(z>4.9&&z<5.4)structure185.front(x,y,z,true);else sculpture.capital(x,y,z,options);};
 const giltFace=(x,y,z,w,h)=>sculpture.fitting(x,y,z,w,h);
 const frieze=(left,right,y,z,rich=true)=>sculpture.frieze(left,right,y,z,.25,{rich,wooden:!rich,phase:left*.13});
 const bayArch=(left,right,y,z)=>sculpture.arch(left,right,y,z);
 const lower=L.hall.frontAxes,upper=[-6.770258796240704,-4.361749389177344,-1.9692422182982536,2.0017996375181815,4.722704860993423,6.939714594097563,9.15,11.15];
 B.label('hall132-lower-posts-and-seated-capitals',()=>{
  for(const z of[5.15,-.1,-5.1])for(const x of(z===5.15?lower:Array.from({length:7},(_,i)=>-7.95+i*3.18))){sculpture.column(x,z,1.35,5.54,z===5.15?.295:.34);bracket(x,5.54,z,{scale:1.01,height:.76,depth:z===5.15?1.65:1,headFitting:false,corner:Math.abs(x)>9});}
  for(const [y,h,d,z]of[[5.84,.23,.40,5.15],[6.37,.21,.31,5.66]])B.box(1.45,y,z,19.75,h,d,'wood');
  for(let i=0;i<lower.length-1;i++){const major=lower[i+1]-lower[i]>4;if(!major){frieze(lower[i]+.15,lower[i+1]-.15,5.36,5.32,false);bayArch(lower[i],lower[i+1],5.83,5.22);}}
  //185 actual primary portal replaces the former duplicate rich strip.
  // A single continuous bearing course is carried by the capitals, with fine
  // shadowed mortises between the ends rather than a floating gold strip.
  for(let k=0;k<67;k++){const x=-8.55+k*.30;B.box(x,6.32,6.35,.15,.17,.63,'darkwood');B.box(x,6.32,6.68,.12,.12,.055,'hallSap132');}
 });
 B.label('hall132-upper-timber-frame-and-cream-infill',()=>{
  // A concealed sill transfers every upper post into the lower capitals.
  B.box(1.45,6.82,5.18,19.75,.22,.40,'wood');for(const x of lower)B.box(x,6.56,5.15,.30,.31,.36,'wood');
  for(const z of[4.2,-4.8]){
   B.box(1.65,8.09,z-.12,19.25,3.17,.20,'darkwood');
   for(let i=0;i<upper.length-1;i++)B.label('hall161-recessed-upper-window-plaster-and-beams',()=>emitUpperBay161(B,sculpture,upper[i],upper[i+1],z));
   for(let i=0;i<upper.length;i++){
    const x=upper[i],front=z>0?z+.85:z;B.box(x,8.14,z+.11,.18,2.96,.29,'wood');B.box(x,8.14,z+.52,.15,2.96,.14,'wood');
    B.cyl(x,7.885,front+.13,.20,2.15,'red');bracket(x,8.96,front+.13,{scale:1.10,height:1.03,depth:1.35,corner:i===0||i===upper.length-1});giltFace(x,7.46,front+.31,.30,.32);B.cyl(x,7.02,front+.13,.208,.15,'goldDark');B.cyl(x,8.78,front+.13,.208,.14,'goldDark');
   }
   frieze(-8.10,11.40,9.35,z+.20,false);
   B.box(1.50,10.27,z+(z>0?1.0:.60),20.0,.21,.33,'wood');B.box(1.65,9.22,z+(z>0?.98:.13),19.40,.18,.32,'wood');
   for(let i=0;i<67;i++){const x=-8.35+i*.30;B.box(x,10.25,z+1.22,.14,.14,.66,'wood');B.box(x,10.25,z+1.57,.105,.105,.035,'hallSap132');}
  }
  // The front plaque has a real frame and modeled brush-like strokes.
  B.box(.06272051680546703,8.43,4.88,1.06,1.22,.13,'goldDark');B.box(.06272051680546703,8.43,4.96,.88,1.06,.035,'black');
  for(const dy of[-.55,.55])B.box(.06272051680546703,8.43+dy,4.98,.98,.035,.025,'gold');
  for(const dx of[-.48,.48])B.box(.06272051680546703+dx,8.43,4.98,.035,1.10,.025,'gold');
  for(let row=0;row<3;row++){const y=8.77-row*.33;for(const sign of[-1,1])B.between([.06272051680546703+sign*.14,y+.07,5.0],[.06272051680546703+sign*.11,y-.07,5.0],.025,.025,'gold');B.box(.06272051680546703,y,5.0,.29,.024,.026,'gold');B.between([.02272051680546703,y+.11,5.0],[.08272051680546703,y-.11,5.0],.023,.023,'gold');}
 });
 B.label('hall148-closed-upper-floor-and-end-frames',()=>{
  B.box(1.65,6.70,-.30,19.45,.20,9.24,'wood');
  for(const x of[-7.975,11.275]){
   const sign=Math.sign(x);B.box(x,8.07,-.30,.20,2.54,9.0,'darkwood');
   B.with(x+sign*.13,0,-.30,sign*Math.PI/2,()=>{
    for(let bay=0;bay<4;bay++)B.label('hall161-occupied-return-enclosure-in-held-end-frame',()=>emitUpperBay161(B,sculpture,-4.50+bay*2.25,-4.50+(bay+1)*2.25,0));
   });
  }
 });
 B.label('hall148-roof-coupled-purlin-bearings',()=>{
  for(const z of[4.2,-4.8]){
   const samples=Array.from({length:43},(_,k)=>-8.25+k*19.4/42);
   for(let j=0;j<samples.length-1;j++){
    const a=samples[j],b=samples[j+1];B.between([a,mainHallUnderside148(a,z)-.15,z],[b,mainHallUnderside148(b,z)-.15,z],.24,.30,'wood');
   }
   for(const x of samples){const under=mainHallUnderside148(x,z);B.box(x,under-.04,z,.34,.08,.35,'wood');}
   for(let k=0;k<7;k++){const x=-7.95+k*3.18,base=10.35,top=mainHallUnderside148(x,z)-.27,h=top-base;if(h>.08)B.box(x,base+h/2,z,.25,h,.30,'wood');}
  }
 });
 structure185.returns();
 buildOccupiedHallEave150(B,sculpture,upper);
 return {revision:'hall149-solid-carving-and-housed-cross-receivers',resources:own.size};
}
