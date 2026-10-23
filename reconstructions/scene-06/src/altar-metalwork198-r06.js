import * as T from 'three';

// R06 actual closed metalwork. Fine chasing is cut into the solid sleeve;
// the relief is millimetres proud of it, rather than a bulb on the red leg.
const TAU=Math.PI*2;
const SLEEVE_LO=.357,SLEEVE_HI=.461;
const sleeveProfile=[[0,.0430],[.07,.0445],[.20,.0480],[.39,.0510],[.58,.0495],[.79,.0465],[.94,.0434],[1,.0425]];
function mixProfile(points,t){
 let i=0;while(i<points.length-2&&t>points[i+1][0])i++;
 const f=T.MathUtils.smoothstep((t-points[i][0])/(points[i+1][0]-points[i][0]),0,1);
 return T.MathUtils.lerp(points[i][1],points[i+1][1],f);
}
function sleeveRadius(t,angle){
 const envelope=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.75),a=Math.atan2(Math.sin(angle),Math.cos(angle));
 // Twenty-four shallow flutes around the sleeve and nine fine fan cuts on
 // its front; both are actual radial recesses in the closed casting.
 let fan=0;for(let j=-4;j<=4;j++)fan=Math.max(fan,Math.exp(-Math.pow((a-j*(.045+.060*t))/.019,2)));
 const front=Math.exp(-Math.pow(a/.77,6));
 return mixProfile(sleeveProfile,t)-envelope*(.00105*(.5+.5*Math.cos(24*angle+.20*Math.sin(Math.PI*t)))+.0020*front*fan);
}
function chasedSleeveGeometry(){
 const rows=64,cols=256,stride=(rows+1)*(cols+1),pos=[],uv=[],index=[];
 for(let skin=0;skin<2;skin++)for(let j=0;j<=rows;j++)for(let k=0;k<=cols;k++){
  const t=j/rows,a=k/cols*TAU,r=skin===0?sleeveRadius(t,a):.0369;
  pos.push(Math.sin(a)*r,SLEEVE_LO+t*(SLEEVE_HI-SLEEVE_LO),Math.cos(a)*r);uv.push(k/cols,t);
  if(j<rows&&k<cols){const q=skin*stride+j*(cols+1)+k,b=q+cols+1;
   if(skin===0)index.push(q,q+1,b,q+1,b+1,b);else index.push(q,b,q+1,q+1,b,b+1);
  }
 }
 for(const j of[0,rows])for(let k=0;k<cols;k++){
  const a=j*(cols+1)+k,b=a+1,c=a+stride,d=c+1;
  if(j===0)index.push(a,c,b,b,c,d);else index.push(a,b,c,b,d,c);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
 g.userData={closedCarvedShell:true,closedThinWallMetal198:true,outerMaximumRadius:.051,innerBoreRadius:.0369,fanCuts:9,circumferenceFlutes:24,grooveDepth:.00305};return g;
}
function roundedRectLoft(profiles){
 const cs=6,cols=4*(cs+1),p=[],uv=[],ix=[];
 // Monotone rounded-rectangle perimeter, viewed from the positive Y end.
 for(let row=0;row<profiles.length;row++){
  const [y,w,d,r]=profiles[row];
  for(let corner=0;corner<4;corner++)for(let k=0;k<=cs;k++){
   const a=corner*Math.PI/2+k/cs*Math.PI/2,cx=(corner===0||corner===3?1:-1)*(w/2-r),cz=(corner<2?1:-1)*(d/2-r);
   p.push(cx+Math.cos(a)*r,y,cz+Math.sin(a)*r);uv.push((corner*(cs+1)+k)/cols,row/(profiles.length-1));
  }
 }
 for(let row=0;row<profiles.length-1;row++)for(let k=0;k<cols;k++){
  const a=row*cols+k,b=row*cols+(k+1)%cols,c=a+cols,d=b+cols;ix.push(a,c,b,b,c,d);
 }
 for(const end of[0,profiles.length-1]){
  const ci=p.length/3;p.push(0,profiles[end][0],0);uv.push(.5,.5);
  for(let k=0;k<cols;k++){const a=end*cols+k,b=end*cols+(k+1)%cols;end===0?ix.push(ci,a,b):ix.push(ci,b,a);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.userData.closedMetalShoe198=true;return g;
}
function curve(b,key,points,width,depth,mat='tableGilt198'){
 b.carvedCurve('198-r06-'+key,points,width,depth,mat,36);
}
function ring(b,key,x,y,z,r,h,bore=.036){
 b.lathe('198-r06-necklace-'+key,[[bore,-h/2],[r-.002,-h/2],[r,-h*.25],[r,h*.25],[r-.002,h/2],[bore,h/2],[bore,-h/2]],x,y,z,1,1,'tableGilt198',64);
 b.torus(x,y+h*.24,z,r-.0003,.0015,'tableEdge198',Math.PI/2);
}
function shoe(b,key,x,z,floorY,w=.218,d=.216){
 const profiles=[[floorY,w,d,.009],[floorY+.012,w,d,.009],[floorY+.020,w-.018,d-.018,.008],[floorY+.031,w-.045,d-.045,.008],[.035,w-.045,d-.045,.008],[.052,w-.061,d-.061,.008],[.063,w-.056,d-.056,.008]];
 b.add(b.geometry('198-r06-coved-foot-shoe-'+key,()=>roundedRectLoft(profiles)),'tableGilt198',x,0,z);
 b.box(x,.069,z,w-.061,.020,d-.061,'tableLacquer198');
 b.lathe('198-r06-shoe-bearing-neck-'+key,[[0,.077],[.047,.077],[.050,.083],[.044,.095],[.041,.115],[0,.115]],x,0,z,1,1,'tableGilt198',48);
 const frontAt=y=>{
  let i=0;while(i<profiles.length-2&&y>profiles[i+1][0])i++;
  return T.MathUtils.lerp(profiles[i][2],profiles[i+1][2],T.MathUtils.clamp((y-profiles[i][0])/(profiles[i+1][0]-profiles[i][0]),0,1))/2;
 };
 // Small chased fans enter the coved shoe surface. There is no front plaque.
 for(let k=-3;k<=3;k++){
  const q=k/3,points=[[0,-.011],[q*.013,.002],[q*.027,.024],[q*.024,.037]].map(([xx,y])=>[x+xx,y,z+frontAt(y)-.0005]);
  curve(b,'shoe-repousse-'+key+'-'+x+'-'+z+'-'+k,points,.0045,.0028,k%2?'tableGilt198':'tableEdge198');
 }
 for(const sx of[-1,1])curve(b,'shoe-side-chase-'+key+'-'+x+'-'+z+'-'+sx,[[x+sx*(w/2-.012),floorY+.007,z+.025],[x+sx*(w/2-.022),floorY+.020,z+.035],[x+sx*(w/2-.030),.021,z+.020],[x+sx*(w/2-.030),.040,z]],.004,.0025,'tableEdge198');
}
export function buildRefinedMetalLegs198(b,layout,z,floorY,mountCloud){
 const sleeve=b.geometry('198-r06-closed-chased-ferrule',chasedSleeveGeometry);
 for(const side of[-1,1])for(const dz of[-.34,.34]){
  const x=side*1.73,zz=z+dz;
  b.lathe('198-r06-slender-outer-oxblood-shaft',[[0,.073],[.047,.073],[.044,.16],[.038,.255],[.039,.36],[.040,.48],[.047,.57],[.048,.585],[0,.588]],x,0,zz,1,1,'tableRed198',48);
  for(const [yy,r,h]of[[.143,.050,.013],[.276,.043,.009],[.515,.049,.012],[.568,.055,.017]])ring(b,'outer-'+yy,x,yy,zz,r,h);
  b.add(sleeve,'tableGilt198',x,0,zz);
  const surface=(xx,y)=>{
   const t=(y-SLEEVE_LO)/(SLEEVE_HI-SLEEVE_LO);let a=Math.asin(T.MathUtils.clamp(xx/.049,-.95,.95));
   for(let j=0;j<4;j++)a=Math.asin(T.MathUtils.clamp(xx/sleeveRadius(t,a),-.98,.98));
   return[x+xx,y,zz+sleeveRadius(t,a)*Math.cos(a)-.00045];
  };
  for(const sg of[-1,1]){
   curve(b,'outer-fan-rib-'+side+'-'+dz+'-'+sg,[[0,.366],[sg*.014,.382],[sg*.022,.408],[sg*.018,.436],[sg*.005,.450]].map(([xx,y])=>surface(xx,y)),.0044,.0024,'tableEdge198');
   curve(b,'outer-small-repousse-'+side+'-'+dz+'-'+sg,[[0,.386],[sg*.011,.396],[sg*.015,.412],[sg*.009,.419],[sg*.003,.410]].map(([xx,y])=>surface(xx,y)),.0065,.0028,'tableGilt198');
  }
  for(const yy of[.365,.452])for(let k=0;k<20;k++){
   const a=k/20*TAU,r=sleeveRadius((yy-SLEEVE_LO)/(SLEEVE_HI-SLEEVE_LO),a);b.ball(x+Math.sin(a)*(r-.0002),yy,zz+Math.cos(a)*(r-.0002),.0017,.0020,.0017,'tableEdge198');
  }
  shoe(b,'outer',x,zz,floorY);
 }
 for(const side of[-1,1]){
  const x=side*1.075,zz=z+.34;
  b.lathe('198-r06-inner-slender-red-core',[[0,.071],[.041,.071],[.038,.17],[.033,.31],[.036,.48],[.044,.558],[0,.575]],x,0,zz,1,1,'tableRed198',48);
  shoe(b,'inner',x,zz,floorY,.187,.192);
  // Two gently handed, closed stems root the smaller staggered curls.
  for(const sg of[-1,1]){
   const spine=[];for(let j=0;j<=16;j++){
    const t=j/16,y=.119+t*.431,a=sg*(.30+.21*Math.sin(t*Math.PI*2+.25)),r=.039-.004*Math.sin(t*Math.PI);
    spine.push([x+Math.sin(a)*r,y,zz+Math.cos(a)*r+.0004]);
   }
   curve(b,'inner-rooted-flowing-stem-'+side+'-'+sg,spine,.014,.0070,'tableGilt198');
   for(let j=0;j<4;j++){
    const y=.145+j*.092+(sg>0?.019:0),xx=sg*.012,tip=sg*(.048+.004*(j%2));
    curve(b,'inner-small-return-'+side+'-'+sg+'-'+j,[[x+xx,y,zz+.037],[x+tip*.76,y+.015,zz+.043],[x+tip,y+.039,zz+.046],[x+tip*.72,y+.058,zz+.043],[x+sg*.017,y+.050,zz+.038]],.012,.0075,'tableGilt198');
    curve(b,'inner-folded-leaf-'+side+'-'+sg+'-'+j,[[x+xx,y+.009,zz+.042],[x+tip*.55,y+.023,zz+.055],[x+tip*.64,y+.043,zz+.053],[x+sg*.019,y+.039,zz+.047]],.017,.0060,'tableGilt198');
    curve(b,'inner-leaf-chasing-'+side+'-'+sg+'-'+j,[[x+xx,y+.011,zz+.048],[x+tip*.50,y+.025,zz+.061],[x+tip*.59,y+.042,zz+.058]],.0035,.0018,'tableEdge198');
   }
  }
  for(const [y,r,h]of[[.131,.044,.008],[.271,.039,.007],[.420,.041,.007],[.531,.046,.011]])ring(b,'inner-'+y,x,y,zz,r,h,.0305);
  // Smaller un-deformed source knee is recessed into an actual apron saddle.
  // Its cut enters a cheek behind the shaft instead of sticking out beside it.
  const s=.092,cx=x+side*.012,cloudZ=z+.387;
  mountCloud('recessed-inner-knee-'+side,cx,.518,cloudZ,s,side,layout.foregroundTableScale);
  const cutX=cx-side*s/.84/2;
  b.box(x,.575,z+.384,.132,.074,.068,'tableLacquer198');
  b.box(cutX,.565,z+.389,.020,.102,.044,'tableRecess198');
  b.box(x,.604,z+.386,.151,.032,.105,'tableLacquer198');
 }
 b.root.userData.refinedMetalwork198={revision:'r06',footCentersUnchanged:true,outerRedRadiusRange:[.038,.048],sleeve:{closedBore:.0369,maxRadius:.051,height:SLEEVE_HI-SLEEVE_LO,grooves:24,frontFanCuts:9,maximumPhysicalCutDepth:.00305,repousseProudDepth:.0028},innerCarving:{stemWidth:.014,returnWidth:.012,foldedLeafWidth:.017,maximumDepth:.0075,staggeredReturnsPerLeg:8,bigHornLeavesRemoved:true},cloudKnees:{uniformSourceScale:.092*.74,recessedSaddle:true,cutCheekBehindPost:true},footShoe:'closed coved and stepped rounded-rectangle casting; small integral fans; same ground-contact centers and outer sole dimensions',visualAccepted:false};
}

export function installBrocade201(b,map){
 if(!map)throw Error('Authorized brocade201 texture was not loaded');
 map.colorSpace=T.SRGBColorSpace;map.wrapS=T.MirroredRepeatWrapping;map.wrapT=T.RepeatWrapping;
 map.repeat.set(2.7,.54);map.offset.set(-.055,.16);map.generateMipmaps=true;map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter;map.anisotropy=8;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const context=canvas.getContext('2d'),data=context.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const warp=Math.cos(x*TAU/4),weft=Math.cos(y*TAU/4),over=((Math.floor(x/4)+Math.floor(y/4))%2)?warp:weft,v=Math.round(175+22*over+4*Math.sin(x*TAU/256)*Math.sin(y*TAU/256)),i=(y*256+x)*4;
  data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=255;
 }
 context.putImageData(data,0,0);const weave=new T.CanvasTexture(canvas);weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(44,24);weave.generateMipmaps=true;weave.minFilter=T.LinearMipmapLinearFilter;weave.anisotropy=8;
 b.materials.seatTextile198=new T.MeshPhysicalMaterial({name:'altar198-midnight-indigo-brocade-body',color:0xffffff,map,roughness:.72,metalness:0,sheen:.12,sheenColor:'#b6ac8e',sheenRoughness:.88,bumpMap:weave,bumpScale:.00008});
}
