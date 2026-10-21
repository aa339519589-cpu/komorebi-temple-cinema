import * as T from 'three';
import {V,TAU,lin,surface} from './kernel.js';
import {createRestoredBuddha} from './restoration-buddha.js';
import {buildRestorationAltar} from './restoration-altar.js';
import {createHallCurvedJoinery} from './sculpted-joinery.js';
import {layout124 as L} from './layout124.js';
import {buildForeground124,buildStair124,buildTowerGround124,emitHallCap124} from './layout-components124.js';
import {buildForegroundLantern131} from './foreground-hardware131.js';
import {buildHallCarpentry132} from './hall-carpentry132.js';
export function architecture(B){
const {m}=B;
const hallJoinery=createHallCurvedJoinery();
for(const geometry of hallJoinery.resources)B.resources.add(geometry);
const torus=new T.TorusGeometry(1,.10,6,16),disc=new T.CylinderGeometry(1,1,.12,12),finialTorus=new T.TorusGeometry(1,.10,8,24);
const finialProfile=[[0,-1.48],[1.16,-1.48],[1.22,-1.36],[1.22,-1.22],[1.08,-1.16],[1.08,-1.02],[.79,-.91],[.60,-.73],[.64,-.60],[.95,-.42],[1.04,-.15],[1.0,.10],[.80,.34],[.50,.53],[.31,.61],[.27,.77],[.19,.94],[0,1.15]];
const castFinial=new T.LatheGeometry(finialProfile.map(p=>new T.Vector2(...p)),64);
const petalWire=new T.TubeGeometry(new T.CatmullRomCurve3([[0,0,0],[-.050,.105,0],[0,.205,0],[.050,.105,0],[0,0,0]].map(V)),18,.007,5,false);
const scroll=new T.TubeGeometry(new T.CatmullRomCurve3([[-.48,-.06,0],[-.34,.07,0],[-.16,.1,0],[0,.02,0],[.16,-.04,0],[.33,.06,0],[.42,.12,0]].map(V)),20,.018,5,false);
const tile=(()=>{const p=[],uv=[],idx=[],n=8;for(const r of[1,.75])for(const z of[-.5,.5])for(let k=0;k<=n;k++){const a=k/n*Math.PI;p.push(Math.cos(a)*r,Math.sin(a)*r,z);uv.push(k/n,z+.5);}const q=(a,b,c,d)=>idx.push(a,b,c,b,d,c);for(let k=0;k<n;k++){q(k,n+1+k,k+1,n+2+k);q(2*(n+1)+k,2*(n+1)+k+1,3*(n+1)+k,3*(n+1)+k+1);q(k,k+1,2*(n+1)+k,2*(n+1)+k+1);q(n+1+k,3*(n+1)+k,n+2+k,3*(n+1)+k+1);}q(0,2*(n+1),n+1,3*(n+1));q(n,2*(n+1)+n,n+1+n,3*(n+1)+n);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));for(let i=0;i<idx.length;i+=3)[idx[i+1],idx[i+2]]=[idx[i+2],idx[i+1]];g.setIndex(idx);g.computeVertexNormals();return g;})();
function rosette(x,y,z,r=.12,ma='gold',n=8){for(let i=0;i<n;i++){const a=i*TAU/n;B.sphere(x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.5,z,r*.36,r*.18,r*.07,ma,[0,0,a]);}B.sphere(x,y,z+.01,r*.27,r*.27,r*.10,ma);}
const fittingShape=new T.Shape();for(let k=0;k<6;k++){const a=Math.PI/6+k*TAU/6;if(k===0)fittingShape.moveTo(Math.cos(a),Math.sin(a));else fittingShape.lineTo(Math.cos(a),Math.sin(a));}fittingShape.closePath();const hexFitting=new T.ExtrudeGeometry(fittingShape,{depth:.08,bevelEnabled:true,bevelSize:.035,bevelThickness:.022,bevelSegments:2,steps:1}),hexWire=new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({length:7},(_,k)=>{const a=Math.PI/6+k*TAU/6;return V([Math.cos(a),Math.sin(a),0]);})),36,.035,6,false);
function carvedFitting(x,y,z,w,h){B.emit(hexFitting,'goldDark',x,y,z,w*.55,h*.55,.6);B.emit(hexWire,'gold',x,y,z+.063,w*.51,h*.51,.50);B.emit(hexWire,'gold',x,y,z+.066,w*.41,h*.41,.35);for(let k=0;k<8;k++)B.emit(petalWire,'gold',x,y,z+.073,w*1.6,h*1.6,1,[0,0,k*TAU/8]);B.sphere(x,y,z+.07,w*.05,h*.05,.025,'goldLight');}
function squareGold(x,y,z,w,h=w){
B.box(x,y,z,w,h,.025,'goldDark');for(const xx of[-1,1])B.box(x+xx*(w/2-.012),y,z+.019,.024,h,.018,'gold');for(const yy of[-1,1])B.box(x,y+yy*(h/2-.012),z+.019,w,.024,.018,'gold');rosette(x,y,z+.035,Math.min(w,h)*.45);}
function ornament(x,y,z,w=.7,h=.2){B.emit(scroll,'gold',x,y,z,w,h/.15,1);rosette(x,y,z+.01,h*.42);}
function bracket(x,y,z,s=1,useKit=false,greatHallDetail=false){B.with(x,y,z,0,()=>{
if(B.joineryKit&&useKit){
 // Preserve the former1.72m spread and1.23m bearing height while replacing
 // disconnected slanted blocks with closed bevelled half-lapped timbers.
 for(const part of B.joineryKit.bracket)B.emit(part.geometry,'wood',0,0,0,1.18,1.50,1.18);
 for(const axis of[0,1])B.with(0,0,0,axis*Math.PI/2,()=>{
  for(const side of[-1,1])for(const row of[0,1]){
   const xx=side*(row?.6808:.6208)*1.18,yy=(row?.52025:.18875)*1.50;
   for(const zz of(row?[-.415,.415]:[0]))B.with(xx,yy,zz*1.18,side*Math.PI/2,()=>{
    B.box(0,0,0,.22,.18,.018,'goldDark');
    B.emit(B.joineryKit.relief,'gold',0,0,.012,.22,.18,.18);
   });
  }
 });
 return;
}
// Continuous, bevelled, half-lapped arms take the former block bracket's
// 1.72m spread and 1.23m bearing height; the caller keeps every original seat.
for(const part of hallJoinery.parts)B.emit(part.geometry,part.material);
for(const axis of[0,1])B.with(0,0,0,axis*Math.PI/2,()=>{
 for(const side of[-1,1])for(const row of[0,1]){
  const [xx,yy]=hallJoinery.seat(side*(row?.755:.655),row?.645:.27,0);
  for(const branch of(row?[-.40,.40]:[0])){
   const zz=hallJoinery.seat(0,0,branch)[2];
   B.with(xx,yy,zz,side*Math.PI/2,()=>{
    const w=.215*hallJoinery.scale[0],h=.105*hallJoinery.scale[1];
    B.box(0,0,0,w,h,.014,'goldDark');
    if(B.joineryKit)B.emit(B.joineryKit.relief,'gold',0,0,.008,w,h,.11);
   });
  }
 }
});
 if(greatHallDetail){
  // Build three seated courses around the original closed bracket. Each
  // cross arm lands on a collar or a pair of short corbels before the next
  // receiver beam rises to the purlin bearing.
  B.box(0,.105,0,.76,.21,.76,'darkwood');
  B.box(0,.205,0,.64,.06,.64,'wood');
  for(const axis of[0,1])B.with(0,0,0,axis*Math.PI/2,()=>{
   B.box(0,.25,0,1.42,.16,.32,'darkwood');
   B.box(0,.40,0,1.20,.14,.26,'wood');
   for(const side of[-1,1]){
    B.box(side*.48,.49,0,.32,.16,.31,'darkwood');
    B.between([side*.28,.42,0],[side*.52,.66,0],.17,.28,'wood');
    B.box(side*.64,.76,0,.24,.22,.30,'wood');
   }
   B.box(0,.88,0,1.28,.14,.29,'darkwood');
   B.box(0,1.00,0,1.54,.16,.34,'wood');
  });
  // Paired bearing plaques sit on each outer receiver face. Layered metal,
  // polygon relief, and studs are real solids set over a dark timber bed.
  for(let face=0;face<4;face++)B.with(0,0,0,face*Math.PI/2,()=>{
   for(const side of[-1,1]){
    const x=side*.43,y=.70,z=.57;
    B.box(x,y,z,.34,.36,.07,'darkwood');
    B.box(x,y,z+.038,.29,.31,.026,'goldDark');
    carvedFitting(x,y,z+.055,.25,.26);
    for(const dy of[-.145,.145])B.sphere(x,y+dy,z+.065,.046,.046,.022,'goldLight');
   }
  });
 }
},s);}
function column(x,z,base,h,r=.27){B.cyl(x,base+.10,z,r*1.40,.20,'stoneLight');B.cyl(x,base+.25,z,r*1.20,.16,'stone');B.cyl(x,base+.34+h/2,z,r,h,'red',r*.93);B.cyl(x,base+.39,z,r*1.04,.12,'goldDark');B.cyl(x,base+.48,z,r*1.045,.04,'gold');for(const yy of[base+.65,base+h-.10]){B.cyl(x,yy,z,r*1.015,.14,'goldDark');for(let k=0;k<10;k++){const a=k*TAU/10;B.sphere(x+Math.sin(a)*r*1.03,yy,z+Math.cos(a)*r*1.03,.035,.045,.025,'gold',a);}}squareGold(x,base+h-.16,z+r+.01,r*1.75,.42);}
function tileBetween(a,b,r=.062,tint=1){a=V(a);b=V(b);const z=b.clone().sub(a),len=z.length();z.normalize();let x=V([0,1,0]).cross(z).normalize();if(x.length()<.1)x.set(1,0,0);const y=z.clone().cross(x).normalize(),mat=new T.Matrix4().makeBasis(x,y,z);mat.scale(V([r,r,len]));mat.setPosition(a.add(b).multiplyScalar(.5));B.put(tile,'slate',mat,tint);}
function roof({w,d,eave,rise,curl=.55,zc=0,inner=0,name='roof',detail=true,ridge=.53,tilePitch=.19,tileRadius=.080,edgeCapRadius=.090,irimoya=false,wallFootprint=null}){B.label(name,()=>{const hw=w/2,hd=d/2,rh=hw*ridge;const gableStart=.44;const P=(side,t,u)=>{const expansion=irimoya?Math.max(0,(t-gableStart)/(1-gableStart)):t,span=rh+(hw-rh)*expansion;let x,z;if(side===0||side===2){x=u*span;z=(side===0?1:-1)*hd*t;}else{x=(side===1?1:-1)*span;z=u*hd*t;}return[x,eave+rise*(Math.max(0,1-t)**1.46)+curl*(t**8)*(.25+.75*(Math.abs(u)**5)),z+zc];};
const startAt=(side,u)=>{
 if(!wallFootprint)return irimoya&&side%2?Math.max(inner,gableStart):inner;
 const [xmin,xmax,zmin,zmax]=wallFootprint,sign=side===0||side===1?1:-1,x0=side%2?sign*rh:u*rh,dx=side%2?sign*(hw-rh):u*(hw-rh),z0=zc,dz=side%2?u*hd:sign*hd;
 if(x0<xmin||x0>xmax||z0<zmin||z0>zmax)return 0;
 const tx=Math.abs(dx)<1e-9?Infinity:((dx>0?xmax:xmin)-x0)/dx,tz=Math.abs(dz)<1e-9?Infinity:((dz>0?zmax:zmin)-z0)/dz;
 return Math.max(0,Math.min(1,tx,tz));
};
for(let side=0;side<4;side++){const grid=lin(0,1,20).map(v=>lin(-1,1,40).map(u=>{const start=startAt(side,u);return P(side,start+(1-start)*v,u);}));B.emit(surface(grid,.16),'darkwood');B.emit(surface(grid,.045),'slate',0,.035,0);const rows=Math.ceil((side%2?d:w)/tilePitch);for(let i=0;i<=rows;i++){const u=-1+2*i/rows,start=startAt(side,u),pieces=Math.ceil(Math.hypot(hd,rise)*(1-start)/.43);for(let j=0;j<pieces;j++){const t=start+(1-start)*j/pieces,q=start+(1-start)*(j+.96)/pieces;tileBetween(P(side,t,u),P(side,q,u),tileRadius,.89+.20*((i*13+j*7)%17)/17);}const end=P(side,1,u);B.emit(disc,'tileEdge',end[0],end[1]+.017,end[2]+(side===0?.045:side===2?-.045:0),edgeCapRadius,edgeCapRadius,edgeCapRadius,side===0||side===2?[Math.PI/2,0,0]:[0,0,Math.PI/2]);if(detail&&(w<15||i%2===0)){for(let layer=0;layer<3;layer++){const a=P(side,.68+layer*.065,u),b=P(side,1.025-layer*.035,u);a[1]-=.23+layer*.16;b[1]-=.23+layer*.16;B.between(a,b,.075,.105,layer===1?'endwood':'wood');B.box(b[0],b[1],b[2],.075,.085,.05,w>15?'hallSap132':i%3?'goldDark':'gold');}}}for(let i=0;i<40;i++){const a=P(side,1,-1+2*i/40),b=P(side,1,-1+2*(i+1)/40);a[1]-=.20;b[1]-=.20;B.between(a,b,.18,.25,'redLight');a[1]-=.13;b[1]-=.13;B.between(a,b,.035,.045,'goldDark');}if(side<2)for(const s of[-1,1])B.tube(lin(startAt(side,s),1.045,18).map(t=>{const p=P(side,t,s);p[1]+=.12;return p;}),.11,'tileEdge',30);}
if(irimoya){
 const spring=eave+rise*Math.pow(1-gableStart,1.46),half=hd*gableStart,profile=z=>eave+rise*Math.pow(1-Math.abs(z)/hd,1.46);
 for(const sign of[-1,1]){
  const shape=new T.Shape();shape.moveTo(-half,spring-.12);for(let j=0;j<=48;j++){const z=-half+2*half*j/48;shape.lineTo(z,profile(z));}shape.lineTo(half,spring-.12);shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth:.18,steps:1,curveSegments:8,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2});g.translate(0,0,-.09);g.rotateY(-Math.PI/2);g.translate(sign*rh,0,zc);B.emit(g,'darkwood');
  const arch=lin(-half,half,49).map(z=>[sign*rh,profile(z)+.025,z+zc]);B.tube(arch,.12,'wood',60);B.tube(arch.map(p=>[p[0]+sign*.13,p[1]+.03,p[2]]),.072,'tileEdge',60);
  B.between([sign*rh,spring-.05,zc-half],[sign*rh,spring-.05,zc+half],.19,.24,'wood');
  for(let j=1;j<12;j++){const z=-half+2*half*j/12,top=profile(z)-.14;if(top>spring+.10)B.box(sign*(rh+.14),(spring+top)/2,z+zc,.14,top-spring,.10,'redLight');}
  for(const side of[-1,1])B.between([sign*(rh+.14),spring+.10,zc+side*half*.80],[sign*(rh+.14),eave+rise-.18,zc],.14,.18,'wood');
  B.with(sign*(rh+.14),spring+.54,zc,sign*Math.PI/2,()=>{carvedFitting(0,0,0,.48,.45);});
 }
}
if(w>15)for(const sign of[-1,1]){const p=P(0,1,sign),q=[p[0]+sign*.18,p[1]+.4,p[2]];B.sphere(p[0],p[1]+.14,p[2],.16,.19,.15,'slate');B.emit(torus,'tileEdge',p[0],p[1]+.20,p[2]+.09,.13,.13,.13);B.tube([[p[0],p[1]+.13,p[2]],q,[p[0]+sign*.27,p[1]+.67,p[2]],[p[0]+sign*.18,p[1]+.83,p[2]]],.065,'tileEdge',20);}
if(inner===0&&ridge>.05){B.box(0,eave+rise+.18,zc,rh*2+.2,.30,.34,'slate');B.box(0,eave+rise+.37,zc,rh*2+.4,.11,.43,'tileEdge');for(const s of[-1,1]){const x=s*(rh+.12);B.tube([[x,eave+rise+.16,zc],[x+s*.10,eave+rise+.5,zc],[x+s*.34,eave+rise+.75,zc],[x+s*.36,eave+rise+1.0,zc]],.11,'tileEdge',18);B.sphere(x+s*.34,eave+rise+.89,zc,.14,.23,.13,'slate');rosette(x-s*.12,eave+rise+.20,zc+.20,.13,'goldDark');}}
if(inner===0&&ridge<=.05){B.cyl(0,eave+rise+.10,zc,.18,.17,'tileEdge');B.cyl(0,eave+rise+.23,zc,.12,.10,'goldDark');}
});}
function railing(w,y,z,ma='red',h=.85){for(const yy of[y+.23,y+h])B.box(0,yy,z,w,.13,.15,ma);for(let i=0;i<=Math.ceil(w/.75);i++){const x=-w/2+w*i/Math.ceil(w/.75);B.box(x,y+h*.56,z,.11,h,.11,ma);}for(const x of[-w/2,w/2]){B.box(x,y+h*.55,z,.20,h+.25,.2,ma);B.sphere(x,y+h+.18,z,.14,.17,.14,'goldDark');}}
function hangingLantern(x,y,z,s=1,bright=true){B.with(x,y,z,0,()=>{const r=.30,h=.72;for(let k=0;k<6;k++){const a=k*TAU/6,b=(k+1)*TAU/6;const xx=Math.sin((a+b)/2)*r*.87,zz=Math.cos((a+b)/2)*r*.87;B.box(xx,0,zz,r, h,.016,bright?'paperGlow':'paper',[(0),(a+b)/2,0]);B.between([Math.sin(a)*r,-h/2,Math.cos(a)*r],[Math.sin(a)*r,h/2,Math.cos(a)*r],.04,.04,'goldDark');for(const yy of[-.27,0,.27])B.between([Math.sin(a)*r,yy,Math.cos(a)*r],[Math.sin(b)*r,yy,Math.cos(b)*r],.022,.022,'goldDark');}for(const yy of[-.40,.40])B.cyl(0,yy,0,.39,.06,'goldDark');B.emit(B.coneG,'goldDark',0,.49,0,.47,.15,.47);B.sphere(0,.63,0,.15,.15,.15,'gold');B.cyl(0,.84,0,.025,.30,'goldDark');B.sphere(0,-.54,0,.17,.09,.17,'gold');B.sphere(0,-.69,0,.06,.12,.06,'goldDark');},s);}
function pagoda(){B.with(...L.pagoda.position,L.pagoda.yaw,()=>{B.label('pagoda-plinth',()=>{B.box(0,.05,0,5.1,.8,5.1,'stone');B.box(0,.48,0,5.4,.16,5.4,'stoneLight');});const eaves=Array.from({length:5},(_,i)=>5.6+i*L.pagoda.tierPitch),widths=Array.from({length:5},(_,i)=>L.pagoda.bottomRoofWidth+(L.pagoda.topRoofWidth-L.pagoda.bottomRoofWidth)*i/4);for(let k=0;k<5;k++){const w=widths[k],y=eaves[k],floor=k?eaves[k-1]+.78:.6,body=w*.50,half=body/2;B.label('pagoda-'+(k+1)+'-timber-gallery',()=>{B.box(0,floor-.1,0,body+.65,.22,body+.65,'red');for(let s=0;s<4;s++)B.with(0,0,0,s*Math.PI/2,()=>{B.box(0,(floor+y-.8)/2,half-.12,body,y-.8-floor,.16,'plaster');for(const x of[-half,0,half]){column(x,half,floor,y-floor-.80,.105);bracket(x,y-.52,half,[.48,.48,1.05],true);}for(const x of[-body*.27,body*.27]){B.box(x,floor+1.02,half+.01,.80,1.16,.09,'darkwood');for(let j=0;j<5;j++)B.box(x-.36+j*.18,floor+1.02,half+.07,.026,1.1,.04,'goldDark');for(let j=0;j<5;j++)B.box(x,floor+.49+j*.265,half+.08,.80,.027,.04,'redLight');}B.box(0,y-.42,half,body+.5,.19,.22,'red');for(const yy of[floor+.18,floor+.64])B.box(0,yy,half+.38,body+.75,.095,.10,'redLight');for(let j=0;j<15;j++){const x=-body*.55+j*body*1.1/14;B.box(x,floor+.4,half+.38,.065,.55,.065,'red');}for(let j=0;j<7;j++)ornament(-body*.45+j*body*.9/6,y-.42,half+.13,.39,.13);});});roof({w,d:w,eave:y,rise:1.27,curl:.44,ridge:0,name:'pagoda-'+(k+1)+'-curved-ceramic-roof'});}B.label('pagoda-finial',()=>{B.with(0,eaves[4]+1.25,0,0,()=>B.with(0,-17.65,0,0,()=>{const base=17.65;B.cyl(0,base+.08,0,.34,.18,'goldDark');B.emit(B.coneG,'gold',0,base+.40,0,.30,.55,.30);B.cyl(0,19.65,0,.043,4.1,'goldDark');for(let k=0;k<16;k++){const y=base+.78+k*.22,r=.24*(1-k*.037);B.emit(finialTorus,'gold',0,y,0,r,r,r,[Math.PI/2,0,0]);B.sphere(0,y,0,.075,.10,.075,'gold');}B.sphere(0,21.95,0,.12,.19,.12,'goldLight');B.cyl(0,22.3,0,.024,.5,'gold');}),[1,L.pagoda.finialHeight/4.9,1]);});},L.pagoda.scale);}
function hall(){const oldTimber={};for(const key of['red','redLight','wood','darkwood']){oldTimber[key]=B.m[key];const aged=B.m[key].clone();aged.color.multiply(new T.Color().setRGB(.80,.91,1.05));aged.name=key;B.m['hall132-aged-'+key]=aged;B.m[key]=aged;}B.with(...L.hall.position,L.hall.yaw,()=>{
B.label('great-hall-stone-platform',()=>{B.box(1.45,-.525,0,21.1,3.55,11.8,'stone');emitHallCap124(B);for(let x=-8.5;x<12;x+=1.2)for(let z=-5.4;z<6;z+=1.3)B.box(x,1.285,z,1.18,.08,1.28,'stoneLight',0,.89+.13*Math.abs(Math.sin(x*7+z)));});
buildHallCarpentry132(B,{column,carvedFitting,rosette});
B.label('great-hall-depth-enclosure',()=>{
 B.box(1.45,3.475,-5.4,19.1,4.45,.25,'darkwood');B.box(-8.20,3.425,0,.3,4.35,10.5,'red');B.box(11.2,3.425,0,.3,4.35,10.5,'red');
 const axes=L.hall.frontAxes;for(let i=0;i<axes.length-1;i++){
  const a=axes[i],b=axes[i+1],gap=b-a;if(gap>3.5)continue;const x=(a+b)/2,width=gap-.35;
  B.box(x,3.075,4.50,width,3.35,.19,'paper');for(let j=0;j<Math.ceil(width/.14);j++)B.box(x-width/2+.07+j*.14,3.075,4.63,.026,3.20,.028,'goldDark');
  for(let j=0;j<14;j++)B.box(x,1.50+j*.24,4.66,width,.028,.035,'wood');for(const xx of[-width/2-.05,width/2+.05])B.box(x+xx,3.075,4.66,.12,3.47,.14,'redLight');
 }
});
B.label('great-hall-gilded-open-portal',()=>{const center=.6;for(const x of[center-2.08,center+2.08]){B.box(x,3.445,3.80,.36,4.30,.48,'darkwood');B.box(x,3.445,4.06,.23,4.17,.04,'goldDark');for(let k=0;k<11;k++)ornament(x,1.53+k*.39,4.09,.22,.25);}for(const yy of[1.40,5.62]){B.box(center,yy,3.8,4.50,.27,.47,'wood');for(let k=0;k<11;k++)ornament(center-2+k*.4,yy,4.05,.34,.15);}B.box(center,3.275,-2.3,4.1,3.75,.14,'black');for(const x of[center-1.65,center+1.65]){B.box(x,3.175,-2.05,.17,3.35,.2,'gold');for(let k=0;k<9;k++)rosette(x,1.70+k*.36,-1.92,.10);}B.box(center,4.95,-2.05,3.55,.28,.30,'goldDark');for(let k=0;k<9;k++)ornament(center-1.5+k*.375,4.95,-1.88,.3,.16);
// The visible sanctuary is enclosed by recessed gilded panels, with real
// cast relief and projecting frame members behind the freestanding sculpture.
for(let bay=0;bay<3;bay++){
 const x=center+(bay-1)*1.24;B.box(x,3.15,-2.08,1.16,3.20,.10,'goldDark');B.box(x,3.15,-2.015,1.02,3.04,.027,'darkwood');
 for(const xx of[-.56,.56])B.box(x+xx,3.15,-1.94,.07,3.25,.11,'gold');for(const yy of[1.55,4.76])B.box(x,yy,-1.94,1.17,.08,.11,'gold');
 if(B.joineryKit)for(let row=0;row<7;row++)B.emit(B.joineryKit.relief,'gold',x,1.82+row*.44,-1.925,.81,.37,.19);
}
// Reuse the detailed, independently modeled sanctuary sculpture and cast altar.
const altar=buildRestorationAltar({materials:{gold:m.gold,oldgold:m.goldDark},hanging:false});altar.position.set(center,1.25,-1.40);altar.scale.setScalar(.65);altar.updateMatrixWorld(true);
const figure=createRestoredBuddha({materials:{buddha:m.goldLight,oldgold:m.goldDark,gold:m.gold},x:center,y:3.20,z:-1.40,scale:.65*2.1/3.26});figure.updateMatrixWorld(true);
for(const root of[altar,figure])root.traverse(o=>{if(!o.isMesh)return;if(o.isInstancedMesh){const matrix=new T.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);B.put(o.geometry,o.material,matrix.clone().premultiply(o.matrixWorld));}}else B.put(o.geometry,o.material,o.matrixWorld);});
});
roof({w:27.0,d:14.9,eave:L.hall.lowerEave,rise:2.65,curl:.56,zc:-.35,inner:.43,name:'great-hall-lower-monumental-roof',wallFootprint:[-7.975,11.275,-4.8,4.2],tilePitch:.19,tileRadius:.074,edgeCapRadius:.086});
roof({w:25.5,d:13.6,eave:L.hall.upperEave,rise:L.hall.mainRoofRise,curl:.59,zc:-.35,name:'great-hall-main-monumental-roof',irimoya:true,tilePitch:.19,tileRadius:.074,edgeCapRadius:.086});
B.label('great-hall-platform-edge-balustrades',()=>{for(const a of[[-7.5,5.7],[5.5,7.1]])B.with(a[0],0,a[1],0,()=>railing(5.5,1.28,0,'red',.95));});
for(const x of[-9.5,-5.8,3.5,7.4])hangingLantern(x,3.7,5.63,.72,true);
});for(const key of Object.keys(oldTimber))B.m[key]=oldTimber[key];}
function veranda(){
// The canonical reference frames the courtyard from the left gallery.
// Preserve its measured orientation and depth; mirror transforms move it to the wrong side.
const foreFit=(...args)=>{const saved={gold:B.m.gold,goldDark:B.m.goldDark,goldLight:B.m.goldLight};B.m.gold=B.m.hardwareGold131;B.m.goldDark=B.m.hardwareBronze131;B.m.goldLight=B.m.hardwareRelief131;carvedFitting(...args);Object.assign(B.m,saved);};
buildForeground124(B,{carvedFitting:foreFit,squareGold});
buildForegroundLantern131(B);}

pagoda();hall();buildStair124(B);veranda();buildTowerGround124(B);return{roof,rosette,squareGold,carvedFitting,column,bracket,hangingLantern};
}
