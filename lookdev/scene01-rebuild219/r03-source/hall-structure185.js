import * as T from 'three';
import {mainHallUnderside148} from './hall-envelope148.js';

// Actual closed timber bodies, not relief cards. Dimensions are authored
// contact hypotheses fitted to the retained163 roof and column coordinates.
export function createHallStructure185(B){
 const owned=[],seats=[],lanterns=[],keep=g=>{owned.push(g);B.resources.add(g);return g;};
 const wood=B.m.wood.clone();wood.name='wood';wood.onBeforeCompile=B.m.wood.onBeforeCompile;wood.customProgramCacheKey=B.m.wood.customProgramCacheKey;wood.roughness=.84;wood.clearcoat=.035;wood.specularIntensity=.30;B.m.hall185Timber=wood;
 const dark=wood.clone();dark.name='wood';dark.color.multiplyScalar(.59);dark.onBeforeCompile=wood.onBeforeCompile;dark.customProgramCacheKey=wood.customProgramCacheKey;B.m.hall185Recess=dark;
 for(const [key,source,roughness,bump]of[['hall185CourtStone','stone',.95,.008],['hall185ThresholdStone','stoneLight',.90,.0045]]){const m=B.m[source].clone();m.name=key;m.onBeforeCompile=B.m[source].onBeforeCompile;m.customProgramCacheKey=B.m[source].customProgramCacheKey;m.roughness=roughness;m.bumpScale=bump;B.m[key]=m;}
 const lin=(a,b,n)=>Array.from({length:n+1},(_,i)=>a+(b-a)*i/n);
 function finish(p,uv,ix,name){
  const g=new T.BufferGeometry();g.name=name;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  const indices=[];let volume=0;
  for(let k=0;k<ix.length;k+=3){const ids=ix.slice(k,k+3),[a,b,c]=ids.map(i=>new T.Vector3(...p.slice(i*3,i*3+3)));if(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()<1e-23)continue;volume+=a.dot(b.clone().cross(c))/6;indices.push(...ids);}
  if(volume<0)for(let k=0;k<indices.length;k+=3)[indices[k+1],indices[k+2]]=[indices[k+2],indices[k+1]];
  g.setIndex(indices);g.computeVertexNormals();g.userData.closedAuthoredTimber185=true;return keep(g);
 }
 function arm(length,depth,height,lap='',centres=[0],notchWidth=depth*.83+.002){
  const half=length/2,cuts=lap?centres.map(center=>[center-notchWidth/2,center+notchWidth/2]):[],inCut=x=>cuts.some(([a,b])=>x>a&&x<b),sections=lin(-half,half,48).filter(x=>cuts.every(([a,b])=>Math.abs(x-a)>1e-8&&Math.abs(x-b)>1e-8)).map(x=>({x,inLap:inCut(x)}));
  for(const [a,b]of cuts)sections.push({x:a,inLap:false},{x:a,inLap:true},{x:b,inLap:true},{x:b,inLap:false});sections.sort((a,b)=>a.x-b.x);
  const N=32,p=[],uv=[],ix=[];
  for(const {x,inLap}of sections){const e=Math.abs(x)/half,top=lap==='top'&&inLap?0:height/2+.015*e**8,bottom=lap==='bottom'&&inLap?0:-height/2+.047*e**2.8-.018*Math.exp(-(((e-.62)/.20)**2)),mid=(top+bottom)/2,hh=(top-bottom)/2,cheek=.83+.17*e**4;
   for(let k=0;k<N;k++){const a=k/N*Math.PI*2,c=Math.cos(a),s=Math.sin(a);p.push(x,mid+hh*Math.sign(s)*Math.abs(s)**.36,depth*.5*cheek*Math.sign(c)*Math.abs(c)**.36);uv.push(x,k/N*depth);}
  }
  for(let row=0;row<sections.length-1;row++)for(let k=0;k<N;k++){const a=row*N+k,b=row*N+(k+1)%N;ix.push(a,b,a+N,b,b+N,a+N);}
  for(const side of[0,1]){const row=side?sections.length-1:0,ci=p.length/3,offset=row*N,sec=sections[row];p.push(sec.x,(p[offset*3+1]+p[(offset+N/2)*3+1])/2,0);uv.push(.5,.5);for(let k=0;k<N;k++)side?ix.push(ci,offset+k,offset+(k+1)%N):ix.push(ci,offset+(k+1)%N,offset+k);}
  return finish(p,uv,ix,'hall185-closed-waisted-half-lap-arm-'+lap+'-'+length);
 }
 function cup(w,d,h){const N=32,R=10,p=[],uv=[],ix=[];for(let row=0;row<=R;row++){const t=row/R,flare=.66+.34*Math.sin(t*Math.PI/2);for(let k=0;k<N;k++){const a=k/N*Math.PI*2,c=Math.cos(a),s=Math.sin(a);p.push(w*.5*flare*Math.sign(c)*Math.abs(c)**.32,h*t,d*.5*flare*Math.sign(s)*Math.abs(s)**.32);uv.push(k/N,t);}}for(let row=0;row<R;row++)for(let k=0;k<N;k++){const a=row*N+k,b=row*N+(k+1)%N;ix.push(a,b,a+N,b,b+N,a+N);}const ci=p.length/3;p.push(0,0,0,0,h,0);uv.push(.5,0,.5,1);for(let k=0;k<N;k++)ix.push(ci,(k+1)%N,k,ci+1,R*N+k,R*N+(k+1)%N);return finish(p,uv,ix,'hall185-flared-solid-dou-'+w);}
 function tail(){const points=[[0,.24,-.27],[0,.40,.02],[0,.72,.43],[0,1.02,.84],[0,1.28,1.15]],curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),N=24,R=40,p=[],uv=[],ix=[];for(let j=0;j<=R;j++){const t=j/R,c=curve.getPoint(t),tangent=curve.getTangent(t).normalize(),side=new T.Vector3(1,0,0),up=tangent.clone().cross(side).normalize(),w=.23*(1-.20*t),h=.28*(1-.24*t);for(let k=0;k<N;k++){const a=k/N*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),v=c.clone().addScaledVector(side,w/2*Math.sign(ca)*Math.abs(ca)**.35).addScaledVector(up,h/2*Math.sign(sa)*Math.abs(sa)**.35);p.push(...v.toArray());uv.push(k/N,t*curve.getLength());}}for(let j=0;j<R;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N;ix.push(a,b,a+N,b,b+N,a+N);}const ci=p.length/3;p.push(...curve.getPoint(0).toArray(),...curve.getPoint(1).toArray());uv.push(.5,0,.5,1);for(let k=0;k<N;k++)ix.push(ci,(k+1)%N,k,ci+1,R*N+k,R*N+(k+1)%N);return finish(p,uv,ix,'hall185-closed-raking-tail');}
 const shoes=[cup(.73,.70,.20),cup(.31,.31,.145)],arms=[arm(1.12,.34,.25,'top'),arm(1.12,.34,.25,'bottom'),arm(1.48,.30,.25,'top',[-.31,.31],.251),arm(1.48,.30,.25,'bottom',[0],.253),arm(1.80,.34,.25,'top',[-.40,.40],.2593),arm(1.57,.31,.25,'bottom',[0],.2864)],raking=tail(),receiver=arm(1.91,.39,.20);
 function cluster(x,base,z,top,{scale=1,depth=1,kind='front'}={}){
  const sy=(top-base)/1.40;if(!(sy>.10))throw Error('185 bearing gap is not positive');
  B.with(x,base,z,0,()=>{
   B.emit(shoes[0],'hall185Timber',0,0,0,scale,sy,depth);
   B.emit(arms[0],'hall185Timber',0,.305*sy,0,scale,sy,depth);
   B.emit(arms[1],'hall185Timber',0,.305*sy,0,depth,sy,scale,Math.PI/2);
   for(const side of[-1,1]){
    B.emit(shoes[1],'hall185Timber',side*.31*scale,.43*sy,.24*depth,scale,sy,depth);
    B.emit(arms[3],'hall185Timber',side*.31*scale,.67*sy,.28*depth,depth,sy,scale,Math.PI/2);
    B.emit(shoes[1],'hall185Timber',side*.40*scale,.795*sy,.67*depth,scale,sy,depth);
    B.emit(arms[5],'hall185Timber',side*.40*scale,1.06*sy,.71*depth,depth,sy,scale,Math.PI/2);
    B.emit(raking,'hall185Timber',side*.25*scale,0,0,scale,sy,depth);
   }
   B.emit(arms[2],'hall185Timber',0,.67*sy,.28*depth,scale,sy,depth);
   B.emit(arms[4],'hall185Timber',0,1.06*sy,.71*depth,scale,sy,depth);
   // Thin housed packing keys seat the receiving purlin on both outer
   // crossed arms; their bottom/top share the actual timber contact planes.
   for(const side of[-1,1])B.box(side*.40*scale,1.1938*sy,1.13*depth,.27*scale,.018*sy,.34*depth,'hall185Timber');
   B.emit(receiver,'hall185Timber',0,1.30*sy,1.13*depth,scale,sy,depth);
  });
  seats.push({kind,base:[x,base,z],roofReceiverY:top,receiverCenterZ:z+1.13*depth,sectionScale:[scale,sy,depth],prototypeHeight:1.40});
 }
 function lowerRoofUnder(x,z){const w=27,hw=w/2,rh=hw*.53,hd=7.45,zz=z+.35,tx=Math.max(0,(Math.abs(x)-rh)/(hw-rh)),tz=Math.abs(zz)/hd,t=Math.max(tx,tz),span=rh+(hw-rh)*t,u=tz>=tx?x/span:zz/(hd*t);return 6.6+2.65*Math.max(0,1-t)**1.46+.56*t**8*(.25+.75*Math.abs(u)**5)-.16;}
 function roofSeat(x,z,w,d,bottom,roof){
  const p=[],uv=[],ix=[],N=20,M=3,layer=(N+1)*(M+1);
  for(const top of[true,false])for(let j=0;j<=M;j++)for(let i=0;i<=N;i++){const xx=x-w/2+w*i/N,zz=z-d/2+d*j/M;p.push(xx,top?roof(xx,zz)+.014:bottom,zz);uv.push(xx,zz);}
  for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,e=c+1;ix.push(a,c,b,b,c,e,layer+a,layer+b,layer+c,layer+b,layer+e,layer+c);}
  const edge=[...Array.from({length:N+1},(_,i)=>i),...Array.from({length:M},(_,j)=>(j+1)*(N+1)+N),...Array.from({length:N},(_,i)=>layer-2-i),...Array.from({length:M-1},(_,j)=>(M-1-j)*(N+1))];for(let k=0;k<edge.length;k++){const a=edge[k],b=edge[(k+1)%edge.length];ix.push(a,b,a+layer,b,b+layer,a+layer);}
  B.emit(finish(p,uv,ix,'hall185-closed-roof-following-receiver-saddle'),'hall185Timber');
 }
 function front(x,base,z,upper=false){const depth=upper?.91:1.01,scale=1.02,roof=upper?mainHallUnderside148:lowerRoofUnder,fore=z+1.13*depth,top=Math.min(...lin(-.955*scale,.955*scale,16).flatMap(dx=>[fore-.195*depth,fore+.195*depth].map(zz=>roof(x+dx,zz)-.045)));cluster(x,base,z,top,{scale,depth,kind:upper?'upper-front':'lower-front'});roofSeat(x,fore,1.91*scale,.39*depth,top-.035,roof);}
 function diaphragm(sign,base,half,roof,wallX,thickness){
  const p=[],uv=[],ix=[],N=96;for(let j=0;j<=N;j++){const z=-half-.30+2*half*j/N;for(const [x,y]of[[wallX,base],[wallX-thickness,base],[wallX-thickness,Math.max(base+.04,roof(wallX-thickness,z)+.018)],[wallX,Math.max(base+.04,roof(wallX,z)+.018)]]){p.push(x,y,z);uv.push(z,y);}}
  for(let j=0;j<N;j++)for(let k=0;k<4;k++){const a=j*4+k,b=j*4+(k+1)%4;ix.push(a,b,a+4,b,b+4,a+4);}ix.push(0,2,1,0,3,2,N*4,N*4+1,N*4+2,N*4,N*4+2,N*4+3);B.emit(finish(p,uv,ix,'hall185-roof-following-closed-return-attic'),'hall185Recess');
 }
 function returns(){B.label('hall185-occupied-seated-return-eaves',()=>{
  B.box(-7.975,9.22,-.30,.46,.28,9.34,'hall185Timber');B.box(-8.20,5.54,-.30,.46,.28,10.08,'hall185Timber');
  diaphragm(-1,9.22,4.48,mainHallUnderside148,-7.975,.34);
  // The lower diaphragm joins the existing upper-floor edge. It does not
  // create a second wall through the retained occupied upper-storey room.
  diaphragm(-1,5.84,4.95,(x,z)=>Math.min(6.72,lowerRoofUnder(x,z)),-8.20,.32);
  for(const z of[-3.55,-.20,3.60])for(const upper of[false,true]){
   const x=upper?-7.975:-8.20,base=upper?9.22:5.54,depth=upper?1.02:1.06,roof=upper?mainHallUnderside148:lowerRoofUnder,fore=x-1.13*depth,top=Math.min(...lin(-.83,.83,16).map(dz=>roof(fore-.20,z+dz)-.06));
   B.with(x,0,z,-Math.PI/2,()=>{cluster(0,base,0,top,{scale:.87,depth,kind:upper?'upper-left-return':'lower-left-return'});roofSeat(0,1.13*depth,1.91*.87,.39*depth,top-.035,(xx,zz)=>roof(x-zz,z+xx));});
  }
 });}
 function portal(center=.6){B.label('hall185-deep-housed-carved-portal-and-threshold',()=>{
  for(const side of[-1,1]){
   const x=center+side*2.08;
   B.box(x,3.62,4.52,.48,4.65,.90,'hall185Timber');
   B.box(x-side*.18,3.62,4.49,.052,4.55,.94,'hall185Recess');
   for(const edge of[-1,1])B.box(x+edge*.202,3.62,5.005,.027,4.62,.045,'hall149OldGilt');
   for(const yy of[1.46,5.77])B.box(x,yy,4.99,.43,.14,.10,'hall149OldGilt');
   B.box(x,3.62,4.985,.366,1.03,.09,'hall185Recess');
   // The original scan crop is seated behind a real cassette rim; the
   // preserved source surfaces stay exposed through the central aperture.
   for(const edge of[-1,1]){B.box(x+edge*.17,3.62,5.050,.025,.915,.072,'hall185Timber');B.box(x,3.62+edge*.44,5.050,.365,.035,.072,'hall185Timber');}
  }
  B.box(center,6.05,4.525,4.77,.52,.95,'hall185Timber');
  for(const yy of[5.77,6.33])B.box(center,yy,4.96,4.80,.10,.16,'hall185Recess');
  for(const side of[-1,1])B.box(center+side*2.25,6.05,5.015,.17,.66,.12,'hall149OldGilt');
  // A full-depth reveal closes the former lateral gap around the forward
  // portal. Returned planks lead into the retained sanctuary and coffer slab.
  for(const side of[-1,1])for(let j=0;j<8;j++)B.box(center+side*1.91,3.57,3.81+j*.12,.13,4.24,.115,'hall185Recess');
  for(let j=0;j<9;j++)B.box(center,5.63,3.74+j*.13,3.82,.12,.11,'hall185Timber');
  for(let row=0;row<6;row++)for(let col=0;col<8;col++)B.box(center-2.50+(col+.5)*.60,1.2825,3.06+(row+.5)*.43,.588,.085,.418,'hall185ThresholdStone',0,.93+.045*Math.sin(row*7.1+col*2.3));
  // Coursed front retaining stone seats the occupied hall terrace beside
  // the exact retained stair/landing opening; no stair anchor is moved.
  for(const [a,b]of[[-8.95,-3.18],[1.63,11.90]])for(let row=0;row<10;row++){
   const n=Math.ceil((b-a)/1.05),step=(b-a)/n;for(let col=0;col<n;col++)B.box(a+(col+.5)*step,-1.98+(row+.5)*.324,5.925,step-.014,.310,.08,'hall185CourtStone',0,.91+.08*Math.sin(row*2.1+col*4.9));
  }
 });}
 function lanternSupport(x,bodyY=3.7,z=5.63,scale=.72){B.label('hall185-seated-facade-lantern-suspension',()=>{
  let beamBottom,kind;
  if(x>=-8.38&&x<=11.28){
   const y=6.37,zz=5.66;beamBottom=y-.105;kind='Folded bronze clamp around retained lower girt';
   for(const side of[-1,1]){B.box(x,y+side*.115,zz,.09,.018,.35,'bronze');B.box(x,y,zz+side*.166,.09,.23,.018,'bronze');}
  }else{
   const under=lowerRoofUnder(x,z);beamBottom=under-.18;kind='Closed roof-following short hanger seat below retained overhang';
   roofSeat(x,z,.58,.45,beamBottom,lowerRoofUnder);
   B.cyl(x,beamBottom+.07,z,.012,.16,'bronze');B.cyl(x,beamBottom-.006,z,.045,.014,'bronze');
  }
  const hookY=beamBottom-.045,bodyStemTop=bodyY+.99*scale;
  B.emit(keep(new T.TorusGeometry(.036,.009,8,24)),'goldDark',x,hookY,z);
  B.between([x,hookY,z],[x,bodyStemTop-.008,z],.010,.010,'goldDark',true);
  lanterns.push({bodyCenter:[x,bodyY,z],bodyScale:scale,bodyUnchanged:true,kind,beamBottomY:beamBottom,hook:[x,hookY,z],rodBottom:[x,bodyStemTop-.008,z],continuousSupport:true});
 });}
 return{front,cluster,returns,portal,lanternSupport,lanterns,seats,prototypes:owned,lowerRoofUnder,info:{revision:185,jointClearanceMetres:[.002,.0024,.002],crossedRanks:3,construction:'Closed waisted complementary half-lapped arms, flared solid dou, paired continuous raking tails and roof-fitted receiver courses; closed attic returns; deep portal and seated terrace threshold',historicalOrStructuralCertification:false}};
}
