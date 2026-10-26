import {createCurvedEaveRafter} from './curved-rafter368.js';

// A load assembly, not a stack of ornamental beam-end plates. The two
// lowest arms have complementary half laps. Successive cups sit on real
// shoulders; two deep raking tails carry the forward purlin into the column.
// Dimensions are local building metres before the explicit bearing-gap fit.
export function createBearing174(T,{emit,grouped,keep=g=>g}){
 const prototypes=[],seats=[];let instances=0;
 const own=g=>{prototypes.push(g);return keep(g);};
 function finish(g,name){
  const p=g.attributes.position,ids=g.index?Array.from(g.index.array):Array.from({length:p.count},(_,i)=>i);let volume=0;
  for(let i=0;i<ids.length;i+=3){const a=new T.Vector3().fromBufferAttribute(p,ids[i]),b=new T.Vector3().fromBufferAttribute(p,ids[i+1]),c=new T.Vector3().fromBufferAttribute(p,ids[i+2]);volume+=a.dot(b.cross(c))/6;}
  if(volume<0){for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];g.setIndex(ids);}
  g.name=name;g.userData={authoredClosedTimber174:true,photoTexture:false,signedVolumeMetres3:Math.abs(volume)};g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return own(g);
 }
 function arm(length,depth,{lap='',rank=0}={}){
  const a=length/2,s=new T.Shape(),top=x=>.17+.055*(Math.abs(x)/a)**7,bottom=x=>-.205+.065*(Math.abs(x)/a)**1.8-.047*Math.exp(-(((Math.abs(x)/a-.70)/.17)**2));
  const xs=Array.from({length:49},(_,i)=>-a+length*i/48),cut=.225;
  const topXs=[...new Set([...xs,-cut,cut])].sort((x,y)=>x-y);
  s.moveTo(-a,top(-a));
  for(const x of topXs.slice(1)){
   if(lap==='top'&&x===-cut){s.lineTo(x,top(x));s.lineTo(x,.005);}
   else if(lap==='top'&&x===cut){s.lineTo(x,.005);s.lineTo(x,top(x));}
   else s.lineTo(x,lap==='top'&&Math.abs(x)<cut?.005:top(x));
  }
  s.lineTo(a,bottom(a));
  for(const x of topXs.slice(0,-1).reverse()){
   if(lap==='bottom'&&x===cut){s.lineTo(x,bottom(x));s.lineTo(x,.005);}
   else if(lap==='bottom'&&x===-cut){s.lineTo(x,.005);s.lineTo(x,bottom(x));}
   else s.lineTo(x,lap==='bottom'&&Math.abs(x)<cut?.005:bottom(x));
  }
  s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth,steps:6,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:3,curveSegments:24}),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),u=Math.min(1,Math.abs(x)/a),v=T.MathUtils.clamp((y+.22)/.45,0,1),z=p.getZ(i)-depth/2;
   // The belly is canted, the throats waisted, and the noses swell again.
   const cheek=(.88+.12*v)*(1-.18*Math.exp(-(((u-.62)/.19)**2)));
   p.setZ(i,z*cheek+.0035*Math.sin(x*14+rank*.73)*Math.sin(v*Math.PI));
  }
  return finish(g,'scene03-notched-canted-load-arm174-'+rank+'-'+lap);
 }
 function noseArm(length,depth,rank,lap=''){
  const R=56,N=48,K=16,p=[],uv=[],ids=[];
  function section(e,a){
   const top=.19+.05*e**8,raw=-.245+.10*e**1.65-.035*Math.exp(-(((e-.62)/.18)**2)),cut=.225/(length/2),bottom=lap==='bottom'?T.MathUtils.lerp(.005,raw,T.MathUtils.smoothstep(e,cut-.018,cut+.018)):raw,mid=(top+bottom)/2,hh=(top-bottom)/2,ca=Math.cos(a),sa=Math.sin(a),v=Math.sign(sa)*Math.abs(sa)**.43;
   return{y:mid+hh*v,z:depth*.5*(1-.15*Math.exp(-(((e-.64)/.18)**2)))*Math.sign(ca)*Math.abs(ca)**.49*(.94+.06*v),mid,hh};
  }
  for(let j=0;j<=R;j++){const u=-1+2*j/R,e=Math.abs(u);for(let k=0;k<N;k++){const q=section(e,k/N*Math.PI*2);p.push(u*length/2,q.y,q.z);uv.push(u*length/2,k/N*depth);}}
  for(let j=0;j<R;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N;ids.push(a,b,a+N,b,b+N,a+N);}
  const spiral=[];for(const sign of[-1,1])for(let j=0;j<80;j++){const t=j/79,a=t*Math.PI*3.35+rank*.12,r=.43*(1-.80*t);spiral.push([sign*(.25+Math.cos(a)*r),.04+Math.sin(a)*r*.78]);}
  function faceDepth(z,y,r){let d=4;for(const q of spiral)d=Math.min(d,Math.hypot(z-q[0],y-q[1]));return (.040*(1-r*r)-.028*Math.exp(-((d/.055)**2))+.009*Math.exp(-(((d-.090)/.038)**2)))*(1-r**8);}
  for(const sign of[-1,1]){
   const q=section(1,0),centre=p.length/3;p.push(sign*(length/2+.040),q.mid,0);uv.push(.5,.5);const rings=[];
   for(let j=1;j<=K;j++){
    const r=j/K,ring=[];
    for(let k=0;k<N;k++){
     if(j===K){ring.push((sign<0?0:R*N)+k);continue;}
     const e=section(1,k/N*Math.PI*2),y=q.mid+(e.y-q.mid)*r,z=e.z*r,x=sign*(length/2+faceDepth(z/(depth*.5),(y-q.mid)/q.hh,r));ring.push(p.length/3);p.push(x,y,z);uv.push(z,y);
    }rings.push(ring);
   }
   for(let k=0;k<N;k++)sign>0?ids.push(centre,rings[0][k],rings[0][(k+1)%N]):ids.push(centre,rings[0][(k+1)%N],rings[0][k]);
   for(let j=0;j<K-1;j++)for(let k=0;k<N;k++){const a=rings[j][k],b=rings[j][(k+1)%N],c=rings[j+1][k],d=rings[j+1][(k+1)%N];sign>0?ids.push(a,c,b,b,c,d):ids.push(a,b,c,b,d,c);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);return finish(g,'scene03-continuous-waisted-carved-nose-arm174-'+rank+'-'+lap);
 }
 function cup(width,height){
  const N=48,R=12,p=[],uv=[],ids=[];
  for(let j=0;j<=R;j++){const t=j/R,r=width/2*(.63+.37*Math.sin(t*Math.PI/2));for(let k=0;k<N;k++){const a=k/N*Math.PI*2,c=Math.cos(a),s=Math.sin(a);p.push(r*Math.sign(c)*Math.abs(c)**.34,height*t,r*Math.sign(s)*Math.abs(s)**.34);uv.push(k/N,t);}}
  for(let j=0;j<R;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N;ids.push(a,b,a+N,b,b+N,a+N);}
  const c=p.length/3;p.push(0,0,0,0,height,0);uv.push(.5,0,.5,1);for(let k=0;k<N;k++)ids.push(c,(k+1)%N,k,c+1,R*N+k,R*N+(k+1)%N);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);return finish(g,'scene03-flared-bearing-cup174-'+width);
 }
 function tail(){
  const curve=new T.CatmullRomCurve3([[0,.29,-.34],[0,.49,-.04],[0,.91,.48],[0,1.46,1.02],[0,1.83,1.49]].map(p=>new T.Vector3(...p))),R=48,N=32,p=[],uv=[],ids=[];
  for(let j=0;j<=R;j++){
   const t=j/R,c=curve.getPoint(t),tan=curve.getTangent(t).normalize(),side=new T.Vector3(1,0,0),up=tan.clone().cross(side).normalize();
   const w=.31*(.82+.18*Math.sin(Math.PI*t)),h=.32*(1-.30*t)+.055*Math.sin(Math.PI*t);
   for(let k=0;k<N;k++){const a=k/N*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),q=c.clone().addScaledVector(side,w/2*Math.sign(ca)*Math.abs(ca)**.37).addScaledVector(up,h/2*Math.sign(sa)*Math.abs(sa)**.37);p.push(...q.toArray());uv.push(k/N,t*curve.getLength());}
  }
  for(let j=0;j<R;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N;ids.push(a,b,a+N,b,b+N,a+N);}
  const c=p.length/3;p.push(...curve.getPoint(0).toArray(),...curve.getPoint(1).toArray());uv.push(.5,0,.5,1);for(let k=0;k<N;k++)ids.push(c,(k+1)%N,k,c+1,R*N+k,R*N+(k+1)%N);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);return finish(g,'scene03-closed-raking-cantilever-tail174');
 }
 const faceSkins308=new Map();
 function fittedEndSkins308(g,half){
  const pos=g.attributes.position,ids=g.index.array,out=[];
  for(const sign of[-1,1]){
   const chosen=[];for(let k=0;k<ids.length;k+=3){const t=[ids[k],ids[k+1],ids[k+2]];if(t.every(i=>sign*pos.getX(i)>=half-.00001))chosen.push(t);}if(!chosen.length)throw Error('308 cut face selection empty');
   const map=new Map(),p=[],uv=[],edges=new Map(),ix=[];for(const t of chosen)for(const id of t)if(!map.has(id)){map.set(id,map.size);p.push(pos.getX(id)+sign*.0025,pos.getY(id),pos.getZ(id));uv.push(pos.getZ(id),pos.getY(id));}
   const count=map.size;for(const id of map.keys()){p.push(pos.getX(id)-sign*.0003,pos.getY(id),pos.getZ(id));uv.push(pos.getZ(id),pos.getY(id));}
   for(const t of chosen){const a=t.map(id=>map.get(id));ix.push(...a,a[0]+count,a[2]+count,a[1]+count);for(let k=0;k<3;k++){const j=a[k],l=a[(k+1)%3],key=Math.min(j,l)+','+Math.max(j,l);if(edges.has(key))edges.get(key).n++;else edges.set(key,{a:j,b:l,n:1});}}
   for(const {a,b,n}of edges.values())if(n===1)ix.push(a+count,b,a,a+count,b+count,b);
   const skin=new T.BufferGeometry();skin.setAttribute('position',new T.Float32BufferAttribute(p,3));skin.setAttribute('uv',new T.Float32BufferAttribute(uv,2));skin.setIndex(ix);out.push(finish(skin,'scene03-308-closed-thin-gilt-following-actual-carved-cut-'+sign));
  }
  faceSkins308.set(g,out);
 }
 const cups=[cup(.88,.26),cup(.47,.22),cup(.42,.20)],arms=[arm(1.39,.47,{lap:'top',rank:0}),noseArm(1.39,.47,1,'bottom'),arm(1.80,.43,{rank:2}),noseArm(1.66,.42,3),arm(2.10,.46,{rank:4}),noseArm(1.47,.39,5)],raking=tail();
 const receiver=finish(createCurvedEaveRafter([[-1.12,1.97,1.43],[0,1.95,1.43],[1.12,1.97,1.43]],.43,.22),'scene03-continuous-cambered-roof-receiver174');
 for(const [g,length]of[[arms[1],1.39],[arms[3],1.66],[arms[5],1.47]])fittedEndSkins308(g,length/2);
 function cluster(x,base,z,top,scale=1,major=true,depthScale=scale){
  const sy=(top-base)/2.08;if(!(sy>0))throw Error('174 requires a positive occupied bearing gap');
  const carvedBeam308=(g,ma,...a)=>{emit(g,ma,...a);for(const skin of faceSkins308.get(g)??[])emit(skin,'bearingGilt',...a);};
  grouped(x,base,z,0,()=>{
   emit(cups[0],'red',0,0,0,scale,sy,depthScale);
   // The equal contact plane .455 is shared by the complementary laps.
   emit(arms[0],'cedar',0,.45*sy,0,scale,sy,depthScale);
   carvedBeam308(arms[1],'red',0,.45*sy,0,depthScale,sy,scale,Math.PI/2);
   for(const sign of[-1,1]){
    emit(cups[1],'red',sign*.36*scale,.615*sy,.35*depthScale,scale,sy,depthScale);
    carvedBeam308(arms[3],'cedar',sign*.36*scale,.99*sy,.39*depthScale,depthScale,sy,scale,Math.PI/2);
    emit(cups[2],'cedar',sign*.53*scale,1.205*sy,.84*depthScale,scale,sy,depthScale);
    carvedBeam308(arms[5],'cedar',sign*.53*scale,1.76*sy,.96*depthScale,depthScale,sy,scale,Math.PI/2);
    // Tail bodies have continuous belly, cheeks, rounded section and caps.
    if(major)emit(raking,'red',sign*.26*scale,0,0,scale,sy,depthScale);
   }
   emit(arms[2],'red',0,1.015*sy,.36*depthScale,scale,sy,depthScale);
   emit(arms[4],'red',0,1.57*sy,.88*depthScale,scale,sy,depthScale);
   emit(receiver,'cedar',0,0,0,scale,sy,depthScale);
  });
  instances++;seats.push({column:[x,base,z],roofReceiverY:top,normalizedGap:top-base,major,sectionScale:[scale,sy,depthScale],normalizedReceiverOverrun:0});
 }
 return{cluster,prototypes,seats,get instances(){return instances;},construction:'Complementary half-lapped crossed arms, flared dou, waisted canted cheeks, two continuous raking tails and one cambered purlin seat; thin fitted metal follows the actual curved carved cut faces without flat decorative badges'};
}
