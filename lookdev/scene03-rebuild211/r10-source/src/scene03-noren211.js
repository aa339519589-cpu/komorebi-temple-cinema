// Thin closed hanging cloth with gravity folds and a shallow sixteen-petal
// embroidered crest. Replaces a thick flat board and projecting bead petals.
export function buildNoren211(T,{emit,cloth,gold},position,width,height,variant=0){
 const [cx,cy,cz]=position,nx=28,ny=42,p=[],uv=[],ix=[],stride=(nx+1)*(ny+1);
 const surface=(x,y)=>.012*Math.sin(x*14+variant*.8)*(.45+.55*(.5-y/height))+.006*Math.sin(x*29+y*4+variant);
 for(let side=0;side<2;side++)for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const x=-width/2+i*width/nx,y=-height/2+j*height/ny,hem=.009*Math.sin(x*19+variant)*(1-j/ny)**5;p.push(x,y+hem,surface(x,y)-(side?.003:0));uv.push(i/nx,j/ny);
 }
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ix.push(a,b,c,b,d,c,a+stride,c+stride,b+stride,b+stride,c+stride,d+stride);}
 const border=[...Array.from({length:nx},(_,i)=>i),...Array.from({length:ny},(_,j)=>j*(nx+1)+nx),...Array.from({length:nx},(_,i)=>ny*(nx+1)+nx-i),...Array.from({length:ny},(_,j)=>(ny-j)*(nx+1))];
 for(let j=0;j<border.length;j++){const a=border[j],b=border[(j+1)%border.length];ix.push(a,a+stride,b,b,a+stride,b+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.name='scene03-211-closed-folded-noren';emit(g,cloth,position);
 const pp=[],uu=[],ids=[],N=16,R=12,W=6,radius=.235;
 for(let k=0;k<N;k++){
  const a=k*Math.PI*2/N,ca=Math.cos(a),sa=Math.sin(a),base=pp.length/3,body=(R+1)*(W+1);
  for(let side=0;side<2;side++)for(let j=0;j<=R;j++)for(let l=0;l<=W;l++){
   const t=j/R,f=j===0||j===R?0:Math.sin(Math.PI*t),r=.034+(radius-.034)*t,w=(l/W*2-1)*.024*Math.sqrt(f),x=ca*r-sa*w,y=sa*r+ca*w;
   pp.push(x,y,surface(x,y)+.002+(side?0:.0012*f));uu.push(.5+x,.5+y);
  }
  const tri=(a,b,c)=>{ids.push(a,c,b,a+body,b+body,c+body);};
  for(let j=0;j<R;j++)for(let l=0;l<W;l++){const a=base+j*(W+1)+l,b=a+1,c=a+W+1,d=c+1;tri(a,b,c);tri(b,d,c);}
  const edge=[...Array.from({length:W},(_,i)=>i),...Array.from({length:R},(_,j)=>j*(W+1)+W),...Array.from({length:W},(_,i)=>R*(W+1)+W-i),...Array.from({length:R},(_,j)=>(R-j)*(W+1))];
  for(let j=0;j<edge.length;j++){const a=base+edge[j],b=base+edge[(j+1)%edge.length];ids.push(a,b,a+body,b,b+body,a+body);}
 }
 const flower=new T.BufferGeometry();flower.setAttribute('position',new T.Float32BufferAttribute(pp,3));flower.setAttribute('uv',new T.Float32BufferAttribute(uu,2));flower.setIndex(ids);flower.computeVertexNormals();flower.name='scene03-211-shallow-embroidered-chrysanthemum';emit(flower,gold,position);
 const boss=new T.CylinderGeometry(.035,.035,.0025,24);boss.rotateX(Math.PI/2);emit(boss,gold,[cx,cy,cz+surface(0,0)+.003]);
 return{position,width,height,thickness:.003,crest:'Sixteen shallow cloth-conforming embroidery petals',photographicAccepted:false};
}
