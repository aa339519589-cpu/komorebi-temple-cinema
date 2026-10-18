// Per-stone wetness and recessed joints are rasterised solely from the actual
// generated quadrilateral layout. R=edge contact, G=wetness, B=paving presence.
export function createPavingWetMask(T,polygons){
 const width=1024,height=2048,data=new Uint8Array(width*height*4),x0=-4.6,z0=-2,spanX=9.2,spanZ=21.4;
 const inside=(x,z,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if(((a[1]>z)!==(b[1]>z))&&(x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]))yes=!yes;}return yes;};
 const distance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);};
 for(const {points:p,wetness}of polygons){const xmin=Math.min(...p.map(q=>q[0])),xmax=Math.max(...p.map(q=>q[0])),zmin=Math.min(...p.map(q=>q[1])),zmax=Math.max(...p.map(q=>q[1]));
  const ix0=Math.max(0,Math.floor((xmin-x0)/spanX*width)),ix1=Math.min(width-1,Math.ceil((xmax-x0)/spanX*width)),iy0=Math.max(0,Math.floor((zmin-z0)/spanZ*height)),iy1=Math.min(height-1,Math.ceil((zmax-z0)/spanZ*height));
  for(let y=iy0;y<=iy1;y++)for(let x=ix0;x<=ix1;x++){const xx=x0+(x+.5)/width*spanX,zz=z0+(y+.5)/height*spanZ;if(!inside(xx,zz,p))continue;let d=Infinity;for(let k=0;k<p.length;k++)d=Math.min(d,distance(xx,zz,p[k],p[(k+1)%p.length]));let edge=Math.max(0,Math.min(1,(d-.009)/.021));edge=edge*edge*(3-2*edge);let i=(y*width+x)*4;data[i]=Math.round(edge*255);data[i+1]=Math.round(wetness*255);data[i+2]=255;data[i+3]=255;}
 }
 const texture=new T.DataTexture(data,width,height);texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.needsUpdate=true;return texture;
}

// Subtle diffuse mineral aggregate. Bright wet glints come from the actual
// reflected scene and lights, rather than white grains in the stone albedo.
export function createWetStoneGrain(T){
 const n=1024,data=new Uint8Array(n*n*4);
 function hash(x,y){let q=Math.imul(x,374761393)^Math.imul(y,668265263)^97169;q=Math.imul(q^(q>>>13),1274126177);return((q^(q>>>16))>>>0)/4294967296;}
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const micro=hash(x,y),mineral=hash(x>>1,y>>1),coarse=hash(x>>4,y>>4);
  let q=25+10*micro+7*coarse;if(mineral>.87)q+=8+12*micro;if(micro<.065)q*=.58;
  const i=(y*n+x)*4;data[i]=Math.min(255,q*1.04+2);data[i+1]=Math.min(255,q);data[i+2]=Math.min(255,q*.88);data[i+3]=255;
 }
 const texture=new T.DataTexture(data,n,n);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(.60,.60);texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.needsUpdate=true;return texture;
}

// Clip the paving itself around a 19 cm drainage slot. The grille must remain
// below the adjoining slab edges, with actual empty space above it.
export function clipPavingAtDrain(points){
 const c=Math.cos(.46),s=Math.sin(.46),distance=p=>c*(p[0]+1.9)-s*(p[1]-8.5);
 function halfPlane(sign){
  const out=[];for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length],da=sign*distance(a)-.095,db=sign*distance(b)-.095;
   if(da>=0)out.push(a);
   if((da>=0)!==(db>=0)){const t=da/(da-db);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
  }return out;
 }
 return[halfPlane(1),halfPlane(-1)].filter(p=>p.length>=3);
}
