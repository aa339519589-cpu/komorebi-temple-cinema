import * as T from 'three';
import {noise} from './kernel.js';

// Source-built layered enclosure. The HD photo is a composition/scale
// comparison only. All windows, plaster cells and timber joints are solids.
export function installHallFinish161(B){
 const saved={};
 const image=B.m.red.map.image,N=1024,canvas=document.createElement('canvas');canvas.width=canvas.height=N;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,N,N);
 const pixels=ctx.getImageData(0,0,N,N);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const i=(y*N+x)*4,grain=(pixels.data[i]*.50+pixels.data[i+1]*.34+pixels.data[i+2]*.16)/255;
  const broad=noise(x*.0018,y*.024,161),fine=noise(x*.005,y*.08,167),wear=.43+.10*(broad-.5);
  const value=.98+.035*(fine-.5),wood=[pixels.data[i]*1.68,pixels.data[i+1]*1.42,pixels.data[i+2]*1.26];
  for(let c=0;c<3;c++)pixels.data[i+c]=Math.round(([145,78,43][c]*(1-wear)+wood[c]*wear)*value);
 }
 ctx.putImageData(pixels,0,0);
 const paint=new T.CanvasTexture(canvas);paint.name='hall161-vermilion-paint-over-existing-CC0-timber';paint.colorSpace=T.SRGBColorSpace;paint.wrapS=paint.wrapT=T.RepeatWrapping;paint.anisotropy=8;
 for(const key of['red','redLight','wood','darkwood','endwood']){
  const original=B.m[key],mat=original.clone();saved[key]=original;mat.name='hall161-aged-'+key;
  mat.onBeforeCompile=shader=>{original.onBeforeCompile(shader);shader.fragmentShader=shader.fragmentShader.replace('diffuseColor.rgb*=.73+.40*age;','diffuseColor.rgb*=.90+.16*age;').replace('smoothstep(.72,.83,chip)*.16','smoothstep(.72,.83,chip)*.08');};
  mat.customProgramCacheKey=()=>original.customProgramCacheKey()+'-hall219-warm-painted-cypress';
  if(key==='red'||key==='redLight'){mat.map=paint;mat.color.setRGB(...(key==='red'?[1,1,1]:[1.05,1.015,.96]));}
  else mat.color.setRGB(...({wood:[4.0,2.65,1.65],darkwood:[1.60,.98,.49],endwood:[4.6,3.25,1.95]}[key]));
  mat.roughness=key==='darkwood'?.87:.72;mat.clearcoat=.045;mat.clearcoatRoughness=.58;mat.specularIntensity=.38;mat.normalScale.set(.15,.15);
  B.m[key]=mat;B.m['hall161-'+key]=mat;
 }
 const plaster=new T.MeshStandardMaterial({name:'hall161-recessed-aged-lime',color:0xada08a,roughness:.96});B.m.hall161Plaster=plaster;
 const recess=B.m.darkwood.clone();recess.name='hall161-deep-vent-shadow';recess.color.multiplyScalar(.40);B.m.hall161Recess=recess;
 return()=>Object.assign(B.m,saved);
}

export function makeRafterEnd161(){
 const N=256,data=new Uint8Array(N*N*4);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const xx=(x-N*.34)/N,yy=(y-N*.62)/N,r=Math.hypot(xx*.83,yy),ring=.5+.5*Math.sin(r*179+noise(x*.018,y*.025,172)*5),mineral=noise(x*.23,y*.23,173),v=.65+.19*ring+.16*mineral,i=(y*N+x)*4;
  data[i]=Math.round(146*v);data[i+1]=Math.round(122*v);data[i+2]=Math.round(87*v);data[i+3]=255;
 }
 const map=new T.DataTexture(data,N,N);map.name='hall161-real-endgrain-rafter-wood';map.colorSpace=T.SRGBColorSpace;map.generateMipmaps=true;map.minFilter=T.LinearMipmapLinearFilter;map.needsUpdate=true;
 return new T.MeshStandardMaterial({name:'hall161-rough-exposed-endgrain',map,color:0xffffff,roughness:.97});
}

export function emitUpperBay161(B,S,left,right,z,{back=false}={}){
 const width=right-left,cx=(left+right)/2,inset=.18,span=width-inset*2;
 //219-R12: primary girts retain their depth; secondary glazing bars are
 // slimmer, and one taller upper lime field restores the bay hierarchy.
 // A recessed timber window occupies the lower field. Thick framing and
 // narrow lime cells above replace the old three uninterrupted white bands.
 B.box(cx,7.47,z-.12,span,.81,.16,'hall161Recess');
 const cells=width>3.1?3:width>2.15?2:1,cell=span/cells;
 for(let k=0;k<cells;k++){
  const a=left+inset+k*cell,b=a+cell,c=(a+b)/2;
  for(const [y,h]of[[7.93,.20],[8.62,.50]]){
   B.box(c,y,z-.055,cell-.105,h,.13,'hall161Plaster',0,.94+.065*noise(k+left,y,161));
   for(const yy of[y-h/2-.018,y+h/2+.018])S.moulding(c,yy,z+.055,cell-.07,.035,.11,'darkwood');
  }
  const battens=Math.max(5,Math.round((cell-.12)/.135));
  for(let j=0;j<=battens;j++){
   const x=a+.06+(cell-.12)*j/battens;
   B.box(x,7.48,z+.015,.025,.64,.13,'wood');
  }
  for(const yy of[7.26,7.49,7.72])B.box(c,yy,z+.04,cell-.08,.045,.13,'wood');
  for(const x of[a+.025,b-.025])S.moulding(x,8.05,z+.115,.105,2.28,.30,'red');
 }
 for(const [y,h,d]of[[6.95,.25,.44],[7.80,.085,.29],[8.22,.265,.48],[8.96,.085,.31],[9.29,.19,.45]]){
  S.moulding(cx,y,z+.235,width+.04,h,d,'wood');
  // Pegged cheeks sit in the bearing beam rather than floating gold strips.
  for(const x of[left+.24,right-.24])B.box(x,y,z+d/2+.25,.065,h*.54,.024,'darkwood');
 }
 S.frieze(left+.13,right-.13,8.23,z+.47,.205,{rich:false,wooden:true,phase:left*.31});
 S.arch(left+.03,right-.03,9.04,z+.39);
 // The deep face of each primary bay lands on the floor sill and carries
 // the beam courses; the existing outward columns/capitals remain separate.
 for(const x of[left,right])S.moulding(x,8.10,z+.22,.235,2.65,.47,'red');
}

export function emitLowerWindow161(B,S,left,right,z=4.50){
 const width=right-left-.39,cx=(left+right)/2;
 // Taller screen leaves meet the raised163 headers; their sill remains on
 // the held stone platform. Rebuilt stiles and transoms close the actual bay.
 B.box(cx,3.235,z-.29,width,3.67,.17,'hall161Recess');
 const leaves=width>1.55?3:2,leafW=(width-.10)/leaves;
 for(let k=0;k<leaves;k++){
  const x=cx-width/2+.05+leafW*(k+.5),recess=k===leaves-1?-.14:0;
  B.box(x,3.255,z-.16+recess,leafW-.045,2.72,.06,'paper');
  B.box(x,1.65,z-.08+recess,leafW-.035,.47,.13,'wood');
  for(const xx of[x-leafW/2+.025,x+leafW/2-.025])S.moulding(xx,3.115,z+.015+recess,.058,3.43,.15,'red');
  const n=Math.max(4,Math.round(leafW/.075));
  for(let j=1;j<n;j++)B.box(x-leafW/2+j*leafW/n,3.255,z-.045+recess,.018,2.68,.048,'wood');
  for(const yy of[1.93,2.55,3.255,3.96,4.61])S.moulding(x,yy,z+.015+recess,leafW-.04,.035,.085,'wood');
 }
 for(const xx of[cx-width/2-.04,cx+width/2+.04])S.moulding(xx,3.255,z+.075,.145,3.78,.32,'redLight');
 for(const [y,h]of[[1.42,.16],[4.70,.16],[5.14,.14]])S.moulding(cx,y,z+.085,width+.22,h,.35,'wood');
 const transoms=Math.ceil(width/.10);
 for(let j=0;j<=transoms;j++)B.box(cx-width/2+j*width/transoms,4.92,z+.015,.027,.31,.13,'wood');
 for(const yy of[4.83,4.99])B.box(cx,yy,z+.035,width,.027,.15,'darkwood');
}
