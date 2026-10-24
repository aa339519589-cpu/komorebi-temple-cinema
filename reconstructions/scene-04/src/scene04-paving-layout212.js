import * as T from 'three';

// Reconsidered HD04 projected joint network. The three dominant tracks have
// staggered shorter stones and intermittent broken side fragments; the old31
// broad uninterrupted panels are not treated as immutable measured geometry.
// Pixel coordinates define solids only. No photograph is read by the renderer.
export function createPavingLayout212(traced){
 const rows=[[744,766,791,820,852,888,929,976,1028,1092,1162,1240,1350],[744,771,801,833,868,908,955,1016,1095,1198,1350],[744,770,801,834,870,910,956,1009,1078,1164,1252,1350]],records=[];
 const at=(profile,y)=>{let k=0;while(k<profile.length-2&&y>profile[k+1][0])k++;const a=profile[k],b=profile[k+1];return T.MathUtils.lerp(a[1],b[1],(y-a[0])/(b[0]-a[0]));};
 const h=(a,b)=>{const q=Math.sin(a*127.1+b*311.7)*43758.5453;return q-Math.floor(q);};
 const add=(pixels,column,row,fragment)=>{
  const original=pixels.map(traced.world),outline=[];
  for(let i=0;i<original.length;i++){const a=original[i],b=original[(i+1)%original.length],ia=a[1]>=8,ib=b[1]>=8;if(ia)outline.push(a);if(ia!==ib){const t=(8-a[1])/(b[1]-a[1]);outline.push([T.MathUtils.lerp(a[0],b[0],t),8]);}}
  if(outline.length<3)return;
  records.push({id:'reconstructed212-'+column+'-'+row+'-'+fragment,column,row,detailSeed:fragment*.51+13,pixels,outline,top:traced.groundY+.003*(h(row,column)-.5),thickness:.13+.025*h(row,column+9),jointGap:.009+.006*h(row,column+17),edgeBevel:.010+.005*h(row,column+23),edgeBevelDrop:.009,cornerRadius:.026,chipStrength:1.65,detailSpacing:.012,boundarySpacing:.015,microReliefScale:1.65,hollowCount:row>5?2:1,dampPropensity:h(row,column+51)>.30?.72+.28*h(row,column+63):.15,layout212:true,source:'HD04 projected staggered joints and inferred damaged side fragments; metric depth/wear remain authored hypotheses'});
 };
 for(let column=0;column<3;column++)for(let row=0;row<rows[column].length-1;row++){
  const y0=rows[column][row],y1=rows[column][row+1],l=traced.edgeProfiles[column],r=traced.edgeProfiles[column+1],offset=(column-1)*3,y0r=y0+offset,y1r=y1+offset,a=[at(l,y0),y0],b=[at(r,y0r),y0r],c=[at(r,y1r),y1r],d=[at(l,y1),y1];
  const split=(column===0&&[7,9,10,11].includes(row))||(column===2&&[7,8,10,11].includes(row));
  if(split){const f=column===0?.28:.74,pa=[T.MathUtils.lerp(a[0],b[0],f),T.MathUtils.lerp(a[1],b[1],f)],pb=[T.MathUtils.lerp(d[0],c[0],f+.035*Math.sin(row)),T.MathUtils.lerp(d[1],c[1],f)],mid=[T.MathUtils.lerp(pa[0],pb[0],.53)+5*Math.sin(row),T.MathUtils.lerp(pa[1],pb[1],.53)];add([a,pa,mid,pb,d],column,row,0);add([pa,b,c,pb,mid],column,row,1);}
  else add([a,b,c,d],column,row,0);
 }
 return records;
}

export function createSeamGrass212(){
 const p=[],uv=[],ix=[];
 for(let blade=0;blade<7;blade++){
  const a=blade*2.399,len=.045+.026*(.5+.5*Math.sin(blade*1.7)),off=p.length/3,N=8;
  for(let j=0;j<=N;j++)for(let side=0;side<2;side++){const t=j/N,w=.0022*Math.sin(Math.PI*t)*(side?1:-1),bend=.021*t*t;p.push(Math.cos(a)*bend-Math.sin(a)*w,len*t,Math.sin(a)*bend+Math.cos(a)*w);uv.push(side,t);if(j<N&&side===0){const q=off+j*2;ix.push(q,q+2,q+1,q+1,q+2,q+3);}}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}

export function createJointMoss212(){
 const p=[0,.06,0],uv=[.5,.5],ix=[],N=18;
 for(let k=0;k<N;k++){const a=k*Math.PI*2/N,r=.67+.14*Math.sin(k*2.39)+.08*Math.cos(k*4.1);p.push(Math.cos(a)*r,.035+.025*Math.sin(k*1.9),Math.sin(a)*r*.83);uv.push(.5+.5*Math.cos(a),.5+.5*Math.sin(a));}
 for(let k=0;k<N;k++)ix.push(0,1+(k+1)%N,1+k);
 for(let k=0;k<29;k++){
  const a=k*2.399,r=.62*Math.sqrt((k+.5)/29),x=Math.cos(a)*r,z=Math.sin(a)*r,az=a+.8*Math.sin(k),at=p.length/3,w=.08+.025*Math.sin(k*1.1),h=.14+.12*(.5+.5*Math.cos(k*2.1)),reach=.19;
  p.push(x-Math.sin(az)*w,.025,z+Math.cos(az)*w,x+Math.sin(az)*w,.025,z-Math.cos(az)*w,x+Math.cos(az)*reach,h,z+Math.sin(az)*reach);uv.push(0,0,1,0,.5,1);ix.push(at,at+2,at+1);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
