import * as T from 'three';

// Draft for the next native lighting/architecture iteration. Not imported by
// the active scene or the immutable film. All dimensions are altar-room metres.
// Real sliding carriers move their paper AND lattice together, leaving an
// actual clear opening instead of shining sun through a wall-wide fixed grid.
export function createShojiPaper234(){
 const n=256,bytes=new Uint8Array(n*n*4);let seed=234006;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const noise=seed/4294967296-.5;
  const fibre=Math.sin(x*.87+.13*Math.sin(y*.081))*.28+Math.sin(y*1.13+x*.017)*.19;
  const v=Math.round(242+3*noise+2*fibre),i=(y*n+x)*4;
  bytes[i]=bytes[i+1]=bytes[i+2]=v;bytes[i+3]=255;
 }
 const map=new T.DataTexture(bytes,n,n,T.RGBAFormat);map.colorSpace=T.SRGBColorSpace;map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter;map.generateMipmaps=true;map.anisotropy=8;map.needsUpdate=true;
 const make=(side)=>new T.MeshStandardMaterial({name:'scene06-paper234-'+(side<0?'left-daylit':'right-shaded')+'-sliding-shoji',color:'#e1dccd',map,roughness:.96,metalness:0,emissive:'#dfd1af',emissiveMap:map,emissiveIntensity:side<0?.75:.16});
 return{map,left:make(-1),right:make(1),scope:'An inferred diffuse exterior-radiance boundary on actual opaque paper. Emission stands for uncomputed paper transmission, not measured lighting or full GI.'};
}

export function buildSlidingShoji234({box,aperture,paper,timber}){
 const{side,x,z,bottom,top,width}=aperture,height=top-bottom,bay=Math.round((z+4.5)/2.4),leftOpen=[.18,.37,.45,.08,.14,.22],rightOpen=[0,.05,.10,0,.04,.03];
 const openingFraction=(side<0?leftOpen:rightOpen)[bay],pw=width/2+.018,stile=.042,rail=.045,records=[];
 if(!Number.isFinite(openingFraction)||height<=0)throw Error('Shoji234 aperture is outside the retained six-bay room.');
 for(let panel=0;panel<2;panel++){
  const moving=panel===(bay%2),direction=panel===0?1:-1;
  const centreZ=z+(panel===0?-1:1)*width/4+(moving?direction*width*openingFraction:0);
  const centreX=x-side*(.025+panel*.035),centreY=(bottom+top)/2;
  const body=box([centreX+side*.014,centreY,centreZ],[.0018,height-.078,pw-.072],side<0?paper.left:paper.right);
  body.name='scene06-paper234-actual-sliding-paper-panel';body.castShadow=true;body.receiveShadow=true;
  body.userData.paper234={bay,side,panel,actualThickness:.0018,radianceBoundaryApproximation:true};
  for(const sign of[-1,1]){
   const v=box([centreX,centreY,centreZ+sign*(pw-stile)/2],[.042,height,stile],timber);v.name='scene06-paper234-sliding-shoji-stile';
   const h=box([centreX,bottom+(sign>0?height-rail/2:rail/2),centreZ],[.042,rail,pw-stile*2],timber);h.name='scene06-paper234-sliding-shoji-rail';
  }
  const rows=Math.ceil((height-.10)/.23),cols=Math.ceil((pw-.08)/.15);
  for(let j=1;j<rows;j++){
   const bar=box([centreX-side*.008,bottom+.05+j*(height-.10)/rows,centreZ],[.025,.010,pw-.078],timber);bar.name='scene06-paper234-carried-horizontal-lattice';
  }
  for(let j=1;j<cols;j++){
   const bar=box([centreX-side*.012,centreY,centreZ-pw/2+.04+j*(pw-.08)/cols],[.023,height-.090,.011],timber);bar.name='scene06-paper234-carried-vertical-lattice';
  }
  // A structural middle rail belongs to the sliding carrier, so it follows
  // the same transform and cannot float across the uncovered opening.
  const middle=box([centreX,centreY,centreZ],[.042,.025,pw-.078],timber);middle.name='scene06-paper234-panel-middle-rail';
  records.push({panel,centre:[centreX,centreY,centreZ],outerSize:[.042,height,pw],moving,travel:moving?direction*width*openingFraction:0,latticeFollowsCarrier:true,paperThickness:.0018});
 }
 return{bay,side,openingFraction,panels:records,modelledClearSlot:width*openingFraction,sourceReferenceClaim:'Inferred movable paper/lattice construction; exact unseen shutter positions are not measurable from the supplied photograph.',photographicAccepted:false};
}
