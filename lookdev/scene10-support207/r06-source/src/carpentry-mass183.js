import * as T from 'three';

// Closed, local-scale timber members. These replace the thin hall capitals;
// they do not add a facade card or infer depth from reference-image pixels.
// The hierarchy follows the source-built, housed carpentry used in mass163
// and mass164, with sections and bearings fitted to scene10's own roof.
export function createCarpentryMass183({emit,box,group,carvedCloud=null,parentScale=[1,1,1]}){
 const cache=new Map(),parts=[];
 const keep=(key,g)=>{g.name='mass183-'+key;g.userData.mass183={kind:key,closedSolid:true};cache.set(key,g);return g;};
 function solid(key,shape,depth,bevel=.008){
  if(cache.has(key))return cache.get(key);
  const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:24,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel*.72,bevelSegments:3});
  g.translate(0,0,-depth/2);return keep(key,g);
 }
 function beamProfile(key,length,depth,notches=[],height=.24){
  const s=new T.Shape(),half=length/2,top=height*.48,under=x=>-height*.60+height*.48*Math.pow(Math.abs(x)/half,2.5);
  s.moveTo(-half,top);
  for(const n of notches.filter(n=>n.side==='top').sort((a,b)=>a.x-b.x)){
   s.lineTo(n.x-n.width/2,top);s.lineTo(n.x-n.width/2,n.y);s.lineTo(n.x+n.width/2,n.y);s.lineTo(n.x+n.width/2,top);
  }
  s.lineTo(half,top);s.quadraticCurveTo(half+.014,0,half-.025,under(half-.025));
  const cuts=notches.filter(n=>n.side==='bottom'),xs=[...new Set([half-.025,-half+.025,...Array.from({length:49},(_,i)=>-half+.025+(length-.05)*i/48),...cuts.flatMap(n=>[n.x-n.width/2,n.x+n.width/2])])].sort((a,b)=>b-a);
  for(let i=0;i<xs.length-1;i++){const a=xs[i],b=xs[i+1],cut=cuts.find(n=>Math.abs((a+b)/2-n.x)<n.width/2);s.lineTo(a,cut?cut.y:under(a));s.lineTo(b,cut?cut.y:under(b));}
  s.quadraticCurveTo(-half-.014,0,-half,top);s.closePath();return solid(key,s,depth,.007);
 }
 function seat(key,width,depth,height){
  const s=new T.Shape();s.moveTo(-width*.33,0);s.lineTo(width*.33,0);s.bezierCurveTo(width*.34,height*.30,width*.49,height*.43,width*.5,height*.77);s.lineTo(width*.5,height);s.lineTo(-width*.5,height);s.lineTo(-width*.5,height*.77);s.bezierCurveTo(-width*.49,height*.43,-width*.34,height*.30,-width*.33,0);s.closePath();return solid(key,s,depth,.007);
 }
 // The cap itself has the matching crossed saddles. Its top follows the
 // curved underside of the first arms, rather than hiding an overlap inside
 // an uncut block. Separate cell levels keep each housing wall upright.
 function saddledDaito(){
  const xs=[-.39,-.30,-.225,-.15,-.075,0,.075,.15,.225,.30,.39],p=[],uv=[];
  const tri=(a,b,c,n)=>{if(new T.Vector3(...b).sub(new T.Vector3(...a)).cross(new T.Vector3(...c).sub(new T.Vector3(...a))).dot(new T.Vector3(...n))<0)[b,c]=[c,b];for(const q of[a,b,c]){p.push(...q);uv.push(q[0],q[2]);}};
  const quad=(a,b,c,d,n)=>{tri(a,b,c,n);tri(a,c,d,n);};
  const under=x=>.34-.28*.60+.28*.48*Math.pow(Math.abs(x)/.62,2.5);
  const top=(x,z,i,j)=>{let y=.24;if(Math.abs((xs[j]+xs[j+1])/2)<.15)y=Math.min(y,under(x));if(Math.abs((xs[i]+xs[i+1])/2)<.15&&Math.abs((xs[j]+xs[j+1])/2)>=.15)y=Math.min(y,under(z));return y;};
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<xs.length-1;j++){
   const a=[xs[i],top(xs[i],xs[j],i,j),xs[j]],b=[xs[i+1],top(xs[i+1],xs[j],i,j),xs[j]],c=[xs[i+1],top(xs[i+1],xs[j+1],i,j),xs[j+1]],d=[xs[i],top(xs[i],xs[j+1],i,j),xs[j+1]];
   quad(a,b,c,d,[0,1,0]);
   if(i<xs.length-2){const B=[b[0],top(b[0],b[2],i+1,j),b[2]],C=[c[0],top(c[0],c[2],i+1,j),c[2]];if(Math.abs(b[1]-B[1])+Math.abs(c[1]-C[1])>1e-9)quad(b,c,C,B,[b[1]+c[1]>B[1]+C[1]?1:-1,0,0]);}
   if(j<xs.length-2){const D=[d[0],top(d[0],d[2],i,j+1),d[2]],C=[c[0],top(c[0],c[2],i,j+1),c[2]];if(Math.abs(d[1]-D[1])+Math.abs(c[1]-C[1])>1e-9)quad(c,d,D,C,[0,0,d[1]+c[1]>D[1]+C[1]?1:-1]);}
   if(i===0)quad([a[0],.16,a[2]],a,d,[d[0],.16,d[2]],[-1,0,0]);
   if(i===xs.length-2)quad(b,[b[0],.16,b[2]],[c[0],.16,c[2]],c,[1,0,0]);
   if(j===0)quad(a,[a[0],.16,a[2]],[b[0],.16,b[2]],b,[0,0,-1]);
   if(j===xs.length-2)quad([d[0],.16,d[2]],d,c,[c[0],.16,c[2]],[0,0,1]);
  }
  const profile=[[.2574,0],[.307,.09],[.39,.16]],ring=([r,y])=>[[-r,y,-r],[r,y,-r],[r,y,r],[-r,y,r]];
  for(let j=0;j<profile.length-1;j++){const a=ring(profile[j]),b=ring(profile[j+1]);for(let k=0;k<4;k++){const n=(k+1)%4;quad(a[k],a[n],b[n],b[k],[(a[k][0]+a[n][0])/2,0,(a[k][2]+a[n][2])/2]);}}
  quad(...ring(profile[0]),[0,-1,0]);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return keep('cross-saddled-deep-daito',g);
 }
 const daito=saddledDaito(),makito=seat('makito',.34,.33,.15);
 const firstX=beamProfile('housed-first-arm-x',1.24,.30,[{x:0,width:.30,side:'top',y:.012}],.28);
 const firstZ=beamProfile('housed-first-arm-z',1.24,.30,[{x:0,width:.30,side:'bottom',y:.012}],.28);
 const secondX=beamProfile('housed-second-arm-x',1.64,.27,[-1,1].map(sign=>({x:sign*.37,width:.27,side:'top',y:.012})),.27);
 const secondZ=beamProfile('housed-second-arm-z',1.64,.27,[-1,1].map(sign=>({x:sign*.37,width:.27,side:'bottom',y:.012})),.27);
 const receivingX=beamProfile('deep-receiving-arm-x',1.94,.31,[{x:0,width:.31,side:'top',y:.012}],.27);
 const receivingZ=beamProfile('deep-receiving-arm-z',1.94,.31,[{x:0,width:.31,side:'bottom',y:.012}],.27);
 const pendant=(()=>{const s=new T.Shape();s.moveTo(-.48,.12);s.lineTo(.48,.12);s.bezierCurveTo(.50,-.02,.36,-.18,.27,-.15);s.bezierCurveTo(.13,-.11,.15,-.34,0,-.35);s.bezierCurveTo(-.15,-.34,-.13,-.11,-.27,-.15);s.bezierCurveTo(-.36,-.18,-.50,-.02,-.48,.12);s.closePath();return solid('carved-pendant-shoulder',s,.33,.013);})();
 const shaft=keep('round-entasis-shaft',new T.LatheGeometry([[0,0],[.985,0],[1.018,.08],[1.035,.24],[1.028,.46],[1.006,.68],[.976,.87],[.94,1],[0,1]].map(p=>new T.Vector2(...p)),48));
 const shoe=keep('hollow-post-shoe',new T.LatheGeometry([[1.03,0],[1.05,.025],[1.05,.29],[1.03,.31],[1.005,.31],[1.005,0],[1.03,0]].map(p=>new T.Vector2(...p)),48));
 const foot=keep('seated-stone-column-base',new T.LatheGeometry([[0,0],[1.50,0],[1.52,.04],[1.49,.10],[1.24,.17],[1.17,.30],[0,.30]].map(p=>new T.Vector2(...p)),40));
 const leaf=(()=>{const p=[],uv=[],ix=[],N=16,R=12;
  for(let j=0;j<=N;j++){const t=j/N,rad=Math.pow(Math.sin(Math.PI*t),.8),w=.16*rad*(.86+.14*Math.cos(t*8*Math.PI)),h=.048*rad+.002;for(let k=0;k<R;k++){const a=k*Math.PI*2/R;p.push(t,w*Math.cos(a),.028*rad+h*Math.sin(a));uv.push(t,k/R);}}
  for(let j=0;j<N;j++)for(let k=0;k<R;k++){const a=j*R+k,b=j*R+(k+1)%R,c=a+R,d=b+R;ix.push(a,b,c,b,d,c);}
  p.push(0,0,0,1,0,0);uv.push(0,.5,1,.5);const lo=p.length/3-2,hi=lo+1;for(let k=0;k<R;k++){ix.push(lo,(k+1)%R,k);ix.push(hi,N*R+k,N*R+(k+1)%R);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return keep('closed-lobed-carving-leaf',g);
 })();
 const boss=keep('small-drawbore-pin',new T.SphereGeometry(1,12,8));
 function closedCurve(key,points,r){
  if(cache.has(key))return cache.get(key);const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments=Math.max(24,points.length*6),R=8,g=new T.TubeGeometry(path,segments,r,R,false),p=Array.from(g.attributes.position.array),uv=Array.from(g.attributes.uv.array),ix=Array.from(g.index.array);
  for(const t of[0,1]){const c=path.getPoint(t),normal=path.getTangent(t).multiplyScalar(t?1:-1),ci=p.length/3,offset=t?segments*(R+1):0;p.push(...c.toArray());uv.push(.5,.5);for(let k=0;k<R;k++){const a=offset+k,b=a+1,A=new T.Vector3(...p.slice(a*3,a*3+3)).sub(c),B=new T.Vector3(...p.slice(b*3,b*3+3)).sub(c);if(A.cross(B).dot(normal)>0)ix.push(ci,a,b);else ix.push(ci,b,a);}}
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.deleteAttribute('normal');g.computeVertexNormals();return keep(key,g);
 }
 const curl=closedCurve('closed-carved-scroll',[[0,0,0],[.10,.012,.005],[.18,.09,.012],[.15,.18,.018],[.06,.19,.014],[.008,.14,.014],[.034,.094,.020],[.095,.12,.022]],.013);
 function leafAt(x,y,z,l,w,angle,ma='cedar',depth=1){emit(leaf,ma,x,y,z,l,w,depth,[0,0,angle]);}
 function fitting(x,y,z,w,h){
  box(x,y,z,w,h,.020,'oldgold');box(x,y,z+.013,w-.032,h-.032,.008,'darkwood');
  for(let j=0;j<8;j++){const a=j*Math.PI/4;leafAt(x+Math.cos(a)*w*.055,y+Math.sin(a)*h*.055,z+.023,w*.34,h*1.22,a,'oldgold',.48);}
  emit(boss,'oldgold',x,y,z+.034,w*.11,h*.11,.013);
  for(const xx of[-1,1])for(const yy of[-1,1])emit(boss,'black',x+xx*w*.37,y+yy*h*.36,z+.025,.009,.009,.006);
 }
 function column(x,z,bottom,top,r=.27){
  const start=bottom+.30;if(!(top>start))throw Error('Mass183 column must have positive shaft height');
  emit(foot,'stone',x,bottom,z,r,1,r);emit(shaft,'red',x,start,z,r,top-start,r);emit(shoe,'black',x,start,z,r,1,r);
  // Head fittings are on the real post, below the timber receiving block.
  fitting(x,top-.15,z+r*.96,r*1.31,.22);parts.push({kind:'round-supported-column',x,z,bottom,shaftBottom:start,shaftTop:top,radius:r});
 }
 function capital(x,y,z,{width=.94,height=.60,depth=1.12,pendantFace=true,scan=false}={}){
  group(x,y,z,0,()=>{
   emit(daito,'cedar');emit(firstX,'cedar',0,.34,0);emit(firstZ,'cedar',0,.34,0,1,1,1,Math.PI/2);
   for(const sign of[-1,1]){emit(makito,'red',sign*.37,.46,0);emit(makito,'red',0,.46,sign*.37);}
   for(const sign of[-1,1]){emit(secondX,'cedar',0,.74,sign*.37);emit(secondZ,'cedar',sign*.37,.74,0,1,1,1,Math.PI/2);}
   for(const sx of[-1,1])for(const sz of[-1,1])emit(makito,'cedar',sx*.37,.86,sz*.37);
   for(const sign of[-1,1])emit(receivingX,'darkwood',0,1.13,sign*.37);emit(receivingZ,'cedar',0,1.13,0,1,1,1,Math.PI/2);
   box(0,1.287,0,1.94,.065,.31,'cedar');
   for(const sign of[-1,1])box(sign*.37,1.287,0,.31,.065,1.94,'cedar');
   for(const sx of[-1,1])for(const sz of[-1,1]){box(sx*.37,.995,sz*.535,.085,.042,.020,'endwood');box(sx*.37,1.165,sz*.535,.074,.032,.018,'endwood');}
   if(pendantFace){emit(pendant,'cedar',0,.01,.285);for(const sign of[-1,1]){emit(curl,'cedar',sign*.12,-.06,.467,.76,.72,1.12,[0,sign<0?Math.PI:0,sign<0?Math.PI:0]);leafAt(sign*.08,-.075,.468,.25,.58,sign<0?Math.PI+.42:-.42,'cedar',1.1);}}
   for(const sign of[-1,1])for(const zz of[-.37,.37]){
    // Thin metal returns fit only the exposed end section.
    box(sign*.974,1.15,zz,.012,.16,.27,'oldgold');box(sign*.937,1.245,zz,.085,.012,.27,'oldgold');
    emit(boss,'black',sign*.982,1.15,zz,.009,.014,.014);
   }
  },[width,height,depth]);
  if(scan&&carvedCloud){
   // Install outside the capital's nonuniform section transform. The three
   // compensating parent axes keep the real source carving uniformly scaled
   // in the actual world; its pierced channels and relief are not stretched.
   const uniform=.93,scales=parentScale.map(s=>uniform/s);
   for(const side of[-1,1]){
    const xx=x+side*uniform/(2*parentScale[0]),geometry=side<0?carvedCloud.reflectedSurface:carvedCloud.surface,caps=side<0?carvedCloud.reflectedCaps:carvedCloud.caps;
    emit(geometry,'oldgold',xx,y-.36,z+.33,...scales);emit(caps,'oldgold',xx,y-.36,z+.33,...scales);
   }
   parts.push({kind:'source-preserved-carved-timber-pair',x,y:y-.36,z:z+.33,uniformWorldScale:uniform,source:'cloud-scroll176',mountCaps:true,sourceGeometryUnmodified:true});
  }
  parts.push({kind:'deep-housed-capital',x,y,z,widthScale:width,heightScale:height,depthScale:depth,topY:y+1.3195*height,bottomY:y-.34*height});
  return y+1.3195*height;
 }
 function strut(a,b,width=.18,height=.24,ma='cedar',seatTop=null){
  if(seatTop!==null){
   b=[...b];const run=Math.hypot(b[0]-a[0],b[2]-a[2]);
   for(let i=0;i<12;i++)b[1]=seatTop-height*.5*run/Math.hypot(run,b[1]-a[1]);
  }
  const A=new T.Vector3(...a),B=new T.Vector3(...b),forward=B.clone().sub(A).normalize(),side=new T.Vector3(forward.z,0,-forward.x).normalize();
  if(side.lengthSq()<.001)side.set(1,0,0);const up=new T.Vector3().crossVectors(forward,side).normalize(),q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(side,up,forward)),centre=A.clone().add(B).multiplyScalar(.5);
  emit('box',ma,...centre.toArray(),width,height,A.distanceTo(B),q);parts.push({kind:'closed-square-cantilever',from:a,to:b,width,height,...(seatTop!==null?{seatTop,actualEndTop:b[1]+height*.5*up.y,bearingGap:seatTop-b[1]-height*.5*up.y}:{})});
 }
 function arch(x,y,z,width=1.7,depth=.35){
  const key='deep-bay-arch-'+width.toFixed(4)+'-'+depth.toFixed(4);let g=cache.get(key);
  if(!g){const s=new T.Shape(),h=width/2;s.moveTo(-h,.14);s.lineTo(h,.14);s.lineTo(h,.015);s.bezierCurveTo(h*.87,-.025,h*.65,-.27,h*.44,-.24);s.bezierCurveTo(h*.20,-.22,h*.19,-.08,0,-.13);s.bezierCurveTo(-h*.19,-.08,-h*.20,-.22,-h*.44,-.24);s.bezierCurveTo(-h*.65,-.27,-h*.87,-.025,-h,.015);s.closePath();g=solid(key,s,depth,.012);}
  emit(g,'cedar',x,y,z);
  for(const sign of[-1,1]){emit(curl,'cedar',x+sign*width*.19,y-.025,z+depth/2+.008,width*.48,.57,1.2,[0,0,sign<0?Math.PI:0]);leafAt(x+sign*width*.08,y-.015,z+depth/2+.018,width*.18,.32,sign<0?Math.PI-.12:.12,'oldgold',.52);}
 }
 function frieze(x,y,z,width,height=.30,{wood=false}={}){
  const key=['frieze-stem',width,height].join('-'),points=Array.from({length:49},(_,i)=>[-width/2+.06+(width-.12)*i/48,Math.sin(i/48*Math.PI*6)*height*.16,.012]);
  box(x,y,z,width,height,.30,'cedar');box(x,y,z+.158,width-.065,height-.062,.024,'darkwood');
  for(const sign of[-1,1]){box(x,y+sign*(height/2-.015),z+.183,width,.031,.049,'cedar');box(x,y+sign*(height/2-.046),z+.183,width-.04,.013,.017,'oldgold');}
  emit(closedCurve(key,points,.013),'cedar',x,y,z+.18);
  const count=Math.max(2,Math.round(width/.46)),pitch=(width-.15)/count;
  for(let j=0;j<count;j++){const xx=x-width/2+.075+(j+.5)*pitch,sign=j%2?-1:1,ma=wood?'cedar':j%3?'oldgold':'cedar';leafAt(xx-pitch*.35,y,z+.195,pitch*.57,height*1.70,sign*.45,ma,.73);leafAt(xx+pitch*.20,y,z+.198,pitch*.43,height*1.34,Math.PI-sign*.40,ma,.85);emit(curl,ma,xx-pitch*.10,y-sign*height*.06,z+.198,pitch*.62,height*1.7,.72,[0,0,sign<0?Math.PI:0]);}
 }
 return{column,capital,strut,arch,frieze,fitting,parts,geometries:cache,revision:'mass183-deep-housed-timber-and-occupied-bays'};
}
