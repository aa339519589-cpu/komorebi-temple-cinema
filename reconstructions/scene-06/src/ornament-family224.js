import * as T from 'three';
import {createShortSculpture224} from './ornament-short224.js';
import {addDragonPeony224} from './ornament224.js';

// Additional independently authored motif families for the existing cabinet
// frames. Original224 long/short proofs, joinery, offerings and light stay exact.
export const FAMILY_SCULPT_DEPTHS224=Object.freeze({'medium-dragon':.027,'paired-dragons':.026,'peony-cloud':.020,'peony-cup':.021,'compact-dragon':.026,'foliate-scroll':.038});
const fields224=new Map(),bearingAnchors224=new Map();let loaded224=false;
const asset224=new URL('../assets/ornament224-family-r01/',import.meta.url);
export async function loadOrnamentFamilies224(){
 if(loaded224)return;
 const response=await fetch(new URL('provenance-r04.json',asset224));if(!response.ok)throw Error('224 family metadata failed');const metadata=await response.json();
 await Promise.all(metadata.families.map(async f=>{const r=await fetch(new URL(f.field,asset224));if(!r.ok)throw Error('224 family sculpt field failed: '+f.family);const scalar=new Uint8Array(await r.arrayBuffer());if(scalar.length!==f.grid[0]*f.grid[1]*6)throw Error('224 family dimensions changed');fields224.set(f.family,{...f,scalar});}));
 const r=await fetch(new URL('../assets/ornament224-short-r01/sculpt-fields-r02-solid.gray8.bin',import.meta.url));if(!r.ok)throw Error('224 retained compact family field failed');
 fields224.set('compact-dragon',{family:'compact-dragon',naturalAspect:512/448,grid:[512,448],scalar:new Uint8Array(await r.arrayBuffer()),field:'../ornament224-short-r01/sculpt-fields-r02-solid.gray8.bin'});loaded224=true;
}
function oldGold224(b){
 if(!b.materials.ornamentFamily224Gilt){b.materials.ornamentFamily224Gilt=b.materials.tableGilt198.clone();b.materials.ornamentFamily224Gilt.name='ornament224-family-inherited198-old-gold';}
}
function mountFamily224(b,family,x,y,z,w,h,mirror=1){
 const f=fields224.get(family);if(!f)throw Error('224 family not loaded: '+family);oldGold224(b);
 const safeWidth=Math.min(w*.86,w-.0405),safeHeight=Math.min(h*.84,h-.029),height=Math.min(safeHeight,safeWidth/f.naturalAspect),width=height*f.naturalAspect;
 const depth=FAMILY_SCULPT_DEPTHS224[family],back=.006;
 if(width/2+.00012>=w/2-.01625||height/2+.00012>=h/2-.01325)throw Error('224 family intersects the retained physical frame: '+family);
 // Unit XY sculpt carries real metre Z depths. The two equal instance XY
 // scales preserve its natural guide aspect; Z remains authored carve depth.
 const key='224-family-r04:'+family+':'+mirror+':'+depth;
 const g=b.geometry(key,()=>{const q=createShortSculpture224({width:f.naturalAspect,height:1,depth,back,mirror,scalar:f.scalar,grid:f.grid});q.userData.sculpture={...q.userData.sculpture,revision:'224-main-families-r04',family,naturalAspect:f.naturalAspect,scalarSha256:f.fieldSha256??null};return q;});
 b.add(g,'ornamentFamily224Gilt',x,y,z+.006,height,height,1);
 b.root.userData.carvingMounts198??=[];b.root.userData.carvingMounts198.push({component:'224 additional inferred cabinet carving family',revision:'family-r04',partRole:'primary',family,inferredAuthoredGeometry:true,artifactScan:false,center:[x,y,z+.006],width,height,requestedField:[w,h],naturalAspect:f.naturalAspect,physicalAspect:width/height,equalXYScale:true,scaleXYZ:[height,height,1],frontDepth:depth,backThickness:back,frameClearance:[(w-width)/2-.01625,(h-height)/2-.01325],carrierContact:'Rear at6mm inside the unchanged black-lacquer carrier face',sourceRGBMaterial:false,mirror,triangles:g.userData.sculpture.triangles,visualAccepted:false,photographicAccepted:false});
 if(family==='medium-dragon'||family==='paired-dragons')mountFoliateScroll224(b,x,y,z,w,h,width,family,mirror);
}
// The lower attachment point is an actual positive scalar sample of the
// already closed primary carving, rather than a detached centre-of-gap seal.
function lowerBearingAnchor224(f,side,mirror){
 const key=f.family+':'+side+':'+mirror;if(bearingAnchors224.has(key))return bearingAnchors224.get(key);
 const[W,H]=f.grid;let best=null;
 for(let j=Math.ceil((H-1)*.84);j<=Math.floor((H-1)*.88);j++)for(let i=0;i<W;i++){
  const q=f.scalar[j*W+i];if(q<100)continue;
  const v=j/(H-1),xx=(i/(W-1)-.5)*f.naturalAspect*mirror,yy=.5-v;
  const score=side*xx-Math.abs(v-.86)*f.naturalAspect*.50;
  if(!best||score>best.score)best={gridPixel:[i,j],templatePoint:[xx,yy],scalarValue:q,score};
 }
 if(!best)throw Error('224 primary lower bearing has no solid source sample: '+f.family);
 bearingAnchors224.set(key,best);return best;
}
function mountFoliateScroll224(b,x,y,z,w,h,mainWidth,mainFamily,mainMirror){
 const f=fields224.get('foliate-scroll'),primary=fields224.get(mainFamily);if(!f)throw Error('224 foliate scroll field not loaded');
 const gap=w/2-.018-mainWidth/2;if(gap<.052)return;
 const initialHeight=Math.min(gap*.92/f.naturalAspect,h*.78),depth=FAMILY_SCULPT_DEPTHS224['foliate-scroll'],back=.006,primaryHeight=mainWidth/primary.naturalAspect;
 for(const side of[-1,1]){
  const mirror=side>0?1:-1,angle=side*(mainFamily==='paired-dragons'?(y<1?.065:-.05):(y<1?.045:-.04));
  const anchor=lowerBearingAnchor224(primary,side,mainMirror),target=[x+anchor.templatePoint[0]*primaryHeight,y+anchor.templatePoint[1]*primaryHeight];
  let height=initialHeight,width,xx,yy,envelopeWidth,envelopeHeight,clearX,clearY,rootRotX,rootRotY,fitIterations=0;
  for(;fitIterations<24;fitIterations++){
   width=height*f.naturalAspect;
   const rootX=(f.stemRootPixel[0]/(f.grid[0]-1)-.5)*width*mirror,rootY=(.5-f.stemRootPixel[1]/(f.grid[1]-1))*height;
   rootRotX=rootX*Math.cos(angle)-rootY*Math.sin(angle);rootRotY=rootX*Math.sin(angle)+rootY*Math.cos(angle);
   xx=target[0]-rootRotX;yy=target[1]-rootRotY;
   envelopeWidth=width*Math.cos(angle)+height*Math.abs(Math.sin(angle));envelopeHeight=height*Math.cos(angle)+width*Math.abs(Math.sin(angle));
   clearX=w/2-Math.abs(xx-x)-envelopeWidth/2-.01625;clearY=h/2-Math.abs(yy-y)-envelopeHeight/2-.01325;
   if(Math.min(clearX,clearY)>=.003)break;
   height*=.94;
  }
  if(Math.min(clearX,clearY)<.00012)throw Error('224 continuous leaf bearing intersects retained frame');
  const key='224-foliate-scroll-r04:'+mirror+':'+depth;
  const g=b.geometry(key,()=>{const q=createShortSculpture224({width:f.naturalAspect,height:1,depth,back,mirror,scalar:f.scalar,grid:f.grid});q.userData.sculpture={...q.userData.sculpture,revision:'224-foliate-scroll-r04',family:'foliate-scroll',naturalAspect:f.naturalAspect,scalarSha256:f.fieldSha256};return q;});
  b.add(g,'ornamentFamily224Gilt',xx,yy,z+.006,height,height,1,0,0,angle);
  b.root.userData.carvingMounts198.push({component:'224 subordinate continuous curled-leaf gap bearing',revision:'family-r04',partRole:'subordinate-scroll',family:'foliate-scroll',mainFamily,rotationZ:angle,axisAlignedEnvelope:[envelopeWidth,envelopeHeight],parentFieldCenter:[x,y,z+.006],center:[xx,yy,z+.006],width,height,naturalAspect:f.naturalAspect,physicalAspect:width/height,equalXYScale:true,scaleXYZ:[height,height,1],frameClearance:[clearX,clearY],fitIterations,frontDepth:depth,backThickness:back,primaryContactAnchor:anchor,contactWorldXY:target,stemContactSourcePixel:f.stemRootPixel,stemContactScalarValue:f.stemRootScalarValue,contactXYErrorMetres:Math.hypot(xx+rootRotX-target[0],yy+rootRotY-target[1]),carrierContact:'Closed rear embeds6mm in retained black-lacquer carrier; the stem also seats on an actual solid sample of the primary lower contour',sourceRGBMaterial:false,triangles:g.userData.sculpture.triangles,visualAccepted:false,photographicAccepted:false});
 }
}
export function tryRemainingAltarFamilies224(b,x,y,z,w,h){
 const middle=Math.abs(y-1.28)<1e-7,lower=Math.abs(y-.92)<1e-7,upper=Math.abs(y-1.64)<1e-7;
 if(!middle&&!lower&&!upper)return false;
 // Retain the exact already-reviewed left long motif and left compact proof.
 if(middle&&x<-.2)return false;
 if(middle&&x>.8){addDragonPeony224(b,x,y,z,w,h,{mirror:1});return true;}
 if(middle){mountFamily224(b,x>.2?'compact-dragon':'peony-cup',x,y,z,w,h,x>.2?-1:1);return true;}
 const ax=Math.abs(x),mirror=x<0?-1:1;
 if(lower){mountFamily224(b,ax>1.2?'paired-dragons':ax>.3?'medium-dragon':'peony-cup',x,y,z,w,h,mirror);return true;}
 mountFamily224(b,ax>1.6?'medium-dragon':ax>.95?'peony-cup':ax>.3?'paired-dragons':'peony-cloud',x,y,z,w,h,mirror);return true;
}
