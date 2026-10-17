import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Independent reference-6 reconstruction, 2026-10-17. NOT a deformation of 687a.
// Three separately built seated figures. +Z is front; Y=0 is the seat.
// Altar owns lotus seats / mandorlas. Keep their placement separate from anatomy.
const TAU=Math.PI*2, clamp=T.MathUtils.clamp, smooth=T.MathUtils.smoothstep;
const gaussian=(x,s)=>Math.exp(-((x/s)**2)), cache=new Map();
function computeAngleWeightedNormals(g) {
  const p=g.attributes.position,ix=g.index,values=new Float64Array(p.count*3),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3(),normal=new T.Vector3();
  for(let i=0;i<ix.count;i+=3){
    const ids=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)],ps=[a.fromBufferAttribute(p,ids[0]),b.fromBufferAttribute(p,ids[1]),c.fromBufferAttribute(p,ids[2])];
    normal.subVectors(b,a).cross(ac.subVectors(c,a));const length=normal.length();if(length<1e-15)continue;normal.divideScalar(length);
    for(let j=0;j<3;j++){
      ab.subVectors(ps[(j+1)%3],ps[j]);ac.subVectors(ps[(j+2)%3],ps[j]);
      const angle=Math.acos(clamp(ab.dot(ac)/(ab.length()*ac.length()),-1,1)),id=ids[j]*3;
      values[id]+=normal.x*angle;values[id+1]+=normal.y*angle;values[id+2]+=normal.z*angle;
    }
  }
  for(let i=0;i<p.count;i++){const k=i*3,l=Math.hypot(values[k],values[k+1],values[k+2]);if(l>0){values[k]/=l;values[k+1]/=l;values[k+2]/=l;}}
  g.setAttribute('normal',new T.Float32BufferAttribute(values,3));
}
function recomputeSculptureNormals(g) {
  if(g.userData.sculptureAngleNormals)computeAngleWeightedNormals(g);else g.computeVertexNormals();
  let grid=g.userData.sculptureGrid;
  if(!grid&&g.type==='SphereGeometry')grid={nu:g.parameters.widthSegments,nv:g.parameters.heightSegments,poles:true};
  if(!grid&&g.type==='TubeGeometry')grid={nu:g.parameters.radialSegments,nv:g.parameters.tubularSegments,poles:false};
  if(!grid)return g;
  const {nu,nv,poles}=grid,n=g.attributes.normal,p=g.attributes.position;
  const aNormal=new T.Vector3(),bNormal=new T.Vector3(),aPoint=new T.Vector3(),bPoint=new T.Vector3();
  for(let j=0;j<=nv;j++){
    const a=j*(nu+1),b=a+nu;
    // A partial sphere is not necessarily closed around U. Only weld an
    // actual duplicate position, never two different profile boundaries.
    aPoint.fromBufferAttribute(p,a);bPoint.fromBufferAttribute(p,b);
    if(aPoint.distanceToSquared(bPoint)>1e-12)continue;
    aNormal.fromBufferAttribute(n,a);bNormal.fromBufferAttribute(n,b);aNormal.add(bNormal).normalize();
    n.setXYZ(a,aNormal.x,aNormal.y,aNormal.z);n.setXYZ(b,aNormal.x,aNormal.y,aNormal.z);
  }
  if(poles)for(const j of[0,nv]){
    const start=j*(nu+1);aPoint.fromBufferAttribute(p,start);let collapsed=true;
    for(let i=1;i<=nu;i++)if(aPoint.distanceToSquared(bPoint.fromBufferAttribute(p,start+i))>1e-12){collapsed=false;break;}
    if(!collapsed)continue;
    aNormal.set(0,0,0);for(let i=0;i<nu;i++)aNormal.add(bNormal.fromBufferAttribute(n,start+i));aNormal.normalize();
    for(let i=0;i<=nu;i++)n.setXYZ(start+i,aNormal.x,aNormal.y,aNormal.z);
  }
  return g;
}

function surface(nu, nv, fn, closedU = false) {
  const positions = [], uv = [], ids = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const p = fn(i / nu, j / nv); positions.push(...p); uv.push(i / nu, j / nv);
  }
  const distinct=(q,r)=>{let d=0;for(let k=0;k<3;k++)d+=(positions[q*3+k]-positions[r*3+k])**2;return d>1e-20;};
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + nu + 1;
    // A true collapsed pole closes rounded fingertips and knee ends. Do not
    // retain its zero-area companion triangle from the rectangular grid.
    if(distinct(a,a+1))ids.push(a,a+1,b);
    if(distinct(b,b+1))ids.push(a+1,b+1,b);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(ids);
  if(closedU)g.userData.sculptureGrid={nu,nv,poles:true};
  recomputeSculptureNormals(g);
  return g;
}
function sampleProfile(rows, y) {
  let k = 0; while (k < rows.length - 2 && y > rows[k + 1][0]) k++;
  const a = rows[k], b = rows[k + 1], p = rows[Math.max(0,k-1)], q = rows[Math.min(rows.length-1,k+2)];
  const t = clamp((y-a[0])/(b[0]-a[0]),0,1), h=b[0]-a[0];
  return a.slice(1).map((v,i)=>{const n=i+1, m0=(b[n]-p[n])/(b[0]-p[0]), m1=(q[n]-a[n])/(q[0]-a[0]);return (2*t*t*t-3*t*t+1)*v+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*b[n]+(t*t*t-t*t)*h*m1;});
}

function ellipsoid(x,y,z,rx,ry,rz,rzTurn=0,nu=48,nv=40){
  const g=new T.SphereGeometry(1,nu,nv);g.scale(rx,ry,rz);if(rzTurn)g.rotateZ(rzTurn);g.translate(x,y,z);return g;
}
function loft(rows,{nu=96,nv=140,relief=null}={}){
  const lo=rows[0][0],hi=rows.at(-1)[0];
  return surface(nu,nv,(u,v)=>{
    const y=lo+(hi-lo)*v,a=u*TAU,[rx0,rz0,cz]=sampleProfile(rows,y),rx=Math.max(0,rx0),rz=Math.max(0,rz0);
    const x=Math.sin(a)*rx,front=Math.max(0,Math.cos(a));
    if(v===0||v===1)return[0,y,cz];
    return[x,y,cz+Math.cos(a)*rz+(relief?relief(x,y)*front**3:0)];
  },true);
}
function curve(points){return new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal',.5);}
// A closed, round-ended cast volume, not an open cloth tube. Interpolated
// parallel transport frames prevent arbitrary radial seams at elbows/digits.
function sweep(points,rx,rz,{segments=72,radial=32,profile=t=>1,relief=null}={}){
  const c=curve(points),frames=c.computeFrenetFrames(segments,false),length=c.getLength();
  const centers=Array.from({length:segments+1},(_,i)=>c.getPointAt(i/segments));
  const g=surface(radial,segments,(u,t)=>{
    const k=Math.min(segments-1,Math.floor(t*segments)),f=t*segments-k,a=u*TAU;
    const tangent=c.getTangentAt(t),n=frames.normals[k].clone().lerp(frames.normals[k+1],f);
    n.addScaledVector(tangent,-n.dot(tangent)).normalize();const b=new T.Vector3().crossVectors(tangent,n).normalize();
    const cap=t===0||t===1?0:Math.sqrt(Math.max(0,1-((t<.065?(.065-t)/.065:t>.935?(t-.935)/.065:0)**2)));
    const s=profile(t)*cap,w=relief?relief(t,a)*cap:0,p=c.getPointAt(t);
    const offset=n.clone().multiplyScalar(Math.cos(a)*(rx*s+w)).addScaledVector(b,Math.sin(a)*(rz*s+w*.7));
    // Keep the entire new closed volume, but compress the inside of a bent
    // cloth/digit section before its radius can invert through the centerline.
    const t0=Math.max(0,t-.002),t1=Math.min(1,t+.002),kv=c.getTangentAt(t1).sub(c.getTangentAt(t0)).divideScalar((t1-t0)*length),curvature=kv.length();
    if(curvature>1e-8){kv.divideScalar(curvature);const inward=offset.dot(kv);if(inward>0){const allowed=inward/Math.pow(1+(inward*curvature/.56)**8,1/8);offset.addScaledVector(kv,allowed-inward);}}
    const radius=offset.length();if(radius>0){const dir=offset.clone().divideScalar(radius);let reach=Infinity;
      for(let j=0;j<=segments;j++)if(Math.abs(j-t*segments)>5){const delta=centers[j].clone().sub(p),toward=delta.dot(dir);if(toward>1e-10)reach=Math.min(reach,delta.lengthSq()/(2*toward));}
      const cap=.80*reach;if(radius>cap*.65){const limited=cap-(cap*.35)*Math.exp(-(radius-cap*.65)/(cap*.35));offset.multiplyScalar(limited/radius);}
    }
    return p.add(offset).toArray();
  },true);g.userData.sculptureAngleNormals=true;recomputeSculptureNormals(g);return g;
}
function cord(ps,r=.012){return sweep(ps,r,r,{segments:Math.max(24,ps.length*6),radial:10});}
function finger(ps,r=.026){return sweep(ps,r,r*.88,{segments:42,radial:18,profile:t=>1-.23*t});}
function frontOf(rows,x,y){const[rx,rz,cz]=sampleProfile(rows,y);return cz+rz*Math.sqrt(Math.max(.005,1-(x/rx)**2));}
function reliefArcs(x,y,arcs){let f=0;for(const a of arcs){
  const[cx,base,width,lift,amp=.022,thickness=.040]=a,q=(x-cx)/width;
  if(Math.abs(q)>1.15)continue;const gate=1-smooth(Math.abs(q),.88,1.15),level=base+lift*q*q;
  f+=gate*(amp*gaussian(y-level,thickness)-amp*.25*gaussian(y-level+.056,thickness*.70));
}return f;}
function makeBuilder(variant){
  const bins={buddha:[],oldgold:[],gold:[]},names=[];
  return {add(g,tag,material='buddha'){g.name=`reference6-rebuilt-${variant}:${tag}`;g.userData={...g.userData,sculpturePart:tag};bins[material].push(g);names.push({tag,material});return g;},
    finish(){const out=[];for(const[material,gs]of Object.entries(bins)){if(!gs.length)continue;
      const g=mergeGeometries(gs,false);g.name=`reference6-rebuilt-${variant}-${material}`;g.computeBoundingBox();g.computeBoundingSphere();
      g.userData={reconstruction:'reference6-blockout-v1',variant,parts:gs.map(p=>p.name)};out.push({geometry:g,material});gs.forEach(g=>g.dispose());
    }return out;}};
}

// Both faces are newly modeled closed lofts. These are anatomical planes, not
// the old flat-front sphere deformation. Brows, nose wings and lips are part
// of the same continuous skin, not colored wires in front of it.
function face(center,attendant=false,variant='central'){
  const sy=attendant?.84:1,wx=attendant?.86:1,cy=center;
  const rows=[[-.455,0,0,-.020],[-.410,.125,.105,-.005],[-.340,.235,.195,0],[-.235,.300,.242,0],[-.095,.342,.260,-.004],[.045,.352,.257,-.010],[.190,.342,.245,-.018],[.320,.300,.212,-.025],[.415,.205,.151,-.028],[.455,0,0,-.025]].map(p=>[cy+p[0]*sy,p[1]*wx,p[2],p[3]]);
  const relief=(x,y)=>{
    const xx=x/wx,yy=(y-cy)/sy,G=(cx,cy,sx,sy)=>gaussian(xx-cx,sx)*gaussian(yy-cy,sy);
    let f=.016*G(-.22,-.13,.12,.16)+.016*G(.22,-.13,.12,.16);
    f+=.052*G(0,.025,.046,.17)+.079*G(0,-.105,.060,.050);
    f+=.022*G(-.058,-.126,.033,.027)+.022*G(.058,-.126,.033,.027);
    f-=.012*G(-.044,-.145,.015,.011)+.012*G(.044,-.145,.015,.011);
    f+=.012*G(0,-.145,.019,.022)-.009*G(0,-.185,.022,.028);
    for(const side of[-1,1]){
      const ex=xx*side,q=(ex-.164)/.105,mask=smooth(ex,.055,.085)*(1-smooth(ex,.265,.292));
      const eye=.071+.021*Math.max(0,1-q*q),brow=.159+.033*Math.max(0,1-q*q);
      f-=.014*G(side*.165,.105,.112,.054);
      f+=mask*(.018*gaussian(yy-brow,.023)+.013*gaussian(yy-eye-.012,.015)-.012*gaussian(yy-eye,.007)+.006*gaussian(yy-eye+.018,.014));
    }
    const mouth=-.258+.008*(xx/.11)**2,ml=gaussian(xx,.108);
    if(attendant){f-=.021*gaussian(xx,.058)*gaussian(yy-mouth,.025);f+=.012*ml*gaussian(yy-mouth-.029,.012)+.014*ml*gaussian(yy-mouth+.031,.015);}
    else {f+=.011*(gaussian(xx-.030,.035)+gaussian(xx+.030,.035))*gaussian(yy-mouth-.011,.012)+.016*gaussian(xx,.088)*gaussian(yy-mouth+.015,.015)-.009*ml*gaussian(yy-mouth,.006);}
    f+=.022*G(0,-.355,.14,.065);return f;
  };
  const g=loft(rows,{nu:144,nv:200,relief});
  // Independent slight bodily attitude, not a perfectly mirrored second face.
  if(variant==='left')g.translate(0,-cy,0).rotateZ(.018).rotateY(.035).translate(0,cy,0);
  if(variant==='right')g.translate(0,-cy,0).rotateZ(-.012).rotateY(-.025).translate(0,cy,0);
  return g;
}
function ears(b,cy,small=false){
  const s=small?.85:1;
  for(const side of[-1,1]){
    const g=loft([[cy-.37*s,0,0,0],[cy-.34*s,.042,.042,.008],[cy-.23*s,.058,.060,-.004],[cy+.01*s,.052,.067,-.008],[cy+.23*s,.040,.051,-.020],[cy+.28*s,0,0,-.020]],{nu:40,nv:68,relief:(x,y)=>-.031*gaussian(y-cy,.145)});
    g.translate(side*(small?.335:.394),0,0);b.add(g,`ear-${side}`);
  }
}
function neck(b,cy,small=false){const w=small?.185:.225;
  b.add(ellipsoid(0,cy,0,w,.245,.205),'neck');
  for(let j=0;j<3;j++){const ps=[];for(let k=0;k<=32;k++){const a=-1.28+k/32*2.56;ps.push([Math.sin(a)*w,cy-.07+j*.056,.012+Math.cos(a)*.202]);}b.add(cord(ps,.008),`neck-fold-${j}`);}
}
function raisedHand(b,cx,cy,cz,{size=1,mirror=1}={}){
  const point=p=>[cx+mirror*p[0]*size,cy+p[1]*size,cz+p[2]*size];
  b.add(ellipsoid(cx,cy,cz,.108*size,.172*size,.061*size,-mirror*.08),'raised-palm');
  const fingers=[
    [[-.075,.095,0],[-.100,.255,.010],[-.103,.330,.002]],
    [[-.029,.126,0],[-.035,.310,.013],[-.026,.401,.003]],
    [[.022,.128,0],[.031,.307,.008],[.045,.385,-.001]],
    [[.062,.097,.004],[.119,.215,.028],[.142,.183,.057],[.118,.139,.060]],
    [[.069,-.084,.005],[.145,.014,.047],[.118,.139,.060]]
  ];
  fingers.forEach((p,i)=>b.add(finger(p.map(point),(i===4?.030:.024)*size),`raised-digit-${i}`));
  return point;
}
function cupHand(b,cx,cy,cz,{mirror=1,size=1}={}){
  b.add(ellipsoid(cx,cy,cz,.132*size,.072*size,.105*size),'cup-palm');
  for(let i=0;i<4;i++){const x=(i-1.5)*.048;const ps=[[x,-.012,.024],[x+.010,.062,.080],[x+.006,.105,.071]].map(p=>[cx+mirror*p[0]*size,cy+p[1]*size,cz+p[2]*size]);b.add(finger(ps,.021*size),`cup-digit-${i}`);}
  b.add(finger([[cx-mirror*.105*size,cy-.035*size,cz],[cx-mirror*.163*size,cy+.014*size,cz+.045*size],[cx-mirror*.120*size,cy+.075*size,cz+.084*size]],.025*size),'cup-thumb');
}
function leaf(x,y,z,w,h,depth,tilt=0){
  const g=new T.SphereGeometry(1,28,30),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const t=(p.getY(i)+1)/2;
    p.setXYZ(i,p.getX(i)*w*(.72+.28*Math.sin(Math.PI*t)),h*t,p.getZ(i)*depth);}
  recomputeSculptureNormals(g);g.rotateZ(tilt).translate(x,y,z);return g;
}
function crown(b,cy,{central=false,variant='central'}={}){
  if(central){
    const rows=[[3.17,0,0,-.028],[3.20,.29,.223,-.028],[3.31,.385,.286,-.03],[3.45,.372,.278,-.03],[3.59,.307,.236,-.03],[3.70,.170,.142,-.03],[3.7765,0,0,-.03]];
    b.add(loft(rows,{nu:80,nv:72}),'rounded-curl-cap','oldgold');
    for(let row=0;row<10;row++){
      const y=3.25+row*.047,[rx,rz,cz]=sampleProfile(rows,y),n=Math.max(10,Math.round(TAU*rx/.068));
      for(let k=0;k<n;k++){const a=k/n*TAU+(row%2)*Math.PI/n;b.add(ellipsoid(Math.sin(a)*rx,y,cz+Math.cos(a)*rz,.026,.031,.024,0,12,10),`hair-curl-${row}-${k}`,'oldgold');}
    }
    const ps=[];for(let k=0;k<=60;k++){const a=-1.55+k/60*3.10;ps.push([Math.sin(a)*.347,3.176,-.025+Math.cos(a)*.247]);}b.add(cord(ps,.013),'low-diadem-band','gold');
    for(let i=0;i<15;i++){const a=(i-7)*.196,h=.075+.082*gaussian(i-7,1.7),x=Math.sin(a)*.345,z=-.025+Math.cos(a)*.250;b.add(leaf(x,3.176,z,.018,h,.012,-a*.15),`diadem-leaf-${i}`,'gold');}
    b.add(leaf(0,3.62,.185,.021,.10,.014),'cap-front-tip','gold');
  }else{
    const rows=[[3.30,0,0,-.025],[3.34,.260,.218,-.025],[3.45,.258,.215,-.025],[3.57,.190,.168,-.030],[3.67,0,0,-.03]];
    b.add(loft(rows,{nu:64,nv:56}),'recessed-crown-cap','oldgold');
    const ps=[];for(let k=0;k<=50;k++){const a=-1.5+k/50*3;ps.push([Math.sin(a)*.291,3.34,-.02+Math.cos(a)*.238]);}b.add(cord(ps,.019),'crown-solid-rim','gold');
    for(let i=0;i<7;i++){
      const a=(i-3)*.385,x=Math.sin(a)*.285,z=-.020+Math.cos(a)*.232,h=.27+.3659*gaussian(i-3,1.15);
      b.add(leaf(x,3.34,z,.058,h,.026,-a*.19),`crown-petal-${i}`,'gold');
      b.add(leaf(x,3.365,z+.025,.027,h*.67,.014,-a*.19),`crown-petal-heart-${i}`,'gold');
    }
    for(let i=0;i<11;i++){const a=(i-5)*.27;b.add(ellipsoid(Math.sin(a)*.290,3.36,-.018+Math.cos(a)*.246,.014,.016,.013),`crown-rim-bead-${i}`,'gold');}
  }
}

const MAIN_BODY=[
 [0,0,0,.10],[.035,.40,.30,.10],[.27,.53,.36,.08],[.53,.57,.38,.025],[.83,.59,.39,.005],
 [1.15,.61,.405,-.01],[1.49,.65,.405,-.025],[1.82,.69,.380,-.040],[2.08,.665,.335,-.050],
 [2.23,.53,.285,-.050],[2.36,.295,.222,-.040],[2.52,.206,.174,-.030],[2.60,0,0,-.025]
];
const MAIN_FOLDS=[[-.12,.69,.55,.24,.026,.048],[-.10,.85,.56,.27,.027,.045],[-.08,1.01,.55,.30,.024,.042],[-.08,1.17,.53,.31,.022,.040],[-.07,1.33,.49,.30,.020,.040],[-.04,1.48,.43,.28,.018,.038],[-.015,1.62,.38,.26,.016,.036]];
function mainRelief(x,y){
  let f=reliefArcs(x,y,MAIN_FOLDS),edge=.40-.10*(2.15-y);
  f+=.029*gaussian(x-edge,.041)*smooth(y,.5,.75)*(1-smooth(y,2.14,2.28));
  f+=.020*gaussian(x+.36,.042)*smooth(y,.75,1.1)*(1-smooth(y,2.08,2.25));return f;
}
function centralFigure(){
 const b=makeBuilder('central');
 b.add(loft(MAIN_BODY,{nu:128,nv:170,relief:mainRelief}),'full-seated-torso');
 neck(b,2.39);b.add(face(2.815),'full-oval-face');ears(b,2.815);crown(b,2.815,{central:true});
 // Broad shoulders curve into thick outer sleeves. The lower front sleeve
 // fans rise toward the wrist instead of leaving exposed cylindrical arms.
 const arms=[
  [[-.41,2.20,-.015],[-.68,2.05,.015],[-.86,1.71,.080],[-.92,1.27,.16],[-.81,1.13,.29],[-.61,1.32,.43],[-.47,1.50,.55]],
  [[.41,2.20,-.015],[.69,2.04,.005],[.88,1.68,.060],[.97,1.23,.18],[.90,.99,.34],[.70,.76,.49],[.47,.64,.68]]
 ];
 arms.forEach((ps,i)=>b.add(sweep(ps,.245,.211,{segments:112,radial:48,profile:t=>.78+.33*Math.sin(Math.PI*t)-.15*smooth(t,.85,1),relief:(t,a)=>{
   let r=.005*Math.cos(a*5+t*3);for(let k=0;k<5;k++)r+=.016*gaussian(t-(.54+k*.067+.12*Math.cos(a)),.027)*Math.max(0,Math.sin(a+.5))**2;return r*Math.sin(Math.PI*t);
 }}),`broad-sleeve-${i}`));
 // Outer robe rolls are thick folded cloth attached all along the sleeves,
 // never independent open hoops framing an empty armhole.
 for(const side of[-1,1])b.add(sweep([[side*.46,2.25,-.085],[side*.80,2.04,-.045],[side*1.06,1.62,.015],[side*1.12,1.15,.12],[side*1.04,.80,.30]],.095,.075,{segments:80,radial:24,profile:t=>.8+.2*Math.sin(Math.PI*t)}),`outer-robe-roll-${side}`);
 // Two broad, low folded thighs support the crossed bare feet. Rounded
 // knees carry diagonal soft cloth relief, not three separate torus bands.
 for(const side of[-1,1]){
   const g=ellipsoid(side*.67,.286,.59,.66,.286,.352),p=g.attributes.position;
   for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k),z=p.getZ(k),local=Math.abs(x);
     if(z>.59){let f=0;for(let j=0;j<3;j++)f+=(.022-j*.003)*gaussian(y-(.33-j*.09+.18*(local-.60)**2),.031);p.setZ(k,z+f*smooth(z,.59,.75));}
   }recomputeSculptureNormals(g);b.add(g,`broad-crossed-knee-${side}`);
   b.add(sweep([[side*.07,.50,.36],[side*.35,.60,.54],[side*.70,.63,.51],[side*.97,.62,.49]],.090,.067,{segments:62,radial:28,profile:t=>.72+.25*Math.sin(Math.PI*t)}),`crossed-foot-${side}`);
   for(let i=0;i<5;i++)b.add(finger([[side*.89,.626,.435+i*.031],[side*(1.025-.009*i),.632,.44+i*.031],[side*(1.063-.016*i),.62,.444+i*.031]],.020-i*.0011),`crossed-toe-${side}-${i}`);
 }
 // Visible central cloth drapes over the lap, broad at its root and ending
 // in a small curved hem. Back and side return are a single closed volume.
 const cloth=loft([[-.10,0,0,1.00],[-.075,.13,.036,1.015],[.06,.24,.046,1.015],[.28,.245,.060,.96],[.51,.26,.068,.84],[.70,.23,.080,.48],[.78,0,0,.36]],{nu:72,nv:80,relief:(x,y)=>.013*Math.cos(x*31+y*3)*smooth(y,-.08,.04)*(1-smooth(y,.66,.78))});
 b.add(cloth,'folded-lap-cloth');
 // Raise the mudra to the breast / upper sleeve, not the abdomen.
 raisedHand(b,-.43,1.62,.58,{size:1});
 b.add(sweep([[-.57,1.39,.46],[-.48,1.48,.55],[-.43,1.55,.58]],.083,.069,{segments:44,radial:24}),'raised-wrist');
 b.add(sweep([[.58,.71,.61],[.39,.62,.78],[.20,.57,.89],[.06,.56,.93]],.075,.067,{segments:62,radial:28}),'lap-forearm');
 b.add(ellipsoid(-.055,.555,.946,.217,.055,.105,-.065),'open-lap-palm');
 for(let i=0;i<4;i++)b.add(finger([[-.10,.56,.877+i*.043],[-.26,.565,.888+i*.043],[-.33+.013*i,.551,.896+i*.040]],.020),`lap-digit-${i}`);
 b.add(finger([[.105,.565,.889],[.033,.615,.871],[-.060,.613,.903]],.025),'lap-thumb');
 // Shallow lotus brooch and two actual cloth borders, seated in the new
 // torso. Source does not claim the finer photographic motifs are resolved.
 const front=(x,y)=>frontOf(MAIN_BODY,x,y)+mainRelief(x,y);
 for(const side of[-1,1]){
   const ps=[];for(let k=0;k<=54;k++){const t=k/54,y=.64+1.60*t,x=side*(.42-.17*t*t);ps.push([x,y,front(x,y)+.008]);}b.add(cord(ps,.016),`garment-border-${side}`);
 }
 for(let i=0;i<7;i++){const a=i/7*TAU,x=.045+Math.sin(a)*.077,y=1.70+Math.cos(a)*.09;b.add(leaf(x,y-.04,front(x,y)+.003,.025,.083,.010,-a),`chest-lotus-petal-${i}`,'gold');}
 b.add(ellipsoid(.045,1.70,front(.045,1.70)+.013,.035,.041,.013),'chest-lotus-heart','gold');
 return b.finish();
}

const SIDE_BODY=[
 [0,0,0,.10],[.03,.24,.22,.10],[.31,.35,.29,.08],[.65,.42,.32,.045],[.97,.45,.34,.015],
 [1.28,.44,.33,0],[1.60,.465,.325,-.015],[1.92,.515,.315,-.025],[2.19,.555,.29,-.035],
 [2.39,.46,.25,-.040],[2.52,.245,.19,-.030],[2.71,.177,.15,-.025],[2.78,0,0,-.020]
];
function sideRelief(x,y){return reliefArcs(x,y,[[0,1.12,.43,.28,.018,.050],[.02,1.30,.40,.30,.017,.045],[.03,1.48,.38,.30,.015,.040]])+.018*gaussian(x+.19-.08*(y-1),.045)*smooth(y,.4,.8)*(1-smooth(y,2.2,2.4));}
function attendantFigure(variant){
 const b=makeBuilder(variant),side=variant==='left'?1:-1;
 const add=(g,tag,m='buddha')=>{if(side<0){g.scale(-1,1,1);const ix=g.index;for(let i=0;i<ix.count;i+=3){const q=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,q);}}return b.add(g,tag,m);};
 b.add(loft(SIDE_BODY,{nu:112,nv:160,relief:sideRelief}),'continuous-attendant-torso');
 neck(b,2.66,true);b.add(face(3.055,true,variant),'attendant-oval-face');ears(b,3.055,true);crown(b,3.055,{variant});
 const ps0=[[-.35,2.40,-.02],[-.58,2.22,.00],[-.67,1.91,.055],[-.68,1.55,.16],[-.56,1.36,.30],[-.36,1.53,.47],[-.29,1.67,.53]];
 const ps1=[[.35,2.40,-.02],[.59,2.21,.00],[.69,1.88,.05],[.75,1.51,.17],[.75,1.32,.33],[.77,1.45,.48]];
 for(const[which,ps]of[ps0,ps1].entries())add(sweep(ps,.193,.172,{segments:96,radial:40,profile:t=>.78+.32*Math.sin(Math.PI*t),relief:(t,a)=>.013*Math.cos(a*5+t*5)*Math.sin(Math.PI*t)**2}),`thick-sleeve-${which}`);
 // Hand geometry remains independent on each attendant, with a slight
 // difference of wrist height and head attitude, rather than duplicating main.
 raisedHand({add:(g,t,m)=>add(g,t,m)},-.285,1.74+(variant==='right'?.025:0),.55,{size:.86});
 cupHand({add:(g,t,m)=>add(g,t,m)},.77,1.49,.53,{size:.90});
 add(sweep([[-.33,1.56,.46],[-.29,1.67,.53]],.067,.060,{segments:28,radial:20}),'raised-bare-wrist');
 add(sweep([[.74,1.34,.37],[.77,1.45,.50]],.065,.061,{segments:28,radial:20}),'cup-bare-wrist');
 // Compact bent knees join the pelvis; broad cloth faces continue down to
 // the seat instead of two long narrow tubular legs around a hollow center.
 for(let leg=0;leg<2;leg++){
   const s=leg===0?-1:1,kx=s*(leg===0?.48:.61),ky=leg===0?1.07:.96;
   add(ellipsoid(kx,ky,.46,.28,.35,.275,s*.18),`rounded-raised-knee-${leg}`);
   const ps=[[s*.19,1.12,.10],[s*.38,1.16,.30],[kx,ky,.48],[kx+s*.025,.66,.62],[kx+s*.012,.28,.70],[kx,.13,.73]];
   add(sweep(ps,.225,.196,{segments:96,radial:42,profile:t=>.93-.18*t,relief:(t,a)=>.016*Math.cos(a*5+t*4)*Math.sin(Math.PI*t)}),`covered-bent-leg-${leg}`);
   const footx=kx+.06;
   add(ellipsoid(footx,.083,.78,.18,.080,.115,-.10),`resting-foot-${leg}`);
   for(let i=0;i<5;i++)add(finger([[footx+.07,.082,.70+i*.033],[footx+.17-i*.009,.078,.713+i*.031]],.018-i*.0011),`attendant-toe-${leg}-${i}`);
 }
 add(loft([[.04,0,0,.57],[.08,.17,.065,.58],[.30,.24,.086,.56],[.62,.29,.093,.52],[.91,.36,.110,.43],[1.20,.35,.110,.35],[1.37,0,0,.30]],{nu:72,nv:100,relief:(x,y)=>.024*Math.cos(x*23+y*3)*smooth(y,.08,.30)*(1-smooth(y,1.1,1.36))}),'continuous-front-robe');
 const front=(x,y)=>frontOf(SIDE_BODY,x,y)+sideRelief(x,y);
 for(let j=0;j<2;j++){
   const ps=[];for(let k=0;k<=48;k++){const x=(k/24-1)*.38,y=1.99+j*.16+.35*(x/.38)**2;ps.push([x,y,front(x,y)+.008]);}b.add(cord(ps,.014),`draped-neckline-${j}`,'gold');
 }
 b.add(ellipsoid(0,1.98,front(0,1.98)+.010,.046,.066,.016),'necklace-pendant','gold');
 return b.finish();
}

export const RESTORED_BUDDHA_METRICS=Object.freeze({
 reference:6,reconstruction:'independent-reference6-blockout-v1',frontAxis:'+Z',seatContact:0,
 decorativeMinY:-.10,headCenter:2.815,crownTop:3.7765,raisedHandTop:2.021,kneeWidth:2.66,bodyDepth:1.50,
 variants:{central:{seatContact:0,decorativeMinY:-.10,crownTop:3.7765,headCenter:2.815,kneeWidth:2.66},left:{seatContact:0,crownTop:3.9759,headCenter:3.055},right:{seatContact:0,crownTop:3.9759,headCenter:3.055}},
 referenceFit:{central:{x:0,y:3,z:0,scale:2.1/3.26},attendantScale:1.45/3.26,scaleConvention:'retain external unit conversion; do not normalize by crownTop'},
 materials:{buddha:{color:'#cfaa5d',metalness:.94,roughness:.29},oldgold:{color:'#927036',metalness:.91,roughness:.37},gold:{color:'#d1ab58',metalness:.95,roughness:.27}}
});
export function restoredBuddhaParts(variant='central'){
 if(!['central','left','right'].includes(variant))throw new RangeError('Unknown reference6 figure variant');
 if(!cache.has(variant))cache.set(variant,variant==='central'?centralFigure():attendantFigure(variant));return cache.get(variant);
}
export function emitRestoredBuddha(instance,{x=0,y=0,z=0,scale=1,widthScale=1,depthScale=1,variant='central'}={}){
 for(const p of restoredBuddhaParts(variant))instance(p.geometry,p.material,x,y,z,scale*widthScale,scale,scale*depthScale);
}
export function createRestoredBuddha({materials={},x=0,y=0,z=0,scale=1,widthScale=1,depthScale=1,variant='central'}={}){
 const defaults={buddha:new T.MeshStandardMaterial({name:'buddha',color:'#cfaa5d',metalness:.94,roughness:.29}),oldgold:new T.MeshStandardMaterial({name:'oldgold',color:'#927036',metalness:.91,roughness:.37}),gold:new T.MeshStandardMaterial({name:'gold',color:'#d1ab58',metalness:.95,roughness:.27})};
 const group=new T.Group();group.name='reference6-rebuilt-buddha';group.position.set(x,y,z);group.scale.set(scale*widthScale,scale,scale*depthScale);
 for(const p of restoredBuddhaParts(variant)){const mesh=new T.Mesh(p.geometry,materials[p.material]||defaults[p.material]);mesh.castShadow=mesh.receiveShadow=true;mesh.name=p.geometry.name;group.add(mesh);}return group;
}
