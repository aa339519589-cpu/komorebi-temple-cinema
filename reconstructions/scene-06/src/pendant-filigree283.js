import * as T from 'three';

// Original authored solids, using only manually observed floral composition
// in the user's photograph as a guide. No photograph/pattern is sampled at
// runtime, extruded from brightness, used as a depth plate, or alpha-masked.
// Back construction, metal/wood thickness and exact species are inferences.
const TAU=Math.PI*2;
const smooth=t=>t*t*(3-2*t);

function finish283(g,role){
 if(!g.attributes.normal)g.computeVertexNormals();
 if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));
 const p=g.attributes.position,n=g.attributes.normal,indices=Array.from(g.index.array),arrays=Object.fromEntries(Object.entries(g.attributes).map(([k,a])=>[k,Array.from(a.array)]));let split=0;
 for(let t=0;t<indices.length;t+=3){
  const ids=indices.slice(t,t+3),v=ids.map(i=>new T.Vector3().fromBufferAttribute(p,i)),face=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));
  if(face.lengthSq()<1e-24)continue;face.normalize();
  for(let k=0;k<3;k++)if(face.dot(new T.Vector3().fromBufferAttribute(n,ids[k]))<=1e-6){
   const next=arrays.position.length/3;indices[t+k]=next;split++;
   for(const [key,a]of Object.entries(g.attributes))if(key==='normal')arrays.normal.push(...face.toArray());else for(let j=0;j<a.itemSize;j++)arrays[key].push(a.array[ids[k]*a.itemSize+j]);
  }
 }
 for(const [key,a]of Object.entries(g.attributes))g.setAttribute(key,new T.Float32BufferAttribute(arrays[key],a.itemSize));g.setIndex(indices);g.computeBoundingBox();g.computeBoundingSphere();
 g.parameters={pendants283:{role,closedActualSolid:true}};
 g.userData={...g.userData,pendants283:true,role283:role,closedCarvedShell:true,actualFrontAndBack283:true,coincidentNormalsSmoothed:true,finalSurfaceNormalsOutward:true,allAttributesExtendedTogether:true,normalCornerSplits:split};
 return g;
}

function blade283({length,width,bend=.08,curl=.006,cup=.004,phase=0,petal=false}){
 const rows=28,cols=12,stride=cols+1,layer=(rows+1)*stride,p=[],uv=[],ix=[];
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const t=j/rows,u=i/cols*2-1,s=Math.max(0,Math.sin(Math.PI*t)),envelope=s**(petal?.38:.69),edge=.96+.045*Math.sin(3*Math.PI*t+phase);
  const w=(petal?.0045:.0011)+width*.5*envelope*edge,center=bend*length*(.70*Math.sin(Math.PI*t)+.30*t);
  const x=center+u*w*(1+.06*s*Math.sin(2*Math.PI*t+phase)*Math.sign(u)),y=length*t;
  const front=.002+s*(petal?.010:.005)+curl*t**4+cup*s*u*u;
  const vein=petal?.0011*s*Math.cos((u+.10*Math.sin(Math.PI*t))*Math.PI*3):-.0014*s*Math.exp(-(((u-.18*Math.sin(Math.PI*t))/.12)**2));
  const z=side===0?front+vein:front-(.0020+.0013*s)-.0012*s*(1-u*u);
  p.push(x,y,z);uv.push(i/cols,t);
  if(j<rows&&i<cols){const a=side*layer+j*stride+i,b=a+1,c=a+stride,d=c+1;side===0?ix.push(a,b,c,b,d,c):ix.push(a,c,b,b,c,d);}
 }
 const boundary=[];
 for(let i=0;i<=cols;i++)boundary.push(i);
 for(let j=1;j<=rows;j++)boundary.push(j*stride+cols);
 for(let i=cols-1;i>=0;i--)boundary.push(rows*stride+i);
 for(let j=rows-1;j>0;j--)boundary.push(j*stride);
 for(let k=0;k<boundary.length;k++){const a=boundary[k],c=boundary[(k+1)%boundary.length];ix.push(a,a+layer,c,c,a+layer,c+layer);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return finish283(g,petal?'thin-cupped-flower-petal':'rolled-veined-leaf');
}

function rib283(points,width=.009,depth=.006,chased=false){
 const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)),false,'centripetal'),rows=Math.max(40,points.length*12),cols=12,p=[],uv=[],ix=[];
 for(let j=0;j<=rows;j++){
  const t=j/rows,c=curve.getPoint(t),d=curve.getTangent(t),l=Math.hypot(d.x,d.y)||1,nx=-d.y/l,ny=d.x/l,envelope=.70+.30*Math.sin(Math.PI*t);
  for(let k=0;k<cols;k++){
   const a=k/cols*TAU,u=Math.cos(a),f=Math.sin(a),crease=.0007*Math.max(0,f)*(1-Math.abs(u));
   const groove=chased?.00038*Math.max(0,f)*(Math.exp(-(((u-.34)/.14)**2))+Math.exp(-(((u+.34)/.14)**2))):0;
   p.push(c.x+nx*u*width*.5*envelope,c.y+ny*u*width*.5*envelope,c.z+f*depth*.5*envelope+crease-groove);uv.push(k/cols,t);
   if(j<rows){const q=j*cols+k,n=j*cols+(k+1)%cols;ix.push(q,n,q+cols,n,n+cols,q+cols);}
  }
 }
 for(const j of [0,rows]){const v=curve.getPoint(j/rows),ci=p.length/3;p.push(...v.toArray());uv.push(.5,j/rows);for(let k=0;k<cols;k++){const a=j*cols+k,n=j*cols+(k+1)%cols;j===0?ix.push(ci,n,a):ix.push(ci,a,n);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.userData.mergeUniqueCarving=true;return finish283(g,chased?'chased-closed-furled-strip':'continuous-closed-rib');
}

function boss283(radius=.014,depth=.008,lobes=8){
 const profile=[[0,-depth*.40],[radius*.80,-depth*.40],[radius,0],[radius*.88,depth*.45],[radius*.53,depth*.68],[0,depth*.70]],rows=28,cols=48,p=[],uv=[],ix=[];
 for(let j=0;j<=rows;j++){
  const t=j/rows,q=t*(profile.length-1),i=Math.min(profile.length-2,Math.floor(q)),f=smooth(q-i),r=profile[i][0]+f*(profile[i+1][0]-profile[i][0]),z=profile[i][1]+f*(profile[i+1][1]-profile[i][1]);
  for(let k=0;k<cols;k++){const a=k/cols*TAU,rr=Math.max(.00012,r)*(1-.055*Math.cos(lobes*a)*Math.sin(Math.PI*t));p.push(Math.cos(a)*rr,Math.sin(a)*rr,z);uv.push(k/cols,t);if(j<rows){const a0=j*cols+k,b=j*cols+(k+1)%cols;ix.push(a0,b,a0+cols,b,b+cols,a0+cols);}}
 }
 for(const j of [0,rows]){const ci=p.length/3;p.push(0,0,profile[j===0?0:profile.length-1][1]);uv.push(.5,j/rows);for(let k=0;k<cols;k++){const a=j*cols+k,b=j*cols+(k+1)%cols;j===0?ix.push(ci,b,a):ix.push(ci,a,b);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return finish283(g,'small-chased-flower-heart');
}

function addRib283(b,key,points,width=.009,depth=.006,material='gold'){
 b.add(b.geometry('283-rib-'+key,()=>rib283(points,width,depth)),material);
}
function addBlade283(b,key,recipe,x,y,z,angle=0,material='gold'){
 const g=b.geometry('283-blade-'+JSON.stringify(recipe),()=>blade283(recipe));b.add(g,material,x,y,z,1,1,1,0,0,angle);return g;
}

function bearingPin283(b,key,x,y,z0,z1,r=.004){
 const g=b.geometry('283-bearing-pin-'+[r,z1-z0].join(':'),()=>finish283(new T.CylinderGeometry(r,r,z1-z0,16,1,false).rotateX(Math.PI/2),'closed-soldered-bearing-pin'));
 b.add(g,'oldgold',x,y,(z0+z1)/2);
}

function blossom283(b,key,x,y,z,radius,variant=0){
 const layers=[{n:9+variant%3,len:radius*.82,w:radius*.60,ring:radius*.11,z:0},{n:11+(variant+1)%3,len:radius*.66,w:radius*.51,ring:radius*.08,z:.008},{n:6+variant%2,len:radius*.43,w:radius*.40,ring:radius*.045,z:.015}];
 let petals=0;
 b.add(b.geometry('283-flower-rear-bearing-'+radius,()=>boss283(radius*.45,.019,16)),'oldgold',x,y,z+.005);
 b.add(b.geometry('283-flower-inner-bearing-'+radius,()=>boss283(radius*.20,.016,12)),'oldgold',x,y,z+.0245);
 for(const [row,s]of layers.entries())for(let k=0;k<s.n;k++){
  const a=k/s.n*TAU+row*.47+variant*.19+.055*Math.sin(k*2.3+variant),len=s.len*(1+.09*Math.sin(k*1.7+variant)),w=s.w*(1+.08*Math.cos(k*2.1));
  addBlade283(b,key+'-'+row+'-'+k,{length:len,width:w,bend:.12*Math.sin(k*1.9+variant),curl:.006+(row*.002),cup:.006+row*.002,phase:variant*.4+k*.31,petal:true},x-Math.sin(a)*s.ring,y+Math.cos(a)*s.ring,z+s.z,a);petals++;
 }
 b.add(b.geometry('283-heart-'+radius,()=>boss283(radius*.17,.009,9+variant%3)),'gold',x,y,z+.032);
 for(let k=0;k<7;k++){const a=k/7*TAU+variant*.2,r=radius*.14;b.add(b.geometry('283-small-seed',()=>boss283(.0045,.005,6)),'oldgold',x+Math.cos(a)*r,y+Math.sin(a)*r,z+.034);}
 return petals;
}

function curlRoute283(cx,cy,rx,ry,hand=1,z=.064,turns=1.23){
 const p=[];for(let k=0;k<=10;k++){const t=k/10,a=-Math.PI*.58+t*TAU*turns,r=1-.73*t;p.push([cx+hand*rx*Math.cos(a)*r,cy+ry*Math.sin(a)*r,z+.004*Math.sin(Math.PI*t)]);}return p;
}

function interlacedWeb283(b,length,hand){
 const Y=v=>v*(length/3.10),emit=p=>p.map(([x,y,z])=>[hand*x,Y(y),z]);let volutes=0,links=0,leaves=0;
 for(let row=0;row<30;row++){
  const starts=[];
  for(let col=0;col<6;col++){
   const x=-.172+col*.069+.007*Math.sin(row*1.9+col*1.3),y=-.092-row*(2.92/29)+.006*Math.sin(col*1.1+row*.61),rx=.034+.009*Math.sin(row*1.1+col*.8)**2,ry=.043+.019*Math.cos(row*.77+col)**2,z=.050+.003*Math.sin(row*1.3+col*.7),turns=1.14+.37*Math.sin(row*1.37+col*.5)**2;
   const route=curlRoute283(x,y,rx,ry,(row+col)%2?-1:1,z,turns),width=.0075+.004*Math.sin(row*.83+col*1.9)**2;
   b.add(b.geometry('283-r04-furled-volute-'+length+'-'+hand+'-'+row+'-'+col,()=>rib283(emit(route),width,.0032,true)),'oldgold');starts.push(route[0]);volutes++;
   if(row%2===0&&(col===1||col===4)){
    const q=route[4],before=route[3],after=route[5],base=-Math.atan2(after[0]-before[0],after[1]-before[1]);
    for(let k=0;k<3;k++){
     const a=base+(k-1)*.53+.13*Math.sin(row+col);
     addBlade283(b,'r04-web-fan-'+row+'-'+col+'-'+k,{length:.039+.008*(k%2),width:.016+.003*(row%3),bend:hand*.16*Math.sin(col+k),curl:.009+.001*k,cup:.0045,phase:row*.63+col*.71+k,petal:false},hand*q[0],Y(q[1]),q[2]-.001,hand>0?a:-a,'gold');leaves++;
    }
   }
  }
  const connector=[[-.225,starts[0][1],.056],...starts,[.225,starts.at(-1)[1],.056]];
  b.add(b.geometry('283-r04-interlaced-link-'+length+'-'+hand+'-'+row,()=>rib283(emit(connector),.0048,.0035,true)),'oldgold');links++;
 }
 return{volutes,links,leaves,ribs:volutes+links};
}

export function buildPendantPiercing283(b,{length=3.10,hand=1}={}){
 const scaleY=length/3.10,Y=v=>v*scaleY,zRear=.041,zFront=.068;
 const primary=[[0,.006,.055],[-.086,-.22,.057],[-.092,-.48,.062],[.080,-.78,.068],[.094,-1.03,.063],[-.087,-1.31,.057],[-.090,-1.56,.061],[.088,-1.84,.068],[.085,-2.09,.060],[-.083,-2.39,.056],[-.077,-2.65,.062],[0,-3.10,.055]];
 const companion=primary.map(([x,y,z],i)=>[-x*.84,y,zRear+.003*Math.sin(i*1.7)]);
 const transform=p=>p.map(([x,y,z])=>[hand*x,Y(y),z]);
 addRib283(b,'primary-'+length+'-'+hand,transform(primary),.013,.008);
 addRib283(b,'companion-'+length+'-'+hand,transform(companion),.010,.007,'oldgold');
 const web=interlacedWeb283(b,length,hand);
 let leaves=web.leaves,ribs=2+web.ribs,flowers=0,petals=0;
 // Each returned scroll is tied to both a real stem and the inner frame.
 // It spans the panel continuously instead of leaving broken image islands.
 for(let j=0;j<10;j++)for(const side of [-1,1]){
  const y=-.15-j*.295,x=side*(.115+.012*Math.sin(j*1.8)),z=zFront-.010+.004*((j+1)%2);
  const p=curlRoute283(x,y,.092,.136,side,z,1.13+(j%3)*.045);
  p[0]=[side*.225,Y(y+.105),.056];for(let k=1;k<p.length;k++)p[k][1]=Y(p[k][1]);
  p.push([side*.040,Y(y-.012),.061]);
  addRib283(b,'side-return-'+length+'-'+hand+'-'+j+'-'+side,p.map(([x,y,z])=>[hand*x,y,z]),.0072,.0054);ribs++;
  // Four differently bent blades arise from staggered places on this scroll.
  for(let k=0;k<4;k++){
   const yy=y+.058-k*.058+.010*Math.sin(j*1.3+k),xx=side*(.082+.031*Math.sin(j*1.17+k*.9)),outward=(j+k)%3!==0,a=side*(outward?-(.60+.29*k):(.55+.28*k))+.25*Math.sin(j*1.3+k);
   const len=.072+.020*Math.sin((j+1)*1.7+k*.8)**2,w=.031+.008*Math.sin(j*.7+k*1.9)**2;
   const bladeZ=zFront+(k%2)*.004;
   addRib283(b,'petiole-'+length+'-'+hand+'-'+j+'-'+side+'-'+k,[[hand*side*.225,Y(yy+.022),.056],[hand*side*.151,Y(yy+.029),.063],[hand*xx,Y(yy),bladeZ+.001]],.0045,.004);ribs++;
   addBlade283(b,'side-'+j+'-'+side+'-'+k,{length:len,width:w,bend:hand*side*(.08+.08*Math.sin(j+k)),curl:.007+.003*(k%2),cup:.0045,phase:j*.47+k*.91,petal:false},hand*xx,Y(yy),bladeZ,hand>0?a:-a);leaves++;
  }
 }
 // Fine counter-scrolls sit forward of the punched web and return to its
 // actual metal. They break the former two straight rows of regular leaves.
 for(let j=0;j<13;j++)for(const side of [-1,1]){
  const y=-.12-j*.238,route=curlRoute283(side*.085+.014*Math.sin(j),y,.104,.144,side,.058,1.43);
  route[0]=[side*.225,Y(y+.10),.055];for(let k=1;k<route.length;k++)route[k][1]=Y(route[k][1]);
  addRib283(b,'r02-counter-scroll-'+length+'-'+hand+'-'+j+'-'+side,route.map(([x,y,z])=>[hand*x,y,z]),.0085,.0048);ribs++;
  for(let k=0;k<3;k++){
   const a=side*(.35+k*.77)+.15*Math.sin(j),xx=side*.058,yy=y-.025+k*.026;
   addBlade283(b,'r02-curled-fan-'+j+'-'+side+'-'+k,{length:.051+.008*(k%2),width:.024+.003*(j%2),bend:hand*side*(.22-.12*k),curl:.012+.002*k,cup:.0055,phase:j*.63+k*.84,petal:false},hand*xx,Y(yy),.057,hand>0?a:-a);leaves++;
  }
 }
 const blossoms=[{x:.020,y:-.43,r:.108,v:0},{x:-.018,y:-1.14,r:.102,v:2},{x:.022,y:-1.89,r:.111,v:1},{x:-.014,y:-2.61,r:.103,v:3}];
 for(const [j,f]of blossoms.entries()){
  addRib283(b,'flower-root-'+length+'-'+hand+'-'+j,[[hand*.085,Y(f.y+.13),.060],[hand*f.x,Y(f.y+.07),.068],[hand*f.x,Y(f.y),.075]],.011,.007);
  petals+=blossom283(b,'panel-'+j,hand*f.x,Y(f.y),.070,f.r,f.v);flowers++;ribs++;
 }
 // Smaller unequal blossoms bridge the main peonies and side leaf network.
 for(const [j,[x,y,r]]of [[0,[-.123,-.76,.055]],[1,[.129,-1.51,.050]],[2,[-.127,-2.24,.054]],[3,[.103,-2.93,.044]]]){addRib283(b,'minor-flower-bearing-'+length+'-'+hand+'-'+j,[[hand*Math.sign(x)*.225,Y(y+.06),.056],[hand*x,Y(y+.025),.062],[hand*x,Y(y),.066]],.007,.005);ribs++;petals+=blossom283(b,'minor-'+j,hand*x,Y(y),.064,r,j+4);flowers++;}
 b.root.userData.pendants283??={revision:'pendants283-r04-interlaced-furled-filigree',panels:[],headers:[],photographicAcceptance:false};
 b.root.userData.pendants283.panels.push({length,widthField:.46,hand,primaryContinuousRibs:2,returnedRibs:ribs-2,leaves,flowers,petals,throughOpenwork:true,perforatedBackingPlate:false,filigreeVolutes:web.volutes,continuousCrossLinks:web.links,smallFannedLeaves:web.leaves,webMaterial:'existing oldgold on closed individually furled and chased strips',frontAndBackClosed:true,rearDepth:zRear,frontFlowerRoot:.070,noReferenceImageRuntime:true,hiddenDepthInferred:true});
}

function headerOutline283(){
 const q=new T.Shape();q.moveTo(-.55,.32);q.lineTo(.55,.32);q.lineTo(.55,.02);q.bezierCurveTo(.55,-.13,.39,-.18,.34,-.08);q.bezierCurveTo(.22,-.29,.10,-.29,0,-.16);q.bezierCurveTo(-.10,-.29,-.22,-.29,-.34,-.08);q.bezierCurveTo(-.39,-.18,-.55,-.13,-.55,.02);q.closePath();return q;
}
function teardropHole283(cx,cy,w,h,angle=0){
 const p=new T.Path(),pts=[];for(let k=0;k<32;k++){const a=k/32*TAU,r=.82+.18*Math.cos(a);const x=w*.5*Math.cos(a)*r,y=h*.5*Math.sin(a);pts.push(new T.Vector2(cx+x*Math.cos(angle)-y*Math.sin(angle),cy+x*Math.sin(angle)+y*Math.cos(angle)));}
 if(T.ShapeUtils.isClockWise(pts))pts.reverse();p.moveTo(pts[0].x,pts[0].y);for(const v of pts.slice(1))p.lineTo(v.x,v.y);p.closePath();return p;
}

export function buildPendantHeader283(b,{cx,hand=1}={}){
 const shape=headerOutline283();
 const holes=[[-.445,.180,.055,.090,-.55],[-.337,.246,.072,.042,.10],[-.085,.235,.074,.048,-.20],[.095,.235,.070,.047,.20],[.365,.238,.066,.045,-.08],[.455,.163,.045,.095,.48],[-.390,.031,.054,.081,.40],[-.150,-.062,.072,.085,-.44],[.135,-.065,.075,.088,.32],[.385,.025,.055,.074,-.38],[.004,.104,.062,.099,.04]];
 for(const [x,y,w,h,a]of holes)shape.holes.push(teardropHole283(x,y,w*.68,h*.68,a));
 const plate=b.geometry('283-header-closed-pierced-plate',()=>{
  const g=new T.ExtrudeGeometry(shape,{depth:.026,bevelEnabled:true,bevelSize:.0018,bevelThickness:.0015,bevelSegments:3,curveSegments:28});g.computeVertexNormals();return finish283(g,'short-plaque-complete-perforated-return');
 });b.add(plate,'oldgold',cx,.02,.01);
 // Keep the old top bar and declared support line exactly. Fine filigree
 // covers the field in connected overlapping leaves, not three badges.
 b.box(cx,.343,.055,1.13,.022,.030,'gold');
 const root=(route,key,w=.009,d=.006,mat='gold')=>addRib283(b,'header-'+key+'-'+hand,route.map(([x,y,z=.038])=>[cx+hand*x,y,z]),w,d,mat);
 root([[-.505,.24],[-.36,.21],[-.19,.24],[0,.16],[.20,.235],[.38,.20],[.50,.25]],'main',.013,.008);
 root([[-.49,.075],[-.33,-.015],[-.17,.035],[0,-.075],[.17,.035],[.33,-.015],[.49,.075]],'lower',.010,.0065);
 for(const [j,[x,y,rx,ry]]of [[0,[-.40,.12,.097,.103]],[1,[-.17,.13,.113,.123]],[2,[.12,.12,.110,.129]],[3,[.39,.13,.10,.11]]]){const route=curlRoute283(x,y,rx,ry,j%2?-1:1,.044,1.24);root(route,'curl-'+j,.007,.0055);bearingPin283(b,'curl-'+j,cx+hand*route[0][0],route[0][1],.030,.046,.0045);}
 for(let k=0;k<15;k++){
  const x=-.48+k*.067,y=.10+.093*Math.sin(k*.85),a=(k%2?1:-1)*(.65+.15*Math.sin(k*1.7));
  bearingPin283(b,'leaf-'+k,cx+hand*x,y,.030,.045,.0036);
  addBlade283(b,'header-leaf-'+k,{length:.084+.014*(k%3),width:.032+.007*(k%2),bend:hand*.14*Math.sin(k*1.2),curl:.009,cup:.0045,phase:k*.73,petal:false},cx+hand*x,y,.042,hand>0?a:-a);
 }
 let petals=0;for(const [j,f]of [[0,{x:-.265,y:.145,r:.112,v:2}],[1,{x:.235,y:.132,r:.105,v:1}],[2,{x:-.020,y:.237,r:.051,v:4}],[3,{x:.465,y:.080,r:.046,v:3}]]){bearingPin283(b,'flower-'+j,cx+hand*f.x,f.y,.030,.051,.012);petals+=blossom283(b,'header-flower-'+j,cx+hand*f.x,f.y,.046,f.r,f.v);}
 const rim=[[-.51,.20],[-.51,.02],[-.44,-.10],[-.35,-.04],[-.24,-.19],[-.13,-.205],[0,-.13],[.13,-.205],[.24,-.19],[.35,-.04],[.44,-.10],[.51,.02],[.51,.20]];root(rim,'r02-scalloped-inner-return',.0065,.0045);
 let lowerLeaves=0;
 for(const [j,[x,y,rx,ry]]of [[0,[-.365,-.012,.090,.080]],[1,[-.135,-.085,.102,.094]],[2,[.135,-.085,.102,.094]],[3,[.365,-.012,.090,.080]]]){
  const path=curlRoute283(x,y,rx,ry,j%2?-1:1,.041,1.28);root(path,'r02-lower-scroll-'+j,.0068,.0045);bearingPin283(b,'lower-scroll-'+j,cx+hand*path[0][0],path[0][1],.030,.044,.004);
  for(let k=0;k<6;k++){
   const xx=x+(k-2.5)*.023,yy=y+.035*Math.sin(k*.9+j),angle=(k%2?1:-1)*(.45+k*.14);
   bearingPin283(b,'lower-leaf-'+j+'-'+k,cx+hand*xx,yy,.030,.045,.003);
   addBlade283(b,'r02-header-lower-'+j+'-'+k,{length:.040+.011*(k%3),width:.020+.004*(k%2),bend:hand*.18*Math.sin(j+k),curl:.010,cup:.0045,phase:j*.7+k*.9,petal:false},cx+hand*xx,yy,.042,hand>0?angle:-angle);lowerLeaves++;
  }
 }
 for(const [j,x]of [[0,-.18],[1,.18]]){bearingPin283(b,'r02-low-flower-'+j,cx+hand*x,-.095,.030,.051,.009);petals+=blossom283(b,'r02-low-flower-'+j,cx+hand*x,-.095,.046,.041,j+5);}
 // Closed miniature relief fills the remaining plain plaque fields. Its
 // connected curls sit below the larger flowers and have real rear pins.
 let microCurls=0,microLeaves=0;
 for(let row=0;row<4;row++)for(let col=0;col<6;col++){
  if(row===3&&(col===0||col===5))continue;
  const x=-.455+col*.182+.007*Math.sin(row*1.6+col),y=.267-row*.125+.006*Math.sin(col*1.7+row),rx=.027+.004*Math.sin(col+row)**2,ry=.029+.005*Math.cos(row*.8+col)**2;
  const path=curlRoute283(x,y,rx,ry,(col+row)%2?-1:1,.040,1.34);root(path,'r03-micro-scroll-'+row+'-'+col,.0045,.0035);bearingPin283(b,'r03-micro-curl-'+row+'-'+col,cx+hand*path[0][0],path[0][1],.030,.043,.0025);microCurls++;
  for(let k=0;k<3;k++){
   const xx=x+(k-1)*.019,yy=y+.014*Math.sin(k*1.5+col),a=(k%2?1:-1)*(.60+.3*k)+.13*Math.sin(row+col);
   bearingPin283(b,'r03-micro-leaf-'+row+'-'+col+'-'+k,cx+hand*xx,yy,.030,.044,.0023);
   addBlade283(b,'r03-micro-leaf-'+row+'-'+col+'-'+k,{length:.028+.006*(k%2),width:.011+.003*(row%2),bend:hand*.12*Math.sin(col+k),curl:.006,cup:.0035,phase:row*.57+col*.81+k,petal:false},cx+hand*xx,yy,.041,hand>0?a:-a);microLeaves++;
  }
 }
 // A second, shallower connected tracery level occupies the remaining plate
 // between the flowers. Every curl and fan has a real rear bearing pin.
 let underCurls=0,underLeaves=0;
 for(let row=0;row<6;row++)for(let col=0;col<11;col++){
  const x=-.480+col*.096+.005*Math.sin(row*1.3+col*.8),y=.270-row*.078+.004*Math.sin(col*1.7+row);
  if(row===5&&Math.abs(x)>.315)continue;
  const path=curlRoute283(x,y,.028+.006*Math.sin(row+col)**2,.025+.005*Math.cos(row*.7+col)**2,(row+col)%2?-1:1,.040,1.23+.18*Math.sin(row*.6+col)**2);
  b.add(b.geometry('283-r04-header-tracery-'+hand+'-'+row+'-'+col,()=>rib283(path.map(([x,y,z])=>[cx+hand*x,y,z]),.0068,.0038,true)),'gold');bearingPin283(b,'r04-header-curl-'+row+'-'+col,cx+hand*path[0][0],path[0][1],.030,.043,.0025);underCurls++;
  const q=path[4];
  for(let k=0;k<2;k++){
   const xx=q[0]+(k-.5)*.014,yy=q[1],a=(k?-.45:.54)+.18*Math.sin(row+col);
   bearingPin283(b,'r04-header-fan-'+row+'-'+col+'-'+k,cx+hand*xx,yy,.030,.044,.0025);
   addBlade283(b,'r04-header-fan-'+row+'-'+col+'-'+k,{length:.030+.007*(col%2),width:.015+.003*(row%2),bend:hand*.17*Math.sin(row+k),curl:.007,cup:.0038,phase:row*.93+col*.61+k,petal:false},cx+hand*xx,yy,.041,hand>0?a:-a);underLeaves++;
  }
 }
 b.root.userData.pendants283??={revision:'pendants283-r04-interlaced-furled-filigree',panels:[],headers:[],photographicAcceptance:false};
 b.root.userData.pendants283.headers.push({centerX:cx,hand,outerProfileHeld:true,throughHoles:holes.length,closedPlateDepth:.026,flowers:6,petals,primaryRibs:3,scrollReturns:8+microCurls+underCurls,leafCount:15+lowerLeaves+microLeaves+underLeaves,supportTopY:.343,noReferenceImageRuntime:true,hiddenDepthInferred:true});
}
