// A material-space fibre field, never a photograph or an image of a lamp.
// The 0.612m pane has sub-mm fibres and irregular mm/cm density variation.
// Its dimensions and density are authored hypotheses, not recovered scans.
export function createWashiTissue103(){
 const n=1024,field=new Float32Array(n*n),base=new Uint8Array(n*n*4),emission=new Uint8Array(n*n*4);
 const hash=(x,y,s=0)=>{const a=Math.sin(x*127.1+y*311.7+s*17.13+103)*43758.5453;return a-Math.floor(a);};
 const noise=(x,y,period,seed)=>{const ix=Math.floor(x),iy=Math.floor(y),a=x-ix,b=y-iy,u=a*a*(3-2*a),v=b*b*(3-2*b),h=(i,j)=>hash((i%period+period)%period,(j%period+period)%period,seed);return(1-v)*((1-u)*h(ix,iy)+u*h(ix+1,iy))+v*((1-u)*h(ix,iy+1)+u*h(ix+1,iy+1));};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)field[y*n+x]=.895+.027*(noise(x/n*7,y/n*7,7,3)-.5)+.014*(noise(x/n*29,y/n*29,29,11)-.5)+.009*(hash(x,y,19)-.5);
 // Randomly oriented short fibre bundles, analytically rasterized below one
 // texel wide and wrapped at boundaries. No regular sinusoidal stripe weave.
 for(let k=0;k<24000;k++){
  const x=hash(k,1,29)*n,y=hash(k,2,31)*n,a=hash(k,3,37)*Math.PI*2,length=6+25*hash(k,4,41),dx=Math.cos(a),dy=Math.sin(a),radius=.26+.22*hash(k,5,43),gain=(hash(k,6,47)<.35?-1:1)*(.007+.007*hash(k,7,53));
  for(let j=0;j<=Math.ceil(length);j++){
   const t=j/Math.ceil(length),cx=x+dx*length*(t-.5),cy=y+dy*length*(t-.5),fade=Math.sin(Math.PI*t);
   for(let yy=Math.floor(cy)-1;yy<=Math.floor(cy)+1;yy++)for(let xx=Math.floor(cx)-1;xx<=Math.floor(cx)+1;xx++){
    const dist2=(xx+.5-cx)**2+(yy+.5-cy)**2;
    field[((yy%n+n)%n)*n+(xx%n+n)%n]+=gain*Math.exp(-dist2/(2*radius*radius))*fade;
   }
  }
 }
 let mean=0;for(const v of field)mean+=v;mean/=field.length;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=(y*n+x)*4,fibre=Math.max(.82,Math.min(.98,field[y*n+x]+.895-mean)),r=Math.hypot((x/n-.5)*1.25,(y/n-.5)*.95),lamp=.24+.76*Math.exp(-r*r*7.5);
  base[i]=240*fibre;base[i+1]=224*fibre;base[i+2]=185*fibre;base[i+3]=255;
  emission[i]=emission[i+1]=emission[i+2]=255*lamp*fibre;emission[i+3]=255;
 }
 return{n,base,emission,info:{paneWidthMetres:.612,texturePixels:n,meanFibreTarget:.895,fibreLengthsMetres:[6/n*.612,31/n*.612],bumpScaleMetres:.00004,authoredMaterial:true,referenceSceneRGBUsed:false}};
}
