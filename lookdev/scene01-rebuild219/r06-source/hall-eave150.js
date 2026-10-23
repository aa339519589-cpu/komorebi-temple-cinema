import {mainHallUnderside148} from './hall-envelope148.js';

// Structural infill of the photographed deep eave. The149 capitals formerly
// stopped below the148 roof, leaving an implausibly empty continuous cavity.
// Every new member sits on the existing header and meets the actual roof.
export function buildOccupiedHallEave150(B,sculpture,axes){
 const spring=10.28,z=4.88;
 B.label('hall150-occupied-deep-eave-bearing-courses',()=>{
  sculpture.moulding(1.48,10.26,z,20.05,.24,.50);
  sculpture.moulding(1.48,9.82,5.20,20.05,.23,.36);
  for(let bay=0;bay<axes.length-1;bay++){
   sculpture.arch(axes[bay],axes[bay+1],9.66,5.13);
   sculpture.frieze(axes[bay]+.12,axes[bay+1]-.12,9.83,5.28,.21,{rich:false,wooden:true});
  }
  //185: primary front stacks now run continuously from the actual post
  // head to a fitted roof saddle; the duplicate shallow upper stack is gone.
  // Crossed timber windows occupy the spaces between the primary stacks.
  // Open cells preserve depth and admit real oblique light beneath the roof.
  for(let bay=0;bay<axes.length-1;bay++){
   const left=axes[bay]+.40,right=axes[bay+1]-.40;
   if(right<=left)continue;
   const n=Math.max(2,Math.ceil((right-left)/.42));
   for(let j=0;j<=n;j++){
    const x=left+(right-left)*j/n,top=mainHallUnderside148(x,z)-.24,base=10.36;
    if(top>base+.06)B.box(x,(base+top)/2,z-.17,.075,top-base,.16,'hall149CutWood');
   }
   const samples=9;
   for(let j=0;j<samples;j++){
    const a=left+(right-left)*j/samples,b=left+(right-left)*(j+1)/samples;
    B.between([a,mainHallUnderside148(a,z)-.19,z-.17],[b,mainHallUnderside148(b,z)-.19,z-.17],.12,.18,'wood');
   }
  }
  // Three separately seated purlin courses run under the sloped soffit.
  // They continue round the left return rather than ending as a depth card.
  for(const zz of[4.64,5.34,6.05]){
   const a=-11.72,b=11.65,n=76;
   for(let j=0;j<n;j++){
    const x=a+(b-a)*j/n,q=a+(b-a)*(j+1)/n;
    B.between([x,mainHallUnderside148(x,zz)-.25,zz],[q,mainHallUnderside148(q,zz)-.25,zz],.18,.22,'wood');
   }
  }
  for(const x of[-11.55,-10.05,-8.55,-7.05,-5.55,-4.05,-2.55,-1.05,.45,1.95,3.45,4.95,6.45,7.95,9.45,10.95]){
   for(const [a,b]of[[4.35,5.38],[5.22,6.20]]){
    B.between([x,mainHallUnderside148(x,a)-.30,a],[x,mainHallUnderside148(x,b)-.30,b],.14,.20,'hall149CarvedWood');
   }
  }
 });
}
